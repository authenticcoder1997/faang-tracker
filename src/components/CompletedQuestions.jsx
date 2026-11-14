import { CheckCircle2 } from 'lucide-react';

const dateFormat = new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short', year: 'numeric' });

export default function CompletedQuestions({ date, today, questions = [], renderRevision }) {
  return (
    <section aria-labelledby="completed-questions-title" className="panel min-w-0 px-4 py-4 sm:px-6">
      <h3 id="completed-questions-title" className="section-heading flex flex-wrap items-center gap-x-2 gap-y-1">
        <CheckCircle2 size={17} className="shrink-0 text-accent" aria-hidden="true" />
        {date === today ? 'Questions completed today' : 'Questions completed on ' + dateFormat.format(new Date(date + 'T12:00:00'))}
        <span className="text-xs tabular-nums text-muted">({questions.length})</span>
      </h3>
      {questions.length ? (
        <ul className="mt-2 divide-y divide-line">
          {questions.map((item) => (
            <li key={item.track + ':' + item.id} className="flex items-center justify-between gap-2 py-2.5 text-sm">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <span className="status-pill shrink-0">{item.track.toUpperCase()}</span>
                {item.url ? <a href={item.url} target="_blank" rel="noopener noreferrer"
                  className="min-w-0 break-words hover:text-accent hover:underline">{item.title}</a> : <span>{item.title}</span>}
                {item.onlyHomeworkDate && <span className="text-xs text-muted">Homework date</span>}
              </div>
              {renderRevision(item.track, item)}
            </li>
          ))}
        </ul>
      ) : <p className="mt-2 text-sm text-muted">No question completions recorded for this day.</p>}
    </section>
  );
}
