import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_ACCENT,
  LANGUAGE_LEVELS,
  TEMPLATES,
  addSkill,
  createEmptyCV,
  createExperience,
  languageLevelLabel,
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
  const strip = (items) => items.map(({ id, ...rest }) => rest);
  const withoutIds = (cv) => ({
    ...cv,
    experience: strip(cv.experience),
    education: strip(cv.education),
    certifications: strip(cv.certifications),
    languages: strip(cv.languages),
  });
  assert.deepEqual(withoutIds(restored), withoutIds(original));
});

test('normalizeCV acepta un CV de la v1.0.0, sin certificaciones ni idiomas', () => {
  const cv = normalizeCV({ personal: { fullName: 'Ana' }, skills: ['JS'] });
  assert.deepEqual(cv.certifications, []);
  assert.deepEqual(cv.languages, []);
  assert.equal(cv.personal.fullName, 'Ana');
});

test('normalizeCV sanea certificaciones e idiomas', () => {
  const cv = normalizeCV({
    certifications: [null, { name: 'AWS', issuer: 5, date: '2024-13-01', url: 'credly.com/x', admin: true }],
    languages: ['Inglés', { name: 'Inglés', level: 'experto' }, { name: 'Francés', level: 'b1' }],
  });
  assert.equal(cv.certifications.length, 1);
  assert.equal(cv.certifications[0].name, 'AWS');
  assert.equal(cv.certifications[0].issuer, '');
  assert.equal(cv.certifications[0].date, '');
  assert.equal(cv.certifications[0].url, 'credly.com/x');
  assert.equal('admin' in cv.certifications[0], false);
  assert.ok(cv.certifications[0].id);
  assert.deepEqual(
    cv.languages.map(({ name, level }) => [name, level]),
    [
      ['Inglés', ''],
      ['Francés', 'b1'],
    ],
  );
});

test('normalizeCV limita certificaciones e idiomas a 20', () => {
  const many = Array.from({ length: 50 }, () => ({ name: 'x', level: 'a1' }));
  const cv = normalizeCV({ certifications: many, languages: many });
  assert.equal(cv.certifications.length, 20);
  assert.equal(cv.languages.length, 20);
});

test('languageLevelLabel incluye el nivel MCER y tolera ids desconocidos', () => {
  assert.equal(languageLevelLabel('b2'), 'Intermedio alto (B2)');
  assert.equal(languageLevelLabel('native'), 'Nativo');
  assert.equal(languageLevelLabel('zz'), '');
  assert.equal(new Set(LANGUAGE_LEVELS.map((l) => l.id)).size, LANGUAGE_LEVELS.length);
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
