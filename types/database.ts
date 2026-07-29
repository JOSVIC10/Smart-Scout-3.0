// ============================================================================
// Smart Scout 3.0 — Tipos TypeScript alineados con el esquema de Supabase
// ============================================================================

// ---------------------------------------------------------------------------
// Enums (espejo de los tipos SQL)
// ---------------------------------------------------------------------------

/** Pie preferido del jugador */
export type PiePreferido = 'izquierdo' | 'derecho' | 'ambos'

/** Posición principal (7 base): usada para scoring y ponderaciones */
export type Posicion = 'POR' | 'DFC' | 'LAT' | 'MCD' | 'MC' | 'EXT' | 'DC'

/** Posición detallada con lateralidad: usada para campograma y ficha */
export type PosicionDetallada =
  | 'POR'
  | 'DFC' | 'DFC_DER' | 'DFC_IZQ'
  | 'LAT_IZQ' | 'LAT_DER'
  | 'MCD'
  | 'MC' | 'MC_IZQ' | 'MC_DER' | 'MC_CEN'
  | 'EXT_IZQ' | 'EXT_DER'
  | 'DC'

/** Categoría de competición */
export type Categoria = 'Segunda RFEF' | 'Tercera RFEF' | 'Otra'

/** Grupo de métricas */
export type GrupoMetrica = 'ofensiva' | 'defensiva' | 'posesion'

/** Resultado binario de una acción etiquetada */
export type ResultadoAccion = 'efectiva' | 'no_efectiva'

/** Zona del campo (campograma 13 zonas: 4 filas × 3 columnas + Zona 14) */
export type ZonaCampo =
  | 'DEF_IZQ' | 'DEF_CEN' | 'DEF_DER'
  | 'MED_IZQ' | 'MED_CEN' | 'MED_DER'
  | 'OFE_IZQ' | 'OFE_CEN' | 'OFE_DER'
  | 'ARE_IZQ' | 'ARE_CEN' | 'ARE_DER'
  | 'ZONA14'

/** Recomendación del scout */
export type Recomendacion = 'PRIORITARIO' | 'RECOMENDADO' | 'SEGUIR' | 'DESCARTAR'

// ---------------------------------------------------------------------------
// Entidades principales
// ---------------------------------------------------------------------------

export interface Club {
  id: string
  nombre: string
  ciudad: string | null
  provincia: string | null
  categoria: Categoria
  escudo_url: string | null
  created_at: string
}

export interface Jugador {
  id: string
  nombre: string
  apellidos: string
  nacionalidad: string
  fecha_nacimiento: string | null
  pie_preferido: PiePreferido
  posicion: Posicion
  posicion_detallada: PosicionDetallada | null
  dorsal: number | null
  club_id: string | null
  foto_url: string | null
  altura_cm: number | null
  peso_kg: number | null
  categoria: Categoria | null
  minutos_jugados: number
  partidos_analizados: number
  score_global: number | null
  created_at: string
  updated_at: string
}

/** Jugador con datos del club embebidos */
export interface JugadorConClub extends Jugador {
  club: Club | null
}

export interface Partido {
  id: string
  fecha: string
  jornada: number | null
  club_local_id: string | null
  club_visitante_id: string | null
  resultado: string | null
  competicion: string | null
  categoria: Categoria | null
  notas: string | null
  created_at: string
}

/** Partido con clubs embebidos */
export interface PartidoConClubes extends Partido {
  club_local: Club | null
  club_visitante: Club | null
}

export interface Video {
  id: string
  titulo: string
  partido_id: string | null
  tipo_fuente: 'youtube' | 'archivo_local' | 'storage'
  url: string | null
  duracion_seg: number | null
  created_at: string
}

export interface MetricaNivel1 {
  id: string
  codigo: string
  nombre: string
  descripcion: string | null
  grupo: GrupoMetrica
  posiciones: Posicion[] | null
}

export interface AccionEtiquetada {
  id: string
  video_id: string
  jugador_id: string
  metrica_n1_id: string
  /** Referencia directa a la métrica N2 vinculada (para recálculo de score trazable) */
  metrica_n2_id: string | null
  minuto_video: number
  segundo_video: number
  resultado: ResultadoAccion
  zona: ZonaCampo | null
  nota: string | null
  created_at: string
}

/** Acción con la métrica N1 y opcionalmente N2 embebidas */
export interface AccionConMetrica extends AccionEtiquetada {
  metrica_n1: MetricaNivel1
  metrica_n2?: MetricaNivel2 | null
  video?: Video | null
}

export interface MetricaNivel2 {
  id: string
  codigo: string
  nombre: string
  descripcion: string | null
  grupo: GrupoMetrica
}

export interface ComposicionNivel2 {
  id: string
  metrica_n2_id: string
  metrica_n1_id: string
  peso: number
}

export interface MetricaPosicion {
  id: string
  posicion: Posicion
  metrica_n2_id: string
  orden_default: number
}

export interface JugadorMetricaN2 {
  id: string
  jugador_id: string
  metrica_n2_id: string
  valor: number
  percentil: number | null
  muestra: number
  updated_at: string
}

/** Métrica N2 enriquecida con datos del catálogo (para mostrar en UI) */
export interface MetricaN2Enriquecida {
  codigo: string
  nombre: string
  grupo: GrupoMetrica
  valor: number
  percentil: number
  muestra: number
}

export interface ModeloJuego {
  id: string
  nombre: string
  descripcion: string | null
  es_predefinido: boolean
  formacion: string | null
  created_at: string
  updated_at: string
}

export interface PonderacionModelo {
  id: string
  modelo_id: string
  posicion: Posicion
  metrica_n2_id: string
  rango: number
  peso: number
}

export interface Valoracion {
  id: string
  jugador_id: string
  partido_id: string | null
  modelo_id: string | null
  score: number | null
  notas: string | null
  aspectos_positivos: string[] | null
  aspectos_mejora: string[] | null
  recomendacion: Recomendacion | null
  created_at: string
}

export interface AlineacionGuardada {
  id: string
  nombre: string
  modelo_id: string | null
  formacion: string
  slots: SlotTactico[]
  notas: string | null
  created_at: string
  updated_at: string
}

// ---------------------------------------------------------------------------
// Tipos para el campograma / formaciones
// ---------------------------------------------------------------------------

export interface SlotTactico {
  id: string                          // Ej: "CB-1", "ST-1"
  posicion: Posicion                  // Posición base requerida
  posicion_detallada: PosicionDetallada  // Posición con lateralidad para el slot
  x: number                          // 0-100 (izquierda → derecha)
  y: number                          // 0-100 (portería rival arriba → nuestra abajo)
  jugador_id: string | null
}

// ---------------------------------------------------------------------------
// Tipos para el radar chart de Recharts
// ---------------------------------------------------------------------------

export interface RadarDataPoint {
  metrica: string        // código de la métrica N2
  nombre: string         // nombre visible
  percentil: number      // 0-99
  fullMark: 99
}

// ---------------------------------------------------------------------------
// Tipos para filtros del directorio
// ---------------------------------------------------------------------------

export interface FiltrosJugador {
  busqueda: string
  posicion: Posicion | ''
  clubId: string
  categoria: Categoria | ''
  scoreMin: number | null
  scoreMax: number | null
}
