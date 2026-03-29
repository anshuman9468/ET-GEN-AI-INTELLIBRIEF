#!/usr/bin/env python3
"""
Simplified Video Generator - No MoviePy Required
===============================================
Generates:
- Voiceover audio file (MP3)
- Video script text file
- Instructions for manual video creation

Usage:
    python simple_video_generator.py --file briefings/file.json
"""

import json
import os
from datetime import datetime
from pathlib import Path

try:
    from gtts import gTTS
    GTTS_AVAILABLE = True
except ImportError:
    GTTS_AVAILABLE = False


class SimpleVideoGenerator:
    """Generate audio and script without MoviePy."""

    def __init__(self, output_dir: str = "./videos"):
        self.output_dir = output_dir
        os.makedirs(output_dir, exist_ok=True)

    def generate_audio(self, script_text: str, output_path: str) -> str:
        """Generate voiceover audio using Google TTS."""
        if not GTTS_AVAILABLE:
            return None

        try:
            print(f"🎙️  Generating audio...")
            tts = gTTS(text=script_text, lang='en', slow=False)
            tts.save(output_path)
            return output_path
        except Exception as e:
            print(f"❌ Audio Error: {e}")
            return None

    def generate_video_package(self, briefing: dict) -> dict:
        """Generate audio + script files."""

        video_script = briefing.get('video_script', {})
        headline = briefing.get('headline', 'News Briefing')
        topic = briefing.get('metadata', {}).get('topic', 'topic')

        # Create output filename base
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        topic_slug = topic.replace(' ', '_').lower()[:30]
        base_name = f"{topic_slug}_{timestamp}"

        results = {
            "audio_file": None,
            "script_file": None,
            "instructions_file": None
        }

        # Build full script text
        full_script = f"{video_script.get('hook', '')} "
        full_script += " ".join(video_script.get('body', []))
        full_script += f" {video_script.get('closing', '')}"

        # Save script as text file
        script_path = os.path.join(self.output_dir, f"{base_name}_script.txt")
        with open(script_path, 'w', encoding='utf-8') as f:
            f.write(f"HEADLINE: {headline}\n\n")
            f.write("="*60 + "\n")
            f.write("VIDEO SCRIPT\n")
            f.write("="*60 + "\n\n")
            f.write(f"HOOK:\n{video_script.get('hook', 'N/A')}\n\n")
            f.write("BODY:\n")
            for i, line in enumerate(video_script.get('body', []), 1):
                f.write(f"{i}. {line}\n")
            f.write(f"\nCLOSING:\n{video_script.get('closing', 'N/A')}\n")
        results["script_file"] = script_path
        print(f"📝 Script saved: {script_path}")

        # Generate audio if gTTS available
        if GTTS_AVAILABLE and full_script.strip():
            audio_path = os.path.join(self.output_dir, f"{base_name}_audio.mp3")
            audio_result = self.generate_audio(full_script.strip(), audio_path)
            if audio_result:
                results["audio_file"] = audio_result
                print(f"🔊 Audio saved: {audio_result}")

        # Create instructions file
        instructions_path = os.path.join(self.output_dir, f"{base_name}_instructions.md")
        with open(instructions_path, 'w', encoding='utf-8') as f:
            f.write(f"""# Video Creation Instructions

## Headline
{headline}

## TL;DR
{briefing.get('tldr', 'N/A')}

## Audio File
- File: `{base_name}_audio.mp3`
- Duration: ~45-60 seconds
- Voice: Google TTS (English)

## Video Script

### HOOK (5 seconds)
{video_script.get('hook', 'N/A')}

### BODY (40 seconds)
"""
            )
            for i, line in enumerate(video_script.get('body', []), 1):
                f.write(f"{i}. {line}\n")
            f.write(f"""
### CLOSING (5 seconds)
{video_script.get('closing', 'N/A')}

## Visual Suggestions

1. **Opening (0-3s)**: Title card with headline
   - Background: Dark blue (#1e1b4b)
   - Text: White, bold, centered
   - Animation: Fade in

2. **Hook (3-8s)**: Key message
   - Text: Cyan highlight
   - Show relevant news image/stock footage

3. **Body (8-48s)**: Key insights
   - Each point on screen for ~8 seconds
   - Use bullet points with icons
   - Background: Dark gradient

4. **Closing (48-53s)**: Final message
   - Call to action
   - Channel logo
   - Subscribe reminder

## How to Create Video

### Option 1: CapCut (Free, Easy)
1. Import the audio file
2. Add text overlays for each section
3. Add stock footage/images
4. Export as 1080p MP4

### Option 2: Canva (Free)
1. Create new video project
2. Upload audio
3. Use text templates
4. Add animations

### Option 3: OBS + Editor
1. Record screen with text overlays
2. Add audio track
3. Sync visuals to audio

## Stock Footage Sources
- Pexels: https://www.pexels.com/videos/
- Pixabay: https://pixabay.com/videos/
- Coverr: https://coverr.co/

## Tips
- Keep text on screen for 3-5 seconds minimum
- Use transitions between sections
- Add subtle background music (volume -20dB)
- Export in 1080p (1920x1080)
""")
        results["instructions_file"] = instructions_path
        print(f"📖 Instructions saved: {instructions_path}")

        return results


def main():
    import argparse

    parser = argparse.ArgumentParser(description="Generate video assets")
    parser.add_argument("--file", "-f", required=True, help="Path to briefing JSON file")
    parser.add_argument("--output", "-o", default="./videos", help="Output directory")

    args = parser.parse_args()

    if not os.path.exists(args.file):
        print(f"❌ File not found: {args.file}")
        return

    # Load briefing
    with open(args.file, 'r') as f:
        briefing = json.load(f)

    # Generate
    generator = SimpleVideoGenerator(output_dir=args.output)
    results = generator.generate_video_package(briefing)

    print("\n" + "="*60)
    print("✅ VIDEO PACKAGE CREATED")
    print("="*60)
    for key, path in results.items():
        if path:
            print(f"  📄 {key}: {path}")
    print("="*60)


if __name__ == "__main__":
    main()
