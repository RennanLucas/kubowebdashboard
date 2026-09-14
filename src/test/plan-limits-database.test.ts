// @vitest-environment node
import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import { beforeAll, afterAll, describe, expect, it } from "vitest";
const db = new PGlite();
const USER = "00000000-0000-4000-8000-000000000001";
const OTHER = "00000000-0000-4000-8000-000000000002";
const ORG = "00000000-0000-4000-8000-000000000003";
const ORG2 = "00000000-0000-4000-8000-000000000004";
const PROJECT = "00000000-0000-4000-8000-000000000005";
const PROJECT2 = "00000000-0000-4000-8000-000000000006";
beforeAll(async () => {
  await db.exec(`
    CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;
    CREATE SCHEMA auth;
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS
      $$ SELECT nullif(current_setting('app.test_user',true),'')::uuid $$;
    CREATE TABLE user_roles(user_id uuid,role text);
    CREATE TABLE clients(id uuid,user_id uuid);
    CREATE TABLE projects(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),client_id uuid,organization_id uuid);
    CREATE TABLE organization_members(organization_id uuid,user_id uuid,role text);
    CREATE TABLE subscriptions(user_id uuid,organization_id uuid,status text,current_period_end timestamptz,created_at timestamptz DEFAULT now());
    CREATE TABLE pageviews(project_id uuid,created_at timestamptz);
    CREATE TABLE events(project_id uuid,created_at timestamptz);
    CREATE TABLE website_metrics(project_id uuid,date date);
    CREATE TABLE ai_insights(id uuid DEFAULT gen_random_uuid(),project_id uuid,user_id uuid,content text);
    INSERT INTO projects VALUES ('${PROJECT}',NULL,'${ORG}'),('${PROJECT2}',NULL,'${ORG2}');
    INSERT INTO organization_members VALUES ('${ORG}','${USER}','owner'),('${ORG2}','${OTHER}','owner');
    INSERT INTO pageviews VALUES ('${PROJECT}',now()-interval '1 day'),('${PROJECT}',now()-interval '30 days'),('${PROJECT2}',now()-interval '1 day');
    GRANT USAGE ON SCHEMA public,auth TO authenticated;
    GRANT EXECUTE ON FUNCTION auth.uid() TO authenticated;
    GRANT SELECT,INSERT,UPDATE,DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
    ALTER TABLE pageviews ENABLE ROW LEVEL SECURITY;
    -- Deliberately broad existing policy: restrictive limits must still work.
    CREATE POLICY permissive_existing ON pageviews FOR SELECT TO authenticated USING (true);
    CREATE POLICY permissive_existing ON ai_insights FOR ALL TO authenticated USING (true) WITH CHECK (true);
    ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;
  `);
  await db.exec(readFileSync("supabase/migrations/20260815000000_analytics_rollups.sql","utf8"));
  await db.exec(readFileSync("supabase/migrations/20260914003000_enforce_plan_limits.sql","utf8"));
},60000);
afterAll(async () => { await db.close(); });
const asUser = async (user=USER) => {
  await db.exec(`RESET ROLE; SELECT set_config('app.test_user','${user}',false); SET ROLE authenticated;`);
};
describe("server plan limits", () => {
  it("hides old Free data and another tenant even with a permissive policy", async () => {
    await asUser();
    expect((await db.query("SELECT count(*)::int AS count FROM pageviews")).rows).toEqual([{ count:1 }]);
    expect((await db.query("SELECT project_history_start($1) AS cutoff",[PROJECT2])).rows).toEqual([{ cutoff:null }]);
  });
  it("rejects a second Free project and moving a project into a full Free organization", async () => {
    await asUser();
    await expect(db.exec(`INSERT INTO projects(organization_id) VALUES ('${ORG}')`)).rejects.toThrow("PROJECT_LIMIT_EXCEEDED");
    await expect(db.exec(`UPDATE projects SET organization_id='${ORG}' WHERE id='${PROJECT2}'`)).rejects.toThrow("PROJECT_LIMIT_EXCEEDED");
  });
  it("does not allow an unrelated organization subscription to unlock history", async () => {
    await db.exec(`RESET ROLE; INSERT INTO subscriptions VALUES ('${USER}','${ORG2}','active',now()+interval '1 day',now());`);
    await asUser();
    expect((await db.query("SELECT count(*)::int AS count FROM pageviews")).rows).toEqual([{ count:1 }]);
  });
  it("allows a paid organization extended history and multiple projects", async () => {
    await db.exec(`RESET ROLE; INSERT INTO subscriptions VALUES ('${USER}','${ORG}','active',now()+interval '1 day',now());`);
    await asUser();
    expect((await db.query("SELECT count(*)::int AS count FROM pageviews")).rows).toEqual([{ count:2 }]);
    await db.exec(`INSERT INTO projects(organization_id) VALUES ('${ORG}')`);
  });
  it("blocks a viewer's project writes and foreign insight authorship", async () => {
    await db.exec(`RESET ROLE; UPDATE organization_members SET role='viewer' WHERE user_id='${USER}';`);
    await asUser();
    await expect(db.exec(`INSERT INTO projects(organization_id) VALUES ('${ORG}')`)).rejects.toThrow("Acesso negado");
    await expect(db.exec(`INSERT INTO ai_insights(project_id,user_id) VALUES ('${PROJECT}','${OTHER}')`)).rejects.toThrow("row-level security");
  });
});
