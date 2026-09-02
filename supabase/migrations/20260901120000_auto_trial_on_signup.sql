-- Migration: Auto-create trial subscription on user signup
-- Problema: Clientes fazem signup mas não têm assinatura, recebem erro de limite de 7 dias
-- Solução: Trigger que cria automaticamente uma assinatura trial de 7 dias para novos usuários

-- Função que cria trial automático
CREATE OR REPLACE FUNCTION public.handle_new_user_trial()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Criar assinatura trial de 7 dias para o novo usuário
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
  ) VALUES (
    NEW.id,
    'trial_' || NEW.id::text, -- ID único baseado no user_id
    'cus_trial_' || NEW.id::text,
    'kuboweb_pro_monthly',
    'price_pro_monthly',
    'trialing',
    now(),
    now() + interval '7 days',
    now() + interval '7 days',
    false,
    'production', -- Produção, não sandbox
    NULL -- Personal subscription (sem organization)
  )
  ON CONFLICT (stripe_subscription_id) DO NOTHING; -- Evitar duplicatas

  RETURN NEW;
END;
$$;

-- Trigger que executa após criar novo usuário
DROP TRIGGER IF EXISTS on_auth_user_created_trial ON auth.users;
CREATE TRIGGER on_auth_user_created_trial
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_trial();

-- Comentário para documentação
COMMENT ON FUNCTION public.handle_new_user_trial() IS
'Cria automaticamente uma assinatura trial de 7 dias quando um novo usuário se registra. Resolve o problema de clientes recebendo erro de limite de histórico imediatamente após signup.';
