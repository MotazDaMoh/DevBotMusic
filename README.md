# MusicBot-V2

A TypeScript Discord music bot powered by [Lavalink](https://lavalink.dev/) and
[CommandKit v1](https://commandkit.dev/).

## Stack

- **Language:** TypeScript 5 (strict mode)
- **Runtime:** Node.js 24+
- **Discord client:** discord.js 14 (Components V2)
- **Command/event framework:** CommandKit 1.2
- **Audio:** Lavalink 4 via `lavalink-client`
- **Canvas:** `@napi-rs/canvas` (now-playing progress bar)

## Project layout

```
src/
├── app.ts                 # entry point (exports the Discord client)
├── app/
│   ├── commands/          # CommandKit v1 commands (auto-discovered)
│   └── events/            # CommandKit v1 event handlers
└── lib/                   # shared utilities (config, music, canvas, …)
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
| `STYLE_CONTROLS` | `menu` | `menu` or `button` for now-playing controls |
| `DEFAULT_SEARCH_SOURCE` | `ytsearch` | Default Lavalink search source |

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
