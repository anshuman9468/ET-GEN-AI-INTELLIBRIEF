#!/usr/bin/env python3
"""
News Intelligence Engine - Web Application
==========================================
Flask-based web interface for generating business intelligence briefings.

Usage:
    python app.py
    # Open http://localhost:5000 in browser
"""

import json
import os
from datetime import datetime
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv
import requests
import re
from free_news_fetcher import FreeNewsFetcher

# Load environment variables
load_dotenv()

app = Flask(__name__)
app.config['JSON_SORT_KEYS'] = False
CORS(app)  # Allow cross-origin requests from Vite dev server

# Ensure output directory exists
OUTPUT_DIR = "./briefings"
os.makedirs(OUTPUT_DIR, exist_ok=True)


class ClaudeAPIIntegration:
    """Integration with Claude API for briefing generation."""

    def __init__(self, api_key: str):
        self.api_key = api_key
        self.api_url = "https://api.anthropic.com/v1/messages"

    def generate_briefing(self, topic: str, persona: str, news_context: str = "") -> dict:
        """Generate briefing using Claude API."""

        system_prompt = """You are an elite business news intelligence engine.
Transform the provided news into a structured, highly insightful briefing.
Output MUST be valid JSON only, no markdown, no extra text."""

        persona_focus = {
            "investor": "Focus on: market impact, sector rotation, stock implications, risk/opportunity analysis, valuation impacts",
            "founder": "Focus on: competitive landscape, funding environment, regulatory changes, strategic opportunities",
            "student": "Focus on: simplified explanations, key concepts defined, industry context, career implications"
        }.get(persona, "")

        user_prompt = f"""Topic: {topic}
Persona: {persona}
{persona_focus}

News Context:
{news_context}

Generate a structured intelligence briefing following this exact JSON format:

{{
  "headline": "A sharp, engaging headline (max 12 words)",
  "tldr": "2-3 line ultra-concise summary",
  "key_points": ["3-5 meaningful bullet insights"],
  "winners": ["Who benefits and WHY - specific"],
  "losers": ["Who is negatively impacted and WHY"],
  "market_impact": "How markets/sectors/economy react",
  "why_it_matters": "Deep reasoning on bigger picture importance",
  "what_next": ["3 forward-looking predictions"],
  "for_you": "Personalized insight based on {persona} persona",
  "contrarian_view": "Different or unexpected perspective",
  "confidence_score": 0-100,
  "video_script": {{
    "hook": "Strong opening line like a news anchor",
    "body": ["3-4 short key insight lines"],
    "closing": "Sharp concluding line"
  }}
}}

Rules:
- NO fluff, NO generic phrases
- Every sentence must add value
- Prioritize clarity over complexity
- Make it feel like insights from a top analyst"""

        headers = {
            "x-api-key": self.api_key,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json"
        }

        # Fixed model name to latest
        payload = {
            "model": "claude-3-5-sonnet-20241022",
            "max_tokens": 4000,
            "system": system_prompt,
            "messages": [{"role": "user", "content": user_prompt}]
        }

        try:
            response = requests.post(self.api_url, headers=headers, json=payload, timeout=120)
            response.raise_for_status()
            result = response.json()
            content = result["content"][0]["text"]
            return json.loads(content)
        except requests.exceptions.HTTPError as e:
            error_detail = ""
            try:
                error_detail = response.json().get("error", {}).get("message", str(e))
            except:
                error_detail = str(e)
            print(f"Claude API Error: {error_detail}")
            return {"error": f"Claude API: {error_detail}"}
        except Exception as e:
            print(f"Error calling Claude API: {e}")
            return {"error": str(e)}


