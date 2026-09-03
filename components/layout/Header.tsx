'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Search, Plus, Menu, Sliders, ChevronDown, Check, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import type { SectionId } from './Sidebar'
import { NAVIGATION_ITEMS } from './Sidebar'
import type { ModeloJuego } from '@/types/database'

interface HeaderProps {
  activeSection: SectionId
  onOpenMobileMenu: () => void
  onAddPlayer?: () => void
  activeModelName?: string
  activeModelId?: string
  availableModels?: ModeloJuego[]
  onChangeActiveModel?: (modelo: ModeloJuego) => void
  globalSearch?: string
  onGlobalSearchChange?: (val: string) => void
  onOpenAiScout?: () => void
}

export function Header({
  activeSection,
  onOpenMobileMenu,
  onAddPlayer,
  activeModelName = 'Posesión (4-3-3)',
  activeModelId,
  availableModels = [],
  onChangeActiveModel,
  globalSearch = '',
  onGlobalSearchChange,
  onOpenAiScout,
}: HeaderProps) {
  const currentNav = NAVIGATION_ITEMS.find((n) => n.id === activeSection)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    if (dropdownOpen) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [dropdownOpen])

  const hasModels = availableModels.length > 0 && onChangeActiveModel

  return (
    <header className="sticky top-0 z-10 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
      {/* Left: Mobile Menu button + Section Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800 transition-colors"
          aria-label="Abrir menú"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
            {currentNav?.label ?? 'Dashboard'}
          </h2>
          <p className="text-xs text-slate-400 hidden sm:block">
            {currentNav?.description}
          </p>
        </div>
      </div>

      {/* Right: Quick Search + Model Selector + Action Buttons */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Search */}
        {onGlobalSearchChange && (
          <div className="relative hidden md:block w-48 lg:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={globalSearch}
              onChange={(e) => onGlobalSearchChange(e.target.value)}
              placeholder="Buscar jugador..."
              className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/80 transition-colors"
            />
          </div>
        )}

        {/* Active Model Selector */}
        {hasModels ? (
          <div className="relative hidden sm:block" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-emerald-500/40 text-xs font-medium text-slate-300 transition-all group"
            >
              <Sliders className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="text-slate-400">Modelo:</span>
              <span className="text-emerald-400 font-semibold truncate max-w-[120px]">{activeModelName}</span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown */}
            {dropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-72 bg-slate-950 border border-slate-800 rounded-xl shadow-2xl shadow-black/50 overflow-hidden z-50 py-1">
                <div className="px-3 py-2 border-b border-slate-800">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Selector de Modelo Activo</p>
                  <p className="text-[10px] text-slate-600 mt-0.5">Afecta directorio, ficha y comparador</p>
                </div>

                {/* Predefined */}
                {availableModels.filter(m => m.es_predefinido).length > 0 && (
                  <div>
                    <div className="px-3 pt-2 pb-1">
                      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Modelos Predefinidos</p>
                    </div>
                    {availableModels.filter(m => m.es_predefinido).map((m) => (
                      <button
                        key={m.id}
                        onClick={() => { onChangeActiveModel!(m); setDropdownOpen(false) }}
                        className="w-full flex items-center justify-between px-3 py-2 hover:bg-slate-900 transition-colors text-left"
                      >
                        <div>
                          <p className="text-xs font-semibold text-slate-200">{m.nombre}</p>
                          <p className="text-[10px] text-slate-500">{m.formacion} · {m.descripcion?.slice(0, 40)}{(m.descripcion?.length ?? 0) > 40 ? '…' : ''}</p>
                        </div>
                        {m.id === activeModelId && (
                          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {/* Custom */}
                {availableModels.filter(m => !m.es_predefinido).length > 0 && (
                  <div>
                    <div className="px-3 pt-2 pb-1 border-t border-slate-800 mt-1">
                      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Modelos Personalizados</p>
                    </div>
                    {availableModels.filter(m => !m.es_predefinido).map((m) => (
                      <button
                        key={m.id}
                        onClick={() => { onChangeActiveModel!(m); setDropdownOpen(false) }}
                        className="w-full flex items-center justify-between px-3 py-2 hover:bg-slate-900 transition-colors text-left"
                      >
                        <div>
                          <p className="text-xs font-semibold text-slate-200">{m.nombre}</p>
                          <p className="text-[10px] text-slate-500">{m.formacion}</p>
                        </div>
                        {m.id === activeModelId && (
                          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          // Fallback badge (no models loaded yet)
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-medium text-slate-300">
            <Sliders className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-slate-400">Modelo:</span>
            <span className="text-emerald-400 font-semibold truncate max-w-[120px]">{activeModelName}</span>
          </div>
        )}

        {/* AI Scout Button */}
        {onOpenAiScout && (
          <button
            type="button"
            onClick={onOpenAiScout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-500/15 via-slate-900 to-sky-500/15 hover:from-emerald-500/25 hover:to-sky-500/25 border border-emerald-500/30 hover:border-emerald-500/50 text-xs font-bold text-emerald-300 shadow-sm transition-all group"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400 group-hover:rotate-12 transition-transform" />
            <span className="hidden sm:inline">AI Scout</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-900 border border-slate-700 text-slate-400 hidden lg:inline font-mono">
              Ctrl K
            </span>
          </button>
        )}

        {/* Add Player */}
        {onAddPlayer && (
          <Button variant="primary" size="sm" icon={<Plus className="w-4 h-4" />} onClick={onAddPlayer}>
            <span className="hidden sm:inline">Nuevo Jugador</span>
            <span className="sm:hidden">Nuevo</span>
          </Button>
        )}
      </div>
    </header>
  )
}
