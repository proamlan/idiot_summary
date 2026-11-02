import { ArticleContent, ExtractionResult } from '../shared/types';
import { estimateTokens } from '../shared/utils';

/**
 * Checks if a URL is an arXiv paper (PDF, abstract, or HTML version).
 */
export function isArxivUrl(url: string): boolean {
  if (!url) return false;
  return /arxiv\.org\/(?:pdf|abs|html)\/([0-9]{4}\.[0-9]{4,5}(?:v[0-9]+)?|[a-z\-]+(?:\.[a-z\-]+)?\/[0-9]{7}(?:v[0-9]+)?)/i.test(url);
}

/**
 * Extracts the canonical arXiv paper ID from any arXiv URL.
 * e.g., https://arxiv.org/pdf/2610.35959 -> 2610.35959
 * e.g., https://arxiv.org/pdf/2610.35959.pdf -> 2610.35959
 * e.g., https://arxiv.org/html/2610.35959 -> 2610.35959
 * e.g., https://arxiv.org/pdf/math/0303109.pdf -> math/0303109
 */
export function parseArxivId(url: string): string | null {
  if (!url) return null;
  const match = url.match(/arxiv\.org\/(?:pdf|abs|html)\/([0-9]{4}\.[0-9]{4,5}(?:v[0-9]+)?|[a-z\-]+(?:\.[a-z\-]+)?\/[0-9]{7}(?:v[0-9]+)?)/i);
  if (!match) return null;
  return match[1].replace(/\.pdf$/i, '');
}

/**
 * Safely decodes HTML entities without requiring DOMParser or browser document.
 * Works in Chrome Service Worker, Web Workers, Node.js, and browser windows.
 */
export function decodeHtmlEntities(str: string): string {
  if (!str) return '';
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#([0-9]{1,7});/g, (_, dec) => {
      try {
        return String.fromCodePoint(parseInt(dec, 10));
      } catch {
        return '';
      }
    })
    .replace(/&#x([0-9a-fA-F]{1,6});/g, (_, hex) => {
      try {
        return String.fromCodePoint(parseInt(hex, 16));
      } catch {
        return '';
      }
    });
}

/**
 * Extracts meta tags from HTML string without DOMParser.
 */
export function extractMetaTags(html: string): { [key: string]: string[] } {
  const result: { [key: string]: string[] } = {};
  const regex = /<meta\s+[^>]*?(?:name|property)=["']([^"']+)["'][^>]*?content=["']([^"']*)["'][^>]*?>|<meta\s+[^>]*?content=["']([^"']*)["'][^>]*?(?:name|property)=["']([^"']+)["'][^>]*?>/gi;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(html)) !== null) {
    const key = (match[1] || match[4] || '').toLowerCase().trim();
    const val = decodeHtmlEntities(match[2] || match[3] || '').trim();
    if (key && val) {
      if (!result[key]) {
        result[key] = [];
      }
      result[key].push(val);
    }
  }
  return result;
}

/**
 * Parses and distills arXiv modern HTML papers into a clean, rich, and high-signal representation.
 * Keeps title, authors, full abstract, and key sections while stripping noisy equations, raw tables, and bibliography.
 */
