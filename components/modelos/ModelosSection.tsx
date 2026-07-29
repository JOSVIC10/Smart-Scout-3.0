'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  Sliders,
  GripVertical,
  Save,
  Check,
  Plus,
  ShieldCheck,
  Lock,
  Trash2,
  Edit3,
  Eye,
  X,
  BarChart2,
  Users,
  RefreshCw,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import {
  obtenerModelos,
  crearModelo,
  actualizarModelo,
  eliminarModelo,
  obtenerPonderaciones,
  guardarPonderaciones,
} from '@/lib/supabase/modelos'
import { obtenerMetricasN2PorPosicion } from '@/lib/supabase/metricas'
import { obtenerJugadores } from '@/lib/supabase/jugadores'
import { POSICION_LABELS } from '@/lib/constants'
import { calcularPesosRankSum } from '@/lib/scoring/rankSum'
import { calcularScorePreview } from '@/lib/scoring/calcularScore'
import type { ModeloJuego, PonderacionModelo, Posicion, JugadorConClub } from '@/types/database'

// ─── Sortable Item ─────────────────────────────────────────────────────────

interface SortableItemProps {
  id: string
  nombre: string
  rango: number
  peso: number
  disabled?: boolean
}

function SortableItem({ id, nombre, rango, peso, disabled }: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    disabled,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`p-3 rounded-xl border flex items-center justify-between transition-all select-none ${
        isDragging
          ? 'bg-emerald-950/80 border-emerald-500/80 shadow-2xl z-20 scale-[1.02]'
          : disabled
          ? 'bg-slate-900/40 border-slate-800/50 opacity-60'
          : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
      }`}
    >
      <div className="flex items-center gap-3">
        {!disabled ? (
          <button
            type="button"
            {...attributes}
            {...listeners}
            className="p-1 rounded text-slate-500 hover:text-slate-200 cursor-grab active:cursor-grabbing"
          >
            <GripVertical className="w-4 h-4" />
          </button>
        ) : (
          <div className="p-1 text-slate-700">
            <Lock className="w-3.5 h-3.5" />
          </div>
        )}

        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-md bg-slate-800 text-slate-300 font-mono font-bold text-xs flex items-center justify-center border border-slate-700">
            #{rango}
          </span>
          <span className="text-xs font-bold text-slate-200">{nombre}</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-400 font-mono">Rank-Sum:</span>
        <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
          {(peso * 100).toFixed(1)}%
        </span>
      </div>
    </div>
  )
}

// ─── Score Preview Row ──────────────────────────────────────────────────────

interface ScorePreviewRowProps {
  jugador: JugadorConClub
  posicion: Posicion
  ponderaciones: { metrica_n2_id: string; rango: number; peso: number }[]
}

function ScorePreviewRow({ jugador, posicion, ponderaciones }: ScorePreviewRowProps) {
  const [preview, setPreview] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (jugador.posicion !== posicion) {
      setPreview(null)
      return
    }
    if (ponderaciones.length === 0) return

    let cancelled = false
    setLoading(true)
    calcularScorePreview(jugador.id, posicion, ponderaciones)
      .then((s) => { if (!cancelled) setPreview(s) })
      .catch(() => { if (!cancelled) setPreview(null) })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [jugador.id, posicion, ponderaciones])

  if (jugador.posicion !== posicion) return null

  return (
    <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-[9px] font-bold text-slate-300">
          {jugador.nombre[0]}{jugador.apellidos[0]}
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-200 leading-tight">
            {jugador.nombre} {jugador.apellidos}
          </p>
          <p className="text-[10px] text-slate-500">{jugador.club?.nombre ?? 'Sin club'}</p>
        </div>
      </div>
      <div className="text-right">
        {loading ? (
          <div className="w-8 h-4 bg-slate-800 rounded animate-pulse" />
        ) : preview !== null ? (
          <span className={`text-sm font-black px-2 py-0.5 rounded-lg ${
            preview >= 70 ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
            : preview >= 50 ? 'text-amber-400 bg-amber-500/10 border border-amber-500/20'
            : 'text-red-400 bg-red-500/10 border border-red-500/20'
          }`}>
            {preview}
          </span>
        ) : (
          <span className="text-[10px] text-slate-600">—</span>
        )}
      </div>
    </div>
  )
}

