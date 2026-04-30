# MusicBot-V2

A TypeScript Discord music bot powered by [Lavalink](https://lavalink.dev/) and
[CommandKit v1](https://commandkit.dev/).

## Stack

- **Language:** TypeScript 5 (strict mode)
- **Runtime:** Node.js 24+
- **Discord client:** discord.js 14 (Components V2 + Embeds)
- **Command/event framework:** CommandKit 1.2
- **Audio:** Lavalink 4 via `lavalink-client`
- **Canvas / Cards:** `@napi-rs/canvas` (progress bar) + `musicard` (visual music cards)

## Project layout

```
src/
├── app.ts                         # entry point (exports the Discord client)
├── app/
│   ├── commands/                  # CommandKit v1 commands (auto-discovered)
│   └── events/
│       ├── clientReady/           # bot init + Lavalink setup
│       ├── interactionCreate/     # button/menu controls handler
│       ├── lavalink/              # dedicated Lavalink event handlers
│       │   ├── trackStart/        # now-playing message logic
│       │   ├── trackEnd/          # end-of-track logging
│       │   ├── trackError/        # error notification
│       │   ├── queueEnd/          # empty-queue notice
│       │   └── playerDestroy/     # cleanup on disconnect
│       └── raw/                   # voice-state forwarding to Lavalink
└── lib/
    ├── canvas/                    # @napi-rs/canvas progress bar
    ├── cards/                     # musicard-based visual cards
    ├── components/                # RichMessage builder + control rows
    ├── config.ts                  # env-based configuration
    ├── playerState.ts             # per-guild loop/skip state tracker
    └── …                          # emojis, text helpers, cooldown, etc.
```

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env` and fill in at least `DISCORD_TOKEN` plus the
   `LAVALINK_*` values for your Lavalink node.

3. Start a local Lavalink v4 server (separate Java process). See
   https://lavalink.dev/getting-started/index.html.

4. Run the bot:

   ```bash
   npm run dev      # development with HMR
   npm run build    # production build to dist/
   npm run start    # run the built bot
   npm run typecheck
   ```

## Configuration reference

All configuration is loaded from environment variables — nothing is ever read
from a committed config file. See [`.env.example`](./.env.example) for the
complete list.

| Variable | Default | Purpose |
| --- | --- | --- |
| `DISCORD_TOKEN` | _required_ | Bot token |
| `DISCORD_CLIENT_ID` | _optional_ | Application ID (auto-detected otherwise) |
| `LAVALINK_HOST` | `localhost` | Lavalink node host |
| `LAVALINK_PORT` | `2333` | Lavalink node port |
| `LAVALINK_PASSWORD` | `youshallnotpass` | Lavalink auth |
| `LAVALINK_SECURE` | `false` | Use wss/https to reach Lavalink |
| `LAVALINK_ID` | `main` | Lavalink node identifier |
| `STYLE_CONTROLS` | `menu` | `menu`, `button`, or `none` for now-playing controls |
| `MESSAGE_STYLE` | `components_v2` | `components_v2` (Discord Components V2) or `cards` (musicard + Embeds) |
| `DEFAULT_SEARCH_SOURCE` | `ytsearch` | Default Lavalink search source |

## Dual-mode message rendering

The bot supports two rendering modes for track-related messages, selected via
the `MESSAGE_STYLE` environment variable:

- **`components_v2`** (default): Uses Discord's Components V2 API with
  `ContainerBuilder`, `TextDisplayBuilder`, and action rows.
- **`cards`**: Renders visual music cards using the `musicard` library with
  `EmbedBuilder` for rich metadata. Three card variants are generated:
  - **playSong** — full card without progress bar (on `trackStart`)
  - **addSong** — compact card design (when a song is queued)
  - **nowPlaying** — card with progress bar (via `/nowplaying` command)

## Smart loop messaging

The `trackStart` handler suppresses redundant "Now Playing" messages when loop
mode (`track` or `queue`) is active. The message is only sent when:

- Loop is off (every new track is announced).
- A different track starts during queue loop.
- The user adds a song while looping **and then skips** — the next track is
  always announced to confirm the content change.

## Notes on the modernisation

- All code was migrated from JavaScript to strict TypeScript.
- The previous `distube` / `youtubei` audio stack was removed entirely and
  replaced with a single centralised Lavalink manager (`src/lib/lavalink.ts`).
- CommandKit v0's class-based commands were rewritten to v1's export-based
  modules (`command`, `chatInput`, `options`) with auto-discovery from
  `src/app/**`.
- Every Discord-facing string is English and every log line uses a consistent
  bracketed prefix (e.g. `[lavalink]`, `[controls]`).
- Orphaned v0 buttons/menus were reimplemented as real interaction handlers in
  `src/app/events/interactionCreate/controls.ts`.
- Lavalink events are organized into dedicated handler files under
  `src/app/events/lavalink/<eventName>/handler.ts`.
