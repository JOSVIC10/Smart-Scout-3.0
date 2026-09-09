import React from 'react'
import { Card, CardContent } from '@/components/ui/Card'
import { YoloData } from './useYoloMock'

interface TacticalRadarProps {
  data: YoloData | null
}

export function TacticalRadar({ data }: TacticalRadarProps) {
  return (
    <Card className="bg-slate-950 border-slate-800 shadow-xl overflow-hidden">
      <CardContent className="p-2 relative aspect-[1.5/1]">
        {/* Pitch Background */}
        <div className="absolute inset-0 bg-emerald-900/80 border-2 border-slate-700 m-2 rounded-lg" style={{
          backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)',
          backgroundSize: '10% 10%'
        }}>
          {/* Pitch Markings */}
          <svg width="100%" height="100%" className="absolute inset-0 opacity-40">
             <rect x="0" y="0" width="100%" height="100%" fill="none" stroke="white" strokeWidth="2" />
             <line x1="50%" y1="0" x2="50%" y2="100%" stroke="white" strokeWidth="1" />
             <circle cx="50%" cy="50%" r="12%" fill="none" stroke="white" strokeWidth="1" />
             <circle cx="50%" cy="50%" r="1%" fill="white" />
             <rect x="0" y="20%" width="16%" height="60%" fill="none" stroke="white" strokeWidth="1" />
             <rect x="84%" y="20%" width="16%" height="60%" fill="none" stroke="white" strokeWidth="1" />
             <rect x="0" y="35%" width="5%" height="30%" fill="none" stroke="white" strokeWidth="1" />
             <rect x="95%" y="35%" width="5%" height="30%" fill="none" stroke="white" strokeWidth="1" />
          </svg>
        </div>

        {/* Players & Ball */}
        {data && (
          <div className="absolute inset-2">
            {data.players.map(p => {
              const color = p.team === 'home' ? 'bg-blue-500' : 'bg-red-500'
              return (
                <div
                  key={p.id}
                  className={`absolute w-2 h-2 rounded-full ${color} transform -translate-x-1/2 -translate-y-1/2 transition-all duration-100 ease-linear shadow-sm`}
                  style={{
                    left: `${p.x * 100}%`,
                    top: `${p.y * 100}%`
                  }}
                />
              )
            })}
            
            {data.ball && (
              <div
                className="absolute w-1.5 h-1.5 bg-white rounded-full transform -translate-x-1/2 -translate-y-1/2 transition-all duration-100 ease-linear shadow-[0_0_4px_rgba(0,0,0,0.5)] z-10"
                style={{
                  left: `${data.ball.x * 100}%`,
                  top: `${data.ball.y * 100}%`
                }}
              />
            )}
          </div>
        )}

        {!data && (
          <div className="absolute inset-0 flex items-center justify-center text-slate-500 text-xs font-bold uppercase tracking-wider">
            Esperando Análisis...
          </div>
        )}
      </CardContent>
    </Card>
  )
}
