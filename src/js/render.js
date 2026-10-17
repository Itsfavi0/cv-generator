// Vista previa del CV. Todas las plantillas comparten la misma estructura HTML;
// el CSS (cv.css) decide cómo se ve cada una. Eso mantiene la lógica en un solo lugar.

import { el } from './utils/dom.js';
import { SKILL_GROUPS, languageLevelLabel } from './model.js';
import { displayUrl, formatMonth, formatRange, parseBullets, parseDescription, toHref } from './utils/format.js';

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

function bullets(text) {
  const items = parseBullets(text);
  return items.length ? el('ul', { class: 'cv__bullets' }, items.map((item) => el('li', {}, item))) : null;
}

// Se muestra la URL sin protocolo ("linkedin.com/in/usuario"): es texto que un ATS lee y que
// un reclutador puede escribir si imprime el CV; en el PDF además es un enlace.
function link(url) {
  const href = toHref(url);
  return el('li', {}, href ? el('a', { href, target: '_blank', rel: 'noopener' }, displayUrl(url)) : url);
}

function contactList(personal) {
  const items = [
    personal.email && el('li', {}, el('a', { href: `mailto:${personal.email.trim()}` }, personal.email.trim())),
    personal.phone && el('li', {}, personal.phone),
    personal.location && el('li', {}, personal.location),
    personal.linkedin.trim() && link(personal.linkedin),
    personal.website.trim() && link(personal.website),
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
    bullets(item.description),
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

// Con un solo grupo se muestra la lista sola, como antes; con los dos, cada uno con su subtítulo
// en texto ("Técnicas", "Blandas"), que un ATS lee igual que cualquier otra línea.
function skillsSection(skills) {
  const groups = SKILL_GROUPS.filter(({ id }) => skills[id].length > 0);
  if (groups.length === 0) return null;
  const list = (items) => el('ul', { class: 'cv__skills' }, items.map((skill) => el('li', {}, skill)));
  if (groups.length === 1) return section('Habilidades', list(skills[groups[0].id]));
  return section(
    'Habilidades',
    groups.map(({ id, label }) =>
      el('div', { class: 'cv__skill-group' }, el('h3', { class: 'cv__subsection-title' }, label), list(skills[id])),
    ),
  );
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
    skillsSection(cv.skills),
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
