import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    q: "Precisa de entrada?",
    a: "Não! Nosso serviço de assinatura não exige nenhum valor de entrada. Você começa a dirigir pagando apenas a primeira mensalidade.",
  },
  {
    q: "O que está incluso na mensalidade?",
    a: "A mensalidade inclui o uso do veículo zero km, seguro completo, manutenções preventivas e corretivas, assistência 24h, IPVA e licenciamento.",
  },
  {
    q: "Qual o prazo mínimo de contrato?",
    a: "Oferecemos planos a partir de 12 meses, com opções de 24 e 36 meses que oferecem mensalidades ainda mais atrativas.",
  },
  {
    q: "Posso trocar de carro durante o contrato?",
    a: "Sim! Oferecemos flexibilidade para troca de veículo conforme as condições do seu plano. Consulte nossos especialistas.",
  },
  {
    q: "Quem paga a manutenção?",
    a: "Toda a manutenção preventiva e corretiva está inclusa na mensalidade. Você não terá nenhum custo adicional com revisões.",
  },
  {
    q: "Posso usar o carro para trabalho?",
    a: "Sim! Temos planos para pessoas físicas e jurídicas. Ideal para profissionais liberais e empresas que desejam frotas sem imobilização de capital.",
  },
];

const FaqSection = () => {
  return (
    <section id="faq" className="py-20 md:py-28 bg-muted/50">
      <div className="container">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-sm font-semibold uppercase tracking-wider text-accent">Dúvidas</span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mt-3 mb-4">
            Perguntas frequentes
          </h2>
        </div>

        <div className="max-w-2xl mx-auto">
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map(({ q, a }, i) => (
              <AccordionItem
                key={i}
                value={`faq-${i}`}
                className="rounded-xl bg-card border border-border/50 px-6 shadow-card"
              >
                <AccordionTrigger className="text-left font-semibold text-foreground hover:no-underline">
                  {q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
};

export default FaqSection;
