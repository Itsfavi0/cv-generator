// Forma de los datos del CV y saneamiento de datos que vienen de fuera (localStorage, JSON importado).

export const TEMPLATES = [
  { id: 'classic', label: 'Clásica' },
  { id: 'modern', label: 'Moderna' },
  { id: 'minimal', label: 'Minimalista' },
];

export const DEFAULT_ACCENT = '#2563eb';

export const LIMITS = {
  short: 120,
  long: 2000,
  entries: 20,
  skills: 30,
};

export function uid() {
  return globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2, 12);
}

export function createExperience(data = {}) {
  return {
    id: uid(),
    role: '',
    company: '',
    location: '',
    start: '',
    end: '',
    current: false,
    description: '',
    ...data,
  };
}

export function createEducation(data = {}) {
  return {
    id: uid(),
    degree: '',
    institution: '',
    start: '',
    end: '',
    ...data,
  };
}

export function createEmptyCV() {
  return {
    template: 'classic',
    accent: DEFAULT_ACCENT,
    personal: {
      fullName: '',
      title: '',
      email: '',
      phone: '',
      location: '',
      website: '',
    },
    summary: '',
    experience: [],
    education: [],
    skills: [],
  };
}

const str = (value, max = LIMITS.short) => (typeof value === 'string' ? value.slice(0, max) : '');
const month = (value) => (typeof value === 'string' && /^\d{4}-\d{2}$/.test(value) ? value : '');
const list = (value) => (Array.isArray(value) ? value.slice(0, LIMITS.entries) : []);

/**
 * Devuelve siempre un CV con la forma correcta, sin importar lo que llegue.
 * Ignora campos desconocidos, recorta textos largos y descarta tipos incorrectos.
 */
export function normalizeCV(raw) {
  const base = createEmptyCV();
  if (!raw || typeof raw !== 'object') return base;

  const personal = raw.personal && typeof raw.personal === 'object' ? raw.personal : {};
  for (const key of Object.keys(base.personal)) {
    base.personal[key] = str(personal[key]);
  }

  base.template = TEMPLATES.some((t) => t.id === raw.template) ? raw.template : base.template;
  base.accent = typeof raw.accent === 'string' && /^#[0-9a-f]{6}$/i.test(raw.accent) ? raw.accent : DEFAULT_ACCENT;
  base.summary = str(raw.summary, LIMITS.long);

  base.experience = list(raw.experience)
    .filter((item) => item && typeof item === 'object')
    .map((item) =>
      createExperience({
        role: str(item.role),
        company: str(item.company),
        location: str(item.location),
        start: month(item.start),
        end: month(item.end),
        current: item.current === true,
        description: str(item.description, LIMITS.long),
      }),
    );

  base.education = list(raw.education)
    .filter((item) => item && typeof item === 'object')
    .map((item) =>
      createEducation({
        degree: str(item.degree),
        institution: str(item.institution),
        start: month(item.start),
        end: month(item.end),
      }),
    );

  const seen = new Set();
  base.skills = (Array.isArray(raw.skills) ? raw.skills : [])
    .filter((skill) => typeof skill === 'string')
    .map((skill) => skill.trim().slice(0, 40))
    .filter((skill) => {
      const key = skill.toLowerCase();
      if (!skill || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, LIMITS.skills);

  return base;
}

/** Añade una habilidad evitando duplicados (sin distinguir mayúsculas). Devuelve true si se añadió. */
export function addSkill(cv, skill) {
  const value = (skill ?? '').trim().slice(0, 40);
  if (!value || cv.skills.length >= LIMITS.skills) return false;
  if (cv.skills.some((s) => s.toLowerCase() === value.toLowerCase())) return false;
  cv.skills.push(value);
  return true;
}

/** Mueve un elemento de una lista hacia arriba (-1) o abajo (+1). */
export function moveItem(items, id, direction) {
  const index = items.findIndex((item) => item.id === id);
  const target = index + direction;
  if (index < 0 || target < 0 || target >= items.length) return false;
  [items[index], items[target]] = [items[target], items[index]];
  return true;
}

export function sampleCV() {
  return normalizeCV({
    template: 'modern',
    accent: '#0f766e',
    personal: {
      fullName: 'Valeria Quispe Rojas',
      title: 'Desarrolladora Frontend',
      email: 'valeria.quispe@example.com',
      phone: '+51 987 654 321',
      location: 'Lima, Perú',
      website: 'github.com/valeriaqr',
    },
    summary:
      'Desarrolladora frontend con 3 años de experiencia construyendo interfaces accesibles y rápidas con React. ' +
      'Me interesa el rendimiento web, el diseño de sistemas de componentes y escribir código que otros puedan mantener.',
    experience: [
      {
        role: 'Desarrolladora Frontend',
        company: 'Tienda Andina',
        location: 'Lima',
        start: '2023-02',
        current: true,
        description:
          '- Migré el catálogo a React y reduje el tiempo de carga en un 40 %\n' +
          '- Creé una librería de 25 componentes reutilizables con Storybook\n' +
          '- Mentoreé a 2 practicantes en buenas prácticas de Git y testing',
      },
      {
        role: 'Desarrolladora Web Junior',
        company: 'Agencia Pixel',
        location: 'Remoto',
        start: '2021-06',
        end: '2023-01',
        description:
          '- Desarrollé 12 landing pages responsivas para clientes de retail\n' +
          '- Automaticé el despliegue con GitHub Actions',
      },
    ],
    education: [
      {
        degree: 'Ingeniería de Sistemas',
        institution: 'Universidad Nacional del Callao',
        start: '2017-03',
        end: '2022-12',
      },
    ],
    skills: ['JavaScript', 'React', 'HTML', 'CSS', 'Git', 'SQL', 'Python', 'Accesibilidad web'],
  });
}
