import { test, expect } from "@playwright/test";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * TESTE E2E DE ISOLAMENTO MULTI-TENANT (A->B / B->A)
 * =====================================================
 *
 * Este spec prova EMPIRICAMENTE o isolamento cross-org atacando o Supabase
 * staging com dois usuários reais autenticados. Não confia na camada de UI:
 * consulta o banco diretamente via supabase-js (RLS) e as Edge Functions.
 *
 * PARA RODAR DE VERDADE, o ambiente precisa das seguintes variáveis:
 *   VITE_SUPABASE_URL              (já presente em .env.staging)
 *   VITE_SUPABASE_PUBLISHABLE_KEY  (anon key - já presente em .env.staging)
 *   E2E_USER_A_EMAIL / E2E_USER_A_PASSWORD   (owner da Org A)
 *   E2E_USER_B_EMAIL / E2E_USER_B_PASSWORD   (owner da Org B)
 *   E2E_ORG_A_ID / E2E_PROJECT_A_ID
 *   E2E_ORG_B_ID / E2E_PROJECT_B_ID
 *
 * O setup de dados vive em supabase/e2e_phase3_5_setup.sql (Org A / Org B).
 *
 * SEM ESSAS CREDENCIAIS o teste NÃO roda e é marcado como skip com uma
 * mensagem explícita — NUNCA passa por engano (sem falso positivo).
 */

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "";
const ANON_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || "";

const USER_A = {
  email: process.env.E2E_USER_A_EMAIL || "",
  password: process.env.E2E_USER_A_PASSWORD || "",
};
const USER_B = {
  email: process.env.E2E_USER_B_EMAIL || "",
  password: process.env.E2E_USER_B_PASSWORD || "",
};

// IDs conhecidos do setup (supabase/e2e_phase3_5_setup.sql)
const ORG_A_ID = process.env.E2E_ORG_A_ID || "c1111111-e2e0-e2e0-e2e0-e2e000000001";
const ORG_B_ID = process.env.E2E_ORG_B_ID || "c2222222-e2e0-e2e0-e2e0-e2e000000002";
const PROJECT_A_ID = process.env.E2E_PROJECT_A_ID || "d1111111-e2e0-e2e0-e2e0-e2e000000001";
const PROJECT_B_ID = process.env.E2E_PROJECT_B_ID || "d2222222-e2e0-e2e0-e2e0-e2e000000002";

const hasCredentials =
  !!SUPABASE_URL &&
  !!ANON_KEY &&
  !!USER_A.email &&
  !!USER_A.password &&
  !!USER_B.email &&
  !!USER_B.password;

const ANALYTICS_TABLES = [
  "analytics_daily_overview",
  "analytics_daily_pages",
  "analytics_daily_geo",
  "analytics_daily_tech",
  "analytics_daily_events",
] as const;

/** Cria um client autenticado. Lança se o login falhar (credencial errada). */
async function signInClient(creds: { email: string; password: string }): Promise<SupabaseClient> {
  const client = createClient(SUPABASE_URL, ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error } = await client.auth.signInWithPassword({
    email: creds.email,
    password: creds.password,
  });
  if (error) {
    throw new Error(`Login falhou para ${creds.email}: ${error.message}`);
  }
  return client;
}

