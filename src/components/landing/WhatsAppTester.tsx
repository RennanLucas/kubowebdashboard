import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MessageSquare, X } from "lucide-react";

/** Floating widget that lets a visitor fire a sample tracking event, clearly labeled as a test. */
export function WhatsAppTester() {
  const [toast, setToast] = useState(false);

  const trigger = () => {
    setToast(true);
    setTimeout(() => setToast(false), 4500);
  };

  return (
    <>
      <div className="lp-floating-widget" role="complementary" aria-label="Simulador de rastreamento">
        <button type="button" onClick={trigger} className="lp-floating-tester" title="Clique para testar a detecção do Kubo">
          <span className="lp-live-dot" />
          <MessageSquare size={13} />
          <span>Testar rastreamento</span>
        </button>
      </div>

      <AnimatePresence>
        {toast && (
          <motion.div
            className="lp-floating-toast"
            role="status"
            aria-live="polite"
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ duration: 0.25 }}
          >
            <div className="lp-floating-toast__head">
              <span className="lp-live-dot" />
              <strong>⚡ Evento de teste detectado!</strong>
              <button type="button" onClick={() => setToast(false)} aria-label="Fechar notificação"><X size={12} /></button>
            </div>
            <p>Evento: <b>Clique no WhatsApp</b> · Origem: <b>Landing Page</b> · Captura simulada</p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
