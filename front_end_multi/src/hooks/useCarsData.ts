import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import { fetchAllCars, getCarImagesMap, type CarRow } from "@/services/googleSheets";

const CARS_QUERY_KEY = ["cars-for-site"];

export interface CarDisplay {
  name: string;
  marca: string;
  category: string;
  minPrice: number;
  formattedPrice: string;
  image: string;
}

const MULTI_WORD_BRANDS = new Set([
  "ford", "chevrolet", "land", "mini", "aston", "alfa",
  "mercedes", "mercedes-benz", "rolls", "great", "gwm",
]);

const BRAND_BY_MODEL: Record<string, string> = {
  "208": "Peugeot", "2008": "Peugeot", "3008": "Peugeot", "5008": "Peugeot", "308": "Peugeot",
  "c3": "Citroën", "c4": "Citroën", "c5": "Citroën",
  "toro": "Fiat", "titano": "Fiat", "mobi": "Fiat", "argo": "Fiat", "cronos": "Fiat", "pulse": "Fiat", "fastback": "Fiat", "strada": "Fiat", "uno": "Fiat",
  "hb20": "Hyundai", "hb20s": "Hyundai", "creta": "Hyundai", "tucson": "Hyundai",
  "onix": "Chevrolet", "tracker": "Chevrolet", "montana": "Chevrolet", "spin": "Chevrolet", "s10": "Chevrolet",
  "corolla": "Toyota", "hilux": "Toyota", "yaris": "Toyota", "sw4": "Toyota",
  "kicks": "Nissan", "versa": "Nissan", "frontier": "Nissan",
  "t-cross": "Volkswagen", "tcross": "Volkswagen", "polo": "Volkswagen", "virtus": "Volkswagen", "nivus": "Volkswagen", "taos": "Volkswagen", "saveiro": "Volkswagen", "amarok": "Volkswagen",
  "compass": "Jeep", "renegade": "Jeep", "commander": "Jeep",
  "ranger": "Ford", "territory": "Ford", "bronco": "Ford", "maverick": "Ford",
  "civic": "Honda", "city": "Honda", "hr-v": "Honda", "wr-v": "Honda", "zr-v": "Honda",
  "tank": "GWM", "haval": "GWM", "rampage": "Ram", "serie": "BMW",
};

function extractBaseName(fullName: string): string {
  const words = fullName.trim().split(/\s+/);
  if (words.length === 0) return fullName;
  const firstWord = words[0].toLowerCase();
  if (words.length > 1 && MULTI_WORD_BRANDS.has(firstWord)) {
    return words.slice(0, 2).join(" ");
  }
  return words[0];
}

function getSearchName(baseName: string): string {
  const key = baseName.toLowerCase().trim();
  const brand = BRAND_BY_MODEL[key];
  if (brand) return `${brand} ${baseName}`;
  return baseName;
}

function titleCase(str: string): string {
  return str
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

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
    for (const [registeredName] of imageMap) {
      if (registeredName.includes(modelOnly)) return imageMap.get(registeredName)!;
    }
  }
  return "";
}

function parsePriceFromString(val: string | number | null | undefined): number {
  if (val == null || val === "") return 0;
  if (typeof val === "number") return isNaN(val) ? 0 : val;
  const cleaned = String(val).replace(/[R$\s.]/g, "").replace(",", ".");
  return parseFloat(cleaned) || 0;
}

function deduplicateFromSheets(rows: CarRow[], imageMap: Map<string, string>): CarDisplay[] {
  const grouped = new Map<string, { rows: CarRow[]; fullName: string }>();
  for (const row of rows) {
    const key = extractBaseName(row.name).toLowerCase();
    if (!grouped.has(key)) grouped.set(key, { rows: [], fullName: row.name });
    grouped.get(key)!.rows.push(row);
  }
  return Array.from(grouped.entries())
    .map(([, { rows: variants, fullName }]) => {
      const minPrice = Math.min(...variants.map((v) => v.price).filter((p) => p > 0));
      const baseName = extractBaseName(fullName);
      const displayName = getSearchName(titleCase(baseName));
      const marca = displayName.split(/\s+/)[0] ?? "";
      return {
        name: displayName,
        marca,
        category: variants[0].category,
        minPrice: isFinite(minPrice) ? minPrice : 0,
        formattedPrice: isFinite(minPrice) && minPrice > 0
          ? minPrice.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0 })
          : "Consulte",
        image: findImageForCar(displayName, imageMap),
      };
    })
    .sort((a, b) => a.minPrice - b.minPrice);
}

