// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";

// Real PostgreSQL engine, exclusively in memory: no production credentials.
const db = new PGlite();
const migration = (name: string) => readFileSync("supabase/migrations/" + name, "utf8");
const A = "00000000-0000-4000-8000-000000000001";
const B = "00000000-0000-4000-8000-000000000002";
beforeAll(async () => {
  await db.exec(`
    SET TIME ZONE 'UTC';
    CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;
    CREATE SCHEMA auth;
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS
      $$ SELECT nullif(current_setting('app.test_user', true),'')::uuid $$;
    CREATE TABLE auth.users(id uuid PRIMARY KEY, email text, email_confirmed_at timestamptz);
    CREATE TABLE clients(id uuid PRIMARY KEY,user_id uuid);
    CREATE TABLE projects(id uuid PRIMARY KEY,client_id uuid,organization_id uuid);
    CREATE TABLE pageviews(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),project_id uuid,
      session_id text,created_at timestamptz,referrer text,user_agent text,
      page_path text,country text,city text,utm_source text,utm_medium text);
    CREATE TABLE events(id uuid PRIMARY KEY DEFAULT gen_random_uuid(), project_id uuid,
      session_id text,created_at timestamptz,event_type text);
    CREATE TABLE organization_invites(id uuid PRIMARY KEY, organization_id uuid,email text,
      role text,token_hash text,status text,expires_at timestamptz);
    CREATE TABLE organization_members(organization_id uuid,user_id uuid,role text,
      UNIQUE(organization_id,user_id));
    INSERT INTO projects(id) VALUES ('${A}'),('${B}');
  `);
  await db.exec(migration("20260815000000_analytics_rollups.sql"));
  const gemini = migration("20260912000000_audit_360_p1_fixes.sql");
  await db.exec(gemini.slice(0, gemini.indexOf("-- 2. Refatoração")));
  const invites = migration("20260901000000_audit_hardening_definer_and_invites.sql");
  const accept = invites.slice(invites.indexOf("CREATE OR REPLACE FUNCTION public.accept_invite"),
    invites.indexOf("-- create_organization é chamada"));
  await db.exec(accept);
  await db.exec(migration("20260912190000_accept_invite_token.sql"));
  await db.exec(migration("20260912191000_reconcile_daily_analytics.sql"));
}, 60000);
afterAll(async () => { await db.close(); });

describe("daily reconciliation", () => {
  it("counts one session across batches, updates duration and never adds a retry twice", async () => {
    await db.exec(`
      INSERT INTO pageviews(project_id,session_id,created_at,user_agent,page_path,utm_medium)
      VALUES ('${A}','same',date_trunc('day',now())-interval '1 day' + interval '1 hour','Chrome/130','/','cpc');
      SELECT aggregate_analytics_jit('${A}');
      UPDATE aggregation_status SET last_aggregated_at=now()-interval '2 minutes' WHERE project_id='${A}';
      INSERT INTO pageviews(project_id,session_id,created_at,user_agent,page_path)
      VALUES ('${A}','same',date_trunc('day',now())-interval '1 day' + interval '1 hour 1 minute','Chrome/130','/contact');
      SELECT aggregate_analytics_jit('${A}');
    `);
    let rows = (await db.query("SELECT visitors,views,sessions,bounces,total_duration,source FROM analytics_daily_overview WHERE project_id=$1", [A])).rows;
    expect(rows).toEqual([{ visitors: 1, views: 2, sessions: 1, bounces: 0, total_duration: 60, source: "Pago" }]);
    await db.exec(`UPDATE aggregation_status SET last_aggregated_at=now()-interval '2 minutes'; SELECT aggregate_analytics_jit('${A}');`);
    rows = (await db.query("SELECT sum(views)::int AS views FROM analytics_daily_overview WHERE project_id=$1", [A])).rows;
    expect(rows).toEqual([{ views: 2 }]);
  });
  it("does not attribute an event using the same session id in another project", async () => {
    await db.exec(`
      INSERT INTO pageviews(project_id,session_id,created_at,user_agent,referrer)
        VALUES ('${B}','same',date_trunc('day',now())-interval '1 day' + interval '2 hours','iPad Safari/17','https://www.google.com/');
      INSERT INTO events(project_id,session_id,created_at,event_type)
        VALUES ('${B}','same',date_trunc('day',now())-interval '1 day' + interval '2 hours 1 minute','form_submit');
      SELECT aggregate_analytics_jit('${B}');
    `);
    expect((await db.query("SELECT source,device,count FROM analytics_daily_events WHERE project_id=$1", [B])).rows)
      .toEqual([{ source: "Google", device: "Tablet", count: 1 }]);
  });
  it("recognizes Android tablets and iPad/iOS", async () => {
    expect((await db.query("SELECT parse_device('Android 14 Chrome/130') AS device, parse_os('iPad Mac OS Safari') AS os")).rows)
      .toEqual([{ device: "Tablet", os: "iOS" }]);
  });
  it("classifies real domains without accepting lookalikes", async () => {
    expect((await db.query("SELECT classify_source('https://www.google.com.br/search') AS search, classify_source('https://facebook.evil.example') AS fake")).rows)
      .toEqual([{ search: "Google", fake: "facebook.evil.example" }]);
  });
});

describe("invitation token", () => {
  it("rejects the wrong recipient and accepts exactly once for the confirmed recipient", async () => {
    await db.exec(`
      INSERT INTO auth.users VALUES ('${A}','a@example.test',now()),('${B}','b@example.test',now());
      INSERT INTO organization_invites VALUES ('${A}','${A}','a@example.test','viewer',
        encode(sha256(convert_to(repeat('a',64),'UTF8')),'hex'),'pending',now()+interval '1 day');
      SELECT set_config('app.test_user','${B}',false);
    `);
    await expect(db.query("SELECT accept_invite_token($1)", ["a".repeat(64)])).rejects.toThrow("Invite not found");
    await db.exec(`SELECT set_config('app.test_user','${A}',false)`);
    expect((await db.query("SELECT accept_invite_token($1) AS org", ["a".repeat(64)])).rows).toEqual([{ org: A }]);
    await expect(db.query("SELECT accept_invite_token($1)", ["a".repeat(64)])).rejects.toThrow("Invite not found");
    expect((await db.query("SELECT count(*)::int AS count FROM organization_members")).rows).toEqual([{ count: 1 }]);
  });
});
