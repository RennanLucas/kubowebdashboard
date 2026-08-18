# Homologação Local (Pré-Deploy)

Este documento contém os procedimentos exatos para validar e atestar a qualidade estrutural e de comportamento do projeto **Kubo Web Analytics** antes de considerá-lo apto para a Fase 3 ou para deploy de Produção.

> **Importante:** Estes comandos não puderam ser executados pelo assistente devido à ausência do runtime Node.js/npm no container atual. É responsabilidade do operador humano ou da esteira de CI/CD rodar estes passos e reportar o "PASS" definitivo.

## Passo a Passo de Execução

Abra um terminal na raiz do projeto e siga os comandos na ordem:

### 1. Instalação Limpa
Garante que todas as dependências do `package.json` estão consistentes.
```bash
npm install
```

### 2. Validação Estática (Typecheck & Lint)
Certifica que não há erros graves de tipagem (`any` perigosos que o TS consiga pegar) nem infrações de estilo/regras do React.
```bash
npm run typecheck
npm run lint
```
*Critério de Sucesso: Saída exit code 0, sem `Errors` estourados.*

### 3. Testes Unitários
Verifica as regras de negócio puras (ex: funções do tracker, `parseLeadValue`).
```bash
npm run test
```
*Critério de Sucesso: Todos os suítes apontando `PASS`.*

### 4. Build de Produção
Confirma que o Vite consegue empacotar os chunks sem estourar falhas de memória ou dependências circulares.
```bash
npm run build
```
*Critério de Sucesso: Pasta `dist` gerada com sucesso.*

### 5. Testes E2E (Playwright)
Garante que as rotas principais sobem e redirecionamentos críticos (Auth) ocorrem.
```bash
npx playwright install --with-deps
npx playwright test
```
*Critério de Sucesso: Relatório final verde para a suíte `smoke.spec.ts`.*

---

## Homologação de Banco de Dados

Para homologar a resiliência do I/O, execute o script SQL contido em `scratch/test_jit_concurrency.sql` apontando para o seu Supabase (Ambiente de Staging).

1. Abra o painel SQL Editor do Supabase Staging.
2. Copie e cole o conteúdo de `scratch/test_jit_concurrency.sql`.
3. Inicie 5 a 10 requisições concorrentes disparando a mesma chamada `SELECT aggregate_analytics_jit('test-project');`.
4. Valide se a soma agregada em `daily_rollups` bate idênticamente com as entradas de `pageviews`.

Se todos os critérios de sucesso acima passarem, o projeto estará **VALIDADO**.
