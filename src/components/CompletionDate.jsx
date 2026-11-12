const dateFormat = new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short', year: 'numeric' });

export default function CompletionDate({ date }) {
  return date ? <time dateTime={date}>{dateFormat.format(new Date(`${date}T12:00:00`))}</time> : null;
}
