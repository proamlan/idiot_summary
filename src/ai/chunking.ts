import { CHUNKING_CONFIG } from '../shared/constants';
import { ExplanationMode } from '../shared/types';
import { estimateTokens } from '../shared/utils';
import { buildSummarizePrompt } from './prompts/system-prompt';

export interface DocumentChunk {
  index: number;
  total: number;
  text: string;
  estimatedTokens: number;
}

/**
 * Splits markdown into logically coherent sections based on headings and paragraphs.
 * Avoids breaking mid-sentence or mid-paragraph.
 */
export function splitIntoLogicalSections(
  markdown: string,
  maxTokensPerChunk: number = CHUNKING_CONFIG.maxTokensPerChunk,
  overlapTokens: number = CHUNKING_CONFIG.overlapTokens
): DocumentChunk[] {
  const totalTokens = estimateTokens(markdown);
  if (totalTokens <= maxTokensPerChunk) {
    return [
      {
        index: 1,
        total: 1,
        text: markdown,
        estimatedTokens: totalTokens,
      },
    ];
  }

  // Split text by markdown headings or double newlines (paragraphs)
  const rawSections = markdown.split(/\n(?=(?:#{1,4}\s+|\n))/);
  const chunks: string[] = [];
  let currentChunkParts: string[] = [];
  let currentTokens = 0;

  for (const section of rawSections) {
    const sectionTokens = estimateTokens(section);

    // If a single section is larger than maxTokensPerChunk, split by paragraphs or sentences
    if (sectionTokens > maxTokensPerChunk) {
      const paragraphs = section.split(/\n\s*\n/);
      for (const p of paragraphs) {
        const pTokens = estimateTokens(p);
        if (currentTokens + pTokens > maxTokensPerChunk && currentChunkParts.length > 0) {
          chunks.push(currentChunkParts.join('\n\n'));
          // Take overlap from end of current chunk
          const overlap = getOverlapText(currentChunkParts.join('\n\n'), overlapTokens);
          currentChunkParts = overlap ? [overlap, p] : [p];
          currentTokens = estimateTokens(currentChunkParts.join('\n\n'));
        } else {
          currentChunkParts.push(p);
          currentTokens += pTokens;
        }
      }
    } else if (currentTokens + sectionTokens > maxTokensPerChunk && currentChunkParts.length > 0) {
      chunks.push(currentChunkParts.join('\n\n'));
      const overlap = getOverlapText(currentChunkParts.join('\n\n'), overlapTokens);
      currentChunkParts = overlap ? [overlap, section] : [section];
      currentTokens = estimateTokens(currentChunkParts.join('\n\n'));
    } else {
      currentChunkParts.push(section);
      currentTokens += sectionTokens;
    }
  }

  if (currentChunkParts.length > 0) {
    chunks.push(currentChunkParts.join('\n\n'));
  }

  return chunks.map((text, idx) => ({
    index: idx + 1,
    total: chunks.length,
    text,
    estimatedTokens: estimateTokens(text),
  }));
}

function getOverlapText(text: string, targetTokens: number): string {
  const paragraphs = text.split(/\n\s*\n/);
  const overlapParts: string[] = [];
  let tokens = 0;

  for (let i = paragraphs.length - 1; i >= 0; i--) {
    const p = paragraphs[i];
    const pTokens = estimateTokens(p);
    if (tokens + pTokens <= targetTokens || overlapParts.length === 0) {
      overlapParts.unshift(p);
      tokens += pTokens;
    } else {
      break;
    }
  }

  return overlapParts.join('\n\n');
}

/**
 * Builds prompt for summarizing an intermediate chunk.
 */
export function buildChunkExtractionPrompt(chunk: DocumentChunk, title: string): string {
  return `You are analyzing Section ${chunk.index} of ${chunk.total} from the webpage "${title}".

Extract and condense all essential information from this section:
1. Core subjects and arguments presented in this section.
2. All important facts, statistics, measurements, numbers, and dates.
3. Key claims, hypotheses, and conclusions.
4. Technical terms introduced and their contextual definitions.

Keep this section summary factual, information-dense, and concise. Do NOT invent anything.

<UNTRUSTED_SECTION_CONTENT section="${chunk.index}_of_${chunk.total}">
${chunk.text}
</UNTRUSTED_SECTION_CONTENT>`;
}

/**
 * Builds the final synthesis prompt combining intermediate section summaries.
 */
export function buildMapReduceSynthesisPrompt(
  intermediateSummaries: string[],
  mode: ExplanationMode,
  title: string,
  url: string
): string {
  const combinedNotes = intermediateSummaries
    .map((summary, idx) => `### Section ${idx + 1} Extracted Information:\n${summary}`)
    .join('\n\n---\n\n');

  return buildSummarizePrompt(
    `The following are verified extractions from all sequential sections of the long document:\n\n${combinedNotes}`,
    mode,
    title,
    url
  );
}
