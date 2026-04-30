import type { ChatInputCommand, CommandData } from 'commandkit';
import { ApplicationCommandOptionType, MessageFlags } from 'discord.js';

import type { CommandOptions } from '../_types.js';
import { errorContainer, successContainer } from '../../../lib/responses.js';
import { getEmoji } from '../../../lib/emojis.js';
import { getPlayer } from '../../../lib/music.js';

export const command: CommandData = {
  name: 'volume',
  description: 'Change the music volume.',
  options: [
    {
      name: 'percentage',
      description: 'Volume percentage (0-200).',
      type: ApplicationCommandOptionType.Integer,
      required: true,
      min_value: 0,
      max_value: 200,
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
  if (!player || !player.queue.current) {
    await interaction.reply({
      components: [errorContainer('Nothing is playing!')],
      flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
    });
    return;
  }

  const percentage = interaction.options.getInteger('percentage', true);

  try {
    await player.setVolume(percentage);
    const icon = percentage === 0 ? getEmoji('mute').full : getEmoji('volume').full;
    await interaction.reply({
      components: [successContainer(`${icon} Volume set to **${percentage}%**`)],
      flags: MessageFlags.IsComponentsV2,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to set volume.';
    await interaction.reply({
      components: [errorContainer(message)],
      flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
    });
  }
};
