# Correção dos dois alertas de segurança — 09/09/2026

Aplicada em `Kubo Web Analytics Production` (`gitzmynfamubetgujtmm`), PostgreSQL 17, mediante autorização do usuário. Migração `20260909060000` registrada como aplicada. Nenhum registro de negócio foi apagado ou alterado.

## Alterações

- `aggregation_status`: RLS ativado; privilégios de clientes e PUBLIC revogados; SELECT/INSERT/UPDATE/DELETE preservados para service_role. O job `aggregate_analytics_jit` permanece restrito ao serviço interno (essa restrição já existia na produção).
- `roadmap_item_votes`: view `security_invoker=true`, somente SELECT para authenticated entre os papéis de cliente. Apenas itens públicos são apresentados.
- A contagem global usa uma função privada restrita que retorna apenas um número, exige usuário autenticado e filtra itens públicos. Não concede leitura dos votos de outras organizações. O search_path da função é vazio e todos os objetos estão qualificados.
- Uma relação computada SECURITY INVOKER preserva a consulta já usada pelo frontend: `roadmap_item_votes(vote_count)`. Não foi necessário publicar uma nova interface.
- O schema `kubo_roadmap_private` não deve ser incluído nos schemas expostos pela Data API.

## Validação

- 25 verificações de permissão passaram em PostgreSQL isolado via PGlite 0.5.8, com dois usuários, votos públicos/privados, contagem zero, chamadas anônimas e operações de agregação. A migração foi aplicada duas vezes para verificar repetibilidade.
- O teste usa fixtures mínimas, não reproduz toda a instalação Supabase. Não equivale a E2E HTTP/PostgREST.
- Consulta autenticada da relação computada executada na produção em transação revertida, sem alterações de dados. A produção estava sem votos, portanto o cenário de contagem entre usuários foi validado no banco isolado.
- Verificação de catálogo na produção: RLS ligado, view invoker, leitura anônima da tabela negada, escrita de usuário negada, UPDATE e execução do job permitidos ao serviço.
- `supabase db advisors --linked --project-ref gitzmynfamubetgujtmm --type security --level error`: **No issues found**, lista de resultados vazia depois da aplicação.
- ESLint do script: passou. Sem alterações de React, dependências ou bundle; build/E2E da interface não foram repetidos nesta correção SQL.

## Reproduzir o teste isolado

Instalar `@electric-sql/pglite@0.5.8` em um diretório temporário fora do projeto. Definir `PGLITE_MODULE` como o caminho absoluto para `node_modules/@electric-sql/pglite/dist/index.js` dessa instalação e executar `node scripts/qa-security-advisors.mjs`.

## Limites de escopo

O resultado cobre os dois alertas enviados. Não afirma que todos os avisos de segurança de outros níveis foram eliminados e não resolve, por si só, o erro de limite de histórico ou a falha administrativa relatados anteriormente. Não houve merge na main nem alteração da landing.

Referências: [RLS e views no Supabase](https://supabase.com/docs/guides/database/postgres/row-level-security), [relações computadas no PostgREST](https://docs.postgrest.org/en/v14/references/api/resource_embedding.html#computed-relationships).
