#!/usr/bin/env python3
"""
News Intelligence Engine - COMPLETE AUTOMATED WORKFLOW
========================================================
One command to run everything: web server + scheduler + automation

Usage:
    python workflow.py --mode web          # Run web interface only
    python workflow.py --mode scheduler  # Run scheduled briefings
    python workflow.py --mode auto       # Run web + scheduler + watcher
    python workflow.py --generate "Topic" --persona "founder"  # One-time generation

Features:
    - FREE news sources (no API keys needed for news)
    - Automated scheduling
    - Web interface
    - File watching for triggers
"""

import argparse
import json
import os
import subprocess
import sys
import time
from datetime import datetime
from typing import List, Dict
import schedule
import threading


class WorkflowManager:
    """Manages the complete news intelligence workflow."""

    CONFIG_FILE = "./workflow_config.json"

    def __init__(self):
        self.config = self.load_config()
        self.running = False

    def load_config(self) -> Dict:
        """Load workflow configuration."""
        if os.path.exists(self.CONFIG_FILE):
            with open(self.CONFIG_FILE, 'r') as f:
                return json.load(f)
        return {
            "scheduled": [],
            "settings": {
                "auto_start_web": True,
                "auto_start_scheduler": True,
                "output_dir": "./briefings"
            }
        }

    def save_config(self):
        """Save workflow configuration."""
        with open(self.CONFIG_FILE, 'w') as f:
            json.dump(self.config, f, indent=2)

    def add_schedule(self, topic: str, persona: str, schedule_type: str, time_str: str):
        """Add a scheduled briefing."""
        entry = {
            "id": len(self.config["scheduled"]) + 1,
            "topic": topic,
            "persona": persona,
            "schedule": time_str,
            "type": schedule_type,  # daily, weekly, hourly
            "last_run": None,
            "created_at": datetime.now().isoformat()
        }
        self.config["scheduled"].append(entry)
        self.save_config()
        print(f"✓ Scheduled: '{topic}' ({persona}) - {schedule_type} at {time_str}")

    def list_scheduled(self):
        """List all scheduled briefings."""
        if not self.config["scheduled"]:
            print("\nNo scheduled briefings.")
            return

        print(f"\n{'ID':<4} {'Topic':<25} {'Persona':<10} {'Schedule':<15}")
        print("-" * 60)
        for entry in self.config["scheduled"]:
            print(f"{entry['id']:<4} {entry['topic']:<25} {entry['persona']:<10} {entry['type']}@{entry['schedule']}")
        print()

    def remove_schedule(self, entry_id: int):
        """Remove a scheduled briefing."""
        self.config["scheduled"] = [e for e in self.config["scheduled"] if e["id"] != entry_id]
        self.save_config()
        print(f"✓ Removed schedule #{entry_id}")

    def run_briefing(self, topic: str, persona: str) -> bool:
        """Run a single briefing generation."""
        print(f"\n{'='*60}")
        print(f"🚀 Generating Briefing: {topic} ({persona})")
        print(f"{'='*60}")

        try:
            # Import and run directly
            from app import claude_api, FreeNewsFetcher, OUTPUT_DIR
            import json

            # Fetch news
            print(f"🔍 Fetching news context...")
            news_context = FreeNewsFetcher.get_news_context(topic)
            print(f"✓ Retrieved {len(news_context)} characters\n")

            # Generate
            print(f"🤖 Generating with Claude AI...")
            briefing = claude_api.generate_briefing(topic, persona, news_context)

            if "error" in briefing:
                print(f"✗ Error: {briefing['error']}")
                return False

            # Save
            briefing['metadata'] = {
                "topic": topic,
                "persona": persona,
                "generated_at": datetime.now().isoformat()
            }

            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"{topic.replace(' ', '_').lower()[:30]}_{persona}_{timestamp}.json"
            filepath = os.path.join(OUTPUT_DIR, filename)

            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(briefing, f, indent=2, ensure_ascii=False)

            # Display
            print(f"\n{'='*60}")
            print(f"✓ BRIEFING GENERATED")
            print(f"{'='*60}")
            print(f"📰 Headline: {briefing.get('headline', 'N/A')}")
            print(f"🎯 Confidence: {briefing.get('confidence_score', 'N/A')}/100")
            print(f"💾 Saved: {filepath}")
            print(f"🎬 Video Hook: {briefing.get('video_script', {}).get('hook', 'N/A')[:80]}...")
            print(f"{'='*60}\n")

            return True

        except Exception as e:
            print(f"✗ Error: {e}")
            import traceback
            traceback.print_exc()
            return False

    def setup_scheduler(self):
        """Setup the schedule."""
        for entry in self.config["scheduled"]:
            topic = entry["topic"]
            persona = entry["persona"]
            sched_type = entry["type"]
            sched_time = entry["schedule"]

            job = lambda t=topic, p=persona: self.run_briefing(t, p)

            if sched_type == "daily":
                schedule.every().day.at(sched_time).do(job)
            elif sched_type == "weekly":
                day, tm = sched_time.split("@")
                day = day.lower()
                if "mon" in day:
                    schedule.every().monday.at(tm).do(job)
                elif "tue" in day:
                    schedule.every().tuesday.at(tm).do(job)
                elif "wed" in day:
                    schedule.every().wednesday.at(tm).do(job)
                elif "thu" in day:
                    schedule.every().thursday.at(tm).do(job)
                elif "fri" in day:
                    schedule.every().friday.at(tm).do(job)
            elif sched_type == "hourly":
                schedule.every().hour.do(job)

    def run_scheduler(self):
        """Run the scheduler loop."""
        self.setup_scheduler()
        print(f"⏰ Scheduler running with {len(self.config['scheduled'])} job(s)")
        print("   Press Ctrl+C to stop\n")

        while self.running:
            schedule.run_pending()
            time.sleep(60)

    def run_web_server(self):
        """Run the Flask web server."""
        print("🌐 Starting web server on http://localhost:5000")
        from app import app
        app.run(host='0.0.0.0', port=5000, debug=False, threaded=True)

    def run_auto_mode(self):
        """Run everything: web + scheduler + file watcher."""
        self.running = True

        print("="*60)
        print("NEWS INTELLIGENCE ENGINE - AUTO MODE")
        print("="*60)
        print("Components:")
        print("  🌐 Web Interface: http://localhost:5000")
        print("  ⏰ Scheduler: Running")
        print("  📁 Output: ./briefings/")
        print("="*60 + "\n")

        # Start web server in thread
        web_thread = threading.Thread(target=self.run_web_server, daemon=True)
        web_thread.start()

        # Start scheduler in main thread
        try:
            self.run_scheduler()
        except KeyboardInterrupt:
            print("\n👋 Stopping workflow...")
            self.running = False


