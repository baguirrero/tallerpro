import { Body, Controller, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegistroDto } from './dto/registro.dto';
import { LoginDto } from './dto/login.dto';
import { CambiarPasswordDto } from './dto/cambiar-password.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('registro')
  async registro(@Body() registroDto: RegistroDto) {
    return await this.authService.registro(registroDto);
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return await this.authService.login(loginDto);
  }

  @Patch('cambiar-password')
  @UseGuards(JwtAuthGuard)
  async cambiarPassword(@Body() dto: CambiarPasswordDto, @Req() req: any) {
    return await this.authService.cambiarPassword(req.user.sub, dto);
  }
}
