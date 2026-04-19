---
name: Email verification required
description: Auth requires email confirmation before login (auto-confirm disabled)
type: feature
---
Auth `auto_confirm_email = false`. Users MUST click the confirmation link in the email before being able to sign in. Confirmation emails are sent via Brevo SMTP (configured in Supabase Auth → Email).

**Why:** Validates email ownership and ensures Brevo SMTP delivery is working end-to-end.

**Signup flow:**
1. User submits signup form
2. Account is created but `email_confirmed_at` is null
3. Confirmation email is sent via Brevo
4. User clicks link → email confirmed → can log in
