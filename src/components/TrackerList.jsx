import React, { useState } from 'react';
import { CheckCircle2, Circle, Plus, Trash2 } from 'lucide-react';

export default function TrackerList({ title, items, setItems }) {
  const [newItemTitle, setNewItemTitle] = useState('');

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
      completed: false
    };
    
    setItems([...items, newItem]);
    setNewItemTitle('');
  };

  const deleteItem = (id) => {
    setItems(items.filter(item => item.id !== id));
  };

  const completedCount = items.filter(item => item.completed).length;
  const progress = items.length === 0 ? 0 : Math.round((completedCount / items.length) * 100);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-100">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">{title}</h2>
          <span className="text-sm font-medium text-gray-500">{completedCount} / {items.length} Completed</span>
        </div>
        
        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
        </div>
      </div>

      <div className="p-6">
        <form onSubmit={addItem} className="flex gap-2 mb-6">
          <input
            type="text"
            value={newItemTitle}
            onChange={(e) => setNewItemTitle(e.target.value)}
            placeholder="Add new topic or question..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Plus size={20} />
            Add
          </button>
        </form>

        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
          {items.map((item) => (
            <div 
              key={item.id}
              className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${item.completed ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200 hover:border-blue-300'}`}
            >
              <button 
                onClick={() => toggleItem(item.id)}
                className="flex items-center gap-3 flex-1 text-left"
              >
                {item.completed ? (
                  <CheckCircle2 className="text-blue-600 flex-shrink-0" size={24} />
                ) : (
                  <Circle className="text-gray-400 flex-shrink-0" size={24} />
                )}
                <span className={`text-gray-700 ${item.completed ? 'line-through opacity-70' : ''}`}>
                  {item.title}
                </span>
              </button>
              <button 
                onClick={() => deleteItem(item.id)}
                className="text-gray-400 hover:text-red-500 p-2 rounded-full hover:bg-red-50 transition-colors ml-4"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}
          {items.length === 0 && (
            <p className="text-center text-gray-500 py-8">No items found. Add one above!</p>
          )}
        </div>
      </div>
    </div>
  );
}