def main():
    parser = argparse.ArgumentParser(
        description="News Intelligence Engine - Complete Workflow",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
    # Run web interface
    python workflow.py --mode web

    # Add daily briefing at 9 AM
    python workflow.py --add "Indian Stock Market" --persona investor --daily "09:00"

    # Add weekly briefing (Monday 8 AM)
    python workflow.py --add "Tech News" --persona founder --weekly "mon@08:00"

    # Run scheduler daemon
    python workflow.py --mode scheduler

    # Auto mode (web + scheduler)
    python workflow.py --mode auto

    # Generate one-time briefing
    python workflow.py --generate "RBI Policy" --persona investor
        """
    )

    parser.add_argument("--mode", "-m",
                        choices=["web", "scheduler", "auto"],
                        help="Operation mode")

    parser.add_argument("--add", "-a",
                        help="Topic to schedule")

    parser.add_argument("--persona", "-p",
                        choices=["investor", "founder", "student"],
                        default="founder",
                        help="Target persona")

    parser.add_argument("--daily",
                        help="Schedule daily at time (HH:MM)")

    parser.add_argument("--weekly",
                        help="Schedule weekly (mon@HH:MM, tue@HH:MM, etc.)")

    parser.add_argument("--hourly",
                        action="store_true",
                        help="Schedule hourly")

    parser.add_argument("--list", "-l",
                        action="store_true",
                        help="List scheduled briefings")

    parser.add_argument("--remove", "-r", type=int,
                        help="Remove scheduled briefing by ID")

    parser.add_argument("--generate", "-g",
                        help="Generate single briefing for topic")

    args = parser.parse_args()

    manager = WorkflowManager()

    # Handle add
    if args.add:
        if args.daily:
            manager.add_schedule(args.add, args.persona, "daily", args.daily)
        elif args.weekly:
            manager.add_schedule(args.add, args.persona, "weekly", args.weekly)
        elif args.hourly:
            manager.add_schedule(args.add, args.persona, "hourly", "00:00")
        else:
            print("Error: Use --daily, --weekly, or --hourly")
        return

    # Handle list
    if args.list:
        manager.list_scheduled()
        return

    # Handle remove
    if args.remove:
        manager.remove_schedule(args.remove)
        return

    # Handle generate
    if args.generate:
        manager.run_briefing(args.generate, args.persona)
        return

    # Handle modes
    if args.mode == "web":
        manager.run_web_server()

    elif args.mode == "scheduler":
        manager.running = True
        manager.run_scheduler()

    elif args.mode == "auto":
        manager.run_auto_mode()

    else:
        # Default: print help
        parser.print_help()
        print("\n" + "="*60)
        print("QUICK START:")
        print("="*60)
        print("1. Run web interface:    python workflow.py --mode web")
        print("2. Generate briefing:    python workflow.py -g \"Indian Budget\" -p founder")
        print("3. Schedule daily:       python workflow.py -a \"Stock Market\" -p investor --daily 09:00")
        print("4. Auto mode:            python workflow.py --mode auto")
        print("="*60)


if __name__ == "__main__":
    main()
