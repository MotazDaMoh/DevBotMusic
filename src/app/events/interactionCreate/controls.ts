import {
  type ButtonInteraction,
  type Client,
  type Interaction,
  MessageFlags,
  type StringSelectMenuInteraction,
} from 'discord.js';
import type { Player } from 'lavalink-client';

import {
  BUTTON_CUSTOM_ID_PREFIX,
  type ControlId,
  SELECT_MENU_CUSTOM_ID,
} from '../../../lib/components/controls.js';
import { errorContainer, successContainer } from '../../../lib/responses.js';
import { getPlayer } from '../../../lib/music.js';
import { markUserSkip } from '../../../lib/playerState.js';

/**
 * Handles the orphaned UI components from the "Now Playing" message.
 *
 * The select-menu (`musicbot:controls:menu`) and each button
 * (`musicbot:controls:button:<id>`) are created by
 * `src/lib/components/controls.ts` and used to ship in the v0 bot without
 * anything listening to them. This event wires both flavours into the same
 * action dispatch.
 */
export default async function onInteraction(
  interaction: Interaction,
  client: Client,
): Promise<void> {
  if (interaction.isStringSelectMenu()) {
    if (interaction.customId !== SELECT_MENU_CUSTOM_ID) return;
    const value = interaction.values[0];
    if (!value) return;
    await handleAction(interaction, value as ControlId);
    return;
  }

  if (interaction.isButton()) {
    if (!interaction.customId.startsWith(BUTTON_CUSTOM_ID_PREFIX)) return;
    const action = interaction.customId.slice(BUTTON_CUSTOM_ID_PREFIX.length) as ControlId;
    await handleAction(interaction, action);
    return;
  }

  // Route the collector-driven pager actions is handled inside the commands
  // themselves, so nothing else to do here.
  void client;
}

async function handleAction(
  interaction: ButtonInteraction | StringSelectMenuInteraction,
  action: ControlId,
): Promise<void> {
  if (!interaction.inCachedGuild()) {
    await reply(interaction, 'This control only works inside a guild.', false);
    return;
  }

  const player = getPlayer(interaction.client, interaction.guildId);
  if (!player) {
    await reply(interaction, 'Nothing is playing right now.', false);
    return;
  }

  const memberVoice = interaction.member.voice.channelId;
  if (!memberVoice || memberVoice !== player.voiceChannelId) {
    await reply(interaction, 'Join the same voice channel as the bot to use controls.', false);
    return;
  }

  try {
    const feedback = await runAction(player, action);
    await reply(interaction, feedback, true);
  } catch (error) {
    console.error(`[controls] action "${action}" failed:`, error);
    await reply(
      interaction,
      error instanceof Error ? error.message : 'Control failed.',
      false,
    );
  }
}

async function runAction(player: Player, action: ControlId): Promise<string> {
  switch (action) {
    case 'skip':
      markUserSkip(player.guildId);
      if (player.queue.tracks.length === 0) {
        await player.stopPlaying(true, false);
        return 'Stopped — nothing else to play.';
      }
      await player.skip();
      return 'Skipped to the next track.';

    case 'pause':
      if (player.paused) return 'Player is already paused.';
      await player.pause();
      return 'Paused playback.';

    case 'resume':
      if (!player.paused) return 'Player is not paused.';
      await player.resume();
      return 'Resumed playback.';

    case 'stop':
      await player.destroy('Stopped via controls');
      return 'Stopped and disconnected.';

    case 'volume_up': {
      const next = Math.min(200, player.volume + 10);
      await player.setVolume(next);
      return `Volume increased to ${next}%.`;
    }

    case 'volume_down': {
      const next = Math.max(0, player.volume - 10);
      await player.setVolume(next);
      return `Volume decreased to ${next}%.`;
    }

    case 'rewind10': {
      const next = Math.max(0, player.position - 10_000);
      await player.seek(next);
      return `Rewound 10 seconds.`;
    }

    case 'forward10': {
      const duration = player.queue.current?.info.duration ?? 0;
      const next = Math.min(duration, player.position + 10_000);
      await player.seek(next);
      return `Fast-forwarded 10 seconds.`;
    }

    case 'repeat': {
      const nextMode: Player['repeatMode'] =
        player.repeatMode === 'off'
          ? 'track'
          : player.repeatMode === 'track'
            ? 'queue'
            : 'off';
      await player.setRepeatMode(nextMode);
      return `Repeat mode set to \`${nextMode}\`.`;
    }

    case 'shuffle':
      if (player.queue.tracks.length < 2) {
        return 'Need at least 2 tracks in the queue to shuffle.';
      }
      player.queue.shuffle();
      return 'Queue shuffled.';

    default: {
      const exhaustive: never = action;
      throw new Error(`Unknown control action: ${String(exhaustive)}`);
    }
  }
}

async function reply(
  interaction: ButtonInteraction | StringSelectMenuInteraction,
  content: string,
  ok: boolean,
): Promise<void> {
  const container = ok ? successContainer(content) : errorContainer(content);
  await interaction.reply({
    components: [container],
    flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
  });
}
