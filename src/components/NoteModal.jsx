import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, ArrowRight, Loader2, Mic, X } from 'lucide-react';

export default function NoteModal({ isOpen, onClose, initialNote, onSave, problemTitle }) {
  const [localNote, setLocalNote] = useState('');
  const [aiInput, setAiInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isListening, setIsListening] = useState(false);
  
  const textareaRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setLocalNote(initialNote || '');
      setAiInput('');
    }
  }, [isOpen, initialNote]);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, []);

  const handleClose = () => {
    if (recognitionRef.current) recognitionRef.current.stop();
    setIsListening(false);
    onSave(localNote); 
    onClose();
  };

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return alert("Speech recognition is not supported in this browser. Please try Chrome.");

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.continuous = true;
    recognition.interimResults = true;
    const originalText = aiInput;

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) finalTranscript += event.results[i][0].transcript;
        else interimTranscript += event.results[i][0].transcript;
      }
      setAiInput((originalText ? originalText + ' ' : '') + finalTranscript + interimTranscript);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  const handleAiSubmit = async (e) => {
    e.preventDefault();
    if (!aiInput.trim() || isGenerating) return;
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    }

    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) return alert("Gemini API Key is missing! Check your Vercel Environment Variables.");

    setIsGenerating(true);
    const userText = aiInput;
    setAiInput(''); 

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `You are an AI note-taking assistant. The user is writing notes about the software engineering problem: "${problemTitle}". Format their rough thoughts beautifully into markdown, correct any grammar or spelling mistakes, and make it concise. DO NOT add conversational filler. Just return the markdown.\n\nUser's raw input:\n${userText}` }] }]
        })
      });

      const data = await response.json();
      if (data.candidates && data.candidates[0].content.parts[0].text) {
        const generatedText = data.candidates[0].content.parts[0].text.trim();
        setLocalNote(prev => prev.trim() ? `${prev}\n\n${generatedText}` : generatedText);
        setTimeout(() => { if (textareaRef.current) textareaRef.current.scrollTop = textareaRef.current.scrollHeight; }, 100);
      } else {
        alert("Failed to generate response.");
      }
    } catch (error) {
      alert("Error connecting to Gemini API.");
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-[#0a0a0a] border border-[#333] rounded-2xl w-full max-w-3xl h-[80vh] flex flex-col shadow-2xl relative overflow-hidden text-gray-300 font-sans">
        
        <div className="p-5 border-b border-[#222] bg-[#111] flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-xl font-bold text-white mb-1">Problem Notes</h2>
            <p className="text-xs text-gray-400 max-w-md truncate">{problemTitle}</p>
          </div>
          <button onClick={handleClose} className="p-2 text-gray-400 hover:text-white hover:bg-[#333] rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <textarea 
          ref={textareaRef}
          value={localNote}
          onChange={(e) => setLocalNote(e.target.value)}
          className="flex-1 bg-transparent p-6 pb-28 text-gray-300 outline-none resize-none custom-scrollbar leading-relaxed text-sm md:text-base"
          placeholder={`Write your notes for "${problemTitle}" here...`}
        />

        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-2xl bg-[#1e1e1e] border border-[#333] rounded-2xl shadow-2xl p-2 px-3 flex items-center gap-3">
          <div className="text-gray-400"><Sparkles size={20} /></div>
          <form onSubmit={handleAiSubmit} className="flex-1 flex items-center gap-2">
            <input 
              type="text"
              value={aiInput}
              onChange={(e) => setAiInput(e.target.value)}
              disabled={isGenerating}
              placeholder={isListening ? "Listening..." : "Dictate or type rough notes, Gemini will format them..."}
              className={`w-full bg-transparent border-none outline-none text-white text-sm placeholder-gray-500 disabled:opacity-50 ${isListening ? 'animate-pulse text-green-400' : ''}`}
            />
            
            <button 
              type="button"
              onClick={toggleListening}
              className={`p-2 rounded-full transition-colors flex-shrink-0 ${isListening ? 'text-red-400 bg-red-400/10' : 'text-gray-400 hover:text-white hover:bg-[#333]'}`}
            >
              <Mic size={18} className={isListening ? 'animate-pulse' : ''} />
            </button>

            <button 
              type="submit"
              disabled={isGenerating || (!aiInput.trim() && !isListening)}
              className={`p-2 rounded-full flex items-center justify-center transition-colors flex-shrink-0 ${
                isGenerating || (!aiInput.trim() && !isListening) ? 'bg-[#333] text-gray-500' : 'bg-[#333] text-white hover:bg-[#444]'
              }`}
            >
              {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
