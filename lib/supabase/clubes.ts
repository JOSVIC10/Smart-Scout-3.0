// ============================================================================
// Smart Scout 3.0 — Servicio Supabase: Clubes
// ============================================================================

import { supabase } from './client'
import type { Club } from '@/types/database'

export async function obtenerClubes(): Promise<Club[]> {
  const { data, error } = await supabase
    .from('clubes')
    .select('*')
    .order('nombre')

  if (error) throw error
  return (data as Club[]) ?? []
}

export async function obtenerClubPorId(id: string): Promise<Club | null> {
  const { data, error } = await supabase
    .from('clubes')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }
  return data as Club
}

export async function crearClub(club: Omit<Club, 'id' | 'created_at'>): Promise<Club> {
  const { data, error } = await supabase
    .from('clubes')
    .insert(club)
    .select()
    .single()

  if (error) throw error
  return data as Club
}
