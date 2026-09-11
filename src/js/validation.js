import { toHref } from './utils/format.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function isValidEmail(value) {
  return EMAIL_RE.test((value ?? '').trim());
}

/** Acepta +, espacios, guiones y paréntesis; exige entre 7 y 15 dígitos (E.164). */
export function isValidPhone(value) {
  const v = (value ?? '').trim();
  if (!/^\+?[\d\s()-]+$/.test(v)) return false;
  const digits = v.replace(/\D/g, '').length;
  return digits >= 7 && digits <= 15;
}

export function isValidUrl(value) {
  const href = toHref(value);
  if (!href) return false;
  return new URL(href).hostname.includes('.');
}

const blank = (value) => !(value ?? '').trim();

/**
 * Valida el CV completo. Devuelve un objeto { ruta: mensaje }.
 * Las rutas coinciden con los atributos data-error-for del formulario,
 * p. ej. "personal.email" o "experience.<id>.role".
 */
export function validateCV(cv) {
  const errors = {};
  const p = cv.personal;

  if (blank(p.fullName)) errors['personal.fullName'] = 'El nombre es obligatorio.';

  if (blank(p.email)) errors['personal.email'] = 'El email es obligatorio.';
  else if (!isValidEmail(p.email)) errors['personal.email'] = 'Escribe un email válido (ej. nombre@dominio.com).';

  if (!blank(p.phone) && !isValidPhone(p.phone)) {
    errors['personal.phone'] = 'El teléfono debe tener entre 7 y 15 dígitos.';
  }

  if (!blank(p.website) && !isValidUrl(p.website)) {
    errors['personal.website'] = 'Escribe una URL válida (ej. github.com/usuario).';
  }

  for (const item of cv.experience) {
    const key = `experience.${item.id}`;
    if (blank(item.role)) errors[`${key}.role`] = 'Indica el puesto.';
    if (blank(item.company)) errors[`${key}.company`] = 'Indica la empresa.';
    if (!item.current && item.start && item.end && item.end < item.start) {
      errors[`${key}.end`] = 'La fecha de fin no puede ser anterior al inicio.';
    }
  }

  for (const item of cv.education) {
    const key = `education.${item.id}`;
    if (blank(item.degree)) errors[`${key}.degree`] = 'Indica el título o carrera.';
    if (blank(item.institution)) errors[`${key}.institution`] = 'Indica la institución.';
    if (item.start && item.end && item.end < item.start) {
      errors[`${key}.end`] = 'La fecha de fin no puede ser anterior al inicio.';
    }
  }

  return errors;
}
