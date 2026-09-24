const fs = require('fs');

const SUPABASE_URL = 'https://mnfxjxorffxnuxpdzzzd.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1uZnhqeG9yZmZ4bnV4cGR6enpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxODQzNDIsImV4cCI6MjEwMDc2MDM0Mn0.EvAmPcHsgIzJLhFZUlPfp9ujjQr2OfXX4ANnIZifdAc';
const GRAMA_CLUB_ID = 'e0000001-0000-0000-0000-000000000001';

const GRAMA_URLS = [
  "https://es.besoccer.com/jugador/p-blanco-3326560",
  "https://es.besoccer.com/jugador/i-mena-3242417",
  "https://es.besoccer.com/jugador/j-edo-3570527",
  "https://es.besoccer.com/jugador/ivan-julian-950854",
  "https://es.besoccer.com/jugador/a-badia-876566",
  "https://es.besoccer.com/jugador/alan-liesegang-gonzalez-195734",
  "https://es.besoccer.com/jugador/joel-toledo-825405",
  "https://es.besoccer.com/jugador/b-del-valle-3457149",
  "https://es.besoccer.com/jugador/a-prat-3725679",
  "https://es.besoccer.com/jugador/alejandro-pereira-993089",
  "https://es.besoccer.com/jugador/g-escarrabill-326860",
  "https://es.besoccer.com/jugador/aaron-bocardo-993189",
  "https://es.besoccer.com/jugador/a-garcia-923465",
  "https://es.besoccer.com/jugador/y-bouchane-3447219",
  "https://es.besoccer.com/jugador/s-hernandez-3331852",
  "https://es.besoccer.com/jugador/p-jimenez-3570531",
  "https://es.besoccer.com/jugador/fran-orellana-200156",
  "https://es.besoccer.com/jugador/a-juwara-999228",
  "https://es.besoccer.com/jugador/elhadji-thiam-993129",
  "https://es.besoccer.com/jugador/alberto-993833",
  "https://es.besoccer.com/jugador/e-compte-3331992",
  "https://es.besoccer.com/jugador/a-amate-3184125",
  "https://es.besoccer.com/jugador/r-ortega-3326594"
];

const FUTURIBLES = [
  'https://es.besoccer.com/jugador/g-swiderski-3209722',
  'https://es.besoccer.com/jugador/p-hernandez-265279',
  'https://es.besoccer.com/jugador/dani-sotres-110473',
  'https://es.besoccer.com/jugador/christian-gomez-265978',
  'https://es.besoccer.com/jugador/javier-velasco-235708',
  'https://es.besoccer.com/jugador/salcedo-30161',
  'https://es.besoccer.com/jugador/vicenc-190537',
  'https://es.besoccer.com/jugador/alberto-lejarraga-rubio-205517',
  'https://es.besoccer.com/jugador/x-olaiz-1028928',
  'https://es.besoccer.com/jugador/javier-bonilla-105234',
  'https://es.besoccer.com/jugador/o-de-frutos-427514',
  'https://es.besoccer.com/jugador/carlos-b-902083',
  'https://es.besoccer.com/jugador/brayan-951120',
  'https://es.besoccer.com/jugador/pol-bassa-951499',
  'https://es.besoccer.com/equipo/deportivo-alaves-b',
  'https://es.besoccer.com/equipo/cd-extremadura',
  'https://es.besoccer.com/jugador/o-perdomo-122654',
  'https://es.besoccer.com/jugador/miguel-llabres-875212',
  'https://es.besoccer.com/jugador/m-gandarillas-seco-875910',
  'https://es.besoccer.com/jugador/a-risco-3354970',
  'https://es.besoccer.com/jugador/mario-gonzalez-423283',
  'https://es.besoccer.com/jugador/dani-rodriguez-948266',
  'https://es.besoccer.com/jugador/hector-pena-1006277',
  'https://es.besoccer.com/equipo/cd-castellon-b',
  'https://es.besoccer.com/competicion/rankings/tercera_division_rfef/2026/goleadores',
  'https://es.besoccer.com/jugador/aimar-1024466',
  'https://es.besoccer.com/jugador/inigo-426750',
  'https://es.besoccer.com/jugador/trayectoria/a-carvajal-3189015',
  'https://es.besoccer.com/jugador/joaquin-993201'
];

async function supabaseQuery(path, method, body = null) {
  const options = {
    method,
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    }
  };
  if (body) options.body = JSON.stringify(body);
  const res = await fetch(`${SUPABASE_URL}${path}`, options);
  if (!res.ok) {
    console.log(await res.text());
    throw new Error(`Supabase Error ${res.status}`);
  }
  if (res.status === 204) return null;
  return await res.json();
}

