import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useAnnotations } from "@/hooks/useAnnotations";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

vi.mock("@/integrations/supabase/client");
vi.mock("sonner");

describe("useAnnotations", () => {
  const mockProjectId = "proj-123";
  const mockUserId = "user-456";

  const mockAnnotations = [
    {
      id: "ann-1",
      date: "2026-09-01",
      label: "Release v2.0",
      category: "launch" as const,
      notes: "Major feature launch",
      created_at: "2026-09-01T10:00:00Z",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("refresh / initial load", () => {
    it("loads annotations for a project", async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockAnnotations, error: null }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      const { result } = renderHook(() => useAnnotations(mockProjectId));

      await waitFor(() => {
        expect(result.current.annotations).toEqual(mockAnnotations);
        expect(result.current.loading).toBe(false);
      });
    });

    it("returns empty array when projectId is undefined", async () => {
      const { result } = renderHook(() => useAnnotations(undefined));

      await waitFor(() => {
        expect(result.current.annotations).toEqual([]);
      });

      expect(supabase.from).not.toHaveBeenCalled();
    });

    it("returns empty array on fetch error", async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: null, error: { message: "Network error" } }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const { result } = renderHook(() => useAnnotations(mockProjectId));

      await waitFor(() => {
        expect(result.current.annotations).toEqual([]);
      });

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe("add", () => {
    it("adds annotation successfully", async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: { id: mockUserId } },
      } as any);

      const mockSelectChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      };

      const mockInsertChain = {
        insert: vi.fn().mockResolvedValue({ error: null }),
      };

      vi.mocked(supabase.from)
        .mockReturnValueOnce(mockSelectChain as any)
        .mockReturnValueOnce(mockInsertChain as any)
        .mockReturnValue(mockSelectChain as any);

      const { result } = renderHook(() => useAnnotations(mockProjectId));

      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.add({
          date: "2026-09-02",
          label: "New feature",
          category: "launch",
          notes: "Test notes",
        });
      });

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith("Anotação adicionada.");
      });
    });

    it("trims and limits label to 80 chars", async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: { id: mockUserId } },
      } as any);

      const mockInsert = vi.fn().mockResolvedValue({ error: null });

      const mockSelectChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      };

      const mockInsertChain = { insert: mockInsert };

      vi.mocked(supabase.from)
        .mockReturnValueOnce(mockSelectChain as any)
        .mockReturnValueOnce(mockInsertChain as any)
        .mockReturnValue(mockSelectChain as any);

      const { result } = renderHook(() => useAnnotations(mockProjectId));
      await waitFor(() => expect(result.current.loading).toBe(false));

      const longLabel = "A".repeat(100);

      await act(async () => {
        await result.current.add({
          date: "2026-09-02",
          label: `  ${longLabel}  `,
          category: "launch",
        });
      });

      await waitFor(() => {
        expect(mockInsert).toHaveBeenCalledWith(
          expect.objectContaining({
            label: "A".repeat(80),
          })
        );
      });
    });

    it("shows error when projectId is missing", async () => {
      const { result } = renderHook(() => useAnnotations(undefined));

      await act(async () => {
        await result.current.add({
          date: "2026-09-02",
          label: "Test",
          category: "launch",
        });
      });

      expect(toast.error).toHaveBeenCalledWith("Selecione um projeto antes de criar uma anotação.");
    });

    it("shows error when user is not authenticated", async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({ data: { user: null } } as any);

      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      const { result } = renderHook(() => useAnnotations(mockProjectId));
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.add({
          date: "2026-09-02",
          label: "Test",
          category: "launch",
        });
      });

      expect(toast.error).toHaveBeenCalledWith("Sessão expirada. Faça login novamente.");
    });
  });

  describe("update", () => {
    it("updates annotation successfully", async () => {
      const mockUpdate = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockResolvedValue({ error: null });

      const mockSelectChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      };

      const mockUpdateChain = {
        update: mockUpdate,
        eq: mockEq,
      };

      vi.mocked(supabase.from)
        .mockReturnValueOnce(mockSelectChain as any)
        .mockReturnValueOnce(mockUpdateChain as any)
        .mockReturnValue(mockSelectChain as any);

      const { result } = renderHook(() => useAnnotations(mockProjectId));
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.update("ann-1", {
          date: "2026-09-03",
          label: "Updated label",
          category: "campaign",
          notes: "Updated notes",
        });
      });

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith("Anotação atualizada.");
      });
    });
  });

  describe("remove", () => {
    it("removes annotation successfully", async () => {
      const mockDelete = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockResolvedValue({ error: null });

      const mockSelectChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      };

      const mockDeleteChain = {
        delete: mockDelete,
        eq: mockEq,
      };

      vi.mocked(supabase.from)
        .mockReturnValueOnce(mockSelectChain as any)
        .mockReturnValueOnce(mockDeleteChain as any)
        .mockReturnValue(mockSelectChain as any);

      const { result } = renderHook(() => useAnnotations(mockProjectId));
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.remove("ann-1");
      });

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith("Anotação removida.");
      });
    });
  });
});
