import { Readability } from '@mozilla/readability';
import { ArticleContent, ExtractionResult } from '../shared/types';
import { estimateTokens } from '../shared/utils';

// Common selectors for noisy or non-content elements
const NOISE_SELECTORS = [
  'header:not(article header)',
  'footer',
  'nav',
  'aside',
  'script',
  'style',
  'noscript',
  'iframe',
  'svg',
  'canvas',
  'form',
  '.cookie-banner',
  '.cookie-consent',
  '#cookie-banner',
  '#cookieConsent',
  '.advertisement',
  '.ad-banner',
  '.ad-container',
  '.adsbygoogle',
  '.social-share',
  '.newsletter-signup',
  '.sidebar',
  '[role="complementary"]',
  '[role="banner"]',
  '[aria-modal="true"]'
];

// Documentation and main container selectors for fallback extraction
const MAIN_SELECTORS = [
  'main',
  'article',
  '[role="main"]',
  '#main-content',
  '#content',
  '.documentation',
  '.markdown-body',
  '.docs-content',
  '.article-body',
  '.post-content',
  '.entry-content'
];

// Paywall markers
const PAYWALL_PATTERNS = [
  /subscribe to read/i,
  /you have reached your (article )?limit/i,
  /exclusive to subscribers/i,
  /sign in to continue reading/i,
  /members-only story/i,
  /support our journalism/i
];

/**
 * Checks if the URL protocol is unsupported for extraction.
 */
export function isUnsupportedUrl(url: string): { unsupported: boolean; reason?: string } {
  if (!url) return { unsupported: true, reason: 'Empty URL' };
  
  const lower = url.toLowerCase();
  if (
    lower.startsWith('chrome://') ||
    lower.startsWith('chrome-extension://') ||
    lower.startsWith('edge://') ||
    lower.startsWith('about:') ||
    lower.startsWith('view-source:')
  ) {
    return {
      unsupported: true,
      reason: 'Browser internal pages (like chrome:// or settings) cannot be accessed by extensions.'
    };
  }

  if (lower.startsWith('https://chrome.google.com/webstore') || lower.startsWith('https://chromewebstore.google.com')) {
    return {
      unsupported: true,
      reason: 'Chrome Web Store security policies restrict extension access on this page.'
    };
  }

  return { unsupported: false };
}

/**
 * Converts an HTML element tree into clean, semantic Markdown text.
 * Preserves headings, lists, tables, code blocks, and links without sending raw messy HTML.
 */
export function htmlToCleanMarkdown(container: Element): string {
  const lines: string[] = [];

  function walk(node: Node, depth = 0) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = (node.textContent || '').replace(/\s+/g, ' ');
      if (text.trim()) {
        lines.push(text);
      }
      return;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) return;

    const el = node as HTMLElement;
    const tag = el.tagName.toLowerCase();

    // Skip hidden elements
    if (el.style?.display === 'none' || el.style?.visibility === 'hidden' || el.getAttribute('aria-hidden') === 'true') {
      return;
    }

    // Headings
    if (tag === 'h1') {
      lines.push(`\n# ${el.textContent?.trim()}\n`);
      return;
    }
    if (tag === 'h2') {
      lines.push(`\n## ${el.textContent?.trim()}\n`);
      return;
    }
    if (tag === 'h3' || tag === 'h4' || tag === 'h5' || tag === 'h6') {
      lines.push(`\n### ${el.textContent?.trim()}\n`);
      return;
    }

    // Paragraphs
    if (tag === 'p') {
      lines.push('\n');
      for (const child of Array.from(el.childNodes)) {
        walk(child, depth + 1);
      }
      lines.push('\n');
      return;
    }

    // Blockquote
    if (tag === 'blockquote') {
      lines.push(`\n> ${el.textContent?.trim().replace(/\n+/g, ' ')}\n`);
      return;
    }

    // Lists
    if (tag === 'ul' || tag === 'ol') {
      lines.push('\n');
      const items = el.querySelectorAll(':scope > li');
      items.forEach((li, idx) => {
        const prefix = tag === 'ol' ? `${idx + 1}. ` : '- ';
        lines.push(`${prefix}${li.textContent?.trim()}\n`);
      });
      lines.push('\n');
      return;
    }

    // Tables
    if (tag === 'table') {
      lines.push('\n');
      const rows = el.querySelectorAll('tr');
      rows.forEach((row, rowIdx) => {
        const cells = row.querySelectorAll('th, td');
        const rowText = Array.from(cells)
          .map((c) => (c.textContent || '').trim().replace(/\|/g, '\\|'))
          .join(' | ');
        if (rowText) {
          lines.push(`| ${rowText} |`);
          if (rowIdx === 0) {
            const separator = Array.from(cells).map(() => '---').join(' | ');
            lines.push(`| ${separator} |`);
          }
        }
      });
      lines.push('\n');
      return;
    }

    // Code blocks
    if (tag === 'pre') {
      lines.push(`\n\`\`\`\n${el.textContent?.trim()}\n\`\`\`\n`);
      return;
    }
    if (tag === 'code' && el.parentElement?.tagName.toLowerCase() !== 'pre') {
      lines.push(` \`${el.textContent?.trim()}\` `);
      return;
    }

    // Links
    if (tag === 'a' && el.getAttribute('href')) {
      const href = el.getAttribute('href')!;
      const text = el.textContent?.trim() || '';
      if (text && !href.startsWith('javascript:') && !href.startsWith('#')) {
        lines.push(` [${text}](${href}) `);
        return;
      }
    }

    // Default: traverse children
    for (const child of Array.from(el.childNodes)) {
      walk(child, depth + 1);
    }
  }

  walk(container);

  // Clean multiple newlines and spaces
  return lines
    .join('')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Extracts clean article content from document.
 */
