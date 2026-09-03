'use client'

export const dynamic = 'force-dynamic'

import React, { useState, useEffect } from 'react'
import { Sidebar, type SectionId } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { MobileNav } from '@/components/layout/MobileNav'
import { DashboardSection } from '@/components/dashboard/DashboardSection'
import { PlanificadorSection } from '@/components/planificador/PlanificadorSection'
import { DirectorioSection } from '@/components/directorio/DirectorioSection'
import { VideoSection } from '@/components/video/VideoSection'
import { ComparadorSection } from '@/components/comparador/ComparadorSection'
import { ModelosSection } from '@/components/modelos/ModelosSection'
import { CampogramaSection } from '@/components/campograma/CampogramaSection'
import { EnDirectoSection } from '@/components/endirecto/EnDirectoSection'
import { AiScoutModal } from '@/components/ai/AiScoutModal'
import { FichaJugadorModal } from '@/components/directorio/FichaJugadorModal'
import { obtenerModelos } from '@/lib/supabase/modelos'
import { obtenerJugadoresConScoreModelo } from '@/lib/supabase/jugadores'
import type { ModeloJuego, JugadorConClub } from '@/types/database'

/** Modelo de juego por defecto (Posesión) mientras cargan los reales */
const DEFAULT_MODEL: ModeloJuego = {
  id: 'f0000001-0000-0000-0000-000000000001',
  nombre: 'Posesión',
  descripcion: 'Estilo posicional que busca superioridades mediante la ocupación racional del espacio.',
  es_predefinido: true,
  formacion: '4-3-3',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

export default function Home() {
  const [activeSection, setActiveSection] = useState<SectionId>('dashboard')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [globalSearch, setGlobalSearch] = useState('')

  // All available models (loaded from Supabase)
  const [allModels, setAllModels] = useState<ModeloJuego[]>([])

  // Active Game Model state
  const [activeModel, setActiveModel] = useState<ModeloJuego>(DEFAULT_MODEL)

  // Scores actualizados recientemente por auto-recálculo (jugadorId → score)
  // Usado para actualizar DirectorioSection sin esperar a un remount completo
  const [recentScoreUpdates, setRecentScoreUpdates] = useState<Map<string, number>>(new Map())

  const handleScoreUpdated = (jugadorId: string, nuevoScore: number) => {
    setRecentScoreUpdates(prev => new Map(prev).set(jugadorId, nuevoScore))
  }

  const activeModelName = `${activeModel.nombre} (${activeModel.formacion ?? '4-3-3'})`

  // AI Scout Assistant State
  const [isAiScoutOpen, setIsAiScoutOpen] = useState(false)
  const [allPlayersForAi, setAllPlayersForAi] = useState<JugadorConClub[]>([])
  const [selectedPlayerFromAi, setSelectedPlayerFromAi] = useState<JugadorConClub | null>(null)

  // Cargar jugadores con scoring del modelo activo para la IA
  useEffect(() => {
    obtenerJugadoresConScoreModelo(undefined, activeModel.id)
      .then(setAllPlayersForAi)
      .catch((err) => console.warn('Error loading players for AI:', err))
  }, [activeModel.id])

  // Atajo de teclado global Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setIsAiScoutOpen((prev) => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Load all models from Supabase on mount
  useEffect(() => {
    obtenerModelos()
      .then((mods) => {
        setAllModels(mods)
        // If Supabase has models, use the first predefined one as default
        if (mods.length > 0) {
          const firstPredefined = mods.find((m) => m.es_predefinido) ?? mods[0]
          setActiveModel(firstPredefined)
        }
      })
      .catch((err) => {
        console.warn('[Models] Error loading models from Supabase:', err)
      })
  }, [])

  // When a model is activated in ModelosSection, also refresh the model list
  const handleSetActiveModel = (modelo: ModeloJuego) => {
    setActiveModel(modelo)
  }

  const handleSelectPlayerFromDashboard = (j: JugadorConClub) => {
    setActiveSection('jugadores')
  }

  return (
    <div className="min-h-screen bg-slate-950 flex font-sans text-slate-100">
      {/* Desktop Sidebar */}
      <Sidebar
        activeSection={activeSection}
        onSelectSection={setActiveSection}
        activeModelName={activeModelName}
      />

      {/* Mobile Navigation Drawer */}
      <MobileNav
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        activeSection={activeSection}
        onSelectSection={setActiveSection}
        activeModelName={activeModelName}
      />

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header — includes active model selector dropdown */}
        <Header
          activeSection={activeSection}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          activeModelName={activeModelName}
          activeModelId={activeModel.id}
          availableModels={allModels}
          onChangeActiveModel={setActiveModel}
          globalSearch={globalSearch}
          onGlobalSearchChange={setGlobalSearch}
          onOpenAiScout={() => setIsAiScoutOpen(true)}
        />

        {/* Section View Renderer */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {activeSection === 'dashboard' && (
            <DashboardSection
              onNavigate={setActiveSection}
              onSelectPlayer={handleSelectPlayerFromDashboard}
              activeModelName={activeModelName}
              activeModelId={activeModel.id}
            />
          )}

          {activeSection === 'planificador' && (
            <PlanificadorSection
              activeModelName={activeModelName}
              activeModelId={activeModel.id}
            />
          )}

          {activeSection === 'jugadores' && (
            <DirectorioSection
              activeModelName={activeModelName}
              activeModelId={activeModel.id}
              globalSearch={globalSearch}
              scoreOverrides={recentScoreUpdates}
            />
          )}

          {activeSection === 'video' && (
            <VideoSection
              activeModelId={activeModel.id}
              onScoreUpdated={handleScoreUpdated}
            />
          )}

          {activeSection === 'comparador' && (
            <ComparadorSection
              activeModelName={activeModelName}
              activeModelId={activeModel.id}
            />
          )}

          {activeSection === 'modelos' && (
            <ModelosSection
              activeModelId={activeModel.id}
              onSetActiveModel={handleSetActiveModel}
            />
          )}

          {activeSection === 'campograma' && (
            <CampogramaSection
              activeModelName={activeModelName}
              activeModelId={activeModel.id}
            />
          )}

          {activeSection === 'en-directo' && (
            <EnDirectoSection
              activeModelId={activeModel.id}
              activeModelName={activeModelName}
              onScoreUpdated={handleScoreUpdated}
            />
          )}
        </main>
      </div>

      {/* Modal Asistente de IA */}
      <AiScoutModal
        isOpen={isAiScoutOpen}
        onClose={() => setIsAiScoutOpen(false)}
        jugadores={allPlayersForAi}
        activeModelName={activeModelName}
        activeModelId={activeModel.id}
        onSelectPlayer={(j) => setSelectedPlayerFromAi(j)}
      />

      {/* Ficha Jugador abierta desde IA */}
      {selectedPlayerFromAi && (
        <FichaJugadorModal
          isOpen={!!selectedPlayerFromAi}
          onClose={() => setSelectedPlayerFromAi(null)}
          jugador={selectedPlayerFromAi}
          activeModelName={activeModelName}
          activeModelId={activeModel.id}
          onPlayerUpdated={(act) => {
            setAllPlayersForAi(prev => prev.map(p => p.id === act.id ? act : p))
            setSelectedPlayerFromAi(act)
          }}
        />
      )}
    </div>
  )
}
