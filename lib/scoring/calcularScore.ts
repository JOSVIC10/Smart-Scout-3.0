// ============================================================================
// Smart Scout 3.0 — Motor de Scoring v2 (Fase 5)
// ============================================================================
// calcularScore(jugadorId, modeloId):
//   1. Recupera acciones etiquetadas reales del jugador desde Supabase
//   2. Calcula valor real por métrica N2: (efectividad × frecuencia_norm_por_90min)
//   3. Calcula percentil de ese valor respecto a todos los jugadores
//      de la misma posición en el sistema
//   4. Pondera por los pesos Rank-Sum del modelo de juego activo
//   5. Devuelve score 0–100 y actualiza jugador + jugador_metricas_n2 en Supabase

import { supabase } from '@/lib/supabase/client'
import { ZONA_FACTOR, PESO_POR_RANGO, METRICAS_N2_POR_POSICION } from '@/lib/constants'
import type { Posicion, ZonaCampo, ResultadoAccion } from '@/types/database'

// ---------------------------------------------------------------------------
// Tipos de resultado
// ---------------------------------------------------------------------------

export interface DetalleMetrica {
  metrica_n2_id: string
  codigoMetrica: string
  nombreMetrica: string
  /** Valor crudo calculado: efectividad × frecuencia_90 */
  valorReal: number
  /** Percentil (0–99) respecto al resto de jugadores de la misma posición */
  percentil: number
  /** Peso Rank-Sum del modelo de juego */
  peso: number
  /** Contribución al score final: percentil × peso */
  contribucion: number
  /** Nº acciones de esta métrica usadas */
  muestra: number
}

export interface ResultadoScore {
  /** Score de compatibilidad (0–100, redondeado a 1 decimal) */
  score: number
  /** Desglose por métrica N2 */
  desglose: DetalleMetrica[]
  /** Métricas con mayor contribución */
  fortalezas: string[]
  /** Métricas con menor contribución */
  debilidades: string[]
  /** Nº partidos analizados del jugador */
  partidos_analizados: number
  /** Fiabilidad del score */
  fiabilidad: 'alta' | 'media' | 'baja'
}

// ---------------------------------------------------------------------------
// Cálculo del Valor de Acción
// ---------------------------------------------------------------------------

/**
 * Calcula el valor de una acción individual (MVP Auto-Clips).
 * @param resultado - Efectiva o No Efectiva
 * @param posicion - Posición del jugador
 * @param codigoMetricaN2 - Código de la métrica N2 de la acción
 * @param zona - Zona del campo donde ocurrió la acción
 */
export function calcularValorAccion(
  resultado: ResultadoAccion,
  posicion: Posicion,
  codigoMetricaN2: string,
  zona: ZonaCampo | null
): number {
  const resultadoBinario = resultado === 'efectiva' ? 1 : 0
  
  const metricasPosicion = METRICAS_N2_POR_POSICION[posicion] || []
  const idx = metricasPosicion.findIndex((m) => m.codigo === codigoMetricaN2)
  
  // Si no está, asumimos el menor peso
  const peso = (idx >= 0 && idx < PESO_POR_RANGO.length)
    ? PESO_POR_RANGO[idx]
    : PESO_POR_RANGO[PESO_POR_RANGO.length - 1]
    
  const factorZona = zona ? (ZONA_FACTOR[zona] ?? 1.0) : 1.0
  
  const valor = resultadoBinario * peso * factorZona
  return Math.round(valor * 1000) / 1000
}

// ---------------------------------------------------------------------------
// Función principal: calcularScore
// ---------------------------------------------------------------------------

/**
 * Calcula el score de compatibilidad de un jugador con un modelo de juego.
 * Usa datos reales de acciones etiquetadas en Supabase.
 * NO usa datos simulados.
 *
 * @param jugadorId - UUID del jugador
 * @param modeloId  - UUID del modelo de juego
 * @returns ResultadoScore con score 0–100, desglose y fiabilidad
 */
