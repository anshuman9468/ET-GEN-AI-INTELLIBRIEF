import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Search, Menu } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface LandingViewProps {
  onGenerate: (topic: string, persona: string) => void;
}

const PERSONAS = [
  { id: 'investor', label: 'Investor' },
  { id: 'founder', label: 'Founder' },
  { id: 'student', label: 'Student' },
];

export function LandingView({ onGenerate }: LandingViewProps) {
  const [topic, setTopic] = useState('');
  const [selectedPersona, setSelectedPersona] = useState(PERSONAS[0].id);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (topic.trim()) {
      onGenerate(topic, selectedPersona);
    }
  };

  const handleSuggest = (suggestedTopic: string) => {
    setTopic(suggestedTopic);
  };

  return (
    <div className="min-h-screen bg-[#F0F2F5] text-slate-900 py-6 px-4 md:py-10 md:px-8 font-sans flex justify-center">
      <div className="max-w-[1200px] w-full bg-white rounded-xl shadow-2xl overflow-hidden p-6 md:p-10 border border-slate-200">
        
        {/* Top Window Dots */}
        <div className="flex gap-2 mb-8 items-center">
           <div className="w-3 h-3 rounded-full bg-[#FF5F56]"></div>
           <div className="w-3 h-3 rounded-full bg-[#FFBD2E]"></div>
           <div className="w-3 h-3 rounded-full bg-[#27C93F]"></div>
        </div>

        {/* Massive Title */}
        <div className="py-4 overflow-visible">
          <h1 className="text-center font-serif text-5xl sm:text-7xl md:text-8xl lg:text-[7.5rem] xl:text-[8.5rem] font-bold italic tracking-tighter leading-tight md:leading-none mb-6 text-slate-900 uppercase">
            Intellibrief
          </h1>
        </div>

        {/* Meta Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-center py-4 border-b border-slate-200 text-sm font-medium text-slate-500 mb-8 gap-4 sm:gap-0">
          <span>Wednesday, 25 Mar 2026</span>
          <div className="flex items-center gap-3">
            <span>Good Morning, Editor</span>
            <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-200 bg-slate-100">
              <ImageWithFallback 
                src="https://images.unsplash.com/photo-1672685667592-0392f458f46f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBtYW4lMjBoZWFkc2hvdHxlbnwxfHx8fDE3NzQ0NTUyOTh8MA&ixlib=rb-4.1.0&q=80&w=1080" 
                alt="User Avatar" 
                className="w-full h-full object-cover" 
              />
            </div>
          </div>
        </div>

        {/* Nav / Input Row */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          {/* Personas as Navigation */}
          <div className="flex flex-wrap gap-4 sm:gap-6 items-center w-full md:w-auto">
            <span className="font-bold text-slate-900 text-sm">Lens:</span>
            {PERSONAS.map(p => (
              <button
                key={p.id}
                onClick={() => setSelectedPersona(p.id)}
                className={`font-semibold text-sm transition-all pb-1 ${
                  selectedPersona === p.id 
                    ? 'text-slate-900 border-b-2 border-slate-900' 
                    : 'text-slate-400 hover:text-slate-600 border-b-2 border-transparent'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Search/Input Form */}
          <form onSubmit={handleSubmit} className="flex-1 w-full md:max-w-md relative flex items-center gap-4 ml-auto">
            <div className="relative flex-1 group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
              <input 
                type="text"
                value={topic}
                onChange={e => setTopic(e.target.value)}
                placeholder="Enter topic to generate briefing..."
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-md pl-10 pr-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 transition-all font-medium"
              />
            </div>
            <Menu className="w-5 h-5 text-slate-400 cursor-pointer hover:text-slate-900 hidden sm:block" />
          </form>
        </div>

        {/* Featured Story (Prompt Suggestion) */}
        <div 
          className="bg-white rounded-2xl p-2 sm:p-4 mb-10 group cursor-pointer"
          onClick={() => handleSuggest('The 2026 Global AI Framework')}
        >
          <div className="grid md:grid-cols-2 gap-6 lg:gap-10 items-center">
            <div className="rounded-xl overflow-hidden aspect-video md:aspect-[4/3] bg-slate-100 relative shadow-sm group-hover:shadow-md transition-shadow">
               <ImageWithFallback 
                 src="https://images.unsplash.com/photo-1754331202504-50f7fd91bad2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx2aWVubmElMjBjaXR5c2NhcGUlMjBhcmNoaXRlY3R1cmV8ZW58MXx8fHwxNzc0NDU1Mjk4fDA&ixlib=rb-4.1.0&q=80&w=1080" 
                 alt="Featured Architecture" 
                 className="w-full h-full object-cover absolute inset-0 group-hover:scale-105 transition-transform duration-700" 
               />
            </div>
            <div className="flex flex-col h-full justify-center py-2">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-emerald-500 font-bold text-xs uppercase tracking-wider">Technology</span>
                <span className="text-slate-400 text-xs font-medium flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-slate-300"></span> 1 min Generation
                </span>
              </div>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-slate-900 leading-[1.1] mb-5 group-hover:text-emerald-700 transition-colors">
                The 2026 Global AI Framework — what's the market impact?
              </h2>
              <p className="text-slate-600 font-sans text-sm md:text-base leading-relaxed mb-8">
                Welcome to the new era of intelligence. The recent international consensus imposes strict boundaries on high-risk AI, while simultaneously unlocking unprecedented funding for sustainable tech initiatives.
                <br/><br/>
                Enter this topic above to instantly generate a comprehensive, AI-curated intelligence briefing tailored to your specific role and perspective.
              </p>
              <div className="flex justify-start">
                <button 
                  onClick={(e) => { e.stopPropagation(); onGenerate('The 2026 Global AI Framework', selectedPersona); }}
                  className="font-serif font-bold text-sm text-slate-900 hover:text-emerald-600 transition-colors flex items-center gap-2 border-b-2 border-slate-900 pb-1 hover:border-emerald-600"
                >
                  Generate Briefing <span>→</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Grid */}
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12 pt-6 border-t border-slate-100">
           {/* Latest */}
           <div>
              <div className="flex justify-between items-center mb-6 border-b border-slate-200 pb-2">
                 <h3 className="font-bold text-sm text-slate-900">Trending Topics</h3>
                 <span className="text-xs text-slate-400 font-medium hover:text-slate-900 cursor-pointer transition-colors">See More {'>'}</span>
              </div>
              <div className="flex gap-5 items-center cursor-pointer group" onClick={() => handleSuggest('Startup Funding Q1 2026')}>
                 <div className="w-28 h-20 rounded-lg bg-slate-100 flex-shrink-0 overflow-hidden shadow-sm">
                    <ImageWithFallback 
                      src="https://images.unsplash.com/photo-1553729459-efe14ef6055d?q=80&w=400&auto=format&fit=crop" 
                      alt="Startup"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                 </div>
                 <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-blue-500 font-bold text-[10px] uppercase tracking-wider">Finance</span>
                      <span className="text-slate-400 text-[10px] font-medium">Updated 2h ago</span>
                    </div>
                    <h4 className="font-serif font-bold text-lg text-slate-900 leading-tight group-hover:text-blue-600 transition-colors">
                      Startup Funding Hits Record Highs in Q1 2026
                    </h4>
                 </div>
              </div>
           </div>

           {/* Our Pick */}
           <div>
              <div className="flex justify-between items-center mb-6 border-b border-slate-200 pb-2">
                 <h3 className="font-bold text-sm text-slate-900">Editor's Pick</h3>
                 <span className="text-xs text-slate-400 font-medium hover:text-slate-900 cursor-pointer transition-colors">See More {'>'}</span>
              </div>
              <div className="flex gap-5 items-center cursor-pointer group" onClick={() => handleSuggest('Sustainable Supply Chains')}>
                 <div className="w-28 h-20 rounded-lg bg-slate-100 flex-shrink-0 overflow-hidden shadow-sm">
                    <ImageWithFallback 
                      src="https://images.unsplash.com/photo-1494412574643-ff11b0a5c1c3?q=80&w=400&auto=format&fit=crop" 
                      alt="Logistics"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                 </div>
                 <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-purple-500 font-bold text-[10px] uppercase tracking-wider">Logistics</span>
                      <span className="text-slate-400 text-[10px] font-medium">Deep Dive</span>
                    </div>
                    <h4 className="font-serif font-bold text-lg text-slate-900 leading-tight group-hover:text-purple-600 transition-colors">
                      How Sustainable Supply Chains are Reshaping Global Trade
                    </h4>
                 </div>
              </div>
           </div>
        </div>

      </div>
    </div>
  );
}
