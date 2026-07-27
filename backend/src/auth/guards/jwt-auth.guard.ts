import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extraerToken(request);

    if (!token) {
      throw new UnauthorizedException('No se envió el token de acceso');
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });
      request['user'] = payload;
      return true;
    } catch {
      throw new UnauthorizedException('El token es inválido o expiró');
    }
  }

  private extraerToken(request: any): string | null {
    const [tipo, token] = request.headers['authorization']?.split(' ') ?? [];
    return tipo === 'Bearer' ? token : null;
  }
}
