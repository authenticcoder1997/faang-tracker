import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Edit3, Sparkles, ArrowRight, Loader2, Mic } from 'lucide-react';

export default function Notes({ notes, setNotes }) {
  const [activeNoteId, setActiveNoteId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');

  // AI State
  const [aiInput, setAiInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const textareaRef = useRef(null);
  const recognitionRef = useRef(null);

  // Debounced auto-save
  useEffect(() => {
    if (!activeNoteId) return;
    const timer = setTimeout(() => {
      const activeNote = notes.find(n => n.id === activeNoteId);
      if (activeNote && (activeNote.title !== editTitle || activeNote.content !== editContent)) {
        setNotes(notes.map(n =>
          n.id === activeNoteId
            ? { ...n, title: editTitle, content: editContent, updatedAt: new Date().toISOString() }
            : n
        ));
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [editTitle, editContent, activeNoteId, notes, setNotes]);

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
      updatedAt: new Date().toISOString()
    };
    setNotes([newNote, ...notes]);
    setActiveNoteId(newNote.id);
    setEditTitle(newNote.title);
    setEditContent(newNote.content);
  };

  const deleteNote = (id) => {
    if (window.confirm("Delete this note?")) {
      setNotes(notes.filter(n => n.id !== id));
      if (activeNoteId === id) setActiveNoteId(null);
    }
  };

  const openNote = (note) => {
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

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Please try Chrome.");
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

      const newText = (originalText ? originalText + ' ' : '') + finalTranscript + interimTranscript;
      setAiInput(newText);
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error", event.error);
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
      alert("Gemini API Key is missing! Check your Vercel Environment Variables.");
      return;
    }

    setIsGenerating(true);
    const userText = aiInput;
    setAiInput('');

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are an AI note-taking assistant. The user has provided some raw, unformatted, or dictated thoughts. Your job is to format this beautifully into markdown, correct any grammar or spelling mistakes, and make it concise and readable. DO NOT add conversational filler like "Here is the formatted text:". Just return the markdown.\n\nUser's raw input:\n${userText}`
            }]
          }]
        })
      });

      const data = await response.json();
      if (data.candidates && data.candidates[0].content.parts[0].text) {
        const generatedText = data.candidates[0].content.parts[0].text.trim();

        setEditContent(prev => {
          const newContent = prev.trim() ? `${prev}\n\n${generatedText}` : generatedText;
          return newContent;
        });

        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
          }
        }, 100);
      } else {
        console.error("Unexpected Gemini response:", data);
        alert("Failed to generate response. Check console for details.");
      }
    } catch (error) {
      console.error("Gemini API Error:", error);
      alert("Error connecting to Gemini API.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-canvas h-full text-secondary font-sans flex flex-col md:flex-row border border-line rounded-xl overflow-hidden m-4 md:m-8 md:mt-4">
      {/* Sidebar for Notes */}
      <div className="w-full md:w-80 border-r border-line flex flex-col h-[300px] md:h-[calc(100vh-6rem)] shrink-0">
        <div className="p-4 border-b border-line flex justify-between items-center bg-surface">
          <h2 className="font-bold text-ink text-lg">Notes</h2>
          <button onClick={createNote} className="p-2 bg-[#22c55e] text-black rounded-lg hover:bg-[#16a34a] transition">
            <Plus size={18} strokeWidth={2.5} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar bg-surface">
          {notes.length === 0 ? (
            <div className="text-muted text-sm text-center mt-10">No notes yet. Click + to create one.</div>
          ) : (
            [...notes].sort((a,b) => new Date(b.updatedAt) - new Date(a.updatedAt)).map(note => (
              <div
                key={note.id}
                onClick={() => openNote(note)}
                className={`p-3 rounded-xl cursor-pointer border transition-all group ${activeNoteId === note.id ? 'bg-selected border-line' : 'bg-surface border-transparent hover:bg-field'}`}
              >
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-semibold text-ink truncate pr-2">{note.title || "Untitled"}</h3>
                  <button onClick={(e) => { e.stopPropagation(); deleteNote(note.id); }} className="text-muted hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 size={14} />
                  </button>
                </div>
                <p className="text-xs text-muted line-clamp-2">{note.content || "No content"}</p>
                <div className="text-[10px] text-faint mt-2">
                  {new Date(note.updatedAt).toLocaleDateString()}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Editor */}
      <div className="flex-1 flex flex-col h-[500px] md:h-[calc(100vh-6rem)] bg-well relative">
        {activeNoteId ? (
          <>
            <div className="p-4 border-b border-line bg-canvas flex items-center justify-between shrink-0">
              <input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="bg-transparent text-xl font-bold text-ink outline-none flex-1 placeholder-gray-600"
                placeholder="Note Title"
              />
            </div>

            <textarea
              ref={textareaRef}
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="flex-1 bg-transparent p-6 pb-24 text-secondary outline-none resize-none custom-scrollbar leading-relaxed text-sm md:text-base"
              placeholder="Start typing your notes here..."
            />

            {/* AI Input Wrapper */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-3xl bg-elevated border border-line rounded-2xl shadow-2xl p-2 px-3 flex items-center gap-3">
              <div className="text-muted">
                <Sparkles size={20} />
              </div>
              <form onSubmit={handleAiSubmit} className="flex-1 flex items-center gap-2">
                <input
                  type="text"
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  disabled={isGenerating}
                  placeholder={isListening ? "Listening..." : "Dictate or type rough notes, Gemini will format them..."}
                  className={`w-full bg-transparent border-none outline-none text-ink text-sm placeholder-gray-500 disabled:opacity-50 ${isListening ? 'animate-pulse text-green-400' : ''}`}
                />

                {/* Mic Button */}
                <button
                  type="button"
                  onClick={toggleListening}
                  className={`p-2 rounded-full transition-colors flex-shrink-0 ${isListening ? 'text-red-400 bg-red-400/10' : 'text-muted hover:text-ink hover:bg-selected'}`}
                  title="Dictate Note"
                >
                  <Mic size={18} className={isListening ? 'animate-pulse' : ''} />
                </button>

                {/* Send Button */}
                <button
                  type="submit"
                  disabled={isGenerating || (!aiInput.trim() && !isListening)}
                  className={`p-2 rounded-full flex items-center justify-center transition-colors flex-shrink-0 ${
                    isGenerating || (!aiInput.trim() && !isListening)
                      ? 'bg-selected text-muted'
                      : 'bg-selected text-ink hover:bg-selected'
                  }`}
                >
                  {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-faint flex-col gap-4">
            <Edit3 size={48} className="opacity-20" />
            <p>Select a note or create a new one.</p>
          </div>
        )}
      </div>
    </div>
  );
}
