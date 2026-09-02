-- ============================================================================
-- SETUP E2E: TESTE DE ISOLAMENTO MULTI-TENANT (A <-> B)
-- ============================================================================
-- DIFERENTE do e2e_phase3_5_setup.sql!
--
-- Aquele setup faz UM owner dono das DUAS orgs (para testar o org-switcher).
-- Isso é INÚTIL para provar isolamento: se um user é dono de A e B, ele
-- legitimamente vê ambas e o teste nunca falharia mesmo com RLS quebrado.
--
-- AQUI: User A é dono SÓ da Org A. User B é dono SÓ da Org B.
-- Nenhum dos dois tem qualquer membership na org do outro.
-- Assim, qualquer linha de B que apareça para A é uma FALHA REAL de RLS.
--
-- PRÉ-REQUISITO: criar 2 usuários no painel do Supabase (Authentication > Users):
--   - User A  (ex: e2e_iso_a@example.test)
--   - User B  (ex: e2e_iso_b@example.test)
-- e trocar os e-mails abaixo pelos que você criou.
--
-- SEGURO PARA RODAR NOVAMENTE (idempotente).
-- RODAR SOMENTE EM STAGING.
-- ============================================================================

DO $$
DECLARE
  user_a_id uuid;
  user_b_id uuid;

  -- IDs fixos (batem com os defaults do spec multi-tenant-isolation.spec.ts)
  org_a_id     uuid := 'c1111111-e2e0-e2e0-e2e0-e2e000000001';
  org_b_id     uuid := 'c2222222-e2e0-e2e0-e2e0-e2e000000002';
  proj_a_id    uuid := 'd1111111-e2e0-e2e0-e2e0-e2e000000001';
  proj_b_id    uuid := 'd2222222-e2e0-e2e0-e2e0-e2e000000002';
  client_a_id  uuid := 'f1111111-e2e0-e2e0-e2e0-e2e000000001';
  client_b_id  uuid := 'f2222222-e2e0-e2e0-e2e0-e2e000000002';
  sub_a_id     uuid := 'a1111111-e2e0-e2e0-e2e0-e2e000000001';
  sub_b_id     uuid := 'a2222222-e2e0-e2e0-e2e0-e2e000000002';
