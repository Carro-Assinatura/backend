import { useRef, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Star, ChevronLeft, ChevronRight } from "lucide-react";
import { api } from "@/services/api";

function formatDisplayName(client: {
  full_name?: string;
  person_type?: string;
  company_name?: string;
  responsible_name?: string;
} | null | undefined): string {
  if (!client) return "Cliente";
  const name = client.person_type === "pj"
    ? (client.responsible_name || client.company_name || "")
    : (client.full_name || "");
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "Cliente";
  if (parts.length === 1) return parts[0];
  const firstName = parts[0];
  const secondInitial = parts[1].charAt(0).toUpperCase();
  return `${firstName} ${secondInitial}.`;
}

function getOccupation(client: {
  person_type?: string;
  occupation?: string;
  responsible_occupation?: string;
  responsible_role?: string;
} | null | undefined): string {
  if (!client) return "Cliente";
  if (client.person_type === "pj") {
    return client.responsible_occupation || client.responsible_role || "Empresário";
  }
  return client.occupation || "Cliente";
}

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

const stats = [
  { value: "2.500+", label: "Carros entregues" },
  { value: "98%", label: "Satisfação" },
  { value: "4.9", label: "Avaliação média" },
];

const TestimonialsSection = () => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: testimonials = [], isLoading } = useQuery({
    queryKey: ["testimonials-public"],
    queryFn: () => api.getTestimonialsPublic(),
  });

  const displayTestimonials = useMemo(() => {
    if (testimonials.length > 20) return shuffleArray(testimonials);
    return testimonials;
  }, [testimonials]);

  const loopedTestimonials = useMemo(
    () => [...displayTestimonials, ...displayTestimonials],
    [displayTestimonials]
  );

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || displayTestimonials.length === 0) return;
    const onScrollEnd = () => {
      const total = el.scrollWidth;
      const half = total / 2;
      if (el.scrollLeft >= total - 30) {
        el.scrollTo({ left: 0, behavior: "auto" });
      } else if (el.scrollLeft <= 5 && half > el.clientWidth) {
        el.scrollTo({ left: half - el.clientWidth, behavior: "auto" });
      }
    };
    el.addEventListener("scrollend", onScrollEnd);
    return () => el.removeEventListener("scrollend", onScrollEnd);
  }, [displayTestimonials.length]);

  const scroll = (dir: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const cardWidth = el.querySelector("[data-testimonial-card]")?.clientWidth ?? 420;
    const gap = 24;
    const scrollAmount = (cardWidth + gap) * (dir === "left" ? -1 : 1);
    const totalWidth = el.scrollWidth;

    if (dir === "right") {
      if (el.scrollLeft + el.clientWidth >= totalWidth - 20) {
        el.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        el.scrollBy({ left: scrollAmount, behavior: "smooth" });
      }
    } else {
      if (el.scrollLeft <= 20) {
        el.scrollTo({ left: totalWidth - el.clientWidth, behavior: "smooth" });
      } else {
        el.scrollBy({ left: scrollAmount, behavior: "smooth" });
      }
    }
  };

  if (isLoading) {
    return (
      <section className="py-20 md:py-28 bg-background">
        <div className="container">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-sm font-semibold uppercase tracking-wider text-accent">Depoimentos</span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mt-3 mb-4">
              Quem assina, aprova
            </h2>
          </div>
          <div className="flex justify-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-accent border-t-transparent rounded-full" />
          </div>
        </div>
      </section>
    );
  }

  if (testimonials.length === 0) {
    return (
      <section className="py-20 md:py-28 bg-background">
        <div className="container">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-sm font-semibold uppercase tracking-wider text-accent">Depoimentos</span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mt-3 mb-4">
              Quem assina, aprova
            </h2>
          </div>
          <div className="text-center py-12 text-muted-foreground">
            Em breve, depoimentos de nossos clientes.
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 md:py-28 bg-background overflow-hidden">
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

        {/* Carousel - estende além das margens, usa largura total da tela */}
        <div className="relative w-screen ml-[calc(50%-50vw)] max-w-[100vw]">
          <button
            type="button"
            onClick={() => scroll("left")}
            className="absolute left-3 md:left-6 top-1/2 -translate-y-1/2 z-10 w-12 h-12 flex items-center justify-center rounded-full bg-background/80 backdrop-blur-sm border border-border shadow-lg opacity-40 hover:opacity-70 transition-opacity"
            aria-label="Anterior"
          >
            <ChevronLeft size={24} />
          </button>
          <button
            type="button"
            onClick={() => scroll("right")}
            className="absolute right-3 md:right-6 top-1/2 -translate-y-1/2 z-10 w-12 h-12 flex items-center justify-center rounded-full bg-background/80 backdrop-blur-sm border border-border shadow-lg opacity-40 hover:opacity-70 transition-opacity"
            aria-label="Próximo"
          >
            <ChevronRight size={24} />
          </button>

          <div
            ref={scrollRef}
            className="flex gap-6 overflow-x-auto scroll-smooth scrollbar-hide pb-4 px-4 sm:px-8 md:px-12 lg:px-16"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {loopedTestimonials.map((t, idx) => (
              <div
                key={`${t.id}-${idx}`}
                data-testimonial-card
                className="flex-shrink-0 w-[min(90vw,420px)] rounded-2xl bg-card border border-border/50 shadow-card overflow-hidden flex flex-col"
              >
                {/* Imagem ocupa praticamente todo o espaço do depoimento */}
                <div className="relative w-full h-[320px] sm:h-[360px] bg-muted">
                  {t.delivery_photo_url ? (
                    <img
                      src={t.delivery_photo_url}
                      alt="Foto entrega"
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-primary/10">
                      <div className="h-24 w-24 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-4xl">
                        {formatDisplayName(t.client).charAt(0)}
                      </div>
                    </div>
                  )}
                </div>
                {/* Texto e autor */}
                <div className="p-4 flex flex-col">
                  <div className="flex gap-1 mb-3">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={14} className="fill-accent text-accent" />
                    ))}
                  </div>
                  <p className="text-foreground/80 text-sm leading-relaxed flex-1 line-clamp-4">"{t.testimonial_text}"</p>
                  <div className="mt-4 pt-3 border-t border-border/50">
                    <div className="font-bold text-foreground text-sm">{formatDisplayName(t.client)}</div>
                    <div className="text-xs text-muted-foreground">{getOccupation(t.client)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
