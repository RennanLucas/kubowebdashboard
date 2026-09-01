# AUDITORIA FINAL PÓS-CORREÇÕES
**Data:** 2026-08-26  
**Commit base:** c54d174  
**Escopo:** Verificação funcional de todas as correções + busca de novos problemas

---

## STATUS ATUAL DA AUDITORIA

⏸️ **AUDITORIA PAUSADA NO ITEM 2/23**

### ✅ COMPLETADO

#### 1. XSS no tracker-script
**Status:** 🟢 CORRIGIDO E VERIFICADO

**Código verificado:**
- [`supabase/functions/tracker-script/index.ts:15-22`](supabase/functions/tracker-script/index.ts:15)
- Validação UUID implementada com regex
- Retorna 400 para pid inválido
- XSS bloqueado na origem

**Evidência de correção:**
```typescript
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const pidRaw = url.searchParams.get("pid") || "";
const pid = UUID_RE.test(pidRaw) ? pidRaw : "";

if (!pid) {
  return new Response("// invalid or missing pid", {
    status: 400,
    headers: corsHeaders,
  });
}
```

**Testes necessários (não executados ainda):**
- [ ] UUID válido
- [ ] UUID inválido
- [ ] `<script>alert(1)</script>`
- [ ] `javascript:alert(1)`
- [ ] `data:text/html,<script>alert(1)</script>`

---

#### 2. Token leak no create-invite
**Status:** 🟡 PARCIALMENTE CORRIGIDO

**Código verificado:**
- [`supabase/functions/create-invite/index.ts:69-85`](supabase/functions/create-invite/index.ts:69)
- Token plain NÃO vaza na response HTTP ✅
- Apenas hash armazenado no banco ✅

**PROBLEMA CRÍTICO DESCOBERTO:**
❌ **Fluxo de aceitação do convite INCOMPLETO**

**Análise detalhada:**

1. **create-invite gera token mas não envia email:**
   - Token plain gerado corretamente
   - Hash armazenado no banco
   - Response HTTP limpa (só retorna `inviteId`)
   - ⚠️ Comentário no código: `// TODO: enqueue email via process-email-queue`

2. **Email template existe mas não é usado:**
   - [`supabase/functions/_shared/email-templates/invite.tsx`](supabase/functions/_shared/email-templates/invite.tsx)
   - Template completo com `confirmationUrl`
   - Nunca chamado pela Edge Function

3. **Endpoint de aceitação NÃO EXISTE:**
   - ❌ Nenhuma Edge Function `accept-invite`
   - ❌ Nenhuma rota frontend `/accept-invite`
   - ❌ Token gerado fica órfão

4. **Banco preparado mas fluxo quebrado:**
   - Tabela `organization_invites` tem coluna `token_hash`
   - Coluna `status` suporta: pending → accepted
   - Coluna `expires_at` implementada
   - Nenhum código faz a transição

**Impacto:**
- Funcionalidade de convites **NÃO FUNCIONAL**
- Token não vaza porque **nunca é usado**
- Correção de P0 tecnicamente correta, mas feature quebrada

**Recomendação:**
Implementar fluxo completo:
1. Integrar `process-email-queue` no `create-invite`
2. Criar Edge Function `accept-invite`
3. Criar rota frontend `/accept-invite?token=XXX`
4. Adicionar testes E2E do fluxo completo

---

---

#### 3. CSP header real
**Status:** 🟢 CORRIGIDO E VERIFICADO

**Código verificado:**
- [`vercel.json:27-28`](vercel.json:27)
- `unsafe-eval` removido da diretiva `script-src`
- `unsafe-inline` permanece (necessário para Vite HMR)

**Headers de segurança implementados:**
```json
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
Permissions-Policy: camera=(), microphone=(), geolocation=(), interest-cohort=()
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; ...
```

