'use client'

import React, { useState, useEffect } from 'react'
import { X, Check } from 'lucide-react'
import { clsx } from 'clsx'
import { supabase } from '@/lib/supabase/client'
import { crearAccionDirecto } from '@/lib/supabase/endirecto'
import type { AccionEtiquetada, Jugador } from '@/types/database'
import { AccionTipo } from './EnDirectoSection'
import { FORMACIONES } from '@/lib/formations'

interface RegistroAccionModalProps {
  isOpen: boolean
  onClose: () => void
  tipo: AccionTipo
  minuto: number
  segundo: number
  partidoId: string
  onSave: (accion: AccionEtiquetada) => void
}

export function RegistroAccionModal({ isOpen, onClose, tipo, minuto, segundo, partidoId, onSave }: RegistroAccionModalProps) {
  const [resultado, setResultado] = useState<'efectiva' | 'no_efectiva' | null>(null)
  const [nota, setNota] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [showToast, setShowToast] = useState(false)
  
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null)
  const [jugadoresMock, setJugadoresMock] = useState<Jugador[]>([])
  const [dummyMetricaN1, setDummyMetricaN1] = useState<string>('00000000-0000-0000-0000-000000000001')
  
  const slots = FORMACIONES['4-3-3']

  // Goal position state for OCASIÓN/GOL
  const [goalPos, setGoalPos] = useState<{x: number, y: number} | null>(null)
  
  // New details state
  const [asistenciaId, setAsistenciaId] = useState<string | null>(null)
  const [tipoRemate, setTipoRemate] = useState<string | null>(null)
  const [trayectoria, setTrayectoria] = useState<{startX: number, startY: number, endX: number, endY: number} | null>(null)
  
  // Drawing state for pitch
  const [isDrawing, setIsDrawing] = useState(false)
  const [drawStart, setDrawStart] = useState<{x: number, y: number} | null>(null)
  const [drawCurrent, setDrawCurrent] = useState<{x: number, y: number} | null>(null)

  useEffect(() => {
    if (isOpen) {
      setResultado(null)
      setNota('')
      setSelectedPlayerId(null)
      setShowToast(false)
      setGoalPos(null)
      setAsistenciaId(null)
      setTipoRemate(null)
      setTrayectoria(null)
      setIsDrawing(false)
      setDrawStart(null)
      setDrawCurrent(null)

      supabase.from('jugadores').select('*').limit(11).then(({ data }) => {
        if (data && data.length > 0) setJugadoresMock(data)
      })
      
      supabase.from('metricas_nivel1').select('id').limit(1).then(({ data }) => {
        if (data && data.length > 0) setDummyMetricaN1(data[0].id)
      })
    }
  }, [isOpen])

  if (!isOpen) return null

  const getTipoColor = () => {
    switch(tipo) {
      case 'GOL': return 'text-red-500 bg-red-500/20'
      case 'OCASION': return 'text-amber-500 bg-amber-500/20'
      case 'DUELO': return 'text-blue-500 bg-blue-500/20'
      case 'PERDIDA': return 'text-slate-400 bg-slate-500/20'
      default: return 'text-emerald-500 bg-emerald-500/20'
    }
  }

  const handleSave = async () => {
    if (!resultado || !selectedPlayerId) return

    setIsSaving(true)
    try {
      let finalNota = nota
      if (goalPos && (tipo === 'OCASION' || tipo === 'GOL')) {
        finalNota += ` [Portería: X:${goalPos.x.toFixed(1)} Y:${goalPos.y.toFixed(1)}]`
      }

      const newAccion = await crearAccionDirecto({
        partido_id: partidoId,
        video_id: null,
        jugador_id: selectedPlayerId,
        metrica_n1_id: dummyMetricaN1,
        metrica_n2_id: null,
        minuto_video: minuto,
        segundo_video: segundo,
        resultado,
        zona: null, // Zone could be calculated based on player position, left null for simplicity
        nota: `[${tipo}] ${finalNota.trim()}`,
        clip_url: null,
        valor_accion: null,
        clip_start_sec: null,
        clip_end_sec: null,
        metadata: {
          goalPos,
          asistenciaId,
          tipoRemate,
          trayectoria: trayectoria || (drawStart && drawCurrent ? { startX: drawStart.x, startY: drawStart.y, endX: drawCurrent.x, endY: drawCurrent.y } : null)
        }
      })

      onSave(newAccion)
      
      setShowToast(true)
      setTimeout(() => {
        setShowToast(false)
        onClose()
      }, 1500)

    } catch (e) {
      console.error(e)
    } finally {
      setIsSaving(false)
    }
  }

  const selectedPlayer = jugadoresMock.find(j => j.id === selectedPlayerId)
  
  const handleSvgPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (tipo === 'GOL' || tipo === 'OCASION') return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setIsDrawing(true)
    setDrawStart({x, y})
    setDrawCurrent({x, y})
  }

  const handleSvgPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!isDrawing) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setDrawCurrent({x, y})
  }

  const handleSvgPointerUp = () => {
    if (isDrawing && drawStart && drawCurrent) {
      setTrayectoria({ startX: drawStart.x, startY: drawStart.y, endX: drawCurrent.x, endY: drawCurrent.y })
    }
    setIsDrawing(false)
  }

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-slate-950 sm:p-4 md:p-6 sm:bg-slate-950/80 sm:backdrop-blur-md sm:items-center sm:justify-center">
      <div className="w-full h-full sm:max-w-2xl sm:h-auto sm:max-h-[90vh] sm:rounded-2xl sm:border sm:border-slate-800 sm:shadow-2xl bg-slate-950 flex flex-col overflow-hidden">
      {/* Toast Overlay */}
      {showToast && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md flex-col gap-4">
          <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center animate-bounce">
            <Check className="w-10 h-10 text-white" />
          </div>
          <p className="text-2xl font-bold text-emerald-400">¡Guardado!</p>
        </div>
      )}

      {/* Header */}
      <div className="px-4 py-4 flex items-center justify-between border-b border-slate-800/50 bg-slate-950 shrink-0">
        <div className="flex items-center gap-3">
          <div className={clsx("px-3 py-1 rounded-md font-black text-sm tracking-widest", getTipoColor())}>
            {tipo}
          </div>
          <span className="text-slate-200 font-bold text-lg">{minuto}'</span>
        </div>
        <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-800 transition-colors">
          <X className="w-6 h-6 text-slate-400" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto flex flex-col">
        {/* Instructions & Result Bar */}
        <div className="px-4 py-3 flex flex-col gap-2 shrink-0 border-b border-slate-900">
          <div className="flex items-center justify-between">
            <p className="text-amber-400 text-xs sm:text-sm font-bold bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/20">
              {!selectedPlayerId 
                ? 'Toca al jugador para empezar' 
                : (tipo === 'OCASION' || tipo === 'GOL') 
                  ? 'Marca la portería y el resultado' 
                  : 'Selecciona el resultado de la acción'
              }
            </p>
            {selectedPlayerId && (
              <button onClick={() => setSelectedPlayerId(null)} className="text-slate-400 hover:text-white text-xs font-bold bg-slate-900 border border-slate-800 px-2.5 py-1.5 rounded-lg transition-colors">
                Cambiar jugador
              </button>
            )}
          </div>

          {/* Result Selection Bar */}
          {selectedPlayerId && (
            <div className="flex gap-2 justify-center mt-1">
              <button
                onClick={() => setResultado('efectiva')}
                className={clsx(
                  "flex-1 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all border text-center",
                  resultado === 'efectiva'
                    ? "bg-emerald-500 text-white border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.4)]"
                    : "bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700"
                )}
              >
                {tipo === 'DUELO' ? 'Ganado ✓' : 'Efectiva ✓'}
              </button>
              <button
                onClick={() => setResultado('no_efectiva')}
                className={clsx(
                  "flex-1 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all border text-center",
                  resultado === 'no_efectiva'
                    ? "bg-red-500 text-white border-red-400 shadow-[0_0_15px_rgba(239,68,68,0.4)]"
                    : "bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700"
                )}
              >
                {tipo === 'DUELO' ? 'Perdido ✗' : 'No Efectiva ✗'}
              </button>
            </div>
          )}
        </div>

        {/* Pitch Area */}
        <div className="px-4 pb-4 flex flex-col gap-4">
          <div className="relative w-full aspect-[3/4.5] rounded-xl border border-emerald-600/30 overflow-hidden bg-emerald-900/20 shadow-inner flex shrink-0 touch-none">
            {/* Field SVG markings */}
            <svg 
              className="absolute inset-0 w-full h-full" 
              viewBox="0 0 100 133" 
              preserveAspectRatio="none"
              onPointerDown={handleSvgPointerDown}
              onPointerMove={handleSvgPointerMove}
              onPointerUp={handleSvgPointerUp}
              onPointerLeave={handleSvgPointerUp}
            >
              <rect x="2" y="2" width="96" height="129" rx="2" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" className="pointer-events-none" />
              <line x1="2" y1="66.5" x2="98" y2="66.5" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" className="pointer-events-none" />
              <circle cx="50" cy="66.5" r="14" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" className="pointer-events-none" />
              <circle cx="50" cy="66.5" r="1" fill="rgba(255,255,255,0.3)" className="pointer-events-none" />
              <rect x="20" y="2" width="60" height="22" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" className="pointer-events-none" />
              <rect x="34" y="2" width="32" height="8" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" className="pointer-events-none" />
              <rect x="20" y="109" width="60" height="22" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" className="pointer-events-none" />
              <rect x="34" y="123" width="32" height="8" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" className="pointer-events-none" />
              
              {/* Drawn Trajectory */}
              {(trayectoria || (drawStart && drawCurrent)) && (
                <>
                  <defs>
                    <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                      <polygon points="0 0, 10 3.5, 0 7" fill="#eab308" />
                    </marker>
                  </defs>
                  <line 
                    x1={trayectoria ? trayectoria.startX : drawStart?.x} 
                    y1={trayectoria ? trayectoria.startY : drawStart?.y} 
                    x2={trayectoria ? trayectoria.endX : drawCurrent?.x} 
                    y2={trayectoria ? trayectoria.endY : drawCurrent?.y} 
                    stroke="#eab308" 
                    strokeWidth="1.5" 
                    strokeDasharray="2 2"
                    markerEnd="url(#arrowhead)" 
                    className="pointer-events-none drop-shadow-md"
                  />
                  <circle cx={trayectoria ? trayectoria.startX : drawStart?.x} cy={trayectoria ? trayectoria.startY : drawStart?.y} r="1.5" fill="#eab308" className="pointer-events-none" />
                </>
              )}
            </svg>

            {/* Players */}
            {slots.map((slot, index) => {
              const jugador = jugadoresMock[index % jugadoresMock.length]
              const isSelected = selectedPlayerId === jugador?.id
              const isOtherSelected = selectedPlayerId && !isSelected

              return (
                <div
                  key={slot.id}
                  style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
                  className={clsx(
                    "absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center transition-all",
                    isOtherSelected ? "opacity-40" : "opacity-100 z-10"
                  )}
                >
                  <button
                    onClick={() => {
                      if (!selectedPlayerId) setSelectedPlayerId(jugador?.id || null)
                    }}
                    className={clsx(
                      "w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm shadow-lg border-2 transition-transform",
                      isSelected 
                        ? "bg-amber-400 text-slate-900 border-amber-300 scale-125 ring-4 ring-amber-500/30"
                        : tipo === 'GOL' || tipo === 'OCASION' ? "bg-red-600 text-white border-red-400" : "bg-emerald-700 text-white border-emerald-400",
                    )}
                  >
                    {jugador?.dorsal || (index + 1)}
                  </button>
                  <span className={clsx(
                    "mt-0.5 text-[9px] sm:text-[10px] font-semibold bg-slate-900/90 px-1 rounded truncate max-w-[60px]",
                    isSelected ? "text-amber-400 font-bold" : "text-slate-200"
                  )}>
                    {jugador?.nombre?.split(' ')[0] || slot.posicion}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Goal graphic for OCASIÓN or GOL */}
          {(tipo === 'OCASION' || tipo === 'GOL') && selectedPlayerId && (
            <div className="relative w-full aspect-[2.5/1] bg-[#1a1b1e] rounded-xl border border-slate-800 overflow-hidden shrink-0 mt-2 shadow-inner">
              {/* Grass at bottom */}
              <div className="absolute bottom-0 w-full h-[25%] bg-[#2a6836]" />
              
              {/* Goal Frame & Net */}
              <div 
                className="absolute top-[15%] left-[10%] right-[10%] bottom-[25%] border-t-4 border-l-4 border-r-4 border-slate-300 bg-[#242529] cursor-crosshair overflow-hidden"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect()
                  const x = ((e.clientX - rect.left) / rect.width) * 100
                  const y = ((e.clientY - rect.top) / rect.height) * 100
                  setGoalPos({x, y})
                }}
              >
                {/* Net Pattern - Diagonal Crosshatching */}
                <div 
                  className="absolute inset-0 opacity-20 pointer-events-none"
                  style={{
                    backgroundImage: `
                      linear-gradient(45deg, #ffffff 1px, transparent 1px),
                      linear-gradient(-45deg, #ffffff 1px, transparent 1px)
                    `,
                    backgroundSize: '16px 16px',
                    backgroundPosition: '0 0, 0 8px'
                  }}
                />

                {/* Selected Crosshair */}
                {goalPos && (
                  <div 
                    className="absolute w-8 h-8 -ml-4 -mt-4 rounded-full border-2 border-[#eab308] flex items-center justify-center shadow-[0_0_10px_rgba(234,179,8,0.5)] pointer-events-none"
                    style={{ left: `${goalPos.x}%`, top: `${goalPos.y}%` }}
                  >
                    <div className="absolute w-4 h-[2px] bg-[#eab308]" />
                    <div className="absolute h-4 w-[2px] bg-[#eab308]" />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="px-4 py-4 bg-slate-950 border-t border-slate-800 shrink-0 flex flex-col gap-4">
        {selectedPlayer && (
          <div className="text-center">
            <span className="text-emerald-500 font-bold text-sm">Jugador: {selectedPlayer.nombre} - {selectedPlayer.dorsal}</span>
          </div>
        )}
        
        {/* Additional Details for GOL/OCASIÓN */}
        {(tipo === 'GOL' || tipo === 'OCASION') && (
          <div className="grid grid-cols-2 gap-3">
            <select
              value={tipoRemate || ''}
              onChange={(e) => setTipoRemate(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-300 text-sm outline-none focus:border-emerald-500"
            >
              <option value="">Tipo de remate</option>
              <option value="pie_derecho">Pie Derecho</option>
              <option value="pie_izquierdo">Pie Izquierdo</option>
              <option value="cabeza">Cabeza</option>
              <option value="otro">Otro</option>
            </select>
            <select
              value={asistenciaId || ''}
              onChange={(e) => setAsistenciaId(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-300 text-sm outline-none focus:border-emerald-500"
            >
              <option value="">Sin asistencia</option>
              {jugadoresMock.filter(j => j.id !== selectedPlayerId).map(j => (
                <option key={j.id} value={j.id}>{j.nombre}</option>
              ))}
            </select>
          </div>
        )}
        
        <input
          type="text"
          value={nota}
          onChange={e => setNota(e.target.value)}
          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-slate-300 text-sm outline-none focus:border-emerald-500 transition-colors"
          placeholder="Notas (opcional): descripción, contexto..."
        />

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3.5 rounded-xl bg-slate-900 text-slate-300 font-bold border border-slate-800 text-sm"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={!resultado || !selectedPlayerId || isSaving}
            className="flex-[2] py-3.5 rounded-xl bg-red-600 text-white font-black hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 text-sm uppercase tracking-wider"
          >
            {isSaving ? 'Guardando...' : 'Guardar acción'}
          </button>
        </div>
      </div>
    </div>
    </div>
  )
}
