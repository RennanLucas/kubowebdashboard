import { motion } from "framer-motion";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { FAQ_ITEMS } from "./data";
import { fadeUp, viewportOnce } from "./motion";

export function FAQ() {
  return (
    <section id="faq" className="lp-faq">
      <div className="lp-shell lp-faq__grid">
        <motion.div className="lp-faq__title" variants={fadeUp} initial="hidden" whileInView="show" viewport={viewportOnce}>
          <span>Dúvidas frequentes</span>
          <h2>Antes de instalar,<br />vale saber.</h2>
          <p>Respostas diretas sobre o que o Kubo faz hoje.</p>
        </motion.div>
        <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={viewportOnce}>
          <Accordion type="single" collapsible className="lp-faq__accordion">
            {FAQ_ITEMS.map(([question, answer], index) => (
              <AccordionItem value={`faq-${index}`} key={question}>
                <AccordionTrigger>{question}</AccordionTrigger>
                <AccordionContent>{answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
}
