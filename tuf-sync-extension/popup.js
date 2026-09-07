// popup.js — reads the current active tab's URL and shows what's being watched
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  const url = tabs[0]?.url || "";
  const el = document.getElementById("current-page");

  const dsaSlug = url.match(/takeuforward\.org\/plus\/dsa\/problems\/([^/?]+)/)?.[1];
  const lldSlug = url.match(/algomaster\.io\/learn\/lld\/([^/?]+)/)?.[1];
  const concSlug = url.match(/algomaster\.io\/practice\/concurrency\/([^/?]+)/)?.[1];

  const titleCase = (s) => s.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());

  if (dsaSlug) {
    el.textContent = `DSA: ${titleCase(dsaSlug)}`;
    el.style.color = "#4ade80";
  } else if (lldSlug) {
    el.textContent = `LLD: ${titleCase(lldSlug)}`;
    el.style.color = "#34d399";
  } else if (concSlug) {
    el.textContent = `Concurrency: ${titleCase(concSlug)}`;
    el.style.color = "#a78bfa";
  } else if (url.includes("takeuforward.org")) {
    el.textContent = "On TUF (not a DSA problem page)";
  } else if (url.includes("algomaster.io")) {
    el.textContent = "On AlgoMaster (not a watched page)";
  } else {
    el.textContent = "Not on a watched site";
  }
});
