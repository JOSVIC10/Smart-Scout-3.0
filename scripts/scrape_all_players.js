const { chromium } = require('playwright');

const SUPABASE_URL = 'https://mnfxjxorffxnuxpdzzzd.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1uZnhqeG9yZmZ4bnV4cGR6enpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxODQzNDIsImV4cCI6MjEwMDc2MDM0Mn0.EvAmPcHsgIzJLhFZUlPfp9ujjQr2OfXX4ANnIZifdAc';

// Helper to delay
const delay = ms => new Promise(res => setTimeout(res, ms));

async function getPlayerStats(page, url) {
    if (!url || url.includes('/equipo/') || url.includes('/rankings/')) {
        return null;
    }
    
    let retries = 3;
    let html = '';
    while (retries > 0) {
        try {
            await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
            await delay(1000); // Wait for potential cloudflare challenge
            html = await page.content();
            if (!html.includes('Cloudflare') && !html.includes('Just a moment')) {
                break;
            }
        } catch (e) {
            console.log(`Timeout navigating to ${url}`);
        }
        console.log(`Cloudflare encountered on ${url}, retrying...`);
        retries--;
        await delay(5000);
    }
    
    if (retries === 0) return null;

    const stats = {};
    
    // Extract Age
    const ageMatch = html.match(/(\d{2}) años/);
    if (ageMatch) {
        const age = parseInt(ageMatch[1], 10);
        const currentYear = 2026;
        const birthYear = currentYear - age;
        stats.fecha_nacimiento = `${birthYear}-01-01`; // Approximation
    }

    // Extract Last Team (for futuribles)
    const teamMatch = html.match(/class="team-name"[^>]*>([^<]+)<\/a>/);
    if (teamMatch) {
        stats.ultimo_equipo = teamMatch[1].trim();
    }
    
    // Extract Stats Table
    const rendMatch = html.match(/class=["']panel-title["']>Rendimiento profesional[\s\S]*?<\/table>/i);
    if (rendMatch) {
        const tableHtml = rendMatch[0];
        
        // 2025-2026 Stats (Historical)
        const row2526 = tableHtml.match(/<td>2025-26<\/td>\s*<td>([^<]+)<\/td>[\s\S]*?<tr/i) || tableHtml.match(/<td>2025-26<\/td>([\s\S]*?)<\/tr>/i);
        if (row2526) {
            const cells = row2526[0].match(/<td[^>]*>(.*?)<\/td>/g);
            if (cells && cells.length >= 8) {
                stats.est_partidos = parseInt(cells[2].replace(/<[^>]+>/g, ''), 10) || 0;
                stats.est_minutos = parseInt(cells[4].replace(/<[^>]+>/g, ''), 10) || 0;
                stats.est_amarillas = parseInt(cells[5].replace(/<[^>]+>/g, ''), 10) || 0;
                stats.est_rojas = parseInt(cells[6].replace(/<[^>]+>/g, ''), 10) || 0;
                stats.est_goles = parseInt(cells[7].replace(/<[^>]+>/g, ''), 10) || 0;
                if (cells[8]) stats.est_asistencias = parseInt(cells[8].replace(/<[^>]+>/g, ''), 10) || 0;
            }
        }
        
        // 2026-2027 Stats (Current) - Usually "Últimos 365 días" or "2026-27"
        const rowCurrent = tableHtml.match(/<td>(Últimos 365 días|2026-27)<\/td>([\s\S]*?)<\/tr>/i);
        if (rowCurrent) {
            const cells = rowCurrent[0].match(/<td[^>]*>(.*?)<\/td>/g);
            if (cells && cells.length >= 8) {
                stats.partidos_analizados = parseInt(cells[2].replace(/<[^>]+>/g, ''), 10) || 0;
                stats.minutos_jugados = parseInt(cells[4].replace(/<[^>]+>/g, ''), 10) || 0;
                stats.act_amarillas = parseInt(cells[5].replace(/<[^>]+>/g, ''), 10) || 0;
                stats.act_rojas = parseInt(cells[6].replace(/<[^>]+>/g, ''), 10) || 0;
                stats.act_goles = parseInt(cells[7].replace(/<[^>]+>/g, ''), 10) || 0;
                if (cells[8]) stats.act_asistencias = parseInt(cells[8].replace(/<[^>]+>/g, ''), 10) || 0;
            }
        }
    }
    
    return stats;
}

async function run() {
    console.log('Fetching players from Supabase...');
    const res = await fetch(SUPABASE_URL + '/rest/v1/jugadores?select=id,nombre,apellidos,foto_url,club_id', {
        headers: { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY }
    });
    const players = await res.json();
    
    // Filter to FE Grama and Futuribles (club_id is null)
    const targetPlayers = players.filter(p => 
        p.club_id === 'e0000001-0000-0000-0000-000000000001' || p.club_id === null
    );
    
    console.log(`Found ${targetPlayers.length} players to update.`);

    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    // Use an agent to look like a real browser
    await page.setExtraHTTPHeaders({
        'Accept-Language': 'es-ES,es;q=0.9',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'
    });

    for (let i = 0; i < targetPlayers.length; i++) {
        const p = targetPlayers[i];
        let url = null;
        
        // Reconstruct URL from foto_url if possible
        if (p.foto_url && p.foto_url.includes('cdn.resfu.com/img_data/players/medium/')) {
            const idMatch = p.foto_url.match(/medium\/(\d+)\.jpg/);
            if (idMatch) {
                // We don't know the slug, but BeSoccer redirects to the correct slug if we pass the ID!
                // Actually BeSoccer format is: /jugador/slug-ID
                url = `https://es.besoccer.com/jugador/jugador-${idMatch[1]}`;
            }
        }
        
        if (!url) {
            console.log(`[${i+1}/${targetPlayers.length}] No URL for ${p.nombre} ${p.apellidos}, skipping.`);
            continue;
        }

        console.log(`[${i+1}/${targetPlayers.length}] Scraping ${p.nombre} ${p.apellidos} (${url})...`);
        const stats = await getPlayerStats(page, url);
        
        if (stats && Object.keys(stats).length > 0) {
            console.log(`  -> Found stats: Age approx ${stats.fecha_nacimiento}, 2025-26 PJ: ${stats.est_partidos}`);
            
            // Patch in Supabase
            const patchRes = await fetch(SUPABASE_URL + `/rest/v1/jugadores?id=eq.${p.id}`, {
                method: 'PATCH',
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': 'Bearer ' + SUPABASE_KEY,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(stats)
            });
            
            if (patchRes.ok) {
                console.log(`  ✅ Updated DB`);
            } else {
                console.log(`  ❌ Failed to update DB`);
            }
        } else {
            console.log(`  ⚠️ No stats extracted`);
        }
        
        await delay(2000); // Sleep between requests to avoid rate limits
    }

    await browser.close();
    console.log('All done!');
}

run();
