// ======================================================
// FAANG Tracker - TUF Sync Content Script v2
// Detects "Accepted" submission verdict on TUF problem pages
// and syncs completion to Firebase Firestore REST API.
// ======================================================

const FIREBASE_PROJECT_ID = "faang-tracker-db";
const FIREBASE_API_KEY    = "AIzaSyD19EOEBlOIW-hgafiCfXLw0SLnFBmrDoQ";
const FIRESTORE_DOC_PATH  = "dsa_progress/my-personal-tracker";

// ---- Get problem slug from URL ----
function getSlugFromUrl() {
  const match = window.location.pathname.match(/\/problems\/([^/?]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

// ---- Firestore REST helpers ----
async function getFirestoreDoc() {
  const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/${FIRESTORE_DOC_PATH}?key=${FIREBASE_API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) { console.error("[FT] Firestore GET failed", res.status); return null; }
  return res.json();
}

function parseFirestoreDoc(doc) {
  if (!doc || !doc.fields) return { completedIds: [], itemState: {} };
  const completedIds = (doc.fields.completedIds?.arrayValue?.values || []).map(v => v.stringValue);
  const raw = doc.fields.itemState?.mapValue?.fields || {};
  const itemState = {};
  for (const [id, val] of Object.entries(raw)) {
    itemState[id] = {
      completed: val.mapValue?.fields?.completed?.booleanValue || false,
      note: val.mapValue?.fields?.note?.stringValue || ''
    };
  }
  return { completedIds, itemState };
}

async function markComplete(problemId) {
  showToast("⏳ Syncing to FAANG Tracker...", "info");

  const doc = await getFirestoreDoc();
  if (!doc) { showToast("❌ Could not reach database", "error"); return; }

  const { completedIds, itemState } = parseFirestoreDoc(doc);

  if (completedIds.includes(problemId)) {
    showToast("✅ Already synced!", "success");
    return;
  }

  const newCompletedIds = [...completedIds, problemId];
  const newItemState = {
    ...itemState,
    [problemId]: { completed: true, note: itemState[problemId]?.note || '' }
  };

  // PATCH via Firestore REST
  const patchUrl = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/${FIRESTORE_DOC_PATH}?key=${FIREBASE_API_KEY}`;

  const fields = {
    completedIds: {
      arrayValue: { values: newCompletedIds.map(id => ({ stringValue: id })) }
    },
    itemState: {
      mapValue: {
        fields: Object.fromEntries(
          Object.entries(newItemState).map(([id, s]) => [
            id,
            {
              mapValue: {
                fields: {
                  completed: { booleanValue: s.completed },
                  ...(s.note ? { note: { stringValue: s.note } } : {})
                }
              }
            }
          ])
        )
      }
    }
  };

  const res = await fetch(patchUrl, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields })
  });

  if (res.ok) {
    showToast("🎉 Synced to FAANG Tracker!", "success");
    console.log("[FT] ✅ Synced:", problemId);
  } else {
    const err = await res.text();
    console.error("[FT] Patch failed:", res.status, err);
    showToast("❌ Sync failed — check console", "error");
  }
}

// ---- Toast ----
function showToast(message, type = "info") {
  document.getElementById("ft-toast")?.remove();
  const colors = {
    info:    "background:#1e293b;border:1px solid #334155;color:#94a3b8",
    success: "background:#052e16;border:1px solid #166534;color:#4ade80",
    error:   "background:#2d0a0a;border:1px solid #7f1d1d;color:#f87171"
  };
  const t = document.createElement("div");
  t.id = "ft-toast";
  t.style.cssText = `position:fixed;bottom:24px;right:24px;z-index:999999;${colors[type]};padding:12px 18px;border-radius:12px;font-size:14px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-weight:500;box-shadow:0 8px 32px rgba(0,0,0,.5);max-width:320px;transition:opacity .3s,transform .3s`;
  t.textContent = message;
  document.body.appendChild(t);
  setTimeout(() => { t.style.opacity = "0"; t.style.transform = "translateY(8px)"; setTimeout(() => t.remove(), 300); }, 3500);
}

// ---- Core detector ----
// Checks if the DOM currently shows an "Accepted" verdict for THIS problem
function isAcceptedInDOM() {
  // Strategy 1: Check for verdict text like "Submission Verdict: Accepted" or standalone "Accepted"
  const allText = document.body.innerText || "";

  // Look for the verdict section
  const verdictPatterns = [
    /submission verdict[\s\S]{0,30}accepted/i,
    /verdict[\s\S]{0,20}accepted/i,
  ];
  for (const p of verdictPatterns) {
    if (p.test(allText)) return true;
  }

  // Strategy 2: Look for green "Accepted" chip/badge elements (class-based)
  const candidates = document.querySelectorAll(
    '[class*="accepted"], [class*="Accepted"], [data-status="accepted"], [class*="correct"], [class*="success"]'
  );
  for (const el of candidates) {
    if (/accepted/i.test(el.textContent)) return true;
  }

  // Strategy 3: Look for specifically styled "Accepted" text inside submission table rows
  const tableCells = document.querySelectorAll('td, [class*="status"], [class*="verdict"]');
  for (const cell of tableCells) {
    if (cell.textContent.trim() === "Accepted") return true;
  }

  return false;
}

// ---- Main watcher ----
let synced = false;  // prevent double-syncing per page load
let observing = false;

function startWatching() {
  if (observing) return;
  observing = true;

  const slug = getSlugFromUrl();
  if (!slug) return;

  const problemId = SLUG_TO_ID[slug];
  if (!problemId) {
    console.log("[FT] Problem not in tracker map:", slug);
    return;
  }

  console.log(`[FT] Watching "${slug}" → ID: ${problemId}`);

  // Check immediately if already accepted (e.g. navigating back to submissions tab)
  if (!synced && isAcceptedInDOM()) {
    console.log("[FT] Accepted found on page load");
    synced = true;
    markComplete(problemId);
    return;
  }

  // Watch DOM for new content via MutationObserver
  const observer = new MutationObserver(() => {
    if (synced) return;
    if (isAcceptedInDOM()) {
      console.log("[FT] Accepted detected via MutationObserver");
      synced = true;
      observer.disconnect();
      // Small delay to let TUF finish its own state update
      setTimeout(() => markComplete(problemId), 600);
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true
  });

  // Safety: stop observing after 10 minutes
  setTimeout(() => observer.disconnect(), 10 * 60 * 1000);
}

// Handle TUF's SPA navigation — the slug may change without a full page reload
let lastSlug = getSlugFromUrl();
function handleNavigation() {
  const slug = getSlugFromUrl();
  if (slug !== lastSlug) {
    lastSlug = slug;
    synced = false;
    observing = false;
    console.log("[FT] Navigation to new problem:", slug);
    startWatching();
  }
}

// Poll for SPA navigation changes every second
setInterval(handleNavigation, 1000);

// Kick off on initial page load
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => setTimeout(startWatching, 2000));
} else {
  setTimeout(startWatching, 2000);
}
