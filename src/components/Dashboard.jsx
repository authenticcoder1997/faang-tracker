import React from 'react';
import { BookOpen, Layers, Monitor, Target } from 'lucide-react';

export default function Dashboard({ dsa, lld, hld }) {
  const getProgress = (items) => {
    if (!items || items.length === 0) return 0;
    const completed = items.filter(i => i.completed).length;
    return Math.round((completed / items.length) * 100);
  };

  const dsaProgress = getProgress(dsa);
  const lldProgress = getProgress(lld);
  const hldProgress = getProgress(hld);
  
  const totalItems = (dsa?.length || 0) + (lld?.length || 0) + (hld?.length || 0);
  const totalCompleted = 
    (dsa?.filter(i=>i.completed).length || 0) + 
    (lld?.filter(i=>i.completed).length || 0) + 
    (hld?.filter(i=>i.completed).length || 0);
    
  const overallProgress = totalItems === 0 ? 0 : Math.round((totalCompleted / totalItems) * 100);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5 dark:opacity-10 pointer-events-none">
          <Target size={120} />
        </div>
        
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2 relative z-10">Overall Journey</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-8 relative z-10">You have completed {totalCompleted} out of {totalItems} topics.</p>
        
        <div className="flex items-center gap-6 relative z-10">
          <div className="flex-1">
            <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-4 shadow-inner">
              <div 
                className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 h-4 rounded-full transition-all duration-1000 ease-out relative" 
                style={{ width: `${overallProgress}%` }}
              >
                <div className="absolute inset-0 bg-white/20 rounded-full w-full h-full" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)' }}></div>
              </div>
            </div>
          </div>
          <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
            {overallProgress}%
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          title="DSA Progress" 
          progress={dsaProgress} 
          completed={dsa?.filter(i=>i.completed).length || 0}
          total={dsa?.length || 0}
          icon={<BookOpen size={28} className="text-blue-500" />} 
          colorFrom="from-blue-400"
          colorTo="to-blue-600"
        />
        <StatCard 
          title="LLD Progress" 
          progress={lldProgress} 
          completed={lld?.filter(i=>i.completed).length || 0}
          total={lld?.length || 0}
          icon={<Layers size={28} className="text-purple-500" />} 
          colorFrom="from-purple-400"
          colorTo="to-purple-600"
        />
        <StatCard 
          title="System Design" 
          progress={hldProgress} 
          completed={hld?.filter(i=>i.completed).length || 0}
          total={hld?.length || 0}
          icon={<Monitor size={28} className="text-emerald-500" />} 
          colorFrom="from-emerald-400"
          colorTo="to-emerald-600" 
        />
      </div>
    </div>
  );
}

function StatCard({ title, progress, completed, total, icon, colorFrom, colorTo }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 flex flex-col items-center text-center transition-transform hover:-translate-y-1 hover:shadow-md duration-300">
      <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-900/50 mb-5 border border-gray-100 dark:border-gray-700 shadow-sm">
        {icon}
      </div>
      <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-1">{title}</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{completed} / {total} Completed</p>
      <div className="text-3xl font-black text-gray-900 dark:text-white mb-5">{progress}%</div>
      <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
        <div 
          className={`bg-gradient-to-r ${colorFrom} ${colorTo} h-2 rounded-full transition-all duration-1000 ease-out`} 
          style={{ width: `${progress}%` }}
        ></div>
      </div>
    </div>
  );
}
