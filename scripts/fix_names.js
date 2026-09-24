const fs = require('fs');

const SUPABASE_URL = 'https://mnfxjxorffxnuxpdzzzd.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1uZnhqeG9yZmZ4bnV4cGR6enpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxODQzNDIsImV4cCI6MjEwMDc2MDM0Mn0.EvAmPcHsgIzJLhFZUlPfp9ujjQr2OfXX4ANnIZifdAc';

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

const URLS = [
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
  "https://es.besoccer.com/jugador/r-ortega-3326594",
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
  'https://es.besoccer.com/jugador/o-perdomo-122654',
  'https://es.besoccer.com/jugador/miguel-llabres-875212',
  'https://es.besoccer.com/jugador/m-gandarillas-seco-875910',
  'https://es.besoccer.com/jugador/a-risco-3354970',
  'https://es.besoccer.com/jugador/mario-gonzalez-423283',
  'https://es.besoccer.com/jugador/dani-rodriguez-948266',
  'https://es.besoccer.com/jugador/hector-pena-1006277',
  'https://es.besoccer.com/jugador/aimar-1024466',
  'https://es.besoccer.com/jugador/inigo-426750',
  'https://es.besoccer.com/jugador/trayectoria/a-carvajal-3189015',
  'https://es.besoccer.com/jugador/joaquin-993201'
];

async function run() {
  const dbPlayers = await supabaseQuery('/rest/v1/jugadores?select=id,nombre,apellidos,foto_url', 'GET');
  for (const p of dbPlayers) {
    if (p.nombre === "Partidos" || p.nombre === "Partidos oficiales" || p.nombre.includes("Tercera") || p.nombre.includes("Segunda") || p.nombre === "Jugador" || p.apellidos === "Observado") {
      let slugName = null;
      if (p.foto_url) {
        const matchId = p.foto_url.match(/\/(\d+)\.jpg/);
        if (matchId) {
          const id = matchId[1];
          const url = URLS.find(u => u.includes(id));
          if (url) {
            const slug = url.split('/').pop().replace(`-${id}`, '').replace(/-/g, ' ');
            slugName = slug.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
          }
        }
      }
      
      if (slugName) {
        const parts = slugName.split(' ');
        const nombre = parts[0];
        const apellidos = parts.slice(1).join(' ');
        console.log(`Fixing ${p.nombre} ${p.apellidos} -> ${nombre} ${apellidos}`);
        await supabaseQuery(`/rest/v1/jugadores?id=eq.${p.id}`, 'PATCH', { nombre, apellidos: apellidos || " " });
      } else {
        console.log(`Couldn't map: ${p.nombre} ${p.apellidos} (${p.foto_url})`);
      }
    }
  }
}
run();
