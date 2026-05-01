import { initializeFonts, Bloom } from 'musicard';
import type { BloomOptions } from 'musicard';
import type { Track, UnresolvedTrack } from 'lavalink-client';

import { cleanText, formatTime } from '../text/index.js';

type AnyTrack = Track | UnresolvedTrack;

let fontsReady = false;

async function ensureFonts(): Promise<void> {
  if (fontsReady) return;
  initializeFonts();
  fontsReady = true;
}

/**
 * Render a "Now Playing" card with a progress bar.
 */
export async function renderNowPlayingCard(
  track: AnyTrack,
  positionMs: number,
): Promise<Buffer> {
  await ensureFonts();

  const durationMs = track.info.duration ?? 0;
  const progress =
    durationMs > 0
      ? Math.min(100, Math.round((positionMs / durationMs) * 100))
      : 0;

  const opts: BloomOptions = {
    albumArt: track.info.artworkUrl ?? '',
    fallbackArt: '',
    trackName: cleanText(track.info.title) || 'Unknown',
    artistName: cleanText(track.info.author) || 'Unknown Artist',
    timeAdjust: {
      timeStart: formatTime(Math.floor(positionMs / 1000)),
      timeEnd: formatTime(Math.floor(durationMs / 1000)),
    },
    progressBar: progress,
  };

  return Bloom(opts);
}

/**
 * Render a "Play Song" card — no progress bar, full art display.
 */
export async function renderPlaySongCard(track: AnyTrack): Promise<Buffer> {
  await ensureFonts();

  const durationMs = track.info.duration ?? 0;

  const opts: BloomOptions = {
    albumArt: track.info.artworkUrl ?? '',
    fallbackArt: '',
    trackName: cleanText(track.info.title) || 'Unknown',
    artistName: cleanText(track.info.author) || 'Unknown Artist',
    timeAdjust: {
      timeStart: '0:00',
      timeEnd: formatTime(Math.floor(durationMs / 1000)),
    },
    progressBar: 0,
  };

  return Bloom(opts);
}

/**
 * Render a compact "Add Song" card — minimal design with no progress.
 */
export async function renderAddSongCard(track: AnyTrack): Promise<Buffer> {
  await ensureFonts();

  const durationMs = track.info.duration ?? 0;

  const opts: BloomOptions = {
    albumArt: track.info.artworkUrl ?? '',
    fallbackArt: '',
    trackName: cleanText(track.info.title) || 'Unknown',
    artistName: cleanText(track.info.author) || 'Unknown Artist',
    timeAdjust: {
      timeStart: '—',
      timeEnd: formatTime(Math.floor(durationMs / 1000)),
    },
    progressBar: 0,
  };

  return Bloom(opts);
}