export async function calcularScore(
  jugadorId: string,
  modeloId: string
): Promise<ResultadoScore> {

  // ── 1. Obtener datos del jugador (posición + minutos jugados + partidos) ──
  const { data: jugador, error: jErr } = await supabase
    .from('jugadores')
    .select('posicion, minutos_jugados, partidos_analizados')
    .eq('id', jugadorId)
    .single()

  if (jErr || !jugador) throw new Error(`Jugador no encontrado: ${jugadorId}`)

  const posicion = jugador.posicion as Posicion
  const minutosJugados: number = jugador.minutos_jugados ?? 0
  const partidosAnalizados: number = jugador.partidos_analizados ?? 0

  // ── 2. Obtener ponderaciones del modelo para esta posición ──
  const { data: ponderaciones, error: pErr } = await supabase
    .from('ponderaciones_modelo')
    .select('metrica_n2_id, rango, peso')
    .eq('modelo_id', modeloId)
    .eq('posicion', posicion)
    .order('rango')

  if (pErr) throw pErr

  // Si no hay ponderaciones personalizadas, usar el orden por defecto de metricas_posicion
  // Esto garantiza que el auto-recálculo siempre produce un score válido.
  let ponderacionesActivas: { metrica_n2_id: string; rango: number; peso: number }[] = ponderaciones ?? []

  if (ponderacionesActivas.length === 0) {
    const { data: defaultMets } = await supabase
      .from('metricas_posicion')
      .select('metrica_n2_id, orden_default')
      .eq('posicion', posicion)
      .order('orden_default')

    if (!defaultMets || defaultMets.length === 0) {
      // Sin métricas ni ponderaciones para esta posición: score indefinido
      return {
        score: 0,
        desglose: [],
        fortalezas: [],
        debilidades: [],
        partidos_analizados: partidosAnalizados,
        fiabilidad: fiabilidad(partidosAnalizados),
      }
    }

    // Generar pesos Rank-Sum desde el orden por defecto
    const n = defaultMets.length
    const denom = (n * (n + 1)) / 2
    ponderacionesActivas = (defaultMets as { metrica_n2_id: string; orden_default: number }[]).map((m, idx) => ({
      metrica_n2_id: m.metrica_n2_id,
      rango: idx + 1,
      peso: Math.round(((n - idx) / denom) * 10000) / 10000,
    }))
  }

  const metricaIds = ponderacionesActivas.map((p) => p.metrica_n2_id)

  // ── 3. Obtener acciones etiquetadas del jugador agrupadas por métrica N2 ──
  const { data: acciones, error: aErr } = await supabase
    .from('acciones_etiquetadas')
    .select('metrica_n2_id, resultado, valor_accion')
    .eq('jugador_id', jugadorId)
    .in('metrica_n2_id', metricaIds)

  if (aErr) throw aErr

  // If there are no actions for this player, it's likely a scouted player with seeded metrics.
  // Instead of recalculating and wiping them out, we use their existing metrics.
  if (!acciones || acciones.length === 0) {
    const { data: metricasExistentes } = await supabase
      .from('jugador_metricas_n2')
      .select('metrica_n2_id, percentil, muestra, metrica_n2:metricas_nivel2(codigo, nombre)')
      .eq('jugador_id', jugadorId)
      .in('metrica_n2_id', metricaIds)

    if (metricasExistentes && metricasExistentes.length > 0) {
      let scoreFinal = 0
      const desglose: DetalleMetrica[] = []
      
      for (const m of metricasExistentes) {
        const pesoInfo = ponderacionesActivas.find(p => p.metrica_n2_id === m.metrica_n2_id)
        const peso = pesoInfo?.peso ?? 0
        const percentil = m.percentil ?? 0
        const contribucion = percentil * peso

        scoreFinal += contribucion
        desglose.push({
          metrica_n2_id: m.metrica_n2_id,
          codigoMetrica: (m.metrica_n2 as any).codigo,
          nombreMetrica: (m.metrica_n2 as any).nombre,
          valorReal: percentil / 100, // mock
          percentil: percentil,
          peso: peso,
          contribucion: contribucion,
          muestra: m.muestra
        })
      }

      const scoreRedondeado = Math.round(scoreFinal * 10) / 10
      await supabase.from('jugadores').update({ score_global: scoreRedondeado }).eq('id', jugadorId)
      
      return {
        score: scoreRedondeado,
        desglose: desglose.sort((a, b) => b.contribucion - a.contribucion),
        fortalezas: desglose.filter(d => d.percentil > 75).map(d => d.nombreMetrica).slice(0, 3),
        debilidades: desglose.filter(d => d.percentil < 40).map(d => d.nombreMetrica).slice(0, 3),
        partidos_analizados: partidosAnalizados,
        fiabilidad: fiabilidad(partidosAnalizados)
      }
    }
  }

  // Agrupar por metrica_n2_id y sumar valor de acciones como bonus
  let bonusValorAccion = 0
  const accionesPorMetrica = new Map<string, { total: number; efectivas: number }>()
  
  for (const acc of (acciones ?? []) as { metrica_n2_id: string; resultado: string; valor_accion: number | null }[]) {
    if (acc.valor_accion) bonusValorAccion += acc.valor_accion
    
    if (!acc.metrica_n2_id) continue
    const entry = accionesPorMetrica.get(acc.metrica_n2_id) ?? { total: 0, efectivas: 0 }
    entry.total++
    if (acc.resultado === 'efectiva') entry.efectivas++
    accionesPorMetrica.set(acc.metrica_n2_id, entry)
  }

  // ── 4. Calcular valor real por métrica: efectividad × frecuencia_por_90 ──
  const valoresJugador = new Map<string, number>()
  const muestrasJugador = new Map<string, number>()

  for (const metId of metricaIds) {
    const stat = accionesPorMetrica.get(metId)
    if (!stat || stat.total === 0) {
      valoresJugador.set(metId, 0)
      muestrasJugador.set(metId, 0)
      continue
    }
    const efectividad = stat.efectivas / stat.total        // 0–1
    const frecuenciaPor90 = minutosJugados > 0
      ? (stat.total / minutosJugados) * 90
      : 0
    // Valor combinado: [0, ∞) — típicamente 0–15
    valoresJugador.set(metId, efectividad * frecuenciaPor90)
    muestrasJugador.set(metId, stat.total)
  }

  // ── 5. Obtener valores de TODOS los jugadores de la misma posición ──
  //    para calcular percentiles relativos
  const { data: todosJugadores, error: tErr } = await supabase
    .from('jugadores')
    .select('id, minutos_jugados')
    .eq('posicion', posicion)

  if (tErr) throw tErr

  const jugadorIds = (todosJugadores ?? []).map((j: { id: string }) => j.id)
  const minutosMap = new Map<string, number>(
    (todosJugadores ?? []).map((j: { id: string; minutos_jugados: number }) => [j.id, j.minutos_jugados ?? 0])
  )

  // Obtener acciones de todos los jugadores de la posición para estas métricas
  // (solo si hay más de 1 jugador)
  const percentilPorMetrica = new Map<string, number>()

  if (jugadorIds.length <= 1) {
    // Solo hay un jugador en esta posición → percentil 50 por defecto
    for (const metId of metricaIds) {
      percentilPorMetrica.set(metId, valoresJugador.get(metId)! > 0 ? 50 : 0)
    }
  } else {
    // Obtener acciones de todos los jugadores de la posición
    const { data: todasAcciones } = await supabase
      .from('acciones_etiquetadas')
      .select('jugador_id, metrica_n2_id, resultado')
      .in('jugador_id', jugadorIds)
      .in('metrica_n2_id', metricaIds)

    // Calcular valor por (jugador, métrica)
    const valoresPorJugadorMetrica = new Map<string, Map<string, number>>()
    for (const acc of (todasAcciones ?? []) as { jugador_id: string; metrica_n2_id: string; resultado: string }[]) {
      if (!acc.metrica_n2_id) continue
      if (!valoresPorJugadorMetrica.has(acc.jugador_id)) {
        valoresPorJugadorMetrica.set(acc.jugador_id, new Map())
      }
      const jMap = valoresPorJugadorMetrica.get(acc.jugador_id)!
      const stat = jMap.get(acc.metrica_n2_id) ?? 0
      jMap.set(acc.metrica_n2_id, stat) // actualizaremos abajo
    }

    // Re-calcular agrupando correctamente
    const accionesPorJugadorMetrica = new Map<string, Map<string, { total: number; efectivas: number }>>()
    for (const acc of (todasAcciones ?? []) as { jugador_id: string; metrica_n2_id: string; resultado: string }[]) {
      if (!acc.metrica_n2_id) continue
      if (!accionesPorJugadorMetrica.has(acc.jugador_id)) {
        accionesPorJugadorMetrica.set(acc.jugador_id, new Map())
      }
      const jMap = accionesPorJugadorMetrica.get(acc.jugador_id)!
      const entry = jMap.get(acc.metrica_n2_id) ?? { total: 0, efectivas: 0 }
      entry.total++
      if (acc.resultado === 'efectiva') entry.efectivas++
      jMap.set(acc.metrica_n2_id, entry)
    }

    // Para cada métrica, calcular el valor de cada jugador y determinar percentil
    for (const metId of metricaIds) {
      const valores: number[] = []
      for (const jId of jugadorIds) {
        const jMins = minutosMap.get(jId) ?? 0
        const jStat = accionesPorJugadorMetrica.get(jId)?.get(metId)
        if (!jStat || jStat.total === 0 || jMins === 0) {
          valores.push(0)
          continue
        }
        const ef = jStat.efectivas / jStat.total
        const freq90 = (jStat.total / jMins) * 90
        valores.push(ef * freq90)
      }

      const valorJugador = valoresJugador.get(metId) ?? 0
      const percentil = calcularPercentilEnPoblacion(valorJugador, valores)
      percentilPorMetrica.set(metId, percentil)
    }
  }

  // ── 6. Obtener nombres de las métricas ──
  const { data: metricasInfo } = await supabase
    .from('metricas_nivel2')
    .select('id, codigo, nombre')
    .in('id', metricaIds)

  const metricaNombreMap = new Map<string, { codigo: string; nombre: string }>(
    (metricasInfo ?? []).map((m: { id: string; codigo: string; nombre: string }) => [m.id, { codigo: m.codigo, nombre: m.nombre }])
  )

  // ── 7. Construir desglose y calcular score ──
  const desglose: DetalleMetrica[] = []
  let scoreFinal = 0

  for (const pond of ponderacionesActivas) {
    const metId = pond.metrica_n2_id
    const percentil = percentilPorMetrica.get(metId) ?? 0
    const contribucion = percentil * pond.peso
    scoreFinal += contribucion

    desglose.push({
      metrica_n2_id: metId,
      codigoMetrica: metricaNombreMap.get(metId)?.codigo ?? metId,
      nombreMetrica: metricaNombreMap.get(metId)?.nombre ?? metId,
      valorReal: Math.round((valoresJugador.get(metId) ?? 0) * 1000) / 1000,
      percentil: Math.round(percentil),
      peso: pond.peso,
      contribucion: Math.round(contribucion * 100) / 100,
      muestra: muestrasJugador.get(metId) ?? 0,
    })
  }

  // Añadir el bonus de valor_accion
  scoreFinal += bonusValorAccion

  // Ordenar por contribución para fortalezas y debilidades
  const ordenado = [...desglose].sort((a, b) => b.contribucion - a.contribucion)
  const fortalezas = ordenado.slice(0, 3).map((d) => d.nombreMetrica)
  const debilidades = ordenado.slice(-2).map((d) => d.nombreMetrica)

  const scoreRedondeado = Math.min(100, Math.max(0, Math.round(scoreFinal * 10) / 10))

  // ── 8. Persistir en Supabase ──
  await persistirResultados(jugadorId, scoreRedondeado, desglose, percentilPorMetrica, muestrasJugador, metricaIds, metricaNombreMap)

  return {
    score: scoreRedondeado,
    desglose,
    fortalezas,
    debilidades,
    partidos_analizados: partidosAnalizados,
    fiabilidad: fiabilidad(partidosAnalizados),
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Calcula el percentil de un valor en una distribución de valores */
function calcularPercentilEnPoblacion(valor: number, poblacion: number[]): number {
  if (poblacion.length === 0) return 0
  const menores = poblacion.filter((v) => v < valor).length
  const iguales = poblacion.filter((v) => v === valor).length
  // Fórmula: (menores + 0.5 × iguales) / n × 100
  const percentil = ((menores + 0.5 * iguales) / poblacion.length) * 100
  return Math.min(99, Math.max(0, Math.round(percentil)))
}

/** Determina la fiabilidad del score según nº de partidos analizados */
export function fiabilidad(partidos: number): 'alta' | 'media' | 'baja' {
  if (partidos > 5) return 'alta'
  if (partidos >= 2) return 'media'
  return 'baja'
}

/** Persiste el score_global y las métricas N2 del jugador en Supabase */
async function persistirResultados(
  jugadorId: string,
  score: number,
  desglose: DetalleMetrica[],
  percentiles: Map<string, number>,
  muestras: Map<string, number>,
  metricaIds: string[],
  metricaNombreMap: Map<string, { codigo: string; nombre: string }>
): Promise<void> {
  // Actualizar score_global del jugador
  await supabase
    .from('jugadores')
    .update({ score_global: score, updated_at: new Date().toISOString() })
    .eq('id', jugadorId)

  // Upsert en jugador_metricas_n2 para cada métrica calculada
  if (desglose.length > 0) {
    const upsertRows = desglose.map((d) => ({
      jugador_id: jugadorId,
      metrica_n2_id: d.metrica_n2_id,
      valor: d.valorReal,
      percentil: d.percentil,
      muestra: d.muestra,
      updated_at: new Date().toISOString(),
    }))

    await supabase
      .from('jugador_metricas_n2')
      .upsert(upsertRows, { onConflict: 'jugador_id,metrica_n2_id' })
  }
}

// ---------------------------------------------------------------------------
// Versión simplificada para listados (sin persistencia)
// ---------------------------------------------------------------------------

/**
 * Calcula el score de forma simplificada cuando ya tenemos los percentiles
 * y los pesos indexados por metrica_n2_id. Útil para comparadores y listas.
 */
export function calcularScoreSimple(
  percentiles: Map<string, number>,
  pesos: Map<string, number>
): number {
  let score = 0
  let totalPeso = 0

  for (const [metricaId, peso] of pesos) {
    const percentil = percentiles.get(metricaId) ?? 0
    score += percentil * peso
    totalPeso += peso
  }

  // Normalizar si los pesos no suman exactamente 1
  if (totalPeso > 0 && Math.abs(totalPeso - 1) > 0.01) {
    score = score / totalPeso
  }

  return Math.round(score * 10) / 10
}

// ---------------------------------------------------------------------------
// Score preview (sin persistencia) — para el configurador de modelos
// ---------------------------------------------------------------------------

/**
 * Calcula el score de un jugador con un modelo en memoria (sin guardar).
 * Usado en la vista previa del configurador de modelos.
 * Acepta ponderaciones en memoria (no necesita modelo guardado en Supabase).
 */
export async function calcularScorePreview(
  jugadorId: string,
  posicion: Posicion,
  ponderacionesEnMemoria: { metrica_n2_id: string; rango: number; peso: number }[]
): Promise<number> {
  if (ponderacionesEnMemoria.length === 0) return 0

  const metricaIds = ponderacionesEnMemoria.map((p) => p.metrica_n2_id)

  // Obtener datos del jugador
  const { data: jugador } = await supabase
    .from('jugadores')
    .select('minutos_jugados')
    .eq('id', jugadorId)
    .single()

  const minutosJugados: number = jugador?.minutos_jugados ?? 0

  // Obtener acciones del jugador
  const { data: acciones } = await supabase
    .from('acciones_etiquetadas')
    .select('metrica_n2_id, resultado')
    .eq('jugador_id', jugadorId)
    .in('metrica_n2_id', metricaIds)

  const accionesPorMetrica = new Map<string, { total: number; efectivas: number }>()
  for (const acc of (acciones ?? []) as { metrica_n2_id: string; resultado: string }[]) {
    if (!acc.metrica_n2_id) continue
    const entry = accionesPorMetrica.get(acc.metrica_n2_id) ?? { total: 0, efectivas: 0 }
    entry.total++
    if (acc.resultado === 'efectiva') entry.efectivas++
    accionesPorMetrica.set(acc.metrica_n2_id, entry)
  }

  const valoresJugador = new Map<string, number>()
  for (const metId of metricaIds) {
    const stat = accionesPorMetrica.get(metId)
    if (!stat || stat.total === 0 || minutosJugados === 0) {
      valoresJugador.set(metId, 0)
      continue
    }
    const ef = stat.efectivas / stat.total
    const freq90 = (stat.total / minutosJugados) * 90
    valoresJugador.set(metId, ef * freq90)
  }

  // Percentiles simplificados (vs todos jugadores de la posición)
  const { data: todosJugadores } = await supabase
    .from('jugadores')
    .select('id, minutos_jugados')
    .eq('posicion', posicion)

  const jugadorIds = (todosJugadores ?? []).map((j: { id: string }) => j.id)
  const minutosMap = new Map<string, number>(
    (todosJugadores ?? []).map((j: { id: string; minutos_jugados: number }) => [j.id, j.minutos_jugados ?? 0])
  )

  let score = 0

  if (jugadorIds.length <= 1) {
    // Solo 1 jugador → percentil 50 si tiene datos
    for (const pond of ponderacionesEnMemoria) {
      const p = (valoresJugador.get(pond.metrica_n2_id) ?? 0) > 0 ? 50 : 0
      score += p * pond.peso
    }
  } else {
    const { data: todasAcciones } = await supabase
      .from('acciones_etiquetadas')
      .select('jugador_id, metrica_n2_id, resultado')
      .in('jugador_id', jugadorIds)
      .in('metrica_n2_id', metricaIds)

    const accionesPorJugadorMetrica = new Map<string, Map<string, { total: number; efectivas: number }>>()
    for (const acc of (todasAcciones ?? []) as { jugador_id: string; metrica_n2_id: string; resultado: string }[]) {
      if (!acc.metrica_n2_id) continue
      if (!accionesPorJugadorMetrica.has(acc.jugador_id)) {
        accionesPorJugadorMetrica.set(acc.jugador_id, new Map())
      }
      const jMap = accionesPorJugadorMetrica.get(acc.jugador_id)!
      const entry = jMap.get(acc.metrica_n2_id) ?? { total: 0, efectivas: 0 }
      entry.total++
      if (acc.resultado === 'efectiva') entry.efectivas++
      jMap.set(acc.metrica_n2_id, entry)
    }

    for (const pond of ponderacionesEnMemoria) {
      const metId = pond.metrica_n2_id
      const valores: number[] = []
      for (const jId of jugadorIds) {
        const jMins = minutosMap.get(jId) ?? 0
        const jStat = accionesPorJugadorMetrica.get(jId)?.get(metId)
        if (!jStat || jStat.total === 0 || jMins === 0) { valores.push(0); continue }
        const ef = jStat.efectivas / jStat.total
        const freq90 = (jStat.total / jMins) * 90
        valores.push(ef * freq90)
      }
      const p = calcularPercentilEnPoblacion(valoresJugador.get(metId) ?? 0, valores)
      score += p * pond.peso
    }
  }

  return Math.min(100, Math.max(0, Math.round(score * 10) / 10))
}
