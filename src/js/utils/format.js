const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

/** "2024-03" -> "mar 2024". Devuelve "" si el valor no tiene formato AAAA-MM. */
export function formatMonth(value) {
  const match = /^(\d{4})-(\d{2})$/.exec(value ?? '');
  if (!match) return '';
  const index = Number(match[2]) - 1;
  if (index < 0 || index > 11) return '';
  return `${MONTHS[index]} ${match[1]}`;
}

/** Rango de fechas legible: "ene 2022 — Actualidad". */
export function formatRange(start, end, current = false) {
  const from = formatMonth(start);
  const to = current ? 'Actualidad' : formatMonth(end);
  if (from && to) return `${from} — ${to}`;
  return from || to;
}

/** Normaliza una URL escrita por el usuario a un href seguro (solo http/https). */
export function toHref(url) {
  const value = (url ?? '').trim();
  if (!value) return '';
  const withProtocol = /^[a-z][a-z\d+.-]*:/i.test(value) ? value : `https://${value}`;
  try {
    const parsed = new URL(withProtocol);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? parsed.href : '';
  } catch {
    return '';
  }
}

/** Texto visible de una URL sin protocolo ni barra final. */
export function displayUrl(url) {
  return (url ?? '').trim().replace(/^https?:\/\//i, '').replace(/\/$/, '');
}

/**
 * Convierte una descripción en lista si sus líneas empiezan con "-", "*" o "•".
 * Así el usuario escribe viñetas de forma natural en un textarea.
 */
export function parseDescription(text) {
  const lines = (text ?? '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length === 0) return { type: 'empty', items: [] };

  const bullet = /^[-*•]\s*/;
  if (lines.some((line) => bullet.test(line))) {
    return { type: 'list', items: lines.map((line) => line.replace(bullet, '')).filter(Boolean) };
  }
  return { type: 'text', items: lines };
}

/** Nombre de archivo seguro a partir del nombre de la persona. */
export function slugify(text) {
  return (text ?? '')
    .normalize('NFD')
    // Tras NFD, las tildes quedan como marcas combinantes (U+0300–U+036F) y se eliminan.
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
