import type { ChatInputCommand, CommandData } from 'commandkit';
import { ApplicationCommandOptionType, MessageFlags } from 'discord.js';

import type { CommandOptions } from '../_types.js';
import { errorContainer, successContainer } from '../../../lib/responses.js';
import { formatTime } from '../../../lib/text/index.js';
import { getPlayer } from '../../../lib/music.js';

export const command: CommandData = {
  name: 'move',
  description: 'Seek around in the current track.',
  options: [
    {
      type: ApplicationCommandOptionType.Subcommand,
      name: 'relative',
      description: 'Seek forward or backward by a duration.',
      options: [
        {
          type: ApplicationCommandOptionType.String,
          name: 'duration',
          description: 'Duration, e.g. 10s, 5.5m, 2h (prefix with - to rewind).',
          required: true,
        },
      ],
    },
    {
      type: ApplicationCommandOptionType.Subcommand,
      name: 'absolute',
      description: 'Jump to a specific time in the track.',
      options: [
        {
          type: ApplicationCommandOptionType.String,
          name: 'time',
          description: 'Time in mm:ss, e.g. 1:23.',
          required: true,
        },
      ],
    },
  ],
};

export const options: CommandOptions = {
  inVoice: true,
  sameVoice: true,
};

const RELATIVE_PATTERN = /^(-?\d+(\.\d+)?)(s|m|h)$/i;
const ABSOLUTE_PATTERN = /^(\d+):(\d{2})$/;

function parseRelative(value: string): number | null {
  const match = RELATIVE_PATTERN.exec(value);
  if (!match) return null;
  const amount = Number.parseFloat(match[1] ?? '0');
  const unit = (match[3] ?? '').toLowerCase();
  if (unit === 's') return amount * 1000;
  if (unit === 'm') return amount * 60 * 1000;
  if (unit === 'h') return amount * 3600 * 1000;
  return null;
}

function parseAbsolute(value: string): number | null {
  const match = ABSOLUTE_PATTERN.exec(value);
  if (!match) return null;
  const minutes = Number.parseInt(match[1] ?? '0', 10);
  const seconds = Number.parseInt(match[2] ?? '0', 10);
  if (seconds >= 60) return null;
  return (minutes * 60 + seconds) * 1000;
}

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
  const sub = interaction.options.getSubcommand();
  let targetMs = 0;

  if (sub === 'relative') {
    const raw = interaction.options.getString('duration', true);
    const delta = parseRelative(raw);
    if (delta === null) {
      await interaction.reply({
        components: [
          errorContainer('Use `10s`, `5.5m`, `2h` (supports negatives like `-10s`).'),
        ],
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
      });
      return;
    }
    targetMs = player.position + delta;
  } else if (sub === 'absolute') {
    const raw = interaction.options.getString('time', true);
    const absolute = parseAbsolute(raw);
    if (absolute === null) {
      await interaction.reply({
        components: [errorContainer('Use `mm:ss`, e.g. `1:23`.')],
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
      });
      return;
    }
    targetMs = absolute;
  } else {
    return;
  }

  targetMs = Math.max(0, Math.min(targetMs, duration));
  await player.seek(targetMs);

  await interaction.reply({
    components: [
      successContainer(
        'Seeked',
        `Jumped to \`${formatTime(Math.floor(targetMs / 1000))}\`.`,
      ),
    ],
    flags: MessageFlags.IsComponentsV2,
  });
};
