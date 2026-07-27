import { IsEnum, IsOptional } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { CrearOrdenDto } from './crear-orden.dto';
import { EstadoOrden } from '../../common/enums/estados.enum';

export class ActualizarOrdenDto extends PartialType(CrearOrdenDto) {
  @IsOptional()
  @IsEnum(EstadoOrden, { message: 'El estado enviado no es válido' })
  estado?: EstadoOrden;
}
