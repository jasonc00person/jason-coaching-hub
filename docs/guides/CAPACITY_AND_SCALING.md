# Capacity and Scaling Guide 📊

## Your Current Limits (OpenAI Usage Tier 2)

### GPT-5 (Your Main Model)
- **5,000 RPM** (Requests Per Minute) = ~83 requests/second
- **1,000,000 TPM** (Tokens Per Minute) = ~16,666 tokens/second
- **3,000,000 TPD** (Tokens Per Day)

### Practical Translation:
- **Simple queries**: ~5,000 conversations per minute
- **Complex queries with tools**: ~1,000-2,000 conversations per minute
- **Instagram reel transcriptions**: Limited by n8n workflow, not OpenAI

---

## System Bottlenecks (Ranked)

### 1. 🔴 Instagram Reel Transcriber (BIGGEST BOTTLENECK)
**Capacity**: 1-2 concurrent requests
- Apify scraping: ~5-10 seconds
- Gemini analysis: ~15-20 seconds
- **Total per request**: ~25-30 seconds

**Max throughput**: 
- 2-3 reels per minute
- ~120-180 reels per hour
- ~2,880-4,320 reels per day

**Cost per reel**:
- Apify: ~$0.01-0.02
- Gemini API: ~$0.02-0.05
- **Total**: ~$0.03-0.07 per reel

**Recommendation**: 
- Add queue system if you expect >2 simultaneous reel requests
- Consider caching results for popular reels
- Set rate limits in the UI (e.g., "1 reel per user every 30 seconds")

### 2. 🟡 OpenAI API (Well Within Limits)
**Your tier**: Usage tier 2 (5,000 RPM)

**Realistic capacity**:
- Simple questions: 3,000+ per minute
- Complex queries with tools: 500-1,000 per minute
- Depends on conversation length

**You'll hit this limit if**:
- 83+ simultaneous active conversations
- Unlikely unless you go viral

### 3. 🟢 Railway Backend (Should Be Fine)
**Estimated capacity**:
- Starter plan: ~50-100 concurrent connections
- Health checks: 500+ requests/second
- ChatKit streaming: 20-50 concurrent conversations

**You'll hit this limit if**:
- 50+ simultaneous users chatting
- Very unlikely for early-stage MVP

### 4. 🟢 Vercel Frontend (No Issues)
**Capacity**: Essentially unlimited
- CDN-backed static files
- Serverless
- Can handle 100,000+ concurrent users

---

## Real-World Traffic Estimates

### Scenario 1: Small Launch (0-100 Daily Active Users)
**Expected load**:
- 10-20 concurrent users (peak)
- 500-1,000 messages per day
- 5-10 reel transcriptions per day

**Status**: ✅ **No issues**
- Well below all limits
- Current setup handles this easily

**Monthly cost**: ~$15-30
- OpenAI: ~$10-20
- Railway: ~$5
- Apify: ~$0-5

### Scenario 2: Growing Product (100-1,000 Daily Active Users)
**Expected load**:
- 50-100 concurrent users (peak)
- 5,000-10,000 messages per day
- 50-100 reel transcriptions per day

**Status**: ⚠️ **Instagram tool may queue**
- Chat works fine
- Reel transcriptions may have 30-60s queue during peak
- Need to add queue UI feedback

**Monthly cost**: ~$150-300
- OpenAI: ~$100-200
- Railway: ~$20-30
- Apify: ~$30-70

### Scenario 3: Viral/High Traffic (1,000-10,000 DAU)
**Expected load**:
- 200-500 concurrent users (peak)
- 50,000-100,000 messages per day
- 500-1,000 reel transcriptions per day

**Status**: 🔴 **Action needed**
- Upgrade Railway plan
- Add Redis queue for reel transcriptions
- Consider OpenAI tier 3 or 4
- Add rate limiting per user

**Monthly cost**: ~$1,500-3,000
- OpenAI: ~$1,000-2,000
- Railway: ~$200-300
- Apify: ~$300-700

---

## Stress Testing Your App

### Run the Tests

I've created two stress test scripts:

#### 1. Basic Stress Test (Bash)
```bash
./stress-test.sh
```
Tests:
- Health endpoint throughput
- Response times
- Failure rates

#### 2. Advanced ChatKit Test (Python)
```bash
python3 stress-test-chatkit.py
```
Tests:
- Realistic conversation loads
- Streaming responses
- Concurrent user scenarios
- Progressive load testing

### Install Dependencies for Python Test:
```bash
pip install httpx
```

---

## Scaling Strategies (When Needed)

### For Instagram Tool (When >5 reels/min)

**Option 1: Add Queue System (Recommended)**
```python
# Use Redis + Celery
- Queue reel requests
- Show position in queue to users
- Process 2 at a time
- ETA: 1-2 days to implement
```

