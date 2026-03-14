import { supabaseIsolated } from "@/lib/supabase";

export interface CarRow {
  name: string;
  category: string;
  price: number;
  image: string;
}

interface SheetsApiResponse {
  values: string[][];
}

export interface SheetSource {
  apiKey: string;
  sheetId: string;
  tabName: string;
  colCarName: string;
  colPrice: string;
  colCategory: string;
  colImage: string;
}

function parsePrice(raw: string): number {
  if (!raw) return 0;
  const cleaned = raw.replace(/[R$\s.]/g, "").replace(",", ".");
  return parseFloat(cleaned) || 0;
}

export async function fetchCarsFromSource(src: SheetSource): Promise<CarRow[]> {
  const { apiKey, sheetId, tabName, colCarName, colPrice, colCategory, colImage } = src;

  if (!apiKey || !sheetId) return [];

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(tabName)}?key=${apiKey}`;
  const response = await fetch(url);

  if (!response.ok) {
    console.warn(`[GoogleSheets] Erro ${response.status} ao buscar ${tabName}`);
    return [];
  }

  const data: SheetsApiResponse = await response.json();
  if (!data.values || data.values.length < 2) return [];

  const [headers, ...rows] = data.values;
  const findCol = (name: string) =>
    name ? headers.findIndex((h) => h.trim() === name.trim()) : -1;

  const colIdx = {
    name: findCol(colCarName),
    price: findCol(colPrice),
    category: findCol(colCategory),
    image: findCol(colImage),
  };

  if (colIdx.name === -1) {
    console.warn(
      `[GoogleSheets] Coluna "${colCarName}" não encontrada em "${tabName}". Colunas: ${headers.join(", ")}`,
    );
    return [];
  }

  return rows
    .filter((row) => row[colIdx.name]?.trim())
    .map((row) => ({
      name: row[colIdx.name]?.trim() ?? "",
      category: colIdx.category !== -1 ? row[colIdx.category]?.trim() ?? "" : "",
      price: colIdx.price !== -1 ? parsePrice(row[colIdx.price]) : 0,
      image: colIdx.image !== -1 ? row[colIdx.image]?.trim() ?? "" : "",
    }));
}

export async function getActiveSheetSources(): Promise<SheetSource[]> {
  const { data: sheets, error } = await supabaseIsolated
    .from("spreadsheets")
    .select("api_key, sheet_id, spreadsheet_pages(tab_name, col_car_name, col_price, col_category, col_image, active)")
    .eq("active", true);

  if (error || !sheets) {
    console.warn("[GoogleSheets] Erro ao buscar planilhas do banco:", error?.message);
    return fallbackSources();
  }

  const sources: SheetSource[] = [];

  for (const sheet of sheets) {
    const pages = (sheet.spreadsheet_pages ?? []) as Array<{
      tab_name: string;
      col_car_name: string;
      col_price: string;
      col_category: string;
      col_image: string;
      active: boolean;
    }>;

    for (const page of pages) {
      if (!page.active) continue;
      sources.push({
        apiKey: sheet.api_key,
        sheetId: sheet.sheet_id,
        tabName: page.tab_name,
        colCarName: page.col_car_name,
        colPrice: page.col_price,
        colCategory: page.col_category,
        colImage: page.col_image,
      });
    }
  }

  if (sources.length === 0) return fallbackSources();
  return sources;
}

function fallbackSources(): SheetSource[] {
  const apiKey = import.meta.env.VITE_GOOGLE_SHEETS_API_KEY as string | undefined;
  const sheetId = import.meta.env.VITE_GOOGLE_SHEETS_ID as string | undefined;

  if (!apiKey || !sheetId) return [];

  return [
    {
      apiKey,
      sheetId,
      tabName: (import.meta.env.VITE_GOOGLE_SHEETS_TAB as string) || "Página1",
      colCarName: (import.meta.env.VITE_COLUMN_CAR_NAME as string) || "Carro",
      colPrice: (import.meta.env.VITE_COLUMN_PRICE as string) || "Preço",
      colCategory: (import.meta.env.VITE_COLUMN_CATEGORY as string) || "",
      colImage: (import.meta.env.VITE_COLUMN_IMAGE as string) || "",
    },
  ];
}

export async function getCarImagesMap(): Promise<Map<string, string>> {
  const { data } = await supabaseIsolated
    .from("car_images")
    .select("car_name, image_url");

  const map = new Map<string, string>();
  for (const row of data ?? []) {
    map.set(row.car_name.toLowerCase().trim(), row.image_url);
  }
  return map;
}

export async function fetchAllCars(): Promise<CarRow[]> {
  const sources = await getActiveSheetSources();
  if (sources.length === 0) return [];

  const results = await Promise.allSettled(
    sources.map((src) => fetchCarsFromSource(src)),
  );

  const allCars: CarRow[] = [];
  for (const result of results) {
    if (result.status === "fulfilled") {
      allCars.push(...result.value);
    }
  }

  return allCars;
}
