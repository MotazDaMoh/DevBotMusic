import { stopMiddlewares, type MiddlewareContext } from 'commandkit';
import { MessageFlags } from 'discord.js';

import { applyCooldown } from '../../lib/cooldown.js';
import { errorContainer } from '../../lib/responses.js';
import type { CommandOptions } from './_types.js';

/**
 * Global middleware that runs before every command. It centralises three
 * cross-cutting concerns that previously lived in bespoke validation files:
 *
 *   - per-user / per-command cooldown
 *   - "must be in voice" check
 *   - "must share voice channel with bot" check
 *
 * Commands opt into the voice checks by exporting an `options` object with
 * `inVoice` / `sameVoice` booleans (see `src/app/commands/_types.ts`).
 */
export async function beforeExecute(ctx: MiddlewareContext): Promise<void> {
  if (!ctx.isChatInputCommand() && !ctx.isAutocomplete()) return;

  const interaction = ctx.interaction;
  if (!interaction.inCachedGuild()) return;

  const options = extractCommandOptions(ctx);

  if (ctx.isChatInputCommand()) {
    const cooldown = applyCooldown(interaction.user.id, ctx.commandName);
    if (cooldown > 0) {
      await replyError(ctx, `You're on cooldown — try again in ${cooldown}s.`);
      stopMiddlewares();
    }
  }

  if (ctx.isAutocomplete()) return;

  if (options.inVoice) {
    const memberChannel = interaction.member.voice.channelId;
    if (!memberChannel) {
      await replyError(ctx, 'You must be in a voice channel to use this command.');
      stopMiddlewares();
    }
  }

  if (options.sameVoice) {
    const botChannel = interaction.guild.members.me?.voice.channelId ?? null;
    const memberChannel = interaction.member.voice.channelId;
    if (botChannel && memberChannel && botChannel !== memberChannel) {
      await replyError(ctx, 'You must be in the same voice channel as the bot.');
      stopMiddlewares();
    }
  }
}

function extractCommandOptions(ctx: MiddlewareContext): CommandOptions {
  const mod = ctx.command.data.command as Record<string, unknown> | undefined;
  const raw = mod && typeof mod === 'object' ? mod.options : undefined;
  if (!raw || typeof raw !== 'object') return {};
  return raw as CommandOptions;
}

async function replyError(
  ctx: MiddlewareContext,
  message: string,
): Promise<void> {
  if (!ctx.isChatInputCommand()) return;
  const interaction = ctx.interaction;
  const payload = {
    components: [errorContainer(message)],
    flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
  } as const;
  if (interaction.deferred || interaction.replied) {
    await interaction.editReply({ components: payload.components });
    return;
  }
  await interaction.reply(payload);
}
