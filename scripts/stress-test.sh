#!/bin/bash

# Stress Test Script for Jason's Coaching Hub
# Tests different endpoints with varying load levels

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
STAGING_URL="https://jason-coaching-backend-staging.up.railway.app"
PROD_URL="https://jason-coaching-backend-production.up.railway.app"

echo "🧪 Jason's Coaching Hub - Stress Test Suite"
echo "==========================================="
echo ""

# Function to test endpoint
test_endpoint() {
    local url=$1
    local name=$2
    local concurrent=$3
    local total=$4
    
    echo -e "${YELLOW}Testing: ${name}${NC}"
    echo "URL: ${url}"
    echo "Concurrent requests: ${concurrent}"
    echo "Total requests: ${total}"
    echo ""
    
    # Using Apache Bench (ab) if available, otherwise curl loop
    if command -v ab &> /dev/null; then
        ab -n ${total} -c ${concurrent} -q "${url}" 2>&1 | grep -E "(Requests per second|Time per request|Failed requests)"
    else
        echo "Apache Bench not found. Running simple curl test..."
        start_time=$(date +%s)
        success=0
        failed=0
        
        for i in $(seq 1 ${total}); do
            if curl -s -o /dev/null -w "%{http_code}" "${url}" | grep -q "200"; then
                ((success++))
            else
                ((failed++))
            fi
        done
        
        end_time=$(date +%s)
        duration=$((end_time - start_time))
        rps=$(echo "scale=2; ${total} / ${duration}" | bc)
        
        echo "Completed ${total} requests in ${duration}s"
        echo "Requests per second: ${rps}"
        echo "Successful: ${success}"
        echo "Failed: ${failed}"
    fi
    
    echo ""
    echo "---"
    echo ""
}

# Function to test ChatKit endpoint
test_chatkit() {
    local base_url=$1
    local env_name=$2
    
    echo -e "${GREEN}=== Testing ${env_name} ChatKit Endpoint ===${NC}"
    echo ""
    
    # Simple health check first
    echo "1. Health Check (warm-up)"
    curl -s "${base_url}/" | head -20
    echo ""
    echo "---"
    echo ""
    
    # Light load test
    echo "2. Light Load Test (5 concurrent, 50 total)"
    test_endpoint "${base_url}/" "Health Check Endpoint" 5 50
    
    # Medium load test  
    echo "3. Medium Load Test (10 concurrent, 100 total)"
    test_endpoint "${base_url}/" "Health Check Endpoint" 10 100
    
    # Heavy load test (careful!)
    read -p "Run heavy load test (25 concurrent, 250 total)? [y/N] " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "4. Heavy Load Test (25 concurrent, 250 total)"
        test_endpoint "${base_url}/" "Health Check Endpoint" 25 250
    else
        echo "Skipping heavy load test"
    fi
}

# Main menu
echo "Select environment to test:"
echo "1. Staging"
echo "2. Production"
echo "3. Both"
echo ""
read -p "Enter choice [1-3]: " choice

case $choice in
    1)
        test_chatkit "${STAGING_URL}" "STAGING"
        ;;
    2)
        test_chatkit "${PROD_URL}" "PRODUCTION"
        ;;
    3)
        test_chatkit "${STAGING_URL}" "STAGING"
        echo ""
        echo "================================"
        echo ""
        test_chatkit "${PROD_URL}" "PRODUCTION"
        ;;
    *)
        echo "Invalid choice"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}✅ Stress test complete!${NC}"
echo ""
echo "Key Metrics to Watch:"
echo "  • Requests per second (RPS)"
echo "  • Failed requests (should be 0)"
echo "  • Average response time"
echo ""
echo "Monitor Railway logs during tests:"
echo "  Staging: https://railway.app/project/YOUR_PROJECT"
echo ""

