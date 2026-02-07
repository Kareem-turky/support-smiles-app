import { Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
        private configService: ConfigService,
    ) { }

    async login(loginDto: LoginDto) {
        console.log('Login attempt for:', loginDto.email);
        const user = await this.prisma.user.findUnique({
            where: { email: loginDto.email },
        });

        if (!user) {
            console.log('User not found');
            throw new UnauthorizedException('Invalid email or password');
        }

        if (!user.is_active) {
            console.log('User inactive');
            throw new ForbiddenException('Account is deactivated');
        }

        const isPasswordValid = await bcrypt.compare(loginDto.password, user.password_hash);
        if (!isPasswordValid) {
            console.log('Invalid password');
            throw new UnauthorizedException('Invalid email or password');
        }

        const payload = { sub: user.id, email: user.email, role: user.role };

        // Create refresh token
        const refreshToken = this.jwtService.sign(payload, {
            secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
            expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRATION') || '7d',
        } as any);

        // Store refresh token
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

        await this.prisma.refreshToken.upsert({
            where: { token: refreshToken }, // Although token likely unique, better to use user_id logic if one token per user, but contract implies multiple? Let's keep it simple.
            // Actually schema has token @unique. 
            // Ideally we might want to invalidate old tokens or just create new.
            // For simplicity let's just create.
            create: {
                token: refreshToken,
                user_id: user.id,
                expires_at: expiresAt,
            },
            update: {
                expires_at: expiresAt
            }
        }).catch(async () => {
            // If collision or other issue, try finding by user_id to update?
            // Schema has id as PK.
            // Let's rely on create for now, or delete old for user.
            await this.prisma.refreshToken.deleteMany({ where: { user_id: user.id } });
            await this.prisma.refreshToken.create({
                data: {
                    token: refreshToken,
                    user_id: user.id,
                    expires_at: expiresAt,
                }
            });
        });


        return {
            success: true,
            data: {
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                },
                access_token: this.jwtService.sign(payload),
                refresh_token: refreshToken,
                expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
            },
        };
    }

    async refresh(refreshToken: string) {
        try {
            const payload = this.jwtService.verify(refreshToken, {
                secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
            });

            const tokenRecord = await this.prisma.refreshToken.findUnique({
                where: { token: refreshToken },
            });

            if (!tokenRecord || tokenRecord.expires_at < new Date()) {
                throw new UnauthorizedException('Invalid or expired refresh token');
            }

            const user = await this.prisma.user.findUnique({
                where: { id: payload.sub },
            });

            if (!user) {
                throw new UnauthorizedException('User not found');
            }

            const newPayload = { sub: user.id, email: user.email, role: user.role };

            return {
                success: true,
                data: {
                    access_token: this.jwtService.sign(newPayload),
                    refresh_token: refreshToken,
                    expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
                },
            };
        } catch (e) {
            throw new UnauthorizedException('Invalid or expired refresh token');
        }
    }

    async logout(userId: string) {
        // Invalidate all refresh tokens for user? Or just specific? 
        // Contract just says POST /auth/logout. Usually clears current session.
        // We will clear all for simplicity or we need the token passed.
        // Assuming we just want to protect future refreshes.
        await this.prisma.refreshToken.deleteMany({ where: { user_id: userId } });
        return { success: true };
    }
}
