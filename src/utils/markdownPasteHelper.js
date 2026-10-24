/**
 * markdownPasteHelper.js
 * 
 * Handles rich copy-paste into Markdown textareas:
 * 1. Converts rich HTML (from Microsoft Word, PDFs, Google Docs, Web) into clean Markdown.
 * 2. Preserves bold formatting (**text**), headings (###), bullet points, and tables.
 * 3. Preserves mathematical symbols and Greek letters (e.g., ϕ, θ, Δ, °, etc.).
 * 4. Intercepts pasted image files/screenshots and converts them into inline Markdown images:
 *    ![Figure Diagram](data:image/png;base64,...)
 */

/**
 * Normalizes Greek and mathematical symbols copied from Word/PDFs.
 */
export const normalizeMathSymbols = (text) => {
  if (!text) return "";
  return text
    // Replace Word curly quotes
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    // Standardize Greek phi symbols: U+03D5 (ϕ) and U+03C6 (φ)
    // Both are valid Greek, but ensure consistency
    .replace(/\u03C6/g, "ϕ")
    // Replace non-breaking spaces
    .replace(/\u00A0/g, " ")
    // Replace zero-width spaces
    .replace(/[\u200B\u200C\u200D\uFEFF]/g, "")
    // Standardize bullet points
    .replace(/[•\u2022\u25E6\u2023\u2043]/g, "•");
};

/**
 * Converts a DOM node into Markdown string recursively.
 */
function nodeToMarkdown(node) {
  if (!node) return "";

  // Text node
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent;
  }

  // Not an element node
  if (node.nodeType !== Node.ELEMENT_NODE) {
    return "";
  }

  const tag = node.tagName.toLowerCase();

  // Ignore scripts, styles, XML metadata, and Word comments
  if (
    tag === "script" ||
    tag === "style" ||
    tag === "xml" ||
    tag === "meta" ||
    tag === "link"
  ) {
    return "";
  }

  // Check inline styles for bold and italic (common in Word HTML)
  const style = node.getAttribute("style") || "";
  const isBoldStyle =
    /font-weight\s*:\s*(bold|[7-9]00)/i.test(style) ||
    tag === "b" ||
    tag === "strong";
  const isItalicStyle =
    /font-style\s*:\s*italic/i.test(style) ||
    tag === "i" ||
    tag === "em";

  // Recursively process children
  let childrenText = "";
  for (let child of node.childNodes) {
    childrenText += nodeToMarkdown(child);
  }

  // Formatting based on HTML tag
  switch (tag) {
    case "h1":
      return `\n\n# ${childrenText.trim()}\n\n`;
    case "h2":
      return `\n\n## ${childrenText.trim()}\n\n`;
    case "h3":
      return `\n\n### ${childrenText.trim()}\n\n`;
    case "h4":
    case "h5":
    case "h6":
      return `\n\n#### ${childrenText.trim()}\n\n`;

    case "p":
    case "div": {
      const trimmed = childrenText.trim();
      if (!trimmed) return "";
      // Check if the entire paragraph was bolded (often used as heading in Word)
      if (isBoldStyle && !trimmed.startsWith("**") && !trimmed.endsWith("**")) {
        return `\n\n**${trimmed}**\n\n`;
      }
      return `\n\n${trimmed}\n\n`;
    }

    case "b":
    case "strong": {
      const trimmed = childrenText.trim();
      if (!trimmed) return "";
      return `**${trimmed}**`;
    }

    case "i":
    case "em": {
      const trimmed = childrenText.trim();
      if (!trimmed) return "";
      return `*${trimmed}*`;
    }

    case "u": {
      return childrenText;
    }

    case "code":
      return `\`${childrenText}\``;

    case "pre":
      return `\n\n\`\`\`\n${childrenText.trim()}\n\`\`\`\n\n`;

    case "blockquote":
      return `\n\n> ${childrenText.trim().replace(/\n/g, "\n> ")}\n\n`;

    case "ul":
      return `\n${childrenText}\n`;

    case "ol":
      return `\n${childrenText}\n`;

    case "li": {
      const trimmed = childrenText.trim();
      if (!trimmed) return "";
      const isOrdered = node.parentElement && node.parentElement.tagName.toLowerCase() === "ol";
      if (isOrdered) {
        // Find index among sibling li elements
        let idx = 1;
        let prev = node.previousElementSibling;
        while (prev) {
          if (prev.tagName.toLowerCase() === "li") idx++;
          prev = prev.previousElementSibling;
        }
        return `${idx}. ${trimmed}\n`;
      }
      return `- ${trimmed}\n`;
    }

    case "br":
      return "\n";

    case "img": {
      const src = node.getAttribute("src") || "";
      const alt = node.getAttribute("alt") || "Diagram";
      if (src) {
        return `\n\n![${alt}](${src})\n\n`;
      }
      return "";
    }

    case "table": {
      // Process table into Markdown format
      return formatTableToMarkdown(node);
    }

    default:
      if (isBoldStyle) {
        const trimmed = childrenText.trim();
        if (trimmed && !trimmed.startsWith("**") && !trimmed.endsWith("**")) {
          return `**${trimmed}**`;
        }
      }
      if (isItalicStyle) {
        const trimmed = childrenText.trim();
        if (trimmed && !trimmed.startsWith("*") && !trimmed.endsWith("*")) {
          return `*${trimmed}*`;
        }
      }
      return childrenText;
  }
}

/**
 * Converts a table element into clean GFM Markdown table.
 */
