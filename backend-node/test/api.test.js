jest.mock('../src/db', () => ({
  query: jest.fn().mockResolvedValue({ rows: [], rowCount: 0 }),
}));

describe('API contract smoke', () => {
  let app;
  let supertest;
  beforeAll(() => {
    process.env.JWT_SECRET = 'testsecret';
    ({ app } = require('../src/server'));
    supertest = require('supertest');
  });

  it('rejects missing credentials', async () => {
    const response = await supertest(app).post('/auth/login').send({});
    expect(response.status).toBe(400);
  });

  it('authenticates demo user', async () => {
    const response = await supertest(app).post('/auth/login').send({ username: 'admin@demo', password: 'admin' });
    expect(response.status).toBe(200);
    expect(response.body.token).toBeDefined();
  });
});
