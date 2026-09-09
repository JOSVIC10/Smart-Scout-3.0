'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import {
  RotateCcw,
  Sparkles,
  ShieldCheck,
  Eye,
  CheckCircle2,
  Clock,
  Award,
  ChevronRight,
  TrendingUp,
  Loader2,
  Activity,
  FileText,
  Globe,
  Check,
  ExternalLink,
  Search,
  ChevronDown,
  Star,
  Play,
  RefreshCw,
  Zap,
  AlertCircle,
  Calendar,
  Trophy,
  MapPin,
  Users
} from 'lucide-react'
import { ejecutarRecalculoJornada, type ResumenRecalculoJornada } from '@/lib/jornadas/recalcularJornada'
import { obtenerClubes } from '@/lib/supabase/clubes'
import {
  obtenerTemporadaActual,
  TEMPORADAS,
  COMPETICIONES_BESOCCER,
  temporadaAAnoBeSoccer
} from '@/lib/constants'
import type { Club } from '@/types/database'
import type { ActaPartidoResponse, JugadorActa } from '@/app/api/partidos/importar-acta/route'

// ============================================================================
// Types
// ============================================================================

interface PartidoDirectorio {
  matchId: string
  url: string
  urlInforme: string
  local: string
  visitante: string
  golesLocal: number | null
  golesVisitante: number | null
  resultado: string
  estado: string
  fecha: string
  escudoLocal?: string
  escudoVisitante?: string
}

interface RecalcularJornadaModalProps {
  isOpen: boolean
  onClose: () => void
  activeModelId?: string
  activeModelName?: string
  onRecalculoCompletado?: () => void
}

// ============================================================================
// Component
// ============================================================================

