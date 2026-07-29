import React, { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Activity, Upload, BarChart2 } from 'lucide-react'

export function VideoAnalyticsSection({ partidoId }: { partidoId: string | null }) {
  const [telemetry, setTelemetry] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string)
        setTelemetry(json)
        // Here we would ideally call a Supabase function to update `partidos` table
        // For MVP, we just display it in UI
      } catch (err) {
        console.error('Failed to parse JSON', err)
      } finally {
        setLoading(false)
      }
    }
    reader.readAsText(file)
  }

  if (!partidoId) {
    return null
  }

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Activity className="w-4 h-4 text-purple-400" />
          Telemetría del Partido (YOLO Analytics)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!telemetry ? (
          <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-800 rounded-xl bg-slate-900/50">
            <Upload className="w-8 h-8 text-slate-500 mb-2" />
            <p className="text-sm font-semibold text-slate-300">Sube el archivo telemetry.json</p>
            <p className="text-xs text-slate-500 mb-4 text-center">Generado por el pipeline offline (process_video.py)</p>
            <input
              type="file"
              accept=".json"
              id="telemetry-upload"
              className="hidden"
              onChange={handleFileUpload}
            />
            <label htmlFor="telemetry-upload">
              <Button variant="secondary" size="sm" asChild>
                <span>Seleccionar Archivo</span>
              </Button>
            </label>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <BarChart2 className="w-4 h-4 text-purple-400" />
              <span>Total de frames analizados: {telemetry.total_frames}</span>
            </div>
            
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Posesión de Balón</h4>
              <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                {Object.entries(telemetry.possession).map(([teamId, percentage]) => (
                  <div key={teamId} className="flex-1 text-center">
                    <p className="text-[10px] text-slate-500 uppercase font-bold">Equipo {teamId}</p>
                    <p className="text-2xl font-black text-slate-200">
                      {(percentage as number).toFixed(1)}%
                    </p>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex justify-end">
              <Button variant="ghost" size="sm" onClick={() => setTelemetry(null)}>
                Limpiar datos
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
