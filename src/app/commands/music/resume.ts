import type { ChatInputCommand, CommandData } from 'commandkit';
import { MessageFlags } from 'discord.js';

import type { CommandOptions } from '../_types.js';
import {
  errorContainer,
  successContainer,
  warningContainer,
} from '../../../lib/responses.js';
import { getPlayer } from '../../../lib/music.js';

export const command: CommandData = {
  name: 'resume',
  description: 'Resume a paused track.',
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

  if (!player.paused) {
    await interaction.reply({
      components: [warningContainer('The music is already playing!')],
      flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
    });
    return;
  }

  try {
    await player.resume();
    await interaction.reply({
      components: [successContainer('Resumed the music!')],
      flags: MessageFlags.IsComponentsV2,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to resume.';
    await interaction.reply({
      components: [errorContainer(message)],
      flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
    });
  }
};
