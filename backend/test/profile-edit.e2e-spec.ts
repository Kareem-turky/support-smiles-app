import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Profile Edit & User Edit (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let normalToken: string;
  let normalUserId: string;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Setup Admin
    const adminRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@supportsmiles.com', password: 'admin123' });
    adminToken = adminRes.body.data.access_token;

    // Login logic for a normal user (CS agent or someone else)
    const normalRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'hr_manager@supportsmiles.com', password: 'password123' }); // fallback based on seeds
    if (!normalRes.body.data?.access_token) {
      // Create user if not exist
      const createRes = await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Test Normal', email: 'normal_tester@supportsmiles.com', password: 'password123', role: 'CS_AGENT' });
      normalUserId = createRes.body.id;
      
      const loginRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'normal_tester@supportsmiles.com', password: 'password123' });
      normalToken = loginRes.body.data.access_token;
    } else {
      normalToken = normalRes.body.data.access_token;
      normalUserId = normalRes.body.data.user.id;
    }
  });

  afterEach(async () => {
    await app.close();
  });

  it('User can update own name', async () => {
    const res = await request(app.getHttpServer())
      .patch('/auth/me')
      .set('Authorization', `Bearer ${normalToken}`)
      .send({ name: 'Updated Name' })
      .expect(200);

    expect(res.body.data.name).toBe('Updated Name');
  });

  it('User can update own email (mixed case) and it is stored normalized', async () => {
    const res = await request(app.getHttpServer())
      .patch('/auth/me')
      .set('Authorization', `Bearer ${normalToken}`)
      .send({ email: 'New_Email@SupportSmiles.com ' })
      .expect(200);

    expect(res.body.data.email).toBe('New_Email@SupportSmiles.com');
  });

  it('Duplicate email rejected with 409 (case-insensitive)', async () => {
    await request(app.getHttpServer())
      .patch('/auth/me')
      .set('Authorization', `Bearer ${normalToken}`)
      .send({ email: 'admin@supportsmiles.com' })
      .expect(409);

    await request(app.getHttpServer())
      .patch('/auth/me')
      .set('Authorization', `Bearer ${normalToken}`)
      .send({ email: 'AdMin@SupportSmiles.Com' })
      .expect(409);
  });

  it('Non-admin cannot update other user (403)', async () => {
    // Normal trying to hit /users/:id
    await request(app.getHttpServer())
      .patch(`/users/${normalUserId}`) // Note target shouldn't matter, route fails
      .set('Authorization', `Bearer ${normalToken}`)
      .send({ name: 'Hack Name' })
      .expect(403);
  });

  it('Admin can update other user', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/users/${normalUserId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Admin Edited Name' })
      .expect(200);

    expect(res.body.name).toBe('Admin Edited Name');
  });
});