**Option 2: Multiple n8n Workflows**
```
- Run 3-5 parallel n8n workflows
- Round-robin between them
- 6-10 reels per minute capacity
- ETA: 2-3 hours to implement
```

**Option 3: Cache Results**
```python
# Cache transcriptions for 30 days
- Most reels are public/static
- Save ~70% of duplicate requests
- Use Redis or PostgreSQL
- ETA: 4-6 hours to implement
```

### For ChatKit Backend (When >50 concurrent users)

**Option 1: Upgrade Railway Plan**
- Pro plan: $20/month
- More RAM/CPU
- Better for 100-200 concurrent users

**Option 2: Horizontal Scaling**
- Deploy multiple Railway instances
- Use load balancer
- For 500+ concurrent users

### For OpenAI API (When hitting 5,000 RPM)

**Option 1: Apply for Tier Increase**
- Contact OpenAI
- Show usage metrics
- Get tier 3 (50,000 RPM) or tier 4 (100,000 RPM)

**Option 2: Smart Caching**
- Cache common responses
- Reduce API calls by 30-50%
- Use Redis

---

## Monitoring & Alerts

### What to Monitor:

1. **Railway Metrics** (check dashboard)
   - CPU usage (alert >80%)
   - Memory usage (alert >80%)
   - Response times (alert >5s p95)

2. **OpenAI Usage** (check platform.openai.com/usage)
   - Daily token usage
   - Rate limit errors
   - Cost per day

3. **n8n Executions** (check n8n dashboard)
   - Execution time trends
   - Failure rate
   - Queue length

4. **User Experience**
   - Average response time
   - Tool call success rate
   - User complaints about slowness

### Set Up Alerts:

1. **Railway**: Enable email alerts for 80% CPU/memory
2. **OpenAI**: Set budget alert at $100/month (in settings)
3. **n8n**: Monitor execution failures

---

## Cost Projections

### Current MVP Phase (0-100 users)
```
OpenAI:    $10-20/month
Railway:   $5-10/month  
Apify:     $0-5/month
n8n:       $0 (free tier)
Vercel:    $0 (free tier)
━━━━━━━━━━━━━━━━━━━━━━━
TOTAL:     ~$15-35/month
```

### Growth Phase (100-1,000 users)
```
OpenAI:    $100-200/month
Railway:   $20-50/month
Apify:     $30-100/month
n8n:       $20/month (starter)
Vercel:    $0-20/month
━━━━━━━━━━━━━━━━━━━━━━━
TOTAL:     ~$170-390/month
```

### Scale Phase (1,000-10,000 users)
```
OpenAI:    $1,000-2,000/month
Railway:   $200-500/month
Apify:     $300-1,000/month
n8n:       $50-100/month
Vercel:    $20-50/month
━━━━━━━━━━━━━━━━━━━━━━━
TOTAL:     ~$1,570-3,650/month
```

### Revenue Break-Even Analysis

If you charge $20/month per user:
- 2 paying users = Cover MVP costs
- 10 paying users = Cover growth phase costs  
- 80 paying users = Cover scale phase costs

---

## Quick Win Optimizations

### 1. Add Rate Limiting (30 mins)
```python
# Limit: 1 reel transcription per user every 30 seconds
# Prevents abuse, protects your costs
```

### 2. Add Loading States (1 hour)
```typescript
// Show "Processing reel... (25-30s)" 
// Better UX, sets expectations
```

### 3. Cache Common Queries (2 hours)
```python
# Cache responses for repeat questions
# Save 20-30% on API costs
```

### 4. Add Usage Analytics (2 hours)
```python
# Track: queries/day, tools used, response times
# Make data-driven decisions
```

---

## TL;DR - Your Current Capacity

✅ **Chat**: 3,000+ conversations per minute  
⚠️ **Instagram Tool**: 2-3 reels per minute (queue after that)  
✅ **Simultaneous Users**: 50-100 concurrent  
✅ **OpenAI Limits**: 5,000 RPM (very comfortable)  

**Bottom line**: Your current setup can easily handle 100-500 daily active users. The Instagram tool is your only bottleneck, but even that can handle 2,880+ reels per day.

**Next bottleneck**: When you hit 50+ concurrent users, upgrade Railway plan.

---

## Testing Commands

```bash
# Quick test
curl https://jason-coaching-backend-staging.up.railway.app/

# Basic stress test
./stress-test.sh

# Advanced ChatKit test
python3 stress-test-chatkit.py

# Monitor Railway logs in real-time
# (Check Railway dashboard during tests)
```

---

**Last Updated**: October 12, 2025  
**Your Tier**: OpenAI Usage Tier 2 (5,000 RPM)

