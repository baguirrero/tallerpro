import { Global, Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { join } from 'path';

import { ALMACENAMIENTO } from './almacenamiento.interface';
import { AlmacenamientoDisco } from './almacenamiento-disco.service';
import { AlmacenamientoS3 } from './almacenamiento-s3.service';

/**
 * Global porque lo consumen AdjuntosModule, TrabajosModule y OrdenesModule,
 * y repetir el import en los tres no aporta nada.
 */
@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: ALMACENAMIENTO,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const logger = new Logger('AlmacenamientoModule');

        if (config.get<string>('STORAGE_DRIVER') === 's3') {
          const faltantes = ['S3_ENDPOINT', 'S3_BUCKET', 'S3_ACCESS_KEY_ID', 'S3_SECRET_ACCESS_KEY']
            .filter((clave) => !config.get<string>(clave));

          if (faltantes.length > 0) {
            throw new Error(
              `STORAGE_DRIVER=s3 pero faltan variables de entorno: ${faltantes.join(', ')}`,
            );
          }

          logger.log('Adjuntos en bucket S3, servidos con URL firmada');
          return new AlmacenamientoS3({
            endpoint: config.get<string>('S3_ENDPOINT')!,
            region: config.get<string>('S3_REGION') ?? 'auto',
            bucket: config.get<string>('S3_BUCKET')!,
            accessKeyId: config.get<string>('S3_ACCESS_KEY_ID')!,
            secretAccessKey: config.get<string>('S3_SECRET_ACCESS_KEY')!,
          });
        }

        logger.log('Adjuntos en disco local (solo desarrollo)');
        // En tiempo de ejecución __dirname es dist/almacenamiento, y uploads/
        // está en la raíz de backend/: la misma ruta que usa ServeStaticModule.
        return new AlmacenamientoDisco(
          join(__dirname, '..', '..', 'uploads'),
          config.get<string>('API_URL') ?? 'http://localhost:3001',
        );
      },
    },
  ],
  exports: [ALMACENAMIENTO],
})
export class AlmacenamientoModule {}
