import {
  LANGUAGE_LEVELS,
  LIMITS,
  SKILL_GROUPS,
  TEMPLATES,
  addSkill,
  createCertification,
  createEducation,
  createEmptyCV,
  createExperience,
  createLanguage,
  createProject,
  moveItem,
  normalizeCV,
  sampleCV,
} from './model.js';
import { compareWithOffer } from './keywords.js';
import { renderCV } from './render.js';
import { BULLET_RULES, scoreCV, scoreLabel } from './score.js';
import { clearCV, loadCV, saveCV } from './storage.js';
import { debounce, el } from './utils/dom.js';
import { countPages, parseBullets, slugify } from './utils/format.js';
import { validateCV } from './validation.js';

const $ = (selector, root = document) => root.querySelector(selector);

const form = $('#cv-form');
const preview = $('#cv-preview');
const toastEl = $('#toast');

// Secciones con varias entradas. Todas comparten el mismo mecanismo: <template id="tpl-{nombre}">,
// contenedor [data-list] y botón [data-add]. `removed` va aparte por el género ("Idioma eliminado").
const LISTS = {
  experience: { create: createExperience, label: 'Experiencia', removed: 'Experiencia eliminada' },
  projects: { create: createProject, label: 'Proyecto', removed: 'Proyecto eliminado' },
  education: { create: createEducation, label: 'Educación', removed: 'Educación eliminada' },
  certifications: { create: createCertification, label: 'Certificación', removed: 'Certificación eliminada' },
  languages: { create: createLanguage, label: 'Idioma', removed: 'Idioma eliminado' },
};
const THEME_KEY = 'cv-generator:theme';
const OFFER_KEY = 'cv-generator:offer';
const MAX_IMPORT_BYTES = 1_000_000;

let cv = loadCV() ?? createEmptyCV();
let errors = {};
// Los errores solo se muestran en campos que el usuario ya tocó, o en todos al intentar exportar.
const touched = new Set();
let showAllErrors = false;

/* ---------- Utilidades ---------- */

function getPath(obj, path) {
  return path.split('.').reduce((acc, key) => acc?.[key], obj);
}

function setPath(obj, path, value) {
  const keys = path.split('.');
  const last = keys.pop();
  keys.reduce((acc, key) => acc[key], obj)[last] = value;
}

let toastTimer;
/** Muestra un aviso. Con `action` ({ label, onClick }) añade un botón y dura más para dar tiempo a pulsarlo. */
function toast(message, type = 'info', action = null) {
  const hide = () => toastEl.classList.remove('is-visible');
  const onClick = () => {
    hide();
    action.onClick();
  };
  const button = action && el('button', { type: 'button', class: 'toast__action', onClick }, action.label);
  // replaceChildren convierte null en el texto "null", por eso el botón solo se pasa si existe.
  toastEl.replaceChildren(el('span', {}, message), ...(button ? [button] : []));
  toastEl.dataset.type = type;
  toastEl.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(hide, action ? 6000 : 3200);
}

/* ---------- Render ---------- */

let frame = 0;
function schedulePreview() {
  // Agrupa varias pulsaciones en un único render por frame para que la vista previa no se trabe.
  cancelAnimationFrame(frame);
  frame = requestAnimationFrame(() => renderCV(cv, preview));
}

// Norma habitual de RR. HH.: 1 página para perfiles junior y 2 como máximo.
const MAX_PAGES = 2;

const renderPageCount = debounce(() => {
  const measure = $('#cv-measure');
  renderCV(cv, measure);
  const pages = countPages(measure.firstElementChild.offsetHeight, measure.offsetWidth);
  const slot = $('#page-count');
  slot.textContent =
    pages > MAX_PAGES
      ? `Tu CV ocupa unas ${pages} páginas A4. Lo recomendable es 1 (2 como máximo): recorta lo menos relevante para el puesto.`
      : pages === 2
        ? 'Ocupa 2 páginas A4, el máximo recomendable. Si tienes poca experiencia, intenta que quepa en 1.'
        : 'Cabe en 1 página A4.';
  slot.classList.toggle('is-warning', pages > MAX_PAGES);
}, 300);

