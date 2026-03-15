-- ============================================================
-- BOT CONFIG: Configuração do chatbot N8N
-- Execute no Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS public.bot_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Ativo
  active BOOLEAN NOT NULL DEFAULT false,

  -- Webhook N8N (obrigatório quando ativo)
  webhook_url TEXT NOT NULL DEFAULT '',

  -- Mensagens iniciais (JSON array: ["Olá!", "Como posso ajudar?"])
  initial_messages JSONB DEFAULT '[]'::jsonb,

  -- Tela de boas-vindas
  show_welcome_screen BOOLEAN DEFAULT false,

  -- i18n (português)
  i18n_title TEXT DEFAULT 'Olá! 👋',
  i18n_subtitle TEXT DEFAULT 'Inicie uma conversa. Estamos aqui para ajudar.',
  i18n_input_placeholder TEXT DEFAULT 'Digite sua mensagem...',
  i18n_get_started TEXT DEFAULT 'Nova conversa',

  -- Modo: window (popup) ou fullscreen
  mode TEXT DEFAULT 'window' CHECK (mode IN ('window', 'fullscreen')),

  -- Streaming de respostas
  enable_streaming BOOLEAN DEFAULT false,

  -- Cor primária do bot (hex, ex: #25D366)
  theme_primary_color TEXT DEFAULT '#25D366',

  -- Carregar sessão anterior
  load_previous_session BOOLEAN DEFAULT true,

  -- Metadados
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.bot_config IS 'Configuração do chatbot N8N para o site';

-- Inserir registro padrão (singleton - app usa apenas o primeiro registro)
INSERT INTO public.bot_config (id, active, webhook_url)
SELECT '00000000-0000-0000-0000-000000000001', false, ''
WHERE NOT EXISTS (SELECT 1 FROM public.bot_config LIMIT 1);

-- RLS
ALTER TABLE public.bot_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "bot_config_select" ON public.bot_config;
CREATE POLICY "bot_config_select" ON public.bot_config
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "bot_config_write" ON public.bot_config;
CREATE POLICY "bot_config_write" ON public.bot_config
  FOR ALL USING (public.has_min_role('gerente'));
