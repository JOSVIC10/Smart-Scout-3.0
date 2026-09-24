const { chromium } = require('playwright');

async function checkJaime() {
  const b = await chromium.launch({ headless: true, args: ['--disable-blink-features=AutomationControlled'] });
  const p = await b.newPage();
  await p.goto('https://es.besoccer.com/jugador/jaime-gonzalez-301454', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(1500);

  const res = await p.evaluate(() => {
    const seasonEl = document.querySelector('[data-cy="playerSeason"]');
    const cols = Array.from(seasonEl?.querySelectorAll('.item-col') || []).map(c => ({
      text: c.innerText.trim(),
      html: c.innerHTML
    }));
    return { seasonText: seasonEl?.innerText, cols };
  });

  console.log('Season text:', res.seasonText);
  console.log('Cols:', JSON.stringify(res.cols, null, 2));
  await b.close();
}

checkJaime().catch(console.error);
