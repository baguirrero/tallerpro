import { IsEnum, IsNotEmpty, IsString, MaxLength, ValidateIf } from 'class-validator';
import { EstadoTrabajo } from '../../common/enums/estados.enum';

export class ActualizarEstadoDto {
  @IsEnum(EstadoTrabajo, {
    message: 'El estado debe ser PENDIENTE, EN_PROCESO, ESPERANDO_REPUESTO o COMPLETADO',
  })
  estado!: EstadoTrabajo;

  /**
   * Obligatorio al entrar en la espera.
   *
   * La otra mitad de la regla —rechazar el motivo hacia cualquier otro destino—
   * **no se puede escribir acá**, y la trampa no se ve: class-validator no
   * reemplaza la condición de `@ValidateIf`, la acumula, y exige que **todas**
   * den `true` para siquiera validar la propiedad. Un segundo `@ValidateIf` con
   * la condición inversa dejaría las dos sin poder cumplirse a la vez, y el
   * efecto no sería rechazar de más sino apagar esta validación entera, en
   * silencio y también para el caso obligatorio. Ese rechazo vive en el servicio.
   */
  @ValidateIf((dto: ActualizarEstadoDto) => dto.estado === EstadoTrabajo.ESPERANDO_REPUESTO)
  @IsString()
  @IsNotEmpty({ message: 'Indique qué repuesto se está esperando' })
  @MaxLength(200, { message: 'El motivo no puede pasar de 200 caracteres' })
  motivo_espera?: string;
}
