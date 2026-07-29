// ============================================================================
// Smart Scout 3.0 — Constantes globales
// ============================================================================
// Etiquetas en español, mapeos de posiciones y zonas del campo.

import type { Posicion, PosicionDetallada, PiePreferido, Categoria, ZonaCampo, Recomendacion, GrupoMetrica } from '@/types/database'

// ---------------------------------------------------------------------------
// Etiquetas de posiciones (7 base)
// ---------------------------------------------------------------------------
export const POSICION_LABELS: Record<Posicion, string> = {
  POR: 'Portero',
  DFC: 'Defensa Central',
  LAT: 'Lateral',
  MCD: 'Mediocentro Defensivo',
  MC:  'Mediocentro',
  EXT: 'Extremo',
  DC:  'Delantero Centro',
}

// Abreviaturas cortas para badges
export const POSICION_SHORT: Record<Posicion, string> = {
  POR: 'POR',
  DFC: 'DFC',
  LAT: 'LAT',
  MCD: 'MCD',
  MC:  'MC',
  EXT: 'EXT',
  DC:  'DC',
}

// ---------------------------------------------------------------------------
// Etiquetas de posición detallada (con lateralidad)
// ---------------------------------------------------------------------------
export const POSICION_DETALLADA_LABELS: Record<PosicionDetallada, string> = {
  POR:     'Portero',
  DFC:     'Central',
  DFC_DER: 'Central Derecho',
  DFC_IZQ: 'Central Izquierdo',
  LAT_IZQ: 'Lateral Izquierdo',
  LAT_DER: 'Lateral Derecho',
  MCD:     'Mediocentro Defensivo',
  MC:      'Mediocentro',
  MC_IZQ:  'Interior Izquierdo',
  MC_DER:  'Interior Derecho',
  MC_CEN:  'Mediapunta',
  EXT_IZQ: 'Extremo Izquierdo',
  EXT_DER: 'Extremo Derecho',
  DC:      'Delantero Centro',
}

// Mapeo de posición detallada → posición base (para scoring)
export const DETALLADA_A_BASE: Record<PosicionDetallada, Posicion> = {
  POR:     'POR',
  DFC:     'DFC',
  DFC_DER: 'DFC',
  DFC_IZQ: 'DFC',
  LAT_IZQ: 'LAT',
  LAT_DER: 'LAT',
  MCD:     'MCD',
  MC:      'MC',
  MC_IZQ:  'MC',
  MC_DER:  'MC',
  MC_CEN:  'MC',
  EXT_IZQ: 'EXT',
  EXT_DER: 'EXT',
  DC:      'DC',
}

// Lista ordenada de posiciones base (para iteraciones)
export const POSICIONES: Posicion[] = ['POR', 'DFC', 'LAT', 'MCD', 'MC', 'EXT', 'DC']

// ---------------------------------------------------------------------------
// Etiquetas de pie preferido
// ---------------------------------------------------------------------------
export const PIE_LABELS: Record<PiePreferido, string> = {
  izquierdo: 'Zurdo',
  derecho:   'Diestro',
  ambos:     'Ambidiestro',
}

// ---------------------------------------------------------------------------
// Etiquetas de categoría
// ---------------------------------------------------------------------------
export const CATEGORIA_LABELS: Record<Categoria, string> = {
  'Segunda RFEF': 'Segunda RFEF',
  'Tercera RFEF': 'Tercera RFEF',
  'Otra':         'Otra',
}

// ---------------------------------------------------------------------------
// Zonas del campo (campograma 12 zonas)
// ---------------------------------------------------------------------------
export const ZONA_LABELS: Record<ZonaCampo, string> = {
  DEF_IZQ: 'Defensa Izquierda',
  DEF_CEN: 'Defensa Central',
  DEF_DER: 'Defensa Derecha',
  MED_IZQ: 'Media Izquierda',
  MED_CEN: 'Media Central',
  MED_DER: 'Media Derecha',
  OFE_IZQ: 'Ofensiva Izquierda',
  OFE_CEN: 'Ofensiva Central',
  OFE_DER: 'Ofensiva Derecha',
  ARE_IZQ: 'Área Izquierda',
  ARE_CEN: 'Área Central',
  ARE_DER: 'Área Derecha',
  ZONA14:  'Zona 14 (entre líneas)',
}

// Zonas agrupadas por filas (para renderizar el campograma)
// Zona 14 se renderiza por separado como overlay en PitchMap.tsx
export const ZONAS_FILAS: ZonaCampo[][] = [
  ['ARE_IZQ', 'ARE_CEN', 'ARE_DER'],
  ['OFE_IZQ', 'OFE_CEN', 'OFE_DER'],
  ['MED_IZQ', 'MED_CEN', 'MED_DER'],
  ['DEF_IZQ', 'DEF_CEN', 'DEF_DER'],
]

