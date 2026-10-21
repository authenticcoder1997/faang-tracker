import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  CalendarDays,
  CalendarClock,
  Check,
  CheckCheck,
  ChevronDown,
  CircleCheck,
  ClipboardList,
  Flag,
  ListTodo,
  Pencil,
  Plus,
  Repeat2,
  Search,
  Trash2,
  Undo2,
  X,
} from 'lucide-react';
import { useTasks } from '../hooks/useTasks';
import {
  completeTask,
  dateKey,
  getTaskRows,
  LIST_COLORS,
  REPEAT_OPTIONS,
} from '../lib/tasks';

const SMART_VIEWS = [
  { id: 'today', name: 'Today', icon: CalendarDays, color: '#60a5fa' },
  { id: 'scheduled', name: 'Scheduled', icon: CalendarClock, color: '#fb923c' },
  { id: 'all', name: 'All', icon: ClipboardList, color: '#a1a1aa' },
  { id: 'completed', name: 'Completed', icon: CheckCheck, color: '#4ade80' },
];
const fieldClass =
  'w-full rounded-xl border border-white/10 bg-[#161719] px-3.5 py-3 text-sm text-gray-100 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/15';

function prettyDate(key, today) {
  if (!key) return '';
  if (key === today) return 'Today';
  const [year, month, day] = key.split('-').map(Number);
  return new Intl.DateTimeFormat('en', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    ...(key.slice(0, 4) !== today.slice(0, 4) ? { year: 'numeric' } : {}),
  }).format(new Date(year, month - 1, day, 12));
}

