const fs = require('fs');
let content = fs.readFileSync('src/components/DailyHome.jsx', 'utf8');

// Replace the date initialization logic
const newDateLogic = `
  // Calculate default today's index
  const now = new Date();
  const todayDay = now.getDate();
  const todayMonth = now.getMonth(); // 0-indexed: 6=Jul, 7=Aug, 8=Sep

  let initialIndex = 23; // fallback to 23 Aug
  if (todayMonth === 6 && todayDay === 31) initialIndex = 0; // Jul 31
  else if (todayMonth === 7) initialIndex = todayDay; // Aug 1-31 -> 1-31
  else if (todayMonth === 8) initialIndex = 31 + todayDay; // Sep 1-30 -> 32-61
  else if (todayMonth === 9) initialIndex = 61 + todayDay; // Oct
  else if (todayMonth === 10) initialIndex = 92 + todayDay; // Nov
  
  const lldStartIndex = 23;
  const hldStartIndex = 23;
`;
content = content.replace(
  /\/\/ Calculate default today's index[\s\S]*?const hldStartIndex = 22;/,
  newDateLogic
);

// Add icons to imports if missing
if (!content.includes('ChevronLeft')) {
  content = content.replace(
    /import { ([^}]+) } from "lucide-react";/,
    'import { $1, ChevronLeft, ChevronRight } from "lucide-react";'
  );
}

// Add the Prev/Next buttons next to the Select
const newSelectHtml = `
        {/* Date Selector */}
        <div className="bg-[#141414] border border-gray-800 rounded-lg p-2 flex items-center gap-2 w-full sm:w-auto">
          <button 
            onClick={() => setSelectedDayIndex(initialIndex)}
            className="px-3 py-1.5 bg-[#1a1a1a] border border-gray-700 text-gray-300 hover:text-white text-xs font-semibold rounded hover:bg-gray-800 transition-colors hidden sm:block"
          >
            Today
          </button>
          
          <button 
            onClick={() => setSelectedDayIndex(prev => Math.max(0, prev - 1))}
            disabled={selectedDayIndex <= 0}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded disabled:opacity-30 transition-colors"
          >
            <ChevronLeft size={18} />
          </button>

          <select 
            id="date-selector"
            value={selectedDayIndex}
            onChange={(e) => setSelectedDayIndex(Number(e.target.value))}
            className="bg-transparent text-white text-sm focus:ring-0 focus:border-0 block w-full outline-none cursor-pointer text-center appearance-none"
            style={{ textAlignLast: 'center' }}
          >
            {Array.from({ length: totalDays }).map((_, idx) => (
              <option key={idx} value={idx} className="bg-[#1a1a1a]">
                {getDateForIndex(idx)}
              </option>
            ))}
          </select>

          <button 
            onClick={() => setSelectedDayIndex(prev => Math.min(totalDays - 1, prev + 1))}
            disabled={selectedDayIndex >= totalDays - 1}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded disabled:opacity-30 transition-colors"
          >
            <ChevronRight size={18} />
          </button>
        </div>
`;

content = content.replace(
  /{\/\* Date Selector \*\/}[\s\S]*?<\/div>/,
  newSelectHtml
);

// Also fix the text "LLD Practice starts on 22 Aug!" to "23 Aug"
content = content.replace(/22 Aug/g, '23 Aug');

fs.writeFileSync('src/components/DailyHome.jsx', content);
