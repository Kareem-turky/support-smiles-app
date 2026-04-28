import { Test, TestingModule } from '@nestjs/testing';
import { AuthModule } from './auth.module';
import { UsersModule } from '../users/users.module';
import { PrismaModule } from '../prisma/prisma.module';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@prisma/client';
import { ConfigModule } from '@nestjs/config';

describe('Auth Security (Service Integration)', () => {
  let usersService: UsersService;
  let authService: AuthService;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        PrismaModule,
        UsersModule,
        AuthModule,
      ],
    }).compile();

    usersService = moduleFixture.get<UsersService>(UsersService);
    authService = moduleFixture.get<AuthService>(AuthService);
    prisma = moduleFixture.get<PrismaService>(PrismaService);
  });

  const testEmail = 'SEC_SERVICE_TEST@EXAMPLE.COM';
  const testPassword = 'Password123!';

  it('should create a user and normalize their email', async () => {
    const normalized = testEmail.toLowerCase();
    await prisma.user.deleteMany({
      where: { email_normalized: normalized },
    });

    const user = await usersService.create({
      name: 'Service Test User',
      email: testEmail,
      password: testPassword,
      role: UserRole.CS_AGENT,
    });

    expect(user.email_normalized).toBe(normalized);
    expect(user.email).toBe(testEmail);
  });

  it('should reject a duplicate user with different casing (409)', async () => {
    await expect(usersService.create({
      name: 'Duplicate User',
      email: testEmail.toLowerCase(),
      password: testPassword,
      role: UserRole.CS_AGENT,
    })).rejects.toThrow(/exists/i);
  });

  it('should login successfully regardless of casing', async () => {
    const result = await authService.login({
      email: 'SeC_SeRvIcE_TeSt@ExAmPlE.CoM',
      password: testPassword,
    });

    expect(result.success).toBe(true);
    expect(result.data.access_token).toBeDefined();
    expect(result.data.user.email).toBe(testEmail);
  });
});
