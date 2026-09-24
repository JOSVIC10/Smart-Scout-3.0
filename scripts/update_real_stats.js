const SUPABASE_URL = 'https://mnfxjxorffxnuxpdzzzd.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1uZnhqeG9yZmZ4bnV4cGR6enpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxODQzNDIsImV4cCI6MjEwMDc2MDM0Mn0.EvAmPcHsgIzJLhFZUlPfp9ujjQr2OfXX4ANnIZifdAc';

const STATS = [
  {"url": "https://es.besoccer.com/jugador/p-blanco-3326560", "est_partidos": 3, "est_minutos": 270, "est_goles": 0, "est_asistencias": 0, "est_amarillas": 0, "est_rojas": 0},
  {"url": "https://es.besoccer.com/jugador/i-mena-3242417", "est_partidos": 0, "est_minutos": 0, "est_goles": 0, "est_asistencias": 0, "est_amarillas": 0, "est_rojas": 0},
  {"url": "https://es.besoccer.com/jugador/j-edo-3570527", "est_partidos": 0, "est_minutos": 0, "est_goles": 0, "est_asistencias": 0, "est_amarillas": 0, "est_rojas": 0},
  {"url": "https://es.besoccer.com/jugador/ivan-julian-950854", "est_partidos": 3, "est_minutos": 270, "est_goles": 0, "est_asistencias": 0, "est_amarillas": 0, "est_rojas": 0},
  {"url": "https://es.besoccer.com/jugador/a-badia-876566", "est_partidos": 3, "est_minutos": 132, "est_goles": 0, "est_asistencias": 0, "est_amarillas": 0, "est_rojas": 0},
  {"url": "https://es.besoccer.com/jugador/alan-liesegang-gonzalez-195734", "est_partidos": 3, "est_minutos": 270, "est_goles": 0, "est_asistencias": 0, "est_amarillas": 1, "est_rojas": 0},
  {"url": "https://es.besoccer.com/jugador/joel-toledo-825405", "est_partidos": 3, "est_minutos": 261, "est_goles": 0, "est_asistencias": 0, "est_amarillas": 1, "est_rojas": 0},
  {"url": "https://es.besoccer.com/jugador/b-del-valle-3457149", "est_partidos": 0, "est_minutos": 0, "est_goles": 0, "est_asistencias": 0, "est_amarillas": 0, "est_rojas": 0},
  {"url": "https://es.besoccer.com/jugador/a-prat-3725679", "est_partidos": 2, "est_minutos": 37, "est_goles": 0, "est_asistencias": 0, "est_amarillas": 1, "est_rojas": 0},
  {"url": "https://es.besoccer.com/jugador/alejandro-pereira-993089", "est_partidos": 2, "est_minutos": 138, "est_goles": 0, "est_asistencias": 0, "est_amarillas": 0, "est_rojas": 0},
  {"url": "https://es.besoccer.com/jugador/g-escarrabill-326860", "est_partidos": 2, "est_minutos": 165, "est_goles": 0, "est_asistencias": 0, "est_amarillas": 0, "est_rojas": 0},
  {"url": "https://es.besoccer.com/jugador/aaron-bocardo-993189", "est_partidos": 3, "est_minutos": 193, "est_goles": 0, "est_asistencias": 0, "est_amarillas": 0, "est_rojas": 0},
  {"url": "https://es.besoccer.com/jugador/a-garcia-923465", "est_partidos": 3, "est_minutos": 251, "est_goles": 0, "est_asistencias": 0, "est_amarillas": 0, "est_rojas": 0},
  {"url": "https://es.besoccer.com/jugador/y-bouchane-3447219", "est_partidos": 0, "est_minutos": 0, "est_goles": 0, "est_asistencias": 0, "est_amarillas": 0, "est_rojas": 0},
  {"url": "https://es.besoccer.com/jugador/s-hernandez-3331852", "est_partidos": 3, "est_minutos": 79, "est_goles": 0, "est_asistencias": 0, "est_amarillas": 0, "est_rojas": 0},
  {"url": "https://es.besoccer.com/jugador/p-jimenez-3570531", "est_partidos": 2, "est_minutos": 54, "est_goles": 0, "est_asistencias": 0, "est_amarillas": 0, "est_rojas": 0},
  {"url": "https://es.besoccer.com/jugador/fran-orellana-200156", "est_partidos": 3, "est_minutos": 242, "est_goles": 1, "est_asistencias": 0, "est_amarillas": 1, "est_rojas": 0},
  {"url": "https://es.besoccer.com/jugador/a-juwara-999228", "est_partidos": 3, "est_minutos": 186, "est_goles": 1, "est_asistencias": 0, "est_amarillas": 0, "est_rojas": 0},
  {"url": "https://es.besoccer.com/jugador/elhadji-thiam-993129", "est_partidos": 3, "est_minutos": 158, "est_goles": 0, "est_asistencias": 0, "est_amarillas": 0, "est_rojas": 0},
  {"url": "https://es.besoccer.com/jugador/alberto-993833", "est_partidos": 3, "est_minutos": 103, "est_goles": 0, "est_asistencias": 0, "est_amarillas": 0, "est_rojas": 0},
  {"url": "https://es.besoccer.com/jugador/e-compte-3331992", "est_partidos": 2, "est_minutos": 84, "est_goles": 1, "est_asistencias": 0, "est_amarillas": 0, "est_rojas": 0},
  {"url": "https://es.besoccer.com/jugador/a-amate-3184125", "est_partidos": 2, "est_minutos": 77, "est_goles": 0, "est_asistencias": 0, "est_amarillas": 1, "est_rojas": 0},
  {"url": "https://es.besoccer.com/jugador/r-ortega-3326594", "est_partidos": 0, "est_minutos": 0, "est_goles": 0, "est_asistencias": 0, "est_amarillas": 0, "est_rojas": 0}
];

async function run() {
  const playersRes = await fetch(SUPABASE_URL + '/rest/v1/jugadores?select=id,foto_url', {
    headers: { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY }
  });
  const dbPlayers = await playersRes.json();

  for (const s of STATS) {
    const matchId = s.url.match(/-(\d+)$/);
    if (!matchId) continue;
    const besoccerId = matchId[1];
    
    // Find player in DB that has this id in their foto_url
    const player = dbPlayers.find(p => p.foto_url && p.foto_url.includes(`${besoccerId}.jpg`));
    
    if (player) {
      console.log(`Updating ${besoccerId} (${player.id}) ...`);
      await fetch(SUPABASE_URL + `/rest/v1/jugadores?id=eq.${player.id}`, {
        method: 'PATCH',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': 'Bearer ' + SUPABASE_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          est_partidos: s.est_partidos,
          est_minutos: s.est_minutos,
          est_goles: s.est_goles,
          est_asistencias: s.est_asistencias,
          est_amarillas: s.est_amarillas,
          est_rojas: s.est_rojas,
          partidos_analizados: s.est_partidos,
          minutos_jugados: s.est_minutos
        })
      });
      console.log('✅ Updated!');
    } else {
      console.log(`❌ Player not found for ${besoccerId}`);
    }
  }
}
run();
