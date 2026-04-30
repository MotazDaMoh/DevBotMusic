import type { ChatInputCommand, CommandData } from 'commandkit';
import { AttachmentBuilder, EmbedBuilder, MessageFlags } from 'discord.js';

import { renderProgressBar } from '../../../lib/canvas/bar.js';
import { config } from '../../../lib/config.js';
import { errorContainer } from '../../../lib/responses.js';
import { getEmoji } from '../../../lib/emojis.js';
import { getPlayer } from '../../../lib/music.js';
import { RichMessage } from '../../../lib/components/richMessage.js';
import { renderNowPlayingCard } from '../../../lib/cards/renderer.js';
import {
  cleanText,
  formatTime,
  maskText,
  shortText,
} from '../../../lib/text/index.js';

export const command: CommandData = {
  name: 'nowplaying',
  description: 'Show the currently playing track with a progress bar.',
};

export const chatInput: ChatInputCommand = async ({ interaction, client }) => {
  if (!interaction.inCachedGuild()) return;

  const player = getPlayer(client, interaction.guildId);
  const track = player?.queue.current;
  if (!player || !track) {
    await interaction.reply({
      components: [errorContainer('Nothing is playing!')],
      flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
    });
    return;
  }

  if (config.ui.messageStyle === 'cards') {
    await sendCardsNowPlaying(interaction, player, track);
  } else {
    await sendComponentsV2NowPlaying(interaction, player, track);
  }
};

async function sendComponentsV2NowPlaying(
  interaction: Parameters<ChatInputCommand>[0]['interaction'],
  player: ReturnType<typeof getPlayer> & object,
  track: NonNullable<ReturnType<typeof getPlayer>>['queue']['current'] &
    object,
): Promise<void> {
  const duration = track.info.duration ?? 0;
  const percent =
    duration > 0 ? Math.min(100, (player.position / duration) * 100) : 0;
  const buffer = renderProgressBar(percent, track.info.sourceName ?? 'default');
  const attachment = new AttachmentBuilder(buffer, { name: 'progress.png' });

  const title = shortText(cleanText(track.info.title), 80);
  const link = maskText(title, track.info.uri ?? '');

  const container = new RichMessage()
    .setTitle(`${getEmoji('headphones').full} Now Playing`)
    .addText([
      link,
      `${getEmoji('time').full} ${formatTime(Math.floor(player.position / 1000))} / ${formatTime(
        Math.floor(duration / 1000),
      )}`,
      `${getEmoji('volume').full} Volume: **${player.volume}%** · Repeat: \`${player.repeatMode}\``,
    ])
    .addFile({ url: 'attachment://progress.png' })
    .build();

  await interaction.reply({
    components: [container],
    files: [attachment],
    flags: MessageFlags.IsComponentsV2,
  });
}

async function sendCardsNowPlaying(
  interaction: Parameters<ChatInputCommand>[0]['interaction'],
  player: ReturnType<typeof getPlayer> & object,
  track: NonNullable<ReturnType<typeof getPlayer>>['queue']['current'] &
    object,
): Promise<void> {
  const duration = track.info.duration ?? 0;

  try {
    const cardBuffer = await renderNowPlayingCard(track, player.position);
    const attachment = new AttachmentBuilder(cardBuffer, {
      name: 'nowplaying.png',
    });

    const embed = new EmbedBuilder()
      .setColor(0x0d0d0d)
      .setDescription(
        [
          `🎧 **Now Playing**`,
          `🎶 **${cleanText(track.info.title) || 'Unknown'}**`,
          `${getEmoji('time').full} ${formatTime(Math.floor(player.position / 1000))} / ${formatTime(Math.floor(duration / 1000))}`,
          `${getEmoji('volume').full} **${player.volume}%** · 🔁 \`${player.repeatMode}\``,
        ].join('\n'),
      )
      .setImage('attachment://nowplaying.png');

    await interaction.reply({
      embeds: [embed],
      files: [attachment],
    });
  } catch (err) {
    console.error('[nowplaying] card render failed, falling back:', err);
    await sendComponentsV2NowPlaying(interaction, player, track);
  }
}
