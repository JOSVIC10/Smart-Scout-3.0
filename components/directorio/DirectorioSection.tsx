'use client'

import React, { useState, useEffect } from 'react'
import { Search, Plus, Users, Shield, SlidersHorizontal, Link2, Sparkles } from 'lucide-react'
import { PlayerCard } from './PlayerCard'
import { FichaJugadorModal } from './FichaJugadorModal'
import { AddPlayerModal } from './AddPlayerModal'
import { AddClubModal } from './AddClubModal'
import { ImportPlayerModal } from './ImportPlayerModal'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { obtenerJugadores, obtenerJugadoresConScoreModelo } from '@/lib/supabase/jugadores'
import { obtenerClubes } from '@/lib/supabase/clubes'
import type { JugadorConClub, Posicion, Categoria, Club, Jugador } from '@/types/database'
import { POSICION_LABELS } from '@/lib/constants'

interface DirectorioSectionProps {
  activeModelName: string
  activeModelId?: string
  globalSearch?: string
  /** Scores actualizados por auto-recálculo (desde VideoSection via page.tsx) */
  scoreOverrides?: Map<string, number>
}

export function DirectorioSection({
  activeModelName,
  activeModelId,
  globalSearch = '',
  scoreOverrides,
}: DirectorioSectionProps) {
  const [jugadores, setJugadores] = useState<JugadorConClub[]>([])
  const [clubes, setClubes] = useState<Club[]>([])
  const [loading, setLoading] = useState(true)

  // Filters State
  const [tipoVista, setTipoVista] = useState<'observados' | 'todos' | 'plantilla'>('observados')
  const [busqueda, setBusqueda] = useState(globalSearch)
  const [posicionFilter, setPosicionFilter] = useState<Posicion | ''>('')
  const [clubFilter, setClubFilter] = useState<string>('')
  const [categoriaFilter, setCategoriaFilter] = useState<Categoria | ''>('')
  const [scoreMinFilter, setScoreMinFilter] = useState<string>('')
  const [soloOportunidades, setSoloOportunidades] = useState(false)

  // Modals state
  const [selectedPlayer, setSelectedPlayer] = useState<JugadorConClub | null>(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isAddClubModalOpen, setIsAddClubModalOpen] = useState(false)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)

  const miClub = clubes.find(c => c.nombre.toLowerCase().includes('grama')) ?? clubes[0]

  useEffect(() => {
    setBusqueda(globalSearch)
  }, [globalSearch])

  const cargarDatos = async () => {
    setLoading(true)
    try {
      const [jugs, clbs] = await Promise.all([
        obtenerJugadoresConScoreModelo(undefined, activeModelId),
        obtenerClubes()
      ])
      // Aplicar overrides de scores recientes si los hay
      const jugsConOverrides = scoreOverrides && scoreOverrides.size > 0
        ? jugs.map(j => scoreOverrides.has(j.id) ? { ...j, score_global: scoreOverrides.get(j.id)! } : j)
        : jugs
      setJugadores(jugsConOverrides)
      setClubes(clbs)
    } catch (err) {
      console.error('Error al cargar directorio:', err instanceof Error ? err.message : err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarDatos()
  }, [activeModelId])

  useEffect(() => {
    if (scoreOverrides && scoreOverrides.size > 0) {
      setJugadores((prev) =>
        prev.map((j) =>
          scoreOverrides.has(j.id)
            ? { ...j, score_global: scoreOverrides.get(j.id)! }
            : j
        )
      )
    }
  }, [scoreOverrides])

  const handlePlayerCreated = (nuevoJugador: Jugador) => {
    cargarDatos()
  }

  const handleClubCreated = (nuevoClub: Club) => {
    cargarDatos()
  }

  // Filter logic
  const jugadoresFiltrados = jugadores.filter((j) => {
    const matchTipo =
      tipoVista === 'todos'
        ? true
        : tipoVista === 'observados'
          ? (!miClub || j.club_id !== miClub.id)
          : (miClub && j.club_id === miClub.id)

    const matchBusqueda =
      !busqueda ||
      `${j.nombre} ${j.apellidos}`.toLowerCase().includes(busqueda.toLowerCase()) ||
      j.club?.nombre.toLowerCase().includes(busqueda.toLowerCase())

    const matchPosicion = !posicionFilter || j.posicion === posicionFilter
    const matchClub = !clubFilter || j.club_id === clubFilter
    const matchCategoria = !categoriaFilter || j.categoria === categoriaFilter
    const matchScore = !scoreMinFilter || (j.score_global ?? 0) >= parseInt(scoreMinFilter, 10)
    const matchOportunidad = !soloOportunidades || (
      (j.fin_contrato && j.fin_contrato.includes('2026')) ||
      (j.fin_contrato && j.fin_contrato.toLowerCase().includes('libre')) ||
      !j.club_id
    )

    return matchTipo && matchBusqueda && matchPosicion && matchClub && matchCategoria && matchScore && matchOportunidad
  })

  const posicionOptions = Object.entries(POSICION_LABELS).map(([val, label]) => ({
    value: val,
    label: `${val} — ${label}`,
  }))

  const clubOptions = clubes.map((c) => ({
    value: c.id,
    label: c.nombre,
  }))

  return (
    <div className="space-y-6">
      {/* Header Controls & Filters Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-400" />
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                Directorio de Jugadores
              </h2>
              <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                <span>Scores ponderados según modelo:</span>
                <span className="text-emerald-400 font-semibold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30 font-mono">
                  {activeModelName}
                </span>
              </p>
            </div>

            {/* Selector de tipo: Observados / Todos / Plantilla */}
            <div className="inline-flex items-center p-1 bg-slate-950 border border-slate-800/90 rounded-xl">
              <button
                type="button"
                onClick={() => setTipoVista('observados')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  tipoVista === 'observados'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Search className="w-3.5 h-3.5" />
                Jugadores Observados
              </button>
              <button
                type="button"
                onClick={() => setTipoVista('plantilla')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  tipoVista === 'plantilla'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                Mi Club ({miClub?.nombre ?? 'FE Grama'})
              </button>
              <button
                type="button"
                onClick={() => setTipoVista('todos')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  tipoVista === 'todos'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Todos
              </button>
            </div>

            {/* Chip de Oportunidades 2026 (Coste Cero) */}
            <button
              type="button"
              onClick={() => setSoloOportunidades(prev => !prev)}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border shadow-sm ${
                soloOportunidades
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-amber-500/10'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-amber-400 hover:border-amber-500/30'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              ⚡ Oportunidades 2026
              {soloOportunidades && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse ml-0.5" />
              )}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={<Shield className="w-4 h-4" />}
              onClick={() => setIsAddClubModalOpen(true)}
            >
              Nuevo Club
            </Button>
            <Button
              variant="secondary"
              size="sm"
              icon={<Link2 className="w-4 h-4 text-emerald-400" />}
              onClick={() => setIsImportModalOpen(true)}
            >
              Añadir por Enlace
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => setIsAddModalOpen(true)}
            >
              Nuevo Jugador
            </Button>
          </div>
        </div>

        {/* Filter inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2 border-t border-slate-800/80">
          <Input
            placeholder="Buscar por nombre o club..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            icon={<Search className="w-4 h-4" />}
          />

          <Select
            value={posicionFilter}
            onChange={(e) => setPosicionFilter(e.target.value as any)}
            options={posicionOptions}
            placeholder="Todas las Posiciones"
          />

          <Select
            value={clubFilter}
            onChange={(e) => setClubFilter(e.target.value)}
            options={clubOptions}
            placeholder="Todos los Clubes"
          />

          <Select
            value={categoriaFilter}
            onChange={(e) => setCategoriaFilter(e.target.value as any)}
            options={[
              { value: 'Segunda RFEF', label: 'Segunda RFEF' },
              { value: 'Tercera RFEF', label: 'Tercera RFEF' },
              { value: 'Otra', label: 'Otra' },
            ]}
            placeholder="Todas las Categorías"
          />

          <Select
            value={scoreMinFilter}
            onChange={(e) => setScoreMinFilter(e.target.value)}
            options={[
              { value: '80', label: 'Score ≥ 80 (Top)' },
              { value: '70', label: 'Score ≥ 70 (Alto)' },
              { value: '60', label: 'Score ≥ 60 (Medio)' },
            ]}
            placeholder="Cualquier Score"
          />
        </div>
      </div>

      {/* Player Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="h-44 rounded-xl bg-slate-900/50 animate-pulse border border-slate-800" />
          ))}
        </div>
      ) : jugadoresFiltrados.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {jugadoresFiltrados.map((jugador) => (
            <PlayerCard
              key={jugador.id}
              jugador={jugador}
              onClick={() => setSelectedPlayer(jugador)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 rounded-2xl bg-slate-900/40 border border-slate-800/80 space-y-2">
          <Users className="w-10 h-10 text-slate-600 mx-auto" />
          <p className="text-sm font-semibold text-slate-300">No se encontraron jugadores</p>
          <p className="text-xs text-slate-500">Prueba a ajustar o borrar los filtros seleccionados.</p>
        </div>
      )}

      {/* Ficha Jugador Modal */}
      <FichaJugadorModal
        jugador={selectedPlayer}
        isOpen={!!selectedPlayer}
        onClose={() => setSelectedPlayer(null)}
        activeModelName={activeModelName}
        activeModelId={activeModelId}
        onScoreUpdated={(jugadorId, nuevoScore) => {
          setJugadores(prev =>
            prev.map(j => j.id === jugadorId ? { ...j, score_global: nuevoScore } : j)
          )
          setSelectedPlayer(prev => prev && prev.id === jugadorId ? { ...prev, score_global: nuevoScore } : prev)
        }}
        onPlayerUpdated={(jugadorActualizado) => {
          setJugadores(prev =>
            prev.map(j => j.id === jugadorActualizado.id ? jugadorActualizado : j)
          )
          setSelectedPlayer(jugadorActualizado)
        }}
        onPlayerDeleted={(jugadorId) => {
          setJugadores(prev => prev.filter(j => j.id !== jugadorId))
          setSelectedPlayer(null)
        }}
      />

      {/* Add Player Modal */}
      <AddPlayerModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onPlayerCreated={handlePlayerCreated}
      />

      {/* Add Club Modal */}
      <AddClubModal
        isOpen={isAddClubModalOpen}
        onClose={() => setIsAddClubModalOpen(false)}
        onClubCreated={handleClubCreated}
      />

      {/* Import Player by URL Modal */}
      <ImportPlayerModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onPlayerCreated={handlePlayerCreated}
      />
    </div>
  )
}
