import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { getAuthToken } from './utils';
import { Priority, IssueType, TicketStatus } from '@prisma/client';

describe('TicketsController (e2e)', () => {
    let app: INestApplication;
    let adminToken: string;
    let accountingToken: string;
    let csToken: string;
    let ticketId: string;
    let csUserId: string;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
        await app.init();

        adminToken = await getAuthToken(app, 'admin@company.com');
        accountingToken = await getAuthToken(app, 'sarah@company.com');
        csToken = await getAuthToken(app, 'mike@company.com');

        // Get CS User ID for assignment test
        const adminRes = await request(app.getHttpServer())
            .get('/users')
            .set('Authorization', `Bearer ${adminToken}`);
        const csUser = adminRes.body.find((u: any) => u.email === 'mike@company.com');
        csUserId = csUser.id;
    });

    afterAll(async () => {
        await app.close();
    });

    it('/tickets (POST) - Accounting can create ticket', () => {
        return request(app.getHttpServer())
            .post('/tickets')
            .set('Authorization', `Bearer ${accountingToken}`)
            .send({
                order_number: 'TEST-ORD-001',
                courier_company: 'DHL',
                issue_type: IssueType.DELIVERY,
                priority: Priority.MEDIUM,
                description: 'Test ticket description'
            })
            .expect(201)
            .expect((res) => {
                expect(res.body.id).toBeDefined();
                expect(res.body.order_number).toBe('TEST-ORD-001');
                ticketId = res.body.id;
            });
    });

    it('/tickets (POST) - CS cannot create ticket', () => {
        return request(app.getHttpServer())
            .post('/tickets')
            .set('Authorization', `Bearer ${csToken}`)
            .send({
                order_number: 'TEST-ORD-002',
                courier_company: 'DHL',
                issue_type: IssueType.DELIVERY,
                priority: Priority.MEDIUM,
                description: 'Should fail'
            })
            .expect(403);
    });

    it('/tickets (GET) - Admin sees all tickets', () => {
        return request(app.getHttpServer())
            .get('/tickets')
            .set('Authorization', `Bearer ${adminToken}`)
            .expect(200)
            .expect((res) => {
                expect(Array.isArray(res.body)).toBe(true);
                expect(res.body.length).toBeGreaterThan(0);
            });
    });

    it('/tickets/:id/assign (POST) - Admin can assign ticket', () => {
        return request(app.getHttpServer())
            .post(`/tickets/${ticketId}/assign`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ assigned_to: csUserId })
            .expect(201)
            .expect((res) => {
                expect(res.body.assigned_to).toBe(csUserId);
                expect(res.body.status).toBe(TicketStatus.ASSIGNED);
            });
    });

    it('/tickets/:id/status (PATCH) - CS can update status of assigned ticket', () => {
        return request(app.getHttpServer())
            .patch(`/tickets/${ticketId}/status`)
            .set('Authorization', `Bearer ${csToken}`)
            .send({ status: TicketStatus.IN_PROGRESS })
            .expect(200)
            .expect((res) => {
                expect(res.body.status).toBe(TicketStatus.IN_PROGRESS);
            });
    });
});
