import { Cloud, LoaderCircle, PanelsTopLeft, RefreshCw } from 'lucide-react';
import { useWorkspace } from '../hooks/useWorkspace';

export default function WorkspaceGate({ children }) {
  const { ready, error, retry } = useWorkspace();
  if (ready) return children;

  return (
    <main className="flex min-h-dvh items-center justify-center p-5">
      <section
        className="panel w-full max-w-md p-7 sm:p-10"
        aria-busy={!error}
      >
        <span className="brand-mark mb-7">
          <PanelsTopLeft size={20} />
        </span>
        <p className="eyebrow">My Space</p>
        <h1 className="text-3xl font-semibold tracking-tight">
          Your space. Everywhere.
        </h1>
        <p className="mt-4 text-sm leading-7 text-muted">
          Your tasks, notes, study progress, and important links together on
          your Mac and phone.
        </p>
        {error ? (
          <>
            <p
              role="alert"
              className="mt-5 break-words rounded-xl border border-danger/25 bg-danger/5 p-3 text-sm leading-6 text-danger"
            >
              {error}
            </p>
            <button
              type="button"
              className="button-primary mt-6 w-full"
              onClick={retry}
            >
              <RefreshCw size={15} /> Retry connection
            </button>
          </>
        ) : (
          <p
            role="status"
            className="mt-7 flex items-center gap-2 text-sm text-muted"
          >
            <LoaderCircle size={17} className="shrink-0 animate-spin" />
            Connecting to your Firebase workspace…
          </p>
        )}
        <p className="mt-7 flex items-start gap-2 text-xs leading-6 text-faint">
          <Cloud size={15} className="mt-1 shrink-0" />
          One shared workspace, saved in Firebase and updated across your
          devices.
        </p>
      </section>
    </main>
  );
}
