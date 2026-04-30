import type { Player } from 'lavalink-client';

import { clearPlayerState } from '../../../../lib/playerState.js';

export function handlePlayerDestroy(
  player: Player,
  reason: string | undefined,
): void {
  console.log(
    `[music] player destroyed in ${player.guildId} (${reason ?? 'no reason'})`,
  );
  clearPlayerState(player.guildId);
}
