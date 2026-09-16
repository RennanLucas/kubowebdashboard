import { afterEach, expect, it } from "vitest";
import { clearPendingInvite, pendingInvitePath, rememberInvite, validInviteToken } from "@/lib/pending-invite";
afterEach(clearPendingInvite);
it("preserves a valid invite through login without exposing it in a query string", () => {
  rememberInvite("a".repeat(64));
  expect(pendingInvitePath()).toBe("/auth/invite#token=" + "a".repeat(64));
  clearPendingInvite();
  expect(pendingInvitePath()).toBeNull();
});
it("does not turn stored user input into an open redirect", () => {
  expect(validInviteToken("https://evil.example")).toBe(false);
  rememberInvite("https://evil.example");
  expect(pendingInvitePath()).toBeNull();
});
