import type { PermissionResolvable } from 'discord.js';

/**
 * Extra command-level metadata consumed by `+global-middleware.ts`.
 *
 * Commands opt in by exporting an `options` constant alongside their `command`
 * data. The shape is deliberately small — voice gating and permission hints
 * only — and falls back to sensible defaults (no gating) when a command omits
 * it.
 */
export interface CommandOptions {
  readonly inVoice?: boolean;
  readonly sameVoice?: boolean;
  readonly botPermissions?: readonly PermissionResolvable[];
  readonly userPermissions?: readonly PermissionResolvable[];
}
