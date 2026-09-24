const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(
  'https://mnfxjxorffxnuxpdzzzd.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1uZnhqeG9yZmZ4bnV4cGR6enpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxODQzNDIsImV4cCI6MjEwMDc2MDM0Mn0.EvAmPcHsgIzJLhFZUlPfp9ujjQr2OfXX4ANnIZifdAc'
);

const scrapedData = [
  {
    "nombre": "Guiu Escobar",
    "posicion": "Portero",
    "edad": 20,
    "pj": 24,
    "minutos": 2160,
    "goles": 0,
    "goles_encajados": 25,
    "asistencias": 0,
    "ta": 0,
    "tr": 1
  },
  {
    "nombre": "Arnau Meca",
    "posicion": "Portero",
    "edad": 21,
    "pj": 10,
    "minutos": 900,
    "goles": 0,
    "goles_encajados": 10,
    "asistencias": 0,
    "ta": 0,
    "tr": 1
  },
  {
    "nombre": "N. Montoro",
    "posicion": "Portero",
    "edad": 19,
    "pj": 0,
    "minutos": null,
    "goles": 0,
    "asistencias": 0,
    "ta": 0,
    "tr": 0
  },
  {
    "nombre": "M. Regaño",
    "posicion": "Portero",
    "edad": 19,
    "pj": 0,
    "minutos": null,
    "goles": 0,
    "asistencias": 0,
    "ta": 0,
    "tr": 0
  },
  {
    "nombre": "J. Ramírez",
    "posicion": "Portero",
    "edad": 21,
    "pj": 0,
    "minutos": null,
    "goles": 0,
    "asistencias": 0,
    "ta": 0,
    "tr": 0
  },
  {
    "nombre": "Marc Canteras",
    "posicion": "Defensa",
    "edad": 21,
    "pj": 31,
    "minutos": 2600,
    "goles": 1,
    "asistencias": 0,
    "ta": 5,
    "tr": 0
  },
  {
    "nombre": "M. Martínez",
    "posicion": "Defensa",
    "edad": 25,
    "pj": 21,
    "minutos": 1600,
    "goles": 1,
    "asistencias": 0,
    "ta": 1,
    "tr": 0
  },
  {
    "nombre": "Ivan Julian",
    "posicion": "Defensa",
    "edad": 24,
    "pj": 27,
    "minutos": 2200,
    "goles": 1,
    "asistencias": 0,
    "ta": 8,
    "tr": 0
  },
  {
    "nombre": "Joel Toledo",
    "posicion": "Defensa",
    "edad": 25,
    "pj": 29,
    "minutos": 2500,
    "goles": 1,
    "asistencias": 0,
    "ta": 4,
    "tr": 0
  },
  {
    "nombre": "Alan Liesegang González",
    "posicion": "Defensa",
    "edad": 33,
    "pj": 25,
    "minutos": 2100,
    "goles": 1,
    "asistencias": 0,
    "ta": 8,
    "tr": 0
  },
  {
    "nombre": "R. Peris",
    "posicion": "Defensa",
    "edad": 29,
    "pj": 26,
    "minutos": 2100,
    "goles": 3,
    "asistencias": 0,
    "ta": 2,
    "tr": 0
  },
  {
    "nombre": "B. Charreh",
    "posicion": "Defensa",
    "edad": 23,
    "pj": 31,
    "minutos": 2600,
    "goles": 0,
    "asistencias": 1,
    "ta": 6,
    "tr": 0
  },
  {
    "nombre": "B. Del Valle",
    "posicion": "Defensa",
    "edad": 21,
    "pj": 10,
    "minutos": 800,
    "goles": 1,
    "asistencias": 0,
    "ta": 2,
    "tr": 0
  },
  {
    "nombre": "A. Prat",
    "posicion": "Defensa",
    "edad": 20,
    "pj": 1,
    "minutos": 45,
    "goles": 0,
    "asistencias": 0,
    "ta": 0,
    "tr": 0
  },
  {
    "nombre": "D. Moya",
    "posicion": "Defensa",
    "edad": 19,
    "pj": 0,
    "minutos": null,
    "goles": 0,
    "asistencias": 0,
    "ta": 0,
    "tr": 0
  },
  {
    "nombre": "G. Escarrabill",
    "posicion": "Centrocampista",
    "edad": 26,
    "pj": 30,
    "minutos": 2500,
    "goles": 0,
    "asistencias": 0,
    "ta": 7,
    "tr": 0
  },
  {
    "nombre": "Pepe Bonilla",
    "posicion": "Centrocampista",
    "edad": 22,
    "pj": 29,
    "minutos": 2400,
    "goles": 5,
    "asistencias": 0,
    "ta": 2,
    "tr": 0
  },
  {
    "nombre": "F. Rius",
    "posicion": "Centrocampista",
    "edad": 20,
    "pj": 25,
    "minutos": 1900,
    "goles": 0,
    "asistencias": 0,
    "ta": 3,
    "tr": 0
  },
  {
    "nombre": "I. Varona",
    "posicion": "Centrocampista",
    "edad": 29,
    "pj": 29,
    "minutos": 2400,
    "goles": 1,
    "asistencias": 0,
    "ta": 2,
    "tr": 0
  },
  {
    "nombre": "Y. Bouchane",
    "posicion": "Centrocampista",
    "edad": 21,
    "pj": 20,
    "minutos": 1500,
    "goles": 0,
    "asistencias": 0,
    "ta": 5,
    "tr": 0
  },
  {
    "nombre": "P. Ibañez",
    "posicion": "Centrocampista",
    "edad": 19,
    "pj": 0,
    "minutos": null,
    "goles": 0,
    "asistencias": 0,
    "ta": 0,
    "tr": 0
  },
  {
    "nombre": "G. Vila",
    "posicion": "Centrocampista",
    "edad": 19,
    "pj": 0,
    "minutos": null,
    "goles": 0,
    "asistencias": 0,
    "ta": 0,
    "tr": 0
  },
  {
    "nombre": "S. Krubally",
    "posicion": "Centrocampista",
    "edad": 19,
    "pj": 1,
    "minutos": 15,
    "goles": 0,
    "asistencias": 0,
    "ta": 0,
    "tr": 0
  },
  {
    "nombre": "P. Jimenez",
    "posicion": "Centrocampista",
    "edad": null,
    "pj": 0,
    "minutos": null,
    "goles": 0,
    "asistencias": 0,
    "ta": 0,
    "tr": 0
  },
  {
    "nombre": "Adriá Padillo",
    "posicion": "Delantero",
    "edad": 26,
    "pj": 34,
    "minutos": 2608,
    "goles": 7,
    "asistencias": 0,
    "ta": 3,
    "tr": 0
  },
  {
    "nombre": "Fran Orellana",
    "posicion": "Delantero",
    "edad": 31,
    "pj": 31,
    "minutos": 2133,
    "goles": 11,
    "asistencias": 0,
    "ta": 4,
    "tr": 0
  },
  {
    "nombre": "Martí Alonso",
    "posicion": "Delantero",
    "edad": 23,
    "pj": 30,
    "minutos": 2400,
    "goles": 8,
    "asistencias": 0,
    "ta": 9,
    "tr": 0
  },
  {
    "nombre": "Daniel Peña",
    "posicion": "Delantero",
    "edad": 24,
    "pj": 4,
    "minutos": 200,
    "goles": 0,
    "asistencias": 0,
    "ta": 1,
    "tr": 0
  },
  {
    "nombre": "Erik",
    "posicion": "Delantero",
    "edad": 26,
    "pj": 14,
    "minutos": 900,
    "goles": 1,
    "asistencias": 0,
    "ta": 1,
    "tr": 0
  },
  {
    "nombre": "Alexandre Amate",
    "posicion": "Delantero",
    "edad": 22,
    "pj": 9,
    "minutos": 450,
    "goles": 1,
    "asistencias": 0,
    "ta": 0,
    "tr": 0
  },
  {
    "nombre": "Roberto Morales",
    "posicion": "Delantero",
    "edad": 45,
    "pj": 0,
    "minutos": null,
    "goles": 0,
    "asistencias": 0,
    "ta": 1,
    "tr": 0
  }
];

