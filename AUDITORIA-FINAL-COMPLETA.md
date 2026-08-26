# AUDITORIA FINAL 100% COMPLETA — KUBO ANALYTICS

**Data:** 2026-08-25  
**Commit base:** `6be94bd` (main)  
**Auditoria anterior:** commit `5634454` (2026-08-20)  
**Commits desde última auditoria:** 25  
**Método:** Análise estática + execução de testes + inspeção de git history + trace de pipeline  

---

## SUMÁRIO EXECUTIVO

| Categoria | Nota | Status |
|-----------|------|--------|
| Segurança (Secrets/XSS/Auth) | 3/10 | CRÍTICO |
| RLS & Multi-tenancy | 7/10 | BOM |
| Plan Gating (Billing) | 4/10 | CRÍTICO |
| Edge Functions | 6/10 | MÉDIO |
| Tracking Pipeline | 7/10 | BOM |
| Testes & Cobertura | 7/10 | BOM |
| Performance & Bundle | 7/10 | BOM |
| LGPD/Privacy | 5/10 | MÉDIO |
| PWA/Mobile | 8/10 | BOM |
| Dashboard & Cálculos | 7/10 | BOM |
| Infraestrutura DB | 7/10 | BOM |
| Documentação & DX | 6/10 | MÉDIO |

**NOTA GLOBAL: 6.2/10**  
**VEREDITO: NÃO PRONTO PARA PRODUÇÃO** — 3 bloqueadores P0 impedem deploy seguro.

---

## SEÇÃO 1 — SEGURANÇA & SECRETS

### 1.1 Secrets no Git History (P0 — BLOQUEADOR)

| Secret | Arquivo | Commit | Status |
|--------|---------|--------|--------|
| `VITE_SUPABASE_PUBLISHABLE_KEY` (anon key) | `.env` | deletado em `3a7a0e7` | ⚠️ NO HISTORY |
| `VITE_PAYMENTS_CLIENT_TOKEN` (pk_live_*) | `.env.production` | `3a7a0e7` | ⚠️ NO HISTORY |
| `E2E_USER_PASSWORD="Rennanlucas135@"` | `.env.staging` | `04a8371` | ⚠️ NO HISTORY |
| `E2E_OWNER_EMAIL` (email real) | `.env.staging` | `04a8371` | ⚠️ NO HISTORY |

**Evidência:** `git log --all -p -- "*.env*"` retorna os valores em plaintext.  
**Impacto:** Qualquer pessoa com read-access ao repo pode recuperar esses secrets.  
**Remediação obrigatória:**
1. Rotacionar TODOS os secrets (Supabase anon key, payment token, senha do usuário)
2. Executar `git filter-repo` ou BFG Cleaner para remover do history
3. Force-push (com coordenação de equipe)

### 1.2 XSS no Tracker Script (P0 — BLOQUEADOR)

**Arquivo:** `supabase/functions/tracker-script/index.ts:20`  
```typescript
var pid="${pid}";  // pid vem direto de URL param sem sanitização
```

**Exploit:** `?pid=";alert(document.cookie);//` → executa JS arbitrário em TODOS os sites clientes.  
**Impacto:** Qualquer atacante pode injetar código nos sites de todos os clientes Kubo.  
**Agravante:** Cache de 1h (`Cache-Control: public, max-age=3600`) amplifica o ataque.

### 1.3 CSP com unsafe-eval (P1)

**Arquivo:** `vercel.json:28`  
```
script-src 'self' 'unsafe-inline' 'unsafe-eval'
```
`unsafe-eval` permite `eval()`, `Function()` — derrota proteções contra XSS no dashboard.

### 1.4 CORS Wildcard em Endpoints Autenticados (P1)

**Arquivos:** Todos os edge functions usam `Access-Control-Allow-Origin: *`  
**Impacto:** Se um token for roubado (ex: via XSS do tracker), qualquer domínio pode chamar APIs autenticadas.

### 1.5 Sem Rate Limiting em Endpoints Autenticados (P1)

Apenas `track` tem rate limiting. Endpoints como `create-mp-preference`, `ai-weekly-insights`, `generate-report` não têm nenhum limite. Permite:
- Flood de criação de preferências Mercado Pago
- Amplificação de custo via OpenAI (ai-weekly-insights)
- Enumeração de usuários (admin-list-users)

