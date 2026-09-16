// @vitest-environment node
import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import migration from "../../supabase/migrations/20260914150000_atomic_mp_events.sql?raw";

const db = new PGlite();
const USER = "11111111-1111-1111-1111-111111111111";
const OTHER_USER = "22222222-2222-2222-2222-222222222222";
const ORG = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";

function payload(overrides: Record<string, unknown> = {}) {
  return {
    user_id: USER,
    organization_id: ORG,
    provider: "mercadopago",
    external_id: "preapproval_1",
    plan_id: "kuboweb_pro_monthly",
    status: "active",
    amount: 49.9,
    current_period_start: "2026-09-14T00:00:00Z",
    current_period_end: "2026-10-14T00:00:00Z",
    last_event_ts: "2026-09-14T00:00:00Z",
    environment: "sandbox",
    ...overrides,
  };
}

async function apply(value: Record<string, unknown>) {
  return db.query<{ applied: boolean }>(
    "SELECT public.apply_mp_subscription_event($1::jsonb) AS applied",
    [JSON.stringify(value)],
  );
}

beforeAll(async () => {
  await db.exec(`
    CREATE ROLE anon;
    CREATE ROLE authenticated;
    CREATE ROLE service_role BYPASSRLS;
    CREATE SCHEMA auth;
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT NULL::uuid $$;
    CREATE TABLE auth.users(id uuid PRIMARY KEY);
    CREATE TABLE public.organization_invites(
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL,
      email text NOT NULL, status text NOT NULL DEFAULT 'pending', created_at timestamptz DEFAULT now()
    );
    CREATE TABLE public.subscriptions (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL,
      organization_id uuid, provider text NOT NULL DEFAULT 'mercadopago', external_id text,
      plan_id text, status text NOT NULL DEFAULT 'pending', amount numeric, payer_email text,
      current_period_start timestamptz, current_period_end timestamptz, trial_end timestamptz,
      last_event_ts timestamptz, environment text NOT NULL DEFAULT 'sandbox',
      stripe_subscription_id text UNIQUE, stripe_customer_id text, product_id text, price_id text,
      cancel_at_period_end boolean DEFAULT false, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
    );
    ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
    REVOKE ALL ON public.subscriptions FROM PUBLIC,anon,authenticated;
    GRANT ALL ON public.subscriptions TO service_role;
    INSERT INTO public.subscriptions(user_id,status,current_period_end,environment)
      VALUES ('11111111-1111-1111-1111-111111111111','trialing','2026-10-01','production');
  `);
  await db.exec(migration);
  await db.exec("SET ROLE service_role");
}, 30_000);

afterAll(async () => {
  await db.close();
});

describe("atomic Mercado Pago event application", () => {
  it("normalizes the historical environment and rejects new drift", async () => {
    const row = await db.query<{ environment: string }>("SELECT environment FROM public.subscriptions WHERE external_id IS NULL");
    expect(row.rows[0].environment).toBe("live");
    await expect(db.exec(`INSERT INTO public.subscriptions(user_id,status,environment)
      VALUES ('${USER}','pending','production')`)).rejects.toThrow(/subscriptions_environment_check/);
  });

  it("inserts once and ignores duplicate or older delivery", async () => {
    expect((await apply(payload())).rows[0].applied).toBe(true);
    expect((await apply(payload())).rows[0].applied).toBe(false);
    expect((await apply(payload({ last_event_ts: "2026-09-13T00:00:00Z" }))).rows[0].applied).toBe(false);
    const count = await db.query<{ count: number }>("SELECT count(*)::int AS count FROM public.subscriptions WHERE external_id='preapproval_1'");
    expect(count.rows[0].count).toBe(1);
  });

  it("applies a newer event and preserves a paid period on cancellation", async () => {
    const result = await apply(payload({
      status: "cancelled",
      current_period_end: null,
      last_event_ts: "2026-09-15T00:00:00Z",
    }));
    expect(result.rows[0].applied).toBe(true);
    const row = await db.query<{ status: string; cancel_at_period_end: boolean; period_epoch: number }>(
      "SELECT status,cancel_at_period_end,extract(epoch FROM current_period_end)::float8 AS period_epoch FROM public.subscriptions WHERE external_id='preapproval_1'",
    );
    expect(row.rows[0].status).toBe("cancelled");
    expect(row.rows[0].cancel_at_period_end).toBe(true);
    expect(row.rows[0].period_epoch).toBe(Date.parse("2026-10-14T00:00:00Z") / 1000);
  });

  it("does not turn an incomplete active snapshot into unlimited access", async () => {
    await apply(payload({ external_id: "no_period", current_period_end: null }));
    const row = await db.query<{ status: string }>("SELECT status FROM public.subscriptions WHERE external_id='no_period'");
    expect(row.rows[0].status).toBe("pending");
  });

  it("isolates identical provider IDs between live and sandbox", async () => {
    await apply(payload({ external_id: "same_id", environment: "sandbox" }));
    await apply(payload({ external_id: "same_id", environment: "live" }));
    const count = await db.query<{ count: number }>("SELECT count(*)::int AS count FROM public.subscriptions WHERE external_id='same_id'");
    expect(count.rows[0].count).toBe(2);
  });

  it("rejects identity changes on an existing provider ID", async () => {
    await expect(apply(payload({ user_id: OTHER_USER, last_event_ts: "2026-09-16T00:00:00Z" })))
      .rejects.toThrow(/MP_SUBSCRIPTION_IDENTITY_CONFLICT/);
  });

  it("allows only service_role to execute the mutation", async () => {
    await db.exec("RESET ROLE; SET ROLE authenticated");
    await expect(apply(payload({ external_id: "forbidden" }))).rejects.toThrow(/permission denied/i);
    await db.exec("RESET ROLE; SET ROLE service_role");
  });

  it("prevents duplicate pending invitations without deleting audit history", async () => {
    await db.exec("RESET ROLE");
    await db.exec(`INSERT INTO public.organization_invites(organization_id,email)
      VALUES ('${ORG}','member@example.com')`);
    await expect(db.exec(`INSERT INTO public.organization_invites(organization_id,email)
      VALUES ('${ORG}','MEMBER@example.com')`)).rejects.toThrow(/organization_invites_one_pending_email/);
    await db.exec("SET ROLE service_role");
  });
});
