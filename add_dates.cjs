const fs = require('fs');
const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function formatDate(date) {
  const d = date.getDate().toString().padStart(2, '0');
  const m = monthNames[date.getMonth()];
  return `${d} ${m}`;
}

// LLD
let lldContent = fs.readFileSync('src/data/lldTopics.js', 'utf8');
let lldMatch = lldContent.match(/export const lldTopics = (\[[\s\S]*\]);/);
if (lldMatch) {
  let lldArr = eval(lldMatch[1]); // unsafe in prod, safe here
  let startDate = new Date(2026, 7, 23); // Month is 0-indexed, 7 = Aug
  lldArr = lldArr.map((item, index) => {
    let d = new Date(startDate.valueOf());
    d.setDate(d.getDate() + index);
    return { ...item, date: formatDate(d) };
  });
  let newContent = `export const lldTopics = ${JSON.stringify(lldArr, null, 2)};`;
  fs.writeFileSync('src/data/lldTopics.js', newContent);
}

// HLD
let hldContent = fs.readFileSync('src/data/hldTopics.js', 'utf8');
let hldMatch = hldContent.match(/export const hldTopics = (\[[\s\S]*\]);/);
if (hldMatch) {
  let hldArr = eval(hldMatch[1]);
  let startDate = new Date(2026, 7, 23);
  hldArr = hldArr.map((item, index) => {
    let d = new Date(startDate.valueOf());
    d.setDate(d.getDate() + index);
    return { ...item, date: formatDate(d) };
  });
  let newContent = `export const hldTopics = ${JSON.stringify(hldArr, null, 2)};`;
  fs.writeFileSync('src/data/hldTopics.js', newContent);
}
