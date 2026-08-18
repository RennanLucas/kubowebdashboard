-- 1. Identificar usuários recentes na tabela auth.users
SELECT '1. AUTH USERS RECENTES' as audit_step;
SELECT id, email, created_at, last_sign_in_at 
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 5;

-- 2 & 3 & 4. Verificar Organizações e Membros
SELECT '2. ORGANIZATIONS' as audit_step;
SELECT id, name, legacy_client_id FROM public.organizations LIMIT 5;

SELECT '3. ORGANIZATION MEMBERS' as audit_step;
SELECT id, organization_id, user_id, role FROM public.organization_members LIMIT 5;

SELECT '4. CLIENTS' as audit_step;
SELECT id, user_id, company_name, domain FROM public.clients LIMIT 5;

SELECT '5. PROJECTS' as audit_step;
SELECT id, client_id, organization_id, name FROM public.projects LIMIT 5;

SELECT '6. SUBSCRIPTIONS' as audit_step;
SELECT id, organization_id, status FROM public.subscriptions LIMIT 5;

-- 5. Verificar Políticas RLS ativas
SELECT '7. RLS POLICIES' as audit_step;
SELECT tablename, policyname, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('organizations', 'organization_members', 'clients', 'projects', 'subscriptions');
