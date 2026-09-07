// ======================================================
// FAANG Tracker - AlgoMaster Concurrency Sync
// Detects a passing submission verdict on AlgoMaster's
// Concurrency practice judge and syncs to Firestore.
//
// NOTE: AlgoMaster's exact verdict wording after Submit was not
// verifiable without a logged-in account (submissions require sign-in).
// This uses broad, multi-pattern text detection similar to the TUF
// script. If it doesn't fire on a real pass, open the console (look
// for "[FT]" logs) and report back what the verdict text actually says
// so the patterns below can be tightened.
// ======================================================

const FIREBASE_PROJECT_ID = "faang-tracker-db";
const FIREBASE_API_KEY    = "AIzaSyD19EOEBlOIW-hgafiCfXLw0SLnFBmrDoQ";
const FIRESTORE_DOC_PATH  = "concurrency_progress/my-personal-tracker";

function getSlugFromUrl() {
  const match = window.location.pathname.match(/\/practice\/concurrency\/([^/?]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

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
    console.log("[FT] ✅ Synced concurrency:", problemId);
  } else {
    const err = await res.text();
    console.error("[FT] Patch failed:", res.status, err);
    showToast("❌ Sync failed — check console", "error");
  }
}

function showToast(message, type = "info") {
  document.getElementById("ft-toast")?.remove();
  const colors = {
    info:    "background:#1e293b;border:1px solid #334155;color:#94a3b8",
    success: "background:#2e1065;border:1px solid #6d28d9;color:#c4b5fd",
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
// AlgoMaster's concurrency judge runs your code against multiple threaded
// scenarios and reports a verdict. Exact wording unconfirmed (needs a
// logged-in account to observe) — matching broadly across likely phrasings.
function isPassedInDOM() {
  const allText = document.body.innerText || "";

  const passPatterns = [
    /all\s+test\s*cases?\s+passed/i,
    /all\s+scenarios?\s+passed/i,
    /\bpassed\b.{0,20}\btest/i,
    /\baccepted\b/i,
    /\bcorrect\s+solution\b/i,
    /\bsolution\s+is\s+correct\b/i,
  ];
  for (const p of passPatterns) {
    if (p.test(allText)) return true;
  }

  // Look for green pass/success styled badges near the result panel
  const candidates = document.querySelectorAll(
    '[class*="pass"], [class*="Pass"], [class*="success"], [class*="Success"], [class*="accepted"], [data-status="pass"], [data-status="passed"], [data-status="accepted"]'
  );
  for (const el of candidates) {
    if (/pass|accept|correct/i.test(el.textContent) && el.textContent.trim().length < 60) return true;
  }

  return false;
}

let synced = false;
let observing = false;

function startWatching() {
  if (observing) return;
  observing = true;

  const slug = getSlugFromUrl();
  if (!slug) return;

  const problemId = CONCURRENCY_SLUG_TO_ID[slug];
  if (!problemId) {
    console.log("[FT] Concurrency problem not in tracker map (likely premium-only):", slug);
    return;
  }

  console.log(`[FT] Watching concurrency "${slug}" → ID: ${problemId}`);

  if (!synced && isPassedInDOM()) {
    console.log("[FT] Pass detected on page load");
    synced = true;
    markComplete(problemId);
    return;
  }

  const observer = new MutationObserver(() => {
    if (synced) return;
    if (isPassedInDOM()) {
      console.log("[FT] Pass detected via MutationObserver");
      synced = true;
      observer.disconnect();
      setTimeout(() => markComplete(problemId), 600);
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true
  });

  setTimeout(() => observer.disconnect(), 10 * 60 * 1000);
}

let lastSlug = getSlugFromUrl();
function handleNavigation() {
  const slug = getSlugFromUrl();
  if (slug !== lastSlug) {
    lastSlug = slug;
    synced = false;
    observing = false;
    console.log("[FT] Navigation to new concurrency problem:", slug);
    startWatching();
  }
}

setInterval(handleNavigation, 1000);

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => setTimeout(startWatching, 2000));
} else {
  setTimeout(startWatching, 2000);
}
