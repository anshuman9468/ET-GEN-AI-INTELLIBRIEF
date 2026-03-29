import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, Clock, Share2, Bookmark, ArrowLeft } from 'lucide-react';
import { InsightGrid } from './InsightGrid';
import { ChatSection } from './ChatSection';
import { VideoSection } from './VideoSection';
import type { BriefingData } from '../api';

interface OutputViewProps {
  briefing: BriefingData;
  onBack: () => void;
}

export function OutputView({ briefing, onBack }: OutputViewProps) {
  const [showBreaking, setShowBreaking] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      setShowBreaking(true);
    }, 500);
  }, []);

  const generatedAt = briefing.metadata?.generated_at
    ? new Date(briefing.metadata.generated_at).toLocaleString('en-US', {
        weekday: 'long', day: 'numeric', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
    : '';

  return (
    <div className="min-h-screen bg-[#F0F2F5] text-slate-900 relative overflow-x-hidden font-sans">
      {/* Editorial Top Border */}
      <div className="absolute top-0 inset-x-0 h-2 bg-slate-900 z-40" />

      {/* Breaking Strip */}
      <AnimatePresence>
        {showBreaking && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            className="bg-[#D32F2F] overflow-hidden relative z-50 shadow-md border-b border-[#B71C1C] mt-2"
          >
            <div className="max-w-[1200px] mx-auto px-4 md:px-8 py-2.5 flex items-center gap-3">
              <span className="flex h-2.5 w-2.5 relative shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-300 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
              </span>
              <AlertTriangle className="w-4 h-4 text-white shrink-0" />
              <span className="font-sans font-bold text-sm tracking-wider uppercase text-white shrink-0">
                Briefing Complete
              </span>

              {/* Ticker */}
              <div className="ml-auto flex-1 overflow-hidden hidden md:block border-l border-red-400/50 pl-4 mx-4">
                <motion.div
                  initial={{ x: '100%' }}
                  animate={{ x: '-100%' }}
                  transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
                  className="whitespace-nowrap text-red-100 text-sm font-sans font-medium uppercase tracking-wide"
                >
                  {briefing.headline} • {briefing.key_points?.[0]} • {briefing.key_points?.[1]} •&nbsp;
                  CONFIDENCE SCORE: {briefing.confidence_score}% • PERSONA: {briefing.metadata?.persona?.toUpperCase()}
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-[1200px] mx-auto px-4 md:px-8 py-8 md:py-12 relative z-10">

        {/* Navigation / Back Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-8 flex items-center"
        >
          <button
            onClick={onBack}
            className="group flex items-center gap-2 text-sm font-sans font-bold text-slate-500 hover:text-slate-900 transition-colors uppercase tracking-wider"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Home
          </button>
        </motion.div>

        {/* Header Section */}
        <motion.header
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="max-w-4xl mb-12"
        >
          <div className="flex flex-wrap items-center gap-4 text-slate-500 font-sans text-sm mb-6 border-b border-slate-200 pb-4">
            <span className="flex items-center gap-1.5 bg-slate-100 border border-slate-200 px-3 py-1 rounded-full text-emerald-700 font-bold uppercase tracking-wider text-[10px]">
              <Clock className="w-3.5 h-3.5" /> Just updated
            </span>
            {generatedAt && (
              <span className="font-medium text-slate-400 text-xs">{generatedAt}</span>
            )}
            <span className="font-medium text-slate-400">
              Confidence: <strong className="text-slate-700">{briefing.confidence_score}%</strong>
            </span>
            <div className="ml-auto flex gap-3">
              <button className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400 hover:text-slate-900">
                <Share2 className="w-4 h-4" />
              </button>
              <button className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400 hover:text-slate-900">
                <Bookmark className="w-4 h-4" />
              </button>
            </div>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold leading-[1.1] mb-6 text-slate-900 capitalize tracking-tight">
            {briefing.headline}
          </h1>

          <p className="text-lg md:text-xl font-sans text-slate-600 leading-relaxed border-l-4 border-slate-900 pl-6 py-2 bg-white/50">
            <strong className="text-slate-900 font-bold uppercase text-sm tracking-wider mr-2">Bottom Line:</strong>
            {briefing.tldr}
          </p>
        </motion.header>

        {/* Insight Grid */}
        <section className="mb-12">
          <InsightGrid briefing={briefing} />
        </section>

        {/* Interactive Modules */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 mb-12">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1 }}
            className="flex flex-col"
          >
            <ChatSection briefing={briefing} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.2 }}
            className="flex flex-col"
          >
            <VideoSection briefing={briefing} />
          </motion.div>
        </section>

      </div>
    </div>
  );
}
