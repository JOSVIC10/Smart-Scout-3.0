const fs = require('fs');

async function importGrama() {
  console.log('Loading URLs from grama_urls.json...');
  try {
    const urls = JSON.parse(fs.readFileSync('grama_urls.json', 'utf8'));
    
    console.log(`Found ${urls.length} player URLs.`);
    fs.writeFileSync('grama_urls.json', JSON.stringify(urls, null, 2));

    console.log('Importing players through API...');
    for (const url of urls) {
      console.log(`Importing: ${url}`);
      try {
        const importRes = await fetch('http://localhost:3000/api/importar-jugador', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url })
        });
        const data = await importRes.json();
        if (importRes.ok && data.success && data.player) {
          const p = data.player;
          // Update Supabase directly using REST API
          const updateUrl = `https://mnfxjxorffxnuxpdzzzd.supabase.co/rest/v1/jugadores?club_id=eq.e0000001-0000-0000-0000-000000000001&nombre=eq.${encodeURIComponent(p.nombre)}`;
          const updateRes = await fetch(updateUrl, {
            method: 'PATCH',
            headers: {
              'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1uZnhqeG9yZmZ4bnV4cGR6enpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxODQzNDIsImV4cCI6MjEwMDc2MDM0Mn0.EvAmPcHsgIzJLhFZUlPfp9ujjQr2OfXX4ANnIZifdAc',
              'Content-Type': 'application/json',
              'Prefer': 'return=minimal'
            },
            body: JSON.stringify({
              est_partidos: p.est_partidos,
              est_minutos: p.est_minutos,
              est_goles: p.est_goles,
              est_asistencias: p.est_asistencias,
              est_amarillas: p.est_amarillas,
              est_rojas: p.est_rojas
            })
          });
          
          if (updateRes.ok) {
            console.log(`✅ Success (DB Updated): ${p.nombre} ${p.apellidos}`);
          } else {
            console.log(`❌ DB Update Failed for ${p.nombre}: ${updateRes.status} ${await updateRes.text()}`);
          }
        } else {
          console.log(`❌ Scrape Failed: ${JSON.stringify(data)}`);
        }
      } catch (err) {
        console.error(`Error importing ${url}:`, err.message);
      }
      
      // Sleep to prevent rate limit
      await new Promise(r => setTimeout(r, 2000));
    }
    
    console.log('Finished importing all players.');
  } catch (err) {
    console.error('Script error:', err);
  }
}

importGrama();
