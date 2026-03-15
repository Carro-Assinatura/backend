import { useSiteSettings } from "./useSiteSettings";
import { useBotConfig } from "./useBotConfig";

/**
 * Retorna a ação de contato para botões "Falar no WhatsApp":
 * - Mobile: sempre abre WhatsApp
 * - Desktop com bot ativo: abre o chatbot N8N
 * - Desktop sem bot: abre WhatsApp
 */
const FALLBACK_WHATSAPP = "https://wa.me/5511999999999?text=Olá!";

export function useContactAction() {
  const { whatsappUrl } = useSiteSettings();
  const { showBot, isMobile } = useBotConfig();

  const useWhatsApp = isMobile || !showBot;

  if (useWhatsApp) {
    return {
      type: "whatsapp" as const,
      href: whatsappUrl || FALLBACK_WHATSAPP,
      onClick: undefined,
    };
  }

  return {
    type: "bot" as const,
    href: undefined,
    onClick: () => window.dispatchEvent(new CustomEvent("open-contact-bot")),
  };
}
