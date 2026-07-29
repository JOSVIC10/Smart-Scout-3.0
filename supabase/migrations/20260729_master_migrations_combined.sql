-- ============================================================================
-- Smart Scout 3.0 — Master Combined SQL Migration Script
-- ============================================================================
-- Contiene todas las 8 migraciones de Smart Scout 3.0 en orden secuencial.
-- Instrucciones: Copiar y ejecutar en Supabase Dashboard › SQL Editor › New query
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Migración: 20260728_add_metrica_n2_id_to_acciones.sql
-- ----------------------------------------------------------------------------
ALTER TABLE public.acciones_etiquetadas
  ADD COLUMN IF NOT EXISTS metrica_n2_id UUID
    REFERENCES public.metricas_nivel2(id)
    ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_acciones_jugador_metrica_n2
  ON public.acciones_etiquetadas (jugador_id, metrica_n2_id);

CREATE INDEX IF NOT EXISTS idx_acciones_video_tiempo
  ON public.acciones_etiquetadas (video_id, minuto_video, segundo_video);

COMMENT ON COLUMN public.acciones_etiquetadas.metrica_n2_id IS
  'Referencia directa a la métrica N2 que genera esta acción. '
  'Permite recálculo de score limpio y trazable desde Supabase sin lógica en frontend.';

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'videos',
  'videos',
  true,
  524288000,
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

-- ----------------------------------------------------------------------------
-- 2. Migración: 20260728_fase5_scoring_motor.sql
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'jugador_metricas_n2_jugador_id_metrica_n2_id_key'
  ) THEN
    ALTER TABLE public.jugador_metricas_n2
      ADD CONSTRAINT jugador_metricas_n2_jugador_id_metrica_n2_id_key
      UNIQUE (jugador_id, metrica_n2_id);
  END IF;
END $$;

COMMENT ON CONSTRAINT jugador_metricas_n2_jugador_id_metrica_n2_id_key
  ON public.jugador_metricas_n2
  IS 'Permite UPSERT sin duplicados desde el motor de scoring (calcularScore.ts)';

CREATE INDEX IF NOT EXISTS idx_jugadores_posicion
  ON public.jugadores (posicion);

CREATE INDEX IF NOT EXISTS idx_acciones_jugador_metrica_n2_resultado
  ON public.acciones_etiquetadas (jugador_id, metrica_n2_id, resultado);

CREATE INDEX IF NOT EXISTS idx_ponderaciones_modelo_posicion
  ON public.ponderaciones_modelo (modelo_id, posicion);

DO $$
BEGIN
  CREATE POLICY "Lectura pública de metricas_n2 de jugadores"
    ON public.jugador_metricas_n2 FOR SELECT
    TO public
    USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE POLICY "Usuarios autenticados pueden escribir metricas_n2"
    ON public.jugador_metricas_n2 FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE POLICY "Lectura pública de ponderaciones"
    ON public.ponderaciones_modelo FOR SELECT
    TO public
    USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE POLICY "Usuarios autenticados pueden gestionar ponderaciones"
    ON public.ponderaciones_modelo FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE POLICY "Lectura pública de modelos_juego"
    ON public.modelos_juego FOR SELECT
    TO public
    USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE POLICY "Usuarios autenticados pueden gestionar modelos personalizados"
    ON public.modelos_juego FOR ALL
    TO authenticated
    USING (NOT es_predefinido OR auth.role() = 'authenticated')
    WITH CHECK (NOT es_predefinido);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

INSERT INTO public.modelos_juego (id, nombre, descripcion, es_predefinido, formacion)
VALUES
  (
    'f0000001-0000-0000-0000-000000000001',
    'Posesión',
    'Estilo posicional que busca superioridades mediante la ocupación racional del espacio.',
    true,
    '4-3-3'
  ),
  (
    'f0000002-0000-0000-0000-000000000002',
    'Contraataque',
    'Bloque defensivo compacto y transiciones verticales rápidas aprovechando espacios a la espalda.',
    true,
    '4-4-2'
  ),
  (
    'f0000003-0000-0000-0000-000000000003',
    'Presión Alta',
    'Pressing intenso en campo rival para recuperar el balón alto y crear oportunidades de gol.',
    true,
    '4-3-3'
  ),
  (
    'f0000004-0000-0000-0000-000000000004',
    'Bloque Bajo',
    'Defensa en bloque bajo y medio con líneas compactas, buscando el error rival o el contragolpe.',
    true,
    '4-5-1'
  )
ON CONFLICT (id) DO NOTHING;

COMMENT ON TABLE public.jugador_metricas_n2 IS
  'Cache de valores N2 calculados por el motor de scoring (calcularScore.ts Fase 5). '
  'Se actualiza via UPSERT cada vez que se recalcula el score de un jugador.';

COMMENT ON TABLE public.modelos_juego IS
  'Modelos de juego. es_predefinido=true: solo lectura en UI. '
  'Los personalizados son gestionados por el usuario desde el Configurador de Modelos.';

