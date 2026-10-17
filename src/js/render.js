// Vista previa del CV. Todas las plantillas comparten la misma estructura HTML;
// el CSS (cv.css) decide cómo se ve cada una. Eso mantiene la lógica en un solo lugar.

import { el } from './utils/dom.js';
import { languageLevelLabel } from './model.js';
import { displayUrl, formatMonth, formatRange, parseDescription, toHref } from './utils/format.js';

function section(title, ...content) {
  return el('section', { class: 'cv__section' }, el('h2', { class: 'cv__section-title' }, title), ...content);
}

function description(text) {
  const parsed = parseDescription(text);
  if (parsed.type === 'list') {
    return el('ul', { class: 'cv__bullets' }, parsed.items.map((item) => el('li', {}, item)));
  }
  if (parsed.type === 'text') {
    return parsed.items.map((line) => el('p', { class: 'cv__text' }, line));
  }
  return null;
}

function contactList(personal) {
  const href = toHref(personal.website);
  const items = [
    personal.email && el('li', {}, el('a', { href: `mailto:${personal.email.trim()}` }, personal.email.trim())),
    personal.phone && el('li', {}, personal.phone),
    personal.location && el('li', {}, personal.location),
    personal.website &&
      el('li', {}, href ? el('a', { href, target: '_blank', rel: 'noopener' }, displayUrl(personal.website)) : personal.website),
  ].filter(Boolean);
  return items.length ? el('ul', { class: 'cv__contact' }, items) : null;
}

function experienceItem(item) {
  const range = formatRange(item.start, item.end, item.current);
  const place = [item.company, item.location].filter((v) => v.trim()).join(' · ');
  return el(
    'article',
    { class: 'cv__entry' },
    el(
      'header',
      { class: 'cv__entry-head' },
      el('h3', { class: 'cv__entry-title' }, item.role || 'Puesto'),
      range && el('span', { class: 'cv__entry-date' }, range),
    ),
    place && el('p', { class: 'cv__entry-sub' }, place),
    description(item.description),
  );
}

function educationItem(item) {
  const range = formatRange(item.start, item.end);
  return el(
    'article',
    { class: 'cv__entry' },
    el(
      'header',
      { class: 'cv__entry-head' },
      el('h3', { class: 'cv__entry-title' }, item.degree || 'Título'),
      range && el('span', { class: 'cv__entry-date' }, range),
    ),
    item.institution && el('p', { class: 'cv__entry-sub' }, item.institution),
  );
}

function certificationItem(item) {
  const href = toHref(item.url);
  const name = item.name || 'Certificación';
  const date = formatMonth(item.date);
  return el(
    'article',
    { class: 'cv__entry' },
    el(
      'header',
      { class: 'cv__entry-head' },
      // El enlace a la credencial va en el propio nombre: así el PDF no muestra una URL larga.
      el('h3', { class: 'cv__entry-title' }, href ? el('a', { href, target: '_blank', rel: 'noopener' }, name) : name),
      date && el('span', { class: 'cv__entry-date' }, date),
    ),
    item.issuer && el('p', { class: 'cv__entry-sub' }, item.issuer),
  );
}

// Un solo nodo de texto y sin estilos mezclados: si el nombre y el nivel van en negrita y normal,
// los extractores de PDF (y algunos ATS) los separan y "Inglés" queda lejos de "Intermedio alto (B2)".
function languageItem(item) {
  const level = languageLevelLabel(item.level);
  return el('li', {}, [item.name || 'Idioma', level].filter(Boolean).join(': '));
}

export function renderCV(cv, container) {
  const { personal } = cv;
  const isEmpty = !personal.fullName.trim();

  const main = el(
    'div',
    { class: 'cv__main' },
    cv.summary.trim() && section('Perfil', description(cv.summary)),
    cv.experience.length > 0 && section('Experiencia', cv.experience.map(experienceItem)),
    cv.education.length > 0 && section('Educación', cv.education.map(educationItem)),
    cv.certifications.length > 0 && section('Certificaciones', cv.certifications.map(certificationItem)),
  );

  const aside = el(
    'aside',
    { class: 'cv__aside' },
    cv.skills.length > 0 &&
      section('Habilidades', el('ul', { class: 'cv__skills' }, cv.skills.map((skill) => el('li', {}, skill)))),
    cv.languages.length > 0 && section('Idiomas', el('ul', { class: 'cv__languages' }, cv.languages.map(languageItem))),
  );

  const article = el(
    'article',
    { class: `cv cv--${cv.template}`, style: `--cv-accent: ${cv.accent}` },
    el(
      'header',
      { class: 'cv__header' },
      el('h1', { class: `cv__name${isEmpty ? ' is-placeholder' : ''}` }, isEmpty ? 'Tu nombre' : personal.fullName),
      personal.title.trim() && el('p', { class: 'cv__title' }, personal.title),
      contactList(personal),
    ),
    el('div', { class: 'cv__body' }, main, aside),
  );

  container.replaceChildren(article);
}
