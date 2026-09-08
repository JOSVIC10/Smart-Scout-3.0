'use client'

import React from 'react'
import {
  LayoutDashboard,
  Users,
  Video,
  GitCompare,
  Sliders,
  Grid,
  ChevronRight,
  Activity,
  Briefcase,
  BookOpen,
} from 'lucide-react'
import { clsx } from 'clsx'

export type SectionId = 'dashboard' | 'planificador' | 'jugadores' | 'video' | 'comparador' | 'modelos' | 'campograma' | 'en-directo'

export interface NavigationItem {
  id: SectionId
  label: string
  icon: React.ComponentType<{ className?: string }>
  description: string
  badge?: string
}

export const NAVIGATION_ITEMS: NavigationItem[] = [
  {
    id: 'dashboard',
    label: 'Panel de Control',
    icon: LayoutDashboard,
    description: 'Resumen ejecutivo y KPIs del club',
  },
  {
    id: 'planificador',
    label: 'Plantilla',
    icon: Briefcase,
    description: 'Plantilla del club y planificador',
  },
  {
    id: 'jugadores',
    label: 'Directorio',
    icon: Users,
    description: 'Búsqueda y fichas de talentos observados',
  },
  {
    id: 'video',
    label: 'Análisis de Vídeo',
    icon: Video,
    description: 'Etiquetado manual sobre vídeo de partido',
  },
  {
    id: 'comparador',
    label: 'Comparador',
    icon: GitCompare,
    description: 'Comparación frente a frente con radar',
  },
  {
    id: 'modelos',
    label: 'Modelos de Juego',
    icon: Sliders,
    description: 'Configurador táctico y prioridades',
  },
  {
    id: 'campograma',
    label: 'Campograma',
    icon: Grid,
    description: 'Pizarra táctica y alineación',
  },
  {
    id: 'en-directo',
    label: 'En Directo',
    icon: Activity,
    description: 'Registro de acciones en vivo',
  },
]

interface SidebarProps {
  activeSection: SectionId
  onSelectSection: (id: SectionId) => void
  activeModelName?: string
  onOpenGuide?: () => void
}

export function Sidebar({
  activeSection,
  onSelectSection,
  activeModelName = 'Posesión (4-3-3)',
  onOpenGuide,
}: SidebarProps) {
  return (
    <aside className="hidden lg:flex flex-col w-64 bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800/80 h-screen sticky top-0 shrink-0 select-none z-20 transition-colors">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-200 dark:border-slate-800/80 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white font-bold shadow-md shadow-emerald-700/20 border border-emerald-500/30 shrink-0">
          SS
        </div>
        <div>
          <h1 className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-1.5">
            Smart Scout <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 font-semibold">v3.0</span>
          </h1>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Scouting Semiprofesional</p>
        </div>
      </div>

      {/* Active Game Model Indicator Card */}
      <div className="mx-3 my-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div className="min-w-0">
          <p className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider">Modelo Activo</p>
          <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 truncate mt-0.5">{activeModelName}</p>
        </div>
        <div className="w-2 h-2 rounded-full bg-emerald-600 dark:bg-emerald-500 animate-pulse shrink-0 ml-2" />
      </div>

      {/* Navigation Links with One-Line Descriptions */}
      <nav className="flex-1 px-3 py-2 space-y-1.5 overflow-y-auto">
        <div className="px-3 pb-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
          Módulos Principales
        </div>
        {NAVIGATION_ITEMS.map((item) => {
          const Icon = item.icon
          const isActive = activeSection === item.id

          return (
            <button
              key={item.id}
              onClick={() => onSelectSection(item.id)}
              title={item.description}
              className={clsx(
                'w-full flex items-start gap-3 px-3 py-2.5 rounded-xl transition-all group text-left relative',
                isActive
                  ? 'bg-emerald-50 text-emerald-900 border border-emerald-300/80 shadow-xs dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/40'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-900/70 border border-transparent'
              )}
            >
              <Icon
                className={clsx(
                  'w-4 h-4 shrink-0 mt-0.5 transition-colors',
                  isActive ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300'
                )}
              />
              <div className="flex-1 min-w-0">
                <span className="block text-xs font-bold leading-tight truncate">{item.label}</span>
                <span className="block text-[11px] text-slate-500 dark:text-slate-400 font-normal leading-snug mt-0.5 line-clamp-1">
                  {item.description}
                </span>
              </div>
              {isActive && (
                <ChevronRight className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400 shrink-0 mt-1" />
              )}
            </button>
          )
        })}
      </nav>

      {/* Quick Start Guide Consultation Button */}
      {onOpenGuide && (
        <div className="px-3 py-2 border-t border-slate-200 dark:border-slate-800/80">
          <button
            type="button"
            onClick={onOpenGuide}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 dark:text-emerald-300 dark:border-emerald-800/50 transition-colors"
          >
            <BookOpen className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="truncate">¿Cómo funciona? Guía rápida</span>
          </button>
        </div>
      )}

      {/* User / Director Deportivo Footer Info */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800/80 bg-slate-50/80 dark:bg-slate-950/60">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex items-center justify-center text-xs font-bold text-slate-700 dark:text-slate-300">
            DD
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">Director Deportivo</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">Segunda / Tercera RFEF</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
