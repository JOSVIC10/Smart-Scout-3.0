const SUPABASE_URL = 'https://mnfxjxorffxnuxpdzzzd.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1uZnhqeG9yZmZ4bnV4cGR6enpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxODQzNDIsImV4cCI6MjEwMDc2MDM0Mn0.EvAmPcHsgIzJLhFZUlPfp9ujjQr2OfXX4ANnIZifdAc';

const NEW_FUTURIBLES = [
  { n: "Grégoire Świderski", eq: "Deportivo Alavés B", pos: "POR", cat: "2ª Federación", url: "https://es.besoccer.com/jugador/g-swiderski-3209722" },
  { n: "P. Hernández", eq: "CD Cuarte", pos: "POR", cat: "3ª Federación", url: "https://es.besoccer.com/jugador/p-hernandez-265279" },
  { n: "Dani Sotres", eq: "Gimnástica Torrelavega", pos: "POR", cat: "3ª Federación", url: "https://es.besoccer.com/jugador/dani-sotres-110473" },
  { n: "Christian Gómez", eq: "CD Toledo", pos: "POR", cat: "3ª Federación", url: "https://es.besoccer.com/jugador/christian-gomez-265978" },
  { n: "Javi Benítez", eq: "UD Llanera", pos: "POR", cat: "3ª Federación", url: "https://es.besoccer.com/jugador/javier-velasco-235708" },
  { n: "Salcedo", eq: "Águilas FC", pos: "POR", cat: "2ª Federación", url: "https://es.besoccer.com/jugador/salcedo-30161" },
  { n: "V. Sabater", eq: "Poblense", pos: "POR", cat: "2ª Federación", url: "https://es.besoccer.com/jugador/vicenc-190537" },
  { n: "Lejárraga", eq: "UD Sanse", pos: "POR", cat: "2ª Federación", url: "https://es.besoccer.com/jugador/alberto-lejarraga-rubio-205517" },
  
  { n: "Xanet Oláiz", eq: "Deportivo Alavés B", pos: "DFC", cat: "2ª Federación", url: "https://es.besoccer.com/jugador/x-olaiz-1028928" },
  { n: "Javier Bonilla", eq: "CD Numancia", pos: "DFC", cat: "2ª Federación", url: "https://es.besoccer.com/jugador/javier-bonilla-105234" },
  { n: "Óscar De Frutos", eq: "CD Numancia", pos: "DFC", cat: "2ª Federación", url: "https://es.besoccer.com/jugador/o-de-frutos-427514" },
  { n: "Carlos Ballestero", eq: "Deportivo Alavés B", pos: "DFC", cat: "2ª Federación", url: "https://es.besoccer.com/jugador/carlos-b-902083" },
  { n: "B. Ademán", eq: "Gimnástica Torrelavega", pos: "DFC", cat: "3ª Federación", url: "https://es.besoccer.com/jugador/brayan-951120" },
  { n: "Pol Bassa", eq: "Fuenlabrada", pos: "DFC", cat: "2ª Federación", url: "https://es.besoccer.com/jugador/pol-bassa-951499" },
  { n: "Paco Sanz", eq: "Deportivo Alavés B", pos: "DFC", cat: "2ª Federación", url: "https://es.besoccer.com/equipo/deportivo-alaves-b" },
  { n: "Carlos Cordero", eq: "CD Extremadura", pos: "DFC", cat: "2ª Federación", url: "https://es.besoccer.com/equipo/cd-extremadura" },
  
  { n: "Omar Perdomo", eq: "Deportiva Minera", pos: "MC", cat: "2ª Federación", url: "https://es.besoccer.com/jugador/o-perdomo-122654" },
  { n: "Miquel Llabrés", eq: "CE Andratx", pos: "MC", cat: "2ª Federación", url: "https://es.besoccer.com/jugador/miguel-llabres-875212" },
  { n: "M. Gandarillas", eq: "Coruxo FC", pos: "MC", cat: "2ª Federación", url: "https://es.besoccer.com/jugador/m-gandarillas-seco-875910" },
  { n: "Alberto Risco", eq: "Getafe B", pos: "MC", cat: "2ª Federación", url: "https://es.besoccer.com/jugador/a-risco-3354970" },
  { n: "Mario González", eq: "UD Sanse", pos: "MC", cat: "2ª Federación", url: "https://es.besoccer.com/jugador/mario-gonzalez-423283" },
  { n: "Dani Rodríguez", eq: "Barça Atlètic", pos: "MC", cat: "2ª Federación", url: "https://es.besoccer.com/jugador/dani-rodriguez-948266" },
  { n: "Héctor Peña", eq: "CD Numancia", pos: "MC", cat: "2ª Federación", url: "https://es.besoccer.com/jugador/hector-pena-1006277" },
  { n: "Domi", eq: "CD Castellón B", pos: "MC", cat: "2ª Federación", url: "https://es.besoccer.com/equipo/cd-castellon-b" },
  
  { n: "Y. Ouakkati", eq: "Atlético Monzón", pos: "DC", cat: "3ª Federación", url: "https://es.besoccer.com/competicion/rankings/tercera_division_rfef/2026/goleadores" },
  { n: "Aimar Peña", eq: "Mallorca B", pos: "DC", cat: "3ª Federación", url: "https://es.besoccer.com/jugador/aimar-1024466" },
  { n: "W. Hurtado", eq: "Mallorca B", pos: "DC", cat: "3ª Federación", url: "https://es.besoccer.com/competicion/rankings/tercera_division_rfef/2026/goleadores" },
  { n: "J. Cárcaba", eq: "Caudal Deportivo", pos: "DC", cat: "3ª Federación", url: "https://es.besoccer.com/competicion/rankings/tercera_division_rfef/2026/goleadores" },
  { n: "I. Alayeto", eq: "Tudelano", pos: "DC", cat: "2ª Federación", url: "https://es.besoccer.com/jugador/inigo-426750" },
  { n: "Jesús Barrios", eq: "Atlético C", pos: "DC", cat: "3ª Federación", url: "https://es.besoccer.com/competicion/rankings/tercera_division_rfef/2026/goleadores" },
  { n: "Ángel Carvajal", eq: "Valladolid Promesas", pos: "DC", cat: "2ª Federación", url: "https://es.besoccer.com/jugador/trayectoria/a-carvajal-3189015" },
  { n: "Joaquín Delgado", eq: "Barça Atlètic", pos: "DC", cat: "2ª Federación", url: "https://es.besoccer.com/jugador/joaquin-993201" }
];

