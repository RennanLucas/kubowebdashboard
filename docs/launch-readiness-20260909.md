# Launch readiness — work in progress

## Login / theme
- White default at HTML bootstrap and React provider. Legacy automatically-persisted dark key is ignored; a new explicit preference key preserves future user choices. This also resets prior explicit choices once because the legacy key cannot distinguish them.
- Auth fetch uses a no-store same-origin Vercel rewrite for the configured production project only. Local development and other Supabase projects remain direct. OAuth redirect URLs and token storage are unchanged. Requests are not automatically replayed.
- Login white theme visually inspected in local browser. Hosted rewrite and successful password/OTP/Google authentication require preview validation; Chrome root cause is not established merely by the screenshot.

## Release blockers / pending validation
- Authenticated writes, email delivery, payment sandbox including webhook and entitlement activation, PDF export, PWA installation, and Free/Pro cross-account gates need end-to-end verification. Prior read-only page checks do not prove these flows.
- Landing hero and pricing navigation inspected locally. Latest main landing changes preserved.
- Landing still includes unverified company/partner names, testimonials, SLA/latency/PageSpeed assurances and Excel export claims. Confirm or correct against actual product and commercial terms before launch. These are not validated customer evidence.
- Installation examples now use the configured Supabase tracker with a replaceable project ID and required consent. Missing configuration disables copying; successful clipboard feedback waits for the actual write. Banner integration is explained but must be completed by the site owner.
- The disconnected annual discount was removed. Pro prices and benefits come from the plan API without overwriting short benefit lists or substituting a hardcoded promotional price. When the API fails, the price is unavailable and the paid CTA is disabled. No billing configuration or real subscription was changed.
- Roadmap feedback-link management remains pending. Existing suspicious test membership has not been removed.

Do not advertise this audit as a production launch approval.

## Validation — 2026-09-10 continuation
- `npm ci --no-audit --no-fund`: completed; dependency deprecation warnings remain.
- Typecheck: passed after replacing unsupported `String.replaceAll` with the compatible equivalent.
- Full unit suite: 48 files, 627 tests passed. Includes 11 new installation/pricing regression cases. Requests in these component tests are simulated, not customer transactions.
- Full lint: 0 errors, 220 warnings. Warnings are not a clean lint result and remain technical debt.
- Build: passed, including PWA generation. Landing JS: 93.29 kB / 25.10 kB gzip; CSS: 87.30 kB / 17.50 kB gzip. No dependencies added. Comparable baseline bundle measurement was not performed in this continuation.
- Playwright landing + public smoke: 7 passed, none skipped in this selected run. Covers FAQ keyboard activation, mobile navigation, interactions, unauthenticated redirect and horizontal overflow at 375/390/430/768/1024/1280/1440/1920/2560 px. Screenshot paths are now portable test artifacts, not a developer-specific absolute directory.
- Manual local browser review: white login, landing navigation, plan failure state, installation instructions. Local preview has no Supabase credentials, so it intentionally exercises unavailable states rather than proving live plan retrieval/authentication.
- Hosted PR preview redirected to Vercel login. User sign-in is required to continue hosted authentication validation; deployment protection was not disabled or bypassed.
- Main authenticated feature suite, paid sandbox lifecycle, email/Google login, PDF/PWA and cross-account persistence have NOT been fully revalidated by this continuation. The PR remains a draft; no merge performed.
