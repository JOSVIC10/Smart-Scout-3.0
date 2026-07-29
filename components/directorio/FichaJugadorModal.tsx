'use client'

import React, { useEffect, useState, useRef, useCallback } from 'react'
import { Modal } from '@/components/ui/Modal'
import { CustomVideoPlayer } from '@/components/video/CustomVideoPlayer'
import { Tabs } from '@/components/ui/Tabs'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import {
  POSICION_LABELS,
  POSICION_DETALLADA_LABELS,
  PIE_LABELS,
  clasePercentil,
  colorPercentil,
  calcularEdad,
  formatearFecha,
  RECOMENDACION_COLORS,
  RECOMENDACION_LABELS,
} from '@/lib/constants'
import { obtenerMetricasJugador } from '@/lib/supabase/metricas'
import { obtenerValoracionesPorJugador, crearValoracion } from '@/lib/supabase/valoraciones'
import { obtenerAccionesPorJugador, obtenerEstadisticasPorJugador, type EstadisticaMetricaN2 } from '@/lib/supabase/acciones'
import { actualizarJugador } from '@/lib/supabase/jugadores'
import { ZONA_LABELS } from '@/lib/constants'
import { calcularScore, fiabilidad } from '@/lib/scoring/calcularScore'
import type {
  JugadorConClub,
  MetricaN2Enriquecida,
  Valoracion,
  AccionConMetrica,
} from '@/types/database'
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import {
  User,
  Calendar,
  Ruler,
  Weight,
  Award,
  Video,
  FileText,
  Clock,
  PlusCircle,
  ThumbsUp,
  ThumbsDown,
  BarChart2,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ShieldCheck,
  Grid,
  Eye,
  FileDown,
  Printer,
  Upload,
  Loader2,
  Trash2,
  Save,
} from 'lucide-react'
import { ConfirmModal } from '@/components/ui/ConfirmModal'

import type { ModeloJuego } from '@/types/database'
import { supabase } from '@/lib/supabase/client'

interface FichaJugadorModalProps {
  jugador: JugadorConClub | null
  isOpen: boolean
  onClose: () => void
  activeModelName: string
  /** ID del modelo activo global para recálculo de score */
  activeModelId?: string
  /** Callback al actualizar el score (para refrescar el directorio) */
  onScoreUpdated?: (jugadorId: string, nuevoScore: number) => void
  /** Callback al eliminar un jugador */
  onPlayerDeleted?: (jugadorId: string) => void
}

