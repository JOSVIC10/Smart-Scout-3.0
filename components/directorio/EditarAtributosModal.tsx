'use client'

import React, { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { supabase } from '@/lib/supabase/client'
import type { JugadorConClub, Posicion, PiePreferido, Valoracion, MetricaN2Enriquecida } from '@/types/database'
import { Loader2 } from 'lucide-react'

interface EditarAtributosFormProps {
  onCancel: () => void
  jugador: JugadorConClub
  valoracionActual?: Valoracion
  metricas: MetricaN2Enriquecida[]
  onSave: (metricasEditadas: Record<string, number>, jugadorActualizado: Partial<JugadorConClub>) => void
}

export function EditarAtributosForm({ onCancel, jugador, valoracionActual, metricas, onSave }: EditarAtributosFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [nombre, setNombre] = useState(jugador.nombre || '')
  const [apellidos, setApellidos] = useState(jugador.apellidos || '')
  const [fechaNacimiento, setFechaNacimiento] = useState(jugador.fecha_nacimiento || '')
  const [nacionalidad, setNacionalidad] = useState(jugador.nacionalidad || '')
  const [altura, setAltura] = useState(jugador.altura_cm?.toString() || '')
  const [dorsal, setDorsal] = useState(jugador.dorsal?.toString() || '')
  const [pie, setPie] = useState<PiePreferido>(jugador.pie_preferido)
  const [posicion, setPosicion] = useState<Posicion>(jugador.posicion)
  const [scoreGlobal, setScoreGlobal] = useState(jugador.score_global?.toString() || '')
  
  // Extra fields
  const [valorMercado, setValorMercado] = useState(jugador.valor_mercado || '')
  const [finContrato, setFinContrato] = useState(jugador.fin_contrato || '')
  const [estiloJuego, setEstiloJuego] = useState(jugador.estilo_juego || '')
  
  // Season Stats
  const [estPartidos, setEstPartidos] = useState(jugador.est_partidos?.toString() || '')
  const [estMinutos, setEstMinutos] = useState(jugador.est_minutos?.toString() || '')
  const [estGoles, setEstGoles] = useState(jugador.est_goles?.toString() || '')
  const [estAsistencias, setEstAsistencias] = useState(jugador.est_asistencias?.toString() || '')
  const [estAmarillas, setEstAmarillas] = useState(jugador.est_amarillas?.toString() || '')
  const [estRojas, setEstRojas] = useState(jugador.est_rojas?.toString() || '')
  
  const [puntosFuertes, setPuntosFuertes] = useState(valoracionActual?.aspectos_positivos?.join(', ') || '')
  const [puntosDebiles, setPuntosDebiles] = useState(valoracionActual?.aspectos_mejora?.join(', ') || '')
  const [caracter, setCaracter] = useState(valoracionActual?.notas || '')

  // Estado para las métricas (radar)
  const [metricasEdit, setMetricasEdit] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {}
    metricas.forEach(m => { initial[m.codigo] = m.percentil })
    return initial
  })

  const handleMetricaChange = (codigo: string, value: string) => {
    setMetricasEdit(prev => ({ ...prev, [codigo]: value ? parseInt(value, 10) : 0 }))
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // 1. Actualizar Jugador
      const updatesJugador = {
        nombre,
        apellidos,
        fecha_nacimiento: fechaNacimiento || null,
        nacionalidad,
        altura_cm: altura ? parseInt(altura, 10) : null,
        dorsal: dorsal ? parseInt(dorsal, 10) : null,
        pie_preferido: pie,
        posicion: posicion,
        score_global: scoreGlobal ? parseFloat(scoreGlobal) : null,
        valor_mercado: valorMercado || null,
        fin_contrato: finContrato || null,
        estilo_juego: estiloJuego || null,
        est_partidos: estPartidos ? parseInt(estPartidos, 10) : null,
        est_minutos: estMinutos ? parseInt(estMinutos, 10) : null,
        est_goles: estGoles ? parseInt(estGoles, 10) : null,
        est_asistencias: estAsistencias ? parseInt(estAsistencias, 10) : null,
        est_amarillas: estAmarillas ? parseInt(estAmarillas, 10) : null,
        est_rojas: estRojas ? parseInt(estRojas, 10) : null,
      }

      const { error: errJugador } = await supabase
        .from('jugadores')
        .update(updatesJugador)
        .eq('id', jugador.id)

      if (errJugador) throw errJugador

      // 2. Actualizar Valoración (o crear una nueva)
      const updatesValoracion = {
        jugador_id: jugador.id,
        aspectos_positivos: puntosFuertes ? puntosFuertes.split(',').map(s => s.trim()) : [],
        aspectos_mejora: puntosDebiles ? puntosDebiles.split(',').map(s => s.trim()) : [],
        notas: caracter,
      }

      if (valoracionActual?.id) {
        const { error: errVal } = await supabase
          .from('valoraciones')
          .update(updatesValoracion)
          .eq('id', valoracionActual.id)
        if (errVal) throw errVal
      } else {
        const { error: errVal } = await supabase
          .from('valoraciones')
          .insert(updatesValoracion)
        if (errVal) throw errVal
      }

      // 3. Actualizar Métricas N2
      for (const [codigo, nuevoPercentil] of Object.entries(metricasEdit)) {
        const mOriginal = metricas.find(m => m.codigo === codigo)
        if (mOriginal && mOriginal.percentil !== nuevoPercentil) {
          // Obtener el ID de la métrica
          const { data: n2Data } = await supabase.from('metricas_nivel2').select('id').eq('codigo', codigo).single()
          if (n2Data) {
            await supabase
              .from('jugador_metricas_n2')
              .update({ percentil: nuevoPercentil })
              .eq('jugador_id', jugador.id)
              .eq('metrica_n2_id', n2Data.id)
          }
        }
      }

      onSave(metricasEdit, updatesJugador)
    } catch (err: any) {
      // Usamos console.warn en lugar de error para que Next.js no saque el popup de error gigante
      console.warn('Detalles del error:', err)
      const msg = (err && err.message) ? err.message : JSON.stringify(err)
      const details = (err && err.details) ? ` - ${err.details}` : ''
      setError(`Error: ${msg}${details} (Code: ${err?.code})`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 p-2 transition-colors">
      <div className="mb-6 border-b border-slate-200 dark:border-slate-800 pb-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Editar Atributos — {jugador.nombre} {jugador.apellidos}</h2>
      </div>
      <form onSubmit={handleSave} className="space-y-6">
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Col 1: Datos Básicos */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-emerald-700 dark:text-emerald-400 uppercase border-b border-slate-200 dark:border-slate-800 pb-2">Datos Básicos</h3>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-400 mb-1">Nombre</label>
              <Input value={nombre} onChange={e => setNombre(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-400 mb-1">Apellidos</label>
              <Input value={apellidos} onChange={e => setApellidos(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-400 mb-1">Fecha Nacimiento</label>
              <Input type="date" value={fechaNacimiento} onChange={e => setFechaNacimiento(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-400 mb-1">Nacionalidad</label>
              <Input value={nacionalidad} onChange={e => setNacionalidad(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-400 mb-1">Altura (cm)</label>
                <Input type="number" value={altura} onChange={e => setAltura(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-400 mb-1">Dorsal</label>
                <Input type="number" value={dorsal} onChange={e => setDorsal(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-400 mb-1">Pie Preferido</label>
              <Select 
                value={pie} 
                onChange={e => setPie(e.target.value as PiePreferido)}
                options={[
                  { value: 'derecho', label: 'Diestro' },
                  { value: 'izquierdo', label: 'Zurdo' },
                  { value: 'ambos', label: 'Ambidiestro' }
                ]}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-400 mb-1">Posición Principal</label>
              <Select 
                value={posicion} 
                onChange={e => setPosicion(e.target.value as Posicion)}
                options={['POR', 'DFC', 'LAT', 'MCD', 'MC', 'EXT', 'DC'].map(p => ({ value: p, label: p }))}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-400 mb-1">Score Global Manual (Sobrescribir)</label>
              <Input type="number" step="0.01" value={scoreGlobal} onChange={e => setScoreGlobal(e.target.value)} placeholder="Ej: 85.50" />
            </div>
          </div>

          {/* Col 2: Extras y Perfil */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-emerald-700 dark:text-emerald-400 uppercase border-b border-slate-200 dark:border-slate-800 pb-2">Perfil & Contrato</h3>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-400 mb-1">Valor de Mercado</label>
              <Input value={valorMercado} onChange={e => setValorMercado(e.target.value)} placeholder="Ej: 150.000 €" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-400 mb-1">Fin de Contrato</label>
              <Input value={finContrato} onChange={e => setFinContrato(e.target.value)} placeholder="Ej: 30 JUN 2027" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-400 mb-1">Estilo de Juego</label>
              <Input value={estiloJuego} onChange={e => setEstiloJuego(e.target.value)} placeholder="Ej: Rápido, Profundo..." />
            </div>
            
            <h3 className="text-sm font-bold text-emerald-700 dark:text-emerald-400 uppercase border-b border-slate-200 dark:border-slate-800 pb-2 mt-6 pt-6">Valoraciones del Scout</h3>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-400 mb-1">Puntos Fuertes (separados por coma)</label>
              <Input value={puntosFuertes} onChange={e => setPuntosFuertes(e.target.value)} placeholder="Velocidad, Regate, Tiro..." />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-400 mb-1">Aspectos a Mejorar (separados por coma)</label>
              <Input value={puntosDebiles} onChange={e => setPuntosDebiles(e.target.value)} placeholder="Juego aéreo, Pierna mala..." />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-400 mb-1">Carácter / Notas</label>
              <Input value={caracter} onChange={e => setCaracter(e.target.value)} placeholder="Trabajador, Líder, Adaptable..." />
            </div>
          </div>

          {/* Col 3: Estadísticas Manuales de Temporada */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-emerald-700 dark:text-emerald-400 uppercase border-b border-slate-200 dark:border-slate-800 pb-2">Estadísticas Temp. 2026</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-400 mb-1">Partidos (PJ)</label>
                <Input type="number" value={estPartidos} onChange={e => setEstPartidos(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-400 mb-1">Minutos (MIN)</label>
                <Input type="number" value={estMinutos} onChange={e => setEstMinutos(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-400 mb-1">Goles</label>
                <Input type="number" value={estGoles} onChange={e => setEstGoles(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-400 mb-1">Asistencias</label>
                <Input type="number" value={estAsistencias} onChange={e => setEstAsistencias(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-400 mb-1">T. Amarillas</label>
                <Input type="number" value={estAmarillas} onChange={e => setEstAmarillas(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-400 mb-1">T. Rojas</label>
                <Input type="number" value={estRojas} onChange={e => setEstRojas(e.target.value)} />
              </div>
            </div>
          </div>
        </div>

        {metricas.length > 0 && (
          <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-bold text-emerald-700 dark:text-emerald-400 uppercase border-b border-slate-200 dark:border-slate-800 pb-2">Atributos del Radar (0-100)</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {metricas.map(m => (
                <div key={m.codigo}>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-400 mb-1 truncate" title={m.nombre}>{m.nombre}</label>
                  <Input 
                    type="number" 
                    min="0" 
                    max="100" 
                    value={metricasEdit[m.codigo] ?? ''} 
                    onChange={e => handleMetricaChange(m.codigo, e.target.value)} 
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
          {error && (
            <div className="p-3 bg-red-500/10 text-red-400 border border-red-500/20 rounded text-sm mb-2">
              {error}
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onCancel} type="button">Cancelar</Button>
            <Button variant="primary" type="submit" disabled={loading} className="bg-emerald-600">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Guardar Cambios'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
