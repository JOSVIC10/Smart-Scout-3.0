'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { CustomVideoPlayer } from './CustomVideoPlayer'
import { MetricasN2Botonera } from './MetricasN2Botonera'
import { PitchMap } from './PitchMap'
import { VideoUploadModal } from './VideoUploadModal'
import { VideoAnalyticsSection, type YoloLayerOptions } from './VideoAnalyticsSection'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { useYoloMock } from './useYoloMock'
import { YoloOverlay } from './YoloOverlay'
import {
  Video,
  Play,
  Pause,
  Plus,
  Trash2,
  Tag,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  Users,
  BarChart2,
  Film,
  Keyboard,
  SkipBack,
  SkipForward,
  AlertCircle,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { obtenerVideos } from '@/lib/supabase/partidos'
import { obtenerJugadores } from '@/lib/supabase/jugadores'
import { obtenerMetricasN1PorPosicion } from '@/lib/supabase/metricas'
import { obtenerAccionesPorVideo, crearAccion, eliminarAccion } from '@/lib/supabase/acciones'
import { ZONA_LABELS, POSICION_LABELS, METRICAS_N2_POR_POSICION, CLIP_MARGINS, type MetricaN2Config } from '@/lib/constants'
import { calcularScore, calcularValorAccion } from '@/lib/scoring/calcularScore'
import type {
  Video as VideoType,
  JugadorConClub,
  MetricaNivel1,
  AccionConMetrica,
  ResultadoAccion,
  ZonaCampo,
} from '@/types/database'

// ————————————————————————————————————————————
// Helpers
// ————————————————————————————————————————————
function formatTime(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = Math.floor(totalSeconds % 60)
  if (h > 0) return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function tipoFuenteIcon(tipo: VideoType['tipo_fuente']) {
  switch (tipo) {
    case 'youtube': return <span className="text-[9px] font-bold text-red-400 border border-red-400/30 px-1 rounded">YT</span>
    case 'storage': return <span className="text-[9px] font-bold text-blue-400 border border-blue-400/30 px-1 rounded">STOR</span>
    default: return null
  }
}

// ————————————————————————————————————————————
// Main Component
// ————————————————————————————————————————————
interface VideoSectionProps {
  /** ID del modelo de juego activo — para recalcular el score al terminar etiquetado */
  activeModelId?: string
  /** Callback cuando el auto-recálculo actualiza el score de un jugador */
  onScoreUpdated?: (jugadorId: string, nuevoScore: number) => void
}

export function VideoSection({ activeModelId, onScoreUpdated }: VideoSectionProps) {
  // ——— Data state ———
  const [videos, setVideos] = useState<VideoType[]>([])
  const [selectedVideo, setSelectedVideo] = useState<VideoType | null>(null)
  const [jugadores, setJugadores] = useState<JugadorConClub[]>([])
  const [selectedJugador, setSelectedJugador] = useState<JugadorConClub | null>(null)
  const [metricasN1, setMetricasN1] = useState<MetricaNivel1[]>([])
  const [acciones, setAcciones] = useState<AccionConMetrica[]>([])
  const [loading, setLoading] = useState(true)

  // ——— Tagging state ———
  const [selectedMetricaN2, setSelectedMetricaN2] = useState<MetricaN2Config | null>(null)
  const [selectedMetricaN1, setSelectedMetricaN1] = useState<MetricaNivel1 | null>(null)
  const [resultado, setResultado] = useState<ResultadoAccion>('efectiva')
  const [selectedZona, setSelectedZona] = useState<ZonaCampo | null>(null)
  const [nota, setNota] = useState('')
  const [tagFeedback, setTagFeedback] = useState<'success' | 'error' | null>(null)
  const [savingAction, setSavingAction] = useState(false)
  // Feedback del auto-recálculo de score
  const [autoScoreFeedback, setAutoScoreFeedback] = useState<{ score: number; nombre: string } | null>(null)
  const [actionToDeleteId, setActionToDeleteId] = useState<string | null>(null)

  // ——— Player state ———
  const playerRef = useRef<any>(null)
  const [playedSeconds, setPlayedSeconds] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)

  // ——— UI state ———
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showKeyboardHints, setShowKeyboardHints] = useState(false)

  // ——— YOLO state ———
  const [isYoloActive, setIsYoloActive] = useState(false)
  const [yoloLayerOptions, setYoloLayerOptions] = useState<YoloLayerOptions>({
    showTracking: true,
    showPasses: true,
    showNames: true,
  })
  
  // ——— YOLO Mock Data ———
  const yoloData = useYoloMock(isYoloActive, playedSeconds)

  // ————————————————————————————————————————————
  // Initial load
  // ————————————————————————————————————————————
  useEffect(() => {
    async function loadInitial() {
      setLoading(true)
      try {
        const [vids, jugs] = await Promise.all([obtenerVideos(), obtenerJugadores()])
        setVideos(vids)
        setJugadores(jugs)
        if (vids.length > 0) setSelectedVideo(vids[0])
        if (jugs.length > 0) setSelectedJugador(jugs[0])
      } catch (err) {
        console.error('Error al cargar módulo de vídeo:', err)
      } finally {
        setLoading(false)
      }
    }
    loadInitial()
  }, [])

  // Load actions when video changes
  useEffect(() => {
    if (!selectedVideo) return
    obtenerAccionesPorVideo(selectedVideo.id).then(setAcciones).catch((err) => console.warn('[Vídeo] Error al cargar acciones:', err?.message ?? err))
  }, [selectedVideo])

  // Load N1 metrics (fallback) when player changes
  useEffect(() => {
    if (!selectedJugador) return
    obtenerMetricasN1PorPosicion(selectedJugador.posicion)
      .then((mets) => {
        setMetricasN1(mets)
        // Auto-select first N1 metric if none selected
        if (mets.length > 0 && !selectedMetricaN1) setSelectedMetricaN1(mets[0])
      })
      .catch((err) => console.warn('[Vídeo] Error al cargar métricas N1:', err?.message ?? err))

    // Reset N2 selection when player changes
    setSelectedMetricaN2(null)
  }, [selectedJugador])

  // ————————————————————————————————————————————
  // Keyboard shortcuts
  // ————————————————————————————————————————————
  // (Movido abajo, después de handleTagAction)

  // ————————————————————————————————————————————
  // Tag action handler
  // ————————————————————————————————————————————
  const handleTagAction = useCallback(async () => {
    if (!selectedVideo || !selectedJugador) return
    // Need at least a N2 metric selected (N1 is optional fallback)
    if (!selectedMetricaN2 && !selectedMetricaN1) return

    const min = Math.floor(playedSeconds / 60)
    const seg = Math.floor(playedSeconds % 60)

    // Find N1 metric for the selected N2 (use first N1 as fallback)
    const n1ToUse = selectedMetricaN1 ?? metricasN1[0]
    if (!n1ToUse) return

    // Try to find the N2 id from Supabase (async lookup by codigo)
    // For now we rely on the codigo convention; Supabase join will resolve via metrica_n2_id
    // The metrica_n2_id will be resolved by the metricas_nivel2 table — we send codigo
    // and the backend resolves; since we can't do a real-time lookup here without extra query,
    // we store null and rely on the user to have the metricas seeded by codigo.
    // The cleaner approach: lookup the N2 id before saving.
    let metrica_n2_id: string | null = null
    try {
      // Quick lookup: get the N2 record by codigo to get its UUID
      const { createClient } = await import('@supabase/supabase-js')
      // Use the already-initialized supabase client
      const { supabase } = await import('@/lib/supabase/client')
      const { data: n2Row } = await supabase
        .from('metricas_nivel2')
        .select('id')
        .eq('codigo', selectedMetricaN2?.codigo ?? '')
        .maybeSingle()
      metrica_n2_id = n2Row?.id ?? null
    } catch {
      // Non-critical: proceed without N2 id
    }

    setSavingAction(true)
    try {
      // 1. Calcular márgenes del clip
      const codigoN2 = selectedMetricaN2?.codigo ?? 'DEFAULT'
      const margins = CLIP_MARGINS[codigoN2] ?? CLIP_MARGINS.DEFAULT
      const clipStartSec = Math.max(0, playedSeconds - margins.preSeconds)
      const clipEndSec = playedSeconds + margins.postSeconds

      // 2. Calcular valor de la acción
      const valorAccion = calcularValorAccion(
        resultado,
        selectedJugador.posicion,
        codigoN2,
        selectedZona
      )

      // 3. Crear clip lógico (referencia temporal)
      let clipUrl = selectedVideo.url
      if (clipUrl) {
        try {
          const u = new URL(clipUrl)
          if (u.hostname.includes('youtube.com') || u.hostname.includes('youtu.be')) {
            u.searchParams.set('t', Math.floor(clipStartSec).toString())
          } else {
            u.hash = `t=${Math.floor(clipStartSec)}`
          }
          clipUrl = u.toString()
        } catch {
          // Ignorar si no es una URL válida
        }
      }

      await crearAccion({
        video_id: selectedVideo.id,
        jugador_id: selectedJugador.id,
        metrica_n1_id: n1ToUse.id,
        metrica_n2_id,
        minuto_video: min,
        segundo_video: seg,
        resultado,
        zona: selectedZona,
        nota: nota.trim() || null,
        clip_url: clipUrl,
        valor_accion: valorAccion,
        clip_start_sec: Math.round(clipStartSec * 1000) / 1000,
        clip_end_sec: Math.round(clipEndSec * 1000) / 1000,
      })

      const accs = await obtenerAccionesPorVideo(selectedVideo.id)
      setAcciones(accs)
      setNota('')
      setTagFeedback('success')
      setTimeout(() => setTagFeedback(null), 1500)

      // Recalcular score automáticamente al guardar una acción etiquetada
      if (activeModelId && selectedJugador) {
        const jId = selectedJugador.id
        const jNombre = `${selectedJugador.nombre} ${selectedJugador.apellidos}`
        calcularScore(jId, activeModelId)
          .then((resultado) => {
            // Propagar resultado
            onScoreUpdated?.(jId, resultado.score)
            // Mostrar badge de feedback durante 4s
            setAutoScoreFeedback({ score: resultado.score, nombre: jNombre })
            setTimeout(() => setAutoScoreFeedback(null), 4000)
          })
          .catch((err) =>
            console.warn('[Score] Recálculo automático falló (no crítico):', err?.message ?? err)
          )
      }
    } catch (err) {
      console.error('Error al registrar acción:', err instanceof Error ? err.message : String(err))
      setTagFeedback('error')
      setTimeout(() => setTagFeedback(null), 2000)
    } finally {
      setSavingAction(false)
    }
  }, [selectedVideo, selectedJugador, selectedMetricaN2, selectedMetricaN1, metricasN1, playedSeconds, resultado, selectedZona, nota])

  // ————————————————————————————————————————————
  // Keyboard shortcuts (Manejo de atajos de teclado)
  // ————————————————————————————————————————————
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't fire when typing in inputs/textareas
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) return

      switch (e.key) {
        case 'e':
        case 'E':
          e.preventDefault()
          setResultado('efectiva')
          break
        case 'n':
        case 'N':
          e.preventDefault()
          setResultado('no_efectiva')
          break
        case 'Enter':
          e.preventDefault()
          handleTagAction()
          break
        case 'ArrowLeft':
          e.preventDefault()
          if (playerRef.current) playerRef.current.currentTime = Math.max(0, playedSeconds - 5)
          break
        case 'ArrowRight':
          e.preventDefault()
          if (playerRef.current) playerRef.current.currentTime = playedSeconds + 5
          break
        case ' ':
          // Space is handled by the native video player, don't override
          break
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [playedSeconds, selectedVideo, selectedJugador, selectedMetricaN2, selectedMetricaN1, resultado, selectedZona, nota, handleTagAction])

  const handleConfirmDeleteAction = async () => {
    if (!actionToDeleteId) return
    try {
      await eliminarAccion(actionToDeleteId)
      if (selectedVideo) {
        const accs = await obtenerAccionesPorVideo(selectedVideo.id)
        setAcciones(accs)
      }
      if (activeModelId && selectedJugador) {
        const jId = selectedJugador.id
        const jNombre = `${selectedJugador.nombre} ${selectedJugador.apellidos}`
        calcularScore(jId, activeModelId)
          .then((resultado) => {
            onScoreUpdated?.(jId, resultado.score)
            setAutoScoreFeedback({ score: resultado.score, nombre: jNombre })
            setTimeout(() => setAutoScoreFeedback(null), 4000)
          })
          .catch((err) =>
            console.warn('[Score] Recálculo automático tras borrado falló:', err?.message ?? err)
          )
      }
    } catch (err) {
      console.error('Error al eliminar acción:', err)
    } finally {
      setActionToDeleteId(null)
    }
  }

  const seekToTimestamp = (min: number, seg: number) => {
    const totalSeg = min * 60 + seg
    if (playerRef.current) playerRef.current.currentTime = totalSeg
  }

  const handleVideoCreated = (video: VideoType) => {
    setVideos(prev => [video, ...prev])
    setSelectedVideo(video)
    setPlayedSeconds(0)
    setAcciones([])
  }

  // Stats derived from acciones
  const totalAcciones = acciones.length
  const efectivas = acciones.filter(a => a.resultado === 'efectiva').length
  const pctEfectividad = totalAcciones > 0 ? Math.round((efectivas / totalAcciones) * 100) : 0

  // ————————————————————————————————————————————
  // RENDER
  // ————————————————————————————————————————————
  return (
    <div className="space-y-4">
      {/* ——— Top Bar: Video selector + Add button ——— */}
      <div className="p-3 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs transition-colors">
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
            <Film className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">Análisis de Vídeo</h2>
          <Badge variant="secondary" size="sm">{videos.length} vídeos</Badge>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Video selector */}
          <div className="flex-1 sm:w-72">
            <Select
              value={selectedVideo?.id ?? ''}
              onChange={(e) => {
                const v = videos.find((item) => item.id === e.target.value)
                if (v) {
                  setSelectedVideo(v)
                  setPlayedSeconds(0)
                  setAcciones([])
                }
              }}
              options={videos.map((v) => ({
                value: v.id,
                label: v.titulo,
              }))}
              placeholder="Seleccionar vídeo..."
            />
          </div>

          {/* Add video button */}
          <Button
            variant="primary"
            size="sm"
            icon={<Plus className="w-3.5 h-3.5" />}
            onClick={() => setShowUploadModal(true)}
          >
            Añadir
          </Button>
        </div>
      </div>

      {/* ——— Auto-score feedback badge ——— */}
      {autoScoreFeedback && (
        <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/40 animate-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-2 text-xs text-emerald-300">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold">Score actualizado automáticamente:</span>
            <span className="text-slate-300">{autoScoreFeedback.nombre}</span>
          </div>
          <span className="font-black text-emerald-400 text-lg px-2 py-0.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30">
            {autoScoreFeedback.score}
            <span className="text-xs font-normal text-slate-400">/100</span>
          </span>
        </div>
      )}

      {/* ——— Main Grid: Player (left 2/3) + Tagging Panel (right 1/3) ——— */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* ========================================================= */}
        {/* LEFT COLUMN: Video Player + Actions Table                  */}
        {/* ========================================================= */}
        <div className="xl:col-span-2 space-y-4">

          {/* ——— Video Player Card ——— */}
          <Card className="overflow-hidden bg-black border-slate-800">
            <div className="aspect-video relative bg-slate-950">
              {selectedVideo?.url ? (
                <>
                  <CustomVideoPlayer
                    playerRef={playerRef}
                    url={selectedVideo.url}
                    onProgress={(state) => setPlayedSeconds(state.playedSeconds)}
                    onDuration={setDuration}
                    playing={isPlaying}
                    onPlayPause={setIsPlaying}
                  />
                  {isYoloActive && (
                    <YoloOverlay
                      data={yoloData}
                      showTracking={yoloLayerOptions.showTracking}
                      showPasses={yoloLayerOptions.showPasses}
                      showNames={yoloLayerOptions.showNames}
                    />
                  )}
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 space-y-3">
                  <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center">
                    <Film className="w-8 h-8 stroke-1 text-slate-600" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-slate-400">Sin vídeo seleccionado</p>
                    <p className="text-xs text-slate-600 mt-1">
                      Selecciona un vídeo o añade uno nuevo con el botón superior
                    </p>
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    icon={<Plus className="w-3.5 h-3.5" />}
                    onClick={() => setShowUploadModal(true)}
                  >
                    Añadir Vídeo
                  </Button>
                </div>
              )}
            </div>

            {/* Player controls bar */}
            <div className="px-4 py-2 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3">
              {/* Timestamp + seek controls */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => { if (playerRef.current) playerRef.current.currentTime = Math.max(0, playedSeconds - 5) }}
                  className="p-1 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors"
                  title="Retroceder 5s (←)"
                >
                  <SkipBack className="w-3.5 h-3.5" />
                </button>

                <div className="flex items-center gap-1.5 font-mono">
                  <span className="text-emerald-400 font-bold text-sm tracking-wider">
                    {formatTime(playedSeconds)}
                  </span>
                  {duration > 0 && (
                    <span className="text-slate-600 text-xs">
                      / {formatTime(duration)}
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => { if (playerRef.current) playerRef.current.currentTime = playedSeconds + 5 }}
                  className="p-1 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors"
                  title="Avanzar 5s (→)"
                >
                  <SkipForward className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Video title + type badge */}
              <div className="flex items-center gap-2 min-w-0">
                {selectedVideo && tipoFuenteIcon(selectedVideo.tipo_fuente)}
                <span className="text-[10px] text-slate-500 truncate max-w-[180px]">
                  {selectedVideo?.titulo ?? 'Sin vídeo'}
                </span>
              </div>

              {/* Keyboard hints toggle */}
              <button
                type="button"
                onClick={() => setShowKeyboardHints(prev => !prev)}
                className={`p-1.5 rounded-lg transition-colors text-xs ${
                  showKeyboardHints
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'text-slate-600 hover:text-slate-400 hover:bg-slate-800'
                }`}
                title="Atajos de teclado"
              >
                <Keyboard className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Keyboard hints panel */}
            {showKeyboardHints && (
              <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-800">
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Atajos de teclado</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { key: 'E', desc: 'Marcar Efectiva' },
                    { key: 'N', desc: 'Marcar No Efectiva' },
                    { key: 'Enter', desc: 'Registrar Acción' },
                    { key: '← →', desc: 'Retroceder/Avanzar 5s' },
                  ].map(({ key, desc }) => (
                    <div key={key} className="flex items-center gap-1.5">
                      <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-[10px] font-mono font-bold text-slate-700 dark:text-slate-300">
                        {key}
                      </kbd>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">{desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>

          {/* ——— Tagged Actions Table ——— */}
          <Card>
            <CardHeader className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <Tag className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Acciones Etiquetadas
              </CardTitle>

              {/* Stats summary */}
              {totalAcciones > 0 && (
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">{efectivas}</span>/{totalAcciones} efectivas
                  </span>
                  <div className="flex items-center gap-1">
                    <div className="w-16 h-1 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-emerald-500 transition-all"
                        style={{ width: `${pctEfectividad}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">{pctEfectividad}%</span>
                  </div>
                  <Badge variant="primary" size="sm">{totalAcciones}</Badge>
                </div>
              )}
            </CardHeader>

            <CardContent className="p-0">
              {acciones.length > 0 ? (
                <div className="divide-y divide-slate-200 dark:divide-slate-800/60 max-h-[340px] overflow-y-auto">
                  {acciones.map((acc) => (
                    <div
                      key={acc.id}
                      className="px-4 py-2.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors group"
                    >
                      {/* Left: timestamp + metric info */}
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Timestamp button — seeks to clip */}
                        <button
                          onClick={() => seekToTimestamp(acc.minuto_video, acc.segundo_video)}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/25 font-mono font-bold text-xs hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-all hover:scale-105 shrink-0"
                          title="Saltar al minuto en el reproductor"
                        >
                          <Play className="w-2.5 h-2.5" />
                          {String(acc.minuto_video).padStart(2, '0')}:{String(acc.segundo_video).padStart(2, '0')}
                        </button>

                        {/* Metric name + zone */}
                        <div className="min-w-0">
                          {/* N2 metric (primary) */}
                          {acc.metrica_n2 && (
                            <p className="text-[11px] font-bold text-slate-900 dark:text-slate-200 truncate">
                              {acc.metrica_n2.nombre}
                            </p>
                          )}
                          {/* N1 metric (fallback / secondary) */}
                          <p className={`truncate ${acc.metrica_n2 ? 'text-[9px] text-slate-500 dark:text-slate-400' : 'text-[11px] font-bold text-slate-900 dark:text-slate-200'}`}>
                            {acc.metrica_n1?.nombre}
                          </p>
                          {/* Zone */}
                          {acc.zona && (
                            <p className="text-[9px] text-slate-500 flex items-center gap-1 mt-0.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-600 inline-block" />
                              {ZONA_LABELS[acc.zona]}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Right: resultado badge + delete */}
                      <div className="flex items-center gap-2 shrink-0">
                        {acc.valor_accion !== undefined && acc.valor_accion !== null && (
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${Number(acc.valor_accion) >= 1 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : Number(acc.valor_accion) >= 0.5 ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-slate-800 text-slate-400 border-slate-700'}`} title="Valor de la acción">
                            {Number(acc.valor_accion).toFixed(3)}
                          </span>
                        )}
                        {acc.clip_url && (
                          <div className="w-5 h-5 rounded flex items-center justify-center bg-slate-800/50 border border-slate-700" title="Clip generado (referencia temporal)">
                            <Film className="w-3 h-3 text-slate-400" />
                          </div>
                        )}
                        <Badge
                          variant={acc.resultado === 'efectiva' ? 'success' : 'danger'}
                          size="sm"
                        >
                          {acc.resultado === 'efectiva' ? '✓' : '✗'}
                        </Badge>

                        <button
                          onClick={() => setActionToDeleteId(acc.id)}
                          className="p-1 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                          title="Eliminar acción"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 text-slate-500 space-y-2">
                  <Tag className="w-8 h-8 mx-auto stroke-1 text-slate-700" />
                  <p className="text-xs">Sin acciones etiquetadas para este vídeo.</p>
                  <p className="text-[10px] text-slate-600">Usa el panel lateral para registrar la primera.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ——— Telemetría del Partido ——— */}
          <VideoAnalyticsSection 
            partidoId={selectedVideo?.partido_id ?? null}
            isActive={isYoloActive}
            onToggleActive={() => setIsYoloActive(!isYoloActive)}
            yoloData={yoloData}
            layerOptions={yoloLayerOptions}
            setLayerOptions={setYoloLayerOptions}
          />
        </div>

        {/* ========================================================= */}
        {/* RIGHT COLUMN: Tagging Control Panel                        */}
        {/* ========================================================= */}
        <div className="space-y-4">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Tag className="w-4 h-4 text-emerald-400" />
                Panel de Etiquetado
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4 pb-5">
              {/* —— Step 1: Player selector —— */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[9px] font-black">1</span>
                  Jugador Evaluado
                </label>
                <Select
                  value={selectedJugador?.id ?? ''}
                  onChange={(e) => {
                    const j = jugadores.find((item) => item.id === e.target.value)
                    if (j) setSelectedJugador(j)
                  }}
                  options={jugadores.map((j) => ({
                    value: j.id,
                    label: `${j.nombre} ${j.apellidos}`,
                  }))}
                  placeholder="Seleccionar jugador..."
                />
                {selectedJugador && (
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="primary" size="sm">
                      {POSICION_LABELS[selectedJugador.posicion]}
                    </Badge>
                    {selectedJugador.club && (
                      <span className="text-[10px] text-slate-500">{selectedJugador.club.nombre}</span>
                    )}
                  </div>
                )}
              </div>

              {/* —— Step 2: N2 Metrics botonera —— */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[9px] font-black">2</span>
                  Acción (Métrica N2)
                </label>
                {selectedJugador ? (
                  <MetricasN2Botonera
                    posicion={selectedJugador.posicion}
                    selectedCodigo={selectedMetricaN2?.codigo ?? null}
                    onSelect={(m) => {
                      setSelectedMetricaN2(m)
                      // Auto-match N1 by grupo if possible
                      const matchingN1 = metricasN1.find(n1 => n1.grupo === m.grupo)
                      if (matchingN1) setSelectedMetricaN1(matchingN1)
                    }}
                  />
                ) : (
                  <p className="text-xs text-slate-500 text-center py-3">
                    Selecciona un jugador para ver sus métricas
                  </p>
                )}
              </div>

              {/* —— Step 3: Resultado toggle —— */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-[9px] font-black">3</span>
                  Resultado
                  <span className="text-[9px] text-slate-500 dark:text-slate-600 font-normal ml-auto">E / N</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setResultado('efectiva')}
                    className={`py-2.5 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1.5 ${
                      resultado === 'efectiva'
                        ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-500/50 shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-900/60 text-slate-600 dark:text-slate-500 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:text-slate-900 dark:hover:text-slate-300'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Efectiva
                  </button>
                  <button
                    type="button"
                    onClick={() => setResultado('no_efectiva')}
                    className={`py-2.5 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1.5 ${
                      resultado === 'no_efectiva'
                        ? 'bg-red-50 dark:bg-red-500/20 text-red-700 dark:text-red-400 border-red-300 dark:border-red-500/50 shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-900/60 text-slate-600 dark:text-slate-500 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:text-slate-900 dark:hover:text-slate-300'
                    }`}
                  >
                    <XCircle className="w-4 h-4" />
                    No Efectiva
                  </button>
                </div>
              </div>

              {/* —— Step 4: PitchMap —— */}
              <div>
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                  <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-[9px] font-black">4</span>
                  Zona del Campo
                </label>
                <PitchMap
                  selectedZona={selectedZona}
                  onZonaChange={setSelectedZona}
                  compact
                />
              </div>

              {/* —— Step 5: Optional note —— */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-400 flex items-center justify-center text-[9px] font-black">5</span>
                  Nota
                  <span className="text-[9px] text-slate-500 dark:text-slate-600 font-normal">(opcional)</span>
                </label>
                <textarea
                  value={nota}
                  onChange={e => setNota(e.target.value)}
                  placeholder="Contexto o observación adicional..."
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-300 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/20 transition-all resize-none shadow-xs"
                />
              </div>

              {/* —— Register Button —— */}
              <button
                type="button"
                onClick={handleTagAction}
                disabled={
                  savingAction ||
                  !selectedVideo ||
                  !selectedJugador ||
                  (!selectedMetricaN2 && !selectedMetricaN1)
                }
                className={`
                  w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 border shadow-xs
                  ${tagFeedback === 'success'
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : tagFeedback === 'error'
                      ? 'bg-red-600 text-white border-red-600'
                      : savingAction
                        ? 'bg-emerald-500/20 text-emerald-600 border-emerald-500/30 cursor-not-allowed'
                        : (!selectedVideo || !selectedJugador || (!selectedMetricaN2 && !selectedMetricaN1))
                          ? 'bg-slate-100 dark:bg-slate-900/40 text-slate-400 dark:text-slate-600 border-slate-200 dark:border-slate-800 cursor-not-allowed'
                          : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-600 shadow-md hover:shadow-lg'
                  }
                `}
              >
                {savingAction ? (
                  <>
                    <span className="w-4 h-4 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin" />
                    Guardando...
                  </>
                ) : tagFeedback === 'success' ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    ¡Acción registrada!
                  </>
                ) : tagFeedback === 'error' ? (
                  <>
                    <AlertCircle className="w-4 h-4" />
                    Error — Reintentar
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Registrar en {formatTime(playedSeconds)}
                    <kbd className="ml-auto text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 font-mono">
                      Enter
                    </kbd>
                  </>
                )}
              </button>

              {/* Validation hints */}
              {(!selectedVideo || !selectedJugador || (!selectedMetricaN2 && !selectedMetricaN1)) && (
                <div className="flex items-start gap-1.5 text-[10px] text-slate-500">
                  <AlertCircle className="w-3 h-3 shrink-0 mt-0.5" />
                  <span>
                    {!selectedVideo ? 'Selecciona un vídeo' :
                     !selectedJugador ? 'Selecciona un jugador' :
                     'Selecciona una acción (métrica N2)'}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ——— Upload Modal ——— */}
      <VideoUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onVideoCreated={handleVideoCreated}
      />

      {/* ——— Confirm Modal Borrado Acción ——— */}
      <ConfirmModal
        isOpen={!!actionToDeleteId}
        onClose={() => setActionToDeleteId(null)}
        onConfirm={handleConfirmDeleteAction}
        title="Eliminar Acción Etiquetada"
        message="¿Estás seguro de que deseas eliminar esta acción etiquetada? Esta acción se descontará del cálculo de score del jugador."
        confirmText="Eliminar Acción"
        variant="danger"
      />
    </div>
  )
}
