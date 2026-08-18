-- FASE 2.4 - HARDENING DE ÍNDICES E PERFORMANCE
-- Os seguintes índices são criados para suportar especificamente a JIT RPC `aggregate_analytics_jit`
-- e as limpezas de TTL (pg_cron). O objetivo é eliminar Sequential Scans em tabelas volumosas.

-- 1. Índice composto primário para a JIT RPC
-- Benefício: A RPC `aggregate_analytics_jit` busca eventos crus filtrando por `project_id` e 
-- um delta de `created_at`. Este índice composto B-Tree previne Full Table Scans.
-- Custo de Inserção: Baixo, pois a chave inserida (created_at) é monotonicamente crescente (append-only like).
CREATE INDEX IF NOT EXISTS idx_pageviews_pid_created 
ON pageviews USING btree (project_id, created_at);

CREATE INDEX IF NOT EXISTS idx_events_pid_created 
ON events USING btree (project_id, created_at);

-- 2. Índice para TTL e limpezas
-- Benefício: Permite que o `pg_cron` do TTL varra a tabela procurando rapidamente registros muito antigos
-- para a janela de retenção (60 dias) sem varrer a tabela inteira (Sequential Scan).
-- Custo de Inserção: Baixo.
CREATE INDEX IF NOT EXISTS idx_pageviews_created_at 
ON pageviews USING btree (created_at);

CREATE INDEX IF NOT EXISTS idx_events_created_at 
ON events USING btree (created_at);

-- 3. Índices isolados para dimensões comuns (Opcional, mas útil para relatórios exploratórios não cacheados)
CREATE INDEX IF NOT EXISTS idx_pageviews_path ON pageviews USING btree (project_id, page_path);
CREATE INDEX IF NOT EXISTS idx_pageviews_referrer ON pageviews USING btree (project_id, referrer);
