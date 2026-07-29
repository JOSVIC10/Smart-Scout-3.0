-- ============================================================================
-- Smart Scout 3.0 — Fase 5: Motor de Scoring y Configurador de Modelos
-- ============================================================================
-- Ejecutar en Supabase SQL Editor (Dashboard › SQL Editor › New query)
-- ============================================================================

-- ── 1. Unique constraint en jugador_metricas_n2 ────────────────────────────
-- Necesario para que el UPSERT de calcularScore.ts funcione correctamente.
-- Si ya existe la constraint, el bloque DO...END la ignorará silenciosamente.

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

-- ── 2. Índices de rendimiento para consultas de scoring ────────────────────

-- Consultas de percentil: todos los jugadores de una posición
CREATE INDEX IF NOT EXISTS idx_jugadores_posicion
  ON public.jugadores (posicion);

-- Consultas de scoring: acciones por jugador + métrica N2
CREATE INDEX IF NOT EXISTS idx_acciones_jugador_metrica_n2_resultado
  ON public.acciones_etiquetadas (jugador_id, metrica_n2_id, resultado);

-- Consultas en ponderaciones_modelo por modelo + posición
CREATE INDEX IF NOT EXISTS idx_ponderaciones_modelo_posicion
  ON public.ponderaciones_modelo (modelo_id, posicion);

-- ── 3. Política RLS para jugador_metricas_n2 (si aún no existe) ───────────
-- Permitir lectura y escritura a usuarios autenticados (el scoring la necesita)

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

-- ── 4. Política RLS para ponderaciones_modelo ────────────────────────────

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

-- ── 5. Política RLS para modelos_juego ────────────────────────────────────

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

-- ── 6. Asegurar que los 4 modelos predefinidos existen ───────────────────
-- Si ya existen (por una migración anterior), ON CONFLICT DO NOTHING los ignora.

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

-- ── 7. Comentarios de documentación ──────────────────────────────────────

COMMENT ON TABLE public.jugador_metricas_n2 IS
  'Cache de valores N2 calculados por el motor de scoring (calcularScore.ts Fase 5). '
  'Se actualiza via UPSERT cada vez que se recalcula el score de un jugador.';

COMMENT ON TABLE public.modelos_juego IS
  'Modelos de juego. es_predefinido=true: solo lectura en UI. '
  'Los personalizados son gestionados por el usuario desde el Configurador de Modelos.';
