import React, { useState } from 'react';
import { ChevronDown, ChevronRight, BookOpen, PlayCircle, History, Gamepad2, Search, Database, Settings2, AppWindow, Network, MessageSquare, CreditCard, ShoppingCart, Wrench, CheckCircle2, Circle, FileText } from 'lucide-react';
import NoteModal from './NoteModal';

// Design patterns that have their own page under algomaster.io/learn/lld/<slug>.
// Not every "pattern" tag in our data is a GoF pattern (some are just underlying
// techniques like Backtracking/Trie/Graph) - those are left as plain text.
const PATTERN_SLUGS = {
  'singleton': 'singleton',
  'factory': 'factory-method',
  'factory method': 'factory-method',
  'abstract factory': 'abstract-factory',
  'builder': 'builder',
  'prototype': 'prototype',
  'adapter': 'adapter',
  'facade': 'facade',
  'decorator': 'decorator',
  'composite': 'composite',
  'proxy': 'proxy',
  'bridge': 'bridge',
  'flyweight': 'flyweight',
  'iterator': 'iterator',
  'observer': 'observer',
  'strategy': 'strategy',
  'command': 'command',
  'state': 'state',
  'template method': 'template-method',
  'visitor': 'visitor',
  'mediator': 'mediator',
  'memento': 'memento',
  'chain of responsibility': 'chain-of-responsibility',
};

function patternSlug(name) {
  // Normalize "Strategy (Settlement)" -> "strategy", etc.
  const key = name.trim().toLowerCase().replace(/\s*\([^)]*\)\s*/g, '').trim();
  return PATTERN_SLUGS[key];
}

