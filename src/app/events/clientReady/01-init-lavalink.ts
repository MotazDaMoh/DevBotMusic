import type { Client } from 'discord.js';

import { getManager } from '../../../lib/music.js';

/**
 * Initialise the Lavalink manager once the Discord.js client is ready.
 * Runs before any track-start handlers because CommandKit loads files in
 * lexicographic order — the `01-` prefix enforces that.
 */
export default async function onReady(client: Client<true>): Promise<void> {
  try {
    await getManager(client).init({
      id: client.user.id,
      username: client.user.username,
    });
    console.log(`[lavalink] initialised as ${client.user.tag}`);
  } catch (error) {
    console.error('[lavalink] failed to initialise:', error);
  }
}
