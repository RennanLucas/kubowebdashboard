UPDATE public.subscriptions
SET status = 'canceled',
    current_period_end = now() - interval '1 day',
    cancel_at_period_end = true,
    updated_at = now()
WHERE stripe_subscription_id = 'cs_test_a12ZyJPZMoYE0FtkaHOQ3kPhGouYSNptmgQbbKaPz30b1stJA2cZKRjIOA';