export function RecalcularJornadaModal({
  isOpen,
  onClose,
  activeModelId,
  activeModelName = 'Posesión (4-3-3)',
  onRecalculoCompletado,
}: RecalcularJornadaModalProps) {
  // Navigation selectors
  const [temporada, setTemporada] = useState(obtenerTemporadaActual())
  const [competicionIdx, setCompeticionIdx] = useState(0) // Index in COMPETICIONES_BESOCCER
  const [grupoIdx, setGrupoIdx] = useState(4) // Default: Grupo 5 (index 4)
  const [jornada, setJornada] = useState<number>(1)
  const [totalJornadas, setTotalJornadas] = useState(34)

  // Directory state
  const [partidos, setPartidos] = useState<PartidoDirectorio[]>([])
  const [cargandoDirectorio, setCargandoDirectorio] = useState(false)
  const [errorDirectorio, setErrorDirectorio] = useState<string | null>(null)

  // Club matching
  const [clubPropio, setClubPropio] = useState<Club | null>(null)
  const [clubesObservados, setClubesObservados] = useState<Club[]>([])

  // Mode and state
  const [modo, setModo] = useState<'explorador' | 'manual' | 'estimado'>('explorador')
  const [showManualInput, setShowManualInput] = useState(false)

  // Manual URL input (for matches not in directory)
  const [urlActa, setUrlActa] = useState('')
  const [cargandoActa, setCargandoActa] = useState(false)
  const [aplicandoActa, setAplicandoActa] = useState(false)
  const [actaPrevia, setActaPrevia] = useState<ActaPartidoResponse | null>(null)
  const [actaAplicada, setActaAplicada] = useState<ActaPartidoResponse | null>(null)

  // Batch sync state
  const [sincronizandoId, setSincronizandoId] = useState<string | null>(null)
  const [sincronizandoTodos, setSincronizandoTodos] = useState(false)
  const [partidosSincronizados, setPartidosSincronizados] = useState<Set<string>>(new Set())
  const [totalSincronizados, setTotalSincronizados] = useState(0)

  // Execution state (Estimado)
  const [ejecutando, setEjecutando] = useState(false)
  const [etapaTexto, setEtapaTexto] = useState('')
  const [progresoPct, setProgresoPct] = useState(0)
  const [faseActual, setFaseActual] = useState<1 | 2 | 3>(1)
  const [resumen, setResumen] = useState<ResumenRecalculoJornada | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Derived
  const competicion = COMPETICIONES_BESOCCER[competicionIdx]
  const grupo = competicion?.grupos[grupoIdx]

  // ================================================================
  // Load clubs on open
  // ================================================================
  useEffect(() => {
    if (isOpen) {
      setError(null)
      setResumen(null)
      setActaPrevia(null)
      setActaAplicada(null)
      setEjecutando(false)
      setCargandoActa(false)
      setAplicandoActa(false)
      setProgresoPct(0)
      setFaseActual(1)
      setPartidosSincronizados(new Set())
      setTotalSincronizados(0)
      setSincronizandoId(null)
      setSincronizandoTodos(false)

      obtenerClubes()
        .then((clbs) => {
          const propio = clbs.find((c) => c.nombre.toLowerCase().includes('grama')) || clbs[0]
          setClubPropio(propio || null)
          setClubesObservados(clbs.filter(c => c.id !== propio?.id))
        })
        .catch(console.error)
    }
  }, [isOpen])

  // ================================================================
  // Fetch directory when selectors change
  // ================================================================
  const fetchDirectorio = useCallback(async () => {
    if (!competicion || !grupo) return
    setCargandoDirectorio(true)
    setErrorDirectorio(null)
    setPartidos([])

    try {
      const params = new URLSearchParams({
        competicion: competicion.slug,
        grupo: grupo.slug,
        temporada,
        jornada: jornada.toString()
      })

      const res = await fetch(`/api/partidos/directorio-besoccer?${params}`)
      const data = await res.json()

      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Error al consultar el directorio de BeSoccer')
      }

      setPartidos(data.partidos || [])
      if (data.totalJornadas) setTotalJornadas(data.totalJornadas)
    } catch (err: any) {
      console.error('Error fetching directory:', err)
      setErrorDirectorio(err?.message || 'No se pudo cargar el directorio de partidos')
    } finally {
      setCargandoDirectorio(false)
    }
  }, [competicion, grupo, temporada, jornada])

  useEffect(() => {
    if (isOpen && modo === 'explorador') {
      fetchDirectorio()
    }
  }, [isOpen, modo, fetchDirectorio])

  // ================================================================
  // Check if a team is our club or an observed one
  // ================================================================
  const isNuestroClub = (teamName: string) => {
    if (!clubPropio) return false
    const tNorm = teamName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    const cNorm = clubPropio.nombre.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    return tNorm.includes(cNorm) || cNorm.includes(tNorm)
  }

  const isClubObservado = (teamName: string) => {
    const tNorm = teamName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    return clubesObservados.some(c => {
      const cNorm = c.nombre.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      return tNorm.includes(cNorm) || cNorm.includes(tNorm)
    })
  }

  // ================================================================
  // Sync a single match
  // ================================================================
  const handleSincronizarPartido = async (partido: PartidoDirectorio) => {
    setSincronizandoId(partido.matchId)
    setError(null)
    try {
      const res = await fetch('/api/partidos/importar-acta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: partido.urlInforme,
          guardarEnBD: true,
          jornada
        })
      })
      const data = await res.json()
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Error al sincronizar el partido')
      }

      setPartidosSincronizados(prev => new Set([...prev, partido.matchId]))
      setTotalSincronizados(prev => prev + (data.jugadoresActualizados?.length || 0))
      onRecalculoCompletado?.()
    } catch (err: any) {
      console.error('Error syncing match:', err)
      setError(err?.message || 'Error al sincronizar el partido')
    } finally {
      setSincronizandoId(null)
    }
  }

  // ================================================================
  // Sync all matches in the jornada
  // ================================================================
  const handleSincronizarTodos = async () => {
    setSincronizandoTodos(true)
    setError(null)
    let total = 0

    for (const partido of partidos) {
      if (partidosSincronizados.has(partido.matchId)) continue
      if (partido.estado === 'Pendiente' || partido.golesLocal === null) continue

      try {
        const res = await fetch('/api/partidos/importar-acta', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: partido.urlInforme,
            guardarEnBD: true,
            jornada
          })
        })
        const data = await res.json()
        if (res.ok && data.ok) {
          setPartidosSincronizados(prev => new Set([...prev, partido.matchId]))
          total += (data.jugadoresActualizados?.length || 0)
        }
      } catch (err) {
        console.warn(`Error syncing ${partido.local} vs ${partido.visitante}:`, err)
      }
    }

    setTotalSincronizados(prev => prev + total)
    setSincronizandoTodos(false)
    onRecalculoCompletado?.()
  }

  // ================================================================
  // Manual URL handlers
  // ================================================================
  const handleAnalizarActa = async () => {
    if (!urlActa) return
    setCargandoActa(true)
    setError(null)
    try {
      const res = await fetch('/api/partidos/importar-acta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlActa, guardarEnBD: false, jornada })
      })
      const data: ActaPartidoResponse = await res.json()
      if (!res.ok || (data as any).error) {
        throw new Error((data as any).error || 'Error al analizar el acta del partido')
      }
      setActaPrevia(data)
    } catch (err: any) {
      console.error('Error al analizar acta:', err)
      setError(err?.message || 'No se pudo obtener el acta del partido')
    } finally {
      setCargandoActa(false)
    }
  }

  const handleAplicarActa = async () => {
    if (!urlActa) return
    setAplicandoActa(true)
    setError(null)
    try {
      const res = await fetch('/api/partidos/importar-acta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlActa, guardarEnBD: true, jornada })
      })
      const data: ActaPartidoResponse = await res.json()
      if (!res.ok || (data as any).error) {
        throw new Error((data as any).error || 'Error al aplicar estadísticas del acta')
      }
      setActaAplicada(data)
      onRecalculoCompletado?.()
    } catch (err: any) {
      console.error('Error al aplicar acta:', err)
      setError(err?.message || 'No se pudieron aplicar las estadísticas del partido')
    } finally {
      setAplicandoActa(false)
    }
  }

  const handleIniciarRecalculo = async () => {
    setEjecutando(true)
    setError(null)
    setResumen(null)
    setProgresoPct(5)
    setFaseActual(1)

    try {
      const resultado = await ejecutarRecalculoJornada({
        jornada,
        clubPropioId: clubPropio?.id,
        modeloId: activeModelId,
        onProgress: (etapa, pct) => {
          setEtapaTexto(etapa)
          setProgresoPct(pct)
          if (pct < 50) setFaseActual(1)
          else if (pct < 95) setFaseActual(2)
          else setFaseActual(3)
        },
      })

      setResumen(resultado)
      onRecalculoCompletado?.()
    } catch (err: any) {
      console.error('Error durante el recálculo de la jornada:', err)
      setError(err?.message || 'Ocurrió un error al procesar el recálculo de la jornada')
    } finally {
      setEjecutando(false)
    }
  }

  const handleCerrar = () => {
    if (ejecutando || aplicandoActa || sincronizandoTodos) return
    onClose()
  }

  // ================================================================
  // Render
  // ================================================================
  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCerrar}
      title="Cierre y Recálculo de Jornada"
      size="3xl"
    >
      <div className="space-y-4">
        {/* ============================================================ */}
        {/* Mode Tabs */}
        {/* ============================================================ */}
        {!actaAplicada && !resumen && !ejecutando && (
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold">
            <button
              onClick={() => setModo('explorador')}
              className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-all ${
                modo === 'explorador'
                  ? 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Search className="w-4 h-4" />
              <span>Explorador BeSoccer</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold">Automático</span>
            </button>
            <button
              onClick={() => setModo('manual')}
              className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-all ${
                modo === 'manual'
                  ? 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>URL Manual</span>
            </button>
            <button
              onClick={() => setModo('estimado')}
              className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-all ${
                modo === 'estimado'
                  ? 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <RotateCcw className="w-4 h-4" />
              <span>Estimado</span>
            </button>
          </div>
        )}

        {/* ============================================================ */}
        {/* MODE 1: EXPLORADOR BESOCCER */}
        {/* ============================================================ */}
        {modo === 'explorador' && !actaAplicada && !resumen && !ejecutando && (
          <div className="space-y-4">
            {/* Selector Bar */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {/* Temporada */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    <Calendar className="w-3 h-3 inline mr-1" />Temporada
                  </label>
                  <Select
                    value={temporada}
                    onChange={(e) => setTemporada(e.target.value as typeof temporada)}
                    options={TEMPORADAS.map(t => ({ value: t, label: t }))}
                  />
                </div>
                {/* Competición */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    <Trophy className="w-3 h-3 inline mr-1" />Competición
                  </label>
                  <Select
                    value={competicionIdx.toString()}
                    onChange={(e) => { setCompeticionIdx(parseInt(e.target.value)); setGrupoIdx(0) }}
                    options={COMPETICIONES_BESOCCER.map((c, i) => ({ value: i.toString(), label: c.nombre }))}
                  />
                </div>
                {/* Grupo */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    <MapPin className="w-3 h-3 inline mr-1" />Grupo
                  </label>
                  <Select
                    value={grupoIdx.toString()}
                    onChange={(e) => setGrupoIdx(parseInt(e.target.value))}
                    options={competicion?.grupos.map((g, i) => ({ value: i.toString(), label: g.nombre })) || []}
                  />
                </div>
                {/* Jornada */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    <Activity className="w-3 h-3 inline mr-1" />Jornada
                  </label>
                  <div className="flex items-center gap-1">
                    <Select
                      value={jornada.toString()}
                      onChange={(e) => setJornada(parseInt(e.target.value) || 1)}
                      options={Array.from({ length: totalJornadas }, (_, i) => ({
                        value: (i + 1).toString(),
                        label: `Jor. ${i + 1}`,
                      }))}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={fetchDirectorio}
                      title="Recargar"
                      className="shrink-0 h-9 w-9 p-0 flex items-center justify-center"
                      disabled={cargandoDirectorio}
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${cargandoDirectorio ? 'animate-spin' : ''}`} />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Loading State */}
            {cargandoDirectorio && (
              <div className="py-8 text-center space-y-3">
                <Loader2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400 animate-spin mx-auto" />
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Consultando directorio de resultados de BeSoccer...
                </p>
              </div>
            )}

            {/* Error State */}
            {errorDirectorio && !cargandoDirectorio && (
              <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-300 text-xs flex items-start gap-3">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Error al consultar el directorio</p>
                  <p className="mt-1">{errorDirectorio}</p>
                  <Button variant="ghost" size="sm" onClick={fetchDirectorio} className="mt-2 text-red-600 dark:text-red-400">
                    Reintentar
                  </Button>
                </div>
              </div>
            )}

            {/* Match Cards */}
            {!cargandoDirectorio && !errorDirectorio && partidos.length > 0 && (
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
                    <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    Partidos Jornada {jornada} — {competicion?.nombre} {grupo?.nombre}
                  </h4>
                  <span className="text-[10px] text-slate-500">{partidos.length} partidos</span>
                </div>

                {/* Sync All Button */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-500/30">
                  <div className="text-xs text-emerald-800 dark:text-emerald-300">
                    <span className="font-bold">Sincronización en lote:</span> Procesa todas las actas de la jornada de una sola vez.
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleSincronizarTodos}
                    disabled={sincronizandoTodos || sincronizandoId !== null}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shrink-0"
                  >
                    {sincronizandoTodos ? (
                      <><Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />Sincronizando...</>
                    ) : (
                      <><Zap className="w-3.5 h-3.5 mr-1.5" />Sincronizar Toda la Jornada</>
                    )}
                  </Button>
                </div>

                {/* Sync progress */}
                {totalSincronizados > 0 && (
                  <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-700 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="font-bold">{partidosSincronizados.size} partidos procesados</span> —
                    <span>{totalSincronizados} fichas de jugadores actualizadas</span>
                  </div>
                )}

                {/* Match List */}
                <div className="max-h-[350px] overflow-y-auto space-y-2 pr-1">
                  {partidos.map((partido) => {
                    const esNuestro = isNuestroClub(partido.local) || isNuestroClub(partido.visitante)
                    const tieneObservado = isClubObservado(partido.local) || isClubObservado(partido.visitante)
                    const yaSincronizado = partidosSincronizados.has(partido.matchId)
                    const sincronizando = sincronizandoId === partido.matchId

                    return (
                      <div
                        key={partido.matchId}
                        className={`p-3 rounded-xl border transition-all ${
                          esNuestro
                            ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-500/40 ring-1 ring-emerald-200 dark:ring-emerald-800/50'
                            : tieneObservado
                            ? 'bg-blue-50/30 dark:bg-blue-950/10 border-blue-200 dark:border-blue-500/30'
                            : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800'
                        } ${yaSincronizado ? 'opacity-60' : ''}`}
                      >
                        <div className="flex items-center justify-between">
                          {/* Match info */}
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            {/* Badges */}
                            <div className="flex flex-col items-center gap-1 shrink-0">
                              {esNuestro && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500 text-white font-bold flex items-center gap-0.5">
                                  <Star className="w-2.5 h-2.5" />Nuestro
                                </span>
                              )}
                              {tieneObservado && !esNuestro && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-blue-500 text-white font-bold flex items-center gap-0.5">
                                  <Eye className="w-2.5 h-2.5" />Observado
                                </span>
                              )}
                            </div>

                            {/* Teams and score */}
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              {partido.escudoLocal && (
                                <img
                                  src={partido.escudoLocal}
                                  alt=""
                                  className="w-5 h-5 object-contain shrink-0 rounded-xs"
                                  onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none' }}
                                />
                              )}
                              <span className={`text-xs font-bold truncate ${
                                isNuestroClub(partido.local) ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-800 dark:text-slate-200'
                              }`}>
                                {partido.local}
                              </span>

                              {/* Score */}
                              <span className={`text-sm font-black font-mono px-2 py-0.5 rounded-lg shrink-0 ${
                                partido.golesLocal !== null
                                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100'
                                  : 'bg-slate-50 dark:bg-slate-900 text-slate-400'
                              }`}>
                                {partido.golesLocal !== null
                                  ? `${partido.golesLocal} - ${partido.golesVisitante}`
                                  : '— – —'}
                              </span>

                              {partido.escudoVisitante && (
                                <img
                                  src={partido.escudoVisitante}
                                  alt=""
                                  className="w-5 h-5 object-contain shrink-0 rounded-xs"
                                  onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none' }}
                                />
                              )}
                              <span className={`text-xs font-bold truncate ${
                                isNuestroClub(partido.visitante) ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-800 dark:text-slate-200'
                              }`}>
                                {partido.visitante}
                              </span>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2 shrink-0 ml-2">
                            {/* Status badge */}
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                              partido.estado === 'FIN'
                                ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                                : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400'
                            }`}>
                              {partido.estado}
                            </span>

                            {/* Sync button */}
                            {yaSincronizado ? (
                              <span className="text-[10px] px-2 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1">
                                <Check className="w-3 h-3" />Sincronizado
                              </span>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleSincronizarPartido(partido)}
                                disabled={sincronizando || sincronizandoTodos || partido.golesLocal === null}
                                className="text-[10px] h-7 px-2.5 font-bold"
                                title="Sincronizar acta de este partido"
                              >
                                {sincronizando ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <><Play className="w-3 h-3 mr-1" />Sincronizar</>
                                )}
                              </Button>
                            )}

                            {/* External link */}
                            <a
                              href={partido.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                              title="Ver en BeSoccer"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        </div>

                        {/* Date */}
                        {partido.fecha && (
                          <p className="text-[10px] text-slate-400 mt-1 ml-8">
                            {partido.fecha}
                          </p>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* No matches found */}
            {!cargandoDirectorio && !errorDirectorio && partidos.length === 0 && (
              <div className="py-8 text-center space-y-2">
                <Search className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
                <p className="text-sm text-slate-500 dark:text-slate-400 font-semibold">
                  No se encontraron partidos para esta jornada
                </p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                  Prueba cambiando la jornada, grupo o competición. También puedes usar el modo &quot;URL Manual&quot; para introducir un enlace directamente.
                </p>
              </div>
            )}

            {/* Footer with close */}
            <div className="flex justify-end pt-2 border-t border-slate-200 dark:border-slate-800">
              <Button variant="ghost" size="sm" onClick={handleCerrar}>
                Cerrar
              </Button>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* MODE 2: URL MANUAL */}
        {/* ============================================================ */}
        {modo === 'manual' && !actaAplicada && (
          <div className="space-y-4">
            {/* Input URL del Partido */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  URL del Informe o Acta del Partido (BeSoccer)
                </label>
                <span className="text-[10px] text-slate-500">Jornada {jornada}</span>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="url"
                  value={urlActa}
                  onChange={(e) => setUrlActa(e.target.value)}
                  placeholder="https://es.besoccer.com/partido/..."
                  className="text-xs font-mono h-9"
                  disabled={cargandoActa || aplicandoActa}
                />
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleAnalizarActa}
                  disabled={cargandoActa || aplicandoActa || !urlActa}
                  className="shrink-0 text-xs h-9 bg-emerald-600 hover:bg-emerald-500 text-white"
                >
                  {cargandoActa ? (
                    <><Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />Analizando...</>
                  ) : (
                    'Analizar Acta'
                  )}
                </Button>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Introduce la URL de un partido de BeSoccer para extraer la alineación oficial, minutos reales, goles y amonestaciones.
              </p>
            </div>

            {/* Preview del Acta */}
            {actaPrevia && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                {/* Header del partido */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white border border-slate-700 shadow-md">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-700/60 pb-2 mb-3">
                    <span>{actaPrevia.partido.competicion} • Jornada {actaPrevia.partido.jornada}</span>
                    <span>{actaPrevia.partido.fecha}</span>
                  </div>
                  <div className="flex items-center justify-between px-4 py-1">
                    <div className="text-center flex-1">
                      <p className="text-sm font-black uppercase text-slate-200">{actaPrevia.partido.local}</p>
                      <p className="text-[10px] text-slate-400">Local</p>
                    </div>
                    <div className="px-6 py-1 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-2xl font-black text-emerald-400 tracking-widest font-mono">
                      {actaPrevia.partido.golesLocal} - {actaPrevia.partido.golesVisitante}
                    </div>
                    <div className="text-center flex-1">
                      <p className="text-sm font-black uppercase text-slate-200">{actaPrevia.partido.visitante}</p>
                      <p className="text-[10px] text-slate-400">Visitante</p>
                    </div>
                  </div>
                </div>

                {/* Players preview */}
                {(actaPrevia.jugadoresLocal.length > 0 || actaPrevia.jugadoresVisitante.length > 0) && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        Jugadores detectados ({actaPrevia.jugadoresLocal.length + actaPrevia.jugadoresVisitante.length})
                      </h5>
                    </div>
                    <div className="max-h-40 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-200 dark:divide-slate-800 text-xs bg-white dark:bg-slate-950">
                      {[...actaPrevia.jugadoresLocal, ...actaPrevia.jugadoresVisitante].map((p, idx) => (
                        <div key={idx} className="p-2 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-5 h-5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-[10px] flex items-center justify-center font-mono shrink-0">
                              {p.dorsal ?? '-'}
                            </span>
                            <span className="font-bold text-slate-900 dark:text-slate-100 truncate">{p.nombre}</span>
                            <span className="text-[10px] text-slate-400">{p.equipoNombre}</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {p.goles > 0 && <span className="text-[10px] font-bold text-emerald-600">⚽ {p.goles}</span>}
                            {p.amarillas > 0 && <span className="text-[10px] font-bold text-amber-600">🟨 {p.amarillas}</span>}
                            <span className="font-mono text-[10px] text-slate-500">{p.minutosJugados}&apos;</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Apply button */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    Se actualizarán goles, tarjetas y minutos exactos en cada ficha.
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={handleCerrar} disabled={aplicandoActa}>
                      Cancelar
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleAplicarActa}
                      disabled={aplicandoActa}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs h-9 px-4 font-bold shadow-xs"
                    >
                      {aplicandoActa ? (
                        <><Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />Actualizando Fichas...</>
                      ) : (
                        'Aplicar Datos Oficiales a Fichas'
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* SUCCESS: ACTA APLICADA */}
        {/* ============================================================ */}
        {actaAplicada && (
          <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-500/30 text-emerald-900 dark:text-emerald-200 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-600 text-white shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold">¡Acta Oficial Sincronizada con Éxito!</h4>
                <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">
                  Se han registrado los minutos reales, goles y tarjetas del partido {actaAplicada.partido.local} {actaAplicada.partido.resultado} {actaAplicada.partido.visitante} en todas las fichas.
                </p>
              </div>
            </div>

            {/* Updated players list */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Jugadores Actualizados en Base de Datos ({actaAplicada.jugadoresActualizados?.length || 0})
              </p>
              <div className="max-h-56 overflow-y-auto divide-y divide-slate-200 dark:divide-slate-800/60 text-xs">
                {actaAplicada.jugadoresActualizados?.map((j) => (
                  <div key={j.id} className="py-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="font-bold text-slate-800 dark:text-slate-200">{j.nombre}</span>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">({j.equipo})</span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300 font-mono text-[11px]">
                      <span>+{j.minutosSumados}&apos; min</span>
                      {j.golesSumados > 0 && <span className="font-bold text-emerald-600">⚽ +{j.golesSumados}</span>}
                      {j.amarillasSumadas > 0 && <span className="font-bold text-amber-600">🟨 +{j.amarillasSumadas}</span>}
                      <span className="text-slate-400 font-normal">PJ: {j.estPartidosNuevo}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-200 dark:border-slate-800">
              <Button variant="primary" size="sm" onClick={handleCerrar} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold">
                Aceptar y Ver Fichas Actualizadas
              </Button>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* MODE 3: ESTIMADO */}
        {/* ============================================================ */}
        {modo === 'estimado' && !resumen && !ejecutando && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-gradient-to-br from-slate-50 to-emerald-50/20 dark:from-slate-900 dark:to-emerald-950/20 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-bold text-xs uppercase tracking-wider">
                <Activity className="w-4 h-4 text-emerald-600" />
                Simulación de Competición por Algoritmo
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Utiliza este modo si no dispones de un acta oficial de BeSoccer para la jornada. El sistema calculará la participación de la plantilla del club propio ({clubPropio?.nombre}) y posteriormente de los talentos observados.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Número de Jornada a Cerrar
                </label>
                <div className="flex items-center gap-2">
                  <Select
                    value={jornada.toString()}
                    onChange={(e) => setJornada(parseInt(e.target.value) || 1)}
                    options={Array.from({ length: 38 }, (_, i) => ({
                      value: (i + 1).toString(),
                      label: `Jornada ${i + 1}`,
                    }))}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setJornada((prev) => Math.min(38, prev + 1))}
                    title="Avanzar jornada"
                    className="shrink-0 text-xs"
                  >
                    +1
                  </Button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Modelo Táctico Activo
                </label>
                <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 font-semibold truncate">
                  {activeModelName}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
              <Button variant="ghost" size="sm" onClick={handleCerrar}>
                Cancelar
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleIniciarRecalculo}
                icon={<RotateCcw className="w-4 h-4" />}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
              >
                Cerrar Jornada {jornada} con Estimación
              </Button>
            </div>
          </div>
        )}

        {/* Progress View */}
        {ejecutando && (
          <div className="py-6 px-4 text-center space-y-5">
            <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
              <div className="w-20 h-20 rounded-full border-4 border-slate-200 dark:border-slate-800 border-t-emerald-600 dark:border-t-emerald-500 animate-spin" />
              <Activity className="w-8 h-8 text-emerald-600 dark:text-emerald-400 absolute" />
            </div>

            <div>
              <h4 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1">
                Recalculando Jornada {jornada}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 min-h-[20px] animate-pulse">
                {etapaTexto || 'Iniciando proceso...'}
              </p>
            </div>

            <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-emerald-600 to-teal-500 h-2.5 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progresoPct}%` }}
              />
            </div>
          </div>
        )}

        {/* Success View (Estimado) */}
        {resumen && (
          <div className="space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-500/30 text-emerald-900 dark:text-emerald-200">
              <div className="p-2 rounded-lg bg-emerald-600 text-white shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold">¡Jornada {resumen.jornada} Recalculada y Cerrada!</h4>
                <p className="text-xs text-emerald-700 dark:text-emerald-400">
                  Las fichas de los jugadores han sido nutridas con las estadísticas acumuladas de la jornada.
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-200 dark:border-slate-800">
              <Button variant="primary" size="sm" onClick={handleCerrar} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold">
                Aceptar y Ver Fichas Actualizadas
              </Button>
            </div>
          </div>
        )}

        {/* Error notice */}
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-xs">
            {error}
          </div>
        )}
      </div>
    </Modal>
  )
}