function formatTableToMarkdown(tableNode) {
  const rows = tableNode.querySelectorAll("tr");
  if (!rows || rows.length === 0) return "";

  let md = "\n\n";
  let colCount = 0;

  rows.forEach((row, rowIdx) => {
    const cells = row.querySelectorAll("th, td");
    if (cells.length === 0) return;

    if (rowIdx === 0) {
      colCount = cells.length;
    }

    const cellTexts = Array.from(cells).map((c) =>
      nodeToMarkdown(c).replace(/\n+/g, " ").replace(/\|/g, "\\|").trim()
    );

    md += `| ${cellTexts.join(" | ")} |\n`;

    if (rowIdx === 0) {
      md += `| ${Array(colCount).fill("---").join(" | ")} |\n`;
    }
  });

  return md + "\n";
}

/**
 * Converts rich HTML from the clipboard into Markdown.
 */
export const htmlToMarkdown = (htmlString) => {
  if (!htmlString || typeof htmlString !== "string") return "";

  try {
    // Clean Word HTML comments
    const cleanedHtml = htmlString
      .replace(/<!--[\s\S]*?-->/g, "")
      .replace(/<!\[[\s\S]*?\]>/g, "");

    const parser = new DOMParser();
    const doc = parser.parseFromString(cleanedHtml, "text/html");
    const body = doc.body;

    let md = nodeToMarkdown(body);

    // Clean up excessive blank lines
    md = md.replace(/\n{3,}/g, "\n\n").trim();

    return normalizeMathSymbols(md);
  } catch (err) {
    console.warn("Failed to parse HTML to Markdown:", err);
    return "";
  }
};

/**
 * Formats plain text if no HTML was available (e.g. from notepad or raw PDF copy).
 * Detects headers and bullet points.
 */
export const formatPlainTextWithBullets = (text) => {
  if (!text) return "";
  let formatted = normalizeMathSymbols(text);

  // Convert bullet symbols to Markdown bullets
  formatted = formatted.replace(/^[ \t]*[•\⁃\◦\▪\▫\–][ \t]+/gm, "- ");

  // Ensure bold headers on lines ending with colon or bullet headers e.g. "• Dynamic stability:" -> "- **Dynamic stability:**"
  formatted = formatted.replace(
    /^[ \t]*-\s*([A-Za-z0-9\s,/\-()]{3,60}:)/gm,
    "- **$1**"
  );

  return formatted;
};

/**
 * Inserts text at the current cursor position of a textarea.
 */
export const insertAtCursor = (textarea, textToInsert, currentText, setText) => {
  if (!textarea) {
    setText((prev) => (prev ? prev + "\n\n" + textToInsert : textToInsert));
    return;
  }

  const start = textarea.selectionStart || 0;
  const end = textarea.selectionEnd || 0;
  const before = currentText.substring(0, start);
  const after = currentText.substring(end);

  const newText = before + textToInsert + after;
  setText(newText);

  // Restore cursor position right after the inserted text
  setTimeout(() => {
    textarea.focus();
    const newPos = start + textToInsert.length;
    textarea.setSelectionRange(newPos, newPos);
  }, 10);
};

/**
 * Reads an image file as a Base64 Data URL.
 */
export const readImageAsBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
};

/**
 * Main onPaste event handler for Markdown textareas.
 * Handles both rich formatted text and clipboard images.
 */
export const handleSmartPaste = async (e, currentText, setText, textareaRef) => {
  const clipboardData = e.clipboardData || window.clipboardData;
  if (!clipboardData) return;

  const textarea = textareaRef?.current || e.target;

  // 1. Check for Image Files in clipboard (e.g. screenshots, copied diagrams)
  const items = clipboardData.items;
  let imageFile = null;

  if (items) {
    for (let i = 0; i < items.length; i++) {
      if (items[i].type && items[i].type.startsWith("image/")) {
        imageFile = items[i].getAsFile();
        break;
      }
    }
  }

  if (!imageFile && clipboardData.files && clipboardData.files.length > 0) {
    for (let i = 0; i < clipboardData.files.length; i++) {
      if (clipboardData.files[i].type && clipboardData.files[i].type.startsWith("image/")) {
        imageFile = clipboardData.files[i];
        break;
      }
    }
  }

  // If an image was pasted, convert to Base64 Markdown image and insert!
  if (imageFile) {
    e.preventDefault();
    try {
      const base64Data = await readImageAsBase64(imageFile);
      const diagramName = imageFile.name ? imageFile.name.replace(/\.[^/.]+$/, "") : "Diagram";
      const imageMarkdown = `\n\n![${diagramName}](${base64Data})\n\n`;
      insertAtCursor(textarea, imageMarkdown, currentText, setText);
      return;
    } catch (err) {
      console.error("Failed to read pasted image:", err);
    }
  }

  // 2. Check for Rich HTML from Word / PDF / Web
  const html = clipboardData.getData("text/html");
  if (html && html.trim().length > 0) {
    const markdown = htmlToMarkdown(html);
    if (markdown && markdown.length > 0) {
      e.preventDefault();
      insertAtCursor(textarea, markdown, currentText, setText);
      return;
    }
  }

  // 3. Fallback: Plain text with symbol normalization and bullet support
  const plainText = clipboardData.getData("text/plain");
  if (plainText) {
    const formatted = formatPlainTextWithBullets(plainText);
    if (formatted !== plainText) {
      e.preventDefault();
      insertAtCursor(textarea, formatted, currentText, setText);
      return;
    }
  }
};
