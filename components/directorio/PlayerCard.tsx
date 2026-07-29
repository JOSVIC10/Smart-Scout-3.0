'use client'

import React from 'react'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { POSICION_LABELS, PIE_LABELS, clasePercentil, calcularEdad } from '@/lib/constants'
import type { JugadorConClub } from '@/types/database'
import { User, Calendar, Ruler, Weight } from 'lucide-react'

interface PlayerCardProps {
  jugador: JugadorConClub
  onClick: () => void
}

export function PlayerCard({ jugador, onClick }: PlayerCardProps) {
  const edad = calcularEdad(jugador.fecha_nacimiento)

  return (
    <Card
      onClick={onClick}
      className="p-5 flex flex-col justify-between hover:border-emerald-500/40 transition-all group relative overflow-hidden"
    >
      {/* Background subtle glow */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-colors pointer-events-none" />

      {/* Top Header: Photo/Avatar + Position & Score */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700/80 flex items-center justify-center text-slate-300 font-bold text-base shadow-inner shrink-0 group-hover:border-emerald-500/30 transition-colors">
              {jugador.foto_url ? (
                <img
                  src={jugador.foto_url}
                  alt={jugador.nombre}
                  className="w-full h-full object-cover rounded-xl"
                />
              ) : (
                <span>
                  {jugador.nombre[0]}
                  {jugador.apellidos[0]}
                </span>
              )}
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-slate-100 group-hover:text-emerald-400 transition-colors truncate">
                {jugador.nombre} {jugador.apellidos}
              </h3>
              <p className="text-xs text-slate-400 truncate mt-0.5">
                {jugador.club?.nombre ?? 'Sin equipo'}
              </p>
            </div>
          </div>

          {/* Global Score Badge */}
          <div className="text-right shrink-0">
            <span
              className={`inline-block px-2.5 py-1 rounded-lg text-xs font-bold border shadow-sm ${clasePercentil(
                jugador.score_global ?? 0
              )}`}
            >
              {jugador.score_global ?? 0}
            </span>
          </div>
        </div>

        {/* Position Badges & Foot */}
        <div className="flex items-center gap-1.5 flex-wrap my-3">
          <Badge variant="primary" size="sm">
            {POSICION_LABELS[jugador.posicion]}
          </Badge>
          {jugador.posicion_detallada && (
            <Badge variant="secondary" size="sm">
              {jugador.posicion_detallada}
            </Badge>
          )}
          <Badge variant="outline" size="sm">
            {PIE_LABELS[jugador.pie_preferido]}
          </Badge>
        </div>
      </div>

      {/* Footer Info: Physical Stats */}
      <div className="pt-3 border-t border-slate-800/80 grid grid-cols-3 gap-2 text-[11px] text-slate-400">
        <div className="flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5 text-slate-500" />
          <span>{edad ? `${edad} años` : '—'}</span>
        </div>
        <div className="flex items-center gap-1">
          <Ruler className="w-3.5 h-3.5 text-slate-500" />
          <span>{jugador.altura_cm ? `${jugador.altura_cm} cm` : '—'}</span>
        </div>
        <div className="flex items-center gap-1">
          <Weight className="w-3.5 h-3.5 text-slate-500" />
          <span>{jugador.peso_kg ? `${jugador.peso_kg} kg` : '—'}</span>
        </div>
      </div>
    </Card>
  )
}
