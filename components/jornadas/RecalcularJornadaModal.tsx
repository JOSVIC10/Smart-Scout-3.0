'use client'

import React, { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import {
  RotateCcw,
  Sparkles,
  ShieldCheck,
  Eye,
  CheckCircle2,
  Clock,
  Award,
  ChevronRight,
  TrendingUp,
  Loader2,
  Activity,
} from 'lucide-react'
import { ejecutarRecalculoJornada, type ResumenRecalculoJornada } from '@/lib/jornadas/recalcularJornada'
import { obtenerClubes } from '@/lib/supabase/clubes'
import type { Club } from '@/types/database'

interface RecalcularJornadaModalProps {
  isOpen: boolean
  onClose: () => void
  activeModelId?: string
  activeModelName?: string
  onRecalculoCompletado?: () => void
}

export function RecalcularJornadaModal({
  isOpen,
  onClose,
  activeModelId,
  activeModelName = 'Posesión (4-3-3)',
  onRecalculoCompletado,
}: RecalcularJornadaModalProps) {
  const [jornada, setJornada] = useState<number>(1)
  const [loadingClubs, setLoadingClubs] = useState(false)
  const [clubPropio, setClubPropio] = useState<Club | null>(null)

  // Execution state
  const [ejecutando, setEjecutando] = useState(false)
  const [etapaTexto, setEtapaTexto] = useState('')
  const [progresoPct, setProgresoPct] = useState(0)
  const [faseActual, setFaseActual] = useState<1 | 2 | 3>(1)
  const [resumen, setResumen] = useState<ResumenRecalculoJornada | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      setError(null)
      setResumen(null)
      setEjecutando(false)
      setProgresoPct(0)
      setFaseActual(1)

      obtenerClubes()
        .then((clbs) => {
          const propio = clbs.find((c) => c.nombre.toLowerCase().includes('grama')) || clbs[0]
          setClubPropio(propio || null)
        })
        .catch(console.error)
    }
  }, [isOpen])

  const handleIniciarRecalculo = async () => {
    setEjecutando(true)
    setError(null)
    setResumen(null)
    setProgresoPct(5)
    setFaseActual(1)

    try {
      const resultado = await ejecutarRecalculoJornada({
        jornada,
        clubPropioId: clubPropio?.id,
        modeloId: activeModelId,
        onProgress: (etapa, pct) => {
          setEtapaTexto(etapa)
          setProgresoPct(pct)
          if (pct < 50) setFaseActual(1)
          else if (pct < 95) setFaseActual(2)
          else setFaseActual(3)
        },
      })

      setResumen(resultado)
      onRecalculoCompletado?.()
    } catch (err: any) {
      console.error('Error durante el recálculo de la jornada:', err)
      setError(err?.message || 'Ocurrió un error al procesar el recálculo de la jornada')
    } finally {
      setEjecutando(false)
    }
  }

  const handleCerrar = () => {
    if (ejecutando) return
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCerrar}
      title="Cierre y Recálculo de Jornada"
    >
      <div className="space-y-5">
        {/* Banner descriptivo */}
        {!resumen && !ejecutando && (
          <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50/40 dark:from-slate-900 dark:to-emerald-950/20 border border-emerald-200 dark:border-emerald-500/20 space-y-2">
            <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-400 font-bold text-xs uppercase tracking-wider">
              <Activity className="w-4 h-4" />
              Nutrición de Fichas Deportivas
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Al cerrar la jornada, el sistema computará los minutos, participaciones, goles, asistencias y tarjetas del fin de semana, actualizando las fichas acumuladas con el siguiente orden de prioridad:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <div className="flex items-center gap-2 p-2 rounded-lg bg-white/80 dark:bg-slate-950/60 border border-emerald-200 dark:border-emerald-500/30 text-xs">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-[10px] shrink-0">1</span>
                <div>
                  <p className="font-bold text-slate-800 dark:text-slate-200">Jugadores Propios</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">Plantilla de {clubPropio?.nombre || 'Club Propio'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-white/80 dark:bg-slate-950/60 border border-blue-200 dark:border-blue-500/30 text-xs">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-[10px] shrink-0">2</span>
                <div>
                  <p className="font-bold text-slate-800 dark:text-slate-200">Jugadores Observados</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">Talentos en seguimiento del Directorio</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Configuración de Jornada */}
        {!resumen && !ejecutando && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Número de Jornada a Cerrar
                </label>
                <div className="flex items-center gap-2">
                  <Select
                    value={jornada.toString()}
                    onChange={(e) => setJornada(parseInt(e.target.value) || 1)}
                    options={Array.from({ length: 38 }, (_, i) => ({
                      value: (i + 1).toString(),
                      label: `Jornada ${i + 1}`,
                    }))}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setJornada((prev) => Math.min(38, prev + 1))}
                    title="Avanzar jornada"
                    className="shrink-0 text-xs"
                  >
                    +1
                  </Button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Modelo Táctico Activo
                </label>
                <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 font-semibold truncate">
                  {activeModelName}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
              <Button variant="ghost" size="sm" onClick={handleCerrar}>
                Cancelar
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleIniciarRecalculo}
                icon={<RotateCcw className="w-4 h-4" />}
              >
                Cerrar Jornada {jornada} e Iniciar Recálculo
              </Button>
            </div>
          </div>
        )}

        {/* Vista de Progreso en Vivo */}
        {ejecutando && (
          <div className="py-6 px-4 text-center space-y-5">
            <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
              <div className="w-20 h-20 rounded-full border-4 border-slate-200 dark:border-slate-800 border-t-emerald-600 dark:border-t-emerald-500 animate-spin" />
              <Activity className="w-8 h-8 text-emerald-600 dark:text-emerald-400 absolute" />
            </div>

            <div>
              <h4 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1">
                Recalculando Jornada {jornada}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 min-h-[20px] animate-pulse">
                {etapaTexto || 'Iniciando proceso...'}
              </p>
            </div>

            {/* Barra de Progreso */}
            <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-emerald-600 to-teal-500 h-2.5 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progresoPct}%` }}
              />
            </div>

            {/* Indicadores de Fase */}
            <div className="grid grid-cols-2 gap-3 pt-2 text-left">
              <div
                className={`p-3 rounded-xl border text-xs transition-colors ${
                  faseActual === 1
                    ? 'bg-emerald-50 border-emerald-500/50 text-emerald-800 dark:bg-emerald-950/30 dark:border-emerald-500/40 dark:text-emerald-300 font-bold'
                    : faseActual > 1
                    ? 'bg-slate-50 border-slate-200 text-slate-500 dark:bg-slate-900 dark:border-slate-800'
                    : 'bg-slate-50 border-slate-200 text-slate-400 dark:bg-slate-900 dark:border-slate-800'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="w-4 h-4 rounded-full bg-emerald-600 text-white text-[9px] font-bold flex items-center justify-center">1</span>
                  <span>Fase 1: Propios</span>
                </div>
                <p className="text-[10px] font-normal">Plantilla {clubPropio?.nombre}</p>
              </div>

              <div
                className={`p-3 rounded-xl border text-xs transition-colors ${
                  faseActual === 2
                    ? 'bg-blue-50 border-blue-500/50 text-blue-800 dark:bg-blue-950/30 dark:border-blue-500/40 dark:text-blue-300 font-bold'
                    : faseActual > 2
                    ? 'bg-slate-50 border-slate-200 text-slate-500 dark:bg-slate-900 dark:border-slate-800'
                    : 'bg-slate-50 border-slate-200 text-slate-400 dark:bg-slate-900 dark:border-slate-800'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[9px] font-bold flex items-center justify-center">2</span>
                  <span>Fase 2: Observados</span>
                </div>
                <p className="text-[10px] font-normal">Talentos del Directorio</p>
              </div>
            </div>
          </div>
        )}

        {/* Vista de Resumen de Éxito */}
        {resumen && (
          <div className="space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-500/30 text-emerald-900 dark:text-emerald-200">
              <div className="p-2 rounded-lg bg-emerald-600 text-white shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold">¡Jornada {resumen.jornada} Recalculada y Cerrada!</h4>
                <p className="text-xs text-emerald-700 dark:text-emerald-400">
                  Las fichas de los jugadores han sido nutridas con las estadísticas acumuladas de la jornada.
                </p>
              </div>
            </div>

            {/* Grid de KPIs del Recálculo */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Propios Nutridos</p>
                <p className="text-xl font-extrabold text-emerald-700 dark:text-emerald-400">{resumen.totalPropios}</p>
                <p className="text-[9px] text-slate-400">Plantilla local</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Observados</p>
                <p className="text-xl font-extrabold text-blue-700 dark:text-blue-400">{resumen.totalObservados}</p>
                <p className="text-[9px] text-slate-400">Scouting externo</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Minutos Totales</p>
                <p className="text-xl font-extrabold text-slate-900 dark:text-slate-100">+{resumen.minutosSumados}'</p>
                <p className="text-[9px] text-slate-400">Disputados</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Goles / Asist</p>
                <p className="text-xl font-extrabold text-amber-600">{resumen.golesSumados} <span className="text-slate-400 font-normal">/</span> {resumen.asistenciasSumadas}</p>
                <p className="text-[9px] text-slate-400">Registrados</p>
              </div>
            </div>

            {/* Listado de Jugadores Nutridos */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 max-h-48 overflow-y-auto text-xs">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 sticky top-0 bg-slate-50 dark:bg-slate-900 py-1">
                Detalle de Jugadores Nutridos
              </p>
              {resumen.propiosActualizados.map((p) => (
                <div key={p.id} className="flex items-center justify-between py-1.5 border-b border-slate-200 dark:border-slate-800/60 last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="font-semibold text-slate-900 dark:text-slate-100">{p.nombre} {p.apellidos}</span>
                    <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-mono font-bold">(Propio)</span>
                  </div>
                  <div className="text-slate-500 dark:text-slate-400 text-[11px] font-mono">
                    +{p.minutosSumados}' {p.golesSumados > 0 && `• ⚽ ${p.golesSumados}`}
                  </div>
                </div>
              ))}
              {resumen.observadosActualizados.slice(0, 8).map((o) => (
                <div key={o.id} className="flex items-center justify-between py-1.5 border-b border-slate-200 dark:border-slate-800/60 last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    <span className="font-semibold text-slate-900 dark:text-slate-100">{o.nombre} {o.apellidos}</span>
                    <span className="text-[10px] text-slate-400 truncate max-w-[120px]">({o.club})</span>
                  </div>
                  <div className="text-slate-500 dark:text-slate-400 text-[11px] font-mono">
                    +{o.minutosSumados}' {o.golesSumados > 0 && `• ⚽ ${o.golesSumados}`}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-200 dark:border-slate-800">
              <Button variant="primary" size="sm" onClick={handleCerrar}>
                Aceptar y Ver Fichas Actualizadas
              </Button>
            </div>
          </div>
        )}

        {/* Error notice */}
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-xs">
            {error}
          </div>
        )}
      </div>
    </Modal>
  )
}
