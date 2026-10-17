import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  countPages,
  displayUrl,
  formatMonth,
  formatRange,
  parseBullets,
  parseDescription,
  slugify,
  toHref,
} from '../src/js/utils/format.js';

test('formatMonth convierte AAAA-MM a texto corto en español', () => {
  assert.equal(formatMonth('2024-03'), 'mar 2024');
  assert.equal(formatMonth('2021-12'), 'dic 2021');
});

test('formatMonth devuelve "" con valores inválidos', () => {
  for (const value of ['', null, undefined, '2024-13', '2024-00', '2024/03', 'marzo']) {
    assert.equal(formatMonth(value), '', `valor: ${value}`);
  }
});

test('formatRange combina inicio, fin y "Actualidad"', () => {
  assert.equal(formatRange('2022-01', '2023-06'), 'ene 2022 — jun 2023');
  assert.equal(formatRange('2022-01', '2023-06', true), 'ene 2022 — Actualidad');
  assert.equal(formatRange('2022-01', ''), 'ene 2022');
  assert.equal(formatRange('', '2023-06'), 'jun 2023');
  assert.equal(formatRange('', ''), '');
});

test('toHref añade https:// y solo acepta http/https', () => {
  assert.equal(toHref('github.com/usuario'), 'https://github.com/usuario');
  assert.equal(toHref('http://example.com'), 'http://example.com/');
  assert.equal(toHref('  '), '');
  assert.equal(toHref('javascript:alert(1)'), '');
  assert.equal(toHref('data:text/html,hola'), '');
});

test('displayUrl quita el protocolo y la barra final', () => {
  assert.equal(displayUrl('https://github.com/usuario/'), 'github.com/usuario');
  assert.equal(displayUrl('github.com'), 'github.com');
});

test('parseDescription detecta viñetas, texto y vacío', () => {
  assert.deepEqual(parseDescription('- uno\n* dos\n• tres'), { type: 'list', items: ['uno', 'dos', 'tres'] });
  assert.deepEqual(parseDescription('Línea uno\r\n\r\nLínea dos'), { type: 'text', items: ['Línea uno', 'Línea dos'] });
  assert.deepEqual(parseDescription('   \n  '), { type: 'empty', items: [] });
  assert.deepEqual(parseDescription(undefined), { type: 'empty', items: [] });
});

test('parseBullets: cada línea no vacía es una viñeta, con o sin guion', () => {
  assert.deepEqual(parseBullets('Migré el catálogo\r\n\n- Creé 25 componentes\n* Lideré a 3\n•Automaticé\n  -  '), [
    'Migré el catálogo',
    'Creé 25 componentes',
    'Lideré a 3',
    'Automaticé',
  ]);
  assert.deepEqual(parseBullets(''), []);
  assert.deepEqual(parseBullets(undefined), []);
});

test('slugify quita tildes y símbolos', () => {
  assert.equal(slugify('Favio Brañez Peña'), 'favio-branez-pena');
  assert.equal(slugify('  ¡Hola, Mundo!  '), 'hola-mundo');
  assert.equal(slugify(''), '');
});

test('countPages calcula páginas A4 según el ancho de la hoja', () => {
  const width = 794; // 210 mm a 96 ppp
  const page = (width * 297) / 210; // ≈ 1123 px
  assert.equal(countPages(500, width), 1);
  assert.equal(countPages(page, width), 1);
  assert.equal(countPages(page + 1, width), 1);
  assert.equal(countPages(page + 20, width), 2);
  assert.equal(countPages(page * 2.5, width), 3);
  assert.equal(countPages(0, width), 1);
  assert.equal(countPages(NaN, 0), 1);
});
