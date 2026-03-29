# News Intelligence Engine

An automated workflow system that transforms raw business news into structured, persona-specific intelligence briefings with video scripts.

## Features

- **Automated News Fetching**: Integrates with Serper.dev and NewsAPI
- **AI-Powered Analysis**: Uses Claude API for intelligent briefing generation
- **Persona-Specific Output**: Tailored for Investors, Founders, or Students
- **Video Script Generation**: Auto-generates 45-60 second narration scripts
- **Scheduled Briefings**: Daily/weekly automated reports
- **Webhook Integration**: Real-time briefing triggers via HTTP endpoints

## Quick Start

### 1. Installation

```bash
# Clone and setup
cd news-intelligence-engine
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your API keys
```

### 2. API Keys Required

| Service | Purpose | Get Key At |
|---------|---------|------------|
| Claude API | Briefing generation | [console.anthropic.com](https://console.anthropic.com/) |
| Serper.dev | Google Search results | [serper.dev](https://serper.dev/) |
| NewsAPI | News articles | [newsapi.org](https://newsapi.org/) |

### 3. Generate Your First Briefing

```bash
# Basic usage
python news_intelligence_engine.py --topic "Indian Budget" --persona "founder"

# With specific output directory
python news_intelligence_engine.py -t "Fed Rate Cut" -p "investor" -o ./reports
```

## Output Format

Each briefing generates a JSON file with:

```json
{
  "headline": "Sharp, engaging headline (max 12 words)",
  "tldr": "2-3 line ultra-concise summary",
  "key_points": ["3-5 meaningful insights"],
  "winners": ["Who benefits and WHY"],
  "losers": ["Who is negatively impacted and WHY"],
  "market_impact": "How markets/sectors react",
  "why_it_matters": "Deep reasoning on importance",
  "what_next": ["3 forward-looking predictions"],
  "for_you": "Personalized insight based on persona",
  "contrarian_view": "Different perspective",
  "confidence_score": 0-100,
  "video_script": {
    "hook": "Strong opening line",
    "body": ["3-4 key insight lines"],
    "closing": "Sharp concluding line"
  }
}
```

## Automation Workflows

### Scheduled Briefings

```bash
# Add daily briefing at 9 AM
python scheduler.py --add "Indian Stock Market" --persona "investor" --daily "09:00"

# Add weekly briefing (Monday 8 AM)
python scheduler.py --add "Startup Funding" --persona "founder" --weekly "mon@08:00"

# List all scheduled briefings
python scheduler.py --list

# Run scheduler daemon
python scheduler.py --daemon
```

### Webhook Server

```bash
# Start webhook server
python webhook_server.py --port 5000

# Trigger briefing via curl
curl -X POST http://localhost:5000/webhook/trigger \
  -H "Content-Type: application/json" \
  -d '{"topic": "RBI Policy", "persona": "investor"}'
```

## Persona Descriptions

| Persona | Focus Areas |
|---------|-------------|
| **Investor** | Market impact, sector rotation, stock implications, risk/opportunity, valuations |
| **Founder** | Competition, funding environment, regulatory changes, strategic opportunities |
| **Student** | Simplified explanations, key concepts, industry context, career implications |

## Project Structure

```
.
├── news_intelligence_engine.py  # Core engine
├── scheduler.py                 # Automation scheduler
├── webhook_server.py            # Webhook receiver
├── requirements.txt             # Dependencies
├── .env.example                 # Environment template
├── README.md                    # This file
└── briefings/                   # Output directory
    └── indian_budget_founder_20250321_143022.json
```

## Use Cases

1. **VC Firm**: Daily briefings on portfolio company sectors
2. **Startup Founder**: Weekly competition and funding landscape
3. **Investment Analyst**: Breaking news impact on positions
4. **Content Creator**: Video scripts for business news channels
5. **Business School**: Student-friendly market analysis

## License

MIT License - Built for hackathon projects and production use.
