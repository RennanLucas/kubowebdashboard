import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSelectedProject } from "@/hooks/useSelectedProject";
import { toast } from "sonner";

declare global {
  interface Window {
    _kw?: (evType: string, label?: string, meta?: Record<string, unknown>) => Promise<boolean>;
    kuboweb?: {
      consent: (granted: boolean) => void;
      hasConsent: () => string | null;
    };
  }
}

/**
 * Disponibiliza window._kw(...) globalmente no console do navegador,
 * permitindo que usuários e desenvolvedores testem o envio de conversões
 * (whatsapp_click, form_submit, button_click) diretamente no console da aplicação.
 */
export function TrackerConsoleBridge() {
  const { selectedProjectId } = useSelectedProject();
  const queryClient = useQueryClient();
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://gitzmynfamubetgujtmm.supabase.co";

  useEffect(() => {
    const trackUrl = `${supabaseUrl}/functions/v1/track`;

    window._kw = async function (evType: string, label?: string, meta?: Record<string, unknown>) {
      const pid = selectedProjectId || localStorage.getItem("kubo:selected_project_id");
      if (!pid) {
        console.warn("[Kubo Analytics] Nenhum projeto selecionado no momento para registrar o evento.");
        toast.error("Nenhum projeto ativo selecionado para enviar evento.");
        return false;
      }

      const eventId = typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
            const r = (Math.random() * 16) | 0;
            const v = c === "x" ? r : (r & 0x3) | 0x8;
            return v.toString(16);
          });

      const payload = {
        events: [
          {
            type: "event",
            pid,
            path: window.location.pathname || "/",
            sid: sessionStorage.getItem("_kws") || Math.random().toString(36).substring(2, 11),
            event_type: evType,
            event_label: label || "",
            metadata: meta || {},
            event_id: eventId,
          },
        ],
      };

      try {
        console.log(`%c[Kubo Analytics] Enviando evento '${evType}' (${label || "sem label"})...`, "color: #3b82f6; font-weight: bold;");
        const res = await fetch(trackUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          console.log(`%c[Kubo Analytics] Evento '${evType}' registrado com sucesso no backend!`, "color: #10b981; font-weight: bold;");
          toast.success(`Evento registrado: ${evType} (${label || "OK"})`, {
            description: "Atualizando métricas e funis...",
          });

          // Invalida cache de analytics para atualizar os cards imediatamente
          setTimeout(() => {
            queryClient.invalidateQueries({ queryKey: ["dashboard-overview"] });
            queryClient.invalidateQueries({ queryKey: ["analytics"] });
          }, 800);
          return true;
        } else {
          const errData = await res.json().catch(() => ({}));
          console.error("[Kubo Analytics] Falha ao enviar evento:", errData);
          toast.error(`Erro ao registrar evento: ${errData?.error?.message || res.statusText}`);
          return false;
        }
      } catch (err) {
        console.error("[Kubo Analytics] Erro de rede ao enviar evento:", err);
        toast.error("Erro de conexão ao enviar evento.");
        return false;
      }
    };

    window.kuboweb = window.kuboweb || {
      consent: (granted: boolean) => {
        try {
          localStorage.setItem("_kwc", granted ? "granted" : "denied");
          toast.info(`Consentimento LGPD ${granted ? "concedido" : "revogado"}`);
        } catch {}
      },
      hasConsent: () => {
        try {
          return localStorage.getItem("_kwc");
        } catch {
          return null;
        }
      },
    };

    return () => {
      // Cleanup opcional
    };
  }, [selectedProjectId, queryClient, supabaseUrl]);

  return null;
}
