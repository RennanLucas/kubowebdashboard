-- Tornar colunas Stripe opcionais e adicionar campos genéricos para Mercado Pago
ALTER TABLE public.subscriptions
  ALTER COLUMN stripe_subscription_id DROP NOT NULL,
  ALTER COLUMN stripe_customer_id DROP NOT NULL,
  ALTER COLUMN product_id DROP NOT NULL,
  ALTER COLUMN price_id DROP NOT NULL;

ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS provider text NOT NULL DEFAULT 'mercadopago',
  ADD COLUMN IF NOT EXISTS external_id text,
  ADD COLUMN IF NOT EXISTS payer_email text,
  ADD COLUMN IF NOT EXISTS plan_id text,
  ADD COLUMN IF NOT EXISTS amount numeric;

CREATE INDEX IF NOT EXISTS idx_subscriptions_external_id ON public.subscriptions(external_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_provider ON public.subscriptions(user_id, provider);

-- Atualizar a função de checagem para aceitar plano vitalício/recorrente do MP
CREATE OR REPLACE FUNCTION public.has_active_subscription(user_uuid uuid, check_env text DEFAULT 'live'::text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  select exists (
    select 1 from public.subscriptions
    where user_id = user_uuid
    and (
      (status in ('active', 'trialing', 'authorized', 'approved')
        and (current_period_end is null or current_period_end > now()))
      or (status in ('canceled', 'cancelled') and current_period_end > now())
    )
  );
$function$;