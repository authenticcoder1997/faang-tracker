import { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

export function useCloudNotes(documentId) {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const docRef = doc(db, 'user_notes', documentId);
    
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setNotes(docSnap.data().notes || []);
      } else {
        const localDataRaw = typeof window !== 'undefined' ? window.localStorage.getItem('faang-tracker-notes') : null;
        let finalData = [];
        
        if (localDataRaw) {
          try {
            const parsedLocal = JSON.parse(localDataRaw);
            if (Array.isArray(parsedLocal)) {
              finalData = parsedLocal;
              setDoc(docRef, { notes: finalData }, { merge: true }).catch(console.error);
            }
          } catch(e) {
            console.error("Migration failed:", e);
          }
        }
        setNotes(finalData);
      }
      setLoading(false);
    }, (error) => {
      console.error(`Error syncing notes:`, error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [documentId]);

  const updateNotes = async (newNotes) => {
    try {
      const valueToStore = newNotes instanceof Function ? newNotes(notes) : newNotes;
      setNotes(valueToStore);
      const docRef = doc(db, 'user_notes', documentId);
      await setDoc(docRef, { notes: valueToStore }, { merge: true });
    } catch (error) {
      console.error(`Error saving notes:`, error);
    }
  };

  return [notes, updateNotes, loading];
}
