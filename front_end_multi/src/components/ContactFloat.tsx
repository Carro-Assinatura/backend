import { useEffect, useRef } from "react";
import { MessageCircle, Bot } from "lucide-react";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useBotConfig } from "@/hooks/useBotConfig";

const N8N_CHAT_TARGET_ID = "n8n-chat-root";

const ContactFloat = () => {
  const { whatsappUrl } = useSiteSettings();
  const { config, showBot, isMobile } = useBotConfig();
  const chatInitialized = useRef(false);

  useEffect(() => {
    if (!showBot || !config?.webhook_url) return;

    let mounted = true;

    const initChat = async () => {
      if (chatInitialized.current) return;
      chatInitialized.current = true;

      try {
        await import("@n8n/chat/style.css");
        const { createChat } = await import("@n8n/chat");

        if (!mounted) return;

        const target = document.getElementById(N8N_CHAT_TARGET_ID);
        if (!target || target.hasChildNodes()) return;

        const initialMessages = Array.isArray(config.initial_messages) && config.initial_messages.length > 0
          ? config.initial_messages
          : ["Olá! 👋", "Como posso ajudar você hoje?"];

        createChat({
          webhookUrl: config.webhook_url.trim(),
          target: `#${N8N_CHAT_TARGET_ID}`,
          mode: config.mode ?? "window",
          showWelcomeScreen: config.show_welcome_screen ?? false,
          initialMessages,
          loadPreviousSession: config.load_previous_session ?? true,
          enableStreaming: config.enable_streaming ?? false,
          i18n: {
            en: {
              title: config.i18n_title ?? "Olá! 👋",
              subtitle: config.i18n_subtitle ?? "Inicie uma conversa. Estamos aqui para ajudar.",
              inputPlaceholder: config.i18n_input_placeholder ?? "Digite sua mensagem...",
              getStarted: config.i18n_get_started ?? "Nova conversa",
            },
          },
        });
      } catch (err) {
        console.error("Erro ao inicializar chat N8N:", err);
        chatInitialized.current = false;
      }
    };

    initChat();
    return () => {
      mounted = false;
      chatInitialized.current = false;
    };
  }, [showBot, config]);

  // Ouvir evento para abrir o chat (usado pelos botões "Falar no WhatsApp" no desktop)
  useEffect(() => {
    const handler = () => {
      const btn = document.querySelector(`#${N8N_CHAT_TARGET_ID} button`);
      if (btn) (btn as HTMLElement).click();
    };
    window.addEventListener("open-contact-bot", handler);
    return () => window.removeEventListener("open-contact-bot", handler);
  }, []);

  // Mobile: sempre WhatsApp. Sem bot ativo: WhatsApp
  if (isMobile || !showBot) {
    return (
      <a
        href={whatsappUrl || "https://wa.me/5511999999999"}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 w-16 h-16 rounded-full bg-[hsl(142,70%,40%)] flex items-center justify-center shadow-lg hover:scale-110 transition-transform duration-300 animate-pulse-glow"
        aria-label="Falar no WhatsApp"
      >
        <MessageCircle size={28} className="text-primary-foreground" />
      </a>
    );
  }

  // Desktop com bot: ícone do bot + tela de conversa N8N
  const primaryColor = config?.theme_primary_color ?? "#25D366";
  const openChat = () => window.dispatchEvent(new CustomEvent("open-contact-bot"));

  return (
    <>
      <style>{`
        #${N8N_CHAT_TARGET_ID} {
          --chat--color--primary: ${primaryColor};
          --chat--color--primary-shade-50: ${primaryColor};
          --chat--toggle--background: ${primaryColor};
        }
        /* Esconde o botão padrão do N8N, usamos nosso ícone de bot */
        #${N8N_CHAT_TARGET_ID} > div > button:first-of-type {
          display: none !important;
        }
        /* Garantir que o campo de digitação fique visível */
        #${N8N_CHAT_TARGET_ID} .chat-footer,
        #${N8N_CHAT_TARGET_ID} .chat-input,
        #${N8N_CHAT_TARGET_ID} .chat-inputs {
          display: flex !important;
          visibility: visible !important;
        }
        #${N8N_CHAT_TARGET_ID} .chat-inputs textarea {
          min-height: 50px !important;
          opacity: 1 !important;
        }
      `}</style>
      <button
        onClick={openChat}
        className="fixed bottom-6 right-6 z-50 w-16 h-16 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform duration-300 animate-pulse-glow"
        style={{ backgroundColor: primaryColor }}
        aria-label="Falar com o assistente"
      >
        <Bot size={28} className="text-white" />
      </button>
      <div id={N8N_CHAT_TARGET_ID} className="fixed bottom-6 right-6 z-[45]" />
    </>
  );
};

export default ContactFloat;
