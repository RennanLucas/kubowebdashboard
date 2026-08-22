-- Migration: Rollup cron automático para todos os projetos ativos
-- Problema resolvido: aggregate_analytics_jit só era chamada JIT (no request do dashboard),
-- mas os dados brutos são deletados a cada 60 dias. Sem um cron regular, projetos que
-- não eram acessados ficavam com rollups desatualizados e dados > 60 dias sumiam do dashboard.
--
-- Solução: Rodar aggregate_analytics_jit para todos os projetos a cada 5 minutos.
-- Isso garante que os rollups estejam sempre atualizados independente do dashboard ser acessado.
-- A função já tem throttle interno (ignora se rodou há < 1 minuto), então é seguro chamar com frequência.

-- Função wrapper que agrega todos os projetos ativos de uma vez
CREATE OR REPLACE FUNCTION public.aggregate_all_projects()
RETURNS void AS $$
DECLARE
  p UUID;
BEGIN
  FOR p IN
    SELECT DISTINCT project_id
    FROM public.pageviews
    WHERE created_at > NOW() - INTERVAL '25 hours'
    UNION
    SELECT DISTINCT project_id
    FROM public.events
    WHERE created_at > NOW() - INTERVAL '25 hours'
  LOOP
    BEGIN
      PERFORM public.aggregate_analytics_jit(p);
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'aggregate_analytics_jit failed for project %: %', p, SQLERRM;
    END;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Agendar agregação automática a cada 5 minutos
-- (Só projetos com dados recentes são processados — eficiente mesmo com muitos projetos)
SELECT cron.schedule(
  'aggregate-all-projects',
  '*/5 * * * *',
  'SELECT public.aggregate_all_projects()'
);
