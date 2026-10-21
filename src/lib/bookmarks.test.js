import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BOOKMARKS_STORAGE_KEY,
  normalizeBookmark,
  normalizeBookmarks,
  buildBookmarkTree,
  parseBookmarkImport,
  readBookmarks,
  saveBookmarks,
} from './bookmarks.js';

function element(tagName, children = [], textContent = '') {
  const node = { tagName, children, textContent };
  children.forEach((child, index) => {
    child.parentElement = node;
    child.nextElementSibling = children[index + 1] || null;
  });
  return node;
}

function link(title, url) {
  return { ...element('A', [], title), getAttribute: () => url };
}

function fixtureDocument(root) {
  return {
    querySelectorAll() {
      const headings = [];
      function visit(node) {
        if (node.tagName === 'H3') headings.push(node);
        node.children?.forEach(visit);
      }
      visit(root);
      return headings;
    },
  };
}

function storage(initial = null) {
  let raw = initial;
  let writes = 0;
  return {
    getItem(key) {
      assert.equal(key, BOOKMARKS_STORAGE_KEY);
      return raw;
    },
    setItem(key, value) {
      assert.equal(key, BOOKMARKS_STORAGE_KEY);
      writes += 1;
      raw = value;
    },
    get raw() {
      return raw;
    },
    get writes() {
      return writes;
    },
  };
}

test('websites have stable URL ids, readable titles, and retain query and fragment', () => {
  assert.deepEqual(
    normalizeBookmark({
      title: '  Study\n  resources  ',
      url: ' https://EXAMPLE.com/study?q=a%20b&tab=2#notes ',
    }),
    {
      id: 'https://example.com/study?q=a%20b&tab=2#notes',
      title: 'Study resources',
      url: 'https://example.com/study?q=a%20b&tab=2#notes',
    },
  );
  assert.equal(
    normalizeBookmark({ url: 'https://example.com' }).title,
    'example.com',
  );
});

test('unsafe schemes, credentials, relative URLs, and malformed input are excluded', () => {
  for (const url of [
    'javascript:alert(1)',
    'data:text/html,hello',
    'file:///etc/passwd',
    'chrome://bookmarks/',
    'ftp://example.com',
    'https://name:secret@example.com',
    'https://name@example.com',
    'https://exa\nmple.com',
    '//example.com',
    '/relative',
    'example.com',
    '',
  ]) {
    assert.equal(normalizeBookmark({ url }), null, url);
  }
  assert.equal(normalizeBookmark(null), null);
  assert.equal(normalizeBookmark({ url: 42 }), null);
});

test('duplicates normalize and keep the first title without combining separate destinations', () => {
  const links = normalizeBookmarks([
    { title: 'First', url: 'https://EXAMPLE.com' },
    { title: 'Duplicate', url: 'https://example.com/' },
    { title: 'Different', url: 'https://example.com/#notes' },
    { url: 'javascript:alert(1)' },
  ]);
  assert.equal(links.length, 2);
  assert.equal(links[0].title, 'First');
  assert.equal(links[1].url, 'https://example.com/#notes');
  assert.deepEqual(normalizeBookmarks(null), []);
});

test('relative folder paths preserve case and separate the same website in different folders', () => {
  const bookmarks = normalizeBookmarks([
    { title: 'Root', url: 'https://example.com' },
    {
      title: 'First',
      url: 'https://example.com',
      folderPath: ['leetcode lists'],
    },
    {
      title: 'Duplicate',
      url: 'https://EXAMPLE.com/',
      folderPath: ['leetcode lists'],
    },
    { title: 'Jobs', url: 'https://example.com', folderPath: ['Jobs Sites'] },
    {
      title: 'Nested',
      url: 'https://example.com',
      folderPath: ['Jobs Sites', 'Saved searches'],
    },
  ]);
  assert.equal(bookmarks.length, 4);
  assert.equal(bookmarks[1].id, '["leetcode lists"]|https://example.com/');
  assert.equal(bookmarks[1].title, 'First');
  assert.deepEqual(bookmarks[3].folderPath, ['Jobs Sites', 'Saved searches']);
  assert.equal('folderPath' in bookmarks[0], false);
  assert.equal(
    'folderPath' in
      normalizeBookmark({ url: 'https://example.com', folderPath: [] }),
    false,
  );
  for (const folderPath of ['Jobs', [null], [''], ['  '], [1]])
    assert.equal(
      normalizeBookmark({ url: 'https://example.com', folderPath }),
      null,
    );
});