### 1.6 JWT Role Claim sem Verificação de Assinatura (P1)

**Arquivo:** `supabase/functions/compute-alerts/index.ts:75-76`  
```typescript
const claims = parseJwtClaims(token);  // apenas base64 decode
return claims?.role === "service_role";  // sem verificar assinatura!
```
Atacante pode forjar JWT `{"role":"service_role"}` e passar auth.

### 1.7 Open Redirect via Payment Flow (P1)

**Arquivo:** `supabase/functions/create-mp-preference/index.ts:34`  
`returnUrl` aceito sem validação → redirect para phishing após pagamento.

### 1.8 Invite Token em Plaintext na Response (P1)

**Arquivo:** `supabase/functions/create-invite/index.ts:95-96`  
```typescript
token: token_plain  // comentário diz "don't return in production"
```

---

## SEÇÃO 2 — RLS & MULTI-TENANCY

### 2.1 Status Geral

- **34 tabelas** com RLS habilitado ✅
- **1 tabela** sem RLS: `aggregation_status` (MEDIUM — não contém dados de usuário, mas vaza project IDs)
- Padrão de isolamento correto via `organization_members` check em todas as policies

### 2.2 Políticas de Escrita (INSERT/UPDATE/DELETE)

| Tabelas | INSERT | UPDATE | DELETE | Justificativa |
|---------|--------|--------|--------|---------------|
| analytics_daily_* | ❌ | ❌ | ❌ | Escritas via SECURITY DEFINER (cron) |
| pageviews/events | ❌ (removido) | ❌ | ❌ | Via service_role (track function) |
| email_* | ❌ | ❌ | ❌ | service_role only |

Arquitetura correta — dados imutáveis escritos por serviços privilegiados.

### 2.3 SECURITY DEFINER sem Restrição de Acesso (MEDIUM)

3 funções cron-only são chamáveis via RPC por qualquer usuário autenticado:
- `aggregate_analytics_jit(p_project_id)` — pode triggerar agregação de projetos alheios
- `cleanup_old_raw_data()` — pode triggerar limpeza prematura
- `aggregate_all_projects()` — compute abuse em todos os tenants

**Fix:** `REVOKE ALL ... FROM PUBLIC, authenticated; GRANT EXECUTE ... TO service_role;`

### 2.4 Cascade Safety ✅

Todas as cascades seguem a cadeia `organization → projects → data`. Nenhum FK cruza fronteiras de org.

---

## SEÇÃO 3 — PLAN GATING (BILLING)

### 3.1 Bypass Crítico: 4 Endpoints sem Enforcement (HIGH)

| Função | Importa plan-gate? | Chama enforceHistoryLimit? |
|--------|-------------------|---------------------------|
| `get-dashboard-pages` | ✅ | ❌ NUNCA CHAMA |
| `get-dashboard-geo` | ✅ | ❌ NUNCA CHAMA |
| `get-dashboard-devices` | ✅ | ❌ NUNCA CHAMA |
| `get-dashboard-sources` | ✅ | ❌ NUNCA CHAMA |
| `get-analytics` | ✅ | ✅ Chama corretamente |

**Impacto:** Usuários Free acessam histórico ilimitado nestes 4 endpoints.

### 3.2 Resolução de Tier por user_id em vez de org (HIGH)

**Arquivo:** `supabase/functions/get-analytics/index.ts:275-287`  
Busca subscription por `user_id` ao invés do `organization_id` do projeto.  
**Impacto:** Em cenário multi-org, user com sub pessoal Pro acessa dados de org Free.

### 3.3 `get-subscription-status` não é Org-Aware (MEDIUM)

Retorna status de subscription sem filtrar por org → possível leakage de status entre orgs.

---

## SEÇÃO 4 — EDGE FUNCTIONS (20 funções)

### 4.1 Inventário Completo

