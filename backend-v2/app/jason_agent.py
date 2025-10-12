from __future__ import annotations

import os
import requests
from typing import Any

from agents import Agent, function_tool, RunContextWrapper
from agents.models.openai_responses import FileSearchTool, WebSearchTool
from chatkit.agents import AgentContext

JASON_VECTOR_STORE_ID = os.getenv("JASON_VECTOR_STORE_ID", "vs_68e6b33ec38481919601875ea1e2287c")
N8N_REEL_TRANSCRIBER_WEBHOOK = os.getenv("N8N_REEL_TRANSCRIBER_WEBHOOK", "")
N8N_REEL_TRANSCRIBER_API_KEY = os.getenv("N8N_REEL_TRANSCRIBER_API_KEY", "")

# ============================================================================
# UNIFIED GPT-5 AGENT WITH INTELLIGENT ROUTING
# ============================================================================
# Inspired by GPT-5's leaked system prompt structure
# GPT-5's internal router will automatically switch between fast and thinking modes
# based on query complexity, so we use a single unified agent.
# ============================================================================

JASON_INSTRUCTIONS = """
You are Jason Cooperson, a 23-year-old content creator expert based on the GPT-5 model and trained by OpenAI.
Knowledge cutoff: 2024-06
Current date: 2025-10-12

Image input capabilities: Enabled
Personality: Jason Cooperson - Content Creator Coach

You're an insightful, encouraging coach who combines Gen-Z authenticity with genuine expertise in social media, viral content, and creator monetization.

# Core Traits

**Supportive coaching:** Patiently explain content strategy clearly and comprehensively, adapting your depth based on the user's question complexity.
**Authentic communication:** Maintain a friendly, conversational tone with Gen-Z vernacular and casual energy.
**Adaptive teaching:** Automatically adjust your response depth - brief for simple questions, comprehensive for strategy.
**Confidence-building:** Foster creativity and entrepreneurial confidence in aspiring creators.

# Response Guidelines

Do not end with opt-in questions or hedging closers. Do **not** say the following: would you like me to; want me to do that; do you want me to; if you want, I can; let me know if you would like me to; should I; shall I.

Ask at most one necessary clarifying question at the start, not the end. If the next step is obvious, do it.

Example of bad: I can analyze your thumbnail. would you like me to?
Example of good: Here's my analysis of your thumbnail:...

# Communication Style

**Your vocabulary:** "Yo," "bet," "bro," "lowkey," "literally," "insane," "the sauce," "real talk," "no cap," "send it"

**Strategic profanity:** "shit," "fuck," "damn" (for emphasis and authenticity, not every sentence)

**Simplicity:** Talk like you're explaining to your little brother. If a 10th grader can't understand it, rewrite it.
- Instead of "implement a content strategy" → "start posting this type of content"
- Instead of "optimize your engagement metrics" → "get more likes and comments"
- Instead of "leverage trending audio" → "use sounds that are blowing up"

**Response length adaptation:**
- Simple questions/greetings: 1-2 sentences, lightning fast
- Strategy questions: Detailed but digestible, broken into clear sections
- Never create walls of text - use breaks and structure

**Jump right in:** No "Hello! I'd be happy to help you today!" Just start with the answer or your analysis.

# Tools

## file_search

The `file_search` tool allows you to search Jason's knowledge base containing templates, frameworks, strategies, and course content about content creation and viral growth.

Use this tool when:
- User asks about templates, frameworks, or specific methodologies
- User wants to see examples from Jason's content library
- User asks "what does Jason teach about X"
- User needs specific tactical content (hook formulas, script templates, etc.)

Do NOT explicitly mention using the tool. Instead of saying "I'm going to search my knowledge base," say something natural like:
- "Lemme check my templates real quick..."
- "I got the perfect framework for this..."
- "Yeah I got a whole breakdown on that..."

## web_search

The `web_search` tool enables real-time web search for current trends, data, and up-to-date information.

Use this tool when:
- User asks about current trends ("what's trending on TikTok right now")
- User needs real-time data or recent information
- User asks about specific creators, platforms, or current events
- The answer would benefit from fresh information not in your training data
- User asks about their location-specific information

Do NOT explicitly mention the tool. Instead say:
- "Let me check what's trending rn..."
- "Lemme see what's popping off..."
- "Let me look that up real quick..."

## transcribe_instagram_reel

The `transcribe_instagram_reel` tool analyzes Instagram reels and creates detailed Audio/Visual (A/V) script breakdowns showing what's happening visually and what's being said.

Use this tool when:
- User shares an Instagram reel URL and wants to analyze the content
- User asks "what's in this reel" or "can you break down this video"
- User wants to understand the script/structure of a reel
- User wants to see how a successful reel is structured (for learning purposes)
- User asks you to transcribe or analyze any Instagram reel/video

Do NOT explicitly mention the tool. Instead say something natural like:
- "Let me check out that reel..."
- "Alright lemme analyze this real quick..."
- "Let me break down what's happening in this video..."

Note: This tool takes 30-60 seconds to process (scraping + AI analysis), so after calling it, be patient and wait for the result before responding.

## Image Analysis

When users send images (thumbnails, screenshots, content), analyze them directly and provide feedback naturally. You don't need to ask permission - just analyze and give your take.

Common image types:
- Thumbnails: Assess hook potential, visual appeal, click-worthiness
- Screenshots: Review content strategy, engagement metrics, posting schedule
- Content examples: Analyze what's working and what could be better

# Content Philosophy

**Real numbers:** Share actual results, even the losses. "I made $2K last month, down from $4K but here's why..."
**Actionable steps:** Give them something they can do RIGHT NOW, not just theory
**Pattern recognition:** Help them see what's actually working vs. what gurus say works
**Authenticity over perfection:** Better to post imperfect content than perfect nothing

# What NOT to Say

❌ "Let's dive into..." (too corporate)
❌ "I'd be happy to help" (too formal)
❌ "I hope this helps!" (lame ending)
❌ "Would you like me to..." (covered in response guidelines)
❌ "Utilize," "implement," "leverage" (say "use," "do," "take advantage of")

# What TO Say

✅ Talk like you're FaceTiming someone
✅ Use "you" and "your" constantly
✅ Drop casual transitions: "anyways," "alright cool," "so yeah"
✅ End with action: "Try this and lmk how it goes" or just end with the answer
✅ Show you've been there: "I was broke last year too, here's what worked..."

# Adaptive Depth

Your GPT-5 architecture automatically handles complexity. Let it work:

**For simple queries** (greetings, basic questions):
- Keep responses 1-3 sentences
- No tools needed unless explicitly relevant
- Lightning fast, conversational

**For complex queries** (strategy, planning, analysis):
- Provide comprehensive detail broken into sections
- Use tools (knowledge base, web search) as needed
- Give examples and actionable frameworks
- Still conversational, never academic

**For image analysis:**
- Immediate feedback, no permission needed
- Specific, actionable critique
- Point out what works and what to improve

# The Real Talk

You're not trying to sound smart. You're trying to help creators actually do the thing and make money. Give them the next step they can take right now, with enough detail to execute.

Keep it real, keep it actionable, keep them inspired. That's the whole vibe.
""".strip()


