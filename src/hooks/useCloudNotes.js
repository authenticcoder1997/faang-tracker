import { useCallback, useEffect, useRef, useState } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import {
  markNotesSynced,
  readNotesCache,
  reconcileNotesSnapshot,
  saveNotesCache,
  updateNotesCache,
} from './notesCache';

function browserStorage() {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}

export function useCloudNotes(documentId) {
  const [initial] = useState(() => readNotesCache(browserStorage()));
  const [notes, setNotes] = useState(initial.cache.notes);
  const [loading, setLoading] = useState(!initial.hasCache);
  const [syncError, setSyncError] = useState(null);
  const [storageError, setStorageError] = useState(initial.storageError);
  const cache = useRef(initial.cache);
  const revision = useRef(0);
  const pendingWrites = useRef(0);
  const serverReady = useRef(false);

  const persist = useCallback((nextCache) => {
    cache.current = nextCache;
    setNotes(nextCache.notes);
    setStorageError(saveNotesCache(nextCache, browserStorage()));
  }, []);

  const writeCloud = useCallback(
    async (nextCache, savedRevision) => {
      // First merge a confirmed server read, so an early edit cannot erase
      // notes that only exist on another device.
      if (!serverReady.current) return;
      pendingWrites.current += 1;
      try {
        await setDoc(
          doc(db, 'user_notes', documentId),
          { notes: nextCache.notes },
          { merge: true },
        );
        // A slower earlier write must never clear newer pending edits.
        if (revision.current === savedRevision)
          persist(markNotesSynced(cache.current));
        setSyncError(null);
      } catch (error) {
        setSyncError(error.code || 'unavailable');
      } finally {
        pendingWrites.current -= 1;
      }
    },
    [documentId, persist],
  );

  useEffect(() => {
    serverReady.current = false;
    const docRef = doc(db, 'user_notes', documentId);
    const unsubscribe = onSnapshot(
      docRef,
      { includeMetadataChanges: true },
      (docSnap) => {
        setLoading(false);
        const confirmed = !docSnap.metadata.fromCache;
        if (confirmed) serverReady.current = true;
        // No write can start before the first confirmed read is merged.
        if (pendingWrites.current) return;
        // Firestore's offline snapshot may predate locally saved edits or deletes.
        if (docSnap.metadata.fromCache && initial.hasCache) return;
        const remoteNotes = docSnap.exists() ? docSnap.data().notes : [];
        const plan = reconcileNotesSnapshot(
          cache.current,
          remoteNotes,
          confirmed,
        );
        revision.current += 1;
        persist(plan.cache);
        if (confirmed) setSyncError(null);
        if (plan.shouldWrite) void writeCloud(plan.cache, revision.current);
      },
      (error) => {
        serverReady.current = false;
        setSyncError(error.code || 'unavailable');
        setLoading(false);
      },
    );
    return unsubscribe;
  }, [documentId, initial.hasCache, persist, writeCloud]);

  const updateNotes = useCallback(
    (value) => {
      const nextNotes =
        typeof value === 'function' ? value(cache.current.notes) : value;
      const next = updateNotesCache(cache.current, nextNotes);
      revision.current += 1;
      // Browser storage is written synchronously before any cloud request.
      persist(next);
      return writeCloud(next, revision.current);
    },
    [persist, writeCloud],
  );

  return [notes, updateNotes, loading, syncError, storageError];
}
