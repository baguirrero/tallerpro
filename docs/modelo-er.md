# Modelo Entidad-Relación

## Diagrama

```
VEHICULOS ──< ORDENES

USUARIOS ──┬── usuario_roles ── ROLES        (muchos a muchos)
           │
           ├──< ORDENES (creado_por)
           │       │
           │       └──< TRABAJOS
           │               ├──< COMENTARIOS
           │               └──< ADJUNTOS
           │
           ├──< TRABAJOS (asignado_a, creado_por)
           ├──< COMENTARIOS (usuario_id)
           └──< ADJUNTOS (subido_por)
```

## Relaciones

| Origen | Destino | Tipo | Decorador TypeORM |
|---|---|---|---|
| Usuario | Rol | N:M | `@ManyToMany` + `@JoinTable` |
| Orden | Usuario | N:1 | `@ManyToOne` (creado_por) |
| Orden | Vehiculo | N:1 | `@ManyToOne` con `onDelete: RESTRICT` |
| Trabajo | Orden | N:1 | `@ManyToOne` con `onDelete: CASCADE` |
| Trabajo | Usuario | N:1 | `@ManyToOne` (asignado_a, creado_por) |
| Comentario | Trabajo | N:1 | `@ManyToOne` con `onDelete: CASCADE` |
| Adjunto | Trabajo | N:1 | `@ManyToOne` con `onDelete: CASCADE` |

## Estados

- **Orden:** `RECIBIDA` → `EN_PROCESO` → `FINALIZADA` se **derivan** de los
  trabajos de la orden y no se pueden editar a mano. `ENTREGADA` y `CANCELADA`
  son decisiones humanas, tienen su propio endpoint y son terminales: una vez
  ahí, la orden ya no admite cambios en sus trabajos.
- **Trabajo (columnas del Kanban):** `PENDIENTE` → `EN_PROCESO` → `COMPLETADO`
- **Prioridad:** `BAJA` · `MEDIA` · `ALTA`

## Roles y permisos

| Rol | Órdenes | Trabajos | Comentarios | Adjuntos | Usuarios |
|---|---|---|---|---|---|
| **Administrador** | CRUD completo | CRUD completo | Sí | Sí, puede eliminar | Listar, activar/desactivar |
| **Jefe de Taller** | Crear, editar, ver | Crear, asignar, editar, ver | Sí | Sí, puede eliminar | Ver mecánicos |
| **Asesor de Servicio** | Crear, editar, ver | Ver | Sí | Subir | Ver mecánicos |
| **Mecánico** | Ver | Ver los suyos, cambiar su estado | Sí | Subir | — |

**Regla de negocio principal:** un mecánico solo puede cambiar el estado de un
trabajo que le fue asignado. El administrador y el jefe de taller pueden mover
cualquiera. Se valida en `TrabajosService.actualizarEstado()` y devuelve `403`.

## Script SQL de referencia

Las tablas las crean las migraciones de TypeORM, en `backend/src/migrations/`.
Este script documenta la estructura equivalente:

```sql
CREATE TABLE usuarios (
    id UUID PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    descripcion VARCHAR(250)
);

CREATE TABLE usuario_roles (
    rol_id INTEGER NOT NULL REFERENCES roles(id),
    usuario_id UUID NOT NULL REFERENCES usuarios(id),
    PRIMARY KEY (rol_id, usuario_id)
);

CREATE TABLE vehiculos (
    id UUID PRIMARY KEY,
    placa VARCHAR(10) NOT NULL UNIQUE, -- normalizada: mayúsculas y alfanuméricos
    marca VARCHAR(50) NOT NULL,
    modelo VARCHAR(50) NOT NULL,
    anio INTEGER,
    propietario_nombre VARCHAR(150) NOT NULL,
    propietario_telefono VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE ordenes (
    id UUID PRIMARY KEY,
    numero_orden VARCHAR(20) NOT NULL UNIQUE, -- de la secuencia ordenes_numero_seq
    descripcion TEXT NOT NULL,
    presupuesto NUMERIC(10,2),
    fecha_ingreso DATE NOT NULL,
    fecha_entrega DATE,
    estado VARCHAR(20) NOT NULL DEFAULT 'RECIBIDA',
    vehiculo_id UUID NOT NULL REFERENCES vehiculos(id) ON DELETE RESTRICT,
    creado_por UUID NOT NULL REFERENCES usuarios(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE trabajos (
    id UUID PRIMARY KEY,
    titulo VARCHAR(200) NOT NULL,
    descripcion TEXT,
    prioridad VARCHAR(10) DEFAULT 'MEDIA',
    estado VARCHAR(20) DEFAULT 'PENDIENTE',
    fecha_limite DATE,
    orden_id UUID NOT NULL REFERENCES ordenes(id) ON DELETE CASCADE,
    asignado_a UUID REFERENCES usuarios(id),
    creado_por UUID NOT NULL REFERENCES usuarios(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE comentarios (
    id UUID PRIMARY KEY,
    contenido TEXT NOT NULL,
    trabajo_id UUID NOT NULL REFERENCES trabajos(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES usuarios(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE adjuntos (
    id UUID PRIMARY KEY,
    nombre_original VARCHAR(255) NOT NULL,
    clave VARCHAR(500) NOT NULL,
    tipo_mime VARCHAR(100) NOT NULL,
    tamano INTEGER NOT NULL,
    trabajo_id UUID NOT NULL REFERENCES trabajos(id) ON DELETE CASCADE,
    subido_por UUID NOT NULL REFERENCES usuarios(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Correspondencia con el caso de negocio del curso

Este proyecto aplica el modelo del *Sistema de Gestión de Proyectos
Empresariales* visto en clase a otro dominio:

| Caso del curso | TallerPro |
|---|---|
| `users` / `roles` / `user_roles` | `usuarios` / `roles` / `usuario_roles` |
| `projects` (padre, con presupuesto/fechas/estado) | `ordenes` |
| — (no existía) | `vehiculos`, con la placa como clave natural |
| `tasks` (hija, con responsable/prioridad/estado) | `trabajos` |
| `task_comments` | `comentarios` |
| `attachments` | `adjuntos` |
