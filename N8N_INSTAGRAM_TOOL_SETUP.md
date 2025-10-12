# Instagram Reel Transcriber Tool Setup

## Overview

The agent now has an Instagram reel transcriber tool that connects to your n8n workflow. This tool can analyze any Instagram reel and create a detailed Audio/Visual (A/V) script breakdown.

## How It Works

```
User shares Instagram reel URL
    ↓
Agent calls transcribe_instagram_reel tool
    ↓
HTTP POST to your n8n webhook
    ↓
n8n workflow:
  1. Scrapes reel with Apify
  2. Analyzes video with Google Gemini
  3. Returns A/V script breakdown
    ↓
Agent receives transcription
    ↓
Agent shares breakdown with user
```

## Setup Instructions

### 1. Get Your n8n Webhook URL

Your n8n workflow has a webhook with path: `c25fd24e-ffca-406b-9294-7fae758715f5`

To get the full URL:
1. Open your n8n workflow
2. Click on the **Webhook** node
3. Look for the **Production URL** or **Webhook URL**
4. It should look like: `https://your-n8n-instance.app.n8n.cloud/webhook/c25fd24e-ffca-406b-9294-7fae758715f5`

### 2. Set the Environment Variable

#### For Local Development:

Add this to `backend-v2/.env`:
```bash
N8N_REEL_TRANSCRIBER_WEBHOOK=https://your-n8n-instance.app.n8n.cloud/webhook/c25fd24e-ffca-406b-9294-7fae758715f5
```

#### For Railway (Staging):

1. Go to your Railway project: https://railway.app/project/YOUR_PROJECT_ID
2. Select the `jason-coaching-backend-staging` service
3. Go to **Variables** tab
4. Add new variable:
   - **Key**: `N8N_REEL_TRANSCRIBER_WEBHOOK`
   - **Value**: `https://your-n8n-instance.app.n8n.cloud/webhook/c25fd24e-ffca-406b-9294-7fae758715f5`
5. Click **Add** and the service will automatically redeploy

#### For Railway (Production):

Same as staging, but use the `jason-coaching-backend-production` service.

### 3. Test the Tool

Once configured, users can share Instagram reel URLs like:
- `https://www.instagram.com/p/DPCEQYdjbPz/`
- `https://www.instagram.com/reel/DPCEQYdjbPz/`

The agent will automatically:
1. Detect the reel URL
2. Call the transcription tool
3. Wait for the result (30-60 seconds)
4. Share the A/V script breakdown

## Example Usage

**User**: "Can you analyze this reel for me? https://www.instagram.com/p/DPCEQYdjbPz/"

**Agent**: "Let me check out that reel..." 

*[Calls tool, waits for result]*

**Agent**: "Alright, here's the breakdown:

[SCENE 1: INT. STUDIO - DAY]
VISUAL: A man with curly hair and red glasses speaks to the camera...
AUDIO: Speaker: 'If you're a business owner or a video editor, listen up.'

[continues with full breakdown]

This reel uses a split-screen technique to show both sides of the marketplace..."

## Tool Details

### Function Signature:
```python
def transcribe_instagram_reel(reel_url: str) -> str
```

### Parameters:
- `reel_url`: Instagram reel URL (supports /p/ and /reel/ formats)

### Returns:
- Detailed A/V script with scene-by-scene breakdown
- Visual descriptions and audio/dialogue for each scene
- Structured format for easy analysis

### Timeout:
- 120 seconds (2 minutes)
- Accounts for scraping time + AI analysis

### Error Handling:
- Missing webhook URL configuration
- Network timeouts
- Invalid reel URLs
- Scraping failures

## Troubleshooting

### "Instagram reel transcriber is not configured"
→ The `N8N_REEL_TRANSCRIBER_WEBHOOK` environment variable is not set. Follow setup instructions above.

### "The reel transcription is taking longer than expected"
→ The reel is very long or network is slow. Try again or check your n8n workflow execution logs.

### "Error transcribing reel: [error message]"
→ Check:
1. n8n workflow is active and running
2. Webhook URL is correct
3. Apify and Google Gemini credentials in n8n are valid
4. Instagram reel URL is valid and publicly accessible

### Testing the Webhook Manually

You can test your n8n webhook directly:

```bash
curl -X POST https://your-n8n-instance.app.n8n.cloud/webhook/c25fd24e-ffca-406b-9294-7fae758715f5 \
  -H "Content-Type: application/json" \
  -d '{"Reel URL": "https://www.instagram.com/p/DPCEQYdjbPz/"}'
```

You should get back the A/V script in JSON format.

## n8n Workflow Details

Your workflow consists of:
1. **Webhook**: Receives reel URL
2. **Get Reels** (Apify): Scrapes Instagram reel data
3. **Analyze Vid** (Google Gemini): Creates A/V script breakdown
4. **Respond to Webhook**: Returns result

Make sure all nodes are properly configured and the workflow is **Active**.

## Cost Considerations

### Per Reel Analysis:
- **Apify**: ~$0.01-0.05 per reel (Instagram scraping)
- **Google Gemini**: ~$0.10-0.50 per reel (video analysis)
- **Total**: ~$0.11-0.55 per reel

For heavy usage, consider:
- Caching recent reel analyses
- Rate limiting (if needed)
- Batch processing multiple reels

## What Changed in the Code

### New Files/Updates:
- `backend-v2/app/jason_agent.py`: Added `transcribe_instagram_reel()` function and tool
- `backend-v2/requirements.txt`: Added `requests>=2.31.0`

### New Tool:
```python
build_reel_transcriber_tool()  # Returns FunctionTool
```

### Added to Agent:
```python
jason_agent = Agent[AgentContext](
    model="gpt-5",
    tools=[
        build_file_search_tool(),
        build_web_search_tool(),
        build_reel_transcriber_tool(),  # NEW!
    ],
)
```

## Next Steps

1. Get your n8n webhook URL
2. Add it to environment variables (local + Railway)
3. Test with a sample reel URL
4. Monitor n8n execution logs for any issues

---

**Created**: October 12, 2025  
**Last Updated**: October 12, 2025

