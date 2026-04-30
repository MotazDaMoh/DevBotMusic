import type { Client } from 'discord.js';
import { AttachmentBuilder } from 'discord.js';
import type { Player } from 'lavalink-client';

import { getManager } from '../../../lib/music.js';
import { renderProgressBar } from '../../../lib/canvas/bar.js';

import { handleTrackStart } from '../lavalink/trackStart/handler.js';
import { handleTrackEnd } from '../lavalink/trackEnd/handler.js';
import { handleTrackError } from '../lavalink/trackError/handler.js';
import { handleQueueEnd } from '../lavalink/queueEnd/handler.js';
import { handlePlayerDestroy } from '../lavalink/playerDestroy/handler.js';

/**
 * Wire every Lavalink manager event to its dedicated handler.
 * Runs once after the Lavalink manager has been initialised.
 */
export default function registerMusicEvents(client: Client<true>): void {
  const manager = getManager(client);

  manager.on('trackStart', async (player, track) => {
    if (!track) return;
    await handleTrackStart(client, player, track);
  });

  manager.on('trackEnd', (player, track, payload) => {
    handleTrackEnd(player, track ?? null, payload);
  });

  manager.on('trackError', async (player, track, payload) => {
    await handleTrackError(client, player, track ?? null, payload);
  });

  manager.on('queueEnd', async (player) => {
    await handleQueueEnd(client, player);
  });

  manager.on('playerDestroy', (player, reason) => {
    handlePlayerDestroy(player, reason);
  });
}

/**
 * Render a progress-bar PNG for the given player. Exported so the
 * `/nowplaying` command can reuse the exact same renderer.
 */
export function renderPlayerProgress(player: Player): AttachmentBuilder | null {
  const track = player.queue.current;
  if (!track) return null;
  const duration = track.info.duration ?? 0;
  if (duration <= 0) return null;
  const percent = Math.min(
    100,
    Math.round((player.position / duration) * 100),
  );
  const buffer = renderProgressBar(percent, track.info.sourceName ?? 'default');
  return new AttachmentBuilder(buffer, { name: 'progress.png' });
}
