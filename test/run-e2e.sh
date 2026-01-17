#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🚀 Starting E2E Tests with Docker...${NC}\n"

# Ensure Docker containers are running
echo -e "${YELLOW}📦 Starting Docker containers...${NC}"
docker compose -f docker-compose.essential.yml up -d

# Wait for services to be ready
echo -e "${YELLOW}⏳ Waiting for services to be ready...${NC}"
sleep 10

# Check if app is healthy
echo -e "${YELLOW}🏥 Checking application health...${NC}"
max_attempts=30
attempt=0

while [ $attempt -lt $max_attempts ]; do
  if curl -s http://localhost:3000/health > /dev/null; then
    echo -e "${GREEN}✅ Application is healthy!${NC}\n"
    break
  fi
  attempt=$((attempt + 1))
  echo "Attempt $attempt/$max_attempts..."
  sleep 2
done

if [ $attempt -eq $max_attempts ]; then
  echo -e "${RED}❌ Application failed to start${NC}"
  docker compose -f docker-compose.essential.yml logs app
  exit 1
fi

# Run e2e tests
echo -e "${YELLOW}🧪 Running E2E tests...${NC}\n"
API_BASE_URL=http://localhost:3000 npm run test:e2e

# Capture test result
test_result=$?

# Show logs if tests failed
if [ $test_result -ne 0 ]; then
  echo -e "\n${RED}❌ Tests failed! Showing application logs:${NC}\n"
  docker compose -f docker-compose.essential.yml logs --tail=50 app
fi

# Final result
echo ""
if [ $test_result -eq 0 ]; then
  echo -e "${GREEN}✅ All E2E tests passed!${NC}"
else
  echo -e "${RED}❌ Some E2E tests failed${NC}"
fi

exit $test_result
