import { useEffect, useId, useRef, useState } from 'react';
import { useWorkspace } from '../hooks/useWorkspace';
import { completeStudyQuestion } from '../lib/studyProgress';
import { DEFAULT_REVISION_DELAY_DAYS } from '../lib/studyRevisions';
import { addDays, dateKey } from '../lib/tasks';

const dateLabel = new Intl.DateTimeFormat('en', { weekday: 'long', month: 'short', day: 'numeric' });

export default function QuestionCompletionDialog({ track, item, source, homeworkDate, onClose }) {
  const { updateData } = useWorkspace();
  const dialog = useRef(null);
  const daysInput = useRef(null);
  const questionHeading = useRef(null);
  const titleId = useId();
  const questionId = useId();
  const [completedOn] = useState(dateKey);
  const [tookHelp, setTookHelp] = useState(false);
  const [days, setDays] = useState(String(DEFAULT_REVISION_DELAY_DAYS));
  const [saveError, setSaveError] = useState(false);
  const count = Number(days);
  const reviewOn = Number.isInteger(count) && count >= 1 && count <= 365 ? addDays(completedOn, count) : null;

  useEffect(() => {
    const element = dialog.current;
    element.showModal();
    return () => element.close();
  }, []);
  useEffect(() => {
    (tookHelp ? daysInput : questionHeading).current?.focus();
  }, [tookHelp]);

  function finish(reviewDate) {
    const saved = updateData((current) => completeStudyQuestion(current, track, item, completedOn, {
      homeworkDate, source, reviewOn: reviewDate,
    }));
    if (saved) onClose();
    else setSaveError(true);
  }

  return (
    <dialog ref={dialog} aria-labelledby={titleId} aria-describedby={questionId} onCancel={onClose}
      className="task-dialog m-auto w-[calc(100%-2rem)] max-w-sm rounded-2xl border border-line p-5">
      <h2 id={titleId} ref={questionHeading} tabIndex={-1} className="text-lg font-semibold outline-none">
        {tookHelp ? 'When do you want to revise?' : 'Did you take help?'}
      </h2>
      <p id={questionId} className="mt-1 break-words text-sm text-muted">{item.title}</p>
      {tookHelp ? (
        <form className="mt-4 space-y-3" onSubmit={(event) => {
          event.preventDefault();
          if (reviewOn) finish(reviewOn);
        }}>
          <label className="block text-sm text-muted">
            Number of days
            <input ref={daysInput} type="number" min="1" max="365" step="1" inputMode="numeric" required
              className="input-control mt-1 !text-base" value={days} onChange={(event) => setDays(event.target.value)} />
          </label>
          <p className="min-h-5 text-sm text-muted" aria-live="polite">
            {reviewOn && <>Revision due <time dateTime={reviewOn}>{dateLabel.format(new Date(`${reviewOn}T12:00:00`))}</time></>}
          </p>
          {saveError && <p role="alert" className="text-sm text-danger">Couldn’t save. Try again.</p>}
          <div className="flex justify-between gap-2 border-t border-line pt-3">
            <button type="button" className="button-secondary" onClick={() => { setTookHelp(false); setSaveError(false); }}>Back</button>
            <button type="submit" className="button-primary" disabled={!reviewOn}>Complete &amp; schedule</button>
          </div>
        </form>
      ) : (
        <>
          {saveError && <p role="alert" className="mt-3 text-sm text-danger">Couldn’t save. Try again.</p>}
          <div className="mt-4 flex flex-wrap justify-between gap-2 border-t border-line pt-3">
            <button type="button" className="button-secondary" onClick={onClose}>Cancel</button>
            <div className="flex gap-2">
              <button type="button" className="button-secondary" onClick={() => finish()}>No</button>
              <button type="button" className="button-primary"
                onClick={() => { setTookHelp(true); setSaveError(false); }}>Yes</button>
            </div>
          </div>
        </>
      )}
    </dialog>
  );
}
