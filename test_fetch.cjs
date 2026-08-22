async function run() {
  const res = await fetch("https://algomaster.io/learn/lld/design-tic-tac-toe");
  const text = await res.text();
  console.log("High Priority exists?", text.includes("High Priority"));
}
run();
