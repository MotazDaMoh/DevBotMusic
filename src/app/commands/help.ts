import type { ChatInputCommand, CommandData } from 'commandkit';
import { MessageFlags } from 'discord.js';

import { RichMessage } from '../../lib/components/richMessage.js';
import { getEmoji } from '../../lib/emojis.js';

export const command: CommandData = {
  name: 'help',
  description: 'Show the list of available commands.',
};

const COMMANDS: readonly { name: string; description: string }[] = [
  { name: 'play', description: 'Play a song or playlist.' },
  { name: 'pause', description: 'Pause the current track.' },
  { name: 'resume', description: 'Resume a paused track.' },
  { name: 'skip', description: 'Skip the current track.' },
  { name: 'stop', description: 'Stop and clear the queue.' },
  { name: 'volume', description: 'Change the volume.' },
  { name: 'move', description: 'Seek in the track (relative or absolute).' },
  { name: 'loop', description: 'Set loop mode (off/track/queue).' },
  { name: 'shuffle', description: 'Shuffle the queue.' },
  { name: 'queue', description: 'Show the current queue.' },
  { name: 'remove', description: 'Remove a track from the queue.' },
  { name: 'nowplaying', description: 'Show the currently playing track.' },
  { name: 'ping', description: 'Show websocket latency.' },
];

export const chatInput: ChatInputCommand = async ({ interaction }) => {
  const icon = getEmoji('help').full;
  const lines = COMMANDS.map(
    (cmd) => `• \`/${cmd.name}\` — ${cmd.description}`,
  ).join('\n');

  const container = new RichMessage()
    .setTitle(`${icon} Available Commands`)
    .addText(lines)
    .build();

  await interaction.reply({
    components: [container],
    flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
  });
};
