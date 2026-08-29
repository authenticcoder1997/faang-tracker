// ======================================================
// FAANG Tracker - TUF Sync Content Script
// Runs on every TakeUForward DSA problem page.
// Watches for the completion button click and syncs to Firebase.
// ======================================================

const FIREBASE_PROJECT_ID = "faang-tracker-db";
const FIREBASE_API_KEY    = "AIzaSyD19EOEBlOIW-hgafiCfXLw0SLnFBmrDoQ";
const FIRESTORE_DOC_PATH  = "dsa_progress/my-personal-tracker";

// ---- Extract problem slug from current URL ----
function getSlugFromUrl() {
  const match = window.location.pathname.match(/\/problems\/([^/?]+)/);
  return match ? match[1] : null;
}

// ---- Firestore REST API helpers ----
async function getFirestoreDoc() {
  const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/${FIRESTORE_DOC_PATH}?key=${FIREBASE_API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  return await res.json();
}

async function updateFirestoreDoc(completedIds, itemState) {
  const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/${FIRESTORE_DOC_PATH}?key=${FIREBASE_API_KEY}&updateMask.fieldPaths=completedIds&updateMask.fieldPaths=itemState`;

  // Convert arrays/objects to Firestore field format
  const completedIdsField = {
    arrayValue: {
      values: completedIds.map(id => ({ stringValue: id }))
    }
  };

  const itemStateFields = {};
  for (const [id, state] of Object.entries(itemState)) {
    const fields = {
      completed: { booleanValue: state.completed }
    };
    if (state.note) fields.note = { stringValue: state.note };
    itemStateFields[id] = { mapValue: { fields } };
  }

  const body = {
    fields: {
      completedIds: completedIdsField,
      itemState: { mapValue: { fields: itemStateFields } }
    }
  };

  const res = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  return res.ok;
}

// ---- Parse Firestore response back to usable format ----
function parseFirestoreDoc(doc) {
  if (!doc || !doc.fields) return { completedIds: [], itemState: {} };

  const completedIds = (doc.fields.completedIds?.arrayValue?.values || [])
    .map(v => v.stringValue);

  const itemStateFields = doc.fields.itemState?.mapValue?.fields || {};
  const itemState = {};
  for (const [id, val] of Object.entries(itemStateFields)) {
    itemState[id] = {
      completed: val.mapValue?.fields?.completed?.booleanValue || false,
      note: val.mapValue?.fields?.note?.stringValue || ''
    };
  }

  return { completedIds, itemState };
}

// ---- Mark problem as complete in Firestore ----
async function markComplete(problemId) {
  showToast("⏳ Syncing to FAANG Tracker...", "info");

  const doc = await getFirestoreDoc();
  if (!doc) {
    showToast("❌ Could not reach FAANG Tracker database", "error");
    return;
  }

  const { completedIds, itemState } = parseFirestoreDoc(doc);

  if (completedIds.includes(problemId)) {
    showToast("✅ Already synced in FAANG Tracker!", "success");
    return;
  }

  const newCompletedIds = [...completedIds, problemId];
  const newItemState = {
    ...itemState,
    [problemId]: { completed: true, note: itemState[problemId]?.note || '' }
  };

  const success = await updateFirestoreDoc(newCompletedIds, newItemState);

  if (success) {
    showToast("🎉 Synced to FAANG Tracker!", "success");
  } else {
    showToast("❌ Sync failed. Try again.", "error");
  }
}

// ---- Toast notification ----
function showToast(message, type = "info") {
  const existing = document.getElementById("faang-tracker-toast");
  if (existing) existing.remove();

  const colors = {
    info:    { bg: "#1e293b", border: "#334155", text: "#94a3b8" },
    success: { bg: "#052e16", border: "#166534", text: "#4ade80" },
    error:   { bg: "#2d0a0a", border: "#7f1d1d", text: "#f87171" }
  };
  const c = colors[type];

  const toast = document.createElement("div");
  toast.id = "faang-tracker-toast";
  toast.style.cssText = `
    position: fixed;
    bottom: 24px;
    right: 24px;
    z-index: 999999;
    background: ${c.bg};
    border: 1px solid ${c.border};
    color: ${c.text};
    padding: 12px 18px;
    border-radius: 12px;
    font-size: 14px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    font-weight: 500;
    box-shadow: 0 8px 32px rgba(0,0,0,0.4);
    display: flex;
    align-items: center;
    gap: 8px;
    transition: all 0.3s ease;
    max-width: 320px;
  `;
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(10px)";
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// ---- Watch for TUF completion button click ----
// TUF uses a button with text "Mark as Done" or a checkmark icon.
// We use a MutationObserver to watch for DOM changes after the page loads
// (TUF is a React SPA, content loads dynamically).

let watcherAttached = false;

function attachCompletionWatcher() {
  if (watcherAttached) return;

  const slug = getSlugFromUrl();
  if (!slug) return;

  const problemId = SLUG_TO_ID[slug];
  if (!problemId) {
    console.log("[FAANG Tracker] Problem not in tracker:", slug);
    return;
  }

  console.log("[FAANG Tracker] Watching problem:", slug, "→", problemId);

  // Strategy: watch for clicks on buttons that look like completion buttons
  // TUF uses various selectors; we match all likely candidates.
  function handleClick(e) {
    const el = e.target.closest('button');
    if (!el) return;

    const text = el.textContent?.trim().toLowerCase() || "";
    const ariaLabel = el.getAttribute("aria-label")?.toLowerCase() || "";
    const classes = el.className || "";

    const isCompletionBtn =
      text.includes("mark as done") ||
      text.includes("mark complete") ||
      text.includes("completed") ||
      ariaLabel.includes("mark") ||
      ariaLabel.includes("done") ||
      classes.includes("mark-done") ||
      classes.includes("complete");

    if (isCompletionBtn) {
      console.log("[FAANG Tracker] Completion button clicked, syncing...");
      // Small delay to let TUF update its own state first
      setTimeout(() => markComplete(problemId), 800);
    }
  }

  document.addEventListener("click", handleClick, true);
  watcherAttached = true;

  // Also observe DOM for a solved/completed state indicator appearing
  // (handles cases where TUF auto-marks complete on page load)
  const observer = new MutationObserver(() => {
    const solvedIndicators = [
      document.querySelector('[class*="solved"]'),
      document.querySelector('[class*="completed"]'),
      document.querySelector('[class*="done"]'),
      document.querySelector('[aria-label*="completed"]'),
      document.querySelector('[aria-label*="done"]'),
    ].filter(Boolean);

    if (solvedIndicators.length > 0) {
      console.log("[FAANG Tracker] Solved indicator detected, syncing...");
      observer.disconnect();
      markComplete(problemId);
    }
  });

  observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["class", "aria-label"] });

  // Disconnect observer after 15s to avoid memory leaks
  setTimeout(() => observer.disconnect(), 15000);
}

// Wait for TUF's React app to fully render
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => setTimeout(attachCompletionWatcher, 2000));
} else {
  setTimeout(attachCompletionWatcher, 2000);
}