async function run() {
  for (const player of NEW_FUTURIBLES) {
    console.log(`Inserting ${player.n}...`);
    
    // Attempt to extract foto URL from link if it is a specific player link
    let fotoUrl = null;
    const matchId = player.url.match(/([^\/]+)-(\d+)$/) || player.url.match(/\/(\d+)$/);
    if (matchId && !player.url.includes('/equipo/') && !player.url.includes('/rankings/')) {
        const id = matchId[2] || matchId[1];
        if (id) {
            fotoUrl = `https://cdn.resfu.com/img_data/players/medium/${id}.jpg?size=340x&lossy=1`;
        }
    }
    
    const parts = player.n.split(' ');
    const nombre = parts[0];
    const apellidos = parts.slice(1).join(' ') || " ";
    
    // We map the category
    let dbCat = 'Otra';
    if (player.cat.includes('2ª')) dbCat = 'Segunda RFEF';
    if (player.cat.includes('3ª')) dbCat = 'Tercera RFEF';
    
    const newPlayer = {
        nombre,
        apellidos,
        nacionalidad: 'España',
        pie_preferido: 'derecho',
        posicion: player.pos,
        posicion_detallada: player.pos === 'MC' ? 'MC_CEN' : player.pos,
        club_id: null,
        categoria: dbCat,
        minutos_jugados: 0,
        partidos_analizados: 0,
        score_global: 75,
        foto_url: fotoUrl,
        est_partidos: 0,
        est_minutos: 0,
        est_goles: 0,
        est_asistencias: 0,
        est_amarillas: 0,
        est_rojas: 0
    };
    
    try {
        const res = await fetch(SUPABASE_URL + '/rest/v1/jugadores', {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(newPlayer)
        });
        
        if (!res.ok) {
            const err = await res.text();
            console.log(`❌ Error inserting ${player.n}: ${err}`);
        } else {
            console.log(`✅ Success inserting ${player.n}`);
        }
    } catch(e) {
        console.log(`❌ Network Error: ${e.message}`);
    }
  }
}

run();
