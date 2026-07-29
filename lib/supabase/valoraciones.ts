// ============================================================================
// Smart Scout 3.0 — Servicio Supabase: Valoraciones
// ============================================================================

import { supabase } from './client'
import type { Valoracion } from '@/types/database'

export async function obtenerValoracionesPorJugador(jugadorId: string): Promise<Valoracion[]> {
  const { data, error } = await supabase
    .from('valoraciones')
    .select('*')
    .eq('jugador_id', jugadorId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data as Valoracion[]) ?? []
}

export async function crearValoracion(
  valoracion: Omit<Valoracion, 'id' | 'created_at'>
): Promise<Valoracion> {
  const { data, error } = await supabase
    .from('valoraciones')
    .insert(valoracion)
    .select()
    .single()

  if (error) throw error
  return data as Valoracion
}

export async function eliminarValoracion(id: string): Promise<void> {
  const { error } = await supabase
    .from('valoraciones')
    .delete()
    .eq('id', id)

  if (error) throw error
}
