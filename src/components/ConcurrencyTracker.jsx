import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Search, CheckCircle2, Circle, FileText, Lock, Layers, Shuffle, AlertTriangle, Puzzle, BookOpen, Database, Cpu, MessageSquare } from 'lucide-react';
import NoteModal from './NoteModal';

const ACCENT = '#a78bfa'; // violet-400

export default function ConcurrencyTracker({ items, setItems }) {
  const [collapsedSections, setCollapsedSections] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('All');
  const [topicFilter, setTopicFilter] = useState('All');
  const [accessFilter, setAccessFilter] = useState('All');
  const [activeNoteItem, setActiveNoteItem] = useState(null);

  const toggleItem = (id) => {
    setItems(items.map(item =>
      item.id === id ? { ...item, completed: !item.completed } : item
    ));
  };

  const uniqueTopics = [...new Set(items.map(i => i.topic))].sort();

  const filteredItems = items.filter(item => {
    const matchesSearch = !searchQuery || item.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDifficulty = difficultyFilter === 'All' || item.difficulty === difficultyFilter;
    const matchesTopic = topicFilter === 'All' || item.topic === topicFilter;
    const matchesAccess = accessFilter === 'All' || (accessFilter === 'Free' ? !item.premium : item.premium);
    return matchesSearch && matchesDifficulty && matchesTopic && matchesAccess;
  });

  const sections = Array.from(new Set(items.map(i => i.section)));
  const allCollapsed = sections.every(s => collapsedSections[s]);

  const toggleAllSections = () => {
    const newState = {};
    sections.forEach(s => { newState[s] = !allCollapsed; });
    setCollapsedSections(newState);
  };

  const getSectionIcon = (section) => {
    switch (section) {
      case 'Synchronization Primitives': return <Lock size={16} style={{ color: ACCENT }} />;
      case 'Locking Strategies': return <Layers size={16} style={{ color: ACCENT }} />;
      case 'Lock-Free and Wait-Free Programming': return <Cpu size={16} style={{ color: ACCENT }} />;
      case 'Concurrency Challenges': return <AlertTriangle size={16} style={{ color: ACCENT }} />;
      case 'Concurrency Patterns': return <Shuffle size={16} style={{ color: ACCENT }} />;
      case 'Classic Problems': return <Puzzle size={16} style={{ color: ACCENT }} />;
      case 'Thread-Safe Data Structures': return <Database size={16} style={{ color: ACCENT }} />;
      case 'Multithreading Algorithms': return <BookOpen size={16} style={{ color: ACCENT }} />;
      case 'Concurrency Design Questions': return <MessageSquare size={16} style={{ color: ACCENT }} />;
      default: return <Lock size={16} style={{ color: ACCENT }} />;
    }
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

  const DifficultyBadge = ({ difficulty }) => (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
      difficulty === 'Easy' ? 'text-[#a78bfa]' :
      difficulty === 'Medium' ? 'text-[#eab308]' :
      'text-[#ef4444]'
    }`}>
      {difficulty}
    </span>
  );

  const AccessBadge = ({ premium }) => (
    premium ? (
      <span className="text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider text-amber-400 border-amber-400/30 bg-amber-400/10">
        Premium
      </span>
    ) : (
      <span className="text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider text-gray-400 border-gray-600/40 bg-gray-600/10">
        Free
      </span>
    )
  );

  return (
    <div className="bg-[#0a0a0a] min-h-screen text-gray-300 p-8 font-sans">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start mb-8 gap-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Concurrency Practice</h1>
            <p className="text-gray-400 text-sm mb-4">Write actual multi-threaded code for classic concurrency interview problems.</p>
            <a href="https://algomaster.io/practice/concurrency" target="_blank" rel="noopener noreferrer" className="text-sm font-medium hover:underline flex items-center gap-1" style={{ color: ACCENT }}>How it Works ↓</a>
          </div>

          <div className="flex items-center gap-6 bg-[#171717] p-4 rounded-xl border border-gray-800 shadow-lg shadow-black/20">
            <div className="relative w-20 h-20 rounded-full bg-[#262626] flex items-center justify-center border-4 border-[#262626]">
              <div className="absolute inset-0 rounded-full border-4" style={{ borderColor: ACCENT, clipPath: `inset(${100 - pct}% 0 0 0)` }}></div>
              <div className="text-center z-10">
                <div className="text-lg font-bold text-white leading-none">{completed}/{total}</div>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="text-center">
                <div className="text-xs mb-1" style={{ color: ACCENT }}>Easy</div>
                <div className="text-white font-bold">{easyDone}<span className="text-gray-500 text-sm">/{easyTotal}</span></div>
              </div>
              <div className="text-center">
                <div className="text-[#eab308] text-xs mb-1">Medium</div>
                <div className="text-white font-bold">{medDone}<span className="text-gray-500 text-sm">/{medTotal}</span></div>
              </div>
              <div className="text-center">
                <div className="text-[#ef4444] text-xs mb-1">Hard</div>
                <div className="text-white font-bold">{hardDone}<span className="text-gray-500 text-sm">/{hardTotal}</span></div>
              </div>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col md:flex-row gap-4 mb-6 items-center justify-between">
          <div className="flex gap-4 items-center text-sm text-gray-400 flex-wrap">
            <span>📁 {sections.length} sections</span>
            <span>📄 {items.length} problems</span>
            <span style={{ color: ACCENT }}>✓ {completed} completed</span>
          </div>
          <button
            onClick={toggleAllSections}
            className="text-sm text-gray-400 hover:text-white flex items-center gap-1"
          >
            {allCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
            {allCollapsed ? 'Expand All' : 'Collapse All'}
          </button>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1 max-w-lg">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Search problems..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#171717] border border-gray-800 rounded-md py-2 pl-9 pr-4 text-sm text-gray-200 focus:outline-none focus:border-[#a78bfa]"
            />
          </div>

          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <span>Topic:</span>
              <select
                value={topicFilter}
                onChange={(e) => setTopicFilter(e.target.value)}
                className="bg-[#171717] border border-gray-800 rounded-md py-2 px-3 text-white focus:outline-none focus:border-[#a78bfa] max-w-[180px] truncate"
              >
                <option>All</option>
                {uniqueTopics.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-400">
              <span>Access:</span>
              <select
                value={accessFilter}
                onChange={(e) => setAccessFilter(e.target.value)}
                className="bg-[#171717] border border-gray-800 rounded-md py-2 px-3 text-white focus:outline-none focus:border-[#a78bfa]"
              >
                <option>All</option>
                <option>Free</option>
                <option>Premium</option>
              </select>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-400">
              <span>Difficulty:</span>
              <select
                value={difficultyFilter}
                onChange={(e) => setDifficultyFilter(e.target.value)}
                className="bg-[#171717] border border-gray-800 rounded-md py-2 px-3 text-white focus:outline-none focus:border-[#a78bfa]"
              >
                <option>All</option>
                <option>Easy</option>
                <option>Medium</option>
                <option>Hard</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table structure */}
        <div className="w-full rounded-t-md overflow-hidden border border-gray-800">
          {/* Header Row (desktop only) */}
          <div className="hidden md:grid grid-cols-12 text-black font-semibold text-sm py-2 px-4 items-center" style={{ backgroundColor: ACCENT }}>
            <div className="col-span-1">Date</div>
            <div className="col-span-3">Problem</div>
            <div className="col-span-2 text-center">Notes</div>
            <div className="col-span-2">Topic</div>
            <div className="col-span-2 text-center">Access</div>
            <div className="col-span-1 text-center">Difficulty</div>
            <div className="col-span-1 text-center">Solved</div>
          </div>
          <div className="md:hidden text-black font-semibold text-xs py-2 px-4" style={{ backgroundColor: ACCENT }}>
            Problems
          </div>

          {/* Sections */}
          <div className="bg-[#0f0f0f]">
            {sections.map((section, sIdx) => {
              const sectionItems = filteredItems.filter(i => i.section === section);
              const isCollapsed = collapsedSections[section];
              const allSectionItems = items.filter(i => i.section === section);
              const sectionCompleted = allSectionItems.filter(i => i.completed).length;

              if (searchQuery && sectionItems.length === 0) return null;

              return (
                <div key={section}>
                  {/* Section Header */}
                  <div
                    className="grid grid-cols-12 bg-[#1e293b] text-gray-200 py-3 px-4 items-center cursor-pointer border-b border-gray-800/50 hover:bg-[#253347] transition-colors"
                    onClick={() => setCollapsedSections(prev => ({ ...prev, [section]: !isCollapsed }))}
                  >
                    <div className="col-span-1 text-sm text-gray-400">{sIdx + 1}</div>
                    <div className="col-span-11 flex items-center gap-2 text-sm font-semibold">
                      {isCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                      {getSectionIcon(section)}
                      <span className="text-white">{section}</span>
                      <span className="text-gray-500 font-normal text-xs ml-2">
                        ({sectionCompleted}/{allSectionItems.length} completed)
                      </span>
                    </div>
                  </div>

                  {/* Section Rows - desktop grid */}
                  {!isCollapsed && sectionItems.map((item, iIdx) => (
                    <div key={item.id} className={`hidden md:grid grid-cols-12 items-center py-3 px-4 border-b border-gray-800/50 hover:bg-[#1a1a1a] transition-colors ${iIdx % 2 === 1 ? 'bg-white/[0.02]' : ''}`}>
                      <div className="col-span-1 text-xs text-gray-500 whitespace-nowrap">{item.date}</div>
                      <div className="col-span-3 flex items-center gap-3">
                        <span className="text-gray-500 font-mono text-xs">&lt;/&gt;</span>
                        <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:underline underline-offset-2 text-sm transition-colors line-clamp-2" style={{ '--tw-text-opacity': 1 }} onMouseEnter={(e) => e.currentTarget.style.color = ACCENT} onMouseLeave={(e) => e.currentTarget.style.color = ''}>
                          {item.title}
                        </a>
                      </div>
                      <div className="col-span-2 flex items-center justify-center">
                        <button
                          onClick={(e) => { e.stopPropagation(); setActiveNoteItem(item); }}
                          className="p-1.5 rounded transition-colors hover:bg-gray-800"
                          style={{ color: item.note ? ACCENT : '#6b7280' }}
                          title={item.note ? "Edit Notes" : "Add Notes"}
                        >
                          <FileText size={16} />
                        </button>
                      </div>
                      <div className="col-span-2 text-xs text-gray-400 font-medium">
                        {item.topic || '-'}
                      </div>
                      <div className="col-span-2 text-center flex justify-center">
                        <AccessBadge premium={item.premium} />
                      </div>
                      <div className="col-span-1 text-center">
                        <DifficultyBadge difficulty={item.difficulty} />
                      </div>
                      <div className="col-span-1 flex justify-center cursor-pointer" onClick={() => toggleItem(item.id)}>
                        {item.completed ? (
                          <CheckCircle2 size={20} style={{ color: ACCENT }} />
                        ) : (
                          <Circle size={20} className="text-gray-500 hover:text-white transition-colors" />
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Section Rows - mobile stacked cards */}
                  {!isCollapsed && sectionItems.map((item, iIdx) => (
                    <div key={`m-${item.id}`} className={`md:hidden flex flex-col gap-2 px-4 py-3 border-b border-gray-800/50 ${iIdx % 2 === 1 ? 'bg-white/[0.02]' : ''}`}>
                      <div className="flex items-start justify-between gap-3">
                        <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-gray-200 text-sm font-medium flex-1 min-w-0">
                          {item.title}
                        </a>
                        <div className="flex items-center gap-2 shrink-0" onClick={() => toggleItem(item.id)}>
                          {item.completed ? (
                            <CheckCircle2 size={20} style={{ color: ACCENT }} />
                          ) : (
                            <Circle size={20} className="text-gray-500" />
                          )}
                        </div>
                      </div>
                      <div className="flex items-center flex-wrap gap-2 text-xs">
                        <span className="text-gray-500">{item.date}</span>
                        <DifficultyBadge difficulty={item.difficulty} />
                        <AccessBadge premium={item.premium} />
                        {item.topic && <span className="text-gray-400">{item.topic}</span>}
                        <button
                          onClick={(e) => { e.stopPropagation(); setActiveNoteItem(item); }}
                          className="ml-auto p-1 rounded transition-colors"
                          style={{ color: item.note ? ACCENT : '#6b7280' }}
                          title={item.note ? "Edit Notes" : "Add Notes"}
                        >
                          <FileText size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
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
