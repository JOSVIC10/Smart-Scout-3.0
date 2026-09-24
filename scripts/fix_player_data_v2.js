/**
 * fix_player_data_v2.js
 * 
 * CORRECCIÓN DEFINITIVA de los datos de todos los 23 jugadores del FE Grama.
 * Datos verificados directamente del DOM de BeSoccer mediante inspección en vivo.
 */

const SUPABASE_URL = 'https://mnfxjxorffxnuxpdzzzd.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1uZnhqeG9yZmZ4bnV4cGR6enpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxODQzNDIsImV4cCI6MjEwMDc2MDM0Mn0.EvAmPcHsgIzJLhFZUlPfp9ujjQr2OfXX4ANnIZifdAc';

const delay = ms => new Promise(res => setTimeout(res, ms));

const CORRECCIONES = [
  // ==========================================
  // PORTEROS (3)
  // ==========================================
  {
    besoccer_id: '3242417',
    nombre: 'Izan',
    apellidos: 'Mena Hernandez',
    fecha_nacimiento: '2006-01-01',
    posicion: 'POR',
    posicion_detallada: 'POR',
    nacionalidad: 'España',
    altura_cm: null,
    peso_kg: null,
    pie_preferido: 'derecho',
    valor_mercado: '2 K€',
    dorsal: 13,
    est_partidos: 3,
    est_goles: 0,
    est_amarillas: 0,
    est_rojas: 0
  },
  {
    besoccer_id: '3326560',
    nombre: 'Pau',
    apellidos: 'Blanco Muñoz',
    fecha_nacimiento: '2005-01-23',
    posicion: 'POR',
    posicion_detallada: 'POR',
    nacionalidad: 'España',
    altura_cm: 192,
    peso_kg: null,
    pie_preferido: 'derecho',
    valor_mercado: '4 K€',
    dorsal: 1,
    est_partidos: 16,
    est_goles: 0,
    est_amarillas: 1,
    est_rojas: 0
  },
  {
    besoccer_id: '3570527',
    nombre: 'Jan Pere',
    apellidos: 'Edo Moreno',
    fecha_nacimiento: null,
    posicion: 'POR',
    posicion_detallada: 'POR',
    nacionalidad: 'España',
    altura_cm: null,
    peso_kg: null,
    pie_preferido: 'derecho',
    valor_mercado: null,
    dorsal: null,
    est_partidos: 14,
    est_goles: 0,
    est_amarillas: 0,
    est_rojas: 0
  },

  // ==========================================
  // DEFENSAS (7)
  // ==========================================
  {
    besoccer_id: '876566',
    nombre: 'Antonio José',
    apellidos: 'Badía Esteban',
    fecha_nacimiento: '2000-05-18',
    posicion: 'DFC',
    posicion_detallada: 'DFC',
    nacionalidad: 'España',
    altura_cm: 186,
    peso_kg: 75,
    pie_preferido: 'derecho',
    valor_mercado: '17 K€',
    dorsal: 4,
    est_partidos: 22,
    est_goles: 3,
    est_amarillas: 7,
    est_rojas: 0
  },
  {
    besoccer_id: '825405',
    nombre: 'Joel',
    apellidos: 'Toledo Lorenzo',
    fecha_nacimiento: '2001-05-07',
    posicion: 'LAT',
    posicion_detallada: 'LAT_DER',
    nacionalidad: 'España',
    altura_cm: 170,
    peso_kg: null,
    pie_preferido: 'derecho',
    valor_mercado: '27 K€',
    dorsal: 3,
    est_partidos: 28,
    est_goles: 2,
    est_amarillas: 9,
    est_rojas: 2
  },
  {
    besoccer_id: '195734',
    nombre: 'Alan',
    apellidos: 'Liesegang González',
    fecha_nacimiento: '1993-03-27',
    posicion: 'DFC',
    posicion_detallada: 'DFC',
    nacionalidad: 'Uruguay',
    altura_cm: 184,
    peso_kg: 74,
    pie_preferido: 'derecho',
    valor_mercado: '13 K€',
    dorsal: 5,
    est_partidos: 27,
    est_goles: 2,
    est_amarillas: 9,
    est_rojas: 0
  },
  {
    besoccer_id: '950854',
    nombre: 'Ivan',
    apellidos: 'Julian Jareño',
    fecha_nacimiento: '2002-01-08',
    posicion: 'LAT',
    posicion_detallada: 'LAT_IZQ',
    nacionalidad: 'España',
    altura_cm: null,
    peso_kg: null,
    pie_preferido: 'izquierdo',
    valor_mercado: '23 K€',
    dorsal: 11,
    est_partidos: 27,
    est_goles: 1,
    est_amarillas: 7,
    est_rojas: 1
  },
  {
    besoccer_id: '993089',
    nombre: 'Alejandro',
    apellidos: 'Pereira Pacha',
    fecha_nacimiento: '2002-01-10',
    posicion: 'DFC',
    posicion_detallada: 'DFC',
    nacionalidad: 'España',
    altura_cm: 185,
    peso_kg: 80,
    pie_preferido: 'derecho',
    valor_mercado: '22 K€',
    dorsal: 15,
    est_partidos: 18,
    est_goles: 1,
    est_amarillas: 5,
    est_rojas: 0
  },
  {
    besoccer_id: '3457149',
    nombre: 'Biel',
    apellidos: 'Del Valle Palleja',
    fecha_nacimiento: '2005-01-01',
    posicion: 'DFC',
    posicion_detallada: 'DFC',
    nacionalidad: 'España',
    altura_cm: null,
    peso_kg: null,
    pie_preferido: 'derecho',
    valor_mercado: '7 K€',
    dorsal: 2,
    est_partidos: 35,
    est_goles: 1,
    est_amarillas: 6,
    est_rojas: 1
  },
  {
    besoccer_id: '3725679',
    nombre: 'Arnau',
    apellidos: 'Prat Bosacoma',
    fecha_nacimiento: '2006-01-01',
    posicion: 'LAT',
    posicion_detallada: 'LAT_IZQ',
    nacionalidad: 'España',
    altura_cm: null,
    peso_kg: null,
    pie_preferido: 'izquierdo',
    valor_mercado: null,
    dorsal: 21,
    est_partidos: 0,
    est_goles: 0,
    est_amarillas: 0,
    est_rojas: 0
  },

  // ==========================================
  // CENTROCAMPISTAS (6)
  // ==========================================
  {
    besoccer_id: '326860',
    nombre: 'Guillem',
    apellidos: 'Escarrabill Ruiz',
    fecha_nacimiento: '1999-10-06',
    posicion: 'MC',
    posicion_detallada: 'MC_CEN',
    nacionalidad: 'España',
    altura_cm: null,
    peso_kg: null,
    pie_preferido: 'derecho',
    valor_mercado: '35 K€',
    dorsal: 6,
    est_partidos: 28,
    est_goles: 4,
    est_amarillas: 7,
    est_rojas: 0
  },
  {
    besoccer_id: '923465',
    nombre: 'Adrià',
    apellidos: 'García Feliu',
    fecha_nacimiento: '2003-07-07',
    posicion: 'MC',
    posicion_detallada: 'MC_CEN',
    nacionalidad: 'España',
    altura_cm: 180,
    peso_kg: null,
    pie_preferido: 'derecho',
    valor_mercado: '37 K€',
    dorsal: 20,
    est_partidos: 20,
    est_goles: 0,
    est_amarillas: 3,
    est_rojas: 0
  },
  {
    besoccer_id: '993189',
    nombre: 'Aaron',
    apellidos: 'Bocardo Canovas',
    fecha_nacimiento: '2002-01-09',
    posicion: 'MC',
    posicion_detallada: 'MC_CEN',
    nacionalidad: 'España',
    altura_cm: null,
    peso_kg: null,
    pie_preferido: 'derecho',
    valor_mercado: '28 K€',
    dorsal: 17,
    est_partidos: 28,
    est_goles: 4,
    est_amarillas: 7,
    est_rojas: 0
  },
  {
    besoccer_id: '3331852',
    nombre: 'Sergi',
    apellidos: 'Hernandez Miralles',
    fecha_nacimiento: '2000-10-28',
    posicion: 'MC',
    posicion_detallada: 'MC_DER',
    nacionalidad: 'España',
    altura_cm: null,
    peso_kg: null,
    pie_preferido: 'derecho',
    valor_mercado: '7 K€',
    dorsal: 8,
    est_partidos: 30,
    est_goles: 2,
    est_amarillas: 6,
    est_rojas: 0
  },
  {
    besoccer_id: '3447219',
    nombre: 'Yassin',
    apellidos: 'Bouchane',
    fecha_nacimiento: '2005-01-01',
    posicion: 'MC',
    posicion_detallada: 'MC_DER',
    nacionalidad: 'España',
    altura_cm: null,
    peso_kg: null,
    pie_preferido: 'derecho',
    valor_mercado: '4 K€',
    dorsal: 20,
    est_partidos: 23,
    est_goles: 0,
    est_amarillas: 3,
    est_rojas: 0
  },
  {
    besoccer_id: '3570531',
    nombre: 'Pol',
    apellidos: 'Jimenez Hernandez',
    fecha_nacimiento: null,
    posicion: 'MC',
    posicion_detallada: 'MC_DER',
    nacionalidad: 'España',
    altura_cm: null,
    peso_kg: null,
    pie_preferido: 'derecho',
    valor_mercado: null,
    dorsal: 23,
    est_partidos: 28,
    est_goles: 3,
    est_amarillas: 2,
    est_rojas: 0
  },

  // ==========================================
  // DELANTEROS (7)
  // ==========================================
  {
    besoccer_id: '999228',
    nombre: 'Abubacarry',
    apellidos: 'Juwara',
    fecha_nacimiento: '2002-08-22',
    posicion: 'EXT',
    posicion_detallada: 'EXT_DER',
    nacionalidad: 'Gambia',
    altura_cm: null,
    peso_kg: null,
    pie_preferido: 'derecho',
    valor_mercado: '44 K€',
    dorsal: 10,
    est_partidos: 35,
    est_goles: 6,
    est_amarillas: 7,
    est_rojas: 0
  },
  {
    besoccer_id: '993129',
    nombre: 'Elhadji Ousseynou',
    apellidos: 'Thiam Pedrera',
    fecha_nacimiento: '2003-01-31',
    posicion: 'DC',
    posicion_detallada: 'DC',
    nacionalidad: 'España',
    altura_cm: null,
    peso_kg: null,
    pie_preferido: 'derecho',
    valor_mercado: '30 K€',
    dorsal: 19,
    est_partidos: 31,
    est_goles: 5,
    est_amarillas: 5,
    est_rojas: 0
  },
  {
    besoccer_id: '200156',
    nombre: 'Francisco',
    apellidos: 'Orellana Gómez',
    fecha_nacimiento: '1995-09-06',
    posicion: 'EXT',
    posicion_detallada: 'EXT_DER',
    nacionalidad: 'España',
    altura_cm: null,
    peso_kg: null,
    pie_preferido: 'derecho',
    valor_mercado: '24 K€',
    dorsal: 16,
    est_partidos: 34,
    est_goles: 11,
    est_amarillas: 4,
    est_rojas: 0
  },
  {
    besoccer_id: '993833',
    nombre: 'Alberto',
    apellidos: 'Salamanca Palacios',
    fecha_nacimiento: '2002-07-12',
    posicion: 'EXT',
    posicion_detallada: 'EXT_IZQ',
    nacionalidad: 'España',
    altura_cm: null,
    peso_kg: null,
    pie_preferido: 'izquierdo',
    valor_mercado: '27 K€',
    dorsal: 14,
    est_partidos: 33,
    est_goles: 4,
    est_amarillas: 11,
    est_rojas: 0
  },
  {
    besoccer_id: '3331992',
    nombre: 'Eric',
    apellidos: 'Compte Copoví',
    fecha_nacimiento: '2004-01-01',
    posicion: 'DC',
    posicion_detallada: 'DC',
    nacionalidad: 'España',
    altura_cm: null,
    peso_kg: null,
    pie_preferido: 'derecho',
    valor_mercado: '6 K€',
    dorsal: 9,
    est_partidos: 31,
    est_goles: 7,
    est_amarillas: 4,
    est_rojas: 1
  },
  {
    besoccer_id: '3184125',
    nombre: 'Alexandre',
    apellidos: 'Amate Roldan',
    fecha_nacimiento: '2004-08-15',
    posicion: 'EXT',
    posicion_detallada: 'EXT_DER',
    nacionalidad: 'España',
    altura_cm: null,
    peso_kg: null,
    pie_preferido: 'derecho',
    valor_mercado: '13 K€',
    dorsal: 7,
    est_partidos: 9,
    est_goles: 1,
    est_amarillas: 0,
    est_rojas: 0
  },
  {
    besoccer_id: '3326594',
    nombre: 'Ricard',
    apellidos: 'Ortega Velázquez',
    fecha_nacimiento: '2006-01-01',
    posicion: 'EXT',
    posicion_detallada: 'EXT_IZQ',
    nacionalidad: 'España',
    altura_cm: null,
    peso_kg: null,
    pie_preferido: 'izquierdo',
    valor_mercado: '3 K€',
    dorsal: 22,
    est_partidos: 16,
    est_goles: 0,
    est_amarillas: 2,
    est_rojas: 0
  }
];