class OllamaAPIIntegration:
    """Integration with local Ollama API for free briefing generation."""

    def __init__(self, model: str = "llama3.2"):
        self.model = model
        self.api_url = "http://localhost:11434/api/generate"

    def generate_briefing(self, topic: str, persona: str, news_context: str = "") -> dict:
        """Generate briefing using local Ollama."""
        print(f"🤖 Generating with local Ollama ({self.model})...")
        
        persona_focus = {
            "investor": "Focus on: market impact, sector rotation, stock implications, risk/opportunity analysis, valuation impacts",
            "founder": "Focus on: competitive landscape, funding environment, regulatory changes, strategic opportunities",
            "student": "Focus on: simplified explanations, key concepts defined, industry context, career implications"
        }.get(persona, "")

        prompt = f"""Topic: {topic}
Persona: {persona}
{persona_focus}

News Context:
{news_context}

Generate a structured intelligence briefing in EXACT JSON format.
Rules:
1. Output ONLY the JSON object.
2. NO markdown code blocks (no ```json).
3. NO extra text before or after.
4. MUST follow this structure:
{{
  "headline": "A sharp headline",
  "tldr": "2-3 line summary",
  "key_points": ["point 1", "point 2", "point 3"],
  "winners": ["winner 1"],
  "losers": ["loser 1"],
  "market_impact": "string",
  "why_it_matters": "string",
  "what_next": ["step 1"],
  "for_you": "personalized insight",
  "contrarian_view": "different perspective",
  "confidence_score": 85,
  "video_script": {{
    "hook": "string",
    "body": ["line 1", "line 2"],
    "closing": "string"
  }}
}}"""

        payload = {
            "model": self.model,
            "prompt": prompt,
            "stream": False,
            "format": "json"
        }

        try:
            response = requests.post(self.api_url, json=payload, timeout=180)
            response.raise_for_status()
            text = response.json().get("response", "")
            
            # Clean possible markdown
            clean_text = re.sub(r'```(?:json)?|```', '', text).strip()
            return json.loads(clean_text)
        except Exception as e:
            print(f"Ollama API Error: {e}")
            return {"error": f"Ollama Error: {e}"}


# Initialize Engines
claude_api = ClaudeAPIIntegration(os.getenv("CLAUDE_API_KEY", ""))
ollama_api = OllamaAPIIntegration(os.getenv("OLLAMA_MODEL", "llama3.2"))


@app.route('/')
def index():
    """API status — frontend runs on port 5173."""
    return jsonify({
        "status": "running",
        "message": "Intellibrief API is running. Open http://localhost:5173 for the frontend.",
        "endpoints": ["/api/generate", "/api/chat", "/api/generate-video/<filename>", "/api/history"]
    })


@app.route('/api/generate', methods=['POST'])
def generate_briefing():
    """API endpoint to generate a briefing."""
    data = request.json
    topic = data.get('topic', '').strip()
    persona = data.get('persona', 'founder')

    if not topic:
        return jsonify({"error": "Topic is required"}), 400

    # Fetch news context (using FREE sources - no API keys!)
    print(f"🔍 Fetching news for: {topic}")
    news_context = FreeNewsFetcher.get_news_context(topic)
    print(f"✓ Fetched {len(news_context)} characters of context")

    # Try Claude first if key exists, then fallback to Ollama
    briefing = None
    if os.getenv("CLAUDE_API_KEY"):
        briefing = claude_api.generate_briefing(topic, persona, news_context)
    
    # Fallback to Ollama if Claude fails or key is missing
    if not briefing or "error" in briefing:
        print(f"⚠️ Falling back to local Ollama...")
        briefing = ollama_api.generate_briefing(topic, persona, news_context)

    if "error" in briefing:
        return jsonify({
            "error": "All AI engines failed. Please ensure Ollama is running and model llama3.2 is pulled.",
            "details": briefing.get("error")
        }), 500

    # Add metadata
    briefing['metadata'] = {
        "topic": topic,
        "persona": persona,
        "generated_at": datetime.now().isoformat()
    }

    # Save to file
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"{topic.replace(' ', '_').lower()[:30]}_{persona}_{timestamp}.json"
    filepath = os.path.join(OUTPUT_DIR, filename)

    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(briefing, f, indent=2, ensure_ascii=False)

    briefing['filename'] = filename

    return jsonify(briefing)


