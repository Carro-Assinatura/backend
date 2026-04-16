import { Check, X } from "lucide-react";

const rows = [
  { feature: "Entrada", own: "Obrigatória", sub: "Sem entrada" },
  { feature: "Manutenção", own: "Sua responsabilidade", sub: "Inclusa" },
  { feature: "Seguro", own: "Custo extra", sub: "Incluso" },
  { feature: "Desvalorização", own: "Você perde dinheiro", sub: "Sem preocupação" },
  { feature: "Burocracia", own: "Financiamento, IPVA, licenciamento", sub: "Tudo resolvido" },
  { feature: "Troca de carro novo", own: "Difícil e caro", sub: "Facilitada" },
  { feature: "Custo mensal previsível", own: "Imprevisível", sub: "Valor mensal sem surpresas" },
];

const ComparisonSection = () => {
  return (
    <section className="py-20 md:py-28 bg-background">
      <div className="container">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-sm font-semibold uppercase tracking-wider text-accent">Compare</span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mt-3 mb-4">
            Carro próprio vs Assinatura de carro zero km
          </h2>
          <p className="text-muted-foreground text-lg">
            Veja por que assinar um carro novo é a escolha inteligente.
          </p>
        </div>

        <div className="max-w-3xl mx-auto rounded-2xl overflow-hidden border border-border shadow-card">
          {/* Header */}
          <div className="grid grid-cols-3">
            <div className="p-4 md:p-6 font-semibold text-sm md:text-base bg-accent text-accent-foreground" />
            <div className="p-4 md:p-6 font-semibold text-sm md:text-base text-center bg-accent text-accent-foreground">
              Carro Próprio
            </div>
            <div className="p-4 md:p-6 font-semibold text-sm md:text-base text-center bg-primary text-primary-foreground">
              Assinatura zero km
            </div>
          </div>

          {rows.map(({ feature, own, sub }, i) => (
            <div key={feature} className={`grid grid-cols-3 ${i % 2 === 0 ? "bg-card" : "bg-muted/30"}`}>
              <div className="p-4 md:p-6 font-medium text-sm text-foreground">{feature}</div>
              <div className="p-4 md:p-6 text-sm text-center text-muted-foreground flex items-center justify-center gap-1">
                <X size={18} strokeWidth={3} className="shrink-0 text-destructive" aria-hidden />
                <span className="hidden sm:inline">{own}</span>
              </div>
              <div className="p-4 md:p-6 text-sm text-center text-foreground font-medium flex items-center justify-center gap-1">
                <Check
                  size={20}
                  strokeWidth={2.75}
                  className="shrink-0 text-[hsl(218_72%_18%)] dark:text-sky-400"
                  aria-hidden
                />
                <span className="hidden sm:inline">{sub}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ComparisonSection;
