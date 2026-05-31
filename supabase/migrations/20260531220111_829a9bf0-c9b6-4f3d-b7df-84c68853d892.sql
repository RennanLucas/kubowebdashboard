
ALTER TABLE public.alert_preferences
  ADD COLUMN IF NOT EXISTS frequency text NOT NULL DEFAULT 'realtime',
  ADD COLUMN IF NOT EXISTS alert_types jsonb NOT NULL DEFAULT '{
    "traffic_drop": true,
    "traffic_up": true,
    "low_conversion": true,
    "high_conversion": true,
    "high_bounce": true,
    "no_data": true,
    "single_channel": true,
    "goal_reached": true,
    "peak_hour": true
  }'::jsonb,
  ADD COLUMN IF NOT EXISTS notify_email boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_in_app boolean NOT NULL DEFAULT true;

ALTER TABLE public.alert_preferences
  DROP CONSTRAINT IF EXISTS alert_preferences_frequency_check;
ALTER TABLE public.alert_preferences
  ADD CONSTRAINT alert_preferences_frequency_check
  CHECK (frequency IN ('realtime', 'daily', 'weekly'));
