import type { ContainerBuilder } from 'discord.js';

import { getEmoji } from './emojis.js';
import { RichMessage } from './components/richMessage.js';

/**
 * Consolidated helpers for constructing the small status/error embeds that
 * every command sends. Centralising these avoids the ~10 nearly-identical
 * RichMessage blocks that existed in the v0 codebase.
 */

export function errorContainer(message: string): ContainerBuilder {
  const icon = getEmoji('error').full;
  return new RichMessage()
    .setTitle(`${icon} Error`)
    .addText(`${icon} ${message}`)
    .build();
}

export function warningContainer(message: string): ContainerBuilder {
  const icon = getEmoji('warning').full;
  return new RichMessage()
    .setTitle(`${icon} Warning`)
    .addText(`${icon} ${message}`)
    .build();
}

export function successContainer(
  title: string,
  body?: string,
): ContainerBuilder {
  const icon = getEmoji('success').full;
  const builder = new RichMessage().setTitle(`${icon} ${title}`);
  if (body && body.trim()) builder.addText(body.trim());
  return builder.build();
}

export function infoContainer(title: string, body?: string): ContainerBuilder {
  const builder = new RichMessage().setTitle(title);
  if (body && body.trim()) builder.addText(body.trim());
  return builder.build();
}
