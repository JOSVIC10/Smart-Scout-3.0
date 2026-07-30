// ============================================================================
// Smart Scout 3.0 — Cliente Supabase
// ============================================================================
// Inicializa la conexión con Supabase usando las variables de entorno.
// Usa únicamente la anon key pública en el frontend.

import { createClient } from '@supabase/supabase-js'

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  'https://mnfxjxorffxnuxpdzzzd.supabase.co'

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1uZnhqeG9yZmZ4bnV4cGR6enpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxODQzNDIsImV4cCI6MjEwMDc2MDM0Mn0.EvAmPcHsgIzJLhFZUlPfp9ujjQr2OfXX4ANnIZifdAc'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
