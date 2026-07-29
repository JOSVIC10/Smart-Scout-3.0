// ============================================================================
// Smart Scout 3.0 — Servicio Supabase: Jugadores
// ============================================================================

import { supabase } from './client'
import type { Jugador, JugadorConClub, FiltrosJugador } from '@/types/database'

/**
 * Obtiene todos los jugadores con datos del club embebidos.
 * Soporta filtros opcionales.
 */
export async function obtenerJugadores(filtros?: Partial<FiltrosJugador>): Promise<JugadorConClub[]> {
  let query = supabase
    .from('jugadores')
    .select(`
      *,
      club:clubes(*)
    `)
    .order('apellidos', { ascending: true })

  if (filtros?.posicion) {
    query = query.eq('posicion', filtros.posicion)
  }
  if (filtros?.clubId) {
    query = query.eq('club_id', filtros.clubId)
  }
  if (filtros?.categoria) {
    query = query.eq('categoria', filtros.categoria)
  }
  if (filtros?.busqueda) {
    query = query.or(
      `nombre.ilike.%${filtros.busqueda}%,apellidos.ilike.%${filtros.busqueda}%`
    )
  }

  const { data, error } = await query

  if (error) throw error
  return (data as JugadorConClub[]) ?? []
}

/**
 * Obtiene un jugador por ID con datos del club embebidos.
 */
export async function obtenerJugadorPorId(id: string): Promise<JugadorConClub | null> {
  const { data, error } = await supabase
    .from('jugadores')
    .select(`
      *,
      club:clubes(*)
    `)
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null // No encontrado
    throw error
  }
  return data as JugadorConClub
}

/**
 * Crea un nuevo jugador.
 */
export async function crearJugador(
  jugador: Omit<Jugador, 'id' | 'created_at' | 'updated_at'>
): Promise<Jugador> {
  const { data, error } = await supabase
    .from('jugadores')
    .insert(jugador)
    .select()
    .single()

  if (error) throw error
  return data as Jugador
}

/**
 * Actualiza un jugador existente.
 */
export async function actualizarJugador(
  id: string,
  campos: Partial<Omit<Jugador, 'id' | 'created_at' | 'updated_at'>>
): Promise<Jugador> {
  const { data, error } = await supabase
    .from('jugadores')
    .update(campos)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as Jugador
}

/**
 * Elimina un jugador.
 */
export async function eliminarJugador(id: string): Promise<void> {
  const { error } = await supabase
    .from('jugadores')
    .delete()
    .eq('id', id)

  if (error) throw error
}

/**
 * Obtiene el conteo total de jugadores (para el dashboard).
 */
export async function contarJugadores(): Promise<number> {
  const { count, error } = await supabase
    .from('jugadores')
    .select('*', { count: 'exact', head: true })

  if (error) throw error
  return count ?? 0
}

/**
 * Obtiene los últimos jugadores añadidos.
 */
export async function obtenerUltimosJugadores(limite: number = 5): Promise<JugadorConClub[]> {
  const { data, error } = await supabase
    .from('jugadores')
    .select(`*, club:clubes(*)`)
    .order('created_at', { ascending: false })
    .limit(limite)

  if (error) throw error
  return (data as JugadorConClub[]) ?? []
}
