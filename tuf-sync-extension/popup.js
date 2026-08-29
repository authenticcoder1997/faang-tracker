// popup.js — reads the current active tab's URL and shows it
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  const url = tabs[0]?.url || "";
  const el = document.getElementById("current-page");

  if (url.includes("takeuforward.org/plus/dsa/problems/")) {
    const slug = url.match(/\/problems\/([^/?]+)/)?.[1];
    if (slug) {
      el.textContent = slug.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
      el.style.color = "#4ade80";
    }
  } else if (url.includes("takeuforward.org")) {
    el.textContent = "On TUF (not a DSA problem page)";
  } else {
    el.textContent = "Not on TUF";
  }
});
