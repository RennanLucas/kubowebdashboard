# Auditoria de prontidão — 15/09/2026

## Resultado local

O código está consistente e pronto para ser promovido a uma homologação isolada. Não está liberado para produção até concluir os testes reais de autenticação, RLS, e-mail e Mercado Pago no projeto de homologação.

### Verificações concluídas

- TypeScript: aprovado.
- ESLint: 0 erros; 219 avisos preexistentes/legados. Os avisos não bloqueiam o pipeline, mas permanecem como dívida técnica.
- Vitest: 64 arquivos e 752 testes aprovados.
- Cobertura: 83,38% statements; 81,27% branches; 82,09% functions; 85,16% lines.
- Build Vite: aprovado.
- PWA: 25 verificações aprovadas; 14 itens no precache, 1.341,52 KiB.
- E2E público/local: 21 testes aprovados. São 7 de landing/login/rota protegida e 14 de IA Pro, convite, tema claro padrão e persistência segura do convite.
- Dependências de produção: `npm audit --omit=dev` sem vulnerabilidades conhecidas.
- Funções Edge alteradas: verificação Deno aprovada para checkout, webhook, cancelamento, status, analytics, alertas, convites, tracking e hook de e-mail.
- `git diff --check`: sem erros de whitespace.

## Correções desta etapa

- Separação de pagamentos `sandbox` e `live` no frontend, Edge Functions e banco.
- Credenciais de teste não podem recorrer silenciosamente a credenciais live.
- Referência externa do checkout vinculada a ambiente, organização, plano e usuário.
- URL de checkout validada no cliente e no servidor.
- Webhook exige assinatura válida, confere tipo/ID, ambiente e recurso retornado pelo Mercado Pago.
- Atualização de assinatura atômica, idempotente e ordenada; eventos repetidos/antigos não duplicam nem retrocedem estado.
- Assinatura sem fim de período não concede acesso Pro ilimitado.
- Cancelamento só é gravado localmente após confirmação do provedor.
- Falhas de consulta de assinatura não são mais interpretadas como plano Gratuito nem oferecem nova compra por engano.
- Trial Pro automático no cadastro removido; novos usuários começam Gratuito.
- Acesso Pro/IA fica limitado a assinatura válida e ao limite atômico configurado.
- Convites pendentes duplicados bloqueados; revogação preserva o histórico; Brevo usado quando configurado.
- Alertas por e-mail passaram a contabilizar somente mensagens realmente enviadas.
- Service worker só registra no domínio oficial e o precache foi reduzido.
- URLs antigas da plataforma anterior removidas das rotas e metadados operacionais.
- Trigger que concedia administrador por endereço de e-mail removido; papéis elevados passam a exigir concessão deliberada pelo serviço.
- Senha literal removida do teste E2E atual.

## Bloqueadores externos antes de clientes

1. Criar ou informar um projeto Supabase de homologação. O projeto antigo referenciado pelos E2E não está disponível na conta conectada.
2. Configurar segredos sandbox e aplicar as migrações nesse projeto.
3. Executar E2E autenticado com duas organizações e dois usuários reais de teste. Sem isso, RLS e todas as telas autenticadas não foram validadas ponta a ponta nesta revisão.
4. Validar checkout, webhook, renovação e cancelamento no Mercado Pago de teste, sem cobrança, seguindo `docs/HOMOLOGACAO-SEM-COBRANCA.md`.
5. Validar entrega real de login, convite e alerta no Brevo de teste.
6. Rotacionar a senha da conta E2E que apareceu no histórico Git e remover os arquivos `.env*` antigos do histórico em uma janela coordenada. O código atual está limpo, mas apagar apenas no commit atual não apaga versões anteriores.
7. Rodar novamente os Security Advisors do Supabase depois da aplicação das novas migrações.

## Itens não executados

- Nenhuma migração foi aplicada remotamente.
- Nenhuma função Edge foi publicada.
- Nenhuma prévia/produção foi implantada.
- Nenhum pagamento, e-mail ou chamada Gemini real foi realizado.
- E2E autenticado foi bloqueado pela ausência de homologação e credenciais isoladas.
- Não houve merge nem push desta etapa.
