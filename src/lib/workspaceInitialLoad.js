export function needsWorkspaceMigration(raw, fingerprint) {
  return !raw?.importedFirebaseLegacy ||
    !!(fingerprint && !raw.importedLegacy?.includes(fingerprint));
}

/**
 * First-load work runs once per subscription. During a legacy migration, keep
 * the newest confirmed event so an edit made on another device is not missed.
 */
export function receiveWorkspaceSnapshots({ active, initialize, adopt, fail, initialized }) {
  let started = false;
  let ready = false;
  let buffered;

  return (snapshot) => {
    if (!active() || snapshot.metadata.fromCache || snapshot.metadata.hasPendingWrites) return;
    if (ready) {
      try {
        adopt(snapshot);
      } catch (error) {
        fail(error);
      }
    } else if (started) {
      buffered = snapshot;
    } else {
      started = true;
      void (async () => {
        try {
          const first = await initialize(snapshot);
          if (!active()) return;
          const latest = buffered?.exists() &&
            (buffered.data().revision || 0) >= (first.data().revision || 0) ? buffered : first;
          buffered = undefined;
          adopt(latest);
          ready = true;
          initialized(latest);
        } catch (error) {
          if (active()) fail(error);
        }
      })();
    }
  };
}
