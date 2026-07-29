// ============================================================================
// Smart Scout 3.0 — Servicio Supabase: Modelos de Juego y Ponderaciones
// ============================================================================

import { supabase } from './client'
import type { ModeloJuego, PonderacionModelo, Posicion } from '@/types/database'

export async function obtenerModelos(): Promise<ModeloJuego[]> {
  const { data, error } = await supabase
    .from('modelos_juego')
    .select('*')
    .order('es_predefinido', { ascending: false })
    .order('nombre')

  if (error) throw error
  return (data as ModeloJuego[]) ?? []
}

export async function obtenerModeloPorId(id: string): Promise<ModeloJuego | null> {
  const { data, error } = await supabase
    .from('modelos_juego')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }
  return data as ModeloJuego
}

export async function crearModelo(
  modelo: Omit<ModeloJuego, 'id' | 'created_at' | 'updated_at'>
): Promise<ModeloJuego> {
  const { data, error } = await supabase
    .from('modelos_juego')
    .insert(modelo)
    .select()
    .single()

  if (error) throw error
  return data as ModeloJuego
}

export async function actualizarModelo(
  id: string,
  campos: Partial<Omit<ModeloJuego, 'id' | 'created_at' | 'updated_at'>>
): Promise<ModeloJuego> {
  const { data, error } = await supabase
    .from('modelos_juego')
    .update(campos)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as ModeloJuego
}

export async function eliminarModelo(id: string): Promise<void> {
  const { error } = await supabase
    .from('modelos_juego')
    .delete()
    .eq('id', id)

  if (error) throw error
}

/**
 * Obtiene las ponderaciones de un modelo de juego para una posición concreta.
 */
export async function obtenerPonderaciones(
  modeloId: string,
  posicion: Posicion
): Promise<PonderacionModelo[]> {
  const { data, error } = await supabase
    .from('ponderaciones_modelo')
    .select('*')
    .eq('modelo_id', modeloId)
    .eq('posicion', posicion)
    .order('rango')

  if (error) throw error
  return (data as PonderacionModelo[]) ?? []
}

/**
 * Obtiene TODAS las ponderaciones de un modelo (todas las posiciones).
 */
export async function obtenerTodasPonderaciones(
  modeloId: string
): Promise<PonderacionModelo[]> {
  const { data, error } = await supabase
    .from('ponderaciones_modelo')
    .select('*')
    .eq('modelo_id', modeloId)
    .order('posicion')
    .order('rango')

  if (error) throw error
  return (data as PonderacionModelo[]) ?? []
}

/**
 * Guarda las ponderaciones para un modelo + posición.
 * Elimina las anteriores y crea las nuevas (upsert completo).
 */
export async function guardarPonderaciones(
  modeloId: string,
  posicion: Posicion,
  ponderaciones: Omit<PonderacionModelo, 'id'>[]
): Promise<void> {
  // Eliminar anteriores
  const { error: deleteError } = await supabase
    .from('ponderaciones_modelo')
    .delete()
    .eq('modelo_id', modeloId)
    .eq('posicion', posicion)

  if (deleteError) throw deleteError

  // Insertar nuevas
  if (ponderaciones.length > 0) {
    const { error: insertError } = await supabase
      .from('ponderaciones_modelo')
      .insert(ponderaciones)

    if (insertError) throw insertError
  }
}
