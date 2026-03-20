/**
 * Lógica de importação de planilhas Excel para car_prices.
 * Mapeamento fuzzy de colunas, parsing de colunas combinadas e inferência de marca.
 */

import * as XLSX from "xlsx";

export const STANDARD_COLUMNS = {
  marca: ["marca", "fabricante", "brand", "make"],
  nome_carro: ["nome", "nome do carro", "carro", "modelo versão", "modelo-versão", "modelo/versão", "veículo", "vehicle", "car"],
  modelo_carro: ["modelo", "modelo do carro", "versão", "versao", "version"],
  categoria: ["categoria", "tipo", "segmento", "category", "segment"],
  prazo_contrato: ["prazo", "prazo contrato", "prazo de contrato", "meses", "contrato", "termo"],
  franquia_km_mes: ["franquia", "franquia km", "km mês", "km mes", "quilometragem", "km/mês", "km/mes"],
  tipo_pintura: ["pintura", "tipo pintura", "tipo de pintura", "cor", "paint"],
  troca_pneus: ["pneus", "troca pneus", "troca do jogo de pneus", "jogo de pneus", "tires"],
  manutencao: ["manutenção", "manutencao", "mecânica", "mecanica"],
  seguro: ["seguro", "insurance"],
  carro_reserva: ["reserva", "carro reserva", "carro de reserva", "substituto"],
  insulfilm: ["insulfilm", "insulfilme", "película", "pelicula", "insulfilm"],
  valor_km_excedido: ["km excedido", "valor km excedido", "excedente", "km extra", "excesso km"],
  valor_mensal_locacao: ["valor", "valor mensal", "mensalidade", "locação", "locacao", "preço", "preco", "price", "valor locação"],
} as const;

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

export const CATEGORIAS = [
  "Subcompactos / Econômico",
  "Hatch Compacto",
  "Sedã Compacto",
  "SUV Compacto",
  "SUV Médio",
  "Picapes Compactas",
  "Picapes Média",
  "Picapes Grandes",
  "Premium / Luxo",
  "Furgão Compacto",
  "Furgão Médio",
  "Furgão Grande",
] as const;

export type CategoriaValue = (typeof CATEGORIAS)[number];

const MODEL_TO_CATEGORY: Record<string, CategoriaValue> = {
  mobi: "Subcompactos / Econômico", argo: "Subcompactos / Econômico", onix: "Subcompactos / Econômico",
  kwid: "Subcompactos / Econômico", sandero: "Subcompactos / Econômico", 208: "Subcompactos / Econômico",
  hb20: "Subcompactos / Econômico", gol: "Subcompactos / Econômico",
  polo: "Hatch Compacto", fiesta: "Hatch Compacto", yaris: "Hatch Compacto",
  virtus: "Sedã Compacto", cronos: "Sedã Compacto", city: "Sedã Compacto", versa: "Sedã Compacto",
  kicks: "SUV Compacto", tracker: "SUV Compacto", "t-cross": "SUV Compacto", tcross: "SUV Compacto",
  renegade: "SUV Compacto", "hr-v": "SUV Compacto", nivus: "SUV Compacto", "wr-v": "SUV Compacto", wrv: "SUV Compacto",
  compass: "SUV Médio", taos: "SUV Médio", creta: "SUV Médio", "corolla cross": "SUV Médio",
  toro: "Picapes Compactas", montana: "Picapes Compactas", frontier: "Picapes Compactas",
  ranger: "Picapes Média", amarok: "Picapes Média", s10: "Picapes Média",
  hilux: "Picapes Grandes", titano: "Picapes Grandes", rampage: "Picapes Grandes",
  saveiro: "Furgão Compacto", strada: "Furgão Compacto", fiorino: "Furgão Compacto",
  ducato: "Furgão Médio", master: "Furgão Médio", sprinter: "Furgão Grande",
};

const KNOWN_BRANDS = new Set([
  "fiat", "volkswagen", "vw", "chevrolet", "ford", "toyota", "honda", "hyundai", "jeep", "nissan",
  "peugeot", "citroën", "citroen", "renault", "bmw", "mercedes", "audi", "gwm", "haval", "ram",
  "jacu", "caoa", "chery", "jac", "lifan", "mitsubishi", "kia", "volvo", "land rover",
]);

function normalizeForMatch(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[_\-\s\/]+/g, " ")
    .trim();
}

