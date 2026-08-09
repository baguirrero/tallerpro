import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CrearOrdenDto {
  @IsString()
  @IsNotEmpty({ message: 'La descripción del servicio es obligatoria' })
  descripcion!: string;

  @IsOptional()
  @IsNumber({}, { message: 'El presupuesto debe ser un número' })
  @Min(0, { message: 'El presupuesto no puede ser negativo' })
  presupuesto?: number;

  @IsDateString({}, { message: 'La fecha de ingreso no es válida' })
  fecha_ingreso!: string;

  @IsOptional()
  @IsDateString({}, { message: 'La fecha de entrega no es válida' })
  fecha_entrega?: string;

  @IsString()
  @IsNotEmpty({ message: 'La placa es obligatoria' })
  placa!: string;

  @IsString()
  @IsNotEmpty({ message: 'La marca es obligatoria' })
  marca!: string;

  @IsString()
  @IsNotEmpty({ message: 'El modelo es obligatorio' })
  modelo!: string;

  @IsOptional()
  @IsInt()
  @Min(1950)
  @Max(2100)
  anio?: number;

  @IsString()
  @IsNotEmpty({ message: 'El nombre del propietario es obligatorio' })
  propietario_nombre!: string;

  @IsString()
  @IsNotEmpty({ message: 'El teléfono del propietario es obligatorio' })
  propietario_telefono!: string;

  // Confirmación explícita para pisar los datos de un vehículo ya registrado.
  // Sin esto, una placa conocida con datos distintos responde 409.
  @IsOptional()
  @IsBoolean({ message: 'actualizar_vehiculo debe ser verdadero o falso' })
  actualizar_vehiculo?: boolean;
}
