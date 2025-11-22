import { CleanerResponse } from "../types";

// Recursive function to convert HTML to Markdown (De-Para)
function traverse(node: Node): string {
  // Handle text nodes
  if (node.nodeType === Node.TEXT_NODE) {
    // Normalize whitespace but keep single spaces
    return node.textContent?.replace(/[\n\r\t]+/g, ' ') || '';
  }
  
  if (node.nodeType !== Node.ELEMENT_NODE) {
    return '';
  }

  const el = node as HTMLElement;
  const tag = el.tagName.toLowerCase();
  
  // Process children
  let content = '';
  el.childNodes.forEach(child => {
    content += traverse(child);
  });
  
  // Mapping Logic (De-Para)
  switch (tag) {
    // Headings
    case 'h1': return `\n\n# ${content.trim()}\n\n`;
    case 'h2': return `\n\n## ${content.trim()}\n\n`;
    case 'h3': return `\n\n### ${content.trim()}\n\n`;
    case 'h4': return `\n\n#### ${content.trim()}\n\n`;
    case 'h5': return `\n\n##### ${content.trim()}\n\n`;
    case 'h6': return `\n\n###### ${content.trim()}\n\n`;
    
    // Blocks
    case 'p': return `\n\n${content.trim()}\n\n`;
    case 'div': 
    case 'section':
    case 'article':
    case 'main':
    case 'header': 
      return `\n${content.trim()}\n`;
      
    // Lists
    case 'ul':
    case 'ol': return `\n${content}\n`;
    case 'li': return `\n- ${content.trim()}`;
    
    // Formatting
    case 'b':
    case 'strong': return ` **${content.trim()}** `;
    case 'i':
    case 'em': return ` *${content.trim()}* `;
    case 'u': return ` _${content.trim()}_ `;
    case 's':
    case 'strike':
    case 'del': return ` ~~${content.trim()}~~ `;
    
    // Media & Links
    case 'a': 
      const href = el.getAttribute('href') || '#';
      const title = el.getAttribute('title');
      return ` [${content.trim()}](${href}${title ? ` "${title}"` : ''}) `;
      
    case 'img':
      const src = el.getAttribute('src') || '';
      const alt = el.getAttribute('alt') || 'image';
      return `\n\n![${alt}](${src})\n\n`;
      
    // Special
    case 'blockquote': return `\n\n> ${content.trim()}\n\n`;
    case 'code': return `\`${content}\``;
    case 'pre': return `\n\n\`\`\`\n${el.textContent?.trim() || ''}\n\`\`\`\n\n`;
    case 'br': return `  \n`;
    case 'hr': return `\n\n---\n\n`;
    
    // Default (spans, etc)
    default: return content;
  }
}

// Core function that processes a DOM Document to Markdown
function processDomToMarkdown(doc: Document): string {
    // 1. Remove unwanted tags
    const tagsToRemove = [
      'script', 'style', 'link', 'meta', 'noscript', 'iframe', 'svg', 
      'nav', 'footer', 'aside', 'form', 'button', 'input', 'select', 'textarea', 
      'object', 'embed', 'applet', 'canvas', 'map', 'area'
    ];

    tagsToRemove.forEach(tag => {
      doc.querySelectorAll(tag).forEach(el => el.remove());
    });

    // 2. Traverse
    const markdown = traverse(doc.body);

    // 3. Post-processing cleanup
    return markdown
      .replace(/\n{3,}/g, '\n\n') // Max 2 newlines
      .replace(/^ +/gm, '')        // Remove start-of-line spaces
      .trim();
}

/**
 * Converts a string of HTML to Markdown using the internal mapping logic.
 */
export const convertHtmlToMarkdown = (html: string): string => {
  if (!html) return '';
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  return processDomToMarkdown(doc);
}

/**
 * Cleans raw input (stripping scripts/styles) and converts to Markdown.
 */
export const cleanContentLocally = (rawInput: string): CleanerResponse => {
  if (!rawInput.trim()) {
    throw new Error("O input está vazio.");
  }

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(rawInput, 'text/html');
    
    // Process using the shared logic
    const cleaned = processDomToMarkdown(doc);

    return {
      cleanedHtml: cleaned
    };

  } catch (error: any) {
    console.error("Local Cleaner Error:", error);
    throw new Error("Falha ao processar o conteúdo localmente.");
  }
};