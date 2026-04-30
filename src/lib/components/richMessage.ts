import {
  ActionRowBuilder,
  ContainerBuilder,
  FileBuilder,
  type MessageActionRowComponentBuilder,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
  SectionBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  TextDisplayBuilder,
  ThumbnailBuilder,
} from 'discord.js';

export interface ThumbnailSpec {
  url: string;
  description?: string;
}

export interface GalleryItemSpec {
  url: string;
  description?: string;
  spoiler?: boolean;
}

export interface SectionSpec {
  text?: string;
  thumbnail?: ThumbnailSpec | null;
  showLine?: boolean;
}

/**
 * Fluent builder for Components V2 message payloads.
 *
 * Wraps the lower-level discord.js builders in a chainable API so feature code
 * can compose containers without knowing the exact component hierarchy.
 */
export class RichMessage {
  readonly #container: ContainerBuilder;

  constructor() {
    this.#container = new ContainerBuilder();
  }

  setTitle(title: string): this {
    if (!title.trim()) {
      throw new TypeError('Title must be a non-empty string.');
    }
    const text = new TextDisplayBuilder().setContent(title.trim());
    this.#container.addTextDisplayComponents(text);
    return this;
  }

  addText(text: string | readonly string[]): this {
    const entries = Array.isArray(text) ? text : [text as string];
    for (const entry of entries) {
      if (typeof entry !== 'string' || !entry.trim()) continue;
      const display = new TextDisplayBuilder().setContent(entry.trim());
      this.#container.addTextDisplayComponents(display);
    }
    return this;
  }

  addSection(text: string | readonly string[], thumbnail: ThumbnailSpec): this {
    const entries = Array.isArray(text) ? text : [text as string];
    const section = new SectionBuilder();
    for (const entry of entries) {
      if (typeof entry !== 'string' || !entry.trim()) continue;
      section.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(entry.trim()),
      );
    }
    section.setThumbnailAccessory(
      new ThumbnailBuilder()
        .setURL(thumbnail.url)
        .setDescription(thumbnail.description ?? ''),
    );
    this.#container.addSectionComponents(section);
    return this;
  }

  addSeparator(size: SeparatorSpacingSize = SeparatorSpacingSize.Small): this {
    this.#container.addSeparatorComponents(
      new SeparatorBuilder().setSpacing(size),
    );
    return this;
  }

  addGallery(items: readonly GalleryItemSpec[]): this {
    if (items.length === 0) return this;
    const builders = items
      .filter((item) => !!item?.url)
      .map((item) =>
        new MediaGalleryItemBuilder()
          .setURL(item.url)
          .setDescription(
            typeof item.description === 'string' ? item.description : '\u200B',
          )
          .setSpoiler(Boolean(item.spoiler)),
      );
    if (builders.length === 0) return this;
    this.#container.addMediaGalleryComponents(
      new MediaGalleryBuilder().addItems(...builders),
    );
    return this;
  }

  addFile(file: { url: string }): this {
    this.#container.addFileComponents(new FileBuilder().setURL(file.url));
    return this;
  }

  addActionRow(
    components: readonly MessageActionRowComponentBuilder[],
  ): this {
    if (components.length === 0) return this;
    for (let i = 0; i < components.length; i += 5) {
      const chunk = components.slice(i, i + 5);
      const row =
        new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
          ...chunk,
        );
      this.#container.addActionRowComponents(row);
    }
    return this;
  }

  /**
   * Bulk-add section-like blocks with optional separators between them.
   * Retained for backwards compatibility with the v0 bot's call sites.
   */
  addSections(sections: readonly SectionSpec[]): this {
    for (const section of sections) {
      if (section.thumbnail?.url) {
        this.addSection(section.text ?? '', section.thumbnail);
      } else if (section.text && section.text.trim()) {
        this.addText(section.text);
      }
      if (section.showLine) this.addSeparator();
    }
    return this;
  }

  build(): ContainerBuilder {
    return this.#container;
  }
}
