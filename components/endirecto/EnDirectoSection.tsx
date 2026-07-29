'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Play, Square, RotateCcw, Copy, CheckCircle, Clock, Trash2, X, Film } from 'lucide-react'
import { clsx } from 'clsx'
import { obtenerPartidosDirecto, eliminarAccionDirecto, obtenerAccionesDirectoPorPartido } from '@/lib/supabase/endirecto'
import type { Partido, AccionEtiquetada, ZonaCampo } from '@/types/database'
import { RegistroAccionModal } from './RegistroAccionModal'
import { VincularVideoModal } from './VincularVideoModal'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { calcularScore } from '@/lib/scoring/calcularScore'

export type AccionTipo = 'GOL' | 'OCASION' | 'DUELO' | 'PERDIDA'

interface EnDirectoSectionProps {
  activeModelId?: string
  activeModelName?: string
  onScoreUpdated?: (jugadorId: string, score: number) => void
}

export function EnDirectoSection({ activeModelId, activeModelName, onScoreUpdated }: EnDirectoSectionProps) {
  const [partidos, setPartidos] = useState<Partido[]>([])
  const [selectedPartido, setSelectedPartido] = useState<Partido | null>(null)
  const [isMatchActive, setIsMatchActive] = useState(false)
  const [matchEnded, setMatchEnded] = useState(false)
  
  // Timer state
  const [timeMs, setTimeMs] = useState(0)
  const [timerRunning, setTimerRunning] = useState(false)
  const [periodo, setPeriodo] = useState<1 | 2 | 3 | 4>(1) // 1: 1ª Parte, 2: 2ª Parte, 3: Prórroga 1, 4: Prórroga 2
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Actions state
  const [acciones, setAcciones] = useState<AccionEtiquetada[]>([])
  
  // Modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [vincularModalOpen, setVincularModalOpen] = useState(false)
  const [actionToDeleteId, setActionToDeleteId] = useState<string | null>(null)
  const [currentAccionTipo, setCurrentAccionTipo] = useState<AccionTipo>('DUELO')
  const [currentMinute, setCurrentMinute] = useState(0)
  const [currentSecond, setCurrentSecond] = useState(0)

  // Load matches
  useEffect(() => {
    obtenerPartidosDirecto().then(setPartidos).catch(console.error)
  }, [])

  // Timer logic
  useEffect(() => {
    if (timerRunning) {
      timerRef.current = setInterval(() => {
        setTimeMs(prev => prev + 100)
      }, 100)
    } else if (timerRef.current) {
      clearInterval(timerRef.current)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [timerRunning])

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000)
    const m = Math.floor(totalSeconds / 60)
    const s = totalSeconds % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const handleStartMatch = () => {
    if (!selectedPartido) return
    setIsMatchActive(true)
    setTimerRunning(true)
    // Load existing actions if any
    obtenerAccionesDirectoPorPartido(selectedPartido.id)
      .then(setAcciones)
      .catch(console.error)
  }

  const handleActionTap = (tipo: AccionTipo) => {
    const totalSeconds = Math.floor(timeMs / 1000)
    setCurrentMinute(Math.floor(totalSeconds / 60))
    setCurrentSecond(totalSeconds % 60)
    setCurrentAccionTipo(tipo)
    setModalOpen(true)
  }

  const handleSaveAction = (newAccion: AccionEtiquetada) => {
    setAcciones(prev => [...prev, newAccion])
    if (activeModelId && newAccion.jugador_id) {
      const jId = newAccion.jugador_id
      calcularScore(jId, activeModelId)
        .then((resultado) => {
          onScoreUpdated?.(jId, resultado.score)
        })
        .catch((err) =>
          console.warn('[Score] Recálculo automático tras acción en directo falló:', err?.message ?? err)
        )
    }
  }

  const handleConfirmDeleteAction = async () => {
    if (!actionToDeleteId) return
    try {
      const target = acciones.find(a => a.id === actionToDeleteId)
      await eliminarAccionDirecto(actionToDeleteId)
      setAcciones(prev => prev.filter(a => a.id !== actionToDeleteId))
      if (activeModelId && target?.jugador_id) {
        const jId = target.jugador_id
        calcularScore(jId, activeModelId)
          .then((resultado) => {
            onScoreUpdated?.(jId, resultado.score)
          })
          .catch((err) =>
            console.warn('[Score] Recálculo automático tras borrado falló:', err?.message ?? err)
          )
      }
    } catch (e) {
      console.error('Error al eliminar acción en directo:', e)
    } finally {
      setActionToDeleteId(null)
    }
  }

  const handleEndMatch = () => {
    setTimerRunning(false)
    setMatchEnded(true)
  }

  // Counters
  const countGoles = acciones.filter(a => a.nota?.includes('[GOL]')).length
  const countOcasiones = acciones.filter(a => a.nota?.includes('[OCASION]')).length
  const countDuelos = acciones.filter(a => a.nota?.includes('[DUELO]')).length
  const countPerdidas = acciones.filter(a => a.nota?.includes('[PERDIDA]')).length

  // Stats calculation
  const playerStats = acciones.reduce((acc, accion) => {
    if (!accion.jugador_id) return acc
    if (!acc[accion.jugador_id]) {
      acc[accion.jugador_id] = { duelosGanados: 0, duelosPerdidos: 0, perdidas: 0, goles: 0 }
    }
    const isEfectiva = accion.resultado === 'efectiva'
    if (accion.nota?.includes('[DUELO]')) {
      if (isEfectiva) acc[accion.jugador_id].duelosGanados++
      else acc[accion.jugador_id].duelosPerdidos++
    }
    if (accion.nota?.includes('[PERDIDA]')) acc[accion.jugador_id].perdidas++
    if (accion.nota?.includes('[GOL]')) acc[accion.jugador_id].goles++
    return acc
  }, {} as Record<string, {duelosGanados: number, duelosPerdidos: number, perdidas: number, goles: number}>)

  const copySummary = () => {
    const text = `Resumen del Partido
Goles: ${countGoles}
Ocasiones: ${countOcasiones}
Duelos: ${countDuelos}
Pérdidas: ${countPerdidas}

Estadísticas Destacadas:
${Object.entries(playerStats)
  .filter(([_, s]) => s.duelosGanados > 0 || s.goles > 0)
  .map(([id, s]) => `- J.${id.split('-')[1] || id}: ${s.goles} Goles, ${s.duelosGanados} Duelos Ganados`)
  .join('\n')}
`
    navigator.clipboard.writeText(text)
    alert('Resumen copiado al portapapeles')
  }

  if (matchEnded) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <h2 className="text-2xl font-bold text-slate-100 mb-6">Resumen del Partido</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-950 border border-red-500/30 p-4 rounded-xl text-center">
            <p className="text-sm text-slate-400">Goles</p>
            <p className="text-3xl font-bold text-red-500">{countGoles}</p>
          </div>
          <div className="bg-slate-950 border border-orange-500/30 p-4 rounded-xl text-center">
            <p className="text-sm text-slate-400">Ocasiones</p>
            <p className="text-3xl font-bold text-orange-500">{countOcasiones}</p>
          </div>
          <div className="bg-slate-950 border border-blue-500/30 p-4 rounded-xl text-center">
            <p className="text-sm text-slate-400">Duelos</p>
            <p className="text-3xl font-bold text-blue-500">{countDuelos}</p>
          </div>
          <div className="bg-slate-950 border border-slate-700 p-4 rounded-xl text-center">
            <p className="text-sm text-slate-400">Pérdidas</p>
            <p className="text-3xl font-bold text-slate-400">{countPerdidas}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Gráfico de Goles */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
            <h3 className="text-sm font-bold text-slate-400 mb-4 uppercase tracking-widest">Mapa de Goles</h3>
            <div className="relative w-full aspect-[2.5/1] bg-[#1a1b1e] rounded-xl border border-slate-700 overflow-hidden shadow-inner">
              <div className="absolute bottom-0 w-full h-[25%] bg-[#2a6836]" />
              <div 
                className="absolute top-[15%] left-[10%] right-[10%] bottom-[25%] border-t-4 border-l-4 border-r-4 border-slate-300 bg-[#242529] overflow-hidden"
              >
                <div 
                  className="absolute inset-0 opacity-20 pointer-events-none"
                  style={{
                    backgroundImage: 'linear-gradient(45deg, #ffffff 1px, transparent 1px), linear-gradient(-45deg, #ffffff 1px, transparent 1px)',
                    backgroundSize: '16px 16px'
                  }}
                />
                {acciones.filter(a => a.nota?.includes('[GOL]') && (a.metadata as any)?.goalPos).map(a => {
                  const pos = (a.metadata as any).goalPos
                  return (
                    <div 
                      key={a.id}
                      className="absolute w-4 h-4 -ml-2 -mt-2 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]"
                      style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                    />
                  )
                })}
              </div>
            </div>
          </div>

          {/* Estadísticas Jugadores */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 overflow-y-auto max-h-[200px]">
            <h3 className="text-sm font-bold text-slate-400 mb-4 uppercase tracking-widest">Rendimiento</h3>
            <div className="flex flex-col gap-2">
              {Object.entries(playerStats).sort((a,b) => (b[1].duelosGanados + b[1].goles) - (a[1].duelosGanados + a[1].goles)).map(([id, s]) => (
                <div key={id} className="flex items-center justify-between p-2 bg-slate-900 rounded-lg border border-slate-800">
                  <span className="font-bold text-sm text-slate-200">Jugador {id.split('-')[1] || id.slice(0,4)}</span>
                  <div className="flex gap-3 text-xs">
                    {s.goles > 0 && <span className="text-red-400 font-bold">{s.goles} Goles</span>}
                    <span className="text-emerald-400">{s.duelosGanados}W</span>
                    <span className="text-red-400">{s.duelosPerdidos}L</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <button onClick={copySummary} className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-emerald-600 text-white font-bold text-lg hover:bg-emerald-500 transition-colors">
            <Copy className="w-5 h-5" /> Copiar Resumen (Portapapeles)
          </button>
          <button 
            onClick={() => setVincularModalOpen(true)}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-slate-800 text-white font-bold text-lg hover:bg-slate-700 transition-colors"
          >
            <Film className="w-5 h-5" /> Vincular Vídeo al Partido
          </button>
        </div>

        {selectedPartido && (
          <VincularVideoModal
            isOpen={vincularModalOpen}
            onClose={() => setVincularModalOpen(false)}
            partidoId={selectedPartido.id}
            onLinked={() => {
              // Refresh or show success
              console.log('Video vinculado exitosamente')
            }}
          />
        )}
      </div>
    )
  }

  if (!isMatchActive) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <h2 className="text-2xl font-bold text-slate-100 mb-6 flex items-center gap-3">
          <Clock className="w-6 h-6 text-emerald-500" />
          Configuración En Directo
        </h2>
        
        <div className="mb-6">
          <label className="block text-sm font-semibold text-slate-400 mb-2">Selecciona un Partido</label>
          <select 
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-slate-200 outline-none focus:border-emerald-500 transition-colors"
            onChange={(e) => {
              const p = partidos.find(p => p.id === e.target.value)
              setSelectedPartido(p || null)
            }}
          >
            <option value="">-- Seleccionar --</option>
            {partidos.map(p => (
              <option key={p.id} value={p.id}>
                {p.fecha} - {(p as any).club_local?.nombre} vs {(p as any).club_visitante?.nombre}
              </option>
            ))}
          </select>
        </div>

        <button 
          onClick={handleStartMatch}
          disabled={!selectedPartido}
          className="w-full py-5 rounded-xl bg-emerald-600 text-white font-bold text-xl hover:bg-emerald-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <Play className="w-6 h-6" /> Iniciar Partido
        </button>
      </div>
    )
  }

  return (
    <div className="w-full max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Controls & Action buttons */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          {/* HEADER: Timer and Counters */}
      <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 shadow-xl flex flex-col gap-4">
        <div className="flex items-center justify-between mt-2">
          <div className="flex-1 flex flex-col items-center">
            <div className="flex gap-4 items-center mb-1">
              <span className="bg-amber-400 text-slate-900 font-bold text-xs px-2 py-0.5 rounded-md">1ª</span>
              <span className="bg-slate-800 text-slate-400 font-bold text-xs px-2 py-0.5 rounded-md">2ª</span>
              <div className="flex-1" />
              <span className="text-[10px] text-emerald-400 font-bold tracking-widest flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> EN JUEGO
              </span>
            </div>
            
            <div className="text-[52px] sm:text-[64px] font-mono leading-none font-black text-white tracking-wider my-3 text-center">
              {formatTime(timeMs)}
            </div>
            <div className="text-xs text-slate-400 font-medium mb-4">
              minuto {Math.floor(timeMs / 1000 / 60)}'
            </div>

            <div className="w-full flex gap-3">
              <button 
                onClick={() => setTimerRunning(!timerRunning)}
                className={clsx(
                  "flex-1 py-3 rounded-xl font-black text-sm uppercase tracking-wider transition-all", 
                  timerRunning 
                    ? "bg-amber-400 text-slate-900 shadow-[0_0_15px_rgba(251,191,36,0.3)]" 
                    : "bg-emerald-500 text-white"
                )}
              >
                {timerRunning ? 'Detener' : 'Iniciar'}
              </button>
              <button 
                onClick={() => { setTimeMs(0); setTimerRunning(false) }}
                className="px-6 py-3 rounded-xl bg-slate-800 text-slate-300 font-bold text-sm hover:text-white transition-colors"
              >
                RESET
              </button>
            </div>
          </div>
        </div>
        
        {/* Compact Counters */}
        <div className="grid grid-cols-4 gap-2 mt-2">
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-2 sm:p-3 flex flex-col items-center justify-center gap-1 text-center min-w-0">
            <div className="text-xl sm:text-2xl font-black text-red-500 truncate">{countGoles}</div>
            <div className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-wider truncate w-full">Goles</div>
          </div>
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-2 sm:p-3 flex flex-col items-center justify-center gap-1 text-center min-w-0">
            <div className="text-xl sm:text-2xl font-black text-amber-500 truncate">{countOcasiones}</div>
            <div className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-wider truncate w-full">Ocasiones</div>
          </div>
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-2 sm:p-3 flex flex-col items-center justify-center gap-1 text-center min-w-0">
            <div className="text-xl sm:text-2xl font-black text-blue-500 truncate">{countDuelos}</div>
            <div className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-wider truncate w-full">Duelos</div>
          </div>
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-2 sm:p-3 flex flex-col items-center justify-center gap-1 text-center min-w-0">
            <div className="text-xl sm:text-2xl font-black text-slate-300 truncate">{countPerdidas}</div>
            <div className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-wider truncate w-full">Pérdidas</div>
          </div>
        </div>
      </div>

      <div className="px-1 sm:px-2">
        <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest mb-2.5">Registrar Acción</p>
        <div className="grid grid-cols-2 gap-3">
          <button 
            onClick={() => handleActionTap('GOL')}
            className="min-h-[64px] h-16 sm:h-20 bg-red-600 hover:bg-red-500 rounded-2xl flex items-center justify-center active:scale-95 transition-all shadow-lg shadow-red-950/40"
          >
            <span className="text-white font-black text-lg sm:text-xl tracking-wider uppercase">GOL</span>
          </button>
          <button 
            onClick={() => handleActionTap('OCASION')}
            className="min-h-[64px] h-16 sm:h-20 bg-amber-500 hover:bg-amber-400 rounded-2xl flex items-center justify-center active:scale-95 transition-all shadow-lg shadow-amber-950/40"
          >
            <span className="text-slate-950 font-black text-lg sm:text-xl tracking-wider uppercase">OCASIÓN</span>
          </button>
          <button 
            onClick={() => handleActionTap('DUELO')}
            className="min-h-[64px] h-16 sm:h-20 bg-blue-600 hover:bg-blue-500 rounded-2xl flex items-center justify-center active:scale-95 transition-all shadow-lg shadow-blue-950/40"
          >
            <span className="text-white font-black text-lg sm:text-xl tracking-wider uppercase">DUELO</span>
          </button>
          <button 
            onClick={() => handleActionTap('PERDIDA')}
            className="min-h-[64px] h-16 sm:h-20 bg-slate-600 hover:bg-slate-500 rounded-2xl flex items-center justify-center active:scale-95 transition-all shadow-lg shadow-slate-950/40"
          >
            <span className="text-white font-black text-lg sm:text-xl tracking-wider uppercase">PÉRDIDA</span>
          </button>
        </div>
      </div>

        </div>

        {/* RIGHT COLUMN: Timeline */}
        <div className="lg:col-span-5 bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-800 shadow-xl flex flex-col min-h-[380px] lg:min-h-[520px]">
          <div className="pb-3 flex items-center justify-between border-b border-slate-800">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Timeline del Partido</h3>
            <span className="text-xs text-slate-500 font-medium">{acciones.length} acciones</span>
          </div>
          <div className="flex-1 overflow-y-auto py-2 space-y-1.5 max-h-[420px]">
            {acciones.length === 0 ? (
              <div className="h-40 flex items-center justify-center text-slate-500 text-sm italic">
                No hay acciones registradas aún
              </div>
            ) : (
              acciones.slice().reverse().map(a => {
                const isGol = a.nota?.includes('[GOL]')
                const isOca = a.nota?.includes('[OCASION]')
                const isDue = a.nota?.includes('[DUELO]')
                const isPer = a.nota?.includes('[PERDIDA]')
                
                let badgeClass = "bg-slate-700 text-white"
                let badgeText = "ACCIÓN"
                if (isGol) { badgeClass = "bg-red-600 text-white"; badgeText = "GOL" }
                if (isOca) { badgeClass = "bg-amber-500 text-slate-900"; badgeText = "OCASIÓN" }
                if (isDue) { badgeClass = "bg-blue-600 text-white"; badgeText = "DUELO" }
                if (isPer) { badgeClass = "bg-slate-500 text-white"; badgeText = "PÉRDIDA" }
                
                const isEfectiva = a.resultado === 'efectiva'
                const isDuelo = isDue

                return (
                  <div key={a.id} className="group py-2.5 px-3 rounded-xl bg-slate-950/60 border border-slate-800/60 flex items-center gap-3 hover:border-slate-700 transition-colors">
                    <div className="w-9 shrink-0 text-xs font-mono font-bold text-slate-400 text-right">
                      {a.minuto_video}'
                    </div>
                    <div className={clsx("px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider shrink-0", badgeClass)}>
                      {badgeText}
                    </div>
                    <div className="flex-1 min-w-0 flex items-center gap-2">
                      <p className="text-xs sm:text-sm font-bold text-slate-200 truncate">
                        Jugador {a.jugador_id?.split('-')[1] || 'X'}
                      </p>
                      <span className={clsx("text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0", isEfectiva ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-slate-800 text-slate-400")}>
                        {isDuelo ? (isEfectiva ? 'GANADO' : 'PERDIDO') : (isEfectiva ? 'EFECTIVA' : 'NO EFEC.')}
                      </span>
                    </div>
                    <button 
                      onClick={() => setActionToDeleteId(a.id)}
                      className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg active:scale-90 transition-all"
                      title="Eliminar acción"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )
              })
            )}
          </div>
          <div className="pt-3 border-t border-slate-800 mt-auto">
            <button 
              onClick={handleEndMatch} 
              className="w-full py-3 rounded-xl text-xs sm:text-sm font-bold text-slate-300 border border-slate-700 hover:bg-slate-800 hover:text-white transition-all uppercase tracking-wider"
            >
              FINALIZAR PARTIDO
            </button>
          </div>
        </div>
      </div>

      {/* REGISTRO MODAL */}
      {selectedPartido && (
        <RegistroAccionModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          tipo={currentAccionTipo}
          minuto={currentMinute}
          segundo={currentSecond}
          partidoId={selectedPartido.id}
          onSave={handleSaveAction}
        />
      )}

      {/* CONFIRMACION BORRADO DE ACCION */}
      <ConfirmModal
        isOpen={!!actionToDeleteId}
        onClose={() => setActionToDeleteId(null)}
        onConfirm={handleConfirmDeleteAction}
        title="Eliminar Acción en Directo"
        message="¿Estás seguro de que deseas eliminar esta acción registrada en directo? Esta operación no se puede deshacer."
        confirmText="Eliminar Acción"
        variant="danger"
      />
    </div>
  )
}
