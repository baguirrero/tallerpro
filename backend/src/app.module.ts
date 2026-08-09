import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

import { RolesModule } from './roles/roles.module';
import { UsuariosModule } from './usuarios/usuarios.module';
import { AuthModule } from './auth/auth.module';
import { OrdenesModule } from './ordenes/ordenes.module';
import { TrabajosModule } from './trabajos/trabajos.module';
import { ComentariosModule } from './comentarios/comentarios.module';
import { AdjuntosModule } from './adjuntos/adjuntos.module';
import { SeedModule } from './seed/seed.module';
import { AlmacenamientoModule } from './almacenamiento/almacenamiento.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const url = configService.get<string>('DATABASE_URL');

        if (url) {
          return {
            type: 'postgres' as const,
            url,
            ssl: { rejectUnauthorized: false },
            autoLoadEntities: true,
            synchronize: false,
            migrations: [__dirname + '/migrations/*.js'],
            migrationsRun: true,
          };
        }

        return {
          type: 'postgres' as const,
          host: configService.get<string>('DB_HOST'),
          port: Number(configService.get<string>('DB_PORT')),
          username: configService.get<string>('DB_USER'),
          password: configService.get<string>('DB_PASSWORD'),
          database: configService.get<string>('DB_NAME'),
          autoLoadEntities: true,
          synchronize: false,
          migrations: [__dirname + '/migrations/*.js'],
          migrationsRun: true,
        };
      },
    }),

    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
    }),

    RolesModule,
    UsuariosModule,
    AuthModule,
    OrdenesModule,
    TrabajosModule,
    ComentariosModule,
    AlmacenamientoModule,
    AdjuntosModule,
    SeedModule,
  ],
})
export class AppModule {}
