-- TESTE DE CONCORRÊNCIA DA RPC JIT (aggregate_analytics_jit)
-- Instruções: Rodar este script simultaneamente em múltiplas abas/sessions usando pgbench ou transações paralelas.
-- Para teste local no pgAdmin ou DataGrip, abra 50 abas e execute.

-- 1. Simulamos a inserção de 10.000 eventos crus
-- (Apenas uma vez)
-- INSERT INTO pageviews (project_id, page_path, created_at)
-- SELECT 'test-project', '/home', NOW() - (random() * interval '1 hour')
-- FROM generate_series(1, 10000);

-- 2. Execução da JIT em transação local
BEGIN;
-- Essa chamada invoca a agregação. A função interna deve usar SELECT ... FOR UPDATE SKIP LOCKED
-- nas linhas de pageviews e realizar o UPSERT.
SELECT aggregate_analytics_jit('test-project');
COMMIT;

-- 3. Verificação de consistência
-- Após rodar as N conexões simultâneas, validamos se a soma dos rollups é idêntica ao total cru.
-- SELECT 
--   (SELECT COUNT(*) FROM pageviews WHERE project_id = 'test-project') as raw_total,
--   (SELECT SUM(views) FROM daily_rollups WHERE project_id = 'test-project') as rollup_total;
-- Se raw_total != rollup_total, há um Race Condition ocorrendo.