@app.route('/api/history')
def get_history():
    """Get list of generated briefings."""
    briefings = []
    for filename in sorted(os.listdir(OUTPUT_DIR), reverse=True):
        if filename.endswith('.json'):
            filepath = os.path.join(OUTPUT_DIR, filename)
            try:
                with open(filepath, 'r') as f:
                    data = json.load(f)
                    briefings.append({
                        "filename": filename,
                        "headline": data.get('headline', 'Unknown'),
                        "persona": data.get('metadata', {}).get('persona', 'unknown'),
                        "date": data.get('metadata', {}).get('generated_at', ''),
                        "confidence": data.get('confidence_score', 0)
                    })
            except:
                pass
    return jsonify(briefings[:20])  # Return last 20


@app.route('/api/briefing/<filename>')
def get_briefing(filename):
    """Get a specific briefing by filename."""
    filepath = os.path.join(OUTPUT_DIR, filename)
    if os.path.exists(filepath):
        with open(filepath, 'r') as f:
            return jsonify(json.load(f))
    return jsonify({"error": "Briefing not found"}), 404


@app.route('/api/download/<filename>')
def download_briefing(filename):
    """Download a briefing JSON file."""
    return send_from_directory(OUTPUT_DIR, filename, as_attachment=True)


@app.route('/api/delete/<filename>', methods=['DELETE'])
def delete_briefing(filename):
    """Delete a briefing."""
    filepath = os.path.join(OUTPUT_DIR, filename)
    if os.path.exists(filepath):
        os.remove(filepath)
        return jsonify({"success": True})
    return jsonify({"error": "Briefing not found"}), 404


@app.route('/api/generate-video/<filename>', methods=['POST'])
def generate_video(filename):
    """Generate video from a briefing."""

    filepath = os.path.join(OUTPUT_DIR, filename)
    if not os.path.exists(filepath):
        return jsonify({"error": "Briefing not found"}), 404

    try:
        # Try full video generator first (requires MoviePy)
        try:
            from video_generator import VideoGenerator, MOVIEPY_AVAILABLE
            if MOVIEPY_AVAILABLE:
                generator = VideoGenerator(output_dir="./videos")
                video_path = generator.generate_from_briefing_file(filepath)

                if video_path:
                    return jsonify({
                        "success": True,
                        "video_path": video_path,
                        "video_url": f"/videos/{os.path.basename(video_path)}",
                        "type": "full_video"
                    })
        except Exception as moviepy_error:
            print(f"MoviePy failed, falling back to simple generator: {moviepy_error}")

        # Fallback: Simple generator (audio + script only)
        from simple_video_generator import SimpleVideoGenerator

        with open(filepath, 'r') as f:
            briefing = json.load(f)

        generator = SimpleVideoGenerator(output_dir="./videos")
        results = generator.generate_video_package(briefing)

        files_created = []
        if results.get("audio_file"):
            files_created.append(os.path.basename(results["audio_file"]))
        if results.get("script_file"):
            files_created.append(os.path.basename(results["script_file"]))
        if results.get("instructions_file"):
            files_created.append(os.path.basename(results["instructions_file"]))

        return jsonify({
            "success": True,
            "type": "simple_package",
            "message": "Video assets generated (MoviePy not installed - install for full video)",
            "files": files_created,
            "files_created": len(files_created)
        })

    except Exception as e:
        import traceback
        error_msg = str(e)
        print(f"Video generation error: {error_msg}")
        print(traceback.format_exc())
        return jsonify({
            "error": error_msg,
            "hint": "Install gTTS for audio: pip install gTTS"
        }), 500


@app.route('/videos/<filename>')
def serve_video(filename):
    """Serve generated videos."""
    return send_from_directory("./videos", filename)


