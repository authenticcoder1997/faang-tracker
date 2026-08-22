const fs = require('fs');

async function scrape() {
  const content = fs.readFileSync('src/data/lldTopics.js', 'utf8');
  const urls = [...content.matchAll(/"url":\s*"(https:\/\/algomaster\.io\/learn\/lld\/[^"]+)"/g)].map(m => m[1]);
  
  console.log(`Found ${urls.length} URLs. Scraping in parallel...`);
  
  const results = await Promise.all(urls.map(async (url) => {
    try {
      const res = await fetch(url);
      const html = await res.text();
      let priority = 'Normal';
      if (html.includes('High Priority')) priority = 'High';
      else if (html.includes('Low Priority')) priority = 'Low';
      return { url, priority };
    } catch (e) {
      return { url, priority: 'Normal' };
    }
  }));
  
  fs.writeFileSync('priorities.json', JSON.stringify(results, null, 2));
  console.log('Done writing priorities.json');
}

scrape();
