import { PartialType } from '@nestjs/mapped-types';
import { CrearOrdenDto } from './crear-orden.dto';

// `estado` no está aquí a propósito: se mueve con las acciones
// PATCH /ordenes/:id/entregar y /cancelar, que validan la transición.
export class ActualizarOrdenDto extends PartialType(CrearOrdenDto) {}