// ---------------------------------------------------------------------------
// Métricas N2 por posición (fuente de verdad configurable para el etiquetado)
// ---------------------------------------------------------------------------
// Cada entrada es un array ordenado por importancia. Se puede añadir/quitar
// métricas aquí sin romper el sistema de scoring ni necesitar DDL en Supabase.
export interface MetricaN2Config {
  codigo: string
  nombre: string
  grupo: import('@/types/database').GrupoMetrica
  descripcion?: string
}

export const METRICAS_N2_POR_POSICION: Record<import('@/types/database').Posicion, MetricaN2Config[]> = {
  POR: [
    { codigo: 'POR_PARADAS_PCT', nombre: '% Paradas', grupo: 'defensiva', descripcion: 'Porcentaje de paradas sobre tiros a puerta recibidos' },
    { codigo: 'POR_GEP', nombre: 'Goles Esp. Prevenidos', grupo: 'defensiva', descripcion: 'xG menos goles recibidos (Post-Shot xG saved)' },
    { codigo: 'POR_SALIDAS_AEREAS', nombre: 'Salidas Aéreas Efectivas', grupo: 'defensiva', descripcion: 'Salidas aéreas en las que gana el duêlo' },
    { codigo: 'POR_PASES_LARGOS', nombre: 'Pases Largos Efectivos', grupo: 'posesion', descripcion: 'Pases largos completados sobre intentados' },
  ],
  DFC: [
    { codigo: 'DFC_AEREOS', nombre: 'Duelos Aéreos Ganados', grupo: 'defensiva', descripcion: 'Porcentaje de duelos aéreos ganados' },
    { codigo: 'DFC_INTERCEPTACIONES', nombre: 'Interceptaciones', grupo: 'defensiva', descripcion: 'Interceptaciones por 90 minutos' },
    { codigo: 'DFC_DESPEJES', nombre: 'Despejes', grupo: 'defensiva', descripcion: 'Despejes por 90 minutos' },
    { codigo: 'DFC_PASES_PROG', nombre: 'Pases Progresivos', grupo: 'posesion', descripcion: 'Pases que avanzan el juego 10+ metros hacia la portería rival' },
  ],
  LAT: [
    { codigo: 'LAT_CENTROS', nombre: 'Centros Precisos', grupo: 'ofensiva', descripcion: 'Porcentaje de centros completados' },
    { codigo: 'LAT_PASES_PROG', nombre: 'Pases Progresivos', grupo: 'posesion', descripcion: 'Pases que avanzan el juego 10+ metros hacia la portería rival' },
    { codigo: 'LAT_CONDUCCIONES', nombre: 'Conducciones Progresivas', grupo: 'ofensiva', descripcion: 'Conducciones que avanzan 10+ metros hacia la portería rival' },
    { codigo: 'LAT_RECUPERACIONES', nombre: 'Recuperaciones', grupo: 'defensiva', descripcion: 'Recuperaciones de balón por 90 minutos' },
  ],
  MCD: [
    { codigo: 'MCD_RECUPERACIONES', nombre: 'Recuperaciones', grupo: 'defensiva', descripcion: 'Recuperaciones de balón por 90 minutos' },
    { codigo: 'MCD_INTERCEPTACIONES', nombre: 'Interceptaciones', grupo: 'defensiva', descripcion: 'Interceptaciones por 90 minutos' },
    { codigo: 'MCD_PASES_PROG', nombre: 'Pases Progresivos', grupo: 'posesion', descripcion: 'Pases que avanzan el juego 10+ metros hacia la portería rival' },
    { codigo: 'MCD_CAMBIOS_ORI', nombre: 'Cambios de Orientación', grupo: 'posesion', descripcion: 'Pases que cambian el lado del juego en +30 metros' },
  ],
  MC: [
    { codigo: 'MC_PASES_PROG', nombre: 'Pases Progresivos', grupo: 'posesion', descripcion: 'Pases que avanzan el juego 10+ metros hacia la portería rival' },
    { codigo: 'MC_PASES_LINEAS', nombre: 'Pases entre Líneas', grupo: 'ofensiva', descripcion: 'Pases filtrados entre las líneas defensivas rivales' },
    { codigo: 'MC_DISTANCIA', nombre: 'Distancia Recorrida', grupo: 'posesion', descripcion: 'Kilómetros recorridos por partido' },
    { codigo: 'MC_PRECISION_PASE', nombre: 'Precisión en el Pase', grupo: 'posesion', descripcion: 'Porcentaje de pases completados' },
  ],
  EXT: [
    { codigo: 'EXT_REGATES', nombre: 'Regates Completados', grupo: 'ofensiva', descripcion: 'Regates completados por 90 minutos' },
    { codigo: 'EXT_CENTROS', nombre: 'Centros', grupo: 'ofensiva', descripcion: 'Centros al área por 90 minutos' },
    { codigo: 'EXT_XA', nombre: 'Expected Assists', grupo: 'ofensiva', descripcion: 'Asistencias esperadas por las oportunidades generadas' },
    { codigo: 'EXT_CONDUCCIONES', nombre: 'Conducciones Progresivas', grupo: 'ofensiva', descripcion: 'Conducciones que avanzan 10+ metros hacia la portería rival' },
  ],
  DC: [
    { codigo: 'DC_XG', nombre: 'Expected Goals', grupo: 'ofensiva', descripcion: 'Goles esperados por la calidad de las oportunidades generadas' },
    { codigo: 'DC_TIROS', nombre: 'Tiros a Puerta', grupo: 'ofensiva', descripcion: 'Tiros entre los tres palos por 90 minutos' },
    { codigo: 'DC_REMATES_CABEZA', nombre: 'Remates de Cabeza', grupo: 'ofensiva', descripcion: 'Remates de cabeza por 90 minutos' },
    { codigo: 'DC_AEREOS', nombre: 'Duelos Aéreos Ganados', grupo: 'defensiva', descripcion: 'Porcentaje de duelos aéreos ganados' },
  ],
}

