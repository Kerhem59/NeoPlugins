const { ContainerBuilder, TextDisplayBuilder, MediaGalleryBuilder, MediaGalleryItemBuilder } = require('@discordjs/builders');

class ContainerHelper {
  /**
   * EmbedBuilder veya Embed Data nesnesini ContainerBuilder yapısına çevirir.
   */
  static fromEmbed(embed) {
    const container = new ContainerBuilder();
    const data = embed.data || embed; // Destek için

    if (data.color) {
      container.setAccentColor(data.color);
    }

    let textContent = '';

    if (data.title) {
      textContent += `### ${data.title}\n\n`;
    }
    
    if (data.description) {
      textContent += `${data.description}\n`;
    }

    if (data.fields && data.fields.length > 0) {
      textContent += '\n';
      for (const field of data.fields) {
        if (field.name) {
          textContent += `**${field.name}**\n${field.value}\n\n`;
        }
      }
    }

    if (textContent.trim().length > 0) {
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(textContent.trim())
      );
    }

    if (data.image && data.image.url) {
      container.addMediaGalleryComponents(
        new MediaGalleryBuilder().addItems(
          new MediaGalleryItemBuilder().setURL(data.image.url)
        )
      );
    } else if (data.thumbnail && data.thumbnail.url) {
      container.addMediaGalleryComponents(
        new MediaGalleryBuilder().addItems(
          new MediaGalleryItemBuilder().setURL(data.thumbnail.url)
        )
      );
    }

    if (data.footer && data.footer.text) {
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`-# ⬢ ${data.footer.text}`)
      );
    }

    return container;
  }

  /**
   * Mevcut components array'ini (butonlar vb) Container'a ekler
   */
  static addActionRowsToContainer(container, actionRows) {
    if (!actionRows || actionRows.length === 0) return container;
    
    for (const row of actionRows) {
      container.addActionRowComponents(row);
    }
    return container;
  }
}

module.exports = ContainerHelper;
