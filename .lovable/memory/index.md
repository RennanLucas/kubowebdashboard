# Memory: index.md
Updated: today

# Project Memory

## Core
- KUBOWEB client portal for site performance metrics and lead gen.
- Supabase multi-tenant with Auth & RLS. NEVER expose API keys in frontend; use Edge Functions only.
- Clean SaaS design: Background #F8F9FB, Sidebar #0F1117, Accent #6366F1. Inter font (500 headings, 400 body).
- Email confirmation REQUIRED on signup (auto_confirm disabled). Auth emails sent via Brevo SMTP.

## Memories
- [Multi-tenant Architecture](mem://tech/arquitetura) — Supabase multi-tenant setup and frontend security constraints
- [Design System](mem://style/design-system) — Visual identity, colors, typography, and layout aesthetics
- [Onboarding](mem://features/onboarding) — 3-step structured onboarding stepper
- [Analytics Tracking](mem://features/custom-tracking) — Proprietary lightweight tracking script and edge function setup
- [Conversion Tracking](mem://features/conversion-tracking) — Auto-tracking of WhatsApp clicks, form submits, and button interactions
- [Dashboard](mem://features/dashboard) — Dashboard features, KPIs, and refresh rate
- [Reports](mem://features/reports) — PDF report generation via Edge Function
- [Multi-project](mem://features/multi-project) — Managing multiple sites under one client account
- [No GA4 in UI](mem://constraints/google-analytics) — GA4 integration removed from UI, backend fallback only
- [Session Management](mem://auth/session-management) — Proactive token renewal and auto-logout on invalid session
- [Email Verification Required](mem://auth/email-verification) — Auth requires email confirmation, sent via Brevo SMTP
- [Geolocation](mem://tech/geolocation) — IP-based location detection using Cloudflare and ipapi.co
- [Lead Valuation](mem://features/lead-valuation) — Assign monetary value to leads for estimated value calculation
- [Traffic Categorization](mem://tech/traffic-categorization) — Backend cleaning and grouping of traffic sources
