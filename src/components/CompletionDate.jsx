const dateFormat = new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short', year: 'numeric' });

export default function CompletionDate({ date }) {
  return (
    <p className="mt-0.5 text-xs text-muted">
      {date ? <>Last completed on <time dateTime={date}>{dateFormat.format(new Date(date + 'T12:00:00'))}</time></>
        : 'Completion date not recorded'}
    </p>
  );
}
