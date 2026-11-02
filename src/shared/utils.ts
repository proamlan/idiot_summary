import { StructuredSummary } from './types';

/**
 * Estimates token count for English text.
 * Standard heuristic: 1 token ≈ 4 characters, or ~0.75 words.
 */
export function estimateTokens(text: string): number {
  if (!text) return 0;
  return Math.ceil(text.length / 3.8);
}

/**
 * Generates a simple fast hash for strings (Murmur/djb2 style).
 */
export function hashString(str: string): string {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Truncate text cleanly at word boundaries.
 */
export function truncateText(text: string, maxLen: number): string {
  if (!text || text.length <= maxLen) return text;
  const sub = text.slice(0, maxLen);
  const lastSpace = sub.lastIndexOf(' ');
  if (lastSpace > maxLen * 0.7) {
    return sub.slice(0, lastSpace) + '...';
  }
  return sub + '...';
}

/**
 * Clean domain extractor from URL.
 */
export function extractDomain(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

/**
 * Async sleep for exponential backoff.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Formats ISO timestamp to human-readable string.
 */
export function formatDate(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return isoString;
  }
}

/**
 * Converts StructuredSummary into high-quality Markdown for export.
 */
export function exportAsMarkdown(summary: StructuredSummary, url: string): string {
  const lines: string[] = [];
  lines.push(`# ${summary.title || 'Summary'}`);
  lines.push(`> Source: [${url}](${url})\n`);
  
  if (summary.big_idea) {
    lines.push(`## The Big Idea\n${summary.big_idea}\n`);
  }

  if (summary.simple_explanation) {
    lines.push(`## Explain Like I'm 12\n${summary.simple_explanation}\n`);
  }

  if (summary.key_points && summary.key_points.length > 0) {
    lines.push('## The Important Stuff');
    summary.key_points.forEach((kp, idx) => {
      lines.push(`${idx + 1}. **${kp.point}**: ${kp.explanation}`);
    });
    lines.push('');
  }

  if (summary.why_it_matters) {
    lines.push(`## Why Should I Care?\n${summary.why_it_matters}\n`);
  }

  if (summary.real_world_example) {
    lines.push(`## Real-World Example\n${summary.real_world_example}\n`);
  }

  if (summary.important_numbers && summary.important_numbers.length > 0) {
    lines.push('## Numbers That Matter');
    summary.important_numbers.forEach((num) => {
      lines.push(`- **${num.value}**: ${num.context}`);
    });
    lines.push('');
  }

  if (summary.difficult_terms && summary.difficult_terms.length > 0) {
    lines.push('## Things That Might Confuse You');
    summary.difficult_terms.forEach((t) => {
      lines.push(`- **${t.term}**: ${t.simple_definition}${t.example ? ` *(e.g. ${t.example})*` : ''}`);
    });
    lines.push('');
  }

  if (summary.claims_and_caveats && summary.claims_and_caveats.length > 0) {
    lines.push('## Claims, Facts & Opinions');
    summary.claims_and_caveats.forEach((c) => {
      lines.push(`- [${c.type.toUpperCase()}] **${c.claim}**\n  *Caveat/Context:* ${c.caveat}`);
    });
    lines.push('');
  }

  if (summary.bottom_line) {
    lines.push(`## The Bottom Line\n${summary.bottom_line}\n`);
  }

  lines.push('---');
  lines.push('*Generated with Idiot Summary — AI-powered simple explanations.*');

  return lines.join('\n');
}

/**
 * Copies text safely to clipboard in extension UI contexts.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    // Fallback for older/unsecured contexts
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.error('Failed to copy text:', err);
    return false;
  }
}
