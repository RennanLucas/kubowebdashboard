# Launch readiness — work in progress

## Login / theme
- White default at HTML bootstrap and React provider. Legacy automatically-persisted dark key is ignored; a new explicit preference key preserves future user choices. This also resets prior explicit choices once because the legacy key cannot distinguish them.
- Auth fetch uses a no-store same-origin Vercel rewrite for the configured production project only. Local development and other Supabase projects remain direct. OAuth redirect URLs and token storage are unchanged. Requests are not automatically replayed.
- Login white theme visually inspected in local browser. Hosted rewrite and successful password/OTP/Google authentication require preview validation; Chrome root cause is not established merely by the screenshot.

## Release blockers / pending validation
- Authenticated writes, email delivery, payment sandbox including webhook and entitlement activation, PDF export, PWA installation, and Free/Pro cross-account gates need end-to-end verification. Prior read-only page checks do not prove these flows.
- Landing hero and pricing navigation inspected locally. Latest main landing changes preserved.
- Landing includes unverified company/partner names, SLA/latency/PageSpeed assurances, annual discount and Excel export claims. Confirm against actual product and commercial terms before launch.
- Installation examples point to `kuboweb.com.br/k.js` with a fixed demo site identifier, rather than the actual project-specific Supabase tracker URL. They must not be used as production installation instructions.
- Roadmap feedback-link management remains pending. Existing suspicious test membership has not been removed.

Do not advertise this audit as a production launch approval.