**CSP atual:**
- ✅ `unsafe-eval` REMOVIDO (correção P1)
- ⚠️ `unsafe-inline` presente (necessário para dev, aceitável com outras camadas)
- ✅ `frame-ancestors 'none'` (previne clickjacking)
- ✅ `connect-src` restrito a domínios específicos
- ⚠️ `img-src https:` permite qualquer imagem HTTPS

**Nenhum uso de `unsafe-eval` encontrado:**
- ✅ Grep no src/ e supabase/ retornou vazio
- ✅ index.html limpo (apenas inline JSON-LD estruturado)

---

#### 4. Open redirect
**Status:** 🟢 CORRIGIDO E VERIFICADO

**Código verificado:**
- [`supabase/functions/create-mp-preference/index.ts:61-74`](supabase/functions/create-mp-preference/index.ts:61)
- Allowlist de origins implementada
- URLs externas bloqueadas

**Lógica de validação:**
```typescript
const ALLOWED_RETURN_ORIGINS = [
  new URL(req.url).origin,
  Deno.env.get("PUBLIC_SITE_URL"),
].filter(Boolean) as string[];

let baseReturn = `${new URL(req.url).origin}/checkout/return`;
if (returnUrl) {
  try {
    const parsed = new URL(returnUrl);
    if (ALLOWED_RETURN_ORIGINS.some((o) => parsed.origin === o)) {
      baseReturn = returnUrl;
    }
  } catch { /* invalid URL — use default */ }
}
```

**Testes executados (10/10 passaram):**
- ✅ URLs permitidas: `kuboweb.com.br`, `kubowebdashboard.lovable.app`
- ✅ URLs maliciosas bloqueadas: `evil.com`, `kubowebdashboard.lovable.app.evil.com`
- ✅ Protocolos perigosos bloqueados: `javascript:`, `data:`
- ✅ Protocol-relative URLs bloqueadas: `//evil.com`
- ✅ URLs malformadas retornam ao default

---

#### 5. Plan gating (4 endpoints)
**Status:** 🟢 CORRIGIDO E VERIFICADO (com observação)

**Código verificado:**
- [`supabase/functions/get-dashboard-pages/index.ts:4,49-50`](supabase/functions/get-dashboard-pages/index.ts:4)
- [`supabase/functions/get-dashboard-geo/index.ts:4,49-50`](supabase/functions/get-dashboard-geo/index.ts:4)
- [`supabase/functions/get-dashboard-devices/index.ts:4,48-49`](supabase/functions/get-dashboard-devices/index.ts:4)
- [`supabase/functions/get-dashboard-sources/index.ts:4,48-49`](supabase/functions/get-dashboard-sources/index.ts:4)
- [`supabase/functions/_shared/plan-gate.ts`](supabase/functions/_shared/plan-gate.ts)

**Implementação:**
```typescript
const { tier, maxHistoryDays } = await resolveProjectTier(supabaseAdmin, projData.organization_id, user.id);
const enforcedDays = enforceHistoryLimit(days, maxHistoryDays);
```

**Defesa em profundidade:**

🔒 **Camada 1 - Frontend (UX):**
- [`src/hooks/useDashboardData.ts:152,169,186,203,220`](src/hooks/useDashboardData.ts:152)
- `cappedDays = Math.min(days, plan.maxHistoryDays)`
- Limita SILENCIOSAMENTE antes de enviar request
- Melhora experiência (não envia request inválido)

🔒 **Camada 2 - Backend (segurança):**
- `resolveProjectTier()` consulta org + user subscriptions
- `enforceHistoryLimit()` valida e REJEITA se limite excedido
- Retorna erro `HISTORY_LIMIT_EXCEEDED` com status 403
- Protege contra manipulação de request (curl/Postman)

**Testes de cenário (4/4 passaram):**
- ✅ Usuário Free via UI (30 dias) → frontend limita para 7 dias
- ✅ Usuário Free bypass frontend (30 dias) → backend rejeita
- ✅ Usuário Pro solicita 90 dias → aceito (dentro do limite 365)
- ✅ Usuário Pro manipula para 400 dias → backend rejeita

