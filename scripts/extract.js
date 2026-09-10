const fs = require('fs');
const html = fs.readFileSync('../grama_html.txt', 'utf8');
const matches = [...html.matchAll(/href="([^"]*jugador[^"]*)"/g)];
const urls = [...new Set(matches.map(m => {
  let url = m[1];
  if (url.startsWith('/')) url = 'https://es.besoccer.com' + url;
  return url;
}))];
console.log('Found:', urls.length);
fs.writeFileSync('grama_urls.json', JSON.stringify(urls, null, 2));
