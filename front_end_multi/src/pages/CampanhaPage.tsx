import { useState, useCallback, useRef, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { MessageCircle, Loader2, ChevronLeft, ChevronRight, Menu, ChevronDown } from "lucide-react";
import { useCarPricesFull, type CarPriceVariant } from "@/hooks/useCarPricesFull";
import { useLogo } from "@/hooks/useLogo";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useQuery } from "@tanstack/react-query";
import { getCarImagesMap } from "@/services/googleSheets";

const LOGO_FALLBACK = "/logo-multi.svg";

function findImageForCar(carName: string, imageMap: Map<string, string>): string {
  const lower = carName.toLowerCase().trim();
  if (imageMap.has(lower)) return imageMap.get(lower)!;
  for (const [registeredName, url] of imageMap) {
    if (lower.includes(registeredName) || registeredName.includes(lower)) return url;
  }
  const words = lower.split(/\s+/);
  if (words.length >= 2) {
    const modelOnly = words.slice(1).join(" ");
    if (imageMap.has(modelOnly)) return imageMap.get(modelOnly)!;
  }
  return "";
}

function FilterForm({
  filter,
  handleFilterChange,
  categorias,
  kmOptions,
  prazos,
}: {
  filter: { categoria: string; km: string; prazo: string };
  handleFilterChange: (k: "categoria" | "km" | "prazo", v: string) => void;
  categorias: string[];
  kmOptions: string[];
  prazos: string[];
}) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1">Categoria</label>
        <Select
          value={filter.categoria || "__all__"}
          onValueChange={(v) => handleFilterChange("categoria", v)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Selecione" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Selecione a categoria</SelectItem>
            {categorias.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1">Km Mensal</label>
        <Select value={filter.km || "__all__"} onValueChange={(v) => handleFilterChange("km", v)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Selecione" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Selecione os km</SelectItem>
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
          onValueChange={(v) => handleFilterChange("prazo", v)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Selecione" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Selecione o prazo</SelectItem>
            {prazos.map((p) => (
              <SelectItem key={p} value={p}>
                {p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

function CampanhaPage() {
  const [searchParams] = useSearchParams();
  const { logoUrl } = useLogo();
  const { whatsappBase } = useSiteSettings();
  const fallbackImg = logoUrl || LOGO_FALLBACK;

  const [isScrolled, setIsScrolled] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => setIsScrolled(!entry.isIntersecting),
      { threshold: 0, rootMargin: "-1px 0px 0px 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const { variants, categorias, kmOptions, prazos, isLoading, hasCalculatorData } =
    useCarPricesFull("importar");

  const { data: imageMap = new Map<string, string>() } = useQuery({
    queryKey: ["car-images-map"],
    queryFn: getCarImagesMap,
    staleTime: 5 * 60 * 1000,
  });

  const [filter, setFilter] = useState({
    categoria: "",
    km: "",
    prazo: "",
  });
  const [selectedByCar, setSelectedByCar] = useState<Map<string, CarPriceVariant | null>>(new Map());

  const handleFilterChange = useCallback((k: "categoria" | "km" | "prazo", v: string) => {
    setFilter((prev) => ({ ...prev, [k]: v === "__all__" ? "" : v }));
    setSelectedByCar(new Map());
  }, []);

  const filteredVariants = variants.filter((v) => {
    if (filter.categoria && v.categoria !== filter.categoria) return false;
    if (filter.km && v.franquia_km_mes !== filter.km) return false;
    if (filter.prazo && v.prazo_contrato !== filter.prazo) return false;
    return true;
  });

  const hasAnyFilter = !!(filter.categoria || filter.km || filter.prazo);
  const canShowCars = hasAnyFilter;

  const calculatorCarGroups = new Map<string, CarPriceVariant[]>();
  if (canShowCars) {
    for (const v of filteredVariants) {
      const displayName = `${(v.marca ?? "").trim()} ${(v.nome_carro ?? "").trim()}`.trim();
      const parts = displayName.split(/\s+/);
      const marcaPart = v.marca || parts[0] || "";
      const modelPart = parts.slice(1).join(" ") || displayName;
      const normalizedKey = `${(marcaPart || "").toLowerCase().trim()}|${(modelPart || "").toLowerCase().replace(/\s+/g, " ").trim()}`;
      if (!calculatorCarGroups.has(normalizedKey)) calculatorCarGroups.set(normalizedKey, []);
      const existing = calculatorCarGroups.get(normalizedKey)!;
      const isDup = existing.some(
        (x) =>
          x.modelo_carro === v.modelo_carro &&
          x.franquia_km_mes === v.franquia_km_mes &&
          x.prazo_contrato === v.prazo_contrato
      );
      if (!isDup) existing.push(v);
    }
  }

  const brandGroups = new Map<string, Map<string, CarPriceVariant[]>>();
  for (const [normalizedKey, vars] of calculatorCarGroups) {
    const marca = vars[0]?.marca || "Outros";
    const modelPart = vars[0]?.nome_carro?.trim() || normalizedKey.split("|")[1] || "";
    const carKey = `${marca}|${modelPart}`;
    const brandKey = marca.toLowerCase();
    if (!brandGroups.has(brandKey)) brandGroups.set(brandKey, new Map());
    brandGroups.get(brandKey)!.set(carKey, vars);
  }

  const utmSource = searchParams.get("utm_source") ?? "";
  const utmMedium = searchParams.get("utm_medium") ?? "";
  const utmCampaign = searchParams.get("utm_campaign") ?? "";

  const filterForm = (
    <FilterForm
      filter={filter}
      handleFilterChange={handleFilterChange}
      categorias={categorias}
      kmOptions={kmOptions}
      prazos={prazos}
    />
  );

  return (
    <div className="min-h-screen bg-muted/50 pb-32">
      <div ref={sentinelRef} className="h-px w-full" aria-hidden />
      {/* Header fixo: logo + (título+filtro expandido) ou (menu) conforme scroll */}
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b -mt-px">
        <div className="container max-w-lg mx-auto">
          <div className="flex items-center justify-between py-3 px-2">
            <a href="/" className="flex-shrink-0">
              <img
                src={fallbackImg}
                alt="Logo"
                className="h-9 w-auto max-w-[140px] object-contain object-left"
              />
            </a>
            {isScrolled && (
              <Drawer open={filterOpen} onOpenChange={setFilterOpen} modal>
                <DrawerTrigger asChild>
                  <button
                    type="button"
                    className="flex items-center justify-center w-10 h-10 rounded-full border border-border bg-background"
                    aria-label="Abrir filtros"
                  >
                    <Menu size={20} />
                  </button>
                </DrawerTrigger>
                <DrawerContent
                  className="max-h-[85vh]"
                  onPointerDownOutside={() => setFilterOpen(false)}
                  onInteractOutside={() => setFilterOpen(false)}
                >
                  <DrawerHeader>
                    <DrawerTitle>Filtros</DrawerTitle>
                  </DrawerHeader>
                  <div className="px-4 pb-6">{filterForm}</div>
                </DrawerContent>
              </Drawer>
            )}
          </div>
          {!isScrolled && (
            <div className="px-4 pb-4">
              <h1 className="text-lg font-bold text-center text-foreground">
                Escolha seu carro zero km
              </h1>
              <p className="text-xs text-muted-foreground text-center mt-0.5">
                Selecione um ou mais filtros para ver os modelos
              </p>
              <div className="rounded-2xl border border-border bg-card p-4 shadow-card mt-3">
                {filterForm}
              </div>
            </div>
          )}
        </div>
      </header>

      <div className="container py-6 max-w-lg mx-auto px-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="animate-spin mb-4" size={32} />
            <p>Carregando modelos...</p>
          </div>
        ) : !hasCalculatorData ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>Nenhum modelo disponível no momento.</p>
          </div>
        ) : !canShowCars ? (
          <div className="text-center py-12 text-muted-foreground rounded-xl bg-card border border-dashed p-6">
            <p className="font-medium">Selecione um ou mais filtros</p>
            <p className="text-sm mt-1">para visualizar os carros com preços</p>
          </div>
        ) : (
          <div className={`space-y-8 ${brandGroups.size === 1 ? "pb-24" : ""}`}>
            {Array.from(brandGroups.entries())
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([brandKey, carGroups]) => {
                const brandLabel =
                  carGroups.values().next().value?.[0]?.marca ||
                  brandKey.charAt(0).toUpperCase() + brandKey.slice(1);
                return (
                  <CarouselBrand
                    key={brandKey}
                    brandLabel={brandLabel}
                    carGroups={carGroups}
                    selectedByCar={selectedByCar}
                    setSelectedByCar={setSelectedByCar}
                    fallbackImg={fallbackImg}
                    imageMap={imageMap}
                    whatsappBase={whatsappBase}
                    utmSource={utmSource}
                    utmMedium={utmMedium}
                    utmCampaign={utmCampaign}
                    hasKmAndPrazo={!!(filter.km && filter.prazo)}
                  />
                );
              })}
            {brandGroups.size === 1 && (
              <button
                type="button"
                onClick={() => window.scrollBy({ top: 120, behavior: "smooth" })}
                className="flex flex-col items-center gap-2 py-6 text-muted-foreground hover:text-foreground transition-colors w-full"
              >
                <span className="text-sm">Role para ver mais</span>
                <ChevronDown size={24} className="animate-bounce" aria-hidden />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function CarouselBrand({
  brandLabel,
  carGroups,
  selectedByCar,
  setSelectedByCar,
  fallbackImg,
  imageMap,
  whatsappBase,
  utmSource,
  utmMedium,
  utmCampaign,
  hasKmAndPrazo,
}: {
  brandLabel: string;
  carGroups: Map<string, CarPriceVariant[]>;
  selectedByCar: Map<string, CarPriceVariant | null>;
  setSelectedByCar: React.Dispatch<React.SetStateAction<Map<string, CarPriceVariant | null>>>;
  fallbackImg: string;
  imageMap: Map<string, string>;
  whatsappBase: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  hasKmAndPrazo: boolean;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const carList = Array.from(carGroups.entries());
  const hasMultiple = carList.length > 1;

  const scroll = useCallback((dir: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const cardWidth = el.clientWidth;
    el.scrollBy({ left: dir === "left" ? -cardWidth : cardWidth, behavior: "smooth" });
  }, []);

  return (
    <div>
      <h3 className="text-lg font-bold text-foreground mb-4">{brandLabel}</h3>
      <div className="relative">
        {hasMultiple && (
          <>
            <button
              type="button"
              onClick={() => scroll("left")}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-background border border-border shadow -ml-2"
              aria-label="Anterior"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              type="button"
              onClick={() => scroll("right")}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-background border border-border shadow -mr-2"
              aria-label="Próximo"
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}
        <div
          ref={scrollRef}
          className="flex gap-0 overflow-x-auto scroll-smooth pb-4 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            scrollSnapType: "x mandatory",
          }}
        >
          {carList.map(([carKey, vars]) => {
            const [marcaPart, modelPart] = carKey.split("|");
            const displayName = [marcaPart, modelPart].filter(Boolean).join(" ") || carKey;
            const selectedVariant = selectedByCar.get(carKey) ?? null;
            const foundImage = findImageForCar(displayName, imageMap);
            const hasCarImage = !!(foundImage && foundImage.trim());
            const imgSrc = hasCarImage ? foundImage : fallbackImg;

            const whatsappMsg = selectedVariant
              ? `Quero assinar: ${marcaPart} ${selectedVariant.modelo_carro || modelPart} - ${selectedVariant.categoria} - ${selectedVariant.franquia_km_mes} KM por Mês - ${selectedVariant.prazo_contrato} Meses - ${selectedVariant.formattedPrice}/mês`
              : `Olá! Tenho interesse no ${displayName}.`;

            return (
              <div
                key={carKey}
                className="flex-shrink-0 w-full snap-center rounded-2xl bg-card border border-border overflow-hidden shadow-card"
              >
                <div className="aspect-[3/2] sm:aspect-[4/3] overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
                  <img
                    src={imgSrc}
                    alt={displayName}
                    className={`w-full h-full ${hasCarImage ? "object-contain p-4" : "object-contain p-8 opacity-60"}`}
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.src = fallbackImg;
                    }}
                  />
                </div>
                <div className="p-4">
                  {vars[0]?.categoria && (
                    <span className="text-xs font-semibold uppercase tracking-wider text-accent">
                      {vars[0].categoria}
                    </span>
                  )}
                  <h4 className="text-lg font-bold text-foreground mt-1">{displayName}</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedVariant ? (
                      <span className="text-xl font-bold text-foreground">
                        {selectedVariant.formattedPrice}
                      </span>
                    ) : (
                      <>
                        A partir de{" "}
                        <span className="text-xl font-bold text-foreground">
                          {(() => {
                            const prices = vars.map((v) => v.price).filter((p) => p > 0);
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
                      </>
                    )}
                    /mês
                  </p>

                  {vars.length > 1 && hasKmAndPrazo && (
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
                            setSelectedByCar((p) => {
                              const n = new Map(p);
                              n.delete(carKey);
                              return n;
                            });
                            return;
                          }
                          const [modelo, prazo, km] = val.split("|");
                          const v = vars.find(
                            (x) =>
                              x.modelo_carro === modelo &&
                              x.prazo_contrato === prazo &&
                              x.franquia_km_mes === km
                          );
                          setSelectedByCar((p) => {
                            const n = new Map(p);
                            n.set(carKey, v ?? null);
                            return n;
                          });
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">Selecione</SelectItem>
                          {vars.map((v) => (
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

                  {vars.length === 1 && !selectedVariant && (
                    <button
                      type="button"
                      className="text-sm text-accent hover:underline mt-2"
                      onClick={() =>
                        setSelectedByCar((p) => {
                          const n = new Map(p);
                          n.set(carKey, vars[0]);
                          return n;
                        })
                      }
                    >
                      Usar este plano
                    </button>
                  )}

                  <div className="mt-4 flex flex-col gap-2">
                    {selectedVariant && (
                      <Button variant="cta" className="w-full" size="lg" asChild>
                        <a
                          href={`${whatsappBase}${encodeURIComponent(whatsappMsg)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <MessageCircle size={18} className="mr-2" />
                          Contratar
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default CampanhaPage;
