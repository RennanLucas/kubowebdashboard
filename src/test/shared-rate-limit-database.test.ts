// @vitest-environment node
import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import { beforeAll, afterAll, describe, expect, it } from "vitest";
const db = new PGlite();
const HASH = "a".repeat(64);
const consume = (scope:string,hash=HASH,limit=3,window=3600) => db.query<{ allowed:boolean; remaining:number }>(
  "SELECT * FROM consume_request_limit($1,$2,$3,$4)",[scope,hash,limit,window],
);
beforeAll(async () => {
  await db.exec("CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS; CREATE SCHEMA kubo_limits_private;");
  await db.exec(readFileSync("supabase/migrations/20260914140000_shared_request_limits.sql","utf8"));
},60000);
afterAll(async () => { await db.close(); });
describe("PostgreSQL shared request buckets", () => {
  it("allows exactly the limit and blocks every further request", async () => {
    const results = await Promise.all(Array.from({ length:20 },() => consume("get-dashboard-overview")));
    expect(results.filter(result => result.rows[0].allowed)).toHaveLength(3);
    expect(results[19].rows[0].remaining).toBe(0);
    const count = await db.query("SELECT requests FROM kubo_limits_private.request_limits WHERE scope='get-dashboard-overview'");
    expect(count.rows).toEqual([{ requests:4 }]);
  });
  it("isolates endpoint scopes and distinct identities", async () => {
    expect((await consume("get-dashboard-overview","b".repeat(64))).rows[0].allowed).toBe(true);
    expect((await consume("get-dashboard-sources")).rows[0].allowed).toBe(true);
  });
  it.each([
    ["invalid scope",HASH,3,60], ["ok","raw-user-id",3,60],
    ["ok",HASH,0,60], ["ok",HASH,10001,60], ["ok",HASH,3,0], ["ok",HASH,3,3601],
  ])("rejects invalid arguments (%#)", async (scope,hash,limit,window) => {
    await expect(consume(String(scope),String(hash),Number(limit),Number(window))).rejects.toThrow("INVALID_RATE_LIMIT_ARGUMENTS");
  });
  it("reopens a new bucket without counting a prior window", async () => {
    await db.exec(`INSERT INTO kubo_limits_private.request_limits VALUES ('new-window','${HASH}',now()-interval '2 hours',now()-interval '1 hour',999)`);
    expect((await consume("new-window")).rows[0]).toMatchObject({ allowed:true,remaining:2 });
  });
  it("removes old buckets with bounded cleanup", async () => {
    await db.exec(`INSERT INTO kubo_limits_private.request_limits SELECT 'old-bucket',lpad(n::text,64,'0'),now()-interval '3 days',now()-interval '2 days',1 FROM generate_series(1,120) n`);
    await consume("cleanup");
    expect((await db.query("SELECT count(*)::int AS count FROM kubo_limits_private.request_limits WHERE scope='old-bucket'")).rows).toEqual([{ count:20 }]);
  });
  it("denies direct browser RPC execution and counter manipulation", async () => {
    for (const role of ["anon","authenticated"]) {
      await db.exec(`SET ROLE ${role}`);
      try {
        await expect(consume("browser-bypass")).rejects.toThrow("permission denied");
        await expect(db.exec("DELETE FROM kubo_limits_private.request_limits")).rejects.toThrow("permission denied");
      } finally { await db.exec("RESET ROLE"); }
    }
  });
  it("allows the server-only role to consume the shared bucket", async () => {
    await db.exec("SET ROLE service_role");
    try { expect((await consume("server-role")).rows[0].allowed).toBe(true); }
    finally { await db.exec("RESET ROLE"); }
  });
});
