'use client'

import React, { useState, useEffect } from 'react'
import { GitCompare, Award, CheckCircle2, ShieldCheck, Users, Trophy } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/Card'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { obtenerJugadores } from '@/lib/supabase/jugadores'
import { obtenerMetricasJugador } from '@/lib/supabase/metricas'
import { POSICION_LABELS, clasePercentil, colorPercentil } from '@/lib/constants'
import type { JugadorConClub, Posicion, MetricaN2Enriquecida } from '@/types/database'
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts'

interface ComparadorSectionProps {
  activeModelName: string
  activeModelId?: string
}

export function ComparadorSection({ activeModelName, activeModelId }: ComparadorSectionProps) {
  const [jugadores, setJugadores] = useState<JugadorConClub[]>([])
  const [posicionSeleccionada, setPosicionSeleccionada] = useState<Posicion>('MC')

  // Selected player IDs (max 3)
  const [player1Id, setPlayer1Id] = useState<string>('')
  const [player2Id, setPlayer2Id] = useState<string>('')
  const [player3Id, setPlayer3Id] = useState<string>('')

  // Metrics state
  const [metricasPlayer1, setMetricasPlayer1] = useState<MetricaN2Enriquecida[]>([])
  const [metricasPlayer2, setMetricasPlayer2] = useState<MetricaN2Enriquecida[]>([])
  const [metricasPlayer3, setMetricasPlayer3] = useState<MetricaN2Enriquecida[]>([])

  useEffect(() => {
    async function loadJugadores() {
      try {
        const jugs = await obtenerJugadores()
        setJugadores(jugs)
      } catch (err) {
        console.error('Error al cargar jugadores para comparador:', err)
      }
    }
    loadJugadores()
  }, [])

  // Auto-select players when position changes
  useEffect(() => {
    const filtrados = jugadores.filter((j) => j.posicion === posicionSeleccionada)
    if (filtrados.length >= 1) setPlayer1Id(filtrados[0].id)
    if (filtrados.length >= 2) setPlayer2Id(filtrados[1].id)
    else setPlayer2Id('')
    setPlayer3Id('')
  }, [posicionSeleccionada, jugadores])

  // Fetch metrics when selections change
  useEffect(() => {
    if (player1Id) obtenerMetricasJugador(player1Id).then(setMetricasPlayer1).catch((err) => console.warn('[Comparador] Error métricas P1:', err?.message ?? err))
    else setMetricasPlayer1([])

    if (player2Id) obtenerMetricasJugador(player2Id).then(setMetricasPlayer2).catch((err) => console.warn('[Comparador] Error métricas P2:', err?.message ?? err))
    else setMetricasPlayer2([])

    if (player3Id) obtenerMetricasJugador(player3Id).then(setMetricasPlayer3).catch((err) => console.warn('[Comparador] Error métricas P3:', err?.message ?? err))
    else setMetricasPlayer3([])
  }, [player1Id, player2Id, player3Id])

  const p1 = jugadores.find((j) => j.id === player1Id)
  const p2 = jugadores.find((j) => j.id === player2Id)
  const p3 = jugadores.find((j) => j.id === player3Id)

  const jugadoresDisponiblesPosicion = jugadores.filter(
    (j) => j.posicion === posicionSeleccionada
  )

  // Construct overlaid radar data
  const metricasKeys = Array.from(
    new Set([
      ...metricasPlayer1.map((m) => m.nombre),
      ...metricasPlayer2.map((m) => m.nombre),
      ...metricasPlayer3.map((m) => m.nombre),
    ])
  )

  const radarData = metricasKeys.map((nombre) => {
    const m1 = metricasPlayer1.find((m) => m.nombre === nombre)
    const m2 = metricasPlayer2.find((m) => m.nombre === nombre)
    const m3 = metricasPlayer3.find((m) => m.nombre === nombre)

    return {
      metrica: nombre,
      [p1 ? `${p1.nombre} ${p1.apellidos}` : 'Jugador 1']: m1?.percentil ?? 0,
      ...(p2 ? { [`${p2.nombre} ${p2.apellidos}`]: m2?.percentil ?? 0 } : {}),
      ...(p3 ? { [`${p3.nombre} ${p3.apellidos}`]: m3?.percentil ?? 0 } : {}),
    }
  })

  // Determine top compatibility winner
  const candidatos = [p1, p2, p3].filter(Boolean) as JugadorConClub[]
  const ganador = candidatos.slice().sort((a, b) => (b.score_global ?? 0) - (a.score_global ?? 0))[0]
  
  // Calcular fortalezas diferenciales del ganador
  let fortalezasDiferenciales: string[] = []
  if (ganador) {
    const metricasGanador = ganador.id === player1Id ? metricasPlayer1 
      : ganador.id === player2Id ? metricasPlayer2 
      : metricasPlayer3
    
    // Top 3 métricas con percentil >= 75
    fortalezasDiferenciales = metricasGanador
      .filter(m => m.percentil >= 75)
      .sort((a, b) => b.percentil - a.percentil)
      .slice(0, 3)
      .map(m => m.nombre)
  }

  return (
    <div className="space-y-6">
      {/* Top Filter Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <GitCompare className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-bold text-slate-100">Comparador Cara a Cara</h2>
          </div>

          {/* Position Selector */}
          <div className="w-full sm:w-64">
            <Select
              label="Posición de Comparación *"
              value={posicionSeleccionada}
              onChange={(e) => setPosicionSeleccionada(e.target.value as Posicion)}
              options={Object.entries(POSICION_LABELS).map(([val, label]) => ({
                value: val,
                label: `${val} — ${label}`,
              }))}
            />
          </div>
        </div>

        {/* Player Selectors (3 slots) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-800/80">
          <Select
            label="Jugador 1"
            value={player1Id}
            onChange={(e) => setPlayer1Id(e.target.value)}
            options={jugadoresDisponiblesPosicion.map((j) => ({
              value: j.id,
              label: `${j.nombre} ${j.apellidos} (${j.score_global})`,
            }))}
            placeholder="Seleccionar..."
          />

          <Select
            label="Jugador 2"
            value={player2Id}
            onChange={(e) => setPlayer2Id(e.target.value)}
            options={jugadoresDisponiblesPosicion
              .filter((j) => j.id !== player1Id)
              .map((j) => ({
                value: j.id,
                label: `${j.nombre} ${j.apellidos} (${j.score_global})`,
              }))}
            placeholder="Seleccionar..."
          />

          <Select
            label="Jugador 3 (Opcional)"
            value={player3Id}
            onChange={(e) => setPlayer3Id(e.target.value)}
            options={jugadoresDisponiblesPosicion
              .filter((j) => j.id !== player1Id && j.id !== player2Id)
              .map((j) => ({
                value: j.id,
                label: `${j.nombre} ${j.apellidos} (${j.score_global})`,
              }))}
            placeholder="Ninguno"
          />
        </div>
      </div>

      {/* Main Grid: Overlaid Radar & Verdict */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Radar Chart (2 cols) */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Superposición del Radar N2</CardTitle>
            <CardDescription>
              Comparación visual de los percentiles de rendimiento según el modelo {activeModelName}
            </CardDescription>
          </CardHeader>
          <CardContent className="h-80 pt-2">
            {radarData.length > 0 && p1 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                  <PolarGrid stroke="#334155" />
                  <PolarAngleAxis dataKey="metrica" stroke="#94a3b8" fontSize={11} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#475569" fontSize={9} />
                  {p1 && (
                    <Radar
                      name={`${p1.nombre} ${p1.apellidos}`}
                      dataKey={`${p1.nombre} ${p1.apellidos}`}
                      stroke="#10b981"
                      fill="#10b981"
                      fillOpacity={0.3}
                    />
                  )}
                  {p2 && (
                    <Radar
                      name={`${p2.nombre} ${p2.apellidos}`}
                      dataKey={`${p2.nombre} ${p2.apellidos}`}
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.3}
                    />
                  )}
                  {p3 && (
                    <Radar
                      name={`${p3.nombre} ${p3.apellidos}`}
                      dataKey={`${p3.nombre} ${p3.apellidos}`}
                      stroke="#f59e0b"
                      fill="#f59e0b"
                      fillOpacity={0.3}
                    />
                  )}
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#1e293b',
                      borderRadius: '8px',
                      color: '#f8fafc',
                      fontSize: '11px',
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                Selecciona al menos 2 jugadores para visualizar la comparación
              </div>
            )}
          </CardContent>
        </Card>

        {/* Verdict Card */}
        <Card className="border-emerald-500/30 bg-gradient-to-b from-slate-900 via-slate-900/90 to-emerald-950/20">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Trophy className="w-4 h-4 text-emerald-400" /> Veredicto de Compatibilidad
            </CardTitle>
            <CardDescription>Recomendación para {activeModelName}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {ganador ? (
              <div className="p-4 rounded-xl bg-slate-950/80 border border-emerald-500/30 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30 flex items-center justify-center text-sm">
                    #1
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-100">
                      {ganador.nombre} {ganador.apellidos}
                    </h3>
                    <p className="text-xs text-slate-400">{ganador.club?.nombre}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
                  <span className="text-slate-400">Score de Compatibilidad:</span>
                  <span className="font-bold text-emerald-400 text-base">
                    {ganador.score_global}/100
                  </span>
                </div>

                <p className="text-xs text-slate-300 italic pt-1">
                  Este jugador ofrece la mayor alineación global con los requisitos tácticos de la posición{' '}
                  <strong className="text-emerald-400">{ganador.posicion}</strong>.
                </p>

                {fortalezasDiferenciales.length > 0 && (
                  <div className="pt-2 border-t border-slate-800">
                    <p className="text-xs font-semibold text-slate-300 mb-1">Fortalezas Diferenciales:</p>
                    <div className="flex flex-wrap gap-1">
                      {fortalezasDiferenciales.map(f => (
                        <Badge key={f} variant="outline" size="sm" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                          {f}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-500 text-center py-6">
                Selecciona jugadores para obtener el veredicto.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Comparative Metrics Table */}
      {candidatos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Matriz Comparativa de Métricas N2</CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase font-semibold">
                <tr>
                  <th className="p-3">Métrica N2</th>
                  {p1 && <th className="p-3 text-center">{p1.nombre} {p1.apellidos}</th>}
                  {p2 && <th className="p-3 text-center">{p2.nombre} {p2.apellidos}</th>}
                  {p3 && <th className="p-3 text-center">{p3.nombre} {p3.apellidos}</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {/* Global Score Row */}
                <tr className="bg-slate-900/60 font-bold text-sm">
                  <td className="p-3 text-slate-100">Score Global</td>
                  {p1 && (
                    <td className="p-3 text-center text-emerald-400">
                      {p1.score_global ?? '—'}
                    </td>
                  )}
                  {p2 && (
                    <td className="p-3 text-center text-emerald-400">
                      {p2.score_global ?? '—'}
                    </td>
                  )}
                  {p3 && (
                    <td className="p-3 text-center text-emerald-400">
                      {p3.score_global ?? '—'}
                    </td>
                  )}
                </tr>

                {/* Metrics Rows */}
                {metricasKeys.map((metricaNombre) => {
                  const m1 = metricasPlayer1.find((m) => m.nombre === metricaNombre)
                  const m2 = metricasPlayer2.find((m) => m.nombre === metricaNombre)
                  const m3 = metricasPlayer3.find((m) => m.nombre === metricaNombre)

                  return (
                    <tr key={metricaNombre} className="hover:bg-slate-900/40 transition-colors">
                      <td className="p-3 font-semibold text-slate-200">{metricaNombre}</td>
                      {p1 && (
                        <td className="p-3 text-center font-bold">
                          <span
                            className={`inline-block px-2 py-0.5 rounded border ${clasePercentil(
                              m1?.percentil ?? 0
                            )}`}
                          >
                            P{m1?.percentil ?? '—'}
                          </span>
                        </td>
                      )}
                      {p2 && (
                        <td className="p-3 text-center font-bold">
                          <span
                            className={`inline-block px-2 py-0.5 rounded border ${clasePercentil(
                              m2?.percentil ?? 0
                            )}`}
                          >
                            P{m2?.percentil ?? '—'}
                          </span>
                        </td>
                      )}
                      {p3 && (
                        <td className="p-3 text-center font-bold">
                          <span
                            className={`inline-block px-2 py-0.5 rounded border ${clasePercentil(
                              m3?.percentil ?? 0
                            )}`}
                          >
                            P{m3?.percentil ?? '—'}
                          </span>
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
