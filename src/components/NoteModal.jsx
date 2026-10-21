import React, { useState, useEffect, useId, useRef } from 'react';
import { Sparkles, ArrowRight, Loader2, Mic, X } from 'lucide-react';

export default function NoteModal({
  isOpen,
  onClose,
  initialNote,
  onSave,
  problemTitle,
}) {
  const [localNote, setLocalNote] = useState('');
  const [aiInput, setAiInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const dialogRef = useRef(null);
  const titleId = useId();
  const descriptionId = useId();
  const textareaRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setLocalNote(initialNote || '');
      setAiInput('');
    }
  }, [isOpen, initialNote]);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const dialog = dialogRef.current;
    if (!dialog.open) dialog.showModal();
    textareaRef.current?.focus();
    return () => {
      if (dialog.open) dialog.close();
    };
  }, [isOpen]);

  const handleClose = () => {
    if (recognitionRef.current) recognitionRef.current.stop();
    setIsListening(false);
    onSave(localNote);
    onClose();
  };

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition)
      return alert(
        'Speech recognition is not supported in this browser. Please try Chrome.',
      );

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.continuous = true;
    recognition.interimResults = true;
    const originalText = aiInput;

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal)
          finalTranscript += event.results[i][0].transcript;
        else interimTranscript += event.results[i][0].transcript;
      }
      setAiInput(
        (originalText ? originalText + ' ' : '') +
          finalTranscript +
          interimTranscript,
      );
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
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
    if (!apiKey)
      return alert(
        'Gemini API Key is missing! Check your Vercel Environment Variables.',
      );

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
                    text: `You are an AI note-taking assistant. The user is writing notes about the software engineering problem: "${problemTitle}". Format their rough thoughts beautifully into markdown, correct any grammar or spelling mistakes, and make it concise. DO NOT add conversational filler. Just return the markdown.\n\nUser's raw input:\n${userText}`,
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
        setLocalNote((prev) =>
          prev.trim() ? `${prev}\n\n${generatedText}` : generatedText,
        );
        setTimeout(() => {
          if (textareaRef.current)
            textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
        }, 100);
      } else {
        alert('Failed to generate response.');
      }
    } catch {
      alert('Error connecting to Gemini API.');
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      aria-modal="true"
      onCancel={(event) => {
        event.preventDefault();
        handleClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) handleClose();
      }}
      className="task-dialog theme-modal m-auto h-[min(80dvh,740px)] max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-3xl overflow-hidden rounded-2xl border border-line p-0 text-secondary shadow-2xl"
    >
      <div className="flex h-full min-h-0 flex-col">
        <div className="flex shrink-0 items-start justify-between gap-5 border-b border-line px-5 py-5 sm:px-7">
          <div className="min-w-0">
            <p className="eyebrow mb-2">A note to come back to</p>
            <h2
              id={titleId}
              className="text-xl font-semibold tracking-tight text-ink"
            >
              Problem notes
            </h2>
            <p
              id={descriptionId}
              className="mt-1.5 line-clamp-2 text-sm leading-6 text-muted"
            >
              {problemTitle}
            </p>
          </div>
          <button
            type="button"
            aria-label="Save and close problem notes"
            title="Save and close"
            onClick={handleClose}
            className="icon-button shrink-0"
          >
            <X size={19} aria-hidden="true" />
          </button>
        </div>

        <textarea
          ref={textareaRef}
          aria-label={`Notes for ${problemTitle}`}
          value={localNote}
          onChange={(e) => setLocalNote(e.target.value)}
          className="custom-scrollbar min-h-0 flex-1 resize-none bg-transparent px-5 py-6 text-[15px] leading-7 text-secondary outline-none sm:px-7"
          placeholder="An approach, a useful detail, or something you want to remember…"
        />

        <div className="shrink-0 border-t border-line px-5 py-4 sm:px-7">
          <div className="mb-3 flex items-center justify-between gap-3 text-[11px] text-muted">
            <span className="flex items-center gap-1.5">
              <Sparkles size={13} className="text-accent" aria-hidden="true" />
              Shape a rough thought
            </span>
            <span>Saved when you close</span>
          </div>
          <form
            onSubmit={handleAiSubmit}
            aria-label="Format rough problem notes"
            aria-busy={isGenerating}
            className="flex min-w-0 items-center gap-2"
          >
            <input
              type="text"
              aria-label="Rough thoughts to format and add"
              value={aiInput}
              onChange={(e) => setAiInput(e.target.value)}
              disabled={isGenerating}
              placeholder={
                isListening ? 'Listening…' : 'Type or dictate a rough thought…'
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
              aria-label="Format and add to problem notes"
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
      </div>
    </dialog>
  );
}
