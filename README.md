# TallerPro

Sistema de gestión de órdenes de servicio para un taller mecánico. Proyecto
final de la Especialización en Desarrollo Web Full Stack (Angular, NestJS y
PostgreSQL) del DMC Institute.

## De qué va

En un taller chico las atenciones se anotan en un cuaderno o se coordinan por
WhatsApp, y después nadie sabe en qué quedó cada vehículo ni cuánto trabajo
tiene encima cada mecánico. TallerPro lleva ese control:

- El asesor de servicio registra la orden con los datos del vehículo y del cliente.
- El jefe de taller la divide en trabajos y se los asigna a los mecánicos.
- Cada mecánico mueve sus trabajos por un tablero Kanban.
- Sobre cada trabajo se pueden dejar comentarios y subir archivos.

## Tecnologías

| Capa | Tecnología |
|---|---|
| Frontend | Angular 20 (standalone, signals) + Bootstrap 5 |
| Backend | NestJS 11 + TypeORM |
| Base de datos | PostgreSQL 16 (Docker) |
| Seguridad | JWT + bcrypt + Guards por rol |
| Archivos | Multer con almacenamiento local |

## Requisitos

- Node.js 20 o superior
- Docker Desktop

## Instalación

### 1. Base de datos

```bash
cp .env.example .env
docker compose up -d
```

Esto levanta PostgreSQL en el puerto `5434` y pgAdmin en http://localhost:5050,
donde entras con `admin@taller.com` y la contraseña `admin123`.

### 2. Backend

```bash
cd backend
npm install
cp ../.env.example .env
npm run start:dev
```

La API queda en http://localhost:3001. No hace falta crear las tablas a mano:
se generan solas al arrancar y el seed carga los roles y los usuarios de prueba.

### 3. Frontend

```bash
cd frontend
npm install
npm start
```

Y la aplicación en http://localhost:4200.

## Usuarios de prueba

Todos tienen la contraseña `123456`.

| Correo | Rol | Puede |
|---|---|---|
| `admin@taller.com` | Administrador | Todo, incluido gestionar usuarios |
| `jefe@taller.com` | Jefe de Taller | Órdenes, crear y asignar trabajos |
| `asesor@taller.com` | Asesor de Servicio | Registrar órdenes, comentar |
| `mecanico@taller.com` | Mecánico | Mover sus trabajos, comentar, adjuntar |

## Estructura

```
TallerPro/
├── docker-compose.yml   PostgreSQL + pgAdmin
├── backend/             API REST con NestJS
│   └── src/
│       ├── auth/        login, registro, guards JWT y de roles
│       ├── usuarios/    listado, mecánicos, activar y desactivar
│       ├── roles/       entidad de roles
│       ├── ordenes/     CRUD y estadísticas con QueryBuilder
│       ├── trabajos/    CRUD y cambio de estado del Kanban
│       ├── comentarios/ comentarios sobre los trabajos
│       ├── adjuntos/    subida de archivos con Multer
│       ├── common/      enumeraciones y decorador @Roles
│       └── seed/        carga inicial de roles y usuarios
├── frontend/            Aplicación Angular
│   └── src/app/
│       ├── core/        guards, interceptor, modelos y servicios
│       ├── shared/      navbar, spinner y badge de estado
│       └── features/    auth, dashboard, ordenes, trabajos, usuarios, perfil
└── docs/                Modelo E-R y colección de endpoints
```

## Puertos

| Servicio | Puerto |
|---|---|
| Frontend Angular | 4200 |
| API NestJS | 3001 |
| PostgreSQL | 5434 |
| pgAdmin | 5050 |

Usé el 3001 y el 5434 porque tenía el 3000 y el 5432 ocupados con otros
proyectos. Si a ti no te pasa, los cambias en el `.env` y en el `apiUrl` de
`frontend/src/environments/`.

## Notas técnicas

Hay varias cosas del código que no se entienden a simple vista y prefiero
dejarlas escritas.

TypeORM está con `synchronize: true`, que crea y actualiza las tablas solo. Para
desarrollo va bien; en un proyecto real esto se haría con migraciones.

Las columnas `date` están tipadas como `string`, no como `Date`. Al principio
las guardaba como `Date` y las fechas salían un día antes: `new Date('2026-07-27')`
es medianoche UTC y en la zona horaria de Perú eso retrocede al día anterior.

La validación de los archivos que se suben está en el `fileFilter` de Multer. Lo
intenté primero con `FileTypeValidator` y siempre fallaba, porque necesita el
buffer del archivo y con `diskStorage` este se escribe directo en disco. El
`fileFilter` tiene además la ventaja de rechazar antes de escribir nada.

`JWT_EXPIRES_IN` va en segundos (7200 son 2 horas) porque el tipo de `expiresIn`
en `@nestjs/jwt` no acepta un string cualquiera leído del `.env`.

La conexión a la base no lleva `ssl`. El repositorio del profesor usa
`ssl: { rejectUnauthorized: false }` porque su base está desplegada en la nube,
pero con PostgreSQL en Docker local esa opción impide conectar.

El Kanban se mueve con los botones `◀ ▶` y no arrastrando las tarjetas, porque
el CDK de Angular no entró en el temario del curso.

Dos detalles menores: se registra el locale `es-PE` para que los pipes muestren
`S/ 1,250.50` en lugar de `PEN1250.50`, y los archivos subidos se guardan en
`backend/uploads/` con un nombre aleatorio y se publican en la ruta `/uploads`.

## Documentación adicional

- [`docs/modelo-er.md`](docs/modelo-er.md): diagrama entidad-relación y script SQL
- [`docs/endpoints.http`](docs/endpoints.http): colección para probar la API
