import 'reflect-metadata';
import { config } from 'dotenv';
import { DataSource, DataSourceOptions } from 'typeorm';

config();

const rutas = {
  entities: ['src/**/*.entity.ts'],
  migrations: ['src/migrations/*.ts'],
};

const url = process.env.DATABASE_URL;

const opciones: DataSourceOptions = url
  ? {
      type: 'postgres',
      url,
      ssl: { rejectUnauthorized: false },
      ...rutas,
    }
  : {
      type: 'postgres',
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      ...rutas,
    };

export default new DataSource(opciones);
