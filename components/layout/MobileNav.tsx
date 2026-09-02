'use client'

import React from 'react'
import { X, Sliders } from 'lucide-react'
import { NAVIGATION_ITEMS, type SectionId } from './Sidebar'
import { clsx } from 'clsx'

interface MobileNavProps {
  isOpen: boolean
  onClose: () => void
  activeSection: SectionId
  onSelectSection: (id: SectionId) => void
  activeModelName?: string
}

export function MobileNav({
  isOpen,
  onClose,
  activeSection,
  onSelectSection,
  activeModelName = 'Posesión (4-3-3)',
}: MobileNavProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 left-0 w-72 bg-slate-950 border-r border-slate-800 shadow-2xl flex flex-col z-10">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-sm">
              SS
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100">Smart Scout 3.0</h2>
              <p className="text-[10px] text-slate-400">Scouting Semiprofesional</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Model info */}
        <div className="m-3 p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase font-semibold text-slate-400">Modelo Activo</p>
            <p className="text-xs font-semibold text-emerald-400 mt-0.5">{activeModelName}</p>
          </div>
          <Sliders className="w-4 h-4 text-emerald-400" />
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
                  'w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all text-left',
                  isActive
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                )}
              >
                <Icon className={clsx('w-5 h-5', isActive ? 'text-emerald-400' : 'text-slate-400')} />
                <div>
                  <span className="block font-semibold">{item.label}</span>
                  <span className="text-[11px] text-slate-400 font-normal">{item.description}</span>
                </div>
              </button>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
