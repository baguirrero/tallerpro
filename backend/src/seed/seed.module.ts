import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeedService } from './seed.service';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { Rol } from '../roles/entities/rol.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Usuario, Rol])],
  providers: [SeedService],
})
export class SeedModule {}
