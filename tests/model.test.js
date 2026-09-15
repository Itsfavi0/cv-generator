import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_ACCENT,
  TEMPLATES,
  addSkill,
  createEmptyCV,
  createExperience,
  moveItem,
  normalizeCV,
  sampleCV,
} from '../src/js/model.js';

test('normalizeCV devuelve un CV vacío con entradas inválidas', () => {
  for (const raw of [null, undefined, 42, 'texto', []]) {
    assert.deepEqual(normalizeCV(raw), createEmptyCV());
  }
});

test('normalizeCV descarta tipos incorrectos, campos desconocidos y valores no permitidos', () => {
  const cv = normalizeCV({
    template: 'hacker',
    accent: 'red',
    personal: { fullName: 123, email: 'a@example.com', isAdmin: true },
    summary: { html: '<b>x</b>' },
    experience: [null, 'texto', { role: 'Dev', start: '2024-1', end: '2024-02', current: 'sí' }],
    education: 'nada',
    skills: ['JS', 'js', 5, '  ', 'CSS'],
    extra: 'ignorado',
  });
  assert.equal(cv.template, 'classic');
  assert.equal(cv.accent, DEFAULT_ACCENT);
  assert.equal(cv.personal.fullName, '');
  assert.equal(cv.personal.email, 'a@example.com');
  assert.equal('isAdmin' in cv.personal, false);
  assert.equal(cv.summary, '');
  assert.equal(cv.experience.length, 1);
  assert.equal(cv.experience[0].start, '');
  assert.equal(cv.experience[0].end, '2024-02');
  assert.equal(cv.experience[0].current, false);
  assert.ok(cv.experience[0].id);
  assert.deepEqual(cv.education, []);
  assert.deepEqual(cv.skills, ['JS', 'CSS']);
  assert.equal('extra' in cv, false);
});

test('normalizeCV recorta textos largos y limita listas', () => {
  const cv = normalizeCV({
    personal: { fullName: 'a'.repeat(500) },
    summary: 'b'.repeat(5000),
    experience: Array.from({ length: 50 }, () => ({ role: 'Dev' })),
    skills: Array.from({ length: 50 }, (_, i) => `skill-${i}`),
  });
  assert.equal(cv.personal.fullName.length, 120);
  assert.equal(cv.summary.length, 2000);
  assert.equal(cv.experience.length, 20);
  assert.equal(cv.skills.length, 30);
});

test('normalizeCV acepta todas las plantillas de TEMPLATES', () => {
  for (const { id } of TEMPLATES) {
    assert.equal(normalizeCV({ template: id }).template, id);
  }
  assert.ok(TEMPLATES.some((t) => t.id === 'executive'));
});

test('normalizeCV conserva un CV válido (ida y vuelta por JSON)', () => {
  const original = sampleCV();
  const restored = normalizeCV(JSON.parse(JSON.stringify(original)));
  const withoutIds = (cv) => ({
    ...cv,
    experience: cv.experience.map(({ id, ...rest }) => rest),
    education: cv.education.map(({ id, ...rest }) => rest),
  });
  assert.deepEqual(withoutIds(restored), withoutIds(original));
});

test('addSkill evita vacíos y duplicados sin distinguir mayúsculas', () => {
  const cv = createEmptyCV();
  assert.equal(addSkill(cv, ' React '), true);
  assert.equal(addSkill(cv, 'react'), false);
  assert.equal(addSkill(cv, '   '), false);
  assert.equal(addSkill(cv, undefined), false);
  assert.deepEqual(cv.skills, ['React']);
});

test('addSkill respeta el máximo de 30', () => {
  const cv = createEmptyCV();
  for (let i = 0; i < 30; i++) addSkill(cv, `s${i}`);
  assert.equal(addSkill(cv, 'una más'), false);
  assert.equal(cv.skills.length, 30);
});

test('moveItem sube y baja sin salirse de los límites', () => {
  const items = ['a', 'b', 'c'].map((role) => createExperience({ role }));
  const roles = () => items.map((item) => item.role).join('');
  assert.equal(moveItem(items, items[2].id, -1), true);
  assert.equal(roles(), 'acb');
  assert.equal(moveItem(items, items[0].id, -1), false);
  assert.equal(moveItem(items, items[2].id, 1), false);
  assert.equal(moveItem(items, 'no-existe', 1), false);
  assert.equal(roles(), 'acb');
});

test('cada entrada recibe un id único', () => {
  const ids = new Set(Array.from({ length: 100 }, () => createExperience().id));
  assert.equal(ids.size, 100);
});
