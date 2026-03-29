#!/usr/bin/env python3
"""
News Intelligence Engine - FREE News Sources
=============================================
No API keys required! Uses RSS feeds and public sources.
"""

import feedparser
import requests
from bs4 import BeautifulSoup
import json
from datetime import datetime
from typing import List, Dict
import re


class FreeNewsFetcher:
    """Fetch news from free sources - no API keys needed!"""

    # RSS Feeds by category
    RSS_SOURCES = {
        "business": [
            "https://feeds.feedburner.com/ndtvprofit-latest",
            "https://www.moneycontrol.com/rss/MCtopnews.xml",
            "https://economictimes.indiatimes.com/rssfeedsdefault.cms",
        ],
        "tech": [
            "https://techcrunch.com/feed/",
            "https://www.theverge.com/rss/index.xml",
        ],
        "general": [
            "https://feeds.bbci.co.uk/news/world/rss.xml",
            "https://feeds.afr.com/rss/afr_latest_news.xml",
        ]
    }

    @staticmethod
    def fetch_from_rss(keyword: str, max_results: int = 10) -> str:
        """Fetch news from RSS feeds."""
        context = []
        keyword_lower = keyword.lower()

        for category, feeds in FreeNewsFetcher.RSS_SOURCES.items():
            for feed_url in feeds:
                try:
                    feed = feedparser.parse(feed_url)
                    for entry in feed.entries[:5]:  # Top 5 from each feed
                        title = entry.get('title', '')
                        summary = entry.get('summary', '') or entry.get('description', '')

                        # Check if keyword matches
                        if keyword_lower in title.lower() or keyword_lower in summary.lower():
                            context.append(f"Title: {title}")
                            context.append(f"Summary: {BeautifulSoup(summary, 'html.parser').get_text()[:300]}")
                            context.append(f"Source: {feed_url}")
                            context.append("")

                            if len(context) >= max_results * 4:
                                break
                except Exception as e:
                    print(f"RSS feed error ({feed_url}): {e}")
                    continue

        return "\n".join(context) if context else f"No specific news found for '{keyword}'. Using general knowledge."

    @staticmethod
    def fetch_from_wikipedia(topic: str) -> str:
        """Fetch context from Wikipedia API (free, no key)."""
        try:
            url = "https://en.wikipedia.org/api/rest_v1/page/summary/" + topic.replace(" ", "_")
            response = requests.get(url, timeout=10)
            if response.status_code == 200:
                data = response.json()
                return f"Wikipedia Context: {data.get('extract', '')}"
        except:
            pass
        return ""

    @staticmethod
    def fetch_from_reddit(keyword: str) -> str:
        """Fetch from Reddit (free, no auth needed for read)."""
        try:
            url = f"https://www.reddit.com/r/business/search.json?q={keyword}&limit=5"
            headers = {"User-Agent": "NewsIntelligence/1.0"}
            response = requests.get(url, headers=headers, timeout=10)

            if response.status_code == 200:
                data = response.json()
                posts = data.get('data', {}).get('children', [])
                context = []
                for post in posts:
                    p = post.get('data', {})
                    context.append(f"Reddit: {p.get('title', '')}")
                    context.append(f"Comments: {p.get('selftext', '')[:200]}")
                return "\n".join(context)
        except:
            pass
        return ""

    @staticmethod
    def get_news_context(topic: str) -> str:
        """Aggregate news from all free sources."""
        print(f"🔍 Fetching free news for: {topic}")

        sources = [
            ("RSS Feeds", FreeNewsFetcher.fetch_from_rss(topic)),
            ("Wikipedia", FreeNewsFetcher.fetch_from_wikipedia(topic)),
            ("Reddit", FreeNewsFetcher.fetch_from_reddit(topic)),
        ]

        context_parts = []
        for source_name, content in sources:
            if content:
                context_parts.append(f"\n--- {source_name} ---\n{content}")
                print(f"  ✓ {source_name}: {len(content)} chars")

        full_context = "\n".join(context_parts)
        return full_context if full_context else f"Topic: {topic}"


if __name__ == "__main__":
    # Test
    result = FreeNewsFetcher.get_news_context("Indian Budget")
    print("\n" + "="*60)
    print("FETCHED CONTEXT:")
    print("="*60)
    print(result[:2000] + "..." if len(result) > 2000 else result)
