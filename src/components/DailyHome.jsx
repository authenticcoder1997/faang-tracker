import React, { useState } from "react";
import { Target, CheckCircle2, ArrowRight, Play, BookOpen, Layers, Monitor, Calendar, Check, ExternalLink, Sparkles, CheckCircle, ChevronLeft, ChevronRight, Coffee } from "lucide-react";
import { DSA_SECTIONS_LIST } from "../data/dsaTopics";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
// Day 0 of the schedule. All dayIndex values on DSA sections / LLD / HLD items are days offset from this date.
const EPOCH = new Date(2026, 6, 31); // 31 Jul 2026

function dateFromIndex(idx) {
  const d = new Date(EPOCH);
  d.setDate(d.getDate() + idx);
  return d;
}

function formatIndex(idx) {
  const d = dateFromIndex(idx);
  return `${String(d.getDate()).padStart(2, "0")} ${MONTHS[d.getMonth()]}`;
}

function todayIndex() {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((startOfToday - EPOCH) / 86400000);
}

// Finds the closest upcoming scheduled date (by dayIndex) after `fromIndex`, for showing "next up on X" messaging.
function nextScheduledIndex(items, fromIndex) {
  let best = null;
  for (const item of items) {
    if (typeof item.dayIndex === "number" && item.dayIndex > fromIndex) {
      if (best === null || item.dayIndex < best) best = item.dayIndex;
    }
  }
  return best;
}

