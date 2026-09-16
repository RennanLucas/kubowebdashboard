# IA paga e limites compartilhados — 14/09/2026

Etapa local posterior à integração ff85891. Não é deploy, merge de PR ou conclusão da auditoria 360°.

## Implementado

- API direta Gemini, modelo fixo gemini-3.8-flash, com GEMINI_API_KEY exclusivamente no servidor. Não existe chave VITE de IA nem fallback para o gateway anterior.
- Free sem geração; Pro com 10 gerações mensais compartilhadas por organização. Viewer pode consultar, mas não gastar quota. A exceção administrativa existente de plano é preservada, com a mesma quota.
- Ledger privado de custo separado de ai_insights: reserva atômica, transição start com um único vencedor, UUID persistido pelo navegador e reaproveitado em retries. Apagar um relatório não restaura quota.
- Reservas não iniciadas expiram em dois minutos. Chamadas iniciadas nunca são reenviadas automaticamente nem liberadas por timeout. Falhas após início ficam uncertain e contabilizadas conservadoramente; isso não afirma que o provedor efetivamente cobrou.
- Salvamento de relatório e conclusão do ledger ocorrem na mesma transação. Retry de UUID concluído devolve o relatório salvo; não gera novamente um relatório removido.
- Métricas de um projeto, período UTC 7/30 dias, agregação SQL sem truncamento silencioso pelo limite de linhas do PostgREST. Os visitantes são explicitamente contagens diárias segmentadas, não pessoas únicas no período. Hoje é identificado como parcial.
- Prompt sem URLs, IPs, e-mails, identificadores de sessão ou payloads brutos. Fontes, dispositivos e tipos de evento arbitrários são agrupados em categorias genéricas antes de sair do banco.
- Timeout do provedor de 45 segundos, saída limitada a 2.048 tokens, pensamento low, nenhuma ferramenta/grounding e store=false. Conteúdo vazio, bloqueado ou incompleto não vira relatório fictício.
- Painel Pro na página de Insights com quota, renovação UTC, estados de falha, consulta de solicitação e geração somente por clique. Análise local continua identificada separadamente, sem consumir quota paga.
- Contador PostgreSQL atômico de requisições, por endpoint e hash do usuário validado, em 13 funções autenticadas. Rotação de JWT não muda o contador. RPC e tabela privada não são acessíveis pelo navegador. Falha no contador resulta em 503, sem fallback permissivo local.
- Removido timer desnecessário ao importar somente a resposta 429. Os endpoints públicos track/tracker-script/list-plans/webhook ainda têm defesas locais e não foram declarados globalmente limitados.

## Verificações

- Typecheck aprovado: aplicação, configuração e testes.
- Suite completa: 725 testes em 62 arquivos, sem falhas. Cobertura: 85,08% linhas, 81,44% branches. Avisos jsdom de navegação não implementada continuam aparecendo em testes antigos; não foram ocultados.
- Lint: zero erros; 221 avisos na passagem antes do último ajuste visual mínimo. Não é resultado zero-warning.
- Deno check aprovado para as 13 funções alteradas.
- E2E local: 14 aprovados, com todas as requisições externas bloqueadas. Cinco verificam o novo painel em 375/390/430/768/1280px; nove verificam login/tema/convites.
- Primeira passagem do novo E2E encontrou configuração de ambiente ausente no harness, que fazia a URL da API devolver HTML. Corrigido com URL/chave sintéticas explícitas e interceptação restrita ao host de teste; as assertions não foram afrouxadas.
- Screenshots reais do painel em 375px e 1280px inspecionadas, com segunda passagem após alvo de toque mínimo de 44px e espera do estado habilitado. Sem overflow horizontal.
- Build aprovado: Landing 93,64 kB/gzip 25,19, Dashboard 124,78/gzip 35,54, Insights 210,60/gzip 66,69. Comparado a ff85891, Insights aumentou 4,85 kB/gzip 1,70. Sem nova dependência runtime.
- Precache: 134 entradas/4.324,78 KiB; continua grande. QA PWA: 25 checks aprovados antes do último ajuste de CSS. Não são testes de offline em dispositivo real nem medição de CWV.
- PostgreSQL local via PGlite exercita as migrations reais e permissões de roles. As submissões paralelas entram na fila de um banco local; não equivalem a carga multirregional ou múltiplas conexões remotas.

## Instalação segura e pendências

1. Confirmar um projeto de staging. A listagem read-only atual do Supabase mostra Kubo Web Analytics Production e um projeto não relacionado; o staging anterior não aparece neste acesso. Não direcionar testes à produção por fallback.
2. Aplicar, primeiro em staging, as migrations anteriores desta branch e depois 20260914140000_shared_request_limits.sql e 20260914143000_atomic_ai_quota.sql. Não publicar as funções com o novo contador antes da migration correspondente, pois elas falham fechadas.
3. Configurar GEMINI_API_KEY nos secrets do ambiente da função, de um projeto do provedor com billing adequado. Não colar a chave em chat nem adicioná-la ao frontend/repositório. Sem essa configuração, a UI informa indisponibilidade e nenhuma geração é iniciada.
4. Confirmar com o produto a regra de quota por organização, incluindo múltiplas organizações e a assinatura legada por usuário. Não se apresenta quota como teto global da conta do provedor: configurar também orçamento/alertas no provedor.
5. Validar API, JWT, RLS, isolamento e duas submissões reais concorrentes em staging; o provedor foi mockado em todos os testes desta etapa, sem cobrança.
6. Estados started/uncertain antigos precisam de operação/reconciliação conservadora. Não liberar automaticamente uma chamada cujo processamento/custo não foi confirmado.
7. Webhooks, idempotência de checkout, cancelamento confirmado, pagamentos sandbox, SMTP e revisão autenticada completa continuam pendentes. A landing não foi alterada nesta etapa.

Referências primárias usadas: https://ai.google.dev/gemini-api/docs/models/gemini-3.8-flash e https://ai.google.dev/api/generate-content.
