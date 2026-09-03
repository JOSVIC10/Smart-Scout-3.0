'use client'

import React, { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Link2, Sparkles, Check, AlertCircle, Loader2 } from 'lucide-react'
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
}

const M = {
  CONSTRUCCION: 'c2000001-0000-0000-0000-000000000001',
  ASOCIATIVO:   'c2000001-0000-0000-0000-000000000002',
  PROGRESION:   'c2000001-0000-0000-0000-000000000003',
  CREACION:     'c2000001-0000-0000-0000-000000000004',
  ESTRATEGIA:   'c2000001-0000-0000-0000-000000000005',
  FINALIZACION: 'c2000001-0000-0000-0000-000000000006',
  AMENAZA:      'c2000001-0000-0000-0000-000000000007',
  DEF_RIVAL:    'c2000001-0000-0000-0000-000000000008',
  DEF_ABIERTO:  'c2000001-0000-0000-0000-000000000009',
  DEF_PROPIO:   'c2000001-0000-0000-0000-000000000010',
  CONSERVACION: 'c2000001-0000-0000-0000-000000000011',
  PORTERO:      'c2000001-0000-0000-0000-000000000012'
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

      // 2. Crear Jugador
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
        minutos_jugados: 1200,
        partidos_analizados: 14,
        score_global: parsed.score_global || 75,
        foto_url: parsed.foto_url
      })

      // 3. Crear Métricas N2 Calibradas para su radar
      const base = parsed.score_global || 75
      const mRows: { metrica_n2_id: string; percentil: number }[] = []

      if (parsed.posicion === 'POR') {
        mRows.push(
          { metrica_n2_id: M.PORTERO, percentil: Math.min(96, Math.round(base + 5)) },
          { metrica_n2_id: M.DEF_PROPIO, percentil: Math.min(94, Math.round(base - 1)) },
          { metrica_n2_id: M.CONSTRUCCION, percentil: Math.max(35, Math.round(base - 15)) },
          { metrica_n2_id: M.CONSERVACION, percentil: Math.max(30, Math.round(base - 22)) }
        )
      } else if (parsed.posicion === 'DFC' || parsed.posicion === 'LAT') {
        const isLat = parsed.posicion === 'LAT'
        mRows.push(
          { metrica_n2_id: M.DEF_ABIERTO, percentil: Math.min(96, Math.round(base + (isLat ? 2 : 6))) },
          { metrica_n2_id: M.DEF_PROPIO, percentil: Math.min(96, Math.round(base + (isLat ? 0 : 5))) },
          { metrica_n2_id: M.CONSTRUCCION, percentil: Math.round(base - 3) },
          { metrica_n2_id: M.PROGRESION, percentil: Math.round(base + (isLat ? 6 : -10)) },
          { metrica_n2_id: M.FINALIZACION, percentil: Math.max(25, Math.round(base - 32)) }
        )
      } else if (parsed.posicion === 'MC' || parsed.posicion === 'MCD') {
        const isMcd = parsed.posicion === 'MCD'
        mRows.push(
          { metrica_n2_id: M.CONSTRUCCION, percentil: Math.min(96, Math.round(base + 4)) },
          { metrica_n2_id: M.ASOCIATIVO, percentil: Math.min(95, Math.round(base + 3)) },
          { metrica_n2_id: M.CONSERVACION, percentil: Math.round(base + (isMcd ? 6 : 1)) },
          { metrica_n2_id: M.PROGRESION, percentil: Math.round(base - (isMcd ? 5 : 1)) },
          { metrica_n2_id: M.CREACION, percentil: Math.round(base + (isMcd ? -10 : 4)) }
        )
      } else {
        const isExt = parsed.posicion === 'EXT'
        mRows.push(
          { metrica_n2_id: M.AMENAZA, percentil: Math.min(96, Math.round(base + (isExt ? 6 : 3))) },
          { metrica_n2_id: M.FINALIZACION, percentil: Math.min(96, Math.round(base + (isExt ? 0 : 8))) },
          { metrica_n2_id: M.CREACION, percentil: Math.round(base + (isExt ? 4 : -5)) },
          { metrica_n2_id: M.PROGRESION, percentil: Math.round(base + (isExt ? 3 : -3)) },
          { metrica_n2_id: M.DEF_RIVAL, percentil: Math.max(30, Math.round(base - 26)) }
        )
      }

      await supabase.from('jugador_metricas_n2').insert(mRows.map(r => ({
        jugador_id: nuevo.id,
        metrica_n2_id: r.metrica_n2_id,
        percentil: r.percentil,
        valor: r.percentil / 100,
        muestra: 10
      })))

      // 4. Valoración Scouting Inicial
      await supabase.from('valoraciones').insert({
        jugador_id: nuevo.id,
        score: parsed.score_global || 75,
        aspectos_positivos: ['Importado vía scouting digital', 'Perfil a seguir'],
        aspectos_mejora: ['Adaptación táctica'],
        notas: `[IMPORTACIÓN WEB]: Jugador extraído desde ${url}. Observado como objetivo potencial de mercado.`,
        recomendacion: 'SEGUIR'
      })

      onPlayerCreated(nuevo)
      handleClose()
    } catch (err: any) {
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
          <label className="block text-xs font-semibold text-slate-300">
            Enlace de BeSoccer, LaPreferente o ficha web
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Link2 className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
              <input
                type="url"
                required
                placeholder="https://es.besoccer.com/jugador/..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
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
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <span>Portales compatibles:</span>
            <span className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 text-slate-300 font-mono">BeSoccer</span>
            <span className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 text-slate-300 font-mono">LaPreferente</span>
            <span className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 text-slate-300 font-mono">Transfermarkt / Web</span>
          </div>
        </form>

        {/* Error notice */}
        {error && (
          <div className="p-3 bg-red-950/50 border border-red-800 rounded-lg flex items-start gap-2.5 text-red-300 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        {/* Live Parsed Preview & Editor */}
        {parsed && (
          <div className="p-4 bg-slate-900/90 border border-slate-700 rounded-xl space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center gap-3.5 pb-3 border-b border-slate-800">
              <div className="w-14 h-14 rounded-full overflow-hidden bg-slate-800 border-2 border-emerald-500 shrink-0 shadow-md">
                {parsed.foto_url ? (
                  <img src={parsed.foto_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-bold text-slate-400 bg-slate-800 text-base">
                    {parsed.nombre.charAt(0)}{parsed.apellidos.charAt(0)}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                  Datos detectados automáticamente
                </span>
                <h4 className="text-base font-bold text-slate-100 truncate">
                  {parsed.nombre} {parsed.apellidos}
                </h4>
                <p className="text-xs text-slate-400 truncate">
                  {parsed.club_nombre} • {parsed.posicion}
                </p>
              </div>
            </div>

            {/* Editable fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Nombre</label>
                <Input
                  value={parsed.nombre}
                  onChange={(e) => setParsed({ ...parsed, nombre: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Apellidos</label>
                <Input
                  value={parsed.apellidos}
                  onChange={(e) => setParsed({ ...parsed, apellidos: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Club Actual</label>
                <Input
                  value={parsed.club_nombre}
                  onChange={(e) => setParsed({ ...parsed, club_nombre: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Posición Principal</label>
                <Select
                  value={parsed.posicion}
                  onChange={(e) => setParsed({ ...parsed, posicion: e.target.value as Posicion })}
                  options={Object.entries(POSICION_LABELS).map(([k, v]) => ({ value: k, label: `${k} - ${v}` }))}
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Posición Detallada</label>
                <Select
                  value={parsed.posicion_detallada}
                  onChange={(e) => setParsed({ ...parsed, posicion_detallada: e.target.value as PosicionDetallada })}
                  options={Object.entries(POSICION_DETALLADA_LABELS).map(([k, v]) => ({ value: k, label: v }))}
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Categoría</label>
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
                <label className="block text-slate-400 mb-1">Score Inicial Estimado (0-100)</label>
                <Input
                  type="number"
                  min="40"
                  max="99"
                  value={parsed.score_global}
                  onChange={(e) => setParsed({ ...parsed, score_global: parseInt(e.target.value) || 75 })}
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Valor de Mercado</label>
                <Input
                  value={parsed.valor_mercado}
                  onChange={(e) => setParsed({ ...parsed, valor_mercado: e.target.value })}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
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
