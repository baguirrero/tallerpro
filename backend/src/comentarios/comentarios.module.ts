import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Comentario } from './entities/comentario.entity';
import { ComentariosService } from './comentarios.service';
import { ComentariosController } from './comentarios.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Comentario])],
  providers: [ComentariosService],
  controllers: [ComentariosController],
  exports: [TypeOrmModule],
})
export class ComentariosModule {}
