import type { Client } from 'discord.js';
import type { LavalinkManager } from 'lavalink-client';

import { getManager } from '../../../lib/music.js';

type RawPayload = Parameters<LavalinkManager['sendRawData']>[0];

/**
 * Forward voice-state and voice-server updates from discord.js's raw event
 * stream into Lavalink. Without this the Lavalink node never learns about the
 * bot joining a voice channel and no audio is played.
 *
 * discord.js emits `raw` with `(packet, shardId)`, and CommandKit v1 appends
 * the client as the next argument, so the real handler signature is
 * `(packet, shardId, client)`. The `_shardId` slot must be present even if
 * unused — otherwise `client` here is bound to the numeric shard id and any
 * attempt to read a property off it (e.g. inside `getManager`) crashes.
 */
export default async function onRaw(
  payload: unknown,
  _shardId: number,
  client: Client<true>,
): Promise<void> {
  await getManager(client).sendRawData(payload as RawPayload);
}
