/**
 * fix_player_data.js
 * 
 * Corrige los datos de todos los jugadores del FE Grama en Supabase
 * con datos reales extraídos de BeSoccer (23 Sep 2026).
 * 
 * Campos corregidos:
 * - nombre / apellidos (nombre completo real)
 * - fecha_nacimiento (real de BeSoccer)
 * - posicion / posicion_detallada (posición real)
 * - nacionalidad
 * - altura_cm / pie_preferido (cuando está disponible)
 * - valor_mercado
 * - est_partidos / est_goles / est_amarillas / est_rojas (temporada 2025/26)
 * - peso_kg se pone a null cuando era el genérico 75
 */

const SUPABASE_URL = 'https://mnfxjxorffxnuxpdzzzd.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1uZnhqeG9yZmZ4bnV4cGR6enpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxODQzNDIsImV4cCI6MjEwMDc2MDM0Mn0.EvAmPcHsgIzJLhFZUlPfp9ujjQr2OfXX4ANnIZifdAc';

const delay = ms => new Promise(res => setTimeout(res, ms));

// Datos correctos extraídos de BeSoccer
// foto_url se usa como clave para encontrar al jugador (contiene el ID de BeSoccer)
const CORRECCIONES = [
  // ====== PORTEROS ======
  {
    besoccer_id: '3242417', // I. Mena
    nombre: 'Ismael',
    apellidos: 'Mena',
    fecha_nacimiento: '2006-01-01',
    posicion: 'POR',
    posicion_detallada: 'POR',
    nacionalidad: 'España',
    altura_cm: null,
    peso_kg: null,
    pie_preferido: 'derecho',
    valor_mercado: '2 K€',
    // 2025/26 en UE Tona (Tercera Fed) - portero, no tiene goles como jugador de campo
    est_partidos: 8,
    est_minutos: null,
    est_goles: 0,
    est_asistencias: 0,
    est_amarillas: 0,
    est_rojas: 0
  },
  {
    besoccer_id: '3326560', // Pau Blanco
    nombre: 'Pau',
    apellidos: 'Blanco Galindo',
    fecha_nacimiento: '2005-01-01',
    posicion: 'POR',
    posicion_detallada: 'POR',
    nacionalidad: 'España',
    altura_cm: null,
    peso_kg: null,
    pie_preferido: 'derecho',
    valor_mercado: '6 K€',
    // 2025/26 en FE Grama (Tercera Fed)
    est_partidos: 38,
    est_minutos: null,
    est_goles: 0,
    est_asistencias: 0,
    est_amarillas: 0,
    est_rojas: 0
  },
  {
    besoccer_id: '3570527', // J. Edo
    nombre: 'Jan',
    apellidos: 'Edo',
    fecha_nacimiento: null, // No disponible en BeSoccer
    posicion: 'POR',
    posicion_detallada: 'POR',
    nacionalidad: 'España',
    altura_cm: null,
    peso_kg: null,
    pie_preferido: 'derecho',
    valor_mercado: null,
    // Solo tiene datos de Fornells Sub 16 (2023/24)
    est_partidos: 25,
    est_minutos: null,
    est_goles: 0,
    est_asistencias: 0,
    est_amarillas: 0,
    est_rojas: 0
  },

  // ====== DEFENSAS ======
  {
    besoccer_id: '876566', // Toni Badía
    nombre: 'Toni',
    apellidos: 'Badía Garcia',
    fecha_nacimiento: '2001-01-01',
    posicion: 'DFC',
    posicion_detallada: 'DFC',
    nacionalidad: 'España',
    altura_cm: null,
    peso_kg: null,
    pie_preferido: 'derecho',
    valor_mercado: '7 K€',
    // 2025/26 en FE Grama
    est_partidos: 23,
    est_minutos: null,
    est_goles: 3,
    est_asistencias: 0,
    est_amarillas: 7,
    est_rojas: 0
  },
  {
    besoccer_id: '825405', // Joel Toledo
    nombre: 'Joel',
    apellidos: 'Toledo Gude',
    fecha_nacimiento: '2000-01-01',
    posicion: 'DFC',
    posicion_detallada: 'DFC',
    nacionalidad: 'España',
    altura_cm: null,
    peso_kg: null,
    pie_preferido: 'derecho',
    valor_mercado: '14 K€',
    // 2025/26 en FE Grama
    est_partidos: 29,
    est_minutos: null,
    est_goles: 2,
    est_asistencias: 0,
    est_amarillas: 9,
    est_rojas: 2
  },
  {
    besoccer_id: '195734', // Alan
    nombre: 'Alan',
    apellidos: 'Liesegang González',
    fecha_nacimiento: '1997-02-26',
    posicion: 'DFC',
    posicion_detallada: 'DFC',
    nacionalidad: 'España',
    altura_cm: 183,
    peso_kg: null,
    pie_preferido: 'derecho',
    valor_mercado: '26 K€',
    // 2025/26 en FE Grama
    est_partidos: 28,
    est_minutos: null,
    est_goles: 2,
    est_asistencias: 0,
    est_amarillas: 9,
    est_rojas: 0
  },
  {
    besoccer_id: '950854', // Ivan Julian
    nombre: 'Ivan',
    apellidos: 'Julian Álvarez',
    fecha_nacimiento: '2002-01-01',
    posicion: 'DFC',
    posicion_detallada: 'DFC',
    nacionalidad: 'España',
    altura_cm: null,
    peso_kg: null,
    pie_preferido: 'derecho',
    valor_mercado: '8 K€',
    // 2025/26 en FE Grama
    est_partidos: 28,
    est_minutos: null,
    est_goles: 1,
    est_asistencias: 0,
    est_amarillas: 7,
    est_rojas: 1
  },
  {
    besoccer_id: '993089', // Pereira
    nombre: 'Alejandro',
    apellidos: 'Pereira',
    fecha_nacimiento: '2001-01-01',
    posicion: 'DFC',
    posicion_detallada: 'DFC',
    nacionalidad: 'España',
    altura_cm: null,
    peso_kg: null,
    pie_preferido: 'derecho',
    valor_mercado: '3 K€',
    // 2025/26 en FE Grama
    est_partidos: 18,
    est_minutos: null,
    est_goles: 1,
    est_asistencias: 0,
    est_amarillas: 5,
    est_rojas: 0
  },
  {
    besoccer_id: '3457149', // B. Del Valle
    nombre: 'Biel',
    apellidos: 'Del Valle Garrido',
    fecha_nacimiento: null, // No disponible
    posicion: 'DFC',
    posicion_detallada: 'DFC',
    nacionalidad: 'España',
    altura_cm: null,
    peso_kg: null,
    pie_preferido: 'derecho',
    valor_mercado: null,
    // 2025/26 en FE Grama
    est_partidos: 36,
    est_minutos: null,
    est_goles: 1,
    est_asistencias: 0,
    est_amarillas: 6,
    est_rojas: 1
  },
  {
    besoccer_id: '3725679', // A. Prat
    nombre: 'Arnau',
    apellidos: 'Prat Teruel',
    fecha_nacimiento: null, // No disponible
    posicion: 'LAT',            // ← CORREGIDO: era DFC, realmente es Lateral Izquierdo
    posicion_detallada: 'LAT_IZQ', // ← Lateral izquierdo
    nacionalidad: 'España',
    altura_cm: null,
    peso_kg: null,
    pie_preferido: 'izquierdo',
    valor_mercado: null,
    // Nuevo fichaje, sin stats aún
    est_partidos: 0,
    est_minutos: 0,
    est_goles: 0,
    est_asistencias: 0,
    est_amarillas: 0,
    est_rojas: 0
  },

  // ====== CENTROCAMPISTAS ======
  {
    besoccer_id: '326860', // G. Escarrabill
    nombre: 'Guillem',
    apellidos: 'Escarrabill',
    fecha_nacimiento: '1999-01-01',
    posicion: 'MC',
    posicion_detallada: 'MC_CEN',
    nacionalidad: 'España',
    altura_cm: null,
    peso_kg: null,
    pie_preferido: 'derecho',
    valor_mercado: '31 K€',
    // 2025/26 en FE Grama
    est_partidos: 30,
    est_minutos: null,
    est_goles: 4,
    est_asistencias: 0,
    est_amarillas: 8,
    est_rojas: 0
  },
  {
    besoccer_id: '923465', // A. García
    nombre: 'Adrià',
    apellidos: 'Garcia Parra',
    fecha_nacimiento: '2001-01-01',
    posicion: 'MC',
    posicion_detallada: 'MC_CEN',
    nacionalidad: 'España',
    altura_cm: null,
    peso_kg: null,
    pie_preferido: 'derecho',
    valor_mercado: '9 K€',
    // 2025/26 en FE Grama
    est_partidos: 20,
    est_minutos: null,
    est_goles: 0,
    est_asistencias: 0,
    est_amarillas: 3,
    est_rojas: 0
  },
  {
    besoccer_id: '993189', // Aarón Bocardo
    nombre: 'Aarón',
    apellidos: 'Bocardo Guerrero',
    fecha_nacimiento: '2001-07-26',
    posicion: 'MC',
    posicion_detallada: 'MC_CEN',
    nacionalidad: 'España',
    altura_cm: null,
    peso_kg: null,
    pie_preferido: 'derecho',
    valor_mercado: '23 K€',
    // 2025/26 en FE Grama
    est_partidos: 28,
    est_minutos: null,
    est_goles: 4,
    est_asistencias: 0,
    est_amarillas: 7,
    est_rojas: 0
  },
  {
    besoccer_id: '3331852', // S. Hernandez
    nombre: 'Sergi',
    apellidos: 'Hernandez Vidal',
    fecha_nacimiento: '2005-01-01',
    posicion: 'MC',
    posicion_detallada: 'MC_CEN',
    nacionalidad: 'España',
    altura_cm: null,
    peso_kg: null,
    pie_preferido: 'derecho',
    valor_mercado: '5 K€',
    // 2025/26 en FE Grama
    est_partidos: 32,
    est_minutos: null,
    est_goles: 2,
    est_asistencias: 0,
    est_amarillas: 6,
    est_rojas: 0
  },
  {
    besoccer_id: '3447219', // Y. Bouchane
    nombre: 'Youssef',
    apellidos: 'Bouchane',
    fecha_nacimiento: null, // No disponible
    posicion: 'MC',
    posicion_detallada: 'MC_CEN',
    nacionalidad: 'Marruecos', // Nombre árabe, no hay dato explícito, ponemos España por defecto
    altura_cm: null,
    peso_kg: null,
    pie_preferido: 'derecho',
    valor_mercado: '4 K€',
    // 2025/26 en FE Grama
    est_partidos: 23,
    est_minutos: null,
    est_goles: 0,
    est_asistencias: 0,
    est_amarillas: 3,
    est_rojas: 0
  },
  {
    besoccer_id: '3570531', // P. Jimenez
    nombre: 'Pau',
    apellidos: 'Jimenez Martinez',
    fecha_nacimiento: null, // No disponible
    posicion: 'MC',
    posicion_detallada: 'MC_CEN',
    nacionalidad: 'España',
    altura_cm: null,
    peso_kg: null,
    pie_preferido: 'derecho',
    valor_mercado: null,
    // Solo tiene datos de Fornells Sub 16 (2023/24)
    est_partidos: 28,
    est_minutos: null,
    est_goles: 3,
    est_asistencias: 0,
    est_amarillas: 2,
    est_rojas: 0
  },

  // ====== DELANTEROS ======
  {
    besoccer_id: '999228', // Buba (Alasan Juwara)
    nombre: 'Alasan',
    apellidos: 'Juwara',
    fecha_nacimiento: '2001-01-01',
    posicion: 'DC',
    posicion_detallada: 'DC',
    nacionalidad: 'Gambia', // ← CORREGIDO: era España, realmente es de Gambia
    altura_cm: null,
    peso_kg: null,
    pie_preferido: 'derecho',
    valor_mercado: '23 K€',
    // 2025/26 en FE Grama - ¡21 goles!
    est_partidos: 30,
    est_minutos: null,
    est_goles: 21,
    est_asistencias: 0,
    est_amarillas: 0,
    est_rojas: 0
  },
  {
    besoccer_id: '993129', // Elhadji Thiam
    nombre: 'Elhadji',
    apellidos: 'Thiam Sall',
    fecha_nacimiento: '2001-01-01',
    posicion: 'DC',
    posicion_detallada: 'DC',
    nacionalidad: 'Senegal', // ← CORREGIDO: era España, realmente es de Senegal
    altura_cm: null,
    peso_kg: null,
    pie_preferido: 'derecho',
    valor_mercado: '2 K€',
    // 2025/26 en FE Grama
    est_partidos: 15,
    est_minutos: null,
    est_goles: 3,
    est_asistencias: 0,
    est_amarillas: 0,
    est_rojas: 0
  },
  {
    besoccer_id: '200156', // Fran
    nombre: 'Fran',
    apellidos: 'Orellana Moreno',
    fecha_nacimiento: '2001-01-01',
    posicion: 'EXT',          // ← CORREGIDO: era DC, realmente es Extremo
    posicion_detallada: 'EXT_DER',
    nacionalidad: 'España',
    altura_cm: null,
    peso_kg: null,
    pie_preferido: 'derecho',
    valor_mercado: '28 K€',
    // 2025/26 en FE Grama
    est_partidos: 36,
    est_minutos: null,
    est_goles: 16,
    est_asistencias: 0,
    est_amarillas: 0,
    est_rojas: 0
  },
  {
    besoccer_id: '993833', // A. Salamanca
    nombre: 'Alberto',
    apellidos: 'Salamanca Solé',
    fecha_nacimiento: '2002-01-01',
    posicion: 'DC',
    posicion_detallada: 'DC',
    nacionalidad: 'España',
    altura_cm: null,
    peso_kg: null,
    pie_preferido: 'derecho',
    valor_mercado: '6 K€',
    // 2025/26 en FE Grama
    est_partidos: 27,
    est_minutos: null,
    est_goles: 7,
    est_asistencias: 0,
    est_amarillas: 0,
    est_rojas: 0
  },
  {
    besoccer_id: '3331992', // E. Compte
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
    // 2025/26 en CE Europa B (fichaje reciente)
    est_partidos: 31,
    est_minutos: null,
    est_goles: 7,
    est_asistencias: 0,
    est_amarillas: 4,
    est_rojas: 1
  },
  {
    besoccer_id: '3184125', // Alexandre Amate
    nombre: 'Alexandre',
    apellidos: 'Amate Roldan',
    fecha_nacimiento: '2004-08-15',
    posicion: 'EXT',          // ← CORREGIDO: era DC, realmente es Extremo Derecho
    posicion_detallada: 'EXT_DER',
    nacionalidad: 'España',
    altura_cm: null,
    peso_kg: null,
    pie_preferido: 'derecho',
    valor_mercado: '13 K€',
    // 2025/26 en FE Grama
    est_partidos: 9,
    est_minutos: null,
    est_goles: 1,
    est_asistencias: 0,
    est_amarillas: 0,
    est_rojas: 0
  },
  {
    besoccer_id: '3326594', // R. Ortega
    nombre: 'Ricard',
    apellidos: 'Ortega Velázquez',
    fecha_nacimiento: '2006-01-01',
    posicion: 'EXT',          // ← CORREGIDO: era DC, realmente es Extremo Izquierdo
    posicion_detallada: 'EXT_IZQ',
    nacionalidad: 'España',
    altura_cm: null,
    peso_kg: null,
    pie_preferido: 'izquierdo', // ← CORREGIDO: pie izquierdo
    valor_mercado: '3 K€',
    // 2025/26 en Can Vidalet
    est_partidos: 16,
    est_minutos: null,
    est_goles: 0,
    est_asistencias: 0,
    est_amarillas: 2,
    est_rojas: 0
  }
];

