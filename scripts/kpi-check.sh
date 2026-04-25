#!/usr/bin/env bash
# Temporary KPI verification script.
# Usage: ./scripts/kpi-check.sh [project_id]
# Default project: kubo web (b1b2c3d4-0001-4000-8000-000000000001)

set -euo pipefail

PROJECT_ID="${1:-b1b2c3d4-0001-4000-8000-000000000001}"

echo "=========================================================="
echo "KPI Check — project_id: $PROJECT_ID"
echo "Generated at: $(date -u +'%Y-%m-%d %H:%M:%S UTC')"
echo "=========================================================="

for DAYS in 7 30 90; do
  echo ""
  echo "▶ Period: last ${DAYS} days"
  echo "----------------------------------------------------------"

  psql -X -A -F $'\t' --pset=footer=off <<SQL
WITH params AS (
  SELECT '${PROJECT_ID}'::uuid AS pid,
         (now() - interval '${DAYS} days') AS since
),
pv AS (
  SELECT COUNT(*)::int AS pageviews,
         COUNT(DISTINCT session_id)::int AS visitors
  FROM pageviews, params
  WHERE project_id = params.pid AND created_at >= params.since
),
ev AS (
  SELECT
    COUNT(*) FILTER (WHERE event_type = 'whatsapp_click')::int AS whatsapp,
    COUNT(*) FILTER (WHERE event_type = 'form_submit')::int    AS forms,
    COUNT(*) FILTER (WHERE event_type = 'button_click')::int   AS buttons,
    COUNT(*) FILTER (WHERE event_type = 'phone_click')::int    AS phones,
    COUNT(*) FILTER (WHERE event_type = 'email_click')::int    AS emails,
    COUNT(*) FILTER (WHERE event_type IN ('whatsapp_click','form_submit','button_click','phone_click','email_click'))::int AS leads
  FROM events, params
  WHERE project_id = params.pid AND created_at >= params.since
),
lv AS (
  SELECT COALESCE(lead_value, 25) AS lead_value
  FROM clients c JOIN projects p ON p.client_id = c.id, params
  WHERE p.id = params.pid
)
SELECT
  'pageviews'        AS metric, pv.pageviews::text        AS value FROM pv UNION ALL
SELECT 'visitors',         pv.visitors::text          FROM pv UNION ALL
SELECT 'leads (total)',    ev.leads::text             FROM ev UNION ALL
SELECT '  whatsapp',       ev.whatsapp::text          FROM ev UNION ALL
SELECT '  forms',          ev.forms::text             FROM ev UNION ALL
SELECT '  buttons',        ev.buttons::text           FROM ev UNION ALL
SELECT '  phone',          ev.phones::text            FROM ev UNION ALL
SELECT '  email',          ev.emails::text            FROM ev UNION ALL
SELECT 'conversion_rate %',
  CASE WHEN pv.visitors > 0
    THEN round((ev.leads::numeric / pv.visitors) * 100, 2)::text
    ELSE '0' END
  FROM pv, ev UNION ALL
SELECT 'estimated_value',
  to_char(ev.leads * lv.lead_value, 'FM999G999G990D00')
  FROM ev, lv;
SQL
done

echo ""
echo "=========================================================="
echo "Done. Compare these numbers against the dashboard UI."
echo "=========================================================="
