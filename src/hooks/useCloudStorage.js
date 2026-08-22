import { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

export function useCloudStorage(collectionName, documentId, initialValue, localStorageKey) {
  const [data, setData] = useState(initialValue);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const docRef = doc(db, collectionName, documentId);
    
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const cloudData = docSnap.data().completedIds || [];
        
        // Smart merge: keep fresh source-of-truth data, but restore completion state
        if (Array.isArray(initialValue) && initialValue.length > 0 && initialValue[0].id) {
          const merged = initialValue.map(initItem => ({
            ...initItem,
            completed: cloudData.includes(initItem.id)
          }));
          setData(merged);
        } else {
          setData(cloudData);
        }
      } else {
        // Document doesn't exist yet in cloud. Let's try migrating from localStorage!
        const localDataRaw = typeof window !== 'undefined' ? window.localStorage.getItem(localStorageKey) : null;
        let finalData = initialValue;
        
        if (localDataRaw) {
          try {
            const parsedLocal = JSON.parse(localDataRaw);
            if (Array.isArray(parsedLocal) && Array.isArray(initialValue) && initialValue.length > 0 && initialValue[0].id) {
              finalData = initialValue.map(initItem => {
                 const cachedItem = parsedLocal.find(p => p.id === initItem.id || p.url === initItem.url);
                 if (cachedItem) {
                    return { ...initItem, completed: cachedItem.completed };
                 }
                 return initItem;
              });
              
              // Upload the migrated data to cloud in the background
              const completedIds = finalData.filter(i => i.completed).map(i => i.id);
              setDoc(docRef, { completedIds }, { merge: true }).catch(console.error);
            }
          } catch(e) {
            console.error("Migration failed:", e);
          }
        }
        setData(finalData);
      }
      setLoading(false);
    }, (error) => {
      console.error(`Error syncing ${collectionName}/${documentId}:`, error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [collectionName, documentId, initialValue, localStorageKey]);

  const setValue = async (value) => {
    try {
      const valueToStore = value instanceof Function ? value(data) : value;
      
      // Optimistic local update
      setData(valueToStore);

      // Save to cloud
      if (Array.isArray(valueToStore)) {
        const completedIds = valueToStore.filter(i => i.completed).map(i => i.id);
        const docRef = doc(db, collectionName, documentId);
        await setDoc(docRef, { completedIds }, { merge: true });
      }
    } catch (error) {
      console.error(`Error saving to cloud ${collectionName}/${documentId}:`, error);
    }
  };

  return [data, setValue, loading];
}
