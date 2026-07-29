-- Add partido_id column to acciones_etiquetadas table to link live match events
ALTER TABLE acciones_etiquetadas
ADD COLUMN partido_id UUID REFERENCES partidos(id);

-- Add index for performance on filtering by partido_id
CREATE INDEX idx_acciones_etiquetadas_partido_id ON acciones_etiquetadas(partido_id);

-- Optional: Add comments
COMMENT ON COLUMN acciones_etiquetadas.partido_id IS 'Reference to the match if this action was recorded in live mode without a video initially, or linked later.';

-- Allow video_id to be null for live matches
ALTER TABLE acciones_etiquetadas
ALTER COLUMN video_id DROP NOT NULL;
