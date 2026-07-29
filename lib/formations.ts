// ============================================================================
// Smart Scout 3.0 — Formaciones tácticas
// ============================================================================
// Define las coordenadas de cada slot para los sistemas de juego disponibles.
// x: 0 (izquierda) → 100 (derecha)
// y: 0 (portería rival) → 100 (nuestra portería)

import type { Posicion, PosicionDetallada, SlotTactico } from '@/types/database'

function crearSlot(
  id: string,
  posicion: Posicion,
  posicionDetallada: PosicionDetallada,
  x: number,
  y: number
): SlotTactico {
  return { id, posicion, posicion_detallada: posicionDetallada, x, y, jugador_id: null }
}

export const FORMACIONES: Record<string, SlotTactico[]> = {
  '4-3-3': [
    crearSlot('POR-1', 'POR', 'POR', 50, 92),
    crearSlot('LAT-I', 'LAT', 'LAT_IZQ', 12, 72),
    crearSlot('DFC-I', 'DFC', 'DFC_IZQ', 35, 77),
    crearSlot('DFC-D', 'DFC', 'DFC_DER', 65, 77),
    crearSlot('LAT-D', 'LAT', 'LAT_DER', 88, 72),
    crearSlot('MCD-1', 'MCD', 'MCD', 50, 58),
    crearSlot('MC-I',  'MC',  'MC_IZQ', 30, 45),
    crearSlot('MC-D',  'MC',  'MC_DER', 70, 45),
    crearSlot('EXT-I', 'EXT', 'EXT_IZQ', 15, 22),
    crearSlot('DC-1',  'DC',  'DC', 50, 14),
    crearSlot('EXT-D', 'EXT', 'EXT_DER', 85, 22),
  ],

  '4-4-2': [
    crearSlot('POR-1', 'POR', 'POR', 50, 92),
    crearSlot('LAT-I', 'LAT', 'LAT_IZQ', 12, 72),
    crearSlot('DFC-I', 'DFC', 'DFC_IZQ', 35, 77),
    crearSlot('DFC-D', 'DFC', 'DFC_DER', 65, 77),
    crearSlot('LAT-D', 'LAT', 'LAT_DER', 88, 72),
    crearSlot('EXT-I', 'EXT', 'EXT_IZQ', 15, 48),
    crearSlot('MC-I',  'MC',  'MC_IZQ', 38, 48),
    crearSlot('MC-D',  'MC',  'MC_DER', 62, 48),
    crearSlot('EXT-D', 'EXT', 'EXT_DER', 85, 48),
    crearSlot('DC-I',  'DC',  'DC', 38, 18),
    crearSlot('DC-D',  'DC',  'DC', 62, 18),
  ],

  '4-2-3-1': [
    crearSlot('POR-1', 'POR', 'POR', 50, 92),
    crearSlot('LAT-I', 'LAT', 'LAT_IZQ', 12, 72),
    crearSlot('DFC-I', 'DFC', 'DFC_IZQ', 35, 77),
    crearSlot('DFC-D', 'DFC', 'DFC_DER', 65, 77),
    crearSlot('LAT-D', 'LAT', 'LAT_DER', 88, 72),
    crearSlot('MCD-I', 'MCD', 'MCD', 38, 58),
    crearSlot('MCD-D', 'MCD', 'MCD', 62, 58),
    crearSlot('EXT-I', 'EXT', 'EXT_IZQ', 15, 35),
    crearSlot('MC-1',  'MC',  'MC_CEN', 50, 35),
    crearSlot('EXT-D', 'EXT', 'EXT_DER', 85, 35),
    crearSlot('DC-1',  'DC',  'DC', 50, 14),
  ],

  '3-5-2': [
    crearSlot('POR-1', 'POR', 'POR', 50, 92),
    crearSlot('DFC-I', 'DFC', 'DFC_IZQ', 25, 77),
    crearSlot('DFC-C', 'DFC', 'DFC', 50, 77),
    crearSlot('DFC-D', 'DFC', 'DFC_DER', 75, 77),
    crearSlot('LAT-I', 'LAT', 'LAT_IZQ', 10, 52),
    crearSlot('MCD-1', 'MCD', 'MCD', 50, 55),
    crearSlot('LAT-D', 'LAT', 'LAT_DER', 90, 52),
    crearSlot('MC-I',  'MC',  'MC_IZQ', 33, 40),
    crearSlot('MC-D',  'MC',  'MC_DER', 67, 40),
    crearSlot('DC-I',  'DC',  'DC', 38, 16),
    crearSlot('DC-D',  'DC',  'DC', 62, 16),
  ],

  '5-4-1': [
    crearSlot('POR-1', 'POR', 'POR', 50, 92),
    crearSlot('LAT-I', 'LAT', 'LAT_IZQ', 8, 72),
    crearSlot('DFC-I', 'DFC', 'DFC_IZQ', 28, 77),
    crearSlot('DFC-C', 'DFC', 'DFC', 50, 77),
    crearSlot('DFC-D', 'DFC', 'DFC_DER', 72, 77),
    crearSlot('LAT-D', 'LAT', 'LAT_DER', 92, 72),
    crearSlot('EXT-I', 'EXT', 'EXT_IZQ', 15, 48),
    crearSlot('MC-I',  'MC',  'MC_IZQ', 38, 48),
    crearSlot('MC-D',  'MC',  'MC_DER', 62, 48),
    crearSlot('EXT-D', 'EXT', 'EXT_DER', 85, 48),
    crearSlot('DC-1',  'DC',  'DC', 50, 16),
  ],

  '3-4-3': [
    crearSlot('POR-1', 'POR', 'POR', 50, 92),
    crearSlot('DFC-I', 'DFC', 'DFC_IZQ', 25, 77),
    crearSlot('DFC-C', 'DFC', 'DFC', 50, 77),
    crearSlot('DFC-D', 'DFC', 'DFC_DER', 75, 77),
    crearSlot('LAT-I', 'LAT', 'LAT_IZQ', 10, 52),
    crearSlot('MC-I',  'MC',  'MC_IZQ', 38, 50),
    crearSlot('MC-D',  'MC',  'MC_DER', 62, 50),
    crearSlot('LAT-D', 'LAT', 'LAT_DER', 90, 52),
    crearSlot('EXT-I', 'EXT', 'EXT_IZQ', 20, 22),
    crearSlot('DC-1',  'DC',  'DC', 50, 14),
    crearSlot('EXT-D', 'EXT', 'EXT_DER', 80, 22),
  ],
}

