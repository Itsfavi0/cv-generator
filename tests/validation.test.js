import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createCertification,
  createEducation,
  createEmptyCV,
  createExperience,
  createLanguage,
  createProject,
} from '../src/js/model.js';
import { isValidEmail, isValidLinkedIn, isValidPhone, isValidUrl, validateCV } from '../src/js/validation.js';

function validCV() {
  const cv = createEmptyCV();
  cv.personal.fullName = 'Ana Pérez';
  cv.personal.email = 'ana@example.com';
  return cv;
}

test('isValidEmail', () => {
  assert.ok(isValidEmail('ana@example.com'));
  assert.ok(isValidEmail('  ana.perez+cv@sub.example.com  '));
  assert.ok(!isValidEmail('ana@example'));
  assert.ok(!isValidEmail('ana example.com'));
  assert.ok(!isValidEmail(''));
});

test('isValidPhone acepta formatos comunes y exige 7-15 dígitos', () => {
  assert.ok(isValidPhone('+51 987 654 321'));
  assert.ok(isValidPhone('(01) 555-1234'));
  assert.ok(!isValidPhone('123'));
  assert.ok(!isValidPhone('1234567890123456'));
  assert.ok(!isValidPhone('llámame'));
});

test('isValidUrl', () => {
  assert.ok(isValidUrl('github.com/usuario'));
  assert.ok(isValidUrl('https://example.com'));
  assert.ok(!isValidUrl('localhost'));
  assert.ok(!isValidUrl('javascript:alert(1)'));
  assert.ok(!isValidUrl('no es una url'));
});

test('un CV con nombre y email válidos no tiene errores', () => {
  assert.deepEqual(validateCV(validCV()), {});
});

test('nombre y email son obligatorios', () => {
  const errors = validateCV(createEmptyCV());
  assert.ok(errors['personal.fullName']);
  assert.match(errors['personal.email'], /obligatorio/);
});

test('email, teléfono y web mal escritos generan error', () => {
  const cv = validCV();
  cv.personal.email = 'ana@';
  cv.personal.phone = '12';
  cv.personal.website = 'no es web';
  const errors = validateCV(cv);
  assert.match(errors['personal.email'], /válido/);
  assert.ok(errors['personal.phone']);
  assert.ok(errors['personal.website']);
});

test('experiencia: puesto y empresa obligatorios, fin no anterior al inicio', () => {
  const cv = validCV();
  const job = createExperience({ start: '2023-05', end: '2022-01' });
  cv.experience.push(job);
  const errors = validateCV(cv);
  assert.ok(errors[`experience.${job.id}.role`]);
  assert.ok(errors[`experience.${job.id}.company`]);
  assert.ok(errors[`experience.${job.id}.end`]);
});

test('experiencia actual ignora la fecha de fin', () => {
  const cv = validCV();
  cv.experience.push(createExperience({ role: 'Dev', company: 'ACME', start: '2023-05', end: '2022-01', current: true }));
  assert.deepEqual(validateCV(cv), {});
});

test('educación: título e institución obligatorios y fechas coherentes', () => {
  const cv = validCV();
  const study = createEducation({ start: '2020-03', end: '2019-12' });
  cv.education.push(study);
  const errors = validateCV(cv);
  assert.deepEqual(Object.keys(errors).sort(), [
    `education.${study.id}.degree`,
    `education.${study.id}.end`,
    `education.${study.id}.institution`,
  ]);
});

test('educación en curso ignora la fecha de fin', () => {
  const cv = validCV();
  cv.education.push(createEducation({ degree: 'Ing. de Software', institution: 'UNI', start: '2020-03', end: '2019-12', current: true }));
  assert.deepEqual(validateCV(cv), {});
});

test('certificación: nombre obligatorio y enlace válido si se indica', () => {
  const cv = validCV();
  const cert = createCertification({ url: 'javascript:alert(1)' });
  const ok = createCertification({ name: 'AWS', url: 'credly.com/badges/abc' });
  cv.certifications.push(cert, ok);
  assert.deepEqual(Object.keys(validateCV(cv)).sort(), [`certifications.${cert.id}.name`, `certifications.${cert.id}.url`]);
});

test('idioma: nombre y nivel obligatorios', () => {
  const cv = validCV();
  const lang = createLanguage();
  cv.languages.push(lang, createLanguage({ name: 'Inglés', level: 'b2' }));
  assert.deepEqual(Object.keys(validateCV(cv)).sort(), [`languages.${lang.id}.level`, `languages.${lang.id}.name`]);
});

test('isValidLinkedIn exige un perfil de linkedin.com', () => {
  for (const ok of ['linkedin.com/in/ana', 'https://www.linkedin.com/in/ana-perez/', 'pe.linkedin.com/in/ana']) {
    assert.equal(isValidLinkedIn(ok), true, ok);
  }
  for (const bad of ['linkedin.com', 'github.com/ana', 'notlinkedin.com/in/ana', 'javascript:alert(1)', 'ana']) {
    assert.equal(isValidLinkedIn(bad), false, bad);
  }
});

test('LinkedIn opcional, pero válido si se indica', () => {
  const cv = validCV();
  cv.personal.linkedin = 'github.com/ana';
  assert.deepEqual(Object.keys(validateCV(cv)), ['personal.linkedin']);
  cv.personal.linkedin = 'linkedin.com/in/ana';
  assert.deepEqual(validateCV(cv), {});
});

test('proyecto: nombre obligatorio, enlace válido y fechas coherentes', () => {
  const cv = validCV();
  const project = createProject({ url: 'no es url', start: '2024-05', end: '2024-01' });
  cv.projects.push(project, createProject({ name: 'App', url: 'github.com/a/app' }));
  assert.deepEqual(Object.keys(validateCV(cv)).sort(), [
    `projects.${project.id}.end`,
    `projects.${project.id}.name`,
    `projects.${project.id}.url`,
  ]);
});
