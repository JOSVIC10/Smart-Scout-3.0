import React from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Activity, Power, Eye, EyeOff } from 'lucide-react'
import { TacticalRadar } from './TacticalRadar'
import { YoloStatsBar } from './YoloStatsBar'
import { YoloData } from './useYoloMock'

export interface YoloLayerOptions {
  showTracking: boolean
  showPasses: boolean
  showNames: boolean
}

interface VideoAnalyticsSectionProps {
  partidoId: string | null
  isActive: boolean
  onToggleActive: () => void
  yoloData: YoloData | null
  layerOptions: YoloLayerOptions
  setLayerOptions: React.Dispatch<React.SetStateAction<YoloLayerOptions>>
}

export function VideoAnalyticsSection({ 
  isActive, 
  onToggleActive, 
  yoloData, 
  layerOptions, 
  setLayerOptions 
}: VideoAnalyticsSectionProps) {

  const toggleLayer = (key: keyof YoloLayerOptions) => {
    setLayerOptions(prev => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <Card className="mt-4 border-slate-800 bg-slate-950 overflow-hidden">
      <CardHeader className="border-b border-slate-800/50 pb-4 bg-slate-900/50">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            Análisis Táctico Avanzado (YOLO)
          </CardTitle>
          <Button
            variant={isActive ? 'danger' : 'primary'}
            size="sm"
            onClick={onToggleActive}
            icon={<Power className="w-3.5 h-3.5" />}
            className={isActive ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border-red-500/30' : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_15px_rgba(52,211,153,0.3)]'}
          >
            {isActive ? 'Detener Análisis' : 'Iniciar Análisis YOLO'}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="pt-4 p-4 space-y-4">
        {!isActive ? (
          <div className="flex flex-col items-center justify-center py-10 px-4 border-2 border-dashed border-slate-800 rounded-xl bg-slate-900/30">
            <div className="w-16 h-16 mb-4 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
              <Activity className="w-8 h-8 text-emerald-400" />
            </div>
            <h3 className="text-sm font-bold text-slate-200 mb-2 text-center">IA Táctica Inactiva</h3>
            <p className="text-xs text-slate-500 text-center max-w-sm mb-6">
              Activa el análisis YOLO para obtener tracking de jugadores, radar 2D y métricas avanzadas en tiempo real superpuestas en el vídeo.
            </p>
            <Button
              variant="primary"
              onClick={onToggleActive}
              className="bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-900/20"
            >
              Iniciar Análisis Táctico YOLO
            </Button>
          </div>
        ) : (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Layer Controls */}
            <div className="grid grid-cols-3 gap-2">
              <LayerButton 
                active={layerOptions.showTracking} 
                onClick={() => toggleLayer('showTracking')}
                label="Tracking"
              />
              <LayerButton 
                active={layerOptions.showPasses} 
                onClick={() => toggleLayer('showPasses')}
                label="Líneas de Pase"
              />
              <LayerButton 
                active={layerOptions.showNames} 
                onClick={() => toggleLayer('showNames')}
                label="Dorsales"
              />
            </div>

            {/* Radar & Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Radar Táctico</p>
                <TacticalRadar data={yoloData} />
              </div>
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Métricas en Vivo</p>
                <YoloStatsBar data={yoloData} />
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function LayerButton({ active, onClick, label }: { active: boolean, onClick: () => void, label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all border ${
        active 
          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 shadow-[inset_0_0_10px_rgba(52,211,153,0.1)]' 
          : 'bg-slate-900 text-slate-500 border-slate-800 hover:bg-slate-800'
      }`}
    >
      {active ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
      {label}
    </button>
  )
}
