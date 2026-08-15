import { ValidationErrors } from '@angular/forms';

/**
 * Un solo sitio para los mensajes de validación. Antes cada plantilla escribía
 * los suyos —«La placa es obligatoria», «El modelo es obligatorio»— y decía casi
 * lo mismo de nueve maneras.
 *
 * El orden importa: `required` primero, porque cuando un campo está vacío es lo
 * único accionable; decirle a alguien que le faltan caracteres a lo que no
 * escribió es ruido.
 */
export function mensajeDeError(errores: ValidationErrors | null): string | null {
  if (!errores) return null;

  if (errores['required']) return 'Este campo es obligatorio';
  if (errores['minlength']) return `Mínimo ${errores['minlength'].requiredLength} caracteres`;
  if (errores['maxlength']) return `Máximo ${errores['maxlength'].requiredLength} caracteres`;
  if (errores['email']) return 'Correo electrónico no válido';
  // Angular emite `min` y `max` por separado y nunca juntos, así que no hay
  // forma de armar un «entre X e Y» con un solo error a la vista.
  if (errores['min']) return `El valor mínimo es ${errores['min'].min}`;
  if (errores['max']) return `El valor máximo es ${errores['max'].max}`;

  if (Object.keys(errores).length === 0) return null;
  return 'Revise este campo';
}
