'use client'

import React from 'react'
import { X, Sliders, BookOpen } from 'lucide-react'
import { NAVIGATION_ITEMS, type SectionId } from './Sidebar'
import { clsx } from 'clsx'

interface MobileNavProps {
  isOpen: boolean
  onClose: () => void
  activeSection: SectionId
  onSelectSection: (id: SectionId) => void
  activeModelName?: string
  onOpenGuide?: () => void
}

export function MobileNav({
  isOpen,
  onClose,
  activeSection,
  onSelectSection,
  activeModelName = 'Posesión (4-3-3)',
  onOpenGuide,
}: MobileNavProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 left-0 w-80 max-w-[85vw] bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col z-10 transition-colors">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-sm">
              SS
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">Smart Scout 3.0</h2>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">Scouting Semiprofesional</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Model info */}
        <div className="m-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">Modelo Activo</p>
            <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 mt-0.5">{activeModelName}</p>
          </div>
          <Sliders className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
        </div>

        {/* Navigation List */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {NAVIGATION_ITEMS.map((item) => {
            const Icon = item.icon
            const isActive = activeSection === item.id

            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectSection(item.id)
                  onClose()
                }}
                className={clsx(
                  'w-full flex items-start gap-3 px-3 py-2.5 rounded-xl text-left transition-all',
                  isActive
                    ? 'bg-emerald-50 text-emerald-900 border border-emerald-300 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-900/60'
                )}
              >
                <Icon className={clsx('w-5 h-5 shrink-0 mt-0.5', isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400')} />
                <div className="min-w-0 flex-1">
                  <span className="block font-bold text-xs">{item.label}</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-normal leading-snug line-clamp-1">{item.description}</span>
                </div>
              </button>
            )
          })}
        </nav>

        {/* Quick Guide Button */}
        {onOpenGuide && (
          <div className="p-3 border-t border-slate-200 dark:border-slate-800">
            <button
              onClick={() => {
                onOpenGuide()
                onClose()
              }}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/50"
            >
              <BookOpen className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Guía de Inicio Rápido</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
