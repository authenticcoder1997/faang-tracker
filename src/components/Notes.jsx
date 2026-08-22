import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit3 } from 'lucide-react';

export default function Notes({ notes, setNotes }) {
  const [activeNoteId, setActiveNoteId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');

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
    }, 1000); // Save after 1 second of inactivity

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

  return (
    <div className="bg-[#0a0a0a] h-full text-gray-300 font-sans flex flex-col md:flex-row border border-[#222] rounded-xl overflow-hidden m-4 md:m-8 md:mt-4">
      {/* Sidebar for Notes */}
      <div className="w-full md:w-80 border-r border-[#222] flex flex-col h-[400px] md:h-[calc(100vh-6rem)]">
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
      <div className="flex-1 flex flex-col h-[600px] md:h-[calc(100vh-6rem)] bg-[#050505]">
        {activeNoteId ? (
          <>
            <div className="p-4 border-b border-[#222] bg-[#0a0a0a] flex items-center justify-between">
              <input 
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="bg-transparent text-xl font-bold text-white outline-none flex-1 placeholder-gray-600"
                placeholder="Note Title"
              />
            </div>
            <textarea 
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="flex-1 bg-transparent p-6 text-gray-300 outline-none resize-none custom-scrollbar leading-relaxed text-sm md:text-base"
              placeholder="Start typing your notes here..."
            />
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
