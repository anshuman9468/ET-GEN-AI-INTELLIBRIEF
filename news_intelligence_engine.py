#!/usr/bin/env python3

import json
import argparse
import os
from datetime import datetime
from typing import Dict, List, Optional
import requests
import re


# =========================
# 🔒 VALIDATION FUNCTION
# =========================
def validate_briefing(data: dict) -> dict:
    required_keys = [
        "headline", "tldr", "key_points", "winners", "losers",
        "market_impact", "why_it_matters", "what_next",
        "for_you", "contrarian_view", "confidence_score", "video_script"
    ]

    for key in required_keys:
        if key not in data:
            data[key] = [] if isinstance(key, list) else ""

    if "video_script" not in data or not isinstance(data["video_script"], dict):
        data["video_script"] = {
            "hook": "",
            "body": [],
            "closing": ""
        }

    return data


# =========================
# 🧠 CORE ENGINE
# =========================
class NewsIntelligenceEngine:

    def save_output(self, briefing: Dict, output_dir: str = "./briefings") -> str:
        os.makedirs(output_dir, exist_ok=True)

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        topic_slug = briefing.get("headline", "news").replace(" ", "_").lower()[:30]

        filepath = os.path.join(output_dir, f"{topic_slug}_{timestamp}.json")

        with open(filepath, 'w') as f:
            json.dump(briefing, f, indent=2)

        # 🔥 IMPORTANT: Save latest for Remotion
        with open("latest_briefing.json", "w") as f:
            json.dump(briefing, f, indent=2)

        return filepath


# =========================
# 🤖 CLAUDE API
# =========================
class ClaudeAPIIntegration:

    def __init__(self, api_key: str):
        self.api_key = api_key
        self.api_url = "https://api.anthropic.com/v1/messages"

    def generate_briefing(self, topic: str, persona: str, news_context: str) -> Dict:

        system_prompt = """You are an elite business news intelligence engine.
Output MUST be valid JSON only. No markdown. No explanation."""

        user_prompt = f"""
Topic: {topic}
Persona: {persona}

News Context:
{news_context}

Return JSON:

{{
  "headline": "...",
  "tldr": "...",
  "key_points": ["..."],
  "winners": ["..."],
  "losers": ["..."],
  "market_impact": "...",
  "why_it_matters": "...",
  "what_next": ["..."],
  "for_you": "...",
  "contrarian_view": "...",
  "confidence_score": 85,
  "video_script": {{
    "hook": "...",
    "body": ["short line", "short line"],
    "closing": "..."
  }}
}}

RULES:
- Hook must feel like breaking news
- Body lines max 10 words
- Keep video length 45–60 sec
- No fluff
"""

        headers = {
            "x-api-key": self.api_key,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json"
        }

        payload = {
            "model": "claude-sonnet-4-6",
            "max_tokens": 2000,
            "system": system_prompt,
            "messages": [{"role": "user", "content": user_prompt}]
        }

        try:
            response = requests.post(self.api_url, headers=headers, json=payload)
            response.raise_for_status()

            content = response.json()["content"][0]["text"]

            # 🔥 CLEAN JSON
            clean_text = re.sub(r'```json|```', '', content).strip()

            return json.loads(clean_text)

        except Exception as e:
            print("❌ Claude Error:", e)
            return None


# =========================
# 🤖 OLLAMA (FALLBACK)
# =========================
class OllamaAPIIntegration:

    def __init__(self, model: str = "llama3.2"):
        self.model = model
        self.api_url = "http://localhost:11434/api/generate"

    def generate_briefing(self, topic: str, persona: str, news_context: str = "") -> dict:

        prompt = f"""You are a news briefing engine. You MUST respond with valid JSON only. No explanation. No markdown. No extra text.

Topic: {topic}
Persona: {persona}

Return ONLY this JSON structure:
{{
  "headline": "short headline here",
  "tldr": "one line summary",
  "key_points": ["point 1", "point 2", "point 3"],
  "winners": ["winner 1"],
  "losers": ["loser 1"],
  "market_impact": "brief market impact",
  "why_it_matters": "why this matters",
  "what_next": ["next step 1", "next step 2"],
  "for_you": "what this means for the reader",
  "contrarian_view": "opposing perspective",
  "confidence_score": 75,
  "video_script": {{
    "hook": "breaking news hook under 10 words",
    "body": ["short line 1", "short line 2", "short line 3"],
    "closing": "closing line under 10 words"
  }}
}}"""

        payload = {
            "model": self.model,
            "prompt": prompt,
            "stream": False,
            "format": "json"
        }

        try:
            response = requests.post(self.api_url, json=payload, timeout=60)
            raw = response.json()
            text = raw.get("response", "")

            print(f"📡 Ollama raw response length: {len(text)} chars")

            if not text.strip():
                print("❌ Ollama returned empty response")
                return None

            # Strip markdown fences if present
            clean_text = re.sub(r'```json|```', '', text).strip()

            # Try direct parse
            try:
                return json.loads(clean_text)
            except json.JSONDecodeError:
                # Try to extract first JSON object using regex
                match = re.search(r'\{.*\}', clean_text, re.DOTALL)
                if match:
                    return json.loads(match.group())
                print("❌ Ollama: Could not extract JSON from response")
                return None

        except Exception as e:
            print("❌ Ollama Error:", e)
            return None


# =========================
# 📰 NEWS FETCH (SIMPLIFIED)
# =========================
def fetch_news_context(topic: str) -> str:
    return f"Latest business news about {topic}"


# =========================
# 🚀 MAIN
# =========================
def main():

    parser = argparse.ArgumentParser()
    parser.add_argument("--topic", required=True)
    parser.add_argument("--persona", default="founder")

    args = parser.parse_args()

    print("\n🚀 Generating Intelligence...\n")

    # Fetch context
    news_context = fetch_news_context(args.topic)

    # Try Claude
    briefing = None
    claude_key = os.getenv("CLAUDE_API_KEY")

    if claude_key:
        print("🧠 Trying Claude API...")
        claude = ClaudeAPIIntegration(claude_key)
        briefing = claude.generate_briefing(args.topic, args.persona, news_context)

    # Fallback to Ollama
    if not briefing:
        print("⚠️ Claude failed → Using Ollama fallback...")
        ollama = OllamaAPIIntegration()
        briefing = ollama.generate_briefing(args.topic, args.persona, news_context)

    # Final fallback
    if not briefing:
        print("🛑 Ollama failed → Using manual fallback...")
        briefing = {
            "headline": f"{args.topic} Update",
            "tldr": "Manual fallback",
            "key_points": ["Add API key"],
            "video_script": {
                "hook": "Breaking news update",
                "body": ["Data unavailable"],
                "closing": "Stay tuned"
            }
        }

    # ✅ VALIDATE
    briefing = validate_briefing(briefing)

    # Save
    engine = NewsIntelligenceEngine()
    path = engine.save_output(briefing)

    print("\n✅ DONE")
    print(f"Saved: {path}")
    print("\n🎥 Video Script:")
    print(briefing["video_script"]["hook"])


if __name__ == "__main__":
    main()