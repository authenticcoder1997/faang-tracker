export function createWorkspaceStore(initial = {}) {
  let snapshot = { data: null, pending: {}, saving: false, error: '', importNotice: '', importPending: false, ...initial };
  const listeners = new Set();
  return {
    getSnapshot: () => snapshot,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    set(values) {
      if (Object.keys(values).every((key) => Object.is(snapshot[key], values[key]))) return;
      snapshot = { ...snapshot, ...values };
      for (const listener of listeners) listener();
    },
  };
}
