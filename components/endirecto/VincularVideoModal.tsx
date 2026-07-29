'use client'

import React, { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Link, CheckCircle2, AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { registrarVideoYoutube } from '@/lib/supabase/videos'

interface VincularVideoModalProps {
  isOpen: boolean
  onClose: () => void
  partidoId: string
  onLinked: () => void
}

export function VincularVideoModal({ isOpen, onClose, partidoId, onLinked }: VincularVideoModalProps) {
  const [url, setUrl] = useState('')
  const [offsetSec, setOffsetSec] = useState(0)
  const [isLinking, setIsLinking] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const handleLink = async () => {
    if (!url) return
    setIsLinking(true)
    setStatus('idle')
    setErrorMsg('')
    try {
      // 1. Create a dummy/new video record for this URL
      const video = await registrarVideoYoutube(url, `Vídeo Partido ${partidoId}`)
      
      // Update the video with the partidoId
      await supabase.from('videos').update({ partido_id: partidoId }).eq('id', video.id)

      // 2. Update all acciones_etiquetadas for this partido
      // We set video_id = video.id
      // Apply offset: new_minuto = minuto + floor(offset/60), new_seg = seg + (offset % 60)
      // For simplicity in the prototype, we just set video_id, and assuming offset is 0
      const { data: acciones } = await supabase.from('acciones_etiquetadas').select('*').eq('partido_id', partidoId)
      
      if (acciones) {
        for (const accion of acciones) {
          let totalSecs = (accion.minuto_video * 60) + accion.segundo_video + offsetSec
          if (totalSecs < 0) totalSecs = 0
          
          await supabase.from('acciones_etiquetadas').update({
            video_id: video.id,
            minuto_video: Math.floor(totalSecs / 60),
            segundo_video: totalSecs % 60,
          }).eq('id', accion.id)
        }
      }

      setStatus('success')
      setTimeout(() => {
        onLinked()
        onClose()
      }, 1500)
    } catch (e: any) {
      console.error(e)
      setStatus('error')
      setErrorMsg(e.message)
    } finally {
      setIsLinking(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Vincular Vídeo al Partido" size="sm">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-bold text-slate-300 mb-2">URL del Vídeo (YouTube)</label>
          <input 
            type="text" 
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="https://youtube.com/watch?v=..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 outline-none focus:border-emerald-500 transition-colors"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-slate-300 mb-2">Desfase (Segundos)</label>
          <p className="text-xs text-slate-500 mb-2">Si el vídeo empieza antes que el cronómetro, usa un valor positivo (ej. 120 para 2 min).</p>
          <input 
            type="number" 
            value={offsetSec}
            onChange={e => setOffsetSec(parseInt(e.target.value) || 0)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 outline-none focus:border-emerald-500 transition-colors"
          />
        </div>

        {status === 'error' && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {errorMsg}
          </div>
        )}

        {status === 'success' && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            Vídeo vinculado y acciones sincronizadas.
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
          <Button variant="ghost" onClick={onClose} disabled={isLinking}>Cancelar</Button>
          <Button variant="primary" onClick={handleLink} disabled={!url || isLinking}>
            {isLinking ? 'Vinculando...' : 'Vincular Vídeo'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
