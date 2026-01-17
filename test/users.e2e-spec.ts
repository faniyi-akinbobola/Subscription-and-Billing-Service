import request from 'supertest';

describe('Users (e2e)', () => {
  const baseUrl = process.env.API_BASE_URL || 'http://localhost:3000';
  let adminToken: string;
  let userToken: string;
  let adminUserId: string;
  let regularUserId: string;
  let testUserId: string;

  beforeAll(async () => {
    // Create admin user with admin flag set to true
    const adminSignup = await request(baseUrl)
      .post('/auth/signup')
      .send({
        email: `admin-users-${Date.now()}@example.com`,
        password: 'AdminPass123!',
        firstName: 'Admin',
        lastName: 'User',
        admin: true, // Set admin flag to true
      });
    adminUserId = adminSignup.body.user.id;

    const adminSignin = await request(baseUrl).post('/auth/signin').send({
      email: adminSignup.body.user.email,
      password: 'AdminPass123!',
    });
    adminToken = adminSignin.body.access_token;

    // Create regular user without admin flag
    const userSignup = await request(baseUrl)
      .post('/auth/signup')
      .send({
        email: `user-users-${Date.now()}@example.com`,
        password: 'UserPass123!',
        firstName: 'Regular',
        lastName: 'User',
      });
    regularUserId = userSignup.body.user.id;

    const userSignin = await request(baseUrl).post('/auth/signin').send({
      email: userSignup.body.user.email,
      password: 'UserPass123!',
    });
    userToken = userSignin.body.access_token;
  });

  describe('/users/create (POST)', () => {
    it('should create a new user with authentication', () => {
      return request(baseUrl)
        .post('/users/create')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: `newuser-${Date.now()}@example.com`,
          password: 'NewUserPass123!',
          firstName: 'New',
          lastName: 'User',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('email');
          expect(res.body.email).toContain('newuser-');
          expect(res.body).not.toHaveProperty('password'); // Password should not be returned
          testUserId = res.body.id; // Save for later tests
        });
    });

    it('should fail without authentication', () => {
      return request(baseUrl)
        .post('/users/create')
        .send({
          email: `test-${Date.now()}@example.com`,
          password: 'Password123!',
          firstName: 'Test',
          lastName: 'User',
        })
        .expect(401);
    });

    it('should fail with duplicate email', async () => {
      const duplicateEmail = `duplicate-${Date.now()}@example.com`;

      // Create first user
      await request(baseUrl)
        .post('/users/create')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: duplicateEmail,
          password: 'Password123!',
          firstName: 'First',
          lastName: 'User',
        });

      // Try to create with same email
      return request(baseUrl)
        .post('/users/create')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: duplicateEmail,
          password: 'Password123!',
          firstName: 'Second',
          lastName: 'User',
        })
        .expect(409); // Conflict status code
    });

    it('should fail with invalid email', () => {
      return request(baseUrl)
        .post('/users/create')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'not-an-email',
          password: 'Password123!',
          firstName: 'Test',
          lastName: 'User',
        })
        .expect(400);
    });

    it('should fail with weak password', () => {
      return request(baseUrl)
        .post('/users/create')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: `test-${Date.now()}@example.com`,
          password: '123', // Too short
          firstName: 'Test',
          lastName: 'User',
        })
        .expect(400);
    });

    it('should fail without required fields', () => {
      return request(baseUrl)
        .post('/users/create')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: `test-${Date.now()}@example.com`,
          // Missing password, firstName, lastName
        })
        .expect(400);
    });
  });

  describe('/users (GET)', () => {
    it('should get all users as admin', () => {
      return request(baseUrl)
        .get('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
          // Check user structure
          expect(res.body[0]).toHaveProperty('id');
          expect(res.body[0]).toHaveProperty('email');
          expect(res.body[0]).not.toHaveProperty('password');
        });
    });

    it('should fail for non-admin users', () => {
      return request(baseUrl)
        .get('/users')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('should fail without token', () => {
      return request(baseUrl).get('/users').expect(401);
    });
  });

  describe('/users/:id (GET)', () => {
    it('should get user by id as admin', () => {
      return request(baseUrl)
        .get(`/users/${regularUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', regularUserId);
          expect(res.body).toHaveProperty('email');
          expect(res.body).not.toHaveProperty('password');
        });
    });

    it('should fail for non-admin users', () => {
      return request(baseUrl)
        .get(`/users/${adminUserId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('should fail with non-existent user id', () => {
      return request(baseUrl)
        .get('/users/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('should fail with invalid uuid', () => {
      return request(baseUrl)
        .get('/users/invalid-uuid')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(500); // Invalid UUID causes database error
    });

    it('should fail without authentication', () => {
      return request(baseUrl).get(`/users/${regularUserId}`).expect(401);
    });
  });

  describe('/users/:id (PATCH)', () => {
    let updateTestUserId: string;

    beforeAll(async () => {
      // Create a user specifically for update testing
      const response = await request(baseUrl)
        .post('/users/create')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: `update-test-${Date.now()}@example.com`,
          password: 'Password123!',
          firstName: 'Update',
          lastName: 'Test',
        });
      updateTestUserId = response.body.id;
    });

    it('should update user firstName', () => {
      return request(baseUrl)
        .patch(`/users/${updateTestUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          firstName: 'Updated',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', updateTestUserId);
          expect(res.body).toHaveProperty('firstName', 'Updated');
        });
    });

    it('should update user lastName', () => {
      return request(baseUrl)
        .patch(`/users/${updateTestUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          lastName: 'Modified',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('lastName', 'Modified');
        });
    });

    it('should update user email', () => {
      const newEmail = `updated-${Date.now()}@example.com`;
      return request(baseUrl)
        .patch(`/users/${updateTestUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: newEmail,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('email', newEmail);
        });
    });

    it('should update multiple fields at once', () => {
      return request(baseUrl)
        .patch(`/users/${updateTestUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          firstName: 'Multi',
          lastName: 'Update',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('firstName', 'Multi');
          expect(res.body).toHaveProperty('lastName', 'Update');
        });
    });

    it('should fail with invalid email format', () => {
      return request(baseUrl)
        .patch(`/users/${updateTestUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'not-an-email',
        })
        .expect(400);
    });

    it('should fail with non-existent user id', () => {
      return request(baseUrl)
        .patch('/users/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          firstName: 'Test',
        })
        .expect(404);
    });
  });

  describe('/users/:id (DELETE)', () => {
    let deleteTestUserId: string;

    beforeAll(async () => {
      // Create a user specifically for deletion testing
      const response = await request(baseUrl)
        .post('/users/create')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: `delete-test-${Date.now()}@example.com`,
          password: 'Password123!',
          firstName: 'Delete',
          lastName: 'Test',
        });
      deleteTestUserId = response.body.id;
    });

    it('should fail for non-admin users', () => {
      return request(baseUrl)
        .delete(`/users/${deleteTestUserId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('should delete user as admin', () => {
      return request(baseUrl)
        .delete(`/users/${deleteTestUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', deleteTestUserId);
        });
    });

    it('should fail to get deleted user', () => {
      return request(baseUrl)
        .get(`/users/${deleteTestUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('should fail with non-existent user id', () => {
      return request(baseUrl)
        .delete('/users/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  describe('Authorization checks', () => {
    it('should require authentication for all endpoints', async () => {
      // Test all endpoints without token
      await request(baseUrl).get('/users').expect(401);
      await request(baseUrl).get(`/users/${regularUserId}`).expect(401);
      await request(baseUrl).post('/users/create').send({}).expect(401);
      await request(baseUrl)
        .patch(`/users/${regularUserId}`)
        .send({})
        .expect(401);
      await request(baseUrl).delete(`/users/${regularUserId}`).expect(401);
    });

    it('should enforce admin-only access for restricted endpoints', async () => {
      // Test admin-only endpoints with regular user token
      await request(baseUrl)
        .get('/users')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      await request(baseUrl)
        .get(`/users/${adminUserId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      await request(baseUrl)
        .delete(`/users/${regularUserId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });
  });
});
