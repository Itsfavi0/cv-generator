import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createEmptyCV, sampleCV } from '../src/js/model.js';
import { MAX_SCORE, scoreCV, scoreLabel } from '../src/js/score.js';

test('los criterios suman 100 puntos', () => {
  assert.equal(MAX_SCORE, 100);
});

test('un CV vacío puntúa 0 y recibe todos los consejos', () => {
  const { score, tips } = scoreCV(createEmptyCV());
  assert.equal(score, 0);
  assert.equal(tips.length, 9);
});

test('el CV de ejemplo puntúa 100 y no tiene consejos', () => {
  assert.deepEqual(scoreCV(sampleCV()), { score: 100, tips: [] });
});

test('un resumen fuera de 150-600 caracteres no suma', () => {
  const cv = sampleCV();
  cv.summary = 'Corto';
  const { score, tips } = scoreCV(cv);
  assert.equal(score, 85);
  assert.match(tips[0], /resumen/);

  cv.summary = 'x'.repeat(601);
  assert.equal(scoreCV(cv).score, 85);
});

test('descripciones sin números pierden el punto de cuantificar', () => {
  const cv = sampleCV();
  for (const job of cv.experience) job.description = job.description.replace(/\d/g, 'n');
  const { score, tips } = scoreCV(cv);
  assert.equal(score, 95);
  assert.match(tips[0], /números/);
});

test('scoreLabel por tramos', () => {
  assert.equal(scoreLabel(0), 'Recién empezando');
  assert.equal(scoreLabel(30), 'Necesita trabajo');
  assert.equal(scoreLabel(60), 'Bien encaminado');
  assert.equal(scoreLabel(85), 'Excelente');
  assert.equal(scoreLabel(100), 'Excelente');
});
