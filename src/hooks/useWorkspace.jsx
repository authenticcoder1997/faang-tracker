import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { WorkspaceContext } from './workspaceContext';
import { createWorkspaceStore } from './workspaceStore';
import { LEGACY_STORAGE_KEYS } from '../lib/workspaceLegacyKeys';
import { needsWorkspaceMigration, receiveWorkspaceSnapshots } from '../lib/workspaceInitialLoad';
import {
  applyValidatedWorkspacePatch,
  diffWorkspace,
  normalizeWorkspace,
  reuseWorkspace,
  workspaceChanges,
  workspaceWriteFields,
} from '../lib/workspace';

const LEGACY_COLLECTIONS = [
  'dsa_progress',
  'lld_progress',
  'hld_progress',
  'concurrency_progress',
  'user_notes',
];

function explainError(problem) {
  const code = problem?.code || '';
  if (code.includes('permission-denied'))
    return 'Firebase access is not configured for this workspace yet. Your existing data has been kept. Retry after access is enabled.';
  if (code.includes('network') || code.includes('unavailable'))
    return 'The connection to Firebase was interrupted. Your pending changes are still open here. Reconnect and retry saving.';
  return problem?.message || 'Firebase could not save this change. Please retry.';
}

function legacyData() {
  const values = {};
  try {
    for (const key of LEGACY_STORAGE_KEYS) {
      const value = window.localStorage.getItem(key);
      if (value !== null) values[key] = value;
    }
  } catch {
    // A browser with blocked storage can still use the Firebase workspace.
    return {};
  }
  return values;
}

