// ============================================================================
// Smart Scout 3.0 — Servicio Supabase: Storage (fotos y escudos)
// ============================================================================

import { supabase } from './client'

const BUCKET_JUGADORES = 'fotos-jugadores'
const BUCKET_ESCUDOS = 'fotos-escudos'

/**
 * Sube una foto de jugador al bucket y devuelve la URL pública.
 */
export async function subirFotoJugador(
  archivo: File,
  jugadorId: string
): Promise<string> {
  const extension = archivo.name.split('.').pop() ?? 'jpg'
  const ruta = `${jugadorId}_${Date.now()}.${extension}`

  const { error } = await supabase.storage
    .from(BUCKET_JUGADORES)
    .upload(ruta, archivo, { upsert: true })

  if (error) throw error

  const { data } = supabase.storage
    .from(BUCKET_JUGADORES)
    .getPublicUrl(ruta)

  return data.publicUrl
}

/**
 * Sube un escudo de club al bucket y devuelve la URL pública.
 */
export async function subirEscudoClub(
  archivo: File,
  clubId: string
): Promise<string> {
  const extension = archivo.name.split('.').pop() ?? 'png'
  const ruta = `${clubId}_${Date.now()}.${extension}`

  const { error } = await supabase.storage
    .from(BUCKET_ESCUDOS)
    .upload(ruta, archivo, { upsert: true })

  if (error) throw error

  const { data } = supabase.storage
    .from(BUCKET_ESCUDOS)
    .getPublicUrl(ruta)

  return data.publicUrl
}

/**
 * Obtiene la URL pública de una foto de jugador.
 */
export function obtenerUrlFotoJugador(rutaRelativa: string | null): string | null {
  if (!rutaRelativa) return null
  if (rutaRelativa.startsWith('http://') || rutaRelativa.startsWith('https://')) {
    return rutaRelativa
  }
  const { data } = supabase.storage
    .from(BUCKET_JUGADORES)
    .getPublicUrl(rutaRelativa)
  return data.publicUrl
}

/**
 * Obtiene la URL pública de un escudo de club.
 */
export function obtenerUrlEscudo(rutaRelativa: string | null): string | null {
  if (!rutaRelativa) return null
  if (rutaRelativa.startsWith('http://') || rutaRelativa.startsWith('https://')) {
    return rutaRelativa
  }
  const { data } = supabase.storage
    .from(BUCKET_ESCUDOS)
    .getPublicUrl(rutaRelativa)
  return data.publicUrl
}