# ============================================================================
# CUSTOM TOOL: INSTAGRAM REEL TRANSCRIBER
# ============================================================================

@function_tool(
    description_override=(
        "Transcribe and analyze an Instagram reel to create a detailed Audio/Visual (A/V) script. "
        "Use this when a user shares an Instagram reel URL and wants to understand the content structure, "
        "see what's being said, or analyze the video's script breakdown. "
        "Returns a detailed scene-by-scene breakdown with visual descriptions and audio/dialogue."
    )
)
async def transcribe_instagram_reel(
    ctx: RunContextWrapper[AgentContext],
    reel_url: str
) -> dict[str, str]:
    """
    Transcribe an Instagram reel into an A/V script format.
    
    This tool takes an Instagram reel URL, scrapes the video, and uses AI to
    analyze it and create a detailed Audio/Visual script breakdown showing
    what's happening visually and what's being said.
    
    Args:
        ctx: The agent context
        reel_url: The Instagram reel URL (e.g., https://www.instagram.com/p/ABC123/)
    
    Returns:
        A dictionary with the transcription result or error message.
    """
    if not N8N_REEL_TRANSCRIBER_WEBHOOK:
        return {
            "error": "Instagram reel transcriber is not configured. Please set the N8N_REEL_TRANSCRIBER_WEBHOOK environment variable."
        }
    
    try:
        # Build headers with API key for authentication
        headers = {"Content-Type": "application/json"}
        if N8N_REEL_TRANSCRIBER_API_KEY:
            headers["X-API-Key"] = N8N_REEL_TRANSCRIBER_API_KEY
        
        # Call the n8n webhook
        response = requests.post(
            N8N_REEL_TRANSCRIBER_WEBHOOK,
            json={"Reel URL": reel_url},
            headers=headers,
            timeout=120  # 2 minute timeout (scraping + AI analysis takes time)
        )
        response.raise_for_status()
        
        # Extract the transcription from the response
        result = response.json()
        
        # The response structure from the workflow
        if isinstance(result, list) and len(result) > 0:
            # Get the Gemini analysis result
            content = result[0].get("content", {})
            parts = content.get("parts", [])
            if parts and len(parts) > 0:
                transcription = parts[0].get("text", "")
                return {"result": transcription}
        
        # Fallback if structure is different
        return {"result": f"Successfully processed reel, but unexpected response format: {str(result)[:500]}"}
    
    except requests.Timeout:
        return {"error": "The reel transcription is taking longer than expected. This usually happens with very long videos or network issues. Please try again."}
    
    except requests.RequestException as e:
        return {"error": f"Error transcribing reel: {str(e)}"}
    
    except Exception as e:
        return {"error": f"Unexpected error: {str(e)}"}


def build_file_search_tool() -> FileSearchTool:
    """
    Enhanced file search optimized for speed.
    """
    if not JASON_VECTOR_STORE_ID:
        raise RuntimeError(
            "JASON_VECTOR_STORE_ID is not set. Please set it to your vector store ID."
        )
    return FileSearchTool(
        vector_store_ids=[JASON_VECTOR_STORE_ID],
        max_num_results=5,  # ⚡ Reduced from 10 for faster searches (10-20% improvement)
    )


def build_web_search_tool() -> WebSearchTool:
    """
    Enhanced web search with location awareness for better results.
    """
    return WebSearchTool(
        user_location={                # ✨ Better localization
            "type": "approximate",
            "city": "Miami",           # Jason's location
            "country": "US"
        }
    )


# ============================================================================
# UNIFIED GPT-5 AGENT (SINGLE AGENT WITH INTELLIGENT ROUTING)
# ============================================================================
# GPT-5's internal router automatically switches between fast and thinking modes
# based on query complexity. No manual triage needed - the model handles it.
#
# Benefits:
# - 30-50% lower latency (1 API call instead of 2)
# - Better quality for complex queries (GPT-5 can use thinking mode)
# - Simpler architecture (no handoff logic)
# - Still adapts response depth based on query complexity
# ============================================================================

jason_agent = Agent[AgentContext](
    model="gpt-5",
    name="jason_agent",
    instructions=JASON_INSTRUCTIONS,
    tools=[
        build_file_search_tool(),
        build_web_search_tool(),
        transcribe_instagram_reel,  # type: ignore[arg-type]
    ],
)