@app.route('/api/chat', methods=['POST'])
def chat():
    """Chat endpoint — answer questions about a briefing topic."""
    data = request.json
    question = data.get('question', '').strip()
    briefing_context = data.get('briefing_context', '')
    topic = data.get('topic', '')

    if not question:
        return jsonify({"error": "Question is required"}), 400

    system_prompt = (
        "You are an elite business intelligence assistant specializing in financial markets "
        "and macroeconomics. Answer the user's question concisely and insightfully, "
        "drawing on the provided briefing context. Be direct, analytical, and add genuine value."
    )

    user_prompt = f"""Topic: {topic}

Briefing Context:
{briefing_context}

User Question: {question}

Provide a concise, insightful answer (2-4 sentences). Be specific and analytical."""

    answer = None

    # Try Claude first
    if os.getenv("CLAUDE_API_KEY"):
        headers = {
            "x-api-key": os.getenv("CLAUDE_API_KEY"),
            "anthropic-version": "2023-06-01",
            "content-type": "application/json"
        }
        payload = {
            "model": "claude-3-5-sonnet-20241022",
            "max_tokens": 512,
            "system": system_prompt,
            "messages": [{"role": "user", "content": user_prompt}]
        }
        try:
            r = requests.post("https://api.anthropic.com/v1/messages", headers=headers, json=payload, timeout=30)
            r.raise_for_status()
            answer = r.json()["content"][0]["text"]
        except Exception as e:
            print(f"Claude chat error: {e}")

    # Fallback to Ollama
    if not answer:
        try:
            r = requests.post(
                "http://localhost:11434/api/generate",
                json={"model": os.getenv("OLLAMA_MODEL", "llama3.2"), "prompt": user_prompt, "stream": False},
                timeout=60
            )
            r.raise_for_status()
            answer = r.json().get("response", "")
        except Exception as e:
            print(f"Ollama chat error: {e}")
            answer = "I'm unable to process your question at this time. Please ensure the AI backend is running."

    return jsonify({"answer": answer})


def _extract_scenes(result) -> list:
    """
    Robustly extract scene texts from any n8n response shape:
    - bare list of strings
    - {"scenes": [...]}
    - OpenRouter format: {"choices": [{"message": {"content": "..."}}]}
    - plain text string
    """
    import re as _re

    def _texts_from_list(lst):
        texts = []
        for s in lst:
            if isinstance(s, str) and s.strip():
                texts.append(s.strip())
            elif isinstance(s, dict):
                t = s.get("text") or s.get("content") or s.get("narration") or ""
                if t:
                    texts.append(str(t).strip())
        return texts

    def _parse_content_string(content: str):
        content = content.strip()
        # Try JSON parse first
        try:
            parsed = json.loads(content)
            if isinstance(parsed, list):
                return _texts_from_list(parsed)
            elif isinstance(parsed, dict):
                if "scenes" in parsed:
                    return _texts_from_list(parsed["scenes"])
                for k in ["narration", "text", "content", "script"]:
                    if k in parsed:
                        return _parse_content_string(str(parsed[k]))
        except (json.JSONDecodeError, ValueError):
            pass
        # Plain text — split by newlines or numbered lines
        lines = _re.split(r'\n+', content)
        lines = [_re.sub(r'^[\d\.\)\-\*]+\s*', '', l).strip() for l in lines]
        return [l for l in lines if len(l) > 8]

    # Case 1: bare list
    if isinstance(result, list):
        return _texts_from_list(result)

    if not isinstance(result, dict):
        return _parse_content_string(str(result))

    # Case 2: {scenes: [...]}
    if "scenes" in result and isinstance(result["scenes"], list):
        scenes = result["scenes"]
        if len(scenes) > 0:
            return _texts_from_list(scenes)

    # Case 3: OpenRouter / Claude API format
    choices = result.get("choices", [])
    if choices and isinstance(choices, list):
        content = choices[0].get("message", {}).get("content", "")
        if content:
            return _parse_content_string(content)

    # Case 4: nested under first key
    for key in ["data", "output", "result", "response"]:
        if key in result:
            return _extract_scenes(result[key])

    return []


N8N_WEBHOOK_URL = "https://anshumandutta.app.n8n.cloud/webhook/generate-news-video"

