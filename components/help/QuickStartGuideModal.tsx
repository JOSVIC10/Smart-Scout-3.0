'use client'

import React, { useState } from 'react'
import {
  Users,
  Video,
  Sliders,
  Award,
  GitCompare,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  X,
  Lightbulb,
  Sparkles,
  BookOpen,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import type { SectionId } from '@/components/layout/Sidebar'

interface QuickStartGuideModalProps {
  isOpen: boolean
  onClose: () => void
  onNavigateSection?: (section: SectionId) => void
}

interface StepData {
  id: number
  title: string
  subtitle: string
  icon: React.ComponentType<{ className?: string }>
  iconColor: string
  badgeText: string
  content: string[]
  directorTip: string
  actionLabel: string
  actionSection: SectionId
}

const STEPS: StepData[] = [
  {
    id: 1,
    title: '1. Directorio y Cartera de Jugadores',
    subtitle: 'Identifica y filtra talento en Segunda y Tercera RFEF',
    icon: Users,
    iconColor: 'from-emerald-500 to-teal-600',
    badgeText: 'Paso 1: Detección',
    content: [
      'Explora fichas completas de futbolistas clasificados por posición natural, club actual y categoría.',
      'Filtra por oportunidades de mercado: jugadores cuyo contrato finaliza en la temporada actual para fichajes sin coste de traspaso.',
      'Añade nuevos perfiles manualmente o importa datos externos en segundos con el botón de creación rápida.',
    ],
    directorTip: 'Usa el filtro "Oportunidades de Contrato" al planificar la próxima temporada para detectar fichajes a coste cero.',
    actionLabel: 'Explorar Directorio',
    actionSection: 'jugadores',
  },
  {
    id: 2,
    title: '2. Análisis de Vídeo y Registro de Acciones',
    subtitle: 'Observa partidos y registra intervenciones tácticas con un solo toque',
    icon: Video,
    iconColor: 'from-blue-500 to-cyan-600',
    badgeText: 'Paso 2: Observación',
    content: [
      'Reproduce partidos grabados en formato MP4 o mediante enlaces directos a plataformas de vídeo.',
      'Etiqueta al instante las 25 acciones atómicas del juego (pases progresivos, duelos ganados, recuperaciones, disparos) sin manejar fórmulas.',
      'Los eventos se computan automáticamente sobre la puntuación del jugador para actualizar su rendimiento.',
    ],
    directorTip: 'Durante el partido, pulsa la barra espaciadora para pausar el vídeo y selecciona la acción en la botonera de la derecha.',
    actionLabel: 'Ir al Análisis de Vídeo',
    actionSection: 'video',
  },
  {
    id: 3,
    title: '3. Modelo de Juego de tu Club',
    subtitle: 'Define la identidad táctica y las prioridades de cada puesto',
    icon: Sliders,
    iconColor: 'from-violet-500 to-purple-600',
    badgeText: 'Paso 3: Identidad',
    content: [
      'Elige entre modelos predefinidos adaptados a la categoría: "Posesión (4-3-3)", "Contraataque (4-4-2)", o "Bloque Bajo".',
      'Configura la importancia de cada faceta (progresión, juego asociativo, solidez defensiva) para que el algoritmo valore más lo que pide tu cuerpo técnico.',
      'Todos los futbolistas de la base de datos se recalculan en tiempo real según el modelo activo que elijas.',
    ],
    directorTip: 'Si tu equipo juega al contragolpe, prioriza la "Progresión" y "Amenaza" en extremos y puntas para ver quién encaja mejor.',
    actionLabel: 'Configurar Modelos',
    actionSection: 'modelos',
  },
  {
    id: 4,
    title: '4. Ficha Técnica y Scoring Multicriterio',
    subtitle: 'Comprende el índice 0–100 y exporta informes ejecutivos para la junta directiva',
    icon: Award,
    iconColor: 'from-amber-500 to-orange-600',
    badgeText: 'Paso 4: Valoración',
    content: [
      'Puntuación global del 0 al 100: una nota intuitiva que resume la adecuación del futbolista al modelo de juego activo.',
      'Radar táctico de 12 métricas compuestas: visualiza en qué percentil se sitúa respecto al resto de jugadores de la categoría.',
      'Genera y descarga el "Informe Ejecutivo": un documento en PDF listo para presentar al presidente o comisión deportiva.',
    ],
    directorTip: 'Los jugadores con puntuación superior a 75 son perfiles de alta compatibilidad recomendados como objetivos prioritarios.',
    actionLabel: 'Ver Fichas en Directorio',
    actionSection: 'jugadores',
  },
  {
    id: 5,
    title: '5. Comparador y Pizarra Táctica (Campograma)',
    subtitle: 'Toma la decisión final enfrentando opciones cara a cara',
    icon: GitCompare,
    iconColor: 'from-rose-500 to-pink-600',
    badgeText: 'Paso 5: Decisión',
    content: [
      'Compara 2 o 3 futbolistas simultáneamente con gráficos superpuestos y balance métrica por métrica.',
      'Coloca a los candidatos sobre el Campograma interactivo para comprobar el equilibrio del once inicial antes de cerrar una incorporación.',
      'Evalúa puntos fuertes y áreas de mejora para tener argumentos sólidos en las negociaciones de fichajes.',
    ],
    directorTip: 'Usa el Comparador cuando dudes entre dos futbolistas para una misma posición: el radar superpuesto despeja cualquier duda.',
    actionLabel: 'Abrir Comparador Táctico',
    actionSection: 'comparador',
  },
]

export function QuickStartGuideModal({
  isOpen,
  onClose,
  onNavigateSection,
}: QuickStartGuideModalProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0)

  if (!isOpen) return null

  const step = STEPS[currentStepIndex]
  const Icon = step.icon
  const isLast = currentStepIndex === STEPS.length - 1
  const isFirst = currentStepIndex === 0

  const handleNext = () => {
    if (!isLast) {
      setCurrentStepIndex((prev) => prev + 1)
    } else {
      onClose()
    }
  }

  const handlePrev = () => {
    if (!isFirst) {
      setCurrentStepIndex((prev) => prev - 1)
    }
  }

  const handleAction = () => {
    if (onNavigateSection) {
      onNavigateSection(step.actionSection)
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Container */}
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden z-10 flex flex-col transition-all">
        {/* Top Gradient Bar */}
        <div className="h-2 w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-blue-500" />

        {/* Header */}
        <div className="p-6 pb-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  Guía de Inicio Rápido
                </h2>
                <Badge variant="primary" size="sm">
                  {step.badgeText}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Flujo de trabajo para la toma de decisiones en Dirección Deportiva
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Cerrar guía"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Content */}
        <div className="p-6 sm:p-8 space-y-6 overflow-y-auto max-h-[70vh]">
          {/* Step Title Header */}
          <div className="flex items-start gap-4">
            <div
              className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${step.iconColor} flex items-center justify-center text-white shadow-lg shrink-0`}
            >
              <Icon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
                {step.title}
              </h3>
              <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400 mt-0.5">
                {step.subtitle}
              </p>
            </div>
          </div>

          {/* Key Bullet Points */}
          <div className="space-y-3 bg-slate-50 dark:bg-slate-950/60 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800">
            {step.content.map((point, i) => (
              <div key={i} className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{point}</p>
              </div>
            ))}
          </div>

          {/* Director Deportivo Tip Callout */}
          <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-500/30 flex items-start gap-3">
            <div className="p-1 rounded-md bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5">
              <Lightbulb className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wide">
                Consejo Práctico
              </p>
              <p className="text-xs text-amber-800 dark:text-amber-200/90 mt-0.5 leading-relaxed">
                {step.directorTip}
              </p>
            </div>
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-4">
          {/* Progress Indicators */}
          <div className="flex items-center gap-2">
            {STEPS.map((s, idx) => (
              <button
                key={s.id}
                onClick={() => setCurrentStepIndex(idx)}
                className={`h-2.5 rounded-full transition-all duration-200 ${
                  idx === currentStepIndex
                    ? 'w-7 bg-emerald-600 dark:bg-emerald-500'
                    : 'w-2.5 bg-slate-300 dark:bg-slate-700 hover:bg-slate-400 dark:hover:bg-slate-600'
                }`}
                title={`Ir al paso ${s.id}`}
                aria-label={`Paso ${s.id}`}
              />
            ))}
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 ml-2">
              Paso {currentStepIndex + 1} de {STEPS.length}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleAction}
              className="text-xs"
            >
              {step.actionLabel}
            </Button>

            {!isFirst && (
              <Button
                variant="secondary"
                size="sm"
                icon={<ArrowLeft className="w-3.5 h-3.5" />}
                onClick={handlePrev}
              >
                Anterior
              </Button>
            )}

            <Button
              variant="primary"
              size="sm"
              icon={isLast ? undefined : <ArrowRight className="w-3.5 h-3.5" />}
              onClick={handleNext}
            >
              {isLast ? 'Entendido, cerrar' : 'Siguiente'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
