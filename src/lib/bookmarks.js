export const BOOKMARKS_STORAGE_KEY = 'my-space-important-bookmarks-v1';

const READ_ERROR =
  'Your saved websites could not be read. They have been kept in browser storage; no changes will overwrite them.';
const SAVE_ERROR =
  'Your browser could not save these websites. Free some browser storage and try again.';

export function normalizeBookmark(value) {
  if (!value || typeof value !== 'object' || typeof value.url !== 'string')
    return null;
  if (
    value.folderPath !== undefined &&
    (!Array.isArray(value.folderPath) ||
      value.folderPath.some(
        (segment) => typeof segment !== 'string' || !segment.trim(),
      ))
  )
    return null;
  const folderPath = (value.folderPath || []).map((segment) => segment.trim());
  const input = value.url.trim();
  if (
    !input ||
    Array.from(input).some((character) => {
      const code = character.charCodeAt(0);
      return code < 32 || code === 127;
    })
  )
    return null;
  try {
    const url = new URL(input);
    if (
      !['https:', 'http:'].includes(url.protocol) ||
      !url.hostname ||
      url.username ||
      url.password
    )
      return null;
    const title =
      typeof value.title === 'string'
        ? value.title.trim().replace(/\s+/g, ' ')
        : '';
    return {
      id: folderPath.length
        ? `${JSON.stringify(folderPath)}|${url.href}`
        : url.href,
      title: title || url.hostname,
      url: url.href,
      ...(folderPath.length ? { folderPath } : {}),
    };
  } catch {
    return null;
  }
}

export function normalizeBookmarks(value) {
  if (!Array.isArray(value)) return [];
  const byId = new Map();
  for (const candidate of value) {
    const bookmark = normalizeBookmark(candidate);
    if (bookmark && !byId.has(bookmark.id)) byId.set(bookmark.id, bookmark);
  }
  return [...byId.values()];
}

export function buildBookmarkTree(bookmarks) {
  const tree = [];
  const folders = new Map();
  for (const bookmark of normalizeBookmarks(bookmarks)) {
    let children = tree;
    const path = [];
    for (const title of bookmark.folderPath || []) {
      path.push(title);
      const id = `folder:${JSON.stringify(path)}`;
      let folder = folders.get(id);
      if (!folder) {
        folder = { type: 'folder', id, title, children: [] };
        folders.set(id, folder);
        children.push(folder);
      }
      children = folder.children;
    }
    children.push({ type: 'bookmark', ...bookmark });
  }
  return tree;
}

