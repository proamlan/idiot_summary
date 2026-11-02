# Chrome Web Store Listing — Idiot Summary

## Store Name

**Idiot Summary — AI Web & PDF Explainer**

## Short Description (132 character limit)

> Explain any webpage or PDF like you're a complete beginner — structured, jargon-free AI summaries over a warm cup of chai.

## Category

Productivity → Tools

## Detailed Description

**Tired of drowning in jargon, dense research papers, and 4,000-word articles?**

Idiot Summary explains anything on the internet like you're a complete beginner — over a warm cup of chai. One click turns any webpage, blog post, or full research-paper **PDF** into a clear, friendly, structured explanation.

### ☕ What You Get — The 8-Part Reading Dashboard

1. **The Big Idea** — what the page is fundamentally about, in 1–2 sentences
2. **Explain It Like I'm 12** — the whole subject in everyday language
3. **The Important Stuff** — 3–7 key points that actually matter
4. **Why Should I Care?** — the real-world significance
5. **Real-World Example** — a relatable analogy
6. **Numbers That Matter** — key stats and figures (never fabricated)
7. **Things That Might Confuse You** — jargon, decoded; click any term for a deep-dive
8. **The Bottom Line** — the takeaway in three sentences or less

### 📄 Works on PDFs — Even Inside Chrome's Viewer

Open any PDF link (arXiv, journals, reports, whitepapers) and summarize it directly — no download, no copy-paste. arXiv papers get special treatment: structured extraction from the official HTML version, with automatic fallbacks.

### 🎚️ Four Explanation Modes

**Ultra Simple** (under 150 words) · **Explain Like I'm 12** · **Normal Human** · **Deep Understanding** — switch instantly without re-reading the page.

### 🧠 Powered by Your Choice of AI

Bring your own free API keys:
- **NVIDIA NIM** (ultra-fast Nemotron models) as primary
- **OpenRouter** (free models available) as automatic fallback

If the primary model rate-limits or times out, the extension retries and transparently switches to your fallback — the model badge always tells you which one answered.

### 💡 Interactive Superpowers

- **Explain a paragraph**: highlight any text → floating action button or right-click menu
- **Ask This Page a Question**: grounded Q&A, answers strictly from the article
- **Term Explainer**: click any difficult term for a plain-English deep-dive
- **History & Cache**: searchable local history; repeated visits summarize instantly
- **Export**: copy sections, copy full summary, export as Markdown, or print cleanly

### 🔒 Privacy First

- Your API keys and history live **only** in your browser's local storage — never sent to any server beyond your chosen AI provider
- Webpage content is quarantined against prompt-injection attacks
- Zero analytics, zero tracking, zero background reading — only the tab you explicitly summarize is read

### ⌨️ Keyboard Shortcut

`Alt + S` opens the summary side panel on any page.

---

*Grab a free NVIDIA or OpenRouter API key (links in Settings), paste it in, and start explaining the internet like you're five — chai optional but recommended.*

## Screenshots Guidance

1. Side panel showing the 8-section dashboard on a news article
2. arXiv PDF being summarized
3. Selection explainer popup on highlighted text
4. Settings page showing API key setup and Test Connection
5. History drawer

## Permission Justifications

- `activeTab` / `scripting` / `tabs`: extract page content only when the user clicks Summarize
- `storage`: store API keys, settings, history, and cache locally
- `sidePanel`: display the summary dashboard
- `contextMenus`: "Explain with Idiot Summary" on selected text
- `offscreen`: run pdf.js in an offscreen document to extract PDF text
- Host permissions (`<all_urls>`): required to fetch PDF files and extract content from any site the user asks to summarize
