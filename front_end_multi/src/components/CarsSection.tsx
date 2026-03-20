import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MessageCircle,
  Loader2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Calculator,
  FileCheck,
} from "lucide-react";
import { useCarsData, type CarDisplay } from "@/hooks/useCarsData";
import { useCarPricesFull, type CarPriceVariant } from "@/hooks/useCarPricesFull";
import { useLogo } from "@/hooks/useLogo";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const LOGO_FALLBACK = "/logo-multi.svg";

function findImageForCar(
  carName: string,
  imageMap: Map<string, string>
): string {
  const lower = carName.toLowerCase().trim();
  if (imageMap.has(lower)) return imageMap.get(lower)!;
  for (const [registeredName, url] of imageMap) {
    if (lower.includes(registeredName) || registeredName.includes(lower))
      return url;
  }
  const words = lower.split(/\s+/);
  if (words.length >= 2) {
    const modelOnly = words.slice(1).join(" ");
    if (imageMap.has(modelOnly)) return imageMap.get(modelOnly)!;
    for (const [registeredName] of imageMap) {
      if (registeredName.includes(modelOnly))
        return imageMap.get(registeredName)!;
    }
  }
  return "";
}

function groupCarsByBrand(cars: CarDisplay[]): Map<string, CarDisplay[]> {
  const byBrand = new Map<string, CarDisplay[]>();
  for (const car of cars) {
    const brand = (car.marca || car.name.split(/\s+/)[0] || "Outros").trim();
    const key = brand.toLowerCase();
    if (!byBrand.has(key)) byBrand.set(key, []);
    byBrand.get(key)!.push(car);
  }
  return byBrand;
}

const fallbackCars: CarDisplay[] = [
  {
    name: "Sedan Executive",
    marca: "Sedan",
    category: "Sedan",
    minPrice: 2490,
    formattedPrice: "R$ 2.490",
    image: "",
  },
  {
    name: "SUV Premium",
    marca: "SUV",
    category: "SUV",
    minPrice: 3290,
    formattedPrice: "R$ 3.290",
    image: "",
  },
  {
    name: "Crossover Urban",
    marca: "Crossover",
    category: "Crossover",
    minPrice: 2890,
    formattedPrice: "R$ 2.890",
    image: "",
  },
  {
    name: "Compact Sport",
    marca: "Compact",
    category: "Compacto",
    minPrice: 1990,
    formattedPrice: "R$ 1.990",
    image: "",
  },
];

