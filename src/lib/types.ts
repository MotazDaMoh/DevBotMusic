import type { Player, Track, UnresolvedTrack } from 'lavalink-client';

export type AnyTrack = Track | UnresolvedTrack;

export interface TrackRequesterData {
  readonly id: string;
  readonly tag: string;
}

export type PlayerWithRequester = Player;
