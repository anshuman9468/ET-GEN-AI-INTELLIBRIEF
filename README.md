# 📰 InteliBrief — ET Gen AI Hackathon

> **Transforming raw business news into structured, persona-specific intelligence briefings — powered by Claude AI.**

Built for the **Economic Times Gen AI Hackathon**, InteliBrief is an automated news intelligence engine that fetches live business news, analyzes it with AI, and delivers tailored briefings for investors, founders, and students — complete with video narration scripts.

---

## ✨ Features

| Feature | Description |
|---|---|
| 🔍 **Automated News Fetching** | Integrates with Serper.dev and NewsAPI for real-time coverage |
| 🤖 **AI-Powered Analysis** | Uses Claude API for intelligent, context-aware briefing generation |
| 🎯 **Persona-Specific Output** | Tailored insights for Investors, Founders, or Students |
| 🎬 **Video Script Generation** | Auto-generates 45–60 second narration scripts per briefing |
| ⏰ **Scheduled Briefings** | Daily/weekly automated reports via a background scheduler |
| 🌐 **Webhook Integration** | Real-time briefing triggers via HTTP endpoints |

---

## 🚀 Quick Start

### 1. Installation

```bash
# Navigate into the project directory
cd news-intelligence-engine

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Open .env and fill in your API keys
```

### 2. API Keys Required

| Service | Purpose | Get Key |
|---|---|---|
| **Claude API** | Briefing generation | [console.anthropic.com](https://console.anthropic.com/) |
| **Serper.dev** | Google Search results | [serper.dev](https://serper.dev/) |
| **NewsAPI** | News articles | [newsapi.org](https://newsapi.org/) |

### 3. Generate Your First Briefing

```bash
# Basic usage
python news_intelligence_engine.py --topic "Indian Budget" --persona "founder"

# With a custom output directory
python news_intelligence_engine.py -t "Fed Rate Cut" -p "investor" -o ./reports
```

---

## 📄 Output Format

Each briefing is saved as a structured JSON file:

```json
{
  "headline": "Sharp, engaging headline (max 12 words)",
  "tldr": "2–3 line ultra-concise summary",
  "key_points": ["3–5 meaningful insights"],
  "winners": ["Who benefits and WHY"],
  "losers": ["Who is negatively impacted and WHY"],
  "market_impact": "How markets/sectors react",
  "why_it_matters": "Deep reasoning on importance",
  "what_next": ["3 forward-looking predictions"],
  "for_you": "Personalized insight based on persona",
  "contrarian_view": "A different, thought-provoking perspective",
  "confidence_score": 85,
  "video_script": {
    "hook": "Strong opening line to grab attention",
    "body": ["3–4 key insight lines for narration"],
    "closing": "Sharp concluding line"
  }
}
```

---

## ⚙️ Automation Workflows

### Scheduled Briefings

Use `scheduler.py` to automate recurring briefings:

```bash
# Daily briefing at 9 AM
python scheduler.py --add "Indian Stock Market" --persona "investor" --daily "09:00"

# Weekly briefing every Monday at 8 AM
python scheduler.py --add "Startup Funding" --persona "founder" --weekly "mon@08:00"

# List all scheduled briefings
python scheduler.py --list

# Start the scheduler as a background daemon
python scheduler.py --daemon
```

### Webhook Server

Trigger briefings in real-time via HTTP:

```bash
# Start the webhook server
python webhook_server.py --port 5000

# Trigger a briefing via curl
curl -X POST http://localhost:5000/webhook/trigger \
  -H "Content-Type: application/json" \
  -d '{"topic": "RBI Policy", "persona": "investor"}'
```

---

## 👤 Persona Descriptions

| Persona | Focus Areas |
|---|---|
| 💼 **Investor** | Market impact, sector rotation, stock implications, risk/opportunity analysis, valuations |
| 🚀 **Founder** | Competitive landscape, funding environment, regulatory changes, strategic opportunities |
| 🎓 **Student** | Simplified explanations, core concepts, industry context, career implications |

---

## 🗂️ Project Structure

```
intellibrief/
├── news_intelligence_engine.py   # Core briefing engine
├── scheduler.py                  # Automated scheduling
├── webhook_server.py             # Webhook receiver & trigger
├── requirements.txt              # Python dependencies
├── .env.example                  # Environment variable template
├── README.md                     # Documentation
└── briefings/                    # Generated briefing outputs
    └── indian_budget_founder_20250321_143022.json
```

---

## 💡 Use Cases

1. **VC Firms** — Daily sector briefings on portfolio company industries
2. **Startup Founders** — Weekly intelligence on competition and funding landscape
3. **Investment Analysts** — Breaking news impact mapped to current positions
4. **Content Creators** — Ready-to-use video scripts for business news channels
5. **Business Schools** — Student-friendly market analysis for classroom use

---

## 🛠️ Tech Stack

- **Language**: Python 3.8+
- **AI**: Anthropic Claude API
- **News Sources**: Serper.dev (Google Search), NewsAPI
- **Scheduling**: Python `schedule` library
- **Webhooks**: Flask / HTTP server

---

## 📜 License

MIT License — Built for the **ET Gen AI Hackathon**. Free to use for hackathon projects and production deployments.

---

<div align="center">
  <sub>Built with ❤️ for the Economic Times Gen AI Hackathon &nbsp;|&nbsp; <b>InteliBrief</b></sub>
</div>