// Renders a comma-separated pattern string as individual pieces, linking out
// to algomaster.io/learn/lld/<pattern> for the ones that have a page there.
function PatternTags({ pattern, className = '', linkClassName = '' }) {
  if (!pattern) return <span className={className}>-</span>;
  const parts = pattern.split(',').map(p => p.trim()).filter(Boolean);
  return (
    <span className={className}>
      {parts.map((part, idx) => {
        const slug = patternSlug(part);
        return (
          <React.Fragment key={part}>
            {idx > 0 && ', '}
            {slug ? (
              <a
                href={`https://algomaster.io/learn/lld/${slug}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className={`hover:underline underline-offset-2 ${linkClassName}`}
                title={`View "${part}" pattern on AlgoMaster`}
              >
                {part}
              </a>
            ) : part}
          </React.Fragment>
        );
      })}
    </span>
  );
}

export default function LldTracker({ items, setItems }) {
  const [collapsedSections, setCollapsedSections] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [patternFilter, setPatternFilter] = useState('All');
  const [activeNoteItem, setActiveNoteItem] = useState(null);

  const toggleItem = (id) => {
    setItems(items.map(item =>
      item.id === id ? { ...item, completed: !item.completed } : item
    ));
  };

  const allPatternsRaw = items.flatMap(i => (i.pattern || '').split(',').map(p => p.trim())).filter(Boolean);
  const uniquePatterns = [...new Set(allPatternsRaw)].sort();

  // Filter items by search, difficulty, priority, and pattern
  const filteredItems = items.filter(item => {
    const matchesSearch = !searchQuery || item.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDifficulty = difficultyFilter === 'All' || item.difficulty === difficultyFilter;
    const matchesPriority = priorityFilter === 'All' || item.priority === priorityFilter;
    const matchesPattern = patternFilter === 'All' || (item.pattern && item.pattern.includes(patternFilter));
    return matchesSearch && matchesDifficulty && matchesPriority && matchesPattern;
  });

  const sections = Array.from(new Set(items.map(i => i.section)));
  const allCollapsed = sections.every(s => collapsedSections[s]);

  const toggleAllSections = () => {
    const newState = {};
    sections.forEach(s => { newState[s] = !allCollapsed; });
    setCollapsedSections(newState);
  };

  const getSectionIcon = (section) => {
    switch(section) {
      case 'Games & Puzzles': return <Gamepad2 size={16} className="text-emerald-500" />;
      case 'Data Structures & Search': return <Database size={16} className="text-emerald-500" />;
      case 'Managing States': return <Settings2 size={16} className="text-emerald-500" />;
      case 'Management Systems': return <AppWindow size={16} className="text-emerald-500" />;
      case 'Social & Content Platforms': return <Network size={16} className="text-emerald-500" />;
      case 'Communication & Messaging': return <MessageSquare size={16} className="text-emerald-500" />;
      case 'Financial & Payment Systems': return <CreditCard size={16} className="text-emerald-500" />;
      case 'E-commerce & Booking Systems': return <ShoppingCart size={16} className="text-emerald-500" />;
      case 'Developer Tools & Infrastructure': return <Wrench size={16} className="text-emerald-500" />;
      default: return <Gamepad2 size={16} className="text-emerald-500" />;
    }
  };

  // Count completed
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
    <div className="bg-canvas min-h-screen text-secondary p-8 font-sans">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start mb-8 gap-6">
          <div>
            <h1 className="text-3xl font-bold text-ink mb-2">Low Level Design Practice</h1>
            <p className="text-muted text-sm mb-4">Practice for Low Level Design Interviews step-by-step with AI powered evaluation and feedback</p>
            <a href="https://algomaster.io/learn/lld" target="_blank" rel="noopener noreferrer" className="text-emerald-500 text-sm font-medium hover:underline flex items-center gap-1">View on Algomaster ↓</a>
          </div>

          <div className="flex items-center gap-6 bg-field p-4 rounded-xl border border-line shadow-lg shadow-black/20">
            <div className="relative w-20 h-20 rounded-full bg-selected flex items-center justify-center border-4 border-line">
              <div className="absolute inset-0 rounded-full border-4 border-[#10b981]" style={{ clipPath: `inset(${100 - pct}% 0 0 0)` }}></div>
              <div className="text-center z-10">
                <div className="text-lg font-bold text-ink leading-none">{completed}/{total}</div>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="text-center">
                <div className="text-emerald-500 text-xs mb-1">Easy</div>
                <div className="text-ink font-bold">{easyDone}<span className="text-muted text-sm">/{easyTotal}</span></div>
              </div>
              <div className="text-center">
                <div className="text-yellow-500 text-xs mb-1">Medium</div>
                <div className="text-ink font-bold">{medDone}<span className="text-muted text-sm">/{medTotal}</span></div>
              </div>
              <div className="text-center">
                <div className="text-red-500 text-xs mb-1">Hard</div>
                <div className="text-ink font-bold">{hardDone}<span className="text-muted text-sm">/{hardTotal}</span></div>
              </div>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col md:flex-row gap-4 mb-6 items-center justify-between">
          <div className="flex gap-4 items-center text-sm text-muted">
            <span>📁 {sections.length} sections</span>
            <span>📄 {items.length} problems</span>
            <span className="text-emerald-500">✓ {completed} completed</span>
          </div>
          <button
            onClick={toggleAllSections}
            className="text-sm text-muted hover:text-ink flex items-center gap-1"
          >
            {allCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
            {allCollapsed ? 'Expand All' : 'Collapse All'}
          </button>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1 max-w-lg">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              placeholder="Search problems..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-field border border-line rounded-md py-2 pl-9 pr-4 text-sm text-ink focus:outline-none focus:border-[#10b981]"
            />
          </div>

          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2 text-sm text-muted">
              <span>Pattern:</span>
              <select
                value={patternFilter}
                onChange={(e) => setPatternFilter(e.target.value)}
                className="bg-field border border-line rounded-md py-2 px-3 text-ink focus:outline-none focus:border-[#10b981] max-w-[150px] truncate"
              >
                <option>All</option>
                {uniquePatterns.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted">
              <span>Priority:</span>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="bg-field border border-line rounded-md py-2 px-3 text-ink focus:outline-none focus:border-[#10b981]"
              >
                <option>All</option>
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
              </select>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted">
              <span>Difficulty:</span>
              <select
                value={difficultyFilter}
                onChange={(e) => setDifficultyFilter(e.target.value)}
                className="bg-field border border-line rounded-md py-2 px-3 text-ink focus:outline-none focus:border-[#10b981]"
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
        <div className="w-full rounded-t-md overflow-hidden border border-line">
          {/* Header Row (desktop only - mobile uses stacked cards) */}
          <div className="hidden md:grid grid-cols-12 bg-[#10b981] text-black font-semibold text-sm py-2 px-4 items-center">
            <div className="col-span-1">Date</div>
            <div className="col-span-3">Problem</div>
            <div className="col-span-2 text-center">Notes</div>
            <div className="col-span-2">Pattern</div>
            <div className="col-span-2 text-center">Priority</div>
            <div className="col-span-1 text-center">Difficulty</div>
            <div className="col-span-1 text-center">Solved</div>
          </div>
          <div className="md:hidden bg-[#10b981] text-black font-semibold text-xs py-2 px-4">
            Problems
          </div>

          {/* Sections */}
          <div className="bg-surface">
            {sections.map((section, sIdx) => {
              const sectionItems = filteredItems.filter(i => i.section === section);
              const isCollapsed = collapsedSections[section];
              const allSectionItems = items.filter(i => i.section === section);
              const sectionCompleted = allSectionItems.filter(i => i.completed).length;

              // Skip sections with no matching items when filtering
              if (searchQuery && sectionItems.length === 0) return null;

              return (
                <div key={section}>
                  {/* Section Header */}
                  <div
                    className="grid grid-cols-12 bg-selected text-ink py-3 px-4 items-center cursor-pointer border-b border-line hover:bg-selected transition-colors"
                    onClick={() => setCollapsedSections(prev => ({...prev, [section]: !isCollapsed}))}
                  >
                    <div className="col-span-1 text-sm text-muted">{sIdx + 1}</div>
                    <div className="col-span-11 flex items-center gap-2 text-sm font-semibold">
                      {isCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                      {getSectionIcon(section)}
                      <span className="text-ink">{section}</span>
                      <span className="text-muted font-normal text-xs ml-2">
                        ({sectionCompleted}/{allSectionItems.length} completed)
                      </span>
                    </div>
                  </div>

                  {/* Section Rows - desktop grid */}
                  {!isCollapsed && sectionItems.map((item, iIdx) => (
                    <div key={item.id} className={`hidden md:grid grid-cols-12 items-center py-3 px-4 border-b border-line hover:bg-field transition-colors ${iIdx % 2 === 1 ? 'bg-hover' : ''}`}>
                      <div className="col-span-1 text-xs text-muted whitespace-nowrap">{item.date}</div>
                      <div className="col-span-3 flex items-center gap-3">
                        <span className="text-muted font-mono text-xs">&lt;/&gt;</span>
                        <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-secondary hover:text-emerald-500 hover:underline underline-offset-2 text-sm transition-colors line-clamp-2">
                          {item.title}
                        </a>
                      </div>
                      <div className="col-span-2 flex items-center justify-center">
                        <button
                          onClick={(e) => { e.stopPropagation(); setActiveNoteItem(item); }}
                          className={`p-1.5 rounded transition-colors ${item.note ? 'text-emerald-500 hover:bg-[#10b981]/10' : 'text-muted hover:text-secondary hover:bg-selected'}`}
                          title={item.note ? "Edit Notes" : "Add Notes"}
                        >
                          <FileText size={16} />
                        </button>
                      </div>
                      <div className="col-span-2 text-xs text-muted font-medium">
                        <PatternTags pattern={item.pattern} linkClassName="text-secondary hover:text-emerald-500" />
                      </div>
                      <div className="col-span-2 text-center flex justify-center">
                        {item.priority ? (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${
                            item.priority === 'High'
                              ? 'text-rose-400 border-rose-400/30 bg-rose-400/10'
                              : item.priority === 'Medium'
                              ? 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10'
                              : 'text-green-400 border-green-400/30 bg-green-400/10'
                          }`}>
                            {item.priority}
                          </span>
                        ) : (
                          <span className="text-muted text-xs">-</span>
                        )}
                      </div>
                      <div className="col-span-1 text-center">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          item.difficulty === 'Easy' ? 'text-emerald-500' :
                          item.difficulty === 'Medium' ? 'text-yellow-500' :
                          'text-red-500'
                        }`}>
                          {item.difficulty}
                        </span>
                      </div>
                      {/* Solved Checkbox */}
                      <div className="col-span-1 flex justify-center cursor-pointer" onClick={() => toggleItem(item.id)}>
                        {item.completed ? (
                          <CheckCircle2 size={20} className="text-emerald-500" />
                        ) : (
                          <Circle size={20} className="text-muted hover:text-emerald-500 transition-colors" />
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Section Rows - mobile stacked cards */}
                  {!isCollapsed && sectionItems.map((item, iIdx) => (
                    <div key={`m-${item.id}`} className={`md:hidden flex flex-col gap-2 px-4 py-3 border-b border-line ${iIdx % 2 === 1 ? 'bg-hover' : ''}`}>
                      <div className="flex items-start justify-between gap-3">
                        <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-ink hover:text-emerald-500 text-sm font-medium flex-1 min-w-0">
                          {item.title}
                        </a>
                        <div className="flex items-center gap-2 shrink-0" onClick={() => toggleItem(item.id)}>
                          {item.completed ? (
                            <CheckCircle2 size={20} className="text-emerald-500" />
                          ) : (
                            <Circle size={20} className="text-muted" />
                          )}
                        </div>
                      </div>
                      <div className="flex items-center flex-wrap gap-2 text-xs">
                        <span className="text-muted">{item.date}</span>
                        <span className={`font-semibold px-2 py-0.5 rounded-full ${
                          item.difficulty === 'Easy' ? 'text-emerald-500' :
                          item.difficulty === 'Medium' ? 'text-yellow-500' :
                          'text-red-500'
                        }`}>
                          {item.difficulty}
                        </span>
                        {item.priority && (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${
                            item.priority === 'High'
                              ? 'text-rose-400 border-rose-400/30 bg-rose-400/10'
                              : item.priority === 'Medium'
                              ? 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10'
                              : 'text-green-400 border-green-400/30 bg-green-400/10'
                          }`}>
                            {item.priority}
                          </span>
                        )}
                        {item.pattern && <PatternTags pattern={item.pattern} className="text-muted" linkClassName="text-secondary hover:text-emerald-500" />}
                        <button
                          onClick={(e) => { e.stopPropagation(); setActiveNoteItem(item); }}
                          className={`ml-auto p-1 rounded transition-colors ${item.note ? 'text-emerald-500' : 'text-muted'}`}
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
