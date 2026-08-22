import React, { useState } from 'react';
import { CheckCircle2, Circle, Plus, Trash2, ExternalLink } from 'lucide-react';

export default function TrackerList({ title, items, setItems }) {
  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemUrl, setNewItemUrl] = useState('');

  const toggleItem = (id) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, completed: !item.completed } : item
    ));
  };

  const addItem = (e) => {
    e.preventDefault();
    if (!newItemTitle.trim()) return;
    
    const newItem = {
      id: Date.now().toString(),
      title: newItemTitle,
      url: newItemUrl.trim() || null,
      completed: false
    };
    
    setItems([newItem, ...items]);
    setNewItemTitle('');
    setNewItemUrl('');
  };

  const deleteItem = (id) => {
    setItems(items.filter(item => item.id !== id));
  };

  const completedCount = items.filter(item => item.completed).length;
  const progress = items.length === 0 ? 0 : Math.round((completedCount / items.length) * 100);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors">
      <div className="p-6 md:p-8 border-b border-gray-100 dark:border-gray-700">
        <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-6 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{title}</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Track your progress</p>
          </div>
          <span className="text-sm font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-4 py-2 rounded-full">
            {completedCount} / {items.length} Completed
          </span>
        </div>
        
        {/* Progress bar */}
        <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-3">
          <div 
            className="bg-gradient-to-r from-blue-500 to-indigo-500 h-3 rounded-full transition-all duration-500 ease-out" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      <div className="p-6 md:p-8">
        <form onSubmit={addItem} className="flex flex-col md:flex-row gap-3 mb-8 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
          <input
            type="text"
            value={newItemTitle}
            onChange={(e) => setNewItemTitle(e.target.value)}
            placeholder="Topic or question name..."
            className="flex-1 px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition-colors"
          />
          <input
            type="url"
            value={newItemUrl}
            onChange={(e) => setNewItemUrl(e.target.value)}
            placeholder="URL (optional)..."
            className="flex-1 px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition-colors"
          />
          <button
            type="submit"
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 active:transform active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Plus size={20} />
            Add
          </button>
        </form>

        <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
          {items.map((item) => (
            <div 
              key={item.id}
              className={`group flex items-center justify-between p-4 rounded-xl border transition-all duration-200 ${
                item.completed 
                  ? 'bg-blue-50/50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800' 
                  : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md'
              }`}
            >
              <div className="flex items-center gap-4 flex-1 overflow-hidden">
                <button 
                  onClick={() => toggleItem(item.id)}
                  className="flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full"
                >
                  {item.completed ? (
                    <CheckCircle2 className="text-blue-600 dark:text-blue-500 transition-transform hover:scale-110" size={26} />
                  ) : (
                    <Circle className="text-gray-300 dark:text-gray-600 transition-transform hover:scale-110 group-hover:text-blue-400" size={26} />
                  )}
                </button>
                <div className="flex flex-col truncate">
                  <div className="flex items-center gap-2">
                    <span className={`font-medium truncate transition-colors ${
                      item.completed 
                        ? 'text-gray-500 dark:text-gray-400 line-through' 
                        : 'text-gray-800 dark:text-gray-200'
                    }`}>
                      {item.title}
                    </span>
                    {item.difficulty && (
                      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                        item.difficulty.toLowerCase() === 'easy' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                        item.difficulty.toLowerCase() === 'medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                        item.difficulty.toLowerCase() === 'hard' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                        'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                      }`}>
                        {item.difficulty}
                      </span>
                    )}
                  </div>
                  {item.url && (
                    <a 
                      href={item.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1 mt-1 w-fit"
                    >
                      <ExternalLink size={12} />
                      Open Resource
                    </a>
                  )}
                </div>
              </div>
              <button 
                onClick={() => deleteItem(item.id)}
                className="text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 ml-4 flex-shrink-0"
                aria-label="Delete item"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}
          {items.length === 0 && (
            <div className="text-center py-12 flex flex-col items-center">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                <Plus className="text-gray-400" size={32} />
              </div>
              <p className="text-gray-500 dark:text-gray-400 font-medium text-lg">No items found</p>
              <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Add a new topic or question above to get started!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
