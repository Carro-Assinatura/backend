import { Button } from "@/components/ui/button";
import { MessageCircle, FileText } from "lucide-react";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useContactAction } from "@/hooks/useContactAction";

const CtaSection = () => {
  const contact = useContactAction();

  return (
    <section className="py-20 md:py-28 bg-hero relative overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-accent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent rounded-full blur-3xl" />
      </div>

      <div className="container relative z-10 text-center">
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-primary-foreground mb-6 max-w-3xl mx-auto">
          Pronto para dirigir um carro zero km sem burocracia?
        </h2>
        <p className="text-lg text-primary-foreground/70 max-w-xl mx-auto mb-10">
          Fale com nossos especialistas e receba uma proposta personalizada em minutos.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {contact.type === "whatsapp" ? (
            <>
              <Button variant="cta" size="lg" className="text-base h-14 px-10" asChild>
                <a href={contact.href} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="mr-2" size={20} />
                  Falar no WhatsApp
                </a>
              </Button>
              <Button variant="hero" size="lg" className="text-base h-14 px-10" asChild>
                <a href={contact.href} target="_blank" rel="noopener noreferrer">
                  <FileText className="mr-2" size={18} />
                  Solicitar proposta
                </a>
              </Button>
            </>
          ) : (
            <>
              <Button variant="cta" size="lg" className="text-base h-14 px-10" onClick={contact.onClick}>
                <MessageCircle className="mr-2" size={20} />
                Falar no WhatsApp
              </Button>
              <Button variant="hero" size="lg" className="text-base h-14 px-10" onClick={contact.onClick}>
                <FileText className="mr-2" size={18} />
                Solicitar proposta
              </Button>
            </>
          )}
        </div>
      </div>
    </section>
  );
};

export default CtaSection;