const renderOffer = debounce(() => {
  const offer = $('#offer-input').value;
  const result = $('#offer-result');
  if (!offer.trim()) {
    result.replaceChildren();
    return;
  }
  const { found, missing, percent } = compareWithOffer(cv, offer);
  const total = found.length + missing.length;
  if (total === 0) {
    result.replaceChildren(el('p', { class: 'field__hint' }, 'No se encontraron palabras clave en ese texto.'));
    return;
  }
  const chips = (words, type) => el('ul', { class: `chips chips--${type}` }, words.map((word) => el('li', { class: 'chip' }, word)));
  result.replaceChildren(
    el('p', { class: 'offer-card__score' }, `Tu CV incluye ${found.length} de ${total} palabras clave (${percent} %).`),
    missing.length > 0 && el('p', { class: 'offer-card__label' }, 'Faltan'),
    missing.length > 0 && chips(missing, 'missing'),
    missing.length > 0 &&
      el('p', { class: 'field__hint' }, 'Añade solo las que de verdad tengas, mejor dentro de tus logros que sueltas en una lista.'),
    found.length > 0 && el('p', { class: 'offer-card__label' }, 'Ya incluye'),
    found.length > 0 && chips(found, 'found'),
  );
}, 250);

const persist = debounce(() => {
  if (!saveCV(cv)) toast('No se pudo guardar en este navegador (almacenamiento bloqueado).', 'error');
}, 400);

function renderErrors() {
  for (const slot of form.querySelectorAll('[data-error-for]')) {
    const key = slot.dataset.errorFor;
    const message = errors[key] && (showAllErrors || touched.has(key)) ? errors[key] : '';
    slot.textContent = message;
    const input = slot.closest('.field')?.querySelector('input, textarea, select');
    if (input) input.setAttribute('aria-invalid', message ? 'true' : 'false');
  }
}

function renderScore() {
  const { score, tips } = scoreCV(cv);
  const meter = $('#score-meter');
  meter.style.setProperty('--score', score);
  meter.setAttribute('aria-valuenow', score);
  meter.dataset.level = score >= 85 ? 'high' : score >= 50 ? 'mid' : 'low';
  $('#score-value').textContent = score;
  $('#score-label').textContent = scoreLabel(score);
  $('#score-tips').replaceChildren(
    ...(tips.length ? tips.slice(0, 3).map((tip) => el('li', {}, tip)) : [el('li', { class: 'is-done' }, '¡Tu CV está completo! 🎉')]),
  );
}

/** Resumen bajo cada "Logros y responsabilidades": cuántas viñetas hay y qué mejorar. Solo orienta. */
function bulletsHint(text) {
  const items = parseBullets(text);
  if (items.length === 0) return { message: 'Cada línea será una viñeta en el CV.', warn: false };
  const parts = [items.length === 1 ? '1 viñeta' : `${items.length} viñetas`];
  if (items.length < BULLET_RULES.min) parts.push(`añade al menos ${BULLET_RULES.min}`);
  const long = items.filter((line) => line.length > BULLET_RULES.maxLength).length;
  if (long) parts.push(`${long} con más de ${BULLET_RULES.maxLength} caracteres`);
  return { message: parts.join(' · '), warn: parts.length > 1 };
}

function renderBulletHints() {
  for (const entry of form.querySelectorAll('.entry:has([data-bullets-hint])')) {
    const item = cv[entry.parentElement.dataset.list].find((i) => i.id === entry.dataset.id);
    const slot = $('[data-bullets-hint]', entry);
    if (!item || !slot) continue;
    const { message, warn } = bulletsHint(item.description);
    slot.textContent = message;
    slot.classList.toggle('is-warning', warn);
  }
}

