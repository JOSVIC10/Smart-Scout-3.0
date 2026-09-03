import { NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs'
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

    // 1. Caso BeSoccer
    if (trimmedUrl.includes('besoccer.com')) {
      const matchId = trimmedUrl.match(/-(\d+)$/) || trimmedUrl.match(/\/(\d+)$/)
      const beSoccerId = matchId ? matchId[1] : null

      // Descargar HTML de BeSoccer
      const htmlRes = await fetch(trimmedUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'es-ES,es;q=0.9',
          'Referer': 'https://es.besoccer.com/'
        }
      })

      let html = ''
      if (htmlRes.ok) {
        html = await htmlRes.text()
      }

      // Extraer nombre del título o tag, con fallback al slug de la URL
      let fullName = ''
      const titleMatch = html.match(/<title>([^<,]+)/i)
      if (titleMatch && !titleMatch[1].toLowerCase().includes('just a moment') && !titleMatch[1].toLowerCase().includes('besoccer')) {
        fullName = titleMatch[1].trim()
      } else {
        const ogTitle = html.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i)
        if (ogTitle && !ogTitle[1].toLowerCase().includes('besoccer')) {
          fullName = ogTitle[1].split(',')[0].trim()
        }
      }

      // Si no se obtuvo de los metadatos, extraer de forma inteligente del slug de la URL
      if (!fullName) {
        const slugMatch = trimmedUrl.match(/\/jugador\/([^\/]+)$/) || trimmedUrl.match(/\/player\/([^\/]+)$/)
        if (slugMatch) {
          const rawSlug = slugMatch[1].replace(/-\d+$/, '') // quitar id numérico
          fullName = rawSlug
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ')
        }
      }

      // Separar nombre y apellidos
      const nameParts = fullName ? fullName.split(' ') : ['Jugador', 'Scouted']
      let nombre = nameParts[0] || 'Jugador'
      let apellidos = nameParts.slice(1).join(' ') || 'Observado'

      // Extraer club
      let clubNombre = 'Sin equipo'
      const clubMatch = html.match(/class=["'][^"']*team-name[^"']*["'][^>]*>([^<]+)<\/a>/i)
        || html.match(/<title>[^,]+,\s*([^:]+)\s*:/i)
      if (clubMatch) {
        clubNombre = clubMatch[1].trim()
      }

      // Extraer posición
      let posicion = 'MC'
      let posicionDetallada = 'MC_CEN'
      const htmlLower = html.toLowerCase()
      if (htmlLower.includes('portero') || htmlLower.includes('guardameta')) {
        posicion = 'POR'
        posicionDetallada = 'POR'
      } else if (htmlLower.includes('central') || htmlLower.includes('defensa central')) {
        posicion = 'DFC'
        posicionDetallada = 'DFC'
      } else if (htmlLower.includes('lateral izquierdo') || htmlLower.includes('carrilero zurdo')) {
        posicion = 'LAT'
        posicionDetallada = 'LAT_IZQ'
      } else if (htmlLower.includes('lateral derecho') || htmlLower.includes('lateral')) {
        posicion = 'LAT'
        posicionDetallada = 'LAT_DER'
      } else if (htmlLower.includes('pivote') || htmlLower.includes('mediocentro defensivo')) {
        posicion = 'MCD'
        posicionDetallada = 'MCD'
      } else if (htmlLower.includes('extremo izquierdo')) {
        posicion = 'EXT'
        posicionDetallada = 'EXT_IZQ'
      } else if (htmlLower.includes('extremo derecho') || htmlLower.includes('extremo')) {
        posicion = 'EXT'
        posicionDetallada = 'EXT_DER'
      } else if (htmlLower.includes('delantero') || htmlLower.includes('atacante')) {
        posicion = 'DC'
        posicionDetallada = 'DC'
      }

      // Extraer foto
      let fotoUrl: string | null = null
      if (beSoccerId) {
        const photoCandidate = `https://cdn.resfu.com/img_data/players/medium/${beSoccerId}.jpg?size=340x&lossy=1`
        try {
          const imgRes = await fetch(photoCandidate, {
            headers: {
              'User-Agent': 'Mozilla/5.0',
              'Referer': 'https://www.besoccer.es/'
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

              // Subir a Supabase Storage también
              try {
                await supabase.storage.from('jugadores').upload(`${beSoccerId}.jpg`, buffer, {
                  contentType: 'image/jpeg',
                  upsert: true
                })
              } catch (e) {}
            }
          }
        } catch (e) {}
      }

      // Extraer edad / fecha nacimiento
      let fechaNacimiento = '2001-01-01'
      const fnMatch = html.match(/(\d{2})[\/\-](\d{2})[\/\-](\d{4})/)
      if (fnMatch) {
        fechaNacimiento = `${fnMatch[3]}-${fnMatch[2]}-${fnMatch[1]}`
      }

      return NextResponse.json({
        success: true,
        player: {
          nombre,
          apellidos,
          club_nombre: clubNombre,
          posicion,
          posicion_detallada: posicionDetallada,
          pie_preferido: htmlLower.includes('zurdo') ? 'izquierdo' : 'derecho',
          fecha_nacimiento: fechaNacimiento,
          altura_cm: 180,
          peso_kg: 74,
          categoria: htmlLower.includes('segunda federación') || htmlLower.includes('segunda rfef') ? 'Segunda RFEF' : 'Tercera RFEF',
          valor_mercado: '30.000 €',
          fin_contrato: '30 JUN 2026',
          score_global: 75,
          foto_url: fotoUrl
        }
      })
    }

    // 2. Caso LaPreferente u otros portales
    const generalRes = await fetch(trimmedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    })

    if (!generalRes.ok) {
      return NextResponse.json({ error: 'No se pudo acceder a la página web indicada' }, { status: 422 })
    }

    const htmlGen = await generalRes.text()
    const ogTitleMatch = htmlGen.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i)
      || htmlGen.match(/<title>([^<]+)<\/title>/i)
    const rawTitle = ogTitleMatch ? ogTitleMatch[1].trim() : 'Jugador Scouted'
    const parts = rawTitle.split(/[-|–,]/)
    const rawName = parts[0].trim()
    const nameArr = rawName.split(' ')

    return NextResponse.json({
      success: true,
      player: {
        nombre: nameArr[0] || 'Jugador',
        apellidos: nameArr.slice(1).join(' ') || 'Scouted',
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
        foto_url: null
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
