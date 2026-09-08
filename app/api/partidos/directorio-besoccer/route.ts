import { NextResponse } from 'next/server'
import { execSync } from 'child_process'

// ============================================================================
// GET /api/partidos/directorio-besoccer
// Scrapes BeSoccer competition results page and returns all matches for a jornada
// ============================================================================

interface PartidoDirectorio {
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
}

function fetchHtml(url: string): string {
  try {
    const curlCmd = `curl -s -L -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36" -H "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8" -H "Accept-Language: es-ES,es;q=0.9" "${url}"`
    return execSync(curlCmd, { encoding: 'utf8', maxBuffer: 25 * 1024 * 1024, timeout: 15000 })
  } catch (err: any) {
    console.warn(`[BeSoccer Directory] Curl error on ${url}:`, err.message)
    return ''
  }
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

    const html = fetchHtml(baseUrl)
    if (!html || html.length < 500) {
      return NextResponse.json(
        { ok: false, error: `No se pudo acceder a la página de BeSoccer: ${baseUrl}`, partidos: [] },
        { status: 502 }
      )
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

    // BeSoccer organizes matches in jornada sections
    // Each jornada section is identified by a panel/tab or section header
    // Strategy: Find all match-link elements and group by jornada context

    const partidos: PartidoDirectorio[] = []

    // Method 1: Parse match links from the page
    // BeSoccer uses <a class="match-link"> elements
    // The page may show all jornadas or just the selected one

    // First, try to find jornada sections
    // Pattern: Sections marked with jornada headers followed by match links
    const jornadaPattern = /Jornada\s+(\d+)/gi
    const matchLinkPattern = /<a[^>]*class="[^"]*match-link[^"]*"[^>]*href="([^"]*)"[^>]*id="match-(\d+)"[^>]*>([\s\S]*?)<\/a>/gi

    // Find all match links on the page
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

    // If no matches found with match-link class, try alternative selectors
    if (allMatches.length === 0) {
      // Try broader pattern for match links
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

    // Find jornada positions in HTML to associate matches with jornadas
    const jornadaPositions: Array<{ jornada: number; position: number }> = []
    let jornadaResult
    // Reset regex
    jornadaPattern.lastIndex = 0
    while ((jornadaResult = jornadaPattern.exec(html)) !== null) {
      jornadaPositions.push({
        jornada: parseInt(jornadaResult[1], 10),
        position: jornadaResult.index
      })
    }

    // Deduplicate jornada positions (keep first occurrence of each jornada)
    const seenJornadas = new Set<number>()
    const uniqueJornadaPositions = jornadaPositions.filter(jp => {
      if (seenJornadas.has(jp.jornada)) return false
      seenJornadas.add(jp.jornada)
      return true
    })

    // Associate each match with its jornada based on position in HTML
    for (const match of allMatches) {
      let matchJornada = 1
      for (let i = uniqueJornadaPositions.length - 1; i >= 0; i--) {
        if (match.position > uniqueJornadaPositions[i].position) {
          matchJornada = uniqueJornadaPositions[i].jornada
          break
        }
      }

      // Only include matches from the requested jornada
      if (matchJornada !== jornada) continue

      // Parse match content to extract teams and score
      const content = match.content

      // Extract team names - they're typically in spans or divs with team name class
      const teamNames = [...content.matchAll(/<(?:span|div|p)[^>]*class="[^"]*(?:team-name|name)[^"]*"[^>]*>([^<]+)<\/(?:span|div|p)>/gi)]
      
      // Extract score
      const scoreMatch = content.match(/(\d+)\s*[-–]\s*(\d+)/)
      
      // Extract status (FIN, Aplaz., etc.)
      const statusMatch = content.match(/(?:FIN|Aplaz\.|Susp\.|EN JUEGO|LIVE|Pospuesto)/i)
      
      // Extract date
      const dateMatch = content.match(/(\d{1,2})\s+(ENE|FEB|MAR|ABR|MAY|JUN|JUL|AGO|SEP|OCT|NOV|DIC)\s+(\d{4})/i)

      // Extract team crests/shields
      const crestMatches = [...content.matchAll(/<img[^>]*src="([^"]*)"[^>]*(?:alt="([^"]*)")?[^>]*>/gi)]

      let local = ''
      let visitante = ''
      let escudoLocal = ''
      let escudoVisitante = ''

      if (teamNames.length >= 2) {
        local = teamNames[0][1].trim()
        visitante = teamNames[1][1].trim()
      } else {
        // Fallback: extract from URL slug
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

    // If regex parsing yielded no matches, try a simpler fallback approach
    // by scanning for all partido URLs and extracting basic info
    if (partidos.length === 0 && allMatches.length > 0) {
      // Take all matches found (they might all be from the current jornada view)
      for (const match of allMatches.slice(0, 20)) {
        const slugMatch = match.url.match(/\/partido\/([^/]+)\/([^/]+)\/(\d+)/)
        if (!slugMatch) continue

        const content = match.content
        const scoreMatch = content.match(/(\d+)\s*[-–]\s*(\d+)/)
        const golesL = scoreMatch ? parseInt(scoreMatch[1], 10) : null
        const golesV = scoreMatch ? parseInt(scoreMatch[2], 10) : null

        partidos.push({
          matchId: slugMatch[3],
          url: match.url,
          urlInforme: match.url.replace(/\/$/, '') + '/informe',
          local: slugMatch[1].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          visitante: slugMatch[2].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          golesLocal: golesL,
          golesVisitante: golesV,
          resultado: golesL !== null && golesV !== null ? `${golesL} - ${golesV}` : 'Sin resultado',
          estado: golesL !== null ? 'FIN' : 'Pendiente',
          fecha: '',
        })
      }
    }

    // Deduplicate by matchId
    const seen = new Set<string>()
    const uniquePartidos = partidos.filter(p => {
      if (seen.has(p.matchId)) return false
      seen.add(p.matchId)
      return true
    })

    // Build competition name for display
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
      partidos: uniquePartidos
    }

    return NextResponse.json(response)

  } catch (error: any) {
    console.error('[BeSoccer Directory] Error:', error)
    return NextResponse.json(
      { ok: false, error: error.message || 'Error al consultar el directorio de BeSoccer', partidos: [] },
      { status: 500 }
    )
  }
}
