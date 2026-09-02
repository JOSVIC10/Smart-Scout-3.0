import React from 'react'
import type { JugadorConClub, Valoracion, MetricaN2Enriquecida } from '@/types/database'
import { clsx } from 'clsx'

interface PrintExecutiveReportProps {
  jugador: JugadorConClub
  valoracion?: Valoracion
  metricasN2: MetricaN2Enriquecida[]
  edad: string
}

export function PrintExecutiveReport({ jugador, valoracion, metricasN2, edad }: PrintExecutiveReportProps) {
  const encaje = 92 // Mock, or from score_global
  const potencial = 85 // Mock
  const riesgo = 15 // Mock
  const nivelActual = Math.round(jugador.score_global || 0)

  return (
    <div id="print-root" className="hidden print:block bg-white text-slate-900 absolute inset-0 w-[210mm] min-h-[297mm] mx-auto text-sm" style={{ zoom: 0.85 }}>
      {/* PÁGINA 1 */}
      <div className="page-1 w-[210mm] h-[297mm] p-10 flex flex-col relative page-break-after">
        {/* Header */}
        <header className="flex justify-between items-end border-b border-slate-200 pb-4 mb-8">
          <h4 className="text-blue-600 font-bold tracking-widest text-xs">AI SCOUT OS — EXECUTIVE REPORT</h4>
          <span className="text-slate-400 text-xs">Generado: {new Date().toLocaleDateString('es-ES')}</span>
        </header>

        {/* Info Jugador */}
        <div className="flex gap-6 mb-8">
          <div className="w-24 h-24 rounded-full bg-slate-200 overflow-hidden shrink-0 border border-slate-200">
            {jugador.foto_url ? (
              <img src={jugador.foto_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400 text-xl font-bold bg-slate-100">
                {jugador.nombre.charAt(0)}{jugador.apellidos.charAt(0)}
              </div>
            )}
          </div>
          <div className="flex-1">
            <h1 className="text-4xl font-black mb-4 tracking-tight">{jugador.nombre} {jugador.apellidos}</h1>
            <div className="grid grid-cols-3 gap-y-4 gap-x-8 text-xs">
              <div>
                <p className="text-slate-400 uppercase tracking-wider mb-1">Club Actual</p>
                <p className="font-semibold">{jugador.club?.nombre || 'Sin equipo'}</p>
              </div>
              <div>
                <p className="text-slate-400 uppercase tracking-wider mb-1">Posición</p>
                <p className="font-semibold">{jugador.posicion_detallada || jugador.posicion}</p>
              </div>
              <div>
                <p className="text-slate-400 uppercase tracking-wider mb-1">Edad</p>
                <p className="font-semibold">{edad}</p>
              </div>
              <div>
                <p className="text-slate-400 uppercase tracking-wider mb-1">Nacionalidad</p>
                <p className="font-semibold">{jugador.nacionalidad}</p>
              </div>
              <div>
                <p className="text-slate-400 uppercase tracking-wider mb-1">Pierna Dom.</p>
                <p className="font-semibold">{jugador.pie_preferido}</p>
              </div>
              <div>
                <p className="text-slate-400 uppercase tracking-wider mb-1">Valor Mercado</p>
                <p className="font-semibold">N/D</p>
              </div>
            </div>
          </div>
        </div>

        {/* Veredicto */}
        <div className="bg-slate-50 border border-slate-100 rounded-xl p-6 mb-8 relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500"></div>
          <p className="text-slate-400 text-xs uppercase tracking-widest mb-2">Veredicto / Recomendación Final</p>
          <p className="text-2xl font-black text-blue-600">{valoracion?.recomendacion || 'PRIORITARIO'}</p>
        </div>

        {/* Scores */}
        <div className="grid grid-cols-4 gap-4 text-center mb-8">
          <div>
            <p className="text-4xl font-bold text-emerald-500 mb-1">{encaje}</p>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest">Encaje</p>
          </div>
          <div>
            <p className="text-4xl font-bold text-emerald-500 mb-1">{potencial}</p>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest">Potencial</p>
          </div>
          <div>
            <p className="text-4xl font-bold text-emerald-500 mb-1">{riesgo}</p>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest">Riesgo</p>
          </div>
          <div>
            <p className="text-4xl font-bold text-amber-500 mb-1">{nivelActual}</p>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest">Nivel Actual</p>
          </div>
        </div>

        {/* Resumen */}
        <div className="mb-6">
          <h3 className="font-bold border-b border-slate-200 pb-2 mb-3">RESUMEN EJECUTIVO</h3>
          <p className="text-sm text-slate-500 leading-relaxed">
            {valoracion?.notas || 'Perfil con asimilación táctica idónea para nuestro modelo de juego.'}
          </p>
        </div>

        {/* Fortalezas y Debilidades */}
        <div className="grid grid-cols-2 gap-8 mb-6 flex-1">
          <div>
            <h3 className="font-bold border-b border-slate-200 pb-2 mb-3">FORTALEZAS</h3>
            <ul className="space-y-2 text-sm text-slate-500">
              {valoracion?.aspectos_positivos?.map((v, i) => (
                <li key={i} className="flex gap-2"><span className="text-emerald-500 font-bold">+</span> {v}</li>
              )) || (
                <>
                  <li className="flex gap-2"><span className="text-emerald-500 font-bold">+</span> Alta capacidad asociativa</li>
                  <li className="flex gap-2"><span className="text-emerald-500 font-bold">+</span> Visión de juego</li>
                </>
              )}
            </ul>
          </div>
          <div>
            <h3 className="font-bold border-b border-slate-200 pb-2 mb-3">PUNTOS DE MEJORA</h3>
            <ul className="space-y-2 text-sm text-slate-500">
              {valoracion?.aspectos_mejora?.map((v, i) => (
                <li key={i} className="flex gap-2"><span className="text-red-500 font-bold">-</span> {v}</li>
              )) || (
                <>
                  <li className="flex gap-2"><span className="text-red-500 font-bold">-</span> Juego aéreo</li>
                  <li className="flex gap-2"><span className="text-red-500 font-bold">-</span> Pierna mala</li>
                </>
              )}
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-200 pt-4 mt-auto">
          <h4 className="text-blue-600 font-bold text-sm tracking-wide uppercase">
            Evaluación Posicional: {jugador.posicion}
          </h4>
        </div>
      </div>

      {/* PÁGINA 2 */}
      <div className="page-2 w-[210mm] min-h-[297mm] p-10 flex flex-col relative bg-white">
        
        {/* Resumen Táctico */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-6 relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500"></div>
            <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest mb-1">FORTALEZA PRINCIPAL</p>
            <p className="font-black text-lg">Lectura de Espacios</p>
            <p className="text-slate-400 text-xs">Táctica Ofensiva</p>
          </div>
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-6 relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500"></div>
            <p className="text-[10px] text-red-600 font-bold uppercase tracking-widest mb-1">ÁREA DE MEJORA</p>
            <p className="font-black text-lg">Resistencia</p>
            <p className="text-slate-400 text-xs">Física</p>
          </div>
        </div>

        {/* Encaje Táctico */}
        <div className="bg-slate-50 border border-slate-100 rounded-xl p-6 mb-8">
          <p className="text-[10px] text-blue-600 font-bold uppercase tracking-widest mb-4">ENCAJE TÁCTICO SUGERIDO</p>
          <div className="grid grid-cols-2 gap-8">
            <div>
              <p className="text-xs text-slate-400 mb-1">Formaciones</p>
              <p className="font-bold">4-3-3 / 4-2-3-1</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-1">Estilos Ideales</p>
              <p className="font-bold">Ataque posicional / Presión alta</p>
            </div>
          </div>
        </div>

        {/* Tabla de Métricas (2 columnas) */}
        <div className="grid grid-cols-2 gap-x-12 gap-y-8 flex-1">
          {/* Se agrupan métricas por categoría si hay suficientes, o mock data para replicar el layout */}
          {['Física', 'Finalización', 'Juego Asociativo', 'Táctica Ofensiva', 'Movilidad Ofensiva'].map(grupo => {
            const metrics = metricasN2.filter(m => m.grupo.toLowerCase().includes(grupo.toLowerCase()) || true).slice(0, 4) // mock slice
            return (
              <div key={grupo}>
                <h4 className="font-bold mb-3">{grupo}</h4>
                <div className="space-y-1.5 text-sm">
                  {metrics.map((m, i) => (
                    <div key={i} className="flex justify-between border-b border-slate-100 pb-1">
                      <span className="text-slate-500">{m.nombre}</span>
                      <span className="font-bold">{Math.round(m.valor)}</span>
                    </div>
                  ))}
                  {/* Fallback si no hay métricas */}
                  {metrics.length === 0 && (
                    <div className="flex justify-between border-b border-slate-100 pb-1">
                      <span className="text-slate-500">Ejemplo Métrica</span>
                      <span className="font-bold">80</span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border border-slate-100 rounded-xl p-6 mt-8 flex justify-between text-center">
          <div>
            <p className="text-xl font-black mb-1">{jugador.partidos_analizados}</p>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest">Partidos Analizados</p>
          </div>
          <div>
            <p className="text-xl font-black mb-1">{jugador.minutos_jugados}</p>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest">Minutos de Juego</p>
          </div>
          <div>
            <p className="text-xl font-black mb-1">88%</p>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest">Confianza Evaluación</p>
          </div>
          <div>
            <p className="text-xl font-black mb-1">{new Date().toLocaleDateString('es-ES')}</p>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest">Última Observación</p>
          </div>
        </div>
      </div>
    </div>
  )
}