async function legacyFingerprint(values) {
  if (!Object.keys(values).length) return null;
  const bytes = new TextEncoder().encode(JSON.stringify(Object.entries(values).sort()));
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(hash)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function pendingSections(queue) {
  return Object.fromEntries(queue.flatMap((job) => job.sections.map((section) => [section, true])));
}

export function WorkspaceProvider({ children }) {
  const [store] = useState(createWorkspaceStore);
  const queue = useRef([]);
  const processing = useRef(null);
  const generation = useRef(0);
  const connection = useRef(null);
  const serverData = useRef(null);
  const serverRevision = useRef(-1);
  const reconnect = useRef(null);
  const listenerLive = useRef(false);

  const publish = useCallback((data, values = {}) => {
    const previous = store.getSnapshot().data;
    store.set({ ...values, data: reuseWorkspace(previous, data) });
  }, [store]);

  const processQueue = useCallback(async () => {
    if (processing.current || !connection.current || !queue.current.length) return;
    const worker = { generation: generation.current };
    processing.current = worker;
    const { db, runTransaction, target } = connection.current;
    let completed = false;
    try {
      while (queue.current.length && generation.current === worker.generation) {
        // Edits made during the previous save share one network trip, in order.
        const jobs = queue.current.slice();
        const confirmed = await runTransaction(db, async (transaction) => {
          const snapshot = await transaction.get(target);
          if (!snapshot.exists())
            throw new Error('Your Firebase workspace could not be found. Retry the connection.');
          const raw = snapshot.data();
          const base = normalizeWorkspace(raw);
          const next = reuseWorkspace(base, jobs.reduce(
            (state, job) => applyValidatedWorkspacePatch(state, job.patch),
            base,
          ));
          const revision = (raw.revision || 0) + 1;
          transaction.update(target, {
            ...workspaceWriteFields(base, next),
            revision,
            updatedAt: new Date().toISOString(),
          });
          return { next, revision };
        });
        if (generation.current !== worker.generation) return;
        queue.current.splice(0, jobs.length);
        if (confirmed.revision >= serverRevision.current) {
          serverData.current = confirmed.next;
          serverRevision.current = confirmed.revision;
        }
        const optimistic = queue.current.reduce(
          (workspace, pending) => applyValidatedWorkspacePatch(workspace, pending.patch),
          serverData.current,
        );
        publish(optimistic, {
          pending: pendingSections(queue.current),
          saving: !!queue.current.length,
          ...(listenerLive.current ? { error: '' } : {}),
        });
      }
      completed = true;
    } catch (problem) {
      if (generation.current === worker.generation)
        store.set({ error: explainError(problem) });
    } finally {
      if (processing.current === worker) processing.current = null;
      if (completed && generation.current === worker.generation && !listenerLive.current)
        void reconnect.current?.();
    }
  }, [publish, store]);

  useEffect(() => {
    const activeGeneration = ++generation.current;
    const isActive = () => generation.current === activeGeneration;
    let stop = () => {};
    let connecting = false;

    function adopt(snapshot) {
      if (!snapshot.exists())
        throw new Error('Your Firebase workspace could not be found. Retry the connection.');
      const raw = snapshot.data();
      const revision = raw.revision || 0;
      if (revision < serverRevision.current) return;
      const workspace = reuseWorkspace(serverData.current, normalizeWorkspace(raw));
      const optimistic = queue.current.reduce(
        (state, job) => applyValidatedWorkspacePatch(state, job.patch),
        workspace,
      );
      serverData.current = workspace;
      serverRevision.current = revision;
      publish(optimistic, { importPending: !raw.importedFirebaseLegacy });
    }

    async function connect() {
      if (!isActive() || connecting) return;
      connecting = true;
      stop();
      listenerLive.current = false;
      let closed = false;
      let unsubscribe;
      let firstSnapshotTimer;
      stop = () => {
        closed = true;
        clearTimeout(firstSnapshotTimer);
        unsubscribe?.();
      };
      const active = () => isActive() && !closed;
      const fail = (problem) => {
        if (!active()) return;
        stop();
        connecting = false;
        listenerLive.current = false;
        store.set({ error: explainError(problem) });
      };
      try {
        const api = await import('../lib/workspaceBackend');
        if (!active()) return;
        const { db, doc, getDocFromServer, onSnapshot, runTransaction } = api;
        const target = doc(db, 'workspaces', 'main');
        connection.current = { db, runTransaction, target };
        const older = legacyData();
        const fingerprint = await legacyFingerprint(older);
        if (!active()) return;

        async function initialize(snapshot) {
          const initial = snapshot.data();
          if (!needsWorkspaceMigration(initial, fingerprint)) {
            // No extra read or transaction on a normal load. If an already
            // imported browser copy remains, still validate it before cleanup.
            if (fingerprint) {
              const { createWorkspace } = await import('../lib/workspaceLegacy');
              createWorkspace(older);
            }
            return snapshot;
          }

          const { createWorkspace, legacyFirestoreValues, mergeLegacyWorkspace } =
            await import('../lib/workspaceLegacy');
          const imported = fingerprint ? createWorkspace(older) : null;
          let oldFirebase = {};
          let canImportFirebase = false;
          if (!initial?.importedFirebaseLegacy) {
            const results = await Promise.allSettled(LEGACY_COLLECTIONS.map((name) =>
              getDocFromServer(doc(db, name, 'my-personal-tracker')),
            ));
            const documents = {};
            results.forEach((result, index) => {
              if (result.status === 'fulfilled' && result.value.exists())
                documents[LEGACY_COLLECTIONS[index]] = result.value.data();
            });
            oldFirebase = legacyFirestoreValues(documents, older);
            canImportFirebase = results.every((result) => result.status === 'fulfilled');
          }
          if (!active()) return snapshot;
          await runTransaction(db, async (transaction) => {
            const latest = await transaction.get(target);
            const raw = latest.exists() ? latest.data() : null;
            const importedLegacy = raw?.importedLegacy || [];
            const needsBrowserImport = fingerprint && !importedLegacy.includes(fingerprint);
            const needsFirebaseImport = canImportFirebase && !raw?.importedFirebaseLegacy;
            if (raw && !needsBrowserImport && !needsFirebaseImport) return;
            let next = raw ? normalizeWorkspace(raw) : imported || createWorkspace();
            if (raw && needsBrowserImport) next = mergeLegacyWorkspace(next, older);
            // Don't import a partial read; it could revive deleted notes on reconnect.
            if (needsFirebaseImport) next = mergeLegacyWorkspace(next, oldFirebase);
            transaction.set(target, {
              ...next,
              importedLegacy: needsBrowserImport ? [...importedLegacy, fingerprint] : importedLegacy,
              importedFirebaseLegacy: !!(raw?.importedFirebaseLegacy || canImportFirebase),
              revision: (raw?.revision || 0) + 1,
              updatedAt: new Date().toISOString(),
            }, {
              mergeFields: [
                'schemaVersion', 'tasks', 'bookmarks', 'notes', 'appearance',
                'progress', 'importedLegacy', 'importedFirebaseLegacy', 'revision', 'updatedAt',
              ],
            });
          });
          return active() ? getDocFromServer(target) : snapshot;
        }

        function finishImport(snapshot) {
          const raw = snapshot.data();
          let notice = '';
          if (fingerprint && raw.importedLegacy?.includes(fingerprint)) {
            if (raw.importedFirebaseLegacy) {
              let removed = true;
              for (const [key, value] of Object.entries(older)) {
                try {
                  if (window.localStorage.getItem(key) === value) window.localStorage.removeItem(key);
                  else removed = false;
                } catch {
                  removed = false;
                }
              }
              notice = removed
                ? 'Your previous browser data has been imported to Firebase.'
                : 'Your previous data is saved in Firebase. This browser did not allow removal of its old copy.';
            } else {
              notice = 'Your browser data has been imported. Its old copy is kept until the previous Firebase data can be checked.';
            }
          }
          if (!raw.importedFirebaseLegacy)
            notice += `${notice ? ' ' : ''}Some previous Firebase data could not be checked. Retry the connection to finish importing it.`;
          store.set({ importNotice: notice, error: '' });
        }

        const receive = receiveWorkspaceSnapshots({
          active,
          initialize,
          adopt,
          fail,
          initialized(snapshot) {
            connecting = false;
            listenerLive.current = true;
            finishImport(snapshot);
            if (queue.current.length) void processQueue();
          },
        });
        firstSnapshotTimer = window.setTimeout(() => {
          fail(new Error('Could not reach Firebase. Check your connection and try again.'));
        }, 12000);
        unsubscribe = onSnapshot(target, { includeMetadataChanges: true }, (snapshot) => {
          if (!snapshot.metadata.fromCache && !snapshot.metadata.hasPendingWrites)
            clearTimeout(firstSnapshotTimer);
          receive(snapshot);
        }, fail);
      } catch (problem) {
        fail(problem);
      }
    }

    reconnect.current = connect;
    void connect();
    return () => {
      generation.current += 1;
      listenerLive.current = false;
      processing.current = null;
      connection.current = null;
      reconnect.current = null;
      stop();
    };
  }, [processQueue, publish, store]);

  const retry = useCallback(async () => {
    store.set({ error: '' });
    if (queue.current.length) await processQueue();
    await reconnect.current?.();
  }, [processQueue, store]);

  useEffect(() => {
    const online = () => { void retry(); };
    const protectPending = (event) => {
      if (queue.current.length) {
        event.preventDefault();
        event.returnValue = '';
      }
    };
    window.addEventListener('online', online);
    window.addEventListener('beforeunload', protectPending);
    return () => {
      window.removeEventListener('online', online);
      window.removeEventListener('beforeunload', protectPending);
    };
  }, [retry]);

  const updateData = useCallback((updater) => {
    const previous = store.getSnapshot().data;
    if (!previous || !connection.current) return false;
    try {
      const proposed = updater(previous);
      if (proposed === previous) return true;
      const next = reuseWorkspace(previous, normalizeWorkspace(proposed, previous));
      const sections = workspaceChanges(previous, next);
      if (!sections.length) return true;
      queue.current.push({ patch: diffWorkspace(previous, next), sections });
      store.set({ data: next, pending: pendingSections(queue.current), saving: true });
      void processQueue();
      return true;
    } catch (problem) {
      store.set({ error: explainError(problem) });
      return false;
    }
  }, [processQueue, store]);

  const context = useMemo(() => ({ store, updateData, retry }), [store, updateData, retry]);
  return <WorkspaceContext.Provider value={context}>{children}</WorkspaceContext.Provider>;
}
