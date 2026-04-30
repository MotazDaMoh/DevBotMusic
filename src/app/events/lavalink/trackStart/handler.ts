import type { Client, SendableChannels } from 'discord.js';
import {
  AttachmentBuilder,
  EmbedBuilder,
  MessageFlags,
} from 'discord.js';
import type { Player, Track, UnresolvedTrack } from 'lavalink-client';

import { buildControlRows } from '../../../../lib/components/controls.js';
import { RichMessage } from '../../../../lib/components/richMessage.js';
import { config } from '../../../../lib/config.js';
import { shouldAnnounceTrack } from '../../../../lib/playerState.js';
import { renderPlaySongCard } from '../../../../lib/cards/renderer.js';
import {
  cleanText,
  maskText,
  shortText,
  formatTime,
} from '../../../../lib/text/index.js';

type AnyTrack = Track | UnresolvedTrack;

export async function handleTrackStart(
  client: Client<true>,
  player: Player,
  track: AnyTrack,
): Promise<void> {
  if (!track) return;
  if (!player.textChannelId) return;

  if (!shouldAnnounceTrack(player.guildId, track.info.uri, player.repeatMode)) {
    return;
  }

  const channel = await client.channels
    .fetch(player.textChannelId)
    .catch(() => null);
  if (!channel || !channel.isSendable()) return;

  if (config.ui.messageStyle === 'cards') {
    await sendCardsNowPlaying(channel, player, track);
  } else {
    await sendComponentsV2NowPlaying(channel, player, track);
  }
}

async function sendComponentsV2NowPlaying(
  channel: SendableChannels,
  player: Player,
  track: AnyTrack,
): Promise<void> {
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
  const container = new RichMessage().setTitle(
    `🎧 Now Playing — ${(track.info.sourceName ?? 'unknown').toUpperCase()}`,
  );

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

async function sendCardsNowPlaying(
  channel: SendableChannels,
  player: Player,
  track: AnyTrack,
): Promise<void> {
  const requester = track.requester as { id?: string } | undefined;
  const durationSeconds = Math.floor((track.info.duration ?? 0) / 1000);

  try {
    const cardBuffer = await renderPlaySongCard(track);
    const attachment = new AttachmentBuilder(cardBuffer, {
      name: 'nowplaying.png',
    });

    const embed = new EmbedBuilder()
      .setColor(0x0d0d0d)
      .setDescription(
        [
          `🎶 **${cleanText(track.info.title) || 'Unknown'}**`,
          track.info.author
            ? `🎤 ${cleanText(track.info.author)}`
            : null,
          `⏱ ${formatTime(durationSeconds)}`,
          requester?.id ? `🙋 <@${requester.id}>` : null,
          `🔊 ${player.volume}% · 🔁 ${player.repeatMode}`,
        ]
          .filter(Boolean)
          .join('\n'),
      )
      .setImage('attachment://nowplaying.png');

    await channel.send({
      embeds: [embed],
      files: [attachment],
      allowedMentions: { users: requester?.id ? [requester.id] : [] },
    });
  } catch (err) {
    console.error('[trackStart] card render failed, falling back:', err);
    await sendComponentsV2NowPlaying(channel, player, track);
  }
}
