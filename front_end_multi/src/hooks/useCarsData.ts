import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchAllCars, getCarImagesMap, type CarRow } from "@/services/googleSheets";

export interface CarDisplay {
  name: string;
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
  "208": "Peugeot",
  "2008": "Peugeot",
  "3008": "Peugeot",
  "5008": "Peugeot",
  "308": "Peugeot",
  "c3": "Citroën",
  "c4": "Citroën",
  "c5": "Citroën",
  "toro": "Fiat",
  "titano": "Fiat",
  "mobi": "Fiat",
  "argo": "Fiat",
  "cronos": "Fiat",
  "pulse": "Fiat",
  "fastback": "Fiat",
  "strada": "Fiat",
  "uno": "Fiat",
  "hb20": "Hyundai",
  "hb20s": "Hyundai",
  "creta": "Hyundai",
  "tucson": "Hyundai",
  "onix": "Chevrolet",
  "tracker": "Chevrolet",
  "montana": "Chevrolet",
  "spin": "Chevrolet",
  "s10": "Chevrolet",
  "corolla": "Toyota",
  "hilux": "Toyota",
  "yaris": "Toyota",
  "sw4": "Toyota",
  "kicks": "Nissan",
  "versa": "Nissan",
  "frontier": "Nissan",
  "t-cross": "Volkswagen",
  "tcross": "Volkswagen",
  "polo": "Volkswagen",
  "virtus": "Volkswagen",
  "nivus": "Volkswagen",
  "taos": "Volkswagen",
  "saveiro": "Volkswagen",
  "amarok": "Volkswagen",
  "compass": "Jeep",
  "renegade": "Jeep",
  "commander": "Jeep",
  "ranger": "Ford",
  "territory": "Ford",
  "bronco": "Ford",
  "maverick": "Ford",
  "civic": "Honda",
  "city": "Honda",
  "hr-v": "Honda",
  "wr-v": "Honda",
  "zr-v": "Honda",
  "tank": "GWM",
  "haval": "GWM",
  "rampage": "Ram",
  "serie": "BMW",
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

function findImageForCar(
  carName: string,
  imageMap: Map<string, string>,
): string {
  const lower = carName.toLowerCase().trim();

  // 1. Exact match
  if (imageMap.has(lower)) return imageMap.get(lower)!;

  // 2. Check if any registered name is contained in the car name
  for (const [registeredName, url] of imageMap) {
    if (lower.includes(registeredName) || registeredName.includes(lower)) {
      return url;
    }
  }

  // 3. Match without brand prefix (e.g., "Toro" matches "Fiat Toro")
  const words = lower.split(/\s+/);
  if (words.length >= 2) {
    const modelOnly = words.slice(1).join(" ");
    if (imageMap.has(modelOnly)) return imageMap.get(modelOnly)!;
    const brandOnly = words[0];
    for (const [registeredName] of imageMap) {
      if (registeredName.includes(modelOnly) || registeredName.includes(brandOnly + " " + modelOnly)) {
        return imageMap.get(registeredName)!;
      }
    }
  }

  return "";
}

function deduplicateCars(rows: CarRow[], imageMap: Map<string, string>): CarDisplay[] {
  const grouped = new Map<string, { rows: CarRow[]; fullName: string }>();

  for (const row of rows) {
    const key = extractBaseName(row.name).toLowerCase();
    if (!grouped.has(key)) {
      grouped.set(key, { rows: [], fullName: row.name });
    }
    grouped.get(key)!.rows.push(row);
  }

  return Array.from(grouped.entries())
    .map(([, { rows: variants, fullName }]) => {
      const minPrice = Math.min(...variants.map((v) => v.price).filter((p) => p > 0));
      const baseName = extractBaseName(fullName);
      const displayName = getSearchName(titleCase(baseName));

      const dbImage = findImageForCar(displayName, imageMap);

      return {
        name: displayName,
        category: variants[0].category,
        minPrice: isFinite(minPrice) ? minPrice : 0,
        formattedPrice: isFinite(minPrice) && minPrice > 0
          ? minPrice.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0 })
          : "Consulte",
        image: dbImage,
      };
    })
    .sort((a, b) => a.minPrice - b.minPrice);
}

export function useCarsData() {
  const query = useQuery({
    queryKey: ["cars-from-sheets"],
    queryFn: fetchAllCars,
    staleTime: 5 * 60 * 1000,
    retry: 2,
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

    const imageMap = imageMapQuery.data ?? new Map<string, string>();
    const deduped = deduplicateCars(query.data, imageMap);
    setCars(deduped);
  }, [query.data, imageMapQuery.data]);

  return {
    cars,
    isLoading: query.isLoading,
    imagesLoading: imageMapQuery.isLoading,
    isError: query.isError,
    error: query.error,
    isConfigured: true,
  };
}