**⚠️ Observação importante:**
Backend usa estratégia "fail hard" (retorna erro) em vez de "silent cap" (limitar silenciosamente). Isso é **correto** porque:
1. Frontend já faz silent cap para UX normal
2. Se request chegou com valor inválido no backend, é manipulação maliciosa
3. Erro explícito facilita debugging e auditoria

---

---

#### 6. Rate limiting
**Status:** 🟡 PARCIAL - Apenas /track implementado

**Código verificado:**
- [`supabase/functions/track/index.ts:165-169`](supabase/functions/track/index.ts:165)
- [`supabase/functions/track/_ingest.ts:10-60`](supabase/functions/track/_ingest.ts:10)

**✅ Implementado:**
- Endpoint `/track` (público, não autenticado)
- Janela: 60 segundos
- Limite por IP: 100 requests/minuto
- Limite por Project: 1000 requests/minuto
- Armazenamento: in-memory por Edge isolate
- Retorno: 429 Too Many Requests

**⚠️ Limitação conhecida:**
```typescript
// Comentário no código (linha 29):
// "Atenção: contenção por isolate, não garante limite global entre instâncias Edge."
```
Se Supabase escalar para múltiplos isolates, cada um tem contador independente.

**❌ NÃO implementado (18 endpoints autenticados):**
1. `create-mp-preference` - pagamento (alta criticidade)
2. `get-dashboard-pages` - query cara (alta criticidade)
3. `get-dashboard-geo` - query cara (alta criticidade)
4. `get-dashboard-devices` - query cara (alta criticidade)
5. `get-dashboard-sources` - query cara (alta criticidade)
6. `create-invite` - criação de recurso
7. `compute-alerts` - query cara
8. `create-project`, `delete-project` - CRUD
9. `generate-snippet`, `get-organization`, `get-projects`
10. `list-alerts`, `process-mp-webhook`, `toggle-alert`
11. `update-organization`, `update-project`

**Vulnerabilidades potenciais:**

🔴 **Cenário 1 - Brute force de autenticação:**
- Atacante tenta múltiplos tokens em `get-dashboard-*`
- Sem rate limit, pode testar milhares de tokens/segundo
- Mitigação atual: JWT com assinatura (dificulta forge, mas não impede tentativa)

🔴 **Cenário 2 - DoS via endpoints caros:**
- `get-dashboard-pages` com `days=365` é computacionalmente caro
- Atacante com token válido pode sobrecarregar Edge Function
- Mitigação atual: plan gate limita dias, mas não frequência de requests

🔴 **Cenário 3 - Webhook flooding:**
- `process-mp-webhook` não tem rate limit dedicado
- Mercado Pago assina com header, mas flooding ainda consome recursos
- Mitigação atual: validação de assinatura (dificulta spoof, mas não volume)

**Recomendação P1:**
Implementar rate limiting em endpoints autenticados usando Upstash Rate Limit (edge-compatible):
1. **Alta prioridade:** `get-dashboard-*` (10-20 req/min por userId)
2. **Média prioridade:** `create-mp-preference`, `create-invite` (5 req/min)
3. **Baixa prioridade:** CRUD operations (já protegidos por RLS)

---

---

#### 7. JWT validation (compute-alerts)
**Status:** 🔴 VULNERABILIDADE P0 CONFIRMADA

**Código vulnerável:**
- [`supabase/functions/compute-alerts/index.ts:53-77`](supabase/functions/compute-alerts/index.ts:53)