export function extractPageContent(doc: Document = document, targetUrl: string = window.location?.href || ''): ExtractionResult {
  const urlCheck = isUnsupportedUrl(targetUrl);
  if (urlCheck.unsupported) {
    return {
      success: false,
      error: {
        code: 'UNSUPPORTED_PROTOCOL',
        message: urlCheck.reason || 'This page type is not supported.'
      }
    };
  }

  // Check document availability
  if (!doc || !doc.body) {
    return {
      success: false,
      error: {
        code: 'EMPTY_CONTENT',
        message: 'The webpage has no readable body content.'
      }
    };
  }

  // Clone document to prevent modifying user's live DOM
  let docClone: Document;
  try {
    docClone = doc.cloneNode(true) as Document;
  } catch {
    const parser = new DOMParser();
    docClone = parser.parseFromString(doc.documentElement.outerHTML, 'text/html');
  }

  // Strip obvious noise elements from the clone
  for (const selector of NOISE_SELECTORS) {
    try {
      const elements = docClone.querySelectorAll(selector);
      elements.forEach((el) => el.remove());
    } catch {
      // Ignore query selector edge cases
    }
  }

  // Extract metadata
  const title = (
    docClone.querySelector('meta[property="og:title"]')?.getAttribute('content') ||
    docClone.querySelector('title')?.textContent ||
    doc.title ||
    'Untitled Page'
  ).trim();

  const description = (
    docClone.querySelector('meta[name="description"]')?.getAttribute('content') ||
    docClone.querySelector('meta[property="og:description"]')?.getAttribute('content') ||
    ''
  ).trim();

  const siteName = (
    docClone.querySelector('meta[property="og:site_name"]')?.getAttribute('content') ||
    ''
  ).trim();

  let cleanedText = '';
  let markdown = '';
  let byline = '';

  // 1. Try Mozilla Readability
  try {
    const reader = new Readability(docClone, {
      charThreshold: 80,
      classesToPreserve: ['code', 'pre', 'highlight']
    });
    const parsedArticle = reader.parse();

    const rawArticleText = parsedArticle?.textContent?.trim() || '';
    if (parsedArticle && parsedArticle.content && rawArticleText.length > 120) {
      byline = parsedArticle.byline || '';
      cleanedText = rawArticleText.replace(/\s+/g, ' ');

      // Convert the parsed article content HTML into markdown
      const tempDiv = docClone.createElement('div');
      tempDiv.innerHTML = parsedArticle.content;
      markdown = htmlToCleanMarkdown(tempDiv);
    }
  } catch (err) {
    console.warn('Readability failed, attempting fallback semantic extraction:', err);
  }

  // 2. Fallback to semantic container extraction if Readability was insufficient
  if (!markdown || markdown.trim().length < 150) {
    for (const selector of MAIN_SELECTORS) {
      const container = docClone.querySelector(selector);
      if (container && container.textContent && container.textContent.trim().length > 150) {
        markdown = htmlToCleanMarkdown(container);
        cleanedText = container.textContent.replace(/\s+/g, ' ').trim();
        break;
      }
    }
  }

  // 3. Last fallback: whole body if still empty
  if (!markdown || markdown.trim().length < 100) {
    if (docClone.body && docClone.body.textContent && docClone.body.textContent.trim().length > 100) {
      markdown = htmlToCleanMarkdown(docClone.body);
      cleanedText = docClone.body.textContent.replace(/\s+/g, ' ').trim();
    }
  }

  // 4. Validate content presence
  if (!markdown || markdown.trim().length < 80) {
    return {
      success: false,
      error: {
        code: 'EMPTY_CONTENT',
        message: 'Could not find readable article text on this page. It may be mostly images, a blank page, or requires login.'
      }
    };
  }

  // 5. Check for paywall indicators
  const isPaywalled = PAYWALL_PATTERNS.some((p) => p.test(cleanedText)) && cleanedText.length < 500;
  if (isPaywalled) {
    return {
      success: false,
      error: {
        code: 'PAYWALL_DETECTED',
        message: 'This article appears to be behind a paywall or login requirement, so only a brief preview was accessible.'
      }
    };
  }

  const wordCount = cleanedText.split(/\s+/).filter(Boolean).length;
  const tokenCount = estimateTokens(markdown);

  const article: ArticleContent = {
    url: targetUrl,
    title,
    byline: byline || undefined,
    siteName: siteName || undefined,
    description: description || undefined,
    cleanedText,
    markdown,
    characterCount: markdown.length,
    estimatedWordCount: wordCount,
    estimatedTokenCount: tokenCount,
    extractedAt: new Date().toISOString()
  };

  return {
    success: true,
    article
  };
}
