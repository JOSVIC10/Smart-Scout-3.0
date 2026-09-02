'use client'

import React, { useState, useEffect } from 'react'
import { Briefcase, AlertTriangle, Search, Target, Users, ArrowRight, X } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { obtenerJugadores } from '@/lib/supabase/jugadores'
import { obtenerClubes } from '@/lib/supabase/clubes'
import type { JugadorConClub, Club, Posicion } from '@/types/database'
import { POSICION_LABELS, calcularEdad } from '@/lib/constants'

interface PlanificadorSectionProps {
  activeModelName: string
  activeModelId?: string
}

export function PlanificadorSection({ activeModelName, activeModelId }: PlanificadorSectionProps) {
  const [jugadores, setJugadores] = useState<JugadorConClub[]>([])
  const [clubes, setClubes] = useState<Club[]>([])
  const [loading, setLoading] = useState(true)

  const [miClubId, setMiClubId] = useState<string>('')
  const [relevoPlayer, setRelevoPlayer] = useState<JugadorConClub | null>(null)

  useEffect(() => {
    async function cargarDatos() {
      setLoading(true)
      try {
        const [jugs, clbs] = await Promise.all([obtenerJugadores(), obtenerClubes()])
        setJugadores(jugs)
        setClubes(clbs)
        if (clbs.length > 0) {
          setMiClubId(clbs[0].id)
        }
      } catch (err) {
        console.error('Error cargando planificador:', err)
      } finally {
        setLoading(false)
      }
    }
    cargarDatos()
  }, [])

  const miPlantilla = jugadores.filter(j => j.club_id === miClubId)
  
  // Agrupar por líneas
  const porteros = miPlantilla.filter(j => j.posicion === 'POR')
  const defensas = miPlantilla.filter(j => ['LAT_DER', 'LAT_IZQ', 'DFC_DER', 'DFC_IZQ', 'DFC_CEN'].includes(j.posicion))
  const medios = miPlantilla.filter(j => ['MCD', 'MC_DER', 'MC_IZQ', 'MC_CEN', 'MP'].includes(j.posicion))
  const delanteros = miPlantilla.filter(j => ['EXT_DER', 'EXT_IZQ', 'DC'].includes(j.posicion))

  const clubOptions = clubes.map(c => ({ value: c.id, label: c.nombre }))

  const getAlertas = (jugador: JugadorConClub) => {
    const alertas = []
    const edad = calcularEdad(jugador.fecha_nacimiento)
    if (edad !== null && edad >= 30) alertas.push('Edad Crítica (>30)')
    if (jugador.fin_contrato && (jugador.fin_contrato.includes('2026') || jugador.fin_contrato.includes('2027'))) {
      alertas.push('Fin de Contrato Próximo')
    }
    return alertas
  }

  const renderLinea = (titulo: string, lista: JugadorConClub[]) => (
    <div className="space-y-3">
      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">{titulo} ({lista.length})</h3>
      {lista.length === 0 ? (
        <div className="p-4 border border-dashed border-slate-800 rounded-xl text-center text-xs text-slate-500">
          Sin jugadores en esta línea
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {lista.map(j => {
            const alertas = getAlertas(j)
            const edad = calcularEdad(j.fecha_nacimiento)
            return (
              <div key={j.id} className="p-4 rounded-xl bg-slate-900 border border-slate-800 relative group hover:border-slate-700 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-bold text-slate-200">{j.nombre} {j.apellidos}</h4>
                    <p className="text-xs text-emerald-400 font-medium">{j.posicion} - {POSICION_LABELS[j.posicion]}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-slate-300">{edad} años</div>
                    <div className="text-xs text-slate-500">{j.valor_mercado || 'Valor N/D'}</div>
                  </div>
                </div>
                
                {alertas.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3 mb-3">
                    {alertas.map(a => (
                      <Badge key={a} variant="outline" className="text-[10px] bg-red-500/10 text-red-400 border-red-500/30">
                        <AlertTriangle className="w-3 h-3 mr-1 inline" /> {a}
                      </Badge>
                    ))}
                  </div>
                )}
                
                <div className="mt-4 pt-3 border-t border-slate-800 flex justify-between items-center">
                  <div className="text-[10px] text-slate-500">
                    Contrato: <span className="text-slate-300 font-medium">{j.fin_contrato || 'N/D'}</span>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-7 text-[10px] bg-slate-950 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                    onClick={() => setRelevoPlayer(j)}
                  >
                    Buscar Relevo <Target className="w-3 h-3 ml-1" />
                  </Button>
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
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-emerald-400" />
            Planificador de Plantilla
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Gestión estratégica, alertas contractuales y shadow squad para {activeModelName}
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
        <div className="text-center py-12 text-slate-500">
          Selecciona un club para ver la plantilla
        </div>
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
          />
        </Modal>
      )}
    </div>
  )
}

function ShadowSquadView({ jugadorActual, todosJugadores, miClubId, activeModelName }: { 
  jugadorActual: JugadorConClub, 
  todosJugadores: JugadorConClub[], 
  miClubId: string,
  activeModelName: string
}) {
  // Buscar jugadores de la misma posición que NO estén en "miClub"
  const candidatos = todosJugadores
    .filter(j => j.posicion === jugadorActual.posicion && j.club_id !== miClubId)
    .sort((a, b) => (b.score_global ?? 0) - (a.score_global ?? 0))
    .slice(0, 5) // Top 5

  return (
    <div className="space-y-6">
      <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 flex flex-col sm:flex-row items-center gap-6">
        <div className="flex-1">
          <p className="text-xs text-slate-400 font-bold uppercase mb-1">Perfil a Sustituir</p>
          <h3 className="text-xl font-bold text-slate-100">{jugadorActual.nombre} {jugadorActual.apellidos}</h3>
          <p className="text-sm text-emerald-400">{jugadorActual.posicion} - {POSICION_LABELS[jugadorActual.posicion]}</p>
        </div>
        <ArrowRight className="w-6 h-6 text-slate-600 hidden sm:block" />
        <div className="flex-1 text-left sm:text-right">
          <p className="text-xs text-slate-400 font-bold uppercase mb-1">Modelo de Ajuste</p>
          <p className="text-sm font-bold text-slate-200">{activeModelName}</p>
          <p className="text-xs text-slate-500">Ordenados por Fit de Score Global</p>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-bold text-slate-300 mb-3 flex items-center gap-2">
          <Search className="w-4 h-4 text-emerald-400" /> 
          Top 5 Candidatos Compatibles
        </h4>
        
        {candidatos.length === 0 ? (
          <div className="p-8 text-center text-slate-500 bg-slate-900/50 rounded-xl border border-dashed border-slate-800">
            No se han encontrado jugadores scouted en esa posición fuera de tu club.
          </div>
        ) : (
          <div className="space-y-3">
            {candidatos.map((c, i) => (
              <div key={c.id} className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:border-emerald-500/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center font-bold text-slate-400">
                    #{i + 1}
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-100">{c.nombre} {c.apellidos}</h5>
                    <p className="text-xs text-slate-400">{c.club?.nombre} • {calcularEdad(c.fecha_nacimiento)} años</p>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-4 items-center">
                  <div className="text-right">
                    <p className="text-[10px] text-slate-500 uppercase">Valor</p>
                    <p className="text-sm font-bold text-slate-300">{c.valor_mercado || 'N/D'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-slate-500 uppercase">Fin Contrato</p>
                    <p className="text-sm font-bold text-slate-300">{c.fin_contrato || 'N/D'}</p>
                  </div>
                  <div className="text-right px-4 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                    <p className="text-[10px] text-emerald-500 uppercase font-bold">Fit Score</p>
                    <p className="text-lg font-bold text-emerald-400">{c.score_global ?? '—'}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
