# TallerPro

Sistema de gestión de órdenes de servicio para un taller mecánico. Proyecto
final de la Especialización en Desarrollo Web Full Stack (Angular, NestJS y
PostgreSQL) del DMC Institute.

## De qué va

En un taller chico las atenciones se anotan en un cuaderno o se coordinan por
WhatsApp, y después nadie sabe en qué quedó cada vehículo ni cuánto trabajo
tiene encima cada mecánico. TallerPro lleva ese control:

- El asesor de servicio registra la orden: escribe la placa y, si el auto ya
  estuvo en el taller, se autocompletan sus datos y los del propietario.
- El jefe de taller la divide en trabajos y se los asigna a los mecánicos.
- El cliente aprueba o rechaza cada trabajo cotizado, y hasta que responde
  nadie puede empezar.
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

Esto levanta PostgreSQL en el puerto `5434`, pgAdmin en http://localhost:5050
—donde entras con `admin@taller.com` y la contraseña `admin123`— y MinIO, un
almacenamiento compatible con S3, cuya consola queda en http://localhost:9001
con usuario y contraseña `minioadmin`. El bucket `tallerpro` se crea solo.

MinIO no hace falta para el día a día: con `STORAGE_DRIVER=disco` los adjuntos
van al sistema de archivos. Está para poder ejercitar en local el mismo driver
que corre en producción, y el `.env.example` trae los cinco valores listos para
copiar.

### 2. Backend

```bash
cd backend
npm install
cp ../.env.example .env
npm run start:dev
```

En el `.env` hacen falta además las variables de almacenamiento. Para desarrollo
basta con `STORAGE_DRIVER=disco` y `API_URL=http://localhost:3001`; las `S3_*`
solo se usan con el driver `s3`.

La API queda en http://localhost:3001. No hace falta crear las tablas a mano:
se generan solas al arrancar y el seed carga los roles y los usuarios de prueba.

### 3. Frontend

```bash
cd frontend
npm install
npm start
```

Y la aplicación en http://localhost:4200.

### Sistema de diseño

- **`/ui`** — catálogo de componentes. Es donde se verifica que las primitivas se ven
  bien en tema claro y oscuro, y la referencia al construir pantallas nuevas.
- **`node scripts/contraste.mjs`** (desde `frontend/`) — comprueba que cada par de
  color de `styles/tokens.css` llega a AA (4.5:1) en los dos temas. Falla con código
  distinto de cero, así que sirve tal cual en un hook o en CI.

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
│       ├── vehiculos/   placa, ficha e historial
│       ├── repuestos/   líneas de repuesto de cada trabajo
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
| MinIO (API) | 9000 |
| MinIO (consola) | 9001 |

Usé el 3001 y el 5434 porque tenía el 3000 y el 5432 ocupados con otros
proyectos. Si a ti no te pasa, los cambias en el `.env` y en el `apiUrl` de
`frontend/src/environments/`.

## Despliegue

La aplicación está publicada en Render, en el plan gratuito:

- Aplicación: https://tallerpro-web-36wx.onrender.com
- API: https://tallerpro-api-19r0.onrender.com

Los tres servicios (base de datos, API y sitio estático) están descritos en
`render.yaml`, así que se recrean conectando el repositorio como Blueprint sin
configurar nada a mano.

Tres cosas que conviene saber del plan gratuito. La primera es que el servicio
se duerme cuando pasa un rato sin tráfico, y la primera visita después tarda
cerca de un minuto en responder. La segunda es que el disco es efímero, y por eso
los adjuntos no se guardan ahí: en producción van a un bucket compatible con S3
y se sirven con URL firmada. Las credenciales (`S3_ENDPOINT`, `S3_BUCKET`,
`S3_ACCESS_KEY_ID` y `S3_SECRET_ACCESS_KEY`) se cargan a mano en el panel de
Render y no se versionan. La tercera es que las bases de datos gratuitas de Render expiran a
los 30 días de creadas.

En producción no se usan los valores del `.env.example`: la conexión a la base
llega en `DATABASE_URL` y el `JWT_SECRET` lo genera Render.

