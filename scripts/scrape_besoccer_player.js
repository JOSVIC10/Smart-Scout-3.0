const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const MONTH_MAP = {
  enero: '01', febrero: '02', marzo: '03', abril: '04',
  mayo: '05', junio: '06', julio: '07', agosto: '08',
  septiembre: '09', octubre: '10', noviembre: '11', diciembre: '12'
};

function parseSpanishDate(str) {
  if (!str) return null;
  const slashMatch = str.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (slashMatch) {
    return `${slashMatch[3]}-${slashMatch[2].padStart(2, '0')}-${slashMatch[1].padStart(2, '0')}`;
  }
  const wordMatch = str.match(/(\d{1,2})\s+(?:de\s+)?([A-Za-zñáéíóú]+)\s+(?:de\s+)?(\d{4})/i);
  if (wordMatch) {
    const day = wordMatch[1].padStart(2, '0');
    const month = MONTH_MAP[wordMatch[2].toLowerCase()] || '01';
    return `${wordMatch[3]}-${month}-${day}`;
  }
  return null;
}

function mapPosition(posTag = '', detailStr = '', foot = 'derecho') {
  const combined = (posTag + ' ' + detailStr).toUpperCase().trim();

  // Portero
  if (combined.includes('PORTERO') || combined.includes('GUARDAMETA') || combined === 'POR' || combined === 'PT' || combined === 'GK') {
    return { posicion: 'POR', posicion_detallada: 'POR' };
  }

  // Lateral Derecho
  if (combined.includes('LATERAL DERECHO') || combined.includes('LAT_DER') || combined === 'LD' || combined.includes(' LD') || combined.includes('RB')) {
    return { posicion: 'LAT', posicion_detallada: 'LAT_DER' };
  }

  // Lateral Izquierdo
  if (combined.includes('LATERAL IZQUIERDO') || combined.includes('LAT_IZQ') || combined === 'LI' || combined.includes(' LI') || combined.includes('LB')) {
    return { posicion: 'LAT', posicion_detallada: 'LAT_IZQ' };
  }

  // Defensa Central
  if (combined.includes('DEFENSA CENTRAL') || combined.includes('CENTRAL') || combined.includes('DFC') || combined === 'CB') {
    return { posicion: 'DFC', posicion_detallada: 'DFC' };
  }

  // Lateral genérico
  if (combined.includes('LATERAL') || combined.includes('CARRILERO')) {
    return { posicion: 'LAT', posicion_detallada: foot === 'izquierdo' ? 'LAT_IZQ' : 'LAT_DER' };
  }

  // Mediocentro defensivo / Pivote
  if (combined.includes('PIVOTE') || combined.includes('MCD') || combined.includes('DEFENSIVO') || combined === 'CDM' || combined === 'DM') {
    return { posicion: 'MCD', posicion_detallada: 'MCD' };
  }

  // Mediapunta / Centrocampista ofensivo
  if (combined.includes('MEDIAPUNTA') || combined.includes('MP') || combined.includes('MCO') || combined.includes('CAM') || combined.includes('OFENSIVO')) {
    return { posicion: 'MC', posicion_detallada: 'MC_CEN' };
  }

  // Extremo Derecho
  if (combined.includes('EXTREMO DERECHO') || combined.includes('EXT_DER') || combined === 'ED' || combined.includes('RW')) {
    return { posicion: 'EXT', posicion_detallada: 'EXT_DER' };
  }

  // Extremo Izquierdo
  if (combined.includes('EXTREMO IZQUIERDO') || combined.includes('EXT_IZQ') || combined === 'EI' || combined.includes('LW')) {
    return { posicion: 'EXT', posicion_detallada: 'EXT_IZQ' };
  }

  // Extremo genérico
  if (combined.includes('EXTREMO') || combined.includes('WINGER')) {
    return { posicion: 'EXT', posicion_detallada: foot === 'izquierdo' ? 'EXT_IZQ' : 'EXT_DER' };
  }

  // Interior Derecho
  if (combined.includes('INTERIOR DERECHO') || combined.includes('MC_DER') || combined === 'MD' || combined.includes('RM')) {
    return { posicion: 'MC', posicion_detallada: 'MC_DER' };
  }

  // Interior Izquierdo
  if (combined.includes('INTERIOR IZQUIERDO') || combined.includes('MC_IZQ') || combined === 'MI' || combined.includes('LM')) {
    return { posicion: 'MC', posicion_detallada: 'MC_IZQ' };
  }

  // Mediocentro
  if (combined.includes('MEDIOCENTRO') || combined.includes('CENTROCAMPISTA') || combined === 'MC' || combined === 'CM' || combined === 'CEN') {
    return { posicion: 'MC', posicion_detallada: 'MC_CEN' };
  }

  // Delantero Centro
  if (combined.includes('DELANTERO') || combined.includes('ATACANTE') || combined === 'DC' || combined === 'ST' || combined === 'CF') {
    return { posicion: 'DC', posicion_detallada: 'DC' };
  }

  // Defensa genérico
  if (combined.includes('DEF') || combined.includes('DF')) {
    return { posicion: 'DFC', posicion_detallada: 'DFC' };
  }

  return { posicion: 'MC', posicion_detallada: 'MC_CEN' };
}

