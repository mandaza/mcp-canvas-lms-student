#!/bin/bash
# Quick deployment script for Canvas MCP Server
# Run on your server: bash DEPLOY_NOW.sh

set -e  # Exit on any error

echo "🚀 Canvas MCP Server - Deployment Script"
echo "=========================================="
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Are you in the project directory?"
    exit 1
fi

# Check if docker-compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Error: docker-compose not found. Please install it first."
    exit 1
fi

# Step 1: Stop existing containers
echo "📦 Step 1/5: Stopping existing containers..."
docker-compose down || true

# Step 2: Clean up old images
echo "🧹 Step 2/5: Cleaning up old images..."
docker images | grep canvas-mcp | awk '{print $3}' | xargs -r docker rmi -f || true

# Step 3: Build new image
echo "🔨 Step 3/5: Building new Docker image..."
docker-compose build --no-cache

# Step 4: Start containers
echo "▶️  Step 4/5: Starting containers..."
docker-compose up -d

# Step 5: Wait and check health
echo "🏥 Step 5/5: Checking health..."
sleep 5

if docker-compose ps | grep -q "Up"; then
    echo ""
    echo "✅ SUCCESS! Canvas MCP Server is running!"
    echo ""
    echo "📊 Container Status:"
    docker-compose ps
    echo ""
    echo "🔗 Health Check:"
    curl -s http://localhost:3001/health | python3 -m json.tool || curl -s http://localhost:3001/health
    echo ""
    echo ""
    echo "📝 View logs with: docker-compose logs -f"
    echo "📊 Check status with: docker-compose ps"
    echo "🛑 Stop server with: docker-compose down"
else
    echo ""
    echo "❌ ERROR: Container failed to start!"
    echo ""
    echo "📋 Checking logs..."
    docker-compose logs --tail=50
    exit 1
fi
