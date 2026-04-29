import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('/health (GET)', () => {
    return request(app.getHttpServer()).get('/health').expect(200);
  });

  // e2e flow mockup (register -> login -> create -> list)
  it('should complete full auth and note flow', async () => {
    const timestamp = Date.now();
    const email = `test${timestamp}@e2e.com`;
    const password = 'password123';

    // Register
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email, password })
      .expect(201);

    // Login
    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password })
      .expect(200);

    const token = loginRes.body.access_token;

    // Create note
    await request(app.getHttpServer())
      .post('/notes')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'e2e note', content: 'content' })
      .expect(201);

    // List notes
    const listRes = await request(app.getHttpServer())
      .get('/notes')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(listRes.body.length).toBeGreaterThan(0);
    expect(listRes.body[0].title).toEqual('e2e note');
  });
});
