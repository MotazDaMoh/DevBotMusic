import type { Client } from 'discord.js';
import { MessageFlags } from 'discord.js';
import type { Player, Track, UnresolvedTrack, TrackExceptionEvent } from 'lavalink-client';

import { errorContainer } from '../../../../lib/responses.js';

type AnyTrack = Track | UnresolvedTrack;

export async function handleTrackError(
  client: Client<true>,
  player: Player,
  track: AnyTrack | null,
  payload: TrackExceptionEvent | undefined,
): Promise<void> {
  const reason = payload?.exception?.message ?? 'unknown error';
  console.error(
    `[music] track error in ${player.guildId}:`,
    track?.info.title ?? 'unknown',
    reason,
  );

  if (!player.textChannelId) return;
  const channel = await client.channels
    .fetch(player.textChannelId)
    .catch(() => null);
  if (!channel || !channel.isSendable()) return;

  await channel
    .send({
      components: [errorContainer(`Playback failed: ${reason}`)],
      flags: MessageFlags.IsComponentsV2,
    })
    .catch(() => undefined);
}
