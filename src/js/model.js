// Forma de los datos del CV y saneamiento de datos que vienen de fuera (localStorage, JSON importado).

export const TEMPLATES = [
  { id: 'classic', label: 'Clásica' },
  { id: 'modern', label: 'Moderna' },
  { id: 'minimal', label: 'Minimalista' },
  { id: 'executive', label: 'Ejecutiva' },
];

export const DEFAULT_ACCENT = '#2563eb';

// Lista cerrada de niveles: el texto incluye el nivel MCER entre paréntesis para que
// lo entienda tanto un reclutador como un ATS que filtre por "B2" o por "Intermedio".
export const LANGUAGE_LEVELS = [
  { id: 'native', label: 'Nativo' },
  { id: 'c2', label: 'Bilingüe (C2)' },
  { id: 'c1', label: 'Avanzado (C1)' },
  { id: 'b2', label: 'Intermedio alto (B2)' },
  { id: 'b1', label: 'Intermedio (B1)' },
  { id: 'a2', label: 'Básico (A2)' },
  { id: 'a1', label: 'Principiante (A1)' },
];

export const LIMITS = {
  short: 120,
  long: 2000,
  entries: 20,
  skill: 40,
  // Pocas blandas a propósito: un reclutador las cree más si aparecen demostradas en los logros
  // que en una lista larga, y los ATS filtran sobre todo por palabras clave técnicas.
  skills: { technical: 30, soft: 6 },
};

export const SKILL_GROUPS = [
  { id: 'technical', label: 'Técnicas' },
  { id: 'soft', label: 'Blandas' },
];

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

export function createProject(data = {}) {
  return {
    id: uid(),
    name: '',
    url: '',
    technologies: '',
    start: '',
    end: '',
    description: '',
    ...data,
  };
}

export function createCertification(data = {}) {
  return {
    id: uid(),
    name: '',
    issuer: '',
    date: '',
    url: '',
    ...data,
  };
}

export function createLanguage(data = {}) {
  return {
    id: uid(),
    name: '',
    level: '',
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
      linkedin: '',
    },
    summary: '',
    experience: [],
    projects: [],
    education: [],
    certifications: [],
    languages: [],
    skills: { technical: [], soft: [] },
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

  base.projects = list(raw.projects)
    .filter((item) => item && typeof item === 'object')
    .map((item) =>
      createProject({
        name: str(item.name),
        url: str(item.url),
        technologies: str(item.technologies),
        start: month(item.start),
        end: month(item.end),
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

  base.certifications = list(raw.certifications)
    .filter((item) => item && typeof item === 'object')
    .map((item) =>
      createCertification({
        name: str(item.name),
        issuer: str(item.issuer),
        date: month(item.date),
        url: str(item.url),
      }),
    );

  base.languages = list(raw.languages)
    .filter((item) => item && typeof item === 'object')
    .map((item) =>
      createLanguage({
        name: str(item.name),
        level: LANGUAGE_LEVELS.some((l) => l.id === item.level) ? item.level : '',
      }),
    );

  // La v1.0.0 guardaba las habilidades como un solo array: pasan a ser técnicas.
  const rawSkills = Array.isArray(raw.skills) ? { technical: raw.skills } : raw.skills ?? {};
  // Un mismo conjunto para los dos grupos: una habilidad no puede estar en ambos.
  const seen = new Set();
  for (const { id } of SKILL_GROUPS) {
    base.skills[id] = (Array.isArray(rawSkills[id]) ? rawSkills[id] : [])
      .filter((skill) => typeof skill === 'string')
      .map((skill) => skill.trim().slice(0, LIMITS.skill))
      .filter((skill) => {
        const key = skill.toLowerCase();
        if (!skill || seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, LIMITS.skills[id]);
  }

  return base;
}

/**
 * Añade una habilidad al grupo ("technical" o "soft") evitando duplicados en cualquiera
 * de los dos grupos (sin distinguir mayúsculas). Devuelve true si se añadió.
 */
export function addSkill(cv, group, skill) {
  const value = (skill ?? '').trim().slice(0, LIMITS.skill);
  const list = cv.skills[group];
  if (!value || !list || list.length >= LIMITS.skills[group]) return false;
  const all = [...cv.skills.technical, ...cv.skills.soft];
  if (all.some((s) => s.toLowerCase() === value.toLowerCase())) return false;
  list.push(value);
  return true;
}

/** Texto visible de un nivel de idioma ("b2" -> "Intermedio alto (B2)"). */
export function languageLevelLabel(id) {
  return LANGUAGE_LEVELS.find((level) => level.id === id)?.label ?? '';
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
      linkedin: 'linkedin.com/in/valeriaqr',
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
    projects: [
      {
        name: 'Comparador de precios de mercados',
        url: 'github.com/valeriaqr/comparador',
        technologies: 'React, Node.js, PostgreSQL',
        start: '2022-03',
        end: '2022-08',
        description:
          'Web que compara precios de 5 mercados de Lima con datos actualizados cada día\n' +
          'Usada por 300 personas al mes; 98 en Lighthouse de rendimiento',
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
    certifications: [
      { name: 'AWS Certified Cloud Practitioner', issuer: 'Amazon Web Services', date: '2024-05' },
    ],
    languages: [
      { name: 'Español', level: 'native' },
      { name: 'Inglés', level: 'b2' },
    ],
    skills: {
      technical: ['JavaScript', 'React', 'HTML', 'CSS', 'Git', 'SQL', 'Python', 'Accesibilidad web'],
      soft: ['Comunicación', 'Trabajo en equipo', 'Mentoría'],
    },
  });
}
