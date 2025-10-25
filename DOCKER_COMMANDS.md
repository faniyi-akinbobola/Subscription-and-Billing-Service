# Docker Development Commands Reference 🐳

This file contains all the essential Docker commands for your subscription service project.
As a Docker beginner, use this as your go-to reference!

## � IMPORTANT: Windows Docker File Watching Issue

**Note for Windows Users:** Docker Desktop on Windows has limitations with file watching. The hot reload feature may not work consistently. Here are your options:

### Option 1: Manual Restart (Recommended for Windows)

When you make changes to your code, manually restart the application:

```bash
docker-compose restart app
```

### Option 2: Development Outside Docker

For the best development experience on Windows, you can run the database in Docker but the app locally:

```bash
# Run only database services
docker-compose up postgres redis pgAdmin

# Run the app locally (in a separate terminal)
cd subscription-service
npm run start:dev
```

### Option 3: Enable WSL2 Backend

In Docker Desktop settings, ensure you're using the WSL2 backend for better file watching support.

---

## �🚀 STARTING YOUR DEVELOPMENT ENVIRONMENT

### Start Everything (Most Common)

```bash
cd subscription-service
docker-compose up -d
```

**When to use:** Every time you start coding. This starts your entire development stack.
**What it does:** Starts PostgreSQL, Redis, and your NestJS app in the background (-d = detached mode)

### Start Individual Services

```bash
# Start only database and cache
docker-compose up postgres redis -d

# Start the app after
docker-compose up app -d
```

**When to use:** When you want more control over startup order or testing specific services.

### Start with Logs Visible

```bash
docker-compose up
```

**When to use:** When you want to see all logs immediately (no -d flag means logs stay visible)
**Note:** Press Ctrl+C to stop all services when running this way.

## 📊 MONITORING & DEBUGGING

### Check What's Running

```bash
docker-compose ps
```

**When to use:** To see if all your services are running and healthy.
**What you'll see:** Container names, status (Up/Down), and ports.

### View Application Logs (Live)

```bash
docker logs subscription-service -f
```

**When to use:** To see your NestJS app output, errors, and hot reload messages.
**What -f does:** Follows the logs in real-time (like tail -f)
**To exit:** Press Ctrl+C

### View Database Logs

```bash
docker logs subscription-postgres -f
```

**When to use:** When database isn't starting or you have connection issues.

### View All Service Logs

```bash
docker-compose logs -f
```

**When to use:** To see logs from all services at once.

## 🔧 DEVELOPMENT COMMANDS

### Run Database Migrations

```bash
docker-compose exec app npm run migration:run
```

**When to use:** After creating new migrations or setting up the database for the first time.
**What it does:** Executes pending database migrations inside the app container.

### Generate New Migration

```bash
docker-compose exec app npm run migration:generate src/migrations/CreateProductsTable
```

**When to use:** When you add new entities or change existing ones.
**Replace "CreateProductsTable"** with your actual migration name.
**Note:** The path includes the migrations folder and filename.

### Revert Last Migration

```bash
docker-compose exec app npm run migration:revert
```

**When to use:** When you need to undo the last migration (be careful!).

### Install New NPM Package

```bash
docker-compose exec app npm install package-name
```

**When to use:** When you need to add a new dependency to your project.
**Example:** `docker-compose exec app npm install @nestjs/jwt`

### Install Dev Dependencies

```bash
docker-compose exec app npm install --save-dev package-name
```

**When to use:** For development-only packages like testing tools.

### Run Tests

```bash
docker-compose exec app npm run test
```

**When to use:** To run your unit tests inside the container.

### Run Tests in Watch Mode

```bash
docker-compose exec app npm run test:watch
```

**When to use:** During development when you want tests to re-run automatically.

## 🔍 ACCESSING CONTAINERS

### Access App Container Shell

```bash
docker-compose exec app bash
```

**When to use:** When you need to run multiple commands inside the app container or explore the file system.
**To exit:** Type `exit`

### Access Database Directly

```bash
docker exec -it subscription-postgres psql -U postgres -d subscription_db
```

**When to use:** To run SQL queries directly or inspect database structure.
**Common commands once inside:**

- `\dt` - List all tables
- `\d users` - Describe users table structure
- `SELECT * FROM users;` - Query users table
- `\q` - Quit

### Access Redis CLI

```bash
docker exec -it subscription-redis redis-cli
```

**When to use:** To inspect cache data or debug Redis issues.
**To exit:** Type `exit`

