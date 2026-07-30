import React, { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Activity, Upload, BarChart2, Terminal } from 'lucide-react'
import { TrackingVisualizer } from './TrackingVisualizer'

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

  // Allow telemetry testing even if the video is not linked to a partido yet
  // if (!partidoId) {
  //   return null
  // }

  return (
    <Card className="mt-4 border-slate-800 bg-slate-950">
      <CardHeader className="border-b border-slate-800/50 pb-4">
        <CardTitle className="text-sm flex items-center gap-2">
          <Activity className="w-4 h-4 text-purple-400" />
          Análisis Táctico Avanzado (YOLO)
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        {!telemetry ? (
          <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-800 rounded-xl bg-slate-900/30">
            <Upload className="w-10 h-10 text-slate-500 mb-4" />
            <h3 className="text-base font-bold text-slate-200 mb-2">Subir Telemetría de Partido</h3>
            <p className="text-sm text-slate-400 mb-6 text-center max-w-lg">
              El análisis de tracking 2D requiere procesar el video del partido de forma local usando nuestro pipeline de Inteligencia Artificial.
            </p>
            
            <div className="bg-black/50 p-4 rounded-lg border border-slate-800 mb-8 w-full max-w-xl text-left shadow-inner">
              <p className="text-[10px] text-slate-500 mb-2 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Terminal className="w-3 h-3" /> Comando de Ejecución Local
              </p>
              <code className="text-xs text-emerald-400 font-mono break-all select-all block bg-slate-950 p-2 rounded border border-slate-800/60">
                python process_video.py --video ./input.mp4 --output-dir ./output
              </code>
            </div>
            
            <input
              type="file"
              accept=".json"
              id="telemetry-upload"
              className="hidden"
              onChange={handleFileUpload}
            />
            <label htmlFor="telemetry-upload">
              <div className="inline-flex items-center justify-center rounded-lg bg-purple-600 hover:bg-purple-700 px-6 py-2.5 text-sm font-bold text-white transition-colors cursor-pointer shadow-lg shadow-purple-900/20">
                Cargar telemetry.json
              </div>
            </label>
          </div>
        ) : (
          <div className="space-y-6">
            <TrackingVisualizer telemetry={telemetry} />
            <div className="flex justify-end pt-2">
              <Button variant="ghost" size="sm" onClick={() => setTelemetry(null)} className="text-slate-400 hover:text-slate-200">
                Cerrar Visualizador
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
