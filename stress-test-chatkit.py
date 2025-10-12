#!/usr/bin/env python3
"""
Stress Test for Jason's Coaching Hub ChatKit API
Tests realistic user scenarios including streaming responses
"""

import asyncio
import time
import statistics
from typing import List, Dict
import httpx
import json
from datetime import datetime

# Configuration
STAGING_URL = "https://jason-coaching-backend-staging.up.railway.app"
PROD_URL = "https://jason-coaching-backend-production.up.railway.app"

# Test scenarios
TEST_MESSAGES = [
    "What are the best hooks for Instagram reels?",
    "Help me create a content strategy",
    "What's your ICP framework?",
    "Give me a script template for a 30-second reel",
    "How do I grow on Instagram?",
]


class StressTestResult:
    def __init__(self):
        self.success_count = 0
        self.failure_count = 0
        self.response_times: List[float] = []
        self.errors: List[str] = []
        self.start_time = None
        self.end_time = None
    
    def add_success(self, response_time: float):
        self.success_count += 1
        self.response_times.append(response_time)
    
    def add_failure(self, error: str):
        self.failure_count += 1
        self.errors.append(error)
    
    def print_summary(self):
        total_requests = self.success_count + self.failure_count
        duration = self.end_time - self.start_time if self.end_time and self.start_time else 0
        
        print("\n" + "="*60)
        print("📊 STRESS TEST RESULTS")
        print("="*60)
        print(f"\n⏱️  Duration: {duration:.2f}s")
        print(f"📨 Total Requests: {total_requests}")
        print(f"✅ Successful: {self.success_count}")
        print(f"❌ Failed: {self.failure_count}")
        print(f"📈 Success Rate: {(self.success_count/total_requests*100):.1f}%")
        
        if self.response_times:
            print(f"\n⚡ Response Times:")
            print(f"   • Min: {min(self.response_times):.2f}s")
            print(f"   • Max: {max(self.response_times):.2f}s")
            print(f"   • Avg: {statistics.mean(self.response_times):.2f}s")
            print(f"   • Median: {statistics.median(self.response_times):.2f}s")
            if len(self.response_times) > 1:
                print(f"   • Std Dev: {statistics.stdev(self.response_times):.2f}s")
        
        if duration > 0:
            rps = total_requests / duration
            print(f"\n🚀 Throughput: {rps:.2f} requests/second")
        
        if self.errors:
            print(f"\n⚠️  Errors ({len(self.errors)}):")
            for i, error in enumerate(self.errors[:5], 1):
                print(f"   {i}. {error[:100]}")
            if len(self.errors) > 5:
                print(f"   ... and {len(self.errors) - 5} more")
        
        print("\n" + "="*60 + "\n")


async def test_health_endpoint(base_url: str, client: httpx.AsyncClient) -> float:
    """Test the health/root endpoint"""
    start = time.time()
    try:
        response = await client.get(f"{base_url}/", timeout=10.0)
        response.raise_for_status()
        return time.time() - start
    except Exception as e:
        raise Exception(f"Health check failed: {str(e)}")


async def test_chatkit_streaming(base_url: str, client: httpx.AsyncClient, message: str) -> float:
    """Test a ChatKit streaming request"""
    start = time.time()
    
    session_id = f"stress_test_{int(time.time()*1000)}"
    
    payload = {
        "messages": [{"role": "user", "content": message}],
        "context": {}
    }
    
    try:
        # Test without streaming first (faster)
        response = await client.post(
            f"{base_url}/chatkit?sid={session_id}",
            json=payload,
            timeout=30.0
        )
        response.raise_for_status()
        return time.time() - start
    except Exception as e:
        raise Exception(f"ChatKit request failed: {str(e)}")


async def run_concurrent_tests(base_url: str, num_concurrent: int, test_type: str) -> StressTestResult:
    """Run concurrent tests"""
    result = StressTestResult()
    result.start_time = time.time()
    
    async with httpx.AsyncClient() as client:
        if test_type == "health":
            tasks = [test_health_endpoint(base_url, client) for _ in range(num_concurrent)]
        else:
            # Use different messages to simulate realistic load
            tasks = [
                test_chatkit_streaming(base_url, client, TEST_MESSAGES[i % len(TEST_MESSAGES)])
                for i in range(num_concurrent)
            ]
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        for res in results:
            if isinstance(res, Exception):
                result.add_failure(str(res))
            else:
                result.add_success(res)
    
    result.end_time = time.time()
    return result


async def progressive_load_test(base_url: str, env_name: str):
    """Run progressive load test with increasing concurrency"""
    print(f"\n🧪 Starting Progressive Load Test on {env_name}")
    print(f"🌐 Target: {base_url}")
    print("="*60 + "\n")
    
    # Phase 1: Warm-up
    print("Phase 1: Warm-up (1 request)")
    result = await run_concurrent_tests(base_url, 1, "health")
    result.print_summary()
    
    # Phase 2: Light load
    print("Phase 2: Light Load (5 concurrent health checks)")
    result = await run_concurrent_tests(base_url, 5, "health")
    result.print_summary()
    
    # Phase 3: Medium load
    print("Phase 3: Medium Load (10 concurrent health checks)")
    result = await run_concurrent_tests(base_url, 10, "health")
    result.print_summary()
    
    # Phase 4: ChatKit test (realistic)
    print("Phase 4: Realistic ChatKit Test (3 concurrent conversations)")
    print("⚠️  This will send actual messages to the agent\n")
    result = await run_concurrent_tests(base_url, 3, "chatkit")
    result.print_summary()
    
    # Phase 5: Heavy load (optional)
    response = input("Run heavy load test (25 concurrent health checks)? [y/N]: ")
    if response.lower() == 'y':
        print("\nPhase 5: Heavy Load (25 concurrent health checks)")
        result = await run_concurrent_tests(base_url, 25, "health")
        result.print_summary()


async def main():
    """Main stress test runner"""
    print("\n" + "="*60)
    print("🚀 Jason's Coaching Hub - Advanced Stress Test")
    print("="*60)
    
    print("\nSelect environment to test:")
    print("1. Staging")
    print("2. Production")
    print("3. Both (Sequential)")
    
    choice = input("\nEnter choice [1-3]: ").strip()
    
    if choice == "1":
        await progressive_load_test(STAGING_URL, "STAGING")
    elif choice == "2":
        await progressive_load_test(PROD_URL, "PRODUCTION")
    elif choice == "3":
        await progressive_load_test(STAGING_URL, "STAGING")
        await progressive_load_test(PROD_URL, "PRODUCTION")
    else:
        print("❌ Invalid choice")
        return
    
    print("\n✅ All stress tests complete!\n")
    print("📋 Recommendations:")
    print("  • Monitor Railway metrics during tests")
    print("  • Check for any rate limit errors")
    print("  • Watch memory/CPU usage")
    print("  • Instagram tool can only handle 1-2 concurrent reels\n")


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n\n⚠️  Test interrupted by user\n")
    except Exception as e:
        print(f"\n❌ Error: {e}\n")

