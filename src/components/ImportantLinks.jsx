import { useState } from 'react';
import {
  ArrowUpRight,
  Download,
  Folder,
  Globe,
  LayoutGrid,
  Plus,
  Search,
} from 'lucide-react';
import BookmarkEditor from './BookmarkEditor';
import { EmptyState, PageHeader } from './ui/Workspace';
import { importantBookmarks } from '../data/importantBookmarks';
import { useWorkspace } from '../hooks/useWorkspace';
import {
  buildBookmarkTree,
  normalizeBookmarks,
} from '../lib/bookmarks';

const previews = new Map(
  importantBookmarks.map((bookmark) => [
    new URL(bookmark.url).href,
    bookmark.preview,
  ]),
);
const previewNotes = new Map(
  importantBookmarks.map((bookmark) => [
    new URL(bookmark.url).href,
    bookmark.previewNote,
  ]),
);

function pathStartsWith(path, prefix) {
  return prefix.every((segment, index) => path[index] === segment);
}

function collectSections(nodes, path = []) {
  const direct = nodes.filter((node) => node.type === 'bookmark');
  return [
    ...(direct.length ? [{ path, bookmarks: direct }] : []),
    ...nodes
      .filter((node) => node.type === 'folder')
      .flatMap((folder) =>
        collectSections(folder.children, [...path, folder.title]),
      ),
  ];
}

