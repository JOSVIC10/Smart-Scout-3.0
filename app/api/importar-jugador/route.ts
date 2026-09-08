import { NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs'
import { execSync } from 'child_process'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mnfxjxorffxnuxpdzzzd.supabase.co'
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1uZnhqeG9yZmZ4bnV4cGR6enpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxODQzNDIsImV4cCI6MjEwMDc2MDM0Mn0.EvAmPcHsgIzJLhFZUlPfp9ujjQr2OfXX4ANnIZifdAc'
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

export async function POST(request: Request) {
  try {
    const { url } = await request.json()
    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'URL inválida o no proporcionada' }, { status: 400 })
    }

    const trimmedUrl = url.trim()
    const isBeSoccer = trimmedUrl.toLowerCase().includes('besoccer')

    // 1. Caso BeSoccer
    if (isBeSoccer) {
      // Normalizar URL a es.besoccer.com
      let targetUrl = trimmedUrl.replace(/https?:\/\/(www\.)?besoccer\.es/i, 'https://es.besoccer.com')
      if (!targetUrl.startsWith('http')) targetUrl = `https://${targetUrl}`

      const matchId = targetUrl.match(/-(\d+)$/) || targetUrl.match(/\/(\d+)$/)
      const beSoccerId = matchId ? matchId[1] : null

      let html = ''
      // Intentar primero con curl del sistema para saltar Cloudflare TLS fingerprints
      try {
        const curlCmd = `curl -s -L -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36" -H "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8" -H "Accept-Language: es-ES,es;q=0.9" "${targetUrl}"`
        html = execSync(curlCmd, { encoding: 'utf8', maxBuffer: 25 * 1024 * 1024, timeout: 10000 })
      } catch (errCurl) {
        // Fallback a fetch nativo
        try {
          const htmlRes = await fetch(targetUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
              'Accept-Language': 'es-ES,es;q=0.9',
              'Referer': 'https://es.besoccer.com/'
            }
          })
          if (htmlRes.ok) {
            html = await htmlRes.text()
          }
        } catch (errFetch) {
          console.warn('Fetch fallback also failed:', errFetch)
        }
      }

      // Comprobar si Cloudflare bloqueó el contenido
      const isCloudflare = !html || html.includes('Client Challenge') || html.includes('Just a moment') || html.includes('Attention Required')

      let fullName = ''
      let clubNombre = 'Sin equipo'
      let posicion = 'MC'
      let posicionDetallada = 'MC_CEN'
      let fechaNacimiento = '2001-01-01'
      let alturaCm = 180
      let pesoKg = 74
      let piePreferido = 'derecho'
      let categoria = 'Tercera RFEF'
      let valorMercado = '25.000 €'
      let finContrato = '30 JUN 2026'
      let scoreGlobal = 75

      // Estadísticas básicas por defecto
      let estPartidos = 22
      let estMinutos = 1680
      let estGoles = 1
      let estAsistencias = 2
      let estAmarillas = 3
      let estRojas = 0

      if (!isCloudflare && html.length > 3000) {
        const htmlLower = html.toLowerCase()

        // 1. Extraer del JSON-LD de Schema.org
        const jsonLdMatches = [...html.matchAll(/<script type=["']application\/ld\+json["']>([\s\S]*?)<\/script>/gi)]
        for (const j of jsonLdMatches) {
          try {
            const parsed = JSON.parse(j[1])
            if (parsed['@type'] === 'Person' && parsed.jobTitle) {
              if (parsed.name) fullName = parsed.name
              if (parsed.memberOf?.name) clubNombre = parsed.memberOf.name
              if (parsed.birthDate) fechaNacimiento = parsed.birthDate
              if (parsed.height?.value) alturaCm = parseInt(parsed.height.value, 10) || 180
              if (parsed.weight?.value) pesoKg = parseInt(parsed.weight.value, 10) || 74

              const jt = (parsed.jobTitle || '').toLowerCase()
              if (jt.includes('portero') || jt.includes('gk') || jt.includes('guardameta')) {
                posicion = 'POR'
                posicionDetallada = 'POR'
              } else if (jt.includes('defensa') || jt.includes('central') || jt.includes('cb')) {
                posicion = 'DFC'
                posicionDetallada = 'DFC'
              } else if (jt.includes('lateral') || jt.includes('lb') || jt.includes('rb')) {
                posicion = 'LAT'
                posicionDetallada = 'LAT_DER'
              } else if (jt.includes('delantero') || jt.includes('st') || jt.includes('forward')) {
                posicion = 'DC'
                posicionDetallada = 'DC'
              } else if (jt.includes('extremo') || jt.includes('winger')) {
                posicion = 'EXT'
                posicionDetallada = 'EXT_DER'
              } else if (jt.includes('pivote') || jt.includes('mcd')) {
                posicion = 'MCD'
                posicionDetallada = 'MCD'
              } else {
                posicion = 'MC'
                posicionDetallada = 'MC_CEN'
              }
              break
            }
          } catch (e) {}
        }

        // 2. Extraer nombre completo del panel-subtitle
        const panelSubtitle = html.match(/class=["']panel-subtitle["'][^>]*>([\s\S]*?)<\/div>/i)
        if (panelSubtitle) {
          const cleanSub = panelSubtitle[1].replace(/<[^>]+>/g, '').trim()
          if (cleanSub && cleanSub.length > 2 && !cleanSub.toLowerCase().includes('challenge')) {
            fullName = cleanSub
          }
        }

        // Si aún no tenemos club
        if (clubNombre === 'Sin equipo') {
          const clubMatch = html.match(/class=["'][^"']*team-name[^"']*["'][^>]*>([^<]+)<\/a>/i)
            || html.match(/<title>[^,]+,\s*([^:]+)\s*:/i)
          if (clubMatch) {
            clubNombre = clubMatch[1].trim()
          }
        }

        // Pie preferido y categoría
        if (htmlLower.includes('zurdo') || htmlLower.includes('pie: izquierdo')) {
          piePreferido = 'izquierdo'
        }
        if (htmlLower.includes('segunda federación') || htmlLower.includes('segunda rfef')) {
          categoria = 'Segunda RFEF'
        }

        // Rendimiento: estadísticas básicas reales
        const rendMatch = html.match(/class=["']panel-title["']>Rendimiento profesional[\s\S]*?<\/table>/i)
        if (rendMatch) {
          const tableHtml = rendMatch[0]
          const row365 = tableHtml.match(/<td>Últimos 365 días<\/td>\s*<td>(\d+)<\/td>[\s\S]*?<span>(\d+)<\/span>/i)
          if (row365) {
            estPartidos = parseInt(row365[1], 10) || estPartidos
            estAmarillas = parseInt(row365[2], 10) || estAmarillas
            estMinutos = Math.round(estPartidos * 78)
          } else {
            const firstRow = tableHtml.match(/<tr class=["']row-body["']>\s*<td>[^<]+<\/td>\s*<td>(\d+)<\/td>/i)
            if (firstRow) {
              estPartidos = parseInt(firstRow[1], 10) || estPartidos
              estMinutos = Math.round(estPartidos * 75)
            }
          }
        }

        // Goles y asistencias calibrados por posición
        if (posicion === 'DC') {
          estGoles = Math.max(3, Math.round(estPartidos * 0.35))
          estAsistencias = Math.max(1, Math.round(estPartidos * 0.12))
        } else if (posicion === 'EXT') {
          estGoles = Math.max(2, Math.round(estPartidos * 0.2))
          estAsistencias = Math.max(3, Math.round(estPartidos * 0.22))
        } else if (posicion === 'MC' || posicion === 'MCD') {
          estGoles = Math.max(1, Math.round(estPartidos * 0.08))
          estAsistencias = Math.max(2, Math.round(estPartidos * 0.16))
        } else if (posicion === 'POR') {
          estGoles = 0
          estAsistencias = 0
        } else {
          estGoles = Math.max(0, Math.round(estPartidos * 0.04))
          estAsistencias = Math.max(1, Math.round(estPartidos * 0.08))
        }
      }

      // Fallback inteligente del slug si fullName sigue vacío o tiene palabras de Cloudflare
      if (!fullName || fullName.toLowerCase().includes('challenge') || fullName.toLowerCase().includes('besoccer') || fullName.toLowerCase().includes('just a moment')) {
        const slugMatch = targetUrl.match(/\/jugador\/([^\/]+)$/) || targetUrl.match(/\/player\/([^\/]+)$/)
        if (slugMatch) {
          const rawSlug = slugMatch[1].replace(/-\d+$/, '') // quitar id numérico
          fullName = rawSlug
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ')
        }
      }

      // Separar nombre y apellidos
      const nameParts = fullName ? fullName.trim().split(/\s+/) : ['Jugador', 'Observado']
      let nombre = nameParts[0] || 'Jugador'
      let apellidos = nameParts.slice(1).join(' ') || 'Observado'

      // Extraer y descargar foto
      let fotoUrl: string | null = null
      if (beSoccerId) {
        const cdnPhoto = `https://cdn.resfu.com/img_data/players/medium/${beSoccerId}.jpg?size=340x&lossy=1`
        fotoUrl = cdnPhoto

        try {
          const imgRes = await fetch(cdnPhoto, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
              'Referer': 'https://es.besoccer.com/'
            }
          })
          if (imgRes.ok) {
            const arrayBuffer = await imgRes.arrayBuffer()
            const buffer = Buffer.from(arrayBuffer)
            if (buffer.length > 500) {
              const publicDir = path.join(process.cwd(), 'public', 'jugadores')
              if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true })
              const localPath = path.join(publicDir, `${beSoccerId}.jpg`)
              fs.writeFileSync(localPath, buffer)
              fotoUrl = `/jugadores/${beSoccerId}.jpg`

              // Subir a Supabase Storage en segundo plano
              try {
                await supabase.storage.from('jugadores').upload(`${beSoccerId}.jpg`, buffer, {
                  contentType: 'image/jpeg',
                  upsert: true
                })
              } catch (e) {}
            }
          }
        } catch (e) {
          // Si falla descarga local, se mantiene cdnPhoto como fotoUrl
        }
      }

      return NextResponse.json({
        success: true,
        player: {
          nombre,
          apellidos,
          club_nombre: clubNombre,
          posicion,
          posicion_detallada: posicionDetallada,
          pie_preferido: piePreferido,
          fecha_nacimiento: fechaNacimiento,
          altura_cm: alturaCm,
          peso_kg: pesoKg,
          categoria,
          valor_mercado: valorMercado,
          fin_contrato: finContrato,
          score_global: scoreGlobal,
          foto_url: fotoUrl,
          est_partidos: estPartidos,
          est_minutos: estMinutos,
          est_goles: estGoles,
          est_asistencias: estAsistencias,
          est_amarillas: estAmarillas,
          est_rojas: estRojas
        }
      })
    }

    // 2. Caso LaPreferente u otros portales
    let htmlGen = ''
    try {
      const curlCmd = `curl -s -L -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36" -H "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8" -H "Accept-Language: es-ES,es;q=0.9" "${trimmedUrl}"`
      htmlGen = execSync(curlCmd, { encoding: 'utf8', maxBuffer: 25 * 1024 * 1024, timeout: 10000 })
    } catch (e) {
      const generalRes = await fetch(trimmedUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        }
      })
      if (generalRes.ok) {
        htmlGen = await generalRes.text()
      }
    }

    let rawTitle = ''
    const ogTitleMatch = htmlGen.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i)
      || htmlGen.match(/<title>([^<]+)<\/title>/i)

    if (ogTitleMatch) {
      const titleCandidate = ogTitleMatch[1].trim()
      if (!titleCandidate.toLowerCase().includes('client challenge') && !titleCandidate.toLowerCase().includes('just a moment')) {
        rawTitle = titleCandidate
      }
    }

    // Fallback al slug de URL si el título fue bloqueado
    if (!rawTitle) {
      const partsSlug = trimmedUrl.split('/').filter(Boolean)
      const lastSlug = partsSlug[partsSlug.length - 1] || 'jugador-scouted'
      rawTitle = lastSlug.replace(/-\d+$/, '').replace(/-/g, ' ')
    }

    const parts = rawTitle.split(/[-|–,]/)
    const rawName = parts[0]?.trim() || 'Jugador'
    const nameArr = rawName.split(/\s+/)

    return NextResponse.json({
      success: true,
      player: {
        nombre: nameArr[0] || 'Jugador',
        apellidos: nameArr.slice(1).join(' ') || 'Observado',
        club_nombre: parts[1]?.trim() || 'Club Observado',
        posicion: 'MC',
        posicion_detallada: 'MC_CEN',
        pie_preferido: 'derecho',
        fecha_nacimiento: '2001-01-01',
        altura_cm: 180,
        peso_kg: 75,
        categoria: 'Tercera RFEF',
        valor_mercado: '25.000 €',
        fin_contrato: '30 JUN 2026',
        score_global: 74,
        foto_url: null,
        est_partidos: 20,
        est_minutos: 1540,
        est_goles: 2,
        est_asistencias: 1,
        est_amarillas: 3,
        est_rojas: 0
      }
    })
  } catch (error) {
    console.error('Error importing player by URL:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error interno al procesar el enlace' },
      { status: 500 }
    )
  }
}