test('bookmark trees retain root order, first folder position, and recursive child order', () => {
  const bookmarks = [
    { title: 'First root', url: 'https://first.example' },
    {
      title: 'Practice',
      url: 'https://practice.example',
      folderPath: ['leetcode lists'],
    },
    { title: 'Second root', url: 'https://second.example' },
    {
      title: 'Applications',
      url: 'https://applications.example',
      folderPath: ['Jobs Sites'],
    },
    {
      title: 'Nested',
      url: 'https://nested.example',
      folderPath: ['leetcode lists', 'Advanced'],
    },
    {
      title: 'More practice',
      url: 'https://more.example',
      folderPath: ['leetcode lists'],
    },
  ];
  const tree = buildBookmarkTree(bookmarks);
  assert.deepEqual(
    tree.map(({ type, title }) => [type, title]),
    [
      ['bookmark', 'First root'],
      ['folder', 'leetcode lists'],
      ['bookmark', 'Second root'],
      ['folder', 'Jobs Sites'],
    ],
  );
  assert.equal(tree[1].id, 'folder:["leetcode lists"]');
  assert.deepEqual(
    tree[1].children.map(({ title }) => title),
    ['Practice', 'Advanced', 'More practice'],
  );
  assert.equal(tree[1].children[1].id, 'folder:["leetcode lists","Advanced"]');
  assert.equal(tree[1].children[1].children[0].title, 'Nested');
  assert.equal(tree[3].children[0].title, 'Applications');
  assert.deepEqual(buildBookmarkTree([]), []);
});

test('imports JSON arrays, wrapped JSON, and plain or labelled website lines', () => {
  const expected = [
    {
      id: 'https://example.com/',
      title: 'Example',
      url: 'https://example.com/',
    },
  ];
  assert.deepEqual(
    parseBookmarkImport('[{"title":"Example","url":"https://example.com"}]'),
    expected,
  );
  assert.deepEqual(
    parseBookmarkImport(
      '{"bookmarks":[{"title":"Example","url":"https://example.com"}]}',
    ),
    expected,
  );
  assert.deepEqual(
    parseBookmarkImport(
      'Example | https://example.com\r\nhttps://example.com/',
    ),
    expected,
  );
  assert.equal(
    parseBookmarkImport('https://example.com')[0].title,
    'example.com',
  );
  assert.deepEqual(
    parseBookmarkImport(
      '[{"title":"Nested","url":"https://example.com","folderPath":["LCO","Course"]}]',
    )[0].folderPath,
    ['LCO', 'Course'],
  );
});

test('invalid imports explain the required format and never evaluate HTML or scripts', () => {
  for (const text of [
    '',
    '   ',
    '[broken',
    '{}',
    'javascript:alert(1)',
    'example.com',
  ])
    assert.throws(() => parseBookmarkImport(text));
  assert.throws(
    () =>
      parseBookmarkImport(
        '<DL><DT><H3>Important</H3><DL></DL></DL>',
        undefined,
      ),
    /browser/,
  );
});

test('HTML import restricts extraction to Important folders and strips active resources before parsing', () => {
  let sanitized;
  const folder = {
    tagName: 'DL',
    children: [
      link('Direct', 'https://direct.example'),
      link('Nested', 'https://nested.example'),
      link('Unsafe', 'javascript:alert(1)'),
    ],
  };
  class FixtureParser {
    parseFromString(markup, type) {
      sanitized = markup;
      assert.equal(type, 'text/html');
      return {
        querySelectorAll: () => [
          { textContent: 'Other folder', nextElementSibling: folder },
          { textContent: '  iMpOrTaNt  ', nextElementSibling: folder },
        ],
      };
    }
  }
  const imported = parseBookmarkImport(
    '<!DOCTYPE NETSCAPE-Bookmark-file-1><DL><DT><H3 onclick="bad()">Important</H3><DL><DT><A HREF="https://direct.example?a=1&amp;b=2" ICON="https://icon.example">Direct</A><IMG SRC="https://pixel.example"><SCRIPT><A HREF="https://wrong.example">Ignore</A></SCRIPT></DL></DL>',
    FixtureParser,
  );
  assert.deepEqual(
    imported.map(({ title }) => title),
    ['Direct', 'Nested'],
  );
  assert.match(sanitized, /href="https:\/\/direct.example\?a=1&amp;b=2"/);
  assert.doesNotMatch(
    sanitized,
    /onclick|ICON|IMG|SCRIPT|pixel\.example|wrong\.example/i,
  );
});

test('HTML import supports a folder list adjacent to its DT and reports absent folders', () => {
  class AdjacentParser {
    parseFromString() {
      return {
        querySelectorAll: () => [
          {
            textContent: 'Important',
            parentElement: {
              tagName: 'DT',
              nextElementSibling: {
                tagName: 'DL',
                children: [link('Example', 'https://example.com')],
              },
            },
          },
        ],
      };
    }
  }
  assert.equal(parseBookmarkImport('<DL></DL>', AdjacentParser).length, 1);
  class MissingFolderParser {
    parseFromString() {
      return { querySelectorAll: () => [] };
    }
  }
  assert.throws(
    () => parseBookmarkImport('<DL></DL>', MissingFolderParser),
    /Important folder/,
  );
});

