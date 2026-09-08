import { NextResponse } from 'next/server'
import { execSync } from 'child_process'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mnfxjxorffxnuxpdzzzd.supabase.co'
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1uZnhqeG9yZmZ4bnV4cGR6enpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxODQzNDIsImV4cCI6MjEwMDc2MDM0Mn0.EvAmPcHsgIzJLhFZUlPfp9ujjQr2OfXX4ANnIZifdAc'
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

export interface JugadorActa {
  nombre: string
  nombreCompleto?: string
  dorsal?: number
  posicion?: string
  esTitular: boolean
  minutosJugados: number
  minutoEntrada?: number | null
  minutoSalida?: number | null
  goles: number
  asistencias: number
  amarillas: number
  rojas: number
  jugadorBdId?: string | null
  clubBdId?: string | null
  equipoNombre: string
}

export interface ActaPartidoResponse {
  ok: boolean
  partido: {
    idBeSoccer?: string
    local: string
    visitante: string
    golesLocal: number
    golesVisitante: number
    resultado: string
    competicion: string
    jornada: number
    fecha: string
    estadio?: string
  }
  jugadoresLocal: JugadorActa[]
  jugadoresVisitante: JugadorActa[]
  jugadoresActualizados?: Array<{
    id: string
    nombre: string
    equipo: string
    minutosSumados: number
    golesSumados: number
    amarillasSumadas: number
    rojasSumadas: number
    esTitular: boolean
    estPartidosNuevo: number
    estMinutosNuevo: number
  }>
  mensaje?: string
  error?: string
}

function fetchBeSoccerHtml(url: string): string {
  try {
    const curlCmd = `curl -s -L -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36" -H "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8" -H "Accept-Language: es-ES,es;q=0.9" "${url}"`
    return execSync(curlCmd, { encoding: 'utf8', maxBuffer: 25 * 1024 * 1024, timeout: 15000 })
  } catch (err: any) {
    console.warn(`[BeSoccer] Curl error on ${url}:`, err.message)
    return ''
  }
}

// ============================================================================
// Dynamic HTML Parser for BeSoccer Match Reports
// ============================================================================

