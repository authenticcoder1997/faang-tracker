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
  Mic,
  Pencil,
  Plus,
  Repeat2,
  Search,
  Square,
  Trash2,
  Undo2,
  X,
} from 'lucide-react';
import { useTasks } from '../hooks/useTasks';
import { PageHeader } from './ui/Workspace';
import { createTaskDictation } from '../lib/taskDictation';
import {
  completeTask,
  dateKey,
  deleteTaskList,
  getTaskRows,
  LIST_COLORS,
  REPEAT_OPTIONS,
  restoreTaskList,
} from '../lib/tasks';

const SMART_VIEWS = [
  { id: 'today', name: 'Today', icon: CalendarDays },
  { id: 'scheduled', name: 'Scheduled', icon: CalendarClock },
  { id: 'all', name: 'All', icon: ClipboardList },
  { id: 'completed', name: 'Completed', icon: CheckCheck },
];
const fieldClass = 'input-control';

function themedAccent(color) {
  return `color-mix(in srgb, ${color}, var(--accent-mix) var(--accent-mix-strength))`;
}

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
      className="task-dialog m-auto w-[calc(100%-2rem)] max-w-lg max-h-[90dvh] overflow-y-auto rounded-2xl border border-line bg-elevated p-0 text-ink shadow-2xl"
    >
      <div className="flex items-center justify-between border-b border-line px-6 py-5">
        <h2 id="task-dialog-title" className="text-lg font-semibold">
          {title}
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close dialog"
          className="rounded-lg p-1.5 text-muted hover:bg-hover hover:text-ink"
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
  voiceMode = false,
}) {
  const [draft, setDraft] = useState({
    title: task?.title || '',
    notes: task?.notes || '',
    listId: task?.listId || defaultListId || lists[0]?.id || '',
    dueDate: task ? task.dueDate || '' : defaultDate || '',
    repeat: task?.repeat || 'none',
    flagged: task?.flagged || false,
  });
  const recognition = useRef(null);
  const [voice, setVoice] = useState({ status: 'idle', field: null });
  const [voiceError, setVoiceError] = useState('');
  const [voiceUsed, setVoiceUsed] = useState(voiceMode);
  const [supported] = useState(
    () => !!(window.SpeechRecognition || window.webkitSpeechRecognition),
  );
  const voiceActive = voice.status !== 'idle';

  useEffect(() => {
    const stopWhenHidden = () => {
      if (document.hidden) recognition.current?.cancel();
    };
    const stopOnExit = () => recognition.current?.cancel();
    document.addEventListener('visibilitychange', stopWhenHidden);
    window.addEventListener('pagehide', stopOnExit);
    return () => {
      document.removeEventListener('visibilitychange', stopWhenHidden);
      window.removeEventListener('pagehide', stopOnExit);
      recognition.current?.dispose();
      recognition.current = null;
    };
  }, []);

  function dictate(key) {
    setVoiceUsed(true);
    if (voiceActive) {
      recognition.current?.stop();
      return;
    }
    setVoiceError('');
    if (!recognition.current) {
      recognition.current = createTaskDictation({
        Recognition: window.SpeechRecognition || window.webkitSpeechRecognition,
        language: navigator.language || 'en-IN',
        onTranscript: ({ field: target, value }) =>
          setDraft((previous) => ({ ...previous, [target]: value })),
        onStatus: setVoice,
        onError: setVoiceError,
      });
    }
    recognition.current.start({
      field: key,
      baseValue: draft[key],
      maxLength: key === 'title' ? 200 : 2000,
    });
  }

  function voiceButton(key) {
    const active = voiceActive && voice.field === key;
    return (
      <button
        type="button"
        aria-label={active ? `Stop dictating ${key}` : `Dictate task ${key}`}
        aria-pressed={active}
        aria-describedby={voiceUsed ? 'task-voice-status' : undefined}
        disabled={
          !supported ||
          (voiceActive && (!active || voice.status === 'stopping'))
        }
        onClick={() => dictate(key)}
        className={`icon-button ${active ? 'bg-accent-soft' : ''}`}
        style={active ? { color: 'var(--accent)' } : undefined}
        title={active ? 'Stop dictation' : `Add ${key} by voice`}
      >
        {active ? <Square size={13} fill="currentColor" /> : <Mic size={15} />}
      </button>
    );
  }

  function field(key, value) {
    setDraft((previous) => ({ ...previous, [key]: value }));
  }
  function submit(event) {
    event.preventDefault();
    if (voiceActive || !draft.title.trim()) return;
    recognition.current?.cancel();
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
        {voiceUsed && (
          <div className="rounded-xl border border-line bg-accent-soft px-4 py-3.5">
            <div className="flex items-center gap-2 text-sm font-semibold text-ink">
              <Mic size={16} className="text-accent" />
              {voiceActive ? 'Voice input' : 'Add by voice'}
            </div>
            <p
              id="task-voice-status"
              role="status"
              aria-live="polite"
              className="mt-1.5 text-xs leading-5 text-muted"
            >
              {!supported
                ? 'Voice input is unavailable in this browser. You can still type your task, or use Chrome or Safari for dictation.'
                : voice.status === 'starting'
                  ? 'Connecting to your microphone… Allow microphone access if prompted.'
                  : voice.status === 'listening'
                    ? `Listening for your ${voice.field}… Tap the square to finish.`
                    : voice.status === 'stopping'
                      ? 'Finishing dictation…'
                      : 'Tap a microphone to speak your title or notes. Review the text and choose your schedule before saving.'}
            </p>
          </div>
        )}
        {voiceError && (
          <p
            role="alert"
            className="rounded-lg border border-warning/20 bg-warning/5 px-3 py-2.5 text-xs leading-5 text-warning"
          >
            {voiceError}
          </p>
        )}
        <div>
          <div className="mb-2 flex h-5 items-center justify-between">
            <label
              htmlFor="task-title"
              className="text-xs font-medium text-muted"
            >
              Title
            </label>
            {voiceButton('title')}
          </div>
          <input
            autoFocus
            id="task-title"
            value={draft.title}
            onChange={(event) => field('title', event.target.value)}
            placeholder="What would you like to do?"
            required
            maxLength={200}
            readOnly={voiceActive && voice.field === 'title'}
            aria-describedby={voiceUsed ? 'task-voice-status' : undefined}
            className={fieldClass}
          />
        </div>
        <div>
          <div className="mb-2 flex h-5 items-center justify-between">
            <label
              htmlFor="task-notes"
              className="text-xs font-medium text-muted"
            >
              Notes <span className="font-normal text-faint">· optional</span>
            </label>
            {voiceButton('notes')}
          </div>
          <textarea
            id="task-notes"
            value={draft.notes}
            onChange={(event) => field('notes', event.target.value)}
            placeholder="Add a little more detail…"
            rows={2}
            maxLength={2000}
            readOnly={voiceActive && voice.field === 'notes'}
            aria-describedby={voiceUsed ? 'task-voice-status' : undefined}
            className={`${fieldClass} resize-y`}
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="task-list"
              className="mb-2 block text-xs font-medium text-muted"
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
              className="mb-2 block text-xs font-medium text-muted"
            >
              {draft.repeat === 'none' ? 'Due date' : 'Starts on'}{' '}
              <span className="font-normal text-faint">
                {draft.repeat === 'none' ? '· optional' : ''}
              </span>
            </label>
            <input
              id="task-date"
              type="date"
              value={draft.dueDate}
              onChange={(event) => field('dueDate', event.target.value)}
              className={`${fieldClass} `}
            />
          </div>
        </div>
        <div>
          <label
            htmlFor="task-repeat"
            className="mb-2 block text-xs font-medium text-muted"
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
            <p className="mt-2 text-xs leading-relaxed text-muted">
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
        <label className="flex cursor-pointer items-center gap-3 text-sm text-secondary">
          <input
            type="checkbox"
            checked={draft.flagged}
            onChange={(event) => field('flagged', event.target.checked)}
            className="h-4 w-4 accent-accent"
          />
          <Flag size={15} className="text-warning" /> Flag as important
        </label>
        <div className="flex items-center justify-between gap-3 border-t border-line pt-5">
          {task ? (
            <button
              type="button"
              onClick={onDelete}
              className="flex items-center gap-2 rounded-lg py-2 text-sm text-danger hover:text-danger"
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
              className="rounded-lg px-4 py-2.5 text-sm text-muted hover:bg-hover"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={voiceActive || !draft.title.trim()}
              className="button-primary"
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
            className="mb-2 block text-xs font-medium text-muted"
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
            <p role="alert" className="mt-2 text-xs text-warning">
              A list with that name already exists.
            </p>
          )}
        </div>
        <fieldset>
          <legend className="mb-3 text-xs font-medium text-muted">Color</legend>
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
                className={`flex h-9 w-9 items-center justify-center rounded-full text-black ${color === value ? 'ring-2 ring-ink ring-offset-4 ring-offset-[var(--modal)]' : ''}`}
              >
                {color === value && <Check size={17} />}
              </button>
            ))}
          </div>
        </fieldset>
        <div className="flex justify-end gap-2 border-t border-line pt-5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2.5 text-sm text-muted hover:bg-hover"
          >
            Cancel
          </button>
          <button
            disabled={!name.trim() || duplicate}
            type="submit"
            className="button-primary"
          >
            {list ? 'Save list' : 'Create list'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function DeleteListDialog({
  list,
  lists,
  taskCount,
  error,
  onDelete,
  onClose,
}) {
  const remaining = lists.filter((item) => item.id !== list.id);
  const [destinationId, setDestinationId] = useState(remaining[0]?.id || '');
  const destination =
    remaining.find((item) => item.id === destinationId)?.id ||
    remaining[0]?.id ||
    '';
  return (
    <Modal title={`Delete ${list.name}?`} onClose={onClose}>
      <form
        className="space-y-5 p-6"
        onSubmit={(event) => {
          event.preventDefault();
          onDelete(destination);
        }}
      >
        <p className="text-sm leading-6 text-muted">
          {taskCount
            ? `${taskCount} ${taskCount === 1 ? 'task belongs' : 'tasks belong'} to this list. Your tasks, schedules, and completion history will be kept.`
            : 'This list is empty. You can undo the deletion after removing it.'}
        </p>
        {taskCount > 0 &&
          (remaining.length ? (
            <div>
              <label
                htmlFor="move-list-tasks"
                className="mb-2 block text-xs font-medium text-muted"
              >
                Move tasks to
              </label>
              <select
                id="move-list-tasks"
                className={fieldClass}
                value={destination}
                onChange={(event) => setDestinationId(event.target.value)}
              >
                {remaining.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <p className="text-sm leading-6 text-muted">
              Your tasks will move to a new Inbox list.
            </p>
          ))}
        {error && (
          <p role="alert" className="text-xs text-danger">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-2 border-t border-line pt-5">
          <button type="button" onClick={onClose} className="button-secondary">
            Cancel
          </button>
          <button
            type="submit"
            className="button-secondary !border-danger/30 !text-danger hover:!bg-danger/10"
          >
            <Trash2 size={15} /> Delete list
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default function TaskHome({ onOpenHomework, isActive = true }) {
  const { data, updateData, error, saving } = useTasks();
  const [view, setView] = useState('today');
  const [query, setQuery] = useState('');
  const [taskEditor, setTaskEditor] = useState(null);
  const [listEditor, setListEditor] = useState(null);
  const [listDeletion, setListDeletion] = useState(null);
  const [listDeleteError, setListDeleteError] = useState('');
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
      updateData((current) => {
        const list = current.lists.find((item) => item.id === task.listId) ||
          current.lists[0] || {
            id: crypto.randomUUID(),
            name: 'Inbox',
            color: LIST_COLORS[0],
          };
        const savedTask = { ...task, listId: list.id };
        return {
          ...current,
          lists: current.lists.length ? current.lists : [list],
          tasks: previous
            ? current.tasks.map((item) =>
                item.id === task.id ? savedTask : item,
              )
            : [...current.tasks, savedTask],
        };
      })
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
  function removeList(destinationId) {
    let removal;
    const saved = updateData((current) => {
      removal = deleteTaskList(
        current,
        listDeletion.id,
        destinationId,
        crypto.randomUUID(),
      );
      return removal?.data || current;
    });
    if (!saved || !removal) {
      setListDeleteError(
        'The lists changed or could not be saved. Close this dialog and try again.',
      );
      return;
    }
    setListDeletion(null);
    if (view === `list:${removal.list.id}`)
      setView(removal.destinationId ? `list:${removal.destinationId}` : 'all');
    setQuery('');
    setNotice({
      message: `${removal.list.name} list deleted${removal.taskIds.length ? ' · Tasks moved' : ''}`,
      undo: () => {
        if (updateData((current) => restoreTaskList(current, removal)))
          setView(`list:${removal.list.id}`);
      },
    });
  }
  function openNewTask(voiceMode = false) {
    if (
      !data.lists.length &&
      !updateData((current) =>
        current.lists.length
          ? current
          : {
              ...current,
              lists: [
                {
                  id: crypto.randomUUID(),
                  name: 'Inbox',
                  color: LIST_COLORS[0],
                },
              ],
            },
      )
    )
      return;
    setTaskEditor({ task: null, voiceMode: voiceMode === true });
  }
  function renderRow(row, isCompleted = false, isDeleted = false) {
    const list = data.lists.find((item) => item.id === row.task.listId);
    const repeat = REPEAT_OPTIONS.find(
      (option) => option.value === row.task.repeat,
    );
    return (
      <li
        key={row.key}
        className="group flex items-start gap-3.5 border-b border-line px-1 py-4 last:border-0 sm:gap-4"
      >
        {!isDeleted && (
          <input
            type="checkbox"
            checked={isCompleted}
            onChange={() => toggle(row)}
            aria-label={`${isCompleted ? 'Reopen' : 'Complete'} ${row.task.title}${isCompleted && row.task.repeat !== 'none' ? ` on ${row.date}` : ''}`}
            className="task-check mt-1 h-[20px] w-[20px] shrink-0 cursor-pointer appearance-none rounded-full border transition hover:border-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
          />
        )}
        <div className="min-w-0 flex-1">
          <button
            onClick={() => setTaskEditor({ task: row.task })}
            disabled={isDeleted}
            aria-label={`Edit ${row.task.title}`}
            className={`block max-w-full break-words text-left text-[15px] font-medium leading-6 ${isCompleted ? 'text-muted line-through' : 'text-ink hover:text-ink'}`}
          >
            {row.task.title}
          </button>
          {row.task.notes && (
            <p className="mt-0.5 line-clamp-2 whitespace-pre-wrap break-words text-xs leading-5 text-muted">
              {row.task.notes}
            </p>
          )}
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted">
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
                className={`flex items-center gap-1 ${!isCompleted && row.date < today ? 'text-danger' : !isCompleted && row.date === today ? 'text-accent' : ''}`}
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
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs text-accent hover:bg-accent/10"
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
            className={`rounded-lg p-2 transition ${row.task.flagged ? 'text-warning' : 'text-faint hover:text-warning sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100'}`}
          >
            <Flag size={16} fill={row.task.flagged ? 'currentColor' : 'none'} />
          </button>
        )}
      </li>
    );
  }

  return (
    <div className="page-frame task-home">
      <PageHeader
        eyebrow={new Intl.DateTimeFormat('en', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
        }).format(new Date(`${today}T12:00:00`))}
        title="Make room for your day."
        description="Your tasks, small wins, and everyday routines — all in one place."
        actions={
          <>
            <button
              onClick={() => openNewTask(true)}
              className="button-secondary"
            >
              <Mic size={16} /> Voice task
            </button>
            <button onClick={openNewTask} className="button-primary">
              <Plus size={16} /> New task
            </button>
          </>
        }
      />
      {error && (
        <p
          role="alert"
          className="mb-5 rounded-xl border border-danger/20 bg-danger/5 p-4 text-sm text-danger"
        >
          {error}
        </p>
      )}
      <div className="grid grid-cols-1 gap-7 lg:min-h-[calc(100dvh-330px)] lg:grid-cols-[210px_minmax(0,1fr)] lg:gap-10">
        <aside
          aria-label="Task lists"
          className="min-w-0 border-b border-line pb-5 lg:border-r lg:border-b-0 lg:pr-7 lg:pb-0"
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
                  className={`flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-xs transition-colors lg:w-full lg:text-sm ${view === item.id ? 'bg-accent-soft text-accent' : 'text-muted hover:bg-hover hover:text-secondary'}`}
                >
                  <Icon size={17} className="shrink-0 text-accent" />
                  <span>{item.name}</span>
                  <span className="ml-auto pl-2 text-xs tabular-nums text-muted">
                    {counts[item.id]}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="mt-4 flex items-center justify-between px-2 lg:mt-7">
            <h2 className="text-[10px] font-semibold uppercase tracking-[0.13em] text-muted">
              My lists
            </h2>
            <button
              onClick={() => setListEditor({ list: null })}
              aria-label="Create a new list"
              className="rounded-md p-1 text-muted hover:bg-hover hover:text-ink"
            >
              <Plus size={15} />
            </button>
          </div>
          <div className="mt-2 flex gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:flex-col">
            {data.lists.map((list) => (
              <div
                key={list.id}
                className="group flex shrink-0 items-center lg:w-full"
              >
                <button
                  aria-label={`${list.name} list`}
                  aria-pressed={selectedList?.id === list.id}
                  onClick={() => {
                    setView(`list:${list.id}`);
                    setQuery('');
                  }}
                  className={`flex min-w-0 flex-1 items-center gap-2 rounded-lg px-2.5 py-2 text-sm transition lg:gap-3 lg:py-3 ${selectedList?.id === list.id ? 'bg-selected text-ink' : 'text-muted hover:bg-hover hover:text-ink'}`}
                >
                  <span
                    className="flex h-6 w-6 shrink-0 items-center justify-center"
                    style={{
                      color: themedAccent(list.color),
                    }}
                  >
                    <ListTodo size={16} />
                  </span>
                  <span className="min-w-0 max-w-36 truncate lg:max-w-none">
                    {list.name}
                  </span>
                  <span className="ml-auto text-xs tabular-nums text-muted">
                    {active.filter((row) => row.task.listId === list.id).length}
                  </span>
                </button>
                <button
                  type="button"
                  aria-label={`Delete ${list.name} list`}
                  title={`Delete ${list.name} list`}
                  onClick={() => {
                    setListDeletion(list);
                    setListDeleteError('');
                  }}
                  className="shrink-0 rounded-lg p-2 text-faint hover:bg-danger/10 hover:text-danger focus-visible:text-danger"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
          <div className="mt-3 flex gap-1 border-t border-line pt-2 lg:mt-5 lg:block lg:space-y-1 lg:pt-4">
            <button
              onClick={() => {
                setView('flagged');
                setQuery('');
              }}
              aria-pressed={view === 'flagged'}
              className={`flex w-full items-center gap-3 whitespace-nowrap rounded-lg px-3 py-2.5 text-xs ${view === 'flagged' ? 'bg-selected text-ink' : 'text-muted hover:text-ink'}`}
            >
              <Flag size={15} className="text-warning" />
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
              className={`flex w-full items-center gap-3 whitespace-nowrap rounded-lg px-3 py-2.5 text-xs ${view === 'deleted' ? 'bg-selected text-ink' : 'text-muted hover:text-ink'}`}
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
            className="mt-6 hidden items-center gap-2 px-2 py-2 text-xs font-medium text-accent lg:flex hover:text-accent"
          >
            <Plus size={15} /> Add list
          </button>
        </aside>
        <section aria-label={title} className="flex min-w-0 flex-col">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-5">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-semibold tracking-tight text-ink">
                {title}
              </h2>
              <span className="rounded-md bg-accent-soft px-2 py-0.5 text-[11px] tabular-nums text-accent">
                {rows.length}
              </span>
              {selectedList && (
                <button
                  onClick={() => setListEditor({ list: selectedList })}
                  aria-label={`Edit ${selectedList.name} list`}
                  className="rounded-lg p-1.5 text-muted hover:text-ink"
                >
                  <Pencil size={14} />
                </button>
              )}
            </div>
            <div className="relative w-full sm:w-48">
              <Search
                size={14}
                className="pointer-events-none absolute top-3 left-3 text-faint"
              />
              <input
                aria-label="Search tasks"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search this view"
                className="input-control task-search pl-9"
              />
            </div>
          </div>
          {rows.length > 0 ? (
            <div className="mt-1">
              {groups.map(([group, entries]) => (
                <div key={group}>
                  {group !== 'tasks' && (
                    <h3
                      className={`mt-6 mb-1 text-xs font-semibold ${group === 'overdue' ? 'text-danger' : 'text-muted'}`}
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
            <div className="flex min-h-80 flex-1 flex-col items-center justify-center px-4 py-12 text-center">
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-line bg-accent-soft text-accent">
                <CircleCheck size={25} strokeWidth={1.25} />
              </div>
              <h3 className="text-base font-semibold text-ink">
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
              <p className="mt-2 max-w-xs text-sm leading-6 text-muted">
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
                <button onClick={openNewTask} className="button-secondary mt-5">
                  <Plus size={15} />
                  Add a task
                </button>
              )}
            </div>
          )}
          {canAdd && rows.length > 0 && (
            <button
              onClick={openNewTask}
              className="mt-4 flex items-center gap-3 self-start rounded-lg px-1 py-2 text-sm text-accent hover:text-accent"
            >
              <Plus size={20} />
              Add a task
            </button>
          )}
          {!['completed', 'deleted'].includes(view) && doneRows.length > 0 && (
            <div className="mt-7 border-t border-line pt-4">
              <button
                onClick={() => setShowCompleted(!showCompleted)}
                aria-expanded={showCompleted}
                className="flex items-center gap-2 text-xs text-muted hover:text-secondary"
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
          <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5 text-[11px] text-faint">
            <span className="mt-5 flex items-center gap-1.5">
              <span className={`h-1 w-1 rounded-full ${error ? 'bg-warning' : saving ? 'bg-accent' : 'bg-success/70'}`} />
              {error ? 'Unable to save to Firebase' : saving ? 'Saving to Firebase…' : 'Saved to Firebase'}
            </span>
            <button
              onClick={onOpenHomework}
              className="mt-5 flex items-center gap-1.5 text-muted hover:text-ink"
            >
              Your study plan is in Homework
              <ArrowRight size={12} />
            </button>
          </div>
        </section>
      </div>
      {taskEditor && isActive && (
        <TaskForm
          task={taskEditor.task}
          lists={data.lists}
          defaultListId={selectedList?.id}
          defaultDate={['today', 'scheduled'].includes(view) ? today : ''}
          today={today}
          onSave={saveTask}
          onDelete={() => deleteTask(taskEditor.task)}
          onClose={() => setTaskEditor(null)}
          voiceMode={!!taskEditor.voiceMode}
        />
      )}
      {listEditor && isActive && (
        <ListForm
          list={listEditor.list}
          lists={data.lists}
          onClose={() => setListEditor(null)}
          onSave={saveList}
        />
      )}
      {listDeletion && isActive && (
        <DeleteListDialog
          list={listDeletion}
          lists={data.lists}
          taskCount={
            data.tasks.filter((task) => task.listId === listDeletion.id).length
          }
          error={listDeleteError}
          onDelete={removeList}
          onClose={() => setListDeletion(null)}
        />
      )}
      {notice && (
        <div
          role="status"
          className="fixed right-5 bottom-5 left-5 z-40 mx-auto flex w-fit max-w-[calc(100%-2.5rem)] items-center gap-5 rounded-xl border border-line bg-elevated px-4 py-3 text-xs text-ink shadow-2xl"
        >
          <span>{notice.message}</span>
          {notice.undo && (
            <button
              onClick={() => {
                notice.undo();
                setNotice(null);
              }}
              className="font-semibold text-accent"
            >
              Undo
            </button>
          )}
          <button
            onClick={() => setNotice(null)}
            aria-label="Dismiss notification"
            className="text-muted"
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
