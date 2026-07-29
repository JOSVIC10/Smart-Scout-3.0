-- ============================================================================
-- Smart Scout 3.0 — Clips automáticos y valor de acción
-- ============================================================================
-- INSTRUCCIONES: Ejecutar en Supabase Dashboard › SQL Editor › New Query
-- ============================================================================

-- ── 1. Añadir columnas a acciones_etiquetadas ─────────────────────────────

ALTER TABLE public.acciones_etiquetadas
  ADD COLUMN IF NOT EXISTS clip_url TEXT,
  ADD COLUMN IF NOT EXISTS valor_accion NUMERIC(5,3),
  ADD COLUMN IF NOT EXISTS clip_start_sec NUMERIC(8,3),
  ADD COLUMN IF NOT EXISTS clip_end_sec NUMERIC(8,3);

COMMENT ON COLUMN public.acciones_etiquetadas.clip_url IS
  'URL pública del clip en Supabase Storage (bucket clips) o referencia temporal '
  'del vídeo original (para YouTube y storage sin recorte físico).';

COMMENT ON COLUMN public.acciones_etiquetadas.valor_accion IS
  'Valor cuantificado de la acción: resultado_binario × peso_metrica_n2 × factor_zona. '
  'Rango típico 0.000–1.500. Contribuye al score global del jugador.';

COMMENT ON COLUMN public.acciones_etiquetadas.clip_start_sec IS
  'Segundo de inicio del clip en el vídeo original (timestamp - margen_pre).';

COMMENT ON COLUMN public.acciones_etiquetadas.clip_end_sec IS
  'Segundo de fin del clip en el vídeo original (timestamp + margen_post).';

-- ── 2. Índice para ordenar acciones por valor (ficha del jugador) ─────────

CREATE INDEX IF NOT EXISTS idx_acciones_valor_accion
  ON public.acciones_etiquetadas (jugador_id, valor_accion DESC NULLS LAST);

-- ── 3. Crear bucket "clips" en Supabase Storage ───────────────────────────
-- NOTA: La creación de buckets desde SQL solo funciona si la extensión
-- storage está habilitada. Si falla, créalo manualmente en:
-- Dashboard › Storage › New Bucket (nombre: "clips", Public: true)

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'clips',
  'clips',
  true,
  52428800,  -- 50 MB límite por archivo
  ARRAY['video/mp4', 'video/webm', 'video/quicktime', 'text/plain']
)
ON CONFLICT (id) DO NOTHING;

-- ── 4. Políticas RLS para el bucket clips ────────────────────────────────

-- Lectura pública (para reproducir clips en la ficha del jugador)
DO $$
BEGIN
  CREATE POLICY "Lectura pública de clips"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'clips');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Subida para usuarios autenticados
DO $$
BEGIN
  CREATE POLICY "Usuarios autenticados pueden subir clips"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'clips');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Borrado para usuarios autenticados (limpieza futura)
DO $$
BEGIN
  CREATE POLICY "Usuarios autenticados pueden borrar clips"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (bucket_id = 'clips');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── 5. Políticas RLS para acciones_etiquetadas (asegurar que existen) ────

DO $$
BEGIN
  CREATE POLICY "Lectura pública de acciones etiquetadas"
    ON public.acciones_etiquetadas FOR SELECT
    TO public
    USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE POLICY "Usuarios autenticados pueden gestionar acciones"
    ON public.acciones_etiquetadas FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── 6. Comentario de documentación ───────────────────────────────────────

COMMENT ON TABLE public.acciones_etiquetadas IS
  'Acciones etiquetadas en vídeo con soporte de clips automáticos (clip_url, '
  'clip_start_sec, clip_end_sec) y valor cuantificado (valor_accion). '
  'Actualizado en Smart Scout 3.0 Fase 6 (Auto-Clips).';