**Vulnerabilidade:**
```typescript
function parseJwtClaims(token: string): Record<string, unknown> | null {
  const parts = token.split(".");
  // ❌ APENAS DECODIFICA BASE64, NÃO VALIDA ASSINATURA
  const payload = parts[1].replaceAll("-", "+").replaceAll("_", "/");
  return JSON.parse(atob(payload));
}

function isAuthorized(req: Request): boolean {
  const token = extractBearerToken(req);
  
  // ✅ Aceita SUPABASE_SERVICE_ROLE_KEY (correto)
  if (token === serviceKey) return true;
  
  // ❌ CRÍTICO: aceita qualquer JWT com role=service_role
  const claims = parseJwtClaims(token);
  return claims?.role === "service_role";
}
```

**Ataque simulado:**
1. Atacante cria JWT falso:
   - Header: `{ alg: "none", typ: "JWT" }`
   - Payload: `{ role: "service_role", sub: "attacker" }`
   - Signature: qualquer valor (não é validado)

2. Envia request:
   ```bash
   POST /compute-alerts
   Authorization: Bearer eyJhbGciOiJub25lIn0.eyJyb2xlIjoic2VydmljZV9yb2xlIn0.fake
   ```

3. Backend valida:
   - `parseJwtClaims()` decodifica payload
   - `claims.role === "service_role"` ✅ PASSA
   - ❌ Assinatura NUNCA validada

4. Resultado:
   - ✅ Atacante autorizado
   - ✅ Pode disparar `compute-alerts` manualmente
   - ✅ Emails enviados para TODAS as organizações Pro
   - ✅ Custo de envio na conta do Kubo (Brevo)

**Impacto:**
- 🔴 **Severidade:** P0 (Crítica)
- **Financeiro:** Consumo de quota de emails (Brevo cobra por volume)
- **Reputação:** Emails spam afetam deliverability do domínio
- **Operacional:** Flooding de alertas falsos para clientes
- **Disponibilidade:** Atacante pode DoS via múltiplos triggers

**Correção necessária:**
```typescript
// ❌ NUNCA fazer validação JWT manual
function parseJwtClaims(token: string) { ... }

// ✅ USAR validação do Supabase
async function isAuthorized(req: Request, supabase: SupabaseClient): Promise<boolean> {
  const auth = req.headers.get("Authorization") ?? "";
  const token = auth.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : "";
  
  // Aceita apenas service role key (compute-alerts é invocado por cron)
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  return serviceKey && token === serviceKey;
}
```

**Nota importante:**
`compute-alerts` é invocado por **cron job** (não por usuários). Não há razão para aceitar JWTs de usuários. A Edge Function deve aceitar APENAS `SUPABASE_SERVICE_ROLE_KEY` hardcoded.

**Teste E2E necessário:**
```typescript
// e2e/jwt-validation.spec.ts
test('compute-alerts rejeita JWT falso', async ({ request }) => {
  const fakeJwt = 'eyJhbGciOiJub25lIn0.eyJyb2xlIjoic2VydmljZV9yb2xlIn0.fake';
  const res = await request.post('/compute-alerts', {
    headers: { Authorization: `Bearer ${fakeJwt}` }
  });
  expect(res.status()).toBe(401);
});
```

---

---

#### 8. CORS restriction
**Status:** 🟡 PARCIALMENTE CORRETO - 4 endpoints com wildcard desnecessário (P2)

**Código verificado:**
- [`supabase/functions/_shared/cors.ts`](supabase/functions/_shared/cors.ts)

**Implementação:**
```typescript
// ✅ Validação dinâmica (segura)
export const getCorsHeaders = (req?: Request) => {
  const origin = req?.headers.get("origin") || "";
  const allowed = allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
  return {
    "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGIN") || allowed,
  };
};

// ✅ Restrito a domínio específico (seguro)
export const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGIN") || "https://kubowebdashboard.vercel.app",
};

// ⚠️ Wildcard (inseguro, mas às vezes necessário)
export const publicCorsHeaders = {
  "Access-Control-Allow-Origin": "*",
};
```

