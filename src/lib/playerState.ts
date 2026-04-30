/**
 * Per-guild player state used to determine whether the "Now Playing" message
 * should be suppressed during loops.
 *
 * Rules:
 * - When loop: track or loop: queue is active, suppress "Now Playing" on repeats.
 * - When the user adds a song (addSong) and then skips, the next trackStart
 *   MUST send the message regardless of loop state.
 *
 * State is keyed by guild ID and automatically cleaned up on player destroy.
 */

interface GuildPlayerState {
  /** URI of the last track for which we sent a "Now Playing" message. */
  lastAnnouncedTrackUri: string | null;
  /**
   * Set to true when a user manually adds a song while a loop is active.
   * Forces the next trackStart to send a message even during a loop.
   */
  forceNextAnnounce: boolean;
  /**
   * Set to true when the user explicitly triggers a skip.
   * Combined with forceNextAnnounce, this ensures the new track gets announced.
   */
  userSkipped: boolean;
}

const states = new Map<string, GuildPlayerState>();

function ensureState(guildId: string): GuildPlayerState {
  let state = states.get(guildId);
  if (!state) {
    state = {
      lastAnnouncedTrackUri: null,
      forceNextAnnounce: false,
      userSkipped: false,
    };
    states.set(guildId, state);
  }
  return state;
}

/**
 * Determine whether a "Now Playing" message should be sent for the given track.
 *
 * @returns `true` if the message should be sent.
 */
export function shouldAnnounceTrack(
  guildId: string,
  trackUri: string | null | undefined,
  repeatMode: string,
): boolean {
  const state = ensureState(guildId);
  const uri = trackUri ?? null;
  const isLooping = repeatMode === 'track' || repeatMode === 'queue';

  if (!isLooping) {
    state.lastAnnouncedTrackUri = uri;
    state.forceNextAnnounce = false;
    state.userSkipped = false;
    return true;
  }

  // User added a song and then skipped — force announce
  if (state.forceNextAnnounce && state.userSkipped) {
    state.lastAnnouncedTrackUri = uri;
    state.forceNextAnnounce = false;
    state.userSkipped = false;
    return true;
  }

  // Same track repeating in loop — suppress
  if (uri === state.lastAnnouncedTrackUri) {
    state.forceNextAnnounce = false;
    state.userSkipped = false;
    return false;
  }

  // Different track in queue loop — announce (new song in rotation)
  state.lastAnnouncedTrackUri = uri;
  state.forceNextAnnounce = false;
  state.userSkipped = false;
  return true;
}

/** Mark that a song was added while a loop was active. */
export function markSongAdded(guildId: string): void {
  ensureState(guildId).forceNextAnnounce = true;
}

/** Mark that the user explicitly triggered a skip. */
export function markUserSkip(guildId: string): void {
  ensureState(guildId).userSkipped = true;
}

/** Clean up state for a destroyed player. */
export function clearPlayerState(guildId: string): void {
  states.delete(guildId);
}
