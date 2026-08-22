import React from 'react';
import { Target, CheckCircle2, ArrowRight, Play, BookOpen, Layers, Monitor } from 'lucide-react';

export default function DailyHome({ dsa, lld, hld, setActiveTab }) {
  // Find first uncompleted tasks
  const nextDsa = dsa.filter(i => !i.completed).slice(0, 2);
  const nextLld = lld.filter(i => !i.completed).slice(0, 1);
  const nextHld = hld.filter(i => !i.completed).slice(0, 1);

  const todayTasks = [
    ...nextDsa.map(t => ({ ...t, type: 'DSA', icon: <BookOpen size={16}/>, color: 'text-[#d97736]', bg: 'bg-[#d97736]/10' })),
    ...nextLld.map(t => ({ ...t, type: 'LLD', icon: <Layers size={16}/>, color: 'text-[#22c55e]', bg: 'bg-[#22c55e]/10' })),
    ...nextHld.map(t => ({ ...t, type: 'System Design', icon: <Monitor size={16}/>, color: 'text-[#2dd4bf]', bg: 'bg-[#2dd4bf]/10' }))
  ];

  const totalDsa = dsa.filter(i => i.completed).length;
  const totalLld = lld.filter(i => i.completed).length;
  const totalHld = hld.filter(i => i.completed).length;

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto font-sans">
      <div className="mb-10">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Daily Workspace</h1>
        <p className="text-gray-400">Welcome back! Here is your personalized plan for today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {/* Progress Cards */}
        <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition-all cursor-pointer" onClick={() => setActiveTab('dsa')}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-[#d97736] font-semibold flex items-center gap-2"><BookOpen size={18}/> DSA Progress</h3>
            <span className="text-xs text-gray-500 font-mono">{totalDsa}/{dsa.length}</span>
          </div>
          <div className="w-full bg-gray-900 rounded-full h-2 mb-2">
            <div className="bg-[#d97736] h-2 rounded-full" style={{ width: `${(totalDsa/dsa.length)*100}%` }}></div>
          </div>
          <p className="text-xs text-gray-400">Continue your Planly roadmap →</p>
        </div>

        <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition-all cursor-pointer" onClick={() => setActiveTab('lld')}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-[#22c55e] font-semibold flex items-center gap-2"><Layers size={18}/> LLD Practice</h3>
            <span className="text-xs text-gray-500 font-mono">{totalLld}/{lld.length}</span>
          </div>
          <div className="w-full bg-gray-900 rounded-full h-2 mb-2">
            <div className="bg-[#22c55e] h-2 rounded-full" style={{ width: `${(totalLld/lld.length)*100}%` }}></div>
          </div>
          <p className="text-xs text-gray-400">Master Object Oriented Design →</p>
        </div>

        <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition-all cursor-pointer" onClick={() => setActiveTab('hld')}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-[#2dd4bf] font-semibold flex items-center gap-2"><Monitor size={18}/> System Design</h3>
            <span className="text-xs text-gray-500 font-mono">{totalHld}/{hld.length}</span>
          </div>
          <div className="w-full bg-gray-900 rounded-full h-2 mb-2">
            <div className="bg-[#2dd4bf] h-2 rounded-full" style={{ width: `${(totalHld/hld.length)*100}%` }}></div>
          </div>
          <p className="text-xs text-gray-400">Guided practice & breakdowns →</p>
        </div>
      </div>

      <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl overflow-hidden">
        <div className="p-5 border-b border-gray-800 flex items-center gap-2">
          <Target size={20} className="text-blue-400" />
          <h2 className="text-lg font-bold text-white">Today's Focus</h2>
        </div>
        
        {todayTasks.length === 0 ? (
          <div className="p-10 text-center text-gray-500">
            <CheckCircle2 size={48} className="mx-auto mb-4 text-green-500 opacity-50" />
            <p>You've completed all tasks! Amazing job.</p>
          </div>
        ) : (
          <div>
            {todayTasks.map((task, idx) => (
              <div key={task.id} className={`p-4 flex items-center justify-between hover:bg-gray-800/50 transition-colors ${idx !== todayTasks.length -1 ? 'border-b border-gray-800/50' : ''}`}>
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-lg ${task.bg} ${task.color}`}>
                    {task.icon}
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">{task.type} • {task.difficulty || task.section}</div>
                    <a href={task.url} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-gray-200 hover:text-white transition-colors">
                      {task.title}
                    </a>
                  </div>
                </div>
                <button 
                  onClick={() => setActiveTab(task.type.toLowerCase() === 'system design' ? 'hld' : task.type.toLowerCase())}
                  className="flex items-center gap-2 text-xs font-semibold px-4 py-2 bg-gray-800 text-gray-300 rounded hover:bg-gray-700 transition-colors"
                >
                  <Play size={12} /> Jump In
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
