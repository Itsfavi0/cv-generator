import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sampleCV } from '../src/js/model.js';
import { clearCV, loadCV, saveCV } from '../src/js/storage.js';

const KEY = 'cv-generator:data:v1';

/** Imitación mínima de localStorage para Node. */
function memoryStorage() {
  const data = new Map();
  return {
    getItem: (key) => (data.has(key) ? data.get(key) : null),
    setItem: (key, value) => data.set(key, String(value)),
    removeItem: (key) => data.delete(key),
    size: () => data.size,
  };
}

const blockedStorage = {
  getItem() {
    throw new Error('SecurityError');
  },
  setItem() {
    throw new Error('QuotaExceededError');
  },
  removeItem() {
    throw new Error('SecurityError');
  },
};

test('guarda y vuelve a cargar el CV', () => {
  const storage = memoryStorage();
  const cv = sampleCV();
  assert.equal(saveCV(cv, storage), true);
  const loaded = loadCV(storage);
  assert.equal(loaded.personal.fullName, cv.personal.fullName);
  assert.equal(loaded.experience.length, cv.experience.length);
});

test('loadCV devuelve null si no hay datos o el JSON está roto', () => {
  const storage = memoryStorage();
  assert.equal(loadCV(storage), null);
  storage.setItem(KEY, '{roto');
  assert.equal(loadCV(storage), null);
});

test('loadCV sanea los datos guardados', () => {
  const storage = memoryStorage();
  storage.setItem(KEY, JSON.stringify({ template: 'otro', skills: 'no-array' }));
  const cv = loadCV(storage);
  assert.equal(cv.template, 'classic');
  assert.deepEqual(cv.skills, []);
});

test('clearCV borra los datos', () => {
  const storage = memoryStorage();
  saveCV(sampleCV(), storage);
  clearCV(storage);
  assert.equal(storage.size(), 0);
});

test('con el almacenamiento bloqueado no lanza errores', () => {
  assert.equal(loadCV(blockedStorage), null);
  assert.equal(saveCV(sampleCV(), blockedStorage), false);
  assert.doesNotThrow(() => clearCV(blockedStorage));
});
