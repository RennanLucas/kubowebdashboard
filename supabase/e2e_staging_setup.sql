-- SCRIPT DINÂMICO PARA CRIAÇÃO DE DADOS E2E NO STAGING
-- 
-- INSTRUÇÕES:
-- 1. No Supabase Dashboard (STAGING), vá em Authentication > Users.
-- 2. Delete os usuários e2e_owner@example.test e e2e_viewer@example.test se eles existirem (para limpar as tentativas anteriores falhas).
-- 3. Clique em "Add User" -> "Create New User". 
--    Crie: e2e_owner@example.test com a senha: sua_senha_real_aqui_123 (Marque "Auto Confirm User")
--    Crie: e2e_viewer@example.test com a senha: sua_senha_real_aqui_123 (Marque "Auto Confirm User")
-- 4. Depois que eles aparecerem na lista, execute este script no SQL Editor!

DO $$ 
DECLARE 
  owner_id UUID;
  viewer_id UUID;
BEGIN
  -- Busca os IDs dinâmicos gerados pelo GoTrue
  SELECT id INTO owner_id FROM auth.users WHERE email = 'e2e_owner@example.test';
  SELECT id INTO viewer_id FROM auth.users WHERE email = 'e2e_viewer@example.test';
  
  IF owner_id IS NULL OR viewer_id IS NULL THEN
    RAISE EXCEPTION 'Usuários não encontrados! Crie os usuários e2e_owner@example.test e e2e_viewer@example.test no painel de Authentication primeiro.';
  END IF;

  -- 1. Criação das Organizações e Memberships
  INSERT INTO public.organizations (id, name, slug)
  VALUES ('c1111111-e2e0-e2e0-e2e0-e2e000000001', 'E2E Org 1', 'e2e-org-1')
  ON CONFLICT (id) DO NOTHING;

  -- 2. Adiciona os Memberships
  INSERT INTO public.organization_members (organization_id, user_id, role)
  VALUES 
    ('c1111111-e2e0-e2e0-e2e0-e2e000000001', owner_id, 'owner'),
    ('c1111111-e2e0-e2e0-e2e0-e2e000000001', viewer_id, 'viewer')
  ON CONFLICT DO NOTHING;

  -- 3. Criação do Cliente Legado (Para satisfazer a constraint NOT NULL do client_id temporariamente mantida na Fase 3.1)
  INSERT INTO public.clients (id, user_id, company_name)
  VALUES ('c2222222-e2e0-e2e0-e2e0-e2e000000001', owner_id, 'E2E Client Legacy')
  ON CONFLICT (id) DO NOTHING;

  -- 4. Criação do Projeto E2E
  INSERT INTO public.projects (id, client_id, organization_id, name, url)
  VALUES ('d1111111-e2e0-e2e0-e2e0-e2e000000001', 'c2222222-e2e0-e2e0-e2e0-e2e000000001', 'c1111111-e2e0-e2e0-e2e0-e2e000000001', 'E2E Project', 'https://e2e.test')
  ON CONFLICT (id) DO NOTHING;

  -- 5. Subscriptions E2E (Cenário C e Normal)
  INSERT INTO public.subscriptions (
    id, user_id, organization_id, stripe_subscription_id, stripe_customer_id, product_id, price_id, status, environment, current_period_start, current_period_end
  )
  VALUES
    ('f1111111-e2e0-e2e0-e2e0-e2e000000001', owner_id, NULL, 'mp_e2e_ambiguous', 'mp_e2e_cust_amb', 'kuboweb_pro', 'kuboweb_pro', 'active', 'live', now() - interval '10 days', now() + interval '20 days')
  ON CONFLICT (id) DO NOTHING;

END $$;
