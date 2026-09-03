'use client'

import React, { useState, useEffect } from 'react'
import {
  Briefcase, AlertTriangle, Search, Target, Users, ArrowRight,
  X, Shield, Eye, CheckCircle2, Clock, Swords, Sparkles, AlertCircle
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { FichaJugadorModal } from '@/components/directorio/FichaJugadorModal'
import { ComparadorH2HModal } from '@/components/comparador/ComparadorH2HModal'
import { obtenerJugadores, obtenerJugadoresConScoreModelo } from '@/lib/supabase/jugadores'
import { obtenerClubes } from '@/lib/supabase/clubes'
import type { JugadorConClub, Club, Posicion } from '@/types/database'
import { POSICION_LABELS, calcularEdad } from '@/lib/constants'

interface PlanificadorSectionProps {
  activeModelName: string
  activeModelId?: string
}

type EstadoNegociacion = 'Ojeado' | 'En Contacto' | 'Oferta Enviada' | 'Descartado'

export function PlanificadorSection({ activeModelName, activeModelId }: PlanificadorSectionProps) {
  const [jugadores, setJugadores] = useState<JugadorConClub[]>([])
  const [clubes, setClubes] = useState<Club[]>([])
  const [loading, setLoading] = useState(true)

  const [miClubId, setMiClubId] = useState<string>('')
  const [relevoPlayer, setRelevoPlayer] = useState<JugadorConClub | null>(null)
  const [selectedPlayer, setSelectedPlayer] = useState<JugadorConClub | null>(null)
  const [h2hTargetPlayer, setH2hTargetPlayer] = useState<JugadorConClub | null>(null)

  useEffect(() => {
    async function cargarDatos() {
      setLoading(true)
      try {
        const [jugs, clbs] = await Promise.all([
          obtenerJugadoresConScoreModelo(undefined, activeModelId),
          obtenerClubes()
        ])
        setJugadores(jugs)
        setClubes(clbs)
        if (clbs.length > 0) {
          const feGrama = clbs.find(c => c.nombre.toLowerCase().includes('grama'))
          setMiClubId(feGrama ? feGrama.id : clbs[0].id)
        }
      } catch (err) {
        console.error('Error cargando planificador:', err)
      } finally {
        setLoading(false)
      }
    }
    cargarDatos()
  }, [activeModelId])

  const miPlantilla = jugadores.filter(j => j.club_id === miClubId)
  
  // Agrupar por líneas correctamente soportando posiciones base y detalladas
  const porteros = miPlantilla.filter(j => j.posicion === 'POR')
  const defensas = miPlantilla.filter(j => 
    ['DFC', 'LAT'].includes(j.posicion) || 
    ['LAT_DER', 'LAT_IZQ', 'DFC_DER', 'DFC_IZQ', 'DFC_CEN'].includes(j.posicion) ||
    ['LAT_DER', 'LAT_IZQ', 'DFC_DER', 'DFC_IZQ', 'DFC_CEN'].includes(j.posicion_detallada ?? '')
  )
  const medios = miPlantilla.filter(j => 
    ['MC', 'MCD', 'MP'].includes(j.posicion) || 
    ['MCD', 'MC_DER', 'MC_IZQ', 'MC_CEN', 'MP'].includes(j.posicion) ||
    ['MCD', 'MC_DER', 'MC_IZQ', 'MC_CEN', 'MP'].includes(j.posicion_detallada ?? '')
  )
  const delanteros = miPlantilla.filter(j => 
    ['DC', 'EXT'].includes(j.posicion) || 
    ['EXT_DER', 'EXT_IZQ', 'DC'].includes(j.posicion) ||
    ['EXT_DER', 'EXT_IZQ', 'DC'].includes(j.posicion_detallada ?? '')
  )

  // Control de Cupos RFEF y Balance Contractual
  const totalFichas = miPlantilla.length
  const sub23Count = miPlantilla.filter(j => {
    const edad = calcularEdad(j.fecha_nacimiento)
    return edad !== null && edad <= 23
  }).length
  const seniorCount = totalFichas - sub23Count
  const sub23Valido = sub23Count >= 6
  const seniorValido = seniorCount <= 16
  const contratos2026 = miPlantilla.filter(j => j.fin_contrato && j.fin_contrato.includes('2026')).length

  const clubOptions = clubes.map(c => ({ value: c.id, label: c.nombre }))

  const getAlertas = (jugador: JugadorConClub) => {
    const alertas = []
    const edad = calcularEdad(jugador.fecha_nacimiento)
    if (edad !== null && edad >= 30) alertas.push('Veterano (>30a)')
    if (jugador.fin_contrato && jugador.fin_contrato.includes('2026')) {
      alertas.push('Fin Contrato 2026 (Urgente)')
    }
    return alertas
  }

  const renderLinea = (titulo: string, lista: JugadorConClub[]) => (
    <div className="space-y-3">
      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
        <span>{titulo}</span>
        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
          {lista.length}
        </span>
      </h3>
      {lista.length === 0 ? (
        <div className="p-6 text-center text-slate-500 bg-slate-900/40 rounded-xl border border-dashed border-slate-800 text-sm">
          Sin jugadores en esta línea
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {lista.map(j => {
            const alertas = getAlertas(j)
            const edad = calcularEdad(j.fecha_nacimiento)
            const esFin2026 = j.fin_contrato && j.fin_contrato.includes('2026')
            const esSub23 = edad !== null && edad <= 23

            return (
              <div 
                key={j.id} 
                onClick={() => setSelectedPlayer(j)}
                className="p-4 rounded-xl bg-slate-900 border border-slate-800 relative group hover:border-emerald-500/50 hover:bg-slate-900/90 transition-all cursor-pointer shadow-sm"
              >
                <div className="flex items-start gap-3 mb-2">
                  {/* Avatar / Foto */}
                  <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700/80 overflow-hidden flex items-center justify-center font-bold text-slate-300 text-sm shrink-0 group-hover:border-emerald-500/40 transition-colors">
                    {j.foto_url ? (
                      <img 
                        src={j.foto_url} 
                        alt={j.nombre} 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                          if (e.currentTarget.nextElementSibling) {
                            (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'flex'
                          }
                        }}
                      />
                    ) : null}
                    <span className={j.foto_url ? 'hidden' : 'flex'}>
                      {j.nombre[0]}{j.apellidos[0]}
                    </span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-bold text-slate-200 group-hover:text-emerald-400 transition-colors truncate">
                        {j.nombre} {j.apellidos}
                      </h4>
                      {esSub23 && (
                        <span className="text-[9px] px-1 py-0.2 rounded bg-sky-500/20 text-sky-400 border border-sky-500/30 font-bold shrink-0">
                          SUB-23
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-emerald-400 font-medium truncate mt-0.5">
                      {j.posicion} - {POSICION_LABELS[j.posicion]}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-xs font-bold text-slate-300">{edad ? `${edad} años` : '—'}</div>
                    <div className="text-[11px] font-mono text-emerald-400 font-bold">★ {j.score_global ?? '—'}</div>
                  </div>
                </div>
                
                {alertas.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2.5 mb-2.5">
                    {alertas.map(a => (
                      <Badge key={a} variant="outline" className={`text-[10px] ${a.includes('Urgente') ? 'bg-red-500/20 text-red-300 border-red-500/40' : 'bg-amber-500/10 text-amber-400 border-amber-500/30'}`}>
                        <AlertTriangle className="w-3 h-3 mr-1 inline" /> {a}
                      </Badge>
                    ))}
                  </div>
                )}
                
                {/* Semáforo Contractual */}
                <div className="mt-3 pt-3 border-t border-slate-800/80 flex justify-between items-center text-xs">
                  <div className="text-[11px]">
                    <span className="text-slate-500 block text-[9px] uppercase font-bold">Contrato</span>
                    {esFin2026 ? (
                      <span className="inline-flex items-center gap-1 text-red-400 font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                        {j.fin_contrato} (6m)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        {j.fin_contrato || 'Vigente'}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-7 text-[10px] bg-slate-950 border-slate-700 text-slate-300 hover:text-white"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedPlayer(j)
                      }}
                    >
                      <Eye className="w-3 h-3 mr-1" /> Ficha
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-7 text-[10px] bg-slate-950 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                      onClick={(e) => {
                        e.stopPropagation()
                        setRelevoPlayer(j)
                      }}
                    >
                      Relevo <Target className="w-3 h-3 ml-1" />
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Principal */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Shield className="w-6 h-6 text-emerald-400" />
            Plantilla del Club & Planificador Deportivo
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Gestión de licencias RFEF, semáforo de contratos y Shadow Squad para <span className="text-emerald-400 font-semibold">{activeModelName}</span>
          </p>
        </div>
        
        <div className="w-full md:w-64">
          <Select
            label="Selecciona tu Club"
            value={miClubId}
            onChange={(e) => setMiClubId(e.target.value)}
            options={clubOptions}
          />
        </div>
      </div>

      {/* Widget Estratégico RFEF: Cupos Senior vs Sub-23 & Alertas Contractuales */}
      {miClubId && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Total Licencias */}
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Licencias</p>
              <h4 className="text-xl font-black text-slate-100 mt-0.5">{totalFichas} <span className="text-xs font-normal text-slate-400">/ 22 max</span></h4>
            </div>
            <Users className="w-6 h-6 text-slate-500" />
          </div>

          {/* Fichas Senior */}
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fichas Senior (RFEF)</p>
              <h4 className="text-xl font-black text-slate-100 mt-0.5">
                {seniorCount} <span className="text-xs font-normal text-slate-400">/ 16 max</span>
              </h4>
            </div>
            <Badge variant={seniorValido ? 'success' : 'danger'} size="sm">
              {seniorValido ? `${16 - seniorCount} libres` : 'Exceso'}
            </Badge>
          </div>

          {/* Fichas Sub-23 */}
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fichas Sub-23 (Oblig.)</p>
              <h4 className="text-xl font-black text-slate-100 mt-0.5">
                {sub23Count} <span className="text-xs font-normal text-slate-400">/ 6 mín.</span>
              </h4>
            </div>
            <Badge variant={sub23Valido ? 'success' : 'outline'} className={sub23Valido ? '' : 'bg-amber-500/20 text-amber-300 border-amber-500/30'} size="sm">
              {sub23Valido ? 'Cumplido' : `Faltan ${6 - sub23Count}`}
            </Badge>
          </div>

          {/* Alertas Fin de Contrato 2026 */}
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Expira Contrato 2026</p>
              <h4 className="text-xl font-black text-red-400 mt-0.5">{contratos2026} <span className="text-xs font-normal text-slate-400">jugadores</span></h4>
            </div>
            <Badge variant={contratos2026 > 0 ? 'danger' : 'success'} size="sm">
              {contratos2026 > 0 ? 'Atención' : 'Estable'}
            </Badge>
          </div>
        </div>
      )}

      {loading ? (
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-slate-900/50 rounded-xl border border-slate-800" />
          <div className="h-32 bg-slate-900/50 rounded-xl border border-slate-800" />
        </div>
      ) : miClubId ? (
        <div className="space-y-8">
          {renderLinea('Porteros', porteros)}
          {renderLinea('Defensas', defensas)}
          {renderLinea('Centrocampistas', medios)}
          {renderLinea('Delanteros', delanteros)}
        </div>
      ) : (
        <div className="p-12 text-center text-slate-500">
          Selecciona un club para ver su plantilla
        </div>
      )}

      {/* Ficha Jugador Modal */}
      {selectedPlayer && (
        <FichaJugadorModal
          isOpen={!!selectedPlayer}
          onClose={() => setSelectedPlayer(null)}
          jugador={selectedPlayer}
          activeModelName={activeModelName}
          activeModelId={activeModelId}
          onPlayerUpdated={(act) => {
            setJugadores(prev => prev.map(p => p.id === act.id ? act : p))
            setSelectedPlayer(act)
          }}
        />
      )}

      {/* Shadow Squad Modal */}
      {relevoPlayer && (
        <Modal 
          isOpen={!!relevoPlayer} 
          onClose={() => setRelevoPlayer(null)} 
          title={`Shadow Squad: Relevo para ${relevoPlayer.nombre} ${relevoPlayer.apellidos}`}
          size="4xl"
        >
          <ShadowSquadView 
            jugadorActual={relevoPlayer} 
            todosJugadores={jugadores} 
            miClubId={miClubId} 
            activeModelName={activeModelName}
            onOpenH2H={(candidato) => setH2hTargetPlayer(candidato)}
          />
        </Modal>
      )}

      {/* Comparador Cara a Cara H2H */}
      {relevoPlayer && h2hTargetPlayer && (
        <ComparadorH2HModal
          isOpen={!!h2hTargetPlayer}
          onClose={() => setH2hTargetPlayer(null)}
          jugadorClub={relevoPlayer}
          jugadorObjetivo={h2hTargetPlayer}
          activeModelName={activeModelName}
          activeModelId={activeModelId}
        />
      )}
    </div>
  )
}

function ShadowSquadView({
  jugadorActual,
  todosJugadores,
  miClubId,
  activeModelName,
  onOpenH2H
}: { 
  jugadorActual: JugadorConClub, 
  todosJugadores: JugadorConClub[], 
  miClubId: string,
  activeModelName: string,
  onOpenH2H: (candidato: JugadorConClub) => void
}) {
  // Estado local de negociación por jugador
  const [estados, setEstados] = useState<Record<string, EstadoNegociacion>>({})

  useEffect(() => {
    try {
      const saved = localStorage.getItem(`ss_pipeline_${jugadorActual.id}`)
      if (saved) setEstados(JSON.parse(saved))
    } catch (e) {}
  }, [jugadorActual.id])

  const cambiarEstado = (cId: string, nuevoEstado: EstadoNegociacion) => {
    const updated = { ...estados, [cId]: nuevoEstado }
    setEstados(updated)
    try {
      localStorage.setItem(`ss_pipeline_${jugadorActual.id}`, JSON.stringify(updated))
    } catch (e) {}
  }

  // Buscar jugadores de la misma posición que NO estén en "miClub"
  const candidatos = todosJugadores
    .filter(j => j.posicion === jugadorActual.posicion && j.club_id !== miClubId)
    .sort((a, b) => (b.score_global ?? 0) - (a.score_global ?? 0))
    .slice(0, 6) // Top 6

  return (
    <div className="space-y-6">
      {/* Cabecera del Perfil a Relevar */}
      <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 flex flex-col sm:flex-row items-center gap-6">
        <div className="flex-1">
          <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Titular a Relevar</p>
          <h3 className="text-xl font-bold text-slate-100">{jugadorActual.nombre} {jugadorActual.apellidos}</h3>
          <p className="text-xs text-emerald-400 font-medium">{jugadorActual.posicion} - {POSICION_LABELS[jugadorActual.posicion]} • Score {jugadorActual.score_global}</p>
        </div>
        <ArrowRight className="w-6 h-6 text-slate-600 hidden sm:block" />
        <div className="flex-1 text-left sm:text-right">
          <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Modelo de Ajuste</p>
          <p className="text-sm font-bold text-slate-200">{activeModelName}</p>
          <p className="text-[11px] text-slate-500">Ordenados por compatibilidad táctica</p>
        </div>
      </div>

      <div>
        <h4 className="text-xs font-bold text-slate-300 mb-3 flex items-center justify-between uppercase tracking-wider">
          <span className="flex items-center gap-2">
            <Search className="w-4 h-4 text-emerald-400" /> 
            Top Candidatos Compatibles de Mercado
          </span>
          <span className="text-[10px] font-normal text-slate-400">
            Pipeline de Fichajes
          </span>
        </h4>
        
        {candidatos.length === 0 ? (
          <div className="p-8 text-center text-slate-500 bg-slate-900/50 rounded-xl border border-dashed border-slate-800 text-xs">
            No se han encontrado jugadores de scouting en esa posición.
          </div>
        ) : (
          <div className="space-y-3">
            {candidatos.map((c, i) => {
              const estado = estados[c.id] || 'Ojeado'
              const edad = calcularEdad(c.fecha_nacimiento)
              const scoreActual = jugadorActual.score_global || 70
              const scoreCandidato = c.score_global || 70
              const delta = Math.round((scoreCandidato - scoreActual) * 10) / 10

              return (
                <div key={c.id} className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:border-emerald-500/50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-400 text-xs shrink-0">
                      #{i + 1}
                    </div>
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-800 border border-slate-700 shrink-0">
                      {c.foto_url ? (
                        <img src={c.foto_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center font-bold text-slate-400 text-xs">
                          {c.nombre[0]}{c.apellidos[0]}
                        </div>
                      )}
                    </div>
                    <div className="truncate">
                      <h5 className="font-bold text-slate-100 truncate text-sm">{c.nombre} {c.apellidos}</h5>
                      <p className="text-xs text-slate-400 truncate">{c.club?.nombre} • {edad ? `${edad} años` : '—'}</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-between md:justify-end">
                    {/* Selector de Estado de Negociación */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-slate-400 hidden sm:inline">Estado:</span>
                      <select
                        value={estado}
                        onChange={(e) => cambiarEstado(c.id, e.target.value as EstadoNegociacion)}
                        className={`text-[11px] font-bold px-2 py-1 rounded-lg border focus:outline-none transition-colors ${
                          estado === 'Oferta Enviada'
                            ? 'bg-purple-950/80 text-purple-300 border-purple-500/40'
                            : estado === 'En Contacto'
                            ? 'bg-amber-950/80 text-amber-300 border-amber-500/40'
                            : estado === 'Descartado'
                            ? 'bg-red-950/80 text-red-300 border-red-500/40'
                            : 'bg-slate-800 text-slate-300 border-slate-700'
                        }`}
                      >
                        <option value="Ojeado">🔍 Ojeado</option>
                        <option value="En Contacto">📞 En Contacto</option>
                        <option value="Oferta Enviada">📨 Oferta Enviada</option>
                        <option value="Descartado">❌ Descartado</option>
                      </select>
                    </div>

                    {/* Fit Score Badge */}
                    <div className="text-right px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 shrink-0">
                      <p className="text-[9px] text-emerald-500 uppercase font-bold">Fit Score</p>
                      <p className="text-base font-black text-emerald-400 font-mono">
                        {c.score_global ?? '—'}
                        <span className={`text-[10px] ml-1 font-normal ${delta >= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                          ({delta >= 0 ? `+${delta}` : delta})
                        </span>
                      </p>
                    </div>

                    {/* Botón Comparar H2H */}
                    <Button
                      variant="primary"
                      size="sm"
                      icon={<Swords className="w-3.5 h-3.5 text-slate-900" />}
                      onClick={() => onOpenH2H(c)}
                      className="text-xs"
                    >
                      Cara a Cara
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
