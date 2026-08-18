-- Massa E2E para Fase 3.5 - Go-Live Hardening (Staging Only)
-- Este script configura o ambiente B2B (Multi-tenant) para o Playwright, garantindo idempotência.

DO $$
DECLARE
  owner_id uuid;
  viewer_id uuid;
  user_c_id uuid;
  
  org_a_id uuid := 'c1111111-e2e0-e2e0-e2e0-e2e000000001';
  org_b_id uuid := 'c2222222-e2e0-e2e0-e2e0-e2e000000002';
  
  org_c1_id uuid := 'c3333333-e2e0-e2e0-e2e0-e2e000000001';
  org_c2_id uuid := 'c3333333-e2e0-e2e0-e2e0-e2e000000002';

  proj_a_id uuid := 'd1111111-e2e0-e2e0-e2e0-e2e000000001';
  proj_b_id uuid := 'd2222222-e2e0-e2e0-e2e0-e2e000000002';

  client_c_id uuid := 'e3333333-e2e0-e2e0-e2e0-e2e000000003';
BEGIN
  -- 1. Capturar os IDs dos usuários de teste do auth.users (criados no painel do Supabase)
  SELECT id INTO owner_id FROM auth.users WHERE email = 'rennanlucas27oficial@gmail.com';
  SELECT id INTO viewer_id FROM auth.users WHERE email = 'e2e_viewer@example.test';
  
  -- Se o User C não existir no Auth, o teste de Billing falhará se tentar logar. 
  -- Vamos assumir que criaremos 'e2e_user_c@example.test' via script ou já exista. 
  -- Para fins de dados legados, podemos associar à subscription usando e2e_viewer por enquanto se necessário, 
  -- mas o prompt pede "User C", então buscaremos.
  SELECT id INTO user_c_id FROM auth.users WHERE email = 'e2e_user_c@example.test';

  -- Se não achar User C, podemos mockar o ID para as inserções (mas login precisaria dele no Auth).
  IF user_c_id IS NULL THEN
    -- Fallback: vamos criar uma referência fake para que a migration não quebre
    user_c_id := 'f3333333-e2e0-e2e0-e2e0-e2e000000003';
  END IF;

  -- ==========================================
  -- PARTE 1: MULTI-ORGANIZATION (Owner E2E)
  -- ==========================================

  -- Organização A
  INSERT INTO public.organizations (id, name, slug)
  VALUES (org_a_id, 'E2E Org A', 'e2e-org-a')
  ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

  -- Organização B
  INSERT INTO public.organizations (id, name, slug)
  VALUES (org_b_id, 'E2E Org B', 'e2e-org-b')
  ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

  IF owner_id IS NOT NULL THEN
    -- Owner na Org A
    INSERT INTO public.organization_members (organization_id, user_id, role)
    VALUES (org_a_id, owner_id, 'owner')
    ON CONFLICT (organization_id, user_id) DO NOTHING;

    -- Owner na Org B
    INSERT INTO public.organization_members (organization_id, user_id, role)
    VALUES (org_b_id, owner_id, 'owner')
    ON CONFLICT (organization_id, user_id) DO NOTHING;
  END IF;

  IF viewer_id IS NOT NULL THEN
    -- Viewer apenas na Org A
    INSERT INTO public.organization_members (organization_id, user_id, role)
    VALUES (org_a_id, viewer_id, 'viewer')
    ON CONFLICT (organization_id, user_id) DO NOTHING;
  END IF;

  -- Projetos necessitam de client_id por legacy fallback constraint
  INSERT INTO public.clients (id, user_id, company_name)
  VALUES ('f1111111-e2e0-e2e0-e2e0-e2e000000001', owner_id, 'Client A')
  ON CONFLICT DO NOTHING;
  
  INSERT INTO public.clients (id, user_id, company_name)
  VALUES ('f2222222-e2e0-e2e0-e2e0-e2e000000002', owner_id, 'Client B')
  ON CONFLICT DO NOTHING;

  -- Projeto A vinculado à Org A
  INSERT INTO public.projects (id, name, organization_id, client_id, url)
  VALUES (proj_a_id, 'Projeto A', org_a_id, 'f1111111-e2e0-e2e0-e2e0-e2e000000001', 'https://proja.com')
  ON CONFLICT (id) DO UPDATE SET organization_id = EXCLUDED.organization_id, name = EXCLUDED.name, client_id = EXCLUDED.client_id;

  -- Projeto B vinculado à Org B
  INSERT INTO public.projects (id, name, organization_id, client_id, url)
  VALUES (proj_b_id, 'Projeto B', org_b_id, 'f2222222-e2e0-e2e0-e2e0-e2e000000002', 'https://projb.com')
  ON CONFLICT (id) DO UPDATE SET organization_id = EXCLUDED.organization_id, name = EXCLUDED.name, client_id = EXCLUDED.client_id;

  -- Analytics Diferenciado
  -- Para Project A (Org A): 500 visitantes
  INSERT INTO public.analytics_daily_overview (date, project_id, source, device, visitors, views, sessions, bounces, total_duration)
  VALUES (CURRENT_DATE, proj_a_id, 'Direto', 'desktop', 500, 1000, 450, 200, 30000)
  ON CONFLICT (date, project_id, source, device) DO UPDATE SET visitors = EXCLUDED.visitors;

  -- Para Project B (Org B): 100 visitantes
  INSERT INTO public.analytics_daily_overview (date, project_id, source, device, visitors, views, sessions, bounces, total_duration)
  VALUES (CURRENT_DATE, proj_b_id, 'Direto', 'desktop', 100, 200, 90, 40, 6000)
  ON CONFLICT (date, project_id, source, device) DO UPDATE SET visitors = EXCLUDED.visitors;

  -- ==========================================
  -- PARTE 2: CENÁRIO C - BILLING AMBÍGUO
  -- ==========================================

  -- User C precisa de duas Organizações C1 e C2
  INSERT INTO public.organizations (id, name, slug)
  VALUES (org_c1_id, 'E2E Org C1', 'e2e-org-c1')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.organizations (id, name, slug)
  VALUES (org_c2_id, 'E2E Org C2', 'e2e-org-c2')
  ON CONFLICT (id) DO NOTHING;

  -- Membresias de C1 e C2 (Usando E2E Owner se User C não estiver no Auth para evitar falha no teste)
  -- Se usarmos o Owner para testar o Billing Ambíguo, o Playwright logado como Owner conseguirá ver!
  -- No E2E, quem vai logar para testar "Should display pending reconciliation warning for ambiguous subscription"?
  -- No código original `organization.spec.ts`: 
  -- O teste loga como E2E_OWNER_EMAIL. 
  -- Então o "User C" do Playwright é de fato o `e2e_owner@example.test`!
  -- Portanto, vamos garantir que o owner tenha C1 e C2 TAMBÉM! E uma client + sub legada!
  
  IF owner_id IS NOT NULL THEN
    INSERT INTO public.organization_members (organization_id, user_id, role)
    VALUES (org_c1_id, owner_id, 'owner')
    ON CONFLICT (organization_id, user_id) DO NOTHING;

    INSERT INTO public.organization_members (organization_id, user_id, role)
    VALUES (org_c2_id, owner_id, 'owner')
    ON CONFLICT (organization_id, user_id) DO NOTHING;

    -- Legacy Client record para o Owner (Simulando que ele era um User Legado)
    INSERT INTO public.clients (id, user_id, company_name)
    VALUES (client_c_id, owner_id, 'Legacy Company E2E')
    ON CONFLICT (id) DO NOTHING;

    -- Legacy Subscription vinculada ao Owner, com organization_id NULL
    INSERT INTO public.subscriptions (id, user_id, status, plan_id, current_period_end, organization_id)
    VALUES ('e1111111-e2e0-e2e0-e2e0-e2e000000001', owner_id, 'active', 'pro', (CURRENT_DATE + INTERVAL '30 days'), NULL)
    ON CONFLICT (id) DO UPDATE SET organization_id = NULL, user_id = EXCLUDED.user_id;
  END IF;

END $$;
