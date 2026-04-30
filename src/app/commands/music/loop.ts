import type { ChatInputCommand, CommandData } from 'commandkit';
import { ApplicationCommandOptionType, MessageFlags } from 'discord.js';
import type { Player } from 'lavalink-client';

import type { CommandOptions } from '../_types.js';
import { errorContainer, successContainer } from '../../../lib/responses.js';
import { getPlayer } from '../../../lib/music.js';

export const command: CommandData = {
  name: 'loop',
  description: 'Set loop mode for the current queue.',
  options: [
    {
      name: 'mode',
      description: 'Loop mode.',
      type: ApplicationCommandOptionType.String,
      required: true,
      choices: [
        { name: 'Off', value: 'off' },
        { name: 'Track', value: 'track' },
        { name: 'Queue', value: 'queue' },
      ],
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

  const mode = interaction.options.getString('mode', true) as Player['repeatMode'];
  await player.setRepeatMode(mode);

  await interaction.reply({
    components: [successContainer(`Loop mode set to \`${mode}\`.`)],
    flags: MessageFlags.IsComponentsV2,
  });
};