/* ─── Calculadora Panel ─── */
function CalculatorPanel({
  categorias,
  kmOptions,
  prazos,
  filter,
  onFilterChange,
  onClose,
}: {
  categorias: string[];
  kmOptions: string[];
  prazos: string[];
  filter: { categoria: string; km: string; prazo: string };
  onFilterChange: (k: "categoria" | "km" | "prazo", v: string) => void;
  onClose: () => void;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
          <Calculator size={20} className="text-accent" />
          Comparar
        </h3>
        <button
          type="button"
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground text-sm"
        >
          Fechar
        </button>
      </div>
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">
            Categoria
          </label>
          <Select
            value={filter.categoria || "__all__"}
            onValueChange={(v) =>
              onFilterChange("categoria", v === "__all__" ? "" : v)
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Todas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Todas</SelectItem>
              {categorias.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">
            Km Mensal
          </label>
          <Select
            value={filter.km || "__all__"}
            onValueChange={(v) => onFilterChange("km", v === "__all__" ? "" : v)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Todos</SelectItem>
              {kmOptions.map((k) => (
                <SelectItem key={k} value={k}>
                  {k}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">
            Prazo de Contrato
          </label>
          <Select
            value={filter.prazo || "__all__"}
            onValueChange={(v) =>
              onFilterChange("prazo", v === "__all__" ? "" : v)
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Todos</SelectItem>
              {prazos.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}

/* ─── Car Card (normal mode) ─── */
function CarCardNormal({
  car,
  fallbackImg,
  whatsappBase,
}: {
  car: CarDisplay;
  fallbackImg: string;
  whatsappBase: string;
}) {
  const msg = `Olá! Tenho interesse no modelo ${car.name}.`;
  const hasCarImage = !!(car.image && car.image.trim());
  const imgSrc = hasCarImage ? car.image : fallbackImg;
  return (
    <div className="flex-shrink-0 w-[min(280px,85vw)] group rounded-2xl bg-card border border-border/50 overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300">
      <div className="aspect-[4/3] overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <img
          src={imgSrc}
          alt={hasCarImage ? `${car.name} - carro por assinatura` : "Logo da empresa"}
          className={`w-full h-full ${hasCarImage ? "object-contain p-3 group-hover:scale-105" : "object-contain p-8 opacity-60"} transition-transform duration-500`}
          loading="lazy"
          onError={(e) => {
            e.currentTarget.src = fallbackImg;
            e.currentTarget.className = "w-full h-full object-contain p-8 opacity-60 transition-transform duration-500";
          }}
        />
      </div>
      <div className="p-5">
        {car.category && (
          <span className="text-xs font-semibold uppercase tracking-wider text-accent">
            {car.category}
          </span>
        )}
        <h4 className="text-lg font-bold text-foreground mt-1">{car.name}</h4>
        <p className="text-sm text-muted-foreground mt-1">
          A partir de{" "}
          <span className="text-xl font-bold text-foreground">
            {car.formattedPrice}
          </span>
          /mês
        </p>
        <Button variant="cta" className="w-full mt-4" size="sm" asChild>
          <a
            href={`${whatsappBase}${encodeURIComponent(msg)}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <MessageCircle size={16} className="mr-1" />
            Quero esse
          </a>
        </Button>
      </div>
    </div>
  );
}

/* ─── Car Card (calculator mode) ─── */
function CarCardCalculator({
  carKey,
  carName,
  marca,
  variants,
  selectedVariant,
  onSelectVariant,
  fallbackImg,
  imageMap,
  whatsappBase,
  filterKm,
  filterPrazo,
}: {
  carKey: string;
  carName: string;
  marca: string;
  variants: CarPriceVariant[];
  selectedVariant: CarPriceVariant | null;
  onSelectVariant: (v: CarPriceVariant | null) => void;
  fallbackImg: string;
  imageMap: Map<string, string>;
  whatsappBase: string;
  filterKm: string;
  filterPrazo: string;
}) {
  const navigate = useNavigate();
  const displayName = [marca, carName].filter(Boolean).join(" ") || carName;
  const foundImage = findImageForCar(displayName, imageMap);
  const hasCarImage = !!(foundImage && foundImage.trim());
  const imgSrc = hasCarImage ? foundImage : fallbackImg;

  const whatsappMsg = selectedVariant
    ? `Quero assinar esse carro ${marca} ${selectedVariant.modelo_carro || carName} ${selectedVariant.categoria} ${selectedVariant.franquia_km_mes} ${selectedVariant.prazo_contrato} ${selectedVariant.formattedPrice}`
    : `Olá! Tenho interesse no modelo ${displayName}.`;

  return (
    <div className="flex-shrink-0 w-[min(280px,85vw)] group rounded-2xl bg-card border border-border/50 overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300">
      <div className="aspect-[4/3] overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <img
          src={imgSrc}
          alt={hasCarImage ? `${displayName} - carro por assinatura` : "Logo da empresa"}
          className={`w-full h-full ${hasCarImage ? "object-contain p-3 group-hover:scale-105" : "object-contain p-8 opacity-60"} transition-transform duration-500`}
          loading="lazy"
          onError={(e) => {
            e.currentTarget.src = fallbackImg;
            e.currentTarget.className = "w-full h-full object-contain p-8 opacity-60 transition-transform duration-500";
          }}
        />
      </div>
      <div className="p-5">
        {variants[0]?.categoria && (
          <span className="text-xs font-semibold uppercase tracking-wider text-accent">
            {variants[0].categoria}
          </span>
        )}
        <h4 className="text-lg font-bold text-foreground mt-1">{displayName}</h4>
        <p className="text-sm text-muted-foreground mt-1">
          {selectedVariant ? (
            <>
              <span className="text-xl font-bold text-foreground">
                {selectedVariant.formattedPrice}
              </span>
              /mês
            </>
          ) : (
            <>
              A partir de{" "}
              <span className="text-xl font-bold text-foreground">
                {(() => {
                  const prices = variants.map((v) => v.price).filter((p) => p > 0);
                  const min = prices.length > 0 ? Math.min(...prices) : 0;
                  return min > 0
                    ? min.toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                        minimumFractionDigits: 0,
                      })
                    : "Consulte";
                })()}
              </span>
              /mês
            </>
          )}
        </p>

        {variants.length > 1 && filterKm && filterPrazo && (
          <div className="mt-3">
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Escolha o modelo
            </label>
            <Select
              value={
                selectedVariant
                  ? `${selectedVariant.modelo_carro}|${selectedVariant.prazo_contrato}|${selectedVariant.franquia_km_mes}`
                  : "__none__"
              }
              onValueChange={(val) => {
                if (val === "__none__") {
                  onSelectVariant(null);
                  return;
                }
                const [modelo, prazo, km] = val.split("|");
                const v = variants.find(
                  (x) =>
                    x.modelo_carro === modelo &&
                    x.prazo_contrato === prazo &&
                    x.franquia_km_mes === km
                );
                onSelectVariant(v ?? null);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione o modelo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Selecione o modelo</SelectItem>
                {variants.map((v) => (
                  <SelectItem
                    key={`${v.modelo_carro}-${v.prazo_contrato}-${v.franquia_km_mes}`}
                    value={`${v.modelo_carro}|${v.prazo_contrato}|${v.franquia_km_mes}`}
                  >
                    {v.modelo_carro || "Padrão"} — {v.formattedPrice}/mês
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {variants.length === 1 && !selectedVariant && filterKm && filterPrazo && (
          <div className="mt-2">
            <button
              type="button"
              className="text-sm text-accent hover:underline"
              onClick={() => onSelectVariant(variants[0])}
            >
              Usar este plano
            </button>
          </div>
        )}

        <div className="mt-4 flex flex-col gap-2">
          {selectedVariant && (
            <Button
              variant="outline"
              className="w-full"
              size="sm"
              onClick={() =>
                navigate("/cadastro", {
                  state: {
                    car: displayName,
                    variant: selectedVariant,
                  },
                })
              }
            >
              <FileCheck size={16} className="mr-1" />
              Contratar
            </Button>
          )}
          <Button variant="cta" className="w-full" size="sm" asChild>
            <a
              href={`${whatsappBase}${encodeURIComponent(whatsappMsg)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircle size={16} className="mr-1" />
              Quero esse
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ─── Brand Carousel (normal) ─── */
const BrandCarousel = ({
  brand,
  cars,
  fallbackImg,
  whatsappBase,
}: {
  brand: string;
  cars: CarDisplay[];
  fallbackImg: string;
  whatsappBase: string;
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const scroll = useCallback((dir: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const step = el.clientWidth * 0.8;
    el.scrollBy({ left: dir === "left" ? -step : step, behavior: "smooth" });
  }, []);

  return (
    <div className="mb-12 last:mb-0">
      <h3 className="text-xl md:text-2xl font-bold text-foreground mb-4 px-1">
        {brand}
      </h3>
      <div className="relative">
        <button
          type="button"
          onClick={() => scroll("left")}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 flex items-center justify-center rounded-full bg-background/90 backdrop-blur-sm border border-border shadow-lg opacity-60 hover:opacity-100 transition-opacity -ml-2"
          aria-label="Anterior"
        >
          <ChevronLeft size={24} />
        </button>
        <button
          type="button"
          onClick={() => scroll("right")}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 flex items-center justify-center rounded-full bg-background/90 backdrop-blur-sm border border-border shadow-lg opacity-60 hover:opacity-100 transition-opacity -mr-2"
          aria-label="Próximo"
        >
          <ChevronRight size={24} />
        </button>
        <div
          ref={scrollRef}
          className="flex gap-6 overflow-x-auto scroll-smooth scrollbar-hide pb-4 px-2"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {cars.map((car) => (
            <CarCardNormal
              key={car.name}
              car={car}
              fallbackImg={fallbackImg}
              whatsappBase={whatsappBase}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

/* ─── Brand Carousel (calculator mode) ─── */
function BrandCarouselCalculator({
  brand,
  carGroups,
  selectedByCar,
  onSelectVariant,
  fallbackImg,
  imageMap,
  whatsappBase,
  filterKm,
  filterPrazo,
}: {
  brand: string;
  carGroups: Map<string, CarPriceVariant[]>;
  selectedByCar: Map<string, CarPriceVariant | null>;
  onSelectVariant: (carKey: string, v: CarPriceVariant | null) => void;
  fallbackImg: string;
  imageMap: Map<string, string>;
  whatsappBase: string;
  filterKm: string;
  filterPrazo: string;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const scroll = useCallback((dir: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const step = el.clientWidth * 0.8;
    el.scrollBy({ left: dir === "left" ? -step : step, behavior: "smooth" });
  }, []);

  const entries = Array.from(carGroups.entries());

  return (
    <div className="mb-12 last:mb-0">
      <h3 className="text-xl md:text-2xl font-bold text-foreground mb-4 px-1">
        {brand}
      </h3>
      <div className="relative">
        <button
          type="button"
          onClick={() => scroll("left")}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 flex items-center justify-center rounded-full bg-background/90 backdrop-blur-sm border border-border shadow-lg opacity-60 hover:opacity-100 transition-opacity -ml-2"
          aria-label="Anterior"
        >
          <ChevronLeft size={24} />
        </button>
        <button
          type="button"
          onClick={() => scroll("right")}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 flex items-center justify-center rounded-full bg-background/90 backdrop-blur-sm border border-border shadow-lg opacity-60 hover:opacity-100 transition-opacity -mr-2"
          aria-label="Próximo"
        >
          <ChevronRight size={24} />
        </button>
        <div
          ref={scrollRef}
          className="flex gap-6 overflow-x-auto scroll-smooth scrollbar-hide pb-4 px-2"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {entries.map(([carKey, variants]) => {
            const [marcaKey, nomeKey] = carKey.split("|");
            return (
              <CarCardCalculator
                key={carKey}
                carKey={carKey}
                carName={nomeKey}
                marca={marcaKey}
                variants={variants}
                selectedVariant={selectedByCar.get(carKey) ?? null}
                onSelectVariant={(v) => onSelectVariant(carKey, v)}
                fallbackImg={fallbackImg}
                imageMap={imageMap}
                whatsappBase={whatsappBase}
                filterKm={filterKm}
                filterPrazo={filterPrazo}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

const CarsSection = () => {
  const {
    cars,
    carSource,
    imageMap,
    isLoading,
    isError,
    error,
    isConfigured,
  } = useCarsData();
  const {
    variants,
    categorias,
    kmOptions,
    prazos,
    hasCalculatorData,
  } = useCarPricesFull(carSource);
  const { logoUrl } = useLogo();
  const { whatsappBase } = useSiteSettings();
  const fallbackImg = logoUrl || LOGO_FALLBACK;

  const [calculatorOpen, setCalculatorOpen] = useState(false);
  const [filter, setFilter] = useState({
    categoria: "",
    km: "",
    prazo: "",
  });
  const [selectedByCar, setSelectedByCar] = useState<
    Map<string, CarPriceVariant | null>
  >(new Map());

  const handleFilterChange = useCallback(
    (k: "categoria" | "km" | "prazo", v: string) => {
      setFilter((prev) => ({ ...prev, [k]: v }));
      setSelectedByCar(new Map());
    },
    []
  );

  const filteredVariants = variants.filter((v) => {
    if (filter.categoria && v.categoria !== filter.categoria) return false;
    if (filter.km && v.franquia_km_mes !== filter.km) return false;
    if (filter.prazo && v.prazo_contrato !== filter.prazo) return false;
    return true;
  });

  const displayCars = isConfigured && cars.length > 0 ? cars : fallbackCars;

  // Usar a mesma lista única de carros da visualização normal para evitar duplicatas
  const calculatorCarGroups = new Map<string, CarPriceVariant[]>();
  for (const car of displayCars) {
    const carDisplayNameNorm = car.name.trim().replace(/\s+/g, " ").toLowerCase();
    const matchingVariants = filteredVariants.filter((v) => {
      const vDisplayName = `${(v.marca ?? "").trim()} ${(v.nome_carro ?? "").trim()}`.trim().replace(/\s+/g, " ").toLowerCase();
      return vDisplayName === carDisplayNameNorm;
    });
    if (matchingVariants.length > 0) {
      const parts = car.name.trim().split(/\s+/);
      const marcaPart = car.marca || parts[0] || "";
      const modelPart = car.marca ? car.name.replace(new RegExp(`^${(car.marca || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*`, "i"), "").trim() : parts.slice(1).join(" ") || car.name;
      const key = `${marcaPart}|${modelPart || car.name}`;
      calculatorCarGroups.set(key, matchingVariants);
    }
  }

  const calculatorBrandGroups = new Map<string, Map<string, CarPriceVariant[]>>();
  for (const [carKey, vars] of calculatorCarGroups) {
    const marca = vars[0]?.marca || "Outros";
    const brandKey = marca.toLowerCase();
    if (!calculatorBrandGroups.has(brandKey))
      calculatorBrandGroups.set(brandKey, new Map());
    calculatorBrandGroups.get(brandKey)!.set(carKey, vars);
  }

  const carsByBrand = groupCarsByBrand(displayCars);
  const brandEntries = Array.from(carsByBrand.entries()).sort(([a], [b]) =>
    a.localeCompare(b)
  );

  return (
    <section id="modelos" className="py-20 md:py-28 bg-muted/50">
      <div className="container">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-sm font-semibold uppercase tracking-wider text-accent">
            Frota
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mt-3 mb-4">
            Modelos disponíveis novinhos
          </h2>
          <p className="text-muted-foreground text-lg">
            Escolha o carro zero km ideal para o seu estilo de vida.
          </p>

          {hasCalculatorData && (
            <div className="mt-6">
              <Button
                variant="cta"
                size="lg"
                className="text-base h-14 px-8"
                onClick={() => setCalculatorOpen((o) => !o)}
              >
                <Calculator className="mr-2" size={20} />
                Comparar
              </Button>
            </div>
          )}
        </div>

        {!isConfigured && (
          <div className="mb-8 p-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm text-center">
            <AlertTriangle className="inline-block mr-2 -mt-0.5" size={16} />
            Nenhuma fonte de carros ativa. Ative <strong>Planilhas</strong> ou{" "}
            <strong>Importar</strong> no painel administrativo.
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
            <p>Carregando modelos...</p>
          </div>
        ) : calculatorOpen && hasCalculatorData ? (
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="lg:w-72 shrink-0 sticky top-6 self-start">
              <CalculatorPanel
                categorias={categorias}
                kmOptions={kmOptions}
                prazos={prazos}
                filter={filter}
                onFilterChange={handleFilterChange}
                onClose={() => setCalculatorOpen(false)}
              />
            </div>
            <div className="flex-1 min-w-0">
              {calculatorBrandGroups.size === 0 ? (
                <p className="text-muted-foreground text-center py-12">
                  Nenhum carro encontrado com os filtros selecionados. Tente
                  alterar Categoria, Km Mensal ou Prazo.
                </p>
              ) : (
                <div className="space-y-0">
                  {Array.from(calculatorBrandGroups.entries())
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([brandKey, carGroups]) => {
                      const brandLabel =
                        carGroups.values().next().value?.[0]?.marca ||
                        brandKey.charAt(0).toUpperCase() + brandKey.slice(1);
                      return (
                        <BrandCarouselCalculator
                          key={brandKey}
                          brand={brandLabel}
                          carGroups={carGroups}
                          selectedByCar={selectedByCar}
                          onSelectVariant={(carKey, v) => {
                            setSelectedByCar((prev) => {
                              const next = new Map(prev);
                              next.set(carKey, v);
                              return next;
                            });
                          }}
                          fallbackImg={fallbackImg}
                          imageMap={imageMap}
                          whatsappBase={whatsappBase}
                          filterKm={filter.km}
                          filterPrazo={filter.prazo}
                        />
                      );
                    })}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-0">
            {brandEntries.map(([brandKey, brandCars]) => {
              const brandLabel =
                brandCars[0]?.marca ||
                brandKey.charAt(0).toUpperCase() + brandKey.slice(1);
              return (
                <BrandCarousel
                  key={brandKey}
                  brand={brandLabel}
                  cars={brandCars}
                  fallbackImg={fallbackImg}
                  whatsappBase={whatsappBase}
                />
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

export default CarsSection;
