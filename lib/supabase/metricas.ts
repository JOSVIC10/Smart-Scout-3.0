// ============================================================================
// Smart Scout 3.0 — Servicio Supabase: Métricas
// ============================================================================

import { supabase } from './client'
import type { 
  MetricaNivel1, MetricaNivel2, JugadorMetricaN2, MetricaN2Enriquecida,
  MetricaPosicion, Posicion 
} from '@/types/database'

/**
 * Obtiene todo el catálogo de métricas N1.
 */
export async function obtenerMetricasN1(): Promise<MetricaNivel1[]> {
  const { data, error } = await supabase
    .from('metricas_nivel1')
    .select('*')
    .order('grupo')

  if (error) throw error
  return (data as MetricaNivel1[]) ?? []
}

/**
 * Obtiene las métricas N1 aplicables a una posición.
 */
export async function obtenerMetricasN1PorPosicion(posicion: Posicion): Promise<MetricaNivel1[]> {
  const { data, error } = await supabase
    .from('metricas_nivel1')
    .select('*')
    .order('grupo')

  if (error) throw error

  // Filtrar: incluir si posiciones es NULL (todas) o contiene la posición
  return ((data as MetricaNivel1[]) ?? []).filter(m => 
    m.posiciones === null || m.posiciones.includes(posicion)
  )
}

/**
 * Obtiene todo el catálogo de métricas N2.
 */
export async function obtenerMetricasN2(): Promise<MetricaNivel2[]> {
  const { data, error } = await supabase
    .from('metricas_nivel2')
    .select('*')
    .order('grupo')

  if (error) throw error
  return (data as MetricaNivel2[]) ?? []
}

/**
 * Obtiene las métricas N2 asignadas a una posición, con su orden de importancia.
 */
export async function obtenerMetricasN2PorPosicion(posicion: Posicion): Promise<(MetricaPosicion & { metrica_n2: MetricaNivel2 })[]> {
  const { data, error } = await supabase
    .from('metricas_posicion')
    .select(`
      *,
      metrica_n2:metricas_nivel2(*)
    `)
    .eq('posicion', posicion)
    .order('orden_default')

  if (error) throw error
  return data ?? []
}

/**
 * Obtiene las métricas N2 calculadas para un jugador, enriquecidas con datos del catálogo.
 */
export async function obtenerMetricasJugador(jugadorId: string): Promise<MetricaN2Enriquecida[]> {
  const { data, error } = await supabase
    .from('jugador_metricas_n2')
    .select(`
      *,
      metrica_n2:metricas_nivel2(*)
    `)
    .eq('jugador_id', jugadorId)

  if (error) throw error

  return ((data ?? []) as (JugadorMetricaN2 & { metrica_n2: MetricaNivel2 })[]).map(row => ({
    codigo: row.metrica_n2.codigo,
    nombre: row.metrica_n2.nombre,
    grupo: row.metrica_n2.grupo,
    valor: row.valor,
    percentil: row.percentil ?? 0,
    muestra: row.muestra,
  }))
}
