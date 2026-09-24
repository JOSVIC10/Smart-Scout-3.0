const fs = require('fs');
const { execSync } = require('child_process');

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

async function run() {
  console.log("Scraping Grama URLs...");
  const html = execSync('curl -s -L -A "Mozilla/5.0" https://es.besoccer.com/equipo/plantilla/grama-a', { encoding: 'utf8' });
  const links = [...html.matchAll(/href=["'](https:\/\/es\.besoccer\.com\/jugador\/[^"']+)["']/g)].map(m => m[1]);
  const uniqueGramaLinks = [...new Set(links)];
  console.log(`Found ${uniqueGramaLinks.length} players in FE Grama.`);
  
  // Create a payload for our insertions. We will use localhost:3000 API for this.
  const allUrls = {
    grama: uniqueGramaLinks,
    futuribles: FUTURIBLES
  };
  fs.writeFileSync('all_urls_to_process.json', JSON.stringify(allUrls, null, 2));
  
  console.log("Next, we can iterate over these URLs and insert them.");
}
run();
