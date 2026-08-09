import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';
import { extname } from 'path';
import { AlmacenamientoArchivos, ArchivoEntrante } from './almacenamiento.interface';

const VIGENCIA_URL_SEGUNDOS = 300;

export interface ConfiguracionS3 {
  endpoint: string;
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
}

/**
 * Driver de producción. El `endpoint` explícito es lo que permite apuntar a
 * Cloudflare R2, Supabase Storage o MinIO sin cambiar una línea de código.
 */
export class AlmacenamientoS3 implements AlmacenamientoArchivos {
  private readonly cliente: S3Client;

  constructor(private readonly config: ConfiguracionS3) {
    this.cliente = new S3Client({
      endpoint: config.endpoint,
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
      // R2, Supabase y MinIO exponen el bucket como parte de la ruta y no
      // como subdominio. S3 lo acepta igual.
      forcePathStyle: true,
    });
  }

  async guardar({ buffer, nombreOriginal, mime }: ArchivoEntrante): Promise<{ clave: string }> {
    const clave = `${randomUUID()}${extname(nombreOriginal)}`;

    await this.cliente.send(
      new PutObjectCommand({
        Bucket: this.config.bucket,
        Key: clave,
        Body: buffer,
        ContentType: mime,
      }),
    );

    return { clave };
  }

  async eliminar(clave: string): Promise<void> {
    await this.cliente.send(new DeleteObjectCommand({ Bucket: this.config.bucket, Key: clave }));
  }

  /**
   * URL firmada con cinco minutos de vida. Firmar es un cálculo local del SDK,
   * sin viaje al bucket, así que resolverla por adjunto en un listado es barato.
   */
  async obtenerUrl(clave: string): Promise<string> {
    return await getSignedUrl(
      this.cliente,
      new GetObjectCommand({ Bucket: this.config.bucket, Key: clave }),
      { expiresIn: VIGENCIA_URL_SEGUNDOS },
    );
  }
}
