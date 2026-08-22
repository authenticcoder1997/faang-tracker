import React from "react";
import { Target, CheckCircle2, ArrowRight, Play, BookOpen, Layers, Monitor, Calendar, Check, ExternalLink, Sparkles, CheckCircle } from "lucide-react";
import { DSA_SECTIONS_LIST } from "../data/dsaTopics";

export default function DailyHome({ dsa, lld, hld, setDsa, setLld, setHld, setActiveTab }) {
  // Calculate section matching today's date
  const now = new Date();
  const todayDay = now.getDate();
  const todayMonth = now.toLocaleString("en-US", { month: "short" }); // e.g. "Aug"
  const formattedToday = `${String(todayDay).padStart(2, "0")} ${todayMonth}`;

  // Find index: 31 Jul is Day 0, 1 Aug is Day 1, 22 Aug is Day 22, etc.
  let todaySectionIndex = 22; // default 22 Aug
  if (todayMonth === "Jul" && todayDay === 31) todaySectionIndex = 0;
  else if (todayMonth === "Aug") todaySectionIndex = todayDay; // Aug 1 -> 1 ... Aug 22 -> 22
  else if (todayMonth === "Sep") todaySectionIndex = 31 + todayDay; // Sep 1 -> 32

  if (todaySectionIndex < 0 || todaySectionIndex >= DSA_SECTIONS_LIST.length) {
    todaySectionIndex = 22; // fallback to active August day
  }

  const todaySectionName = DSA_SECTIONS_LIST[todaySectionIndex]?.name || DSA_SECTIONS_LIST[0].name;
  const todayDsaQuestions = dsa.filter(i => i.section === todaySectionName);
  const todayDsaCompleted = todayDsaQuestions.filter(i => i.completed).length;

  // LLD 1 daily & HLD 1 daily
  const nextLld = lld.filter(i => !i.completed).slice(0, 1);
  const nextHld = hld.filter(i => !i.completed).slice(0, 1);

  const toggleDsa = (id) => {
    if (!setDsa) return;
    setDsa(dsa.map(item => item.id === id ? { ...item, completed: !item.completed } : item));
  };

  const toggleLld = (id) => {
    if (!setLld) return;
    setLld(lld.map(item => item.id === id ? { ...item, completed: !item.completed } : item));
  };

  const toggleHld = (id) => {
    if (!setHld) return;
    setHld(hld.map(item => item.id === id ? { ...item, completed: !item.completed } : item));
  };

  const totalDsa = dsa.filter(i => i.completed).length;
  const totalLld = lld.filter(i => i.completed).length;
  const totalHld = hld.filter(i => i.completed).length;

  return (
    <div className="p-4 sm:p-6 md:p-10 max-w-5xl mx-auto font-sans">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-green-500 font-semibold text-sm mb-1">
          <Calendar size={16} />
          <span>Today: {formattedToday} • Day {todaySectionIndex + 1} of 40</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Home</h1>
        <p className="text-gray-400 text-sm">Focus on today's scheduled DSA questions, 1 LLD system, and 1 HLD breakdown.</p>
      </div>

      {/* Progress Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-8">
        <div className="bg-[#141414] border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition-all cursor-pointer" onClick={() => setActiveTab("dsa")}>
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-green-500 font-semibold flex items-center gap-2"><BookOpen size={18}/> DSA</h3>
            <span className="text-xs text-gray-500 font-mono">{totalDsa}/{dsa.length}</span>
          </div>
          <div className="w-full bg-gray-900 rounded-full h-2 mb-2">
            <div className="bg-green-500 h-2 rounded-full transition-all duration-300" style={{ width: `${(totalDsa/dsa.length)*100}%` }}></div>
          </div>
          <p className="text-xs text-gray-400">TakeUForward Concept Revision →</p>
        </div>

        <div className="bg-[#141414] border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition-all cursor-pointer" onClick={() => setActiveTab("lld")}>
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-emerald-400 font-semibold flex items-center gap-2"><Layers size={18}/> LLD</h3>
            <span className="text-xs text-gray-500 font-mono">{totalLld}/{lld.length}</span>
          </div>
          <div className="w-full bg-gray-900 rounded-full h-2 mb-2">
            <div className="bg-emerald-400 h-2 rounded-full transition-all duration-300" style={{ width: `${(totalLld/lld.length)*100}%` }}></div>
          </div>
          <p className="text-xs text-gray-400">Algomaster 1 Daily Practice →</p>
        </div>

        <div className="bg-[#141414] border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition-all cursor-pointer" onClick={() => setActiveTab("hld")}>
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-teal-400 font-semibold flex items-center gap-2"><Monitor size={18}/> HLD</h3>
            <span className="text-xs text-gray-500 font-mono">{totalHld}/{hld.length}</span>
          </div>
          <div className="w-full bg-gray-900 rounded-full h-2 mb-2">
            <div className="bg-teal-400 h-2 rounded-full transition-all duration-300" style={{ width: `${(totalHld/hld.length)*100}%` }}></div>
          </div>
          <p className="text-xs text-gray-400">HelloInterview Breakdown →</p>
        </div>
      </div>

      {/* Main Focus Container */}
      <div className="space-y-6">
        
        {/* DSA Today Scheduled Questions */}
        <div className="bg-[#111111] border border-gray-800 rounded-xl overflow-hidden">
          <div className="p-5 border-b border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-[#161616]">
            <div className="flex items-center gap-2">
              <Target size={20} className="text-green-500" />
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  Today's DSA Questions: <span className="text-green-400">{todaySectionName}</span>
                </h2>
                <p className="text-xs text-gray-400">Scheduled for {formattedToday} • {todayDsaCompleted}/{todayDsaQuestions.length} completed</p>
              </div>
            </div>
            <button 
              onClick={() => setActiveTab("dsa")}
              className="text-xs text-green-400 hover:text-green-300 font-medium flex items-center gap-1 self-start sm:self-auto"
            >
              View All DSA <ArrowRight size={14} />
            </button>
          </div>

          <div className="divide-y divide-gray-800/60">
            {todayDsaQuestions.map((q, idx) => (
              <div 
                key={q.id} 
                className={`p-4 flex items-center justify-between hover:bg-gray-800/40 transition-colors ${q.completed ? "bg-green-950/10" : ""}`}
              >
                <div className="flex items-center gap-3 min-w-0 pr-4">
                  <button 
                    onClick={() => toggleDsa(q.id)}
                    className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 transition-colors ${
                      q.completed ? "bg-green-500 border-green-500 text-black" : "border-gray-500 hover:border-green-400"
                    }`}
                    title={q.completed ? "Mark as Incomplete" : "Mark as Done"}
                  >
                    {q.completed && <Check size={12} strokeWidth={3} />}
                  </button>
                  <div className="min-w-0">
                    <span className="text-xs text-gray-500 font-mono mr-2">#{idx + 1}</span>
                    <a 
                      href={q.url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className={`text-sm font-medium hover:text-green-400 transition-colors ${
                        q.completed ? "line-through text-gray-500" : "text-gray-200"
                      }`}
                    >
                      {q.title}
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <a 
                    href={q.url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-gray-800 hover:bg-green-500 hover:text-black text-gray-300 rounded transition-all"
                  >
                    Solve <ExternalLink size={12} />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Daily LLD & HLD Targets */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* LLD 1 Daily */}
          <div className="bg-[#111111] border border-gray-800 rounded-xl p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Layers size={18} className="text-emerald-400" />
                  <h3 className="text-sm font-bold text-white">Daily LLD Practice (1 Daily)</h3>
                </div>
                <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded">Algomaster</span>
              </div>
              
              {nextLld.length > 0 ? (
                <div className="bg-[#161616] p-4 rounded-lg border border-gray-800">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-start gap-3">
                      <button 
                        onClick={() => toggleLld(nextLld[0].id)}
                        className={`w-5 h-5 mt-0.5 rounded-full border flex items-center justify-center flex-shrink-0 transition-colors ${
                          nextLld[0].completed ? "bg-emerald-500 border-emerald-500 text-black" : "border-gray-500 hover:border-emerald-400"
                        }`}
                        title="Mark as Done"
                      >
                        {nextLld[0].completed && <Check size={12} strokeWidth={3} />}
                      </button>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs text-gray-500">{nextLld[0].section}</span>
                          <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            {nextLld[0].difficulty}
                          </span>
                        </div>
                        <a 
                          href={nextLld[0].url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-base font-semibold text-white hover:text-emerald-400 transition-colors"
                        >
                          {nextLld[0].title}
                        </a>
                      </div>
                    </div>
                  </div>
                  
                  {/* Problem Description */}
                  <p className="text-xs text-gray-400 mt-2 mb-4 leading-relaxed bg-[#111111] p-2.5 rounded border border-gray-800/80">
                    {nextLld[0].description}
                  </p>

                  <div className="flex items-center justify-between pt-1">
                    <button 
                      onClick={() => toggleLld(nextLld[0].id)}
                      className="text-xs text-gray-400 hover:text-emerald-400 flex items-center gap-1.5 transition-colors"
                    >
                      <CheckCircle size={14} /> Click checkbox when solved
                    </button>
                    <a 
                      href={nextLld[0].url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded hover:bg-emerald-500 hover:text-black transition-all"
                    >
                      <Play size={12} /> Solve on Algomaster
                    </a>
                  </div>
                </div>
              ) : (
                <div className="bg-[#161616] p-6 rounded-lg border border-gray-800 text-center">
                  <CheckCircle2 size={32} className="text-emerald-400 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-white">All 45 LLD problems completed!</p>
                  <p className="text-xs text-gray-400 mt-1">Awesome job mastering Low-Level Design.</p>
                </div>
              )}
            </div>
          </div>

          {/* HLD 1 Daily */}
          <div className="bg-[#111111] border border-gray-800 rounded-xl p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Monitor size={18} className="text-teal-400" />
                  <h3 className="text-sm font-bold text-white">Daily HLD Breakdown (1 Daily)</h3>
                </div>
                <span className="text-xs bg-teal-500/10 text-teal-400 border border-teal-500/20 px-2 py-0.5 rounded">HelloInterview</span>
              </div>
              
              {nextHld.length > 0 ? (
                <div className="bg-[#161616] p-4 rounded-lg border border-gray-800">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-start gap-3">
                      <button 
                        onClick={() => toggleHld(nextHld[0].id)}
                        className={`w-5 h-5 mt-0.5 rounded-full border flex items-center justify-center flex-shrink-0 transition-colors ${
                          nextHld[0].completed ? "bg-teal-500 border-teal-500 text-black" : "border-gray-500 hover:border-teal-400"
                        }`}
                        title="Mark as Done"
                      >
                        {nextHld[0].completed && <Check size={12} strokeWidth={3} />}
                      </button>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs text-gray-500">{nextHld[0].section || "Breakdown"}</span>
                          <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-teal-500/10 text-teal-400 border border-teal-500/20">
                            {nextHld[0].difficulty}
                          </span>
                        </div>
                        <a 
                          href={nextHld[0].url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-base font-semibold text-white hover:text-teal-400 transition-colors"
                        >
                          {nextHld[0].title}
                        </a>
                      </div>
                    </div>
                  </div>
                  
                  {/* Problem Description */}
                  <p className="text-xs text-gray-400 mt-2 mb-4 leading-relaxed bg-[#111111] p-2.5 rounded border border-gray-800/80">
                    {nextHld[0].description}
                  </p>

                  <div className="flex items-center justify-between pt-1">
                    <button 
                      onClick={() => toggleHld(nextHld[0].id)}
                      className="text-xs text-gray-400 hover:text-teal-400 flex items-center gap-1.5 transition-colors"
                    >
                      <CheckCircle size={14} /> Click checkbox when read
                    </button>
                    <a 
                      href={nextHld[0].url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-teal-500/20 text-teal-400 border border-teal-500/30 rounded hover:bg-teal-500 hover:text-black transition-all"
                    >
                      <Play size={12} /> Read on HelloInterview
                    </a>
                  </div>
                </div>
              ) : (
                <div className="bg-[#161616] p-6 rounded-lg border border-gray-800 text-center">
                  <CheckCircle2 size={32} className="text-teal-400 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-white">All 35 HLD breakdowns completed!</p>
                  <p className="text-xs text-gray-400 mt-1">Awesome job mastering System Design.</p>
                </div>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
