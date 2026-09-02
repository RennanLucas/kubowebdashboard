-- Script para corrigir TODOS os usuários existentes que não têm assinatura
-- Execute DEPOIS de aplicar a migration do trigger

INSERT INTO public.subscriptions (
  user_id,
  stripe_subscription_id,
  stripe_customer_id,
  product_id,
  price_id,
  status,
  current_period_start,
  current_period_end,
  trial_end,
  cancel_at_period_end,
  environment,
  organization_id
)
SELECT
  u.id as user_id,
  'trial_' || u.id::text as stripe_subscription_id,
  'cus_trial_' || u.id::text as stripe_customer_id,
  'kuboweb_pro_monthly' as product_id,
  'price_pro_monthly' as price_id,
  'trialing' as status,
  now() as current_period_start,
  now() + interval '7 days' as current_period_end,
  now() + interval '7 days' as trial_end,
  false as cancel_at_period_end,
  'production' as environment,
  NULL as organization_id
FROM auth.users u
WHERE NOT EXISTS (
  -- Só criar trial para usuários que não têm NENHUMA assinatura
  SELECT 1
  FROM public.subscriptions s
  WHERE s.user_id = u.id
  AND s.organization_id IS NULL
)
ON CONFLICT (stripe_subscription_id) DO NOTHING;

-- Mostrar quantos usuários foram corrigidos
SELECT
  COUNT(*) as usuarios_com_trial_criado,
  'Trial de 7 dias criado com sucesso' as mensagem
FROM public.subscriptions
WHERE stripe_subscription_id LIKE 'trial_%'
AND created_at > now() - interval '1 minute';
