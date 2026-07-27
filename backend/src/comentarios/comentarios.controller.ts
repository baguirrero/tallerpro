import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ComentariosService } from './comentarios.service';
import { CrearComentarioDto } from './dto/crear-comentario.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('comentarios')
@UseGuards(JwtAuthGuard)
export class ComentariosController {
  constructor(private readonly comentariosService: ComentariosService) {}

  @Get('trabajo/:trabajoId')
  async obtenerPorTrabajo(@Param('trabajoId') trabajoId: string) {
    return await this.comentariosService.obtenerPorTrabajo(trabajoId);
  }

  @Post('trabajo/:trabajoId')
  async crear(
    @Param('trabajoId') trabajoId: string,
    @Body() dto: CrearComentarioDto,
    @Req() req: any,
  ) {
    return await this.comentariosService.crear(trabajoId, req.user.sub, dto);
  }
}
