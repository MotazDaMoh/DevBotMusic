import type { Player, Track, UnresolvedTrack, TrackEndEvent } from 'lavalink-client';

type AnyTrack = Track | UnresolvedTrack;

export function handleTrackEnd(
  player: Player,
  track: AnyTrack | null,
  payload: TrackEndEvent | undefined,
): void {
  const reason = payload?.reason ?? 'unknown';
  const title = track?.info.title ?? 'unknown';
  console.log(
    `[music] track ended in ${player.guildId}: "${title}" (${reason})`,
  );
}
