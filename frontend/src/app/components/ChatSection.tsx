import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { Send, Bot, Loader2 } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { askQuestion, type BriefingData, type ChatMessage } from '../api';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function ChatSection({ briefing }: { briefing: BriefingData }) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'ai',
      text: `Hello! I've just generated your briefing on **"${briefing.headline}"**. Ask me anything about this topic or the insights above.`,
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = { id: Date.now().toString(), sender: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const answer = await askQuestion(userMsg.text, briefing);
      setMessages(prev => [
        ...prev,
        { id: (Date.now() + 1).toString(), sender: 'ai', text: answer },
      ]);
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: `Sorry, I encountered an error: ${err.message}. Please ensure the backend is running.`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm flex flex-col h-full min-h-[450px]">
      <div className="bg-slate-50/80 p-4 border-b border-slate-200 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-serif font-bold text-slate-900 flex items-center gap-2">
            Intelligence Assistant
          </h3>
          <p className="text-xs text-slate-500 font-sans font-medium uppercase tracking-wider mt-1">Ask questions about this brief</p>
        </div>
        <div className="w-8 h-8 bg-slate-900 rounded-full flex items-center justify-center">
          <Bot className="w-4 h-4 text-white" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-4 font-sans flex flex-col">
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={cn(
              "max-w-[85%] rounded-2xl p-4 flex gap-3 text-sm md:text-base font-medium",
              msg.sender === 'user'
                ? "bg-slate-900 text-white self-end rounded-br-none ml-auto shadow-sm"
                : "bg-slate-50 border border-slate-200 text-slate-700 self-start rounded-bl-none shadow-sm"
            )}
          >
            <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
          </motion.div>
        ))}

        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-[85%] rounded-2xl p-4 bg-slate-50 border border-slate-200 text-slate-500 self-start rounded-bl-none shadow-sm flex items-center gap-2"
          >
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm font-medium">Thinking...</span>
          </motion.div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="p-4 border-t border-slate-200 bg-white">
        <form
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          className="relative flex items-center bg-slate-50 border border-slate-200 rounded-full pr-2 focus-within:border-slate-400 focus-within:ring-1 focus-within:ring-slate-400 transition-all"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything about this briefing..."
            className="flex-1 bg-transparent text-slate-900 px-5 py-3.5 focus:outline-none placeholder-slate-400 font-sans font-medium text-sm"
            disabled={isLoading}
          />
          <button
            type="submit"
            className="w-9 h-9 bg-slate-900 hover:bg-slate-800 rounded-full flex items-center justify-center text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
            disabled={!input.trim() || isLoading}
          >
            <Send className="w-4 h-4 ml-0.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
