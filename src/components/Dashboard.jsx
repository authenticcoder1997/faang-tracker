import React, { useState } from 'react';
import { BookOpen, Layers, Monitor, TrendingUp, Zap, Target, ChevronLeft, ChevronRight, Calendar, CheckCircle2, Circle } from 'lucide-react';
import { DSA_SECTIONS_LIST } from '../data/dsaTopics';

export default function Dashboard({ dsa, lld, hld, setActiveTab }) {
  const sections = [
    {
      id: 'dsa',
      title: 'DSA Roadmap',
      icon: <BookOpen size={20} />,
      items: dsa,
      color: 'blue',
      description: 'Data Structures & Algorithms',
      gradient: 'from-blue-500/20 to-blue-600/5',
      accent: 'text-blue-400',
      border: 'border-blue-500/20',
      bar: 'bg-blue-400',
    },
    {
      id: 'lld',
      title: 'LLD Practice',
      icon: <Layers size={20} />,
      items: lld,
      color: 'purple',
      description: 'Low Level Design Problems',
      gradient: 'from-purple-500/20 to-purple-600/5',
      accent: 'text-purple-400',
      border: 'border-purple-500/20',
      bar: 'bg-purple-400',
    },
    {
      id: 'hld',
      title: 'System Design',
      icon: <Monitor size={20} />,
      items: hld,
      color: 'green',
      description: 'High Level System Design',
      gradient: 'from-green-500/20 to-green-600/5',
      accent: 'text-green-400',
      border: 'border-green-500/20',
      bar: 'bg-green-400',
    },
  ];

  const allItems = [...dsa, ...lld, ...hld];
  const totalCompleted = allItems.filter(i => i.completed).length;
  const totalItems = allItems.length;
  const overallPct = totalItems > 0 ? Math.round((totalCompleted / totalItems) * 100) : 0;


  const [currentDateObj, setCurrentDateObj] = useState(new Date(2026, 7, 23)); // Default to 23 Aug

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const formatViewDate = (dObj) => {
    const d = dObj.getDate().toString().padStart(2, '0');
    const m = monthNames[dObj.getMonth()];
    return `${d} ${m}`;
  };

  const shiftDate = (days) => {
    const newDate = new Date(currentDateObj.valueOf());
    newDate.setDate(newDate.getDate() + days);
    setCurrentDateObj(newDate);
  };

  const currentDateStr = formatViewDate(currentDateObj);

  // Find DSA sections for this date
  const dsaSecsForDate = DSA_SECTIONS_LIST.filter(s => s.date.startsWith(currentDateStr));
  const dsaItemsForDate = dsa.filter(item => dsaSecsForDate.some(s => s.name === item.section));

  const lldItemsForDate = lld.filter(i => i.date === currentDateStr);
  const hldItemsForDate = hld.filter(i => i.date === currentDateStr);

  const dailyTotal = dsaItemsForDate.length + lldItemsForDate.length + hldItemsForDate.length;
  const dailyCompleted = 
    dsaItemsForDate.filter(i=>i.completed).length + 
    lldItemsForDate.filter(i=>i.completed).length + 
    hldItemsForDate.filter(i=>i.completed).length;

  return (
    <div className="p-6 md:p-10 max-w-5xl">
      {/* Hero */}
      <div className="mb-10">
        <div className="flex items-center gap-2 text-green-400 text-sm font-semibold mb-2">
          <Zap size={16} />
          <span>Your FAANG Preparation Hub</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-black text-white mb-3">
          Dashboard
        </h1>
        <p className="text-gray-400 text-base max-w-lg">
          Track your daily study sessions across DSA, Low Level Design, and System Design. Stay consistent and crack FAANG.
        </p>
      </div>

      {/* Overall progress card */}
      <div className="mb-8 p-6 rounded-2xl bg-gray-900 border border-gray-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Target size={18} className="text-green-400" />
              <span className="text-sm font-semibold text-gray-300">Overall Progress</span>
            </div>
            <p className="text-4xl font-black text-white">{overallPct}<span className="text-xl text-gray-500">%</span></p>
          </div>
          <div className="flex gap-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{totalCompleted}</p>
              <p className="text-xs text-gray-500">Completed</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-400">{totalItems - totalCompleted}</p>
              <p className="text-xs text-gray-500">Remaining</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-200">{totalItems}</p>
              <p className="text-xs text-gray-500">Total</p>
            </div>
          </div>
        </div>
        <div className="w-full bg-gray-800 rounded-full h-3">
          <div
            className="bg-gradient-to-r from-green-500 to-green-400 h-3 rounded-full transition-all duration-700"
            style={{ width: `${overallPct}%` }}
          />
        </div>
      </div>

      
      {/* Daily Plan */}
      <div className="mb-8 bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-gray-800 bg-gray-800/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/10 text-green-400 rounded-lg">
              <Calendar size={20} />
            </div>
            <div>
              <h2 className="text-white font-bold text-lg">Daily Plan</h2>
              <p className="text-gray-400 text-xs">
                {dailyCompleted} of {dailyTotal} tasks completed
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => shiftDate(-1)}
              className="p-1.5 rounded-full hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <div className="text-green-400 font-mono font-bold w-16 text-center">{currentDateStr}</div>
            <button 
              onClick={() => shiftDate(1)}
              className="p-1.5 rounded-full hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        <div className="p-2">
          {dailyTotal === 0 ? (
            <div className="p-8 text-center text-gray-500 text-sm">
              No tasks scheduled for this day. Relax! ☕
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {dsaItemsForDate.length > 0 && (
                <div className="mb-2">
                  <div className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-blue-400">DSA</div>
                  {dsaItemsForDate.map(item => (
                    <div key={item.id} className="flex items-center justify-between px-4 py-2 hover:bg-gray-800/50 rounded-lg group">
                      <div className="flex items-center gap-3 overflow-hidden">
                        {item.completed ? <CheckCircle2 size={16} className="text-green-500 shrink-0" /> : <Circle size={16} className="text-gray-600 shrink-0" />}
                        <span className={`text-sm truncate ${item.completed ? 'text-gray-500 line-through' : 'text-gray-300'}`}>{item.title}</span>
                      </div>
                      <span className="text-[10px] text-gray-600 shrink-0">{item.section}</span>
                    </div>
                  ))}
                </div>
              )}
              {lldItemsForDate.length > 0 && (
                <div className="mb-2">
                  <div className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-purple-400">LLD</div>
                  {lldItemsForDate.map(item => (
                    <div key={item.id} className="flex items-center justify-between px-4 py-2 hover:bg-gray-800/50 rounded-lg group">
                      <div className="flex items-center gap-3 overflow-hidden">
                        {item.completed ? <CheckCircle2 size={16} className="text-green-500 shrink-0" /> : <Circle size={16} className="text-gray-600 shrink-0" />}
                        <span className={`text-sm truncate ${item.completed ? 'text-gray-500 line-through' : 'text-gray-300'}`}>{item.title}</span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full border border-gray-700 text-gray-400 shrink-0">{item.difficulty}</span>
                    </div>
                  ))}
                </div>
              )}
              {hldItemsForDate.length > 0 && (
                <div className="mb-2">
                  <div className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-green-400">HLD</div>
                  {hldItemsForDate.map(item => (
                    <div key={item.id} className="flex items-center justify-between px-4 py-2 hover:bg-gray-800/50 rounded-lg group">
                      <div className="flex items-center gap-3 overflow-hidden">
                        {item.completed ? <CheckCircle2 size={16} className="text-green-500 shrink-0" /> : <Circle size={16} className="text-gray-600 shrink-0" />}
                        <span className={`text-sm truncate ${item.completed ? 'text-gray-500 line-through' : 'text-gray-300'}`}>{item.title}</span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full border border-gray-700 text-gray-400 shrink-0">{item.difficulty}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Section cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        {sections.map(section => {
          const completed = section.items.filter(i => i.completed).length;
          const total = section.items.length;
          const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
          const easy = section.items.filter(i => i.difficulty === 'Easy');
          const medium = section.items.filter(i => i.difficulty === 'Medium');
          const hard = section.items.filter(i => i.difficulty === 'Hard');

          return (
            <button
              key={section.id}
              onClick={() => setActiveTab(section.id)}
              className={`text-left p-5 rounded-xl border ${section.border} bg-gradient-to-br ${section.gradient} hover:border-opacity-50 transition-all group`}
            >
              <div className={`flex items-center gap-2 mb-3 ${section.accent}`}>
                {section.icon}
                <span className="font-semibold text-sm">{section.title}</span>
              </div>
              <p className="text-xs text-gray-500 mb-3">{section.description}</p>
              <div className="flex justify-between items-end mb-2">
                <span className="text-2xl font-black text-white">{pct}%</span>
                <span className="text-xs text-gray-500 font-mono">{completed}/{total}</span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-1.5 mb-3">
                <div
                  className={`${section.bar} h-1.5 rounded-full transition-all duration-500`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="flex gap-3 text-xs">
                <span className="text-green-400">{easy.filter(i => i.completed).length}/{easy.length} Easy</span>
                <span className="text-yellow-400">{medium.filter(i => i.completed).length}/{medium.length} Med</span>
                <span className="text-red-400">{hard.filter(i => i.completed).length}/{hard.length} Hard</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Motivational */}
      <div className="p-5 rounded-xl bg-gray-900 border border-gray-800">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp size={16} className="text-green-400" />
          <span className="text-sm font-semibold text-gray-300">Daily Goal</span>
        </div>
        <p className="text-gray-400 text-sm">
          Aim for <span className="text-white font-semibold">2 DSA</span> + <span className="text-white font-semibold">1 LLD</span> + <span className="text-white font-semibold">1 System Design</span> problem per day.
          At this pace you'll be ready in <span className="text-green-400 font-semibold">3 months</span>. 🚀
        </p>
      </div>
    </div>
  );
}
