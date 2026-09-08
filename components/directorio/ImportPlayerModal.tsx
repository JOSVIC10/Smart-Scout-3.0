'use client'

import React, { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Link2, Sparkles, Check, AlertCircle, Loader2, BarChart2 } from 'lucide-react'
import { crearJugador } from '@/lib/supabase/jugadores'
import { obtenerClubes, crearClub } from '@/lib/supabase/clubes'
import { supabase } from '@/lib/supabase/client'
import type { Posicion, PosicionDetallada, PiePreferido, Categoria, Jugador } from '@/types/database'
import { POSICION_LABELS, POSICION_DETALLADA_LABELS } from '@/lib/constants'

interface ImportPlayerModalProps {
  isOpen: boolean
  onClose: () => void
  onPlayerCreated: (newPlayer: Jugador) => void
}

interface ParsedPlayer {
  nombre: string
  apellidos: string
  club_nombre: string
  posicion: Posicion
  posicion_detallada: PosicionDetallada
  pie_preferido: PiePreferido
  fecha_nacimiento: string
  altura_cm: number
  peso_kg: number
  categoria: Categoria
  valor_mercado: string
  fin_contrato: string
  score_global: number
  foto_url: string | null
  est_partidos: number
  est_minutos: number
  est_goles: number
  est_asistencias: number
  est_amarillas: number
  est_rojas: number
}

