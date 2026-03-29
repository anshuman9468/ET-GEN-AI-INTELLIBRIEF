import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { LandingView } from './components/LandingView';
import { LoadingView } from './components/LoadingView';
import { OutputView } from './components/OutputView';
import { LoginView } from './components/LoginView';
import type { BriefingData } from './api';

type AppView = 'login' | 'landing' | 'loading' | 'output';

export default function App() {
  const [view, setView] = useState<AppView>('login');
  const [topicData, setTopicData] = useState<{ topic: string; persona: string } | null>(null);
  const [briefing, setBriefing] = useState<BriefingData | null>(null);

  const handleLogin = () => {
    setView('landing');
  };

  const handleGenerate = (topic: string, persona: string) => {
    setTopicData({ topic, persona });
    setBriefing(null);
    setView('loading');
  };

  const handleLoadingComplete = (data: BriefingData) => {
    setBriefing(data);
    setView('output');
  };

  const handleBackToHome = () => {
    setView('landing');
  };

  return (
    <div className="w-full min-h-screen font-sans bg-slate-100">
      <AnimatePresence mode="wait">
        {view === 'login' && (
          <motion.div
            key="login"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.5 }}
          >
            <LoginView onLogin={handleLogin} />
          </motion.div>
        )}

        {view === 'landing' && (
          <motion.div
            key="landing"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.5 }}
          >
            <LandingView onGenerate={handleGenerate} />
          </motion.div>
        )}

        {view === 'loading' && topicData && (
          <motion.div
            key="loading"
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <LoadingView
              topic={topicData.topic}
              persona={topicData.persona}
              onComplete={handleLoadingComplete}
            />
          </motion.div>
        )}

        {view === 'output' && briefing && (
          <motion.div
            key="output"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            <OutputView briefing={briefing} onBack={handleBackToHome} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