test('exported HTML imports preserve relative nested folders and exact website order', () => {
  const deep = element('DT', [
    element('H3', [], 'Advanced'),
    element('DL', [element('DT', [link('Deep', 'https://deep.example')])]),
  ]);
  const practice = element('DT', [
    element('H3', [], 'leetcode lists'),
    element('DL', [
      element('DT', [link('Practice', 'https://practice.example')]),
      deep,
    ]),
  ]);
  const jobs = element('DT', [
    element('H3', [], 'Jobs Sites'),
    element('DL', [element('DT', [link('Jobs', 'https://jobs.example')])]),
  ]);
  const important = element('DT', [
    element('H3', [], 'Important'),
    element('DL', [
      element('DT', [link('First root', 'https://first.example')]),
      practice,
      element('DT', [link('Second root', 'https://second.example')]),
      jobs,
    ]),
  ]);
  const other = element('DT', [
    element('H3', [], 'Unrelated'),
    element('DL', [
      element('DT', [link('Excluded', 'https://excluded.example')]),
    ]),
  ]);
  class NestedParser {
    parseFromString() {
      return fixtureDocument(element('DL', [other, important]));
    }
  }
  const bookmarks = parseBookmarkImport(
    '<DL><H3>Important</H3></DL>',
    NestedParser,
  );
  assert.deepEqual(
    bookmarks.map(({ title, folderPath }) => [title, folderPath || []]),
    [
      ['First root', []],
      ['Practice', ['leetcode lists']],
      ['Deep', ['leetcode lists', 'Advanced']],
      ['Second root', []],
      ['Jobs', ['Jobs Sites']],
    ],
  );
});

test('missing storage starts empty and valid saves round-trip without a public bookmark seed', () => {
  const store = storage();
  assert.deepEqual(readBookmarks(store), { bookmarks: [], error: null });
  assert.deepEqual(
    saveBookmarks(store, [{ title: 'Mine', url: 'https://example.com' }]),
    { error: null },
  );
  assert.equal(store.writes, 1);
  assert.equal(JSON.parse(store.raw).version, 1);
  assert.equal(readBookmarks(store).bookmarks[0].title, 'Mine');
});

test('initial bookmarks appear only before the first local save and never replace existing or corrupt data', () => {
  const initial = [
    { title: 'Seed', url: 'https://example.com', folderPath: ['LCO'] },
  ];
  const empty = storage();
  assert.equal(readBookmarks(empty, initial).bookmarks[0].title, 'Seed');
  assert.equal(empty.writes, 0);
  assert.deepEqual(
    readBookmarks(storage('{"version":1,"bookmarks":[]}'), initial),
    { bookmarks: [], error: null },
  );
  const existing = storage(
    '{"version":1,"bookmarks":[{"title":"Mine","url":"https://mine.example","folderPath":["Jobs Sites"]}]}',
  );
  assert.equal(readBookmarks(existing, initial).bookmarks[0].title, 'Mine');
  assert.deepEqual(readBookmarks(existing, initial).bookmarks[0].folderPath, [
    'Jobs Sites',
  ]);
  const corrupt = readBookmarks(storage('broken'), initial);
  assert.deepEqual(corrupt.bookmarks, []);
  assert.ok(corrupt.error);
  assert.deepEqual(readBookmarks(undefined, initial).bookmarks, []);
  assert.deepEqual(saveBookmarks(empty, initial), { error: null });
  assert.deepEqual(readBookmarks(empty).bookmarks[0].folderPath, ['LCO']);
});

test('unreadable or unsupported saved data is retained and cannot be overwritten', () => {
  for (const raw of [
    'broken',
    '',
    '{}',
    '{"version":2,"bookmarks":[]}',
    '{"version":1,"bookmarks":[{"url":"javascript:alert(1)"}]}',
  ]) {
    const store = storage(raw);
    assert.ok(readBookmarks(store).error);
    assert.ok(saveBookmarks(store, []).error);
    assert.equal(store.raw, raw);
    assert.equal(store.writes, 0);
  }
  assert.ok(readBookmarks(undefined).error);
});

test('quota failures and invalid edits report failure without replacing saved websites', () => {
  const store = storage();
  assert.ok(saveBookmarks(store, [{ url: 'javascript:alert(1)' }]).error);
  assert.equal(store.writes, 0);
  store.setItem = () => {
    throw new Error('QuotaExceededError');
  };
  assert.match(
    saveBookmarks(store, [{ url: 'https://example.com' }]).error,
    /could not save/,
  );
  assert.equal(store.raw, null);
});
