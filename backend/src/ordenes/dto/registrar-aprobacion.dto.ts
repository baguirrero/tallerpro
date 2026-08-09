import { Type } from 'class-transformer';
import { ArrayNotEmpty, IsArray, IsBoolean, IsUUID, ValidateNested } from 'class-validator';

export class DecisionDto {
  @IsUUID('4', { message: 'El trabajo indicado no es válido' })
  trabajo_id!: string;

  @IsBoolean({ message: 'La decisión debe ser verdadero o falso' })
  aprobado!: boolean;
}

/**
 * Las decisiones van en bloque porque así ocurre en el mostrador: el cliente
 * dice que sí a tres cosas y que no a una, en una sola conversación.
 */
export class RegistrarAprobacionDto {
  @IsArray()
  @ArrayNotEmpty({ message: 'Hay que registrar al menos una decisión' })
  @ValidateNested({ each: true })
  @Type(() => DecisionDto)
  decisiones!: DecisionDto[];
}
