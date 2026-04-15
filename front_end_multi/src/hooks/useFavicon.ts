import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabaseIsolated } from "@/lib/supabase";

export const FAVICON_KEY = "_favicon_empresa_";

async function fetchFaviconUrl(): Promise<string | null> {
  const { data } = await supabaseIsolated
    .from("car_images")
    .select("image_url")
    .eq("car_name", FAVICON_KEY)
    .maybeSingle();

  return data?.image_url ?? null;
}

export function useFavicon() {
  const query = useQuery({
    queryKey: ["site-favicon"],
    queryFn: fetchFaviconUrl,
    staleTime: 10 * 60 * 1000,
  });

  useEffect(() => {
    const url = query.data ?? null;
    let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (url) {
      if (!link) {
        link = document.createElement("link");
        link.rel = "icon";
        document.head.appendChild(link);
      }
      link.href = url;
    } else if (link) {
      link.remove();
    }
  }, [query.data]);

  return {
    faviconUrl: query.data ?? null,
    isLoading: query.isLoading,
  };
}