export function ImportPlayerModal({ isOpen, onClose, onPlayerCreated }: ImportPlayerModalProps) {
  const [url, setUrl] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [parsed, setParsed] = useState<ParsedPlayer | null>(null)

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!url.trim()) return

    setAnalyzing(true)
    setError(null)
    setParsed(null)

    try {
      const res = await fetch('/api/importar-jugador', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() })
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'No se pudieron extraer datos de la URL.')
      }

      setParsed(data.player)
    } catch (err: any) {
      setError(err.message || 'Error al conectar con el servidor')
    } finally {
      setAnalyzing(false)
    }
  }

  const handleSave = async () => {
    if (!parsed) return
    setSaving(true)
    setError(null)

    try {
      // 1. Encontrar o crear club
      const allClubs = await obtenerClubes()
      let club = allClubs.find(c => c.nombre.toLowerCase() === parsed.club_nombre.toLowerCase())

      if (!club) {
        club = await crearClub({
          nombre: parsed.club_nombre,
          ciudad: 'España',
          provincia: 'España',
          categoria: parsed.categoria,
          escudo_url: null
        })
      }

      // 2. Crear Jugador con sus estadísticas básicas
      const nuevo = await crearJugador({
        nombre: parsed.nombre.trim(),
        apellidos: parsed.apellidos.trim(),
        nacionalidad: 'España',
        fecha_nacimiento: parsed.fecha_nacimiento || null,
        pie_preferido: parsed.pie_preferido,
        posicion: parsed.posicion,
        posicion_detallada: parsed.posicion_detallada,
        dorsal: null,
        club_id: club.id,
        altura_cm: parsed.altura_cm || null,
        peso_kg: parsed.peso_kg || null,
        categoria: parsed.categoria,
        valor_mercado: parsed.valor_mercado || null,
        fin_contrato: parsed.fin_contrato || null,
        minutos_jugados: parsed.est_minutos || 1200,
        partidos_analizados: parsed.est_partidos || 14,
        score_global: parsed.score_global || 75,
        foto_url: parsed.foto_url,
        est_partidos: parsed.est_partidos,
        est_minutos: parsed.est_minutos,
        est_goles: parsed.est_goles,
        est_asistencias: parsed.est_asistencias,
        est_amarillas: parsed.est_amarillas,
        est_rojas: parsed.est_rojas
      })

      // 3. Valoración Scouting Inicial
      try {
        await supabase.from('valoraciones').insert({
          jugador_id: nuevo.id,
          score: parsed.score_global || 75,
          aspectos_positivos: ['Importado vía scouting digital', 'Perfil a seguir'],
          aspectos_mejora: ['Adaptación táctica'],
          notas: `[IMPORTACIÓN WEB]: Jugador extraído desde ${url}. Observado como objetivo potencial de mercado.`,
          recomendacion: 'SEGUIR'
        })
      } catch (valErr) {
        console.warn('Nota de valoración opcional no insertada:', valErr)
      }

      // Asociar club al jugador para renderizado inmediato
      const nuevoConClub = {
        ...nuevo,
        club: club
      }

      onPlayerCreated(nuevoConClub)
      handleClose()
    } catch (err: any) {
      console.error('Error al guardar jugador importado:', err)
      setError(err.message || 'Error al guardar el jugador en la base de datos')
    } finally {
      setSaving(false)
    }
  }

  const handleClose = () => {
    setUrl('')
    setParsed(null)
    setError(null)
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Importar Jugador por Enlace Web">
      <div className="space-y-5">
        {/* Input URL */}
        <form onSubmit={handleAnalyze} className="space-y-3">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Enlace de BeSoccer, LaPreferente o ficha web
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Link2 className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 dark:text-slate-500" />
              <input
                type="url"
                required
                placeholder="https://es.besoccer.com/jugador/..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-colors shadow-xs"
              />
            </div>
            <Button
              type="submit"
              variant="primary"
              disabled={analyzing || !url.trim()}
              icon={analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            >
              {analyzing ? 'Extrayendo...' : 'Analizar'}
            </Button>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
            <span>Portales compatibles:</span>
            <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-mono">BeSoccer</span>
            <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-mono">LaPreferente</span>
            <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-mono">Transfermarkt / Web</span>
          </div>
        </form>

        {/* Error notice */}
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2.5 text-red-700 dark:text-red-300 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
            <p>{error}</p>
          </div>
        )}

        {/* Live Parsed Preview & Editor */}
        {parsed && (
          <div className="p-4 bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700 rounded-xl space-y-4 animate-in fade-in duration-200 shadow-xs max-h-[68vh] overflow-y-auto">
            <div className="flex items-center gap-3.5 pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="w-14 h-14 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-800 border-2 border-emerald-500 shrink-0 shadow-md">
                {parsed.foto_url ? (
                  <img src={parsed.foto_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-bold text-slate-600 dark:text-slate-400 bg-slate-200 dark:bg-slate-800 text-base">
                    {parsed.nombre.charAt(0)}{parsed.apellidos.charAt(0)}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                  Datos detectados automáticamente
                </span>
                <h4 className="text-base font-bold text-slate-900 dark:text-slate-100 truncate">
                  {parsed.nombre} {parsed.apellidos}
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 truncate">
                  {parsed.club_nombre} • {parsed.posicion}
                </p>
              </div>
            </div>

            {/* Editable fields */}
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Información del Jugador</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Nombre</label>
                  <Input
                    value={parsed.nombre}
                    onChange={(e) => setParsed({ ...parsed, nombre: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Apellidos</label>
                  <Input
                    value={parsed.apellidos}
                    onChange={(e) => setParsed({ ...parsed, apellidos: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Club Actual</label>
                  <Input
                    value={parsed.club_nombre}
                    onChange={(e) => setParsed({ ...parsed, club_nombre: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Posición Principal</label>
                  <Select
                    value={parsed.posicion}
                    onChange={(e) => setParsed({ ...parsed, posicion: e.target.value as Posicion })}
                    options={Object.entries(POSICION_LABELS).map(([k, v]) => ({ value: k, label: `${k} - ${v}` }))}
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Posición Detallada</label>
                  <Select
                    value={parsed.posicion_detallada}
                    onChange={(e) => setParsed({ ...parsed, posicion_detallada: e.target.value as PosicionDetallada })}
                    options={Object.entries(POSICION_DETALLADA_LABELS).map(([k, v]) => ({ value: k, label: v }))}
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Categoría</label>
                  <Select
                    value={parsed.categoria}
                    onChange={(e) => setParsed({ ...parsed, categoria: e.target.value as Categoria })}
                    options={[
                      { value: 'Tercera RFEF', label: 'Tercera RFEF' },
                      { value: 'Segunda RFEF', label: 'Segunda RFEF' },
                      { value: 'Otra', label: 'Otra' }
                    ]}
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Score Inicial Estimado (0-100)</label>
                  <Input
                    type="number"
                    min="40"
                    max="99"
                    value={parsed.score_global}
                    onChange={(e) => setParsed({ ...parsed, score_global: parseInt(e.target.value) || 75 })}
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Valor de Mercado</label>
                  <Input
                    value={parsed.valor_mercado}
                    onChange={(e) => setParsed({ ...parsed, valor_mercado: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Estadísticas básicas (Temporada Actual) */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-1.5 mb-2.5">
                <BarChart2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Estadísticas Básicas de Temporada
                </p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-xs">
                <div>
                  <label className="block text-slate-500 dark:text-slate-400 mb-1 text-[11px] font-semibold text-center">Partidos (PJ)</label>
                  <Input
                    type="number"
                    min="0"
                    max="60"
                    className="px-2 text-center font-mono"
                    value={parsed.est_partidos}
                    onChange={(e) => setParsed({ ...parsed, est_partidos: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <label className="block text-slate-500 dark:text-slate-400 mb-1 text-[11px] font-semibold text-center">Minutos</label>
                  <Input
                    type="number"
                    min="0"
                    max="5000"
                    className="px-2 text-center font-mono"
                    value={parsed.est_minutos}
                    onChange={(e) => setParsed({ ...parsed, est_minutos: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <label className="block text-slate-500 dark:text-slate-400 mb-1 text-[11px] font-semibold text-center">Goles</label>
                  <Input
                    type="number"
                    min="0"
                    max="50"
                    className="px-2 text-center font-mono"
                    value={parsed.est_goles}
                    onChange={(e) => setParsed({ ...parsed, est_goles: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <label className="block text-slate-500 dark:text-slate-400 mb-1 text-[11px] font-semibold text-center">Asistencias</label>
                  <Input
                    type="number"
                    min="0"
                    max="50"
                    className="px-2 text-center font-mono"
                    value={parsed.est_asistencias}
                    onChange={(e) => setParsed({ ...parsed, est_asistencias: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <label className="block text-slate-500 dark:text-slate-400 mb-1 text-[11px] font-semibold text-center">Amarillas</label>
                  <Input
                    type="number"
                    min="0"
                    max="30"
                    className="px-2 text-center font-mono"
                    value={parsed.est_amarillas}
                    onChange={(e) => setParsed({ ...parsed, est_amarillas: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <label className="block text-slate-500 dark:text-slate-400 mb-1 text-[11px] font-semibold text-center">Rojas</label>
                  <Input
                    type="number"
                    min="0"
                    max="10"
                    className="px-2 text-center font-mono"
                    value={parsed.est_rojas}
                    onChange={(e) => setParsed({ ...parsed, est_rojas: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
              <Button variant="ghost" size="sm" onClick={handleClose}>
                Cancelar
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={saving}
                onClick={handleSave}
                icon={saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              >
                {saving ? 'Guardando en Directorio...' : 'Confirmar e Incorporar'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
