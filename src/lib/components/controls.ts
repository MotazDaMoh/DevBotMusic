import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  type MessageActionRowComponentBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} from 'discord.js';

import { config } from '../config.js';

/**
 * Identifiers used by the "Now Playing" quick controls. These strings also
 * double as interaction `customId`s, so the event handler in
 * `src/app/events/interactionCreate` dispatches on them directly.
 */
export type ControlId =
  | 'skip'
  | 'pause'
  | 'resume'
  | 'stop'
  | 'volume_up'
  | 'volume_down'
  | 'rewind10'
  | 'forward10'
  | 'repeat'
  | 'shuffle';

export interface ControlOption {
  readonly id: ControlId;
  readonly label: string;
  readonly emoji: string;
  readonly description: string;
}

export const SELECT_MENU_CUSTOM_ID = 'musicbot:controls:menu';
export const BUTTON_CUSTOM_ID_PREFIX = 'musicbot:controls:button:';

/**
 * The canonical list of quick-action controls shown on now-playing messages.
 * Extending this list is enough to add new actions — both the select menu and
 * the button grid adapt automatically.
 */
export const CONTROL_OPTIONS: readonly ControlOption[] = [
  {
    id: 'skip',
    label: 'Skip',
    emoji: '⏭️',
    description: 'Play the next track in the queue',
  },
  {
    id: 'pause',
    label: 'Pause',
    emoji: '⏸️',
    description: 'Pause playback',
  },
  {
    id: 'resume',
    label: 'Resume',
    emoji: '▶️',
    description: 'Resume playback',
  },
  {
    id: 'stop',
    label: 'Stop',
    emoji: '⏹️',
    description: 'Stop playback and clear the queue',
  },
  {
    id: 'volume_up',
    label: 'Volume +10%',
    emoji: '🔊',
    description: 'Increase volume by 10%',
  },
  {
    id: 'volume_down',
    label: 'Volume -10%',
    emoji: '🔉',
    description: 'Decrease volume by 10%',
  },
  {
    id: 'rewind10',
    label: 'Rewind 10s',
    emoji: '⏪',
    description: 'Go back 10 seconds',
  },
  {
    id: 'forward10',
    label: 'Forward 10s',
    emoji: '⏩',
    description: 'Skip forward 10 seconds',
  },
  {
    id: 'repeat',
    label: 'Toggle Repeat',
    emoji: '🔁',
    description: 'Cycle between off / track / queue repeat',
  },
  {
    id: 'shuffle',
    label: 'Shuffle',
    emoji: '🔀',
    description: 'Shuffle the queue',
  },
];

function buildMenu(): ActionRowBuilder<MessageActionRowComponentBuilder>[] {
  const menu = new StringSelectMenuBuilder()
    .setCustomId(SELECT_MENU_CUSTOM_ID)
    .setPlaceholder('Select an action…')
    .addOptions(
      CONTROL_OPTIONS.map((option) =>
        new StringSelectMenuOptionBuilder()
          .setLabel(option.label)
          .setValue(option.id)
          .setDescription(option.description)
          .setEmoji(option.emoji),
      ),
    );
  return [
    new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(menu),
  ];
}

function buildButtons(): ActionRowBuilder<MessageActionRowComponentBuilder>[] {
  const buttons = CONTROL_OPTIONS.map((option) =>
    new ButtonBuilder()
      .setCustomId(`${BUTTON_CUSTOM_ID_PREFIX}${option.id}`)
      .setLabel(option.label)
      .setEmoji(option.emoji)
      .setStyle(ButtonStyle.Secondary),
  );

  const rows: ActionRowBuilder<MessageActionRowComponentBuilder>[] = [];
  for (let i = 0; i < buttons.length; i += 5) {
    rows.push(
      new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
        ...buttons.slice(i, i + 5),
      ),
    );
  }
  return rows;
}

/**
 * Build the control action rows (select menu or button grid) according to the
 * configured UI style. Returns an empty array when style is `none`.
 */
export function buildControlRows(): ActionRowBuilder<MessageActionRowComponentBuilder>[] {
  if (config.ui.controlsStyle === 'none') return [];
  return config.ui.controlsStyle === 'menu' ? buildMenu() : buildButtons();
}
