import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RegistroDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre de usuario es obligatorio' })
  @MinLength(4, { message: 'El nombre de usuario debe tener al menos 4 caracteres' })
  username!: string;

  @IsEmail({}, { message: 'El correo no tiene un formato válido' })
  email!: string;

  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password!: string;

  @IsString()
  @IsNotEmpty({ message: 'Los nombres son obligatorios' })
  nombres!: string;

  @IsString()
  @IsNotEmpty({ message: 'Los apellidos son obligatorios' })
  apellidos!: string;
}
