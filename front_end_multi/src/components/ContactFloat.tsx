import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { MessageCircle } from "lucide-react";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useBotConfig } from "@/hooks/useBotConfig";
import { useLogo } from "@/hooks/useLogo";

const N8N_CHAT_TARGET_ID = "n8n-chat-root";
const LOGO_FALLBACK = "/logo-multi.svg";

const ContactFloat = () => {
  const location = useLocation();
  const { whatsappUrl } = useSiteSettings();
  const { config, showBot, isMobile } = useBotConfig();
  const { logoUrl } = useLogo();
  const chatInitialized = useRef(false);

  const isHidden = location.pathname.startsWith("/admin") || location.pathname === "/campanha";

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
          allowFileUploads: true,
          allowedFilesMimeTypes: "image/png,image/jpeg,image/jpg,application/pdf",
          i18n: {
            en: {
              title: config.i18n_title ?? "Olá! 👋",
              subtitle: config.i18n_subtitle ?? "Inicie uma conversa. Estamos aqui para ajudar.",
              inputPlaceholder: config.i18n_input_placeholder ?? "Digite sua mensagem...",
              getStarted: config.i18n_get_started ?? "Nova conversa",
              footer: "Envie imagens (PNG, JPG) ou PDF para anexar documentos.",
              closeButtonTooltip: "Fechar",
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

  // Fechar o chat ao clicar fora (não abre ao clicar fora — só o ícone abre)
  useEffect(() => {
    if (!showBot) return;

    const handleClickOutside = (e: MouseEvent) => {
      const root = document.getElementById(N8N_CHAT_TARGET_ID);
      if (!root || root.contains(e.target as Node)) return;

      const chatWindow = root.querySelector(".chat-window");
      if (!chatWindow) return;

      const rect = chatWindow.getBoundingClientRect();
      const isOpen = rect.width > 20 && rect.height > 20;
      if (!isOpen) return;

      const toggle = root.querySelector(".chat-window-toggle, button");
      if (toggle) (toggle as HTMLElement).click();
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showBot]);

  if (isHidden) return null;

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

  // Desktop com bot: usa apenas o ícone nativo do N8N (sem duplicar)
  const primaryColor = config?.theme_primary_color ?? "#25D366";
  const logoForBg = logoUrl || LOGO_FALLBACK;
  const logoEscaped = logoForBg.replace(/"/g, '\\"');

  return (
    <>
      <style>{`
        #${N8N_CHAT_TARGET_ID} {
          --chat--color--primary: ${primaryColor};
          --chat--color--primary-shade-50: ${primaryColor};
          --chat--toggle--background: ${primaryColor};
          --chat--window--border-radius: 20px;
          --chat--window--border: 1px solid rgba(0,0,0,0.08);
          --chat-bot-logo: url("${logoEscaped}");
        }
        /* Visual moderno: janela do chat (classes do @n8n/chat) */
        #${N8N_CHAT_TARGET_ID} .chat-window-wrapper .chat-window {
          border-radius: 20px !important;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05) !important;
          overflow: hidden !important;
        }
        /* Botão flutuante */
        #${N8N_CHAT_TARGET_ID} .chat-window-toggle {
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15) !important;
        }
        /* Área do chat com logo de fundo (atrás da conversa) */
        #${N8N_CHAT_TARGET_ID} .chat-layout .chat-body {
          position: relative !important;
          background-color: #fafafa !important;
          background-image: var(--chat-bot-logo) !important;
          background-size: 45% auto !important;
          background-position: center !important;
          background-repeat: no-repeat !important;
        }
        #${N8N_CHAT_TARGET_ID} .chat-layout .chat-body::before {
          content: "" !important;
          position: absolute !important;
          inset: 0 !important;
          background: linear-gradient(180deg, rgba(250,250,250,0.85) 0%, rgba(245,245,245,0.9) 100%) !important;
          pointer-events: none !important;
        }
        /* Área de mensagens (acima do fundo) */
        #${N8N_CHAT_TARGET_ID} .chat-messages-list {
          padding: 16px !important;
          background: transparent !important;
          position: relative !important;
          z-index: 1 !important;
        }
        /* Campo de digitação e botão de arquivo */
        #${N8N_CHAT_TARGET_ID} .chat-footer,
        #${N8N_CHAT_TARGET_ID} .chat-input,
        #${N8N_CHAT_TARGET_ID} .chat-inputs {
          display: flex !important;
          visibility: visible !important;
          padding: 12px 16px !important;
          background: #fff !important;
          border-top: 1px solid #e5e7eb !important;
        }
        #${N8N_CHAT_TARGET_ID} .chat-inputs textarea {
          min-height: 50px !important;
          opacity: 1 !important;
        }
        /* Garantir que o botão de arquivo (clip) fique visível */
        #${N8N_CHAT_TARGET_ID} .chat-input-file-button {
          display: inline-flex !important;
          visibility: visible !important;
        }
      `}</style>
      <div id={N8N_CHAT_TARGET_ID} className="fixed bottom-6 right-6 z-50" />
    </>
  );
};

export default ContactFloat;