-- ----------------------------------------------------------------------------
-- 3. Migración: 20260729_add_video_analytics_to_partidos.sql
-- ----------------------------------------------------------------------------
ALTER TABLE partidos
ADD COLUMN IF NOT EXISTS video_url text,
ADD COLUMN IF NOT EXISTS telemetria_url text,
ADD COLUMN IF NOT EXISTS posesion_local numeric,
ADD COLUMN IF NOT EXISTS posesion_visitante numeric;

COMMENT ON COLUMN partidos.video_url IS 'URL del vídeo subido o enlace externo';
COMMENT ON COLUMN partidos.telemetria_url IS 'URL del archivo telemetry.json subido que contiene tracking y posesión';
COMMENT ON COLUMN partidos.posesion_local IS 'Porcentaje de posesión del equipo local (0-100)';
COMMENT ON COLUMN partidos.posesion_visitante IS 'Porcentaje de posesión del equipo visitante (0-100)';

-- ----------------------------------------------------------------------------
-- 4. Migración: 20260729_clips_valor_accion.sql
-- ----------------------------------------------------------------------------
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

CREATE INDEX IF NOT EXISTS idx_acciones_valor_accion
  ON public.acciones_etiquetadas (jugador_id, valor_accion DESC NULLS LAST);

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'clips',
  'clips',
  true,
  52428800,
  ARRAY['video/mp4', 'video/webm', 'video/quicktime', 'text/plain']
)
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  CREATE POLICY "Lectura pública de clips"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'clips');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE POLICY "Usuarios autenticados pueden subir clips"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'clips');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE POLICY "Usuarios autenticados pueden borrar clips"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (bucket_id = 'clips');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

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

COMMENT ON TABLE public.acciones_etiquetadas IS
  'Acciones etiquetadas en vídeo con soporte de clips automáticos (clip_url, '
  'clip_start_sec, clip_end_sec) y valor cuantificado (valor_accion). '
  'Actualizado en Smart Scout 3.0 Fase 6 (Auto-Clips).';

-- ----------------------------------------------------------------------------
-- 5. Migración: 20260729_create_alineaciones_guardadas.sql
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.alineaciones_guardadas (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre text NOT NULL,
  modelo_id uuid REFERENCES public.modelos_juego(id) ON DELETE SET NULL,
  formacion text NOT NULL,
  slots jsonb NOT NULL DEFAULT '[]'::jsonb,
  notas text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.alineaciones_guardadas ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  CREATE POLICY "Lectura pública de alineaciones"
    ON public.alineaciones_guardadas FOR SELECT
    TO public
    USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE POLICY "Usuarios autenticados pueden gestionar alineaciones"
    ON public.alineaciones_guardadas FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DO $$
BEGIN
  CREATE TRIGGER update_alineaciones_guardadas_modtime
    BEFORE UPDATE ON public.alineaciones_guardadas
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

COMMENT ON TABLE public.alineaciones_guardadas IS 'Almacena las alineaciones y pizarras tácticas guardadas por el usuario.';

-- ----------------------------------------------------------------------------
-- 6. Migración: 20260729_create_jugadores_bucket.sql
-- ----------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('jugadores', 'jugadores', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DO $$
BEGIN
  CREATE POLICY "Fotos de jugadores publicas" ON storage.objects FOR SELECT USING ( bucket_id = 'jugadores' );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE POLICY "Cualquiera puede subir fotos" ON storage.objects FOR INSERT WITH CHECK ( bucket_id = 'jugadores' );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE POLICY "Cualquiera puede actualizar fotos" ON storage.objects FOR UPDATE USING ( bucket_id = 'jugadores' );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE POLICY "Cualquiera puede borrar fotos" ON storage.objects FOR DELETE USING ( bucket_id = 'jugadores' );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ----------------------------------------------------------------------------
-- 7. Migración: 20260729140428_add_partido_id_to_acciones.sql
-- ----------------------------------------------------------------------------
ALTER TABLE acciones_etiquetadas
ADD COLUMN IF NOT EXISTS partido_id UUID REFERENCES partidos(id);

CREATE INDEX IF NOT EXISTS idx_acciones_etiquetadas_partido_id ON acciones_etiquetadas(partido_id);

COMMENT ON COLUMN acciones_etiquetadas.partido_id IS 'Referencia al partido si la acción se registró en directo o se vinculó posteriormente.';

ALTER TABLE acciones_etiquetadas
ALTER COLUMN video_id DROP NOT NULL;

-- ----------------------------------------------------------------------------
-- 8. Migración: 20260729163100_add_metadata_to_acciones.sql
-- ----------------------------------------------------------------------------
ALTER TABLE acciones_etiquetadas
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN acciones_etiquetadas.metadata IS 'Almacena detalles estructurados adicionales como tipo de tiro, asistencia y coordenadas.';
