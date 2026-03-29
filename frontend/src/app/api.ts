/**
 * API Service — all calls to the Flask backend.
 * The Vite dev proxy forwards /api/* → http://localhost:5000/api/*
 */

export interface BriefingData {
  headline: string;
  tldr: string;
  key_points: string[];
  winners: string[];
  losers: string[];
  market_impact: string;
  why_it_matters: string;
  what_next: string[];
  for_you: string;
  contrarian_view: string;
  confidence_score: number;
  video_script: {
    hook: string;
    body: string[];
    closing: string;
  };
  metadata: {
    topic: string;
    persona: string;
    generated_at: string;
  };
  filename: string;
}

export interface VideoResult {
  success: boolean;
  type: 'full_video' | 'simple_package';
  video_url?: string;
  message?: string;
  files?: string[];
  error?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
}

// Generate a briefing from topic + persona
export async function generateBriefing(
  topic: string,
  persona: string
): Promise<BriefingData> {
  const res = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ topic, persona }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

// Generate a video from a saved briefing file
export async function generateVideo(filename: string): Promise<VideoResult> {
  const res = await fetch(`/api/generate-video/${encodeURIComponent(filename)}`, {
    method: 'POST',
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

// Chat about the current briefing
export async function askQuestion(
  question: string,
  briefing: BriefingData
): Promise<string> {
  const briefingContext = [
    `Headline: ${briefing.headline}`,
    `TL;DR: ${briefing.tldr}`,
    `Key Points: ${briefing.key_points.join('; ')}`,
    `Winners: ${briefing.winners.join(', ')}`,
    `Losers: ${briefing.losers.join(', ')}`,
    `Market Impact: ${briefing.market_impact}`,
    `Why It Matters: ${briefing.why_it_matters}`,
    `What Next: ${briefing.what_next.join('; ')}`,
    `For You: ${briefing.for_you}`,
    `Contrarian View: ${briefing.contrarian_view}`,
  ].join('\n');

  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      question,
      briefing_context: briefingContext,
      topic: briefing.metadata?.topic || '',
    }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  const data = await res.json();
  return data.answer;
}

// ─── n8n Webhook ────────────────────────────────────────────────────
const N8N_WEBHOOK_URL =
  'https://anshumandutta.app.n8n.cloud/webhook/generate-news-video';

export interface N8NScene {
  text: string;
  [key: string]: any;
}

export interface N8NVideoResponse {
  scenes: N8NScene[];
  [key: string]: any;
}

/**
 * Fetch video scenes via Flask proxy → n8n webhook.
 * Proxying through Flask avoids browser CORS limitations.
 */
export async function fetchVideoScenes(
  topic: string,
  persona: string
): Promise<string[]> {
  const res = await fetch('/api/video-scenes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ topic, persona }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || `HTTP ${res.status}`);
  }

  const data = await res.json();
  const scenes: string[] = data.scenes || [];
  if (scenes.length === 0) {
    throw new Error('n8n returned no scenes. Make sure the workflow is Published and active.');
  }
  return scenes;
}
