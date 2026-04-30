import type { ChatInputCommand, CommandData } from 'commandkit';
import { ApplicationCommandOptionType, MessageFlags } from 'discord.js';

import type { CommandOptions } from '../_types.js';
import { errorContainer, successContainer } from '../../../lib/responses.js';
import { shortText } from '../../../lib/text/index.js';
import { getPlayer } from '../../../lib/music.js';

export const command: CommandData = {
  name: 'remove',
  description: 'Remove a track from the queue.',
  options: [
    {
      name: 'position',
      description: 'Position in the queue (starting at 1).',
      type: ApplicationCommandOptionType.Integer,
      required: true,
      min_value: 1,
    },
  ],
};

export const options: CommandOptions = {
  inVoice: true,
  sameVoice: true,
};

export const chatInput: ChatInputCommand = async ({ interaction, client }) => {
  if (!interaction.inCachedGuild()) return;

  const player = getPlayer(client, interaction.guildId);
  if (!player) {
    await interaction.reply({
      components: [errorContainer('Nothing is playing!')],
      flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
    });
    return;
  }

  const position = interaction.options.getInteger('position', true);
  const index = position - 1;

  if (index < 0 || index >= player.queue.tracks.length) {
    await interaction.reply({
      components: [
        errorContainer(
          `Position must be between 1 and ${player.queue.tracks.length}.`,
        ),
      ],
      flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
    });
    return;
  }

  const [removed] = await player.queue.splice(index, 1);
  const title = shortText(removed?.info?.title ?? 'Unknown', 80);

  await interaction.reply({
    components: [successContainer('Removed', `\`${title}\``)],
    flags: MessageFlags.IsComponentsV2,
  });
};
