-- Habilitar pg_cron para agendamento de tarefas no banco
-- OBS: Requer privilégios de superusuário no Supabase (postgres user)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Criar a função que deleta registros brutos antigos
CREATE OR REPLACE FUNCTION public.cleanup_old_raw_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_deleted_count INT;
  v_total_deleted INT := 0;
BEGIN
  -- 1. Deletar pageviews velhos (Mais de 60 dias)
  -- Deleta em lotes para não travar a tabela em produção
  LOOP
    WITH to_delete AS (
      SELECT id 
      FROM public.pageviews
      WHERE created_at < NOW() - INTERVAL '60 days'
      LIMIT 10000
      FOR UPDATE SKIP LOCKED
    )
    DELETE FROM public.pageviews
    WHERE id IN (SELECT id FROM to_delete);
    
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    v_total_deleted := v_total_deleted + v_deleted_count;
    
    EXIT WHEN v_deleted_count < 10000;
  END LOOP;
  
  RAISE NOTICE 'Deleted % old pageviews.', v_total_deleted;

  -- 2. Deletar events velhos (Mais de 60 dias)
  v_total_deleted := 0;
  LOOP
    WITH to_delete AS (
      SELECT id 
      FROM public.events
      WHERE created_at < NOW() - INTERVAL '60 days'
      LIMIT 10000
      FOR UPDATE SKIP LOCKED
    )
    DELETE FROM public.events
    WHERE id IN (SELECT id FROM to_delete);
    
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    v_total_deleted := v_total_deleted + v_deleted_count;
    
    EXIT WHEN v_deleted_count < 10000;
  END LOOP;

  RAISE NOTICE 'Deleted % old events.', v_total_deleted;
END;
$$;

-- Agendar a função para rodar toda madrugada às 03:00 AM
-- Usamos 'cron.schedule' que é a sintaxe do pg_cron
SELECT cron.schedule('cleanup-raw-data', '0 3 * * *', 'SELECT public.cleanup_old_raw_data()');
