# Pré-voo de Produção — Relatório de Testes e Cobertura

**Data:** 24 ago 2026 · **Faixa de commits:** `8c3f7b3` → `3bc20d5`

Este documento registra o que foi endurecido em testes antes da entrada dos primeiros
clientes pagantes, um bug de isolamento entre projetos que apareceu no processo, e o
que ainda falta. A ordem das prioridades aqui é por **raio de impacto em produção**
(isolamento entre clientes > exatidão da cobrança > números que o cliente lê na tela),
não por percentual de cobertura.

## Resumo numérico

| Métrica | Antes | Agora |
| --- | --- | --- |
| Testes | 269 | **409** |
| Cobertura de linhas (camada de lógica) | ~47% | **78,76%** |
| Cobertura de branch | ~70% | **90,25%** |
| Arquivos em 100% de linhas | 6 | **15** |
| Gate no `vitest.config.ts` | 44/44/62/67 | 70/70/73/75 |

Dos 140 testes novos, **79 são desta sessão**; o restante veio de uma sessão paralela
trabalhando na mesma árvore (ver "Nota sobre o repositório" no fim). Números conferidos
na árvore em `3bc20d5`: 28 arquivos de teste, 409 passando, zero falhas.

---

## 1. O que foi feito

### 1.1 Portão de assinatura extraído e travado contra o servidor

`de9314d` · `src/lib/subscription-validity.ts` · 27 testes · 100% coberto

A regra que decide se uma assinatura libera acesso vivia inline dentro do hook,
impossível de testar isoladamente. Virou módulo próprio com `now` injetável, então as
comparações de período passaram a ser determinísticas em vez de dependerem do relógio
da máquina.

O ponto principal não é a cobertura: a suíte compara o portão do **cliente** com o
`computeIsActive` do **edge function** em toda a matriz de status × período. Se um dia
divergirem, o teste quebra — antes de a interface liberar algo que o servidor nega (ou
o contrário).

- `ACTIVE_STATUSES`: `active`, `trialing`, `authorized`, `approved`
- `CANCELED_STATUSES`: `canceled`, `cancelled` (as duas grafias, porque o provedor manda as duas)

### 1.2 Aritmética do dashboard coberta

`6ba1e3b` · `src/lib/heatmap-aggregation.ts` · 24 testes · 100% coberto

O `useHourlyHeatmap` carregava a conta mais complexa do app sem nenhum teste: grade de
atividade 7×24, deduplicação de visitantes por sessão, atribuição sessão→referrer e
taxa de conversão. São números que o cliente lê direto na tela — bug silencioso aqui é
bug que ele vê e questiona.

Extraído em três funções puras (`extractDomain`, `buildHeatmap`, `buildReferrerStats`),
o hook virou casca de fetch, e os tipos continuam sendo re-exportados de
`useHourlyHeatmap` para os 5 componentes consumidores não mudarem de import.

### 1.3 Invalidação de cache do dashboard escopada por projeto

`964d023` + `52c7e32` · `src/lib/dashboard-query-keys.ts` · 28 testes · 100% coberto
(hook e módulo)

O predicado que decide qual cache jogar fora estava escrito **três vezes** dentro do
hook (insert em realtime, aba voltando a ficar visível, refresh manual). Virou uma
função só, testada contra as cinco queryKeys reais do `useDashboardData` — nas duas
direções: casa o que deve casar, e **não** casa o dashboard de outro projeto nem a
query de assinatura.

Dois ganhos adicionais no mesmo commit:

- O throttle de 15s ficou coberto: uma rajada de 25 inserts vira **um único** refetch.
- Corrigido um bug latente: o `.then()` do invalidate virou `.finally()`. Como estava,
  um `invalidateQueries` rejeitado deixava `pendingUpdate = true` para sempre, matando
  o realtime em silêncio pelo resto da sessão do usuário.

---

## 2. O bug que apareceu no caminho

> **CORRIGIDO** — Isolamento entre projetos furado na invalidação de cache