function parseArxivHtmlPaper(html: string, arxivId: string, pageUrl: string): ArticleContent | null {
  // Title
  const titleMatch =
    html.match(/<h1[^>]*class=["'][^"']*ltx_title[^"']*["'][^>]*>([\s\S]*?)<\/h1>/i) ||
    html.match(/<title>([\s\S]*?)<\/title>/i);
  let title = titleMatch ? decodeHtmlEntities(titleMatch[1].replace(/<[^>]+>/g, '')).trim() : `arXiv:${arxivId}`;
  title = title.replace(/^Title:\s*/i, '').trim();

  // Authors
  const authorsMatch = html.match(/<div[^>]*class=["'][^"']*ltx_authors[^"']*["'][^>]*>([\s\S]*?)<\/div>/i);
  let authors = '';
  if (authorsMatch) {
    authors = decodeHtmlEntities(
      authorsMatch[1]
        .replace(/<span[^>]*class=["'][^"']*ltx_role[^"']*["'][^>]*>[\s\S]*?<\/span>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
    );
  }

  // Abstract
  const absMatch = html.match(/<div[^>]*class=["'][^"']*ltx_abstract[^"']*["'][^>]*>([\s\S]*?)<\/div>/i);
  let abstract = '';
  if (absMatch) {
    abstract = decodeHtmlEntities(
      absMatch[1]
        .replace(/<h\d[^>]*>.*?<\/h\d>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
    );
  }

  // Sections
  const sectionMatches = [...html.matchAll(/<section[^>]*class=["'][^"']*ltx_section[^"']*["'][^>]*>([\s\S]*?)<\/section>/gi)];
  const sections: string[] = [];

  for (const match of sectionMatches) {
    const secHtml = match[1];
    // Skip references, acknowledgements, and bibliography
    if (
      /class=["'][^"']*ltx_bibliography[^"']*["']/i.test(secHtml) ||
      /<h2[^>]*>(?:References|Bibliography|Acknowledgements)<\/h2>/i.test(secHtml)
    ) {
      continue;
    }

    const hMatch = secHtml.match(/<h2[^>]*class=["'][^"']*ltx_title[^"']*["'][^>]*>([\s\S]*?)<\/h2>/i);
    const secTitle = hMatch ? decodeHtmlEntities(hMatch[1].replace(/<[^>]+>/g, '')).trim() : 'Section';

    // Strip equations, tables, figures, footnotes
    let secContent = secHtml
      .replace(/<figure\b[^>]*>[\s\S]*?<\/figure>/gi, '')
      .replace(/<table\b[^>]*>[\s\S]*?<\/table>/gi, '')
      .replace(/<div[^>]*class=["'][^"']*ltx_equation[^"']*["'][^>]*>[\s\S]*?<\/div>/gi, '')
      .replace(/<h\d\b[^>]*>[\s\S]*?<\/h\d>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    secContent = decodeHtmlEntities(secContent);

    if (secContent.length > 80) {
      // Keep up to 2500 characters per section to avoid bloating context
      sections.push(`### ${secTitle}\n\n${secContent.slice(0, 2500)}`);
    }
  }

  // If abstract wasn't in ltx_abstract, try citation meta tags
  if (!abstract || abstract.length < 50) {
    const metas = extractMetaTags(html);
    abstract = metas['citation_abstract']?.[0] || metas['og:description']?.[0] || '';
  }

  if (!abstract && sections.length === 0) {
    return null;
  }

  const mdLines: string[] = [
    `# ${title}`,
    `**arXiv Identifier**: [${arxivId}](https://arxiv.org/abs/${arxivId})`,
  ];
  if (authors) {
    mdLines.push(`**Authors**: ${authors.slice(0, 300)}`);
  }
  if (abstract) {
    mdLines.push(`## Abstract\n\n${abstract}`);
  }
  if (sections.length > 0) {
    mdLines.push(`## Key Paper Sections\n\n${sections.slice(0, 5).join('\n\n')}`);
  }

  const markdown = mdLines.join('\n\n');
  const cleanedText = `${title}\n${authors}\n${abstract}\n${sections.map(s => s.replace(/###\s+/g, '')).join('\n\n')}`;
  const wordCount = cleanedText.split(/\s+/).filter(Boolean).length;
  const tokenCount = estimateTokens(markdown);

  return {
    url: pageUrl,
    title: `${title} (arXiv:${arxivId})`,
    byline: authors ? authors.slice(0, 200) : undefined,
    siteName: 'arXiv.org',
    description: abstract ? abstract.slice(0, 200) : `arXiv paper ${arxivId}`,
    cleanedText,
    markdown,
    characterCount: markdown.length,
    estimatedWordCount: wordCount,
    estimatedTokenCount: tokenCount,
    extractedAt: new Date().toISOString()
  };
}

/**
 * Extracts complete research paper content for any arXiv paper URL.
 * Automatically resolves /pdf/ URLs to modern /html/ version first, then falls back to abstract metadata.
 * Safely runs in Chrome Service Worker without DOMParser or document.
 */
export async function extractArxivPaper(url: string): Promise<ExtractionResult> {
  const arxivId = parseArxivId(url);
  if (!arxivId) {
    return {
      success: false,
      error: {
        code: 'EMPTY_CONTENT',
        message: 'Could not parse a valid arXiv identifier from the URL.'
      }
    };
  }

  const htmlUrl = `https://arxiv.org/html/${arxivId}`;
  const absUrl = `https://arxiv.org/abs/${arxivId}`;

  // 1. Primary Strategy: Fetch modern arXiv HTML version (https://arxiv.org/html/<id>)
  try {
    const htmlRes = await fetch(htmlUrl, {
      headers: {
        'Accept': 'text/html,application/xhtml+xml',
      }
    });

    if (htmlRes.ok) {
      const htmlText = await htmlRes.text();
      if (htmlText.length > 3000 && !htmlText.includes('Paper not found')) {
        const article = parseArxivHtmlPaper(htmlText, arxivId, url);
        if (article) {
          return {
            success: true,
            article
          };
        }
      }
    }
  } catch (err) {
    console.warn(`HTML fetch for arXiv:${arxivId} failed, trying abstract page:`, err);
  }

  // 2. Secondary Strategy: Fallback to official abstract page (https://arxiv.org/abs/<id>)
  try {
    const absRes = await fetch(absUrl, {
      headers: {
        'Accept': 'text/html,application/xhtml+xml',
      }
    });

    if (!absRes.ok) {
      return {
        success: false,
        error: {
          code: 'EMPTY_CONTENT',
          message: `Could not fetch arXiv paper metadata from ${absUrl} (Status ${absRes.status}).`
        }
      };
    }

    const absHtml = await absRes.text();
    const metaTags = extractMetaTags(absHtml);

    // Title extraction
    let title =
      metaTags['citation_title']?.[0] ||
      metaTags['og:title']?.[0] ||
      absHtml.match(/<h1[^>]*class=["'][^"']*title[^"']*["'][^>]*>([\s\S]*?)<\/h1>/i)?.[1]?.replace(/^Title:\s*/i, '').replace(/<[^>]+>/g, '').trim() ||
      `arXiv:${arxivId}`;
    title = decodeHtmlEntities(title).replace(/^Title:\s*/i, '').trim();

    // Authors extraction
    const authors = metaTags['citation_author'] || [];

    // Abstract extraction
    let abstract =
      metaTags['citation_abstract']?.[0] ||
      metaTags['og:description']?.[0] ||
      absHtml.match(/<blockquote[^>]*class=["'][^"']*abstract[^"']*["'][^>]*>([\s\S]*?)<\/blockquote>/i)?.[1]?.replace(/<span\s+class=["']descriptor["']>Abstract:<\/span>/i, '').replace(/<[^>]+>/g, '').trim() ||
      '';
    abstract = decodeHtmlEntities(abstract).replace(/^Abstract:\s*/i, '').replace(/\s+/g, ' ').trim();

    // Subjects & Comments extraction
    const subjMatch = absHtml.match(/<td[^>]*class=["'][^"']*subjects[^"']*["'][^>]*>([\s\S]*?)<\/td>/i);
    const subjects = subjMatch ? decodeHtmlEntities(subjMatch[1].replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim() : '';

    const commMatch = absHtml.match(/<td[^>]*class=["'][^"']*comments[^"']*["'][^>]*>([\s\S]*?)<\/td>/i);
    const comments = commMatch ? decodeHtmlEntities(commMatch[1].replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim() : '';

    if (!abstract || abstract.length < 50) {
      return {
        success: false,
        error: {
          code: 'EMPTY_CONTENT',
          message: `The abstract for arXiv:${arxivId} could not be retrieved.`
        }
      };
    }

    const mdLines: string[] = [
      `# ${title}`,
      `**arXiv Identifier**: [${arxivId}](${absUrl})`,
    ];
    if (authors.length > 0) {
      mdLines.push(`**Authors**: ${authors.slice(0, 8).join(', ')}${authors.length > 8 ? ' et al.' : ''}`);
    }
    if (subjects) {
      mdLines.push(`**Subjects**: ${subjects}`);
    }
    if (comments) {
      mdLines.push(`**Publication Notes**: ${comments}`);
    }
    mdLines.push(`## Abstract\n\n${abstract}`);

    const markdown = mdLines.join('\n\n');
    const cleanedText = `${title}\n${authors.join(', ')}\n${abstract}`;
    const wordCount = cleanedText.split(/\s+/).filter(Boolean).length;
    const tokenCount = estimateTokens(markdown);

    const article: ArticleContent = {
      url,
      title: `${title} (arXiv:${arxivId})`,
      byline: authors.length > 0 ? authors.slice(0, 5).join(', ') : undefined,
      siteName: 'arXiv.org',
      description: abstract.slice(0, 200),
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
  } catch (err: any) {
    return {
      success: false,
      error: {
        code: 'READABILITY_FAILED',
        message: `Failed to fetch arXiv paper: ${err.message || String(err)}`
      }
    };
  }
}
