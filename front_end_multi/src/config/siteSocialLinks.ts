import type { LucideIcon } from "lucide-react";
import {
  AtSign,
  Facebook,
  Ghost,
  Instagram,
  Linkedin,
  Music2,
  Pin,
  Twitter,
  Youtube,
} from "lucide-react";

/** Chaves em `public.settings` + metadados para intranet e rodapé do site. */
export const SITE_SOCIAL_FORM_FIELDS: readonly {
  key: string;
  label: string;
  /** Rótulo na tabela `settings` (upsert / migração). */
  settingsLabel: string;
  placeholder: string;
  Icon: LucideIcon;
  ariaLabel: string;
}[] = [
  {
    key: "social_instagram_url",
    label: "Instagram",
    settingsLabel: "Instagram — URL do perfil",
    placeholder: "https://www.instagram.com/seu_perfil/",
    Icon: Instagram,
    ariaLabel: "Instagram",
  },
  {
    key: "social_facebook_url",
    label: "Facebook",
    settingsLabel: "Facebook — URL da página",
    placeholder: "https://www.facebook.com/sua_pagina",
    Icon: Facebook,
    ariaLabel: "Facebook",
  },
  {
    key: "social_linkedin_url",
    label: "LinkedIn",
    settingsLabel: "LinkedIn — URL do perfil ou empresa",
    placeholder: "https://www.linkedin.com/company/...",
    Icon: Linkedin,
    ariaLabel: "LinkedIn",
  },
  {
    key: "social_x_url",
    label: "X (Twitter)",
    settingsLabel: "X (Twitter) — URL do perfil",
    placeholder: "https://x.com/seu_perfil",
    Icon: Twitter,
    ariaLabel: "X (Twitter)",
  },
  {
    key: "social_youtube_url",
    label: "YouTube",
    settingsLabel: "YouTube — URL do canal",
    placeholder: "https://www.youtube.com/@seu_canal",
    Icon: Youtube,
    ariaLabel: "YouTube",
  },
  {
    key: "social_tiktok_url",
    label: "TikTok",
    settingsLabel: "TikTok — URL do perfil",
    placeholder: "https://www.tiktok.com/@seu_perfil",
    Icon: Music2,
    ariaLabel: "TikTok",
  },
  {
    key: "social_threads_url",
    label: "Threads",
    settingsLabel: "Threads — URL do perfil",
    placeholder: "https://www.threads.net/@seu_perfil",
    Icon: AtSign,
    ariaLabel: "Threads",
  },
  {
    key: "social_pinterest_url",
    label: "Pinterest",
    settingsLabel: "Pinterest — URL do perfil",
    placeholder: "https://br.pinterest.com/seu_perfil/",
    Icon: Pin,
    ariaLabel: "Pinterest",
  },
  {
    key: "social_snapchat_url",
    label: "Snapchat",
    settingsLabel: "Snapchat — URL do perfil ou add",
    placeholder: "https://www.snapchat.com/add/seu_usuario",
    Icon: Ghost,
    ariaLabel: "Snapchat",
  },
] as const;

export const SITE_SOCIAL_SETTING_KEYS = SITE_SOCIAL_FORM_FIELDS.map((f) => f.key);
