// Puntaje del CV: cada criterio suma puntos y, si no se cumple, deja un consejo concreto.

const filled = (value) => Boolean((value ?? '').trim());

const CRITERIA = [
  {
    points: 10,
    test: (cv) => filled(cv.personal.fullName) && filled(cv.personal.title),
    tip: 'Añade tu nombre y un título profesional (ej. "Desarrollador Backend").',
  },
  {
    points: 10,
    test: (cv) => filled(cv.personal.email) && filled(cv.personal.phone),
    tip: 'Incluye email y teléfono para que puedan contactarte.',
  },
  {
    points: 5,
    test: (cv) => filled(cv.personal.location) && filled(cv.personal.website),
    tip: 'Agrega tu ciudad y un enlace a tu GitHub o portafolio.',
  },
  {
    points: 15,
    test: (cv) => {
      const length = cv.summary.trim().length;
      return length >= 150 && length <= 600;
    },
    tip: 'Escribe un resumen de 150 a 600 caracteres: quién eres, qué haces y qué buscas.',
  },
  {
    points: 20,
    test: (cv) => cv.experience.length >= 1,
    tip: 'Agrega al menos una experiencia (prácticas y proyectos personales también cuentan).',
  },
  {
    points: 10,
    test: (cv) =>
      cv.experience.length > 0 && cv.experience.every((item) => item.description.trim().length >= 80),
    tip: 'Describe cada experiencia con al menos 80 caracteres de logros concretos.',
  },
  {
    points: 5,
    test: (cv) => cv.experience.some((item) => /\d/.test(item.description)),
    tip: 'Cuantifica tus logros con números (ej. "reduje el tiempo de carga un 40 %").',
  },
  {
    points: 15,
    test: (cv) => cv.education.length >= 1,
    tip: 'Agrega tu formación académica o cursos relevantes.',
  },
  {
    points: 10,
    test: (cv) => cv.skills.length >= 5,
    tip: 'Lista al menos 5 habilidades técnicas.',
  },
];

export const MAX_SCORE = CRITERIA.reduce((sum, c) => sum + c.points, 0);

export function scoreCV(cv) {
  let score = 0;
  const tips = [];
  for (const criterion of CRITERIA) {
    if (criterion.test(cv)) score += criterion.points;
    else tips.push(criterion.tip);
  }
  return { score: Math.round((score / MAX_SCORE) * 100), tips };
}

export function scoreLabel(score) {
  if (score >= 85) return 'Excelente';
  if (score >= 60) return 'Bien encaminado';
  if (score >= 30) return 'Necesita trabajo';
  return 'Recién empezando';
}
