// @vitest-environment node
import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { beforeAll, beforeEach, afterAll, describe, expect, it } from "vitest";
import { limitsForTier } from "../../supabase/functions/_shared/plans";
const db = new PGlite();
const USER = "00000000-0000-4000-8000-000000000001";
const OTHER = "00000000-0000-4000-8000-000000000002";
const ORG = "00000000-0000-4000-8000-000000000003";
const ORG2 = "00000000-0000-4000-8000-000000000004";
const PROJECT = "00000000-0000-4000-8000-000000000005";
const PROJECT2 = "00000000-0000-4000-8000-000000000006";
interface LedgerResult { state:string|null; started:boolean; used:number; limit:number; remaining:number; latest:{ id:string; content:string }|null }
const command = async (action:string,request:string|null=null,actor=USER,project=PROJECT,content:string|null=null,days=7) =>
  (await db.query<{ result:LedgerResult }>(
    "SELECT manage_ai_generation($1,$2,$3,$4,$5,'gemini-3.8-flash',$6,NULL) AS result",
    [actor,project,action,request,days,content],
  )).rows[0].result;
beforeAll(async () => {
  await db.exec(`
    CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;
    CREATE SCHEMA auth;
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$ SELECT nullif(current_setting('app.test_user',true),'')::uuid $$;
    CREATE TABLE user_roles(user_id uuid,role text);
    CREATE TABLE clients(id uuid,user_id uuid);
    CREATE TABLE projects(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),client_id uuid,organization_id uuid);
    CREATE TABLE organization_members(organization_id uuid,user_id uuid,role text);
    CREATE TABLE subscriptions(user_id uuid,organization_id uuid,status text,current_period_end timestamptz,created_at timestamptz DEFAULT now());
    CREATE TABLE pageviews(project_id uuid,created_at timestamptz);
    CREATE TABLE events(project_id uuid,created_at timestamptz);
    CREATE TABLE website_metrics(project_id uuid,date date);
    CREATE TABLE ai_insights(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),project_id uuid,user_id uuid,content text NOT NULL,period_days integer,model text,created_at timestamptz DEFAULT now());
    INSERT INTO projects VALUES ('${PROJECT}',NULL,'${ORG}'),('${PROJECT2}',NULL,'${ORG2}');
    INSERT INTO organization_members VALUES ('${ORG}','${USER}','owner'),('${ORG}','${OTHER}','editor');
    ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;
  `);
  await db.exec(readFileSync("supabase/migrations/20260815000000_analytics_rollups.sql","utf8"));
  await db.exec(readFileSync("supabase/migrations/20260914003000_enforce_plan_limits.sql","utf8"));
  await db.exec(readFileSync("supabase/migrations/20260914143000_atomic_ai_quota.sql","utf8"));
  await db.exec(readFileSync("supabase/migrations/20260921143100_pro_ai_monthly_limit.sql","utf8"));
},60000);
beforeEach(async () => {
  await db.exec(`RESET ROLE; TRUNCATE kubo_limits_private.ai_generations,ai_insights,subscriptions,analytics_daily_overview,analytics_daily_events;
    UPDATE organization_members SET role=CASE WHEN user_id='${USER}' THEN 'owner' ELSE 'editor' END;
    INSERT INTO subscriptions VALUES ('${USER}','${ORG}','active',now()+interval '1 day',now());`);
});
afterAll(async () => { await db.close(); });
describe("paid AI cost ledger", () => {
  it("reserves only the Pro monthly quota shared across organization members", async () => {
    const count = limitsForTier("pro").aiMonthlyLimit;
    for (let i=0;i<count;i++) expect((await command("reserve",randomUUID(),i%2 ? OTHER : USER)).used).toBe(i+1);
    await expect(command("reserve",randomUUID(),OTHER)).rejects.toThrow("AI_LIMIT_REACHED");
    expect((await command("status")).remaining).toBe(0);
  });
  it("enforces quota under simultaneous submissions (local PostgreSQL queue)", async () => {
    const result = await Promise.allSettled(Array.from({ length:18 },() => command("reserve",randomUUID())));
    expect(result.filter(item => item.status==="fulfilled")).toHaveLength(limitsForTier("pro").aiMonthlyLimit);
  });
  it("blocks Free and viewer spending without creating a reservation", async () => {
    await db.exec("TRUNCATE subscriptions");
    expect((await command("status")).limit).toBe(0);
    await expect(command("reserve",randomUUID())).rejects.toThrow("PLAN_REQUIRED");
    await db.exec(`INSERT INTO subscriptions VALUES ('${USER}','${ORG}','active',now()+interval '1 day',now()); UPDATE organization_members SET role='viewer' WHERE user_id='${USER}';`);
    await expect(command("reserve",randomUUID())).rejects.toThrow("AI_WRITE_DENIED");
    expect((await command("status")).used).toBe(0);
  });
  it("rejects a foreign project or request identifier reused by another actor/period", async () => {
    const id = randomUUID();
    await command("reserve",id);
    await expect(command("status",null,USER,PROJECT2)).rejects.toThrow("AI_ACCESS_DENIED");
    await expect(command("reserve",id,OTHER)).rejects.toThrow("AI_REQUEST_ID_CONFLICT");
    await expect(command("reserve",id,USER,PROJECT,null,30)).rejects.toThrow("AI_REQUEST_ID_CONFLICT");
  });
  it("reserves and starts the same request exactly once", async () => {
    const id = randomUUID();
    expect((await command("reserve",id)).used).toBe(1);
    expect((await command("reserve",id)).used).toBe(1);
    expect((await command("start",id)).started).toBe(true);
    expect((await command("start",id)).started).toBe(false);
  });
  it("persists the insight atomically and never duplicates it on completion/retry", async () => {
    const id = randomUUID();
    await command("reserve",id); await command("start",id);
    const first = await command("complete",id,USER,PROJECT,"Real report");
    const duplicate = await command("complete",id,USER,PROJECT,"Do not replace");
    expect(first.latest).toEqual(duplicate.latest);
    expect(first.state).toBe("succeeded");
    expect((await db.query("SELECT count(*)::int AS count FROM ai_insights")).rows).toEqual([{ count:1 }]);
    await db.exec("DELETE FROM ai_insights");
    expect((await command("reserve",id)).used).toBe(1);
    expect((await command("reserve",id)).latest).toBeNull();
  });
  it("releases only never-started reservations; provider uncertainty keeps cost protected", async () => {
    const id = randomUUID(); await command("reserve",id);
    expect((await command("fail",id)).used).toBe(0);
    const charged = randomUUID(); await command("reserve",charged); await command("start",charged);
    expect((await command("fail",charged)).state).toBe("uncertain");
    expect((await command("status",charged)).used).toBe(1);
    expect((await command("start",charged)).started).toBe(false);
  });
  it("expires an unstarted reservation without allowing a delayed worker to start it", async () => {
    const id = randomUUID(); await command("reserve",id);
    await db.exec(`UPDATE kubo_limits_private.ai_generations SET created_at=now()-interval '3 minutes' WHERE request_id='${id}'`);
    const result = await command("start",id);
    expect(result.state).toBe("failed"); expect(result.started).toBe(false); expect(result.used).toBe(0);
  });
  it("does not expire a started generation or restore quota on report deletion", async () => {
    const id = randomUUID(); await command("reserve",id); await command("start",id);
    await db.exec(`UPDATE kubo_limits_private.ai_generations SET created_at=now()-interval '1 day' WHERE request_id='${id}'`);
    expect((await command("status",id)).state).toBe("started");
    expect((await command("status",id)).used).toBe(1);
  });
  it("leaves the ledger started when content persistence fails", async () => {
    const id = randomUUID(); await command("reserve",id); await command("start",id);
    await expect(command("complete",id,USER,PROJECT," ")).rejects.toThrow("INVALID_AI_CONTENT");
    expect((await command("status",id)).state).toBe("started");
    expect((await command("status",id)).used).toBe(1);
  });
  it("denies direct browser access to lifecycle commands and prompt aggregates", async () => {
    for (const role of ["anon","authenticated"]) {
      await db.exec(`SET ROLE ${role}`);
      try {
        await expect(command("reserve",randomUUID())).rejects.toThrow("permission denied");
        await expect(db.query("SELECT ai_project_summary($1,$2,7)",[USER,PROJECT])).rejects.toThrow("permission denied");
        await expect(db.exec("DELETE FROM kubo_limits_private.ai_generations")).rejects.toThrow("permission denied");
      } finally { await db.exec("RESET ROLE"); }
    }
  });
  it("builds complete project-scoped aggregates without row-cap truncation or raw identifiers", async () => {
    await db.exec(`INSERT INTO analytics_daily_overview(project_id,date,source,device,visitors,views,sessions)
      SELECT '${PROJECT}',(now() AT TIME ZONE 'UTC')::date,'source-'||n,'desktop',1,2,1 FROM generate_series(1,1200) n;
      INSERT INTO analytics_daily_overview(project_id,date,source,device,visitors,views,sessions)
      VALUES ('${PROJECT2}',(now() AT TIME ZONE 'UTC')::date,'foreign','desktop',9999,9999,9999);
      INSERT INTO analytics_daily_events(project_id,date,source,device,event_type,count)
      VALUES ('${PROJECT}',(now() AT TIME ZONE 'UTC')::date,'direct','desktop','whatsapp_click',3);`);
    const summary = (await db.query<{ result:{ current:{ views:number; visitor_days:number }; sources:unknown[]; period:{ days:number }; events:unknown[] } }>(
      "SELECT ai_project_summary($1,$2,7) AS result",[USER,PROJECT],
    )).rows[0].result;
    expect(summary.current).toMatchObject({ views:2400,visitor_days:1200 });
    expect(summary.sources).toEqual([{ source:"Outras fontes",views:2400 }]);
    expect(summary.period.days).toBe(7);
    expect(summary.events).toEqual([{ event_type:"whatsapp_click",total:3 }]);
    expect(JSON.stringify(summary)).not.toContain("foreign");
    expect(JSON.stringify(summary)).not.toContain(USER);
  });
});
