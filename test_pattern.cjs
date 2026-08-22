async function run() {
  const res = await fetch("https://algomaster.io/learn/lld/design-tic-tac-toe");
  const text = await res.text();
  
  // Look for any mention of patterns
  const match = text.match(/.{0,100}Strategy Pattern.{0,100}/i) || text.match(/.{0,100}Design Pattern.{0,100}/i);
  if (match) {
    console.log("MATCH:", match[0]);
  } else {
    console.log("Not found.");
  }
}
run();