function WebsiteCard({ bookmark, priority = false }) {
  const [failed, setFailed] = useState(false);
  const hostname = new URL(bookmark.url).hostname.replace(/^www\./, '');
  const preview = previews.get(bookmark.url);

  return (
    <a
      href={bookmark.url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${bookmark.title} — opens in a new tab`}
      className="panel group block min-w-0 overflow-hidden transition-colors hover:border-accent/50"
    >
      <div className="relative aspect-video overflow-hidden border-b border-line bg-well">
        {preview && !failed ? (
          <img
            src={preview}
            alt={`${bookmark.title} website preview`}
            loading={priority ? 'eager' : 'lazy'}
            fetchPriority={priority ? 'high' : 'auto'}
            decoding="async"
            onError={() => setFailed(true)}
            className="h-full w-full object-cover object-top transition-transform duration-300 group-hover:scale-[1.025] motion-reduce:transform-none motion-reduce:transition-none"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-line bg-surface text-accent">
              <Globe size={24} strokeWidth={1.4} aria-hidden="true" />
            </span>
            <p className="max-w-full truncate text-sm font-medium text-secondary">
              {hostname}
            </p>
            <p className="text-[11px] text-faint">Screenshot unavailable</p>
          </div>
        )}
        {preview && !failed && previewNotes.get(bookmark.url) && (
          <span className="absolute right-3 bottom-3 rounded-md border border-line bg-surface px-2 py-1 text-[10px] font-medium text-secondary">
            {previewNotes.get(bookmark.url)}
          </span>
        )}
      </div>
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="line-clamp-2 min-h-11 text-sm leading-[1.55] font-semibold text-ink">
            {bookmark.title}
          </h3>
          <ArrowUpRight
            size={16}
            aria-hidden="true"
            className="mt-0.5 shrink-0 text-muted transition-colors group-hover:text-accent"
          />
        </div>
        <p className="mt-3 truncate text-xs text-muted" title={hostname}>
          {hostname}
        </p>
      </div>
    </a>
  );
}

export default function ImportantLinks({ isActive = true }) {
  const { data, updateData, saving, error: syncError } = useWorkspace();
  const bookmarks = data.bookmarks;
  const [operationError, setOperationError] = useState(null);
  const error = syncError || operationError;
  const [editor, setEditor] = useState(null);
  const [selectedFolder, setSelectedFolder] = useState('all');
  const [search, setSearch] = useState('');
  const [undo, setUndo] = useState(null);
  const [notice, setNotice] = useState('');

  const folderPaths = [
    ...new Map(
      bookmarks.flatMap((bookmark) =>
        (bookmark.folderPath || []).map((_, index) => {
          const path = bookmark.folderPath.slice(0, index + 1);
          return [JSON.stringify(path), path];
        }),
      ),
    ).values(),
  ];
  const activeFolder = folderPaths.find(
    (path) => JSON.stringify(path) === selectedFolder,
  );
  const query = search.trim().toLocaleLowerCase();
  const sections = collectSections(buildBookmarkTree(bookmarks))
    .map((section) => ({
      ...section,
      bookmarks: section.bookmarks.filter((bookmark) => {
        const inFolder =
          !activeFolder ||
          pathStartsWith(bookmark.folderPath || [], activeFolder);
        const matchesSearch =
          !query ||
          `${bookmark.title} ${new URL(bookmark.url).hostname} ${(bookmark.folderPath || []).join(' ')}`
            .toLocaleLowerCase()
            .includes(query);
        return inFolder && matchesSearch;
      }),
    }))
    .filter((section) => section.bookmarks.length);
  const visibleCount = sections.reduce(
    (total, section) => total + section.bookmarks.length,
    0,
  );

  function update(change) {
    let previous;
    let next;
    const accepted = updateData((current) => {
      previous = current.bookmarks;
      next = normalizeBookmarks(change(current.bookmarks));
      return { ...current, bookmarks: next };
    });
    if (!accepted) {
      const message = syncError || 'Your websites could not be updated. Please try again.';
      setOperationError(message);
      return message;
    }
    setOperationError(null);
    setUndo({ before: previous, after: next });
    setEditor(null);
    setNotice(
      `${next.length} ${next.length === 1 ? 'website' : 'websites'} in your collection`,
    );
    return null;
  }

  function restorePrevious() {
    if (!undo) return;
    let changedElsewhere = false;
    const accepted = updateData((current) => {
      if (JSON.stringify(current.bookmarks) !== JSON.stringify(undo.after)) {
        changedElsewhere = true;
        return current;
      }
      return { ...current, bookmarks: undo.before };
    });
    if (!accepted) return setOperationError(syncError || 'Your websites could not be restored. Please try again.');
    setOperationError(null);
    setUndo(null);
    setNotice(changedElsewhere ? 'Websites changed on another device. Your newer changes were kept.' : 'Previous websites restored');
  }

  return (
    <div className="page-frame">
      <PageHeader
        eyebrow="Your collection"
        title="Important links"
        description="Your go-to websites, with a familiar view before you open them."
        actions={
          <>
            <button
              type="button"
              className="button-secondary"
              onClick={() => setEditor('import')}
            >
              <Download size={15} /> Import
            </button>
            <button
              type="button"
              className="button-primary"
              onClick={() => setEditor('add')}
            >
              <Plus size={16} /> Add website
            </button>
          </>
        }
      />

      <div className="mb-8 flex flex-col gap-5 border-b border-line pb-6 lg:flex-row lg:items-center lg:justify-between">
        <nav
          aria-label="Important link folders"
          className="flex min-w-0 flex-wrap gap-2"
        >
          <button
            type="button"
            aria-pressed={!activeFolder}
            onClick={() => setSelectedFolder('all')}
            className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${!activeFolder ? 'border-accent/25 bg-selected text-accent' : 'border-transparent text-muted hover:bg-hover hover:text-ink'}`}
          >
            <LayoutGrid size={14} aria-hidden="true" /> All links{' '}
            <span className="text-[10px] tabular-nums opacity-75">
              {bookmarks.length}
            </span>
          </button>
          {folderPaths.map((path) => {
            const id = JSON.stringify(path);
            const count = bookmarks.filter((bookmark) =>
              pathStartsWith(bookmark.folderPath || [], path),
            ).length;
            return (
              <button
                key={id}
                type="button"
                aria-pressed={activeFolder === path}
                onClick={() => setSelectedFolder(id)}
                className={`inline-flex max-w-full items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${activeFolder === path ? 'border-accent/25 bg-selected text-accent' : 'border-transparent text-muted hover:bg-hover hover:text-ink'}`}
              >
                <Folder size={14} aria-hidden="true" className="shrink-0" />
                <span className="truncate">{path.join(' / ')}</span>
                <span className="text-[10px] tabular-nums opacity-75">
                  {count}
                </span>
              </button>
            );
          })}
        </nav>
        <label className="relative block w-full shrink-0 sm:max-w-xs lg:w-60">
          <span className="sr-only">Search important links</span>
          <Search
            size={15}
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-faint"
          />
          <input
            type="search"
            className="input-control !pl-9 text-xs"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Find a website"
          />
        </label>
      </div>

      {error && (
        <p
          role="alert"
          className="mb-6 rounded-xl border border-warning/25 bg-warning/5 p-4 text-sm leading-6 text-warning"
        >
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="mb-6 text-xs text-muted">
          {notice}
          {undo && (
            <button
              type="button"
              onClick={restorePrevious}
              className="ml-3 font-medium text-accent hover:underline"
            >
              Undo
            </button>
          )}
        </p>
      )}

      <p className="sr-only" role="status">
        {visibleCount} {visibleCount === 1 ? 'website' : 'websites'} shown
      </p>
      {sections.length ? (
        <div className="space-y-10">
          {sections.map((section, sectionIndex) => (
            <section
              key={JSON.stringify(section.path)}
              aria-labelledby={`links-folder-${encodeURIComponent(JSON.stringify(section.path))}`}
            >
              <div className="mb-4 flex items-center gap-2.5">
                <Folder
                  size={16}
                  strokeWidth={1.6}
                  aria-hidden="true"
                  className="text-accent"
                />
                <h2
                  id={`links-folder-${encodeURIComponent(JSON.stringify(section.path))}`}
                  className="section-heading"
                >
                  {section.path.length ? section.path.join(' / ') : 'Important'}
                </h2>
                <span className="text-xs tabular-nums text-faint">
                  {section.bookmarks.length}
                </span>
              </div>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {section.bookmarks.map((bookmark, bookmarkIndex) => (
                  <WebsiteCard
                    key={bookmark.id}
                    bookmark={bookmark}
                    priority={isActive && sectionIndex === 0 && bookmarkIndex < 3}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Globe}
          title={
            bookmarks.length
              ? 'No matching websites'
              : 'Your collection starts here'
          }
          description={
            bookmarks.length
              ? 'Try another name or look through all your links.'
              : 'Add a website or import your Important bookmarks folder.'
          }
          action={
            bookmarks.length ? (
              <button
                type="button"
                className="button-secondary"
                onClick={() => {
                  setSearch('');
                  setSelectedFolder('all');
                }}
              >
                Show all links
              </button>
            ) : (
              <button
                type="button"
                className="button-primary"
                onClick={() => setEditor('import')}
              >
                <Download size={15} /> Import bookmarks
              </button>
            )
          }
        />
      )}

      <footer className="mt-10 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-5 text-[11px] leading-5 text-faint">
        <p>
          {bookmarks.length} websites · {folderPaths.length}{' '}
          {folderPaths.length === 1 ? 'folder' : 'folders'}
        </p>
        <p role="status">{error ? 'Unable to save to Firebase' : saving ? 'Saving to Firebase…' : 'Saved to Firebase'}</p>
      </footer>

      {editor && isActive && (
        <BookmarkEditor
          mode={editor}
          folders={folderPaths}
          onClose={() => setEditor(null)}
          onAdd={(bookmark) => update((current) => [...current, bookmark])}
          onImport={(incoming, replace) =>
            update((current) =>
              replace ? incoming : [...current, ...incoming],
            )
          }
        />
      )}
    </div>
  );
}
