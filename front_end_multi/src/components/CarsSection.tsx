import { Button } from "@/components/ui/button";
import { MessageCircle, Loader2, AlertTriangle } from "lucide-react";
import { useCarsData, type CarDisplay } from "@/hooks/useCarsData";
import { useLogo } from "@/hooks/useLogo";
import { useSiteSettings } from "@/hooks/useSiteSettings";
const LOGO_FALLBACK = "/logo-multi.svg";

const fallbackCars: CarDisplay[] = [
  { name: "Sedan Executive", category: "Sedan", minPrice: 2490, formattedPrice: "R$ 2.490", image: "" },
  { name: "SUV Premium", category: "SUV", minPrice: 3290, formattedPrice: "R$ 3.290", image: "" },
  { name: "Crossover Urban", category: "Crossover", minPrice: 2890, formattedPrice: "R$ 2.890", image: "" },
  { name: "Compact Sport", category: "Compacto", minPrice: 1990, formattedPrice: "R$ 1.990", image: "" },
];

const CarsSection = () => {
  const { cars, isLoading, isError, error, isConfigured } = useCarsData();
  const { logoUrl } = useLogo();
  const { whatsappBase } = useSiteSettings();
  const fallbackImg = logoUrl || LOGO_FALLBACK;

  const displayCars = isConfigured && cars.length > 0 ? cars : fallbackCars;

  return (
    <section id="modelos" className="py-20 md:py-28 bg-muted/50">
      <div className="container">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-sm font-semibold uppercase tracking-wider text-accent">Frota</span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mt-3 mb-4">
            Modelos disponíveis
          </h2>
          <p className="text-muted-foreground text-lg">
            Escolha o carro ideal para o seu estilo de vida.
          </p>
        </div>

        {!isConfigured && (
          <div className="mb-8 p-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm text-center">
            <AlertTriangle className="inline-block mr-2 -mt-0.5" size={16} />
            Google Sheets não configurado. Crie o arquivo <code className="font-mono bg-amber-100 px-1 rounded">.env</code> com
            base no <code className="font-mono bg-amber-100 px-1 rounded">.env.example</code> e reinicie o servidor.
          </div>
        )}

        {isError && (
          <div className="mb-8 p-4 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm text-center">
            <AlertTriangle className="inline-block mr-2 -mt-0.5" size={16} />
            Erro ao carregar dados: {error?.message || "Erro desconhecido"}
          </div>
        )}

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="animate-spin mb-4" size={32} />
            <p>Carregando modelos da planilha...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {displayCars.map((car) => (
              <div
                key={car.name}
                className="group rounded-2xl bg-card border border-border/50 overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300"
              >
                <div className="aspect-[4/3] overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
                  <img
                    src={car.image || fallbackImg}
                    alt={car.image ? `${car.name} - carro por assinatura` : "Logo da empresa"}
                    className={`w-full h-full ${car.image ? "object-contain p-3 group-hover:scale-105" : "object-contain p-8 opacity-60"} transition-transform duration-500`}
                    loading="lazy"
                  />
                </div>
                <div className="p-6">
                  {car.category && (
                    <span className="text-xs font-semibold uppercase tracking-wider text-accent">
                      {car.category}
                    </span>
                  )}
                  <h3 className="text-lg font-bold text-foreground mt-1">{car.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    A partir de <span className="text-2xl font-bold text-foreground">{car.formattedPrice}</span>/mês
                  </p>
                  <Button variant="cta" className="w-full mt-4" asChild>
                    <a
                      href={`${whatsappBase}${encodeURIComponent(`Olá! Tenho interesse no modelo ${car.name}.`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <MessageCircle size={16} className="mr-1" />
                      Quero esse
                    </a>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default CarsSection;