function similarity(a: string, b: string): number {
  const na = normalizeForMatch(a);
  const nb = normalizeForMatch(b);
  if (na === nb) return 1;
  if (na.includes(nb) || nb.includes(na)) return 0.9;
  const naWords = na.split(/\s+/);
  const nbWords = nb.split(/\s+/);
  let matches = 0;
  for (const wa of naWords) {
    if (nbWords.some((wb) => wa === wb || wa.includes(wb) || wb.includes(wa))) matches++;
  }
  return matches / Math.max(naWords.length, nbWords.length, 1);
}

export function mapColumnToStandard(header: string): keyof typeof STANDARD_COLUMNS | null {
  const n = normalizeForMatch(header);
  if (!n) return null;
  let best: { key: keyof typeof STANDARD_COLUMNS; score: number } | null = null;
  for (const [key, aliases] of Object.entries(STANDARD_COLUMNS)) {
    for (const alias of aliases) {
      const score = similarity(n, alias);
      if (score >= 0.6 && (!best || score > best.score)) {
        best = { key: key as keyof typeof STANDARD_COLUMNS, score };
      }
    }
    const directScore = similarity(n, key);
    if (directScore >= 0.6 && (!best || directScore > best.score)) {
      best = { key: key as keyof typeof STANDARD_COLUMNS, score: directScore };
    }
  }
  return best?.key ?? null;
}

/**
 * Formato: "Commander Black Hurricane 2.0 4x4 TB Aut"
 * - nome_carro = primeira palavra (Commander)
 * - modelo_carro = resto (Black Hurricane 2.0 4x4 TB Aut)
 */
export function splitNomeModelo(value: string): { nome_carro: string; modelo_carro: string } {
  const raw = String(value ?? "").trim();
  if (!raw) return { nome_carro: "", modelo_carro: "" };
  const spaceIdx = raw.indexOf(" ");
  if (spaceIdx <= 0) return { nome_carro: raw, modelo_carro: "" };
  return {
    nome_carro: raw.slice(0, spaceIdx).trim(),
    modelo_carro: raw.slice(spaceIdx).trim(),
  };
}

export function parseCombinedCarColumn(value: string): { marca: string; nome_carro: string; modelo_carro: string } {
  const raw = String(value ?? "").trim();
  if (!raw) return { marca: "", nome_carro: "", modelo_carro: "" };

  const { nome_carro, modelo_carro } = splitNomeModelo(raw);
  let marca = "";

  const parts = raw.split(/\s+/).filter(Boolean);
  for (const p of parts) {
    const pl = p.toLowerCase();
    if (KNOWN_BRANDS.has(pl)) {
      marca = p;
      break;
    }
  }

  const modelKey = parts
    .map((p) => p.toLowerCase().replace(/[^a-z0-9]/g, ""))
    .find((k) => BRAND_BY_MODEL[k]);
  if (modelKey && !marca) marca = BRAND_BY_MODEL[modelKey];
  if (!marca) marca = inferBrandFromCarName(raw);

  return {
    marca: marca || "",
    nome_carro: nome_carro || raw,
    modelo_carro: modelo_carro || "",
  };
}

export function inferCategoryFromCarName(nomeCarro: string): CategoriaValue | "" {
  if (!nomeCarro) return "";
  const lower = nomeCarro.toLowerCase().trim();
  const words = lower.split(/\s+/).map((w) => w.replace(/[^a-z0-9]/g, ""));
  for (const w of words) {
    if (MODEL_TO_CATEGORY[w]) return MODEL_TO_CATEGORY[w];
  }
  for (const [model, cat] of Object.entries(MODEL_TO_CATEGORY)) {
    if (lower.includes(model)) return cat;
  }
  if (lower.includes("suv") || lower.includes("4x4")) {
    if (lower.includes("compass") || lower.includes("taos") || lower.includes("creta") || lower.includes("corolla")) return "SUV Médio";
    return "SUV Compacto";
  }
  if (lower.includes("picape") || lower.includes("pickup")) return "Picapes Média";
  if (lower.includes("furgão") || lower.includes("furgao") || lower.includes("van")) return "Furgão Médio";
  if (lower.includes("bmw") || lower.includes("mercedes") || lower.includes("audi") || lower.includes("volvo")) return "Premium / Luxo";
  return "";
}

export function inferBrandFromCarName(nomeCarro: string): string {
  if (!nomeCarro) return "";
  const lower = nomeCarro.toLowerCase();
  const words = lower.split(/\s+/);
  for (const w of words) {
    const clean = w.replace(/[^a-z0-9]/g, "");
    if (BRAND_BY_MODEL[clean]) return BRAND_BY_MODEL[clean];
  }
  for (const [model, brand] of Object.entries(BRAND_BY_MODEL)) {
    if (lower.includes(model)) return brand;
  }
  const firstWord = words[0]?.toLowerCase() ?? "";
  if (KNOWN_BRANDS.has(firstWord)) return words[0] ?? "";
  if (words.length > 1 && KNOWN_BRANDS.has(words[0] + " " + words[1])) return words.slice(0, 2).join(" ");
  return "";
}

