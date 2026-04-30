import type { ChatInputCommand, CommandData } from 'commandkit';
import type { SendableChannels } from 'discord.js';
import {
  ApplicationCommandOptionType,
  AttachmentBuilder,
  EmbedBuilder,
  MessageFlags,
} from 'discord.js';

import type { CommandOptions } from '../_types.js';
import { config } from '../../../lib/config.js';
import { errorContainer, successContainer } from '../../../lib/responses.js';
import { getOrCreatePlayer } from '../../../lib/music.js';
import { markSongAdded } from '../../../lib/playerState.js';
import { renderAddSongCard } from '../../../lib/cards/renderer.js';
import { cleanText } from '../../../lib/text/index.js';

export const command: CommandData = {
  name: 'play',
  description: 'Play a song or playlist.',
  options: [
    {
      name: 'query',
      description: 'A URL or search query.',
      type: ApplicationCommandOptionType.String,
      required: true,
    },
  ],
};

export const options: CommandOptions = {
  inVoice: true,
  sameVoice: false,
};

export const chatInput: ChatInputCommand = async ({ interaction, client }) => {
  if (!interaction.inCachedGuild()) return;

  const query = interaction.options.getString('query', true);
  const member = interaction.member;
  const player = getOrCreatePlayer(client, member, interaction.channel);

  if (!player) {
    await interaction.reply({
      components: [errorContainer('You need to be in a voice channel!')],
      flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
    });
    return;
  }

  await interaction.deferReply({
    flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
  });

  try {
    if (!player.connected) await player.connect();

    const searchResult = await player.search(
      { query },
      { id: interaction.user.id, tag: interaction.user.tag },
    );

    if (!searchResult.tracks.length || searchResult.loadType === 'error') {
      await interaction.editReply({
        components: [
          errorContainer(
            searchResult.exception?.message ??
              `No results found for \`${query}\`.`,
          ),
        ],
      });
      return;
    }

    const isLooping =
      player.repeatMode === 'track' || player.repeatMode === 'queue';
    const wasPlaying = player.playing || player.paused;

    if (searchResult.loadType === 'playlist') {
      player.queue.add(searchResult.tracks);

      if (isLooping && wasPlaying) {
        markSongAdded(player.guildId);
      }

      await interaction.editReply({
        components: [
          successContainer(
            'Playlist Queued',
            `Added **${searchResult.tracks.length}** tracks from **${
              searchResult.playlist?.name ?? 'playlist'
            }**.`,
          ),
        ],
      });
    } else {
      const [first] = searchResult.tracks;
      if (!first) {
        await interaction.editReply({
          components: [errorContainer(`No results found for \`${query}\`.`)],
        });
        return;
      }
      player.queue.add(first);

      if (isLooping && wasPlaying) {
        markSongAdded(player.guildId);
      }

      if (
        wasPlaying &&
        config.ui.messageStyle === 'cards' &&
        interaction.channel?.isSendable()
      ) {
        await sendAddSongCard(interaction.channel, first);
      } else {
        await interaction.editReply({
          components: [
            successContainer('Queued', `**${first.info.title}**`),
          ],
        });
      }
    }

    if (!player.playing && !player.paused) {
      await player.play();
    }
  } catch (error) {
    console.error('[play] error:', error);
    const message =
      error instanceof Error ? error.message : 'Failed to play.';
    await interaction.editReply({ components: [errorContainer(message)] });
  }
};

async function sendAddSongCard(
  channel: SendableChannels,
  track: { info: { title?: string | null; author?: string | null; artworkUrl?: string | null; duration?: number | null; sourceName?: string | null } },
): Promise<void> {
  try {
    const cardBuffer = await renderAddSongCard(
      track as Parameters<typeof renderAddSongCard>[0],
    );
    const attachment = new AttachmentBuilder(cardBuffer, {
      name: 'addsong.png',
    });

    const embed = new EmbedBuilder()
      .setColor(0x111111)
      .setDescription(
        `📥 **Added to queue** — ${cleanText(track.info.title) || 'Unknown'}`,
      )
      .setImage('attachment://addsong.png');

    await channel.send({
      embeds: [embed],
      files: [attachment],
    });
  } catch {
    // Card rendering failed silently — the deferred reply already confirmed the queue add
  }
}
