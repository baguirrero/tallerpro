import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Adjunto } from './entities/adjunto.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Adjunto])],
  exports: [TypeOrmModule],
})
export class AdjuntosModule {}
