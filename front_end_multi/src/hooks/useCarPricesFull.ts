import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";

export interface CarPriceVariant {
  marca: string;
  nome_carro: string;
  modelo_carro: string;
  categoria: string;
  prazo_contrato: string;
  franquia_km_mes: string;
  valor_mensal_locacao: string;
  price: number;
  formattedPrice: string;
}

const QUERY_KEY = ["car-prices-full"];

function parsePrice(val: string | number | null | undefined): number {
  if (val == null || val === "") return 0;
  if (typeof val === "number") return val;
  const cleaned = String(val).replace(/[R$\s.]/g, "").replace(",", ".");
  return parseFloat(cleaned) || 0;
}

function toStr(val: string | number | null | undefined): string {
  if (val == null) return "";
  return String(val);
}

async function fetchCarPricesFull(carSource: string): Promise<CarPriceVariant[]> {
  if (carSource !== "importar") return [];

  const rows = await api.getCarPricesFullForSite();
  return rows.map((r) => {
    const price = parsePrice(r.valor_mensal_locacao);
    return {
      marca: (r.marca ?? "").trim(),
      nome_carro: (r.nome_carro ?? "").trim(),
      modelo_carro: (r.modelo_carro ?? "").trim(),
      categoria: (r.categoria ?? "").trim(),
      prazo_contrato: toStr(r.prazo_contrato),
      franquia_km_mes: toStr(r.franquia_km_mes),
      valor_mensal_locacao: toStr(r.valor_mensal_locacao),
      price,
      formattedPrice:
        price > 0
          ? price.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0 })
          : "Consulte",
    };
  });
}

export function useCarPricesFull(carSource: string) {
  const query = useQuery({
    queryKey: [...QUERY_KEY, carSource],
    queryFn: () => fetchCarPricesFull(carSource),
    staleTime: 5 * 60 * 1000,
    enabled: carSource === "importar",
  });

  const variants = query.data ?? [];
  const categorias = [...new Set(variants.map((v) => v.categoria).filter(Boolean))].sort();
  const kmOptions = [...new Set(variants.map((v) => v.franquia_km_mes).filter(Boolean))].sort((a, b) => {
    const na = parseInt(String(a).replace(/\D/g, ""), 10) || 0;
    const nb = parseInt(String(b).replace(/\D/g, ""), 10) || 0;
    return na - nb;
  });
  const prazos = [...new Set(variants.map((v) => v.prazo_contrato).filter(Boolean))].sort((a, b) => {
    const na = parseInt(String(a).replace(/\D/g, ""), 10) || 0;
    const nb = parseInt(String(b).replace(/\D/g, ""), 10) || 0;
    return na - nb;
  });

  return {
    variants,
    categorias,
    kmOptions,
    prazos,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    hasCalculatorData: carSource === "importar" && variants.length > 0,
  };
}