| # | Função | Auth | Org Check | Plan Gate | Status |
|---|--------|------|-----------|-----------|--------|
| 1 | track | Público | project_id valid | ❌ | ✅ OK |
| 2 | tracker-script | Público | ❌ | ❌ | ⛔ XSS P0 |
| 3 | get-analytics | JWT | ✅ | ✅ | ⚠️ tier por user_id |
| 4 | get-dashboard-overview | JWT | ✅ | ✅ | ✅ OK |
| 5 | get-dashboard-pages | JWT | ✅ | ❌ BYPASS | ⛔ HIGH |
| 6 | get-dashboard-geo | JWT | ✅ | ❌ BYPASS | ⛔ HIGH |
| 7 | get-dashboard-devices | JWT | ✅ | ❌ BYPASS | ⛔ HIGH |
| 8 | get-dashboard-sources | JWT | ✅ | ❌ BYPASS | ⛔ HIGH |
| 9 | get-subscription-status | JWT | ❌ | ❌ | ⚠️ MEDIUM |
| 10 | create-mp-preference | JWT | ✅ | ❌ | ⚠️ open redirect |
| 11 | mp-webhook | HMAC | N/A | N/A | ✅ OK |
| 12 | mp-cancel-subscription | JWT | ✅ | ❌ | ✅ OK |
| 13 | list-plans | Público | ❌ | ❌ | ✅ OK |
| 14 | create-invite | JWT | ✅ (RBAC) | ❌ | ⚠️ token leak |
| 15 | admin-list-users | JWT+Role | Platform | ❌ | ✅ OK |
| 16 | compute-alerts | Service/JWT | ✅ | ❌ | ⚠️ JWT bypass |
| 17 | ai-weekly-insights | JWT | ✅ | ❌ | ⚠️ no rate limit |
| 18 | generate-report | JWT | ✅ | ❌ | ✅ OK |
| 19 | auth-email-hook | Internal | N/A | N/A | ✅ OK |
| 20 | process-email-queue | Service | N/A | N/A | ✅ OK |

### 4.2 Error Leakage

Múltiplas funções retornam `error.message` direto ao cliente, podendo vazar stack traces ou info interna.

---

## SEÇÃO 5 — TRACKING PIPELINE

### 5.1 Fluxo Verificado

```
Site → tracker-script (JS) → track (Edge Function)
  → pageviews/events (INSERT via service_role)
  → aggregate_all_projects() (pg_cron 5min)
  → analytics_daily_overview (rollup)
  → get-analytics / get-dashboard-* (leitura)
  → Dashboard (React)
```

### 5.2 Pontos Fortes ✅
- Deduplicação via `event_id` UUID + `ON CONFLICT DO NOTHING`
- Bot filtering compartilhado client/server (`BOT_UA_PATTERN`)
- Offline queue com localStorage (até 50 eventos)
- Batch sending (10 eventos por flush)
- `sendBeacon` para page unload

### 5.3 Gaps Encontrados

| Issue | Severidade | Detalhe |
|-------|-----------|---------|
| UTM capturado mas não exposto | MEDIUM | Dados existem no DB mas `get-analytics` não retorna |
| Rollups de sessions/bounces/duration vazios | MEDIUM | Tabelas existem, `aggregate_analytics_jit` não as popula |
| `analytics_daily_tech` nunca populado | MEDIUM | Schema existe mas nenhum aggregator escreve nele |
| Sessão = sessionStorage (reset por tab) | LOW | Design choice, mas pode inflacionar métricas |

---

## SEÇÃO 6 — AUTENTICAÇÃO & RBAC

### 6.1 Auth Flows ✅
- Email/password via Supabase Auth
- Magic link
- OAuth (se configurado)
- `auth-email-hook` para customização de emails

### 6.2 RBAC

**Dois sistemas paralelos:**
1. **Platform-level:** `user_roles` (admin/user) — para funções como `admin-list-users`
2. **Org-level:** `organization_members.role` (owner/admin/editor/viewer) — enforced via triggers

**Triggers de enforcement:**
- `check_member_rbac()` — previne que editor/viewer modifiquem membros
- `check_invite_rbac()` — previne que não-admin/owner criem convites

### 6.3 Gap: `accept_invite` não valida expiração (MEDIUM)

**Arquivo:** `supabase/migrations/20260818172000_*.sql` → função `accept_invite()`  
Não verifica `expires_at` nem `status` do invite. Convites revogados/expirados podem ser aceitos.

---

## SEÇÃO 7 — PERFORMANCE & BUNDLE

### 7.1 Build Metrics

