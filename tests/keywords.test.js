import { test } from 'node:test';
import assert from 'node:assert/strict';
import { compareWithOffer, cvText, extractKeywords, tokenize } from '../src/js/keywords.js';
import { createEmptyCV, sampleCV } from '../src/js/model.js';

test('tokenize conserva términos técnicos con símbolos', () => {
  assert.deepEqual(tokenize('C#, C++ y Node.js. También .NET!'), ['C#', 'C++', 'y', 'Node.js', 'También', 'NET']);
  assert.deepEqual(tokenize(undefined), []);
});

test('extractKeywords descarta conectores, números y vocabulario genérico de ofertas', () => {
  const words = extractKeywords('Buscamos desarrollador con 3 años de experiencia en React y requisitos de Git').map((k) => k.word);
  assert.deepEqual(words, ['desarrollador', 'react', 'git']);
});

test('extractKeywords ordena por frecuencia y agrupa tildes, mayúsculas y plurales', () => {
  const keywords = extractKeywords('SQL. Gestión de APIs. sql, gestion, API, Docker');
  assert.deepEqual(
    keywords.map(({ word, count }) => [word, count]),
    [
      ['sql', 2],
      ['gestión', 2],
      ['apis', 2],
      ['docker', 1],
    ],
  );
});

test('extractKeywords admite términos cortos conocidos y respeta el límite', () => {
  assert.deepEqual(
    extractKeywords('UX UI QA de la ok').map((k) => k.word),
    ['ux', 'ui', 'qa'],
  );
  const many = Array.from({ length: 50 }, (_, i) => `palabra${i}`).join(' ');
  assert.equal(extractKeywords(many).length, 30);
  assert.equal(extractKeywords(many, 5).length, 5);
});

test('cvText incluye todas las secciones que lee un ATS', () => {
  const text = cvText(sampleCV());
  for (const piece of ['Desarrolladora Frontend', 'Storybook', 'PostgreSQL', 'AWS Certified', 'Inglés', 'Mentoría']) {
    assert.ok(text.includes(piece), piece);
  }
});

test('compareWithOffer separa lo que está en el CV de lo que falta', () => {
  const offer = 'Desarrollador Frontend con React, TypeScript y Docker. Inglés intermedio.';
  const result = compareWithOffer(sampleCV(), offer);
  // "Desarrolladora" en el CV cuenta para "Desarrollador" en la oferta.
  assert.deepEqual(result.found, ['desarrollador', 'frontend', 'react', 'inglés']);
  assert.deepEqual(result.missing, ['typescript', 'docker']);
  assert.equal(result.percent, 67);
});

test('compareWithOffer con oferta vacía o CV vacío', () => {
  assert.deepEqual(compareWithOffer(sampleCV(), ''), { found: [], missing: [], percent: 0 });
  assert.deepEqual(compareWithOffer(createEmptyCV(), 'React'), { found: [], missing: ['react'], percent: 0 });
});
