import { IsEnum } from 'class-validator';
import { EstadoTrabajo } from '../../common/enums/estados.enum';

export class ActualizarEstadoDto {
  @IsEnum(EstadoTrabajo, {
    message: 'El estado debe ser PENDIENTE, EN_PROCESO o COMPLETADO',
  })
  estado!: EstadoTrabajo;
}
