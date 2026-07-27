import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { Prioridad } from '../../common/enums/estados.enum';

export class CrearTrabajoDto {
  @IsString()
  @IsNotEmpty({ message: 'El título del trabajo es obligatorio' })
  titulo!: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @IsEnum(Prioridad, { message: 'La prioridad debe ser BAJA, MEDIA o ALTA' })
  prioridad?: Prioridad;

  @IsOptional()
  @IsDateString({}, { message: 'La fecha límite no es válida' })
  fecha_limite?: string;

  @IsUUID('4', { message: 'La orden indicada no es válida' })
  orden_id!: string;

  @IsOptional()
  @IsUUID('4', { message: 'El mecánico indicado no es válido' })
  asignado_a_id?: string;
}
