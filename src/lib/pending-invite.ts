const KEY = "kuboweb:pending-invite";
const TOKEN = /^[0-9a-f]{64}$/;
export const validInviteToken = (token: string | null): token is string => !!token && TOKEN.test(token);
export function rememberInvite(token: string) {
  if (!validInviteToken(token)) return;
  try { sessionStorage.setItem(KEY, token); } catch { /* URL still preserves the invite */ }
}
export function pendingInvitePath(): string | null {
  try {
    const token = sessionStorage.getItem(KEY);
    return validInviteToken(token) ? `/auth/invite#token=${token}` : null;
  } catch { return null; }
}
export function clearPendingInvite() {
  try { sessionStorage.removeItem(KEY); } catch { /* storage may be disabled */ }
}