function update() {
  errors = validateCV(cv);
  renderErrors();
  renderBulletHints();
  renderScore();
  $('#summary-count').textContent = cv.summary.trim().length;
  schedulePreview();
  renderPageCount();
  renderOffer();
  persist();
}

function buildEntry(listName, item, index, total) {
  const node = $(`#tpl-${listName}`).content.firstElementChild.cloneNode(true);
  node.dataset.id = item.id;
  $('.entry__index', node).textContent = `${LISTS[listName].label} ${index + 1}`;
  $('[data-action="up"]', node).disabled = index === 0;
  $('[data-action="down"]', node).disabled = index === total - 1;

  for (const input of node.querySelectorAll('[data-field]')) {
    const value = item[input.dataset.field];
    if (input.type === 'checkbox') input.checked = Boolean(value);
    else input.value = value ?? '';
  }
  for (const slot of node.querySelectorAll('[data-error-field]')) {
    slot.dataset.errorFor = `${listName}.${item.id}.${slot.dataset.errorField}`;
  }
  const end = $('[data-field="end"]', node);
  if (end && item.current) end.disabled = true;
  return node;
}

function renderEntries(listName) {
  const items = cv[listName];
  $(`#${listName}-list`).replaceChildren(...items.map((item, i) => buildEntry(listName, item, i, items.length)));
}

const skillGroupEl = (group) => $(`[data-skill-group="${group}"]`, form);

function renderSkills() {
  for (const { id: group } of SKILL_GROUPS) {
    $('[data-skill-list]', skillGroupEl(group)).replaceChildren(
      ...cv.skills[group].map((skill, i) =>
        el(
          'li',
          { class: 'chip' },
          skill,
          el('button', { type: 'button', class: 'chip__remove', 'aria-label': `Quitar ${skill}`, dataset: { skillIndex: i } }, '×'),
        ),
      ),
    );
  }
}

/** Vuelca todo el estado en el formulario (al cargar, importar o reiniciar). */
function fillForm() {
  for (const input of form.querySelectorAll('[name]')) {
    input.value = getPath(cv, input.name) ?? '';
  }
  for (const listName of Object.keys(LISTS)) renderEntries(listName);
  renderSkills();
  $('#select-template').value = cv.template;
  $('#input-accent').value = cv.accent;
  touched.clear();
  showAllErrors = false;
  update();
}

function replaceCV(next, message) {
  cv = next;
  fillForm();
  if (message) toast(message, 'success');
}

/* ---------- Eventos del formulario ---------- */

form.addEventListener('input', (event) => {
  const target = event.target;

  if (target.name) {
    setPath(cv, target.name, target.value);
  } else if (target.dataset.field) {
    const entry = target.closest('.entry');
    const listName = entry.parentElement.dataset.list;
    const item = cv[listName].find((i) => i.id === entry.dataset.id);
    if (!item) return;
    const field = target.dataset.field;
    item[field] = target.type === 'checkbox' ? target.checked : target.value;
    if (field === 'current') {
      const end = $('[data-field="end"]', entry);
      end.disabled = target.checked;
      if (target.checked) {
        end.value = '';
        item.end = '';
      }
    }
  } else {
    return;
  }
  update();
});

function errorKeyFor(target) {
  if (target.name) return target.name;
  const entry = target.closest('.entry');
  if (!entry || !target.dataset.field) return null;
  return `${entry.parentElement.dataset.list}.${entry.dataset.id}.${target.dataset.field}`;
}

form.addEventListener('focusout', (event) => {
  const key = errorKeyFor(event.target);
  if (key && !touched.has(key)) {
    touched.add(key);
    renderErrors();
  }
});

form.addEventListener('submit', (event) => event.preventDefault());