/** Lista de formaciones disponibles */
export const FORMACIONES_DISPONIBLES = Object.keys(FORMACIONES)

/**
 * Reubica jugadores al cambiar de formación.
 * Intenta mantener a los jugadores en slots con la misma posición.
 */
export function reubicarJugadores(
  slotsAnteriores: SlotTactico[],
  nuevaFormacion: string
): SlotTactico[] {
  const nuevosSlots = JSON.parse(
    JSON.stringify(FORMACIONES[nuevaFormacion] || FORMACIONES['4-3-3'])
  ) as SlotTactico[]

  const jugadoresParaAsignar = slotsAnteriores
    .filter(s => s.jugador_id !== null)
    .map(s => ({ ...s }))

  // Paso 1: match exacto por ID del slot
  for (const antiguo of [...jugadoresParaAsignar]) {
    const nuevoSlot = nuevosSlots.find(ns => ns.id === antiguo.id && ns.jugador_id === null)
    if (nuevoSlot) {
      nuevoSlot.jugador_id = antiguo.jugador_id
      const idx = jugadoresParaAsignar.indexOf(antiguo)
      if (idx > -1) jugadoresParaAsignar.splice(idx, 1)
    }
  }

  // Paso 2: match por posición base
  for (const antiguo of [...jugadoresParaAsignar]) {
    const nuevoSlot = nuevosSlots.find(
      ns => ns.posicion === antiguo.posicion && ns.jugador_id === null
    )
    if (nuevoSlot) {
      nuevoSlot.jugador_id = antiguo.jugador_id
      const idx = jugadoresParaAsignar.indexOf(antiguo)
      if (idx > -1) jugadoresParaAsignar.splice(idx, 1)
    }
  }

  // Jugadores no asignados se pierden (vuelven al pool en el componente padre)
  return nuevosSlots
}