test.describe("Isolamento Multi-Tenant A<->B (RLS direto)", () => {
  test.skip(
    !hasCredentials,
    "NÃO TESTADO — requer staging com 2 usuários reais (E2E_USER_A_*/E2E_USER_B_* + anon key). " +
      "Rode supabase/e2e_phase3_5_setup.sql e exporte as variáveis. Sem isso não classificamos como aprovado por teste."
  );

  let clientA: SupabaseClient;
  let clientB: SupabaseClient;

  test.beforeAll(async () => {
    clientA = await signInClient(USER_A);
    clientB = await signInClient(USER_B);
  });

  test.afterAll(async () => {
    await clientA?.auth.signOut();
    await clientB?.auth.signOut();
  });

  // ---- projects ----------------------------------------------------------
  test("User A NÃO lê o projeto de B (e vice-versa)", async () => {
    const aReadsB = await clientA.from("projects").select("*").eq("id", PROJECT_B_ID);
    expect(aReadsB.error, "select nao deve erro-500, RLS filtra silenciosamente").toBeNull();
    expect(aReadsB.data ?? [], "A não pode ver projeto B").toHaveLength(0);

    const bReadsA = await clientB.from("projects").select("*").eq("id", PROJECT_A_ID);
    expect(bReadsA.data ?? [], "B não pode ver projeto A").toHaveLength(0);
  });

  test("User A só enxerga seus próprios projetos no SELECT sem filtro", async () => {
    const { data } = await clientA.from("projects").select("id, organization_id");
    const orgs = new Set((data ?? []).map((r: { organization_id: string }) => r.organization_id));
    expect(orgs.has(ORG_B_ID), "A não pode ter nenhuma linha da Org B").toBe(false);
  });

  // ---- tabelas analíticas ------------------------------------------------
  for (const table of ANALYTICS_TABLES) {
    test(`${table}: A NÃO lê dados do projeto de B`, async () => {
      const aReadsB = await clientA.from(table).select("*").eq("project_id", PROJECT_B_ID);
      expect(aReadsB.data ?? [], `A não pode ler ${table} de B`).toHaveLength(0);

      const bReadsA = await clientB.from(table).select("*").eq("project_id", PROJECT_A_ID);
      expect(bReadsA.data ?? [], `B não pode ler ${table} de A`).toHaveLength(0);
    });
  }

  // ---- pageviews / events (tabelas base) --------------------------------
  test("pageviews/events: A NÃO lê linhas do projeto de B", async () => {
    for (const table of ["pageviews", "events"]) {
      const aReadsB = await clientA.from(table).select("*").eq("project_id", PROJECT_B_ID);
      expect(aReadsB.data ?? [], `A não pode ler ${table} de B`).toHaveLength(0);
    }
  });

  // ---- subscriptions -----------------------------------------------------
  test("subscriptions: A NÃO lê assinatura da Org B", async () => {
    const aReadsB = await clientA.from("subscriptions").select("*").eq("organization_id", ORG_B_ID);
    expect(aReadsB.data ?? [], "A não pode ver subscription de B").toHaveLength(0);

    const bReadsA = await clientB.from("subscriptions").select("*").eq("organization_id", ORG_A_ID);
    expect(bReadsA.data ?? [], "B não pode ver subscription de A").toHaveLength(0);
  });

  test("subscriptions: A NÃO consegue escrever/alterar assinatura (nenhuma policy de write)", async () => {
    const update = await clientA
      .from("subscriptions")
      .update({ status: "active", plan_id: "pro" })
      .eq("organization_id", ORG_A_ID)
      .select();
    // RLS sem policy de UPDATE => 0 linhas afetadas OU erro. Nunca sucesso com dados.
    expect((update.data ?? []).length, "cliente não pode alterar subscription").toBe(0);
  });

  // ---- organization_members / invites -----------------------------------
  test("organization_members: A NÃO lê membros da Org B", async () => {
    const aReadsB = await clientA
      .from("organization_members")
      .select("*")
      .eq("organization_id", ORG_B_ID);
    expect(aReadsB.data ?? [], "A não pode ver membros de B").toHaveLength(0);
  });

  test("organization_invites: A NÃO lê convites da Org B", async () => {
    const aReadsB = await clientA
      .from("organization_invites")
      .select("*")
      .eq("organization_id", ORG_B_ID);
    expect(aReadsB.data ?? [], "A não pode ver convites de B").toHaveLength(0);
  });

  // ---- PRIVILEGE ESCALATION ---------------------------------------------
  test("RBAC: A NÃO consegue elevar o próprio role para owner/admin", async () => {
    // Descobre a própria membership
    const { data: me } = await clientA.from("organization_members").select("id, role").limit(1);
    const row = (me ?? [])[0];
    test.skip(!row, "sem membership visível para A — setup incompleto");

    const attempt = await clientA
      .from("organization_members")
      .update({ role: "owner" })
      .eq("id", row!.id)
      .select();
    // Trigger check_member_rbac deve barrar auto-elevação (erro) ou RLS retorna 0 linhas.
    const escalated = (attempt.data ?? []).some(
      (r: { role: string }) => r.role === "owner" && row!.role !== "owner"
    );
    expect(escalated, "A não pode se auto-promover a owner").toBe(false);
  });

  test("RBAC: A NÃO consegue inserir membro na Org B", async () => {
    const attempt = await clientA
      .from("organization_members")
      .insert({ organization_id: ORG_B_ID, user_id: "00000000-0000-0000-0000-000000000000", role: "viewer" })
      .select();
    expect(attempt.error, "insert cross-org deve ser rejeitado").not.toBeNull();
  });

  // ---- IDOR via Edge Functions ------------------------------------------
  test("IDOR: A usa Edge Functions com project_id de B => bloqueado/vazio", async ({ request }) => {
    const { data: sessionA } = await clientA.auth.getSession();
    const tokenA = sessionA.session?.access_token;
    expect(tokenA, "token de A necessário").toBeTruthy();

    const endpoints = [
      "get-dashboard-pages",
      "get-dashboard-geo",
      "get-dashboard-devices",
      "get-dashboard-sources",
      "get-dashboard-overview",
    ];

    for (const fn of endpoints) {
      const res = await request.post(`${SUPABASE_URL}/functions/v1/${fn}`, {
        headers: {
          Authorization: `Bearer ${tokenA}`,
          "Content-Type": "application/json",
          apikey: ANON_KEY,
        },
        data: { projectId: PROJECT_B_ID, range: "7d" },
      });
      // Aceitável: 400 (bad request), 403 (forbidden), 404 (not found), ou 200 com payload vazio.
      // NUNCA 200 com dados reais de B.
      const status = res.status();
      if (status === 200) {
        const body = await res.json().catch(() => ({}));
        const serialized = JSON.stringify(body);
        // Heurística: não pode conter os 100 visitantes conhecidos de B como total real.
        expect(
          serialized.includes('"visitors":100') && serialized.includes(PROJECT_B_ID),
          `${fn} vazou dados de B para A`
        ).toBe(false);
      } else {
        expect([400, 401, 403, 404]).toContain(status);
      }
    }
  });
});
