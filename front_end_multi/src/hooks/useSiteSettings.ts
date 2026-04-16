import { useQuery } from "@tanstack/react-query";
import { supabaseIsolated } from "@/lib/supabase";
import { SITE_SOCIAL_SETTING_KEYS } from "@/config/siteSocialLinks";

export interface SiteSettings {
  whatsappNumber: string;
  whatsappMessage: string;
  siteTitle: string;
  siteDescription: string;
  /** URLs preenchidas na intranet; só chaves com valor entram no objeto. */
  socialUrls: Partial<Record<string, string>>;
}

const DEFAULTS: SiteSettings = {
  whatsappNumber: "5511999999999",
  whatsappMessage: "Olá! Gostaria de saber mais sobre carros por assinatura.",
  siteTitle: "Multi Experiências",
  siteDescription:
    "Assinatura de carros zero km com manutenção inclusa, IPVA, seguro e planos flexíveis. Sem burocracia, sem financiamento.",
  socialUrls: {},
};

async function fetchSiteSettings(): Promise<SiteSettings> {
  try {
    const keys = [
      "whatsapp_number",
      "whatsapp_message",
      "site_title",
      "site_description",
      ...SITE_SOCIAL_SETTING_KEYS,
    ] as const;
    const { data } = await supabaseIsolated.from("settings").select("key, value").in("key", [...keys]);

    const map = new Map((data ?? []).map((r: { key: string; value: string }) => [r.key, r.value]));

    const socialUrls: SiteSettings["socialUrls"] = {};
    for (const k of SITE_SOCIAL_SETTING_KEYS) {
      const v = (map.get(k) ?? "").trim();
      if (v) socialUrls[k] = v;
    }

    return {
      whatsappNumber: map.get("whatsapp_number") || DEFAULTS.whatsappNumber,
      whatsappMessage: map.get("whatsapp_message") || DEFAULTS.whatsappMessage,
      siteTitle: map.get("site_title") || DEFAULTS.siteTitle,
      siteDescription: map.get("site_description") || DEFAULTS.siteDescription,
      socialUrls,
    };
  } catch {
    return DEFAULTS;
  }
}

export function useSiteSettings() {
  const { data } = useQuery({
    queryKey: ["site-settings"],
    queryFn: fetchSiteSettings,
    staleTime: 5 * 60 * 1000,
  });

  const s = data ?? DEFAULTS;

  const whatsappUrl = `https://wa.me/${s.whatsappNumber}?text=${encodeURIComponent(s.whatsappMessage)}`;
  const whatsappBase = `https://wa.me/${s.whatsappNumber}?text=`;
  const phoneFormatted = s.whatsappNumber.replace(/^55(\d{2})(\d{5})(\d{4})$/, "($1) $2-$3");

  return { ...s, whatsappUrl, whatsappBase, phoneFormatted };
}
