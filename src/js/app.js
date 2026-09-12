import {
  TEMPLATES,
  addSkill,
  createEducation,
  createEmptyCV,
  createExperience,
  moveItem,
  normalizeCV,
  sampleCV,
} from './model.js';
import { renderCV } from './render.js';
import { scoreCV, scoreLabel } from './score.js';
import { clearCV, loadCV, saveCV } from './storage.js';
import { debounce, el } from './utils/dom.js';
import { slugify } from './utils/format.js';
import { validateCV } from './validation.js';

const $ = (selector, root = document) => root.querySelector(selector);

const form = $('#cv-form');
const preview = $('#cv-preview');
const toastEl = $('#toast');

const FACTORIES = { experience: createExperience, education: createEducation };
const LIST_LABELS = { experience: 'Experiencia', education: 'Educación' };
const THEME_KEY = 'cv-generator:theme';
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
function toast(message, type = 'info') {
  toastEl.textContent = message;
  toastEl.dataset.type = type;
  toastEl.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('is-visible'), 3200);
}

/* ---------- Render ---------- */

let frame = 0;
function schedulePreview() {
  // Agrupa varias pulsaciones en un único render por frame para que la vista previa no se trabe.
  cancelAnimationFrame(frame);
  frame = requestAnimationFrame(() => renderCV(cv, preview));
}

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

function update() {
  errors = validateCV(cv);
  renderErrors();
  renderScore();
  $('#summary-count').textContent = cv.summary.trim().length;
  schedulePreview();
  persist();
}

function buildEntry(listName, item, index, total) {
  const node = $(`#tpl-${listName}`).content.firstElementChild.cloneNode(true);
  node.dataset.id = item.id;
  $('.entry__index', node).textContent = `${LIST_LABELS[listName]} ${index + 1}`;
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
  if (item.current) end.disabled = true;
  return node;
}

function renderEntries(listName) {
  const items = cv[listName];
  $(`#${listName}-list`).replaceChildren(...items.map((item, i) => buildEntry(listName, item, i, items.length)));
}

function renderSkills() {
  $('#skill-list').replaceChildren(
    ...cv.skills.map((skill, i) =>
      el(
        'li',
        { class: 'chip' },
        skill,
        el('button', { type: 'button', class: 'chip__remove', 'aria-label': `Quitar ${skill}`, dataset: { skillIndex: i } }, '×'),
      ),
    ),
  );
}

/** Vuelca todo el estado en el formulario (al cargar, importar o reiniciar). */
function fillForm() {
  for (const input of form.querySelectorAll('[name]')) {
    input.value = getPath(cv, input.name) ?? '';
  }
  renderEntries('experience');
  renderEntries('education');
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
    const item = FACTORIES[listName]();
    cv[listName].push(item);
    renderEntries(listName);
    update();
    $(`.entry[data-id="${item.id}"] input`, form)?.focus();
    return;
  }

  const actionButton = event.target.closest('[data-action]');
  if (actionButton) {
    const entry = actionButton.closest('.entry');
    const listName = entry.parentElement.dataset.list;
    const { id } = entry.dataset;
    const action = actionButton.dataset.action;

    if (action === 'remove') {
      cv[listName] = cv[listName].filter((item) => item.id !== id);
    } else {
      moveItem(cv[listName], id, action === 'up' ? -1 : 1);
    }
    renderEntries(listName);
    update();
    if (action !== 'remove') $(`.entry[data-id="${id}"] [data-action="${action}"]`, form)?.focus();
    return;
  }

  const removeSkill = event.target.closest('[data-skill-index]');
  if (removeSkill) {
    cv.skills.splice(Number(removeSkill.dataset.skillIndex), 1);
    renderSkills();
    update();
    $('#skill-input').focus();
  }
});

/* ---------- Habilidades ---------- */

function commitSkill() {
  const input = $('#skill-input');
  // Permite pegar varias separadas por comas: "React, Node, SQL".
  const added = input.value.split(',').filter((skill) => addSkill(cv, skill)).length;
  if (input.value.trim() && added === 0) toast('Esa habilidad ya está en la lista (máx. 30).');
  input.value = '';
  renderSkills();
  update();
}

$('#skill-input').addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    event.preventDefault();
    commitSkill();
  } else if (event.key === 'Backspace' && !event.target.value && cv.skills.length) {
    cv.skills.pop();
    renderSkills();
    update();
  }
});
$('#btn-add-skill').addEventListener('click', commitSkill);

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

$('#btn-pdf').addEventListener('click', () => {
  showAllErrors = true;
  errors = validateCV(cv);
  renderErrors();

  const firstError = Object.keys(errors)[0];
  if (firstError) {
    toast('Revisa los campos marcados antes de exportar.', 'error');
    $(`[data-error-for="${CSS.escape(firstError)}"]`)?.closest('.field')?.querySelector('input, textarea')?.focus();
    return;
  }

  // El título del documento es el nombre de archivo que propone el diálogo "Guardar como PDF".
  const previousTitle = document.title;
  document.title = `CV-${slugify(cv.personal.fullName) || 'curriculum'}`;
  window.addEventListener('afterprint', () => (document.title = previousTitle), { once: true });
  window.print();
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
