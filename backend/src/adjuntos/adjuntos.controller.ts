import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { randomUUID } from 'crypto';

import { AdjuntosService } from './adjuntos.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { NombreRol } from '../common/enums/estados.enum';

@Controller('adjuntos')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdjuntosController {
  constructor(private readonly adjuntosService: AdjuntosService) {}

  @Get('trabajo/:trabajoId')
  async obtenerPorTrabajo(@Param('trabajoId') trabajoId: string) {
    return await this.adjuntosService.obtenerPorTrabajo(trabajoId);
  }

  @Post('trabajo/:trabajoId')
  @UseInterceptors(
    FileInterceptor('archivo', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, callback) => {
          const extension = extname(file.originalname);
          callback(null, `${randomUUID()}${extension}`);
        },
      }),

      fileFilter: (req, file, callback) => {
        const extensionesPermitidas = /\.(jpg|jpeg|png|pdf)$/i;

        if (!extensionesPermitidas.test(file.originalname)) {
          return callback(
            new BadRequestException('Solo se permiten archivos JPG, PNG o PDF'),
            false,
          );
        }
        callback(null, true);
      },

      limits: {
        fileSize: 5 * 1024 * 1024,
      },
    }),
  )
  async subir(
    @Param('trabajoId') trabajoId: string,
    @UploadedFile() archivo: Express.Multer.File,
    @Req() req: any,
  ) {
    if (!archivo) {
      throw new BadRequestException('No se recibió ningún archivo');
    }
    return await this.adjuntosService.guardar(archivo, trabajoId, req.user.sub);
  }

  @Delete(':id')
  @Roles(NombreRol.ADMINISTRADOR, NombreRol.JEFE_TALLER)
  async eliminar(@Param('id') id: string) {
    return await this.adjuntosService.eliminar(id);
  }
}
