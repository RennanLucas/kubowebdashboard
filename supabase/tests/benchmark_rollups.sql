-- Script de Benchmark de Agregação JIT (Kubo Web Analytics)
-- Este script gera dados sintéticos progressivos e mede o tempo de agregação.

-- Desativa NOTICE para não poluir o output
SET client_min_messages TO WARNING;

DO $$
DECLARE
  v_project_id UUID := gen_random_uuid();
  v_start_time TIMESTAMPTZ;
  v_end_time TIMESTAMPTZ;
  v_duration_ms NUMERIC;
  v_batch_size INT;
  v_total_inserted INT := 0;
  v_batches INT[] := ARRAY[100000, 400000, 500000]; -- Progressivo: 100k, 500k total, 1M total
BEGIN
  RAISE WARNING '=========================================';
  RAISE WARNING 'INICIANDO BENCHMARK PROGRESSIVO (JIT ROLLUP)';
  RAISE WARNING '=========================================';

  -- Cria projeto sintético para o teste
  INSERT INTO public.projects (id, name, client_id) 
  VALUES (v_project_id, 'Benchmark Project', (SELECT id FROM public.clients LIMIT 1));

  FOREACH v_batch_size IN ARRAY v_batches
  LOOP
    RAISE WARNING '-----------------------------------------';
    RAISE WARNING '1. Inserindo % novas linhas (RAW Data)...', v_batch_size;
    
    INSERT INTO public.pageviews (project_id, created_at, referrer, user_agent, page_path, country)
    SELECT 
      v_project_id,
      now() - (random() * interval '30 days'),
      CASE floor(random() * 5)
        WHEN 0 THEN 'https://google.com'
        WHEN 1 THEN 'https://instagram.com'
        WHEN 2 THEN 'https://facebook.com'
        WHEN 3 THEN 'https://linkedin.com'
        ELSE 'https://meusite.com'
      END,
      CASE floor(random() * 4)
        WHEN 0 THEN 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/114.0'
        WHEN 1 THEN 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) Version/16.5 Mobile'
        WHEN 2 THEN 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1'
        ELSE 'Mozilla/5.0 (Linux; Android 13; SM-G991B) Chrome/114.0 Mobile'
      END,
      CASE floor(random() * 4)
        WHEN 0 THEN '/'
        WHEN 1 THEN '/sobre'
        WHEN 2 THEN '/contato'
        ELSE '/produtos'
      END,
      'BR'
    FROM generate_series(1, v_batch_size);

    v_total_inserted := v_total_inserted + v_batch_size;

    RAISE WARNING '2. Agregando % linhas pendentes...', v_batch_size;
    v_start_time := clock_timestamp();
    
    -- Chama a função JIT que fará a agregação pesada
    -- Usamos P_PROJECT_ID
    PERFORM public.aggregate_analytics_jit(v_project_id);
    
    v_end_time := clock_timestamp();
    v_duration_ms := extract(epoch from (v_end_time - v_start_time)) * 1000;

    RAISE WARNING '>> RESULTADO PARCIAL: Agregou % linhas em % ms', v_batch_size, v_duration_ms;
    RAISE WARNING '>> TOTAL ACUMULADO NO PROJETO: % linhas', v_total_inserted;
  END LOOP;

  RAISE WARNING '=========================================';
  RAISE WARNING 'BENCHMARK CONCLUÍDO COM SUCESSO';
  RAISE WARNING '=========================================';

  -- Limpeza (Rollback)
  DELETE FROM public.projects WHERE id = v_project_id;
END $$;
