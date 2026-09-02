BEGIN;

-- Analytics data first (foreign key deps)
DELETE FROM pageviews
WHERE project_id IN (
  'd1111111-e2e0-e2e0-e2e0-e2e000000001',
  'd2222222-e2e0-e2e0-e2e0-e2e000000002'
);

DELETE FROM events
WHERE project_id IN (
  'd1111111-e2e0-e2e0-e2e0-e2e000000001',
  'd2222222-e2e0-e2e0-e2e0-e2e000000002'
);

DELETE FROM analytics_daily_pages
WHERE project_id IN (
  'd1111111-e2e0-e2e0-e2e0-e2e000000001',
  'd2222222-e2e0-e2e0-e2e0-e2e000000002'
);

DELETE FROM analytics_daily_overview
WHERE project_id IN (
  'd1111111-e2e0-e2e0-e2e0-e2e000000001',
  'd2222222-e2e0-e2e0-e2e0-e2e000000002'
);

-- Subscriptions
DELETE FROM subscriptions
WHERE id IN (
  'a1111111-e2e0-e2e0-e2e0-e2e000000001',
  'a2222222-e2e0-e2e0-e2e0-e2e000000002'
);

-- Projects
DELETE FROM projects
WHERE id IN (
  'd1111111-e2e0-e2e0-e2e0-e2e000000001',
  'd2222222-e2e0-e2e0-e2e0-e2e000000002'
);

-- Members (before org deletion)
DELETE FROM organization_members
WHERE organization_id IN (
  'c1111111-e2e0-e2e0-e2e0-e2e000000001',
  'c2222222-e2e0-e2e0-e2e0-e2e000000002'
);

-- Organizations
DELETE FROM organizations
WHERE id IN (
  'c1111111-e2e0-e2e0-e2e0-e2e000000001',
  'c2222222-e2e0-e2e0-e2e0-e2e000000002'
);

COMMIT;