// Parse only the structure used by browser bookmark exports. Rebuilding the
// markup before DOMParser avoids fetching images or other embedded resources.
function inertBookmarkMarkup(input) {
  const html = input.replace(/<!--[\s\S]*?-->/g, '');
  const tags = /<\/?([a-z][\w:-]*)\b((?:[^<>"']|"[^"]*"|'[^']*')*)>/gi;
  const allowed = new Set(['dl', 'dt', 'h3', 'a']);
  const rawText = new Set(['script', 'style', 'textarea', 'title', 'xmp']);
  let output = '';
  let previous = 0;
  let suppressed = null;
  for (const match of html.matchAll(tags)) {
    const closing = /^<\//.test(match[0]);
    const name = match[1].toLowerCase();
    if (suppressed) {
      if (closing && name === suppressed) suppressed = null;
      previous = match.index + match[0].length;
      continue;
    }
    output += html
      .slice(previous, match.index)
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    previous = match.index + match[0].length;
    if (rawText.has(name) && !closing) {
      suppressed = name;
      continue;
    }
    if (!allowed.has(name)) continue;
    if (closing) {
      output += `</${name}>`;
    } else if (name === 'a') {
      const href = match[2].match(
        /(?:^|\s)href\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/i,
      );
      const raw = href?.[1] ?? href?.[2] ?? href?.[3];
      output +=
        raw === undefined
          ? '<a>'
          : `<a href="${raw.replace(/"/g, '&quot;').replace(/</g, '&lt;')}">`;
    } else {
      output += `<${name}>`;
    }
  }
  if (!suppressed)
    output += html.slice(previous).replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return output;
}

function folderList(heading) {
  const sibling = heading.nextElementSibling;
  if (sibling?.tagName?.toLowerCase() === 'dl') return sibling;
  const parent = heading.parentElement;
  return parent?.tagName?.toLowerCase() === 'dt' &&
    parent.nextElementSibling?.tagName?.toLowerCase() === 'dl'
    ? parent.nextElementSibling
    : null;
}

function bookmarksFromHtml(input, DOMParserClass) {
  if (typeof DOMParserClass !== 'function')
    throw new Error('Import this bookmark file in a browser.');
  const document = new DOMParserClass().parseFromString(
    inertBookmarkMarkup(input),
    'text/html',
  );
  const bookmarks = [];
  const visitedLists = new Set();

  function walkList(list, path) {
    if (visitedLists.has(list)) return;
    visitedLists.add(list);
    walkChildren(list, path);
  }

  function walkChildren(element, path) {
    for (const child of element.children || []) {
      const tag = child.tagName?.toLowerCase();
      if (tag === 'h3') {
        const nested = folderList(child);
        if (nested)
          walkList(nested, [
            ...path,
            child.textContent.trim() || 'Untitled folder',
          ]);
      } else if (tag === 'dl') {
        walkList(child, path);
      } else if (tag === 'a') {
        bookmarks.push({
          title: child.textContent,
          url: child.getAttribute('href'),
          folderPath: path,
        });
      } else {
        walkChildren(child, path);
      }
    }
  }

  for (const heading of document.querySelectorAll('h3')) {
    if (heading.textContent.trim().toLowerCase() !== 'important') continue;
    const folder = folderList(heading);
    if (folder) walkList(folder, []);
  }
  const normalized = normalizeBookmarks(bookmarks);
  if (!normalized.length)
    throw new Error(
      'No websites were found in an Important folder. Export that folder or paste its website links.',
    );
  return normalized;
}

export function parseBookmarkImport(
  input,
  DOMParserClass = globalThis.DOMParser,
) {
  if (typeof input !== 'string' || !input.trim())
    throw new Error('Choose a bookmark file or paste website links first.');
  const text = input.trim();
  if (/<(?:!doctype\s+net|dl\b|h3\b)/i.test(text))
    return bookmarksFromHtml(text, DOMParserClass);
  let candidates;
  if (text.startsWith('[') || text.startsWith('{')) {
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      throw new Error(
        'This bookmark JSON is not valid. Check the file and try again.',
      );
    }
    candidates = Array.isArray(parsed) ? parsed : parsed?.bookmarks;
    if (!Array.isArray(candidates))
      throw new Error(
        'Bookmark JSON must contain a list of website titles and URLs.',
      );
  } else {
    candidates = text.split(/\r?\n/).map((line) => {
      const labelled = line.trim().match(/^(.*?)\s*\|\s*(https?:\/\/.*)$/i);
      return labelled
        ? { title: labelled[1], url: labelled[2] }
        : { url: line.trim() };
    });
  }
  const bookmarks = normalizeBookmarks(candidates);
  if (!bookmarks.length)
    throw new Error(
      'No valid website links were found. Use full http:// or https:// URLs.',
    );
  return bookmarks;
}

export function readBookmarks(storage, initialBookmarks = []) {
  try {
    if (!storage) throw new Error('Storage unavailable');
    const raw = storage.getItem(BOOKMARKS_STORAGE_KEY);
    if (raw === null)
      return { bookmarks: normalizeBookmarks(initialBookmarks), error: null };
    const parsed = JSON.parse(raw);
    const bookmarks = Array.isArray(parsed) ? parsed : parsed?.bookmarks;
    if (
      (!Array.isArray(parsed) && parsed?.version !== 1) ||
      !Array.isArray(bookmarks) ||
      bookmarks.some((bookmark) => !normalizeBookmark(bookmark))
    )
      throw new Error('Invalid saved websites');
    return { bookmarks: normalizeBookmarks(bookmarks), error: null };
  } catch {
    return { bookmarks: [], error: READ_ERROR };
  }
}

export function saveBookmarks(storage, bookmarks) {
  const latest = readBookmarks(storage);
  if (latest.error) return { error: latest.error };
  if (
    !Array.isArray(bookmarks) ||
    bookmarks.some((bookmark) => !normalizeBookmark(bookmark))
  )
    return {
      error: 'These websites contain an invalid link. Check it and try again.',
    };
  try {
    storage.setItem(
      BOOKMARKS_STORAGE_KEY,
      JSON.stringify({ version: 1, bookmarks: normalizeBookmarks(bookmarks) }),
    );
    return { error: null };
  } catch {
    return { error: SAVE_ERROR };
  }
}