Depois de escrever os testes do predicado, quebrei ele de propósito para confirmar que
a suíte pegava (*mutation testing*). Enquanto o código mutante estava em disco, um
commit externo (`964d023`) capturou a versão quebrada, sem o termo
`key.includes(projectId)`.

Com esse termo ausente, o predicado casava **todo** cache `dashboard-*`, de qualquer
projeto. Em produção isso significa: um pageview de um cliente invalidaria o dashboard
de **todos** os clientes, multiplicando chamadas de Edge Function por cliente ativo.
Corrigido em `52c7e32`.

O lado bom é que os testes provaram ter dentes — foram eles que localizaram o problema:

| Mutação aplicada | Testes que falham |
| --- | --- |
| Remover `&& key.includes(projectId)` | 3 |
| Desligar o throttle de 15s | 1 |

**Lição de processo:** mutation testing é perigoso num repositório com commit
automático concorrente. Se for repetir, isolar em branch descartável.

---

## 3. Dois pontos cegos no CI

Achei os dois enquanto verificava o pipeline e **não corrigi** — são decisão sua, e
mudam o valor de tudo do item 1.

### 3.1 O typecheck do CI não verifica nenhum arquivo

O CI roda `npm run typecheck`, que é `tsc --noEmit` na raiz. E o `tsconfig.json` da
raiz tem `"files": []` com apenas `references` — ou seja, **compila zero arquivos e
passa vazio**.

Os **23 erros de tipo reais** só aparecem com `-p tsconfig.app.json`. Um deles é
diferença de caixa (`./pages/admin` vs `./pages/Admin.tsx`): passa no Windows e pode
quebrar o build em Linux, que é onde o deploy roda.

Consequência colateral: o **passo 2 do `HOMOLOGATION.md`** ("Validação Estática",
critério de sucesso "exit code 0") está apoiado nesse mesmo comando vazio. O checklist
de homologação hoje aprova um projeto com 23 erros de tipo.

### 3.2 O CI não roda cobertura

O pipeline chama `npm run test`, não `test:coverage`. O gate de 70/70/73/75 **nunca é
verificado em CI** — só protege quem rodar na mão.

---

## 4. O que falta

### 4.1 Prioridade alta — destravam o resto

| Item | Por quê |
| --- | --- |
| Apontar `typecheck` para o tsconfig real | CI cego para 23 erros; risco de build quebrado no deploy |
| CI rodar `test:coverage` | O gate só vale se for verificado onde importa |
| Resolver os 23 erros de tipo | Começar pela caixa de `admin.tsx` — é o que quebra em Linux |

### 4.2 Hooks em 0% — em ordem de risco

| Hook | Linhas | O que faz |
| --- | --- | --- |
| `useAnnotations.ts` | 111 | **Escreve no banco** — mutação sem cobertura nenhuma |
| `usePlans.ts` | 71 | Catálogo de planos, vizinho da cobrança |
| `usePersistedAlerts.ts` | 77 | Alertas persistidos do cliente |
| `useLiveFeed.ts` | 66 | Feed em tempo real |
| `useGoals.ts` | 42 | Metas configuradas pelo cliente |
| `useAlertsCount.ts` | 19 | Contador simples |

`useHourlyHeatmap.ts` também aparece em 0%, mas é só a casca de fetch — a lógica saiu
para `heatmap-aggregation.ts`, que está em 100%.

### 4.3 Parciais — o que sobrou de branch/função

| Arquivo | Linhas | Branch | Funções |
| --- | --- | --- | --- |
| `chart-export.ts` | 41,02% | 100% | 33,33% |
| `useCountUp.ts` | 64,61% | 85,71% | 20% |
| `useDashboardData.ts` | 79,27% | 67,44% | 88,88% |
| `use-mobile.tsx` | 86,66% | 100% | 50% |
| `utils.ts` | 88,23% | 92,85% | 33,33% |
| `useSelectedProject.ts` | 92,15% | 68,42% | 100% |
| `export-utils.ts` | 92,89% | 100% | 75% |
| `plan-preview.ts` | 100% | 71,42% | 100% |
| `useAllUserProjects.ts` | 100% | 85,71% | 100% |

