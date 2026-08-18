-- 1. Executar a prévia somente leitura dos 4 registros de clients
SELECT '--- 1. CLIENTS A CONVERTER ---' AS step;
SELECT id, user_id, company_name, domain FROM public.clients;

-- 2. Confirmar projetos órfãos
SELECT '--- 2. PROJECTS A CONVERTER ---' AS step;
SELECT p.id as project_id, p.name as project_name, c.company_name as client_name, p.client_id
FROM public.projects p
JOIN public.clients c ON p.client_id = c.id
WHERE p.organization_id IS NULL;

-- 3. Validar se há duplicação no legacy_client_id nas organizações
SELECT '--- 3. LEGACY CLIENT ID (Deve estar vazio ou sem duplicadas dos clients atuais) ---' AS step;
SELECT legacy_client_id, count(*) FROM public.organizations 
WHERE legacy_client_id IN (SELECT id FROM public.clients)
GROUP BY legacy_client_id;

-- 4. Validar se role owner é válido na constraint de organization_members
SELECT '--- 4. ROLE CONSTRAINT EM organization_members ---' AS step;
SELECT pg_get_constraintdef(c.oid) 
FROM pg_constraint c 
JOIN pg_class t ON c.conrelid = t.oid 
WHERE t.relname = 'organization_members' AND c.contype = 'c';
