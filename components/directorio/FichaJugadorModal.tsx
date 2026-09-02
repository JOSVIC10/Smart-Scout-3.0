'use client'

import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react'
import { Modal } from '@/components/ui/Modal'
import { CustomVideoPlayer } from '@/components/video/CustomVideoPlayer'
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
  ZONA_LABELS
} from '@/lib/constants'
import { obtenerMetricasJugador } from '@/lib/supabase/metricas'
import { obtenerValoracionesPorJugador, crearValoracion } from '@/lib/supabase/valoraciones'
import { obtenerAccionesPorJugador, obtenerEstadisticasPorJugador, type EstadisticaMetricaN2 } from '@/lib/supabase/acciones'
import { actualizarJugador } from '@/lib/supabase/jugadores'
import { calcularScore, fiabilidad } from '@/lib/scoring/calcularScore'
import type {
  JugadorConClub,
  MetricaN2Enriquecida,
  Valoracion,
  AccionConMetrica,
  ModeloJuego
} from '@/types/database'
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  Cell
} from 'recharts'
import {
  Video,
  Clock,
  ThumbsUp,
  ThumbsDown,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Printer,
  Upload,
  Loader2,
  Trash2,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/components/auth/AuthProvider'
import { Edit2 } from 'lucide-react'
import { EditarAtributosForm } from './EditarAtributosModal'

interface FichaJugadorModalProps {
  jugador: JugadorConClub | null
  isOpen: boolean
  onClose: () => void
  activeModelName: string
  activeModelId?: string
  onScoreUpdated?: (jugadorId: string, nuevoScore: number) => void
  onPlayerDeleted?: (jugadorId: string) => void
}

function IndicadorFiabilidad({ partidos }: { partidos: number }) {
  const nivel = fiabilidad(partidos)

  const config = {
    alta: {
      icon: <CheckCircle2 className="w-3.5 h-3.5" />,
      label: 'Alta',
      className: 'text-emerald-400',
    },
    media: {
      icon: <AlertTriangle className="w-3.5 h-3.5" />,
      label: 'Media',
      className: 'text-amber-400',
    },
    baja: {
      icon: <XCircle className="w-3.5 h-3.5" />,
      label: 'Baja',
      className: 'text-red-400',
    },
  }[nivel]

  return (
    <div className={`flex items-center gap-1 text-[10px] font-semibold ${config.className}`}>
      {config.icon}
      <span>Fiabilidad {config.label}</span>
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
  const [localActiveModelId, setLocalActiveModelId] = useState<string | undefined>(activeModelId)
  const [modelosDisponibles, setModelosDisponibles] = useState<ModeloJuego[]>([])
  
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'

  const [showConfirmDelete, setShowConfirmDelete] = useState(false)
  const [deletingPlayer, setDeletingPlayer] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  
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

  const [recalculando, setRecalculando] = useState(false)
  const [scoreActual, setScoreActual] = useState<number | null>(null)
  const [desglose, setDesglose] = useState<{ nombreMetrica: string; percentil: number; peso: number; contribucion: number }[]>([])

  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [clipsExpanded, setClipsExpanded] = useState(false)

  const initialSeekDone = useRef(false)

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
        console.error('Error al cargar ficha del jugador:', err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [jugador, isOpen])

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
      jugador.foto_url = fotoUrl
    } catch (err) {
      console.error('Error uploading photo:', err)
      alert('Error al subir la foto.')
    } finally {
      setIsUploadingPhoto(false)
    }
  }

  const { radarData, goles, asistencias, tarjetasAmarillas, tarjetasRojas, pctEfectividad, historial } = useMemo(() => {
    if (!jugador) return { radarData: [], goles: 0, asistencias: 0, tarjetasAmarillas: 0, tarjetasRojas: 0, pctEfectividad: 0, historial: [] }

    // Calcula goles y asistencias
    const goles = acciones.filter(a => a.metrica_n1?.nombre.toLowerCase().includes('gol') || a.metrica_n2?.nombre.toLowerCase().includes('gol')).length
    const asistencias = acciones.filter(a => a.metrica_n1?.nombre.toLowerCase().includes('asistencia') || a.metrica_n1?.nombre.toLowerCase().includes('asi')).length
    const tarjetasAmarillas = acciones.filter(a => a.metrica_n1?.nombre.toLowerCase().includes('amarilla')).length
    const tarjetasRojas = acciones.filter(a => a.metrica_n1?.nombre.toLowerCase().includes('roja')).length

    const efectivas = acciones.filter(a => a.resultado === 'efectiva').length
    const pctEfectividad = acciones.length > 0 ? Math.round((efectivas / acciones.length) * 100) : 0

    // Dimensiones para el radar
    let radarData: { name: string, percentil: number, fullMark: number }[] = []

    if (desglose && desglose.length > 0) {
      radarData = [...desglose]
        .sort((a, b) => b.peso - a.peso)
        .slice(0, 6)
        .map(d => ({
          name: d.nombreMetrica,
          percentil: Math.round(d.percentil),
          fullMark: 100
        }))
    } else {
      const dims = {
        'Ataque': { sum: 0, count: 0 },
        'Técnica': { sum: 0, count: 0 },
        'Defensa': { sum: 0, count: 0 },
        'Presión': { sum: 0, count: 0 },
        'Creatividad': { sum: 0, count: 0 }
      }

      metricas.forEach(m => {
        const nom = m.nombre.toLowerCase()
        if (nom.includes('tiro') || nom.includes('remate') || nom.includes('gol') || m.grupo === 'ofensiva') {
          dims['Ataque'].sum += m.percentil; dims['Ataque'].count++
        } else if (nom.includes('pase') || nom.includes('control') || nom.includes('regate') || m.grupo === 'posesion') {
          dims['Técnica'].sum += m.percentil; dims['Técnica'].count++
        } else if (nom.includes('duelo') || nom.includes('corte') || nom.includes('despeje') || m.grupo === 'defensiva') {
          dims['Defensa'].sum += m.percentil; dims['Defensa'].count++
        } else if (nom.includes('presion') || nom.includes('recuperacion') || nom.includes('anticipacion')) {
          dims['Presión'].sum += m.percentil; dims['Presión'].count++
        } else if (nom.includes('asistencia') || nom.includes('clave') || nom.includes('centro') || nom.includes('creacion')) {
          dims['Creatividad'].sum += m.percentil; dims['Creatividad'].count++
        }
      })

      radarData = Object.entries(dims).map(([name, data]) => ({
        name,
        percentil: data.count > 0 ? Math.round(data.sum / data.count) : 0,
        fullMark: 100
      }))
    }

    const year = new Date().getFullYear()
    const historial = jugador.partidos_analizados > 0 ? [{
      temporada: `${year}`,
      equipo: jugador.club?.nombre ?? 'Sin equipo',
      partidos: jugador.partidos_analizados,
      goles,
      asistencias,
      score: scoreActual ?? 0
    }] : []

    return { radarData, goles, asistencias, tarjetasAmarillas, tarjetasRojas, pctEfectividad, historial }
  }, [metricas, acciones, jugador, scoreActual, desglose])

  const puntosFuertes = useMemo(() => Array.from(new Set(valoraciones.flatMap(v => v.aspectos_positivos || []))), [valoraciones])
  const puntosDebiles = useMemo(() => Array.from(new Set(valoraciones.flatMap(v => v.aspectos_mejora || []))), [valoraciones])
  const caracter = valoraciones.find(v => v.notas && v.notas.length > 0)?.notas?.slice(0, 100) || "Trabajador"

  if (!jugador) return null
  const edad = calcularEdad(jugador.fecha_nacimiento)

  if (showEditModal) {
    return (
      <Modal isOpen={isOpen} onClose={() => setShowEditModal(false)} title="Modo Edición" size="4xl">
        <EditarAtributosForm
          jugador={jugador}
          valoracionActual={valoraciones[0]}
          metricas={metricas}
          onCancel={() => setShowEditModal(false)}
          onSave={(metricasEditadas) => {
            setShowEditModal(false)
            // Actualizar métricas localmente para que el radar reaccione
            setMetricas(prev => prev.map(m => {
              if (metricasEditadas[m.codigo] !== undefined) {
                return { ...m, percentil: metricasEditadas[m.codigo] }
              }
              return m
            }))
            // Actualizar desglose localmente para que el radar (que usa desglose) reaccione
            setDesglose(prev => prev.map(d => {
              if (metricasEditadas[d.codigoMetrica] !== undefined) {
                return { 
                  ...d, 
                  percentil: metricasEditadas[d.codigoMetrica],
                  contribucion: metricasEditadas[d.codigoMetrica] * d.peso 
                }
              }
              return d
            }))
          }}
        />
      </Modal>
    )
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Player Card" size="4xl">
      <div className="absolute top-4 right-12 flex items-center gap-2 print:hidden z-10">
        {isAdmin && (
          <Button
            variant="outline"
            size="sm"
            icon={<Edit2 className="w-4 h-4 text-emerald-400" />}
            onClick={() => setShowEditModal(true)}
            className="border-emerald-500/30 bg-slate-900 text-emerald-400 hover:bg-emerald-500/10"
          >
            Editar Atributos
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          icon={<Trash2 className="w-4 h-4 text-red-400" />}
          onClick={() => setShowConfirmDelete(true)}
          className="border-red-500/30 bg-slate-900 text-red-400 hover:bg-red-500/10"
        >
          Eliminar
        </Button>
        <Button
          variant="primary"
          size="sm"
          icon={<Printer className="w-4 h-4" />}
          onClick={() => window.print()}
          className="bg-emerald-600 hover:bg-emerald-500 text-white"
        >
          Exportar PDF
        </Button>
      </div>

      <div className="print-area flex flex-col bg-slate-950 text-slate-200 p-2 sm:p-6 print:p-0 print:bg-slate-950 w-full min-h-screen sm:min-h-0 print:min-h-screen">
        
        {/* === HEADER ZONE === */}
        <div className="flex flex-col md:flex-row border-b border-slate-800 print:border-slate-800 pb-4 md:pb-6 gap-6 md:gap-8 mb-4">
          {/* Foto */}
          <div className="relative w-32 h-32 md:w-40 md:h-40 shrink-0 bg-slate-900 rounded border border-slate-700 overflow-hidden flex items-center justify-center text-4xl font-black text-slate-700 mx-auto md:mx-0 shadow-lg">
            {isUploadingPhoto ? (
              <Loader2 className="w-8 h-8 animate-spin text-slate-500" />
            ) : jugador.foto_url ? (
              <img src={jugador.foto_url} alt={jugador.nombre} className="w-full h-full object-cover print:color-adjust-exact" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }} />
            ) : (
              <span>{jugador.nombre.charAt(0)}{jugador.apellidos.charAt(0)}</span>
            )}
            {!isUploadingPhoto && (
              <div 
                className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity print:hidden"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-6 h-6 text-white" />
              </div>
            )}
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handlePhotoUpload} />
          </div>

          {/* Info Principal */}
          <div className="flex-1 flex flex-col justify-center">
            <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight text-white print:text-white leading-none mb-2 text-center md:text-left">
              {jugador.nombre} {jugador.apellidos}
            </h1>
            <div className="flex items-center justify-center md:justify-start gap-3 mb-6">
              {jugador.club?.escudo_url ? (
                <img src={jugador.club.escudo_url} alt="Escudo" className="w-8 h-8 object-contain" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold">CLUB</div>
              )}
              <div>
                <p className="text-sm md:text-base font-bold text-emerald-400 leading-tight">{jugador.club?.nombre ?? 'Agente Libre'}</p>
                <p className="text-xs text-slate-400 leading-tight">{jugador.categoria ?? 'Sin categoría'}</p>
              </div>
            </div>

            <div className="flex flex-wrap md:flex-nowrap gap-4 md:gap-6 border-t border-slate-800 pt-4 text-center md:text-left mt-2 md:mt-4">
              <div className="flex-1 min-w-[100px]">
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">F. Nacimiento</p>
                <p className="text-xs font-semibold">{jugador.fecha_nacimiento ? formatearFecha(jugador.fecha_nacimiento) : 'N/D'} <span className="text-[10px] text-slate-400 font-normal">({edad} AÑOS)</span></p>
              </div>
              <div className="flex-1 min-w-[80px]">
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">Nacionalidad</p>
                <p className="text-xs font-semibold">{jugador.nacionalidad}</p>
              </div>
              <div className="flex-1 min-w-[60px]">
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">Altura</p>
                <p className="text-xs font-semibold">{jugador.altura_cm ? `${jugador.altura_cm} cm` : 'N/D'}</p>
              </div>
              <div className="flex-1 min-w-[60px]">
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">Pie</p>
                <p className="text-xs font-semibold">{PIE_LABELS[jugador.pie_preferido]}</p>
              </div>
              <div className="flex-1 min-w-[60px]">
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">Posición</p>
                <p className="text-xs font-semibold">{jugador.posicion}</p>
              </div>
              <div className="flex-1 min-w-[60px]">
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">Dorsal</p>
                <p className="text-xs font-semibold">{jugador.dorsal ?? '-'}</p>
              </div>
            </div>
          </div>

          {/* Campograma SVG */}
          <div className="w-32 h-44 shrink-0 mx-auto md:mx-0 relative mt-4 md:mt-0 flex flex-col items-center">
            <svg viewBox="0 0 100 140" className="w-full h-full border-2 border-slate-700 bg-slate-900 rounded">
              <rect x="0" y="0" width="100" height="140" fill="none" />
              <line x1="0" y1="70" x2="100" y2="70" stroke="#334155" strokeWidth="1" />
              <circle cx="50" cy="70" r="15" fill="none" stroke="#334155" strokeWidth="1" />
              <rect x="25" y="0" width="50" height="20" fill="none" stroke="#334155" strokeWidth="1" />
              <rect x="25" y="120" width="50" height="20" fill="none" stroke="#334155" strokeWidth="1" />
              <rect x="40" y="0" width="20" height="8" fill="none" stroke="#334155" strokeWidth="1" />
              <rect x="40" y="132" width="20" height="8" fill="none" stroke="#334155" strokeWidth="1" />
              
              {/* Posición principal (punto verde) */}
              <circle cx="50" cy="35" r="7" fill="#10b981" />
              <text x="50" y="38" fill="white" fontSize="6" fontWeight="bold" textAnchor="middle">{jugador.posicion}</text>
            </svg>
            <p className="text-[9px] text-emerald-500 font-bold uppercase mt-2">
              {(jugador.posicion_detallada && POSICION_DETALLADA_LABELS[jugador.posicion_detallada]) || 'PRINCIPAL'}
            </p>
          </div>
        </div>

        {/* === SECONDARY BAR === */}
        <div className="flex flex-wrap md:flex-nowrap items-center bg-slate-900 border border-slate-800 rounded-lg p-4 gap-6 mb-6">
          <div className="flex-1 min-w-[120px]">
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-1">Valor de Mercado</p>
            <p className="text-xl font-bold text-emerald-400">{jugador.valor_mercado || 'N/D'}</p>
          </div>
          <div className="flex-1 min-w-[120px] border-l border-slate-800 pl-6">
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-1">Fin de Contrato</p>
            <p className="text-sm font-semibold">{jugador.fin_contrato || 'N/D'}</p>
          </div>
          <div className="flex-1 min-w-[120px] border-l border-slate-800 pl-6">
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-1">Estilo de Juego</p>
            <p className="text-sm font-semibold truncate" title={jugador.estilo_juego || 'Sin definir'}>{jugador.estilo_juego || 'Sin definir'}</p>
          </div>
          <div className="flex-1 min-w-[120px] border-l border-slate-800 pl-6 flex items-center justify-between">
            <div>
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-1">Score ({activeModelName})</p>
              <div className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded-sm ${scoreActual && scoreActual >= 70 ? 'bg-emerald-500' : scoreActual && scoreActual >= 50 ? 'bg-amber-500' : 'bg-red-500'} print:color-adjust-exact`} style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }} />
                <span className="text-xl font-bold">{scoreActual ? scoreActual.toFixed(2) : 'N/D'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* === MAIN 3 COLUMNS === */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 flex-1">
          
          {/* COL 1: Radar */}
          <div className="flex flex-col bg-slate-900 border border-slate-800 rounded-lg p-4 relative min-w-0 overflow-hidden">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0">Atributos (0-100)</h3>
            <div className="w-full flex-1 relative min-h-[220px] mt-2">
              <div className="absolute inset-0">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="60%" data={radarData}>
                    <PolarGrid stroke="#334155" />
                    <PolarAngleAxis dataKey="name" stroke="#94a3b8" fontSize={9} fontWeight="bold" tickLine={false} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar
                      name="Jugador"
                      dataKey="percentil"
                      stroke="#10b981"
                      strokeWidth={2}
                      fill="#10b981"
                      fillOpacity={0.4}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* COL 2: Season Stats */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 print:border-slate-300">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">Temporada 2026</h3>
            <div className="grid grid-cols-5 gap-4 text-center mb-8">
              <div>
                <p className="text-[10px] text-slate-500 uppercase font-bold mb-2">PJ</p>
                <p className="text-2xl font-black">{jugador.est_partidos ?? jugador.partidos_analizados}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase font-bold mb-2">Min</p>
                <p className="text-2xl font-black">{jugador.est_minutos ?? jugador.minutos_jugados}'</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase font-bold mb-2">Goles</p>
                <p className="text-2xl font-black">{jugador.est_goles ?? 0}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase font-bold mb-2">Asist</p>
                <p className="text-2xl font-black">{jugador.est_asistencias ?? 0}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase font-bold mb-2">Tarjetas</p>
                <p className="text-2xl font-black text-amber-500">{jugador.est_amarillas ?? 0} <span className="text-slate-600">/</span> <span className="text-red-500">{jugador.est_rojas ?? 0}</span></p>
              </div>
            </div>

            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-4 mt-2">Score por métricas clave (Efectividad)</h3>
            <div className="flex-1 flex items-end justify-between gap-1 h-32 mt-auto pb-2">
              {estadisticasN2.slice(0, 6).map((stat, i) => (
                <div key={i} className="flex flex-col items-center flex-1 h-full justify-end group">
                  <span className="text-[9px] text-slate-300 font-bold mb-1 opacity-0 group-hover:opacity-100 transition-opacity">{stat.porcentajeEfectividad}%</span>
                  <div className="w-full bg-slate-800 rounded-t-sm relative flex items-end max-w-[24px]">
                    <div 
                      className={`w-full rounded-t-sm print:color-adjust-exact ${stat.porcentajeEfectividad > 60 ? 'bg-emerald-500' : 'bg-amber-500'}`} 
                      style={{ height: `${stat.porcentajeEfectividad}%`, WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
                    />
                  </div>
                  <span className="text-[8px] text-slate-500 uppercase mt-2 truncate w-full text-center" title={stat.nombreMetrica}>
                    {stat.nombreMetrica.substring(0,3)}
                  </span>
                </div>
              ))}
              {estadisticasN2.length === 0 && <p className="text-xs text-slate-500 w-full text-center">Sin datos de métricas</p>}
            </div>
          </div>

          {/* COL 3: Career Summary */}
          <div className="flex flex-col bg-slate-900 border border-slate-800 rounded-lg p-4">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-4">Resumen de Carrera</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-[9px] text-slate-500 uppercase">
                    <th className="pb-2 font-bold">Temp</th>
                    <th className="pb-2 font-bold">Equipo</th>
                    <th className="pb-2 font-bold text-center">PJ</th>
                    <th className="pb-2 font-bold text-center">G</th>
                    <th className="pb-2 font-bold text-center">A</th>
                    <th className="pb-2 font-bold text-center">Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {historial.length > 0 ? (
                    historial.map((h, i) => (
                      <tr key={i} className="hover:bg-slate-800/50">
                        <td className="py-2 font-bold">{h.temporada}</td>
                        <td className="py-2 flex items-center gap-1"><div className="w-3 h-3 bg-slate-700 rounded-sm"></div> {h.equipo}</td>
                        <td className="py-2 text-center">{h.partidos}</td>
                        <td className="py-2 text-center">{h.goles}</td>
                        <td className="py-2 text-center">{h.asistencias}</td>
                        <td className="py-2 text-center">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold text-white print:color-adjust-exact ${h.score >= 70 ? 'bg-emerald-600' : 'bg-amber-600'}`} style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
                            {h.score.toFixed(2)}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-4 text-center text-slate-500">Sin datos registrados</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* === BOTTOM 3 COLUMNS === */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
            <h3 className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider mb-3">Puntos Fuertes</h3>
            {puntosFuertes.length > 0 ? (
              <ul className="space-y-2">
                {puntosFuertes.slice(0, 5).map((p, i) => (
                  <li key={i} className="flex gap-2 text-xs">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-slate-500">Sin definir</p>
            )}
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
            <h3 className="text-[10px] font-bold text-red-500 uppercase tracking-wider mb-3">Aspectos a Mejorar</h3>
            {puntosDebiles.length > 0 ? (
              <ul className="space-y-2">
                {puntosDebiles.slice(0, 5).map((p, i) => (
                  <li key={i} className="flex gap-2 text-xs">
                    <XCircle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-slate-500">Sin definir</p>
            )}
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 flex flex-col">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Perfil del Jugador</h3>
            <div className="space-y-3 text-xs flex-1">
              <div className="flex gap-2 items-start">
                <span className="w-4 mt-0.5 text-slate-500"><ThumbsUp className="w-3.5 h-3.5" /></span>
                <span className="font-semibold text-slate-300 w-16">Potencial:</span>
                <span className="font-bold text-white flex-1">{edad !== null && edad < 23 && scoreActual && scoreActual > 65 ? 'Alto' : 'Estándar'}</span>
              </div>
              <div className="flex gap-2 items-start">
                <span className="w-4 mt-0.5 text-slate-500"><ThumbsUp className="w-3.5 h-3.5" /></span>
                <span className="font-semibold text-slate-300 w-16">Carácter:</span>
                <span className="flex-1">{caracter}</span>
              </div>
              <div className="flex gap-2 items-start">
                <span className="w-4 mt-0.5 text-slate-500"><ThumbsUp className="w-3.5 h-3.5" /></span>
                <span className="font-semibold text-slate-300 w-16">Estilo:</span>
                <span className="flex-1">Jugador adaptado al modelo de juego con énfasis en {metricas[0]?.nombre.toLowerCase() || 'acciones ofensivas'}.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer citation */}
        <div className="mt-4 flex justify-between text-[8px] text-slate-600 font-bold uppercase tracking-widest">
          <span>FUENTE: SMART SCOUT 3.0</span>
          <span>{new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}</span>
        </div>

      </div> {/* End print-area */}

      {/* === CLIPS INTERACTIVOS (NO IMPRIMIBLE) === */}
      <div className="mt-6 print:hidden">
        <button 
          onClick={() => setClipsExpanded(!clipsExpanded)}
          className="w-full flex items-center justify-between p-4 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors group"
        >
          <div className="flex items-center gap-2">
            <Video className="w-4 h-4 text-emerald-400" />
            <span className="font-bold text-sm text-slate-200">Vídeos y Acciones Etiquetadas ({acciones.length})</span>
          </div>
          {clipsExpanded ? <ChevronUp className="w-5 h-5 text-slate-500" /> : <ChevronDown className="w-5 h-5 text-slate-500" />}
        </button>

        {clipsExpanded && (
          <div className="mt-2 p-4 bg-slate-900/50 border border-slate-800 rounded-lg max-h-[400px] overflow-y-auto space-y-2">
            {acciones.length > 0 ? (
              acciones.map((acc) => (
                <div
                  key={acc.id}
                  onClick={() => {
                    if (acc.video?.url) {
                      initialSeekDone.current = false
                      setSelectedAccionToPlay(acc)
                    }
                  }}
                  className={`p-3 rounded-lg border flex items-center justify-between gap-3 transition-colors ${acc.video?.url ? 'bg-slate-950/80 border-slate-800 cursor-pointer hover:bg-slate-800 hover:border-slate-700' : 'bg-slate-950/50 border-slate-900 opacity-70'}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-10 rounded border border-slate-800 bg-slate-900 flex flex-col items-center justify-center shrink-0">
                      <span className="text-[10px] font-mono font-bold text-slate-300">
                        {String(acc.minuto_video).padStart(2, '0')}:{String(acc.segundo_video).padStart(2, '0')}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold truncate text-slate-200">
                        {acc.metrica_n2?.nombre ?? acc.metrica_n1?.nombre ?? 'Acción'}
                      </p>
                      {acc.zona && (
                        <p className="text-[9px] flex items-center gap-1 text-slate-500 mt-0.5">
                          {ZONA_LABELS[acc.zona]}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {acc.clip_url && (
                      <div className="w-6 h-6 rounded flex items-center justify-center bg-indigo-500/20 text-indigo-400">
                        <Video className="w-3 h-3" />
                      </div>
                    )}
                    <Badge variant={acc.resultado === 'efectiva' ? 'success' : 'danger'} size="sm">
                      {acc.resultado === 'efectiva' ? 'Efectiva' : 'No Efectiva'}
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center py-6 text-xs text-slate-500">No hay acciones etiquetadas para este jugador.</p>
            )}
          </div>
        )}
      </div>

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
              onReady={() => {}}
              onProgress={(state) => {
                const timeStr = selectedAccionToPlay.clip_start_sec ?? Math.max(0, selectedAccionToPlay.minuto_video * 60 + selectedAccionToPlay.segundo_video - 3)
                const timeStart = Number(timeStr)
                if (!initialSeekDone.current && state.playedSeconds < timeStart) {
                  if (videoPlayerRef.current && videoPlayerRef.current.seekTo) {
                    videoPlayerRef.current.seekTo(timeStart, 'seconds')
                    initialSeekDone.current = true
                  }
                }
                const timeEndStr = selectedAccionToPlay.clip_end_sec ?? (Number(selectedAccionToPlay.clip_start_sec || selectedAccionToPlay.minuto_video * 60 + selectedAccionToPlay.segundo_video - 3) + 8)
                const timeEnd = Number(timeEndStr)
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

      {/* Estilos para impresión (Dark Mode UI Capture) */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page { size: A4 portrait; margin: 0; }
          body, html { 
            visibility: hidden !important; 
            overflow: hidden !important;
            height: 100vh !important;
            width: 100vw !important;
            background: #020617 !important;
            color: #e2e8f0 !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print\\:hidden, .print\\:hidden * { display: none !important; }
          .print-area { 
            visibility: visible !important; 
            position: fixed !important; 
            left: 0 !important; 
            top: 0 !important; 
            width: 100% !important; 
            height: 100% !important;
            overflow: hidden !important; 
            margin: 0 !important; 
            padding: 5mm !important; 
            background: #020617 !important;
            color: #e2e8f0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            box-sizing: border-box !important;
            z-index: 999999 !important;
            display: flex !important;
            flex-direction: column !important;
            zoom: 0.65;
          }
          .print-area * { visibility: visible !important; }
          .flex-1 { flex: 1 1 auto !important; }
          .recharts-wrapper, .recharts-surface { 
            width: 100% !important; 
            height: 100% !important; 
          }
        }
      `}} />
      <ConfirmModal
        isOpen={showConfirmDelete}
        onClose={() => setShowConfirmDelete(false)}
        onConfirm={handleConfirmDeletePlayer}
        title="Eliminar Jugador"
        description={`¿Estás seguro de que deseas eliminar a ${jugador.nombre} ${jugador.apellidos}? Esta acción no se puede deshacer y eliminará también sus acciones etiquetadas.`}
        confirmText="Eliminar Jugador"
        loading={deletingPlayer}
      />
    </Modal>
  )
}
