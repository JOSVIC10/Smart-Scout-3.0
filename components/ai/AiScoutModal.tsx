'use client'

import React, { useState, useMemo } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Sparkles, Search, ArrowRight, UserCheck, CheckCircle2, Shield, Eye } from 'lucide-react'
import type { JugadorConClub } from '@/types/database'
import { calcularEdad, POSICION_LABELS } from '@/lib/constants'

interface AiScoutModalProps {
  isOpen: boolean
  onClose: () => void
  jugadores: JugadorConClub[]
  activeModelName: string
  activeModelId?: string
  onSelectPlayer: (jugador: JugadorConClub) => void
}

const EJEMPLOS_PROMPTS = [
  'Central con buena salida de balón para posesión',
  'Extremo veloz para contraataque sub-23',
  'Mediocentro organizador que termine contrato en 2026',
  'Delantero goleador con experiencia',
  'Relevo para sustituir a Biel Del Valle',
]

export function AiScoutModal({
  isOpen,
  onClose,
  jugadores,
  activeModelName,
  activeModelId,
  onSelectPlayer,
}: AiScoutModalProps) {
  const [prompt, setPrompt] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  const handleSearch = (textToSearch?: string) => {
    const q = textToSearch !== undefined ? textToSearch : prompt
    if (!q.trim()) return
    setIsSearching(true)
    setHasSearched(true)
    setTimeout(() => {
      setIsSearching(false)
    }, 350)
  }

  // Motor semántico de Scouting IA
  const { resultados, veredictoIA } = useMemo(() => {
    if (!prompt.trim() || !hasSearched) {
      return { resultados: [], veredictoIA: '' }
    }

    const q = prompt.toLowerCase()
    let pool = [...jugadores]

    // 1. Detección de Posición
    if (q.includes('central') || q.includes('dfc') || q.includes('defensa central')) {
      pool = pool.filter(j => j.posicion === 'DFC')
    } else if (q.includes('lateral') || q.includes('carrilero') || q.includes('lat')) {
      pool = pool.filter(j => j.posicion === 'LAT')
    } else if (q.includes('pivote') || q.includes('mcd')) {
      pool = pool.filter(j => j.posicion === 'MCD' || j.posicion === 'MC')
    } else if (q.includes('medio') || q.includes('centrocampista') || q.includes('organizador') || q.includes('mc')) {
      pool = pool.filter(j => j.posicion === 'MC' || j.posicion === 'MCD')
    } else if (q.includes('extremo') || q.includes('banda') || q.includes('ext')) {
      pool = pool.filter(j => j.posicion === 'EXT')
    } else if (q.includes('delantero') || q.includes('punta') || q.includes('goleador') || q.includes('rematador') || q.includes('dc')) {
      pool = pool.filter(j => j.posicion === 'DC')
    } else if (q.includes('portero') || q.includes('arquero') || q.includes('por')) {
      pool = pool.filter(j => j.posicion === 'POR')
    }

    // 2. Detección de Edad (Sub-23 o Veteranos)
    if (q.includes('sub-23') || q.includes('sub23') || q.includes('joven') || q.includes('promesa')) {
      pool = pool.filter(j => {
        const edad = calcularEdad(j.fecha_nacimiento)
        return edad !== null && edad <= 23
      })
    } else if (q.includes('veterano') || q.includes('experiencia') || q.includes('mayor')) {
      pool = pool.filter(j => {
        const edad = calcularEdad(j.fecha_nacimiento)
        return edad !== null && edad >= 28
      })
    }

    // 3. Detección de Contratos (Fin 2026 / Libre)
    if (q.includes('contrato') || q.includes('2026') || q.includes('libre') || q.includes('coste cero')) {
      pool = pool.filter(j => {
        const fin = j.fin_contrato || ''
        return fin.includes('2026') || fin.toLowerCase().includes('libre')
      })
    }

    // 4. Búsqueda por similitud de nombre
    const jugadorMencionado = jugadores.find(j => 
      q.includes(j.nombre.toLowerCase()) || q.includes(j.apellidos.toLowerCase())
    )
    if (jugadorMencionado && pool.length === jugadores.length) {
      // Si mencionó un jugador y no se filtró posición, buscar en su misma posición
      pool = jugadores.filter(j => j.posicion === jugadorMencionado.posicion && j.id !== jugadorMencionado.id)
    }

    // Ordenar por Fit Score en el modelo activo
    const ordenados = pool.sort((a, b) => (b.score_global ?? 0) - (a.score_global ?? 0)).slice(0, 5)

    // Redacción del veredicto IA
    let veredicto = ''
    if (ordenados.length > 0) {
      const top1 = ordenados[0]
      const edadTop = calcularEdad(top1.fecha_nacimiento)
      veredicto = `Para tu búsqueda en el modelo ${activeModelName}, el perfil más destacado es ${top1.nombre} ${top1.apellidos} (${top1.club?.nombre}, ${edadTop ? `${edadTop} años` : ''}) con un Fit Score de ${top1.score_global ?? '—'}. ${
        ordenados.length > 1 ? `Como alternativa de mercado, ${ordenados[1].nombre} ${ordenados[1].apellidos} ofrece un encaje táctico de ${ordenados[1].score_global ?? '—'} puntos.` : ''
      }`
    } else {
      veredicto = `No se han encontrado futbolistas que cumplan todos los criterios simultáneos. Prueba a ampliar los términos de búsqueda o flexibilizar los requisitos de edad/contrato.`
    }

    return { resultados: ordenados, veredictoIA: veredicto }
  }, [prompt, hasSearched, jugadores, activeModelName])

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Asistente de IA (AI Scout Copilot)"
      size="3xl"
    >
      <div className="space-y-5">
        {/* Cabecera descriptiva */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-sky-950/40 border border-emerald-500/20 flex items-start gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shrink-0 mt-0.5">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              Búsqueda en Lenguaje Natural de Dirección Deportiva
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">
                {activeModelName}
              </span>
            </h4>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Escribe lo que necesita tu plantilla con tus propias palabras (posición, estilo, edad, contrato). La IA cruzará tus requisitos con las métricas ponderadas de los 113 jugadores.
            </p>
          </div>
        </div>

        {/* Input con Botón */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSearch()
              }}
              placeholder="Ej: Central zurdo sub-23 para posesión, o Extremo veloz para contraataque..."
              className="pl-4 pr-10 py-3 text-sm bg-slate-900 border-slate-700/80 focus:border-emerald-500"
              autoFocus
            />
          </div>
          <Button
            variant="primary"
            onClick={() => handleSearch()}
            loading={isSearching}
            icon={<Sparkles className="w-4 h-4 text-slate-950" />}
          >
            Buscar con IA
          </Button>
        </div>

        {/* Prompts de Ejemplo Rápido */}
        <div className="space-y-1.5">
          <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
            Sugerencias de búsqueda rápida:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {EJEMPLOS_PROMPTS.map((ej) => (
              <button
                key={ej}
                type="button"
                onClick={() => {
                  setPrompt(ej)
                  handleSearch(ej)
                }}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-emerald-400 border border-slate-800 transition-colors text-left"
              >
                ✨ {ej}
              </button>
            ))}
          </div>
        </div>

        {/* Resultados de la IA */}
        {hasSearched && (
          <div className="space-y-4 pt-2 border-t border-slate-800 animate-in fade-in duration-200">
            {/* Veredicto en Prosa de la IA */}
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-start gap-3">
              <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-xs text-slate-300 leading-relaxed space-y-1">
                <span className="font-bold text-slate-200 block">Dictamen del Asistente IA:</span>
                <p>{veredictoIA}</p>
              </div>
            </div>

            {/* Listado de Jugadores Seleccionados */}
            {resultados.length > 0 && (
              <div className="space-y-2">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Candidatos Recomendados ({resultados.length}):
                </p>
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {resultados.map((j, idx) => {
                    const edad = calcularEdad(j.fecha_nacimiento)
                    const esSub23 = edad !== null && edad <= 23
                    return (
                      <div
                        key={j.id}
                        className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-emerald-500/50 flex items-center justify-between gap-3 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="w-6 h-6 rounded-full bg-slate-800 text-slate-400 font-bold text-xs flex items-center justify-center shrink-0">
                            #{idx + 1}
                          </span>
                          <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-800 border border-slate-700 shrink-0">
                            {j.foto_url ? (
                              <img src={j.foto_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center font-bold text-slate-300 text-xs">
                                {j.nombre[0]}{j.apellidos[0]}
                              </div>
                            )}
                          </div>
                          <div className="truncate">
                            <div className="flex items-center gap-1.5">
                              <h5 className="font-bold text-slate-100 text-sm truncate">
                                {j.nombre} {j.apellidos}
                              </h5>
                              {esSub23 && (
                                <span className="text-[9px] px-1 py-0.2 rounded bg-sky-500/20 text-sky-400 border border-sky-500/30 font-bold shrink-0">
                                  SUB-23
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-400 truncate">
                              {j.posicion} • {j.club?.nombre} • {edad !== null ? `${edad} años` : '—'}
                              {j.fin_contrato ? ` • Fin: ${j.fin_contrato}` : ''}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-right px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                            <span className="text-[9px] text-emerald-500 block uppercase font-bold">Fit Score</span>
                            <span className="text-sm font-black text-emerald-400 font-mono">
                              {j.score_global ?? '—'}
                            </span>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              onClose()
                              onSelectPlayer(j)
                            }}
                            className="text-xs h-8"
                          >
                            <Eye className="w-3.5 h-3.5 mr-1" />
                            Ver Ficha
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  )
}
