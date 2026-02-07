import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { getAuthToken } from './utils';

describe('UsersController (e2e)', () => {
    let app: INestApplication;
    let adminToken: string;
    let userToken: string;
    let userId: string;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        await app.init();

        adminToken = await getAuthToken(app, 'admin@company.com');
        userToken = await getAuthToken(app, 'sarah@company.com'); // Accounting user
    });

    afterAll(async () => {
        await app.close();
    });

    it('/users (GET) - Admin can list users', () => {
        return request(app.getHttpServer())
            .get('/users')
            .set('Authorization', `Bearer ${adminToken}`)
            .expect(200)
            .expect((res) => {
                expect(Array.isArray(res.body)).toBe(true);
                expect(res.body.length).toBeGreaterThan(0);
                userId = res.body[0].id; // Save an ID for later
            });
    });

    it('/users (GET) - Non-admin cannot list users', () => {
        return request(app.getHttpServer())
            .get('/users')
            .set('Authorization', `Bearer ${userToken}`)
            .expect(403);
    });
});
