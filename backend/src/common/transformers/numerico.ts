/**
 * Las columnas `numeric` de PostgreSQL vuelven del driver como texto, para no
 * perder precisión. Sin esto la API devuelve "680.50" donde la entidad declara
 * un número, y la validación del formulario lo rechaza al reenviarlo.
 */
export const numerico = {
  to: (valor?: number | null) => valor,
  from: (valor?: string | null) => (valor == null ? valor : Number(valor)),
};
