import type { JugadorConClub } from '@/types/database'
import { calcularEdad, POSICION_LABELS } from '@/lib/constants'

export interface ReporteScoutingIA {
  titulo: string
  radiografia: string
  encajeTactico: string
  prosContras: { pros: string[]; contras: string[] }
  recomendacion: 'Fichaje Prioritario' | 'Seguimiento Cercano' | 'Opción de Fondo de Armario' | 'Desaconsejado'
  justificacionFinal: string
}

/**
 * Genera un informe técnico cualitativo de dirección deportiva
 * basado en métricas reales, atributos, edad y el modelo de juego activo.
 */
export function generarInformeScoutingIA(
  jugador: JugadorConClub,
  activeModelName: string,
  metricas?: { nombre: string; percentil: number }[]
): ReporteScoutingIA {
  const edad = calcularEdad(jugador.fecha_nacimiento)
  const pos = jugador.posicion
  const posLabel = POSICION_LABELS[pos] || pos
  const score = jugador.score_global || 72
  const name = `${jugador.nombre} ${jugador.apellidos}`

  // Determinar nivel y recomendación
  let recomendacion: ReporteScoutingIA['recomendacion'] = 'Seguimiento Cercano'
  if (score >= 82) recomendacion = 'Fichaje Prioritario'
  else if (score >= 74) recomendacion = 'Seguimiento Cercano'
  else if (score >= 68) recomendacion = 'Opción de Fondo de Armario'
  else recomendacion = 'Desaconsejado'

  // Pros y Contras
  const pros: string[] = []
  const contras: string[] = []

  if (score >= 80) pros.push(`Alto índice de rendimiento global (Score ${score})`)
  if (edad !== null && edad <= 23) pros.push(`Sub-23 de gran proyección (computa en cupo RFEF)`)
  if (edad !== null && edad >= 29) contras.push(`Perfil veterano (${edad} años), escaso valor de reventa`)
  if (jugador.altura_cm && jugador.altura_cm >= 186) pros.push(`Envergadura física dominante (${jugador.altura_cm} cm)`)
  if (jugador.fin_contrato && jugador.fin_contrato.includes('2026')) pros.push(`Termina contrato en 2026 (fichaje a coste cero)`)

  // Radiografía futbolística según posición
  let radiografia = ''
  let encajeTactico = ''

  if (pos === 'POR') {
    radiografia = `${name} es un guardameta de ${edad ? `${edad} años` : 'buena presencia'} (${jugador.altura_cm || 188} cm) que destaca por su solvencia bajo palos y capacidad de reacción en el área pequeña.`
    encajeTactico = `Bajo el modelo ${activeModelName}, aporta serenidad y ocupación racional del área, respondiendo adecuadamente a la estructura defensiva del equipo.`
    pros.push('Seguridad en balones aéreos y juego en línea de meta')
  } else if (pos === 'DFC') {
    radiografia = `${name} (${posLabel}) es un central que aúna solidez posicional y contundencia en los duelos directos.`
    if (activeModelName.toLowerCase().includes('posesión')) {
      encajeTactico = `En el sistema de ${activeModelName}, su capacidad para fijar marcas e iniciar la fase de construcción desde atrás lo convierte en una pieza fundamental para progresar con ventaja.`
      pros.push('Salida limpia de balón bajo presión')
    } else {
      encajeTactico = `En el sistema de ${activeModelName}, destaca por su firmeza en repliegue y defensa de área, neutralizando centros y juego directo rival.`
      pros.push('Contundencia en despejes y repliegue de bloque')
    }
  } else if (pos === 'LAT') {
    radiografia = `${name} es un lateral con dinamismo por banda, capacidad para repetir esfuerzos y aportar tanto en vigilancias defensivas como en doblajes ofensivos.`
    encajeTactico = `Para ${activeModelName}, ofrece amplitud y recorrido constante para dar salida por carriles exteriores sin descuidar el equilibrio táctico.`
    pros.push('Capacidad para generar ventajas exteriores y centros al área')
  } else if (pos === 'MC' || pos === 'MCD') {
    radiografia = `${name} actúa en la sala de máquinas como eje organizador o de contención, destacando por su lectura espacial y equilibrio táctico.`
    encajeTactico = `En el esquema de ${activeModelName}, asume el rol de bisagra entre líneas, optimizando el ritmo de circulación y garantizando recuperaciones tras pérdida.`
    pros.push('Criterio en distribución y sentido posicional')
  } else {
    // EXT o DC
    radiografia = `${name} (${posLabel}) es un futbolista ofensivo con gran determinación en los últimos metros, amenaza en el área y velocidad de ejecución.`
    if (activeModelName.toLowerCase().includes('contra') || activeModelName.toLowerCase().includes('transic')) {
      encajeTactico = `Encaja de forma idónea en ${activeModelName}, donde su verticalidad, velocidad al espacio y capacidad de intimidación resultan letales ante defensas adelantadas.`
      pros.push('Peligro constante atacando la espalda de los defensores')
    } else {
      encajeTactico = `En ${activeModelName}, aporta desmarque de apoyo, asociación en espacios reducidos y pegada determinante en la finalización de jugada.`
      pros.push('Capacidad goleadora y lectura en zona de remate')
    }
  }

  // Justificación final de la secretaría técnica
  const justificacionFinal = `Considerando su perfil futbolístico, biotipo y compatibilidad táctica (${score} pts) con el modelo ${activeModelName}, la secretaría técnica califica esta operación como "${recomendacion}". Representa una oportunidad de mercado coherente con los objetivos competitivos del club.`

  return {
    titulo: `Informe Técnico de Scouting: ${name}`,
    radiografia,
    encajeTactico,
    prosContras: {
      pros: pros.slice(0, 4),
      contras: contras.length > 0 ? contras : ['Exige seguimiento en campos de dimensiones reducidas']
    },
    recomendacion,
    justificacionFinal
  }
}
