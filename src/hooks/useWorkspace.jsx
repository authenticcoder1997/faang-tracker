import { useCallback, useEffect, useRef, useState } from 'react';
import {
  doc,
  getDocFromServer,
  onSnapshot,
  runTransaction,
} from 'firebase/firestore';
import { db } from '../firebase';
import { WorkspaceContext } from './workspaceContext';
import {
  applyWorkspacePatch,
  createWorkspace,
  LEGACY_STORAGE_KEYS,
  legacyFirestoreValues,
  makeWorkspacePatch,
  mergeLegacyWorkspace,
  normalizeWorkspace,
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
  for (const key of LEGACY_STORAGE_KEYS) {
    const value = window.localStorage.getItem(key);
    if (value !== null) values[key] = value;
  }
  return values;
}

async function legacyFingerprint(values) {
  if (!Object.keys(values).length) return null;
  const bytes = new TextEncoder().encode(
    JSON.stringify(Object.entries(values).sort()),
  );
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(hash)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

export function WorkspaceProvider({ children }) {
  const [data, setData] = useState(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [pendingCount, setPendingCount] = useState(0);
  const [importNotice, setImportNotice] = useState('');
  const [importPending, setImportPending] = useState(false);
  const current = useRef(null);
  const queue = useRef([]);
  const processing = useRef(null);
  const generation = useRef(0);
  const reference = useRef(null);
  const serverData = useRef(null);
  const serverRevision = useRef(0);
  const reconnect = useRef(null);
  const listenerLive = useRef(false);

  const processQueue = useCallback(async () => {
    if (processing.current || !reference.current || !queue.current.length)
      return;
    const worker = { generation: generation.current };
    processing.current = worker;
    const target = reference.current;
    let completed = false;
    try {
      while (queue.current.length && generation.current === worker.generation) {
        const job = queue.current[0];
        const confirmed = await runTransaction(db, async (transaction) => {
          const snapshot = await transaction.get(target);
          if (!snapshot.exists())
            throw new Error('Your Firebase workspace could not be found. Retry the connection.');
          const next = applyWorkspacePatch(
            normalizeWorkspace(snapshot.data()),
            job.patch,
          );
          const revision = (snapshot.data().revision || 0) + 1;
          transaction.update(target, {
            ...next,
            revision,
            updatedAt: new Date().toISOString(),
          });
          return { next, revision };
        });
        if (generation.current !== worker.generation) return;
        if (queue.current[0] === job) queue.current.shift();
        if (confirmed.revision >= serverRevision.current) {
          serverData.current = confirmed.next;
          serverRevision.current = confirmed.revision;
        }
        const optimistic = queue.current.reduce(
          (workspace, pending) => applyWorkspacePatch(workspace, pending.patch),
          serverData.current,
        );
        current.current = optimistic;
        setData(optimistic);
        setPendingCount(queue.current.length);
        if (listenerLive.current) setError('');
      }
      completed = true;
    } catch (problem) {
      if (generation.current === worker.generation)
        setError(explainError(problem));
    } finally {
      if (processing.current === worker) processing.current = null;
      // Firestore terminates a listener after its error callback. A successful
      // retry of writes must restore realtime updates as well as drain the queue.
      if (completed && generation.current === worker.generation && !listenerLive.current)
        void reconnect.current?.();
    }
  }, []);

  useEffect(() => {
    const activeGeneration = ++generation.current;
    const target = doc(db, 'workspaces', 'main');
    reference.current = target;
    let unsubscribe;
    let connecting = false;
    const isActive = () => generation.current === activeGeneration;

    function adopt(snapshot) {
      if (!snapshot.exists())
        throw new Error('Your Firebase workspace could not be found. Retry the connection.');
      const revision = snapshot.data().revision || 0;
      if (revision < serverRevision.current) return;
      const workspace = normalizeWorkspace(snapshot.data());
      const optimistic = queue.current.reduce(
        (state, job) => applyWorkspacePatch(state, job.patch),
        workspace,
      );
      serverData.current = workspace;
      serverRevision.current = revision;
      current.current = optimistic;
      setData(optimistic);
      setReady(true);
      setImportPending(!snapshot.data().importedFirebaseLegacy);
    }

    async function connect() {
      if (!isActive() || connecting) return;
      connecting = true;
      unsubscribe?.();
      unsubscribe = undefined;
      listenerLive.current = false;
      try {
        let older = {};
        try {
          older = legacyData();
        } catch {
          // A browser with blocked storage can still use the Firebase workspace.
        }
        const fingerprint = await legacyFingerprint(older);
        // Decode before writing anything, so malformed legacy data keeps its copy.
        const imported = fingerprint ? createWorkspace(older) : null;
        const previousWorkspace = await getDocFromServer(target);
        let oldFirebase = {};
        let canImportFirebase = false;
        let incompleteLegacy = false;
        if (!previousWorkspace.data()?.importedFirebaseLegacy) {
          const results = await Promise.allSettled(
            LEGACY_COLLECTIONS.map((name) =>
              getDocFromServer(doc(db, name, 'my-personal-tracker')),
            ),
          );
          const documents = {};
          results.forEach((result, index) => {
            if (result.status === 'fulfilled' && result.value.exists())
              documents[LEGACY_COLLECTIONS[index]] = result.value.data();
          });
          // Decode all readable inputs even after a partial read failure. Never
          // delete browser copies if a readable old document is malformed.
          oldFirebase = legacyFirestoreValues(documents, older);
          canImportFirebase = results.every((result) => result.status === 'fulfilled');
          incompleteLegacy = !canImportFirebase;
        }
        if (!isActive()) return;
        await runTransaction(db, async (transaction) => {
          const snapshot = await transaction.get(target);
          const raw = snapshot.exists() ? snapshot.data() : null;
          const importedLegacy = raw?.importedLegacy || [];
          const needsBrowserImport = fingerprint && !importedLegacy.includes(fingerprint);
          const needsFirebaseImport = canImportFirebase && !raw?.importedFirebaseLegacy;
          if (!raw || needsBrowserImport || needsFirebaseImport) {
            let next = raw ? normalizeWorkspace(raw) : imported || createWorkspace();
            if (raw && needsBrowserImport) next = mergeLegacyWorkspace(next, older);
            // A partial import without a completion marker could resurrect a
            // deleted note on every reconnect. Wait for all five reads instead.
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
                'progress', 'importedLegacy', 'importedFirebaseLegacy',
                'revision', 'updatedAt',
              ],
            });
          }
        });
        const confirmed = await getDocFromServer(target);
        if (!isActive()) return;
        // Validate and merge pending changes before cleaning old browser data.
        adopt(confirmed);
        let notice = '';
        const legacyComplete = !!confirmed.data().importedFirebaseLegacy;
        if (fingerprint && confirmed.data().importedLegacy?.includes(fingerprint)) {
          if (legacyComplete) {
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
            // Keep deleted-note tombstones until the old server notes can be
            // checked too; otherwise a later import could revive deleted notes.
            notice = 'Your browser data has been imported. Its old copy is kept until the previous Firebase data can be checked.';
          }
        }
        if (incompleteLegacy && !legacyComplete)
          notice += `${notice ? ' ' : ''}Some previous Firebase data could not be checked. Retry the connection to finish importing it.`;
        setImportNotice(notice);
        setError('');
        unsubscribe = onSnapshot(target, { includeMetadataChanges: true }, (snapshot) => {
          if (!isActive() || snapshot.metadata.fromCache || snapshot.metadata.hasPendingWrites) return;
          try {
            adopt(snapshot);
            if (!queue.current.length) setError('');
          } catch (problem) {
            setError(explainError(problem));
          }
        }, (problem) => {
          if (!isActive()) return;
          listenerLive.current = false;
          setError(explainError(problem));
        });
        listenerLive.current = true;
        if (queue.current.length) void processQueue();
      } catch (problem) {
        if (isActive()) setError(explainError(problem));
      } finally {
        connecting = false;
      }
    }

    reconnect.current = connect;
    void connect();
    return () => {
      generation.current += 1;
      listenerLive.current = false;
      processing.current = null;
      reconnect.current = null;
      unsubscribe?.();
    };
  }, [processQueue]);

  const retry = useCallback(async () => {
    setError('');
    if (queue.current.length) await processQueue();
    // This also runs with an empty queue, restoring reads after a terminal error.
    await reconnect.current?.();
  }, [processQueue]);

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
    if (!current.current || !reference.current) return false;
    try {
      const next = normalizeWorkspace(updater(current.current));
      const patch = makeWorkspacePatch(current.current, next);
      if (!patch || JSON.stringify(next) === JSON.stringify(current.current)) return true;
      current.current = next;
      queue.current.push({ patch });
      setData(next);
      setPendingCount(queue.current.length);
      void processQueue();
      return true;
    } catch (problem) {
      setError(explainError(problem));
      return false;
    }
  }, [processQueue]);

  return (
    <WorkspaceContext.Provider value={{
      data, ready, saving: pendingCount > 0, error, updateData, retry, importNotice, importPending,
    }}>
      {children}
    </WorkspaceContext.Provider>
  );
}