// ── Indicador de fiabilidad ──────────────────────────────────────────────────
function IndicadorFiabilidad({ partidos }: { partidos: number }) {
  const nivel = fiabilidad(partidos)

  const config = {
    alta: {
      icon: <CheckCircle2 className="w-3.5 h-3.5" />,
      label: 'Alta fiabilidad',
      sub: `${partidos} partidos analizados`,
      className: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    },
    media: {
      icon: <AlertTriangle className="w-3.5 h-3.5" />,
      label: 'Fiabilidad media',
      sub: `${partidos} partidos analizados`,
      className: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    },
    baja: {
      icon: <XCircle className="w-3.5 h-3.5" />,
      label: 'Baja fiabilidad',
      sub: `${partidos} partidos — añade más vídeo`,
      className: 'text-red-400 bg-red-500/10 border-red-500/30',
    },
  }[nivel]

  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-semibold ${config.className}`}>
      {config.icon}
      <span>{config.label}</span>
      <span className="opacity-60 font-normal">— {config.sub}</span>
    </div>
  )
}

export function FichaJugadorModal({
  jugador,
  isOpen,
  onClose,
  activeModelName,
  activeModelId,
  onScoreUpdated,
  onPlayerDeleted,
}: FichaJugadorModalProps) {
  const [activeTab, setActiveTab] = useState<'perfil' | 'metricas' | 'mapa' | 'valoraciones' | 'clips'>('perfil')
  const [localActiveModelId, setLocalActiveModelId] = useState<string | undefined>(activeModelId)
  const [modelosDisponibles, setModelosDisponibles] = useState<ModeloJuego[]>([])

  // Confirm delete modal state
  const [showConfirmDelete, setShowConfirmDelete] = useState(false)
  const [deletingPlayer, setDeletingPlayer] = useState(false)
  
  useEffect(() => {
    if (activeModelId) setLocalActiveModelId(activeModelId)
  }, [activeModelId])
  const [metricas, setMetricas] = useState<MetricaN2Enriquecida[]>([])
  const [valoraciones, setValoraciones] = useState<Valoracion[]>([])
  const [acciones, setAcciones] = useState<AccionConMetrica[]>([])
  const [estadisticasN2, setEstadisticasN2] = useState<EstadisticaMetricaN2[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAccionToPlay, setSelectedAccionToPlay] = useState<AccionConMetrica | null>(null)
  const videoPlayerRef = useRef<any>(null)

  // Score recálculo state
  const [recalculando, setRecalculando] = useState(false)
  const [videoFiltrosUrl, setVideoFiltrosUrl] = useState<string | null>(null)

  // Ref to track if initial seek has been performed
  const initialSeekDone = useRef(false)
  const [scoreActual, setScoreActual] = useState<number | null>(null)
  const [recalcFeedback, setRecalcFeedback] = useState<'success' | 'error' | null>(null)
  const [desglose, setDesglose] = useState<{ nombreMetrica: string; percentil: number; peso: number; contribucion: number }[]>([])

  // Nueva valoración state
  const [nuevaNota, setNuevaNota] = useState('')
  const [guardandoNota, setGuardandoNota] = useState(false)

  // Upload de foto
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Vista Previa de Impresión
  const [isPreviewMode, setIsPreviewMode] = useState(false)

  // ── Carga inicial de datos al abrir la ficha ──
  useEffect(() => {
    if (!jugador || !isOpen) return
    setScoreActual(jugador.score_global)

    async function loadData() {
      setLoading(true)
      try {
        const { obtenerModelos } = await import('@/lib/supabase/modelos')
        const [mets, vals, accs, stats, mods] = await Promise.all([
          obtenerMetricasJugador(jugador!.id),
          obtenerValoracionesPorJugador(jugador!.id),
          obtenerAccionesPorJugador(jugador!.id),
          obtenerEstadisticasPorJugador(jugador!.id),
          obtenerModelos()
        ])
        setMetricas(mets)
        setValoraciones(vals)
        setAcciones(accs)
        setEstadisticasN2(stats)
        setModelosDisponibles(mods)
      } catch (err) {
        console.error('Error al cargar ficha del jugador:', err instanceof Error ? err.message : err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [jugador, isOpen])

  // ── Auto-recálculo reactivo al cambiar el modelo activo o abrir la ficha ──
  useEffect(() => {
    if (!isOpen || !jugador || !localActiveModelId) return

    let cancelled = false
    setRecalculando(true)

    calcularScore(jugador.id, localActiveModelId)
      .then(async (resultado) => {
        if (cancelled) return
        setScoreActual(resultado.score)
        setDesglose(resultado.desglose)
        onScoreUpdated?.(jugador.id, resultado.score)
        const mets = await obtenerMetricasJugador(jugador.id)
        if (!cancelled) setMetricas(mets)
      })
      .catch((err) => {
        if (cancelled) return
        console.warn('[Ficha] Auto-recálculo al cambiar modelo falló:', err?.message ?? err)
        setScoreActual(jugador.score_global)
      })
      .finally(() => {
        if (!cancelled) setRecalculando(false)
      })

    return () => { cancelled = true }
  }, [localActiveModelId, isOpen, jugador?.id])

  const handleConfirmDeletePlayer = async () => {
    if (!jugador) return
    setDeletingPlayer(true)
    try {
      const { eliminarJugador } = await import('@/lib/supabase/jugadores')
      await eliminarJugador(jugador.id)
      onPlayerDeleted?.(jugador.id)
      onClose()
    } catch (err) {
      console.error('Error al eliminar jugador:', err)
    } finally {
      setDeletingPlayer(false)
    }
  }

  const handleRecalcularScore = useCallback(async () => {
    if (!jugador || !localActiveModelId) return
    setRecalculando(true)
    setRecalcFeedback(null)
    try {
      const resultado = await calcularScore(jugador.id, localActiveModelId)
      setScoreActual(resultado.score)
      setDesglose(resultado.desglose)
      setRecalcFeedback('success')
      onScoreUpdated?.(jugador.id, resultado.score)
      // Refrescar métricas N2 actualizadas
      const mets = await obtenerMetricasJugador(jugador.id)
      setMetricas(mets)
      setTimeout(() => setRecalcFeedback(null), 3000)
    } catch (err) {
      console.error('Error al recalcular score:', err)
      setRecalcFeedback('error')
      setTimeout(() => setRecalcFeedback(null), 3000)
    } finally {
      setRecalculando(false)
    }
  }, [jugador, localActiveModelId, onScoreUpdated])

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !jugador) return

    setIsUploadingPhoto(true)
    try {
      const ext = file.name.split('.').pop()
      const fileName = `${jugador.id}_${Date.now()}.${ext}`
      
      const { data, error } = await supabase.storage
        .from('jugadores')
        .upload(fileName, file, { upsert: true })
        
      if (error) throw error

      const { data: publicUrlData } = supabase.storage
        .from('jugadores')
        .getPublicUrl(fileName)

      const fotoUrl = publicUrlData.publicUrl

      await actualizarJugador(jugador.id, { foto_url: fotoUrl })
      
      // Update local object to reflect immediately
      jugador.foto_url = fotoUrl
    } catch (err) {
      console.error('Error uploading photo:', err)
      alert('Error al subir la foto. Asegúrate de que el bucket "jugadores" sea público.')
    } finally {
      setIsUploadingPhoto(false)
    }
  }

  const handleGuardarNota = async () => {
    if (!jugador || !nuevaNota.trim()) return
    setGuardandoNota(true)
    try {
      const v = await crearValoracion({
        jugador_id: jugador.id,
        notas: nuevaNota.trim(),
        recomendacion: 'SEGUIR',
        score: null,
        partido_id: null,
        modelo_id: null,
        aspectos_positivos: null,
        aspectos_mejora: null,
      })
      setValoraciones(prev => [v, ...prev])
      setNuevaNota('')
    } catch (err) {
      console.error('Error al guardar valoración:', err)
    } finally {
      setGuardandoNota(false)
    }
  }

  if (!jugador) return null

  const edad = calcularEdad(jugador.fecha_nacimiento)

  // Radar chart formatting
  const radarData = metricas.map((m) => ({
    nombre: m.nombre,
    percentil: m.percentil,
    media: 50, // Mocked average for the position
    fullMark: 99,
  }))

  const tabs = [
    { id: 'perfil', label: 'Perfil & Trayectoria', icon: <User className="w-4 h-4" /> },
    { id: 'metricas', label: 'Métricas N2 & Radar', icon: <Award className="w-4 h-4" /> },
    { id: 'mapa', label: 'Mapa de Zonas', icon: <Grid className="w-4 h-4" /> },
    {
      id: 'valoraciones',
      label: 'Observaciones Scout',
      icon: <FileText className="w-4 h-4" />,
      badge: valoraciones.length,
    },
    {
      id: 'clips',
      label: 'Acciones Etiquetadas',
      icon: <Video className="w-4 h-4" />,
      badge: acciones.length,
    },
  ]

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isPreviewMode ? "Vista Previa del Informe" : "Ficha Técnica del Jugador"} size={isPreviewMode ? "xl" : "xl"}>
      <div className={`print-area ${isPreviewMode ? 'bg-white text-slate-900 p-8' : 'h-full'}`}>
        <div className="flex justify-end gap-2 mb-4 print:hidden">
          {isPreviewMode ? (
            <>
              <Button variant="outline" size="sm" onClick={() => setIsPreviewMode(false)}>
                Cerrar Vista Previa
              </Button>
              <Button variant="primary" size="sm" icon={<Printer className="w-4 h-4" />} onClick={() => window.print()}>
                Imprimir Documento
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" size="sm" icon={<Eye className="w-4 h-4" />} onClick={() => setIsPreviewMode(true)}>
                Vista Previa (Informe)
              </Button>
              <Button
                variant="outline"
                size="sm"
                icon={<Trash2 className="w-4 h-4 text-red-400" />}
                onClick={() => setShowConfirmDelete(true)}
                className="hover:border-red-500/50 hover:bg-red-950/30 text-red-400 hover:text-red-300"
              >
                Eliminar Jugador
              </Button>
            </>
          )}
        </div>

        {/* Player Header Banner */}
      <div className={`${isPreviewMode ? 'p-2 mb-2 gap-2' : 'p-4 mb-4 gap-4'} rounded-xl border flex flex-col md:flex-row md:items-center justify-between ${isPreviewMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'} print:bg-white print:border-slate-300 print:break-inside-avoid`}>
        <div className={`flex items-center ${isPreviewMode ? 'gap-2' : 'gap-4'}`}>
          <div 
            className={`group relative ${isPreviewMode ? 'w-12 h-12 min-w-[3rem] min-h-[3rem]' : 'w-16 h-16 min-w-[4rem] min-h-[4rem]'} rounded-2xl border flex items-center justify-center font-bold text-xl shadow-lg shrink-0 overflow-hidden ${isPreviewMode ? 'bg-white border-slate-300 text-slate-800' : 'bg-slate-900 border-slate-700 text-slate-200'}`}
          >
            {isUploadingPhoto ? (
              <Loader2 className="w-5 h-5 animate-spin text-slate-500" />
            ) : jugador.foto_url ? (
              <img
                src={jugador.foto_url}
                alt={jugador.nombre}
                className="w-full h-full object-cover"
                style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
              />
            ) : (
              <span>
                {jugador.nombre.charAt(0)}{jugador.apellidos.charAt(0)}
              </span>
            )}

            {!isPreviewMode && !isUploadingPhoto && (
              <div 
                className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-5 h-5 text-white" />
              </div>
            )}
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*"
              onChange={handlePhotoUpload}
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className={`text-lg font-bold ${isPreviewMode ? 'text-slate-900' : 'text-slate-100'}`}>
                {jugador.nombre} {jugador.apellidos}
              </h2>
              {jugador.dorsal && (
                <span className={`text-xs font-mono font-semibold px-2 py-0.5 rounded ${isPreviewMode ? 'bg-slate-200 text-slate-800' : 'bg-slate-800 text-slate-300'}`}>
                  #{jugador.dorsal}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
              <span className="text-emerald-500 font-semibold">{jugador.club?.nombre ?? 'Sin equipo'}</span>
              <span>•</span>
              <span>{jugador.categoria ?? 'Tercera RFEF'}</span>
            </p>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="primary" size="sm">
                {POSICION_LABELS[jugador.posicion]}
              </Badge>
              {jugador.posicion_detallada && (
                <Badge variant="secondary" size="sm">
                  {POSICION_DETALLADA_LABELS[jugador.posicion_detallada]}
                </Badge>
              )}
              <Badge variant="secondary" size="sm">
                {jugador.peso_kg ? `${jugador.peso_kg} kg` : 'Peso N/D'}
              </Badge>
              <Badge variant="outline" size="sm">
                Contrato: 2027
              </Badge>
            </div>
          </div>
        </div>

        {/* Global Score Box + Recalculate */}
        <div className={`flex md:flex-col items-center md:items-end justify-between border-t md:border-t-0 pt-3 md:pt-0 gap-3 ${isPreviewMode ? 'border-slate-200' : 'border-slate-800'}`}>
          {/* Score */}
          <div className="text-right flex flex-col items-end">
            {modelosDisponibles.length > 0 && !isPreviewMode ? (
              <select
                className="text-[10px] uppercase font-semibold text-slate-400 bg-transparent border-b border-slate-700 outline-none mb-1 cursor-pointer"
                value={localActiveModelId}
                onChange={(e) => setLocalActiveModelId(e.target.value)}
              >
                {modelosDisponibles.map(m => (
                  <option key={m.id} value={m.id}>{m.nombre}</option>
                ))}
              </select>
            ) : (
              <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-1">
                Score Global ({activeModelName})
              </span>
            )}
            <span
              className={`text-2xl font-black px-3 py-1 rounded-xl border inline-block ${clasePercentil(
                scoreActual ?? 0
              )}`}
            >
              {scoreActual ?? '—'} <span className="text-xs font-normal">/ 100</span>
            </span>
          </div>

          {/* Fiabilidad + Recalcular */}
          <div className="flex flex-col items-end gap-2 mt-2">
            <IndicadorFiabilidad partidos={jugador.partidos_analizados ?? 0} />
            {localActiveModelId && !isPreviewMode && (
              <Button
                variant={recalcFeedback === 'success' ? 'secondary' : 'primary'}
                size="sm"
                icon={<RefreshCw className={`w-3.5 h-3.5 ${recalculando ? 'animate-spin' : ''}`} />}
                onClick={handleRecalcularScore}
                loading={recalculando}
              >
                {recalcFeedback === 'success'
                  ? 'Score actualizado'
                  : recalcFeedback === 'error'
                  ? 'Error — reintentar'
                  : 'Recalcular Score'}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      {!isPreviewMode && (
        <Tabs tabs={tabs} activeTab={activeTab} onChange={(id) => setActiveTab(id as any)} className="mb-6 print:hidden" />
      )}

      {/* Renderizamos condicionalmente las secciones según si es preview mode o no */}
      
      {/* MODO VISTA PREVIA (ONE-PAGER GRID) */}
      {isPreviewMode ? (
        <div className="grid grid-cols-3 gap-4 pb-0 flex-1 h-full">
          
          {/* COLUMNA 1: INFO, TRAYECTORIA Y HEATMAP */}
          <div className="col-span-1 flex flex-col gap-4">
            {/* Info Personal */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <h4 className="text-[10px] font-bold text-slate-800 uppercase tracking-wider mb-2">Información Personal</h4>
              <div className="flex flex-col gap-2 text-xs">
                <div className="flex justify-between border-b border-slate-100 pb-1">
                  <span className="text-slate-500">Nacionalidad</span>
                  <span className="font-semibold text-slate-900">{jugador.nacionalidad}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-1">
                  <span className="text-slate-500">F. Nacimiento</span>
                  <span className="font-semibold text-slate-900">{jugador.fecha_nacimiento ? formatearFecha(jugador.fecha_nacimiento) : 'N/D'}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-1">
                  <span className="text-slate-500">Edad</span>
                  <span className="font-semibold text-slate-900">{edad} años</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-1">
                  <span className="text-slate-500">Altura / Peso</span>
                  <span className="font-semibold text-slate-900">{jugador.altura_cm ? `${jugador.altura_cm}cm` : '-'} / {jugador.peso_kg ? `${jugador.peso_kg}kg` : '-'}</span>
                </div>
                <div className="flex justify-between pb-1">
                  <span className="text-slate-500">Pie Dominante</span>
                  <span className="font-semibold text-slate-900">{PIE_LABELS[jugador.pie_preferido]}</span>
                </div>
              </div>
            </div>

            {/* Trayectoria */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <h4 className="text-[10px] font-bold text-slate-800 uppercase tracking-wider mb-2">Trayectoria (N1)</h4>
              <div className="overflow-hidden">
                <table className="w-full text-left text-[10px] text-slate-800">
                  <thead className="bg-slate-200 text-slate-700">
                    <tr>
                      <th className="p-1.5 font-semibold">Temp.</th>
                      <th className="p-1.5 font-semibold text-center">PJ</th>
                      <th className="p-1.5 font-semibold text-center">Min</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    <tr className="hover:bg-slate-100">
                      <td className="p-1.5 font-bold">25/26</td>
                      <td className="p-1.5 text-center">{jugador.partidos_analizados}</td>
                      <td className="p-1.5 text-center">{jugador.minutos_jugados ?? 0}</td>
                    </tr>
                    <tr className="hover:bg-slate-100 text-slate-500">
                      <td className="p-1.5">24/25</td>
                      <td className="p-1.5 text-center">28</td>
                      <td className="p-1.5 text-center">2150</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Heatmap */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col items-center flex-1 h-full justify-center">
              <h4 className="text-[10px] font-bold text-slate-800 uppercase tracking-wider mb-2 text-center">Mapa de Zonas</h4>
              <div className="w-full max-w-[150px] aspect-[3/4] bg-emerald-900/10 border-2 border-emerald-600/30 relative shadow-inner overflow-hidden rounded-md shrink-0">
              <svg className="absolute inset-0 w-full h-full opacity-30" viewBox="0 0 100 133" stroke="black" fill="none">
                <rect x="2" y="2" width="96" height="129" rx="2" />
                <line x1="2" y1="66.5" x2="98" y2="66.5" />
                <circle cx="50" cy="66.5" r="14" />
                <rect x="20" y="2" width="60" height="22" />
                <rect x="34" y="2" width="32" height="8" />
                <rect x="20" y="109" width="60" height="22" />
                <rect x="34" y="123" width="32" height="8" />
              </svg>
              <div className="absolute inset-0 grid grid-cols-3 grid-rows-4 gap-0.5 p-1">
                {[
                  'OFE_IZQ', 'OFE_CEN', 'OFE_DER',
                  'MED_IZQ', 'MED_CEN', 'MED_DER',
                  'DEF_IZQ', 'DEF_CEN', 'DEF_DER',
                  'ARE_IZQ', 'ARE_CEN', 'ARE_DER'
                ].map((zonaId) => {
                  const count = acciones.filter(a => a.zona === zonaId).length
                  const maxCount = Math.max(...[
                    'OFE_IZQ', 'OFE_CEN', 'OFE_DER', 'MED_IZQ', 'MED_CEN', 'MED_DER',
                    'DEF_IZQ', 'DEF_CEN', 'DEF_DER', 'ARE_IZQ', 'ARE_CEN', 'ARE_DER'
                  ].map(z => acciones.filter(a => a.zona === z).length))
                  
                  const intensity = maxCount > 0 ? count / maxCount : 0
                  
                  return (
                    <div 
                      key={zonaId}
                      className="rounded border border-emerald-500/10 transition-colors"
                      style={{
                        backgroundColor: intensity > 0 ? `rgba(239, 68, 68, ${intensity * 0.6})` : 'transparent'
                      }}
                    />
                  )
                })}
              </div>
            </div>
            </div>
          </div>

          {/* COLUMNA 2: RADAR Y DESGLOSE N2 */}
          <div className="col-span-1 flex flex-col gap-4">
            {/* Radar */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col items-center min-h-[220px]">
              <h4 className="text-[10px] font-bold text-slate-800 uppercase tracking-wider mb-2">Rendimiento N2</h4>
              {radarData.length > 0 ? (
                <div className="w-full flex-1 max-h-[180px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="65%" data={radarData}>
                      <PolarGrid stroke="#cbd5e1" strokeDasharray="3 3" />
                      <PolarAngleAxis dataKey="metrica" tick={{ fill: '#475569', fontSize: 8 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                      <Radar
                        name="Jugador"
                        dataKey="percentil"
                        stroke="#059669"
                        fill="#059669"
                        fillOpacity={0.4}
                        strokeWidth={1.5}
                      />
                      <Radar
                        name="Media"
                        dataKey="mediaPosicion"
                        stroke="#94a3b8"
                        fill="transparent"
                        strokeDasharray="3 3"
                        strokeWidth={1}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-[10px] text-slate-400 py-6">Sin métricas</p>
              )}
            </div>

            {/* Percentiles */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2 flex-1">
              <h4 className="text-[10px] font-bold text-slate-800 uppercase tracking-wider mb-3">Desglose Percentiles N2</h4>
              <div className="space-y-1.5">
                {metricas.length > 0 ? metricas.map((m) => (
                  <div key={m.codigo} className="space-y-0.5">
                    <div className="flex items-center justify-between text-[9px]">
                      <span className="font-semibold text-slate-800 truncate pr-1">{m.nombre}</span>
                      <span className="font-bold text-emerald-600">P{m.percentil}</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-200 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-emerald-500"
                        style={{ width: `${m.percentil}%` }}
                      />
                    </div>
                  </div>
                )) : (
                  <p className="text-[10px] text-slate-400">Sin datos</p>
                )}
              </div>
            </div>
          </div>

          {/* COLUMNA 3: EFECTIVIDAD Y OBSERVACIONES */}
          <div className="col-span-1 flex flex-col gap-4">
            {/* Efectividad N2 */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <h4 className="text-[10px] font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-1">
                <BarChart2 className="w-3 h-3 text-emerald-600" />
                Efectividad N2
              </h4>
              <div className="space-y-1.5">
                {estadisticasN2.slice(0, 6).map((stat) => (
                  <div key={stat.metrica_n2_id ?? stat.codigoMetrica} className="space-y-0.5">
                    <div className="flex items-center justify-between text-[9px]">
                      <span className="font-semibold text-slate-700 truncate pr-1">{stat.nombreMetrica}</span>
                      <div className="flex items-center gap-1">
                        <span className="text-slate-500">{stat.efectivas}/{stat.totalAcciones}</span>
                        <span className={`font-bold ${stat.porcentajeEfectividad >= 70 ? 'text-emerald-600' : stat.porcentajeEfectividad >= 40 ? 'text-amber-600' : 'text-red-600'}`}>
                          {stat.porcentajeEfectividad}%
                        </span>
                      </div>
                    </div>
                    <div className="w-full h-1 rounded-full bg-slate-200 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${stat.porcentajeEfectividad >= 70 ? 'bg-emerald-500' : stat.porcentajeEfectividad >= 40 ? 'bg-amber-500' : 'bg-red-500'}`}
                        style={{ width: `${stat.porcentajeEfectividad}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Observaciones (Valoraciones) */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex-1">
              <h4 className="text-[10px] font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-1">
                <FileText className="w-3 h-3 text-emerald-600" />
                Observaciones Scout
              </h4>
              <div className="space-y-3">
                {valoraciones.slice(0, 2).map((v) => (
                  <div key={v.id} className="pb-3 border-b border-slate-200 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between mb-1">
                      {v.recomendacion && (
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${v.recomendacion === 'PRIORITARIO' || v.recomendacion === 'RECOMENDADO' ? 'bg-emerald-100 text-emerald-700' : v.recomendacion === 'DESCARTAR' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                          {v.recomendacion}
                        </span>
                      )}
                      {v.score && <span className="text-[10px] font-bold text-emerald-600">Score: {v.score}</span>}
                    </div>
                    {v.notas && <p className="text-[9px] text-slate-700 italic leading-snug mb-1.5 line-clamp-3">{v.notas}</p>}
                    
                    <div className="flex gap-2 text-[8px]">
                      {v.aspectos_positivos && v.aspectos_positivos.length > 0 && (
                        <div className="flex-1 bg-emerald-50 p-1.5 rounded">
                          <p className="font-semibold text-emerald-700 mb-0.5 flex items-center gap-0.5"><ThumbsUp className="w-2 h-2"/> Pros</p>
                          <ul className="list-disc list-inside text-slate-600 space-y-0.5">
                            {v.aspectos_positivos.slice(0,2).map((p, i) => <li key={i} className="truncate">{p}</li>)}
                          </ul>
                        </div>
                      )}
                      {v.aspectos_mejora && v.aspectos_mejora.length > 0 && (
                        <div className="flex-1 bg-amber-50 p-1.5 rounded">
                          <p className="font-semibold text-amber-700 mb-0.5 flex items-center gap-0.5"><ThumbsDown className="w-2 h-2"/> Contras</p>
                          <ul className="list-disc list-inside text-slate-600 space-y-0.5">
                            {v.aspectos_mejora.slice(0,2).map((m, i) => <li key={i} className="truncate">{m}</li>)}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {valoraciones.length === 0 && <p className="text-[9px] text-slate-400">Sin observaciones registradas.</p>}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ============================================================== */
        /* MODO NORMAL (TABS) */
        /* ============================================================== */
        <>
          {/* Tab 0: Perfil & Trayectoria */}
      {activeTab === 'perfil' && !isPreviewMode && (
        <div className="space-y-6 mb-8 print:mb-8 print:break-inside-avoid">
          <div className={`p-4 rounded-xl border ${isPreviewMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800'}`}>
            <h4 className={`text-xs font-bold uppercase tracking-wider mb-4 ${isPreviewMode ? 'text-slate-800' : 'text-slate-300'}`}>Información Personal</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className={`text-xs ${isPreviewMode ? 'text-slate-500' : 'text-slate-500'}`}>Nacionalidad</p>
                <p className={`font-semibold ${isPreviewMode ? 'text-slate-900' : 'text-slate-200'}`}>{jugador.nacionalidad}</p>
              </div>
              <div>
                <p className={`text-xs ${isPreviewMode ? 'text-slate-500' : 'text-slate-500'}`}>Fecha Nacimiento</p>
                <p className={`font-semibold ${isPreviewMode ? 'text-slate-900' : 'text-slate-200'}`}>{jugador.fecha_nacimiento ? formatearFecha(jugador.fecha_nacimiento) : 'N/D'} ({edad} años)</p>
              </div>
              <div>
                <p className={`text-xs ${isPreviewMode ? 'text-slate-500' : 'text-slate-500'}`}>Altura / Peso</p>
                <p className={`font-semibold ${isPreviewMode ? 'text-slate-900' : 'text-slate-200'}`}>{jugador.altura_cm ? `${jugador.altura_cm} cm` : 'N/D'} / {jugador.peso_kg ? `${jugador.peso_kg} kg` : 'N/D'}</p>
              </div>
              <div>
                <p className={`text-xs ${isPreviewMode ? 'text-slate-500' : 'text-slate-500'}`}>Pie Dominante</p>
                <p className={`font-semibold ${isPreviewMode ? 'text-slate-900' : 'text-slate-200'}`}>{PIE_LABELS[jugador.pie_preferido]}</p>
              </div>
            </div>
          </div>
          
          <div className={`p-4 rounded-xl border ${isPreviewMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800'}`}>
            <h4 className={`text-xs font-bold uppercase tracking-wider mb-4 ${isPreviewMode ? 'text-slate-800' : 'text-slate-300'}`}>Resumen de Trayectoria (Nivel 1)</h4>
            <div className="overflow-x-auto">
              <table className={`w-full text-left text-sm ${isPreviewMode ? 'text-slate-800' : 'text-slate-300'}`}>
                <thead className={`text-xs uppercase ${isPreviewMode ? 'bg-slate-200 text-slate-700' : 'bg-slate-900/50 text-slate-400'}`}>
                  <tr>
                    <th className="px-4 py-2 font-semibold">Temporada</th>
                    <th className="px-4 py-2 font-semibold">Competición</th>
                    <th className="px-4 py-2 font-semibold text-center">Partidos (Titular)</th>
                    <th className="px-4 py-2 font-semibold text-center">Minutos</th>
                    <th className="px-4 py-2 font-semibold text-center">Tarjetas</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isPreviewMode ? 'divide-slate-200' : 'divide-slate-800/50'}`}>
                  <tr className={isPreviewMode ? 'hover:bg-slate-100' : 'hover:bg-slate-900/30'}>
                    <td className="px-4 py-3">2025/26</td>
                    <td className="px-4 py-3">{jugador.categoria ?? 'Liga'}</td>
                    <td className="px-4 py-3 text-center">{jugador.partidos_analizados} ({Math.max(0, jugador.partidos_analizados - 2)})</td>
                    <td className="px-4 py-3 text-center">{jugador.minutos_jugados}</td>
                    <td className="px-4 py-3 text-center text-xs">
                      <span className="text-yellow-500 bg-yellow-500/10 px-1.5 py-0.5 rounded border border-yellow-500/20 mr-1">2</span>
                      <span className="text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/20">0</span>
                    </td>
                  </tr>
                  {/* Falsos datos históricos para dar volumen */}
                  <tr className={isPreviewMode ? 'hover:bg-slate-100 text-slate-500' : 'hover:bg-slate-900/30 text-slate-400'}>
                    <td className="px-4 py-3">2024/25</td>
                    <td className="px-4 py-3">Tercera RFEF</td>
                    <td className="px-4 py-3 text-center">28 (24)</td>
                    <td className="px-4 py-3 text-center">2150</td>
                    <td className="px-4 py-3 text-center text-xs">
                      <span className="text-yellow-500 bg-yellow-500/10 px-1.5 py-0.5 rounded border border-yellow-500/20 mr-1">5</span>
                      <span className="text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/20">1</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 1: Metrics & Radar */}
      {activeTab === 'metricas' && !isPreviewMode && (
        <div className="space-y-6 mb-8 print:mb-8 print:break-inside-avoid">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Radar Chart */}
            <div className={`p-4 rounded-xl border flex flex-col items-center justify-center min-h-[300px] ${isPreviewMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800'}`}>
              <h4 className={`text-xs font-bold uppercase tracking-wider mb-2 ${isPreviewMode ? 'text-slate-800' : 'text-slate-300'}`}>
                Perfil de Rendimiento N2
              </h4>
              {radarData.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                    <PolarGrid stroke="#334155" />
                    <PolarAngleAxis dataKey="nombre" stroke="#94a3b8" fontSize={10} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#475569" fontSize={9} />
                    <Radar
                      name="Percentil Jugador"
                      dataKey="percentil"
                      stroke="#10b981"
                      fill="#10b981"
                      fillOpacity={0.4}
                    />
                    <Radar
                      name="Media Posición"
                      dataKey="media"
                      stroke="#94a3b8"
                      fill="transparent"
                      strokeDasharray="4 4"
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#1e293b',
                        borderRadius: '8px',
                        color: '#f8fafc',
                        fontSize: '11px',
                      }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-xs text-slate-500 py-12">Sin métricas registradas</p>
              )}
            </div>

            {/* Percentile Progress Bars */}
            <div className={`p-4 rounded-xl border space-y-3 ${isPreviewMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800'}`}>
              <h4 className={`text-xs font-bold uppercase tracking-wider mb-2 ${isPreviewMode ? 'text-slate-800' : 'text-slate-300'}`}>
                Desglose de Percentiles N2
              </h4>
              {metricas.length > 0 ? metricas.map((m) => (
                <div key={m.codigo} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className={`font-semibold ${isPreviewMode ? 'text-slate-800' : 'text-slate-200'}`}>{m.nombre}</span>
                    <span className="font-bold text-emerald-500">P{m.percentil}</span>
                  </div>
                  <div className={`w-full h-2 rounded-full overflow-hidden ${isPreviewMode ? 'bg-slate-200' : 'bg-slate-800'}`}>
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${m.percentil}%`,
                        backgroundColor: colorPercentil(m.percentil),
                      }}
                    />
                  </div>
                </div>
              )) : (
                <p className="text-xs text-slate-500 py-8 text-center">
                  Sin métricas — pulsa "Recalcular Score" para calcular.
                </p>
              )}

              {/* Desglose del último recálculo */}
              {desglose.length > 0 && (
                <div className={`mt-4 pt-4 border-t space-y-2 ${isPreviewMode ? 'border-slate-200' : 'border-slate-800'}`}>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Contribución al Score (último recálculo)
                  </p>
                  {desglose.map((d) => (
                    <div key={d.nombreMetrica} className="flex items-center justify-between text-[10px]">
                      <span className={`truncate max-w-[50%] ${isPreviewMode ? 'text-slate-700' : 'text-slate-400'}`}>{d.nombreMetrica}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500">P{d.percentil}</span>
                        <span className="text-slate-500">×</span>
                        <span className="text-slate-500">{(d.peso * 100).toFixed(1)}%</span>
                        <span className="text-slate-500">=</span>
                        <span className="font-bold text-emerald-500">{d.contribucion.toFixed(1)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Mapa de Zonas */}
      {activeTab === 'mapa' && !isPreviewMode && (
        <div className="space-y-6 mb-8 flex flex-col items-center print:mb-8 print:break-inside-avoid">
          <div className={`w-full max-w-md p-4 rounded-xl border ${isPreviewMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800'}`}>
            <h4 className={`text-xs font-bold uppercase tracking-wider mb-4 text-center ${isPreviewMode ? 'text-slate-800' : 'text-slate-300'}`}>
              Mapa de Zonas de Acción (Heatmap)
            </h4>
            <div className="w-full aspect-[3/4] bg-emerald-900/20 border-2 border-emerald-600/40 relative shadow-inner overflow-hidden rounded-md">
              {/* Field SVG markings */}
              <svg className="absolute inset-0 w-full h-full opacity-30" viewBox="0 0 100 133" stroke="white" fill="none">
                <rect x="2" y="2" width="96" height="129" rx="2" />
                <line x1="2" y1="66.5" x2="98" y2="66.5" />
                <circle cx="50" cy="66.5" r="14" />
                <rect x="20" y="2" width="60" height="22" />
                <rect x="34" y="2" width="32" height="8" />
                <rect x="20" y="109" width="60" height="22" />
                <rect x="34" y="123" width="32" height="8" />
              </svg>
              
              {/* Heatmap zones (mocked logic for visualization based on acciones) */}
              <div className="absolute inset-0 grid grid-cols-3 grid-rows-4 gap-1 p-2">
                {[
                  'OFE_IZQ', 'OFE_CEN', 'OFE_DER',
                  'MED_IZQ', 'MED_CEN', 'MED_DER',
                  'DEF_IZQ', 'DEF_CEN', 'DEF_DER',
                  'ARE_IZQ', 'ARE_CEN', 'ARE_DER'
                ].map((zonaId) => {
                  const count = acciones.filter(a => a.zona === zonaId).length
                  const intensity = Math.min(count * 0.15, 0.7) // max 70% opacity
                  return (
                    <div 
                      key={zonaId} 
                      className="rounded flex items-center justify-center transition-all"
                      style={{ backgroundColor: `rgba(16, 185, 129, ${intensity})` }}
                    >
                      {count > 0 && (
                        <span className="text-[10px] font-bold text-white bg-black/40 px-1 rounded">
                          {count}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
            <p className="text-[10px] text-slate-500 mt-4 text-center">
              Basado en las {acciones.length} acciones etiquetadas en video.
            </p>
          </div>
        </div>
      )}

      {/* Tab 2: Scout Evaluations */}
      {activeTab === 'valoraciones' && !isPreviewMode && (
        <div className="space-y-4 mb-8 print:mb-8 print:break-inside-avoid">
          {!isPreviewMode && (
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col gap-3">
              <textarea
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                rows={3}
                placeholder="Añadir nueva observación cualitativa (liderazgo, actitud, lenguaje corporal...)"
                value={nuevaNota}
                onChange={(e) => setNuevaNota(e.target.value)}
              />
              <div className="flex justify-end">
                <Button
                  variant="primary"
                  size="sm"
                  icon={<Save className="w-4 h-4" />}
                  onClick={handleGuardarNota}
                  loading={guardandoNota}
                  disabled={!nuevaNota.trim()}
                >
                  Guardar Observación
                </Button>
              </div>
            </div>
          )}

          {valoraciones.length > 0 ? (
            valoraciones.map((v) => (
              <div key={v.id} className={`p-4 rounded-xl border space-y-3 ${isPreviewMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/80 border-slate-800'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {v.recomendacion && (
                      <span
                        className="px-2.5 py-1 rounded-md text-xs font-bold text-white shadow-sm"
                        style={{ backgroundColor: RECOMENDACION_COLORS[v.recomendacion] }}
                      >
                        {RECOMENDACION_LABELS[v.recomendacion]}
                      </span>
                    )}
                    <span className="text-xs text-slate-400">
                      {formatearFecha(v.created_at)}
                    </span>
                  </div>
                  {v.score && (
                    <span className="text-sm font-bold text-emerald-500">
                      Score: {v.score}/100
                    </span>
                  )}
                </div>

                {v.notas && <p className={`text-xs italic ${isPreviewMode ? 'text-slate-700' : 'text-slate-300'}`}>{v.notas}</p>}

                {/* Pros and Cons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {v.aspectos_positivos && v.aspectos_positivos.length > 0 && (
                    <div className={`p-2.5 rounded-lg border text-xs ${isPreviewMode ? 'bg-emerald-50 border-emerald-200' : 'bg-emerald-950/30 border-emerald-500/20'}`}>
                      <p className="font-semibold text-emerald-500 flex items-center gap-1.5 mb-1">
                        <ThumbsUp className="w-3.5 h-3.5" /> Puntos Fuertes
                      </p>
                      <ul className={`list-disc list-inside space-y-0.5 ${isPreviewMode ? 'text-slate-700' : 'text-slate-300'}`}>
                        {v.aspectos_positivos.map((p, i) => (
                          <li key={i}>{p}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {v.aspectos_mejora && v.aspectos_mejora.length > 0 && (
                    <div className={`p-2.5 rounded-lg border text-xs ${isPreviewMode ? 'bg-amber-50 border-amber-200' : 'bg-amber-950/30 border-amber-500/20'}`}>
                      <p className="font-semibold text-amber-500 flex items-center gap-1.5 mb-1">
                        <ThumbsDown className="w-3.5 h-3.5" /> Aspectos a Mejorar
                      </p>
                      <ul className={`list-disc list-inside space-y-0.5 ${isPreviewMode ? 'text-slate-700' : 'text-slate-300'}`}>
                        {v.aspectos_mejora.map((m, i) => (
                          <li key={i}>{m}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 text-slate-500 text-xs">
              No hay observaciones cualitativas guardadas para este jugador aún.
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Tagged Actions / Clips */}
      {activeTab === 'clips' && !isPreviewMode && (
        <div className="space-y-4 mb-8 print:mb-8 print:break-inside-avoid">
          {/* N2 stats summary */}
          {estadisticasN2.length > 0 && (
            <div className={`p-4 rounded-xl border ${isPreviewMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800'}`}>
              <h4 className={`text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5 ${isPreviewMode ? 'text-slate-800' : 'text-slate-300'}`}>
                <BarChart2 className="w-3.5 h-3.5 text-emerald-500" />
                Efectividad por Métrica N2
              </h4>
              <div className="space-y-2">
                {estadisticasN2.map((stat) => (
                  <div key={stat.metrica_n2_id ?? stat.codigoMetrica} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className={`font-semibold truncate max-w-[60%] ${isPreviewMode ? 'text-slate-800' : 'text-slate-300'}`}>{stat.nombreMetrica}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-500">
                          {stat.efectivas}/{stat.totalAcciones}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            stat.porcentajeEfectividad >= 70
                              ? 'text-emerald-600 bg-emerald-500/20'
                              : stat.porcentajeEfectividad >= 40
                                ? 'text-amber-600 bg-amber-500/20'
                                : 'text-red-600 bg-red-500/20'
                          }`}
                        >
                          {stat.porcentajeEfectividad}%
                        </span>
                      </div>
                    </div>
                    <div className={`w-full h-1.5 rounded-full overflow-hidden ${isPreviewMode ? 'bg-slate-200' : 'bg-slate-800'}`}>
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          stat.porcentajeEfectividad >= 70
                            ? 'bg-emerald-500'
                            : stat.porcentajeEfectividad >= 40
                              ? 'bg-amber-500'
                              : 'bg-red-500'
                        }`}
                        style={{ width: `${stat.porcentajeEfectividad}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Clips list */}
          {acciones.length > 0 ? (
            <div className="space-y-2">
              <h4 className={`text-xs font-bold uppercase tracking-wider ${isPreviewMode ? 'text-slate-800' : 'text-slate-400'}`}>
                Cronología de Clips — {acciones.length} acciones
              </h4>
              {acciones.map((acc) => (
                <div
                  key={acc.id}
                  onClick={() => {
                    if (!isPreviewMode && acc.video?.url) {
                      initialSeekDone.current = false
                      setSelectedAccionToPlay(acc)
                    }
                  }}
                  className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-colors ${acc.video?.url && !isPreviewMode ? 'bg-slate-950/80 border-slate-800 cursor-pointer hover:bg-slate-900 hover:border-slate-700' : isPreviewMode ? 'bg-white border-slate-200' : 'bg-slate-950/50 border-slate-900 opacity-70'}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Timestamp */}
                    <div className={`w-12 h-10 rounded-lg border flex flex-col items-center justify-center shrink-0 ${isPreviewMode ? 'bg-slate-100 border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
                      <Clock className="w-2.5 h-2.5 text-emerald-500 mb-0.5" />
                      <span className={`text-[10px] font-mono font-bold ${isPreviewMode ? 'text-slate-700' : 'text-slate-300'}`}>
                        {String(acc.minuto_video).padStart(2, '0')}:{String(acc.segundo_video).padStart(2, '0')}
                      </span>
                    </div>

                    {/* Metric + zone */}
                    <div className="min-w-0">
                      <p className={`text-xs font-bold truncate ${isPreviewMode ? 'text-slate-800' : 'text-slate-200'}`}>
                        {acc.metrica_n2?.nombre ?? acc.metrica_n1?.nombre ?? 'Acción'}
                      </p>
                      {acc.metrica_n2 && acc.metrica_n1 && (
                        <p className={`text-[9px] truncate ${isPreviewMode ? 'text-slate-500' : 'text-slate-500'}`}>{acc.metrica_n1.nombre}</p>
                      )}
                      {acc.zona && (
                        <p className={`text-[9px] mt-0.5 flex items-center gap-1 ${isPreviewMode ? 'text-slate-500' : 'text-slate-500'}`}>
                          <span className={`w-1 h-1 rounded-full ${isPreviewMode ? 'bg-slate-400' : 'bg-slate-600'}`} />
                          {ZONA_LABELS[acc.zona]}
                        </p>
                      )}
                      {acc.nota && (
                        <p className="text-[9px] text-slate-400 italic mt-0.5 truncate">"{acc.nota}"</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {acc.valor_accion !== undefined && acc.valor_accion !== null && (
                      <span className={`text-xs font-bold px-2 py-1 rounded-md border shadow-sm ${
                        Number(acc.valor_accion) >= 1 ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 
                        Number(acc.valor_accion) >= 0.5 ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' : 
                        'bg-slate-100 text-slate-500 border-slate-200'
                      }`} title="Valor de la acción (Score)">
                        {Number(acc.valor_accion).toFixed(3)}
                      </span>
                    )}
                    {acc.clip_url && (
                      <div className="w-7 h-7 rounded flex items-center justify-center bg-indigo-50 border border-indigo-100 text-indigo-500" title="Clip automático generado">
                        <Video className="w-3.5 h-3.5" />
                      </div>
                    )}
                    <Badge variant={acc.resultado === 'efectiva' ? 'success' : 'danger'} size="sm">
                      {acc.resultado === 'efectiva' ? 'Efectiva' : 'No Efectiva'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500 text-xs space-y-2">
              <Video className="w-8 h-8 mx-auto stroke-1 text-slate-700" />
              <p>Sin acciones etiquetadas registradas en vídeo.</p>
              <p className="text-[10px] text-slate-600">Ve a la sección Vídeo y etiqueta acciones con el Panel de Etiquetado.</p>
            </div>
          )}
        </div>
      )}

      {/* Video Clip Modal */}
      {selectedAccionToPlay && selectedAccionToPlay.video?.url && (
        <Modal
          isOpen={!!selectedAccionToPlay}
          onClose={() => setSelectedAccionToPlay(null)}
          title={`Acción: ${selectedAccionToPlay.metrica_n2?.nombre ?? selectedAccionToPlay.metrica_n1?.nombre}`}
          size="xl"
        >
          <div className="aspect-video bg-black rounded-xl overflow-hidden border border-slate-800 relative">
            <CustomVideoPlayer
              playerRef={videoPlayerRef}
              url={(() => {
                const vid = selectedAccionToPlay.video;
                if (Array.isArray(vid)) return vid[0]?.url;
                return (vid as any)?.url;
              })()}
              playing={true}
              onReady={() => {
                // Solo log para depuración, el seekTo se hará en onProgress para evitar AbortError
                console.log('[FichaJugadorModal] onReady disparado')
              }}
              onProgress={(state) => {
                const timeStr = selectedAccionToPlay.clip_start_sec ?? Math.max(0, selectedAccionToPlay.minuto_video * 60 + selectedAccionToPlay.segundo_video - 3)
                const timeStart = Number(timeStr)
                
                // Efectuar el seek solo una vez cuando el reproductor empieza a avanzar
                if (!initialSeekDone.current && state.playedSeconds < timeStart) {
                  if (videoPlayerRef.current && videoPlayerRef.current.seekTo) {
                    videoPlayerRef.current.seekTo(timeStart, 'seconds')
                    initialSeekDone.current = true
                  }
                }
                const timeEndStr = selectedAccionToPlay.clip_end_sec ?? (Number(selectedAccionToPlay.clip_start_sec || selectedAccionToPlay.minuto_video * 60 + selectedAccionToPlay.segundo_video - 3) + 8)
                const timeEnd = Number(timeEndStr)
                // Stop playback and reset to beginning of clip if it reaches the end margin
                if (state.playedSeconds >= timeEnd) {
                  if (videoPlayerRef.current) {
                    const internalPlayer = videoPlayerRef.current.getInternalPlayer?.()
                    if (internalPlayer && typeof internalPlayer.pauseVideo === 'function') {
                      internalPlayer.pauseVideo() // YouTube
                    } else if (internalPlayer && typeof internalPlayer.pause === 'function') {
                      internalPlayer.pause() // HTML5
                    }
                  }
                }
              }}
            />
          </div>
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant={selectedAccionToPlay.resultado === 'efectiva' ? 'success' : 'danger'}>
                {selectedAccionToPlay.resultado === 'efectiva' ? 'Efectiva' : 'No Efectiva'}
              </Badge>
              {selectedAccionToPlay.zona && (
                <Badge variant="outline">{ZONA_LABELS[selectedAccionToPlay.zona]}</Badge>
              )}
            </div>
            <div className="font-mono text-sm text-emerald-400 font-bold">
              {String(selectedAccionToPlay.minuto_video).padStart(2, '0')}:{String(selectedAccionToPlay.segundo_video).padStart(2, '0')}
            </div>
          </div>
        </Modal>
      )}
      
        </>
      )}
      </div> {/* End print-area */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page {
            size: A4;
            margin: 0;
          }
          
          /* Forzar visibilidad del body y resetear overflow del modal */
          body, html { 
            visibility: hidden !important; 
            overflow: hidden !important;
            height: 100vh !important;
            width: 100vw !important;
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          
          /* Ocultar elementos innecesarios */
          .print\\:hidden, .print\\:hidden * { 
            display: none !important; 
          }
          
          /* Romper cualquier contexto de centrado del Modal para que el área de impresión empiece arriba del todo */
          .print-area { 
            visibility: visible !important; 
            position: fixed !important; 
            left: 0 !important; 
            top: 0 !important; 
            width: 100vw !important; 
            height: 100vh !important;
            overflow: hidden !important; 
            margin: 0 !important; 
            padding: 1.5cm !important; 
            background: white !important;
            color: black !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color: black !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            box-sizing: border-box !important;
            z-index: 999999 !important;
            display: flex !important;
            flex-direction: column !important;
          }
          
          .print-area * {
            visibility: visible !important;
          }
          
          /* Asegurar que las barras de progreso se impriman */
          .bg-slate-200, .bg-emerald-500, .bg-amber-500, .bg-red-500,
          .bg-emerald-50, .bg-amber-50, .bg-slate-50 {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          /* Evitar que se corten bloques por la mitad de la página */
          .print\\:break-inside-avoid {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
        }
      `}} />
      <ConfirmModal
        isOpen={showConfirmDelete}
        onClose={() => setShowConfirmDelete(false)}
        onConfirm={handleConfirmDeletePlayer}
        title="Confirmar eliminación de jugador"
        message={`¿Estás seguro de que deseas eliminar la ficha de ${jugador.nombre} ${jugador.apellidos}? Esta acción borrará permanentemente sus estadísticas, informes y métricas asociadas.`}
        confirmText="Eliminar Jugador"
        loading={deletingPlayer}
      />
    </Modal>
  )
}
