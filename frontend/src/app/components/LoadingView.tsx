import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'motion/react';
import { generateBriefing, type BriefingData } from '../api';

const STEPS = [
  'Fetching live news sources...',
  'Analyzing global editorial context...',
  'Synthesizing intelligence briefing...',
  'Tailoring insights to your persona...',
  'Finalising your report...',
];

interface LoadingViewProps {
  topic: string;
  persona: string;
  onComplete: (briefing: BriefingData) => void;
}

export function LoadingView({ topic, persona, onComplete }: LoadingViewProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const calledRef = useRef(false);

  useEffect(() => {
    if (calledRef.current) return;
    calledRef.current = true;

    // Cycle through status messages every 3s
    const stepTimer = setInterval(() => {
      setStepIndex(prev => Math.min(prev + 1, STEPS.length - 1));
    }, 3000);

    // Fake progress bar: slowly advances while API is working
    let p = 0;
    const progTimer = setInterval(() => {
      p += Math.random() * 4;
      if (p >= 90) p = 90; // cap at 90% until done
      setProgress(p);
    }, 600);

    generateBriefing(topic, persona)
      .then(data => {
        clearInterval(stepTimer);
        clearInterval(progTimer);
        setProgress(100);
        setStepIndex(STEPS.length - 1);
        setTimeout(() => onComplete(data), 400);
      })
      .catch(err => {
        clearInterval(stepTimer);
        clearInterval(progTimer);
        setError(err.message || 'Failed to generate briefing. Please try again.');
      });

    return () => {
      clearInterval(stepTimer);
      clearInterval(progTimer);
    };
  }, [topic, persona, onComplete]);

  return (
    <div className="min-h-screen bg-[#F0F2F5] text-slate-900 flex flex-col items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg border border-slate-200 p-8 md:p-12 flex flex-col items-center">

        {/* Top Window Dots */}
        <div className="w-full flex gap-2 mb-8 items-center justify-start">
           <div className="w-3 h-3 rounded-full bg-[#FF5F56]"></div>
           <div className="w-3 h-3 rounded-full bg-[#FFBD2E]"></div>
           <div className="w-3 h-3 rounded-full bg-[#27C93F]"></div>
        </div>

        {error ? (
          <div className="text-center space-y-4 w-full">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <span className="text-red-600 text-2xl font-bold">!</span>
            </div>
            <h2 className="text-2xl font-serif font-bold text-slate-900 tracking-tight">Generation Failed</h2>
            <p className="text-red-600 font-sans text-sm font-medium bg-red-50 rounded-lg p-3 border border-red-200">{error}</p>
            <p className="text-slate-500 text-sm">Make sure the Flask backend is running on port 5000.</p>
          </div>
        ) : (
          <>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              className="mb-8"
            >
              <div className="w-12 h-12 border-[3px] border-slate-100 border-t-slate-900 rounded-full" />
            </motion.div>

            <div className="text-center space-y-3 w-full">
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-2xl font-serif font-bold text-slate-900 tracking-tight"
              >
                Curating intelligence
              </motion.h2>
              <motion.p
                key={stepIndex}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="text-slate-500 font-sans text-sm md:text-base font-medium"
              >
                {STEPS[stepIndex]}
              </motion.p>
              <p className="text-slate-400 font-sans text-xs font-medium mt-1">Topic: <strong className="text-slate-700">{topic}</strong></p>
            </div>

            {/* Progress Bar Animation */}
            <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden mt-8">
              <motion.div
                style={{ width: `${progress}%` }}
                transition={{ ease: "easeOut", duration: 0.5 }}
                className="h-full bg-slate-900 rounded-full transition-all"
              />
            </div>
            <p className="text-slate-400 text-xs mt-2 font-sans">{Math.round(progress)}%</p>
          </>
        )}
      </div>
    </div>
  );
}
