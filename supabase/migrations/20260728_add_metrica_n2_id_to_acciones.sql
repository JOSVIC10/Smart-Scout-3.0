-- ============================================================================
-- Smart Scout 3.0 — Migration: add metrica_n2_id to acciones_etiquetadas
-- ============================================================================
-- Ejecutar en Supabase SQL Editor (Dashboard > SQL Editor > New query)
-- ============================================================================

-- 1. Añadir columna metrica_n2_id (nullable) con FK a metricas_nivel2
ALTER TABLE public.acciones_etiquetadas
  ADD COLUMN IF NOT EXISTS metrica_n2_id UUID
    REFERENCES public.metricas_nivel2(id)
    ON DELETE SET NULL;

-- Índice para acelerar consultas de recálculo de score por jugador + métrica N2
CREATE INDEX IF NOT EXISTS idx_acciones_jugador_metrica_n2
  ON public.acciones_etiquetadas (jugador_id, metrica_n2_id);

-- Índice para consultas de clips por vídeo ordenadas por tiempo
CREATE INDEX IF NOT EXISTS idx_acciones_video_tiempo
  ON public.acciones_etiquetadas (video_id, minuto_video, segundo_video);

-- 2. Comentario documental
COMMENT ON COLUMN public.acciones_etiquetadas.metrica_n2_id IS
  'Referencia directa a la métrica N2 que genera esta acción. '
  'Permite recálculo de score limpio y trazable desde Supabase sin lógica en frontend.';

-- ============================================================================
-- 3. Bucket de Storage para vídeos (ejecutar solo si no existe)
-- ============================================================================
-- NOTA: Si el bucket ya existe en el dashboard, omitir este bloque.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'videos',
  'videos',
  true,
  524288000,  -- 500 MB límite por archivo
  ARRAY['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-msvideo']
)
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  CREATE POLICY "Usuarios autenticados pueden subir vídeos"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'videos');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE POLICY "Lectura pública de vídeos"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'videos');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE POLICY "El propietario puede eliminar vídeos"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (bucket_id = 'videos' AND auth.uid() = owner);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

