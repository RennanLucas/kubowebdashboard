import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

// An isolated PostgreSQL engine. Install PGlite outside the application and pass
// its dist/index.js path; no production data or credentials are used here.
const { PGlite } = await import(pathToFileURL(process.env.PGLITE_MODULE).href);
const db = new PGlite();
const a = '11111111-1111-4111-8111-111111111111';
const b = '22222222-2222-4222-8222-222222222222';
const item = '33333333-3333-4333-8333-333333333333';
const hidden = '44444444-4444-4444-8444-444444444444';
const empty = '55555555-5555-4555-8555-555555555555';
await db.exec(`
  CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;
  CREATE SCHEMA auth;
  CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS
    $$ SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  GRANT USAGE ON SCHEMA auth TO authenticated;
  CREATE TABLE public.roadmap_items (id uuid PRIMARY KEY, public boolean);
  CREATE TABLE public.roadmap_votes (roadmap_item_id uuid REFERENCES public.roadmap_items(id), user_id uuid);
  CREATE TABLE public.aggregation_status (project_id uuid PRIMARY KEY, last_aggregated_at timestamptz);
  ALTER TABLE public.roadmap_items ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.roadmap_votes ENABLE ROW LEVEL SECURITY;
  CREATE POLICY visible_items ON public.roadmap_items FOR SELECT USING (public);
  CREATE POLICY own_votes ON public.roadmap_votes FOR SELECT USING (user_id=auth.uid());
  GRANT SELECT ON public.roadmap_items,public.roadmap_votes TO authenticated;
  GRANT ALL ON public.aggregation_status TO anon,authenticated,service_role;
  CREATE VIEW public.roadmap_item_votes AS SELECT roadmap_item_id,count(*) AS vote_count
    FROM public.roadmap_votes GROUP BY roadmap_item_id;
  GRANT SELECT ON public.roadmap_item_votes TO authenticated;
  CREATE FUNCTION public.aggregate_analytics_jit(uuid) RETURNS void LANGUAGE sql SECURITY DEFINER AS
    $$ INSERT INTO public.aggregation_status VALUES ($1,now())
       ON CONFLICT(project_id) DO UPDATE SET last_aggregated_at=now() $$;
  INSERT INTO public.roadmap_items VALUES ('${item}',true),('${hidden}',false),('${empty}',true);
  INSERT INTO public.roadmap_votes VALUES ('${item}','${a}'),('${item}','${b}'),('${hidden}','${b}');
`);
const migration = await readFile(new URL('../supabase/migrations/20260909060000_secure_roadmap_and_aggregation.sql', import.meta.url), 'utf8');
await db.exec(migration);
await db.exec(migration); // Reapplying must not lose data or fail.
let checks = 0;
const equal = (actual, expected) => { assert.deepEqual(actual, expected); checks++; };
const denied = async (sql) => {
  await assert.rejects(db.query(sql), error => error.code === '42501'); checks++;
};
for (const role of ['anon', 'authenticated']) {
  await db.exec(`SET ROLE ${role}`);
  await denied('SELECT * FROM public.aggregation_status');
  await denied(`INSERT INTO public.aggregation_status VALUES ('${item}',now())`);
  await denied('UPDATE public.aggregation_status SET last_aggregated_at=now()');
  await denied('DELETE FROM public.aggregation_status');
  await denied(`SELECT public.aggregate_analytics_jit('${item}')`);
  await db.exec('RESET ROLE');
}
await db.exec('SET ROLE anon');
await denied('SELECT * FROM public.roadmap_item_votes');
await denied(`SELECT kubo_roadmap_private.public_vote_count('${item}')`);
await db.exec('RESET ROLE; SET ROLE authenticated');
for (const user of [a,b]) {
  await db.query("SELECT set_config('request.jwt.claim.sub',$1,false)",[user]);
  const totals = await db.query('SELECT * FROM public.roadmap_item_votes ORDER BY roadmap_item_id');
  equal(totals.rows.map(row=>[row.roadmap_item_id,Number(row.vote_count)]), [[item,2],[empty,0]]);
  const raw = await db.query('SELECT user_id FROM public.roadmap_votes');
  equal(raw.rows.every(row=>row.user_id===user),true);
  const hiddenCount = await db.query(`SELECT kubo_roadmap_private.public_vote_count('${hidden}') AS n`);
  equal(Number(hiddenCount.rows[0].n),0);
  const embed = await db.query(`SELECT votes.vote_count FROM public.roadmap_items items
    CROSS JOIN LATERAL public.roadmap_item_votes(items) votes WHERE items.id='${item}'`);
  equal(Number(embed.rows[0].vote_count),2);
}
await db.exec("SELECT set_config('request.jwt.claim.sub','',false)");
equal(Number((await db.query(`SELECT kubo_roadmap_private.public_vote_count('${item}') AS n`)).rows[0].n),0);
await db.exec('RESET ROLE; SET ROLE service_role');
await db.query(`SELECT public.aggregate_analytics_jit('${item}')`);
equal((await db.query('SELECT * FROM public.aggregation_status')).rows.length,1);
await db.query('UPDATE public.aggregation_status SET last_aggregated_at=now()');
await db.query('DELETE FROM public.aggregation_status');
equal((await db.query('SELECT * FROM public.aggregation_status')).rows.length,0);
await db.exec('RESET ROLE');
equal((await db.query("SELECT relrowsecurity FROM pg_class WHERE oid='public.aggregation_status'::regclass")).rows[0].relrowsecurity,true);
equal((await db.query("SELECT reloptions FROM pg_class WHERE oid='public.roadmap_item_votes'::regclass")).rows[0].reloptions.includes('security_invoker=true'),true);
await db.close();
console.log(`${checks} PostgreSQL permission checks passed; migration is repeatable.`);
