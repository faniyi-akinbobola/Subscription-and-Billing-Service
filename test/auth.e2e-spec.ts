import request from 'supertest';

describe('Auth (e2e)', () => {
  const baseUrl = process.env.API_BASE_URL || 'http://localhost:3000';
  let authToken: string;
  let userId: string;
  const testEmail = `test-${Date.now()}@example.com`;

  describe('/auth/signup (POST)', () => {
    it('should create a new user', () => {
      return request(baseUrl)
        .post('/v1/auth/signup')
        .send({
          email: testEmail,
          password: 'Test123!@#',
          admin: false,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('user');
          expect(res.body.user).toHaveProperty('id');
          expect(res.body.user).toHaveProperty('email', testEmail);
          expect(res.body.user).not.toHaveProperty('password');
          expect(res.body).toHaveProperty('message');
          userId = res.body.user.id;
        });
    });

    it('should fail with duplicate email', () => {
      return request(baseUrl)
        .post('/v1/auth/signup')
        .send({
          email: testEmail,
          password: 'Test123!@#',
          admin: false,
        })
        .expect(409)
        .expect((res) => {
          expect(res.body).toHaveProperty('message');
        });
    });

    it('should fail with invalid email', () => {
      return request(baseUrl)
        .post('/v1/auth/signup')
        .send({
          email: 'invalid-email',
          password: 'Test123!@#',
        })
        .expect(400);
    });

    it('should fail with weak password', () => {
      return request(baseUrl)
        .post('/v1/auth/signup')
        .send({
          email: `test2-${Date.now()}@example.com`,
          password: '123',
        })
        .expect(400);
    });
  });

  describe('/auth/signin (POST)', () => {
    it('should sign in successfully', () => {
      return request(baseUrl)
        .post('/v1/auth/signin')
        .send({
          email: testEmail,
          password: 'Test123!@#',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('user');
          expect(res.body).toHaveProperty('access_token');
          expect(res.body.user.email).toBe(testEmail);
          authToken = res.body.access_token;
        });
    });

    it('should fail with wrong password', () => {
      return request(baseUrl)
        .post('/v1/auth/signin')
        .send({
          email: testEmail,
          password: 'WrongPassword123!',
        })
        .expect(401);
    });

    it('should fail with non-existent email', () => {
      return request(baseUrl)
        .post('/v1/auth/signin')
        .send({
          email: 'nonexistent@example.com',
          password: 'Test123!@#',
        })
        .expect(401);
    });
  });

  describe('/auth/profile (GET)', () => {
    it('should get user profile', () => {
      return request(baseUrl)
        .get('/v1/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', userId);
          expect(res.body).toHaveProperty('email', testEmail);
          expect(res.body).not.toHaveProperty('password');
        });
    });

    it('should fail without token', () => {
      return request(baseUrl).get('/v1/auth/profile').expect(401);
    });

    it('should fail with invalid token', () => {
      return request(baseUrl)
        .get('/v1/auth/profile')
        .set('Authorization', 'Bearer invalid_token')
        .expect(401);
    });
  });

  describe('/auth/signout (POST)', () => {
    it('should sign out successfully', () => {
      return request(baseUrl)
        .post('/v1/auth/signout')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('message');
        });
    });

    it('should invalidate the old token', () => {
      return request(baseUrl)
        .get('/v1/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(401);
    });
  });
});
