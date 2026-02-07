import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @Post('login')
    login(@Body() loginDto: LoginDto) {
        return this.authService.login(loginDto);
    }

    @Post('refresh')
    refresh(@Body() refreshTokenDto: RefreshTokenDto) {
        return this.authService.refresh(refreshTokenDto.refresh_token);
    }

    @Post('logout')
    @UseGuards(JwtAuthGuard)
    logout(@Request() req) {
        return this.authService.logout(req.user.id);
    }
}