function cellToString(cell: unknown): string {
  if (cell == null) return "";
  if (typeof cell === "number") return String(cell);
  if (typeof cell === "string") return cell.trim();
  if (typeof cell === "boolean") return cell ? "Sim" : "Não";
  return String(cell);
}

/**
 * Converte valor monetário para formato pt-BR (vírgula como decimal).
 * Respeita: R$0,54 (BR), 0.54 (US), 1.500,00 (BR), 1500.50 (US).
 * O ponto antes da vírgula = milhares (BR). A vírgula = decimais (BR).
 */
function parseNumericOrText(val: string | number): string {
  if (val == null || val === "") return "";
  if (typeof val === "number") {
    return isNaN(val) ? "" : val.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  const str = String(val).trim().replace(/[R$\s]/g, "");
  if (!str) return "";
  const lastComma = str.lastIndexOf(",");
  const lastDot = str.lastIndexOf(".");
  let normalized: string;
  if (lastComma > lastDot) {
    // Formato BR: vírgula = decimais, ponto = milhares (ex: 1.500,00 ou 0,54)
    normalized = str.replace(/\./g, "").replace(",", ".");
  } else if (lastDot > lastComma) {
    // Formato US: ponto = decimais, vírgula = milhares (ex: 1,500.00 ou 0.54)
    normalized = str.replace(/,/g, "");
  } else {
    normalized = str.replace(",", ".");
  }
  const num = parseFloat(normalized);
  if (isNaN(num)) return String(val).trim();
  return num.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export interface ParsedCarPriceRow {
  marca: string;
  nome_carro: string;
  modelo_carro: string;
  categoria: string;
  prazo_contrato: string;
  franquia_km_mes: string;
  tipo_pintura: string;
  troca_pneus: string;
  manutencao: string;
  seguro: string;
  carro_reserva: string;
  insulfilm: string;
  valor_km_excedido: string;
  valor_mensal_locacao: string;
  source_sheet: string;
  source_row: number;
}

export type DbColumnKey = keyof typeof STANDARD_COLUMNS;

export const DB_COLUMN_LABELS: Record<DbColumnKey, string> = {
  marca: "Marca",
  nome_carro: "Nome do Carro",
  modelo_carro: "Modelo do Carro",
  categoria: "Categoria",
  prazo_contrato: "Prazo de Contrato",
  franquia_km_mes: "Franquia de km por mês",
  tipo_pintura: "Tipo de Pintura",
  troca_pneus: "Troca do Jogo de Pneus",
  manutencao: "Manutenção",
  seguro: "Seguro",
  carro_reserva: "Carro Reserva",
  insulfilm: "Insulfilm",
  valor_km_excedido: "Valor do km Excedido",
  valor_mensal_locacao: "Valor Mensal da Locação",
};

export interface SheetData {
  sheetName: string;
  headers: string[];
  rows: unknown[][];
}

export interface SheetColumnMapping {
  [sheetName: string]: Record<DbColumnKey, number | null>;
}

export function parseExcelFileRaw(file: File): Promise<SheetData[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) {
          reject(new Error("Arquivo vazio"));
          return;
        }
        const workbook = XLSX.read(data, { type: "array", cellDates: true });
        const sheets: SheetData[] = [];
        for (const sheetName of workbook.SheetNames) {
          const sheet = workbook.Sheets[sheetName];
          if (!sheet) continue;
          const json: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
          if (json.length < 1) continue;
          const headers = (json[0] ?? []).map((h) => cellToString(h));
          const rows = json.slice(1);
          sheets.push({ sheetName, headers, rows });
        }
        resolve(sheets);
      } catch (err) {
        reject(err instanceof Error ? err : new Error("Erro ao ler planilha"));
      }
    };
    reader.onerror = () => reject(new Error("Erro ao ler arquivo"));
    reader.readAsArrayBuffer(file);
  });
}

function buildInitialMapping(headers: string[]): Record<DbColumnKey, number | null> {
  const mapping: Record<string, number | null> = {};
  for (const key of Object.keys(STANDARD_COLUMNS) as DbColumnKey[]) {
    mapping[key] = null;
  }
  for (let i = 0; i < headers.length; i++) {
    const mapped = mapColumnToStandard(headers[i]);
    if (mapped && mapping[mapped] === null) mapping[mapped] = i;
  }
  return mapping as Record<DbColumnKey, number | null>;
}