async function run() {
  console.log("Fetching current Grama players from DB...");
  const dbGrama = await supabaseQuery('/rest/v1/jugadores?club_id=eq.' + GRAMA_CLUB_ID, 'GET');
  console.log(`Found ${dbGrama.length} current Grama players in DB.`);

  let dbGramaNames = dbGrama.map(p => `${p.nombre} ${p.apellidos}`.toLowerCase().trim());
  let newGramaNames = [];

  // Update/Insert Grama Squad
  for (const url of GRAMA_URLS) {
    console.log(`[GRAMA] Processing: ${url}`);
    try {
      const res = await fetch('http://localhost:3000/api/importar-jugador', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      const data = await res.json();
      if (!data.player) {
        console.log("No player returned for", url);
        continue;
      }
      
      const p = data.player;
      p.club_id = GRAMA_CLUB_ID;
      delete p.club_nombre; // clean up before insert
      const fullName = `${p.nombre} ${p.apellidos}`.toLowerCase().trim();
      newGramaNames.push(fullName);

      // check if exists
      const existing = dbGrama.find(x => `${x.nombre} ${x.apellidos}`.toLowerCase().trim() === fullName);
      if (existing) {
        // update stats
        await supabaseQuery(`/rest/v1/jugadores?id=eq.${existing.id}`, 'PATCH', {
          est_partidos: p.est_partidos,
          est_minutos: p.est_minutos,
          est_goles: p.est_goles,
          est_asistencias: p.est_asistencias,
          est_amarillas: p.est_amarillas,
          est_rojas: p.est_rojas,
          foto_url: p.foto_url
        });
        console.log(`✅ Updated existing Grama player: ${p.nombre} ${p.apellidos}`);
      } else {
        // insert
        await supabaseQuery('/rest/v1/jugadores', 'POST', p);
        console.log(`✅ Inserted new Grama player: ${p.nombre} ${p.apellidos}`);
      }
    } catch (e) {
      console.log(`❌ Error processing ${url}: ${e.message}`);
    }
  }

  // Find players to remove from Grama (set club_id = null instead of deleting to keep ratings)
  for (const dbp of dbGrama) {
    const fn = `${dbp.nombre} ${dbp.apellidos}`.toLowerCase().trim();
    if (!newGramaNames.includes(fn)) {
      console.log(`⚠️ Player no longer in Grama, removing club_id: ${dbp.nombre} ${dbp.apellidos}`);
      await supabaseQuery(`/rest/v1/jugadores?id=eq.${dbp.id}`, 'PATCH', {
        club_id: null
      });
    }
  }

  // Futuribles
  for (const url of FUTURIBLES) {
    console.log(`[FUTURIBLE] Processing: ${url}`);
    try {
      const res = await fetch('http://localhost:3000/api/importar-jugador', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      const data = await res.json();
      if (!data.player) {
        console.log("No player returned for", url);
        continue;
      }
      const p = data.player;
      
      // We will check if the player already exists in the DB (any club)
      const existingReq = await supabaseQuery(`/rest/v1/jugadores?nombre=eq.${encodeURIComponent(p.nombre)}&apellidos=eq.${encodeURIComponent(p.apellidos)}`, 'GET');
      if (existingReq && existingReq.length > 0) {
        const existing = existingReq[0];
        // update stats
        await supabaseQuery(`/rest/v1/jugadores?id=eq.${existing.id}`, 'PATCH', {
          est_partidos: p.est_partidos,
          est_minutos: p.est_minutos,
          est_goles: p.est_goles,
          est_asistencias: p.est_asistencias,
          est_amarillas: p.est_amarillas,
          est_rojas: p.est_rojas,
          foto_url: p.foto_url
        });
        console.log(`✅ Updated existing Futurible: ${p.nombre} ${p.apellidos}`);
      } else {
        // Find club id or insert club if needed. For now we just insert without club_id so they show up as scouted.
        // The API returns club_nombre. Let's try to find it.
        let c_id = null;
        if (p.club_nombre) {
          const clubReq = await supabaseQuery(`/rest/v1/clubes?nombre=ilike.*${encodeURIComponent(p.club_nombre)}*`, 'GET');
          if (clubReq && clubReq.length > 0) {
            c_id = clubReq[0].id;
          }
        }
        p.club_id = c_id;
        delete p.club_nombre; // clean up before insert

        await supabaseQuery('/rest/v1/jugadores', 'POST', p);
        console.log(`✅ Inserted new Futurible: ${p.nombre} ${p.apellidos}`);
      }
    } catch (e) {
      console.log(`❌ Error processing ${url}: ${e.message}`);
    }
  }

  console.log("Done!");
}

run();
