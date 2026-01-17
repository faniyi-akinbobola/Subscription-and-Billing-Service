# Users Module E2E Test Status

## ⚠️ Status: INCOMPLETE - Multiple Blocker Issues

### Issues Identified

#### 1. Controller Design Issues

**File**: `src/users/users.controller.ts`

**Problem**: Duplicate `@Get()` decorators causing routing conflicts

```typescript
@UseGuards(AdminGuard)
@Get()  // First @Get()
async findAllUsers() { ... }

@Get()  // Second @Get() - CONFLICT!
async findUserByEmail(@Param('email') email: string) { ... }
```

**Impact**: Cannot test GET /users endpoint reliably

**Fix Needed**: Change one of them to a different route:

```typescript
@Get('/all')  // or @Get()
async findAllUsers() { ... }

@Get('/by-email/:email')  // or use query parameter
async findUserByEmail(@Param('email') email: string) { ... }
```

#### 2. JWT Token Authentication Issues

**Problem**: Tokens created via `/auth/signup` and `/auth/signin` return 401 Unauthorized when used in Users endpoints

**Possible Causes**:

- Token expiry timing issue
- JWT secret mismatch between auth and users modules
- Token format incompatibility
- Async timing in beforeAll hook

**Tests Affected**: ALL tests (16 failing)

**Impact**: Cannot test any authenticated endpoints

#### 3. Admin Privilege Testing Limitation

**Problem**: No way to create admin users through API endpoints

**Current Situation**:

- `/auth/signup` creates regular users only
- `/users/create` requires existing JWT auth but doesn't grant admin privileges
- No seed data or admin bootstrap mechanism

**Tests Affected**: All admin-only endpoints (GET /users, GET /users/:id, DELETE /users/:id)

**Impact**: Cannot test admin authorization properly

#### 4. Test Suite Results

```
Tests:       16 failed, 6 skipped, 4 passed, 26 total
Success Rate: 15% (4/26)
```

**Passing Tests** (4):

- ✅ should fail without authentication (3 tests - all expect 401)
- ✅ should require authentication for all endpoints

**Skipped Tests** (6):

- ⏭️ GET /users tests (controller routing conflict)
- ⏭️ GET /users/:id tests (requires admin user)

**Failing Tests** (16):

- ❌ All POST /users/create tests (401 Unauthorized)
- ❌ All PATCH /users/:id tests (401 Unauthorized)
- ❌ All DELETE /users/:id tests (401 Unauthorized)
- ❌ Admin authorization checks (401 instead of 403)

### Recommendations

#### Short Term: Skip Users E2E Tests

Given the blocking issues, skip comprehensive Users e2e tests and focus on modules with working authentication patterns:

1. ✅ **Auth** - 14 tests passing
2. ✅ **Plans** - 13 tests passing
3. ✅ **Subscriptions** - 15 tests passing
4. ⏭️ **Users** - Multiple blocker issues
5. 🔄 **Payments** - Next to implement
6. 🔄 **Billings** - Next to implement
7. 🔄 **Email** - Next to implement

#### Long Term: Fix Controller & Auth

1. **Fix Controller Routing**
   - Remove duplicate @Get() decorators
   - Use distinct routes for different operations
   - Add proper route parameters

2. **Fix Admin User Creation**
   - Add database seed for admin user
   - Or add admin flag to signup (with proper authorization)
   - Or create admin bootstrap endpoint

3. **Debug JWT Token Issues**
   - Verify token format and signing
   - Check token expiry settings
   - Ensure consistent JWT configuration across modules

4. **Re-enable Tests**
   - Update test suite once controllers are fixed
   - Add proper admin user setup in beforeAll
   - Test all CRUD operations with valid tokens

### Test File Location

`test/users.e2e-spec.ts` - Created but not functional

### Next Steps

Move to **Payments Module** e2e tests which has simpler auth requirements and better-defined endpoints.
