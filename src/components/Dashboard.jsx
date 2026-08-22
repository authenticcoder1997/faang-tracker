import React from 'react';
import { BookOpen, Layers, Monitor } from 'lucide-react';

export default function Dashboard({ dsa, lld, hld }) {
  const getProgress = (items) => {
    if (!items || items.length === 0) return 0;
    const completed = items.filter(i => i.completed).length;
    return Math.round((completed / items.length) * 100);
  };

  const dsaProgress = getProgress(dsa);
  const lldProgress = getProgress(lld);
  const hldProgress = getProgress(hld);
  
  const totalItems = dsa.length + lld.length + hld.length;
  const totalCompleted = dsa.filter(i=>i.completed).length + lld.filter(i=>i.completed).length + hld.filter(i=>i.completed).length;
  const overallProgress = totalItems === 0 ? 0 : Math.round((totalCompleted / totalItems) * 100);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-2">Overall Progress</h2>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 h-4 rounded-full transition-all duration-300" style={{ width: `${overallProgress}%` }}></div>
            </div>
          </div>
          <span className="text-2xl font-bold text-blue-600">{overallProgress}%</span>
        </div>
        <p className="text-gray-500 mt-2">You have completed {totalCompleted} out of {totalItems} topics.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          title="DSA Progress" 
          progress={dsaProgress} 
          icon={<BookOpen size={24} className="text-blue-500" />} 
          color="bg-blue-500" 
        />
        <StatCard 
          title="LLD Progress" 
          progress={lldProgress} 
          icon={<Layers size={24} className="text-purple-500" />} 
          color="bg-purple-500" 
        />
        <StatCard 
          title="System Design (HLD)" 
          progress={hldProgress} 
          icon={<Monitor size={24} className="text-emerald-500" />} 
          color="bg-emerald-500" 
        />
      </div>
    </div>
  );
}

function StatCard({ title, progress, icon, color }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col items-center text-center">
      <div className="p-4 rounded-full bg-gray-50 mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-gray-800 mb-2">{title}</h3>
      <div className="text-3xl font-bold text-gray-900 mb-4">{progress}%</div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div className={`${color} h-2 rounded-full transition-all duration-300`} style={{ width: `${progress}%` }}></div>
      </div>
    </div>
  );
}
