# Page audit follow-up (2026-09-09)

## Implemented

- Insights passes the selected project ID to the analytics queries (which are disabled without it). History and hourly queries also use that ID, rather than fields absent from the overview response.
- Insights distinguishes request failure, missing project and empty period. Generation is guarded until data is available.
- Admin Roadmap supports creating private-by-default items, editing title/description/category, selecting any of the five database statuses, and explicitly publishing/unpublishing. No delete operation was added.
- Existing database RLS remains the authority for admin writes. Writes use `select().single()` so a denied/zero-row update is not reported as successful.
- Public roadmap includes public backlog items, reports query failures instead of showing an empty board, and reports voting failures instead of treating them as success.
- Five component tests cover board loading, default privacy, editing, read failure and write failure. These use mocked requests, not production writes.

## Not completed / not claimed

- No migration, permission change, billing transaction, public roadmap item or feedback was created during this implementation.
- Linking feedback records to roadmap items is not implemented in this board yet.
- Authenticated visual verification of the new frontend, real persistence checks, payment sandbox and PDF export validation remain outstanding.
- The existing viewer `hacker@test.com` has no recorded last login/email confirmation/account creation timestamp. This does not establish its provenance. Removal requires confirmation; no access was changed.
- The existing Insights implementation uses local analysis generation; this change does not install a paid AI provider or claim external model integration.

Do not treat a successful build or mocked test as an end-to-end production validation.
