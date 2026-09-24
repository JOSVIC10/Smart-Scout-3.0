// ============================================================================
// Smart Scout 3.0 — Parser nativo BeSoccer compatible con Vercel Serverless
// Sin dependencias de Chromium ni navegadores pesados; ultra-rápido (<500ms).
// ============================================================================

const MONTH_MAP = {
  enero: '01', febrero: '02', marzo: '03', abril: '04',
  mayo: '05', junio: '06', julio: '07', agosto: '08',
  septiembre: '09', octubre: '10', noviembre: '11', diciembre: '12'
};

function parseSpanishDate(str) {
  if (!str) return null;
  const isoMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) return str;

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

async function parseBeSoccerHtml(targetUrl) {
  let cleanUrl = targetUrl.trim().split('?')[0].split('#')[0].replace(/\/+$/, '')
    .replace(/\/jugador\/trayectoria\//i, '/jugador/')
    .replace(/https?:\/\/(www\.)?besoccer\.(com|es)\/player\//i, 'https://es.besoccer.com/jugador/')
    .replace(/https?:\/\/(www\.)?besoccer\.es/i, 'https://es.besoccer.com');
  if (!cleanUrl.startsWith('http')) cleanUrl = `https://${cleanUrl}`;

  const matchId = cleanUrl.match(/-(\d+)$/) || cleanUrl.match(/\/(\d+)$/);
  const beSoccerId = matchId ? matchId[1] : null;

  const userAgents = [
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36'
  ];

  let res = null;
  let lastErr = null;

  for (const ua of userAgents) {
    try {
      res = await fetch(cleanUrl, {
        headers: {
          'User-Agent': ua,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
          'Referer': 'https://www.google.com/',
          'Cache-Control': 'no-cache'
        }
      });
      if (res.ok) break;
    } catch (e) {
      lastErr = e;
    }
  }

  if (!res || !res.ok) {
    throw new Error(`Error HTTP ${res?.status || 500} al consultar BeSoccer (${cleanUrl})`);
  }

  const html = await res.text();

  // 1. JSON-LD Person parsing (most accurate structured data)
  let personLd = null;
  const jsonLdMatches = [...html.matchAll(/<script type=["']application\/ld\+json["']>([\s\S]*?)<\/script>/gi)];
  for (const m of jsonLdMatches) {
    try {
      const obj = JSON.parse(m[1].trim());
      if (obj['@type'] === 'Person' && (obj.birthDate || obj.memberOf || (beSoccerId && (obj.image?.includes(beSoccerId) || obj.url?.includes(beSoccerId))))) {
        personLd = obj;
        break;
      }
    } catch (e) {}
  }

  // 2. Full Name
  let fullBiographicalName = '';

  const profileHeaderMatch = html.match(/<div[^>]*class=["']panel-head[^"']*ta-c[^"']*["'][\s\S]*?<h2[^>]*class=["']panel-title["'][^>]*>([\s\S]*?)<\/h2>[\s\S]*?<div[^>]*class=["']panel-subtitle["'][^>]*>([\s\S]*?)<\/div>/i);
  if (profileHeaderMatch) {
    fullBiographicalName = profileHeaderMatch[2].replace(/<[^>]+>/g, '').trim();
  }

  if (!fullBiographicalName && personLd?.name) {
    fullBiographicalName = personLd.name;
  }

  if (!fullBiographicalName) {
    const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
    if (titleMatch) {
      const rawT = titleMatch[1].replace(/^Estadísticas\s+(?:de\s+)?/i, '');
      fullBiographicalName = rawT.split(/[-|–,]|hoy/)[0]?.trim() || '';
    }
  }

  const { nombre, apellidos } = splitName(fullBiographicalName);

  // 3. Current Club
  let currentClub = '';
  if (personLd?.memberOf?.name) {
    currentClub = personLd.memberOf.name.trim();
  }
  if (!currentClub) {
    const ssmMatch = html.match(/ssmCustomTargetings\s*=\s*\{[^}]*name:\s*["']([^"']+)["']/i);
    if (ssmMatch) currentClub = ssmMatch[1].trim();
  }
  if (!currentClub) {
    const teamCyMatch = html.match(/data-cy=["']currentTeam["'][^>]*>([^<]+)<\//i);
    if (teamCyMatch) currentClub = teamCyMatch[1].trim();
  }
  if (!currentClub) {
    const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
    if (titleMatch) {
      const titleParts = titleMatch[1].split(/[-|–,]/);
      for (const p of titleParts) {
        if (/hoy,\s*([^|–]+)/i.test(p)) {
          const m = p.match(/hoy,\s*([^|–]+)/i);
          if (m) currentClub = m[1].trim();
        }
      }
    }
  }
  if (!currentClub) currentClub = 'Sin equipo';

  // 4. Position & Detailed Position
  let posTag = personLd?.jobTitle || '';
  if (!posTag) {
    const roleMatch = html.match(/class=["']bg-role[^"']*["'][^>]*>([^<]+)<\//i);
    if (roleMatch) posTag = roleMatch[1].trim();
  }
  if (!posTag) {
    const bestPosMatch = html.match(/class=["'][^"']*pos-best[^"']*["'][^>]*>([^<]+)<\//i);
    if (bestPosMatch) posTag = bestPosMatch[1].trim();
  }

  let posDetailText = '';
  const mainRoleMatch = html.match(/class=["']main-role[^"']*["'][^>]*>[\s\S]*?<span[^>]*>([^<]+)<\/span>/i);
  if (mainRoleMatch) posDetailText = mainRoleMatch[1].trim();

  // 5. Preferred Foot
  let foot = 'derecho';
  const footMatch = html.match(/Pie preferido[\s\S]*?<div[^>]*>([^<]+)<\/div>/i);
  if (footMatch) {
    const ft = footMatch[1].toLowerCase();
    if (ft.includes('izq')) foot = 'izquierdo';
    else if (ft.includes('amb')) foot = 'ambos';
    else if (ft.includes('der')) foot = 'derecho';
  }

  const { posicion, posicion_detallada } = mapPosition(posTag, posDetailText, foot);

  // 6. Birth date
  let fecha_nacimiento = null;
  if (personLd?.birthDate) {
    fecha_nacimiento = personLd.birthDate;
  }
  if (!fecha_nacimiento) {
    const bMatch = html.match(/Nacido el\s+(\d{1,2}\s+[A-Za-zñáéíóú]+\s+\d{4})/i);
    if (bMatch) fecha_nacimiento = parseSpanishDate(bMatch[1]);
  }
  if (!fecha_nacimiento) fecha_nacimiento = '2001-01-01';

  // 7. Height & Weight
  let height = null;
  if (personLd?.height?.value) {
    height = parseInt(personLd.height.value, 10);
  }
  if (!height) {
    const hm = html.match(/(\d{3})\s*cms?/i) || html.match(/class=["']big-row["']>(\d{3})<\/div>\s*<div[^>]*class=["']small-row["']>cms/i);
    if (hm) height = parseInt(hm[1], 10);
  }
  if (!height) height = 180;

  let weight = null;
  if (personLd?.weight?.value) {
    weight = parseInt(personLd.weight.value, 10);
  }
  if (!weight) {
    const wm = html.match(/(\d{2,3})\s*kgs?/i) || html.match(/class=["']big-row["']>(\d{2,3})<\/div>\s*<div[^>]*class=["']small-row["']>kgs/i);
    if (wm) weight = parseInt(wm[1], 10);
  }
  if (!weight) weight = 74;

  // 8. Nationality
  let nationality = '';
  if (personLd?.nationality?.name) {
    nationality = personLd.nationality.name.trim();
  }
  if (!nationality) {
    const natMatch = html.match(/Nacionalidad[\s\S]*?<div[^>]*>([^<]+)<\/div>/i);
    if (natMatch) nationality = natMatch[1].trim();
  }
  if (!nationality) nationality = 'España';

  // 9. Category
  let categoria = 'Tercera RFEF';
  if (html.includes('Segunda Federación') || html.includes('Segunda RFEF')) {
    categoria = 'Segunda RFEF';
  } else if (html.includes('Tercera Federación') || html.includes('Tercera RFEF')) {
    categoria = 'Tercera RFEF';
  }

  // 10. Market Value
  let valorMercado = '25.000 €';
  const mvMatches = [...html.matchAll(/class=["']big-row["']>([\d.,]+)<\/div>\s*<div[^>]*class=["']small-row["']>([KM]\.?€)<\/div>/gi)];
  if (mvMatches.length > 0) {
    const num = parseFloat(mvMatches[0][1].replace(',', '.'));
    const unit = mvMatches[0][2].toUpperCase().replace('.', '');
    if (unit.includes('M')) {
      valorMercado = `${(num * 1000000).toLocaleString('es-ES')} €`;
    } else if (unit.includes('K')) {
      valorMercado = `${(num * 1000).toLocaleString('es-ES')} €`;
    }
  } else {
    const fallbackMv = html.match(/(\d+(?:[.,]\d+)?)\s*(K\.?€|M\.?€)/i);
    if (fallbackMv) {
      const num = parseFloat(fallbackMv[1].replace(',', '.'));
      const unit = fallbackMv[2].toUpperCase().replace('.', '');
      if (unit.includes('M')) {
        valorMercado = `${(num * 1000000).toLocaleString('es-ES')} €`;
      } else if (unit.includes('K')) {
        valorMercado = `${(num * 1000).toLocaleString('es-ES')} €`;
      }
    }
  }

  // 11. ELO / Score
  let score_global = 75;
  const eloMatch = html.match(/class=["']round-row["']>(\d{2,3})<\/div>\s*<div[^>]*class=["']small-row["']>ELO/i);
  if (eloMatch) {
    const elo = parseInt(eloMatch[1], 10);
    if (elo > 20) {
      score_global = Math.min(95, Math.max(55, Math.round(55 + (elo - 20) * 0.75)));
    }
  }

  // 12. Season Stats
  let est_partidos = 0;
  let est_minutos = 0;
  let est_goles = 0;
  let est_asistencias = 0;
  let est_amarillas = 0;
  let est_rojas = 0;

  // Search season table rows: tr.parent_row
  const parentRows = [...html.matchAll(/<tr[^>]*class=["'][^"']*parent_row[^"']*["'][^>]*>([\s\S]*?)<\/tr>/gi)];
  if (parentRows.length > 0) {
    // Look for 2025/26 or 2025-26 row
    let targetRow = parentRows.find(r => /2025\/26|2025-26/.test(r[1])) || parentRows[0];
    if (targetRow) {
      const rowContent = targetRow[1];
      const prcMatches = [...rowContent.matchAll(/data-content-tab=["']tprc1["'][^>]*>([^<]+)<\/td>/gi)].map(m => m[1].trim());
      const ptcMatches = [...rowContent.matchAll(/data-content-tab=["']tptc1["'][^>]*>([^<]+)<\/td>/gi)].map(m => m[1].trim());

      if (prcMatches.length >= 5) {
        est_partidos = parseInt(prcMatches[0], 10) || 0;
        est_goles = parseInt(prcMatches[1], 10) || 0;
        est_asistencias = parseInt(prcMatches[2], 10) || 0;
        est_amarillas = parseInt(prcMatches[3], 10) || 0;
        est_rojas = parseInt(prcMatches[4], 10) || 0;
      }
      if (ptcMatches.length >= 4) {
        const minStr = ptcMatches[3].replace(/['′]/g, '').trim();
        est_minutos = parseInt(minStr, 10) || (est_partidos * 85);
      }
    }
  }

  // If table had 0 or not found, check playerSeason panel
  if (est_partidos === 0) {
    const pIdx = html.indexOf('data-cy="playerSeason"');
    if (pIdx !== -1) {
      const seasonSlice = html.substring(pIdx, pIdx + 3000);
      const cols = [...seasonSlice.matchAll(/<div[^>]*class=["']item-col["']>([\s\S]*?)<\/div>\s*<\/div>/gi)];
      for (const col of cols) {
        const cText = col[1];
        const mainMatch = cText.match(/class=["']main-line["']>([^<]+)<\/div>/i);
        const mainVal = mainMatch ? mainMatch[1].trim() : '';

        if (/Partidos/i.test(cText)) {
          est_partidos = parseInt(mainVal, 10) || 0;
        } else if (/Minutos/i.test(cText)) {
          est_minutos = parseInt(mainVal.replace(/['′]/g, ''), 10) || 0;
        } else if (/Goles/i.test(cText) && !/concedidos/i.test(cText)) {
          est_goles = parseInt(mainVal, 10) || 0;
        }

        const yMatch = cText.match(/class=["']yellow-card["']>([^<]+)<\//i);
        if (yMatch) est_amarillas = parseInt(yMatch[1], 10) || 0;
        const rMatch = cText.match(/class=["']red-card["']>([^<]+)<\//i);
        if (rMatch) est_rojas = parseInt(rMatch[1], 10) || 0;
      }
    }
  }

  if (est_minutos === 0 && est_partidos > 0) {
    est_minutos = est_partidos * 75;
  }

  let foto_url = null;
  if (beSoccerId) {
    foto_url = `https://cdn.resfu.com/img_data/players/medium/${beSoccerId}.jpg?size=340x&lossy=1`;
  }

  return {
    nombre,
    apellidos,
    club_nombre: currentClub,
    posicion,
    posicion_detallada,
    pie_preferido: foot,
    fecha_nacimiento,
    altura_cm: height,
    peso_kg: weight,
    nacionalidad: nationality,
    categoria,
    valor_mercado: valorMercado,
    fin_contrato: '30 JUN 2026',
    score_global,
    foto_url,
    est_partidos,
    est_minutos,
    est_goles: posicion === 'POR' ? 0 : est_goles,
    est_asistencias: posicion === 'POR' ? 0 : est_asistencias,
    est_amarillas,
    est_rojas
  };
}

module.exports = { parseBeSoccerHtml };
