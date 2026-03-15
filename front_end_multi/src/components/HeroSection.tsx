import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { MessageCircle, ArrowRight } from "lucide-react";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useContactAction } from "@/hooks/useContactAction";

const heroImages = [
  {
    src: "https://di-uploads-pod17.dealerinspire.com/bmwoftyler/uploads/2025/11/2026-BMW-4-Series-Sedan.jpg",
    alt: "BMW premium por assinatura Multi Experiências",
  },
  {
    src: "https://newsmotor.com.br/wp-content/uploads/2024/12/gwm-tank-300.jpg",
    alt: "SUV off-road estilo Tank 300 por assinatura Multi Experiências",
  },
  {
    src: "https://motorshow.com.br/wp-content/uploads/sites/2/2025/11/2026-toyota-hilux.jpg",
    alt: "Camionete pickup por assinatura Multi Experiências",
  },
];

const INTERVAL_MS = 5000;

const HeroSection = () => {
  const { siteDescription } = useSiteSettings();
  const contact = useContactAction();
  const [currentIndex, setCurrentIndex] = useState(() =>
    Math.floor(Math.random() * heroImages.length)
  );

  const advance = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % heroImages.length);
  }, []);

  useEffect(() => {
    const timer = setInterval(advance, INTERVAL_MS);
    return () => clearInterval(timer);
  }, [advance]);

  return (
    <section id="inicio" className="relative min-h-screen flex items-center bg-hero overflow-hidden">
      {/* Background images with crossfade */}
      <div className="absolute inset-0">
        {heroImages.map((image, index) => (
          <img
            key={image.src}
            src={image.src}
            alt={image.alt}
            className="absolute inset-0 w-full h-full object-cover opacity-40 transition-opacity duration-1000 ease-in-out"
            style={{ opacity: index === currentIndex ? 0.4 : 0 }}
            loading={index === 0 ? "eager" : "lazy"}
          />
        ))}
        <div className="absolute inset-0 bg-hero opacity-70" />
      </div>

      <div className="container relative z-10 pt-24 pb-16 md:pt-32 md:pb-24">
        <div className="max-w-3xl">
          <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase bg-accent/20 text-accent-foreground mb-6 animate-fade-up">
            Carro por assinatura
          </span>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold leading-[1.08] text-primary-foreground mb-6 animate-fade-up" style={{ animationDelay: "0.1s" }}>
            Dirija um carro zero<br />
            <span className="text-gradient">sem entrada</span> e sem preocupação.
          </h1>

          <p className="text-lg md:text-xl text-primary-foreground/70 max-w-xl mb-10 animate-fade-up" style={{ animationDelay: "0.2s" }}>
            Assinatura de carros com manutenção inclusa, seguro e planos flexíveis. 
            Sem burocracia, sem financiamento.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 animate-fade-up" style={{ animationDelay: "0.3s" }}>
            {contact.type === "whatsapp" ? (
              <Button variant="cta" size="lg" className="text-base h-14 px-8" asChild>
                <a href={contact.href} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="mr-2" size={20} />
                  Falar no WhatsApp
                </a>
              </Button>
            ) : (
              <Button variant="cta" size="lg" className="text-base h-14 px-8" onClick={contact.onClick}>
                <MessageCircle className="mr-2" size={20} />
                Falar no WhatsApp
              </Button>
            )}
            <Button variant="hero" size="lg" className="text-base h-14 px-8" asChild>
              <a href="#modelos">
                Ver modelos disponíveis
                <ArrowRight className="ml-2" size={18} />
              </a>
            </Button>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap gap-6 mt-12 animate-fade-up" style={{ animationDelay: "0.4s" }}>
            {["Sem Entrada", "Carro 0km", "Manutenção Inclusa"].map((badge) => (
              <div key={badge} className="flex items-center gap-2 text-primary-foreground/60 text-sm">
                <div className="w-2 h-2 rounded-full bg-accent" />
                {badge}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
