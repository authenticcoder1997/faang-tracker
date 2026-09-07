// ======================================================
// FAANG Tracker - AlgoMaster LLD Sync
// LLD chapters have no code judge — completion is self-marked via a
// "Complete" button in the bottom toolbar (requires AlgoMaster login).
// This watches for that button flipping into its completed state and
// syncs to Firestore.
//
// NOTE: the exact DOM signal for "completed" (button text/class/icon
// change) was not verifiable without a logged-in account — clicking
// Complete while logged out just opens AlgoMaster's sign-in dialog.
// This uses a heuristic (button text flip + toast/aria-state changes).
// If it doesn't fire when you actually click Complete, open the
// console (look for "[FT]" logs) and report what changes on the
// button/page so this can be tightened.
// ======================================================

const FIREBASE_PROJECT_ID = "faang-tracker-db";
const FIREBASE_API_KEY    = "AIzaSyD19EOEBlOIW-hgafiCfXLw0SLnFBmrDoQ";
const FIRESTORE_DOC_PATH  = "lld_progress/my-personal-tracker";

function getSlugFromUrl() {
  const match = window.location.pathname.match(/\/learn\/lld\/([^/?]+)/);
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
    console.log("[FT] ✅ Synced LLD:", problemId);
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
    success: "background:#052e21;border:1px solid #10b981;color:#6ee7b7",
    error:   "background:#2d0a0a;border:1px solid #7f1d1d;color:#f87171"
  };
  const t = document.createElement("div");
  t.id = "ft-toast";
  t.style.cssText = `position:fixed;bottom:24px;right:24px;z-index:999999;${colors[type]};padding:12px 18px;border-radius:12px;font-size:14px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-weight:500;box-shadow:0 8px 32px rgba(0,0,0,.5);max-width:320px;transition:opacity .3s,transform .3s`;
  t.textContent = message;
  document.body.appendChild(t);
  setTimeout(() => { t.style.opacity = "0"; t.style.transform = "translateY(8px)"; setTimeout(() => t.remove(), 300); }, 3500);
}

// ---- Find the bottom-toolbar "Complete" button ----
function findCompleteButton() {
  const buttons = [...document.querySelectorAll('button')];
  return buttons.find(b => /^(complete|mark as complete|completed|mark complete)$/i.test(b.textContent.trim()));
}

// ---- Heuristic: does the page currently show this chapter as completed? ----
function isCompletedInDOM() {
  const btn = findCompleteButton();
  if (btn) {
    const label = btn.textContent.trim().toLowerCase();
    if (label === "completed" || label === "mark as incomplete" || label === "mark incomplete") return true;
    if (btn.getAttribute("aria-pressed") === "true") return true;
    if (btn.getAttribute("data-state") === "on" || btn.getAttribute("data-state") === "active") return true;
    if (/text-green|bg-green|text-emerald|bg-emerald/.test(btn.className)) return true;
  }
  // Fallback: a visible confirmation toast/message on AlgoMaster's own UI
  const allText = document.body.innerText || "";
  if (/marked as (complete|done)/i.test(allText) || /chapter completed/i.test(allText)) return true;
  return false;
}

let synced = false;
let observing = false;
let clickArmed = false; // only trust a state-change detection shortly after the user actually clicks Complete

function startWatching() {
  if (observing) return;
  observing = true;

  const slug = getSlugFromUrl();
  if (!slug) return;

  const problemId = LLD_SLUG_TO_ID[slug];
  if (!problemId) {
    console.log("[FT] LLD chapter not in tracker map:", slug);
    return;
  }

  console.log(`[FT] Watching LLD "${slug}" → ID: ${problemId}`);

  // Already shown as completed on load (revisiting a solved chapter)
  if (!synced && isCompletedInDOM()) {
    console.log("[FT] LLD chapter already shows completed on load");
    synced = true;
    markComplete(problemId);
    return;
  }

  // Arm on click of the Complete button so we don't false-positive on unrelated DOM churn
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (btn && /^(complete|mark as complete)$/i.test(btn.textContent.trim())) {
      clickArmed = true;
      setTimeout(() => { clickArmed = false; }, 8000);
    }
  }, true);

  const observer = new MutationObserver(() => {
    if (synced || !clickArmed) return;
    if (isCompletedInDOM()) {
      console.log("[FT] LLD completion detected after Complete click");
      synced = true;
      observer.disconnect();
      setTimeout(() => markComplete(problemId), 400);
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    attributeFilter: ["class", "aria-pressed", "data-state"]
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
    clickArmed = false;
    console.log("[FT] Navigation to new LLD chapter:", slug);
    startWatching();
  }
}

setInterval(handleNavigation, 1000);

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => setTimeout(startWatching, 2000));
} else {
  setTimeout(startWatching, 2000);
}
