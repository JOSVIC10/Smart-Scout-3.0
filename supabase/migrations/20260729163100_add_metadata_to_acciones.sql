-- Add metadata column to acciones_etiquetadas to store structured details (shot types, coordinates, assists)
ALTER TABLE acciones_etiquetadas
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN acciones_etiquetadas.metadata IS 'Stores unstructured additional details like shot type, assist player ID, and start/end coordinates for the action.';
