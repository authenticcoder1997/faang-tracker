const fs = require('fs');

async function check() {
  const urls = JSON.parse(fs.readFileSync('priorities.json', 'utf8')).map(x => x.url);
  for (const url of urls) {
    try {
      const res = await fetch(url);
      const text = await res.text();
      if (text.includes("Medium Priority")) {
        console.log("FOUND Medium Priority in:", url);
      }
    } catch(e) {}
  }
  console.log("Done");
}
check();
