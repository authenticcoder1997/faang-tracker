import { useEffect, useRef, useState } from 'react';
import { Download, X } from 'lucide-react';
import { normalizeBookmark, parseBookmarkImport } from '../lib/bookmarks';

export default function BookmarkEditor({
  mode,
  folders,
  onClose,
  onAdd,
  onImport,
}) {
  const dialog = useRef(null);
  const fileInput = useRef(null);
  const fileRead = useRef(0);
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [folder, setFolder] = useState('[]');
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(null);
  const [replace, setReplace] = useState(false);

  useEffect(() => {
    const element = dialog.current;
    element.showModal();
    element.querySelector('input, textarea')?.focus();
    return () => {
      fileRead.current += 1;
      element.close();
    };
  }, []);

  function inspect(input) {
    try {
      const links = parseBookmarkImport(input);
      setPreview(links);
      setError('');
    } catch (problem) {
      setPreview(null);
      setError(problem.message);
    }
  }

  function submit(event) {
    event.preventDefault();
    setError('');
    if (mode === 'add') {
      const withProtocol = /^[a-z][a-z\d+.-]*:/i.test(url.trim())
        ? url.trim()
        : `https://${url.trim()}`;
      const bookmark = normalizeBookmark({
        title,
        url: withProtocol,
        folderPath: JSON.parse(folder),
      });
      if (!bookmark)
        return setError(
          'Enter a valid website address, such as https://example.com.',
        );
      const result = onAdd(bookmark);
      if (result) setError(result);
    } else {
      if (!preview) return inspect(text);
      const result = onImport(preview, replace);
      if (result) setError(result);
    }
  }

  return (
    <dialog
      ref={dialog}
      aria-labelledby="bookmark-editor-title"
      onCancel={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      className="task-dialog m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-2xl border border-line p-0"
    >
      <div className="flex items-center justify-between border-b border-line px-6 py-5">
        <h2 id="bookmark-editor-title" className="text-lg font-semibold">
          {mode === 'add'
            ? 'Add an important website'
            : 'Import Important bookmarks'}
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="icon-button"
          aria-label="Close bookmark editor"
        >
          <X size={18} />
        </button>
      </div>
      <form onSubmit={submit} className="space-y-5 p-6">
        {mode === 'add' ? (
          <>
            <div>
              <label
                htmlFor="bookmark-title"
                className="mb-2 block text-xs font-medium text-muted"
              >
                Name <span className="font-normal">· optional</span>
              </label>
              <input
                id="bookmark-title"
                className="input-control"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                maxLength={160}
                placeholder="A website you come back to"
              />
            </div>
            <div>
              <label
                htmlFor="bookmark-folder"
                className="mb-2 block text-xs font-medium text-muted"
              >
                Folder
              </label>
              <select
                id="bookmark-folder"
                className="input-control"
                value={folder}
                onChange={(event) => setFolder(event.target.value)}
              >
                <option value="[]">Important</option>
                {folders.map((path) => (
                  <option
                    key={JSON.stringify(path)}
                    value={JSON.stringify(path)}
                  >
                    Important / {path.join(' / ')}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="bookmark-url"
                className="mb-2 block text-xs font-medium text-muted"
              >
                Website address
              </label>
              <input
                id="bookmark-url"
                className="input-control"
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                required
                inputMode="url"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                maxLength={4096}
                placeholder="https://example.com"
              />
            </div>
          </>
        ) : (
          <>
            <p className="text-xs leading-6 text-muted">
              Choose your browser’s exported bookmarks file to import the{' '}
              <strong className="font-semibold text-secondary">
                Important
              </strong>{' '}
              folder and its subfolders, or paste website links below.
            </p>
            <input
              ref={fileInput}
              type="file"
              accept=".html,.htm,text/html"
              className="sr-only"
              aria-label="Choose exported bookmarks file"
              onChange={async (event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                const request = ++fileRead.current;
                setPreview(null);
                setText('');
                setError('');
                if (file.size > 2_000_000)
                  return setError('Choose a bookmarks file smaller than 2 MB.');
                try {
                  const contents = await file.text();
                  if (request !== fileRead.current) return;
                  setText(contents);
                  inspect(contents);
                } catch {
                  if (request !== fileRead.current) return;
                  setError(
                    'This file could not be read. Try choosing it again.',
                  );
                }
              }}
            />
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              className="button-secondary"
            >
              <Download size={14} /> Choose bookmarks file
            </button>
            <div>
              <label
                htmlFor="bookmark-import"
                className="mb-2 block text-xs font-medium text-muted"
              >
                Paste website links
              </label>
              <textarea
                id="bookmark-import"
                className="input-control resize-y"
                rows={5}
                maxLength={500000}
                value={text}
                onChange={(event) => {
                  fileRead.current += 1;
                  setText(event.target.value);
                  setPreview(null);
                  setError('');
                }}
                placeholder={
                  'https://example.com\nStudy notes | https://example.com/notes'
                }
              />
            </div>
            {preview && (
              <div
                className="rounded-lg border border-line bg-accent-soft p-3"
                role="status"
              >
                <p className="text-sm font-semibold text-ink">
                  {preview.length}{' '}
                  {preview.length === 1 ? 'website' : 'websites'} ready to
                  import
                </p>
                <ul className="mt-2 max-h-32 space-y-1 overflow-y-auto text-xs leading-5 text-muted">
                  {preview.map((bookmark) => (
                    <li key={bookmark.id} className="truncate">
                      {bookmark.folderPath?.length
                        ? `${bookmark.folderPath.join(' / ')} / `
                        : ''}
                      {bookmark.title}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <label className="flex items-center gap-2 text-xs leading-5 text-muted">
              <input
                type="checkbox"
                checked={replace}
                onChange={(event) => setReplace(event.target.checked)}
                className="accent-accent"
              />{' '}
              Replace the links currently shown in Important
            </label>
          </>
        )}
        {error && (
          <p role="alert" className="text-xs leading-5 text-warning">
            {error}
          </p>
        )}
        <p className="text-[11px] leading-5 text-faint">
          Saved in this browser. Your browser’s bookmarks stay unchanged.
        </p>
        <div className="flex justify-end gap-2 border-t border-line pt-4">
          <button type="button" onClick={onClose} className="button-secondary">
            Cancel
          </button>
          <button
            type="submit"
            className="button-primary"
            disabled={mode === 'add' ? !url.trim() : !text.trim()}
          >
            {mode === 'add'
              ? 'Add website'
              : preview
                ? 'Import websites'
                : 'Preview import'}
          </button>
        </div>
      </form>
    </dialog>
  );
}
