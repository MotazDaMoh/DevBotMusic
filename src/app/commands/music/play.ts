import type { ChatInputCommand, CommandData } from 'commandkit';
import { ApplicationCommandOptionType, MessageFlags } from 'discord.js';

import type { CommandOptions } from '../_types.js';
import { errorContainer, successContainer } from '../../../lib/responses.js';
import { getOrCreatePlayer } from '../../../lib/music.js';

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
            searchResult.exception?.message ?? `No results found for \`${query}\`.`,
          ),
        ],
      });
      return;
    }

    if (searchResult.loadType === 'playlist') {
      player.queue.add(searchResult.tracks);
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
      await interaction.editReply({
        components: [
          successContainer('Queued', `**${first.info.title}**`),
        ],
      });
    }

    if (!player.playing && !player.paused) {
      await player.play();
    }
  } catch (error) {
    console.error('[play] error:', error);
    const message = error instanceof Error ? error.message : 'Failed to play.';
    await interaction.editReply({ components: [errorContainer(message)] });
  }
};