function splitName(fullName) {
  if (!fullName) return { nombre: 'Jugador', apellidos: 'Observado' };
  const clean = fullName.replace(/^(?:Estadísticas\s+(?:de\s+)?|Ficha\s+(?:de\s+)?)/i, '').trim();
  const parts = clean.split(/\s+/);
  if (parts.length === 1) return { nombre: parts[0], apellidos: '' };
  if (parts.length === 2) return { nombre: parts[0], apellidos: parts[1] };
  if (parts.length === 3) return { nombre: parts[0], apellidos: `${parts[1]} ${parts[2]}` };
  
  const compoundFirstNames = ['juan', 'jose', 'josé', 'antonio', 'maria', 'maría', 'carlos', 'luis', 'miguel', 'ángel', 'angel', 'francisco', 'javier', 'víctor', 'victor'];
  if (compoundFirstNames.includes(parts[0].toLowerCase()) && compoundFirstNames.includes(parts[1].toLowerCase())) {
    return { nombre: `${parts[0]} ${parts[1]}`, apellidos: parts.slice(2).join(' ') };
  }
  return { nombre: parts[0], apellidos: parts.slice(1).join(' ') };
}

async function scrapeBeSoccerPlayer(targetUrl) {
  let browser = null;
  try {
    let cleanUrl = targetUrl.trim().split('?')[0].split('#')[0].replace(/\/+$/, '')
      .replace(/\/jugador\/trayectoria\//i, '/jugador/')
      .replace(/https?:\/\/(www\.)?besoccer\.(com|es)\/player\//i, 'https://es.besoccer.com/jugador/')
      .replace(/https?:\/\/(www\.)?besoccer\.es/i, 'https://es.besoccer.com');
    if (!cleanUrl.startsWith('http')) cleanUrl = `https://${cleanUrl}`;

    const matchId = cleanUrl.match(/-(\d+)$/) || cleanUrl.match(/\/(\d+)$/);
    const beSoccerId = matchId ? matchId[1] : null;

    browser = await chromium.launch({
      headless: true,
      args: [
        '--disable-blink-features=AutomationControlled',
        '--no-sandbox',
        '--disable-setuid-sandbox'
      ]
    });

    const context = await browser.newContext({
      viewport: { width: 1536, height: 900 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      locale: 'es-ES',
      extraHTTPHeaders: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
        'Sec-Ch-Ua': '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"Windows"',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1'
      }
    });

    const page = await context.newPage();
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    });

    await page.goto(cleanUrl, { waitUntil: 'domcontentloaded', timeout: 25000 });
    try {
      await page.waitForSelector('.panel-subtitle, [data-cy="playerSeason"], .stat-list', { timeout: 6000 });
    } catch (e) {
      await page.waitForTimeout(2000);
    }

    const extracted = await page.evaluate(() => {
      const fullText = document.body.innerText;
      const fullHtml = document.documentElement.innerHTML;

      // 1. FULL NAME
      let biographicalName = '';
      
      // Target profile card directly
      const statList = document.querySelector('.panel-body.stat-list, .stat-list');
      const profilePanel = statList ? statList.closest('.panel') : document.querySelector('.panel-head.ta-c')?.closest('.panel');
      
      if (profilePanel) {
        const sub = profilePanel.querySelector('.panel-subtitle');
        if (sub && sub.innerText.trim() && !/partidos|temporada/i.test(sub.innerText)) {
          biographicalName = sub.innerText.trim();
        }
      }

      if (!biographicalName) {
        const subNameEl = document.querySelector('.sub-name');
        if (subNameEl && subNameEl.innerText.trim()) biographicalName = subNameEl.innerText.trim();
      }

      if (!biographicalName) {
        const allSubs = Array.from(document.querySelectorAll('.panel-subtitle'));
        for (const el of allSubs) {
          const t = el.innerText.trim();
          if (t && !/partidos|temporada|oficiales|trayectoria|rendimiento|clubes|logros/i.test(t) && t.split(/\s+/).length >= 2) {
            biographicalName = t;
            break;
          }
        }
      }

      const h1El = document.querySelector('h1.head-title, .head-title, h1');
      const headerTitle = h1El?.innerText?.trim()?.replace(/^Estadísticas\s+(de\s+)?/i, '') || '';

      // 2. BIRTH DATE
      let birthText = '';
      const bornEl = profilePanel ? profilePanel.querySelector('.ta-c.mh10 p, p.color-grey2') : document.querySelector('p.color-grey2');
      if (bornEl) {
        const bMatch = bornEl.innerText.match(/Nacido el\s+(\d{1,2}\s+[A-Za-zñáéíóú]+\s+\d{4})/i);
        if (bMatch) birthText = bMatch[1].trim();
      }
      if (!birthText) {
        const bMatch = fullText.match(/Nacido el\s+(\d{1,2}\s+[A-Za-zñáéíóú]+\s+\d{4})/i);
        if (bMatch) birthText = bMatch[1].trim();
      }

      // 3. STATS GRID: height, weight, market value, ELO, dorsal, position tag
      let height = null;
      let weight = null;
      let marketValue = null;
      let elo = null;
      let dorsal = null;
      let posTag = '';
      let nationality = '';

      const statEls = Array.from(document.querySelectorAll('.stat-list .stat'));
      for (const st of statEls) {
        const big = st.querySelector('.big-row')?.innerText?.trim() || '';
        const smalls = Array.from(st.querySelectorAll('.small-row')).map(s => s.innerText.trim());
        const round = st.querySelector('.round-row')?.innerText?.trim() || '';
        const role = st.querySelector('.bg-role')?.innerText?.trim() || '';

        for (const sm of smalls) {
          const sml = sm.toLowerCase();
          if (sml.includes('cms') || sml === 'cm') {
            if (big) height = parseInt(big, 10);
          } else if (sml.includes('kgs') || sml === 'kg') {
            if (big) weight = parseInt(big, 10);
          } else if (sml.includes('k.€') || sml.includes('k€') || sml.includes('m.€') || sml.includes('m€')) {
            if (big) marketValue = `${big} ${sm}`;
          } else if (sml === 'elo') {
            if (round) elo = parseInt(round, 10);
            else if (big) elo = parseInt(big, 10);
          } else if (sml === 'dorsal') {
            if (round) dorsal = parseInt(round, 10);
            else if (big) dorsal = parseInt(big, 10);
          } else if (sml === 'posición' || sml === 'posicion') {
            if (role) posTag = role;
            else if (round) posTag = round;
          } else if (sm.length > 2 && !/años|cms|kgs|elo|dorsal|posición/i.test(sm)) {
            if (!nationality && st.querySelector('img')) {
              nationality = sm;
            }
          }
        }
      }

      // Text fallbacks for stats
      if (!height) {
        const hm = fullText.match(/(\d{3})\s*cms?/i);
        if (hm) height = parseInt(hm[1], 10);
      }
      if (!weight) {
        const wm = fullText.match(/(\d{2,3})\s*kgs?/i);
        if (wm) weight = parseInt(wm[1], 10);
      }
      if (!elo) {
        const em = fullText.match(/(\d{2,3})\s*\n?\s*ELO/i);
        if (em) elo = parseInt(em[1], 10);
      }
      if (!dorsal) {
        const dm = fullText.match(/(\d{1,2})\s*\n?\s*dorsal/i);
        if (dm) dorsal = parseInt(dm[1], 10);
      }
      if (!marketValue) {
        const vm = fullText.match(/(\d+(?:[.,]\d+)?)\s*\n?\s*(K\.€|M\.€|K€|M€)/i);
        if (vm) marketValue = `${vm[1]} ${vm[2]}`;
      }

      // 4. NATIONALITY & PREFERRED FOOT from personal data table
      let foot = 'derecho';
      const tableRows = Array.from(document.querySelectorAll('.table-body .table-row'));
      for (const r of tableRows) {
        const txt = r.innerText.trim();
        if (/País de nacimiento|Nacionalidad/i.test(txt)) {
          const cells = Array.from(r.querySelectorAll('div, a')).map(c => c.innerText.trim()).filter(Boolean);
          if (cells.length > 1 && !nationality) {
            nationality = cells[cells.length - 1];
          }
        }
        if (/Pie preferido/i.test(txt)) {
          if (txt.toLowerCase().includes('izq')) foot = 'izquierdo';
          else if (txt.toLowerCase().includes('amb')) foot = 'ambos';
          else if (txt.toLowerCase().includes('der')) foot = 'derecho';
        }
      }

      if (!nationality) nationality = 'España';

      // 5. CURRENT CLUB
      let currentClub = '';
      const teamEl = document.querySelector('[data-cy="currentTeam"]');
      if (teamEl) currentClub = teamEl.innerText.trim();
      if (!currentClub) {
        const shieldEl = document.querySelector('.image-cell.shield span');
        if (shieldEl) currentClub = shieldEl.innerText.trim();
      }
      if (!currentClub) currentClub = 'Sin equipo';

      // 6. POSITION DETAILS
      let posDetailText = '';
      const mainPosEl = document.querySelector('[data-cy="mainPos"] + .main-role span, .main-role span');
      if (mainPosEl) posDetailText = mainPosEl.innerText.trim();
      
      const bestPosBadge = document.querySelector('.field .pos-best');
      if (bestPosBadge && !posTag) posTag = bestPosBadge.innerText.trim();

      // 7. CATEGORY
      let categoria = 'Tercera RFEF';
      if (fullText.includes('Segunda Federación') || fullText.includes('Segunda RFEF')) {
        categoria = 'Segunda RFEF';
      } else if (fullText.includes('Tercera Federación') || fullText.includes('Tercera RFEF')) {
        categoria = 'Tercera RFEF';
      }

      // 8. SEASON STATS from data-cy="playerSeason"
      let est_partidos = 0;
      let est_minutos = 0;
      let est_goles = 0;
      let est_asistencias = 0;
      let est_amarillas = 0;
      let est_rojas = 0;

      const seasonPanel = document.querySelector('[data-cy="playerSeason"]');
      if (seasonPanel) {
        const cols = Array.from(seasonPanel.querySelectorAll('.item-col'));
        for (const col of cols) {
          const main = col.querySelector('.main-line')?.innerText?.trim() || '';
          const other = col.querySelector('.other-line')?.innerText?.trim() || '';
          const otherLower = other.toLowerCase().trim();
          const yCard = col.querySelector('.yellow-card')?.innerText?.trim();
          const rCard = col.querySelector('.red-card')?.innerText?.trim();

          if (otherLower === 'partidos') {
            est_partidos = parseInt(main, 10) || 0;
          } else if (otherLower.includes('minutos')) {
            est_minutos = parseInt(main.replace(/['′]/g, ''), 10) || 0;
          } else if (otherLower.includes('goles') && !otherLower.includes('concedidos')) {
            est_goles = parseInt(main, 10) || 0;
          }
          if (yCard !== undefined && yCard !== null) {
            est_amarillas = parseInt(yCard, 10) || 0;
          }
          if (rCard !== undefined && rCard !== null) {
            est_rojas = parseInt(rCard, 10) || 0;
          }
        }
      }

      // Check complete season (2025/26) if current season has < 5 matches or 0
      const allParentRows = Array.from(document.querySelectorAll('tr.parent_row:not(.sub-row)'));
      if (est_partidos < 5 && allParentRows.length > 0) {
        let bestRow = allParentRows.find(r => /2025\/26|2025-26/.test(r.innerText)) || allParentRows[0];
        if (bestRow) {
          const prcTds = Array.from(bestRow.querySelectorAll('td[data-content-tab="tprc1"]')).map(td => td.textContent.trim());
          const ptcTds = Array.from(bestRow.querySelectorAll('td[data-content-tab="tptc1"]')).map(td => td.textContent.trim());

          if (prcTds.length >= 5) {
            const pj = parseInt(prcTds[0], 10) || 0;
            if (pj >= 5 || est_partidos === 0) {
              est_partidos = pj;
              est_goles = parseInt(prcTds[1], 10) || 0;
              est_asistencias = parseInt(prcTds[2], 10) || 0;
              est_amarillas = parseInt(prcTds[3], 10) || 0;
              est_rojas = parseInt(prcTds[4], 10) || 0;
              const minStr = ptcTds.length >= 4 ? ptcTds[3].replace(/['′]/g, '') : '';
              est_minutos = parseInt(minStr, 10) || (est_partidos * 80);
            }
          }
        }
      }

      if (est_minutos === 0 && est_partidos > 0) {
        est_minutos = est_partidos * 75;
      }

      return {
        biographicalName,
        headerTitle,
        birthText,
        nationality,
        height,
        weight,
        dorsal,
        elo,
        marketValue,
        currentClub,
        posTag,
        posDetailText,
        foot,
        categoria,
        est_partidos,
        est_minutos,
        est_goles,
        est_asistencias,
        est_amarillas,
        est_rojas,
        fullHtml
      };
    });

    await browser.close();
    browser = null;

    // Fallback: If biographicalName is still missing, parse from fullHtml
    let finalBioName = extracted.biographicalName;
    if (!finalBioName) {
      const match = extracted.fullHtml.match(/<h2 class=["']panel-title["'][^>]*>[^<]*<\/h2>\s*<div\s+class=["']panel-subtitle["'][^>]*>([^<]+)<\/div>/i);
      if (match && match[1].trim() && !/partidos|temporada/i.test(match[1])) {
        finalBioName = match[1].trim();
      }
    }
    if (!finalBioName) {
      finalBioName = extracted.headerTitle || 'Jugador';
    }

    const { nombre, apellidos } = splitName(finalBioName);
    const { posicion, posicion_detallada } = mapPosition(extracted.posTag, extracted.posDetailText, extracted.foot);
    const fecha_nacimiento = parseSpanishDate(extracted.birthText);

    let score_global = 75;
    if (extracted.elo && extracted.elo > 20) {
      score_global = Math.min(95, Math.max(55, Math.round(55 + (extracted.elo - 20) * 0.75)));
    }

    let valorMercado = extracted.marketValue || '25 K€';
    const mvMatch = valorMercado.match(/(\d+(?:[.,]\d+)?)\s*(K\.?€|M\.?€)/i);
    if (mvMatch) {
      const num = parseFloat(mvMatch[1].replace(',', '.'));
      const unit = mvMatch[2].toUpperCase().replace('.', '');
      if (unit.includes('M')) {
        valorMercado = `${(num * 1000000).toLocaleString('es-ES')} €`;
      } else if (unit.includes('K')) {
        valorMercado = `${(num * 1000).toLocaleString('es-ES')} €`;
      }
    }

    let foto_url = null;
    if (beSoccerId) {
      foto_url = `https://cdn.resfu.com/img_data/players/medium/${beSoccerId}.jpg?size=340x&lossy=1`;
    }

    return {
      nombre,
      apellidos,
      club_nombre: extracted.currentClub,
      posicion,
      posicion_detallada,
      pie_preferido: extracted.foot,
      fecha_nacimiento: fecha_nacimiento || '2001-01-01',
      altura_cm: extracted.height || 180,
      peso_kg: extracted.weight || 74,
      nacionalidad: extracted.nationality,
      categoria: extracted.categoria,
      valor_mercado: valorMercado,
      fin_contrato: '30 JUN 2026',
      score_global,
      foto_url,
      est_partidos: extracted.est_partidos,
      est_minutos: extracted.est_minutos,
      est_goles: posicion === 'POR' ? 0 : extracted.est_goles,
      est_asistencias: posicion === 'POR' ? 0 : extracted.est_asistencias,
      est_amarillas: extracted.est_amarillas,
      est_rojas: extracted.est_rojas
    };
  } catch (err) {
    if (browser) await browser.close();
    throw err;
  }
}

if (require.main === module) {
  const url = process.argv[2] || 'https://es.besoccer.com/jugador/j-peries-3374662';
  scrapeBeSoccerPlayer(url)
    .then(data => {
      console.log(JSON.stringify(data));
    })
    .catch(err => {
      console.error('Scrape error:', err);
      process.exit(1);
    });
}

module.exports = { scrapeBeSoccerPlayer };
