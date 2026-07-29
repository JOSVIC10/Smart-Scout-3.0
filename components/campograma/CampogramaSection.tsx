'use client'

import React, { useState, useEffect } from 'react'
import {
  Grid, Save, X, UserPlus, Trash2, Wand2, Check
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { FORMACIONES, FORMACIONES_DISPONIBLES, reubicarJugadores } from '@/lib/formations'
import { POSICION_DETALLADA_LABELS, clasePercentil } from '@/lib/constants'
import { obtenerJugadores } from '@/lib/supabase/jugadores'
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

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`p-2 rounded-xl border flex items-center justify-between text-xs cursor-grab transition-all select-none touch-none ${
        isDragging
          ? 'opacity-50 scale-95 border-emerald-500 bg-emerald-950'
          : isHighlighted
          ? 'bg-emerald-950/60 border-emerald-500/50 scale-[1.02]'
          : 'bg-slate-900/60 hover:bg-slate-800/80 border-slate-800 hover:border-slate-700'
      }`}
    >
      <div className="flex items-center gap-2 min-w-0">
        {jugador.foto_url ? (
          <img src={jugador.foto_url} alt={jugador.nombre} className="w-6 h-6 rounded-full object-cover border border-slate-700 pointer-events-none" />
        ) : (
          <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-[8px] font-bold text-slate-400 pointer-events-none">
            {jugador.nombre.charAt(0)}{jugador.apellidos.charAt(0)}
          </div>
        )}
        <div className="truncate">
          <p className="font-semibold text-slate-200 truncate">{jugador.nombre} {jugador.apellidos}</p>
          <p className="text-[9px] text-slate-400 font-mono truncate">{jugador.club?.nombre || 'Sin club'}</p>
        </div>
      </div>
      <span
        className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ml-2 ${clasePercentil(
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
        className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-xs shadow-xl border-2 transition-all cursor-pointer ${
          isOver ? 'scale-125 border-emerald-400 bg-emerald-950 ring-4 ring-emerald-500/30' : 'group-hover:scale-110'
        } ${
          jugador
            ? 'bg-slate-900 border-emerald-400 text-slate-100'
            : 'bg-slate-950/80 border-dashed border-slate-600 text-slate-400 hover:border-emerald-400 hover:text-emerald-300'
        }`}
      >
        {jugador ? (
          jugador.foto_url ? (
            <img src={jugador.foto_url} alt={jugador.nombre} className="w-full h-full rounded-full object-cover p-0.5 pointer-events-none" />
          ) : (
            <div className="text-center leading-none pointer-events-none">
              <span className="block text-[11px] font-bold text-emerald-400">
                {jugador.score_global}
              </span>
              <span className="block text-[9px] font-mono text-slate-300">
                #{jugador.dorsal ?? ''}
              </span>
            </div>
          )
        ) : (
          <UserPlus className="w-5 h-5 pointer-events-none opacity-50 group-hover:opacity-100" />
        )}
      </div>

      <div className={`mt-1.5 px-2 py-0.5 rounded-md bg-slate-950/90 border border-slate-800 text-[10px] font-semibold text-slate-200 shadow-md whitespace-nowrap flex items-center gap-1 transition-all ${isOver ? 'bg-emerald-950 border-emerald-500/50' : ''}`}>
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
          title="Sugerencia automática"
        >
          <Wand2 className="w-3 h-3" />
        </button>
      )}
    </div>
  )
}


export function CampogramaSection({ activeModelName }: CampogramaSectionProps) {
  const [formacion, setFormacion] = useState<string>('4-3-3')
  const [slots, setSlots] = useState<SlotTactico[]>(FORMACIONES['4-3-3'])
  const [jugadores, setJugadores] = useState<JugadorConClub[]>([])
  const [alineacionesGuardadas, setAlineacionesGuardadas] = useState<AlineacionGuardada[]>([])
  const [nombreAlineacion, setNombreAlineacion] = useState('')
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [hoveredPosicion, setHoveredPosicion] = useState<Posicion | null>(null)
  
  const [activeDragJugador, setActiveDragJugador] = useState<JugadorConClub | null>(null)

  // Sensors for drag and drop
  const mouseSensor = useSensor(MouseSensor, { activationConstraint: { distance: 5 } })
  const touchSensor = useSensor(TouchSensor, { activationConstraint: { delay: 100, tolerance: 5 } })
  const sensors = useSensors(mouseSensor, touchSensor)

  useEffect(() => {
    async function loadData() {
      try {
        const [jugs, alis] = await Promise.all([obtenerJugadores(), obtenerAlineaciones()])
        setJugadores(jugs)
        setAlineacionesGuardadas(alis)
      } catch (err) {
        console.error('Error al cargar campograma:', err)
      }
    }
    loadData()
  }, [])

  const handleFormacionChange = (nuevaFormacion: string) => {
    setFormacion(nuevaFormacion)
    const nuevos = reubicarJugadores(slots, nuevaFormacion)
    setSlots(nuevos)
  }

  const handleRemovePlayerFromSlot = (slotId: string) => {
    setSlots((prev) =>
      prev.map((s) => (s.id === slotId ? { ...s, jugador_id: null } : s))
    )
  }

  const handleAutoSuggest = (slotId: string) => {
    const slot = slots.find((s) => s.id === slotId)
    if (!slot) return

    const assignedIds = slots.filter((s) => s.jugador_id).map((s) => s.jugador_id)
    const candidates = jugadores
      .filter((j) => j.posicion === slot.posicion && !assignedIds.includes(j.id))
      .sort((a, b) => (b.score_global ?? 0) - (a.score_global ?? 0))

    if (candidates.length > 0) {
      setSlots((prev) =>
        prev.map((s) => (s.id === slotId ? { ...s, jugador_id: candidates[0].id } : s))
      )
    }
  }

  const handleSaveLineup = async () => {
    const nombre = nombreAlineacion.trim() || `Alineación ${formacion}`
    try {
      await crearAlineacion({
        nombre,
        modelo_id: null, // Podríamos guardar el activeModelId si viniera por props
        formacion,
        slots,
        notas: null,
      })
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
      obtenerAlineaciones().then(setAlineacionesGuardadas)
    } catch (err) {
      console.error('Error al guardar alineación:', err)
    }
  }

  const [lineupToDelete, setLineupToDelete] = useState<{ id: string; nombre: string } | null>(null)
  const [deletingLineup, setDeletingLineup] = useState(false)

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
      console.error('Error al eliminar alineación:', err)
    } finally {
      setDeletingLineup(false)
    }
  }

  // Drag and Drop Handlers
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    if (active.data.current?.jugador) {
      setActiveDragJugador(active.data.current.jugador)
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDragJugador(null)
    const { active, over } = event

    if (!over) return

    const jugadorId = active.id.toString().replace('player-', '')
    const slotId = over.id.toString().replace('slot-', '')

    // Verificar si el jugador ya está en otro slot y quitarlo de allí (swap or move)
    setSlots((prev) => {
      const nextSlots = prev.map((s) => {
        // Quitar al jugador de su posición anterior si existía
        if (s.jugador_id === jugadorId) return { ...s, jugador_id: null }
        return s
      })
      // Asignar al nuevo slot
      return nextSlots.map((s) => (s.id === slotId ? { ...s, jugador_id: jugadorId } : s))
    })
  }

  // Data processing for side panel
  const assignedPlayerIds = slots.filter((s) => s.jugador_id).map((s) => s.jugador_id)
  const availablePlayers = jugadores
    .filter((j) => !assignedPlayerIds.includes(j.id))
    .sort((a, b) => (b.score_global ?? 0) - (a.score_global ?? 0))

  // Agrupar por posiciones requeridas en la formación actual para mayor relevancia,
  // y luego el resto de posiciones.
  const formacionPosiciones = Array.from(new Set(slots.map(s => s.posicion)))
  
  const groupedPlayers: Record<string, JugadorConClub[]> = {}
  availablePlayers.forEach((j) => {
    if (!groupedPlayers[j.posicion]) groupedPlayers[j.posicion] = []
    groupedPlayers[j.posicion].push(j)
  })

  // Ordenar grupos: primero los que requiere la formación, luego el resto
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
      <div className="space-y-6">
        {/* Header Bar */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Grid className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-bold text-slate-100">
              Pizarra Táctica
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <input 
              type="text" 
              placeholder="Nombre alineación..." 
              className="bg-slate-950 border border-slate-800 rounded-md px-3 py-1.5 text-sm w-full sm:w-48 text-slate-200 focus:border-emerald-500 focus:outline-none"
              value={nombreAlineacion}
              onChange={(e) => setNombreAlineacion(e.target.value)}
            />
            <div className="w-32">
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

        {/* Main Grid: Pitch + Sidebar */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left: Pitch Area */}
          <div className="flex-1 flex justify-center">
            <div className="w-full max-w-2xl relative aspect-[3/4] pitch-bg rounded-2xl border-2 border-emerald-600/40 shadow-2xl overflow-hidden bg-emerald-900/20">
              {/* Field SVG markings (Vertical Pitch) */}
              <svg className="absolute inset-0 w-full h-full pitch-lines pointer-events-none" viewBox="0 0 100 133">
                <rect x="2" y="2" width="96" height="129" rx="2" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="0.5" />
                <line x1="2" y1="66.5" x2="98" y2="66.5" stroke="rgba(255,255,255,0.2)" strokeWidth="0.5" />
                <circle cx="50" cy="66.5" r="14" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="0.5" />
                <circle cx="50" cy="66.5" r="1" fill="rgba(255,255,255,0.3)" />
                <rect x="20" y="2" width="60" height="22" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="0.5" />
                <rect x="34" y="2" width="32" height="8" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="0.5" />
                <path d="M 40 24 A 10 10 0 0 0 60 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="0.5" />
                <rect x="20" y="109" width="60" height="22" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="0.5" />
                <rect x="34" y="123" width="32" height="8" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="0.5" />
                <path d="M 40 109 A 10 10 0 0 1 60 109" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="0.5" />
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

          {/* Right: Side Panel (Players & Saved) */}
          <div className="w-full lg:w-80 flex flex-col gap-4">
            
            <Card className="flex-1 flex flex-col max-h-[60vh] lg:max-h-[800px]">
              <CardHeader className="pb-3 border-b border-slate-800">
                <CardTitle className="text-base flex items-center justify-between">
                  <span>Plantilla</span>
                  <Badge variant="primary" size="sm">
                    {slots.filter((s) => s.jugador_id !== null).length}/11
                  </Badge>
                </CardTitle>
                <p className="text-[10px] text-slate-400 leading-tight mt-1">
                  Arrastra jugadores a la pizarra. Ordenados por score del modelo: <strong className="text-emerald-400">{activeModelName}</strong>
                </p>
              </CardHeader>
              <CardContent className="p-3 overflow-y-auto space-y-4">
                {sortedPositions.length > 0 ? (
                  sortedPositions.map((pos) => {
                    const isRequired = formacionPosiciones.includes(pos as Posicion)
                    const isHoveredMatch = hoveredPosicion === pos
                    return (
                      <div key={pos} className={`space-y-1.5 transition-opacity ${hoveredPosicion && !isHoveredMatch ? 'opacity-30' : 'opacity-100'}`}>
                        <div className="flex items-center justify-between px-1">
                          <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                            {pos}
                            {isRequired && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="Requerida en la formación actual" />}
                          </h4>
                          <span className="text-[10px] text-slate-500">{groupedPlayers[pos].length}</span>
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
                  <div className="text-center py-10 text-slate-500 text-xs">
                    Todos los jugadores están asignados.
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Saved Lineups */}
            <Card>
              <CardHeader className="pb-2 border-b border-slate-800">
                <CardTitle className="text-base">Guardadas</CardTitle>
              </CardHeader>
              <CardContent className="p-0 max-h-48 overflow-y-auto divide-y divide-slate-800">
                {alineacionesGuardadas.length > 0 ? (
                  alineacionesGuardadas.map((ali) => (
                    <div
                      key={ali.id}
                      onClick={() => {
                        setFormacion(ali.formacion)
                        setSlots(ali.slots)
                        setNombreAlineacion(ali.nombre)
                      }}
                      className="p-3 hover:bg-slate-900/60 cursor-pointer transition-colors flex items-center justify-between text-xs group"
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
                  <div className="text-center py-4 text-slate-500 text-xs">
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
          <div className="p-2 rounded-xl bg-slate-800 border-2 border-emerald-500 shadow-2xl flex items-center gap-2 text-xs opacity-90 rotate-3 scale-105 pointer-events-none">
             {activeDragJugador.foto_url ? (
                <img src={activeDragJugador.foto_url} alt="" className="w-6 h-6 rounded-full object-cover" />
              ) : (
                <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-[8px] font-bold text-slate-300">
                  {activeDragJugador.nombre.charAt(0)}{activeDragJugador.apellidos.charAt(0)}
                </div>
              )}
             <span className="font-bold text-slate-100">{activeDragJugador.nombre}</span>
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
          message={`¿Estás seguro de que deseas eliminar la alineación "${lineupToDelete.nombre}"? esta acción no se puede deshacer.`}
          confirmText="Eliminar Alineación"
          loading={deletingLineup}
        />
      )}
    </DndContext>
  )
}