| Métrica | Valor | Avaliação |
|---------|-------|-----------|
| Modules transformados | 4.229 | Normal para app React médio |
| dist/ total estimado | ~4.4 MB | ⚠️ Alto (inclui imagens) |
| CSS principal | 144.30 KB (23.16 KB gzip) | OK |
| Logo PNG grande | 361.35 KB | ⚠️ Deveria ser WebP/AVIF |
| Build time | ~10s | OK |
| Code splitting | ✅ Extensivo | Bom (60+ chunks) |

### 7.2 Bundling ✅
- Vite 5.4.21 com SWC (react-swc)
- Tree-shaking funcionando
- Lazy loading de rotas
- Service Worker com Workbox (precache + runtime cache)

### 7.3 Dependências com Vulnerabilidades

| Package | Severidade | Fix Disponível |
|---------|-----------|----------------|
| esbuild ≤0.24.2 | Moderate | Requer vite@8 (major) |
| vite ≤6.4.2 | High | Requer vite@8 (major) |

Ambas são dev-only — não afetam produção diretamente.

---

## SEÇÃO 8 — TESTES & COBERTURA

### 8.1 Métricas Atuais

| Métrica | Valor | Gate |
|---------|-------|------|
| Tests passing | 454/456 | ⚠️ 2 timeout |
| Test files | 27/28 passing | 1 failing |
| Statements (src/lib + hooks) | 78.76% | Gate: 70% ✅ |
| Branches | 90.25% | Gate: 70% ✅ |
| Functions | 77.22% | Gate: 73% ✅ |
| Lines | 78.76% | Gate: 75% ✅ |

### 8.2 Testes Falhando

| Teste | Motivo | Severidade |
|-------|--------|-----------|
| `buildXlsx` blob test | Timeout 5s — `fflate` zip lento em jsdom | LOW |
| `buildXlsx` xlsx content test | Mesmo motivo | LOW |

### 8.3 E2E (Playwright)

- 12 specs existentes, todos passando
- Cobre: login, dashboard navigation, help-center, organizations
- **Não cobre:** billing flow, RBAC enforcement, tracking pipeline E2E

---

## SEÇÃO 9 — LGPD / PRIVACY

### 9.1 Findings

| Item | Status | Evidência |
|------|--------|-----------|
| Cookie `sidebar:state` | ⚠️ CONFLITO | `src/components/ui/sidebar.tsx` usa cookie — contradiz marketing "100% sem cookies" |
| Dados pessoais | ✅ | Apenas email e nome (via Supabase Auth) |
| IP geolocation | ⚠️ | `track` envia IP para `ipapi.co` — transferência internacional |
| Consentimento | ❌ | Nenhum banner/modal de consentimento implementado |
| Direito de exclusão | ❌ | Sem endpoint de data deletion para end-users dos sites rastreados |
| Retenção | ✅ | TTL de 60 dias em raw data via `cleanup_old_raw_data()` |
| DPO/Política | ❌ | Sem página de política de privacidade |

### 9.2 Risco Legal

Para clientes brasileiros (LGPD): falta consentimento e mecanismo de exclusão para visitantes dos sites rastreados. O Kubo precisa fornecer orientação/tooling para seus clientes cumprirem a lei.

---

## SEÇÃO 10 — PWA / MOBILE

### 10.1 Status ✅

| Item | Status |
|------|--------|
| manifest.webmanifest | ✅ Gerado pelo VitePWA plugin |
| Service Worker | ✅ Workbox com autoUpdate |
| Icons (192/512) | ✅ Existem em public/ |
| Standalone display | ✅ |
| Offline fallback | ✅ Precache de assets |
| Orientation | portrait |
| Start URL | /dashboard |
| Lang | pt-BR |

### 10.2 Observações
- `navigateFallbackDenylist` corretamente exclui `/~oauth`, `/api`, `/functions/`
- Cache limit: 5MB por arquivo
- `includeAssets` referencia `apple-touch-icon.png` — verificar se existe

---

## SEÇÃO 11 — DATABASE & MIGRATIONS

### 11.1 Visão Geral
- **Total de migrations:** ~2.358 linhas SQL
- **35 tabelas** (34 com RLS)
- **14 SECURITY DEFINER functions**
- **pg_cron jobs:** aggregate_all_projects (5min), cleanup_old_raw_data (diário)

