import { useState, useEffect, useRef } from 'react';
import {
  INITIAL_TASK_DATA,
  TASK_STORAGE_KEY,
  validateTaskData,
} from '../lib/tasks';

function readTasks() {
  try {
    const saved = window.localStorage.getItem(TASK_STORAGE_KEY);
    return {
      data: saved ? validateTaskData(JSON.parse(saved)) : INITIAL_TASK_DATA,
      error: null,
    };
  } catch {
    return {
      data: INITIAL_TASK_DATA,
      error:
        'Your saved tasks could not be read. They have been kept in browser storage; no changes will overwrite them.',
    };
  }
}

export function useTasks() {
  const [initial] = useState(readTasks);
  const [data, setData] = useState(initial.data);
  const [error, setError] = useState(initial.error);
  const blocked = useRef(!!initial.error);

  useEffect(() => {
    function receiveChange(event) {
      if (event.key !== TASK_STORAGE_KEY && event.key !== null) return;
      const latest = readTasks();
      blocked.current = !!latest.error;
      setError(latest.error);
      setData(latest.data);
    }
    window.addEventListener('storage', receiveChange);
    return () => window.removeEventListener('storage', receiveChange);
  }, []);

  function updateData(change) {
    if (blocked.current) return false;
    // Read the latest value before editing, including edits from another open tab.
    const latest = readTasks();
    if (latest.error) {
      blocked.current = true;
      setError(latest.error);
      return false;
    }
    const next = change(latest.data);
    try {
      window.localStorage.setItem(TASK_STORAGE_KEY, JSON.stringify(next));
      setData(next);
      setError(null);
      return true;
    } catch {
      setError(
        'Your browser could not save this change. Free some browser storage and try again.',
      );
      return false;
    }
  }

  return { data, updateData, error };
}
