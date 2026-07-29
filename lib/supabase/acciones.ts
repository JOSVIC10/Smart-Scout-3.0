// ============================================================================
// Smart Scout 3.0 — Servicio Supabase: Acciones Etiquetadas
// ============================================================================

import { supabase } from './client'
import type { AccionEtiquetada, AccionConMetrica } from '@/types/database'

/**
 * Obtiene todas las acciones etiquetadas de un vídeo, con datos de la métrica N1 y N2.
 */
export async function obtenerAccionesPorVideo(videoId: string): Promise<AccionConMetrica[]> {
  const { data, error } = await supabase
    .from('acciones_etiquetadas')
    .select(`
      *,
      metrica_n1:metricas_nivel1(*),
      metrica_n2:metricas_nivel2(*)
    `)
    .eq('video_id', videoId)
    .order('minuto_video')
    .order('segundo_video')

  if (error) throw new Error(`Error Supabase: ${error.message || JSON.stringify(error)}`)
  return (data as AccionConMetrica[]) ?? []
}

/**
 * Obtiene todas las acciones de un jugador (en todos los vídeos).
 * Útil para la ficha del jugador (lista de clips).
 * Ordena por valor de acción (las mejores arriba) y luego por fecha.
 */
export async function obtenerAccionesPorJugador(jugadorId: string): Promise<AccionConMetrica[]> {
  const { data, error } = await supabase
    .from('acciones_etiquetadas')
    .select(`
      *,
      video:videos(*),
      metrica_n1:metricas_nivel1(*),
      metrica_n2:metricas_nivel2(*)
    `)
    .eq('jugador_id', jugadorId)
    .order('valor_accion', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })

  if (error) throw new Error(`Error Supabase: ${error.message || JSON.stringify(error)}`)
  return (data as AccionConMetrica[]) ?? []
}

/**
 * Crea una nueva acción etiquetada.
 * Incluye metrica_n2_id para trazabilidad directa en Supabase.
 */
export async function crearAccion(
  accion: Omit<AccionEtiquetada, 'id' | 'created_at'>
): Promise<AccionEtiquetada> {
  const { data, error } = await supabase
    .from('acciones_etiquetadas')
    .insert(accion)
    .select()
    .single()

  if (error) throw new Error(`Error Supabase: ${error.message || JSON.stringify(error)}`)
  return data as AccionEtiquetada
}

/**
 * Elimina una acción etiquetada.
 */
export async function eliminarAccion(id: string): Promise<void> {
  const { error } = await supabase
    .from('acciones_etiquetadas')
    .delete()
    .eq('id', id)

  if (error) throw error
}

/**
 * Cuenta acciones por tipo para un jugador (para estadísticas).
 */
export async function contarAccionesPorJugador(jugadorId: string): Promise<number> {
  const { count, error } = await supabase
    .from('acciones_etiquetadas')
    .select('*', { count: 'exact', head: true })
    .eq('jugador_id', jugadorId)

  if (error) throw error
  return count ?? 0
}

// ---------------------------------------------------------------------------
// Estadísticas de rendimiento por métrica N2
// ---------------------------------------------------------------------------

export interface EstadisticaMetricaN2 {
  metrica_n2_id: string | null
  codigoMetrica: string
  nombreMetrica: string
  totalAcciones: number
  efectivas: number
  noEfectivas: number
  porcentajeEfectividad: number
}

/**
 * Calcula estadísticas de efectividad por métrica N2 para un jugador.
 * Agrupa las acciones etiquetadas por métrica N2 y calcula % de efectividad.
 * Usado en la ficha del jugador (pestaña Clips) y para el recálculo de score.
 */
export async function obtenerEstadisticasPorJugador(
  jugadorId: string
): Promise<EstadisticaMetricaN2[]> {
  const { data, error } = await supabase
    .from('acciones_etiquetadas')
    .select(`
      resultado,
      metrica_n2_id,
      metrica_n2:metricas_nivel2(codigo, nombre)
    `)
    .eq('jugador_id', jugadorId)
    .not('metrica_n2_id', 'is', null)

  if (error) throw error
  if (!data || data.length === 0) return []

  // Agrupar por metrica_n2_id
  const map = new Map<string, EstadisticaMetricaN2>()

  for (const row of data as any[]) {
    const key = row.metrica_n2_id as string
    if (!map.has(key)) {
      map.set(key, {
        metrica_n2_id: key,
        codigoMetrica: row.metrica_n2?.codigo ?? key,
        nombreMetrica: row.metrica_n2?.nombre ?? key,
        totalAcciones: 0,
        efectivas: 0,
        noEfectivas: 0,
        porcentajeEfectividad: 0,
      })
    }
    const stat = map.get(key)!
    stat.totalAcciones++
    if (row.resultado === 'efectiva') stat.efectivas++
    else stat.noEfectivas++
  }

  // Calcular porcentaje
  for (const stat of map.values()) {
    stat.porcentajeEfectividad =
      stat.totalAcciones > 0
        ? Math.round((stat.efectivas / stat.totalAcciones) * 100)
        : 0
  }

  return Array.from(map.values()).sort(
    (a, b) => b.totalAcciones - a.totalAcciones
  )
}
