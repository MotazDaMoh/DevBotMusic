import type { Client } from 'discord.js';
import { MessageFlags } from 'discord.js';
import type { Player } from 'lavalink-client';

import { errorContainer } from '../../../../lib/responses.js';

export async function handleQueueEnd(
  client: Client<true>,
  player: Player,
): Promise<void> {
  if (!player.textChannelId) return;
  const channel = await client.channels
    .fetch(player.textChannelId)
    .catch(() => null);
  if (!channel || !channel.isSendable()) return;

  await channel
    .send({
      components: [errorContainer('Queue is empty. Disconnecting soon.')],
      flags: MessageFlags.IsComponentsV2,
    })
    .catch(() => undefined);
}