form.addEventListener('click', (event) => {
  const addButton = event.target.closest('[data-add]');
  if (addButton) {
    const listName = addButton.dataset.add;
    // Mismo tope que normalizeCV: si no, lo que pase de 20 se perdería al recargar.
    if (cv[listName].length >= LIMITS.entries) {
      toast(`Máximo ${LIMITS.entries} entradas por sección.`, 'error');
      return;
    }
    const item = LISTS[listName].create();
    cv[listName].push(item);
    renderEntries(listName);
    update();
    $(`.entry[data-id="${item.id}"] input, .entry[data-id="${item.id}"] select`, form)?.focus();
    return;
  }

  const actionButton = event.target.closest('[data-action]');
  if (actionButton) {
    const entry = actionButton.closest('.entry');
    const listName = entry.parentElement.dataset.list;
    const { id } = entry.dataset;
    const action = actionButton.dataset.action;

    if (action === 'remove') {
      removeEntry(listName, id);
      return;
    }
    moveItem(cv[listName], id, action === 'up' ? -1 : 1);
    renderEntries(listName);
    update();
    $(`.entry[data-id="${id}"] [data-action="${action}"]`, form)?.focus();
    return;
  }

  const skillGroup = event.target.closest('[data-skill-group]');
  if (event.target.closest('[data-skill-add]')) {
    commitSkill(skillGroup.dataset.skillGroup);
    return;
  }
  const removeSkill = event.target.closest('[data-skill-index]');
  if (removeSkill) {
    cv.skills[skillGroup.dataset.skillGroup].splice(Number(removeSkill.dataset.skillIndex), 1);
    renderSkills();
    update();
    $('[data-skill-input]', skillGroup).focus();
  }
});

function removeEntry(listName, id) {
  const owner = cv;
  const index = owner[listName].findIndex((item) => item.id === id);
  if (index < 0) return;
  const [removed] = owner[listName].splice(index, 1);
  renderEntries(listName);
  update();
  // La entrada eliminada ya no existe: el foco pasa al botón "Añadir" de su sección.
  $(`[data-add="${listName}"]`, form).focus();

  toast(LISTS[listName].removed, 'info', {
    label: 'Deshacer',
    onClick() {
      // Si entretanto se cargó otro CV (ejemplo, importar, reiniciar), no hay nada que restaurar.
      if (cv !== owner || cv[listName].length >= LIMITS.entries) return;
      cv[listName].splice(Math.min(index, cv[listName].length), 0, removed);
      renderEntries(listName);
      update();
      $(`.entry[data-id="${removed.id}"] input, .entry[data-id="${removed.id}"] select`, form)?.focus();
    },
  });
}

/* ---------- Habilidades ---------- */

function commitSkill(group) {
  const input = $('[data-skill-input]', skillGroupEl(group));
  // Permite pegar varias separadas por comas: "React, Node, SQL".
  const added = input.value.split(',').filter((skill) => addSkill(cv, group, skill)).length;
  if (input.value.trim() && added === 0) {
    toast(`Esa habilidad ya está en tu CV o llegaste al máximo (${LIMITS.skills[group]}).`);
  }
  input.value = '';
  renderSkills();
  update();
}

form.addEventListener('keydown', (event) => {
  if (!event.target.matches('[data-skill-input]')) return;
  const group = event.target.closest('[data-skill-group]').dataset.skillGroup;
  if (event.key === 'Enter') {
    event.preventDefault();
    commitSkill(group);
  } else if (event.key === 'Backspace' && !event.target.value && cv.skills[group].length) {
    cv.skills[group].pop();
    renderSkills();
    update();
  }
});

/* ---------- Idiomas ---------- */

// Las opciones de nivel salen de model.js para que formulario y saneamiento usen la misma lista.
$('#tpl-languages').content
  .querySelector('[data-field="level"]')
  .append(...LANGUAGE_LEVELS.map((level) => el('option', { value: level.id }, level.label)));

/* ---------- Barra de vista previa ---------- */

const templateSelect = $('#select-template');
templateSelect.append(...TEMPLATES.map((t) => el('option', { value: t.id }, t.label)));
templateSelect.addEventListener('change', () => {
  cv.template = templateSelect.value;
  update();
});

