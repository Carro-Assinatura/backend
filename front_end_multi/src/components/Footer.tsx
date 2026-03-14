import { Button } from "@/components/ui/button";
import { MessageCircle, Phone, Instagram, Facebook, Linkedin } from "lucide-react";
import { useState } from "react";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const Footer = () => {
  const { whatsappUrl, whatsappBase, whatsappNumber, siteTitle, phoneFormatted } = useSiteSettings();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const msg = encodeURIComponent(`Olá! Meu nome é ${name} e meu telefone é ${phone}. Gostaria de saber mais sobre carros por assinatura.`);
    window.open(`${whatsappBase}${msg}`, "_blank");
  };

  return (
    <footer className="bg-secondary text-secondary-foreground">
      <div className="container py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div>
            <h3 className="font-display text-2xl font-bold mb-4">
              {siteTitle}
            </h3>
            <p className="text-secondary-foreground/60 text-sm leading-relaxed">
              A forma mais inteligente de dirigir um carro zero km. Sem entrada, sem burocracia, sem preocupação.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-bold mb-4">Navegação</h4>
            <nav className="flex flex-col gap-3">
              {[
                { label: "Início", href: "#inicio" },
                { label: "Benefícios", href: "#beneficios" },
                { label: "Como Funciona", href: "#como-funciona" },
                { label: "Modelos", href: "#modelos" },
                { label: "FAQ", href: "#faq" },
              ].map((link) => (
                <a key={link.href} href={link.href} className="text-sm text-secondary-foreground/60 hover:text-accent transition-colors">
                  {link.label}
                </a>
              ))}
            </nav>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-bold mb-4">Contato</h4>
            <div className="flex flex-col gap-3 text-sm text-secondary-foreground/60">
              <a href={`tel:+${whatsappNumber}`} className="flex items-center gap-2 hover:text-accent transition-colors">
                <Phone size={16} />
                {phoneFormatted}
              </a>
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-accent transition-colors">
                <MessageCircle size={16} />
                WhatsApp
              </a>
            </div>
            <div className="flex gap-3 mt-6">
              <a href="#" className="w-10 h-10 rounded-full bg-secondary-foreground/10 flex items-center justify-center hover:bg-accent/20 transition-colors" aria-label="Instagram">
                <Instagram size={18} />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-secondary-foreground/10 flex items-center justify-center hover:bg-accent/20 transition-colors" aria-label="Facebook">
                <Facebook size={18} />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-secondary-foreground/10 flex items-center justify-center hover:bg-accent/20 transition-colors" aria-label="LinkedIn">
                <Linkedin size={18} />
              </a>
            </div>
          </div>

          {/* Quick form */}
          <div>
            <h4 className="font-bold mb-4">Receba uma proposta</h4>
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <input
                type="text"
                placeholder="Seu nome"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                maxLength={100}
                className="px-4 py-3 rounded-lg bg-secondary-foreground/10 text-sm text-secondary-foreground placeholder:text-secondary-foreground/40 border border-secondary-foreground/10 focus:outline-none focus:border-accent"
              />
              <input
                type="tel"
                placeholder="Seu telefone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                maxLength={20}
                className="px-4 py-3 rounded-lg bg-secondary-foreground/10 text-sm text-secondary-foreground placeholder:text-secondary-foreground/40 border border-secondary-foreground/10 focus:outline-none focus:border-accent"
              />
              <Button variant="cta" type="submit" className="w-full">
                Enviar
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-secondary-foreground/10">
        <div className="container py-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-secondary-foreground/40">
          <p>© {new Date().getFullYear()} {siteTitle}. Todos os direitos reservados.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-secondary-foreground/60 transition-colors">Termos de Uso</a>
            <a href="#" className="hover:text-secondary-foreground/60 transition-colors">Política de Privacidade</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
