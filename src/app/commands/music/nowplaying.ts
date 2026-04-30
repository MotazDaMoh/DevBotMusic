import type { ChatInputCommand, CommandData } from 'commandkit';
import { AttachmentBuilder, MessageFlags } from 'discord.js';

import { renderProgressBar } from '../../../lib/canvas/bar.js';
import { errorContainer } from '../../../lib/responses.js';
import { getEmoji } from '../../../lib/emojis.js';
import { getPlayer } from '../../../lib/music.js';
import { RichMessage } from '../../../lib/components/richMessage.js';
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

  const duration = track.info.duration ?? 0;
  const percent = duration > 0 ? Math.min(100, (player.position / duration) * 100) : 0;
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
};
