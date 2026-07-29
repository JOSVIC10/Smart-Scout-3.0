-- ============================================================================
-- Smart Scout 3.0 — Fase 7: Pizarra de Alineación (Alineaciones Guardadas)
-- ============================================================================

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

-- Habilitar RLS
ALTER TABLE public.alineaciones_guardadas ENABLE ROW LEVEL SECURITY;

-- Políticas
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

-- Trigger para updated_at
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
