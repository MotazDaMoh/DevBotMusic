/**
 * Static emoji table used across embeds and controls.
 *
 * Unicode-only — no custom guild emojis are referenced, so the bot works
 * without any external emoji configuration. To swap in custom emojis, replace
 * the `full` field with a Discord custom-emoji string (e.g. `<:name:id>`).
 */

export interface Emoji {
  readonly id: string;
  readonly full: string;
}

export type EmojiKey =
  | 'play'
  | 'pause'
  | 'stop'
  | 'skip'
  | 'previous'
  | 'repeat'
  | 'repeatOne'
  | 'shuffle'
  | 'success'
  | 'error'
  | 'warning'
  | 'info'
  | 'queue'
  | 'music'
  | 'volume'
  | 'volumeDown'
  | 'mute'
  | 'playlist'
  | 'search'
  | 'microphone'
  | 'headphones'
  | 'loading'
  | 'time'
  | 'link'
  | 'person'
  | 'bot'
  | 'settings'
  | 'help'
  | 'forward'
  | 'rewind';

const table: Record<EmojiKey, Emoji> = {
  play: { id: '▶', full: '▶️' },
  pause: { id: '⏸', full: '⏸️' },
  stop: { id: '⏹', full: '⏹️' },
  skip: { id: '⏭', full: '⏭️' },
  previous: { id: '⏮', full: '⏮️' },
  repeat: { id: '🔁', full: '🔁' },
  repeatOne: { id: '🔂', full: '🔂' },
  shuffle: { id: '🔀', full: '🔀' },
  success: { id: '✅', full: '✅' },
  error: { id: '❌', full: '❌' },
  warning: { id: '⚠', full: '⚠️' },
  info: { id: 'ℹ', full: 'ℹ️' },
  queue: { id: '📃', full: '📃' },
  music: { id: '🎵', full: '🎵' },
  volume: { id: '🔊', full: '🔊' },
  volumeDown: { id: '🔉', full: '🔉' },
  mute: { id: '🔇', full: '🔇' },
  playlist: { id: '🎶', full: '🎶' },
  search: { id: '🔍', full: '🔍' },
  microphone: { id: '🎤', full: '🎤' },
  headphones: { id: '🎧', full: '🎧' },
  loading: { id: '🔄', full: '🔄' },
  time: { id: '⏱', full: '⏱️' },
  link: { id: '🔗', full: '🔗' },
  person: { id: '👤', full: '👤' },
  bot: { id: '🤖', full: '🤖' },
  settings: { id: '⚙', full: '⚙️' },
  help: { id: '❓', full: '❓' },
  forward: { id: '⏩', full: '⏩' },
  rewind: { id: '⏪', full: '⏪' },
};

export function getEmoji(key: EmojiKey): Emoji {
  return table[key];
}
