'use client'

import React, { useEffect, useState } from 'react'
import {
  Users,
  Video,
  Award,
  TrendingUp,
  AlertTriangle,
  ChevronRight,
  ShieldCheck,
  Zap,
  Tag,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { obtenerJugadores } from '@/lib/supabase/jugadores'
import { contarPartidos } from '@/lib/supabase/partidos'
import { POSICION_LABELS, POSICION_SHORT, clasePercentil } from '@/lib/constants'
import type { JugadorConClub, Posicion } from '@/types/database'
import type { SectionId } from '@/components/layout/Sidebar'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'

interface DashboardSectionProps {
  onNavigate: (section: SectionId) => void
  onSelectPlayer: (jugador: JugadorConClub) => void
  activeModelName: string
}

export function DashboardSection({
  onNavigate,
  onSelectPlayer,
  activeModelName,
}: DashboardSectionProps) {
  const [jugadores, setJugadores] = useState<JugadorConClub[]>([])
  const [totalPartidos, setTotalPartidos] = useState<number>(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const [jugs, nPartidos] = await Promise.all([
          obtenerJugadores(),
          contarPartidos(),
        ])
        setJugadores(jugs)
        setTotalPartidos(nPartidos)
      } catch (err) {
        console.error('Error al cargar datos del dashboard:', err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  // KPI Calculations
  const totalJugadores = jugadores.length
  const jugadoresCompatibles = jugadores.filter((j) => (j.score_global ?? 0) >= 75)
  const topJugador = [...jugadores].sort((a, b) => (b.score_global ?? 0) - (a.score_global ?? 0))[0]

  // Count by position
  const conteoPorPosicion: Record<Posicion, number> = {
    POR: 0, DFC: 0, LAT: 0, MCD: 0, MC: 0, EXT: 0, DC: 0
  }
  jugadores.forEach((j) => {
    if (conteoPorPosicion[j.posicion] !== undefined) {
      conteoPorPosicion[j.posicion]++
    }
  })

  const chartData = (Object.keys(conteoPorPosicion) as Posicion[]).map((pos) => ({
    posicion: pos,
    nombre: POSICION_SHORT[pos],
    cantidad: conteoPorPosicion[pos],
  }))

  const colors = ['#10b981', '#3b82f6', '#06b6d4', '#8b5cf6', '#ec4899', '#f59e0b', '#ef4444']

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-emerald-950/40 border border-emerald-500/20 shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="primary" size="sm">
                Prototipo TFM
              </Badge>
              <span className="text-xs text-slate-400">Scouting Semiprofesional</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-100">
              Panel de Control — Scouting Semiprofesional
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              Evaluación táctica mediante scoring multicriterio (0–100) para Segunda y Tercera RFEF. Modelo activo:{' '}
              <strong className="text-emerald-400">{activeModelName}</strong>.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="primary"
              size="sm"
              icon={<Users className="w-4 h-4" />}
              onClick={() => onNavigate('jugadores')}
            >
              Ver Directorio
            </Button>
            <Button
              variant="outline"
              size="sm"
              icon={<Video className="w-4 h-4" />}
              onClick={() => onNavigate('video')}
            >
              Analizar Vídeo
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <Card className="p-4 flex items-center justify-between border-l-4 border-l-emerald-500">
          <div>
            <p className="text-xs text-slate-400 font-medium">Jugadores Monitorizados</p>
            <p className="text-2xl font-bold text-slate-100 mt-1">{totalJugadores}</p>
            <p className="text-[11px] text-emerald-400 mt-0.5 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> Base de datos activa
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Users className="w-6 h-6" />
          </div>
        </Card>

        {/* KPI 2 */}
        <Card className="p-4 flex items-center justify-between border-l-4 border-l-blue-500">
          <div>
            <p className="text-xs text-slate-400 font-medium">Partidos Analizados</p>
            <p className="text-2xl font-bold text-slate-100 mt-1">{totalPartidos}</p>
            <p className="text-[11px] text-blue-400 mt-0.5 flex items-center gap-1">
              <Video className="w-3 h-3" /> 2 Jornadas RFEF
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Video className="w-6 h-6" />
          </div>
        </Card>

        {/* KPI 3 */}
        <Card className="p-4 flex items-center justify-between border-l-4 border-l-amber-500">
          <div>
            <p className="text-xs text-slate-400 font-medium">Alta Compatibilidad (&gt;=75)</p>
            <p className="text-2xl font-bold text-slate-100 mt-1">{jugadoresCompatibles.length}</p>
            <p className="text-[11px] text-amber-400 mt-0.5 flex items-center gap-1">
              <Award className="w-3 h-3" /> Perfiles recomendados
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Award className="w-6 h-6" />
          </div>
        </Card>

        {/* KPI 4 */}
        <Card className="p-4 flex items-center justify-between border-l-4 border-l-cyan-500">
          <div>
            <p className="text-xs text-slate-400 font-medium">Mejor Score Global</p>
            <p className="text-2xl font-bold text-cyan-400 mt-1">
              {topJugador ? `${topJugador.score_global}` : '—'}
            </p>
            <p className="text-[11px] text-slate-300 mt-0.5 truncate max-w-[130px]">
              {topJugador ? `${topJugador.nombre} ${topJugador.apellidos}` : 'Sin datos'}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <TrendingUp className="w-6 h-6" />
          </div>
        </Card>
      </div>

      {/* Main Grid: Position Chart & High Score Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Chart (2 cols) */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Distribución de Plantilla por Posición</CardTitle>
            <CardDescription>
              Representación del número de jugadores categorizados en las 7 posiciones base del modelo
            </CardDescription>
          </CardHeader>
          <CardContent className="h-64 pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="nombre" stroke="#64748b" fontSize={12} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={12} allowDecimals={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#1e293b',
                    borderRadius: '8px',
                    color: '#f8fafc',
                    fontSize: '12px',
                  }}
                  formatter={(value: any) => [`${value} jugadores`, 'Cantidad']}
                />
                <Bar dataKey="cantidad" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Right Column: High score player alerts */}
        <Card>
          <CardHeader className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Destacados del Scouting</CardTitle>
              <CardDescription>Jugadores con mayor compatibilidad</CardDescription>
            </div>
            <Badge variant="success">TOP 5</Badge>
          </CardHeader>
          <CardContent className="space-y-3 pt-2">
            {jugadores
              .slice()
              .sort((a, b) => (b.score_global ?? 0) - (a.score_global ?? 0))
              .slice(0, 5)
              .map((j) => (
                <div
                  key={j.id}
                  onClick={() => onSelectPlayer(j)}
                  className="p-2.5 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800/80 transition-all cursor-pointer flex items-center justify-between"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-slate-200 shrink-0">
                      {j.nombre[0]}
                      {j.apellidos[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-200 truncate">
                        {j.nombre} {j.apellidos}
                      </p>
                      <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Badge variant="outline" size="sm" className="py-0 px-1 text-[9px]">
                          {j.posicion}
                        </Badge>
                        <span className="truncate">{j.club?.nombre ?? 'Sin club'}</span>
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0 ml-2">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-xs font-bold border ${clasePercentil(
                        j.score_global ?? 0
                      )}`}
                    >
                      {j.score_global ?? 0}
                    </span>
                  </div>
                </div>
              ))}
          </CardContent>
        </Card>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
        <Card
          glass
          onClick={() => onNavigate('comparador')}
          className="p-5 flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-200 group-hover:text-emerald-400 transition-colors">
                Comparador Táctico
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">Enfrenta 2 o 3 jugadores cara a cara</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-emerald-400 transition-colors" />
        </Card>

        <Card
          glass
          onClick={() => onNavigate('modelos')}
          className="p-5 flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-200 group-hover:text-emerald-400 transition-colors">
                Configurar Modelos
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">Ajusta pesos Rank-Sum por posición</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-emerald-400 transition-colors" />
        </Card>

        <Card
          glass
          onClick={() => onNavigate('campograma')}
          className="p-5 flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-200 group-hover:text-emerald-400 transition-colors">
                Campograma Táctico
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">Diseña alineaciones sobre la pizarra</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-emerald-400 transition-colors" />
        </Card>
      </div>
    </div>
  )
}