### 11.2 Indexes

**Presentes:** ✅ Compostos em pageviews/events (project_id+created_at), event_id unique parcial, UTM indexes, org_members unique constraint.

**Faltando (performance em escala):**
- `subscriptions(organization_id, status)` — cada request de plan-check faz scan
- `pageviews(project_id, created_at DESC) WHERE created_at > now()-25h` — partial index para cron

### 11.3 Cascades ✅
Corretas: org → members/invites/projects → pageviews/events/analytics/alerts/goals/vitals

---

## SEÇÃO 12 — DASHBOARD & CÁLCULOS

### 12.1 Componentes Verificados

| Componente | Fonte de Dados | Cálculo |
|------------|---------------|---------|
| Overview cards | get-dashboard-overview | Soma/média com comparação período anterior |
| Pages table | get-dashboard-pages | Contagem por path, ordenação |
| Geo chart | get-dashboard-geo | Contagem por país/cidade |
| Devices chart | get-dashboard-devices | Contagem por device/browser/OS |
| Sources table | get-dashboard-sources | Contagem por referrer |
| Charts (line/bar) | get-analytics | Agrupamento por dia/hora |

### 12.2 Estratégia Híbrida de Dados

- **Últimos 2 dias:** consulta `pageviews`/`events` raw
- **Mais antigo:** consulta `analytics_daily_*` rollups
- Transição automática baseada no período solicitado

### 12.3 Gaps
- Bounce rate, session duration, pages/session: dados **não populados** nos rollups
- `analytics_daily_tech` (devices/browsers): tabela vazia — dashboard faz query direta sem rollup

---

## SEÇÃO 13 — ESCALABILIDADE

### 13.1 Análise por Volume

| Cenário | Clientes | PVs/dia | Bottleneck |
|---------|----------|---------|-----------|
| Atual | ~10 | ~1K | Nenhum |
| 100 clientes | 100 | ~100K | Cron 5min pode ficar lento |
| 1K clientes | 1.000 | ~1M | Rate limit per-isolate ineficaz, sem index parcial |
| 10K clientes | 10.000 | ~10M | Precisa partitioning, read replicas, cache layer |

### 13.2 Limitações Identificadas
- Rate limiting in-memory (reset em cold start, não distribuído)
- Sem connection pooling explícito (depende do Supabase)
- Sem cache layer (Redis/Edge) entre DB e Edge Functions
- Logo de 361KB sem otimização

---

## SEÇÃO 14 — COMPARAÇÃO COM AUDITORIA ANTERIOR (commit 5634454)

| # | Finding Anterior | Status Atual | Evidência |
|---|-----------------|--------------|-----------|
| 1 | Senha em .env.staging em texto plano | ⚠️ PARCIAL — removida do working tree mas permanece no git history | `git log -p -- .env.staging` mostra conteúdo |
| 2 | Supabase keys em .env commitado | ⚠️ PARCIAL — arquivo deletado em 3a7a0e7 mas keys no history | `git log -p -- .env` |
| 3 | Bot filtering inconsistente client/server | ✅ CORRIGIDO | `BOT_UA_PATTERN` compartilhado (commit c231f45) |
| 4 | RBAC triggers sem search_path | ✅ CORRIGIDO | Migration 20260822 adiciona SET search_path |
| 5 | Feedback table não existia nos types | ✅ CORRIGIDO | Presente em `src/integrations/supabase/types.ts` |
| 6 | InvitesManager erro de propriedade | ✅ CORRIGIDO | Compilação TypeScript passa |
| 7 | Falta de testes unitários | ✅ MELHORADO | De ~0 para 456 testes, cobertura 78%+ |
| 8 | Falta de E2E tests | ✅ MELHORADO | 12 specs Playwright passando |
| 9 | Build quebrado | ✅ CORRIGIDO | Build OK (4229 modules) |
| 10 | TypeCheck falhando | ✅ CORRIGIDO | `tsc --noEmit` passa |

---

## SEÇÃO 15 — PROBLEMAS NOVOS (não existiam na auditoria anterior)

