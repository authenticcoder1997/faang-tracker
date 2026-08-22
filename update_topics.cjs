const fs = require('fs');

const priorities = JSON.parse(fs.readFileSync('priorities.json', 'utf8'));
let content = fs.readFileSync('src/data/lldTopics.js', 'utf8');

priorities.forEach(({ url, priority }) => {
  // We need to inject priority into the object
  // Find the object block that contains this URL
  
  // A regex to match the object block
  // e.g. "url": "https://algomaster.io/learn/lld/design-tic-tac-toe",
  const regex = new RegExp(`(url:\\s*['"]${url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"],?)`, 'g');
  
  content = content.replace(regex, `$1\n    "priority": "${priority}",`);
});

// Fix trailing commas if any
content = content.replace(/,\s*\n\s*"completed"/g, '\n    "completed"');

fs.writeFileSync('src/data/lldTopics.js', content);
console.log('Updated lldTopics.js');