export function buildMappingsFromSheets(sheets: SheetData[]): SheetColumnMapping {
  const out: SheetColumnMapping = {};
  for (const s of sheets) {
    out[s.sheetName] = buildInitialMapping(s.headers);
  }
  return out;
}

export function parseWithMapping(
  sheets: SheetData[],
  mapping: SheetColumnMapping,
  selectedSheets: Set<string>,
  learnedBrands?: Map<string, string>,
  learnedCategories?: Map<string, string>
): ParsedCarPriceRow[] {
  const allRows: ParsedCarPriceRow[] = [];
  for (const sheet of sheets) {
    if (!selectedSheets.has(sheet.sheetName)) continue;
    const colMap = mapping[sheet.sheetName] ?? {};
    const combinedCol = colMap.nome_carro ?? colMap.modelo_carro ?? colMap.marca ?? 0;
    const hasCombined = colMap.marca == null && colMap.modelo_carro == null && (colMap.nome_carro != null || combinedCol >= 0);

    for (let rowIdx = 0; rowIdx < sheet.rows.length; rowIdx++) {
      const row = sheet.rows[rowIdx] ?? [];
      const get = (key: DbColumnKey) => {
        const idx = colMap[key];
        return idx != null ? cellToString(row[idx]) : "";
      };

      let marca = get("marca");
      let nome_carro = get("nome_carro") || get("modelo_carro");
      let modelo_carro = get("modelo_carro");

      if (hasCombined || (!marca && !nome_carro && !modelo_carro)) {
        const combinedVal = cellToString(row[combinedCol]) || cellToString(row[0]);
        if (combinedVal) {
          const parsed = parseCombinedCarColumn(combinedVal);
          if (!marca) marca = parsed.marca;
          if (!nome_carro) nome_carro = parsed.nome_carro;
          if (!modelo_carro) modelo_carro = parsed.modelo_carro;
        }
      }

      if (nome_carro && nome_carro.includes(" ")) {
        const split = splitNomeModelo(nome_carro);
        nome_carro = split.nome_carro;
        if (!modelo_carro) modelo_carro = split.modelo_carro;
      }

      if (!marca && nome_carro) {
        marca = learnedBrands?.get(nome_carro.toLowerCase().trim()) ?? inferBrandFromCarName(nome_carro);
      }

      let categoria = get("categoria");
      if (!categoria && nome_carro) {
        categoria = learnedCategories?.get(nome_carro.toLowerCase().trim()) ?? inferCategoryFromCarName(nome_carro);
      }

      const valorMensal = get("valor_mensal_locacao");
      if (!nome_carro && !valorMensal) continue;

      if (!nome_carro) nome_carro = marca ? `${marca} ${modelo_carro}`.trim() : "Carro";

      const valorKm = get("valor_km_excedido");
      allRows.push({
        marca: marca.trim(),
        nome_carro: nome_carro.trim(),
        modelo_carro: modelo_carro.trim(),
        categoria: categoria.trim(),
        prazo_contrato: cellToString(get("prazo_contrato")),
        franquia_km_mes: cellToString(get("franquia_km_mes")),
        tipo_pintura: cellToString(get("tipo_pintura")),
        troca_pneus: cellToString(get("troca_pneus")),
        manutencao: cellToString(get("manutencao")),
        seguro: cellToString(get("seguro")),
        carro_reserva: cellToString(get("carro_reserva")),
        insulfilm: cellToString(get("insulfilm")),
        valor_km_excedido: valorKm ? parseNumericOrText(valorKm) : "",
        valor_mensal_locacao: valorMensal ? parseNumericOrText(valorMensal) : "",
        source_sheet: sheet.sheetName,
        source_row: rowIdx + 2,
      });
    }
  }
  return allRows;
}

export function parseExcelFile(file: File): Promise<{ rows: ParsedCarPriceRow[]; headers: string[]; sheetNames: string[] }> {
  return parseExcelFileRaw(file).then((sheets) => {
    const mapping = buildMappingsFromSheets(sheets);
    const selected = new Set(sheets.map((s) => s.sheetName));
    const rows = parseWithMapping(sheets, mapping, selected);
    return {
      rows,
      headers: sheets[0]?.headers ?? [],
      sheetNames: sheets.map((s) => s.sheetName),
    };
  });
}
