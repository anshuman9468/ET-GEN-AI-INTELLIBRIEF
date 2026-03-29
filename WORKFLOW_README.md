# News Intelligence Engine - COMPLETE WORKFLOW

## 🆓 FREE NEWS SOURCES (No API Keys Required!)

This system uses FREE news sources instead of paid APIs:
- **RSS Feeds**: NDTV, MoneyControl, Economic Times, TechCrunch
- **Wikipedia**: Context and background
- **Reddit**: Community discussions

Only **Claude API** is required for AI generation ($5 free credit).

---

## 🚀 QUICK START (3 COMMANDS)

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Set Your Claude API Key
```bash
# Create .env file
echo "CLAUDE_API_KEY=your_key_here" > .env
```

### 3. Run the System
```bash
# OPTION A: Web Interface Only
python workflow.py --mode web

# OPTION B: Auto Mode (Web + Scheduler)
python workflow.py --mode auto

# OPTION C: Generate One Briefing
python workflow.py --generate "Indian Budget" --persona founder
```

Then open: **http://localhost:5000**

---

## 📋 COMMANDS REFERENCE

| Command | Description |
|---------|-------------|
| `python workflow.py --mode web` | Web interface only |
| `python workflow.py --mode auto` | Web + Scheduler |
| `python workflow.py --mode scheduler` | Background scheduler |
| `python workflow.py -g "Topic" -p founder` | One-time briefing |
| `python workflow.py -a "Topic" -p investor --daily 09:00` | Schedule daily |
| `python workflow.py -a "Topic" -p student --weekly mon@08:00` | Schedule weekly |
| `python workflow.py --list` | View all schedules |
| `python workflow.py --remove 1` | Remove schedule #1 |

---

## 🏗️ ARCHITECTURE

```
┌─────────────────────────────────────────────────────────┐
│                    WORKFLOW MANAGER                     │
├──────────────┬──────────────┬──────────────────────────┤
│   WEB SERVER │  SCHEDULER   │   NEWS FETCHER (FREE)    │
│   :5000      │              │                          │
├──────────────┤              │  • RSS Feeds             │
│              │              │  • Wikipedia             │
│ ┌──────────┐ │              │  • Reddit                │
│ │  React   │ │  ┌────────┐  │                          │
│ │  Frontend│ │  │ Cron   │  └──────────┬───────────────┘
│ └────┬─────┘ │  │ Jobs   │             │
│      │       │  └───┬────┘             │
│      │       │      │                  │
│   POST /api  │   Triggers              │
│   /generate  │      │                  │
│      │       │      ▼                  ▼
│      ▼       │  ┌──────────────────────────┐
│  ┌───────────┴──┤    CLAUDE AI ENGINE      │
│  │              │  (Briefing Generator)    │
│  │   OUTPUT     └──────────┬───────────────┘
│  │   ./briefings/          │
│  │                         ▼
│  │              ┌───────────────────────┐
│  │              │  JSON Briefing Files  │
│  └──────────────┤  + Video Scripts      │
│                 └───────────────────────┘
└─────────────────────────────────────────────────────────┘
```

---

## 💰 COST BREAKDOWN

| Component | Cost | Notes |
|-----------|------|-------|
| Claude API | ~$0.01-0.03 per briefing | $5 free credit = ~200 briefings |
| News Sources | FREE | RSS, Wikipedia, Reddit |
| Video Generation | FREE | MoviePy + Google TTS (local) |
| Web Server | FREE | Local hosting |
| **Total** | **~$0.02/briefing** | After free credits |

---

## 🔄 AUTOMATION EXAMPLES

### Daily Market Briefing
```bash
python workflow.py -a "Indian Stock Market" -p investor --daily "09:00"
python workflow.py --mode auto
```

### Weekly Startup News
```bash
python workflow.py -a "Startup Funding India" -p founder --weekly "mon@08:00"
```

### Hourly Breaking News
```bash
python workflow.py -a "RBI Policy" -p investor --hourly
```

---

## 📁 OUTPUT STRUCTURE

```
briefings/
├── indian_budget_founder_20250321_143022.json
├── fed_rate_investor_20250321_150000.json
└── ...
```

Each file contains:
- Headline, TL;DR, Key Points
- Winners & Losers
- Market Impact Analysis
- Personalized "For You" section
- Video Script (45-60 seconds)
- Confidence Score

---

## 🎬 VIDEO GENERATION

Generate professional news videos from briefings!

### Features
- ✅ **AI Voiceover** - Google Text-to-Speech (free)
- ✅ **Text Overlays** - Professional styling with animations
- ✅ **Full HD Output** - 1920x1080 MP4 format
- ✅ **Automated Script** - Uses video_script from briefing

### Generate from Web UI
1. Create a briefing
2. Click **"🎬 Generate Video"** button
3. Video downloads automatically

### Generate from Command Line
```bash
# Install dependencies
pip install moviepy gTTS pillow imageio

# Generate video from existing briefing
python generate_video.py --file briefings/indian_budget_founder_*.json

# Generate briefing + video in one command
python video_generator.py --topic "Indian Budget" --persona founder
```

### Output
```
videos/
├── indian_budget_founder_20250321_143022.mp4
└── ...
```

**Note:** Video generation requires FFmpeg installed on your system:
- **Mac**: `brew install ffmpeg`
- **Ubuntu**: `sudo apt-get install ffmpeg`
- **Windows**: Download from https://ffmpeg.org/download.html

---

## 🛠️ TROUBLESHOOTING

### Error: "Claude API 400"
```bash
# Check your API key
cat .env
# Should show: CLAUDE_API_KEY=sk-ant-...

# Verify key at: https://console.anthropic.com/settings/keys
```

### No news found
- System automatically falls back to general knowledge
- Check internet connection for RSS feeds

### Port 5000 in use
```bash
# Kill process on port 5000
lsof -ti:5000 | xargs kill -9
```

---

## 🎯 USE CASES

1. **VC Firm**: Daily briefings on portfolio sectors
2. **Startup Founder**: Weekly competition & funding landscape
3. **Content Creator**: Video scripts for news channels
4. **Investment Analyst**: Breaking news impact analysis
5. **Student**: Simplified market explanations

---

**Ready! Run: `python workflow.py --mode auto`**
