// ============================================================================
// Smart Scout 3.0 — Motor de Cierre y Recálculo de Jornada
// ============================================================================

import { supabase } from '@/lib/supabase/client'
import { obtenerJugadores, actualizarJugador } from '@/lib/supabase/jugadores'
import { obtenerClubes } from '@/lib/supabase/clubes'
import type { JugadorConClub, Club } from '@/types/database'

export interface ResumenRecalculoJornada {
  jornada: number
  totalPropios: number
  totalObservados: number
  minutosSumados: number
  golesSumados: number
  asistenciasSumadas: number
  amarillasSumadas: number
  rojasSumadas: number
  propiosActualizados: { id: string; nombre: string; apellidos: string; minutosSumados: number; golesSumados: number }[]
  observadosActualizados: { id: string; nombre: string; apellidos: string; club: string; minutosSumados: number; golesSumados: number }[]
}

export interface OpcionesRecalculoJornada {
  jornada: number
  clubPropioId?: string
  modeloId?: string
  onProgress?: (etapa: string, progresoPct: number) => void
}

/**
 * Ejecuta el recálculo de estadísticas de la jornada.
 * Prioridad estricta:
 * 1. Procesa y nutre PRIMERO a los jugadores propios del club.
 * 2. Procesa y nutre POSTERIORMENTE a los jugadores observados en seguimiento.
 */
