-- Script para criar uma assinatura trial de 7 dias para teste
-- Execute via Supabase Dashboard > SQL Editor

-- 1. Buscar o user_id do usuário atual (substitua pelo email real)
DO $$
DECLARE
  v_user_id uuid;
  v_email text := 'SEU_EMAIL_AQUI@gmail.com'; -- <<< TROCAR PELO SEU EMAIL
BEGIN
  -- Buscar user_id
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = v_email
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário com email % não encontrado', v_email;
  END IF;

  -- Deletar assinaturas existentes para este usuário (evitar duplicatas)
  DELETE FROM public.subscriptions
  WHERE user_id = v_user_id
  AND organization_id IS NULL;

  -- Criar nova assinatura em trial
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
    environment
  ) VALUES (
    v_user_id,
    'trial_' || gen_random_uuid()::text, -- ID fictício para trial
    'cus_trial_' || gen_random_uuid()::text, -- Customer ID fictício
    'kuboweb_pro_monthly', -- Product ID do plano Pro
    'price_pro_monthly', -- Price ID
    'trialing', -- Status = em trial
    now(), -- Início agora
    now() + interval '7 days', -- Termina em 7 dias
    now() + interval '7 days', -- Trial end
    false, -- Não cancelar no final do período
    'sandbox' -- Ambiente de teste
  );

  RAISE NOTICE 'Trial criado com sucesso para usuário %', v_email;
END $$;
