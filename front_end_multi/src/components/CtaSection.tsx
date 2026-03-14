import { Button } from "@/components/ui/button";
import { MessageCircle, FileText } from "lucide-react";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const CtaSection = () => {
  const { whatsappUrl } = useSiteSettings();

  return (
    <section className="py-20 md:py-28 bg-hero relative overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-accent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent rounded-full blur-3xl" />
      </div>

      <div className="container relative z-10 text-center">
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-primary-foreground mb-6 max-w-3xl mx-auto">
          Pronto para dirigir um carro zero sem burocracia?
        </h2>
        <p className="text-lg text-primary-foreground/70 max-w-xl mx-auto mb-10">
          Fale com nossos especialistas e receba uma proposta personalizada em minutos.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button variant="cta" size="lg" className="text-base h-14 px-10" asChild>
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="mr-2" size={20} />
              Falar no WhatsApp
            </a>
          </Button>
          <Button variant="hero" size="lg" className="text-base h-14 px-10" asChild>
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
              <FileText className="mr-2" size={18} />
              Solicitar proposta
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default CtaSection;
