import { INestApplication } from '@nestjs/common';
import request from 'supertest';

export async function getAuthToken(app: INestApplication, email: string, password = 'password123'): Promise<string> {
    // Note: Password defaults to what we used in seed (admin123, accounting123, cs123)
    // Adjust logic if needed to map email to correct seed password
    let actualPassword = password;
    if (password === 'password123') {
        if (email.includes('admin')) actualPassword = 'admin123';
        if (email.includes('sarah')) actualPassword = 'accounting123';
        if (email.includes('mike')) actualPassword = 'cs123';
    }

    const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email, password: actualPassword })
        .expect(201);

    return response.body.data.access_token;
}