## Notas técnicas

Hay varias cosas del código que no se entienden a simple vista y prefiero
dejarlas escritas.

El esquema se administra con migraciones. `synchronize` está apagado en las dos
configuraciones y `migrationsRun: true` aplica lo pendiente al arrancar, así que
ni en local ni en Render hay que ejecutar nada a mano. Para crear una migración
después de cambiar una entidad:
`npm run migration:generate -- src/migrations/NombreDelCambio`.

El número de orden sale de una secuencia de PostgreSQL, no de contar filas. Las
secuencias son atómicas, así que dos altas simultáneas nunca chocan, pero no se
revierten con la transacción: si una alta falla, ese número queda saltado. Para
órdenes de taller es aceptable; para facturación electrónica no lo sería.

El estado de la orden no se edita: se deriva de sus trabajos. Con todos
pendientes queda `RECIBIDA`, con todos completados pasa a `FINALIZADA`, y
cualquier mezcla es `EN_PROCESO`. La derivación corre dentro de una transacción
que bloquea la fila de la orden, porque sin ese bloqueo dos mecánicos
completando a la vez los dos últimos trabajos dejan la orden mal. `ENTREGADA` y
`CANCELADA` son las excepciones: son decisiones humanas, tienen su propio
endpoint, y una vez ahí la orden ya no admite cambios en sus trabajos.

Los adjuntos no se guardan en el disco del servidor. Van detrás de una interfaz
con dos implementaciones que elige `STORAGE_DRIVER`: disco en desarrollo y un
bucket compatible con S3 en producción. Con el driver S3 la ruta `/uploads` ni
siquiera se monta y cada archivo se sirve con una URL firmada de cinco minutos.

Las columnas `date` están tipadas como `string`, no como `Date`. Al principio
las guardaba como `Date` y las fechas salían un día antes: `new Date('2026-07-27')`
es medianoche UTC y en la zona horaria de Perú eso retrocede al día anterior.

El presupuesto lleva un `transformer` en su columna, y es la misma trampa vista
por otro lado. Las columnas `numeric` de PostgreSQL vuelven del driver como
texto, para no perder precisión, así que la API devolvía `"680.50"` aunque la
entidad lo declarara como `number`. Al editar una orden, el formulario recibía
ese texto y lo reenviaba tal cual si no se retipeaba el campo, y la validación
lo rechazaba por no ser un número. El `transformer` lo convierte al leer.

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

La placa es la identidad del vehículo y se guarda normalizada: mayúsculas y
solo letras y dígitos, así que `ABC-123` queda como `ABC123`. Es una forma
canónica única a costa del guion impreso. Al registrar una orden con una placa
conocida pero datos distintos, la API responde `409` con la lista de diferencias
en lugar de reescribir el histórico del auto; el formulario las muestra y deja
elegir entre actualizar el vehículo o corregir lo escrito.

El presupuesto no es un número que se escriba a mano: cada trabajo lleva su
precio de mano de obra y sus repuestos, y el total de la orden es la suma.
`null` en el precio significa "sin cotizar" y `0` es un precio válido, así que
poner el precio —aunque sea cero— es lo que declara el trabajo cotizado. Por eso
cargar un repuesto en un trabajo sin precio responde `409`: si no, ese dinero no
aparecería en ningún total.

Una orden con trabajos cotizados esperando respuesta está `COTIZADA`, y un
trabajo sin aprobar no se puede mover en el Kanban. Aprobar no es empezar: si
nadie ha movido nada, la orden vuelve a `RECIBIDA` hasta que el mecánico
arranque.

Dos detalles menores: se registra el locale `es-PE` para que los pipes muestren
`S/ 1,250.50` en lugar de `PEN1250.50`, y los archivos subidos se guardan en
`backend/uploads/` con un nombre aleatorio y se publican en la ruta `/uploads`.

## Documentación adicional

- [`docs/modelo-er.md`](docs/modelo-er.md): diagrama entidad-relación y script SQL
- [`docs/endpoints.http`](docs/endpoints.http): colección para probar la API
