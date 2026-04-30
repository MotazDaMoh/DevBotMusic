import { Client, GatewayIntentBits } from 'discord.js';

import { config } from './lib/config.js';

/**
 * Entry point for the CommandKit v1 runtime.
 *
 * CommandKit discovers commands, events, and middleware from `src/app/*` and
 * drives the login lifecycle, so this file just needs to configure and export
 * the Discord.js client.
 *
 * The Lavalink manager is intentionally NOT attached here via a module-load
 * side-effect: CommandKit v1 wraps `setClient` in a proxy and bundles the
 * entry through rolldown, so the effect can run against a different Client
 * instance (or be dropped entirely) than the one driving events. Instead,
 * `getManager(client)` in `src/lib/music.ts` lazily constructs the manager
 * the first time any handler asks for it (typically from the `raw` event or
 * the `clientReady` init hook).
 */
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.token = config.discord.token;

export default client;