function Modal({ title, children, onClose }) {
  const dialog = useRef(null);
  useEffect(() => {
    dialog.current.showModal();
    const element = dialog.current;
    element.querySelector('input, textarea')?.focus();
    return () => element.close();
  }, []);
  return (
    <dialog
      ref={dialog}
      aria-labelledby="task-dialog-title"
      onCancel={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      className="task-dialog m-auto w-[calc(100%-2rem)] max-w-lg max-h-[90dvh] overflow-y-auto rounded-2xl border border-white/10 bg-[#1c1d20] p-0 text-white shadow-2xl"
    >
      <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
        <h2 id="task-dialog-title" className="text-lg font-semibold">
          {title}
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close dialog"
          className="rounded-lg p-1.5 text-gray-400 hover:bg-white/5 hover:text-white"
        >
          <X size={19} />
        </button>
      </div>
      {children}
    </dialog>
  );
}

function TaskForm({
  task,
  lists,
  defaultListId,
  defaultDate,
  today,
  onSave,
  onDelete,
  onClose,
}) {
  const [draft, setDraft] = useState({
    title: task?.title || '',
    notes: task?.notes || '',
    listId: task?.listId || defaultListId || lists[0].id,
    dueDate: task ? task.dueDate || '' : defaultDate || '',
    repeat: task?.repeat || 'none',
    flagged: task?.flagged || false,
  });
  function field(key, value) {
    setDraft((previous) => ({ ...previous, [key]: value }));
  }
  function submit(event) {
    event.preventDefault();
    if (!draft.title.trim()) return;
    onSave({
      ...draft,
      title: draft.title.trim(),
      notes: draft.notes.trim(),
      dueDate: draft.dueDate || (draft.repeat !== 'none' ? today : null),
    });
  }
  return (
    <Modal title={task ? 'Task details' : 'New task'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-5 p-6">
        <div>
          <label
            htmlFor="task-title"
            className="mb-2 block text-xs font-medium text-gray-400"
          >
            Title
          </label>
          <input
            autoFocus
            id="task-title"
            value={draft.title}
            onChange={(event) => field('title', event.target.value)}
            placeholder="What would you like to do?"
            required
            maxLength={200}
            className={fieldClass}
          />
        </div>
        <div>
          <label
            htmlFor="task-notes"
            className="mb-2 block text-xs font-medium text-gray-400"
          >
            Notes <span className="font-normal text-gray-600">· optional</span>
          </label>
          <textarea
            id="task-notes"
            value={draft.notes}
            onChange={(event) => field('notes', event.target.value)}
            placeholder="Add a little more detail…"
            rows={2}
            maxLength={2000}
            className={`${fieldClass} resize-y`}
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="task-list"
              className="mb-2 block text-xs font-medium text-gray-400"
            >
              List
            </label>
            <select
              id="task-list"
              value={draft.listId}
              onChange={(event) => field('listId', event.target.value)}
              className={fieldClass}
            >
              {lists.map((list) => (
                <option key={list.id} value={list.id}>
                  {list.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="task-date"
              className="mb-2 block text-xs font-medium text-gray-400"
            >
              {draft.repeat === 'none' ? 'Due date' : 'Starts on'}{' '}
              <span className="font-normal text-gray-600">
                {draft.repeat === 'none' ? '· optional' : ''}
              </span>
            </label>
            <input
              id="task-date"
              type="date"
              value={draft.dueDate}
              onChange={(event) => field('dueDate', event.target.value)}
              className={`${fieldClass} [color-scheme:dark]`}
            />
          </div>
        </div>
        <div>
          <label
            htmlFor="task-repeat"
            className="mb-2 block text-xs font-medium text-gray-400"
          >
            Repeat
          </label>
          <select
            id="task-repeat"
            value={draft.repeat}
            onChange={(event) =>
              setDraft((previous) => ({
                ...previous,
                repeat: event.target.value,
                dueDate:
                  previous.dueDate ||
                  (event.target.value !== 'none' ? today : ''),
              }))
            }
            className={fieldClass}
          >
            {REPEAT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
                {option.detail ? ` (${option.detail})` : ''}
              </option>
            ))}
          </select>
          {draft.repeat !== 'none' && (
            <p className="mt-2 text-xs leading-relaxed text-gray-500">
              Complete each occurrence to move to the next{' '}
              {draft.repeat === 'weekdays'
                ? 'weekday'
                : draft.repeat === 'weekends'
                  ? 'weekend day'
                  : 'day'}
              .
            </p>
          )}
        </div>
        <label className="flex cursor-pointer items-center gap-3 text-sm text-gray-300">
          <input
            type="checkbox"
            checked={draft.flagged}
            onChange={(event) => field('flagged', event.target.checked)}
            className="h-4 w-4 accent-blue-400"
          />
          <Flag size={15} className="text-orange-400" /> Flag as important
        </label>
        <div className="flex items-center justify-between gap-3 border-t border-white/10 pt-5">
          {task ? (
            <button
              type="button"
              onClick={onDelete}
              className="flex items-center gap-2 rounded-lg py-2 text-sm text-red-400 hover:text-red-300"
            >
              <Trash2 size={15} /> Delete task
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2.5 text-sm text-gray-400 hover:bg-white/5"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!draft.title.trim()}
              className="rounded-lg bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-400 disabled:opacity-40"
            >
              {task ? 'Save changes' : 'Add task'}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}

function ListForm({ list, lists, onSave, onClose }) {
  const [name, setName] = useState(list?.name || '');
  const [color, setColor] = useState(list?.color || LIST_COLORS[0]);
  const duplicate = lists.some(
    (other) =>
      other.id !== list?.id &&
      other.name.toLowerCase() === name.trim().toLowerCase(),
  );
  return (
    <Modal title={list ? 'Edit list' : 'New list'} onClose={onClose}>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (name.trim() && !duplicate) onSave({ name: name.trim(), color });
        }}
        className="space-y-6 p-6"
      >
        <div>
          <label
            htmlFor="list-name"
            className="mb-2 block text-xs font-medium text-gray-400"
          >
            List name
          </label>
          <input
            id="list-name"
            autoFocus
            required
            maxLength={50}
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g. Health, Errands, Reading"
            className={fieldClass}
          />
          {duplicate && (
            <p role="alert" className="mt-2 text-xs text-orange-300">
              A list with that name already exists.
            </p>
          )}
        </div>
        <fieldset>
          <legend className="mb-3 text-xs font-medium text-gray-400">
            Color
          </legend>
          <div className="flex gap-3">
            {LIST_COLORS.map((value, index) => (
              <button
                key={value}
                type="button"
                aria-label={
                  ['Blue', 'Orange', 'Purple', 'Green', 'Pink', 'Yellow'][index]
                }
                aria-pressed={color === value}
                onClick={() => setColor(value)}
                style={{ backgroundColor: value }}
                className={`flex h-9 w-9 items-center justify-center rounded-full text-black ${color === value ? 'ring-2 ring-white ring-offset-4 ring-offset-[#1c1d20]' : ''}`}
              >
                {color === value && <Check size={17} />}
              </button>
            ))}
          </div>
        </fieldset>
        <div className="flex justify-end gap-2 border-t border-white/10 pt-5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2.5 text-sm text-gray-400 hover:bg-white/5"
          >
            Cancel
          </button>
          <button
            disabled={!name.trim() || duplicate}
            type="submit"
            className="rounded-lg bg-blue-500 px-5 py-2.5 text-sm font-semibold hover:bg-blue-400 disabled:opacity-40"
          >
            {list ? 'Save list' : 'Create list'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default function TaskHome({ onOpenHomework }) {
  const { data, updateData, error } = useTasks();
  const [view, setView] = useState('today');
  const [query, setQuery] = useState('');
  const [taskEditor, setTaskEditor] = useState(null);
  const [listEditor, setListEditor] = useState(null);
  const [showCompleted, setShowCompleted] = useState(false);
  const [notice, setNotice] = useState(null);
  const [today, setToday] = useState(dateKey);
  useEffect(() => {
    const updateDate = () => setToday(dateKey());
    const timer = window.setInterval(updateDate, 30000);
    window.addEventListener('focus', updateDate);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('focus', updateDate);
    };
  }, []);
  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 6000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const { active, completed, deleted } = getTaskRows(data.tasks, today);
  const selectedList = view.startsWith('list:')
    ? data.lists.find((list) => list.id === view.slice(5))
    : null;
  const selectedSmart = SMART_VIEWS.find((item) => item.id === view);
  const title =
    selectedList?.name ||
    selectedSmart?.name ||
    (view === 'flagged' ? 'Flagged' : 'Recently deleted');
  const accent =
    selectedList?.color ||
    selectedSmart?.color ||
    (view === 'flagged' ? '#fb923c' : '#a1a1aa');
  const counts = {
    today: active.filter((row) => row.date && row.date <= today).length,
    scheduled: active.filter((row) => row.date).length,
    all: active.length,
    completed: completed.length,
  };
  const matches = (row) =>
    `${row.task.title} ${row.task.notes || ''} ${data.lists.find((list) => list.id === row.task.listId)?.name || ''}`
      .toLowerCase()
      .includes(query.toLowerCase());
  const inView = (row) =>
    selectedList
      ? row.task.listId === selectedList.id
      : view === 'today'
        ? !!row.date && row.date <= today
        : view === 'scheduled'
          ? !!row.date
          : view === 'flagged'
            ? row.task.flagged
            : true;
  const rows = (
    view === 'completed' ? completed : view === 'deleted' ? deleted : active
  )
    .filter(inView)
    .filter(matches);
  const doneRows = completed
    .filter((row) =>
      selectedList
        ? row.task.listId === selectedList.id
        : view === 'today'
          ? row.task.repeat === 'none'
            ? row.task.completedAt &&
              dateKey(new Date(row.task.completedAt)) === today
            : row.date === today
          : inView(row),
    )
    .filter(matches);
  const canAdd = !['completed', 'deleted'].includes(view);
  const groups =
    view === 'scheduled'
      ? Object.entries(
          rows.reduce((result, row) => {
            const key = row.date < today ? 'overdue' : row.date;
            (result[key] ||= []).push(row);
            return result;
          }, {}),
        )
      : [['tasks', rows]];

  function saveTask(draft) {
    const previous = taskEditor?.task;
    const now = new Date().toISOString();
    const task = {
      ...previous,
      ...draft,
      id: previous?.id || crypto.randomUUID(),
      completed: previous?.repeat === draft.repeat ? previous.completed : false,
      completedDates:
        previous?.repeat === draft.repeat ? previous.completedDates : [],
      createdAt: previous?.createdAt || now,
      updatedAt: now,
      deletedAt: null,
    };
    if (
      updateData((current) => ({
        ...current,
        tasks: previous
          ? current.tasks.map((item) => (item.id === task.id ? task : item))
          : [...current.tasks, task],
      }))
    ) {
      setTaskEditor(null);
      setNotice({ message: previous ? 'Task updated' : 'Task added' });
    }
  }
  function saveList(draft) {
    const previous = listEditor.list;
    const id = previous?.id || crypto.randomUUID();
    if (
      updateData((current) => ({
        ...current,
        lists: previous
          ? current.lists.map((list) =>
              list.id === id ? { ...list, ...draft } : list,
            )
          : [...current.lists, { ...draft, id }],
      }))
    ) {
      if (!previous) setView(`list:${id}`);
      setListEditor(null);
    }
  }
  function toggle(row) {
    if (
      updateData((current) => ({
        ...current,
        tasks: current.tasks.map((task) =>
          task.id === row.task.id ? completeTask(task, row.date) : task,
        ),
      }))
    ) {
      setNotice({
        message:
          view === 'completed' ||
          (row.task.repeat === 'none' && row.task.completed)
            ? 'Task reopened'
            : row.task.repeat === 'none'
              ? 'Task completed'
              : 'Completed. The next occurrence is scheduled.',
        undo: () =>
          updateData((current) => ({
            ...current,
            tasks: current.tasks.map((task) =>
              task.id === row.task.id ? completeTask(task, row.date) : task,
            ),
          })),
      });
    }
  }
  function deleteTask(task) {
    if (
      updateData((current) => ({
        ...current,
        tasks: current.tasks.map((item) =>
          item.id === task.id
            ? { ...item, deletedAt: new Date().toISOString() }
            : item,
        ),
      }))
    ) {
      setTaskEditor(null);
      setNotice({
        message: 'Task moved to Recently deleted',
        undo: () => restoreTask(task.id),
      });
    }
  }
  function restoreTask(id) {
    updateData((current) => ({
      ...current,
      tasks: current.tasks.map((task) =>
        task.id === id ? { ...task, deletedAt: null } : task,
      ),
    }));
  }
  function openNewTask() {
    setTaskEditor({ task: null });
  }
  function renderRow(row, isCompleted = false, isDeleted = false) {
    const list = data.lists.find((item) => item.id === row.task.listId);
    const repeat = REPEAT_OPTIONS.find(
      (option) => option.value === row.task.repeat,
    );
    return (
      <li
        key={row.key}
        className="group flex items-start gap-3.5 border-b border-white/[0.055] px-1 py-4 last:border-0 sm:gap-4"
      >
        {!isDeleted && (
          <input
            type="checkbox"
            checked={isCompleted}
            onChange={() => toggle(row)}
            aria-label={`${isCompleted ? 'Reopen' : 'Complete'} ${row.task.title}${isCompleted && row.task.repeat !== 'none' ? ` on ${row.date}` : ''}`}
            className="task-check mt-1 h-[21px] w-[21px] shrink-0 cursor-pointer appearance-none rounded-full border border-gray-600 transition hover:border-blue-400 checked:border-blue-400 checked:bg-blue-400 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-400"
          />
        )}
        <div className="min-w-0 flex-1">
          <button
            onClick={() => setTaskEditor({ task: row.task })}
            disabled={isDeleted}
            aria-label={`Edit ${row.task.title}`}
            className={`block max-w-full break-words text-left text-[15px] font-medium leading-6 ${isCompleted ? 'text-gray-500 line-through' : 'text-gray-200 hover:text-white'}`}
          >
            {row.task.title}
          </button>
          {row.task.notes && (
            <p className="mt-0.5 line-clamp-2 whitespace-pre-wrap break-words text-xs leading-5 text-gray-500">
              {row.task.notes}
            </p>
          )}
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-gray-500">
            {!selectedList && (
              <span className="flex items-center gap-1.5">
                <span
                  style={{ backgroundColor: list?.color }}
                  className="h-1.5 w-1.5 rounded-full"
                />
                {list?.name}
              </span>
            )}
            {row.date && (
              <span
                className={`flex items-center gap-1 ${!isCompleted && row.date < today ? 'text-red-400' : !isCompleted && row.date === today ? 'text-blue-400' : ''}`}
              >
                <CalendarDays size={11} />
                {prettyDate(row.date, today)}
              </span>
            )}
            {row.task.repeat !== 'none' && (
              <span className="flex items-center gap-1">
                <Repeat2 size={11} />
                {repeat?.label}
              </span>
            )}
          </div>
        </div>
        {isDeleted ? (
          <button
            onClick={() => restoreTask(row.task.id)}
            aria-label={`Restore ${row.task.title}`}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs text-blue-400 hover:bg-blue-400/10"
          >
            <Undo2 size={14} />
            Restore
          </button>
        ) : (
          <button
            aria-label={`${row.task.flagged ? 'Unflag' : 'Flag'} ${row.task.title}`}
            aria-pressed={!!row.task.flagged}
            onClick={() =>
              updateData((current) => ({
                ...current,
                tasks: current.tasks.map((task) =>
                  task.id === row.task.id
                    ? { ...task, flagged: !task.flagged }
                    : task,
                ),
              }))
            }
            className={`rounded-lg p-2 transition ${row.task.flagged ? 'text-orange-400' : 'text-gray-600 hover:text-orange-400 sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100'}`}
          >
            <Flag size={16} fill={row.task.flagged ? 'currentColor' : 'none'} />
          </button>
        )}
      </li>
    );
  }

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-7 sm:px-6 sm:py-9 lg:px-10 lg:py-11">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="mb-2 text-xs font-medium tracking-wide text-gray-500">
            {new Intl.DateTimeFormat('en', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            }).format(new Date(`${today}T12:00:00`))}
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Home
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            A little structure. A clearer day.
          </p>
        </div>
        <button
          onClick={openNewTask}
          className="flex items-center gap-2 rounded-xl bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/10 transition hover:bg-blue-400"
        >
          <Plus size={17} /> New task
        </button>
      </header>
      {error && (
        <p
          role="alert"
          className="mb-5 rounded-xl border border-red-400/20 bg-red-400/5 p-4 text-sm text-red-300"
        >
          {error}
        </p>
      )}
      <div className="grid grid-cols-1 gap-7 lg:min-h-[calc(100dvh-275px)] lg:grid-cols-[216px_minmax(0,1fr)] lg:gap-9">
        <aside
          aria-label="Task lists"
          className="min-w-0 border-b border-white/[0.06] pb-5 lg:border-r lg:border-b-0 lg:pr-7 lg:pb-0"
        >
          <div className="flex gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:flex-col">
            {SMART_VIEWS.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setView(item.id);
                    setQuery('');
                  }}
                  aria-pressed={view === item.id}
                  aria-label={`${item.name} tasks`}
                  className={`flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-xs transition-colors lg:w-full lg:text-sm ${view === item.id ? 'bg-white/[0.055] text-gray-100' : 'text-gray-500 hover:bg-white/[0.025] hover:text-gray-300'}`}
                >
                  <Icon
                    size={17}
                    style={{ color: item.color }}
                    className="shrink-0"
                  />
                  <span>{item.name}</span>
                  <span className="ml-auto pl-2 text-xs tabular-nums text-gray-500">
                    {counts[item.id]}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="mt-4 flex items-center justify-between px-2 lg:mt-7">
            <h2 className="text-[10px] font-semibold uppercase tracking-[0.13em] text-gray-500">
              My lists
            </h2>
            <button
              onClick={() => setListEditor({ list: null })}
              aria-label="Create a new list"
              className="rounded-md p-1 text-gray-500 hover:bg-white/5 hover:text-gray-200"
            >
              <Plus size={15} />
            </button>
          </div>
          <div className="mt-2 flex gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:flex-col">
            {data.lists.map((list) => (
              <button
                key={list.id}
                aria-label={`${list.name} list`}
                aria-pressed={selectedList?.id === list.id}
                onClick={() => {
                  setView(`list:${list.id}`);
                  setQuery('');
                }}
                className={`flex w-auto shrink-0 items-center gap-2 rounded-lg px-2.5 py-2 text-sm transition lg:w-full lg:gap-3 lg:py-3 ${selectedList?.id === list.id ? 'bg-white/[0.07] text-white' : 'text-gray-400 hover:bg-white/[0.035] hover:text-gray-200'}`}
              >
                <span
                  className="flex h-6 w-6 shrink-0 items-center justify-center"
                  style={{
                    color: list.color,
                  }}
                >
                  <ListTodo size={16} />
                </span>
                <span className="truncate">{list.name}</span>
                <span className="ml-auto text-xs tabular-nums text-gray-500">
                  {active.filter((row) => row.task.listId === list.id).length}
                </span>
              </button>
            ))}
          </div>
          <div className="mt-3 flex gap-1 border-t border-white/[0.06] pt-2 lg:mt-5 lg:block lg:space-y-1 lg:pt-4">
            <button
              onClick={() => {
                setView('flagged');
                setQuery('');
              }}
              aria-pressed={view === 'flagged'}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-xs ${view === 'flagged' ? 'bg-white/[0.07] text-white' : 'text-gray-500 hover:text-gray-200'}`}
            >
              <Flag size={15} className="text-orange-400" />
              Flagged
              <span className="ml-auto">
                {active.filter((row) => row.task.flagged).length}
              </span>
            </button>
            <button
              onClick={() => {
                setView('deleted');
                setQuery('');
              }}
              aria-pressed={view === 'deleted'}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-xs ${view === 'deleted' ? 'bg-white/[0.07] text-white' : 'text-gray-500 hover:text-gray-200'}`}
            >
              <Trash2 size={15} />
              Recently deleted
              {deleted.length > 0 && (
                <span className="ml-auto">{deleted.length}</span>
              )}
            </button>
          </div>
          <button
            onClick={() => setListEditor({ list: null })}
            className="mt-6 hidden items-center gap-2 px-2 py-2 text-xs font-medium text-blue-400 lg:flex hover:text-blue-300"
          >
            <Plus size={15} /> Add list
          </button>
        </aside>
        <section aria-label={title} className="flex min-w-0 flex-col">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.065] pb-5">
            <div className="flex items-center gap-3">
              <h2
                className="text-2xl font-bold tracking-tight sm:text-3xl"
                style={{ color: accent }}
              >
                {title}
              </h2>
              <span className="rounded-lg bg-white/5 px-2.5 py-1 text-xs tabular-nums text-gray-500">
                {rows.length}
              </span>
              {selectedList && (
                <button
                  onClick={() => setListEditor({ list: selectedList })}
                  aria-label={`Edit ${selectedList.name} list`}
                  className="rounded-lg p-1.5 text-gray-500 hover:text-gray-200"
                >
                  <Pencil size={14} />
                </button>
              )}
            </div>
            <div className="relative w-full sm:w-48">
              <Search
                size={14}
                className="pointer-events-none absolute top-3 left-3 text-gray-600"
              />
              <input
                aria-label="Search tasks"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search this view"
                className="w-full rounded-lg border border-white/[0.07] bg-white/[0.025] py-2.5 pr-3 pl-9 text-xs text-gray-200 outline-none placeholder:text-gray-600 focus:border-blue-400/60"
              />
            </div>
          </div>
          {rows.length > 0 ? (
            <div className="mt-1">
              {groups.map(([group, entries]) => (
                <div key={group}>
                  {group !== 'tasks' && (
                    <h3
                      className={`mt-6 mb-1 text-xs font-semibold ${group === 'overdue' ? 'text-red-400' : 'text-gray-400'}`}
                    >
                      {group === 'overdue'
                        ? 'Overdue'
                        : prettyDate(group, today)}
                    </h3>
                  )}
                  <ul>
                    {entries.map((row) =>
                      renderRow(row, view === 'completed', view === 'deleted'),
                    )}
                  </ul>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex min-h-80 flex-1 flex-col items-center justify-center px-4 py-16 text-center">
              <div className="mb-6 flex h-20 w-20 items-center justify-center text-blue-400/70">
                <CircleCheck size={35} strokeWidth={1.25} />
              </div>
              <h3 className="text-lg font-semibold text-gray-200">
                {query
                  ? 'No matching tasks'
                  : view === 'today'
                    ? 'A fresh start for today'
                    : view === 'completed'
                      ? 'Small wins belong here'
                      : view === 'deleted'
                        ? 'Nothing in Recently deleted'
                        : 'A little room for what’s next'}
              </h3>
              <p className="mt-2 max-w-xs text-sm leading-6 text-gray-500">
                {query
                  ? 'Try another title, note, or list name.'
                  : view === 'today'
                    ? 'Add something you’d like to get done. Keep it simple, or make it a routine.'
                    : view === 'completed'
                      ? 'Completed tasks and recurring check-ins will appear here.'
                      : view === 'deleted'
                        ? 'Deleted tasks can be restored from here.'
                        : 'Add your first task and take it one step at a time.'}
              </p>
              {canAdd && !query && (
                <button
                  onClick={openNewTask}
                  className="mt-6 flex items-center gap-2 rounded-lg bg-blue-400/10 px-4 py-2.5 text-xs font-semibold text-blue-400 hover:bg-blue-400/15"
                >
                  <Plus size={15} />
                  Add a task
                </button>
              )}
            </div>
          )}
          {canAdd && rows.length > 0 && (
            <button
              onClick={openNewTask}
              className="mt-4 flex items-center gap-3 self-start rounded-lg px-1 py-2 text-sm text-blue-400 hover:text-blue-300"
            >
              <Plus size={20} />
              Add a task
            </button>
          )}
          {!['completed', 'deleted'].includes(view) && doneRows.length > 0 && (
            <div className="mt-7 border-t border-white/[0.065] pt-4">
              <button
                onClick={() => setShowCompleted(!showCompleted)}
                aria-expanded={showCompleted}
                className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-300"
              >
                <ChevronDown
                  size={14}
                  className={showCompleted ? '' : '-rotate-90'}
                />
                Completed · {doneRows.length}
              </button>
              {showCompleted && (
                <ul className="mt-2">
                  {doneRows.map((row) => renderRow(row, true))}
                </ul>
              )}
            </div>
          )}
          <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.06] pt-5 text-[11px] text-gray-600">
            <span className="mt-5 flex items-center gap-1.5">
              <span className="h-1 w-1 rounded-full bg-green-500/70" />
              Saved in this browser
            </span>
            <button
              onClick={onOpenHomework}
              className="mt-5 flex items-center gap-1.5 text-gray-500 hover:text-gray-200"
            >
              Your study plan is in Homework
              <ArrowRight size={12} />
            </button>
          </div>
        </section>
      </div>
      {taskEditor && (
        <TaskForm
          task={taskEditor.task}
          lists={data.lists}
          defaultListId={selectedList?.id}
          defaultDate={['today', 'scheduled'].includes(view) ? today : ''}
          today={today}
          onSave={saveTask}
          onDelete={() => deleteTask(taskEditor.task)}
          onClose={() => setTaskEditor(null)}
        />
      )}
      {listEditor && (
        <ListForm
          list={listEditor.list}
          lists={data.lists}
          onClose={() => setListEditor(null)}
          onSave={saveList}
        />
      )}
      {notice && (
        <div
          role="status"
          className="fixed right-5 bottom-5 left-5 z-40 mx-auto flex w-fit max-w-[calc(100%-2.5rem)] items-center gap-5 rounded-xl border border-white/10 bg-[#25272b] px-4 py-3 text-xs text-gray-200 shadow-2xl"
        >
          <span>{notice.message}</span>
          {notice.undo && (
            <button
              onClick={() => {
                notice.undo();
                setNotice(null);
              }}
              className="font-semibold text-blue-400"
            >
              Undo
            </button>
          )}
          <button
            onClick={() => setNotice(null)}
            aria-label="Dismiss notification"
            className="text-gray-500"
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
