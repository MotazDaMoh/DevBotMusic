import type { ChatInputCommand, CommandData } from 'commandkit';
import { MessageFlags } from 'discord.js';

import type { CommandOptions } from '../_types.js';
import { errorContainer, successContainer } from '../../../lib/responses.js';
import { getPlayer } from '../../../lib/music.js';

export const command: CommandData = {
  name: 'stop',
  description: 'Stop playback and clear the queue.',
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

  try {
    await player.destroy('Stopped by user');
    await interaction.reply({
      components: [successContainer('Stopped and cleared the queue!')],
      flags: MessageFlags.IsComponentsV2,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to stop.';
    await interaction.reply({
      components: [errorContainer(message)],
      flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
    });
  }
};
