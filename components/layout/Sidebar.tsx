'use client'

import React from 'react'
import {
  LayoutDashboard,
  Users,
  Video,
  GitCompare,
  Sliders,
  Grid,
  ShieldAlert,
  ChevronRight,
} from 'lucide-react'
import { clsx } from 'clsx'

export type SectionId = 'dashboard' | 'jugadores' | 'video' | 'comparador' | 'modelos' | 'campograma'

interface NavigationItem {
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
    id: 'jugadores',
    label: 'Directorio',
    icon: Users,
    description: 'Catálogo de jugadores y fichas completas',
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
    description: 'Comparación frente a frente con radag',
  },
  {
    id: 'modelos',
    label: 'Modelos de Juego',
    icon: Sliders,
    description: 'Configurador táctico y Rank-Sum',
  },
  {
    id: 'campograma',
    label: 'Campograma',
    icon: Grid,
    description: 'Pizarra táctica y alineación',
  },
]

interface SidebarProps {
  activeSection: SectionId
  onSelectSection: (id: SectionId) => void
  activeModelName?: string
}

export function Sidebar({ activeSection, onSelectSection, activeModelName = 'Posesión (4-3-3)' }: SidebarProps) {
  return (
    <aside className="hidden lg:flex flex-col w-64 bg-slate-950 border-r border-slate-800/80 h-screen sticky top-0 shrink-0 select-none z-20">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/80 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white font-bold shadow-lg shadow-emerald-950/50 border border-emerald-400/30 shrink-0">
          SS
        </div>
        <div>
          <h1 className="text-base font-bold text-slate-100 tracking-tight flex items-center gap-1.5">
            Smart Scout <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">v3.0</span>
          </h1>
          <p className="text-[11px] text-slate-400 font-medium">INEFC Lleida – UdL</p>
        </div>
      </div>

      {/* Active Game Model Indicator Card */}
      <div className="mx-3 my-3 p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
        <div className="min-w-0">
          <p className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Modelo Activo</p>
          <p className="text-xs font-semibold text-emerald-400 truncate mt-0.5">{activeModelName}</p>
        </div>
        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0 ml-2" />
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
          Módulos Principales
        </div>
        {NAVIGATION_ITEMS.map((item) => {
          const Icon = item.icon
          const isActive = activeSection === item.id

          return (
            <button
              key={item.id}
              onClick={() => onSelectSection(item.id)}
              className={clsx(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all group relative text-left',
                isActive
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-md shadow-emerald-950/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/70 border border-transparent'
              )}
            >
              <Icon
                className={clsx(
                  'w-4 h-4 shrink-0 transition-colors',
                  isActive ? 'text-emerald-400' : 'text-slate-400 group-hover:text-slate-300'
                )}
              />
              <div className="flex-1 truncate">
                <span className="block font-semibold">{item.label}</span>
              </div>
              {isActive && (
                <ChevronRight className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              )}
            </button>
          )
        })}
      </nav>

      {/* User / Director Deportivo Footer Info */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/60">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-300">
            DD
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-slate-200 truncate">Director Deportivo</p>
            <p className="text-[10px] text-slate-400 truncate">Segunda / Tercera RFEF</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
