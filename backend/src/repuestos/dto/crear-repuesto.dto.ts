import { IsInt, IsNotEmpty, IsNumber, IsString, MaxLength, Min } from 'class-validator';

export class CrearRepuestoDto {
  @IsString()
  @IsNotEmpty({ message: 'La descripción del repuesto es obligatoria' })
  @MaxLength(200)
  descripcion!: string;

  @IsInt({ message: 'La cantidad debe ser un número entero' })
  @Min(1, { message: 'La cantidad mínima es 1' })
  cantidad!: number;

  @IsNumber({}, { message: 'El precio unitario debe ser un número' })
  @Min(0, { message: 'El precio unitario no puede ser negativo' })
  precio_unitario!: number;
}
