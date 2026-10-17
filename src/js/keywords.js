// Compara el CV con el texto de una oferta de empleo: qué palabras clave de la oferta
// aparecen en el CV y cuáles faltan. Es una heurística (frecuencia de palabras, sin IA),
// parecida al primer filtro de muchos ATS: buscar los términos del puesto en el CV.

import { SKILL_GROUPS } from './model.js';

// Palabras sin valor como palabra clave: artículos, conectores y el vocabulario
// genérico de cualquier oferta ("buscamos", "requisitos", "experiencia"...).
// Se escriben sin tildes porque se comparan ya normalizadas.
const STOPWORDS = new Set(
  `
  a al algo algun alguna algunas alguno algunos ante antes asi aun cada como con contra cual cuales cuando de del desde
  donde durante e el ella ellas ellos en entre era es esa esas ese eso esos esta estan estar estas este esto estos fue
  ha han hasta hay la las le les lo los mas me mi mis mucho muchos muy nada ni no nos nuestra nuestras nuestro nuestros
  o otra otras otro otros para pero poco por porque que quien quienes se sea ser si sin sobre son su sus tambien tanto
  te tener tiene tienen toda todas todo todos tu tus un una unas uno unos usted ustedes y ya etc via segun
  buscamos busca buscando requisitos requisito requerimos requiere requerido requerida requeridos deseable deseables
  indispensable excluyente valorable valoraremos ofrecemos ofrece beneficios beneficio sueldo salario remuneracion
  oportunidad oportunidades empresa empresas compania lider lideres puesto puestos cargo vacante postula postular
  postulantes candidato candidata candidatos persona personas perfil funciones funcion responsabilidades responsable
  experiencia experiencias anos ano meses minimo minima conocimiento conocimientos manejo nivel niveles capacidad
  habilidad habilidades formacion profesional profesionales trabajo trabajar area areas equipo equipos horario horarios
  lunes viernes sabado modalidad presencial remoto remota hibrido hibrida contrato planilla ley jornada completa
  tiempo inmediata incorporacion importante interesados interesadas enviar cv curriculum correo asunto bachiller
  egresado egresada titulado titulada tecnico universitario universitaria estudios carrera afines afin similares
  similar mejores mejor nuevo nueva nuevos nuevas gran grandes diversos diversas principales principal
  sector rubro semi senior junior trainee practicante practicas basico intermedio avanzado alto alta solido solida
  desarrollar realizar apoyar brindar garantizar asegurar participar mantener crear contar formar parte unete
  capacitacion capacitaciones crecimiento linea carrera ambiente agradable excelente buen buena
  the and for with you your our are will have this that from not but all can job role team work years year
  experience knowledge skills skill required requirements preferred plus strong good ability looking join who what
  `
    .split(/\s+/)
    .filter(Boolean),
);

// Términos de 2 letras que sí son palabras clave habituales en ofertas.
const SHORT_TERMS = new Set(['ui', 'ux', 'qa', 'bi', 'ia', 'ai', 'ml', 'go', 'js', 'ts', 'ci', 'cd', 'rr', 'hh', 'pm']);

const TOKEN_RE = /[\p{L}\p{N}][\p{L}\p{N}+#.]*[\p{L}\p{N}+#]|[\p{L}\p{N}]/gu;

/** Minúsculas y sin tildes: "Gestión" y "gestion" cuentan como la misma palabra. */
function fold(word) {
  return word.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

/**
 * Clave de comparación: sin tildes, sin la "s" del plural ("APIs" = "API") y sin el femenino
 * en "-ora" ("Desarrolladora" = "Desarrollador"), que es como suelen redactarse las ofertas.
 */
function keyOf(word) {
  let key = fold(word);
  if (key.length > 3 && key.endsWith('s') && !key.endsWith('ss')) key = key.slice(0, -1);
  if (key.length > 5 && key.endsWith('ora')) key = key.slice(0, -1);
  return key;
}

function isKeyword(word) {
  const folded = fold(word);
  if (/^\d+$/.test(folded) || STOPWORDS.has(folded)) return false;
  return folded.length >= 3 || SHORT_TERMS.has(folded);
}

/** Palabras de un texto. Conserva términos técnicos como "c#", "c++" o "node.js". */
export function tokenize(text) {
  return (text ?? '').match(TOKEN_RE) ?? [];
}

/**
 * Palabras clave de una oferta, de la más a la menos repetida (a igualdad, por orden de aparición).
 * Devuelve [{ key, word, count }], donde `word` es la forma que aparece primero en la oferta.
 */
export function extractKeywords(text, limit = 30) {
  const found = new Map();
  for (const word of tokenize(text)) {
    if (!isKeyword(word)) continue;
    const key = keyOf(word);
    const entry = found.get(key);
    if (entry) entry.count += 1;
    else found.set(key, { key, word: word.toLowerCase(), count: 1, order: found.size });
  }
  return [...found.values()]
    .sort((a, b) => b.count - a.count || a.order - b.order)
    .slice(0, limit)
    .map(({ key, word, count }) => ({ key, word, count }));
}

/** Todo el texto del CV que lee un ATS, en una sola cadena. */
export function cvText(cv) {
  const parts = [cv.personal.title, cv.summary];
  for (const item of cv.experience) parts.push(item.role, item.company, item.description);
  for (const item of cv.projects) parts.push(item.name, item.technologies, item.description);
  for (const item of cv.education) parts.push(item.degree, item.institution);
  for (const item of cv.certifications) parts.push(item.name, item.issuer);
  for (const item of cv.languages) parts.push(item.name);
  for (const { id } of SKILL_GROUPS) parts.push(...cv.skills[id]);
  return parts.join('\n');
}

/**
 * Resultado de comparar el CV con una oferta: { found, missing, percent }.
 * `found` y `missing` son listas de palabras en el orden de importancia de la oferta.
 */
export function compareWithOffer(cv, offerText) {
  const keywords = extractKeywords(offerText);
  const inCv = new Set(tokenize(cvText(cv)).map(keyOf));
  const found = [];
  const missing = [];
  for (const { key, word } of keywords) (inCv.has(key) ? found : missing).push(word);
  const percent = keywords.length ? Math.round((found.length / keywords.length) * 100) : 0;
  return { found, missing, percent };
}
