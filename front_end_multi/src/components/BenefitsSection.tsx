import { Shield, Car, Wrench, CreditCard, RefreshCw, Clock } from "lucide-react";

const benefits = [
  { icon: CreditCard, title: "Sem Entrada", desc: "Comece a dirigir sem desembolsar um centavo de entrada." },
  { icon: Car, title: "Carro Zero Km", desc: "Veículos novos, direto da concessionária para você." },
  { icon: Wrench, title: "Manutenção Inclusa", desc: "Revisões e manutenções cobertas na mensalidade." },
  { icon: Shield, title: "Seguro Incluso", desc: "Proteção total sem custos adicionais." },
  { icon: RefreshCw, title: "Troca Facilitada", desc: "Troque de carro novo quando quiser, com total flexibilidade." },
  { icon: Clock, title: "Entrega Rápida", desc: "Receba seu carro zero km em poucos dias, sem burocracia." },
];

const BenefitsSection = () => {
  return (
    <section id="beneficios" className="py-20 md:py-28 bg-background">
      <div className="container">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-sm font-semibold uppercase tracking-wider text-accent">Vantagens</span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mt-3 mb-4">
            Por que assinar um carro zero km?
          </h2>
          <p className="text-muted-foreground text-lg">
            Descubra os benefícios de ter um carro novo por assinatura e esqueça as dores de cabeça do carro próprio.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {benefits.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="group p-8 rounded-2xl bg-card shadow-card hover:shadow-card-hover transition-all duration-300 border border-border/50 hover:border-accent/30"
            >
              <div className="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center mb-5 group-hover:bg-accent/20 transition-colors">
                <Icon className="text-accent" size={28} />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">{title}</h3>
              <p className="text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BenefitsSection;
