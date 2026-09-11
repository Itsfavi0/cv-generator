import { normalizeCV } from './model.js';

const KEY = 'cv-generator:data:v1';

// El storage se inyecta para poder probar estas funciones en Node sin navegador.
// Todo va en try/catch: en modo privado o con almacenamiento bloqueado, localStorage lanza errores.

export function loadCV(storage = globalThis.localStorage) {
  try {
    const raw = storage?.getItem(KEY);
    return raw ? normalizeCV(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

export function saveCV(cv, storage = globalThis.localStorage) {
  try {
    storage?.setItem(KEY, JSON.stringify(cv));
    return true;
  } catch {
    return false;
  }
}

export function clearCV(storage = globalThis.localStorage) {
  try {
    storage?.removeItem(KEY);
  } catch {
    // Sin almacenamiento disponible no hay nada que borrar.
  }
}
