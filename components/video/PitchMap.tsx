'use client'

import React from 'react'
import type { ZonaCampo } from '@/types/database'
import { ZONA_LABELS } from '@/lib/constants'

interface PitchMapProps {
  selectedZona: ZonaCampo | null
  onZonaChange: (zona: ZonaCampo) => void
  /** Compact mode for small panels */
  compact?: boolean
}

// Zone grid: rows top→bottom = ARE (portería rival), OFE, MED, DEF (nuestra portería)
// Columns: IZQ, CEN, DER
const FILAS: { label: string; zonas: ZonaCampo[] }[] = [
  { label: 'ÁREA', zonas: ['ARE_IZQ', 'ARE_CEN', 'ARE_DER'] },
  { label: 'OFE',  zonas: ['OFE_IZQ', 'OFE_CEN', 'OFE_DER'] },
  { label: 'MED',  zonas: ['MED_IZQ', 'MED_CEN', 'MED_DER'] },
  { label: 'DEF',  zonas: ['DEF_IZQ', 'DEF_CEN', 'DEF_DER'] },
]

const CARRIL_LABELS = ['IZQ', 'CEN', 'DER']

function getZoneColor(zona: ZonaCampo, selected: boolean): string {
  if (selected) return 'rgba(16,185,129,0.85)' // emerald
  // Zona 14 special base color handled separately
  if (zona === 'ZONA14') return 'rgba(245,158,11,0.5)'
  return 'rgba(0,0,0,0.25)'
}

function getZoneTextColor(zona: ZonaCampo, selected: boolean): string {
  if (selected) return '#0f172a'
  if (zona === 'ZONA14') return '#fbbf24'
  return '#e2e8f0'
}