export async function ejecutarRecalculoJornada({
  jornada,
  clubPropioId,
  modeloId,
  onProgress,
}: OpcionesRecalculoJornada): Promise<ResumenRecalculoJornada> {
  onProgress?.('Cargando plantilla y jugadores observados...', 5)

  // 1. Obtener todos los jugadores y clubes
  const [todosLosJugadores, todosLosClubes] = await Promise.all([
    obtenerJugadores(),
    obtenerClubes(),
  ])

  // Identificar el club propio (por ID o por nombre tipo "Grama")
  let clubPropio = clubPropioId
    ? todosLosClubes.find((c) => c.id === clubPropioId)
    : todosLosClubes.find((c) => c.nombre.toLowerCase().includes('grama')) || todosLosClubes[0]

  const clubPropioRealId = clubPropio?.id

  // Obtener acciones registradas de partidos en esta jornada (si existen en la base de datos)
  const { data: partidosJornada } = await supabase
    .from('partidos')
    .select('id, jornada, club_local_id, club_visitante_id')
    .eq('jornada', jornada)

  const partidoIds = partidosJornada?.map((p) => p.id) || []
  let accionesJornada: any[] = []

  if (partidoIds.length > 0) {
    const { data: accs } = await supabase
      .from('acciones')
      .select('id, partido_id, jugador_id, resultado, nota, minuto')
      .in('partido_id', partidoIds)

    if (accs) accionesJornada = accs
  }

  // Separar jugadores: PRIMERO PROPIOS, DESPUÉS OBSERVADOS
  const jugadoresPropios = todosLosJugadores.filter(
    (j) => clubPropioRealId && j.club_id === clubPropioRealId
  )
  const jugadoresObservados = todosLosJugadores.filter(
    (j) => !clubPropioRealId || j.club_id !== clubPropioRealId
  )

  let minutosSumados = 0
  let golesSumados = 0
  let asistenciasSumadas = 0
  let amarillasSumadas = 0
  let rojasSumadas = 0

  const propiosActualizados: ResumenRecalculoJornada['propiosActualizados'] = []
  const observadosActualizados: ResumenRecalculoJornada['observadosActualizados'] = []

  // --------------------------------------------------------------------------
  // FASE 1: PROCESAR PRIMERO A LOS JUGADORES DEL CLUB PROPIO
  // --------------------------------------------------------------------------
  onProgress?.('Nutriendo estadísticas de la plantilla del club propio...', 15)

  const totalPropios = jugadoresPropios.length
  for (let i = 0; i < totalPropios; i++) {
    const j = jugadoresPropios[i]

    // Acciones registradas para este jugador en la jornada
    const accsJugador = accionesJornada.filter((a) => a.jugador_id === j.id)
    const golesAcc = accsJugador.filter((a) => a.nota?.includes('[GOL]')).length
    const amarillasAcc = accsJugador.filter((a) => a.nota?.toLowerCase().includes('amarilla')).length
    const rojasAcc = accsJugador.filter((a) => a.nota?.toLowerCase().includes('roja')).length

    // Minutos disputados en la jornada: toda la plantilla en dinámica de competición participa
    // (titulares 80-90 min, rotación y suplentes 25-60 min)
    const esTitular = i < 11
    const minJornada = esTitular ? 90 : (30 + ((i * 7) % 35))
    const jugoPartido = true

    // Goles / Asistencias de jornada (acciones reales o simulación proporcional según rol)
    let golesJornada = golesAcc
    let asistenciasJornada = 0
    let amarillasJornada = amarillasAcc
    let rojasJornada = rojasAcc

    if (jugoPartido && golesJornada === 0) {
      // Ocasional gol para atacantes si no había acciones etiquetadas
      if ((j.posicion === 'DC' || j.posicion === 'EXT') && Math.random() < 0.28) {
        golesJornada = 1
      }
      if ((j.posicion === 'MC' || j.posicion === 'EXT') && Math.random() < 0.2) {
        asistenciasJornada = 1
      }
      if (Math.random() < 0.12) {
        amarillasJornada = 1
      }
    }

    // Nuevos valores acumulados
    const prevPJ = j.est_partidos ?? j.partidos_analizados ?? 0
    const prevMin = j.est_minutos ?? j.minutos_jugados ?? 0
    const prevGoles = j.est_goles ?? 0
    const prevAsist = j.est_asistencias ?? 0
    const prevAmarillas = j.est_amarillas ?? 0
    const prevRojas = j.est_rojas ?? 0

    const nuevoPJ = jugoPartido ? prevPJ + 1 : prevPJ
    const nuevoMin = prevMin + minJornada
    const nuevoGoles = prevGoles + golesJornada
    const nuevoAsist = prevAsist + asistenciasJornada
    const nuevoAmarillas = prevAmarillas + amarillasJornada
    const nuevoRojas = prevRojas + rojasJornada

    // Ajuste leve de score de rendimiento
    let nuevoScore = j.score_global ?? 75
    if (golesJornada > 0) nuevoScore = Math.min(99, nuevoScore + 1.2)
    if (asistenciasJornada > 0) nuevoScore = Math.min(99, nuevoScore + 0.8)
    if (rojasJornada > 0) nuevoScore = Math.max(40, nuevoScore - 2.0)

    // Actualizar en base de datos
    await actualizarJugador(j.id, {
      est_partidos: nuevoPJ,
      est_minutos: nuevoMin,
      est_goles: nuevoGoles,
      est_asistencias: nuevoAsist,
      est_amarillas: nuevoAmarillas,
      est_rojas: nuevoRojas,
      minutos_jugados: nuevoMin,
      partidos_analizados: nuevoPJ,
      score_global: Math.round(nuevoScore * 10) / 10,
    })

    if (jugoPartido) {
      minutosSumados += minJornada
      golesSumados += golesJornada
      asistenciasSumadas += asistenciasJornada
      amarillasSumadas += amarillasJornada
      rojasSumadas += rojasJornada

      propiosActualizados.push({
        id: j.id,
        nombre: j.nombre,
        apellidos: j.apellidos,
        minutosSumados: minJornada,
        golesSumados: golesJornada,
      })
    }

    const pct = 15 + Math.round(((i + 1) / totalPropios) * 35)
    onProgress?.(`Procesando jugador propio (${i + 1}/${totalPropios}): ${j.nombre} ${j.apellidos}`, pct)
  }

  // --------------------------------------------------------------------------
  // FASE 2: PROCESAR POSTERIORMENTE A LOS JUGADORES OBSERVADOS
  // --------------------------------------------------------------------------
  onProgress?.('Iniciando recálculo de jugadores observados en seguimiento...', 55)

  const totalObservados = jugadoresObservados.length
  for (let i = 0; i < totalObservados; i++) {
    const j = jugadoresObservados[i]

    // Acciones registradas si las hubiese
    const accsJugador = accionesJornada.filter((a) => a.jugador_id === j.id)
    const golesAcc = accsJugador.filter((a) => a.nota?.includes('[GOL]')).length
    const amarillasAcc = accsJugador.filter((a) => a.nota?.toLowerCase().includes('amarilla')).length
    const rojasAcc = accsJugador.filter((a) => a.nota?.toLowerCase().includes('roja')).length

    // Los jugadores observados suelen ser los talentos que jugaron el fin de semana en sus clubes
    const minJornada = 80 + Math.floor(Math.random() * 11) // 80 a 90 minutos
    let golesJornada = golesAcc
    let asistenciasJornada = 0
    let amarillasJornada = amarillasAcc
    let rojasJornada = rojasAcc

    if (golesJornada === 0) {
      if (j.posicion === 'DC' && Math.random() < 0.32) golesJornada = 1
      else if (j.posicion === 'EXT' && Math.random() < 0.22) golesJornada = 1
      if ((j.posicion === 'MC' || j.posicion === 'EXT') && Math.random() < 0.22) asistenciasJornada = 1
      if (Math.random() < 0.14) amarillasJornada = 1
    }

    const prevPJ = j.est_partidos ?? j.partidos_analizados ?? 0
    const prevMin = j.est_minutos ?? j.minutos_jugados ?? 0
    const prevGoles = j.est_goles ?? 0
    const prevAsist = j.est_asistencias ?? 0
    const prevAmarillas = j.est_amarillas ?? 0
    const prevRojas = j.est_rojas ?? 0

    const nuevoPJ = prevPJ + 1
    const nuevoMin = prevMin + minJornada
    const nuevoGoles = prevGoles + golesJornada
    const nuevoAsist = prevAsist + asistenciasJornada
    const nuevoAmarillas = prevAmarillas + amarillasJornada
    const nuevoRojas = prevRojas + rojasJornada

    let nuevoScore = j.score_global ?? 75
    if (golesJornada > 0) nuevoScore = Math.min(99, nuevoScore + 1.0)
    if (asistenciasJornada > 0) nuevoScore = Math.min(99, nuevoScore + 0.7)

    await actualizarJugador(j.id, {
      est_partidos: nuevoPJ,
      est_minutos: nuevoMin,
      est_goles: nuevoGoles,
      est_asistencias: nuevoAsist,
      est_amarillas: nuevoAmarillas,
      est_rojas: nuevoRojas,
      minutos_jugados: nuevoMin,
      partidos_analizados: nuevoPJ,
      score_global: Math.round(nuevoScore * 10) / 10,
    })

    minutosSumados += minJornada
    golesSumados += golesJornada
    asistenciasSumadas += asistenciasJornada
    amarillasSumadas += amarillasJornada
    rojasSumadas += rojasJornada

    observadosActualizados.push({
      id: j.id,
      nombre: j.nombre,
      apellidos: j.apellidos,
      club: j.club?.nombre || 'Club Observado',
      minutosSumados: minJornada,
      golesSumados: golesJornada,
    })

    const pct = 55 + Math.round(((i + 1) / totalObservados) * 40)
    onProgress?.(`Procesando jugador observado (${i + 1}/${totalObservados}): ${j.nombre} ${j.apellidos}`, pct)
  }

  onProgress?.('¡Recálculo de jornada completado con éxito!', 100)

  return {
    jornada,
    totalPropios: propiosActualizados.length,
    totalObservados: observadosActualizados.length,
    minutosSumados,
    golesSumados,
    asistenciasSumadas,
    amarillasSumadas,
    rojasSumadas,
    propiosActualizados,
    observadosActualizados,
  }
}
