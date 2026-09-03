'use client'

import React, { useState, useEffect, useMemo } from 'react'
import {
  Grid, Save, X, UserPlus, Trash2, Wand2, Check,
  Search, SlidersHorizontal, RotateCcw, Sparkles, Filter, Users, Shield
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { FORMACIONES, FORMACIONES_DISPONIBLES, reubicarJugadores } from '@/lib/formations'
import { POSICION_DETALLADA_LABELS, clasePercentil } from '@/lib/constants'
import { obtenerJugadores, obtenerJugadoresConScoreModelo } from '@/lib/supabase/jugadores'
import { obtenerAlineaciones, crearAlineacion, eliminarAlineacion } from '@/lib/supabase/alineaciones'
import type { SlotTactico, JugadorConClub, AlineacionGuardada, Posicion } from '@/types/database'
import { ConfirmModal } from '@/components/ui/ConfirmModal'

import {
  DndContext,
  useDraggable,
  useDroppable,
  DragEndEvent,
  TouchSensor,
  MouseSensor,
  useSensor,
  useSensors,
  DragOverlay,
  DragStartEvent,
} from '@dnd-kit/core'

interface CampogramaSectionProps {
  activeModelName: string
  activeModelId?: string
}

function calcularEdad(fechaNacimiento: string | null): number | null {
  if (!fechaNacimiento) return null
  const hoy = new Date()
  const cumple = new Date(fechaNacimiento)
  let edad = hoy.getFullYear() - cumple.getFullYear()
  const m = hoy.getMonth() - cumple.getMonth()
  if (m < 0 || (m === 0 && hoy.getDate() < cumple.getDate())) {
    edad--
  }
  return edad
}

// ----------------------------------------------------------------------
// Draggable Player Item
// ----------------------------------------------------------------------
function DraggablePlayer({
  jugador,
  isHighlighted
}: {
  jugador: JugadorConClub
  isHighlighted: boolean
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `player-${jugador.id}`,
    data: { jugador },
  })

  const edad = calcularEdad(jugador.fecha_nacimiento)

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`p-2 rounded-xl border flex items-center justify-between text-xs cursor-grab transition-all select-none touch-none ${
        isDragging
          ? 'opacity-50 scale-95 border-emerald-500 bg-emerald-950'
          : isHighlighted
          ? 'bg-emerald-950/80 border-emerald-400 ring-2 ring-emerald-500/40 scale-[1.02]'
          : 'bg-slate-900/80 hover:bg-slate-800/90 border-slate-800 hover:border-slate-700 shadow-sm'
      }`}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-7 h-7 rounded-full overflow-hidden bg-slate-800 border border-slate-700 shrink-0 flex items-center justify-center">
          {jugador.foto_url ? (
            <img src={jugador.foto_url} alt={jugador.nombre} className="w-full h-full object-cover pointer-events-none" />
          ) : (
            <span className="text-[9px] font-bold text-slate-400 pointer-events-none">
              {jugador.nombre.charAt(0)}{jugador.apellidos.charAt(0)}
            </span>
          )}
        </div>
        <div className="truncate">
          <p className="font-semibold text-slate-200 truncate leading-tight">
            {jugador.nombre} {jugador.apellidos}
          </p>
          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 truncate mt-0.5">
            <span className="font-medium text-emerald-400/90">{jugador.posicion}</span>
            <span>•</span>
            <span className="truncate">{jugador.club?.nombre || 'Sin club'}</span>
            {edad !== null && (
              <>
                <span>•</span>
                <span className="text-slate-300 font-mono">{edad}a</span>
              </>
            )}
          </div>
        </div>
      </div>
      <span
        className={`px-1.5 py-0.5 rounded text-[10px] font-bold border shrink-0 ml-2 shadow-sm ${clasePercentil(
          jugador.score_global ?? 0
        )}`}
      >
        {jugador.score_global}
      </span>
    </div>
  )
}

