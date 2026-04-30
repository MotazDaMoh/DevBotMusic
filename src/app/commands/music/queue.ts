import type { ChatInputCommand, CommandData } from 'commandkit';
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  type MessageActionRowComponentBuilder,
  MessageFlags,
} from 'discord.js';

import type { CommandOptions } from '../_types.js';
import { errorContainer } from '../../../lib/responses.js';
import { RichMessage } from '../../../lib/components/richMessage.js';
import { formatTime, maskText, shortText } from '../../../lib/text/index.js';
import { getPlayer } from '../../../lib/music.js';

export const command: CommandData = {
  name: 'queue',
  description: 'Show the current music queue.',
};

export const options: CommandOptions = {
  inVoice: true,
  sameVoice: true,
};

const PAGE_SIZE = 10;
const PAGER_TIMEOUT_MS = 60_000;

export const chatInput: ChatInputCommand = async ({ interaction, client }) => {
  if (!interaction.inCachedGuild()) return;

  const player = getPlayer(client, interaction.guildId);
  if (!player || (!player.queue.current && player.queue.tracks.length === 0)) {
    await interaction.reply({
      components: [errorContainer('The queue is empty!')],
      flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
    });
    return;
  }

  let currentPage = 0;
  const totalPages = Math.max(
    1,
    Math.ceil(player.queue.tracks.length / PAGE_SIZE),
  );

  const renderPage = (page: number) => {
    const start = page * PAGE_SIZE;
    const slice = player.queue.tracks.slice(start, start + PAGE_SIZE);
    const builder = new RichMessage().setTitle(`🎶 Queue — page ${page + 1}/${totalPages}`);

    if (player.queue.current) {
      builder.addText(
        `**Now playing:** ${maskText(
          shortText(player.queue.current.info.title, 80),
          player.queue.current.info.uri ?? '',
        )}`,
      );
      builder.addSeparator();
    }

    if (slice.length === 0) {
      builder.addText('_No upcoming tracks._');
    } else {
      builder.addText(
        slice
          .map((track, index) => {
            const position = start + index + 1;
            const title = shortText(track.info.title ?? 'Unknown', 70);
            const link = maskText(title, track.info.uri ?? '');
            const duration = formatTime(
              Math.floor((track.info.duration ?? 0) / 1000),
            );
            return `\`${position}.\` ${link} — \`${duration}\``;
          })
          .join('\n'),
      );
    }

    return builder.build();
  };

  const buildRow = (page: number) =>
    new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId('queue:prev')
        .setLabel('Previous')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(page === 0),
      new ButtonBuilder()
        .setCustomId('queue:next')
        .setLabel('Next')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(page >= totalPages - 1),
    );

  const reply = await interaction.reply({
    components: [renderPage(currentPage), buildRow(currentPage)],
    flags: MessageFlags.IsComponentsV2,
    withResponse: true,
  });

  const message = reply.resource?.message;
  if (!message) return;

  const collector = message.createMessageComponentCollector({
    componentType: ComponentType.Button,
    time: PAGER_TIMEOUT_MS,
    filter: (btn) =>
      btn.user.id === interaction.user.id &&
      (btn.customId === 'queue:prev' || btn.customId === 'queue:next'),
  });

  collector.on('collect', async (btn) => {
    currentPage =
      btn.customId === 'queue:prev'
        ? Math.max(0, currentPage - 1)
        : Math.min(totalPages - 1, currentPage + 1);
    await btn.update({
      components: [renderPage(currentPage), buildRow(currentPage)],
    });
  });

  collector.on('end', async () => {
    await interaction
      .editReply({ components: [renderPage(currentPage)] })
      .catch(() => undefined);
  });
};
