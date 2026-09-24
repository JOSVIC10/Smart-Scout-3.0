import { NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs'
import { execFile, execSync } from 'child_process'
import { promisify } from 'util'
import { createClient } from '@supabase/supabase-js'

const execFileAsync = promisify(execFile)

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

    // ==========================================
    // 1. CASO BESOCCER: Extracción precisa con Playwright
    // ==========================================
    if (isBeSoccer) {
      let targetUrl = trimmedUrl.split('?')[0].split('#')[0].replace(/\/+$/, '')
      targetUrl = targetUrl.replace(/https?:\/\/(www\.)?besoccer\.es/i, 'https://es.besoccer.com')
      if (!targetUrl.startsWith('http')) targetUrl = `https://${targetUrl}`

      const matchId = targetUrl.match(/-(\d+)$/) || targetUrl.match(/\/(\d+)$/)
      const beSoccerId = matchId ? matchId[1] : null

      try {
        let player: any = null

        // Intento 1: Jina AI Reader Cloudflare-Bypass (Optimizado para Vercel Serverless)
        try {
          const { scrapeViaJina } = require('@/lib/scraper/besoccer_jina')
          const jinaPlayer = await scrapeViaJina(targetUrl)
          if (jinaPlayer && !jinaPlayer.nombre.toLowerCase().includes('client') && !jinaPlayer.apellidos.toLowerCase().includes('challenge')) {
            player = jinaPlayer
          }
        } catch (jinaErr: any) {
          console.warn('Jina Cloudflare bypass failed, trying native HTML parser:', jinaErr.message)
        }

        // Intento 2: Parser nativo ultra-rápido (cuando no hay bloqueo de IP)
        if (!player) {
          try {
            const { parseBeSoccerHtml } = require('@/lib/scraper/besoccer_html')
            const htmlPlayer = await parseBeSoccerHtml(targetUrl)
            if (htmlPlayer && !htmlPlayer.nombre.toLowerCase().includes('client') && !htmlPlayer.apellidos.toLowerCase().includes('challenge')) {
              player = htmlPlayer
            }
          } catch (htmlErr: any) {
            console.warn('Native HTML parser failed, trying Playwright fallback:', htmlErr.message)
          }
        }

        // Intento 3: Llamada directa in-process Playwright (Local)
        if (!player) {
          try {
            const { scrapeBeSoccerPlayer } = require('@/lib/scraper/besoccer')
            player = await scrapeBeSoccerPlayer(targetUrl)
          } catch (inProcessErr: any) {
            console.warn('In-process Playwright failed, trying child process:', inProcessErr.message)
          }
        }

        // Intento 3: Child process buscando en todas las rutas posibles (Local)
        if (!player) {
          const possiblePaths = [
            path.join(process.cwd(), 'smart-scout', 'scripts', 'scrape_besoccer_player.js'),
            path.join(process.cwd(), 'scripts', 'scrape_besoccer_player.js'),
            path.join(process.cwd(), 'lib', 'scraper', 'besoccer.js'),
            path.join(__dirname, '..', '..', '..', 'scripts', 'scrape_besoccer_player.js'),
            path.join(__dirname, '..', '..', '..', 'lib', 'scraper', 'besoccer.js'),
            'c:\\Users\\Jose Vicente\\Desktop\\Smart Scout 3.0\\smart-scout\\scripts\\scrape_besoccer_player.js',
            'c:\\Users\\Jose Vicente\\Desktop\\Smart Scout 3.0\\scripts\\scrape_besoccer_player.js'
          ]
          const scriptPath = possiblePaths.find(p => fs.existsSync(p)) || possiblePaths[0]

          const { stdout } = await execFileAsync('node', [scriptPath, targetUrl], {
            timeout: 45000,
            maxBuffer: 15 * 1024 * 1024
          })
          const rawOutput = (stdout || '').trim()
          const startIdx = rawOutput.indexOf('{')
          const endIdx = rawOutput.lastIndexOf('}')
          if (startIdx !== -1 && endIdx !== -1) {
            player = JSON.parse(rawOutput.substring(startIdx, endIdx + 1))
          } else {
            player = JSON.parse(rawOutput)
          }
        }

        if (player) {
          // Gestionar foto del jugador (CDN, Local si es posible, o Supabase Storage para Vercel)
          if (beSoccerId) {
            const cdnPhoto = `https://cdn.resfu.com/img_data/players/medium/${beSoccerId}.jpg?size=340x&lossy=1`
            player.foto_url = cdnPhoto

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
                  // 1. Guardar en local solo si el filesystem lo permite (no en Vercel read-only)
                  try {
                    const publicDir = path.join(process.cwd(), 'public', 'jugadores')
                    if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true })
                    const localPath = path.join(publicDir, `${beSoccerId}.jpg`)
                    fs.writeFileSync(localPath, buffer)
                    player.foto_url = `/jugadores/${beSoccerId}.jpg`
                  } catch (fsErr) {
                    // Filesystem read-only (común en Vercel Serverless)
                  }

                  // 2. Subir a Supabase Storage y obtener URL pública permanente
                  try {
                    const { error: upErr } = await supabase.storage.from('jugadores').upload(`${beSoccerId}.jpg`, buffer, {
                      contentType: 'image/jpeg',
                      upsert: true
                    })
                    if (!upErr) {
                      const { data: publicUrlData } = supabase.storage.from('jugadores').getPublicUrl(`${beSoccerId}.jpg`)
                      if (publicUrlData?.publicUrl) {
                        player.foto_url = publicUrlData.publicUrl
                      }
                    }
                  } catch (storageErr) {}
                }
              }
            } catch (imgErr) {
              // Mantiene cdnPhoto como foto_url si falla la descarga
            }
          }

          return NextResponse.json({
            success: true,
            player
          })
        }
      } catch (scrapeErr: any) {
        console.error('All BeSoccer scraper attempts failed:', scrapeErr)
        return NextResponse.json(
          { error: `Error al extraer datos de BeSoccer: ${scrapeErr.message}` },
          { status: 500 }
        )
      }
    }

    // ==========================================
    // 2. OTROS PORTALES (LaPreferente, Transfermarkt, etc.) o Fallback
    // ==========================================
    let htmlGen = ''
    try {
      const curlCmd = `curl -s -L -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36" -H "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8" -H "Accept-Language: es-ES,es;q=0.9" "${trimmedUrl}"`
      htmlGen = execSync(curlCmd, { encoding: 'utf8', maxBuffer: 25 * 1024 * 1024, timeout: 10000 })
    } catch (e) {
      try {
        const generalRes = await fetch(trimmedUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
          }
        })
        if (generalRes.ok) {
          htmlGen = await generalRes.text()
        }
      } catch (fErr) {}
    }

    let rawTitle = ''
    const ogTitleMatch = htmlGen.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i)
      || htmlGen.match(/<title>([^<]+)<\/title>/i)

    if (ogTitleMatch) {
      const titleCandidate = ogTitleMatch[1].trim()
      if (!/challenge|moment|cloudflare|turnstile|captcha|access denied/i.test(titleCandidate)) {
        rawTitle = titleCandidate
      }
    }

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
        peso_kg: 74,
        nacionalidad: 'España',
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
