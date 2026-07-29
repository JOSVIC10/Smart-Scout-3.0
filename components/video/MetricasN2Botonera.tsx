'use client'

import React from 'react'
import type { Posicion } from '@/types/database'
import { METRICAS_N2_POR_POSICION, GRUPO_COLORS, type MetricaN2Config } from '@/lib/constants'

interface MetricasN2BotoneraProps {
  posicion: Posicion
  selectedCodigo: string | null
  onSelect: (metrica: MetricaN2Config) => void
}

const GRUPO_BORDER: Record<string, string> = {
  ofensiva:  'border-orange-500/40',
  defensiva: 'border-blue-500/40',
  posesion:  'border-emerald-500/40',
}

const GRUPO_BG_SELECTED: Record<string, string> = {
  ofensiva:  'bg-orange-500/20 text-orange-300 border-orange-500/60',
  defensiva: 'bg-blue-500/20 text-blue-300 border-blue-500/60',
  posesion:  'bg-emerald-500/20 text-emerald-300 border-emerald-500/60',
}

const GRUPO_LABEL: Record<string, string> = {
  ofensiva:  'Ofensiva',
  defensiva: 'Defensiva',
  posesion:  'Posesión',
}

export function MetricasN2Botonera({ posicion, selectedCodigo, onSelect }: MetricasN2BotoneraProps) {
  const metricas = METRICAS_N2_POR_POSICION[posicion] ?? []

  // Group by grupo
  const grupos = metricas.reduce<Record<string, MetricaN2Config[]>>((acc, m) => {
    if (!acc[m.grupo]) acc[m.grupo] = []
    acc[m.grupo].push(m)
    return acc
  }, {})

  const grupoOrder = ['ofensiva', 'defensiva', 'posesion'] as const

  if (metricas.length === 0) {
    return (
      <div className="text-xs text-slate-500 text-center py-4">
        Sin métricas configuradas para esta posición
      </div>
    )
  }

  return (
    <div className="space-y-2.5">
      {grupoOrder.map((grupo) => {
        const items = grupos[grupo]
        if (!items || items.length === 0) return null
        const color = GRUPO_COLORS[grupo]
        return (
          <div key={grupo} className="space-y-1.5">
            {/* Group header */}
            <div className="flex items-center gap-1.5">
              <div
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: color }}
              />
              <span
                className="text-[10px] font-bold uppercase tracking-widest"
                style={{ color }}
              >
                {GRUPO_LABEL[grupo]}
              </span>
            </div>

            {/* Metric buttons */}
            <div className="grid grid-cols-2 gap-1.5">
              {items.map((m) => {
                const isSelected = selectedCodigo === m.codigo
                return (
                  <button
                    key={m.codigo}
                    type="button"
                    title={m.descripcion}
                    onClick={() => onSelect(m)}
                    className={`
                      relative p-2.5 rounded-xl text-left text-[11px] font-bold transition-all border
                      group overflow-hidden
                      ${isSelected
                        ? GRUPO_BG_SELECTED[m.grupo]
                        : `bg-slate-900/60 text-slate-400 ${GRUPO_BORDER[m.grupo]} hover:bg-slate-800/80 hover:text-slate-200`
                      }
                    `}
                  >
                    {/* Subtle glow on selected */}
                    {isSelected && (
                      <span
                        className="absolute inset-0 opacity-10 rounded-xl"
                        style={{ background: color }}
                      />
                    )}
                    <span className="relative z-10 leading-tight block">
                      {m.nombre}
                    </span>
                    {/* Active indicator dot */}
                    {isSelected && (
                      <span
                        className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: color }}
                      />
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
