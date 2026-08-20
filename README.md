# Kubo Analytics

O Kubo Analytics é uma plataforma avançada de Web Analytics projetada para simplificar a análise de tráfego, conversões e engajamento.

## Stack Tecnológica
- **Frontend:** React, TypeScript, Vite, Tailwind CSS, shadcn/ui
- **Backend:** Supabase (PostgreSQL), Deno Edge Functions
- **Infra/PWA:** Vite PWA
- **Pagamentos:** Mercado Pago

## Arquitetura
A plataforma opera em uma arquitetura serverless em três camadas principais:
- **Client (Frontend):** PWA leve e rápido responsável pela visualização de dados via React Query.
- **Edge Functions (Deno):** Lida com pagamentos, AI Insights, computação pesada e envios de emails (Resend).
- **Database (PostgreSQL via Supabase):** RLS rigoroso para multi-tenancy e funções RPC (ex: JIT rollups) para agregação de dados.

## Desenvolvimento Local

```bash
# Instalar dependências (utilize npm)
npm install

# Rodar em ambiente de desenvolvimento
npm run dev
```

## Testes e Qualidade

O projeto utiliza múltiplas ferramentas para garantir a qualidade:
```bash
# Validação estática
npm run typecheck
npm run lint

# Testes unitários e PWA
npm run test
npm run qa:pwa

# Testes End-to-End (E2E)
npx playwright test
```

## Segurança
A segurança é garantida por:
- **RLS (Row Level Security):** Todas as consultas no banco de dados validam rigorosamente a qual organização e projeto o usuário logado tem acesso.
- **Server-side Plan Gating:** O limite de retenção de histórico (days) e as funcionalidades Pro são processadas e validadas diretamente nas Edge Functions (backend).
- **HMAC Signatures:** Webhooks de pagamento (Mercado Pago) utilizam Constant-time HMAC comparison.
- **Data Export:** As exportações de CSV e XLSX operam num formato data-to-sheet via biblioteca local, sem parsing de uploads maliciosos.

## Deploy
- O frontend é publicado automaticamente na Vercel através de CI/CD.
- Edge functions, migrations e banco de dados são publicados via Supabase CLI.
