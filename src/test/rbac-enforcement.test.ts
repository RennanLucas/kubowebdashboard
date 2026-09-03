/**
 * rbac-enforcement.test.ts
 * Reproduz as regras de negócio do trigger `check_member_rbac()` (Postgres)
 * como funções puras em TypeScript, para que a lógica de autorização tenha
 * cobertura de teste rápida sem precisar de uma instância Postgres.
 *
 * IMPORTANTE: Esta é uma cópia funcional da lógica em
 * supabase/migrations/20260815000004_phase3_b2b_multi_tenant.sql
 * (função check_member_rbac). Se a migration mudar, este arquivo deve
 * ser atualizado em conjunto — idealmente validado também com pgTAP
 * contra um Postgres real no CI (não configurado ainda).
 */

import { describe, it, expect } from "vitest";

type Role = "owner" | "admin" | "member";
type Op = "INSERT" | "UPDATE" | "DELETE";

interface MemberRow {
  organization_id: string;
  user_id: string;
  role: Role;
}

interface RbacCheckInput {
  op: Op;
  actorUserId: string;
  actorRole: Role | null; // role do usuário autenticado (auth.uid()) na organização
  old?: MemberRow;
  new?: MemberRow;
}

/** Reproduz check_member_rbac(): lança erro (string) se a operação for negada. */
function checkMemberRbac(input: RbacCheckInput): { ok: true } | { ok: false; error: string } {
  const { op, actorUserId, actorRole, old, new: next } = input;

  if (actorRole === "admin") {
    if (op === "INSERT" && next?.role === "owner") {
      return { ok: false, error: "Admins cannot create owners." };
    }
    if (op === "UPDATE") {
      if (old?.role === "owner") {
        return { ok: false, error: "Admins cannot modify owners." };
      }
      if (next?.role === "owner") {
        return { ok: false, error: "Admins cannot elevate any user to owner." };
      }
      if (old?.role === "admin" && old.user_id !== actorUserId) {
        return { ok: false, error: "Admins cannot modify privileges of other admins." };
      }
    }
    if (op === "DELETE") {
      if (old?.role === "owner") {
        return { ok: false, error: "Admins cannot remove owners." };
      }
      if (old?.role === "admin" && old.user_id !== actorUserId) {
        return { ok: false, error: "Admins cannot remove other admins." };
      }
    }
  }

  // Ninguém pode mudar seu próprio role diretamente (previne auto-elevação)
  if (op === "UPDATE" && next?.user_id === actorUserId && old?.role !== next?.role) {
    return { ok: false, error: "Users cannot elevate or change their own role directly." };
  }

  return { ok: true };
}

// ─── Cenários: Admin tentando gerenciar Owner ───────────────────────────────

describe("RBAC: Admin não pode criar/gerenciar Owner", () => {
  it("Admin NÃO pode inserir novo membro com role owner", () => {
    const result = checkMemberRbac({
      op: "INSERT",
      actorUserId: "admin-1",
      actorRole: "admin",
      new: { organization_id: "org-1", user_id: "new-user", role: "owner" },
    });
    expect(result.ok).toBe(false);
    if ("error" in result) expect(result.error).toContain("cannot create owners");
  });

  it("Admin NÃO pode modificar dados de um Owner existente", () => {
    const result = checkMemberRbac({
      op: "UPDATE",
      actorUserId: "admin-1",
      actorRole: "admin",
      old: { organization_id: "org-1", user_id: "owner-1", role: "owner" },
      new: { organization_id: "org-1", user_id: "owner-1", role: "owner" },
    });
    expect(result.ok).toBe(false);
    if ("error" in result) expect(result.error).toContain("cannot modify owners");
  });

  it("Admin NÃO pode promover outro membro para owner", () => {
    const result = checkMemberRbac({
      op: "UPDATE",
      actorUserId: "admin-1",
      actorRole: "admin",
      old: { organization_id: "org-1", user_id: "member-1", role: "member" },
      new: { organization_id: "org-1", user_id: "member-1", role: "owner" },
    });
    expect(result.ok).toBe(false);
    if ("error" in result) expect(result.error).toContain("cannot elevate any user to owner");
  });

  it("Admin NÃO pode remover um Owner", () => {
    const result = checkMemberRbac({
      op: "DELETE",
      actorUserId: "admin-1",
      actorRole: "admin",
      old: { organization_id: "org-1", user_id: "owner-1", role: "owner" },
    });
    expect(result.ok).toBe(false);
    if ("error" in result) expect(result.error).toContain("cannot remove owners");
  });
});

describe("RBAC: Admin não pode gerenciar outros Admins", () => {
  it("Admin NÃO pode modificar privilégios de outro Admin", () => {
    const result = checkMemberRbac({
      op: "UPDATE",
      actorUserId: "admin-1",
      actorRole: "admin",
      old: { organization_id: "org-1", user_id: "admin-2", role: "admin" },
      new: { organization_id: "org-1", user_id: "admin-2", role: "member" },
    });
    expect(result.ok).toBe(false);
    if ("error" in result) expect(result.error).toContain("cannot modify privileges of other admins");
  });

  it("Admin NÃO pode remover outro Admin", () => {
    const result = checkMemberRbac({
      op: "DELETE",
      actorUserId: "admin-1",
      actorRole: "admin",
      old: { organization_id: "org-1", user_id: "admin-2", role: "admin" },
    });
    expect(result.ok).toBe(false);
    if ("error" in result) expect(result.error).toContain("cannot remove other admins");
  });

  it("Admin PODE modificar seus próprios dados de membro (sem trocar role)", () => {
    const result = checkMemberRbac({
      op: "UPDATE",
      actorUserId: "admin-1",
      actorRole: "admin",
      old: { organization_id: "org-1", user_id: "admin-1", role: "admin" },
      new: { organization_id: "org-1", user_id: "admin-1", role: "admin" },
    });
    expect(result.ok).toBe(true);
  });
});