// ----------------------------------------------------------------------
// Droppable Pitch Slot
// ----------------------------------------------------------------------
function DroppableSlot({
  slot,
  jugador,
  onRemove,
  onAutoSuggest,
  onHoverEnter,
  onHoverLeave,
}: {
  slot: SlotTactico
  jugador: JugadorConClub | null
  onRemove: () => void
  onAutoSuggest: () => void
  onHoverEnter: (pos: Posicion) => void
  onHoverLeave: () => void
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: `slot-${slot.id}`,
    data: { slot },
  })

  return (
    <div
      ref={setNodeRef}
      style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
      className="absolute -translate-x-1/2 -translate-y-1/2 group z-10 flex flex-col items-center"
      onMouseEnter={() => !jugador && onHoverEnter(slot.posicion)}
      onMouseLeave={onHoverLeave}
      onTouchStart={() => !jugador && onHoverEnter(slot.posicion)}
      onTouchEnd={onHoverLeave}
    >
      <div
        onClick={() => !jugador && onAutoSuggest()}
        className={`w-13 h-13 rounded-full flex items-center justify-center font-bold text-xs shadow-2xl border-2 transition-all cursor-pointer ${
          isOver
            ? 'scale-125 border-emerald-400 bg-emerald-950 ring-4 ring-emerald-500/40'
            : 'group-hover:scale-110'
        } ${
          jugador
            ? 'bg-slate-900 border-emerald-400 text-slate-100 ring-2 ring-emerald-500/30'
            : 'bg-slate-950/85 border-dashed border-emerald-500/50 text-emerald-400 hover:border-emerald-400 hover:bg-emerald-950/60'
        }`}
        style={{ width: '48px', height: '48px' }}
      >
        {jugador ? (
          jugador.foto_url ? (
            <img src={jugador.foto_url} alt={jugador.nombre} className="w-full h-full rounded-full object-cover p-0.5 pointer-events-none" />
          ) : (
            <div className="text-center leading-none pointer-events-none">
              <span className="block text-[11px] font-bold text-emerald-400">
                {jugador.score_global}
              </span>
              <span className="block text-[8px] font-mono text-slate-300">
                {jugador.posicion}
              </span>
            </div>
          )
        ) : (
          <div className="flex flex-col items-center justify-center">
            <UserPlus className="w-4 h-4 pointer-events-none opacity-80 group-hover:opacity-100" />
            <span className="text-[7.5px] font-bold tracking-tighter uppercase mt-0.5 pointer-events-none">{slot.posicion}</span>
          </div>
        )}
      </div>

      <div className={`mt-1.5 px-2 py-0.5 rounded-md bg-slate-950/95 border border-slate-800 text-[10px] font-semibold text-slate-200 shadow-xl whitespace-nowrap flex items-center gap-1 transition-all ${isOver ? 'bg-emerald-950 border-emerald-500/60' : ''}`}>
        <span>{jugador ? `${jugador.nombre.charAt(0)}. ${jugador.apellidos}` : POSICION_DETALLADA_LABELS[slot.posicion_detallada]}</span>
        {jugador && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onRemove()
            }}
            className="hover:text-red-400 transition-colors ml-1 bg-slate-800 hover:bg-slate-700 rounded-full p-0.5"
            title="Quitar jugador"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Auto-suggest button only visible on hover if empty */}
      {!jugador && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onAutoSuggest()
          }}
          className="absolute -top-6 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
          title="Sugerir mejor candidato"
        >
          <Wand2 className="w-3 h-3" />
        </button>
      )}
    </div>
  )
}

