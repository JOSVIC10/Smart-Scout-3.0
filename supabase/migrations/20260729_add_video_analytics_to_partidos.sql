-- Add video analytics and telemetry columns to partidos table
ALTER TABLE partidos
ADD COLUMN IF NOT EXISTS video_url text,
ADD COLUMN IF NOT EXISTS telemetria_url text,
ADD COLUMN IF NOT EXISTS posesion_local numeric,
ADD COLUMN IF NOT EXISTS posesion_visitante numeric;

-- Comment on columns for documentation
COMMENT ON COLUMN partidos.video_url IS 'URL of the uploaded video or external link';
COMMENT ON COLUMN partidos.telemetria_url IS 'URL of the uploaded telemetry.json file containing tracking and possession data';
COMMENT ON COLUMN partidos.posesion_local IS 'Ball possession percentage for the home team (0-100)';
COMMENT ON COLUMN partidos.posesion_visitante IS 'Ball possession percentage for the away team (0-100)';
