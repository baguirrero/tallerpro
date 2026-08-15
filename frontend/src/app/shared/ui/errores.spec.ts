import { mensajeDeError } from './errores';

describe('mensajeDeError', () => {
  it('sin errores, no hay mensaje', () => {
    expect(mensajeDeError(null)).toBeNull();
    expect(mensajeDeError({})).toBeNull();
  });

  it('traduce required', () => {
    expect(mensajeDeError({ required: true })).toBe('Este campo es obligatorio');
  });

  it('traduce minlength con el largo que pedía el validador', () => {
    expect(mensajeDeError({ minlength: { requiredLength: 6, actualLength: 2 } })).toBe(
      'Mínimo 6 caracteres',
    );
  });

  it('traduce email', () => {
    expect(mensajeDeError({ email: true })).toBe('Correo electrónico no válido');
  });

  it('min y max son mensajes separados: Angular nunca emite los dos juntos', () => {
    expect(mensajeDeError({ min: { min: 1950, actual: 1900 } })).toBe('El valor mínimo es 1950');
    expect(mensajeDeError({ max: { max: 2100, actual: 3000 } })).toBe('El valor máximo es 2100');
  });

  it('required gana sobre los demás: es el que hay que resolver primero', () => {
    expect(mensajeDeError({ required: true, minlength: { requiredLength: 6 } })).toBe(
      'Este campo es obligatorio',
    );
  });

  it('un error que no conocemos no deja al campo mudo', () => {
    expect(mensajeDeError({ placaDuplicada: true })).toBe('Revise este campo');
  });
});