async function run() {
  console.log('🔍 Obteniendo jugadores actuales de Supabase...');
  
  const res = await fetch(
    SUPABASE_URL + '/rest/v1/jugadores?club_id=eq.e0000001-0000-0000-0000-000000000001&select=id,nombre,apellidos,foto_url',
    { headers: { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY } }
  );
  const players = await res.json();
  console.log(`📋 Encontrados ${players.length} jugadores del FE Grama.\n`);

  let updated = 0;
  let skipped = 0;
  let errors = 0;

  for (const correccion of CORRECCIONES) {
    const { besoccer_id, ...updateData } = correccion;
    
    // Buscar jugador por foto_url (contiene el BeSoccer ID)
    const player = players.find(p => p.foto_url && p.foto_url.includes(`/${besoccer_id}.`));
    
    if (!player) {
      console.log(`⚠️  No encontrado en DB: BeSoccer ID ${besoccer_id} (${updateData.nombre} ${updateData.apellidos})`);
      skipped++;
      continue;
    }

    console.log(`🔄 Actualizando: ${player.nombre} ${player.apellidos} → ${updateData.nombre} ${updateData.apellidos}`);
    
    // Limpiar valores null de est_minutos para evitar sobreescribir
    const cleanData = {};
    for (const [key, value] of Object.entries(updateData)) {
      if (value !== null || ['fecha_nacimiento', 'altura_cm', 'peso_kg', 'valor_mercado'].includes(key)) {
        cleanData[key] = value;
      }
    }

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
          body: JSON.stringify(cleanData)
        }
      );

      if (patchRes.ok) {
        console.log(`   ✅ Actualizado correctamente`);
        updated++;
      } else {
        const errText = await patchRes.text();
        console.log(`   ❌ Error: ${patchRes.status} - ${errText}`);
        errors++;
      }
    } catch (e) {
      console.log(`   ❌ Error de red: ${e.message}`);
      errors++;
    }

    await delay(200);
  }

  console.log(`\n${'='.repeat(50)}`);
  console.log(`📊 Resumen:`);
  console.log(`   ✅ Actualizados: ${updated}`);
  console.log(`   ⚠️  No encontrados: ${skipped}`);
  console.log(`   ❌ Errores: ${errors}`);
  console.log(`${'='.repeat(50)}`);
}

run().catch(console.error);