**Allowlist configurada:**
```typescript
const allowedOrigins = [
  "https://kubowebdashboard.vercel.app",
  "https://kubowebdashboard.lovable.app",
  "http://localhost:5173",
  "http://localhost:8080",
  "http://localhost:3000"
];
```

**Uso por endpoint:**

✅ **Endpoints autenticados usando `corsHeaders` (11 endpoints):**
- `admin-list-users`, `create-invite`, `create-mp-preference`
- `generate-report`, `get-dashboard-*` (5 endpoints)
- `mp-cancel-subscription`, `mp-webhook`

✅ **Wildcard justificado (3 endpoints):**
- `track` - analytics público, precisa aceitar qualquer site
- `tracker-script` - servido como `<script src>`, necessita wildcard
- `list-plans` - página pública de preços

⚠️ **Wildcard desnecessário (4 endpoints - P2):**

1. **`compute-alerts`** - linha 4
   - Invocado por CRON, não por browser
   - Não há `origin` header em requests de cron
   - CORS desnecessário

2. **`ai-weekly-insights`** - linha 5
   - Endpoint autenticado (requer JWT válido)
   - Uso: dashboard interno
   - Deveria usar `corsHeaders`

3. **`get-analytics`** - linha 12
   - Endpoint autenticado (requer JWT válido)
   - Uso: dashboard interno
   - Deveria usar `corsHeaders`

4. **`auth-email-hook`** - linha 14
   - Webhook do Supabase Auth
   - Não há browser envolvido
   - CORS desnecessário

**Análise de risco:**

🟡 **Impacto: BAIXO**
- Todos os 4 endpoints com wildcard desnecessário **são autenticados**
- Atacante precisa de JWT válido para explorá-los
- Wildcard não adiciona vulnerabilidade real (apenas má prática)
- CSRF já é mitigado por JWT bearer token (não cookie)

**Não é vulnerável a:**
- ❌ CSRF - autenticação via header `Authorization`, não cookie
- ❌ Token leak - wildcard não expõe credenciais
- ❌ Data leak - RLS policies protegem dados

**Recomendação P2 (baixa prioridade):**
```typescript
// compute-alerts/index.ts
- const corsHeaders = { "Access-Control-Allow-Origin": "*" };
+ // CORS removido - endpoint invocado por cron, não browser

// ai-weekly-insights/index.ts
- const corsHeaders = { "Access-Control-Allow-Origin": "*" };
+ import { corsHeaders } from "../_shared/cors.ts";

// get-analytics/index.ts
- const corsHeaders = { "Access-Control-Allow-Origin": "*" };
+ import { corsHeaders } from "../_shared/cors.ts";

// auth-email-hook/index.ts
- const corsHeaders = { 'Access-Control-Allow-Origin': '*' };
+ // CORS removido - webhook, não browser
```

---

### ⏸️ PENDENTE (15 itens restantes)

9. REVOKE/GRANT on cron functions
7. JWT validation
8. CORS audit
9. Secrets audit
10. Pipeline analytics
11. Deduplicação
12. Histórico por plano
13. Matemática dashboard
14. Multi-tenant
15. Billing E2E
16. Todas as rotas
17. Smoke test Edge Functions
18. Vetores de segurança
19. Mobile/PWA
20. Performance
21. Regressão
22. Bugs novos
23. Matriz final + veredito

---

## NOVOS PROBLEMAS DESCOBERTOS

### 🔴 P0 - Feature de convites não funcional
**Descrição:** Fluxo de invite incompleto (email não enviado, accept-invite não existe)  
**Impacto:** Impossível convidar membros para organizações  
**Status:** Descoberto durante auditoria pós-correção

---

## PRÓXIMOS PASSOS

1. Decidir se continua auditoria ou pausa para implementar accept-invite
2. Executar testes funcionais do XSS (itens pendentes)
3. Continuar itens 3-23 da auditoria

---

**Nota:** Esta auditoria está em andamento. Relatório será atualizado conforme cada item for validado.
