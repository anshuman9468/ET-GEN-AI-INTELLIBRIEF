import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  PlayCircle, X, Download, AlertCircle,
  Volume2, VolumeX, Square, Mic2, Loader2, Radio, Film
} from 'lucide-react';
import { generateVideo, fetchVideoScenes, type BriefingData } from '../api';

interface VideoResult {
  success: boolean;
  type: 'full_video' | 'simple_package';
  video_url?: string;
  message?: string;
  files?: string[];
}

export function VideoSection({ briefing }: { briefing: BriefingData }) {
  // MP4 video generation state
  const [isVideoLoading, setIsVideoLoading] = useState(false);
  const [videoResult, setVideoResult] = useState<VideoResult | null>(null);
  const [showVideo, setShowVideo] = useState(false);

  // Remotion animated video state
  const [isRenderingAnimated, setIsRenderingAnimated] = useState(false);
  const [animatedVideoUrl, setAnimatedVideoUrl] = useState<string | null>(null);
  const [renderProgress, setRenderProgress] = useState('');
  const [showAnimatedVideo, setShowAnimatedVideo] = useState(false);

  // TTS state
  const [isFetchingScenes, setIsFetchingScenes] = useState(false);
  const [scenes, setScenes] = useState<string[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentSceneIdx, setCurrentSceneIdx] = useState(0);
  const [ttsProgress, setTtsProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sceneTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Preload browser voices
    window.speechSynthesis.getVoices();
    return () => {
      window.speechSynthesis.cancel();
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
      if (sceneTimerRef.current) clearInterval(sceneTimerRef.current);
    };
  }, []);

  const waitForVoices = (): Promise<SpeechSynthesisVoice | null> => {
    return new Promise((resolve) => {
      const pick = () => {
        const voices = window.speechSynthesis.getVoices();
        if (voices.length === 0) return null;
        return (
          voices.find(v => v.lang === 'en-US' && v.name.toLowerCase().includes('google')) ||
          voices.find(v => v.lang === 'en-US') ||
          voices.find(v => v.lang.startsWith('en')) ||
          voices[0]
        );
      };

      // Voices already available (Chrome/Brave on second call)
      const immediate = pick();
      if (immediate) { resolve(immediate); return; }

      // Wait for voiceschanged (Brave / async load)
      const handler = () => {
        window.speechSynthesis.removeEventListener('voiceschanged', handler);
        resolve(pick());
      };
      window.speechSynthesis.addEventListener('voiceschanged', handler);

      // Timeout fallback after 2s — speak anyway with no voice (uses system default)
      setTimeout(() => {
        window.speechSynthesis.removeEventListener('voiceschanged', handler);
        resolve(pick() ?? null);
      }, 2000);
    });
  };

  // ── Fetch scenes from n8n, then speak them ──────────────────────
  const handleListenWithN8N = async () => {
    // If already speaking — pause/resume
    if (isSpeaking && !isPaused) {
      window.speechSynthesis.pause();
      setIsPaused(true);
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
      return;
    }
    if (isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
      return;
    }

    // If scenes already fetched, re-speak them
    if (scenes.length > 0) {
      speakScenes(scenes);
      return;
    }

    // Fresh fetch from n8n
    setIsFetchingScenes(true);
    setError(null);

    try {
      const topic = briefing.metadata?.topic || briefing.headline;
      const persona = briefing.metadata?.persona || 'investor';
      const fetchedScenes = await fetchVideoScenes(topic, persona);
      setScenes(fetchedScenes);
      speakScenes(fetchedScenes);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch video scenes from n8n.');
    } finally {
      setIsFetchingScenes(false);
    }
  };

  const speakScenes = async (sceneTexts: string[]) => {
    window.speechSynthesis.cancel();
    setCurrentSceneIdx(0);
    setTtsProgress(0);

    const fullText = sceneTexts.join('. ');
    const utterance = new SpeechSynthesisUtterance(fullText);
    utterance.lang = 'en-US';
    utterance.rate = 0.95;
    utterance.pitch = 1.05;
    utterance.volume = 1;

    const voice = await waitForVoices();
    if (voice) utterance.voice = voice;

    // Rotate through scenes visually
    let idx = 0;
    utterance.onstart = () => {
      setIsSpeaking(true);
      setIsPaused(false);

      // Cycle scenes every ~4s for visual feedback
      sceneTimerRef.current = setInterval(() => {
        idx = (idx + 1) % sceneTexts.length;
        setCurrentSceneIdx(idx);
      }, 4000);

      // Fake progress
      const totalMs = fullText.length * 58; // ~58ms per char at rate 0.95
      const start = Date.now();
      progressTimerRef.current = setInterval(() => {
        const pct = Math.min(((Date.now() - start) / totalMs) * 100, 97);
        setTtsProgress(pct);
      }, 400);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setIsPaused(false);
      setTtsProgress(100);
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
      if (sceneTimerRef.current) clearInterval(sceneTimerRef.current);
    };

    utterance.onerror = (e) => {
      if (e.error === 'interrupted') return;
      setIsSpeaking(false);
      setIsPaused(false);
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
      if (sceneTimerRef.current) clearInterval(sceneTimerRef.current);
      setError('Browser TTS error. Try Chrome or Edge for best results.');
    };

    window.speechSynthesis.speak(utterance);
  };

  const handleStop = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
    setTtsProgress(0);
    setCurrentSceneIdx(0);
    if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    if (sceneTimerRef.current) clearInterval(sceneTimerRef.current);
  };

  // ── Generate animated Remotion video ───────────────────────────
  const handleRenderAnimated = async () => {
    if (scenes.length === 0) {
      setError('Fetch scenes first by clicking "Listen via n8n + TTS".');
      return;
    }
    setIsRenderingAnimated(true);
    setAnimatedVideoUrl(null);
    setError(null);
    setRenderProgress('Generating ElevenLabs voiceover...');

    try {
      // 1. First generate TTS via Flask
      const ttsRes = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenes }),
      });
      
      let audioUrl = null;
      let duration = null;
      let sceneAudio = [];

      if (ttsRes.ok) {
        const ttsData = await ttsRes.json();
        // If we got individual scene audio (new format)
        if (ttsData.sceneAudio) {
          sceneAudio = ttsData.sceneAudio;
          duration = ttsData.totalDuration;
          console.log(`🎙️ ${sceneAudio.length} Scene audio segments generated.`);
        } else {
          audioUrl = ttsData.audioUrl;
          duration = ttsData.duration;
        }
      } else {
        console.warn("⚠️ TTS failed, proceeding without voiceover.");
      }

      // 2. Then trigger Remotion render
      setRenderProgress('Rendering animated MP4...');
      const topic = briefing.metadata?.topic || briefing.headline;
      const persona = briefing.metadata?.persona || 'Investor';

      const res = await fetch('/api/render-remotion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenes, persona, topic, audioUrl, duration, sceneAudio }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      const data = await res.json();
      setAnimatedVideoUrl(data.videoUrl);
      setShowAnimatedVideo(true);
      setRenderProgress('');
    } catch (err: any) {
      setError(err.message || 'Remotion render failed.');
      setRenderProgress('');
    } finally {
      setIsRenderingAnimated(false);
    }
  };

  // ── Generate MP4 video (MoviePy) ────────────────────────────────
  const handleGenerateVideo = async () => {
    if (!briefing.filename) {
      setError('No briefing file found. Please regenerate the briefing.');
      return;
    }
    setIsVideoLoading(true);
    setError(null);
    try {
      const result = await generateVideo(briefing.filename);
      setVideoResult(result);
      if (result.video_url) setShowVideo(true);
    } catch (err: any) {
      setError(err.message || 'Failed to generate video');
    } finally {
      setIsVideoLoading(false);
    }
  };

  // ── Animated Remotion video player ─────────────────────────────
  if (showAnimatedVideo && animatedVideoUrl) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-slate-900 border border-slate-200 rounded-2xl overflow-hidden shadow-sm relative h-full min-h-[450px]"
      >
        <video src={animatedVideoUrl} controls autoPlay className="w-full h-full object-cover absolute inset-0" />
        <div className="absolute top-4 left-4 bg-red-600 text-white px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded-sm z-10">
          🎬 Remotion Animated
        </div>
        <div className="absolute bottom-4 right-4 z-10 flex gap-2">
          <a href={animatedVideoUrl} download className="bg-white/20 hover:bg-white/40 text-white text-xs font-bold px-3 py-1.5 rounded-lg backdrop-blur-sm flex items-center gap-1">
            <Download className="w-3 h-3" /> Download
          </a>
          <button onClick={() => { setShowAnimatedVideo(false); setAnimatedVideoUrl(null); }}
            className="bg-black/40 hover:bg-black/80 text-white p-1.5 rounded-lg backdrop-blur-sm">
            <X className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    );
  }

  // ── Full MoviePy video player ───────────────────────────────────
  if (showVideo && videoResult?.video_url) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-slate-900 border border-slate-200 rounded-2xl overflow-hidden shadow-sm relative h-full min-h-[450px]"
      >
        <video src={videoResult.video_url} controls autoPlay className="w-full h-full object-cover absolute inset-0" />
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 via-black/50 to-transparent z-10 pointer-events-none">
          <span className="bg-red-600 text-white px-2 py-1 text-[10px] font-bold uppercase tracking-wider mb-3 inline-block rounded-sm">AI Briefing</span>
          <h4 className="text-white text-xl md:text-2xl font-serif font-bold leading-tight drop-shadow-md">{briefing.headline}</h4>
        </div>
        <button onClick={() => { setShowVideo(false); setVideoResult(null); }}
          className="absolute top-4 right-4 bg-black/40 hover:bg-black/80 text-white p-2 rounded-full backdrop-blur-sm z-20">
          <X className="w-4 h-4" />
        </button>
      </motion.div>
    );
  }

  // ── Main card ───────────────────────────────────────────────────
  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm flex flex-col h-full min-h-[450px]">

      {/* Header */}
      <div className="bg-slate-50/80 p-4 border-b border-slate-200 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-serif font-bold text-slate-900">Video Briefing</h3>
          <p className="text-xs text-slate-500 font-sans font-medium uppercase tracking-wider mt-1">
            Scenes via n8n · Read by Browser TTS
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">n8n Live</span>
        </div>
      </div>

      <div className="flex-1 flex flex-col p-6 relative">

        {/* ── TTS Player (shown while speaking) ── */}
        <AnimatePresence>
          {isSpeaking && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mb-5 bg-slate-900 rounded-2xl p-5 text-left shadow-xl"
            >
              {/* Live label + waveform */}
              <div className="flex items-center gap-2 mb-3">
                <Radio className="w-4 h-4 text-red-500" />
                <span className="text-red-400 text-xs font-bold uppercase tracking-wider">
                  {isPaused ? 'Paused' : 'On Air'}
                </span>
                <div className="flex items-end gap-0.5 ml-2">
                  {[...Array(10)].map((_, i) => (
                    <motion.div
                      key={i}
                      animate={{ height: isPaused ? 3 : [3, 8 + Math.random() * 14, 3] }}
                      transition={{ duration: 0.4 + Math.random() * 0.3, repeat: Infinity, delay: i * 0.05 }}
                      className="w-1.5 bg-red-500 rounded-full"
                      style={{ minHeight: 3 }}
                    />
                  ))}
                </div>
              </div>

              {/* Current scene text */}
              <AnimatePresence mode="wait">
                <motion.p
                  key={currentSceneIdx}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.3 }}
                  className="text-white/90 text-sm font-sans font-medium leading-relaxed italic mb-1"
                >
                  "{scenes[currentSceneIdx]}"
                </motion.p>
              </AnimatePresence>
              <p className="text-slate-500 text-[10px] font-medium mb-4">
                Scene {currentSceneIdx + 1} of {scenes.length}
              </p>

              {/* Progress bar */}
              <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden mb-4">
                <motion.div
                  style={{ width: `${ttsProgress}%` }}
                  className="h-full bg-red-500 rounded-full transition-all duration-500"
                />
              </div>

              {/* Controls */}
              <div className="flex gap-2">
                <button onClick={handleListenWithN8N}
                  className="flex-1 flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold py-2.5 rounded-xl transition-colors">
                  {isPaused ? <PlayCircle className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                  {isPaused ? 'Resume' : 'Pause'}
                </button>
                <button onClick={handleStop}
                  className="flex-1 flex items-center justify-center gap-2 bg-red-600/80 hover:bg-red-600 text-white text-xs font-bold py-2.5 rounded-xl transition-colors">
                  <Square className="w-3.5 h-3.5" />
                  Stop
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error */}
        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="mb-4 bg-red-50 rounded-xl p-4 border border-red-200 flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <p className="text-red-700 text-xs font-medium">{error}</p>
          </motion.div>
        )}

        {/* Scenes preview (after fetch) */}
        {scenes.length > 0 && !isSpeaking && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="mb-5 bg-slate-50 rounded-xl p-4 border border-slate-200">
            <p className="text-slate-400 text-[10px] uppercase tracking-wider font-bold mb-3">
              {scenes.length} Scenes from n8n
            </p>
            {scenes.slice(0, 3).map((s, i) => (
              <p key={i} className="text-slate-600 text-xs font-medium mb-1.5 italic">
                <span className="text-slate-400 not-italic font-bold mr-1">{i + 1}.</span>"{s}"
              </p>
            ))}
            {scenes.length > 3 && (
              <p className="text-slate-400 text-[10px] font-medium mt-1">+{scenes.length - 3} more scenes...</p>
            )}
          </motion.div>
        )}

        {/* CTA area */}
        {!isSpeaking && (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-slate-900 text-white rounded-full flex items-center justify-center mb-5 shadow-lg">
              <Mic2 className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-serif font-bold text-slate-900 mb-2">
              {scenes.length > 0 ? 'Ready to broadcast!' : 'AI-Narrated Briefing'}
            </h3>
            <p className="text-slate-500 font-sans text-sm font-medium mb-6 max-w-xs">
              {scenes.length > 0
                ? `${scenes.length} scenes loaded from n8n. Click Listen to play.`
                : 'Fetches scenes from your n8n workflow, then reads them aloud using Browser TTS.'}
            </p>
          </div>
        )}

        {/* Primary: Listen via n8n + TTS */}
        <button
          onClick={handleListenWithN8N}
          disabled={isFetchingScenes}
          className="w-full flex items-center justify-center gap-3 bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white py-4 rounded-2xl font-bold text-sm uppercase tracking-wider transition-all shadow-lg mb-3"
        >
          {isFetchingScenes ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Fetching Scenes from n8n...</>
          ) : isSpeaking && !isPaused ? (
            <><VolumeX className="w-4 h-4" /> Pause</>
          ) : isPaused ? (
            <><PlayCircle className="w-4 h-4" /> Resume</>
          ) : (
            <><Volume2 className="w-4 h-4" /> {scenes.length > 0 ? '🔁 Play Again' : '🎤 Listen via n8n + TTS'}</>
          )}
        </button>

        {/* Remotion Animated MP4 */}
        <button
          onClick={handleRenderAnimated}
          disabled={isRenderingAnimated || scenes.length === 0}
          className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-2xl font-bold text-sm uppercase tracking-wider transition-colors shadow-lg shadow-violet-600/20 mb-2"
        >
          {isRenderingAnimated ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> {renderProgress || 'Rendering...'}</>
          ) : (
            <><Film className="w-4 h-4" /> 🎬 Generate Animated MP4 (Remotion)</>
          )}
        </button>
        {scenes.length === 0 && (
          <p className="text-center text-slate-400 text-[10px] mb-2">Fetch scenes first to enable Remotion</p>
        )}

        {/* MoviePy MP4 */}
        <button
          onClick={handleGenerateVideo}
          disabled={isVideoLoading}
          className="w-full flex items-center justify-center gap-2 border border-slate-200 hover:bg-slate-50 disabled:opacity-60 text-slate-700 py-3 rounded-2xl font-bold text-sm uppercase tracking-wider transition-colors"
        >
          {isVideoLoading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Generating MP4...</>
          ) : (
            <><PlayCircle className="w-4 h-4" /> Generate MP4 (MoviePy)</>
          )}
        </button>

        {/* Assets created */}
        {videoResult && !videoResult.video_url && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="mt-4 bg-emerald-50 rounded-xl p-4 border border-emerald-200 text-left">
            <p className="text-emerald-700 font-bold text-sm mb-2">Assets Created</p>
            {(videoResult.files || []).map(f => (
              <a key={f} href={`/videos/${f}`} download
                className="flex items-center gap-2 text-xs text-emerald-700 hover:text-emerald-900 font-medium mt-1">
                <Download className="w-3 h-3" /> {f}
              </a>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