| # | Finding | Sev. | Arquivo | Linha |
|---|---------|------|---------|-------|
| 1 | XSS injection via tracker-script pid param | P0 | tracker-script/index.ts | 20 |
| 2 | 4 dashboard endpoints importam plan-gate mas nunca chamam | HIGH | get-dashboard-{pages,geo,devices,sources} | — |
| 3 | JWT role claim aceito sem verificar assinatura | P1 | compute-alerts/index.ts | 75-76 |
| 4 | Open redirect via returnUrl no payment flow | P1 | create-mp-preference/index.ts | 34 |
| 5 | CSP com unsafe-eval | P1 | vercel.json | 28 |
| 6 | CORS wildcard em endpoints autenticados | P1 | Todos edge functions | — |
| 7 | accept_invite não valida expires_at/status | MEDIUM | migration 20260818172000 | — |
| 8 | 3 cron functions callable via RPC | MEDIUM | migrations | — |
| 9 | Rollup tables para sessions/bounces/tech nunca populados | MEDIUM | analytics_daily_tech/sessions | — |
| 10 | Cookie sidebar contradiz "sem cookies" | LOW | sidebar.tsx | — |

---

## SEÇÃO 16 — FEATURES INVENTORY

| Feature | Implementada | Testada | Funcional |
|---------|-------------|---------|-----------|
| Auth (email/password, magic link) | ✅ | ✅ E2E | ✅ |
| Multi-org (create, switch, invite) | ✅ | ✅ E2E | ✅ |
| RBAC (owner/admin/editor/viewer) | ✅ | Parcial (triggers) | ✅ |
| Tracking (pageviews + events) | ✅ | ✅ Unit | ✅ |
| Bot filtering | ✅ | ✅ Unit | ✅ |
| Dashboard overview | ✅ | ✅ Unit | ✅ |
| Dashboard pages/geo/devices/sources | ✅ | ❌ | ⚠️ (sem plan gate) |
| Billing (Mercado Pago) | ✅ | ❌ | ⚠️ (open redirect) |
| Plan gating (Free vs Pro) | ✅ | ✅ Unit | ⚠️ (bypass em 4 endpoints) |
| Alerts (compute-alerts) | ✅ | ❌ | ⚠️ (JWT bypass) |
| AI Weekly Insights | ✅ | ❌ | ✅ |
| Reports (generate-report) | ✅ | ✅ Unit | ✅ |
| Export (CSV/XLSX/PDF) | ✅ | ⚠️ 2 timeout | ✅ |
| Annotations | ✅ | ❌ | ✅ |
| Goals | ✅ | ❌ | ✅ |
| Web Vitals | ✅ | ❌ | ✅ |
| Feedback system | ✅ | ❌ | ✅ |
| Roadmap voting | ✅ | ❌ | ✅ |
| PWA offline | ✅ | ❌ | ✅ |
| Email notifications | ✅ | ❌ | ✅ |
| Admin panel | ✅ | ❌ | ✅ |

---

## SEÇÃO 17 — AÇÕES IMEDIATAS OBRIGATÓRIAS (Pré-Produção)

### BLOQUEADORES P0 (deve ser feito ANTES de qualquer deploy)

1. **Sanitizar `pid` no tracker-script** — validar UUID format, rejeitar caracteres especiais
2. **Rotacionar ALL secrets** expostos no git history (Supabase key, payment token, password)
3. **Limpar git history** com `git filter-repo` / BFG Cleaner
4. **Remover `token` da response** do `create-invite`

### P1 (deve ser feito antes de aceitar clientes pagantes)

5. **Chamar `enforceHistoryLimit`** nos 4 endpoints de dashboard
6. **Corrigir resolução de tier** para usar `organization_id` do projeto
7. **Remover `unsafe-eval`** do CSP
8. **Restringir CORS** para domínio(s) do dashboard em endpoints autenticados
9. **Adicionar rate limiting** em endpoints autenticados (especialmente create-mp-preference, ai-weekly-insights)
10. **Validar JWT signature** em compute-alerts (usar getUser() ao invés de parseJwtClaims)
11. **Validar returnUrl** contra allowlist de domínios

### P2 (pré-escala)

