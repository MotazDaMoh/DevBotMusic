import { LavalinkManager } from 'lavalink-client';
import type { Client } from 'discord.js';

import { config } from './config.js';

/**
 * Construct and attach the Lavalink manager for a Discord.js client.
 *
 * The returned manager still needs to be initialised from the `clientReady`
 * event handler (`manager.init({ id, username })`) — exposing the factory
 * here keeps the Discord.js entry point small and lets tests inject a mock
 * client if ever needed.
 */
export function createLavalinkManager(client: Client): LavalinkManager {
  const manager = new LavalinkManager({
    nodes: [
      {
        id: config.lavalink.id,
        host: config.lavalink.host,
        port: config.lavalink.port,
        authorization: config.lavalink.authorization,
        secure: config.lavalink.secure,
      },
    ],
    sendToShard: (guildId, payload) => {
      const guild = client.guilds.cache.get(guildId);
      guild?.shard.send(payload);
    },
    autoSkip: true,
    autoMove: true,
    playerOptions: {
      defaultSearchPlatform: config.ui.defaultSearchSource,
      volumeDecrementer: 0.75,
      clientBasedPositionUpdateInterval: 150,
      onDisconnect: {
        autoReconnect: true,
        destroyPlayer: false,
      },
      onEmptyQueue: {
        destroyAfterMs: 30_000,
      },
    },
    queueOptions: {
      maxPreviousTracks: 25,
    },
  });

  return manager;
}
