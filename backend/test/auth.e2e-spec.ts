import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('AuthController (e2e)', () => {
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

    it('/auth/login (POST) - Success', () => {
        return request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: 'admin@company.com', password: 'admin123' })
            .expect(201)
            .expect((res) => {
                expect(res.body.success).toBe(true);
                expect(res.body.data.access_token).toBeDefined();
                expect(res.body.data.user.email).toBe('admin@company.com');
            });
    });

    it('/auth/login (POST) - Failure', () => {
        return request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: 'admin@company.com', password: 'wrongpassword' })
            .expect(401);
    });
});
