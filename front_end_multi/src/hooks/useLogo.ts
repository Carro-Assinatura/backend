import { useQuery } from "@tanstack/react-query";
import { supabaseIsolated } from "@/lib/supabase";
import { rewriteSupabaseMediaUrl } from "@/lib/rewriteSupabaseMediaUrl";

const LOGO_KEY = "_logo_empresa_";

export interface LogoData {
  name: string;
  url: string;
}

async function fetchLogo(): Promise<LogoData | null> {
  const { data } = await supabaseIsolated
    .from("car_images")
    .select("car_name, image_url")
    .eq("car_name", LOGO_KEY)
    .maybeSingle();

  if (!data || !data.image_url) return null;
  const url = rewriteSupabaseMediaUrl(data.image_url) ?? data.image_url;
  return { name: "Multi Experiências", url };
}

export function useLogo() {
  const query = useQuery({
    queryKey: ["site-logo"],
    queryFn: fetchLogo,
    staleTime: 10 * 60 * 1000,
  });

  return {
    logoUrl: query.data?.url ?? null,
    isLoading: query.isLoading,
  };
}

export { LOGO_KEY };