export default function DailyHome({ dsa, lld, hld, setDsa, setLld, setHld, setActiveTab }) {
  const todayIdx = todayIndex();

  const totalDays = Math.max(
    todayIdx + 1,
    ...DSA_SECTIONS_LIST.map(s => (typeof s.dayIndex === "number" ? s.dayIndex : -1)),
    ...lld.map(i => (typeof i.dayIndex === "number" ? i.dayIndex : -1)),
    ...hld.map(i => (typeof i.dayIndex === "number" ? i.dayIndex : -1))
  ) + 1;

  const [selectedDayIndex, setSelectedDayIndex] = useState(Math.min(Math.max(todayIdx, 0), totalDays - 1));

  const formattedSelectedDate = formatIndex(selectedDayIndex);

  const dsaSectionsToday = DSA_SECTIONS_LIST.filter(s => s.dayIndex === selectedDayIndex);
  const selectedSectionNames = dsaSectionsToday.map(s => s.name);
  const todayDsaQuestions = selectedSectionNames.length
    ? dsa.filter(i => selectedSectionNames.includes(i.section))
    : [];
  const todayDsaCompleted = todayDsaQuestions.filter(i => i.completed).length;

  const nextLld = lld.filter(i => i.dayIndex === selectedDayIndex);
  const nextHld = hld.filter(i => i.dayIndex === selectedDayIndex);

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

  const dsaAllDone = totalDsa === dsa.length;
  const lldAllDone = totalLld === lld.length;
  const hldAllDone = totalHld === hld.length;

  const dsaNextIdx = nextScheduledIndex(DSA_SECTIONS_LIST, selectedDayIndex);
  const lldNextIdx = nextScheduledIndex(lld, selectedDayIndex);
  const hldNextIdx = nextScheduledIndex(hld, selectedDayIndex);

  return (
    <div className="p-4 sm:p-6 md:p-10 max-w-5xl mx-auto font-sans">
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-green-500 font-semibold text-sm mb-2">
            <Calendar size={16} />
            <span>Viewing: Day {selectedDayIndex + 1} of {totalDays}</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Home</h1>
          <p className="text-gray-400 text-sm">One track a day — DSA, LLD, or HLD on rotation, with extra reps on weekends.</p>
        </div>


        {/* Date Selector */}
        <div className="bg-[#141414] border border-gray-800 rounded-lg p-2 flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setSelectedDayIndex(todayIdx)}
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
                {formatIndex(idx)}
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

      </div>

      {/* Progress Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-8">
        <div className="bg-[#141414] border border-gray-800 rounded-xl p-5 hover:border-gray-700 hover:-translate-y-0.5 shadow-lg shadow-black/20 transition-all cursor-pointer" onClick={() => setActiveTab("dsa")}>
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-green-500 font-semibold flex items-center gap-2"><BookOpen size={18}/> DSA</h3>
            <span className="text-xs text-gray-500 font-mono">{totalDsa}/{dsa.length}</span>
          </div>
          <div className="w-full bg-gray-900 rounded-full h-2 mb-2">
            <div className="bg-gradient-to-r from-green-600 to-green-400 h-2 rounded-full transition-all duration-300" style={{ width: `${(totalDsa/dsa.length)*100}%` }}></div>
          </div>
          <p className="text-xs text-gray-400">TakeUForward Concept Revision →</p>
        </div>

        <div className="bg-[#141414] border border-gray-800 rounded-xl p-5 hover:border-gray-700 hover:-translate-y-0.5 shadow-lg shadow-black/20 transition-all cursor-pointer" onClick={() => setActiveTab("lld")}>
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-emerald-400 font-semibold flex items-center gap-2"><Layers size={18}/> LLD</h3>
            <span className="text-xs text-gray-500 font-mono">{totalLld}/{lld.length}</span>
          </div>
          <div className="w-full bg-gray-900 rounded-full h-2 mb-2">
            <div className="bg-gradient-to-r from-emerald-600 to-emerald-400 h-2 rounded-full transition-all duration-300" style={{ width: `${(totalLld/lld.length)*100}%` }}></div>
          </div>
          <p className="text-xs text-gray-400">Algomaster 1 Daily Practice →</p>
        </div>

        <div className="bg-[#141414] border border-gray-800 rounded-xl p-5 hover:border-gray-700 hover:-translate-y-0.5 shadow-lg shadow-black/20 transition-all cursor-pointer" onClick={() => setActiveTab("hld")}>
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-teal-400 font-semibold flex items-center gap-2"><Monitor size={18}/> HLD</h3>
            <span className="text-xs text-gray-500 font-mono">{totalHld}/{hld.length}</span>
          </div>
          <div className="w-full bg-gray-900 rounded-full h-2 mb-2">
            <div className="bg-gradient-to-r from-teal-600 to-teal-400 h-2 rounded-full transition-all duration-300" style={{ width: `${(totalHld/hld.length)*100}%` }}></div>
          </div>
          <p className="text-xs text-gray-400">HelloInterview Breakdown →</p>
        </div>
      </div>

      {/* Main Focus Container */}
      <div className="space-y-6">

        {/* DSA Today Scheduled Questions */}
        <div className="bg-[#111111] border border-gray-800 rounded-xl overflow-hidden shadow-lg shadow-black/20">
          <div className="p-5 border-b border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-[#161616]">
            <div className="flex items-center gap-2">
              <Target size={20} className="text-green-500" />
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  DSA Questions {selectedSectionNames.length > 0 && <><span className="text-gray-500 font-normal ml-1">for</span> <span className="text-green-400">{selectedSectionNames.join(" & ")}</span></>}
                </h2>
                <p className="text-xs text-gray-400">Scheduled for {formattedSelectedDate} {selectedSectionNames.length > 0 && `• ${todayDsaCompleted}/${todayDsaQuestions.length} completed`}</p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab("dsa")}
              className="text-xs text-green-400 hover:text-green-300 font-medium flex items-center gap-1 self-start sm:self-auto"
            >
              View All DSA <ArrowRight size={14} />
            </button>
          </div>

          {todayDsaQuestions.length > 0 ? (
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
          ) : dsaAllDone ? (
            <div className="p-8 text-center bg-[#111111]">
              <CheckCircle2 size={40} className="text-green-500 mx-auto mb-3" />
              <p className="text-base font-semibold text-white">DSA Roadmap Complete!</p>
              <p className="text-sm text-gray-400 mt-2">All {dsa.length} problems solved. Legendary.</p>
            </div>
          ) : (
            <div className="p-8 text-center bg-[#111111]">
              <Coffee size={32} className="text-gray-600 mx-auto mb-3" />
              <p className="text-base font-semibold text-white">Rest day for DSA</p>
              <p className="text-sm text-gray-400 mt-2">
                {dsaNextIdx !== null ? <>Next DSA day is <span className="text-green-400">{formatIndex(dsaNextIdx)}</span>.</> : "Nothing else scheduled."}
              </p>
            </div>
          )}
        </div>

        {/* Daily LLD & HLD Targets */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* LLD */}
          <div className="bg-[#111111] border border-gray-800 rounded-xl p-5 flex flex-col justify-between shadow-lg shadow-black/20">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Layers size={18} className="text-emerald-400" />
                  <h3 className="text-sm font-bold text-white">LLD Practice{nextLld.length > 1 ? ` (${nextLld.length} today)` : ""}</h3>
                </div>
                <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded">Algomaster</span>
              </div>

              {nextLld.length > 0 ? (
                <div className="space-y-3">
                  {nextLld.map(item => (
                    <div key={item.id} className="bg-[#161616] p-4 rounded-lg border border-gray-800">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-start gap-3">
                          <button
                            onClick={() => toggleLld(item.id)}
                            className={`w-5 h-5 mt-0.5 rounded-full border flex items-center justify-center flex-shrink-0 transition-colors ${
                              item.completed ? "bg-emerald-500 border-emerald-500 text-black" : "border-gray-500 hover:border-emerald-400"
                            }`}
                            title="Mark as Done"
                          >
                            {item.completed && <Check size={12} strokeWidth={3} />}
                          </button>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs text-gray-500">{item.section}</span>
                              <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                {item.difficulty}
                              </span>
                            </div>
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-base font-semibold text-white hover:text-emerald-400 transition-colors"
                            >
                              {item.title}
                            </a>
                          </div>
                        </div>
                      </div>

                      <p className="text-xs text-gray-400 mt-2 mb-4 leading-relaxed bg-[#111111] p-2.5 rounded border border-gray-800/80">
                        {item.description}
                      </p>

                      <div className="flex items-center justify-between pt-1">
                        <button
                          onClick={() => toggleLld(item.id)}
                          className="text-xs text-gray-400 hover:text-emerald-400 flex items-center gap-1.5 transition-colors"
                        >
                          <CheckCircle size={14} /> Click checkbox when solved
                        </button>
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded hover:bg-emerald-500 hover:text-black transition-all"
                        >
                          <Play size={12} /> Solve on Algomaster
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              ) : lldAllDone ? (
                <div className="bg-[#161616] p-6 rounded-lg border border-gray-800 text-center">
                  <CheckCircle2 size={32} className="text-emerald-400 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-white">All {lld.length} LLD problems completed!</p>
                  <p className="text-xs text-gray-400 mt-1">Awesome job mastering Low-Level Design.</p>
                </div>
              ) : (
                <div className="bg-[#161616] p-6 rounded-lg border border-gray-800 text-center">
                  <Coffee size={28} className="text-gray-600 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-white">Rest day for LLD</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {lldNextIdx !== null ? <>Next LLD day is <span className="text-emerald-400">{formatIndex(lldNextIdx)}</span>.</> : "Nothing else scheduled."}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* HLD */}
          <div className="bg-[#111111] border border-gray-800 rounded-xl p-5 flex flex-col justify-between shadow-lg shadow-black/20">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Monitor size={18} className="text-teal-400" />
                  <h3 className="text-sm font-bold text-white">HLD Breakdown{nextHld.length > 1 ? ` (${nextHld.length} today)` : ""}</h3>
                </div>
                <span className="text-xs bg-teal-500/10 text-teal-400 border border-teal-500/20 px-2 py-0.5 rounded">HelloInterview</span>
              </div>

              {nextHld.length > 0 ? (
                <div className="space-y-3">
                  {nextHld.map(item => (
                    <div key={item.id} className="bg-[#161616] p-4 rounded-lg border border-gray-800">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-start gap-3">
                          <button
                            onClick={() => toggleHld(item.id)}
                            className={`w-5 h-5 mt-0.5 rounded-full border flex items-center justify-center flex-shrink-0 transition-colors ${
                              item.completed ? "bg-teal-500 border-teal-500 text-black" : "border-gray-500 hover:border-teal-400"
                            }`}
                            title="Mark as Done"
                          >
                            {item.completed && <Check size={12} strokeWidth={3} />}
                          </button>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs text-gray-500">{item.section || "Breakdown"}</span>
                              <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-teal-500/10 text-teal-400 border border-teal-500/20">
                                {item.difficulty}
                              </span>
                            </div>
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-base font-semibold text-white hover:text-teal-400 transition-colors"
                            >
                              {item.title}
                            </a>
                          </div>
                        </div>
                      </div>

                      <p className="text-xs text-gray-400 mt-2 mb-4 leading-relaxed bg-[#111111] p-2.5 rounded border border-gray-800/80">
                        {item.description}
                      </p>

                      <div className="flex items-center justify-between pt-1">
                        <button
                          onClick={() => toggleHld(item.id)}
                          className="text-xs text-gray-400 hover:text-teal-400 flex items-center gap-1.5 transition-colors"
                        >
                          <CheckCircle size={14} /> Click checkbox when read
                        </button>
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-teal-500/20 text-teal-400 border border-teal-500/30 rounded hover:bg-teal-500 hover:text-black transition-all"
                        >
                          <Play size={12} /> Read on HelloInterview
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              ) : hldAllDone ? (
                <div className="bg-[#161616] p-6 rounded-lg border border-gray-800 text-center">
                  <CheckCircle2 size={32} className="text-teal-400 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-white">All {hld.length} HLD breakdowns completed!</p>
                  <p className="text-xs text-gray-400 mt-1">Awesome job mastering System Design.</p>
                </div>
              ) : (
                <div className="bg-[#161616] p-6 rounded-lg border border-gray-800 text-center">
                  <Coffee size={28} className="text-gray-600 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-white">Rest day for HLD</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {hldNextIdx !== null ? <>Next HLD day is <span className="text-teal-400">{formatIndex(hldNextIdx)}</span>.</> : "Nothing else scheduled."}
                  </p>
                </div>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
