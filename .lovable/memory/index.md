# Project Memory

## Core
- KUBOWEB client portal for site performance metrics and lead gen.
- Supabase multi-tenant with Auth & RLS. NEVER expose API keys in frontend; use Edge Functions only.
- Clean SaaS design (Linear+Stripe hybrid): Background #F8F9FB, Sidebar gradient #0F1117. Inter font. Soft shadows + 2px active rail in sidebar.
- Auto-confirm emails (`auto_confirm_email: true`), auto-login after signup, and proactive token renewal.
- App is an installable PWA. SW only registers in production (never in iframes/preview).

## Memories
- [Multi-tenant Architecture](mem://tech/arquitetura) — Supabase multi-tenant setup and frontend security constraints
- [Design System](mem://style/design-system) — Visual identity, colors, typography, and layout aesthetics
- [SaaS Shell Layout](mem://style/saas-shell) — AppLayout with refined sidebar, breadcrumbs, GlobalProjectSwitcher, UserMenu, PageHeader
- [Onboarding](mem://features/onboarding) — 3-step structured onboarding stepper
- [Analytics Tracking](mem://features/custom-tracking) — Proprietary lightweight tracking script and edge function setup
- [Conversion Tracking](mem://features/conversion-tracking) — Auto-tracking of WhatsApp clicks, form submits, and button interactions
- [Dashboard](mem://features/dashboard) — Dashboard features, KPIs, and refresh rate
- [Reports](mem://features/reports) — PDF report generation via Edge Function
- [Multi-project](mem://features/multi-project) — Managing multiple sites under one client account
- [PWA Installable](mem://features/pwa) — vite-plugin-pwa setup, /install page, SW guards for preview iframes
- [No GA4 in UI](mem://constraints/google-analytics) — GA4 integration removed from UI, backend fallback only
- [Session Management](mem://auth/session-management) — Proactive token renewal and auto-logout on invalid session
- [Auto-confirm Email](mem://auth/email-verification) — Manual email verification disabled for frictionless login
- [Geolocation](mem://tech/geolocation) — IP-based location detection using Cloudflare and ipapi.co
- [Lead Valuation](mem://features/lead-valuation) — Assign monetary value to leads for estimated value calculation
- [Traffic Categorization](mem://tech/traffic-categorization) — Backend cleaning and grouping of traffic sources