// ---------------------------------------------------------------------------
// Etiquetas de recomendación
// ---------------------------------------------------------------------------
export const RECOMENDACION_LABELS: Record<Recomendacion, string> = {
  PRIORITARIO: 'Prioritario',
  RECOMENDADO: 'Recomendado',
  SEGUIR:      'Seguir observando',
  DESCARTAR:   'Descartar',
}

export const RECOMENDACION_COLORS: Record<Recomendacion, string> = {
  PRIORITARIO: '#22c55e',  // verde
  RECOMENDADO: '#3b82f6',  // azul
  SEGUIR:      '#f59e0b',  // ámbar
  DESCARTAR:   '#ef4444',  // rojo
}

// ---------------------------------------------------------------------------
// Grupos de métricas
// ---------------------------------------------------------------------------
export const GRUPO_LABELS: Record<GrupoMetrica, string> = {
  ofensiva:  'Ofensiva',
  defensiva: 'Defensiva',
  posesion:  'Posesión',
}

export const GRUPO_COLORS: Record<GrupoMetrica, string> = {
  ofensiva:  '#f97316',  // naranja
  defensiva: '#3b82f6',  // azul
  posesion:  '#22c55e',  // verde
}

// ---------------------------------------------------------------------------
// Colores por percentil (para barras y badges)
// ---------------------------------------------------------------------------
export function colorPercentil(p: number): string {
  if (p >= 80) return '#22c55e'  // verde
  if (p >= 60) return '#84cc16'  // lima
  if (p >= 40) return '#eab308'  // amarillo
  if (p >= 20) return '#f97316'  // naranja
  return '#ef4444'               // rojo
}

export function clasePercentil(p: number): string {
  if (p >= 80) return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
  if (p >= 60) return 'bg-lime-500/20 text-lime-400 border-lime-500/30'
  if (p >= 40) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
  if (p >= 20) return 'bg-orange-500/20 text-orange-400 border-orange-500/30'
  return 'bg-red-500/20 text-red-400 border-red-500/30'
}

// ---------------------------------------------------------------------------
// Auto-Clips: Márgenes configurables por tipo de acción (código de métrica N2)
// ---------------------------------------------------------------------------

export interface ClipMargin {
  /** Segundos ANTES del timestamp pulsado para el inicio del clip */
  preSeconds: number
  /** Segundos DESPUÉS del timestamp pulsado para el fin del clip */
  postSeconds: number
}

/**
 * Márgenes de clip por código de métrica N2.
 * Si la métrica no está aquí se usará DEFAULT (−5s / +5s).
 * Ajusta estos valores para afinar el contexto de cada tipo de acción.
 */
