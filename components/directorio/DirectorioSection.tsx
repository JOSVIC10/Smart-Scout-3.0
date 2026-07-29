'use client'

import React, { useState, useEffect } from 'react'
import { Search, Plus, Users, Shield, SlidersHorizontal } from 'lucide-react'
import { PlayerCard } from './PlayerCard'
import { FichaJugadorModal } from './FichaJugadorModal'
import { AddPlayerModal } from './AddPlayerModal'
import { AddClubModal } from './AddClubModal'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { obtenerJugadores } from '@/lib/supabase/jugadores'
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
  const [busqueda, setBusqueda] = useState(globalSearch)
  const [posicionFilter, setPosicionFilter] = useState<Posicion | ''>('')
  const [clubFilter, setClubFilter] = useState<string>('')
  const [categoriaFilter, setCategoriaFilter] = useState<Categoria | ''>('')
  const [scoreMinFilter, setScoreMinFilter] = useState<string>('')

  // Modals state
  const [selectedPlayer, setSelectedPlayer] = useState<JugadorConClub | null>(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isAddClubModalOpen, setIsAddClubModalOpen] = useState(false)

  useEffect(() => {
    setBusqueda(globalSearch)
  }, [globalSearch])

  const cargarDatos = async () => {
    setLoading(true)
    try {
      const [jugs, clbs] = await Promise.all([obtenerJugadores(), obtenerClubes()])
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
    const matchBusqueda =
      !busqueda ||
      `${j.nombre} ${j.apellidos}`.toLowerCase().includes(busqueda.toLowerCase()) ||
      j.club?.nombre.toLowerCase().includes(busqueda.toLowerCase())

    const matchPosicion = !posicionFilter || j.posicion === posicionFilter
    const matchClub = !clubFilter || j.club_id === clubFilter
    const matchCategoria = !categoriaFilter || j.categoria === categoriaFilter
    const matchScore = !scoreMinFilter || (j.score_global ?? 0) >= parseInt(scoreMinFilter, 10)

    return matchBusqueda && matchPosicion && matchClub && matchCategoria && matchScore
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-bold text-slate-100">
              Directorio de Jugadores <span className="text-xs text-slate-400 font-normal">({jugadoresFiltrados.length})</span>
            </h2>
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
    </div>
  )
}
