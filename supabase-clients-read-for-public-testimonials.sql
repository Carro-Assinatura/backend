-- ============================================================
-- Site público: depoimentos com join a clients via chave ANON
-- ============================================================
-- O front passou a usar supabaseIsolated em getTestimonialsPublic (sem JWT),
-- para não disputar o GoTrue com login/admin atrás do proxy.
--
-- Sem esta policy, o role `anon` não lê `clients` (só analista+ em clients_read)
-- e o PostgREST pode falhar ou omitir o embed `client`.
--
-- Execute no Supabase: Dashboard → SQL Editor → Run

DROP POLICY IF EXISTS "clients_read_public_testimonial_names" ON public.clients;
CREATE POLICY "clients_read_public_testimonial_names" ON public.clients
  FOR SELECT TO anon
  USING (
    EXISTS (SELECT 1 FROM public.testimonials t WHERE t.client_id = clients.id)
  );