BEGIN
  -- >>>> TROQUE OS E-MAILS ABAIXO PELOS QUE VOCÊ CRIOU NO PAINEL <<<<
  SELECT id INTO user_a_id FROM auth.users WHERE email = 'e2e_iso_a@example.test';
  SELECT id INTO user_b_id FROM auth.users WHERE email = 'e2e_iso_b@example.test';

  IF user_a_id IS NULL OR user_b_id IS NULL THEN
    RAISE EXCEPTION 'Crie os dois usuários (User A e User B) no painel Auth antes de rodar. A=%, B=%', user_a_id, user_b_id;
  END IF;

  -- ==========================================================================
  -- ORGANIZAÇÕES
  -- ==========================================================================
  INSERT INTO public.organizations (id, name, slug)
  VALUES (org_a_id, 'ISO Org A', 'iso-org-a')
  ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

  INSERT INTO public.organizations (id, name, slug)
  VALUES (org_b_id, 'ISO Org B', 'iso-org-b')
  ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

  -- ==========================================================================
  -- MEMBERSHIPS — ESTRITAMENTE ISOLADAS
  --   User A = owner SÓ da Org A
  --   User B = owner SÓ da Org B
  -- ==========================================================================
  -- Limpa qualquer membership cruzada dos dois users nessas orgs (idempotência)
  DELETE FROM public.organization_members
   WHERE organization_id IN (org_a_id, org_b_id)
     AND user_id IN (user_a_id, user_b_id);

  INSERT INTO public.organization_members (organization_id, user_id, role)
  VALUES (org_a_id, user_a_id, 'owner');

  INSERT INTO public.organization_members (organization_id, user_id, role)
  VALUES (org_b_id, user_b_id, 'owner');

  -- ==========================================================================
  -- CLIENTS (legacy fallback exigido pelo FK de projects.client_id)
  -- ==========================================================================
  INSERT INTO public.clients (id, user_id, company_name)
  VALUES (client_a_id, user_a_id, 'ISO Client A')
  ON CONFLICT (id) DO UPDATE SET user_id = EXCLUDED.user_id;

  INSERT INTO public.clients (id, user_id, company_name)
  VALUES (client_b_id, user_b_id, 'ISO Client B')
  ON CONFLICT (id) DO UPDATE SET user_id = EXCLUDED.user_id;

  -- ==========================================================================
  -- PROJECTS
  -- ==========================================================================
  INSERT INTO public.projects (id, name, organization_id, client_id, url)
  VALUES (proj_a_id, 'ISO Projeto A', org_a_id, client_a_id, 'https://iso-a.com')
  ON CONFLICT (id) DO UPDATE
    SET organization_id = EXCLUDED.organization_id,
        client_id = EXCLUDED.client_id,
        name = EXCLUDED.name;

  INSERT INTO public.projects (id, name, organization_id, client_id, url)
  VALUES (proj_b_id, 'ISO Projeto B', org_b_id, client_b_id, 'https://iso-b.com')
  ON CONFLICT (id) DO UPDATE
    SET organization_id = EXCLUDED.organization_id,
        client_id = EXCLUDED.client_id,
        name = EXCLUDED.name;

  -- ==========================================================================
  -- ANALYTICS CONHECIDOS (números controlados p/ o teste cross-org)
  --   Org A (Projeto A): 100 visitantes / 10 leads
  --   Org B (Projeto B): 500 visitantes / 50 leads
  -- ==========================================================================
  -- Overview
  INSERT INTO public.analytics_daily_overview (date, project_id, source, device, visitors, views, sessions, bounces, total_duration)
  VALUES (CURRENT_DATE, proj_a_id, 'Direto', 'desktop', 100, 200, 90, 40, 6000)
  ON CONFLICT (project_id, date, source, device) DO UPDATE SET visitors = EXCLUDED.visitors, views = EXCLUDED.views;

  INSERT INTO public.analytics_daily_overview (date, project_id, source, device, visitors, views, sessions, bounces, total_duration)
  VALUES (CURRENT_DATE, proj_b_id, 'Direto', 'desktop', 500, 1000, 450, 200, 30000)
  ON CONFLICT (project_id, date, source, device) DO UPDATE SET visitors = EXCLUDED.visitors, views = EXCLUDED.views;

  -- Pages
  INSERT INTO public.analytics_daily_pages (date, project_id, source, device, page_path, views, visitors, sessions, bounces, total_duration)
  VALUES (CURRENT_DATE, proj_a_id, 'Direto', 'desktop', '/a-only', 200, 100, 90, 40, 6000)
  ON CONFLICT (project_id, date, source, device, page_path) DO UPDATE SET views = EXCLUDED.views;

  INSERT INTO public.analytics_daily_pages (date, project_id, source, device, page_path, views, visitors, sessions, bounces, total_duration)
  VALUES (CURRENT_DATE, proj_b_id, 'Direto', 'desktop', '/b-only', 1000, 500, 450, 200, 30000)
  ON CONFLICT (project_id, date, source, device, page_path) DO UPDATE SET views = EXCLUDED.views;

  -- Geo
  INSERT INTO public.analytics_daily_geo (date, project_id, source, device, country, city, views, visitors)
  VALUES (CURRENT_DATE, proj_a_id, 'Direto', 'desktop', 'BR', 'Sao Paulo', 200, 100)
  ON CONFLICT (project_id, date, source, device, country, city) DO UPDATE SET views = EXCLUDED.views;

  INSERT INTO public.analytics_daily_geo (date, project_id, source, device, country, city, views, visitors)
  VALUES (CURRENT_DATE, proj_b_id, 'Direto', 'desktop', 'BR', 'Rio de Janeiro', 1000, 500)
  ON CONFLICT (project_id, date, source, device, country, city) DO UPDATE SET views = EXCLUDED.views;

  -- Tech
  INSERT INTO public.analytics_daily_tech (date, project_id, source, device, browser, os, views, visitors)
  VALUES (CURRENT_DATE, proj_a_id, 'Direto', 'desktop', 'Chrome', 'Windows', 200, 100)
  ON CONFLICT (project_id, date, source, device, browser, os) DO UPDATE SET views = EXCLUDED.views;

  INSERT INTO public.analytics_daily_tech (date, project_id, source, device, browser, os, views, visitors)
  VALUES (CURRENT_DATE, proj_b_id, 'Direto', 'desktop', 'Firefox', 'Linux', 1000, 500)
  ON CONFLICT (project_id, date, source, device, browser, os) DO UPDATE SET views = EXCLUDED.views;

  -- Events (leads)
  INSERT INTO public.analytics_daily_events (date, project_id, source, device, event_type, count)
  VALUES (CURRENT_DATE, proj_a_id, 'Direto', 'desktop', 'lead', 10)
  ON CONFLICT (project_id, date, source, device, event_type) DO UPDATE SET count = EXCLUDED.count;

  INSERT INTO public.analytics_daily_events (date, project_id, source, device, event_type, count)
  VALUES (CURRENT_DATE, proj_b_id, 'Direto', 'desktop', 'lead', 50)
  ON CONFLICT (project_id, date, source, device, event_type) DO UPDATE SET count = EXCLUDED.count;

  -- ==========================================================================
  -- PAGEVIEWS / EVENTS (tabelas base) — uma linha conhecida por projeto
  -- ==========================================================================
  INSERT INTO public.pageviews (project_id, page_path, session_id, country)
  VALUES (proj_a_id, '/a-only', 'sess-a', 'BR');

  INSERT INTO public.pageviews (project_id, page_path, session_id, country)
  VALUES (proj_b_id, '/b-only', 'sess-b', 'BR');

  INSERT INTO public.events (project_id, event_type, event_label, page_path, session_id)
  VALUES (proj_a_id, 'lead', 'A lead', '/a-only', 'sess-a');

  INSERT INTO public.events (project_id, event_type, event_label, page_path, session_id)
  VALUES (proj_b_id, 'lead', 'B lead', '/b-only', 'sess-b');

  -- ==========================================================================
  -- SUBSCRIPTIONS (uma por org, isoladas)
  -- ==========================================================================
  INSERT INTO public.subscriptions (id, user_id, organization_id, status, plan_id, current_period_end)
  VALUES (sub_a_id, user_a_id, org_a_id, 'active', 'pro', CURRENT_DATE + INTERVAL '30 days')
  ON CONFLICT (id) DO UPDATE SET organization_id = EXCLUDED.organization_id, user_id = EXCLUDED.user_id;

  INSERT INTO public.subscriptions (id, user_id, organization_id, status, plan_id, current_period_end)
  VALUES (sub_b_id, user_b_id, org_b_id, 'active', 'pro', CURRENT_DATE + INTERVAL '30 days')
  ON CONFLICT (id) DO UPDATE SET organization_id = EXCLUDED.organization_id, user_id = EXCLUDED.user_id;

  RAISE NOTICE 'Setup de isolamento OK. User A (%) = Org A. User B (%) = Org B.', user_a_id, user_b_id;
END $$;

-- ============================================================================
-- VERIFICAÇÃO RÁPIDA (rode como service_role no SQL editor):
--   SELECT om.role, o.name, u.email
--   FROM organization_members om
--   JOIN organizations o ON o.id = om.organization_id
--   JOIN auth.users u ON u.id = om.user_id
--   WHERE o.slug IN ('iso-org-a','iso-org-b');
-- Esperado: 2 linhas, cada user dono de UMA org só.
-- ============================================================================