// ----------------------------------------------------------------------
// Main Section
// ----------------------------------------------------------------------
export function CampogramaSection({ activeModelName, activeModelId }: CampogramaSectionProps) {
  const [jugadores, setJugadores] = useState<JugadorConClub[]>([])
  const [alineacionesGuardadas, setAlineacionesGuardadas] = useState<AlineacionGuardada[]>([])
  const [formacion, setFormacion] = useState('4-3-3')
  const [slots, setSlots] = useState<SlotTactico[]>(FORMACIONES['4-3-3'])
  const [nombreAlineacion, setNombreAlineacion] = useState('')
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [hoveredPosicion, setHoveredPosicion] = useState<Posicion | null>(null)
  const [activeDragJugador, setActiveDragJugador] = useState<JugadorConClub | null>(null)

  // Modales
  const [lineupToDelete, setLineupToDelete] = useState<{ id: string; nombre: string } | null>(null)
  const [deletingLineup, setDeletingLineup] = useState(false)

  // FILTROS LATERALES ACCESIBLES
  const [searchQuery, setSearchQuery] = useState('')
  const [filtroOrigen, setFiltroOrigen] = useState<'todos' | 'plantilla' | 'observados'>('todos')
  const [filtroLinea, setFiltroLinea] = useState<'TODAS' | 'POR' | 'DEF' | 'MED' | 'DEL'>('TODAS')
  const [filtroEdad, setFiltroEdad] = useState<'TODAS' | 'SUB23' | 'PRIME' | 'VETERANOS'>('TODAS')
  const [filtroRating, setFiltroRating] = useState<'TODOS' | '80' | '75' | '70'>('TODOS')

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } })
  )

  useEffect(() => {
    cargarDatos()
  }, [activeModelId])

  const cargarDatos = async () => {
    try {
      const [jugs, alis] = await Promise.all([
        obtenerJugadoresConScoreModelo(undefined, activeModelId),
        obtenerAlineaciones()
      ])
      setJugadores(jugs)
      setAlineacionesGuardadas(alis)
    } catch (err) {
      console.error('Error cargando datos en Campograma:', err)
    }
  }

  const handleFormacionChange = (nuevaFormacion: string) => {
    setFormacion(nuevaFormacion)
    setSlots((currentSlots) => reubicarJugadores(currentSlots, nuevaFormacion))
  }

  const handleSaveLineup = async () => {
    if (!nombreAlineacion.trim()) return
    try {
      const saved = await crearAlineacion({
        nombre: nombreAlineacion.trim(),
        modelo_id: activeModelId || null,
        formacion,
        slots,
        notas: ''
      })
      setAlineacionesGuardadas((prev) => [saved, ...prev])
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 2000)
    } catch (err) {
      console.error('Error guardando alineación:', err)
    }
  }

  const handleRequestDeleteLineup = (id: string, nombre: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setLineupToDelete({ id, nombre })
  }

  const handleConfirmDeleteLineup = async () => {
    if (!lineupToDelete) return
    setDeletingLineup(true)
    try {
      await eliminarAlineacion(lineupToDelete.id)
      setAlineacionesGuardadas((prev) => prev.filter((a) => a.id !== lineupToDelete.id))
      setLineupToDelete(null)
    } catch (err) {
      console.error('Error eliminando alineación:', err)
    } finally {
      setDeletingLineup(false)
    }
  }

  const handleRemovePlayerFromSlot = (slotId: string) => {
    setSlots((prev) => prev.map((s) => (s.id === slotId ? { ...s, jugador_id: null } : s)))
  }

  const handleClearAllSlots = () => {
    setSlots((prev) => prev.map((s) => ({ ...s, jugador_id: null })))
  }

  const handleAutoCompleteBestXI = () => {
    const assigned = new Set<string>()
    setSlots((prev) => {
      return prev.map((slot) => {
        // Encontrar el mejor jugador disponible para esta posición
        const candidates = jugadores
          .filter((j) => !assigned.has(j.id))
          .filter((j) => {
            if (slot.posicion === 'POR') return j.posicion === 'POR'
            if (slot.posicion === 'DFC') return j.posicion === 'DFC'
            if (slot.posicion === 'LAT') return j.posicion === 'LAT'
            if (slot.posicion === 'MCD') return j.posicion === 'MCD' || j.posicion === 'MC'
            if (slot.posicion === 'MC') return j.posicion === 'MC' || j.posicion === 'MCD'
            if (slot.posicion === 'EXT') return j.posicion === 'EXT' || j.posicion === 'DC'
            if (slot.posicion === 'DC') return j.posicion === 'DC' || j.posicion === 'EXT'
            return j.posicion === slot.posicion
          })
          .sort((a, b) => (b.score_global ?? 0) - (a.score_global ?? 0))

        if (candidates.length > 0) {
          const chosen = candidates[0]
          assigned.add(chosen.id)
          return { ...slot, jugador_id: chosen.id }
        }
        return slot
      })
    })
  }

  const handleAutoSuggest = (slotId: string) => {
    const slot = slots.find((s) => s.id === slotId)
    if (!slot) return

    const assignedPlayerIds = slots.filter((s) => s.jugador_id).map((s) => s.jugador_id)
    const candidates = jugadores
      .filter((j) => !assignedPlayerIds.includes(j.id))
      .filter((j) => j.posicion === slot.posicion)
      .sort((a, b) => (b.score_global ?? 0) - (a.score_global ?? 0))

    if (candidates.length > 0) {
      assignPlayerToSlot(candidates[0].id, slotId)
    }
  }

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const j = active.data.current?.jugador as JugadorConClub | undefined
    if (j) setActiveDragJugador(j)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveDragJugador(null)
    if (!over) return

    const overId = String(over.id)
    if (overId.startsWith('slot-')) {
      const slotId = overId.replace('slot-', '')
      const jugador = active.data.current?.jugador as JugadorConClub | undefined
      if (jugador) {
        assignPlayerToSlot(jugador.id, slotId)
      }
    }
  }

  const assignPlayerToSlot = (jugadorId: string, slotId: string) => {
    setSlots((prev) => {
      const nextSlots = prev.map((s) => {
        if (s.jugador_id === jugadorId) return { ...s, jugador_id: null }
        return s
      })
      return nextSlots.map((s) => (s.id === slotId ? { ...s, jugador_id: jugadorId } : s))
    })
  }

  // MÉTRICAS DEL XI EN EL CAMPO
  const xiPlayers = useMemo(() => {
    const ids = slots.map(s => s.jugador_id).filter(Boolean)
    return jugadores.filter(j => ids.includes(j.id))
  }, [slots, jugadores])

  const xiScoreMedio = useMemo(() => {
    if (xiPlayers.length === 0) return 0
    const sum = xiPlayers.reduce((acc, curr) => acc + (curr.score_global || 0), 0)
    return (sum / xiPlayers.length).toFixed(1)
  }, [xiPlayers])

  const xiEdadMedia = useMemo(() => {
    const edades = xiPlayers.map(j => calcularEdad(j.fecha_nacimiento)).filter((e): e is number => e !== null)
    if (edades.length === 0) return null
    const sum = edades.reduce((acc, curr) => acc + curr, 0)
    return (sum / edades.length).toFixed(1)
  }, [xiPlayers])

  // JUGADORES DISPONIBLES Y FILTRADOS
  const assignedPlayerIds = slots.filter((s) => s.jugador_id).map((s) => s.jugador_id)
  
  const filteredAvailablePlayers = useMemo(() => {
    return jugadores
      .filter((j) => !assignedPlayerIds.includes(j.id))
      .filter((j) => {
        // Filtro de origen
        if (filtroOrigen === 'plantilla') {
          return j.club?.nombre?.toLowerCase().includes('grama')
        }
        if (filtroOrigen === 'observados') {
          return !j.club?.nombre?.toLowerCase().includes('grama')
        }
        return true
      })
      .filter((j) => {
        // Filtro por línea
        if (filtroLinea === 'TODAS') return true
        if (filtroLinea === 'POR') return j.posicion === 'POR'
        if (filtroLinea === 'DEF') return j.posicion === 'DFC' || j.posicion === 'LAT'
        if (filtroLinea === 'MED') return j.posicion === 'MC' || j.posicion === 'MCD'
        if (filtroLinea === 'DEL') return j.posicion === 'EXT' || j.posicion === 'DC'
        return true
      })
      .filter((j) => {
        // Filtro por edad
        if (filtroEdad === 'TODAS') return true
        const edad = calcularEdad(j.fecha_nacimiento)
        if (edad === null) return true
        if (filtroEdad === 'SUB23') return edad <= 23
        if (filtroEdad === 'PRIME') return edad >= 24 && edad <= 29
        if (filtroEdad === 'VETERANOS') return edad >= 30
        return true
      })
      .filter((j) => {
        // Filtro por rating
        if (filtroRating === 'TODOS') return true
        const r = parseInt(filtroRating)
        return (j.score_global || 0) >= r
      })
      .filter((j) => {
        // Búsqueda de texto
        if (!searchQuery.trim()) return true
        const q = searchQuery.toLowerCase()
        const fullName = `${j.nombre} ${j.apellidos}`.toLowerCase()
        const clubName = (j.club?.nombre || '').toLowerCase()
        const pos = j.posicion.toLowerCase()
        return fullName.includes(q) || clubName.includes(q) || pos.includes(q)
      })
      .sort((a, b) => (b.score_global ?? 0) - (a.score_global ?? 0))
  }, [jugadores, assignedPlayerIds, filtroOrigen, filtroLinea, filtroEdad, filtroRating, searchQuery])

  // Agrupamiento por posición requerida
  const formacionPosiciones = Array.from(new Set(slots.map(s => s.posicion)))
  const groupedPlayers: Record<string, JugadorConClub[]> = {}
  filteredAvailablePlayers.forEach((j) => {
    if (!groupedPlayers[j.posicion]) groupedPlayers[j.posicion] = []
    groupedPlayers[j.posicion].push(j)
  })

  const sortedPositions = Object.keys(groupedPlayers).sort((a, b) => {
    const aInForm = formacionPosiciones.includes(a as Posicion)
    const bInForm = formacionPosiciones.includes(b as Posicion)
    if (aInForm && !bInForm) return -1
    if (!aInForm && bInForm) return 1
    return 0
  })

  return (
    <DndContext 
      sensors={sensors} 
      onDragStart={handleDragStart} 
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-5">
        {/* Header Bar */}
        <div className="p-4 rounded-2xl bg-slate-900/95 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Grid className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                Pizarra Táctica & Campograma
              </h2>
              <p className="text-xs text-slate-400">
                Ponderación táctica activa: <span className="text-emerald-400 font-semibold">{activeModelName}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            <input 
              type="text" 
              placeholder="Nombre alineación..." 
              className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-sm w-full sm:w-44 text-slate-200 focus:border-emerald-500 focus:outline-none placeholder-slate-500"
              value={nombreAlineacion}
              onChange={(e) => setNombreAlineacion(e.target.value)}
            />
            <div className="w-28">
              <Select
                value={formacion}
                onChange={(e) => handleFormacionChange(e.target.value)}
                options={FORMACIONES_DISPONIBLES.map((f) => ({ value: f, label: f }))}
              />
            </div>
            <Button
              variant="primary"
              size="sm"
              icon={saveSuccess ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              onClick={handleSaveLineup}
            >
              {saveSuccess ? 'Guardado' : 'Guardar'}
            </Button>
          </div>
        </div>

        {/* Tactical Pitch Summary & Quick Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-slate-900/60 border border-slate-800/80 rounded-xl">
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">Titulares:</span>
              <Badge variant={xiPlayers.length === 11 ? 'success' : 'primary'} size="sm">
                {xiPlayers.length}/11
              </Badge>
            </div>
            {xiPlayers.length > 0 && (
              <>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400">Score Medio:</span>
                  <span className="font-bold text-emerald-400 font-mono text-sm">{xiScoreMedio}</span>
                </div>
                {xiEdadMedia && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400">Edad Media:</span>
                    <span className="font-semibold text-slate-200">{xiEdadMedia} años</span>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={<Sparkles className="w-3.5 h-3.5 text-emerald-400" />}
              onClick={handleAutoCompleteBestXI}
              title="Coloca automáticamente a los jugadores con mejor puntuación"
            >
              Autocompletar Mejor XI
            </Button>
            {xiPlayers.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                icon={<RotateCcw className="w-3.5 h-3.5 text-red-400" />}
                onClick={handleClearAllSlots}
                className="hover:text-red-300 hover:bg-red-950/40"
              >
                Limpiar
              </Button>
            )}
          </div>
        </div>

        {/* Main Grid: Pitch + Sidebar */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* Left: Pitch Area (Realistic Broadcast Turf) */}
          <div className="flex-1 w-full flex justify-center">
            <div className="w-full max-w-2xl relative aspect-[3/4] rounded-2xl border-2 border-emerald-500/30 shadow-2xl overflow-hidden bg-slate-950">
              
              {/* Field Background with Grass Cut Stripes */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 133" preserveAspectRatio="none">
                <defs>
                  {/* Césped con franjas alternadas de corte */}
                  <linearGradient id="grassStripes" x1="0" y1="0" x2="0" y2="100%">
                    <stop offset="0%" stopColor="#14532d" />
                    <stop offset="10%" stopColor="#166534" />
                    <stop offset="10.01%" stopColor="#15803d" />
                    <stop offset="20%" stopColor="#166534" />
                    <stop offset="20.01%" stopColor="#14532d" />
                    <stop offset="30%" stopColor="#166534" />
                    <stop offset="30.01%" stopColor="#15803d" />
                    <stop offset="40%" stopColor="#166534" />
                    <stop offset="40.01%" stopColor="#14532d" />
                    <stop offset="50%" stopColor="#166534" />
                    <stop offset="50.01%" stopColor="#15803d" />
                    <stop offset="60%" stopColor="#166534" />
                    <stop offset="60.01%" stopColor="#14532d" />
                    <stop offset="70%" stopColor="#166534" />
                    <stop offset="70.01%" stopColor="#15803d" />
                    <stop offset="80%" stopColor="#166534" />
                    <stop offset="80.01%" stopColor="#14532d" />
                    <stop offset="90%" stopColor="#166534" />
                    <stop offset="90.01%" stopColor="#15803d" />
                    <stop offset="100%" stopColor="#14532d" />
                  </linearGradient>
                  {/* Iluminación de foco de estadio */}
                  <radialGradient id="stadiumGlow" cx="50%" cy="50%" r="65%">
                    <stop offset="0%" stopColor="rgba(255,255,255,0.08)" />
                    <stop offset="70%" stopColor="rgba(0,0,0,0.15)" />
                    <stop offset="100%" stopColor="rgba(0,0,0,0.45)" />
                  </radialGradient>
                </defs>

                {/* Fondo césped y gradiente */}
                <rect x="0" y="0" width="100" height="133" fill="url(#grassStripes)" />
                <rect x="0" y="0" width="100" height="133" fill="url(#stadiumGlow)" />

                {/* Líneas tácticas luminosas de campo */}
                <rect x="3" y="3" width="94" height="127" rx="1.5" fill="none" stroke="rgba(255,255,255,0.65)" strokeWidth="0.6" />
                <line x1="3" y1="66.5" x2="97" y2="66.5" stroke="rgba(255,255,255,0.65)" strokeWidth="0.6" />
                <circle cx="50" cy="66.5" r="13" fill="none" stroke="rgba(255,255,255,0.65)" strokeWidth="0.6" />
                <circle cx="50" cy="66.5" r="0.9" fill="rgba(255,255,255,0.85)" />

                {/* Área Superior (Rival) */}
                <rect x="22" y="3" width="56" height="21" fill="none" stroke="rgba(255,255,255,0.65)" strokeWidth="0.6" />
                <rect x="35" y="3" width="30" height="7.5" fill="none" stroke="rgba(255,255,255,0.65)" strokeWidth="0.6" />
                <path d="M 41 24 A 9 9 0 0 0 59 24" fill="none" stroke="rgba(255,255,255,0.65)" strokeWidth="0.6" />
                <circle cx="50" cy="15" r="0.8" fill="rgba(255,255,255,0.85)" />

                {/* Área Inferior (Propia) */}
                <rect x="22" y="109" width="56" height="21" fill="none" stroke="rgba(255,255,255,0.65)" strokeWidth="0.6" />
                <rect x="35" y="122.5" width="30" height="7.5" fill="none" stroke="rgba(255,255,255,0.65)" strokeWidth="0.6" />
                <path d="M 41 109 A 9 9 0 0 1 59 109" fill="none" stroke="rgba(255,255,255,0.65)" strokeWidth="0.6" />
                <circle cx="50" cy="118" r="0.8" fill="rgba(255,255,255,0.85)" />
              </svg>

              {/* Render Slots on Pitch */}
              {slots.map((slot) => (
                <DroppableSlot
                  key={slot.id}
                  slot={slot}
                  jugador={jugadores.find((j) => j.id === slot.jugador_id) || null}
                  onRemove={() => handleRemovePlayerFromSlot(slot.id)}
                  onAutoSuggest={() => handleAutoSuggest(slot.id)}
                  onHoverEnter={(pos) => setHoveredPosicion(pos)}
                  onHoverLeave={() => setHoveredPosicion(null)}
                />
              ))}
            </div>
          </div>

          {/* Right: Side Panel (Players & Filters) */}
          <div className="w-full lg:w-96 flex flex-col gap-4">
            
            <Card className="flex flex-col max-h-[750px] shadow-xl border-slate-800">
              <CardHeader className="pb-3 border-b border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Users className="w-4 h-4 text-emerald-400" />
                    <span>Selección de Jugadores</span>
                  </CardTitle>
                  <span className="text-xs font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
                    {filteredAvailablePlayers.length} disp.
                  </span>
                </div>

                {/* Origen Segmented Controls: Mi Club vs Observados vs Todos */}
                <div className="grid grid-cols-3 p-1 bg-slate-950 rounded-lg border border-slate-800 text-[11px] font-semibold">
                  <button
                    onClick={() => setFiltroOrigen('todos')}
                    className={`py-1 rounded transition-colors ${filtroOrigen === 'todos' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    Todos
                  </button>
                  <button
                    onClick={() => setFiltroOrigen('plantilla')}
                    className={`py-1 rounded transition-colors ${filtroOrigen === 'plantilla' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    Mi Club
                  </button>
                  <button
                    onClick={() => setFiltroOrigen('observados')}
                    className={`py-1 rounded transition-colors ${filtroOrigen === 'observados' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    Scouting
                  </button>
                </div>

                {/* Search Bar */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Buscar por jugador o club..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-200">
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Filtros visuales: Línea */}
                <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[10.5px]">
                  {(['TODAS', 'POR', 'DEF', 'MED', 'DEL'] as const).map((linea) => (
                    <button
                      key={linea}
                      onClick={() => setFiltroLinea(linea)}
                      className={`px-2 py-1 rounded-md font-bold transition-colors ${
                        filtroLinea === linea
                          ? 'bg-slate-200 text-slate-900 shadow'
                          : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                      }`}
                    >
                      {linea}
                    </button>
                  ))}
                </div>

                {/* Filtros secundarios: Edad & Rating */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1 font-semibold">Edad</label>
                    <select
                      value={filtroEdad}
                      onChange={(e) => setFiltroEdad(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 focus:border-emerald-500 focus:outline-none"
                    >
                      <option value="TODAS">Todas las edades</option>
                      <option value="SUB23">Sub-23 (≤ 23a)</option>
                      <option value="PRIME">Prime (24-29a)</option>
                      <option value="VETERANOS">Veteranos (30+)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1 font-semibold">Score Mínimo</label>
                    <select
                      value={filtroRating}
                      onChange={(e) => setFiltroRating(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 focus:border-emerald-500 focus:outline-none"
                    >
                      <option value="TODOS">Cualquier rating</option>
                      <option value="80">Score ≥ 80 (Top)</option>
                      <option value="75">Score ≥ 75 (Alto)</option>
                      <option value="70">Score ≥ 70 (Medio)</option>
                    </select>
                  </div>
                </div>
              </CardHeader>

              {/* Lista de Jugadores Arrastrables */}
              <CardContent className="p-3 overflow-y-auto space-y-3.5 flex-1">
                {sortedPositions.length > 0 ? (
                  sortedPositions.map((pos) => {
                    const isRequired = formacionPosiciones.includes(pos as Posicion)
                    const isHoveredMatch = hoveredPosicion === pos
                    return (
                      <div key={pos} className={`space-y-1.5 transition-opacity ${hoveredPosicion && !isHoveredMatch ? 'opacity-30' : 'opacity-100'}`}>
                        <div className="flex items-center justify-between px-1">
                          <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            {pos}
                            {isRequired && <span className="text-[9px] font-normal text-emerald-400/90 font-mono">(Táctica)</span>}
                          </h4>
                          <span className="text-[10px] text-slate-500 font-mono">{groupedPlayers[pos].length}</span>
                        </div>
                        <div className="space-y-1.5">
                          {groupedPlayers[pos].map((j) => (
                            <DraggablePlayer key={j.id} jugador={j} isHighlighted={isHoveredMatch} />
                          ))}
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div className="text-center py-12 text-slate-500 text-xs">
                    No hay jugadores que coincidan con los filtros seleccionados.
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Saved Lineups */}
            <Card className="border-slate-800">
              <CardHeader className="py-2.5 px-3.5 border-b border-slate-800 flex flex-row items-center justify-between">
                <CardTitle className="text-xs font-semibold text-slate-300">Alineaciones Guardadas</CardTitle>
                <span className="text-[10px] text-slate-500 font-mono">{alineacionesGuardadas.length}</span>
              </CardHeader>
              <CardContent className="p-0 max-h-40 overflow-y-auto divide-y divide-slate-800/80">
                {alineacionesGuardadas.length > 0 ? (
                  alineacionesGuardadas.map((ali) => (
                    <div
                      key={ali.id}
                      onClick={() => {
                        setFormacion(ali.formacion)
                        setSlots(ali.slots)
                        setNombreAlineacion(ali.nombre)
                      }}
                      className="p-2.5 hover:bg-slate-900/60 cursor-pointer transition-colors flex items-center justify-between text-xs group"
                    >
                      <div className="min-w-0 pr-2">
                        <p className="font-semibold text-slate-200 truncate">{ali.nombre}</p>
                        <p className="text-[10px] text-slate-400 font-mono">Formación: {ali.formacion}</p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-red-400 hover:text-red-300 hover:bg-red-400/10"
                          onClick={(e) => handleRequestDeleteLineup(ali.id, ali.nombre, e)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-3 text-slate-500 text-[11px]">
                    Sin alineaciones guardadas.
                  </div>
                )}
              </CardContent>
            </Card>

          </div>
        </div>
      </div>

      <DragOverlay>
        {activeDragJugador ? (
          <div className="p-2.5 rounded-xl bg-slate-900 border-2 border-emerald-400 shadow-2xl flex items-center gap-2.5 text-xs rotate-2 scale-105 pointer-events-none ring-4 ring-emerald-500/20">
             {activeDragJugador.foto_url ? (
                <img src={activeDragJugador.foto_url} alt="" className="w-7 h-7 rounded-full object-cover border border-slate-700" />
              ) : (
                <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-[9px] font-bold text-slate-300">
                  {activeDragJugador.nombre.charAt(0)}{activeDragJugador.apellidos.charAt(0)}
                </div>
              )}
             <div>
               <span className="font-bold text-slate-100 block">{activeDragJugador.nombre} {activeDragJugador.apellidos}</span>
               <span className="text-[9px] text-emerald-400 font-mono">{activeDragJugador.posicion} • Score {activeDragJugador.score_global}</span>
             </div>
          </div>
        ) : null}
      </DragOverlay>

      {/* Delete Alignment Confirmation Modal */}
      {lineupToDelete && (
        <ConfirmModal
          isOpen={!!lineupToDelete}
          onClose={() => setLineupToDelete(null)}
          onConfirm={handleConfirmDeleteLineup}
          title="Confirmar eliminación de alineación"
          message={`¿Estás seguro de que deseas eliminar la alineación "${lineupToDelete.nombre}"? Esta acción no se puede deshacer.`}
          confirmText="Eliminar Alineación"
          loading={deletingLineup}
        />
      )}
    </DndContext>
  )
}