$('#input-accent').addEventListener('input', (event) => {
  cv.accent = event.target.value;
  update();
});

/** Valida y, si no hay errores, abre el diálogo de impresión (desde el botón o con Ctrl+P). */
function printCV() {
  showAllErrors = true;
  errors = validateCV(cv);
  renderErrors();

  const firstError = Object.keys(errors)[0];
  if (firstError) {
    toast('Revisa los campos marcados antes de exportar.', 'error');
    $(`[data-error-for="${CSS.escape(firstError)}"]`)?.closest('.field')?.querySelector('input, textarea, select')?.focus();
    return;
  }

  // El título del documento es el nombre de archivo que propone el diálogo "Guardar como PDF".
  const previousTitle = document.title;
  document.title = `CV-${slugify(cv.personal.fullName) || 'curriculum'}`;
  window.addEventListener('afterprint', () => (document.title = previousTitle), { once: true });
  // Render inmediato: el programado con requestAnimationFrame podría no haber corrido aún.
  cancelAnimationFrame(frame);
  renderCV(cv, preview);
  window.print();
}

$('#btn-pdf').addEventListener('click', printCV);

// Ctrl+P (Cmd+P en Mac) pasa por la misma validación que el botón en vez de imprimir directamente.
document.addEventListener('keydown', (event) => {
  if ((event.ctrlKey || event.metaKey) && !event.altKey && event.key.toLowerCase() === 'p') {
    event.preventDefault();
    printCV();
  }
});

/* ---------- Comparar con una oferta ---------- */

// La oferta se guarda aparte del CV: no forma parte del JSON exportado ni se borra al reiniciar.
try {
  $('#offer-input').value = localStorage.getItem(OFFER_KEY) ?? '';
  if ($('#offer-input').value) $('#offer-card').open = true;
} catch {
  // Sin almacenamiento la comparación funciona igual; solo no se recuerda el texto.
}

$('#offer-input').addEventListener('input', (event) => {
  renderOffer();
  try {
    localStorage.setItem(OFFER_KEY, event.target.value);
  } catch {
    // Igual que arriba: no es crítico.
  }
});

/* ---------- Barra superior ---------- */

$('#btn-sample').addEventListener('click', () => {
  if (cv.personal.fullName.trim() && !confirm('Esto reemplazará tus datos actuales por el ejemplo. ¿Continuar?')) return;
  replaceCV(sampleCV(), 'Ejemplo cargado');
});

$('#btn-reset').addEventListener('click', () => {
  if (!confirm('¿Borrar todos los datos del CV? Esta acción no se puede deshacer.')) return;
  clearCV();
  replaceCV(createEmptyCV(), 'CV reiniciado');
});

$('#btn-export').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(cv, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = el('a', { href: url, download: `cv-${slugify(cv.personal.fullName) || 'datos'}.json` });
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  toast('JSON exportado', 'success');
});

// Un <input type=file> oculto no recibe foco; el botón visible lo abre y así funciona con teclado.
$('#btn-import').addEventListener('click', () => $('#input-import').click());

$('#input-import').addEventListener('change', async (event) => {
  const file = event.target.files?.[0];
  event.target.value = '';
  if (!file) return;
  if (file.size > MAX_IMPORT_BYTES) {
    toast('El archivo es demasiado grande (máx. 1 MB).', 'error');
    return;
  }
  try {
    replaceCV(normalizeCV(JSON.parse(await file.text())), 'Datos importados');
  } catch {
    toast('El archivo no es un JSON válido.', 'error');
  }
});

function currentTheme() {
  return document.documentElement.dataset.theme ?? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
}

$('#btn-theme').addEventListener('click', () => {
  const next = currentTheme() === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = next;
  try {
    localStorage.setItem(THEME_KEY, next);
  } catch {
    // Preferencia no persistida; el tema sigue aplicado en esta visita.
  }
});

fillForm();
