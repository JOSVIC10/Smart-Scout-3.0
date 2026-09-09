import React from 'react'
import { Card, CardContent } from '@/components/ui/Card'
import { YoloData } from './useYoloMock'
import { Activity, FastForward, Shield, Maximize } from 'lucide-react'

interface YoloStatsBarProps {
  data: YoloData | null
}

const ProgressBar = ({ label, home, away, icon: Icon }: { label: string, home: number, away: number, icon: any }) => (
  <div className="space-y-1.5">
    <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-slate-400">
      <span className="flex items-center gap-1.5">
        <Icon className="w-3 h-3 text-emerald-400" />
        {label}
      </span>
      <div className="space-x-2 font-mono">
        <span className="text-blue-400">{home.toFixed(1)}%</span>
        <span className="text-slate-600">|</span>
        <span className="text-red-400">{away.toFixed(1)}%</span>
      </div>
    </div>
    <div className="flex h-2 w-full rounded-full overflow-hidden bg-slate-800">
      <div 
        className="bg-blue-500 transition-all duration-500 ease-out" 
        style={{ width: `${home}%` }}
      />
      <div 
        className="bg-red-500 transition-all duration-500 ease-out" 
        style={{ width: `${away}%` }}
      />
    </div>
  </div>
)

export function YoloStatsBar({ data }: YoloStatsBarProps) {
  if (!data) {
    return (
      <Card className="bg-slate-950 border-slate-800">
        <CardContent className="p-4 flex items-center justify-center text-slate-500 text-xs h-[160px]">
          Inicia el análisis para ver estadísticas en tiempo real
        </CardContent>
      </Card>
    )
  }

  const { stats } = data

  return (
    <Card className="bg-slate-950 border-slate-800 shadow-lg">
      <CardContent className="p-4 space-y-5">
        {/* Phase Indicator */}
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Fase de Juego Actual</span>
          <span className="px-2 py-0.5 rounded-md bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[10px] font-black uppercase tracking-wider animate-pulse">
            {stats.phase}
          </span>
        </div>

        {/* Progress Bars */}
        <ProgressBar 
          label="Posesión" 
          home={stats.possessionHome} 
          away={stats.possessionAway} 
          icon={Activity}
        />
        
        <ProgressBar 
          label="Control de Espacio" 
          home={stats.spaceControlHome} 
          away={stats.spaceControlAway} 
          icon={Maximize}
        />

        <ProgressBar 
          label="Presión Ofensiva" 
          home={stats.pressureHome} 
          away={stats.pressureAway} 
          icon={Shield}
        />

      </CardContent>
    </Card>
  )
}
