# Integração das correções — Kubo Analytics

Data: 14/09/2026. Estado: integração local; auditoria completa ainda não encerrada.

## Versão integrada

A branch `codex/audit-fixes` combina as correções locais iniciadas em `672e17e`, o commit `21a274b` e as alterações do Gemini até `5081026`. As alterações de tema ainda não commitadas na pasta principal foram reproduzidas nesta branch, sem modificar a pasta principal. O conflito do Dashboard foi resolvido preservando o layout do Gemini e os filtros absolutos de datas.

Não houve push, merge de PR, aplicação de migrations remotas, publicação ou cobrança nesta etapa. Os relatórios anteriores que afirmam aprovação integral não substituem a validação independente desta versão.

## Correções implementadas

- Reprocessamento de dias afetados nos rollups, em vez de somar distintos por lote. Sessões, duração, rejeição, eventos e tecnologia reconciliados com testes SQL locais.
- Datas UTC inclusivas, limites por idade do histórico e comparação anterior sem leitura fora do plano. Datas selecionadas seguem os endpoints e os componentes vinculados ao período.
- Classificação consistente de fontes, precedência de UTM, limites de domínio e tratamento de tablets.
- Retry idempotente de tracking compatível com índices únicos parciais, incluindo lotes mistos com eventos novos e duplicados.
- Convite com token no fragmento, continuidade após login, aceite autenticado por RPC e entrega honesta por link. Não se anuncia envio automático de e-mail.
- CORS por origem validada, sem correspondência por substring. Checkout mantém validação de origem, plano, método e timeout; não remove o e-mail do pagador para tentar novamente.
- Live expira visitas, deduplica eventos, recupera intervalos após reconexão, mostra falhas e limpa canais/timers. Free não inicia a assinatura do feed pela interface.
- Comparações não inventam crescimento de 100% sobre base zero. Erros de consulta não aparecem como métricas zeradas. O rótulo de período respeita o limite real do plano.
- Roadmap não usa itens/votos de demonstração como fallback. Erros de leitura/votação são exibidos sem simular sucesso.
- Insights limitados ao projeto válido da organização; histórico e respostas assíncronas antigos são descartados ao trocar o contexto. Free é bloqueado. Falhas de métricas e distribuições por horário incompletas impedem geração local.
- A geração local é identificada como local. Não é apresentada como uma chamada bem-sucedida a uma API de IA. A API remota antiga agora restringe o histórico à organização, não usa assinatura de outra organização como fallback, falha de forma fechada na consulta de consumo e permite geração somente por POST.
- Tema claro por padrão, escolha explícita de escuro/sistema, persistência e sincronização. Login com movimento reduzido não mantém conteúdo invisível durante animações de entrada.
- SDKs das funções modificadas fixados em uma mesma versão e relações PostgREST normalizadas para objeto/array. Configurações TypeScript de aplicação, ferramentas e testes separadas, mantendo a checagem dos testes.
- Dependências vulneráveis atualizadas; Vitest e coverage-v8 fixados em 4.1.11. A migração foi conferida na [documentação oficial do Vitest 4](https://v4.vitest.dev/guide/migration).

## Verificação desta etapa

| Verificação | Resultado |
| --- | --- |
| Instalação reproduzível | `npm ci --no-fund` aprovado; avisos de pacotes deprecados e scripts de instalação não aprovados foram reportados, não ocultados |
| Testes com cobertura | 55 arquivos, 657 testes aprovados; gate de cobertura aprovado |
| Cobertura reportada | 84,8% linhas; 80,68% branches; escopo de lógica configurado no projeto, não cobertura integral do produto |
| Typecheck | Aplicação, ferramentas e testes aprovados após separar os ambientes e resolver os tipos Deno dos testes |
| Lint | Zero erros, 230 avisos; não se afirma eliminação dos avisos |
| Build | Aprovado |
| QA PWA | 25 verificações aprovadas no build verificado; verificar novamente após qualquer novo build |
| E2E isolados | 9 aprovados: convite inválido, continuidade para login, tema e responsividade |
| Revisão visual | Screenshots reais do login em 375px e 1280px inspecionadas, com segunda passagem após o ajuste de movimento reduzido |
| Larguras do login verificadas | 375, 390, 430, 768 e 1280px, sem overflow horizontal |
| Tipos das Edge Functions | 11 funções alteradas aprovadas por `deno check --no-config` |
| Dependências | `npm audit` e `npm audit --omit=dev`: zero vulnerabilidades reportadas |

Os E2E desta etapa bloqueiam todas as requisições externas. Eles não comprovam login real, OAuth, entrega de e-mail, pagamento ou permissões no banco remoto. Os testes SQL usam PostgreSQL local via PGlite e fixtures reduzidas; não são aplicação de migrations em staging.

## Bundle e performance

Sem dependência nova de runtime nesta etapa. A ferramenta de testes atualizada não vai para o bundle do cliente. Novos helpers de comparação e contexto são pequenos; o helper compartilhado de comparação gerou um chunk de aproximadamente 0,12 kB.

Antes da integração: Landing 93,64 kB (gzip 25,19); Dashboard 124,31 kB (gzip 35,38); Insights 203,85 kB (gzip 64,26); precache 4.303,09 KiB/130 entradas.

Build integrado: Landing 93,64 kB (gzip 25,19); Dashboard 124,78 kB (gzip 35,54); Insights 205,75 kB (gzip 64,99); precache 4.320,78 KiB/134 entradas. A landing não foi redesenhada nesta etapa.

O precache continua grande. CWV, FPS, memória, carga concorrente e custo das policies não foram medidos em dispositivos/clientes reais; não se atribui nota de performance sem essa medição.

## Situação dos achados da auditoria original

| Achado | Situação e pendência |
| --- | --- |
| K01/K02 | Correção de reconciliação implementada e testada localmente; aplicar em staging e reconciliar projetos reais antes de produção |
| K03 | Correção do fallback fictício do Gemini preservada; verificar funis ponta a ponta com dados reais |
| K04/K05 | Períodos e filtros corrigidos; matriz completa de combinações e widgets mensais ainda precisa de validação |
| K06 | Geração local explicitada; integração moderna de IA paga e reserva atômica da quota ainda NÃO implementadas por completo |
| K07 | RLS e escopo de projeto/histórico corrigidos no código; validar perfis e trocas reais de organização em staging |
| K08 | Correções de secret/checkout preservadas; assinatura, retries, ordem de webhooks e ciclo de pagamento sandbox ainda pendentes |
| K09 | Entrega por link e aceite implementados; validar convite real, expiração, revogação e duplicidade em staging |
| K10 | Operação e configuração segura de SMTP/hooks/filas ainda precisam ser confirmadas |
| K11 | RLS restritiva de histórico e trigger serializado de quota de projetos implementados, com 5 testes SQL; validar schema completo, concorrência e performance em staging |
| K12 | Corrigido e testado localmente; repetir ingestão/retry após deploy da função |
| K13 | Origem dinâmica aplicada também às APIs privadas restantes examinadas; validar navegador nas origens efetivamente publicadas |
| K14 | Drift de staging e gate E2E completo ainda não encerrados; E2E locais isolados não substituem esse gate |
| K15 | Fórmula/base zero e estados de falha corrigidos; testar comparação autenticada de projetos reais |
| K16 | Classificadores corrigidos e testados localmente; aplicar migration e validar ingestão real |
| K17 | Rate limit permanece por instância; armazenamento atômico compartilhado ainda pendente |
| K18 | Correções de autoria do Gemini preservadas; políticas efetivamente instaladas precisam de revalidação adversarial |
| K19 | Ajustes mobile do Gemini preservados; Feedback completo não foi reinspecionado visualmente nesta etapa |
| K20 | Triagem completa dos advisors e políticas/índices remotos ainda pendente |
| K21 | Bundle medido; otimização do precache e medições reais ainda pendentes |
| K22 | Expiração/reconexão/isolamento implementados e cobertos por testes de ciclo de vida; queda prolongada em Realtime real ainda pendente |
| K23 | Audit de dependências zerado e regressão de testes/build verificada |
| K24 | Correções de suficiência/base zero do Gemini preservadas; validar relatórios reais representativos |
| K25 | Rótulo de relatório para impressão preservado; download autenticado e impressão completa ainda precisam ser retestados |

## Antes de publicar para clientes

1. Completar os itens de código ainda pendentes, sobretudo integração real de IA e quota atômica, rate limit compartilhado e tratamento de retries do webhook.
2. Confirmar migrations instaladas em staging e aplicar as novas migrations na ordem do histórico, com backup e plano de recuperação. Novas migrations desta branch incluem `20260912190000_accept_invite_token.sql`, `20260912191000_reconcile_daily_analytics.sql` e `20260914003000_enforce_plan_limits.sql`.
3. Testar RLS no schema completo com usuário Free, Pro, viewer, owner e administrador, incluindo REST direto e troca de organização. A assinatura legada sem organização continua suportada por contrato; confirmar a regra de produto antes de removê-la.
4. Validar agregação com dados reais e planejar backfill sem apagar totais históricos cuja matéria-prima já foi removida por retenção. O JIT tem sobreposição de dois dias, não backfill histórico ilimitado.
5. Publicar as funções alteradas em staging, verificar origens/callbacks e executar login por senha, código, recuperação e Google sem reutilizar credenciais das capturas.
6. Validar ciclo Mercado Pago exclusivamente com credenciais e contas de teste, sem cobrança, incluindo webhook autenticado, renovação e cancelamento.
7. Validar entrega/aceite de convites, instalação do tracker, eventos, todas as páginas autenticadas, downloads e impressão.
8. Reexecutar o gate E2E completo, advisors e revisão visual da landing/painel/mobile. Só então decidir publicação/merge de PR. Esta integração local não é atestado de prontidão comercial.