export const CLIP_MARGINS: Record<string, ClipMargin> = {
  // ── Portero ──
  POR_PARADAS_PCT:      { preSeconds: 4, postSeconds: 3 },
  POR_GEP:              { preSeconds: 5, postSeconds: 5 },
  POR_SALIDAS_AEREAS:   { preSeconds: 4, postSeconds: 4 },
  POR_PASES_LARGOS:     { preSeconds: 3, postSeconds: 5 },
  // ── Defensa Central ──
  DFC_AEREOS:           { preSeconds: 4, postSeconds: 4 },
  DFC_INTERCEPTACIONES: { preSeconds: 3, postSeconds: 4 },
  DFC_DESPEJES:         { preSeconds: 3, postSeconds: 3 },
  DFC_PASES_PROG:       { preSeconds: 5, postSeconds: 3 },
  // ── Lateral ──
  LAT_CENTROS:          { preSeconds: 4, postSeconds: 4 },
  LAT_PASES_PROG:       { preSeconds: 5, postSeconds: 3 },
  LAT_CONDUCCIONES:     { preSeconds: 4, postSeconds: 4 },
  LAT_RECUPERACIONES:   { preSeconds: 3, postSeconds: 4 },
  // ── Mediocentro Defensivo ──
  MCD_RECUPERACIONES:   { preSeconds: 3, postSeconds: 4 },
  MCD_INTERCEPTACIONES: { preSeconds: 3, postSeconds: 4 },
  MCD_PASES_PROG:       { preSeconds: 5, postSeconds: 3 },
  MCD_CAMBIOS_ORI:      { preSeconds: 5, postSeconds: 4 },
  // ── Mediocentro ──
  MC_PASES_PROG:        { preSeconds: 5, postSeconds: 3 },
  MC_PASES_LINEAS:      { preSeconds: 5, postSeconds: 4 },
  MC_DISTANCIA:         { preSeconds: 4, postSeconds: 4 },
  MC_PRECISION_PASE:    { preSeconds: 4, postSeconds: 3 },
  // ── Extremo ──
  EXT_REGATES:          { preSeconds: 3, postSeconds: 4 },
  EXT_CENTROS:          { preSeconds: 4, postSeconds: 4 },
  EXT_XA:               { preSeconds: 5, postSeconds: 5 },
  EXT_CONDUCCIONES:     { preSeconds: 4, postSeconds: 4 },
  // ── Delantero Centro ──
  DC_XG:                { preSeconds: 3, postSeconds: 5 },
  DC_TIROS:             { preSeconds: 3, postSeconds: 5 },
  DC_REMATES_CABEZA:    { preSeconds: 4, postSeconds: 4 },
  DC_AEREOS:            { preSeconds: 4, postSeconds: 4 },
  // ── Default ──
  DEFAULT:              { preSeconds: 5, postSeconds: 5 },
}

// ---------------------------------------------------------------------------
// Auto-Clips: Factor de zona para valor_accion
// ---------------------------------------------------------------------------

/**
 * Multiplicador de zona del campo para el cálculo de valor_accion.
 * Las zonas ofensivas (área, zona 14, frente al área) tienen mayor peso
 * porque las acciones allí tienen mayor impacto en el juego.
 * Zonas no listadas → factor = 1.0
 */
export const ZONA_FACTOR: Partial<Record<import('@/types/database').ZonaCampo, number>> = {
  ARE_CEN: 1.5,   // Área central — máximo impacto
  ARE_IZQ: 1.3,   // Área lateral izquierda
  ARE_DER: 1.3,   // Área lateral derecha
  ZONA14:  1.4,   // Zona 14 (entre líneas) — zona de creación clave
  OFE_CEN: 1.2,   // Ofensiva central
  OFE_IZQ: 1.1,   // Ofensiva lateral
  OFE_DER: 1.1,   // Ofensiva lateral
  MED_CEN: 1.0,   // Media central (referencia = 1)
  MED_IZQ: 0.9,
  MED_DER: 0.9,
  DEF_CEN: 0.8,
  DEF_IZQ: 0.7,
  DEF_DER: 0.7,
}

// ---------------------------------------------------------------------------
// Auto-Clips: Pesos por rango posicional de métrica N2 (Rank-Sum, N=4)
// ---------------------------------------------------------------------------

/**
 * Pesos aproximados por índice (0-based) de la métrica N2 dentro de
 * METRICAS_N2_POR_POSICION. Calculados con Rank-Sum para N=4:
 *   denom = 4+3+2+1 = 10
 *   rango 1 (idx 0) = 4/10 = 0.40
 *   rango 2 (idx 1) = 3/10 = 0.30
 *   rango 3 (idx 2) = 2/10 = 0.20
 *   rango 4 (idx 3) = 1/10 = 0.10
 */
export const PESO_POR_RANGO: readonly number[] = [0.40, 0.30, 0.20, 0.10]

// ---------------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------------

/** Calcula la edad a partir de la fecha de nacimiento */
export function calcularEdad(fechaNacimiento: string | null): number | null {
  if (!fechaNacimiento) return null
  const hoy = new Date()
  const nacimiento = new Date(fechaNacimiento)
  let edad = hoy.getFullYear() - nacimiento.getFullYear()
  const m = hoy.getMonth() - nacimiento.getMonth()
  if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) edad--
  return edad
}

/** Formatea una fecha ISO a formato español (dd/mm/yyyy) */
export function formatearFecha(fecha: string | null): string {
  if (!fecha) return '—'
  const d = new Date(fecha)
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

/** Nombre completo del jugador */
export function nombreCompleto(nombre: string, apellidos: string): string {
  return `${nombre} ${apellidos}`
}
