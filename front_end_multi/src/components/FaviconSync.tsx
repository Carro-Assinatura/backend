import { useFavicon } from "@/hooks/useFavicon";

/** Sincroniza o favicon do site com o valor configurado no painel. */
export default function FaviconSync() {
  useFavicon();
  return null;
}
