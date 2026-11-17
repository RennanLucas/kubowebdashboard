import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { FAQ_ITEMS } from "./data";

export function FAQ() {
  return (
    <section id="faq" className="lp-section">
      <div className="lp-shell lp-faq__grid">
        <div className="lp-faq__title">
          <span className="lp-label">Perguntas</span>
          <h2 className="lp-h2">Antes de instalar.</h2>
          <p>Respostas diretas sobre o que o Kubo faz hoje.</p>
        </div>
        <Accordion type="single" collapsible className="lp-faq__accordion">
          {FAQ_ITEMS.map(([question, answer], index) => (
            <AccordionItem value={`faq-${index}`} key={question}>
              <AccordionTrigger>{question}</AccordionTrigger>
              <AccordionContent>{answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
