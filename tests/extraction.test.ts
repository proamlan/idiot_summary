import { describe, it, expect } from 'vitest';
import { extractPageContent, isUnsupportedUrl } from '../src/content/page-extractor';

describe('Content Extraction Engine', () => {
  it('1. Extracts article from ordinary news/blog webpage', () => {
    const parser = new DOMParser();
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Exploring Mars Rovers</title>
          <meta name="description" content="A beginner guide to Mars missions" />
        </head>
        <body>
          <nav><a href="/">Home</a><a href="/news">News</a></nav>
          <div class="ad-banner">Buy our shoes now!</div>
          <article>
            <h1>Exploring Mars Rovers</h1>
            <p>Robotic rovers on Mars have transformed our understanding of the Red Planet over two decades.</p>
            <p>Curiosity and Perseverance carry sophisticated spectrometers and cameras to search for biosignatures.</p>
            <ul>
              <li>Curiosity landed in 2012</li>
              <li>Perseverance landed in 2021</li>
            </ul>
          </article>
          <footer>Copyright 2026 Space Daily</footer>
        </body>
      </html>
    `;
    const doc = parser.parseFromString(html, 'text/html');
    const result = extractPageContent(doc, 'https://example.com/mars-rovers');

    expect(result.success).toBe(true);
    expect(result.article).toBeDefined();
    expect(result.article?.title).toContain('Exploring Mars Rovers');
    expect(result.article?.cleanedText).toContain('Robotic rovers on Mars');
    expect(result.article?.cleanedText).toContain('Curiosity and Perseverance');
    expect(result.article?.cleanedText).not.toContain('Buy our shoes now!');
  });

  it('2. Extracts from documentation pages using fallback container selectors', () => {
    const parser = new DOMParser();
    const html = `
      <!DOCTYPE html>
      <html>
        <head><title>API Reference - Data Streaming</title></head>
        <body>
          <div class="sidebar">Left Menu</div>
          <main class="docs-content" id="main-content">
            <h1>Data Streaming Protocol v2</h1>
            <p>This protocol enables real-time message streaming using lightweight WebSocket envelopes.</p>
            <p>Connections require a signed JWT token in the initial handshake headers.</p>
            <table>
              <tr><th>Field</th><th>Type</th></tr>
              <tr><td>id</td><td>string</td></tr>
              <tr><td>payload</td><td>json</td></tr>
            </table>
          </main>
        </body>
      </html>
    `;
    const doc = parser.parseFromString(html, 'text/html');
    const result = extractPageContent(doc, 'https://docs.example.com/api/streaming');

    expect(result.success).toBe(true);
    expect(result.article?.title).toContain('API Reference');
    expect(result.article?.markdown).toContain('Data Streaming Protocol v2');
    expect(result.article?.markdown).toContain('| Field | Type |');
    expect(result.article?.cleanedText).not.toContain('Left Menu');
  });

  it('3. Extracts from long articles preserving structure and estimating token count', () => {
    const parser = new DOMParser();
    const paragraphs = Array.from({ length: 30 }, (_, i) => `<p>Paragraph ${i + 1}: Detailed exploration of scientific concepts and findings with various factual numbers like 42% and 1,500 units.</p>`).join('\n');
    const html = `
      <html>
        <head><title>Deep Dive into Climate Systems</title></head>
        <body>
          <article>
            <h1>Climate Systems Overview</h1>
            ${paragraphs}
          </article>
        </body>
      </html>
    `;
    const doc = parser.parseFromString(html, 'text/html');
    const result = extractPageContent(doc, 'https://science.example.com/climate');

    expect(result.success).toBe(true);
    expect(result.article?.estimatedWordCount).toBeGreaterThan(200);
    expect(result.article?.estimatedTokenCount).toBeGreaterThan(100);
    expect(result.article?.markdown).toContain('Paragraph 30');
  });

  it('4. Handles empty or minimal pages gracefully with clear error code', () => {
    const parser = new DOMParser();
    const html = `
      <html>
        <head><title>Empty Page</title></head>
        <body><div class="empty"></div></body>
      </html>
    `;
    const doc = parser.parseFromString(html, 'text/html');
    const result = extractPageContent(doc, 'https://example.com/blank');

    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('EMPTY_CONTENT');
    expect(result.error?.message).toContain('Could not find readable article text');
  });

  it('5. Handles dynamic content updates correctly', () => {
    const parser = new DOMParser();
    const html = `<html><head><title>SPA App</title></head><body><div id="root"><p>Loading...</p></div></body></html>`;
    const doc = parser.parseFromString(html, 'text/html');

    // Simulate SPA dynamic DOM update
    const root = doc.getElementById('root');
    if (root) {
      root.innerHTML = `
        <main>
          <h1>Dynamically Rendered Article</h1>
          <p>This content was loaded via client-side fetch into the DOM after page initialization.</p>
          <p>It contains essential data and arguments for the reader.</p>
        </main>
      `;
    }

    const result = extractPageContent(doc, 'https://spa.example.com/page');
    expect(result.success).toBe(true);
    expect(result.article?.cleanedText).toContain('Dynamically Rendered Article');
    expect(result.article?.cleanedText).toContain('client-side fetch');
  });

  it('Detects unsupported URLs like chrome:// and Chrome Web Store', () => {
    expect(isUnsupportedUrl('chrome://settings').unsupported).toBe(true);
    expect(isUnsupportedUrl('about:blank').unsupported).toBe(true);
    expect(isUnsupportedUrl('https://chromewebstore.google.com/detail/123').unsupported).toBe(true);
    expect(isUnsupportedUrl('https://en.wikipedia.org/wiki/Tea').unsupported).toBe(false);
  });
});
