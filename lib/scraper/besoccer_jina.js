// ============================================================================
// Smart Scout 3.0 — Scraper BeSoccer Cloudflare-Bypass (Vercel Serverless Ready)
// Utiliza el lector seguro r.jina.ai para saltarse el 'Client Challenge' de Cloudflare
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
  if (combined.includes('PORTERO') || combined.includes('GUARDAMETA') || combined === 'POR' || combined === 'PT' || combined === 'GK') {
    return { posicion: 'POR', posicion_detallada: 'POR' };
  }
  if (combined.includes('LATERAL DERECHO') || combined.includes('LAT_DER') || combined === 'LD' || combined.includes(' LD') || combined.includes('RB')) {
    return { posicion: 'LAT', posicion_detallada: 'LAT_DER' };
  }
  if (combined.includes('LATERAL IZQUIERDO') || combined.includes('LAT_IZQ') || combined === 'LI' || combined.includes(' LI') || combined.includes('LB')) {
    return { posicion: 'LAT', posicion_detallada: 'LAT_IZQ' };
  }
  if (combined.includes('DEFENSA CENTRAL') || combined.includes('CENTRAL') || combined.includes('DFC') || combined === 'CB') {
    return { posicion: 'DFC', posicion_detallada: 'DFC' };
  }
  if (combined.includes('LATERAL') || combined.includes('CARRILERO')) {
    return { posicion: 'LAT', posicion_detallada: foot === 'izquierdo' ? 'LAT_IZQ' : 'LAT_DER' };
  }
  if (combined.includes('PIVOTE') || combined.includes('MCD') || combined.includes('DEFENSIVO') || combined === 'CDM' || combined === 'DM') {
    return { posicion: 'MCD', posicion_detallada: 'MCD' };
  }
  if (combined.includes('MEDIAPUNTA') || combined.includes('MP') || combined.includes('MCO') || combined.includes('CAM') || combined.includes('OFENSIVO')) {
    return { posicion: 'MC', posicion_detallada: 'MC_CEN' };
  }
  if (combined.includes('EXTREMO DERECHO') || combined.includes('EXT_DER') || combined === 'ED' || combined.includes('RW')) {
    return { posicion: 'EXT', posicion_detallada: 'EXT_DER' };
  }
  if (combined.includes('EXTREMO IZQUIERDO') || combined.includes('EXT_IZQ') || combined === 'EI' || combined.includes('LW')) {
    return { posicion: 'EXT', posicion_detallada: 'EXT_IZQ' };
  }
  if (combined.includes('EXTREMO') || combined.includes('WINGER')) {
    return { posicion: 'EXT', posicion_detallada: foot === 'izquierdo' ? 'EXT_IZQ' : 'EXT_DER' };
  }
  if (combined.includes('INTERIOR DERECHO') || combined.includes('MC_DER') || combined === 'MD' || combined.includes('RM')) {
    return { posicion: 'MC', posicion_detallada: 'MC_DER' };
  }
  if (combined.includes('INTERIOR IZQUIERDO') || combined.includes('MC_IZQ') || combined === 'MI' || combined.includes('LM')) {
    return { posicion: 'MC', posicion_detallada: 'MC_IZQ' };
  }
  if (combined.includes('MEDIOCENTRO') || combined.includes('CENTROCAMPISTA') || combined === 'MC' || combined === 'CM' || combined === 'CEN') {
    return { posicion: 'MC', posicion_detallada: 'MC_CEN' };
  }
  if (combined.includes('DELANTERO') || combined.includes('ATACANTE') || combined === 'DC' || combined === 'ST' || combined === 'CF') {
    return { posicion: 'DC', posicion_detallada: 'DC' };
  }
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

