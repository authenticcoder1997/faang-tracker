import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Plus,
  Trash2,
  FileText,
  Sparkles,
  ArrowRight,
  Loader2,
  Mic,
} from 'lucide-react';
import { EmptyState, PageHeader } from './ui/Workspace';

export default function Notes({
  notes,
  setNotes,
  syncError = null,
  storageError = null,
}) {
  const [activeNoteId, setActiveNoteId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');

  // AI State
  const [aiInput, setAiInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const textareaRef = useRef(null);
  const recognitionRef = useRef(null);

  const mergeDraft = useCallback(
    (current) =>
      current.map((note) =>
        note.id === activeNoteId &&
        (note.title !== editTitle || note.content !== editContent)
          ? {
              ...note,
              title: editTitle,
              content: editContent,
              updatedAt: new Date().toISOString(),
            }
          : note,
      ),
    [activeNoteId, editTitle, editContent],
  );

  // Debounced auto-save
  useEffect(() => {
    if (!activeNoteId) return;
    const timer = setTimeout(() => {
      const activeNote = notes.find((n) => n.id === activeNoteId);
      if (
        activeNote &&
        (activeNote.title !== editTitle || activeNote.content !== editContent)
      ) {
        setNotes(mergeDraft);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [editTitle, editContent, activeNoteId, notes, setNotes, mergeDraft]);

  // A refresh should keep the last typed words even before the debounce fires.
  useEffect(() => {
    const flushDraft = () => {
      const activeNote = notes.find((note) => note.id === activeNoteId);
      if (
        !activeNote ||
        (activeNote.title === editTitle && activeNote.content === editContent)
      )
        return;
      setNotes(mergeDraft);
    };
    window.addEventListener('pagehide', flushDraft);
    return () => window.removeEventListener('pagehide', flushDraft);
  }, [activeNoteId, editTitle, editContent, notes, setNotes, mergeDraft]);

  // Clean up speech recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const createNote = () => {
    const newNote = {
      id: Date.now().toString(),
      title: 'Untitled Note',
      content: '',
      updatedAt: new Date().toISOString(),
    };
    setNotes((current) => [newNote, ...mergeDraft(current)]);
    setActiveNoteId(newNote.id);
    setEditTitle(newNote.title);
    setEditContent(newNote.content);
  };

  const deleteNote = (id) => {
    if (window.confirm('Delete this note?')) {
      setNotes((current) => mergeDraft(current).filter((n) => n.id !== id));
      if (activeNoteId === id) setActiveNoteId(null);
    }
  };

  const openNote = (note) => {
    if (note.id === activeNoteId) return;
    const activeNote = notes.find((current) => current.id === activeNoteId);
    if (
      activeNote &&
      (activeNote.title !== editTitle || activeNote.content !== editContent)
    ) {
      setNotes(mergeDraft);
    }
    setActiveNoteId(note.id);
    setEditTitle(note.title);
    setEditContent(note.content);
  };

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert(
        'Speech recognition is not supported in this browser. Please try Chrome.',
      );
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.continuous = true;
    recognition.interimResults = true;

    // Store the text that was already in the input before we started talking
    const originalText = aiInput;

    recognition.onstart = () => setIsListening(true);

    recognition.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      const newText =
        (originalText ? originalText + ' ' : '') +
        finalTranscript +
        interimTranscript;
      setAiInput(newText);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const handleAiSubmit = async (e) => {
    e.preventDefault();
    if (!aiInput.trim() || isGenerating) return;

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    }

    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      alert(
        'Gemini API Key is missing! Check your Vercel Environment Variables.',
      );
      return;
    }

    setIsGenerating(true);
    const userText = aiInput;
    setAiInput('');

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `You are an AI note-taking assistant. The user has provided some raw, unformatted, or dictated thoughts. Your job is to format this beautifully into markdown, correct any grammar or spelling mistakes, and make it concise and readable. DO NOT add conversational filler like "Here is the formatted text:". Just return the markdown.\n\nUser's raw input:\n${userText}`,
                  },
                ],
              },
            ],
          }),
        },
      );

      const data = await response.json();
      if (data.candidates && data.candidates[0].content.parts[0].text) {
        const generatedText = data.candidates[0].content.parts[0].text.trim();

        setEditContent((prev) => {
          const newContent = prev.trim()
            ? `${prev}\n\n${generatedText}`
            : generatedText;
          return newContent;
        });

        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
          }
        }, 100);
      } else {
        console.error('Unexpected Gemini response:', data);
        alert('Failed to generate response. Check console for details.');
      }
    } catch (error) {
      console.error('Gemini API Error:', error);
      alert('Error connecting to Gemini API.');
    } finally {
      setIsGenerating(false);
    }
  };

  const activeNote = notes.find((note) => note.id === activeNoteId);
  const hasUnsavedDraft =
    activeNote &&
    (activeNote.title !== editTitle || activeNote.content !== editContent);
  const saveStatus =
    storageError && syncError
      ? 'Saving unavailable · keep this page open'
      : hasUnsavedDraft
        ? 'Saving…'
        : storageError
          ? 'Browser backup unavailable'
          : syncError
            ? 'Saved in this browser'
            : 'Saved automatically';

  return (
    <section className="page-frame">
      <PageHeader
        eyebrow="A little room to think"
        title="Notes"
        description="Ideas, study notes, and things worth keeping."
        actions={
          <button onClick={createNote} className="button-primary">
            <Plus size={16} aria-hidden="true" />
            New note
          </button>
        }
      />

      <div className="grid min-w-0 gap-8 lg:grid-cols-[250px_minmax(0,1fr)] lg:gap-10">
        <aside
          aria-label="Saved notes"
          className="min-w-0 lg:border-r lg:border-line lg:pr-8"
        >
          <div className="mb-3 flex items-center justify-between">
            <h2 className="section-heading">Your notebook</h2>
            <span className="text-xs tabular-nums text-muted">
              {notes.length}
            </span>
          </div>
          <div className="custom-scrollbar max-h-56 overflow-y-auto lg:max-h-[calc(100dvh-21rem)]">
            {notes.length > 0 &&
              [...notes]
                .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
                .map((note) => (
                  <div
                    key={note.id}
                    className={`group relative flex items-start border-b border-line transition-colors ${activeNoteId === note.id ? 'bg-accent-soft' : 'hover:bg-hover'}`}
                  >
                    <button
                      onClick={() => openNote(note)}
                      aria-pressed={activeNoteId === note.id}
                      className="min-w-0 flex-1 rounded-lg px-3 py-4 text-left focus-visible:outline-2 focus-visible:outline-accent"
                    >
                      <h3
                        className={`truncate pr-4 text-sm font-semibold ${activeNoteId === note.id ? 'text-accent' : 'text-ink'}`}
                      >
                        {note.title || 'Untitled'}
                      </h3>
                      <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-muted">
                        {note.content ||
                          'A fresh page, ready for your thoughts.'}
                      </p>
                      <time
                        dateTime={note.updatedAt}
                        className="mt-2 block text-[11px] text-faint"
                      >
                        {new Date(note.updatedAt).toLocaleDateString(
                          undefined,
                          { month: 'short', day: 'numeric' },
                        )}
                      </time>
                    </button>
                    <button
                      onClick={() => deleteNote(note.id)}
                      aria-label={`Delete ${note.title || 'untitled note'}`}
                      title="Delete note"
                      className="icon-button absolute top-3 right-1 text-muted hover:text-danger lg:opacity-0 lg:group-hover:opacity-100 lg:focus:opacity-100"
                    >
                      <Trash2 size={14} aria-hidden="true" />
                    </button>
                  </div>
                ))}
          </div>
        </aside>

        <div className="flex min-h-[20rem] min-w-0 flex-col lg:h-[calc(100dvh-18rem)] lg:min-h-[28rem]">
          {activeNoteId ? (
            <>
              <div className="shrink-0 border-b border-line pb-5">
                <p className="eyebrow mb-3">Personal note</p>
                <input
                  aria-label="Note title"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full min-w-0 bg-transparent text-2xl font-semibold tracking-tight text-ink outline-none sm:text-3xl"
                  placeholder="Untitled note"
                />
              </div>

              <textarea
                ref={textareaRef}
                aria-label="Note content"
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="custom-scrollbar min-h-64 flex-1 resize-none bg-transparent py-6 text-[15px] leading-7 text-secondary outline-none"
                placeholder="Start with whatever is on your mind…"
              />

              <div className="shrink-0 border-t border-line pt-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3 text-[11px] text-muted">
                  <span className="flex items-center gap-1.5">
                    <Sparkles
                      size={13}
                      className="text-accent"
                      aria-hidden="true"
                    />
                    A little help with your words
                  </span>
                  <span
                    role="status"
                    className={
                      storageError && syncError
                        ? 'text-danger'
                        : storageError
                          ? 'text-warning'
                          : ''
                    }
                  >
                    {saveStatus}
                  </span>
                </div>
                <form
                  onSubmit={handleAiSubmit}
                  aria-label="Format rough notes"
                  aria-busy={isGenerating}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    aria-label="Rough thoughts to format and add"
                    value={aiInput}
                    onChange={(e) => setAiInput(e.target.value)}
                    disabled={isGenerating}
                    placeholder={
                      isListening
                        ? 'Listening…'
                        : 'Type or dictate a rough thought…'
                    }
                    className={`input-control min-w-0 flex-1 text-sm disabled:opacity-50 ${isListening ? 'text-accent' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={toggleListening}
                    aria-label={
                      isListening ? 'Stop dictation' : 'Dictate rough thoughts'
                    }
                    aria-pressed={isListening}
                    title={isListening ? 'Stop dictation' : 'Dictate'}
                    className={`icon-button shrink-0 ${isListening ? 'text-danger' : ''}`}
                  >
                    <Mic
                      size={18}
                      className={isListening ? 'animate-pulse' : ''}
                      aria-hidden="true"
                    />
                  </button>
                  <button
                    type="submit"
                    aria-label="Format and add to note"
                    disabled={isGenerating || (!aiInput.trim() && !isListening)}
                    className="button-primary shrink-0 disabled:opacity-40"
                  >
                    {isGenerating ? (
                      <Loader2
                        size={16}
                        className="animate-spin"
                        aria-hidden="true"
                      />
                    ) : (
                      <ArrowRight size={16} aria-hidden="true" />
                    )}
                    <span className="hidden sm:inline">Add</span>
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center">
              <EmptyState
                icon={FileText}
                title={
                  notes.length
                    ? 'Room for your next thought'
                    : 'Your first page starts here'
                }
                description={
                  notes.length
                    ? 'Open a note from your notebook, or start a fresh page.'
                    : 'Keep ideas close, work through a problem, or make a little space to think.'
                }
                action={
                  <button onClick={createNote} className="button-secondary">
                    <Plus size={16} aria-hidden="true" />
                    Create a note
                  </button>
                }
              />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
