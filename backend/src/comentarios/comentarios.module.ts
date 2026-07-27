import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Comentario } from './entities/comentario.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Comentario])],
  exports: [TypeOrmModule],
})
export class ComentariosModule {}