describe("RBAC: Admin PODE gerenciar membros comuns", () => {
  it("Admin pode promover um member para admin", () => {
    const result = checkMemberRbac({
      op: "UPDATE",
      actorUserId: "admin-1",
      actorRole: "admin",
      old: { organization_id: "org-1", user_id: "member-1", role: "member" },
      new: { organization_id: "org-1", user_id: "member-1", role: "admin" },
    });
    expect(result.ok).toBe(true);
  });

  it("Admin pode remover um member comum", () => {
    const result = checkMemberRbac({
      op: "DELETE",
      actorUserId: "admin-1",
      actorRole: "admin",
      old: { organization_id: "org-1", user_id: "member-1", role: "member" },
    });
    expect(result.ok).toBe(true);
  });

  it("Admin pode inserir novo membro com role 'member'", () => {
    const result = checkMemberRbac({
      op: "INSERT",
      actorUserId: "admin-1",
      actorRole: "admin",
      new: { organization_id: "org-1", user_id: "new-user", role: "member" },
    });
    expect(result.ok).toBe(true);
  });
});

describe("RBAC: Owner tem privilégios totais (sem restrição de admin)", () => {
  it("Owner PODE criar outro owner", () => {
    const result = checkMemberRbac({
      op: "INSERT",
      actorUserId: "owner-1",
      actorRole: "owner",
      new: { organization_id: "org-1", user_id: "new-user", role: "owner" },
    });
    expect(result.ok).toBe(true);
  });

  it("Owner PODE remover um Admin", () => {
    const result = checkMemberRbac({
      op: "DELETE",
      actorUserId: "owner-1",
      actorRole: "owner",
      old: { organization_id: "org-1", user_id: "admin-1", role: "admin" },
    });
    expect(result.ok).toBe(true);
  });
});

describe("RBAC: Ninguém pode auto-elevar seu próprio role", () => {
  it("Owner tentando mudar seu próprio role é bloqueado", () => {
    const result = checkMemberRbac({
      op: "UPDATE",
      actorUserId: "owner-1",
      actorRole: "owner",
      old: { organization_id: "org-1", user_id: "owner-1", role: "owner" },
      new: { organization_id: "org-1", user_id: "owner-1", role: "member" },
    });
    expect(result.ok).toBe(false);
    if ("error" in result) expect(result.error).toContain("cannot elevate or change their own role");
  });

  it("Member tentando se auto-promover a admin é bloqueado", () => {
    const result = checkMemberRbac({
      op: "UPDATE",
      actorUserId: "member-1",
      actorRole: "member",
      old: { organization_id: "org-1", user_id: "member-1", role: "member" },
      new: { organization_id: "org-1", user_id: "member-1", role: "admin" },
    });
    expect(result.ok).toBe(false);
    if ("error" in result) expect(result.error).toContain("cannot elevate or change their own role");
  });

  it("Atualização que NÃO muda o próprio role passa normalmente", () => {
    const result = checkMemberRbac({
      op: "UPDATE",
      actorUserId: "member-1",
      actorRole: "member",
      old: { organization_id: "org-1", user_id: "member-1", role: "member" },
      new: { organization_id: "org-1", user_id: "member-1", role: "member" },
    });
    expect(result.ok).toBe(true);
  });
});

// ─── Isolamento multi-tenant: resolução de organização por membership ───────

describe("Multi-tenant: resolução de organização exige membership", () => {
  interface OrgMembership {
    organizationId: string;
    userId: string;
  }

  function resolveAccessibleOrg(
    requestedOrgId: string,
    userId: string,
    memberships: OrgMembership[]
  ): { allowed: boolean } {
    const isMember = memberships.some(
      (m) => m.organizationId === requestedOrgId && m.userId === userId
    );
    return { allowed: isMember };
  }

  it("usuário NÃO pode acessar organização da qual não é membro", () => {
    const memberships = [{ organizationId: "org-A", userId: "user-1" }];
    const result = resolveAccessibleOrg("org-B", "user-1", memberships);
    expect(result.allowed).toBe(false);
  });

  it("usuário PODE acessar organização da qual é membro", () => {
    const memberships = [{ organizationId: "org-A", userId: "user-1" }];
    const result = resolveAccessibleOrg("org-A", "user-1", memberships);
    expect(result.allowed).toBe(true);
  });

  it("usuário sem nenhuma membership não acessa nenhuma organização", () => {
    const result = resolveAccessibleOrg("org-A", "user-sem-org", []);
    expect(result.allowed).toBe(false);
  });

  it("usuário membro de múltiplas orgs só acessa as que pertence", () => {
    const memberships = [
      { organizationId: "org-A", userId: "user-1" },
      { organizationId: "org-C", userId: "user-1" },
    ];
    expect(resolveAccessibleOrg("org-A", "user-1", memberships).allowed).toBe(true);
    expect(resolveAccessibleOrg("org-B", "user-1", memberships).allowed).toBe(false);
    expect(resolveAccessibleOrg("org-C", "user-1", memberships).allowed).toBe(true);
  });
});
