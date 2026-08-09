import {
  IsDateString,
  IsNumber,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
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

  @IsOptional()
  @IsNumber({}, { message: 'El precio de mano de obra debe ser un número' })
  @Min(0, { message: 'El precio de mano de obra no puede ser negativo' })
  precio_mano_obra?: number;

  @IsUUID('4', { message: 'La orden indicada no es válida' })
  orden_id!: string;

  @IsOptional()
  @IsUUID('4', { message: 'El mecánico indicado no es válido' })
  asignado_a_id?: string;
}
