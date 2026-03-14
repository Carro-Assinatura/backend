import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Ricardo M.",
    role: "Empresário",
    text: "A melhor decisão que tomei. Sem dor de cabeça com manutenção e sempre com carro novo. Recomendo demais!",
  },
  {
    name: "Fernanda L.",
    role: "Médica",
    text: "Praticidade total. Em menos de uma semana já estava com meu carro zero na garagem. Atendimento impecável.",
  },
  {
    name: "Carlos A.",
    role: "Executivo",
    text: "Financeiramente faz muito mais sentido do que financiar. Custo previsível e sem surpresas desagradáveis.",
  },
];

const stats = [
  { value: "2.500+", label: "Carros entregues" },
  { value: "98%", label: "Satisfação" },
  { value: "4.9", label: "Avaliação média" },
];

const TestimonialsSection = () => {
  return (
    <section className="py-20 md:py-28 bg-background">
      <div className="container">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-sm font-semibold uppercase tracking-wider text-accent">Depoimentos</span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mt-3 mb-4">
            Quem assina, aprova
          </h2>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto mb-16">
          {stats.map(({ value, label }) => (
            <div key={label} className="text-center p-6 rounded-2xl bg-primary">
              <div className="text-3xl md:text-4xl font-extrabold text-primary-foreground">{value}</div>
              <div className="text-sm text-primary-foreground/70 mt-1">{label}</div>
            </div>
          ))}
        </div>

        {/* Testimonials */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="p-8 rounded-2xl bg-card border border-border/50 shadow-card"
            >
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={16} className="fill-accent text-accent" />
                ))}
              </div>
              <p className="text-foreground/80 mb-6 leading-relaxed">"{t.text}"</p>
              <div>
                <div className="font-bold text-foreground">{t.name}</div>
                <div className="text-sm text-muted-foreground">{t.role}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
