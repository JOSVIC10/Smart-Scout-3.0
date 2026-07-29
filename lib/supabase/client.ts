// ============================================================================
// Smart Scout 3.0 — Cliente Supabase
// ============================================================================
// Inicializa la conexión con Supabase usando las variables de entorno.
// Usa únicamente la anon key pública en el frontend.

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
