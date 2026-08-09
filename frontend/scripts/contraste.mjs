/*
 * Lee tokens.css y comprueba que cada par fondo/texto llega a AA (4.5:1).
 * Es el único test automático de esta entrega, y existe porque el contraste es
 * lo único del rediseño que se puede afirmar con un número en vez de mirando.
 *
 * Uso:  node scripts/contraste.mjs
 */
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../src/styles/tokens.css', import.meta.url), 'utf8');

/** Los bloques :root y :root[data-tema='oscuro'], por separado. */
function bloque(selector) {
  const i = css.indexOf(selector);
  const desde = css.indexOf('{', i);
  const hasta = css.indexOf('}', desde);
  const vars = {};
  for (const linea of css.slice(desde, hasta).split('\n')) {
    for (const m of linea.matchAll(/(--[a-z0-9-]+):\s*(#[0-9a-fA-F]{6})/g)) {
      vars[m[1]] = m[2];
    }
  }
  return vars;
}

function canal(c) {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
}

function luminancia(hex) {
  const n = hex.slice(1);
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16));
  return 0.2126 * canal(r) + 0.7152 * canal(g) + 0.0722 * canal(b);
}

function razon(a, b) {
  const [x, y] = [luminancia(a), luminancia(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

const PARES = [
  'estado-recibida',
  'estado-cotizada',
  'estado-proceso',
  'estado-espera',
  'estado-finalizada',
  'estado-entregada',
  'estado-cancelada',
  'exito',
  'error',
  'aviso',
];

const MINIMO = 4.5;
let fallos = 0;

for (const [tema, selector] of [
  ['claro', ':root {'],
  ['oscuro', ":root[data-tema='oscuro']"],
]) {
  const v = bloque(selector);
  console.log(`\n── tema ${tema} ──`);

  for (const nombre of PARES) {
    const fondo = v[`--${nombre}-fondo`];
    const texto = v[`--${nombre}-texto`];
    if (!fondo || !texto) {
      console.log(`  ${nombre.padEnd(22)} FALTA un token del par`);
      fallos++;
      continue;
    }
    const r = razon(fondo, texto);
    const ok = r >= MINIMO;
    if (!ok) fallos++;
    console.log(`  ${nombre.padEnd(22)}${r.toFixed(2).padStart(6)}  ${ok ? 'ok' : 'BAJO'}`);
  }

  // El mueble: texto sobre superficie y el primario sobre el acento.
  for (const [nombre, a, b] of [
    ['texto sobre superficie', '--superficie', '--texto-primario'],
    ['texto suave', '--superficie', '--texto-suave'],
    ['botón primario', '--acento', '--acento-texto'],
  ]) {
    const r = razon(v[a], v[b]);
    const ok = r >= MINIMO;
    if (!ok) fallos++;
    console.log(`  ${nombre.padEnd(22)}${r.toFixed(2).padStart(6)}  ${ok ? 'ok' : 'BAJO'}`);
  }
}

if (fallos > 0) {
  console.error(`\n${fallos} par(es) por debajo de ${MINIMO}:1. Corrige tokens.css.`);
  process.exit(1);
}
console.log(`\nTodos los pares superan ${MINIMO}:1 en ambos temas.`);
