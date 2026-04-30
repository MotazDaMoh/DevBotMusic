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
  name: 'shuffle',
  description: 'Shuffle the current queue.',
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

  if (player.queue.tracks.length < 2) {
    await interaction.reply({
      components: [warningContainer('Need at least 2 upcoming tracks to shuffle.')],
      flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
    });
    return;
  }

  player.queue.shuffle();

  await interaction.reply({
    components: [successContainer('Queue has been shuffled!')],
    flags: MessageFlags.IsComponentsV2,
  });
};