## 🛑 STOPPING SERVICES

### Stop All Services

```bash
docker-compose down
```

**When to use:** When you're done coding for the day.
**What it does:** Stops and removes containers, but keeps your data volumes.

### Stop and Remove Everything (Fresh Start)

```bash
docker-compose down -v
```

**When to use:** When you want to reset everything including database data.
**⚠️ WARNING:** This deletes all your database data! Use carefully.

### Stop Individual Service

```bash
docker-compose stop app
```

**When to use:** To stop just the app while keeping database running.

### Restart a Service

```bash
docker-compose restart app
```

**When to use:** When the app is stuck or you want to restart without stopping everything.

## 🔄 REBUILDING & UPDATING

### Rebuild App Container

```bash
docker-compose build app
```

**When to use:** After changing Dockerfile.dev or when dependencies aren't updating properly.

### Rebuild and Start

```bash
docker-compose up --build -d
```

**When to use:** When you want to rebuild all containers and start them.

### Pull Latest Images

```bash
docker-compose pull
```

**When to use:** To update base images (postgres, redis) to latest versions.

## 🌐 ACCESSING YOUR SERVICES

Once everything is running, you can access:

- **Your API:** http://localhost:3000
- **pgAdmin (Database UI):** http://localhost:5050
  - Email: admin@admin.com
  - Password: testpass123
- **Database (external tools):** localhost:5432
- **Redis (external tools):** localhost:6379

## 🗄️ DATABASE VISUALIZATION OPTIONS

### Option 1: pgAdmin (Web Interface) - RECOMMENDED

```bash
# Start pgAdmin (if not already running)
docker-compose up pgadmin -d

# Access at: http://localhost:5050
# Login: admin@admin.com / testpass123
```

**Setup steps in pgAdmin:**

1. Right-click "Servers" → "Register" → "Server"
2. General tab: Name = "Subscription DB"
3. Connection tab:
   - Host = `postgres`
   - Port = `5432`
   - Username = `postgres`
   - Password = `testpass123`
   - Database = `subscription_db`

### Option 2: Command Line Queries

```bash
# Access PostgreSQL directly
docker exec -it subscription-postgres psql -U postgres -d subscription_db

# Quick table inspection
docker exec subscription-postgres psql -U postgres -d subscription_db -c "\dt"

# Query users table
docker exec subscription-postgres psql -U postgres -d subscription_db -c "SELECT * FROM users;"

# Check table structure
docker exec subscription-postgres psql -U postgres -d subscription_db -c "\d users"
```

### Option 3: VS Code Extensions

Install these extensions in VS Code:

- **PostgreSQL** by Chris Kolkman
- **SQLTools** by Matheus Teixeira

Connect using: localhost:5432, postgres/testpass123

## 📝 DAILY WORKFLOW EXAMPLE

```bash
# 1. Start your day
cd subscription-service
docker-compose up -d

# 2. Check everything started correctly
docker-compose ps

# 3. Watch your app logs while coding
docker logs subscription-service -f

# 4. If you add a new migration during development
docker-compose exec app npm run migration:run

# 5. End of day
docker-compose down
```

## 🆘 TROUBLESHOOTING COMMANDS

### When App Won't Start

```bash
# Check what's wrong
docker logs subscription-service

# Try rebuilding
docker-compose build app
docker-compose up app -d
```

### When Database Connection Fails

```bash
# Check if postgres is running
docker-compose ps
docker logs subscription-postgres

# Test database connection
docker exec subscription-postgres psql -U postgres -c "SELECT version();"
```

### When You Want a Complete Reset

```bash
# Nuclear option - deletes everything and starts fresh
docker-compose down -v
docker-compose up --build -d
```

## 💡 DOCKER CONCEPTS FOR BEGINNERS

- **Container:** Like a lightweight virtual machine running your app
- **Image:** The blueprint used to create containers
- **Volume:** Persistent storage that survives container restarts
- **Network:** How containers talk to each other
- **docker-compose:** Tool to manage multiple containers as one application

## 🎯 KEY POINTS TO REMEMBER

1. **Always use `docker-compose` commands** - not direct `npm` commands
2. **Your code changes automatically restart the app** thanks to volume mounts
3. **Data persists** even when you stop containers (unless you use -v flag)
4. **Use `-f` flag to follow logs** when debugging
5. **Use `-d` flag to run in background** for normal development

Happy coding! 🚀
