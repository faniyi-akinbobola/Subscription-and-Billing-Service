#!/bin/bash

# Migration Helper Script
# This script helps you manage database migrations

echo "🗄️  Database Migration Helper"
echo "=============================="

case "$1" in
  "generate")
    echo "📝 Generating new migration based on entity changes..."
    npm run migration:generate -- src/migrations/$2
    ;;
  "create")
    echo "📄 Creating empty migration file..."
    npm run migration:create -- src/migrations/$2
    ;;
  "run")
    echo "🚀 Running pending migrations..."
    npm run migration:run
    ;;
  "revert")
    echo "⏪ Reverting last migration..."
    npm run migration:revert
    ;;
  "show")
    echo "👁️  Showing migration status..."
    npm run migration:show
    ;;
  *)
    echo "Usage: $0 {generate|create|run|revert|show} [migration-name]"
    echo ""
    echo "Examples:"
    echo "  $0 generate CreateUsersTable"
    echo "  $0 create AddIndexToEmail"
    echo "  $0 run"
    echo "  $0 revert"
    echo "  $0 show"
    ;;
esac