#!/usr/bin/env python3
"""
News Intelligence Engine - Video Generator
==========================================
Generates a real MP4 news video:
  - Background: custom news frame image
  - Voiceover: ElevenLabs AI (professional quality)
  - Video: FFmpeg to stitch image + audio into MP4

No Pillow, no MoviePy, no drawtext needed.
"""

import json
import os
import re
import shutil
import subprocess
import tempfile
from datetime import datetime
from typing import Dict, Optional

# Use the bundled full-featured ffmpeg from imageio_ffmpeg
try:
    import imageio_ffmpeg
    FFMPEG_PATH = imageio_ffmpeg.get_ffmpeg_exe()
    FFMPEG_AVAILABLE = True
except Exception:
    FFMPEG_PATH = shutil.which("ffmpeg") or "ffmpeg"
    FFMPEG_AVAILABLE = shutil.which("ffmpeg") is not None

# Mark as available when FFmpeg is ready
MOVIEPY_AVAILABLE = FFMPEG_AVAILABLE

BG_VIDEO_PATH = os.getenv("NEWS_BG_VIDEO", "./AI_Newsroom_Video_Generation.mp4")


class VideoGenerator:
    """Generate news briefing videos: background image + ElevenLabs voiceover."""

    def __init__(self, output_dir: str = "./videos"):
        self.output_dir = output_dir
        os.makedirs(output_dir, exist_ok=True)
        self.bg_video = os.getenv("NEWS_BG_VIDEO", BG_VIDEO_PATH)

    @property
    def api_key(self):
        """Always read key fresh from environment (supports .env reload)."""
        from dotenv import load_dotenv
        load_dotenv(override=True)  # Reload .env on each call
        return os.getenv("ELEVENLABS_API_KEY", "")

    def generate_voiceover_elevenlabs(self, text: str, out_path: str) -> Optional[str]:
        """Generate voiceover using ElevenLabs API (pure HTTP, no SDK)."""
        key = self.api_key
        if not key:
            print("⚠️ ELEVENLABS_API_KEY is not set in .env")
            return None

        print(f"🔑 Using ElevenLabs key: {key[:8]}...({len(key)} chars)")

        # Clean text for TTS
        clean_text = re.sub(r'[#*\[\]<>]', '', text).strip()
        if len(clean_text) > 2500:
            clean_text = clean_text[:2500]

        print(f"🎙️  Calling ElevenLabs TTS ({len(clean_text)} chars)...")

        # Use Rachel voice (natural, clear news anchor style)
        voice_id = "21m00Tcm4TlvDq8ikWAM"
        url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"

        headers = {
            "xi-api-key": key,
            "Content-Type": "application/json",
            "Accept": "audio/mpeg"
        }
        payload = {
            "text": clean_text,
            "model_id": "eleven_monolingual_v1",
            "voice_settings": {
                "stability": 0.5,
                "similarity_boost": 0.75
            }
        }

        try:
            import urllib.request
            import urllib.error

            data = json.dumps(payload).encode("utf-8")
            req = urllib.request.Request(url, data=data, headers=headers, method="POST")

            with urllib.request.urlopen(req, timeout=60) as resp:
                audio_data = resp.read()

            if len(audio_data) < 1000:
                print("❌ ElevenLabs returned too small a response")
                return None

            with open(out_path, 'wb') as f:
                f.write(audio_data)

            print(f"✅ Voiceover saved ({len(audio_data)//1024} KB)")
            return out_path

        except urllib.error.HTTPError as e:
            body = e.read().decode('utf-8', errors='replace')[:300]
            print(f"❌ ElevenLabs HTTP {e.code}: {e.reason}")
            print(f"   Response body: {body}")
            return None
        except Exception as e:
            print(f"❌ ElevenLabs error: {e}")
            return None

    def get_audio_duration(self, audio_path: str) -> float:
        """Get duration of audio file using ffprobe (reliable)."""
        try:
            # Look for ffprobe next to ffmpeg or in PATH
            ffprobe_path = FFMPEG_PATH.replace("ffmpeg", "ffprobe")
            if not os.path.exists(ffprobe_path):
                ffprobe_path = shutil.which("ffprobe") or "ffprobe"
            
            cmd = [
                ffprobe_path, "-v", "error", 
                "-show_entries", "format=duration", 
                "-of", "default=noprint_wrappers=1:nokey=1", 
                audio_path
            ]
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=10)
            if result.returncode == 0:
                return float(result.stdout.strip())
        except Exception as e:
            print(f"⚠️ Duration detection failed for {audio_path}: {e}")
        
        # Fallback: estimate 5s if truly failed (don't use 60s as it creates huge gaps)
        return 5.0 

    def generate_video(self, briefing: Dict, output_filename: Optional[str] = None) -> Optional[str]:
        """Generate MP4: background image looped for audio duration + ElevenLabs voiceover."""

        if not FFMPEG_AVAILABLE:
            print("❌ FFmpeg not available")
            return None

        headline = briefing.get('headline', 'News Briefing')
        topic = briefing.get('metadata', {}).get('topic', headline)
        video_script = briefing.get('video_script', {})

        print(f"🎬 Generating video: {headline[:60]}...")

        if not output_filename:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            slug = re.sub(r'[^a-z0-9]+', '_', topic.lower())[:25]
            output_filename = f"{slug}_{timestamp}.mp4"

        output_path = os.path.join(self.output_dir, output_filename)

        # Build full narration script
        parts = []
        if headline:
            parts.append(f"Breaking news. {headline}.")
        tldr = briefing.get('tldr', '')
        if tldr:
            parts.append(tldr)
        if video_script.get('hook'):
            parts.append(video_script['hook'])
        for line in video_script.get('body', []):
            if line.strip():
                parts.append(line)
        if video_script.get('closing'):
            parts.append(video_script['closing'])
        why = briefing.get('why_it_matters', '')
        if why:
            parts.append(f"Why it matters: {why}")

        full_narration = " ... ".join(parts).strip()
        if not full_narration:
            full_narration = headline

        with tempfile.TemporaryDirectory() as tmpdir:
            # 1. Generate voiceover
            audio_path = os.path.join(tmpdir, "narration.mp3")
            has_audio = self.generate_voiceover_elevenlabs(full_narration, audio_path)

            # 2. Resolve background video path
            bg_path = self.bg_video
            if not os.path.isabs(bg_path):
                bg_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), bg_path)
            bg_exists = os.path.exists(bg_path)
            if not bg_exists:
                print(f"⚠️ Background video not found: {bg_path}")

            # 3. Determine audio duration
            if has_audio and os.path.exists(audio_path):
                duration = self.get_audio_duration(audio_path)
                print(f"🕐 Audio duration: {duration:.1f}s")
            else:
                duration = 60.0

            # 4. Build FFmpeg command
            # Strategy: loop the background video, replace/add audio track
            if bg_exists and has_audio:
                # Loop the background video for the audio duration, mux in audio
                cmd = [
                    FFMPEG_PATH, "-y", "-hide_banner", "-loglevel", "error",
                    "-stream_loop", "-1",          # Loop bg video infinitely
                    "-i", bg_path,                  # Input: background video
                    "-i", audio_path,               # Input: ElevenLabs voiceover
                    "-map", "0:v:0",               # Use video from bg
                    "-map", "1:a:0",               # Use audio from voiceover
                    "-c:v", "libx264",
                    "-preset", "fast",
                    "-c:a", "aac", "-b:a", "192k",
                    "-pix_fmt", "yuv420p",
                    "-vf", "scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2:color=black",
                    "-shortest",                   # End when audio ends
                    "-movflags", "+faststart",
                    output_path
                ]
            elif bg_exists and not has_audio:
                # Loop the background video for fixed duration, no audio
                cmd = [
                    FFMPEG_PATH, "-y", "-hide_banner", "-loglevel", "error",
                    "-stream_loop", "-1",
                    "-i", bg_path,
                    "-c:v", "libx264",
                    "-preset", "fast",
                    "-pix_fmt", "yuv420p",
                    "-vf", "scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2:color=black",
                    "-t", str(duration),
                    "-movflags", "+faststart",
                    output_path
                ]
            else:
                # Fallback: plain color background
                bg_color = "0x0f1432"
                if has_audio:
                    cmd = [
                        FFMPEG_PATH, "-y", "-hide_banner", "-loglevel", "error",
                        "-f", "lavfi", "-i", f"color=c={bg_color}:s=1280x720",
                        "-i", audio_path,
                        "-c:v", "libx264", "-preset", "fast",
                        "-c:a", "aac", "-b:a", "192k",
                        "-pix_fmt", "yuv420p",
                        "-shortest",
                        output_path
                    ]
                else:
                    cmd = [
                        FFMPEG_PATH, "-y", "-hide_banner", "-loglevel", "error",
                        "-f", "lavfi", "-i", f"color=c={bg_color}:s=1280x720:d={duration}",
                        "-c:v", "libx264", "-preset", "fast",
                        "-pix_fmt", "yuv420p",
                        output_path
                    ]

            print("📹 Rendering video...")
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=180)

            if result.returncode != 0:
                print(f"❌ FFmpeg error:\n{result.stderr[-800:]}")
                return None

        if os.path.exists(output_path):
            size_mb = os.path.getsize(output_path) / 1024 / 1024
            duration_str = f"{duration:.0f}s" if has_audio else "static"
            print(f"✅ Video saved: {output_path}")
            print(f"   Size: {size_mb:.1f} MB | Duration: {duration_str}")
            return output_path

        print("❌ Video file was not created")
        return None

    def generate_from_briefing_file(self, filepath: str) -> Optional[str]:
        """Generate video from a briefing JSON file."""
        with open(filepath, 'r') as f:
            briefing = json.load(f)
        return self.generate_video(briefing)


