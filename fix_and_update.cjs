const fs = require('fs');

let content = fs.readFileSync('src/data/lldTopics.js', 'utf8');
// Fix missing commas
content = content.replace(/"url": "([^"]+)"\s*"completed"/g, '"url": "$1",\n    "completed"');

const priorities = JSON.parse(fs.readFileSync('priorities.json', 'utf8'));

priorities.forEach(({ url, priority }) => {
  const regex = new RegExp(`("url":\\s*['"]${url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"],)`);
  if (content.match(regex)) {
    content = content.replace(regex, `$1\n    "priority": "${priority}",`);
  }
});

fs.writeFileSync('src/data/lldTopics.js', content);
console.log('Fixed and updated lldTopics.js');
