import type {
  Client,
  GuildMember,
  TextBasedChannel,
  VoiceBasedChannel,
} from 'discord.js';
import type {
  LavalinkManager,
  Player,
  Track,
  UnresolvedTrack,
} from 'lavalink-client';

import { createLavalinkManager } from './lavalink.js';

/**
 * Lightweight helpers that hide the verbose Lavalink client/player shape from
 * command handlers. All command files use these so swapping player libraries
 * or tweaking queue semantics only requires changing this file.
 *
 * We intentionally avoid module augmentation of `discord.js.Client`:
 * the library ships dual CJS (`index.d.ts`) and ESM (`index.d.mts`) type
 * bundles which TypeScript considers structurally distinct (separate private
 * `actions` slots), so an augmentation applied to one variant fails to flow
 * through the other and every call site ends up with a type error.
 *
 * Instead, every caller goes through {@link getManager} which lazily
 * constructs the Lavalink manager on first use and stashes it on the client.
 * Relying on a module-load side-effect from `src/app.ts` is fragile because
 * CommandKit v1's bundler can evaluate the entry module in a separate
 * graph from the event/command handlers, so the manager ends up attached to
 * a different Client instance than the one CommandKit drives.
 */

const MANAGER_KEY = '__musicbotLavalink' as const;
type ClientWithManager = { readonly [MANAGER_KEY]?: LavalinkManager };

function assertClient(value: unknown): asserts value is Client {
  if (typeof value !== 'object' || value === null) {
    throw new TypeError(
      `Expected a discord.js Client, received ${typeof value} (${String(value)}). ` +
        'This usually means an event handler is missing a positional argument — ' +
        "e.g. discord.js emits `raw` with `(packet, shardId)` so the handler " +
        "signature must be `(packet, shardId, client)`.",
    );
  }
}

export function attachManager(client: Client, manager: LavalinkManager): void {
  assertClient(client);
  (client as unknown as { [MANAGER_KEY]: LavalinkManager })[MANAGER_KEY] = manager;
}

export function getManager(client: Client): LavalinkManager {
  assertClient(client);
  const existing = (client as unknown as ClientWithManager)[MANAGER_KEY];
  if (existing) return existing;
  const manager = createLavalinkManager(client);
  attachManager(client, manager);
  return manager;
}

export function getOrCreatePlayer(
  client: Client,
  member: GuildMember,
  textChannel: TextBasedChannel | null,
): Player | null {
  const voiceChannel = member.voice.channel as VoiceBasedChannel | null;
  if (!voiceChannel) return null;

  const manager = getManager(client);
  const existing = manager.getPlayer(voiceChannel.guildId);
  if (existing) return existing;

  return manager.createPlayer({
    guildId: voiceChannel.guildId,
    voiceChannelId: voiceChannel.id,
    textChannelId: textChannel?.id ?? voiceChannel.id,
    selfDeaf: true,
  });
}

export function getPlayer(client: Client, guildId: string): Player | null {
  return getManager(client).getPlayer(guildId) ?? null;
}

export function formatTrackName(track: Track | UnresolvedTrack | null): string {
  if (!track) return 'Unknown';
  return track.info.title ?? 'Unknown';
}

export function trackDurationSeconds(
  track: Track | UnresolvedTrack | null,
): number {
  if (!track) return 0;
  return Math.max(0, Math.floor((track.info.duration ?? 0) / 1000));
}

export type RepeatMode = Player['repeatMode'];
