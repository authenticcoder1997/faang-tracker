import React, { useState } from 'react';
import { ChevronDown, ChevronRight, FileText, CheckCircle2, Circle, Play, RotateCcw } from 'lucide-react';
import NoteModal from './NoteModal';

export default function HldTracker({ items, setItems }) {
  const [activeNoteItem, setActiveNoteItem] = useState(null);
  const [collapsedSections, setCollapsedSections] = useState({});

  const toggleItem = (id) => {
    setItems(items.map(item =>
      item.id === id ? { ...item, completed: !item.completed } : item
    ));
  };

  const total = items.length;
  const completed = items.filter(i => i.completed).length;
  const pct = total === 0 ? 0 : Math.round((completed / total) * 100);

  const easyTotal = items.filter(i => i.difficulty === 'Easy').length;
  const easyDone = items.filter(i => i.difficulty === 'Easy' && i.completed).length;
  const medTotal = items.filter(i => i.difficulty === 'Medium').length;
  const medDone = items.filter(i => i.difficulty === 'Medium' && i.completed).length;
  const hardTotal = items.filter(i => i.difficulty === 'Hard').length;
  const hardDone = items.filter(i => i.difficulty === 'Hard' && i.completed).length;

  return (
    <div className="bg-[#0a0a0a] min-h-screen text-gray-300 p-8 font-sans">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start mb-8 gap-6">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3 mb-2 flex-wrap">
              System Design <span className="bg-[#2dd4bf] text-black px-3 py-1 rounded-md text-xl font-semibold">Guided Practice</span>
            </h1>
            <p className="text-gray-400 text-sm mb-4">
              Walk through common interview questions step-by-step with personalized feedback.
            </p>
            <a href="https://hellointerview.com/learn/system-design" target="_blank" rel="noopener noreferrer" className="text-[#2dd4bf] text-sm font-medium hover:underline flex items-center gap-1">View on HelloInterview ↓</a>
          </div>

          <div className="flex items-center gap-6 bg-[#171717] p-4 rounded-xl border border-gray-800 shadow-lg shadow-black/20">
            <div className="relative w-20 h-20 rounded-full bg-[#262626] flex items-center justify-center border-4 border-[#262626]">
              <div className="absolute inset-0 rounded-full border-4 border-[#2dd4bf]" style={{ clipPath: `inset(${100 - pct}% 0 0 0)` }}></div>
              <div className="text-center z-10">
                <div className="text-lg font-bold text-white leading-none">{completed}/{total}</div>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="text-center">
                <div className="text-[#2dd4bf] text-xs mb-1">Easy</div>
                <div className="text-white font-bold">{easyDone}<span className="text-gray-500 text-sm">/{easyTotal}</span></div>
              </div>
              <div className="text-center">
                <div className="text-[#fb923c] text-xs mb-1">Medium</div>
                <div className="text-white font-bold">{medDone}<span className="text-gray-500 text-sm">/{medTotal}</span></div>
              </div>
              <div className="text-center">
                <div className="text-[#f87171] text-xs mb-1">Hard</div>
                <div className="text-white font-bold">{hardDone}<span className="text-gray-500 text-sm">/{hardTotal}</span></div>
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="w-full rounded-t-md overflow-hidden border border-gray-800">
          <div className="hidden md:grid grid-cols-12 bg-[#2dd4bf] text-black font-semibold text-sm py-2 px-4 items-center">
            <div className="col-span-2">Date</div>
            <div className="col-span-3">Interview Question</div>
            <div className="col-span-4 text-center">Notes</div>
            <div className="col-span-2 text-center">Difficulty</div>
            <div className="col-span-1 text-center">Solved</div>
          </div>
          <div className="md:hidden bg-[#2dd4bf] text-black font-semibold text-xs py-2 px-4">
            Breakdowns
          </div>

          <div className="bg-[#0f0f0f]">
            {items.map((item, idx) => (
              <div
                key={item.id}
                className={`hidden md:grid grid-cols-12 items-center py-3 px-4 border-b border-gray-800/50 hover:bg-[#1a1a1a] transition-colors ${idx % 2 === 1 ? 'bg-white/[0.02]' : ''}`}
              >
                <div className="col-span-2 text-xs text-gray-500 whitespace-nowrap">{item.date}</div>
                <div className="col-span-3 flex items-center gap-3 pr-4">
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-300 hover:text-[#2dd4bf] hover:underline underline-offset-2 text-sm transition-colors line-clamp-2"
                  >
                    {item.title}
                  </a>
                </div>
                <div className="col-span-4 flex items-center justify-center">
                  <button
                    onClick={(e) => { e.stopPropagation(); setActiveNoteItem(item); }}
                    className={`p-1.5 rounded transition-colors ${item.note ? 'text-[#2dd4bf] hover:bg-[#2dd4bf]/10' : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800'}`}
                    title={item.note ? "Edit Notes" : "Add Notes"}
                  >
                    <FileText size={16} />
                  </button>
                </div>
                <div className="col-span-2 text-center">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${item.difficulty === 'Easy' ? 'text-[#2dd4bf]' : item.difficulty === 'Medium' ? 'text-[#fb923c]' : 'text-[#f87171]'}`}>
                    {item.difficulty}
                  </span>
                </div>
                <div className="col-span-1 flex justify-center cursor-pointer" onClick={() => toggleItem(item.id)}>
                  {item.completed ? (
                    <CheckCircle2 size={20} className="text-[#2dd4bf]" />
                  ) : (
                    <Circle size={20} className="text-gray-500 hover:text-[#2dd4bf] transition-colors" />
                  )}
                </div>
              </div>
            ))}

            {/* Mobile stacked cards */}
            {items.map((item, idx) => (
              <div
                key={`m-${item.id}`}
                className={`md:hidden flex flex-col gap-2 px-4 py-3 border-b border-gray-800/50 ${idx % 2 === 1 ? 'bg-white/[0.02]' : ''}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-200 hover:text-[#2dd4bf] text-sm font-medium flex-1 min-w-0"
                  >
                    {item.title}
                  </a>
                  <div className="flex items-center gap-2 shrink-0" onClick={() => toggleItem(item.id)}>
                    {item.completed ? (
                      <CheckCircle2 size={20} className="text-[#2dd4bf]" />
                    ) : (
                      <Circle size={20} className="text-gray-500" />
                    )}
                  </div>
                </div>
                <div className="flex items-center flex-wrap gap-2 text-xs">
                  <span className="text-gray-500">{item.date}</span>
                  <span className={`font-semibold px-2 py-0.5 rounded-full ${item.difficulty === 'Easy' ? 'text-[#2dd4bf]' : item.difficulty === 'Medium' ? 'text-[#fb923c]' : 'text-[#f87171]'}`}>
                    {item.difficulty}
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); setActiveNoteItem(item); }}
                    className={`ml-auto p-1 rounded transition-colors ${item.note ? 'text-[#2dd4bf]' : 'text-gray-500'}`}
                    title={item.note ? "Edit Notes" : "Add Notes"}
                  >
                    <FileText size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <NoteModal 
        isOpen={!!activeNoteItem}
        onClose={() => setActiveNoteItem(null)}
        initialNote={activeNoteItem?.note}
        problemTitle={activeNoteItem?.title}
        onSave={(newNote) => {
          if (activeNoteItem && activeNoteItem.note !== newNote) {
            setItems(items.map(i => i.id === activeNoteItem.id ? { ...i, note: newNote } : i));
          }
        }}
      />
    </div>
  );
}