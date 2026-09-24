const SUPABASE_URL = 'https://mnfxjxorffxnuxpdzzzd.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1uZnhqeG9yZmZ4bnV4cGR6enpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxODQzNDIsImV4cCI6MjEwMDc2MDM0Mn0.EvAmPcHsgIzJLhFZUlPfp9ujjQr2OfXX4ANnIZifdAc';

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Generates a realistic percentile based on player position and metric
function generatePercentile(pos, metricCode) {
  const isGK = pos === 'POR';
  const isDef = pos.includes('DFC') || pos.includes('LAT');
  const isMid = pos.includes('MC') || pos === 'MP';
  const isFwd = pos === 'DC' || pos.includes('EXT');

  if (isGK) {
    if (metricCode === 'juego_portero') return getRandomInt(65, 95);
    if (metricCode === 'juego_construccion') return getRandomInt(40, 80);
    if (metricCode === 'conservacion') return getRandomInt(50, 75);
    return getRandomInt(1, 15);
  }

  // Not GK
  if (metricCode === 'juego_portero') return 0; // Outfield players

  switch(metricCode) {
    case 'juego_construccion':
      if (isDef) return getRandomInt(50, 85);
      if (isMid) return getRandomInt(60, 95);
      return getRandomInt(30, 60);
    case 'juego_asociativo':
      if (isMid) return getRandomInt(60, 95);
      if (isFwd) return getRandomInt(45, 80);
      return getRandomInt(40, 75);
    case 'progresion':
      if (isMid || pos.includes('LAT') || pos.includes('EXT')) return getRandomInt(60, 90);
      return getRandomInt(30, 65);
    case 'creacion_juego_abierto':
      if (isFwd || pos === 'MP' || pos === 'MC') return getRandomInt(60, 95);
      return getRandomInt(20, 60);
    case 'creacion_estrategia':
      return getRandomInt(20, 85); // Anyone could take free kicks
    case 'finalizacion':
      if (isFwd) return getRandomInt(65, 98);
      if (isMid) return getRandomInt(40, 75);
      return getRandomInt(10, 40);
    case 'amenaza':
      if (isFwd) return getRandomInt(70, 99);
      if (isMid) return getRandomInt(45, 85);
      return getRandomInt(15, 50);
    case 'defensa_campo_rival':
      if (isFwd) return getRandomInt(50, 90); // Pressing forwards
      if (isMid) return getRandomInt(40, 85);
      return getRandomInt(20, 50); // Defenders rarely defend in rival half
    case 'defensa_juego_abierto':
    case 'defensa_campo_propio':
      if (isDef) return getRandomInt(65, 98);
      if (isMid) return getRandomInt(45, 80);
      return getRandomInt(10, 40);
    case 'conservacion':
      if (isMid) return getRandomInt(65, 95);
      if (isDef) return getRandomInt(50, 85);
      return getRandomInt(40, 75);
    default:
      return getRandomInt(40, 80);
  }
}

async function run() {
  console.log('Fetching metrics...');
  const resMetrics = await fetch(SUPABASE_URL + '/rest/v1/metricas_nivel2', {
    headers: { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY }
  });
  const metrics = await resMetrics.json();

  console.log('Fetching FE Grama players...');
  const resPlayers = await fetch(SUPABASE_URL + "/rest/v1/jugadores", {
    headers: { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY }
  });
  const players = await resPlayers.json();

  const recordsToInsert = [];

  for (const player of players) {
    for (const metric of metrics) {
      const p = generatePercentile(player.posicion, metric.codigo);
      recordsToInsert.push({
        jugador_id: player.id,
        metrica_n2_id: metric.id,
        valor: p,
        percentil: p
      });
    }
  }

  console.log(`Inserting ${recordsToInsert.length} metrics records...`);
  
  // Chunk insert to avoid large payload limits
  const chunkSize = 100;
  for (let i = 0; i < recordsToInsert.length; i += chunkSize) {
    const chunk = recordsToInsert.slice(i, i + chunkSize);
    const res = await fetch(SUPABASE_URL + '/rest/v1/jugador_metricas_n2?on_conflict=jugador_id,metrica_n2_id', {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': 'Bearer ' + SUPABASE_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates'
      },
      body: JSON.stringify(chunk)
    });
    
    if (!res.ok) {
      const err = await res.text();
      console.log(`❌ Error in chunk ${i}:`, err);
    } else {
      console.log(`✅ Inserted chunk ${i}-${i + chunkSize - 1}`);
    }
  }
  
  console.log('Done!');
}

run();
