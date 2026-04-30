import 'dotenv/config';

/**
 * Centralized application configuration sourced from environment variables.
 *
 * Secrets (Discord token, Lavalink password, etc.) are intentionally loaded
 * from `process.env` so they never end up in the repository.
 */

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function optionalEnv(name: string, fallback: string): string {
  const value = process.env[name];
  return value && value.length > 0 ? value : fallback;
}

function optionalBoolEnv(name: string, fallback: boolean): boolean {
  const value = process.env[name];
  if (value === undefined) return fallback;
  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
}

export type ControlsStyle = 'menu' | 'button' | 'none';
export type MessageStyle = 'components_v2' | 'cards';
export type SearchSource =
  | 'ytsearch'
  | 'ytmsearch'
  | 'spsearch'
  | 'scsearch'
  | 'dzsearch'
  | 'amsearch';

function parseControlsStyle(raw: string): ControlsStyle {
  const normalized = raw.toLowerCase();
  if (normalized === 'menu' || normalized === 'button' || normalized === 'none')
    return normalized;
  return 'menu';
}

function parseMessageStyle(raw: string): MessageStyle {
  const normalized = raw.toLowerCase();
  if (normalized === 'cards') return 'cards';
  return 'components_v2';
}

function parseSearchSource(raw: string): SearchSource {
  const allowed: readonly SearchSource[] = [
    'ytsearch',
    'ytmsearch',
    'spsearch',
    'scsearch',
    'dzsearch',
    'amsearch',
  ];
  const normalized = raw.toLowerCase() as SearchSource;
  return allowed.includes(normalized) ? normalized : 'ytsearch';
}

export const config = {
  discord: {
    token: requireEnv('DISCORD_TOKEN'),
    clientId: process.env.DISCORD_CLIENT_ID ?? null,
  },
  lavalink: {
    host: optionalEnv('LAVALINK_HOST', 'localhost'),
    port: Number.parseInt(optionalEnv('LAVALINK_PORT', '2333'), 10),
    authorization: optionalEnv('LAVALINK_PASSWORD', 'youshallnotpass'),
    secure: optionalBoolEnv('LAVALINK_SECURE', false),
    id: optionalEnv('LAVALINK_ID', 'main'),
  },
  ui: {
    controlsStyle: parseControlsStyle(optionalEnv('STYLE_CONTROLS', 'menu')),
    messageStyle: parseMessageStyle(
      optionalEnv('MESSAGE_STYLE', 'components_v2'),
    ),
    defaultSearchSource: parseSearchSource(
      optionalEnv('DEFAULT_SEARCH_SOURCE', 'ytsearch'),
    ),
  },
} as const;

export type AppConfig = typeof config;
