-- Permite upload de arquivos no bucket client-documents por visitantes anônimos
-- Execute no Supabase SQL Editor
--
-- IMPORTANTE: Execute este script e verifique no Dashboard:
-- 1. Storage > client-documents existe? (crie se não existir)
-- 2. O nome do bucket é exatamente "client-documents"?

-- Remover TODAS as políticas antigas do bucket client-documents
DROP POLICY IF EXISTS "client_docs_upload" ON storage.objects;
DROP POLICY IF EXISTS "client_docs_upload_anon" ON storage.objects;
DROP POLICY IF EXISTS "client_docs_read" ON storage.objects;
DROP POLICY IF EXISTS "client_docs_delete" ON storage.objects;

-- Política 1: INSERT - permite anon e authenticated (upload de documentos)
CREATE POLICY "client_docs_upload" ON storage.objects
  FOR INSERT
  TO public
  WITH CHECK (bucket_id = 'client-documents');

-- Política 2: SELECT - apenas authenticated (leitura dos docs no painel admin)
CREATE POLICY "client_docs_read" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'client-documents' AND auth.role() = 'authenticated');

-- Política 3: DELETE - apenas authenticated
CREATE POLICY "client_docs_delete" ON storage.objects
  FOR DELETE
  USING (bucket_id = 'client-documents' AND auth.role() = 'authenticated');