// ─── New Model Modal ────────────────────────────────────────────────────────

interface NuevoModeloModalProps {
  isOpen: boolean
  onClose: () => void
  onCreated: (modelo: ModeloJuego) => void
}

function NuevoModeloModal({ isOpen, onClose, onCreated }: NuevoModeloModalProps) {
  const [nombre, setNombre] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [formacion, setFormacion] = useState('4-3-3')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nombre.trim()) { setError('El nombre es obligatorio'); return }
    setSaving(true)
    setError('')
    try {
      const nuevo = await crearModelo({
        nombre: nombre.trim(),
        descripcion: descripcion.trim() || null,
        es_predefinido: false,
        formacion: formacion.trim() || null,
      })
      onCreated(nuevo)
      setNombre('')
      setDescripcion('')
      setFormacion('4-3-3')
      onClose()
    } catch (err: any) {
      setError(err?.message ?? 'Error al crear modelo')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-100">Nuevo Modelo de Juego</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-300 mb-1.5 block">Nombre *</label>
            <Input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Presión Ultra-Alta 5-2-3"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-300 mb-1.5 block">Descripción</label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              rows={3}
              placeholder="Descripción táctica del modelo..."
              className="w-full px-3 py-2 bg-slate-900/80 border border-slate-700 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/70 resize-none transition-colors"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-300 mb-1.5 block">Formación por defecto</label>
            <Input
              value={formacion}
              onChange={(e) => setFormacion(e.target.value)}
              placeholder="4-3-3, 4-2-3-1, 3-5-2..."
            />
          </div>

          {error && (
            <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="outline" size="sm" onClick={onClose} type="button">Cancelar</Button>
            <Button variant="primary" size="sm" icon={<Plus className="w-4 h-4" />} loading={saving} type="submit">
              Crear Modelo
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Main ModelosSection ────────────────────────────────────────────────────

interface ModelosSectionProps {
  activeModelId: string
  onSetActiveModel: (modelo: ModeloJuego) => void
}

export function ModelosSection({ activeModelId, onSetActiveModel }: ModelosSectionProps) {
  const [modelos, setModelos] = useState<ModeloJuego[]>([])
  const [selectedModelo, setSelectedModelo] = useState<ModeloJuego | null>(null)
  const [selectedPosicion, setSelectedPosicion] = useState<Posicion>('MC')
  const [orderedMetricas, setOrderedMetricas] = useState<{ id: string; nombre: string }[]>([])
  const [savedSuccess, setSavedSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showNewModal, setShowNewModal] = useState(false)

  // Score preview
  const [jugadoresPosicion, setJugadoresPosicion] = useState<JugadorConClub[]>([])
  const [showPreview, setShowPreview] = useState(false)
  const [previewPonderaciones, setPreviewPonderaciones] = useState<{ metrica_n2_id: string; rango: number; peso: number }[]>([])

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  // ── Load initial data ──────────────────────────────────────────────────────
  useEffect(() => {
    async function loadInitial() {
      try {
        const mods = await obtenerModelos()
        setModelos(mods)
        const current = mods.find((m) => m.id === activeModelId) || mods[0]
        if (current) setSelectedModelo(current)
      } catch (err) {
        console.error('Error al cargar modelos:', err)
      }
    }
    loadInitial()
  }, [activeModelId])

  // ── Load weights when model or position changes ────────────────────────────
  useEffect(() => {
    if (!selectedModelo) return

    async function loadWeights() {
      try {
        const ponders = await obtenerPonderaciones(selectedModelo!.id, selectedPosicion)
        const n2Pos = await obtenerMetricasN2PorPosicion(selectedPosicion)

        if (ponders.length > 0) {
          const items = ponders.map((p) => {
            const found = n2Pos.find((n) => n.metrica_n2_id === p.metrica_n2_id)
            return { id: p.metrica_n2_id, nombre: found?.metrica_n2.nombre ?? p.metrica_n2_id }
          })
          setOrderedMetricas(items)
        } else {
          setOrderedMetricas(n2Pos.map((n) => ({ id: n.metrica_n2_id, nombre: n.metrica_n2.nombre })))
        }
      } catch (err) {
        console.error('Error al cargar ponderaciones:', err)
      }
    }
    loadWeights()
  }, [selectedModelo, selectedPosicion])

  // ── Update preview ponderaciones when order changes ─────────────────────
  useEffect(() => {
    const pesos = calcularPesosRankSum(orderedMetricas.length)
    setPreviewPonderaciones(
      orderedMetricas.map((m, idx) => ({
        metrica_n2_id: m.id,
        rango: idx + 1,
        peso: Math.round(pesos[idx] * 10000) / 10000,
      }))
    )
  }, [orderedMetricas])

  // ── Load players for preview ──────────────────────────────────────────────
  useEffect(() => {
    if (!showPreview) return
    obtenerJugadores({ posicion: selectedPosicion })
      .then(setJugadoresPosicion)
      .catch((err) => console.warn('[Modelos] Error al cargar jugadores para preview:', err?.message ?? err))
  }, [showPreview, selectedPosicion])

  // ── Drag & drop ──────────────────────────────────────────────────────────
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      setOrderedMetricas((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id)
        const newIndex = items.findIndex((i) => i.id === over.id)
        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }

  // ── Save weights ──────────────────────────────────────────────────────────
  const handleSaveWeights = async () => {
    if (!selectedModelo) return
    if (selectedModelo.es_predefinido) return // safety guard
    setLoading(true)
    try {
      const pesosCalculados = calcularPesosRankSum(orderedMetricas.length)
      const nuevasPonderaciones = orderedMetricas.map((m, idx) => ({
        modelo_id: selectedModelo.id,
        posicion: selectedPosicion,
        metrica_n2_id: m.id,
        rango: idx + 1,
        peso: Math.round(pesosCalculados[idx] * 10000) / 10000,
      }))
      await guardarPonderaciones(selectedModelo.id, selectedPosicion, nuevasPonderaciones)
      setSavedSuccess(true)
      setTimeout(() => setSavedSuccess(false), 3000)
    } catch (err) {
      console.error('Error al guardar ponderaciones:', err)
    } finally {
      setLoading(false)
    }
  }

  const [showConfirmDelete, setShowConfirmDelete] = useState(false)

  // ── Delete custom model ───────────────────────────────────────────────────
  const handleDeleteModelo = () => {
    if (!selectedModelo || selectedModelo.es_predefinido) return
    setShowConfirmDelete(true)
  }

  const handleConfirmDeleteModelo = async () => {
    if (!selectedModelo || selectedModelo.es_predefinido) return
    setDeleting(true)
    try {
      await eliminarModelo(selectedModelo.id)
      const nuevos = modelos.filter((m) => m.id !== selectedModelo.id)
      setModelos(nuevos)
      setSelectedModelo(nuevos[0] ?? null)
    } catch (err) {
      console.error('Error al eliminar modelo:', err)
    } finally {
      setDeleting(false)
    }
  }

  const pesos = calcularPesosRankSum(orderedMetricas.length)
  const isPredefinido = selectedModelo?.es_predefinido ?? true

  // Predefined vs custom model lists
  const modelosPredefinidos = modelos.filter((m) => m.es_predefinido)
  const modelosPersonalizados = modelos.filter((m) => !m.es_predefinido)

  return (
    <div className="space-y-6">
      {/* ── Top Bar ────────────────────────────────────────────────────────── */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
            <Sliders className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100">Modelos de Juego</h2>
            <p className="text-xs text-slate-400">Configurador táctico · Ponderaciones Rank-Sum</p>
          </div>
        </div>

        <Button
          variant="primary"
          size="sm"
          icon={<Plus className="w-4 h-4" />}
          onClick={() => setShowNewModal(true)}
        >
          Nuevo Modelo
        </Button>
      </div>

      {/* ── Main Content Grid ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── LEFT: Model list ─────────────────────────────────────────────── */}
        <div className="space-y-4">
          {/* Predefined models */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                Modelos Predefinidos
                <Badge variant="secondary" size="sm">{modelosPredefinidos.length}</Badge>
              </CardTitle>
              <CardDescription>Solo lectura — no se pueden editar ni borrar</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {modelosPredefinidos.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setSelectedModelo(m)}
                  className={`w-full text-left p-3 rounded-xl border transition-all ${
                    selectedModelo?.id === m.id
                      ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
                      : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold">{m.nombre}</span>
                    <div className="flex items-center gap-1">
                      {m.id === activeModelId && (
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      )}
                      <span className="text-[9px] font-mono text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded">
                        {m.formacion}
                      </span>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5 truncate">{m.descripcion}</p>
                </button>
              ))}
            </CardContent>
          </Card>

          {/* Custom models */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Edit3 className="w-3.5 h-3.5 text-blue-400" />
                Modelos Personalizados
                <Badge variant="outline" size="sm">{modelosPersonalizados.length}</Badge>
              </CardTitle>
              <CardDescription>Totalmente editables</CardDescription>
            </CardHeader>
            <CardContent>
              {modelosPersonalizados.length === 0 ? (
                <div className="text-center py-6 space-y-2">
                  <Sliders className="w-6 h-6 text-slate-700 mx-auto" />
                  <p className="text-[10px] text-slate-500">Crea tu primer modelo personalizado</p>
                  <Button variant="outline" size="sm" icon={<Plus className="w-3.5 h-3.5" />} onClick={() => setShowNewModal(true)}>
                    Crear modelo
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {modelosPersonalizados.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setSelectedModelo(m)}
                      className={`w-full text-left p-3 rounded-xl border transition-all ${
                        selectedModelo?.id === m.id
                          ? 'bg-blue-500/10 border-blue-500/40 text-blue-400'
                          : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold">{m.nombre}</span>
                        {m.id === activeModelId && (
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5 truncate">{m.descripcion}</p>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── RIGHT: Editor (2 cols) ─────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-4">
          {selectedModelo ? (
            <>
              {/* Model Info Card */}
              <Card>
                <CardContent className="py-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-bold text-slate-100">{selectedModelo.nombre}</h3>
                        {selectedModelo.id === activeModelId && (
                          <Badge variant="primary" size="sm">ACTIVO</Badge>
                        )}
                        {isPredefinido && (
                          <Badge variant="warning" size="sm">
                            <Lock className="w-2.5 h-2.5 mr-1" />Solo lectura
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-1">{selectedModelo.descripcion}</p>
                      <span className="mt-2 inline-block font-mono text-emerald-400 text-xs bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        {selectedModelo.formacion}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {selectedModelo.id !== activeModelId && (
                        <Button
                          variant="primary"
                          size="sm"
                          icon={<Check className="w-3.5 h-3.5" />}
                          onClick={() => onSetActiveModel(selectedModelo)}
                        >
                          Activar
                        </Button>
                      )}
                      {!isPredefinido && (
                        <Button
                          variant="danger"
                          size="sm"
                          icon={<Trash2 className="w-3.5 h-3.5" />}
                          onClick={handleDeleteModelo}
                          loading={deleting}
                        >
                          Eliminar
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Weights Editor */}
              <Card>
                <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-sm">
                      {isPredefinido ? 'Ponderaciones (solo lectura)' : 'Editor de Ponderaciones'}
                    </CardTitle>
                    <CardDescription>
                      {isPredefinido
                        ? 'Las ponderaciones de los modelos predefinidos no se pueden modificar.'
                        : 'Arrastra para reordenar las métricas por importancia. Rank-Sum se recalcula en tiempo real.'}
                    </CardDescription>
                  </div>

                  <div className="w-full sm:w-52 shrink-0">
                    <Select
                      value={selectedPosicion}
                      onChange={(e) => setSelectedPosicion(e.target.value as Posicion)}
                      options={Object.entries(POSICION_LABELS).map(([val, label]) => ({
                        value: val,
                        label: `${val} — ${label}`,
                      }))}
                    />
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  {/* DnD List */}
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={!isPredefinido ? handleDragEnd : () => {}}
                  >
                    <SortableContext
                      items={orderedMetricas.map((m) => m.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-2">
                        {orderedMetricas.map((m, idx) => (
                          <SortableItem
                            key={m.id}
                            id={m.id}
                            nombre={m.nombre}
                            rango={idx + 1}
                            peso={pesos[idx] ?? 0}
                            disabled={isPredefinido}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>

                  {/* Footer: Sum + Save */}
                  <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                    {savedSuccess ? (
                      <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                        <Check className="w-4 h-4" /> Ponderaciones guardadas
                      </span>
                    ) : (
                      <span className="text-xs text-slate-500">
                        Σ pesos: <strong className="text-slate-300">100.0%</strong>
                      </span>
                    )}

                    {!isPredefinido && (
                      <Button
                        variant="primary"
                        size="sm"
                        icon={<Save className="w-4 h-4" />}
                        onClick={handleSaveWeights}
                        loading={loading}
                      >
                        Guardar Ponderaciones
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Score Preview */}
              <Card>
                <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <BarChart2 className="w-4 h-4 text-blue-400" />
                      Vista Previa de Scores
                    </CardTitle>
                    <CardDescription>
                      Score de los jugadores en la posición seleccionada con este modelo (en tiempo real al reordenar)
                    </CardDescription>
                  </div>
                  <Button
                    variant={showPreview ? 'secondary' : 'outline'}
                    size="sm"
                    icon={showPreview ? <Eye className="w-3.5 h-3.5" /> : <Users className="w-3.5 h-3.5" />}
                    onClick={() => setShowPreview(!showPreview)}
                  >
                    {showPreview ? 'Ocultar' : 'Ver Preview'}
                  </Button>
                </CardHeader>

                {showPreview && (
                  <CardContent>
                    {jugadoresPosicion.length === 0 ? (
                      <p className="text-xs text-slate-500 text-center py-4">
                        No hay jugadores en posición {POSICION_LABELS[selectedPosicion]}
                      </p>
                    ) : (
                      <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                        {jugadoresPosicion.map((j) => (
                          <ScorePreviewRow
                            key={j.id}
                            jugador={j}
                            posicion={selectedPosicion}
                            ponderaciones={previewPonderaciones}
                          />
                        ))}
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            </>
          ) : (
            <div className="h-64 flex items-center justify-center text-slate-600 text-xs rounded-2xl border border-slate-800/60 bg-slate-900/30">
              Selecciona un modelo de la lista para editarlo
            </div>
          )}
        </div>
      </div>

      {/* ── New Model Modal ───────────────────────────────────────────────── */}
      <NuevoModeloModal
        isOpen={showNewModal}
        onClose={() => setShowNewModal(false)}
        onCreated={(nuevo) => {
          setModelos((prev) => [...prev, nuevo])
          setSelectedModelo(nuevo)
          setShowNewModal(false)
        }}
      />

      {/* ── Delete Confirmation Modal ─────────────────────────────────────── */}
      {selectedModelo && (
        <ConfirmModal
          isOpen={showConfirmDelete}
          onClose={() => setShowConfirmDelete(false)}
          onConfirm={handleConfirmDeleteModelo}
          title="Confirmar eliminación de modelo"
          message={`¿Estás seguro de que deseas eliminar el modelo de juego "${selectedModelo.nombre}"? Esta acción eliminará permanentemente sus ponderaciones tácticas.`}
          confirmText="Eliminar Modelo"
          loading={deleting}
        />
      )}
    </div>
  )
}
