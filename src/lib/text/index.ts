/**
 * Small pure-string helpers used throughout embeds and log lines.
 *
 * They all treat `null`/`undefined`/non-string inputs as empty strings so they
 * can be composed freely without defensive call sites.
 */

const EMOJI_REGEX =
  /[\u{1F300}-\u{1FAFF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu;

export function cleanText(text: string | null | undefined): string {
  if (!text) return '';
  return text.replace(EMOJI_REGEX, '');
}

export function shortText(text: string | null | undefined, max = 96): string {
  if (typeof text !== 'string') return '';
  return text.length <= max ? text : `${text.slice(0, max)}…`;
}

export function maskText(text: string | null | undefined, url: string): string {
  const cleaned = cleanText(text ?? '').trim() || url;
  return `[${cleaned}](${url})`;
}

export function formatTime(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;
  const pad = (n: number): string => n.toString().padStart(2, '0');
  return hours > 0
    ? `${hours}:${pad(minutes)}:${pad(seconds)}`
    : `${minutes}:${pad(seconds)}`;
}
