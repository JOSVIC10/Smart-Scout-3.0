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
import { QuickStartGuideModal } from '@/components/help/QuickStartGuideModal'
import { RecalcularJornadaModal } from '@/components/jornadas/RecalcularJornadaModal'
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

  // Quick Start Guide Modal State
  const [isGuideOpen, setIsGuideOpen] = useState(false)

  // Cierre y Recálculo de Jornada Modal State
  const [isRecalcularJornadaOpen, setIsRecalcularJornadaOpen] = useState(false)

  // All available models (loaded from Supabase)
  const [allModels, setAllModels] = useState<ModeloJuego[]>([])

  // Active Game Model state
  const [activeModel, setActiveModel] = useState<ModeloJuego>(DEFAULT_MODEL)

  // Scores actualizados recientemente por auto-recálculo (jugadorId → score)
  const [recentScoreUpdates, setRecentScoreUpdates] = useState<Map<string, number>>(new Map())
  const [refreshKey, setRefreshKey] = useState(0)

  const handleScoreUpdated = (jugadorId: string, nuevoScore: number) => {
    setRecentScoreUpdates(prev => new Map(prev).set(jugadorId, nuevoScore))
  }

  const activeModelName = `${activeModel.nombre} (${activeModel.formacion ?? '4-3-3'})`

  // AI Scout Assistant & Ficha Modal State
  const [isAiScoutOpen, setIsAiScoutOpen] = useState(false)
  const [allPlayersForAi, setAllPlayersForAi] = useState<JugadorConClub[]>([])
  const [selectedPlayerModal, setSelectedPlayerModal] = useState<JugadorConClub | null>(null)

  // Cargar jugadores con scoring del modelo activo
  useEffect(() => {
    obtenerJugadoresConScoreModelo(undefined, activeModel.id)
      .then(setAllPlayersForAi)
      .catch((err) => console.warn('Error loading players:', err))
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
        if (mods.length > 0) {
          const firstPredefined = mods.find((m) => m.es_predefinido) ?? mods[0]
          setActiveModel(firstPredefined)
        }
      })
      .catch((err) => {
        console.warn('[Models] Error loading models from Supabase:', err)
      })
  }, [])

  const handleSetActiveModel = (modelo: ModeloJuego) => {
    setActiveModel(modelo)
  }

  // Abre la ficha técnica de un jugador directamente
  const handleOpenPlayerFicha = (j: JugadorConClub) => {
    setSelectedPlayerModal(j)
  }

  // Abre la ficha técnica del jugador más destacado (ejemplo para director deportivo)
  const handleViewSamplePlayer = () => {
    if (allPlayersForAi.length > 0) {
      const topPlayer = [...allPlayersForAi].sort(
        (a, b) => (b.score_global ?? 0) - (a.score_global ?? 0)
      )[0]
      setSelectedPlayerModal(topPlayer)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex font-sans text-slate-900 dark:text-slate-100 transition-colors duration-150">
      {/* Desktop Sidebar */}
      <Sidebar
        activeSection={activeSection}
        onSelectSection={setActiveSection}
        activeModelName={activeModelName}
        onOpenGuide={() => setIsGuideOpen(true)}
      />

      {/* Mobile Navigation Drawer */}
      <MobileNav
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        activeSection={activeSection}
        onSelectSection={setActiveSection}
        activeModelName={activeModelName}
        onOpenGuide={() => setIsGuideOpen(true)}
      />

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
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
          onOpenGuide={() => setIsGuideOpen(true)}
        />

        {/* Section View Renderer */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {activeSection === 'dashboard' && (
            <DashboardSection
              onNavigate={setActiveSection}
              onSelectPlayer={handleOpenPlayerFicha}
              onViewSamplePlayer={handleViewSamplePlayer}
              onOpenGuide={() => setIsGuideOpen(true)}
              onOpenRecalcularJornada={() => setIsRecalcularJornadaOpen(true)}
              activeModelName={activeModelName}
              activeModelId={activeModel.id}
              refreshKey={refreshKey}
            />
          )}

          {activeSection === 'planificador' && (
            <PlanificadorSection
              activeModelName={activeModelName}
              activeModelId={activeModel.id}
              refreshKey={refreshKey}
            />
          )}

          {activeSection === 'jugadores' && (
            <DirectorioSection
              activeModelName={activeModelName}
              activeModelId={activeModel.id}
              globalSearch={globalSearch}
              scoreOverrides={recentScoreUpdates}
              refreshKey={refreshKey}
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
              onOpenRecalcularJornada={() => setIsRecalcularJornadaOpen(true)}
            />
          )}
        </main>
      </div>

      {/* Quick Start Guide Modal (Bajo demanda) */}
      <QuickStartGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        onNavigateSection={(sec) => setActiveSection(sec)}
      />

      {/* Modal de Cierre y Recálculo de Jornada */}
      <RecalcularJornadaModal
        isOpen={isRecalcularJornadaOpen}
        onClose={() => setIsRecalcularJornadaOpen(false)}
        activeModelId={activeModel.id}
        activeModelName={activeModelName}
        onRecalculoCompletado={() => {
          setRefreshKey(k => k + 1)
          obtenerJugadoresConScoreModelo(undefined, activeModel.id)
            .then(setAllPlayersForAi)
            .catch((err) => console.warn('Error refreshing players:', err))
        }}
      />

      {/* Modal Asistente de IA */}
      <AiScoutModal
        isOpen={isAiScoutOpen}
        onClose={() => setIsAiScoutOpen(false)}
        jugadores={allPlayersForAi}
        activeModelName={activeModelName}
        activeModelId={activeModel.id}
        onSelectPlayer={(j) => setSelectedPlayerModal(j)}
      />

      {/* Ficha Jugador abierta desde Dashboard ("Ver ficha de ejemplo" o "Top Scouting") o IA */}
      {selectedPlayerModal && (
        <FichaJugadorModal
          isOpen={!!selectedPlayerModal}
          onClose={() => setSelectedPlayerModal(null)}
          jugador={selectedPlayerModal}
          activeModelName={activeModelName}
          activeModelId={activeModel.id}
          onPlayerUpdated={(act) => {
            setAllPlayersForAi(prev => prev.map(p => p.id === act.id ? act : p))
            setSelectedPlayerModal(act)
          }}
        />
      )}
    </div>
  )
}