@app.route('/api/video-scenes', methods=['POST'])
def video_scenes():
    """Proxy to n8n webhook — avoids browser CORS issues."""
    data = request.json
    topic = data.get('topic', '').strip()
    persona = data.get('persona', 'investor').strip()

    if not topic:
        return jsonify({"error": "Topic is required"}), 400

    print(f"🎬 Fetching video scenes from n8n for: {topic} ({persona})")

    try:
        response = requests.post(
            N8N_WEBHOOK_URL,
            json={"topic": topic, "persona": persona},
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        response.raise_for_status()
        result = response.json()
        print(f"📦 Raw n8n response: {json.dumps(result)[:500]}")

        texts = _extract_scenes(result)

        # Clean up any unresolved n8n template variables e.g. {{$json.body.topic}}
        def _resolve_templates(scene: str) -> str:
            import re
            # Replace common n8n variable patterns with actual values
            scene = re.sub(r'\{\{[^}]*\.topic[^}]*\}\}', topic, scene)
            scene = re.sub(r'\{\{[^}]*\.persona[^}]*\}\}', persona, scene)
            # Remove any remaining unresolved {{ }} expressions
            scene = re.sub(r'\{\{[^}]+\}\}', '', scene).strip()
            return scene

        texts = [_resolve_templates(t) for t in texts]
        texts = [t for t in texts if len(t) > 5]  # filter out empty results

        print(f"✓ Got {len(texts)} scenes from n8n")
        return jsonify({"scenes": texts, "raw": result})

    except Exception as e:
        print(f"video_scenes error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/tts', methods=['POST'])
def generate_tts():
    """Generate free gTTS voiceovers for each scene to ensure perfect sync."""
    data = request.json
    scenes = data.get('scenes', [])
    if not scenes:
        return jsonify({"error": "No scenes provided"}), 400

    results = []
    total_duration = 0
    
    try:
        from gtts import gTTS
        from video_generator import VideoGenerator
        import base64
        
        gen = VideoGenerator()
        
        for i, text in enumerate(scenes):
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"tts_scene_{i}_{timestamp}.mp3"
            filepath = os.path.join("./videos", filename)
            
            # Generate audio for this specific scene
            tts = gTTS(text=text, lang='en', tld='com')
            tts.save(filepath)
            
            if os.path.exists(filepath):
                duration = gen.get_audio_duration(filepath)
                print(f"🎙️  Scene {i}: {duration:.2f}s | {text[:30]}...")
                
                with open(filepath, "rb") as audio_file:
                    audio_base64 = base64.b64encode(audio_file.read()).decode('utf-8')
                
                results.append({
                    "dataUri": f"data:audio/mpeg;base64,{audio_base64}",
                    "duration": duration,
                    "text": text
                })
                total_duration += duration
        
        print(f"🎬 Total sync duration: {total_duration:.2f}s")
        return jsonify({
            "success": True,
            "sceneAudio": results,
            "totalDuration": total_duration
        })
            
    except Exception as e:
        print(f"TTS Error: {e}")
        return jsonify({"error": str(e)}), 500


REMOTION_SERVER_URL = "http://localhost:3001"

@app.route('/api/render-remotion', methods=['POST'])
def render_remotion():
    """Proxy to Remotion render server — triggers animated MP4 generation."""
    data = request.json
    scenes = data.get('scenes', [])
    persona = data.get('persona', 'Investor')
    topic = data.get('topic', 'News')
    audio_url = data.get('audioUrl')
    duration = data.get('duration') # total seconds
    scene_audio = data.get('sceneAudio', []) # List of {dataUri, duration, text}

    if not scenes and not scene_audio:
        return jsonify({"error": "No scenes provided"}), 400

    print(f"🎬 Sending {len(scene_audio or scenes)} scenes to Remotion...")

    try:
        payload = {
            "scenes": scenes, 
            "persona": persona, 
            "topic": topic,
            "audioUrl": audio_url,
            "duration": duration,
            "sceneAudio": scene_audio
        }
        
        response = requests.post(
            f"{REMOTION_SERVER_URL}/render-video",
            json=payload,
            timeout=300 
        )
        response.raise_for_status()
        return jsonify(response.json())

    except requests.exceptions.ConnectionError:
        return jsonify({
            "error": "Remotion server is not running. Start it with: node video-server/server.js"
        }), 503
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    print("="*60)
    print("News Intelligence Engine - Web Server")
    print("="*60)
    print("Open your browser and go to: http://localhost:5000")
    print("="*60 + "\n")
    app.run(host='0.0.0.0', port=5000, debug=True)
