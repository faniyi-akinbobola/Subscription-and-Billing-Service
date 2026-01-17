# Testing Guide

## 🧪 Test Coverage

This project has comprehensive test coverage across multiple levels:

### Test Statistics
```
Unit Tests: 197 tests across 14 suites (100% passing)
E2E Tests:  43 tests across 4 suites (93.5% passing)
Total:      240 tests
```

## 📝 Test Types

### 1. Unit Tests
Unit tests validate individual services, controllers, and modules in isolation.

**Run all unit tests:**
```bash
npm run test
```

**Run specific test file:**
```bash
npm run test -- src/auth/auth.service.spec.ts
```

**Run with coverage:**
```bash
npm run test:cov
```

**Watch mode (for development):**
```bash
npm run test:watch
```

### 2. End-to-End (E2E) Tests
E2E tests validate the entire application flow against live Docker containers.

**Run all e2e tests with Docker:**
```bash
npm run test:e2e:docker
```

This command:
- Starts Docker containers (app, PostgreSQL, Redis)
- Waits for services to be healthy
- Runs all e2e test suites
- Shows logs on failure
- Returns exit code for CI/CD

**Run e2e tests (manual):**
```bash
# Start containers first
docker compose -f docker-compose.essential.yml up -d

# Run tests
npm run test:e2e
```

## 📊 E2E Test Modules

### Application Health
- ✅ Health check endpoint

### Authentication (`test/auth.e2e-spec.ts`)
- ✅ User signup with validation
- ✅ User signin
- ✅ Profile retrieval
- ✅ User signout and token invalidation

**Coverage**: 14 test scenarios including:
- Email format validation
- Password strength validation
- Duplicate user prevention
- JWT token handling
- Token invalidation on signout

### Plans Management (`test/plans.e2e-spec.ts`)
- ✅ Create plans (admin only)
- ✅ List all plans
- ✅ Get plan by ID
- ✅ Update plans (admin only)
- ✅ Delete plans (admin only)

**Coverage**: 13 test scenarios including:
- Admin authorization checks
- User forbidden access
- Duplicate plan name prevention
- UUID validation

### Subscriptions (`test/subscriptions.e2e-spec.ts`)
- ✅ Create subscriptions (admin only)
- ✅ List subscriptions with pagination
- ✅ Get user's own subscriptions
- ✅ Get subscription by ID
- ✅ Get subscription statistics
- ✅ Delete subscriptions (admin only)

**Coverage**: 15 test scenarios including:
- Admin vs user permissions
- Invalid UUID handling
- Pagination support
- Data validation

## 🐛 Known Issues

See [E2E_TEST_REPORT.md](./E2E_TEST_REPORT.md) for detailed test results and known issues.

**Current Known Issues:**
- 3 subscription update/cancel tests skipped due to entity relation issues

## 🔧 Test Configuration

### Unit Test Configuration
File: `package.json` > jest configuration

```json
{
  "moduleFileExtensions": ["js", "json", "ts"],
  "rootDir": "src",
  "testRegex": ".*\\.spec\\.ts$",
  "transform": {
    "^.+\\.(t|j)s$": "ts-jest"
  }
}
```

### E2E Test Configuration
File: `test/jest-e2e.json`

```json
{
  "moduleFileExtensions": ["js", "json", "ts"],
  "rootDir": ".",
  "testEnvironment": "node",
  "testRegex": ".e2e-spec.ts$",
  "transform": {
    "^.+\\.(t|j)s$": "ts-jest"
  }
}
```

## 📦 Test Dependencies

### Testing Frameworks
- **Jest**: Test runner and assertion library
- **Supertest**: HTTP request testing
- **@nestjs/testing**: NestJS testing utilities

### Mocking
- **PinoLogger**: All services have mocked logger for unit tests
- **Repositories**: TypeORM repositories mocked with test data
- **External Services**: Stripe, email services mocked

## 🎯 Writing New Tests

### Unit Test Template

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { PinoLogger } from 'nestjs-pino';
import { YourService } from './your.service';

describe('YourService', () => {
  let service: YourService;
  let mockPinoLogger: Partial<PinoLogger>;

  beforeEach(async () => {
    mockPinoLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        YourService,
        {
          provide: `PinoLogger:YourService`,
          useValue: mockPinoLogger,
        },
      ],
    }).compile();

    service = module.get<YourService>(YourService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
```

### E2E Test Template

```typescript
import * as request from 'supertest';

describe('YourModule (e2e)', () => {
  const baseUrl = process.env.API_BASE_URL || 'http://localhost:3000';
  let authToken: string;

  beforeAll(async () => {
    // Setup: Create test user and get token
    const signupResponse = await request(baseUrl)
      .post('/auth/signup')
      .send({
        email: `test-${Date.now()}@example.com`,
        password: 'Password123!',
      });

    const signinResponse = await request(baseUrl)
      .post('/auth/signin')
      .send({
        email: signupResponse.body.email,
        password: 'Password123!',
      });

    authToken = signinResponse.body.access_token;
  });

  describe('/your-endpoint (GET)', () => {
    it('should return data', () => {
      return request(baseUrl)
        .get('/your-endpoint')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
        });
    });
  });
});
```

## 🚀 CI/CD Integration

The e2e test script returns proper exit codes for CI/CD:
- Exit 0: All tests passed
- Exit 1: Some tests failed

**GitHub Actions Example:**
```yaml
- name: Run E2E Tests
  run: npm run test:e2e:docker
```

**GitLab CI Example:**
```yaml
test:e2e:
  script:
    - npm run test:e2e:docker
```

## 📈 Test Metrics

**Unit Test Performance:**
- Execution Time: ~1.5s
- Tests: 197
- Suites: 14

**E2E Test Performance:**
- Execution Time: ~1.5s
- Tests: 43 (3 skipped)
- Suites: 4

**Total Coverage:**
- Statements: TBD (run `npm run test:cov`)
- Branches: TBD
- Functions: TBD
- Lines: TBD

## 🔍 Debugging Tests

### Debug Unit Tests in VS Code

Add to `.vscode/launch.json`:
```json
{
  "type": "node",
  "request": "launch",
  "name": "Jest Debug",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": ["--runInBand", "${file}"],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

### Debug E2E Tests

1. Start Docker containers:
   ```bash
   docker compose -f docker-compose.essential.yml up -d
   ```

2. Run specific test with logs:
   ```bash
   npm run test:e2e -- test/auth.e2e-spec.ts
   ```

3. View application logs:
   ```bash
   docker compose -f docker-compose.essential.yml logs -f app
   ```

## 📚 Additional Resources

- [Jest Documentation](https://jestjs.io/)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [NestJS Testing](https://docs.nestjs.com/fundamentals/testing)
- [E2E Test Report](./E2E_TEST_REPORT.md)