export function PitchMap({ selectedZona, onZonaChange, compact = false }: PitchMapProps) {
  const cellH = compact ? 38 : 52
  const pitchW = compact ? 240 : 318
  const pitchH = FILAS.length * cellH
  const colW = pitchW / 3
  // Zona 14 overlays OFE_CEN, slightly smaller
  const z14X = colW + 4
  const z14Y = cellH + 4
  const z14W = colW - 8
  const z14H = cellH - 8

  const selectedLabel = selectedZona ? ZONA_LABELS[selectedZona] : null

  return (
    <div className="space-y-1.5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-300">4. Zona del Campo</span>
        {selectedLabel && (
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
            selectedZona === 'ZONA14'
              ? 'text-amber-400 border-amber-500/40 bg-amber-500/10'
              : 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10'
          }`}>
            {selectedLabel}
          </span>
        )}
      </div>

      {/* Pitch SVG */}
      <div
        className="relative rounded-xl overflow-hidden border border-slate-700/60"
        style={{
          background: 'radial-gradient(ellipse at 50% 30%, #16803a 0%, #15803d 40%, #14532d 100%)',
        }}
      >
        <svg
          viewBox={`0 0 ${pitchW} ${pitchH}`}
          width="100%"
          style={{ display: 'block' }}
          aria-label="Campograma interactivo de selección de zona"
        >
          {/* ——— Pitch lines ——— */}
          {/* Outer border */}
          <rect x="1" y="1" width={pitchW - 2} height={pitchH - 2}
            fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />

          {/* Halfway line */}
          <line x1="0" y1={pitchH / 2} x2={pitchW} y2={pitchH / 2}
            stroke="rgba(255,255,255,0.3)" strokeWidth="1" strokeDasharray="4,3" />

          {/* Center circle (schematic) */}
          <circle cx={pitchW / 2} cy={pitchH / 2} r={compact ? 14 : 20}
            fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />

          {/* Top penalty area (rival) */}
          <rect
            x={colW * 0.6} y={1}
            width={colW * 1.8} height={compact ? 22 : 30}
            fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1"
          />
          {/* Bottom penalty area (own) */}
          <rect
            x={colW * 0.6} y={pitchH - (compact ? 22 : 30) - 1}
            width={colW * 1.8} height={compact ? 22 : 30}
            fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1"
          />

          {/* Vertical column dividers */}
          {[1, 2].map(i => (
            <line key={i}
              x1={colW * i} y1={0} x2={colW * i} y2={pitchH}
              stroke="rgba(255,255,255,0.15)" strokeWidth="1"
            />
          ))}

          {/* Horizontal row dividers */}
          {[1, 2, 3].map(i => (
            <line key={i}
              x1={0} y1={cellH * i} x2={pitchW} y2={cellH * i}
              stroke="rgba(255,255,255,0.15)" strokeWidth="1"
            />
          ))}

          {/* ——— Zone cells ——— */}
          {FILAS.map((fila, rowIdx) =>
            fila.zonas.map((zona, colIdx) => {
              const isSelected = selectedZona === zona
              const x = colIdx * colW
              const y = rowIdx * cellH
              return (
                <g key={zona} onClick={() => onZonaChange(zona)} style={{ cursor: 'pointer' }}>
                  <rect
                    x={x + 1} y={y + 1}
                    width={colW - 2} height={cellH - 2}
                    rx="4"
                    fill={getZoneColor(zona, isSelected)}
                    stroke={isSelected ? '#10b981' : 'transparent'}
                    strokeWidth="2"
                    className="transition-all"
                    style={{
                      filter: isSelected ? 'drop-shadow(0 0 6px rgba(16,185,129,0.6))' : undefined,
                    }}
                  />
                  {/* Zone label */}
                  <text
                    x={x + colW / 2}
                    y={y + cellH / 2 + 1}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={compact ? 8 : 9}
                    fontWeight="700"
                    fontFamily="monospace"
                    fill={getZoneTextColor(zona, isSelected)}
                    style={{ pointerEvents: 'none', userSelect: 'none' }}
                  >
                    {CARRIL_LABELS[colIdx]}
                  </text>
                </g>
              )
            })
          )}

          {/* ——— Zona 14 overlay ——— */}
          {(() => {
            const isZ14Selected = selectedZona === 'ZONA14'
            return (
              <g onClick={() => onZonaChange('ZONA14')} style={{ cursor: 'pointer' }}>
                <rect
                  x={z14X} y={z14Y}
                  width={z14W} height={z14H}
                  rx="6"
                  fill={isZ14Selected ? 'rgba(245,158,11,0.9)' : 'rgba(245,158,11,0.4)'}
                  stroke={isZ14Selected ? '#fbbf24' : '#d97706'}
                  strokeWidth={isZ14Selected ? 2.5 : 1.5}
                  strokeDasharray={isZ14Selected ? undefined : '3,2'}
                  style={{
                    filter: isZ14Selected
                      ? 'drop-shadow(0 0 8px rgba(245,158,11,0.7))'
                      : undefined,
                  }}
                />
                <text
                  x={z14X + z14W / 2}
                  y={z14Y + z14H / 2 - (compact ? 4 : 6)}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={compact ? 7 : 8}
                  fontWeight="900"
                  fill={isZ14Selected ? '#0f172a' : '#fbbf24'}
                  style={{ pointerEvents: 'none', userSelect: 'none' }}
                >
                  Z14
                </text>
                <text
                  x={z14X + z14W / 2}
                  y={z14Y + z14H / 2 + (compact ? 5 : 7)}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={compact ? 6 : 7}
                  fontWeight="600"
                  fill={isZ14Selected ? '#0f172a' : '#fbbf24'}
                  style={{ pointerEvents: 'none', userSelect: 'none' }}
                >
                  ENTRE LÍN.
                </text>
              </g>
            )
          })()}

          {/* Goal top (rival) */}
          <rect
            x={pitchW / 2 - (compact ? 18 : 24)} y={-2}
            width={compact ? 36 : 48} height={compact ? 6 : 8}
            rx="2"
            fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.4)" strokeWidth="1"
          />
          {/* Goal bottom (own) */}
          <rect
            x={pitchW / 2 - (compact ? 18 : 24)} y={pitchH - (compact ? 4 : 6)}
            width={compact ? 36 : 48} height={compact ? 6 : 8}
            rx="2"
            fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.4)" strokeWidth="1"
          />

          {/* Row labels (left) */}
          {FILAS.map((fila, rowIdx) => (
            <text
              key={fila.label}
              x={3}
              y={rowIdx * cellH + cellH / 2}
              textAnchor="start"
              dominantBaseline="middle"
              fontSize={compact ? 6 : 7}
              fontWeight="600"
              fill="rgba(255,255,255,0.35)"
              style={{ pointerEvents: 'none', userSelect: 'none' }}
            >
              {fila.label}
            </text>
          ))}
        </svg>

        {/* Attack direction indicator */}
        <div className="absolute top-1 right-1.5 flex flex-col items-center gap-0.5 opacity-50">
          <span className="text-[8px] text-white font-bold">ATK</span>
          <span className="text-[10px] text-white">▲</span>
        </div>
      </div>

      {/* Quick-select Zona 14 button below the pitch */}
      <button
        type="button"
        onClick={() => onZonaChange('ZONA14')}
        className={`w-full py-1.5 rounded-lg text-[10px] font-bold border transition-all flex items-center justify-center gap-1.5 ${
          selectedZona === 'ZONA14'
            ? 'bg-amber-500/20 text-amber-400 border-amber-500/50 shadow-md shadow-amber-500/10'
            : 'bg-slate-900/60 text-amber-400/70 border-amber-500/20 hover:border-amber-500/40 hover:bg-amber-500/5'
        }`}
      >
        <span className="w-3.5 h-3.5 rounded border border-amber-400/60 flex items-center justify-center text-[7px] font-black">14</span>
        Zona 14 — Espacio entre líneas (ofensivo central)
      </button>
    </div>
  )
}
