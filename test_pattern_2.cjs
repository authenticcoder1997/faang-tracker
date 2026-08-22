async function run() {
  const urls = [
    "https://algomaster.io/learn/lld/design-parking-lot",
    "https://algomaster.io/learn/lld/design-vending-machine",
    "https://algomaster.io/learn/lld/design-elevator-system"
  ];
  for (const url of urls) {
    const res = await fetch(url);
    const text = await res.text();
    const m1 = text.match(/Patterns?:?\s*<\/?[^>]+>\s*([^<]+)/i);
    const m2 = text.match(/.{0,50}Pattern.{0,50}/g);
    console.log(url, m2 ? m2.filter(x => !x.includes("sidebar") && !x.includes("Quiz")).slice(0,5) : "none");
  }
}
run();