def main():
    import argparse
    parser = argparse.ArgumentParser(description="Generate news video from briefing")
    parser.add_argument("--briefing", "-b", help="Path to briefing JSON file")
    parser.add_argument("--topic", "-t", help="Topic to generate briefing and video for")
    parser.add_argument("--persona", "-p", default="founder",
                        choices=["investor", "founder", "student"])
    parser.add_argument("--output", "-o", default="./videos")
    args = parser.parse_args()

    from dotenv import load_dotenv
    load_dotenv()

    gen = VideoGenerator(output_dir=args.output)

    if args.briefing:
        result = gen.generate_from_briefing_file(args.briefing)
    elif args.topic:
        from app import claude_api, ollama_api, FreeNewsFetcher, OUTPUT_DIR
        news = FreeNewsFetcher.get_news_context(args.topic)
        briefing = None
        if os.getenv("CLAUDE_API_KEY"):
            briefing = claude_api.generate_briefing(args.topic, args.persona, news)
        if not briefing or "error" in briefing:
            briefing = ollama_api.generate_briefing(args.topic, args.persona, news)
        if not briefing:
            print("❌ Failed to generate briefing"); return
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        fn = f"{args.topic.replace(' ','_').lower()[:30]}_{args.persona}_{timestamp}.json"
        fp = os.path.join(OUTPUT_DIR, fn)
        briefing['metadata'] = {"topic": args.topic, "persona": args.persona,
                                  "generated_at": datetime.now().isoformat()}
        with open(fp, 'w') as f:
            json.dump(briefing, f, indent=2)
        result = gen.generate_video(briefing)
    else:
        parser.print_help(); return

    if result:
        print(f"\n🎉 Video created: {result}")
    else:
        print("\n❌ Generation failed")


if __name__ == "__main__":
    main()
