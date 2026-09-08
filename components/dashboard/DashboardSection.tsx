'use client'

import React, { useEffect, useState } from 'react'
import {
  Users,
  Video,
  Award,
  TrendingUp,
  ChevronRight,
  ShieldCheck,
  Zap,
  Tag,
  GitCompare,
  BookOpen,
  UserCheck,
  RotateCcw,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { obtenerJugadoresConScoreModelo } from '@/lib/supabase/jugadores'
import { contarPartidos } from '@/lib/supabase/partidos'
import { POSICION_SHORT, clasePercentil } from '@/lib/constants'
import type { JugadorConClub, Posicion } from '@/types/database'
import type { SectionId } from '@/components/layout/Sidebar'
import { useTheme } from '@/components/theme/ThemeProvider'
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
  onViewSamplePlayer?: () => void
  onOpenGuide?: () => void
  onOpenRecalcularJornada?: () => void
  activeModelName: string
  activeModelId?: string
  refreshKey?: number
}

export function DashboardSection({
  onNavigate,
  onSelectPlayer,
  onViewSamplePlayer,
  onOpenGuide,
  onOpenRecalcularJornada,
  activeModelName,
  activeModelId,
  refreshKey,
}: DashboardSectionProps) {
  const [jugadores, setJugadores] = useState<JugadorConClub[]>([])
  const [totalPartidos, setTotalPartidos] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const { theme } = useTheme()

  useEffect(() => {
    async function loadData() {
      try {
        const [jugs, nPartidos] = await Promise.all([
          obtenerJugadoresConScoreModelo(undefined, activeModelId),
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
  }, [activeModelId, refreshKey])

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

  const colors = ['#059669', '#2563eb', '#0891b2', '#7c3aed', '#db2777', '#d97706', '#dc2626']

  const handleSamplePlayerClick = () => {
    if (onViewSamplePlayer) {
      onViewSamplePlayer()
    } else if (topJugador) {
      onSelectPlayer(topJugador)
    }
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner with Quick Shortcuts */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-50/90 via-teal-50/40 to-white dark:from-slate-900 dark:via-slate-900/90 dark:to-emerald-950/40 border border-emerald-200 dark:border-emerald-500/20 shadow-sm dark:shadow-xl relative overflow-hidden transition-colors">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-1.5">
              <Badge variant="primary" size="sm">
                Prototipo TFM
              </Badge>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Scouting Semiprofesional</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
              Panel de Control — Scouting Semiprofesional
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
              Herramienta táctica diseñada para directores deportivos. Evalúa compatibilidad de futbolistas mediante puntuación (0–100) en Segunda y Tercera RFEF. Modelo activo:{' '}
              <strong className="text-emerald-700 dark:text-emerald-400 font-bold">{activeModelName}</strong>.
            </p>
          </div>

          {/* Direct Quick Actions: 'Ver ficha de ejemplo', 'Probar comparador', 'Guía de inicio' */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Button
              variant="primary"
              size="sm"
              icon={<UserCheck className="w-4 h-4" />}
              onClick={handleSamplePlayerClick}
              className="font-bold shadow-sm"
              title="Abrir directamente la ficha técnica del jugador más destacado"
            >
              Ver Ficha de Ejemplo
            </Button>

            <Button
              variant="outline"
              size="sm"
              icon={<GitCompare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />}
              onClick={() => onNavigate('comparador')}
              title="Ir al comparador táctico cara a cara"
            >
              Probar Comparador
            </Button>

            {onOpenRecalcularJornada && (
              <Button
                variant="outline"
                size="sm"
                icon={<RotateCcw className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
                onClick={onOpenRecalcularJornada}
                className="font-bold border-emerald-300 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-950/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300"
                title="Cerrar la jornada y recalcular estadísticas de jugadores propios y observados"
              >
                Cerrar Jornada & Recalcular
              </Button>
            )}

            {onOpenGuide && (
              <Button
                variant="secondary"
                size="sm"
                icon={<BookOpen className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
                onClick={onOpenGuide}
                title="Consultar la guía interactiva en 5 pasos"
              >
                Guía de Inicio
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Jugadores Monitorizados */}
        <Card className="p-4 flex items-center justify-between border-l-4 border-l-emerald-600 dark:border-l-emerald-500">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Jugadores en Cartera</p>
            <p className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 mt-1">{totalJugadores}</p>
            <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-0.5 flex items-center gap-1 font-medium">
              <ShieldCheck className="w-3.5 h-3.5" /> Base de datos activa
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <Users className="w-6 h-6" />
          </div>
        </Card>

        {/* KPI 2: Partidos Analizados */}
        <Card className="p-4 flex items-center justify-between border-l-4 border-l-blue-600 dark:border-l-blue-500">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Partidos Grabados</p>
            <p className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 mt-1">{totalPartidos}</p>
            <p className="text-[11px] text-blue-700 dark:text-blue-400 mt-0.5 flex items-center gap-1 font-medium">
              <Video className="w-3.5 h-3.5" /> 2 Jornadas RFEF
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Video className="w-6 h-6" />
          </div>
        </Card>

        {/* KPI 3: Alta Compatibilidad */}
        <Card className="p-4 flex items-center justify-between border-l-4 border-l-amber-500">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Alta Compatibilidad (&ge;75)</p>
            <p className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 mt-1">{jugadoresCompatibles.length}</p>
            <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-0.5 flex items-center gap-1 font-medium">
              <Award className="w-3.5 h-3.5" /> Objetivos prioritarios
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <Award className="w-6 h-6" />
          </div>
        </Card>

        {/* KPI 4: Mejor Score Global */}
        <Card className="p-4 flex items-center justify-between border-l-4 border-l-cyan-600 dark:border-l-cyan-500">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Mejor Nota Global</p>
            <p className="text-2xl font-extrabold text-cyan-700 dark:text-cyan-400 mt-1">
              {topJugador ? `${topJugador.score_global}` : '—'}
            </p>
            <p className="text-[11px] text-slate-700 dark:text-slate-300 mt-0.5 truncate max-w-[130px] font-semibold">
              {topJugador ? `${topJugador.nombre} ${topJugador.apellidos}` : 'Sin datos'}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-cyan-50 dark:bg-cyan-500/10 border border-cyan-200 dark:border-cyan-500/20 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
            <TrendingUp className="w-6 h-6" />
          </div>
        </Card>
      </div>

      {/* Main Grid: Position Distribution Chart & Top 5 Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Chart (2 cols) */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Distribución de Plantilla por Posición</CardTitle>
            <CardDescription>
              Número de futbolistas categorizados en las 7 demarcaciones tácticas del modelo
            </CardDescription>
          </CardHeader>
          <CardContent className="h-72 pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis
                  dataKey="nombre"
                  stroke={theme === 'dark' ? '#64748b' : '#475569'}
                  fontSize={12}
                  tickLine={false}
                  fontWeight={500}
                />
                <YAxis
                  stroke={theme === 'dark' ? '#64748b' : '#475569'}
                  fontSize={12}
                  allowDecimals={false}
                  tickLine={false}
                  fontWeight={500}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff',
                    borderColor: theme === 'dark' ? '#1e293b' : '#cbd5e1',
                    borderRadius: '12px',
                    color: theme === 'dark' ? '#f8fafc' : '#0f172a',
                    fontSize: '12px',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
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

        {/* Right Column: High score player recommendations */}
        <Card>
          <CardHeader className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Destacados del Scouting</CardTitle>
              <CardDescription>Mayor encaje con el modelo activo</CardDescription>
            </div>
            <Badge variant="success">TOP 5</Badge>
          </CardHeader>
          <CardContent className="space-y-2.5 pt-2">
            {jugadores
              .slice()
              .sort((a, b) => (b.score_global ?? 0) - (a.score_global ?? 0))
              .slice(0, 5)
              .map((j) => (
                <div
                  key={j.id}
                  onClick={() => onSelectPlayer(j)}
                  className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 dark:bg-slate-900/60 dark:hover:bg-slate-800/80 dark:border-slate-800/80 transition-all cursor-pointer flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-slate-800 border border-emerald-200 dark:border-slate-700 flex items-center justify-center font-bold text-xs text-emerald-800 dark:text-slate-200 shrink-0">
                      {j.nombre[0]}
                      {j.apellidos[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 dark:text-slate-200 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors truncate">
                        {j.nombre} {j.apellidos}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <Badge variant="outline" size="sm" className="py-0 px-1 text-[9px] font-semibold">
                          {j.posicion}
                        </Badge>
                        <span className="truncate">{j.club?.nombre ?? 'Sin club'}</span>
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0 ml-2">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-md text-xs font-extrabold border ${clasePercentil(
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

      {/* Quick Navigation Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
        <Card
          onClick={() => onNavigate('comparador')}
          className="p-5 flex items-center justify-between group cursor-pointer hover:border-indigo-400/50"
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 dark:bg-indigo-500/10 dark:border-indigo-500/20 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                Comparador Táctico
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Enfrenta 2 o 3 futbolistas cara a cara con radar</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" />
        </Card>

        <Card
          onClick={() => onNavigate('modelos')}
          className="p-5 flex items-center justify-between group cursor-pointer hover:border-emerald-400/50"
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                Configurar Modelos
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Ajusta prioridades según el estilo de tu club</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors" />
        </Card>

        <Card
          onClick={() => onNavigate('campograma')}
          className="p-5 flex items-center justify-between group cursor-pointer hover:border-blue-400/50"
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 dark:bg-blue-500/10 dark:border-blue-500/20 dark:text-blue-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                Campograma Táctico
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Pizarra interactiva para diseñar el once inicial</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
        </Card>
      </div>
    </div>
  )
}
