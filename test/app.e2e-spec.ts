import request from 'supertest';

describe('AppController (e2e)', () => {
  const baseUrl = process.env.API_BASE_URL || 'http://localhost:3000';

  it('/ (GET) - Health check', () => {
    return request(baseUrl)
      .get('/health')
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('status', 'OK');
        expect(res.body).toHaveProperty('timestamp');
        expect(res.body).toHaveProperty('uptime');
      });
  });
});
