// ============================================================================
// Smart Scout 3.0 — Servicio Supabase: Partidos y Vídeos
// ============================================================================

import { supabase } from './client'
import type { Partido, PartidoConClubes, Video } from '@/types/database'

export async function obtenerPartidos(): Promise<PartidoConClubes[]> {
  const { data, error } = await supabase
    .from('partidos')
    .select(`
      *,
      club_local:clubes!partidos_club_local_id_fkey(*),
      club_visitante:clubes!partidos_club_visitante_id_fkey(*)
    `)
    .order('fecha', { ascending: false })

  if (error) throw error
  return (data as PartidoConClubes[]) ?? []
}

export async function obtenerPartidoPorId(id: string): Promise<PartidoConClubes | null> {
  const { data, error } = await supabase
    .from('partidos')
    .select(`
      *,
      club_local:clubes!partidos_club_local_id_fkey(*),
      club_visitante:clubes!partidos_club_visitante_id_fkey(*)
    `)
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }
  return data as PartidoConClubes
}

export async function contarPartidos(): Promise<number> {
  const { count, error } = await supabase
    .from('partidos')
    .select('*', { count: 'exact', head: true })

  if (error) throw error
  return count ?? 0
}

// Vídeos -----------------------------------------------

export async function obtenerVideos(): Promise<Video[]> {
  const { data, error } = await supabase
    .from('videos')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data as Video[]) ?? []
}

export async function obtenerVideosPorPartido(partidoId: string): Promise<Video[]> {
  const { data, error } = await supabase
    .from('videos')
    .select('*')
    .eq('partido_id', partidoId)

  if (error) throw error
  return (data as Video[]) ?? []
}

export async function obtenerVideoPorId(id: string): Promise<Video | null> {
  const { data, error } = await supabase
    .from('videos')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }
  return data as Video
}