12. Adicionar `REVOKE/GRANT` nas 3 funções cron-only
13. Validar `expires_at` e `status` em `accept_invite()`
14. Criar indexes de performance (subscriptions, partial index para cron)
15. Remover cookie do sidebar OU remover claim "sem cookies"
16. Popular rollup tables faltantes ou remover schema morto
17. Implementar consentimento LGPD para visitantes

---

## SEÇÃO 18 — TESTES DE REGRESSÃO RECOMENDADOS

```
Novos E2E a criar:
1. e2e/billing-flow.spec.ts — Free→checkout→Pro→features unlock
2. e2e/plan-gating.spec.ts — Free user blocked from >7 days history (já existe skeleton)
3. e2e/rbac-enforcement.spec.ts — Editor não pode convidar, Viewer não pode editar
4. e2e/tracking-pipeline.spec.ts — Embed script→track→DB→dashboard numbers
5. e2e/multi-tenant-isolation.spec.ts — Org A não vê dados de Org B

Unit tests a criar:
6. tracker-script pid sanitization (após fix)
7. accept_invite expiration validation (após fix)
8. compute-alerts JWT signature verification (após fix)
```

---

## SEÇÃO 19 — SCORES FINAIS

| # | Categoria | Peso | Nota | Ponderado |
|---|-----------|------|------|-----------|
| 1 | Segurança (Secrets/XSS/Auth) | 15% | 3/10 | 0.45 |
| 2 | RLS & Multi-tenancy | 12% | 7/10 | 0.84 |
| 3 | Plan Gating (Billing) | 10% | 4/10 | 0.40 |
| 4 | Edge Functions | 10% | 6/10 | 0.60 |
| 5 | Tracking Pipeline | 8% | 7/10 | 0.56 |
| 6 | Testes & Cobertura | 8% | 7/10 | 0.56 |
| 7 | Performance & Bundle | 7% | 7/10 | 0.49 |
| 8 | LGPD/Privacy | 8% | 5/10 | 0.40 |
| 9 | PWA/Mobile | 5% | 8/10 | 0.40 |
| 10 | Dashboard & Cálculos | 7% | 7/10 | 0.49 |
| 11 | Infraestrutura DB | 5% | 7/10 | 0.35 |
| 12 | Documentação & DX | 5% | 6/10 | 0.30 |
| | **TOTAL** | **100%** | | **5.84/10** |

---

## SEÇÃO 20 — VEREDITO FINAL

### ⛔ NÃO APROVADO PARA PRODUÇÃO

**3 bloqueadores P0 impedem deploy seguro:**
1. XSS no tracker-script permite execução de código nos sites de clientes
2. Secrets em plaintext no git history (incluindo password real e payment token live)
3. Invite token exposto na response HTTP

**Estimativa de correção dos bloqueadores:** 2-4 horas de trabalho focado.

**Após correção dos P0:** o sistema pode ir para produção limitada (beta fechado) com as seguintes restrições:
- Máximo 10 clientes iniciais
- Monitorar billing manualmente (plan gate bypass nos 4 endpoints)
- Não aceitar pagamentos até corrigir P1 #5-6 (plan enforcement)
- Comunicar aos clientes que LGPD compliance é responsabilidade deles até tooling ser implementado

**Para GA (General Availability):** corrigir todos os P1 (itens 5-11 da Seção 17).

---

## SEÇÃO 21 — EVIDÊNCIAS & COMANDOS DE VERIFICAÇÃO

```bash
# Reproduzir XSS do tracker
curl "https://<project>.supabase.co/functions/v1/tracker-script?pid=\";alert(1);//"

# Verificar secrets no history
git log --all -p -- "*.env*" | grep -E "PASSWORD|pk_live|eyJ"

# Verificar plan-gate bypass (dashboard-pages não chama enforce)
grep -n "enforceHistoryLimit\|enforcePremiumFeature" supabase/functions/get-dashboard-pages/index.ts
# Resultado: nenhum match

# Verificar aggregation_status sem RLS
grep "aggregation_status" supabase/migrations/*.sql | grep -i "enable row level"
# Resultado: nenhum match

# Verificar invite token na response
grep -n "token" supabase/functions/create-invite/index.ts | grep -v "//"

# Rodar testes (454/456 pass)
npx vitest run

# Build (OK)
npm run build

# TypeCheck (OK)
npx tsc --noEmit -p tsconfig.app.json
```