function carPricesToDisplay(
  prices: { nome_carro: string; modelo_carro?: string; marca: string; categoria?: string; valor_mensal_locacao: string | number | null }[],
  imageMap: Map<string, string>
): CarDisplay[] {
  const grouped = new Map<string, { prices: typeof prices }>();
  for (const p of prices) {
    const marca = (p.marca ?? "").trim().toLowerCase();
    const nome = ((p.nome_carro ?? "") || (p.modelo_carro ?? "") || "").trim().toLowerCase();
    if (!nome && !marca) continue;
    const displayNome = nome || marca || "Carro";
    const key = marca ? `${marca}|${displayNome}` : displayNome;
    if (!grouped.has(key)) grouped.set(key, { prices: [] });
    grouped.get(key)!.prices.push(p);
  }
  return Array.from(grouped.entries())
    .map(([, { prices: variants }]) => {
      const priceValues = variants.map((v) => parsePriceFromString(v.valor_mensal_locacao)).filter((p) => p > 0);
      const minPrice = priceValues.length > 0 ? Math.min(...priceValues) : 0;
      const first = variants[0];
      const marca = (first.marca ?? "").trim();
      const nomePart = (first.nome_carro ?? first.modelo_carro ?? "").trim();
      const name = [marca, nomePart].filter(Boolean).join(" ") || "Carro";
      return {
        name,
        marca: marca || (name.split(/\s+/)[0] ?? "") || "",
        category: first.categoria || first.marca || "",
        minPrice,
        formattedPrice: minPrice > 0
          ? minPrice.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0 })
          : "Consulte",
        image: findImageForCar(name, imageMap),
      };
    })
    .sort((a, b) => a.minPrice - b.minPrice);
}

async function fetchCarsForSite(carSource: string): Promise<CarDisplay[]> {
  const imageMap = await getCarImagesMap();
  const imgMap = imageMap ?? new Map<string, string>();

  if (carSource === "importar") {
    const carPrices = await api.getCarPricesForSite();
    return carPricesToDisplay(carPrices, imgMap);
  }

  if (carSource === "planilhas") {
    const sheetsData = await fetchAllCars();
    return deduplicateFromSheets(sheetsData, imgMap);
  }

  // Fallback: quando car_source está vazio (ex: RLS bloqueando leitura), tenta importar
  if (carSource === "") {
    try {
      const carPrices = await api.getCarPricesForSite();
      if (carPrices.length > 0) {
        return carPricesToDisplay(carPrices, imgMap);
      }
    } catch {
      // ignora erro
    }
  }

  return [];
}

export function useCarsData() {
  const carSourceQuery = useQuery({
    queryKey: ["car-source"],
    queryFn: () => api.getCarSource(),
    staleTime: 5 * 60 * 1000,
  });

  const carSource = carSourceQuery.data ?? "";

  const query = useQuery({
    queryKey: [...CARS_QUERY_KEY, carSource],
    queryFn: () => fetchCarsForSite(carSource),
    staleTime: 5 * 60 * 1000,
    retry: 2,
    enabled: carSourceQuery.isSuccess,
  });

  const imageMapQuery = useQuery({
    queryKey: ["car-images-map"],
    queryFn: getCarImagesMap,
    staleTime: 5 * 60 * 1000,
  });

  const [cars, setCars] = useState<CarDisplay[]>([]);

  useEffect(() => {
    if (!query.data) {
      setCars([]);
      return;
    }
    setCars(query.data);
  }, [query.data]);

  const effectiveCarSource = carSource || (cars.length > 0 ? "importar" : "");

  return {
    cars,
    carSource: effectiveCarSource,
    imageMap: imageMapQuery.data ?? new Map<string, string>(),
    isLoading: query.isLoading || carSourceQuery.isLoading,
    imagesLoading: imageMapQuery.isLoading,
    isError: query.isError,
    error: query.error,
    isConfigured: cars.length > 0,
  };
}