async function scrapeViaJina(targetUrl) {
  let cleanUrl = targetUrl.trim().split('?')[0].split('#')[0].replace(/\/+$/, '')
    .replace(/\/jugador\/trayectoria\//i, '/jugador/')
    .replace(/https?:\/\/(www\.)?besoccer\.(com|es)\/player\//i, 'https://es.besoccer.com/jugador/')
    .replace(/https?:\/\/(www\.)?besoccer\.es/i, 'https://es.besoccer.com');
  if (!cleanUrl.startsWith('http')) cleanUrl = `https://${cleanUrl}`;

  const matchId = cleanUrl.match(/-(\d+)$/) || cleanUrl.match(/\/(\d+)$/);
  const beSoccerId = matchId ? matchId[1] : null;

  const jinaUrl = `https://r.jina.ai/${cleanUrl}`;
  const res = await fetch(jinaUrl, {
    headers: {
      'Accept': 'text/plain',
      'X-No-Cache': 'true'
    }
  });

  if (!res.ok) {
    throw new Error(`Error en Jina Reader: status ${res.status}`);
  }

  const md = await res.text();
  if (md.includes('Client Challenge') && md.length < 1500) {
    throw new Error('BeSoccer devolvió Client Challenge en Jina');
  }

  // 1. Nombre y apellidos
  let fullBiographicalName = '';
  const bioMatch = md.match(/##\s+([^\n]+)\n+([A-Za-zñáéíóúÁÉÍÓÚ\s]{4,60})\n+\d+\s+años/i);
  if (bioMatch) {
    fullBiographicalName = bioMatch[2].trim();
  }
  if (!fullBiographicalName) {
    const titleMatch = md.match(/Title:\s*Estadísticas\s+de\s+([^,]+),/i);
    if (titleMatch) fullBiographicalName = titleMatch[1].trim();
  }
  const { nombre, apellidos } = splitName(fullBiographicalName);

  // 2. Club Actual
  let club_nombre = '';
  const clubMatch = md.match(/Title:\s*Estadísticas\s+de[^\n]+,\s*([^|]+)\|/i);
  if (clubMatch) {
    club_nombre = clubMatch[1].trim();
  }
  if (!club_nombre) {
    const fichajeMatch = md.match(/\|\s*\[!\[Image[^\]]*\]\s*([^\]]+)\]\([^\)]+\)\s*\|\s*Fichaje/i);
    if (fichajeMatch) club_nombre = fichajeMatch[1].trim();
  }
  if (!club_nombre) club_nombre = 'Sin equipo';

  // 3. Posición
  let posTag = '';
  const posMatch = md.match(/([A-Z]{2,3})\s+posición/i) || md.match(/\|\s*([A-Z]{2,3})\s*\|/);
  if (posMatch) posTag = posMatch[1].trim();

  // 4. Pie preferido
  let foot = 'derecho';
  const footMatch = md.match(/Pie preferido\s*\n+Pie\s+([a-zñáéíóú]+)/i);
  if (footMatch) {
    const ft = footMatch[1].toLowerCase();
    if (ft.includes('izq')) foot = 'izquierdo';
    else if (ft.includes('amb')) foot = 'ambos';
    else if (ft.includes('der')) foot = 'derecho';
  }

  const { posicion, posicion_detallada } = mapPosition(posTag, '', foot);

  // 5. Fecha de nacimiento
  let fecha_nacimiento = null;
  const bMatch = md.match(/Nacido el\s+(\d{1,2}\s+[A-Za-zñáéíóú]+\s+\d{4})/i);
  if (bMatch) fecha_nacimiento = parseSpanishDate(bMatch[1]);
  if (!fecha_nacimiento) fecha_nacimiento = '2001-01-01';

  // 6. Altura y Peso
  let height = 180;
  const hMatch = md.match(/(\d{3})\s+cms/i);
  if (hMatch) height = parseInt(hMatch[1], 10);

  let weight = 74;
  const wMatch = md.match(/(\d{2,3})\s+kgs/i);
  if (wMatch) weight = parseInt(wMatch[1], 10);

  // 7. Nacionalidad
  let nationality = 'España';
  const natMatch = md.match(/País de nacimiento\s*\n+!\[[^\]]*\]\s*([A-Za-zñáéíóú\s]+)/i);
  if (natMatch) nationality = natMatch[1].trim();

  // 8. Valor de mercado
  let valor_mercado = '25.000 €';
  const mvMatch = md.match(/(\d+(?:[.,]\d+)?)\s*(K\.?€|M\.?€)/i);
  if (mvMatch) {
    const num = parseFloat(mvMatch[1].replace(',', '.'));
    const unit = mvMatch[2].toUpperCase().replace('.', '');
    if (unit.includes('M')) {
      valor_mercado = `${(num * 1000000).toLocaleString('es-ES')} €`;
    } else if (unit.includes('K')) {
      valor_mercado = `${(num * 1000).toLocaleString('es-ES')} €`;
    }
  }

  // 9. ELO / Score
  let score_global = 75;
  const eloMatch = md.match(/(\d{2,3})\s+ELO/i);
  if (eloMatch) {
    const elo = parseInt(eloMatch[1], 10);
    if (elo > 20) {
      score_global = Math.min(95, Math.max(55, Math.round(55 + (elo - 20) * 0.75)));
    }
  }

  // 10. Categoría
  let categoria = 'Tercera RFEF';
  if (md.includes('Segunda Federación') || md.includes('Segunda RFEF')) {
    categoria = 'Segunda RFEF';
  } else if (md.includes('Tercera Federación') || md.includes('Tercera RFEF')) {
    categoria = 'Tercera RFEF';
  }

  // 11. Estadísticas de temporada
  let est_partidos = 0;
  let est_minutos = 0;
  let est_goles = 0;
  let est_asistencias = 0;
  let est_amarillas = 0;
  let est_rojas = 0;

  const tableRows = md.split('\n').filter(l => l.includes('2025/26') || l.includes('2024/25') || l.includes('2026/27'));
  let chosenRow = tableRows.find(r => r.includes('2025/26')) || tableRows[0];

  if (chosenRow) {
    const cells = chosenRow.split('|').map(c => c.trim()).filter(Boolean);
    if (cells.length >= 10) {
      est_partidos = parseInt(cells[2], 10) || 0;
      est_goles = parseInt(cells[3], 10) || 0;
      est_asistencias = parseInt(cells[4], 10) || 0;
      est_amarillas = parseInt(cells[5], 10) || 0;
      est_rojas = parseInt(cells[6], 10) || 0;

      const minCell = cells.find(c => c.includes("'") || c.includes("′"));
      if (minCell) {
        est_minutos = parseInt(minCell.replace(/['′]/g, ''), 10) || 0;
      }
    }
  }

  if (est_minutos === 0 && est_partidos > 0) {
    est_minutos = est_partidos * 80;
  }

  let foto_url = null;
  if (beSoccerId) {
    foto_url = `https://cdn.resfu.com/img_data/players/medium/${beSoccerId}.jpg?size=340x&lossy=1`;
  }

  return {
    nombre,
    apellidos,
    club_nombre,
    posicion,
    posicion_detallada,
    pie_preferido: foot,
    fecha_nacimiento,
    altura_cm: height,
    peso_kg: weight,
    nacionalidad: nationality,
    categoria,
    valor_mercado,
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

module.exports = { scrapeViaJina };
