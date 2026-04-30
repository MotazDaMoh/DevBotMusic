import { createCanvas } from '@napi-rs/canvas';

type Platform =
  | 'youtube'
  | 'youtube music'
  | 'spotify'
  | 'soundcloud'
  | 'deezer'
  | 'apple music'
  | 'bandcamp'
  | 'default';

const PALETTES: Record<Platform, readonly string[]> = {
  youtube: ['#f50f46', '#ec287c'],
  'youtube music': ['#f50f46', '#ec287c'],
  spotify: ['#1ED760', '#1AA34A'],
  soundcloud: ['#FFAA66', '#FF7733'],
  deezer: ['#a238ff', '#ef5466'],
  'apple music': ['#fa2d48', '#e73780'],
  bandcamp: ['#1ab7ea', '#317dba'],
  default: ['#f50f46', '#ec287c'],
};

/**
 * Render a horizontal progress bar as a PNG buffer.
 *
 * @param percent 0..100 — values outside this range are clamped.
 * @param platform The source platform name, used to pick the gradient palette.
 */
export function renderProgressBar(
  percent: number,
  platform: string | null | undefined = 'default',
): Buffer {
  const clamped = Math.max(0, Math.min(100, percent));
  const width = 1280;
  const height = 45;
  const radius = height / 2;

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  ctx.clearRect(0, 0, width, height);

  // Background track
  ctx.fillStyle = 'rgba(255,255,255,0.05)';
  ctx.shadowColor = 'rgba(0,0,0,0.1)';
  ctx.shadowBlur = 4;
  roundedRect(ctx, 0, 0, width, height, radius);
  ctx.fill();
  ctx.shadowBlur = 0;

  const fillWidth = (width * clamped) / 100;

  // Foreground fill
  const key = (platform ?? 'default').toLowerCase() as Platform;
  const palette = PALETTES[key] ?? PALETTES.default;
  const gradient = ctx.createLinearGradient(0, 0, width, 0);
  const step = palette.length > 1 ? 1 / (palette.length - 1) : 1;
  palette.forEach((color, i) => gradient.addColorStop(i * step, color));
  ctx.fillStyle = gradient;

  ctx.beginPath();
  if (fillWidth < radius) {
    // Draw a shrinking left-cap so extremely small progress values still look
    // like a rounded bar instead of a rectangular sliver.
    ctx.arc(radius, height / 2, fillWidth, Math.PI, Math.PI * 1.5, false);
    ctx.lineTo(radius, height / 2 + fillWidth);
  } else {
    roundedRect(ctx, 0, 0, fillWidth, height, radius);
  }
  ctx.closePath();
  ctx.fill();

  // Percentage label
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 23px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${Math.round(clamped)}%`, width / 2, height / 2);

  return canvas.toBuffer('image/png');
}

function roundedRect(
  ctx: ReturnType<ReturnType<typeof createCanvas>['getContext']>,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
}
