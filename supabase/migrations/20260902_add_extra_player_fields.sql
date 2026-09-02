-- Añadir campos adicionales a la tabla de jugadores para la ficha detallada
ALTER TABLE jugadores
ADD COLUMN IF NOT EXISTS valor_mercado text,
ADD COLUMN IF NOT EXISTS fin_contrato text,
ADD COLUMN IF NOT EXISTS estilo_juego text,
ADD COLUMN IF NOT EXISTS est_partidos integer,
ADD COLUMN IF NOT EXISTS est_goles integer,
ADD COLUMN IF NOT EXISTS est_asistencias integer,
ADD COLUMN IF NOT EXISTS est_amarillas integer,
ADD COLUMN IF NOT EXISTS est_rojas integer;
