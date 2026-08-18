-- SEED: Dados Sintéticos Legados para STAGING
-- Este script simula o banco de dados ANTES da Fase 3.1 e 3.3.
-- Todos os dados são fictícios e devem ser usados apenas em STAGING.

-- 1. Criação de Usuários Sintéticos (auth.users)
INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
VALUES
  ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'user_a@example.test', 'encrypted_password', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'user_b@example.test', 'encrypted_password', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('33333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'user_c@example.test', 'encrypted_password', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('44444444-4444-4444-4444-444444444444', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'user_d@example.test', 'encrypted_password', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('55555555-5555-5555-5555-555555555555', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'user_e@example.test', 'encrypted_password', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('66666666-6666-6666-6666-666666666666', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'user_f@example.test', 'encrypted_password', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('77777777-7777-7777-7777-777777777777', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'user_g@example.test', 'encrypted_password', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('88888888-8888-8888-8888-888888888888', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'user_h@example.test', 'encrypted_password', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('99999999-9999-9999-9999-999999999999', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'user_i@example.test', 'encrypted_password', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now())
ON CONFLICT (id) DO NOTHING;

-- 2. Criação de Clients (Representa o modelo Antigo)
INSERT INTO public.clients (id, user_id, company_name)
VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'Company A'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', 'Company B'),
  ('cccccccc-cccc-cccc-cccc-cccccccccc01', '33333333-3333-3333-3333-333333333333', 'Company C1 (Ambigua)'),
  ('cccccccc-cccc-cccc-cccc-cccccccccc02', '33333333-3333-3333-3333-333333333333', 'Company C2 (Ambigua)'),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', '44444444-4444-4444-4444-444444444444', 'Company D'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '55555555-5555-5555-5555-555555555555', 'Company E'),
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', '66666666-6666-6666-6666-666666666666', 'Company F'),
  ('a0000007-a007-a007-a007-a00000000007', '77777777-7777-7777-7777-777777777777', 'Company G'),
  ('a0000008-a008-a008-a008-a00000000008', '88888888-8888-8888-8888-888888888888', 'Company H'),
  ('a0000009-a009-a009-a009-a00000000009', '99999999-9999-9999-9999-999999999999', 'Company I')
ON CONFLICT (id) DO NOTHING;

-- 3. Criação de Projects (Websites)
INSERT INTO public.projects (id, client_id, name, url)
VALUES
  ('aaaa0000-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Project A', 'https://a.test'),
  ('bbbb0000-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Project B', 'https://b.test'),
  ('cccc0001-cccc-cccc-cccc-cccccccccccc', 'cccccccc-cccc-cccc-cccc-cccccccccc01', 'Project C1', 'https://c1.test'),
  ('cccc0002-cccc-cccc-cccc-cccccccccccc', 'cccccccc-cccc-cccc-cccc-cccccccccc02', 'Project C2', 'https://c2.test'),
  ('dddd0000-dddd-dddd-dddd-dddddddddddd', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'Project D', 'https://d.test'),
  ('eeee0000-eeee-eeee-eeee-eeeeeeeeeeee', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Project E', 'https://e.test'),
  -- F propositalmente não tem projeto.
  ('00000007-0007-0007-0007-000000000007', 'a0000007-a007-a007-a007-a00000000007', 'Project G', 'https://g.test'),
  -- H propositalmente não tem projeto.
  ('00000009-0009-0009-0009-000000000001', 'a0000009-a009-a009-a009-a00000000009', 'Project I1', 'https://i1.test'),
  ('00000009-0009-0009-0009-000000000002', 'a0000009-a009-a009-a009-a00000000009', 'Project I2', 'https://i2.test')
ON CONFLICT (id) DO NOTHING;

-- 4. Criação de Subscriptions Legadas (Atreladas apenas ao user_id)
INSERT INTO public.subscriptions (id, user_id, stripe_subscription_id, stripe_customer_id, product_id, price_id, status, environment, current_period_start, current_period_end)
VALUES
  ('11111111-0000-0000-0000-111111111111', '11111111-1111-1111-1111-111111111111', 'mp_staging_sub_org_a_001', 'mp_staging_cust_a', 'kuboweb_pro', 'kuboweb_pro', 'active', 'live', now() - interval '10 days', now() + interval '20 days'),
  ('22222222-0000-0000-0000-222222222222', '22222222-2222-2222-2222-222222222222', 'mp_staging_sub_org_b_001', 'mp_staging_cust_b', 'kuboweb_pro', 'kuboweb_pro', 'active', 'live', now() - interval '5 days', now() + interval '25 days'),
  ('33333333-0000-0000-0000-333333333333', '33333333-3333-3333-3333-333333333333', 'mp_staging_sub_org_c_001', 'mp_staging_cust_c', 'kuboweb_pro', 'kuboweb_pro', 'active', 'live', now() - interval '2 days', now() + interval '28 days'),
  ('44444444-0000-0000-0000-444444444444', '44444444-4444-4444-4444-444444444444', 'mp_staging_sub_org_d_001', 'mp_staging_cust_d', 'kuboweb_pro', 'kuboweb_pro', 'canceled', 'live', now() - interval '40 days', now() - interval '10 days'),
  ('55555555-0000-0000-0000-555555555555', '55555555-5555-5555-5555-555555555555', 'mp_staging_sub_org_e_001', 'mp_staging_cust_e', 'kuboweb_pro', 'kuboweb_pro', 'pending', 'live', now(), now() + interval '30 days'),
  ('66666666-0000-0000-0000-666666666666', '66666666-6666-6666-6666-666666666666', 'mp_staging_sub_org_f_001', 'mp_staging_cust_f', 'kuboweb_pro', 'kuboweb_pro', 'active', 'live', now() - interval '1 days', now() + interval '29 days'),
  ('99999999-0000-0000-0000-999999999999', '99999999-9999-9999-9999-999999999999', 'mp_staging_sub_org_i_001', 'mp_staging_cust_i', 'kuboweb_pro', 'kuboweb_pro', 'active', 'live', now() - interval '15 days', now() + interval '15 days')
ON CONFLICT (id) DO NOTHING;

-- 5. Criação Sintética de Analytics (Para isolamento)
INSERT INTO public.pageviews (id, project_id, page_path, session_id, created_at)
VALUES
  ('c0000000-0000-0000-0000-000000000001', 'aaaa0000-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '/', 'sess_a1', now()),
  ('c0000000-0000-0000-0000-000000000002', 'aaaa0000-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '/about', 'sess_a1', now()),
  ('c0000000-0000-0000-0000-000000000003', 'bbbb0000-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '/', 'sess_b1', now())
ON CONFLICT DO NOTHING;

INSERT INTO public.events (id, project_id, event_type, event_label, session_id, created_at)
VALUES
  ('e0000000-0000-0000-0000-000000000001', 'aaaa0000-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'click', 'signup_button', 'sess_a1', now()),
  ('e0000000-0000-0000-0000-000000000002', 'bbbb0000-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'scroll', 'footer', 'sess_b1', now())
ON CONFLICT DO NOTHING;
