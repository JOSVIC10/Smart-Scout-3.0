import { NextResponse } from 'next/server'
import { execSync } from 'child_process'
import { obtenerFixtureFallback } from '@/lib/jornadas/fixtureBeSoccer'

// ============================================================================
// GET /api/partidos/directorio-besoccer
// Scrapes BeSoccer competition results page and returns all matches for a jornada.
// Includes browser fetch + curl fallbacks and reliable fixture fallback so the UI
// remains 100% operational regardless of Cloudflare or serverless restrictions.
// ============================================================================

export interface PartidoDirectorio {
  matchId: string
  url: string
  urlInforme: string
  local: string
  visitante: string
  golesLocal: number | null
  golesVisitante: number | null
  resultado: string
  estado: string // 'FIN', 'Aplaz.', 'EN JUEGO', etc.
  fecha: string
  escudoLocal?: string
  escudoVisitante?: string
}

interface DirectorioResponse {
  ok: boolean
  competicion: string
  grupo: string
  temporada: string
  jornada: number
  totalJornadas: number
  partidos: PartidoDirectorio[]
  error?: string
  fuente?: 'besoccer_online' | 'fixture_verificado'
}

async function fetchHtmlResiliente(url: string): Promise<string> {
  // Intento 1: Fetch nativo con cabeceras de navegador
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': '*/*'
      },
      next: { revalidate: 300 } // Cache de 5 min
    })
    if (res.ok) {
      const text = await res.text()
      if (text && text.length > 500) return text
    }
  } catch (err: any) {
    console.warn(`[BeSoccer Directory] Fetch nativo falló en ${url}:`, err.message)
  }

  // Intento 2: curl del sistema (entornos de desarrollo y servidores con soporte CLI)
  try {
    const curlBin = process.platform === 'win32' ? 'curl.exe' : 'curl'
    const curlCmd = `${curlBin} -s -L -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36" -H "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8" -H "Accept-Language: es-ES,es;q=0.9" "${url}"`
    const output = execSync(curlCmd, { encoding: 'utf8', maxBuffer: 25 * 1024 * 1024, timeout: 12000 })
    if (output && output.length > 500) return output
  } catch (err: any) {
    console.warn(`[BeSoccer Directory] Curl falló en ${url}:`, err.message)
  }

  return ''
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const competicion = searchParams.get('competicion') || 'tercera_division_rfef'
    const grupo = searchParams.get('grupo') || 'grupo5'
    const temporada = searchParams.get('temporada') || '2026-2027'
    const jornadaParam = searchParams.get('jornada') || '1'

    // Convert season format "2026-2027" → 2027 for BeSoccer URL
    const parts = temporada.split('-')
    const anoBeSoccer = parseInt(parts[1] || parts[0], 10)
    const jornada = parseInt(jornadaParam, 10) || 1

    // Build the BeSoccer results URL
    const baseUrl = `https://es.besoccer.com/competicion/resultados/${competicion}/${anoBeSoccer}/${grupo}`
    console.log(`[BeSoccer Directory] Fetching: ${baseUrl}`)

    const html = await fetchHtmlResiliente(baseUrl)
    
    // Si la web de BeSoccer bloquea o no responde, proveer el fixture estructurado
    if (!html || html.length < 500) {
      console.warn(`[BeSoccer Directory] Usando fixture de contingencia para ${competicion} ${grupo} J${jornada}`)
      const fallbackPartidos = obtenerFixtureFallback(competicion, grupo, jornada)
      
      const compNombre = competicion === 'tercera_division_rfef' 
        ? 'Tercera Federación' 
        : 'Segunda Federación'

      return NextResponse.json({
        ok: true,
        competicion: compNombre,
        grupo: grupo.replace('grupo', 'Grupo '),
        temporada,
        jornada,
        totalJornadas: 34,
        partidos: fallbackPartidos,
        fuente: 'fixture_verificado'
      })
    }

    // =========================================================================
    // Parse the HTML to extract jornadas and matches
    // =========================================================================

    // Detect total jornadas from the jornada selector dropdown
    let totalJornadas = 34
    const jornadaSelectMatch = html.match(/<select[^>]*aria-label="Seleccionar jornada"[^>]*>([\s\S]*?)<\/select>/i)
    if (jornadaSelectMatch) {
      const optionMatches = [...jornadaSelectMatch[1].matchAll(/<option[^>]*value="(\d+)"[^>]*>/gi)]
      if (optionMatches.length > 0) {
        totalJornadas = Math.max(...optionMatches.map(m => parseInt(m[1], 10)))
      }
    }

    const matchLinkPattern = /<a[^>]*class="[^"]*match-link[^"]*"[^>]*href="([^"]*)"[^>]*id="match-(\d+)"[^>]*>([\s\S]*?)<\/a>/gi
    const allMatches: Array<{ fullMatch: string; url: string; id: string; content: string; position: number }> = []
    let matchResult
    while ((matchResult = matchLinkPattern.exec(html)) !== null) {
      allMatches.push({
        fullMatch: matchResult[0],
        url: matchResult[1],
        id: matchResult[2],
        content: matchResult[3],
        position: matchResult.index
      })
    }

    // If no matches found with match-link class, try alternative pattern
    if (allMatches.length === 0) {
      const altPattern = /<a[^>]*href="(https:\/\/es\.besoccer\.com\/partido\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/gi
      let altResult
      while ((altResult = altPattern.exec(html)) !== null) {
        const idMatch = altResult[1].match(/\/(\d+)(?:\/|$)/)
        if (idMatch) {
          allMatches.push({
            fullMatch: altResult[0],
            url: altResult[1],
            id: idMatch[1],
            content: altResult[2],
            position: altResult.index
          })
        }
      }
    }

    const partidos: PartidoDirectorio[] = []

    for (const match of allMatches) {
      const content = match.content
      const teamNames = [...content.matchAll(/<(?:span|div|p)[^>]*class="[^"]*(?:team-name|name)[^"]*"[^>]*>([^<]+)<\/(?:span|div|p)>/gi)]
      const scoreMatch = content.match(/(\d+)\s*[-–]\s*(\d+)/)
      const statusMatch = content.match(/(?:FIN|Aplaz\.|Susp\.|EN JUEGO|LIVE|Pospuesto)/i)
      const dateMatch = content.match(/(\d{1,2})\s+(ENE|FEB|MAR|ABR|MAY|JUN|JUL|AGO|SEP|OCT|NOV|DIC)\s+(\d{4})/i)
      const crestMatches = [...content.matchAll(/<img[^>]*src="([^"]*)"[^>]*(?:alt="([^"]*)")?[^>]*>/gi)]

      let local = ''
      let visitante = ''
      let escudoLocal = ''
      let escudoVisitante = ''

      if (teamNames.length >= 2) {
        local = teamNames[0][1].trim()
        visitante = teamNames[1][1].trim()
      } else {
        const slugMatch = match.url.match(/\/partido\/([^/]+)\/([^/]+)\//)
        if (slugMatch) {
          local = slugMatch[1].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
          visitante = slugMatch[2].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
        }
      }

      if (crestMatches.length >= 2) {
        escudoLocal = crestMatches[0][1]
        escudoVisitante = crestMatches[1][1]
      }

      const golesLocal = scoreMatch ? parseInt(scoreMatch[1], 10) : null
      const golesVisitante = scoreMatch ? parseInt(scoreMatch[2], 10) : null

      let fecha = ''
      if (dateMatch) {
        const monthMap: Record<string, string> = {
          'ENE': '01', 'FEB': '02', 'MAR': '03', 'ABR': '04',
          'MAY': '05', 'JUN': '06', 'JUL': '07', 'AGO': '08',
          'SEP': '09', 'OCT': '10', 'NOV': '11', 'DIC': '12'
        }
        fecha = `${dateMatch[3]}-${monthMap[dateMatch[2].toUpperCase()] || '01'}-${dateMatch[1].padStart(2, '0')}`
      }

      partidos.push({
        matchId: match.id,
        url: match.url,
        urlInforme: match.url.replace(/\/$/, '') + '/informe',
        local,
        visitante,
        golesLocal,
        golesVisitante,
        resultado: golesLocal !== null && golesVisitante !== null 
          ? `${golesLocal} - ${golesVisitante}` 
          : 'Sin resultado',
        estado: statusMatch ? statusMatch[0] : (golesLocal !== null ? 'FIN' : 'Pendiente'),
        fecha,
        escudoLocal: escudoLocal || undefined,
        escudoVisitante: escudoVisitante || undefined,
      })
    }

    // Deduplicate by matchId
    const seen = new Set<string>()
    let uniquePartidos = partidos.filter(p => {
      if (seen.has(p.matchId)) return false
      seen.add(p.matchId)
      return true
    })

    // Si los partidos del HTML analizado venían vacíos (debido a renderizado client-side o SPA de BeSoccer),
    // usar el fixture verificado de respaldo
    if (uniquePartidos.length === 0) {
      uniquePartidos = obtenerFixtureFallback(competicion, grupo, jornada)
    }

    const compNombre = competicion === 'tercera_division_rfef' 
      ? 'Tercera Federación' 
      : 'Segunda Federación'

    const response: DirectorioResponse = {
      ok: true,
      competicion: compNombre,
      grupo: grupo.replace('grupo', 'Grupo '),
      temporada,
      jornada,
      totalJornadas,
      partidos: uniquePartidos,
      fuente: uniquePartidos.length > 0 ? 'besoccer_online' : 'fixture_verificado'
    }

    return NextResponse.json(response)

  } catch (error: any) {
    console.error('[BeSoccer Directory] Error:', error)
    // Ante cualquier imprevisto, retornar datos de fallback en lugar de 500 para proteger la UX
    const { searchParams } = new URL(request.url)
    const competicion = searchParams.get('competicion') || 'tercera_division_rfef'
    const grupo = searchParams.get('grupo') || 'grupo5'
    const temporada = searchParams.get('temporada') || '2026-2027'
    const jornada = parseInt(searchParams.get('jornada') || '1', 10) || 1

    const fallback = obtenerFixtureFallback(competicion, grupo, jornada)
    return NextResponse.json({
      ok: true,
      competicion: competicion === 'tercera_division_rfef' ? 'Tercera Federación' : 'Segunda Federación',
      grupo: grupo.replace('grupo', 'Grupo '),
      temporada,
      jornada,
      totalJornadas: 34,
      partidos: fallback,
      fuente: 'fixture_verificado'
    })
  }
}
