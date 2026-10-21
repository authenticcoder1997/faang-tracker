const STOP_TIMEOUT_MS = 2000;

const ERROR_MESSAGES = {
  'not-allowed':
    'Microphone access was denied. Allow microphone access in your browser, then try again.',
  'service-not-allowed':
    'Your browser blocked speech recognition. Check microphone and speech permissions, then try again.',
  'no-speech': 'No speech was detected. Try again when you’re ready to speak.',
  'audio-capture':
    'No microphone is available. Connect or enable a microphone, then try again.',
  network:
    'Voice input lost its connection. Check your internet connection and try again.',
  'language-not-supported':
    'Speech recognition does not support this language. Try another browser or type your task.',
  aborted: 'Voice input was interrupted. You can try again or type your task.',
};

function speechError(error) {
  return (
    ERROR_MESSAGES[error] ||
    'Voice input stopped unexpectedly. You can try again or type your task.'
  );
}

// Browser recognition is created only after an explicit start call. This module
// knows nothing about saved tasks: every transcript remains an editable draft.
export function createTaskDictation({
  Recognition,
  language = 'en-US',
  onTranscript = () => {},
  onStatus = () => {},
  onError = () => {},
}) {
  let active = null;
  let disposed = false;

  const isCurrent = (session) => !disposed && active === session;

  function finish(session, { abort = false, notify = true } = {}) {
    if (active !== session) return;
    active = null;
    if (session.timer !== null) clearTimeout(session.timer);
    const recognition = session.recognition;
    if (recognition) {
      recognition.onstart = null;
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
      if (abort) {
        try {
          recognition.abort();
        } catch {
          // Cleanup must remain safe even if the browser already closed audio.
        }
      }
    }
    if (notify && !disposed) onStatus({ status: 'idle', field: null });
  }

  function stopSession(session) {
    if (!isCurrent(session) || session.stopping) return;
    session.stopping = true;
    onStatus({ status: 'stopping', field: session.field });
    // Some browsers omit onend after a failed stop. Detach late callbacks and
    // release audio after a bounded wait while retaining the visible transcript.
    session.timer = setTimeout(() => {
      if (!isCurrent(session)) return;
      finish(session, { abort: true });
      onError(
        'Voice input stopped responding. Review the captured text or try again.',
      );
    }, STOP_TIMEOUT_MS);
    try {
      session.recognition.stop();
    } catch {
      finish(session, { abort: true });
      onError('Voice input could not stop normally. Review the captured text.');
    }
  }

  function start({ field, baseValue = '', maxLength = Infinity }) {
    if (disposed || active) return false;
    if (typeof Recognition !== 'function') {
      onError(
        'Voice input is not supported in this browser. Try Chrome or Safari, or type your task.',
      );
      return false;
    }

    const session = {
      recognition: null,
      field,
      baseValue: String(baseValue),
      maxLength: Number.isFinite(maxLength)
        ? Math.max(0, Math.floor(maxLength))
        : Infinity,
      stopping: false,
      limitReported: false,
      timer: null,
    };
    active = session;
    onStatus({ status: 'starting', field });

    try {
      const recognition = new Recognition();
      session.recognition = recognition;
      recognition.lang = language;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.onstart = () => {
        if (isCurrent(session) && !session.stopping) {
          onStatus({ status: 'listening', field });
        }
      };
      recognition.onresult = (event) => {
        if (!isCurrent(session)) return;
        const segments = [];
        // The browser returns the full session. Using only resultIndex drops
        // earlier final segments when a later result changes.
        for (let index = 0; index < event.results.length; index += 1) {
          const transcript = event.results[index]?.[0]?.transcript?.trim();
          if (transcript) segments.push(transcript);
        }
        const spoken = segments.join(' ').replace(/\s+/g, ' ');
        const separator =
          session.baseValue && spoken && !/\s$/.test(session.baseValue)
            ? ' '
            : '';
        const combined = `${session.baseValue}${separator}${spoken}`;
        const truncated = combined.length > session.maxLength;
        onTranscript({
          field,
          value: combined.slice(0, session.maxLength),
          truncated,
        });
        if (truncated && !session.limitReported) {
          session.limitReported = true;
          onError(
            `The ${field} reached its ${session.maxLength}-character limit. Review the captured text before saving.`,
          );
          stopSession(session);
        }
      };
      recognition.onerror = (event) => {
        if (!isCurrent(session)) return;
        const intentionalAbort = session.stopping && event.error === 'aborted';
        finish(session, { abort: true });
        if (!intentionalAbort) onError(speechError(event.error));
      };
      recognition.onend = () => {
        if (isCurrent(session)) finish(session);
      };
      recognition.start();
      return true;
    } catch (error) {
      finish(session, { abort: true });
      onError(
        error?.name === 'NotAllowedError'
          ? speechError('not-allowed')
          : 'Voice input could not start. Check your microphone and try again.',
      );
      return false;
    }
  }

  return {
    start,
    stop() {
      if (active) stopSession(active);
    },
    cancel() {
      if (active) finish(active, { abort: true });
    },
    dispose() {
      disposed = true;
      if (active) finish(active, { abort: true, notify: false });
    },
  };
}