function normalizeString(str) {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

async function run() {
  const { data: dbPlayers, error } = await supabase
    .from('jugadores')
    .select('*')
    .eq('club_id', 'e0000001-0000-0000-0000-000000000001');

  if (error) {
    console.error('Error fetching from DB:', error);
    return;
  }

  for (const dbPlayer of dbPlayers) {
    const dbFullName = normalizeString(`${dbPlayer.nombre} ${dbPlayer.apellidos}`);
    
    // Find best match in scraped data
    let bestMatch = null;
    let highestScore = 0;

    for (const sPlayer of scrapedData) {
      const sName = normalizeString(sPlayer.nombre);
      
      // If it's a direct substring match
      if (dbFullName.includes(sName) || sName.includes(dbFullName)) {
        bestMatch = sPlayer;
        break;
      }
      
      // Initials mapping like M. Martínez -> Marc Martínez
      if (sName.includes('.')) {
         const parts = sName.split('.');
         const initial = parts[0].trim();
         const lastName = parts[1].trim();
         if (dbFullName.startsWith(initial) && dbFullName.includes(lastName)) {
             bestMatch = sPlayer;
             break;
         }
      }
      
      // Fran Orellana -> Francisco Orellana
      if (sName === 'fran orellana' && dbFullName.includes('francisco orellana')) {
          bestMatch = sPlayer;
          break;
      }
    }

    if (bestMatch) {
      console.log(`Matched: ${dbPlayer.nombre} ${dbPlayer.apellidos} -> ${bestMatch.nombre}`);
      
      let mins = bestMatch.minutos;
      // si null, imputamos min (pj * 70 aprox para los reservas y titular)
      if (mins === null) {
          mins = Math.round(bestMatch.pj * 70);
      }

      const updatePayload = {
        est_partidos: bestMatch.pj || 0,
        est_minutos: mins || 0,
        est_goles: bestMatch.goles || 0,
        est_asistencias: bestMatch.asistencias || 0,
        est_amarillas: bestMatch.ta || 0,
        est_rojas: bestMatch.tr || 0
      };

      const { error: updateError } = await supabase
        .from('jugadores')
        .update(updatePayload)
        .eq('id', dbPlayer.id);

      if (updateError) {
        console.error(`Failed to update ${dbPlayer.nombre}`, updateError);
      } else {
        console.log(`✅ Updated ${dbPlayer.nombre} ${dbPlayer.apellidos} with PJ: ${bestMatch.pj}, G: ${bestMatch.goles}`);
      }
    } else {
      console.log(`⚠️ No match found for: ${dbPlayer.nombre} ${dbPlayer.apellidos}`);
    }
  }
}

run();
