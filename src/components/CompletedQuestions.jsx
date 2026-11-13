import { CheckCircle2 } from 'lucide-react';

const dateFormat = new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short', year: 'numeric' });

export default function CompletedQuestions({ date, today, questions = [] }) {
  return (
    <section aria-labelledby="completed-questions-title" className="px-4 py-4 sm:px-6">
      <h3 id="completed-questions-title" className="section-heading flex flex-wrap items-center gap-x-2 gap-y-1">
        <CheckCircle2 size={17} className="shrink-0 text-accent" aria-hidden="true" />
        {date === today ? 'Questions completed today' : 'Questions completed on ' + dateFormat.format(new Date(date + 'T12:00:00'))}
        <span className="text-xs tabular-nums text-muted">({questions.length})</span>
      </h3>
      {questions.length ? (
        <ul className="mt-2 divide-y divide-line">
          {questions.map(({ id, track, title, url, onlyHomeworkDate }) => (
            <li key={track + ':' + id} className="flex flex-wrap items-center gap-2 py-2.5 text-sm">
              <span className="status-pill shrink-0">{track.toUpperCase()}</span>
              {url ? <a href={url} target="_blank" rel="noopener noreferrer"
                className="min-w-0 break-words hover:text-accent hover:underline">{title}</a> : <span>{title}</span>}
              {onlyHomeworkDate && <span className="text-xs text-muted">Homework date</span>}
            </li>
          ))}
        </ul>
      ) : <p className="mt-2 text-sm text-muted">No question completions recorded for this day.</p>}
    </section>
  );
}
