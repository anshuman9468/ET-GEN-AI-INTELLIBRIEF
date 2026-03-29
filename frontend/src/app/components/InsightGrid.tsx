import React from 'react';
import { motion } from 'motion/react';
import {
  Key, TrendingUp, TrendingDown, Target,
  Lightbulb, ArrowRightCircle, Sparkles, Activity, Eye
} from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';
import type { BriefingData } from '../api';

const dummyChartData = [
  { val: 100 }, { val: 112 }, { val: 108 }, { val: 135 }, { val: 128 }, { val: 155 }, { val: 172 },
];

export function InsightGrid({ briefing }: { briefing: BriefingData }) {
  const persona = briefing.metadata?.persona || 'founder';
  const displayPersona = persona.charAt(0).toUpperCase() + persona.slice(1);

  const CARDS = [
    {
      id: 'key-points',
      title: 'Key Takeaways',
      icon: Key,
      color: 'text-slate-900 bg-slate-100 border-slate-200',
      bg: 'bg-white',
      colSpan: 'col-span-1 md:col-span-2',
      content: (
        <ul className="space-y-3 text-slate-600 font-sans text-sm md:text-base leading-relaxed mt-2">
          {(briefing.key_points || []).map((point, i) => (
            <li key={i} className="flex gap-3">
              <span className="text-slate-900 font-bold shrink-0">•</span>
              {point}
            </li>
          ))}
        </ul>
      )
    },
    {
      id: 'for-you',
      title: `For You (${displayPersona})`,
      icon: Sparkles,
      color: 'text-amber-700 bg-amber-100 border-amber-200',
      bg: 'bg-amber-50 border-amber-200',
      colSpan: 'col-span-1 md:col-span-2',
      highlight: true,
      content: (
        <div className="space-y-4 font-sans mt-2">
          <p className="text-amber-900 leading-relaxed font-medium">
            {briefing.for_you}
          </p>
          {briefing.contrarian_view && (
            <div className="bg-white rounded-lg p-3 border border-amber-200 shadow-sm">
              <strong className="text-amber-800 text-xs font-bold uppercase tracking-wider block mb-1">Contrarian View</strong>
              <span className="text-amber-950 text-sm font-medium">{briefing.contrarian_view}</span>
            </div>
          )}
        </div>
      )
    },
    {
      id: 'winners',
      title: 'Winners',
      icon: TrendingUp,
      color: 'text-emerald-700 bg-emerald-100 border-emerald-200',
      bg: 'bg-white',
      colSpan: 'col-span-1',
      content: (
        <div className="flex flex-wrap gap-2 mt-4 font-sans">
          {(briefing.winners || []).map((w, i) => (
            <span key={i} className="px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-md text-[10px] uppercase tracking-wider font-bold">
              {w}
            </span>
          ))}
        </div>
      )
    },
    {
      id: 'losers',
      title: 'Losers',
      icon: TrendingDown,
      color: 'text-red-700 bg-red-100 border-red-200',
      bg: 'bg-white',
      colSpan: 'col-span-1',
      content: (
        <div className="flex flex-wrap gap-2 mt-4 font-sans">
          {(briefing.losers || []).map((l, i) => (
            <span key={i} className="px-3 py-1.5 bg-red-50 text-red-800 border border-red-200 rounded-md text-[10px] uppercase tracking-wider font-bold">
              {l}
            </span>
          ))}
        </div>
      )
    },
    {
      id: 'market-impact',
      title: 'Market Impact',
      icon: Activity,
      color: 'text-blue-700 bg-blue-100 border-blue-200',
      bg: 'bg-white',
      colSpan: 'col-span-1 md:col-span-2',
      content: (
        <div className="mt-4 flex flex-col sm:flex-row items-center gap-6 font-sans">
          <div className="w-full sm:w-1/2 h-24 bg-slate-50 border border-slate-100 rounded-xl overflow-hidden p-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dummyChartData}>
                <YAxis domain={['dataMin - 20', 'dataMax + 20']} hide />
                <Line type="monotone" dataKey="val" stroke="#0F172A" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="w-full sm:w-1/2">
            <p className="text-slate-600 text-sm leading-relaxed font-medium">
              {briefing.market_impact}
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'why-it-matters',
      title: 'Why It Matters',
      icon: Lightbulb,
      color: 'text-purple-700 bg-purple-100 border-purple-200',
      bg: 'bg-white',
      colSpan: 'col-span-1',
      content: (
        <p className="text-slate-600 font-sans text-sm md:text-base leading-relaxed mt-4 font-medium">
          {briefing.why_it_matters}
        </p>
      )
    },
    {
      id: 'what-next',
      title: 'What Next',
      icon: ArrowRightCircle,
      color: 'text-sky-700 bg-sky-100 border-sky-200',
      bg: 'bg-white',
      colSpan: 'col-span-1',
      content: (
        <div className="mt-4 space-y-3 font-sans text-sm font-medium">
          {(briefing.what_next || []).map((step, i) => (
            <div key={i} className="flex gap-3 text-slate-600">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 shrink-0" />
              <span>{step}</span>
            </div>
          ))}
        </div>
      )
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6 font-sans">
      {CARDS.map((card, idx) => {
        const Icon = card.icon;
        return (
          <motion.div
            key={card.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.08, duration: 0.5 }}
            whileHover={{ scale: 1.01, y: -2 }}
            className={`
              ${card.colSpan} ${card.bg}
              p-6 rounded-2xl border ${card.highlight ? 'border-amber-200' : 'border-slate-200'}
              shadow-sm hover:shadow-md transition-all duration-300
              flex flex-col relative overflow-hidden group
            `}
          >
            {card.highlight && (
              <div className="absolute top-0 right-0 p-4">
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                </span>
              </div>
            )}

            <div className="flex items-center gap-3 mb-2 border-b border-slate-100 pb-4">
              <div className={`p-2.5 rounded-lg border ${card.color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <h3 className="text-xl font-serif font-bold text-slate-900 tracking-tight">{card.title}</h3>
            </div>

            <div className="flex-1">
              {card.content}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
