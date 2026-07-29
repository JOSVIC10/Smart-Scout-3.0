import { supabase } from './client'
import type { AccionEtiquetada, Partido } from '@/types/database'

export async function obtenerPartidosDirecto(): Promise<Partido[]> {
  const { data, error } = await supabase
    .from('partidos')
    .select('*, club_local:clubes!partidos_club_local_id_fkey(*), club_visitante:clubes!partidos_club_visitante_id_fkey(*)')
    .order('fecha', { ascending: false })

  if (error) throw new Error(error.message)
  return data || []
}

export async function crearAccionDirecto(accion: Omit<AccionEtiquetada, 'id' | 'created_at'>): Promise<AccionEtiquetada> {
  const { data, error } = await supabase
    .from('acciones_etiquetadas')
    .insert(accion)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function eliminarAccionDirecto(id: string): Promise<void> {
  const { error } = await supabase
    .from('acciones_etiquetadas')
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)
}

export async function obtenerAccionesDirectoPorPartido(partidoId: string): Promise<AccionEtiquetada[]> {
  const { data, error } = await supabase
    .from('acciones_etiquetadas')
    .select('*, metrica_n1:metricas_nivel1(*), metrica_n2:metricas_nivel2(*), jugador:jugadores(*)')
    .eq('partido_id', partidoId)
    .order('minuto_video', { ascending: true })
    .order('segundo_video', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) throw new Error(error.message)
  return data || []
}
