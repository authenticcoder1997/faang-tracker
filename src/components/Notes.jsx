import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Edit3, Sparkles, Send, Loader2 } from 'lucide-react';

export default function Notes({ notes, setNotes }) {
  const [activeNoteId, setActiveNoteId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  
  // AI State
  const [aiInput, setAiInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const textareaRef = useRef(null);

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

  const handleAiSubmit = async (e) => {
    e.preventDefault();
    if (!aiInput.trim() || isGenerating) return;

    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      alert("Gemini API Key is missing! Please add VITE_GEMINI_API_KEY to your environment variables.");
      return;
    }

    setIsGenerating(true);
    const userText = aiInput;
    setAiInput(''); // Clear input immediately for better UX

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
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
        
        // Append to current content
        setEditContent(prev => {
          const newContent = prev.trim() ? `${prev}\n\n${generatedText}` : generatedText;
          return newContent;
        });

        // Scroll to bottom of textarea
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
    <div className="bg-[#0a0a0a] h-full text-gray-300 font-sans flex flex-col md:flex-row border border-[#222] rounded-xl overflow-hidden m-4 md:m-8 md:mt-4">
      {/* Sidebar for Notes */}
      <div className="w-full md:w-80 border-r border-[#222] flex flex-col h-[300px] md:h-[calc(100vh-6rem)] shrink-0">
        <div className="p-4 border-b border-[#222] flex justify-between items-center bg-[#111]">
          <h2 className="font-bold text-white text-lg">Notes</h2>
          <button onClick={createNote} className="p-2 bg-[#22c55e] text-black rounded-lg hover:bg-[#16a34a] transition">
            <Plus size={18} strokeWidth={2.5} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar bg-[#0f0f0f]">
          {notes.length === 0 ? (
            <div className="text-gray-500 text-sm text-center mt-10">No notes yet. Click + to create one.</div>
          ) : (
            [...notes].sort((a,b) => new Date(b.updatedAt) - new Date(a.updatedAt)).map(note => (
              <div 
                key={note.id} 
                onClick={() => openNote(note)}
                className={`p-3 rounded-xl cursor-pointer border transition-all group ${activeNoteId === note.id ? 'bg-[#222] border-[#444]' : 'bg-[#111] border-transparent hover:bg-[#1a1a1a]'}`}
              >
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-semibold text-white truncate pr-2">{note.title || "Untitled"}</h3>
                  <button onClick={(e) => { e.stopPropagation(); deleteNote(note.id); }} className="text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 size={14} />
                  </button>
                </div>
                <p className="text-xs text-gray-400 line-clamp-2">{note.content || "No content"}</p>
                <div className="text-[10px] text-gray-600 mt-2">
                  {new Date(note.updatedAt).toLocaleDateString()}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Editor */}
      <div className="flex-1 flex flex-col h-[500px] md:h-[calc(100vh-6rem)] bg-[#050505] relative">
        {activeNoteId ? (
          <>
            <div className="p-4 border-b border-[#222] bg-[#0a0a0a] flex items-center justify-between shrink-0">
              <input 
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="bg-transparent text-xl font-bold text-white outline-none flex-1 placeholder-gray-600"
                placeholder="Note Title"
              />
            </div>
            
            <textarea 
              ref={textareaRef}
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="flex-1 bg-transparent p-6 pb-24 text-gray-300 outline-none resize-none custom-scrollbar leading-relaxed text-sm md:text-base"
              placeholder="Start typing your notes here..."
            />

            {/* AI Input Wrapper */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-2xl bg-[#1e1e1e] border border-[#333] rounded-full shadow-2xl p-2 flex items-center gap-2">
              <div className="pl-3 text-purple-400">
                <Sparkles size={18} />
              </div>
              <form onSubmit={handleAiSubmit} className="flex-1 flex items-center">
                <input 
                  type="text"
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  disabled={isGenerating}
                  placeholder="Jot down rough notes, Gemini will format them..."
                  className="w-full bg-transparent border-none outline-none text-white text-sm placeholder-gray-500 disabled:opacity-50"
                />
                <button 
                  type="submit"
                  disabled={isGenerating || !aiInput.trim()}
                  className={`p-2 rounded-full flex items-center justify-center transition-colors ${
                    isGenerating || !aiInput.trim() 
                      ? 'bg-[#333] text-gray-500' 
                      : 'bg-white text-black hover:bg-gray-200'
                  }`}
                >
                  {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-600 flex-col gap-4">
            <Edit3 size={48} className="opacity-20" />
            <p>Select a note or create a new one.</p>
          </div>
        )}
      </div>
    </div>
  );
}
