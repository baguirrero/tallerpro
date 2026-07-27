import { PartialType } from '@nestjs/mapped-types';
import { CrearTrabajoDto } from './crear-trabajo.dto';

export class ActualizarTrabajoDto extends PartialType(CrearTrabajoDto) {}
