import React, { useState } from 'react';
import { ChevronDown, ChevronRight, FileText, CheckCircle2, Circle, Play, RotateCcw } from 'lucide-react';

export default function HldTracker({ items, setItems }) {
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
    <div className="bg-[#1e293b] min-h-screen text-gray-300 p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="flex justify-between items-start mb-12">
          <div>
            <h1 className="text-4xl font-bold text-white flex items-center gap-3 mb-2">
              System Design <span className="bg-[#2dd4bf] text-[#0f172a] px-4 py-1 rounded-md text-3xl font-semibold">Guided Practice</span>
            </h1>
            <p className="text-gray-400 text-lg">
              Walk through common interview questions step-by-step<br/>
              with personalized feedback.
            </p>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="relative w-24 h-24 rounded-full bg-[#334155] flex items-center justify-center border-4 border-[#334155]">
              <div className="absolute inset-0 rounded-full border-4 border-[#2dd4bf]" style={{ clipPath: `inset(${100 - pct}% 0 0 0)` }}></div>
              <div className="text-center z-10">
                <div className="text-xl font-bold text-white">{completed}/{total}</div>
                <div className="text-xs text-gray-400">Completed</div>
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
        <div className="w-full">
          <div className="grid grid-cols-12 text-sm text-gray-400 border-b border-gray-700 pb-3 mb-2">
            <div className="col-span-8 pl-4">Interview Question</div>
            <div className="col-span-2">Difficulty ↑</div>
            <div className="col-span-2 text-center">Solved</div>
          </div>

          {items.map((item, idx) => (
            <div key={item.id} className="grid grid-cols-12 items-center py-4 border-b border-gray-700/50 hover:bg-[#334155]/30 transition-colors">
              <div className="col-span-8 flex items-center gap-3 pl-2">
                <ChevronDown size={16} className="text-gray-500 cursor-pointer" />
                <a 
                  href={item.url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-gray-200 hover:text-[#2dd4bf] transition-colors"
                >
                  {item.title}
                </a>
              </div>
              <div className="col-span-2">
                <span className={`text-sm ${item.difficulty === 'Easy' ? 'text-[#2dd4bf]' : item.difficulty === 'Medium' ? 'text-[#fb923c]' : 'text-[#f87171]'}`}>
                  {item.difficulty}
                </span>
              </div>
              <div className="col-span-2 flex justify-center cursor-pointer" onClick={() => toggleItem(item.id)}>
                {item.completed ? (
                  <CheckCircle2 size={24} className="text-[#2dd4bf]" />
                ) : (
                  <Circle size={24} className="text-gray-500" />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
