-- Migration: event_id deduplication + UTM columns + missing indexes + SECURITY DEFINER search_path fix
-- Data: 2026-08-22

-- 1. event_id para deduplicacao idempotente de eventos/pageviews
ALTER TABLE pageviews ADD COLUMN IF NOT EXISTS event_id UUID;
ALTER TABLE events ADD COLUMN IF NOT EXISTS event_id UUID;

-- Unique constraint para ON CONFLICT DO NOTHING funcionar
CREATE UNIQUE INDEX IF NOT EXISTS idx_pageviews_event_id ON pageviews (event_id) WHERE event_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_events_event_id ON events (event_id) WHERE event_id IS NOT NULL;

-- 2. Colunas UTM na tabela pageviews
ALTER TABLE pageviews
  ADD COLUMN IF NOT EXISTS utm_source TEXT,
  ADD COLUMN IF NOT EXISTS utm_medium TEXT,
  ADD COLUMN IF NOT EXISTS utm_campaign TEXT,
  ADD COLUMN IF NOT EXISTS utm_term TEXT,
  ADD COLUMN IF NOT EXISTS utm_content TEXT;

CREATE INDEX IF NOT EXISTS idx_pageviews_utm_source ON pageviews (project_id, utm_source) WHERE utm_source IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_pageviews_utm_campaign ON pageviews (project_id, utm_campaign) WHERE utm_campaign IS NOT NULL;

-- 3. Indexes ausentes para tabelas de feedback (auditoria 360)
CREATE INDEX IF NOT EXISTS idx_feedback_org_id ON feedback (organization_id);
CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON feedback (user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_project_id ON feedback (project_id) WHERE project_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_roadmap_items_created_by ON roadmap_items (created_by);
CREATE INDEX IF NOT EXISTS idx_roadmap_votes_user_id ON roadmap_votes (user_id);

-- 4. Fix SECURITY DEFINER functions sem search_path
ALTER FUNCTION aggregate_analytics_jit SET search_path = public;
ALTER FUNCTION check_member_rbac SET search_path = public;
ALTER FUNCTION check_invite_rbac SET search_path = public;
