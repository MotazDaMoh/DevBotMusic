import type { ContainerBuilder } from 'discord.js';

import { getEmoji } from './emojis.js';
import { RichMessage } from './components/richMessage.js';

/**
 * Consolidated helpers for constructing status/error messages.
 *
 * Error and warning containers omit titles for a cleaner UI — the emoji prefix
 * on the body text is sufficient context. Success containers for short messages
 * also skip titles and send the body directly.
 */

export function errorContainer(message: string): ContainerBuilder {
  const icon = getEmoji('error').full;
  return new RichMessage().addText(`${icon} ${message}`).build();
}

export function warningContainer(message: string): ContainerBuilder {
  const icon = getEmoji('warning').full;
  return new RichMessage().addText(`${icon} ${message}`).build();
}

export function successContainer(
  titleOrBody: string,
  body?: string,
): ContainerBuilder {
  const icon = getEmoji('success').full;
  if (!body || !body.trim()) {
    return new RichMessage().addText(`${icon} ${titleOrBody}`).build();
  }
  const builder = new RichMessage().setTitle(`${icon} ${titleOrBody}`);
  builder.addText(body.trim());
  return builder.build();
}

export function infoContainer(title: string, body?: string): ContainerBuilder {
  const builder = new RichMessage().setTitle(title);
  if (body && body.trim()) builder.addText(body.trim());
  return builder.build();
}
