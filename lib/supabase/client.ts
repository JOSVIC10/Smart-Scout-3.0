// ============================================================================
// Smart Scout 3.0 — Cliente Supabase
// ============================================================================
// Inicializa la conexión con Supabase usando las variables de entorno.
// Usa únicamente la anon key pública en el frontend.

import { createClient } from '@supabase/supabase-js'

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
const rawKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()

export const supabaseUrl = rawUrl && rawUrl.length > 0
  ? rawUrl
  : 'https://mnfxjxorffxnuxpdzzzd.supabase.co'

export const supabaseAnonKey = rawKey && rawKey.length > 0
  ? rawKey
  : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1uZnhqeG9yZmZ4bnV4cGR6enpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxODQzNDIsImV4cCI6MjEwMDc2MDM0Mn0.EvAmPcHsgIzJLhFZUlPfp9ujjQr2OfXX4ANnIZifdAc'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
