import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CrearTrabajoDto } from './crear-trabajo.dto';

// Sin `orden_id`: un trabajo que se mudara de orden dejaría mal derivado
// el estado de las dos.
export class ActualizarTrabajoDto extends PartialType(
  OmitType(CrearTrabajoDto, ['orden_id'] as const),
) {}
