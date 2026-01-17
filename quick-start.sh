#!/bin/bash

# 🚀 Quick Start Script for Stripe Payment Testing
# This script helps you set up and test your Stripe integration

set -e  # Exit on error

echo "🎯 Stripe Payment Workflow - Quick Start"
echo "========================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${RED}❌ .env file not found!${NC}"
    echo "Creating .env from .env.example..."
    cp .env.example .env
    echo -e "${GREEN}✅ .env file created${NC}"
    echo ""
fi

# Check Stripe keys
echo "🔍 Checking Stripe configuration..."
STRIPE_KEY=$(grep STRIPE_SECRET_KEY .env | cut -d '=' -f2)

if [[ "$STRIPE_KEY" == *"your_stripe_secret_key_here"* ]] || [[ "$STRIPE_KEY" == *"51234567890"* ]]; then
    echo -e "${RED}❌ Stripe API keys not configured!${NC}"
    echo ""
    echo "📋 To get your Stripe test keys:"
    echo "1. Visit: https://dashboard.stripe.com/register"
    echo "2. Create a free account (no credit card needed)"
    echo "3. Go to: https://dashboard.stripe.com/test/apikeys"
    echo "4. Copy your test keys (sk_test_... and pk_test_...)"
    echo ""
    echo "Then update your .env file:"
    echo "  STRIPE_SECRET_KEY=sk_test_YOUR_ACTUAL_KEY"
    echo "  STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_ACTUAL_KEY"
    echo ""
    echo -e "${YELLOW}⏸️  Setup paused. Please configure Stripe keys first.${NC}"
    exit 1
else
    echo -e "${GREEN}✅ Stripe keys configured${NC}"
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo ""
    echo "📦 Installing dependencies..."
    npm install
    echo -e "${GREEN}✅ Dependencies installed${NC}"
fi

# Check if Docker is running
echo ""
echo "🐳 Checking Docker..."
if docker info > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Docker is running${NC}"
    
    # Check if PostgreSQL container is running
    if docker ps | grep -q "subscription-postgres"; then
        echo -e "${GREEN}✅ PostgreSQL container is running${NC}"
    else
        echo -e "${YELLOW}⚠️  PostgreSQL container not running${NC}"
        echo "Starting PostgreSQL with Docker Compose..."
        docker-compose up -d postgres
        echo "Waiting for PostgreSQL to be ready..."
        sleep 5
        echo -e "${GREEN}✅ PostgreSQL started${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Docker not running. Using local PostgreSQL.${NC}"
fi

# Run migrations
echo ""
echo "🗄️  Running database migrations..."
if npm run migration:run; then
    echo -e "${GREEN}✅ Migrations completed${NC}"
else
    echo -e "${RED}❌ Migration failed${NC}"
    echo "Please check your database configuration in .env"
    echo "Make sure PostgreSQL is running and accessible."
    exit 1
fi

# Start the application
echo ""
echo "🚀 Starting the application..."
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ Setup Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "📋 Next Steps:"
echo ""
echo "1. Application is starting..."
echo "   → Check for any startup errors"
echo ""
echo "2. Access Swagger documentation:"
echo "   → http://localhost:3000/api"
echo ""
echo "3. Test webhook forwarding (in a new terminal):"
echo "   → stripe listen --forward-to localhost:3000/payments/webhooks"
echo ""
echo "4. Follow the complete testing guide:"
echo "   → See STRIPE_TESTING_COMPLETE_GUIDE.md"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop the server${NC}"
echo ""

# Start the dev server
npm run start:dev