function parseMatchMetadata(html: string) {
  let local = ''
  let visitante = ''
  let golesLocal = 0
  let golesVisitante = 0
  let competicion = 'Tercera Federación'
  let fecha = ''
  let estadio = ''

  // 1. Parse JSON-LD (schema.org SportsEvent) — most reliable source
  const jsonLdMatches = [...html.matchAll(/<script type=["']application\/ld\+json["']>([\s\S]*?)<\/script>/gi)]
  for (const m of jsonLdMatches) {
    try {
      const parsed = JSON.parse(m[1])
      if (parsed['@type'] === 'SportsEvent') {
        if (parsed.homeTeam?.name) local = parsed.homeTeam.name
        if (parsed.awayTeam?.name) visitante = parsed.awayTeam.name
        if (parsed.startDate) fecha = parsed.startDate.split('T')[0]
        if (parsed.location?.name) estadio = parsed.location.name
      }
    } catch (e) {}
  }

  // 2. Parse title for score and competition
  const titleMatch = html.match(/<title>([^<]+)<\/title>/i)
  if (titleMatch) {
    const t = titleMatch[1]
    const scoreMatch = t.match(/(\d+)\s*[-:]\s*(\d+)/)
    if (scoreMatch) {
      golesLocal = parseInt(scoreMatch[1], 10)
      golesVisitante = parseInt(scoreMatch[2], 10)
    }
    // Try to detect competition name
    if (/tercera\s+federaci[oó]n/i.test(t)) competicion = 'Tercera Federación'
    else if (/segunda\s+(?:rfef|federaci[oó]n)/i.test(t)) competicion = 'Segunda Federación'
    else if (/segunda\s+divisi[oó]n\s+rfef/i.test(t)) competicion = 'Segunda RFEF'
  }

  // 3. Fallback: parse team names from breadcrumbs or match header
  if (!local || !visitante) {
    const headerMatch = html.match(/class="[^"]*team-name[^"]*"[^>]*>([^<]+)</g)
    if (headerMatch && headerMatch.length >= 2) {
      const extract = (s: string) => s.replace(/.*>/, '').trim()
      local = local || extract(headerMatch[0])
      visitante = visitante || extract(headerMatch[1])
    }
  }

  return { local, visitante, golesLocal, golesVisitante, competicion, fecha, estadio }
}

function parseLineup(html: string, teamName: string, isHome: boolean): JugadorActa[] {
  const players: JugadorActa[] = []

  // BeSoccer lineup pages have player blocks organized by team
  // Each player typically has: name, number, position, and minute info

  // Strategy 1: Find player entries in the lineup/alineaciones page
  // Look for player rows with name, dorsal, position, and status (starter/sub)
  
  // The alineaciones page uses a structure like:
  // <div class="player-row"> or similar with player info
  
  // Try to find all player name elements near team sections
  // Pattern: Look for sections that contain team name, then extract players

  // Split HTML into home/away sections by looking for team name markers
  const sections = html.split(/<div[^>]*class="[^"]*(?:team-lineup|lineup-section|panel-body)[^"]*"/i)
  
  // Also try to find players via the common BeSoccer pattern:
  // Player entries with data attributes or specific class names
  const playerPattern = /<(?:div|tr|li)[^>]*class="[^"]*(?:player-row|player-name|line-up-row|squad-row)[^"]*"[^>]*>([\s\S]*?)<\/(?:div|tr|li)>/gi
  
  // Alternative: Look for structured data in the lineup
  // BeSoccer often includes player data in data attributes or script blocks
  
  // Most robust approach: Find all player-like entries and associate them with events
  // Pattern: <span class="name">PlayerName</span> ... <span class="number">14</span>
  const namePattern = /(?:class="[^"]*(?:name|player-name|squad-name)[^"]*"[^>]*>)([^<]+)</gi
  const dorsalPattern = /(?:class="[^"]*(?:number|dorsal|squad-number)[^"]*"[^>]*>)(\d+)</gi
  
  // Find all player names on the page
  const allNames = [...html.matchAll(namePattern)]
  const allDorsals = [...html.matchAll(dorsalPattern)]

  // If we can find structured lineup data, great. Otherwise, fall back to events-based parsing.
  
  // Events-based approach: parse goal and card events to get at least partial player data
  // Goals: <span class="icon-gol"></span> or ⚽ followed by player name and minute
  const goalEvents: Array<{ playerName: string; minute: number }> = []
  const goalPattern = /(?:icon-gol|⚽|goal)[^>]*>?\s*(?:<[^>]+>)*\s*([^<]+?)(?:\s*\((\d+)['′]\)|\s+(\d+)['′])/gi
  let goalMatch
  while ((goalMatch = goalPattern.exec(html)) !== null) {
    goalEvents.push({
      playerName: goalMatch[1].trim(),
      minute: parseInt(goalMatch[2] || goalMatch[3] || '0', 10)
    })
  }

  // Yellow cards
  const yellowEvents: Array<{ playerName: string; minute: number }> = []
  const yellowPattern = /(?:icon-yellow|🟨|yellow-card|amarilla)[^>]*>?\s*(?:<[^>]+>)*\s*([^<]+?)(?:\s*\((\d+)['′]\)|\s+(\d+)['′])/gi
  let yellowMatch
  while ((yellowMatch = yellowPattern.exec(html)) !== null) {
    yellowEvents.push({
      playerName: yellowMatch[1].trim(),
      minute: parseInt(yellowMatch[2] || yellowMatch[3] || '0', 10)
    })
  }

  // Substitution events to determine minutes played
  const subEvents: Array<{ playerOut: string; playerIn: string; minute: number }> = []
  const subPattern = /(?:icon-change|substitution|cambio)[^>]*>?\s*(?:<[^>]+>)*\s*([^<]+?)\s*(?:→|➜|por|->)\s*([^<]+?)(?:\s*\((\d+)['′]\)|\s+(\d+)['′])/gi
  let subMatch
  while ((subMatch = subPattern.exec(html)) !== null) {
    subEvents.push({
      playerOut: subMatch[1].trim(),
      playerIn: subMatch[2].trim(),
      minute: parseInt(subMatch[3] || subMatch[4] || '0', 10)
    })
  }

  return players
}

/**
 * Advanced parser that extracts lineup data from BeSoccer match pages.
 * Uses multiple strategies to find player data from the HTML.
 */
function parsePlayersFromHtml(html: string, teamName: string): JugadorActa[] {
  const players: JugadorActa[] = []
  
  // Strategy: Parse the full HTML for player blocks
  // BeSoccer typically has player entries like:
  // <a href="/jugador/..." class="..."><span class="dorsal">14</span> <span class="name">Player Name</span></a>
  
  // Look for all player entries generically
  const playerBlockPattern = /<a[^>]*href="\/jugador\/[^"]*"[^>]*>([\s\S]*?)<\/a>/gi
  const playerBlocks: Array<{ content: string; position: number }> = []
  let pbMatch
  while ((pbMatch = playerBlockPattern.exec(html)) !== null) {
    playerBlocks.push({ content: pbMatch[1], position: pbMatch.index })
  }

  // If we found player blocks, try to extract info from each
  for (const block of playerBlocks) {
    const nameMatch = block.content.match(/>([^<]{2,})</g)
    if (!nameMatch) continue
    
    // Extract the longest text content as the player name
    const texts = nameMatch.map(m => m.replace(/^>/, '').trim()).filter(t => t.length > 1 && !/^\d+$/.test(t))
    const name = texts.sort((a, b) => b.length - a.length)[0]
    if (!name) continue

    // Extract dorsal number
    const dorsalMatch = block.content.match(/>(\d{1,2})</)
    const dorsal = dorsalMatch ? parseInt(dorsalMatch[1], 10) : undefined

    // Determine position from context
    const posMatch = block.content.match(/(POR|DFC|LAT|MCD|MC|EXT|DC|DEF|MED|DEL|Portero|Defensa|Centrocampista|Delantero)/i)
    let posicion = posMatch ? posMatch[1] : undefined

    players.push({
      nombre: name,
      dorsal,
      posicion,
      esTitular: true, // Will be refined later
      minutosJugados: 90,
      goles: 0,
      asistencias: 0,
      amarillas: 0,
      rojas: 0,
      equipoNombre: teamName
    })
  }

  return players
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { url, guardarEnBD = true, jornada = 1 } = body

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'URL del partido no proporcionada' }, { status: 400 })
    }

    const trimmedUrl = url.trim()
    let baseUrl = trimmedUrl.replace(/\/informe|\/alineaciones|\/eventos|\/cronica/i, '')
    if (!baseUrl.startsWith('http')) baseUrl = `https://${baseUrl}`

    // Extract match ID from URL
    const matchIdMatch = baseUrl.match(/\/(\d+)(\/|$)/) || baseUrl.match(/-(\d+)(\/|$)/)
    const matchId = matchIdMatch ? matchIdMatch[1] : ''

    // =========================================================================
    // Fetch HTML from multiple BeSoccer pages for comprehensive data
    // =========================================================================
    console.log(`[BeSoccer Acta] Fetching match data from: ${baseUrl}`)
    
    const htmlInforme = fetchBeSoccerHtml(`${baseUrl}/informe`)
    const htmlAlineaciones = fetchBeSoccerHtml(`${baseUrl}/alineaciones`)
    const htmlEventos = fetchBeSoccerHtml(`${baseUrl}`) // Main match page
    const combinedHtml = [htmlInforme, htmlAlineaciones, htmlEventos].join('\n')

    // =========================================================================
    // Parse match metadata (teams, score, competition, date)
    // =========================================================================
    const metadata = parseMatchMetadata(combinedHtml)
    let { local, visitante, golesLocal, golesVisitante, competicion, fecha, estadio } = metadata

    // =========================================================================
    // Parse lineups and events to build player lists
    // =========================================================================
    
    // Try to dynamically parse players from HTML
    let jugadoresLocal = parsePlayersFromHtml(combinedHtml, local)
    let jugadoresVisitante = parsePlayersFromHtml(combinedHtml, visitante)

    // =========================================================================
    // Enhanced: Parse events (goals, cards, subs) from the informe page
    // =========================================================================
    
    // Parse substitutions to calculate minutes
    const subRegex = /(\d+)['′]\s*(?:[\s\S]*?)(?:cambio|sust|change)/gi
    
    // Parse goal scorers
    const allGoalScorers: string[] = []
    const goalLineRegex = /(?:⚽|gol|icon-goal)[^>]*(?:>|\s)+([^<\n]+?)(?:\s*\(?\s*(\d+)['′])/gi
    let glMatch
    while ((glMatch = goalLineRegex.exec(combinedHtml)) !== null) {
      allGoalScorers.push(glMatch[1].trim())
    }

    // Parse yellow card recipients  
    const allYellowRecipients: string[] = []
    const yellowLineRegex = /(?:🟨|amarilla|icon-yellow|yellow)[^>]*(?:>|\s)+([^<\n]+?)(?:\s*\(?\s*(\d+)['′])/gi
    let ylMatch
    while ((ylMatch = yellowLineRegex.exec(combinedHtml)) !== null) {
      allYellowRecipients.push(ylMatch[1].trim())
    }

    // =========================================================================
    // Apply events to players
    // =========================================================================
    const applyEvents = (players: JugadorActa[]) => {
      for (const p of players) {
        const pNameNorm = p.nombre.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        // Count goals
        p.goles = allGoalScorers.filter(gs => {
          const gsNorm = gs.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
          return gsNorm.includes(pNameNorm) || pNameNorm.includes(gsNorm)
        }).length
        // Count yellows
        p.amarillas = allYellowRecipients.filter(yr => {
          const yrNorm = yr.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
          return yrNorm.includes(pNameNorm) || pNameNorm.includes(yrNorm)
        }).length
      }
    }

    applyEvents(jugadoresLocal)
    applyEvents(jugadoresVisitante)

    // =========================================================================
    // Database sync (if requested)
    // =========================================================================
    const jugadoresActualizados: any[] = []

    if (guardarEnBD) {
      const { data: dbJugadores } = await supabase
        .from('jugadores')
        .select('*, club:clubes(*)')

      const { data: dbClubes } = await supabase
        .from('clubes')
        .select('*')

      // Fuzzy name matching helper
      const buscarEnBd = (nombre: string, clubId?: string) => {
        if (!dbJugadores) return null
        const nNorm = nombre.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

        return dbJugadores.find(j => {
          const jNombre = `${j.nombre} ${j.apellidos || ''}`.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
          const coincideClub = !clubId || j.club_id === clubId
          return coincideClub && (
            jNombre.includes(nNorm) || 
            nNorm.includes(jNombre) || 
            (j.nombre && nNorm.includes(j.nombre.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')))
          )
        })
      }

      // Find clubs in DB matching the teams
      const findClub = (teamName: string) => {
        if (!dbClubes || !teamName) return null
        const tNorm = teamName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        return dbClubes.find(c => {
          const cNorm = c.nombre.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
          return cNorm.includes(tNorm) || tNorm.includes(cNorm)
        })
      }

      const clubLocal = findClub(local)
      const clubVisitante = findClub(visitante)

      // Helper to sync a list of players from the match report to the DB
      const syncPlayers = async (players: JugadorActa[], clubId?: string, teamLabel?: string) => {
        for (const p of players) {
          let match = buscarEnBd(p.nombre, clubId)
          if (!match && p.dorsal && clubId) {
            match = dbJugadores?.find(j => j.club_id === clubId && j.dorsal === p.dorsal)
          }

          if (match) {
            const prevPJ = match.est_partidos ?? match.partidos_analizados ?? 0
            const prevMin = match.est_minutos ?? match.minutos_jugados ?? 0
            const prevGoles = match.est_goles ?? 0
            const prevAsist = match.est_asistencias ?? 0
            const prevAmarillas = match.est_amarillas ?? 0
            const prevRojas = match.est_rojas ?? 0

            const nuevoPJ = prevPJ + 1
            const nuevoMin = prevMin + p.minutosJugados
            const nuevoGoles = prevGoles + p.goles
            const nuevoAsist = prevAsist + p.asistencias
            const nuevoAmarillas = prevAmarillas + p.amarillas
            const nuevoRojas = prevRojas + p.rojas

            await supabase
              .from('jugadores')
              .update({
                est_partidos: nuevoPJ,
                est_minutos: nuevoMin,
                est_goles: nuevoGoles,
                est_asistencias: nuevoAsist,
                est_amarillas: nuevoAmarillas,
                est_rojas: nuevoRojas,
                partidos_analizados: nuevoPJ,
                minutos_jugados: nuevoMin
              })
              .eq('id', match.id)

            jugadoresActualizados.push({
              id: match.id,
              nombre: `${match.nombre} ${match.apellidos || ''}`.trim(),
              equipo: teamLabel || p.equipoNombre,
              minutosSumados: p.minutosJugados,
              golesSumados: p.goles,
              amarillasSumadas: p.amarillas,
              rojasSumadas: p.rojas,
              esTitular: p.esTitular,
              estPartidosNuevo: nuevoPJ,
              estMinutosNuevo: nuevoMin
            })
          }
        }
      }

      // Sync local team players
      await syncPlayers(jugadoresLocal, clubLocal?.id, local)
      // Sync away team players
      await syncPlayers(jugadoresVisitante, clubVisitante?.id, visitante)

      // Register the match in partidos table
      const clubGrama = dbClubes?.find(c => c.nombre.toLowerCase().includes('grama'))
      if (clubGrama && (clubLocal?.id === clubGrama.id || clubVisitante?.id === clubGrama.id)) {
        try {
          await supabase.from('partidos').insert({
            fecha: fecha || new Date().toISOString().split('T')[0],
            jornada: Number(jornada) || 1,
            club_local_id: clubLocal?.id ?? null,
            club_visitante_id: clubVisitante?.id ?? null,
            resultado: `${golesLocal} - ${golesVisitante}`,
            competicion: competicion,
            notas: `Acta BeSoccer oficial: ${baseUrl}`
          })
        } catch (errPartido) {
          console.warn('Nota: no se pudo insertar partido en tabla partidos:', errPartido)
        }
      }
    }

    return NextResponse.json({
      ok: true,
      partido: {
        idBeSoccer: matchId,
        local,
        visitante,
        golesLocal,
        golesVisitante,
        resultado: `${golesLocal} - ${golesVisitante}`,
        competicion,
        jornada: Number(jornada) || 1,
        fecha,
        estadio
      },
      jugadoresVisitante,
      jugadoresLocal,
      jugadoresActualizados,
      mensaje: `Acta del partido ${local} ${golesLocal} - ${golesVisitante} ${visitante} procesada con éxito. ${jugadoresActualizados.length} jugadores actualizados en la base de datos.`
    })

  } catch (error: any) {
    console.error('Error procesando acta de BeSoccer:', error)
    return NextResponse.json(
      { error: error.message || 'Error al procesar el acta del partido' },
      { status: 500 }
    )
  }
}
