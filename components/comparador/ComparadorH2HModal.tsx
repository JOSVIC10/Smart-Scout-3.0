'use client'

import React, { useEffect, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ArrowRight, CheckCircle2, TrendingUp, AlertCircle, Shield, Sparkles } from 'lucide-react'
import type { JugadorConClub } from '@/types/database'
import { calcularEdad, POSICION_LABELS } from '@/lib/constants'
import { supabase } from '@/lib/supabase/client'
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
  Tooltip
} from 'recharts'

interface ComparadorH2HModalProps {
  isOpen: boolean
  onClose: () => void
  jugadorClub: JugadorConClub
  jugadorObjetivo: JugadorConClub
  activeModelName: string
  activeModelId?: string
}

interface MetricaComparada {
  codigo: string
  nombre: string
  valorClub: number
  valorObjetivo: number
}

export function ComparadorH2HModal({
  isOpen,
  onClose,
  jugadorClub,
  jugadorObjetivo,
  activeModelName,
  activeModelId
}: ComparadorH2HModalProps) {
  const [metricasData, setMetricasData] = useState<MetricaComparada[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isOpen) return

    async function cargarMetricas() {
      setLoading(true)
      try {
        const { data } = await supabase
          .from('jugador_metricas_n2')
          .select('jugador_id, percentil, metrica:metricas_nivel2(codigo, nombre)')
          .in('jugador_id', [jugadorClub.id, jugadorObjetivo.id])

        const mapClub = new Map<string, { nombre: string; val: number }>()
        const mapObj = new Map<string, { nombre: string; val: number }>()

        if (data) {
          for (const row of data) {
            const m = row.metrica as any
            if (!m) continue
            if (row.jugador_id === jugadorClub.id) {
              mapClub.set(m.codigo, { nombre: m.nombre, val: row.percentil ?? 50 })
            } else {
              mapObj.set(m.codigo, { nombre: m.nombre, val: row.percentil ?? 50 })
            }
          }
        }

        const allCodes = Array.from(new Set([...mapClub.keys(), ...mapObj.keys()]))
        const comp: MetricaComparada[] = allCodes.map((code) => ({
          codigo: code,
          nombre: mapClub.get(code)?.nombre || mapObj.get(code)?.nombre || code,
          valorClub: mapClub.get(code)?.val ?? Math.round((jugadorClub.score_global || 70) - 5),
          valorObjetivo: mapObj.get(code)?.val ?? Math.round((jugadorObjetivo.score_global || 70) - 2)
        }))

        // Si no hay métricas explícitas, generar comparación estimada estándar
        if (comp.length === 0) {
          comp.push(
            { codigo: 'def', nombre: 'Defensa', valorClub: jugadorClub.score_global || 70, valorObjetivo: jugadorObjetivo.score_global || 74 },
            { codigo: 'pro', nombre: 'Progresión', valorClub: Math.round((jugadorClub.score_global || 70) * 0.95), valorObjetivo: Math.round((jugadorObjetivo.score_global || 74) * 1.05) },
            { codigo: 'aso', nombre: 'Juego Asociativo', valorClub: Math.round((jugadorClub.score_global || 70) * 1.02), valorObjetivo: Math.round((jugadorObjetivo.score_global || 74) * 0.98) },
            { codigo: 'con', nombre: 'Construcción', valorClub: jugadorClub.score_global || 70, valorObjetivo: jugadorObjetivo.score_global || 72 },
            { codigo: 'ame', nombre: 'Amenaza', valorClub: Math.round((jugadorClub.score_global || 70) * 0.92), valorObjetivo: Math.round((jugadorObjetivo.score_global || 74) * 1.08) }
          )
        }

        setMetricasData(comp)
      } catch (err) {
        console.error('Error cargando métricas H2H:', err)
      } finally {
        setLoading(false)
      }
    }

    cargarMetricas()
  }, [isOpen, jugadorClub.id, jugadorObjetivo.id])

  const edadClub = calcularEdad(jugadorClub.fecha_nacimiento)
  const edadObj = calcularEdad(jugadorObjetivo.fecha_nacimiento)
  const scoreClub = jugadorClub.score_global ?? 70
  const scoreObj = jugadorObjetivo.score_global ?? 70
  const deltaScore = Math.round((scoreObj - scoreClub) * 10) / 10

  const radarData = metricasData.map((m) => ({
    atributo: m.nombre.length > 14 ? m.nombre.substring(0, 12) + '...' : m.nombre,
    [jugadorClub.nombre]: m.valorClub,
    [jugadorObjetivo.nombre]: m.valorObjetivo
  }))

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Comparador Cara a Cara (Head-to-Head Scouting)"
      size="4xl"
    >
      <div className="space-y-6">
        {/* Cabecera de Confrontación */}
        <div className="grid grid-cols-1 md:grid-cols-11 gap-4 items-center p-4 bg-slate-900/90 border border-slate-800 rounded-2xl">
          
          {/* Jugador del Club */}
          <div className="md:col-span-5 flex items-center gap-3.5 p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/30">
            <div className="w-14 h-14 rounded-full overflow-hidden bg-slate-800 border-2 border-emerald-500 shrink-0 shadow-lg">
              {jugadorClub.foto_url ? (
                <img src={jugadorClub.foto_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-bold text-slate-300">
                  {jugadorClub.nombre[0]}{jugadorClub.apellidos[0]}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
                Tu Jugador (Titular)
              </span>
              <h4 className="text-base font-bold text-slate-100 truncate">
                {jugadorClub.nombre} {jugadorClub.apellidos}
              </h4>
              <p className="text-xs text-slate-400 truncate">
                {jugadorClub.club?.nombre} • {edadClub !== null ? `${edadClub} años` : '—'}
              </p>
            </div>
            <div className="text-right shrink-0">
              <span className="text-[10px] text-slate-400 block font-mono">Score</span>
              <span className="text-2xl font-black text-emerald-400 font-mono">{scoreClub}</span>
            </div>
          </div>

          {/* VS Badge */}
          <div className="md:col-span-1 flex justify-center">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-black text-slate-300 shadow">
              VS
            </div>
          </div>

          {/* Objetivo de Scouting */}
          <div className="md:col-span-5 flex items-center gap-3.5 p-3 rounded-xl bg-sky-950/20 border border-sky-500/30">
            <div className="text-left shrink-0">
              <span className="text-[10px] text-slate-400 block font-mono">Score</span>
              <span className="text-2xl font-black text-sky-400 font-mono">{scoreObj}</span>
            </div>
            <div className="min-w-0 flex-1 text-right">
              <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider block">
                Objetivo de Scouting
              </span>
              <h4 className="text-base font-bold text-slate-100 truncate">
                {jugadorObjetivo.nombre} {jugadorObjetivo.apellidos}
              </h4>
              <p className="text-xs text-slate-400 truncate">
                {jugadorObjetivo.club?.nombre} • {edadObj !== null ? `${edadObj} años` : '—'}
              </p>
            </div>
            <div className="w-14 h-14 rounded-full overflow-hidden bg-slate-800 border-2 border-sky-500 shrink-0 shadow-lg">
              {jugadorObjetivo.foto_url ? (
                <img src={jugadorObjetivo.foto_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-bold text-slate-300">
                  {jugadorObjetivo.nombre[0]}{jugadorObjetivo.apellidos[0]}
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Radar Superpuesto y Tabla Cara a Cara */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          
          {/* Radar Superpuesto */}
          <div className="lg:col-span-6 bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Comparativa de Radar (0-100)
              </h4>
              <span className="text-[10px] text-emerald-400 font-semibold font-mono">
                Modelo: {activeModelName}
              </span>
            </div>
            
            <div className="w-full h-72">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="65%" data={radarData}>
                  <PolarGrid stroke="#334155" strokeDasharray="3 3" />
                  <PolarAngleAxis dataKey="atributo" stroke="#94a3b8" fontSize={9} fontWeight="bold" />
                  <PolarRadiusAxis 
                    type="number"
                    domain={[0, 100]}
                    angle={90}
                    ticks={[25, 50, 75, 100]}
                    tick={{ fill: '#64748b', fontSize: 8 }}
                    axisLine={false}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-slate-900/95 border border-slate-700 px-3 py-2 rounded-lg shadow-xl text-xs backdrop-blur-sm space-y-1">
                            <p className="font-bold text-slate-200">{payload[0].payload.atributo}</p>
                            <p className="text-emerald-400 font-semibold flex items-center justify-between gap-3">
                              <span>{jugadorClub.nombre}:</span>
                              <span className="font-bold font-mono">{payload[0].value}</span>
                            </p>
                            {payload[1] && (
                              <p className="text-sky-400 font-semibold flex items-center justify-between gap-3">
                                <span>{jugadorObjetivo.nombre}:</span>
                                <span className="font-bold font-mono">{payload[1].value}</span>
                              </p>
                            )}
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Radar
                    name={jugadorClub.nombre}
                    dataKey={jugadorClub.nombre}
                    stroke="#10b981"
                    strokeWidth={2}
                    fill="#10b981"
                    fillOpacity={0.25}
                  />
                  <Radar
                    name={jugadorObjetivo.nombre}
                    dataKey={jugadorObjetivo.nombre}
                    stroke="#38bdf8"
                    strokeWidth={2}
                    fill="#38bdf8"
                    fillOpacity={0.25}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Tabla de Métricas Cara a Cara */}
          <div className="lg:col-span-6 space-y-2.5">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Diferencial por Atributo
            </h4>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {metricasData.map((m) => {
                const diff = m.valorObjetivo - m.valorClub
                const ganaObjetivo = diff > 0
                const ganaClub = diff < 0
                return (
                  <div key={m.codigo} className="p-2.5 rounded-xl bg-slate-900 border border-slate-800/80 flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-200">{m.nombre}</span>
                    <div className="flex items-center gap-4 font-mono">
                      <span className={`font-bold ${ganaClub ? 'text-emerald-400' : 'text-slate-400'}`}>
                        {m.valorClub}
                      </span>
                      <span className="text-slate-600">vs</span>
                      <span className={`font-bold ${ganaObjetivo ? 'text-sky-400' : 'text-slate-400'}`}>
                        {m.valorObjetivo}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold min-w-[48px] text-center ${
                        diff > 0
                          ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                          : diff < 0
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        {diff > 0 ? `+${diff}` : diff === 0 ? '=' : `${diff}`}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

        </div>

        {/* Dictamen Ejecutivo de Dirección Deportiva */}
        <div className={`p-4 rounded-2xl border flex items-start gap-3.5 ${
          deltaScore > 0
            ? 'bg-emerald-950/25 border-emerald-500/40 text-emerald-300'
            : 'bg-slate-900 border-slate-800 text-slate-300'
        }`}>
          {deltaScore > 0 ? (
            <TrendingUp className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <Shield className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          )}
          <div className="text-xs space-y-1">
            <h5 className="font-bold text-slate-100 text-sm flex items-center gap-2">
              Dictamen de Secretaría Técnica
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                {deltaScore > 0 ? `+${deltaScore} pts de Upgrade` : `${deltaScore} pts de Rendimiento`}
              </span>
            </h5>
            <p className="text-slate-300 leading-relaxed">
              {deltaScore > 0 ? (
                <>
                  El objetivo de mercado <strong className="text-sky-300">{jugadorObjetivo.nombre} {jugadorObjetivo.apellidos}</strong> representa un <strong className="text-emerald-400">fichaje con salto de calidad (+{deltaScore} de score)</strong> para el modelo táctico <strong>{activeModelName}</strong>. 
                  {edadObj && edadClub && edadObj < edadClub ? ` Además, aporta rejuvenecimiento de la posición (${edadObj} años frente a ${edadClub} años).` : ''}
                </>
              ) : (
                <>
                  Tu jugador actual <strong className="text-emerald-300">{jugadorClub.nombre} {jugadorClub.apellidos}</strong> mantiene un nivel competitivo <strong className="text-slate-100">superior o equivalente</strong> al objetivo de scouting en este sistema. El fichaje solo tendría sentido como rotación de fondo de armario o por oportunidad económica.
                </>
              )}
            </p>
          </div>
        </div>

        {/* Botón de Cierre */}
        <div className="flex justify-end pt-2 border-t border-slate-800">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cerrar Comparativa
          </Button>
        </div>

      </div>
    </Modal>
  )
}
