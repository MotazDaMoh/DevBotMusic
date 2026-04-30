import type { Client } from 'discord.js';
import { AttachmentBuilder, MessageFlags } from 'discord.js';
import type { Player, Track, UnresolvedTrack } from 'lavalink-client';

import { renderProgressBar } from '../../../lib/canvas/bar.js';
import { buildControlRows } from '../../../lib/components/controls.js';
import { RichMessage } from '../../../lib/components/richMessage.js';
import { errorContainer } from '../../../lib/responses.js';
import { getManager } from '../../../lib/music.js';
import { cleanText, maskText, shortText, formatTime } from '../../../lib/text/index.js';

type AnyTrack = Track | UnresolvedTrack;

/**
 * Wire every Lavalink manager event that affects the user-facing UI.
 * Runs once after the Lavalink manager has been initialised.
 */
export default function registerMusicEvents(client: Client<true>): void {
  const manager = getManager(client);

  manager.on('trackStart', async (player, track) => {
    if (!track) return;
    await sendNowPlaying(client, player, track);
  });

  manager.on('trackEnd', (player, track, payload) => {
    const reason = payload?.reason ?? 'unknown';
    const title = track?.info.title ?? 'unknown';
    console.log(`[music] track ended in ${player.guildId}: "${title}" (${reason})`);
  });

  manager.on('trackError', async (player, track, payload) => {
    const reason = payload?.exception?.message ?? 'unknown error';
    console.error(
      `[music] track error in ${player.guildId}:`,
      track?.info.title ?? 'unknown',
      reason,
    );
    await sendTextChannelNotice(
      client,
      player,
      `Playback failed: ${reason}`,
    );
  });

  manager.on('queueEnd', async (player) => {
    await sendTextChannelNotice(client, player, 'Queue is empty. Disconnecting soon.');
  });

  manager.on('playerDestroy', (player, reason) => {
    console.log(`[music] player destroyed in ${player.guildId} (${reason ?? 'no reason'})`);
  });
}

async function sendNowPlaying(
  client: Client<true>,
  player: Player,
  track: AnyTrack,
): Promise<void> {
  if (!player.textChannelId) return;
  const channel = await client.channels.fetch(player.textChannelId).catch(() => null);
  if (!channel || !channel.isSendable()) return;

  const title = shortText(cleanText(track.info.title), 96);
  const link = maskText(title, track.info.uri ?? '');
  const durationSeconds = Math.floor((track.info.duration ?? 0) / 1000);
  const requester = track.requester as { id?: string } | undefined;

  const infoLines = [
    `🎶 ${link}`,
    `⏱ Duration: ${formatTime(durationSeconds)}`,
    requester?.id ? `🙋 Requested by: <@${requester.id}>` : null,
    `🔊 Volume: ${player.volume}%`,
    `🔁 Repeat: ${player.repeatMode}`,
    track.info.author ? `🎤 Author: ${cleanText(track.info.author)}` : null,
  ]
    .filter((line): line is string => !!line)
    .join('\n');

  const thumbnailUrl = track.info.artworkUrl ?? null;
  const container = new RichMessage()
    .setTitle(`🎧 Now Playing — ${(track.info.sourceName ?? 'unknown').toUpperCase()}`);

  if (thumbnailUrl) {
    container.addGallery([{ url: thumbnailUrl, description: 'Thumbnail' }]);
  }
  container.addSeparator().addText(infoLines).addSeparator();

  const controlRows = buildControlRows();

  await channel.send({
    components: [container.build(), ...controlRows],
    flags: MessageFlags.IsComponentsV2,
    allowedMentions: { users: requester?.id ? [requester.id] : [] },
  });
}

async function sendTextChannelNotice(
  client: Client<true>,
  player: Player,
  message: string,
): Promise<void> {
  if (!player.textChannelId) return;
  const channel = await client.channels.fetch(player.textChannelId).catch(() => null);
  if (!channel || !channel.isSendable()) return;

  await channel
    .send({
      components: [errorContainer(message)],
      flags: MessageFlags.IsComponentsV2,
    })
    .catch(() => undefined);
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
  const percent = Math.min(100, Math.round((player.position / duration) * 100));
  const buffer = renderProgressBar(percent, track.info.sourceName ?? 'default');
  return new AttachmentBuilder(buffer, { name: 'progress.png' });
}
