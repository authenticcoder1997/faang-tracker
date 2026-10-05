export function mergeCachedProgress(initialValue, cachedValue, restoreSourceCompletions = false) {
  if (!Array.isArray(cachedValue)) return initialValue;
  if (!Array.isArray(initialValue) || !initialValue[0]?.id) return cachedValue;

  return initialValue.map(item => {
    const cached = cachedValue.find(saved => saved?.id === item.id || (item.url && saved?.url === item.url));
    if (!cached) return item;
    return {
      ...item,
      completed: restoreSourceCompletions
        ? !!(item.completed || cached.completed)
        : (cached.completed ?? item.completed),
      note: cached.note || '',
    };
  });
}

export function readProgressCache(initialValue, key, previousKey, storage) {
  for (const cacheKey of [key, previousKey].filter(Boolean)) {
    try {
      const raw = storage?.getItem(cacheKey);
      if (raw) return mergeCachedProgress(initialValue, JSON.parse(raw), cacheKey === previousKey);
    } catch (error) {
      console.warn(`Could not read progress cache ${cacheKey}:`, error);
    }
  }
  return initialValue;
}

export function saveProgressCache(key, value, storage) {
  try {
    storage?.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn(`Could not save progress cache ${key}:`, error);
  }
}
