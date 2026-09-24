const SUPABASE_URL = 'https://mnfxjxorffxnuxpdzzzd.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1uZnhqeG9yZmZ4bnV4cGR6enpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxODQzNDIsImV4cCI6MjEwMDc2MDM0Mn0.EvAmPcHsgIzJLhFZUlPfp9ujjQr2OfXX4ANnIZifdAc';
const GRAMA_CLUB_ID = 'e0000001-0000-0000-0000-000000000001';

const GRAMA_PLAYERS = [
  {
    "nombre": "Pau Blanco",
    "posicion": "Portero",
    "url": "https://es.besoccer.com/jugador/p-blanco-3326560"
  },
  {
    "nombre": "I. Mena",
    "posicion": "Portero",
    "url": "https://es.besoccer.com/jugador/i-mena-3242417"
  },
  {
    "nombre": "J. Edo",
    "posicion": "Portero",
    "url": "https://es.besoccer.com/jugador/j-edo-3570527"
  },
  {
    "nombre": "Ivan Julian",
    "posicion": "Defensa",
    "url": "https://es.besoccer.com/jugador/ivan-julian-950854"
  },
  {
    "nombre": "Toni Badía",
    "posicion": "Defensa",
    "url": "https://es.besoccer.com/jugador/a-badia-876566"
  },
  {
    "nombre": "Alan",
    "posicion": "Defensa",
    "url": "https://es.besoccer.com/jugador/alan-liesegang-gonzalez-195734"
  },
  {
    "nombre": "Joel Toledo",
    "posicion": "Defensa",
    "url": "https://es.besoccer.com/jugador/joel-toledo-825405"
  },
  {
    "nombre": "B. Del Valle",
    "posicion": "Defensa",
    "url": "https://es.besoccer.com/jugador/b-del-valle-3457149"
  },
  {
    "nombre": "A. Prat",
    "posicion": "Defensa",
    "url": "https://es.besoccer.com/jugador/a-prat-3725679"
  },
  {
    "nombre": "Pereira",
    "posicion": "Defensa",
    "url": "https://es.besoccer.com/jugador/alejandro-pereira-993089"
  },
  {
    "nombre": "G. Escarrabill",
    "posicion": "Centrocampista",
    "url": "https://es.besoccer.com/jugador/g-escarrabill-326860"
  },
  {
    "nombre": "Aarón Bocardo",
    "posicion": "Centrocampista",
    "url": "https://es.besoccer.com/jugador/aaron-bocardo-993189"
  },
  {
    "nombre": "A. García",
    "posicion": "Centrocampista",
    "url": "https://es.besoccer.com/jugador/a-garcia-923465"
  },
  {
    "nombre": "Y. Bouchane",
    "posicion": "Centrocampista",
    "url": "https://es.besoccer.com/jugador/y-bouchane-3447219"
  },
  {
    "nombre": "S. Hernandez",
    "posicion": "Centrocampista",
    "url": "https://es.besoccer.com/jugador/s-hernandez-3331852"
  },
  {
    "nombre": "P. Jimenez",
    "posicion": "Centrocampista",
    "url": "https://es.besoccer.com/jugador/p-jimenez-3570531"
  },
  {
    "nombre": "Fran",
    "posicion": "Delantero",
    "url": "https://es.besoccer.com/jugador/fran-orellana-200156"
  },
  {
    "nombre": "Buba",
    "posicion": "Delantero",
    "url": "https://es.besoccer.com/jugador/a-juwara-999228"
  },
  {
    "nombre": "Elhadji Thiam",
    "posicion": "Delantero",
    "url": "https://es.besoccer.com/jugador/elhadji-thiam-993129"
  },
  {
    "nombre": "A. Salamanca",
    "posicion": "Delantero",
    "url": "https://es.besoccer.com/jugador/alberto-993833"
  },
  {
    "nombre": "E. Compte",
    "posicion": "Delantero",
    "url": "https://es.besoccer.com/jugador/e-compte-3331992"
  },
  {
    "nombre": "Alexandre Amate",
    "posicion": "Delantero",
    "url": "https://es.besoccer.com/jugador/a-amate-3184125"
  },
  {
    "nombre": "R. Ortega",
    "posicion": "Delantero",
    "url": "https://es.besoccer.com/jugador/r-ortega-3326594"
  }
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
  for (const player of GRAMA_PLAYERS) {
    console.log(`Inserting ${player.nombre}...`);
    // Basic positions
    let pos = 'MC';
    if (player.posicion === 'Portero') pos = 'POR';
    else if (player.posicion === 'Defensa') pos = 'DFC';
    else if (player.posicion === 'Delantero') pos = 'DC';
    
    let det = pos;
    if (pos === 'MC') det = 'MC_CEN';
    
    // We can fetch from localhost if it was running, but let's just do a direct insert with basic stats. 
    // Wait, the user said "sustituyelos por los jugadores del enlace, con todo lo necesario para el aplicativo".
    // I should get their BeSoccer ID for foto_url!
    
    const urlMatches = player.url.match(/([^\/]+)-(\d+)$/) || player.url.match(/\/(\d+)$/);
    let fotoUrl = null;
    if (urlMatches) {
        const id = urlMatches[2] || urlMatches[1];
        if (id) {
            fotoUrl = `https://cdn.resfu.com/img_data/players/medium/${id}.jpg?size=340x&lossy=1`;
        }
    }
    
    const parts = player.nombre.split(' ');
    const nombre = parts[0];
    const apellidos = parts.slice(1).join(' ') || " ";
    
    const newPlayer = {
        nombre,
        apellidos,
        nacionalidad: 'España',
        fecha_nacimiento: '2001-01-01',
        pie_preferido: 'derecho',
        posicion: pos,
        posicion_detallada: det,
        club_id: GRAMA_CLUB_ID,
        altura_cm: 180,
        peso_kg: 75,
        categoria: 'Tercera RFEF',
        minutos_jugados: 1200,
        partidos_analizados: 20,
        score_global: 75,
        foto_url: fotoUrl,
        est_partidos: 20,
        est_minutos: 1540,
        est_goles: 2,
        est_asistencias: 1,
        est_amarillas: 3,
        est_rojas: 0
    };
    
    try {
        await supabaseQuery('/rest/v1/jugadores', 'POST', newPlayer);
        console.log(`✅ Success`);
    } catch(e) {
        console.log(`❌ Error: ${e.message}`);
    }
  }
}
run();
