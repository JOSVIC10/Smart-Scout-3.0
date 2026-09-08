'use client'

import React, { useState, useRef, useCallback } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import {
  PlayCircle,
  Upload,
  Film,
  CheckCircle2,
  AlertCircle,
  X,
  Link,
  FileVideo,
} from 'lucide-react'
import { registrarVideoYoutube, subirVideoStorage } from '@/lib/supabase/videos'
import type { Video } from '@/types/database'

interface VideoUploadModalProps {
  isOpen: boolean
  onClose: () => void
  onVideoCreated: (video: Video) => void
}

type Tab = 'youtube' | 'archivo'
type Status = 'idle' | 'uploading' | 'success' | 'error'

const YT_REGEX = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/|shorts\/)|youtu\.be\/)[-\w]{11}/

export function VideoUploadModal({ isOpen, onClose, onVideoCreated }: VideoUploadModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>('youtube')
  const [titulo, setTitulo] = useState('')

  // YouTube tab
  const [ytUrl, setYtUrl] = useState('')
  const [ytError, setYtError] = useState('')

  // File tab
  const [file, setFile] = useState<File | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Shared status
  const [status, setStatus] = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const resetState = () => {
    setTitulo('')
    setYtUrl('')
    setYtError('')
    setFile(null)
    setDragOver(false)
    setUploadProgress(0)
    setStatus('idle')
    setErrorMsg('')
  }

  const handleClose = () => {
    resetState()
    onClose()
  }

  // ————————————————————————————
  // YouTube validation
  // ————————————————————————————
  const validateYt = (url: string) => {
    if (!url) { setYtError(''); return false }
    if (!YT_REGEX.test(url)) {
      setYtError('URL de YouTube no válida. Usa el formato: youtube.com/watch?v=...')
      return false
    }
    setYtError('')
    return true
  }

  // ————————————————————————————
  // File drag & drop
  // ————————————————————————————
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile && droppedFile.type.startsWith('video/')) {
      setFile(droppedFile)
      if (!titulo) setTitulo(droppedFile.name.replace(/\.[^.]+$/, ''))
    }
  }, [titulo])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) {
      setFile(f)
      if (!titulo) setTitulo(f.name.replace(/\.[^.]+$/, ''))
    }
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  // ————————————————————————————
  // Submit
  // ————————————————————————————
  const handleSubmit = async () => {
    if (!titulo.trim()) {
      setErrorMsg('El título es obligatorio')
      return
    }

    setStatus('uploading')
    setErrorMsg('')

    try {
      let video: Video

      if (activeTab === 'youtube') {
        if (!validateYt(ytUrl)) {
          setStatus('idle')
          return
        }
        video = await registrarVideoYoutube(ytUrl.trim(), titulo.trim())
      } else {
        if (!file) {
          setErrorMsg('Selecciona un archivo de vídeo')
          setStatus('idle')
          return
        }
        // Simulate progress (Supabase JS SDK doesn't expose upload progress yet)
        const progressInterval = setInterval(() => {
          setUploadProgress(p => Math.min(p + 8, 90))
        }, 300)

        video = await subirVideoStorage(file, titulo.trim())

        clearInterval(progressInterval)
        setUploadProgress(100)
      }

      setStatus('success')
      setTimeout(() => {
        onVideoCreated(video)
        handleClose()
      }, 800)
    } catch (err: any) {
      setStatus('error')
      setErrorMsg(err?.message ?? 'Error al procesar el vídeo')
    }
  }

  const isSubmitting = status === 'uploading'
  const canSubmit =
    titulo.trim() &&
    ((activeTab === 'youtube' && ytUrl && !ytError) ||
     (activeTab === 'archivo' && file)) &&
    !isSubmitting

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Añadir Vídeo de Partido" size="md">
      <div className="space-y-5">
        {/* Tab switcher */}
        <div className="flex rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 p-0.5 bg-slate-100 dark:bg-slate-950/60 gap-0.5">
          {[
            { id: 'youtube' as Tab, label: 'URL de YouTube', icon: <PlayCircle className="w-3.5 h-3.5" /> },
            { id: 'archivo' as Tab, label: 'Subir Archivo', icon: <Upload className="w-3.5 h-3.5" /> },
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Title input (always visible) */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Título del Vídeo *</label>
          <input
            type="text"
            value={titulo}
            onChange={e => setTitulo(e.target.value)}
            placeholder="Ej: Real Madrid vs Barcelona — Jornada 12"
            className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-300 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30 transition-all shadow-xs"
          />
        </div>

        {/* ——— YouTube panel ——— */}
        {activeTab === 'youtube' && (
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Link className="w-3.5 h-3.5" />
              URL del Vídeo de YouTube
            </label>
            <div className="relative">
              <PlayCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-500" />
              <input
                type="url"
                value={ytUrl}
                onChange={e => {
                  setYtUrl(e.target.value)
                  validateYt(e.target.value)
                }}
                placeholder="https://www.youtube.com/watch?v=..."
                className={`w-full pl-9 pr-3 py-2.5 rounded-xl bg-white dark:bg-slate-900/80 border text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none transition-all shadow-xs ${
                  ytError
                    ? 'border-red-500/60 focus:border-red-500/80'
                    : 'border-slate-300 dark:border-slate-700 focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30'
                }`}
              />
            </div>
            {ytError && (
              <p className="text-[11px] text-red-500 flex items-center gap-1 font-medium">
                <AlertCircle className="w-3 h-3" />
                {ytError}
              </p>
            )}
            {ytUrl && !ytError && (
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
                <CheckCircle2 className="w-3 h-3" />
                URL válida — el vídeo se reproducirá vía embed
              </p>
            )}
          </div>
        )}

        {/* ——— File upload panel ——— */}
        {activeTab === 'archivo' && (
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <FileVideo className="w-3.5 h-3.5" />
              Archivo de Vídeo
              <span className="text-slate-500 font-normal">(.mp4, .webm, .mov, .avi — máx. 500MB)</span>
            </label>

            {/* Drop zone */}
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`
                relative rounded-xl border-2 border-dashed cursor-pointer transition-all
                flex flex-col items-center justify-center gap-2 py-8
                ${dragOver
                  ? 'border-emerald-500/60 bg-emerald-500/5'
                  : file
                    ? 'border-emerald-500/40 bg-emerald-500/5'
                    : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 hover:border-slate-400 dark:hover:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-900/60'
                }
              `}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                className="hidden"
                onChange={handleFileChange}
              />
              {file ? (
                <>
                  <Film className="w-8 h-8 text-emerald-400" />
                  <div className="text-center">
                    <p className="text-sm font-semibold text-slate-200">{file.name}</p>
                    <p className="text-xs text-slate-400">{formatSize(file.size)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={e => { e.stopPropagation(); setFile(null) }}
                    className="absolute top-2 right-2 p-1 rounded-lg hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <>
                  <Upload className="w-8 h-8 text-slate-500" />
                  <div className="text-center">
                    <p className="text-sm font-semibold text-slate-300">Arrastra el vídeo aquí</p>
                    <p className="text-xs text-slate-500">o haz clic para seleccionar</p>
                  </div>
                </>
              )}
            </div>

            {/* Progress bar */}
            {status === 'uploading' && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Subiendo a Supabase Storage...</span>
                  <span className="font-mono text-emerald-400">{uploadProgress}%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Error / Success feedback */}
        {status === 'error' && errorMsg && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {errorMsg}
          </div>
        )}

        {status === 'success' && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            Vídeo registrado correctamente. Cargando en el reproductor...
          </div>
        )}

        {errorMsg && status !== 'error' && (
          <p className="text-[11px] text-red-400 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {errorMsg}
          </p>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-200 dark:border-slate-800">
          <Button variant="ghost" onClick={handleClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={!canSubmit}
            icon={
              isSubmitting
                ? <span className="w-4 h-4 border-2 border-emerald-300/30 border-t-emerald-400 rounded-full animate-spin" />
                : activeTab === 'youtube'
                  ? <PlayCircle className="w-4 h-4" />
                  : <Upload className="w-4 h-4" />
            }
          >
            {isSubmitting ? 'Procesando...' : 'Añadir Vídeo'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
