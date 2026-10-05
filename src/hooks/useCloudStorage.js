import { useState, useEffect, useRef } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { readProgressCache, saveProgressCache } from './progressCache';

function localStorageOrNull() {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}

function cloudFields(items) {
  const completedIds = items.filter(item => item.completed).map(item => item.id);
  const itemState = {};
  items.forEach(item => {
    if (item.completed || item.note) {
      itemState[item.id] = { completed: !!item.completed };
      if (item.note) itemState[item.id].note = item.note;
    }
  });
  return { completedIds, itemState };
}

export function useCloudStorage(collectionName, documentId, initialValue, localStorageKey, previousLocalStorageKey) {
  const [data, setData] = useState(() => readProgressCache(
    initialValue, localStorageKey, previousLocalStorageKey, localStorageOrNull(),
  ));
  const [loading, setLoading] = useState(true);
  const [syncError, setSyncError] = useState(null);
  const currentData = useRef(data);
  const pendingSave = useRef(0);
  const cloudUnavailable = useRef(false);

  useEffect(() => {
    const docRef = doc(db, collectionName, documentId);
    // Keep the migrated/restored progress even if the first cloud read is denied.
    saveProgressCache(localStorageKey, currentData.current, localStorageOrNull());

    const unsubscribe = onSnapshot(docRef, docSnap => {
      if (pendingSave.current) return;
      cloudUnavailable.current = false;
      setSyncError(null);
      if (docSnap.exists()) {
        const cloudData = docSnap.data().completedIds || [];
        const itemState = docSnap.data().itemState || {};
        const merged = Array.isArray(initialValue) && initialValue[0]?.id
          ? initialValue.map(item => ({
            ...item,
            completed: itemState[item.id]?.completed ?? cloudData.includes(item.id),
            note: itemState[item.id]?.note || '',
          }))
          : cloudData;
        currentData.current = merged;
        setData(merged);
        saveProgressCache(localStorageKey, merged, localStorageOrNull());
      } else if (Array.isArray(currentData.current)) {
        setDoc(docRef, cloudFields(currentData.current), { merge: true }).catch(error => {
          cloudUnavailable.current = true;
          setSyncError(error.code || 'unavailable');
          console.error(`Error migrating ${collectionName}/${documentId}:`, error);
        });
      }
      setLoading(false);
    }, error => {
      console.error(`Error syncing ${collectionName}/${documentId}:`, error);
      cloudUnavailable.current = true;
      setSyncError(error.code || 'unavailable');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [collectionName, documentId, initialValue, localStorageKey]);

  const setValue = async value => {
    const valueToStore = value instanceof Function ? value(currentData.current) : value;
    currentData.current = valueToStore;
    setData(valueToStore);
    // Save before attempting the cloud write, so a rejected write loses no progress.
    saveProgressCache(localStorageKey, valueToStore, localStorageOrNull());
    if (cloudUnavailable.current || !Array.isArray(valueToStore)) return;

    pendingSave.current += 1;
    try {
      await setDoc(doc(db, collectionName, documentId), cloudFields(valueToStore), { merge: true });
      setSyncError(null);
    } catch (error) {
      cloudUnavailable.current = true;
      setSyncError(error.code || 'unavailable');
      console.error(`Error saving to cloud ${collectionName}/${documentId}:`, error);
    } finally {
      pendingSave.current -= 1;
    }
  };

  return [data, setValue, loading, syncError];
}