O de maior valor aqui é `useDashboardData.ts`: 67% de branch num hook que decide o que
cada cliente vê.

### 4.4 Excluídos deliberadamente da medição

Estes saíram do `include` da cobertura com justificativa no `vitest.config.ts`, não
estão "esquecidos":

- `chunk-reload.ts`, `pwa.ts`, `product-tour.ts`, `useInstallPrompt.ts` — APIs de
  browser que não rodam em jsdom sem harness de puppeteer.
- `use-toast.ts` — código vendorizado do shadcn.
- `help-content.ts` — objeto de conteúdo estático.

---

## 5. Uma coisa para decidir (produto, não código)

**Visitantes contam duas vezes quando a sessão vem de dois referrers.**

Documentei e travei em teste, sem mudar o comportamento — está descrito no doc comment
de `src/lib/heatmap-aggregation.ts`:

- Uma sessão que chega de dois referrers conta como visitante nos **dois** domínios.
- A conversão, por outro lado, é creditada só ao domínio do **primeiro** pageview.

Consequência prática: se o cliente somar a coluna de visitantes por referrer, pode dar
**mais** que o total de sessões distintas da conta. Não é bug de código, é escolha de
atribuição — mas é uma pergunta que o cliente vai fazer, e vale decidir a resposta
antes dele perguntar.

---

## 6. Como conferir

```bash
npm run test                             # 28 arquivos, 409 testes
npm run test:coverage                    # 78,76% linhas / 90,25% branch
npx tsc --noEmit                         # 0 erros — o que o CI vê hoje
npx tsc --noEmit -p tsconfig.app.json    # 23 erros — a realidade
```

A diferença entre as duas últimas linhas é o ponto cego 3.1.

**Cuidado ao medir:** rodar `test:coverage` enquanto outra sessão edita
`vitest.config.ts` produz números falsos. Numa medição durante edição concorrente,
`useDashboardRealtime.ts` apareceu em 0% e o total em 70,38% — em execução isolada o
mesmo arquivo dava 100%. Se um número parecer estranho, confirme que a árvore está
parada antes de agir sobre ele.

---

## Nota sobre o repositório

Havia **outra sessão trabalhando na mesma árvore** durante este trabalho. Entraram sem
minha ação:

| Commit | Conteúdo |
| --- | --- |
| `a716cde` | fix de billing: "stop a failed status fetch from reading as 'no subscription'" |
| `8cd499e` | branch de `local-insights` para 93,75% |
| `3bc20d5` | cobertura de `useIsAdmin` + `useAllUserProjects` |

Além disso, a outra sessão renomeou `useSuggestedAlerts.ts` → `usePersistedAlerts.ts`
e ampliou o `exclude` da cobertura (item 4.4), subindo o gate para 70/70/73/75.

Foi essa concorrência que capturou o código mutante em `964d023`. Deixei os arquivos
dela intactos.

Os 23 erros de tipo são **anteriores** a este trabalho — confirmei o baseline com
`git stash -u` antes e depois das mudanças. Nenhum deles está nos arquivos que toquei.

## Commits desta sessão

| Commit | Conteúdo |
| --- | --- |
| `de9314d` | Portão de validade da assinatura + testes de paridade hook/servidor |
| `6ba1e3b` | Extração da agregação de heatmap/referrer + 24 testes |
| `76f30dc` | `.claude/` no `.gitignore` |
| `52c7e32` | Correção do escopo do predicado + `useDashboardRealtime.test.tsx` |
| `5fea873` | Subida do gate para 53/53/68/72 |

Não são meus: `964d023` (contém meu código, commitado externamente junto com o
mutante), `a716cde`, `8cd499e`, `3bc20d5`.
