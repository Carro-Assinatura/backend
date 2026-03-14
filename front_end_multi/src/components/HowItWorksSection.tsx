import { Search, FileText, Truck, Smile } from "lucide-react";

const steps = [
  { icon: Search, step: "01", title: "Escolha seu carro", desc: "Navegue pelos modelos disponíveis e escolha o que mais combina com você." },
  { icon: FileText, step: "02", title: "Escolha o plano", desc: "Selecione o plano de assinatura ideal para suas necessidades e orçamento." },
  { icon: Truck, step: "03", title: "Receba o carro", desc: "Seu carro zero km é entregue na sua porta, sem burocracia." },
  { icon: Smile, step: "04", title: "Dirija sem preocupações", desc: "Aproveite a liberdade de dirigir sem se preocupar com manutenção ou desvalorização." },
];

const HowItWorksSection = () => {
  return (
    <section id="como-funciona" className="py-20 md:py-28 bg-muted/50">
      <div className="container">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-sm font-semibold uppercase tracking-wider text-accent">Simples e rápido</span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mt-3 mb-4">
            Como funciona?
          </h2>
          <p className="text-muted-foreground text-lg">
            Em 4 passos simples, você está dirigindo um carro zero km.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map(({ icon: Icon, step, title, desc }, i) => (
            <div key={step} className="relative text-center">
              <div className="w-20 h-20 rounded-2xl bg-primary mx-auto mb-6 flex items-center justify-center">
                <Icon className="text-primary-foreground" size={32} />
              </div>
              <span className="text-sm font-bold text-accent">{step}</span>
              <h3 className="text-xl font-bold text-foreground mt-1 mb-2">{title}</h3>
              <p className="text-muted-foreground text-sm">{desc}</p>

              {/* Connector line */}
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-10 left-[60%] w-[80%] h-[2px] bg-border" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