async function run() {
  console.log('🔍 Obteniendo jugadores de Supabase...');
  
  const res = await fetch(
    SUPABASE_URL + '/rest/v1/jugadores?club_id=eq.e0000001-0000-0000-0000-000000000001&select=id,nombre,apellidos,foto_url',
    { headers: { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY } }
  );
  const players = await res.json();
  console.log(`📋 Encontrados ${players.length} jugadores en la BD.\n`);

  let updated = 0;
  let skipped = 0;
  let errors = 0;

  for (const correccion of CORRECCIONES) {
    const { besoccer_id, ...updateData } = correccion;
    
    const player = players.find(p => p.foto_url && p.foto_url.includes(`/${besoccer_id}.`));
    
    if (!player) {
      console.log(`⚠️ No encontrado en BD: BeSoccer ID ${besoccer_id} (${updateData.nombre} ${updateData.apellidos})`);
      skipped++;
      continue;
    }

    const oldName = `${player.nombre} ${player.apellidos}`.trim();
    const newName = `${updateData.nombre} ${updateData.apellidos}`.trim();
    
    console.log(`🔄 Actualizando [${besoccer_id}]: "${oldName}" → "${newName}"`);
    console.log(`   Pos: ${updateData.posicion} (${updateData.posicion_detallada}) | F.Nac: ${updateData.fecha_nacimiento || 'N/A'} | Nac: ${updateData.nacionalidad} | Dorsal: ${updateData.dorsal || '-'}`);

    try {
      const patchRes = await fetch(
        SUPABASE_URL + `/rest/v1/jugadores?id=eq.${player.id}`,
        {
          method: 'PATCH',
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': 'Bearer ' + SUPABASE_KEY,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify(updateData)
        }
      );

      if (patchRes.ok) {
        console.log(`   ✅ Correcto\n`);
        updated++;
      } else {
        const errText = await patchRes.text();
        console.log(`   ❌ Error ${patchRes.status}: ${errText}\n`);
        errors++;
      }
    } catch (e) {
      console.log(`   ❌ Error de red: ${e.message}\n`);
      errors++;
    }

    await delay(150);
  }

  console.log('='.repeat(60));
  console.log('📊 RESUMEN FINAL DE ACTUALIZACIÓN:');
  console.log(`   ✅ Actualizados exitosamente: ${updated} / ${CORRECCIONES.length}`);
  console.log(`   ⚠️ No encontrados: ${skipped}`);
  console.log(`   ❌ Errores: ${errors}`);
  console.log('='.repeat(60));
}

run().catch(console.error);
