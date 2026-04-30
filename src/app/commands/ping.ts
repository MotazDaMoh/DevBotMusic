import type { ChatInputCommand, CommandData } from 'commandkit';
import { MessageFlags } from 'discord.js';

import { RichMessage } from '../../lib/components/richMessage.js';

export const command: CommandData = {
  name: 'ping',
  description: 'Reply with the current websocket latency.',
};

export const chatInput: ChatInputCommand = async ({ interaction, client }) => {
  const container = new RichMessage()
    .setTitle(`🏓 Pong! \`${client.ws.ping}ms\``)
    .build();

  await interaction.reply({
    components: [container],
    flags: MessageFlags.IsComponentsV2,
  });
};
