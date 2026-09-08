'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Search, Plus, Menu, Sliders, ChevronDown, Check, Sparkles, Sun, Moon, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import type { SectionId } from './Sidebar'
import { NAVIGATION_ITEMS } from './Sidebar'
import type { ModeloJuego } from '@/types/database'
import { useTheme } from '@/components/theme/ThemeProvider'

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
  onOpenGuide?: () => void
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
  onOpenGuide,
}: HeaderProps) {
  const currentNav = NAVIGATION_ITEMS.find((n) => n.id === activeSection)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { theme, toggleTheme } = useTheme()

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
    <header className="sticky top-0 z-10 bg-white/90 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800/80 px-4 sm:px-6 py-3 flex items-center justify-between gap-4 transition-colors">
      {/* Left: Mobile Menu button + Section Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 dark:border-slate-800 transition-colors"
          aria-label="Abrir menú"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            {currentNav?.label ?? 'Panel de Control'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
            {currentNav?.description}
          </p>
        </div>
      </div>

      {/* Right: Search + Model Selector + Theme Toggle + Quick Guide + AI */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Search */}
        {onGlobalSearchChange && (
          <div className="relative hidden md:block w-44 lg:w-56">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={globalSearch}
              onChange={(e) => onGlobalSearchChange(e.target.value)}
              placeholder="Buscar jugador..."
              className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-50 border border-slate-300 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 dark:bg-slate-900/90 dark:border-slate-800 dark:text-slate-200 dark:placeholder-slate-500 transition-colors"
            />
          </div>
        )}

        {/* Active Model Selector */}
        {hasModels ? (
          <div className="relative hidden sm:block" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-300 hover:border-emerald-500/50 text-xs font-semibold text-slate-800 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300 dark:hover:border-emerald-500/40 transition-all group"
            >
              <Sliders className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="text-slate-500 dark:text-slate-400 font-normal">Modelo:</span>
              <span className="text-emerald-700 dark:text-emerald-400 font-bold truncate max-w-[120px]">{activeModelName}</span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown */}
            {dropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl overflow-hidden z-50 py-1 transition-colors">
                <div className="px-3 py-2 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
                  <p className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Selector de Modelo Activo</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Afecta directorio, ficha y comparador</p>
                </div>

                {/* Predefined */}
                {availableModels.filter(m => m.es_predefinido).length > 0 && (
                  <div>
                    <div className="px-3 pt-2 pb-1">
                      <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Modelos Predefinidos</p>
                    </div>
                    {availableModels.filter(m => m.es_predefinido).map((m) => (
                      <button
                        key={m.id}
                        onClick={() => { onChangeActiveModel!(m); setDropdownOpen(false) }}
                        className="w-full flex items-center justify-between px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors text-left"
                      >
                        <div>
                          <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{m.nombre}</p>
                          <p className="text-[10px] text-slate-500">{m.formacion} · {m.descripcion?.slice(0, 40)}{(m.descripcion?.length ?? 0) > 40 ? '…' : ''}</p>
                        </div>
                        {m.id === activeModelId && (
                          <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {/* Custom */}
                {availableModels.filter(m => !m.es_predefinido).length > 0 && (
                  <div>
                    <div className="px-3 pt-2 pb-1 border-t border-slate-200 dark:border-slate-800 mt-1">
                      <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Modelos Personalizados</p>
                    </div>
                    {availableModels.filter(m => !m.es_predefinido).map((m) => (
                      <button
                        key={m.id}
                        onClick={() => { onChangeActiveModel!(m); setDropdownOpen(false) }}
                        className="w-full flex items-center justify-between px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors text-left"
                      >
                        <div>
                          <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{m.nombre}</p>
                          <p className="text-[10px] text-slate-500">{m.formacion}</p>
                        </div>
                        {m.id === activeModelId && (
                          <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-300 text-xs font-semibold text-slate-800 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300">
            <Sliders className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="text-slate-500 dark:text-slate-400 font-normal">Modelo:</span>
            <span className="text-emerald-700 dark:text-emerald-400 font-bold truncate max-w-[120px]">{activeModelName}</span>
          </div>
        )}

        {/* Quick Guide Button */}
        {onOpenGuide && (
          <button
            type="button"
            onClick={onOpenGuide}
            title="Abrir tutorial guiado de inicio rápido"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-300 dark:border-slate-800 text-xs font-semibold transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="hidden md:inline">Guía rápida</span>
          </button>
        )}

        {/* Theme Toggle (Light / Dark Mode) */}
        <button
          type="button"
          onClick={toggleTheme}
          title={theme === 'light' ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'}
          className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-200 dark:border-slate-800 text-xs font-semibold transition-colors flex items-center gap-1.5"
          aria-label="Alternar tema visual"
        >
          {theme === 'light' ? (
            <>
              <Moon className="w-3.5 h-3.5 text-slate-700" />
              <span className="hidden lg:inline text-[11px]">Oscuro</span>
            </>
          ) : (
            <>
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden lg:inline text-[11px]">Claro</span>
            </>
          )}
        </button>

        {/* AI Scout Button */}
        {onOpenAiScout && (
          <button
            type="button"
            onClick={onOpenAiScout}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-xs font-bold text-emerald-800 shadow-xs dark:bg-gradient-to-r dark:from-emerald-500/15 dark:via-slate-900 dark:to-sky-500/15 dark:border-emerald-500/30 dark:text-emerald-300 transition-all group"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 group-hover:rotate-12 transition-transform" />
            <span className="hidden sm:inline">AI Scout</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 hidden xl:inline font-mono">
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
