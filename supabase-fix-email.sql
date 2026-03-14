-- ============================================================
-- Adicionar email à tabela profiles e atualizar trigger
-- Execute no Supabase Dashboard > SQL Editor
-- ============================================================

-- 1. Adicionar coluna email
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT NOT NULL DEFAULT '';

-- 2. Preencher email do admin existente
UPDATE public.profiles SET email = 'admin@multi.com.br'
WHERE id = '28c8ac22-7e23-4ae4-9eae-384e2de1749b';

-- 3. Atualizar trigger para salvar email automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, role, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'analista'),
    COALESCE(NEW.email, '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
