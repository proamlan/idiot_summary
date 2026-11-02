# Idiot Summary — AI-Powered Chrome Extension

> **"Explain anything on the internet like I'm a complete beginner over a warm cup of chai."**

**Idiot Summary** is a production-quality Chrome Extension built using **Manifest V3**, **TypeScript**, **React**, **Vite**, and **Tailwind CSS**. It transforms complicated, dense, and jargon-heavy webpages into structured, crystal-clear explanations that anyone can understand in under 60 seconds.

---

## 🌟 Key Features

### 1. Structured 8-Section Summary Dashboard
Unlike generic chatbot walls of text, Idiot Summary presents an intuitive, scannable reading dashboard:
1. **The Big Idea**: 1–2 sentences explaining what the page is fundamentally about.
2. **Explain It Like I'm 12**: Complete subject explained in conversational, everyday language.
3. **The Important Stuff**: 3–7 key points highlighting conclusions and arguments.
4. **Why Should I Care?**: The practical, real-world impact and significance.
5. **Real-World Example**: A relatable, down-to-earth analogy.
6. **Numbers That Matter**: Important statistics, figures, percentages, dates, and measurements (never fabricated).
7. **Things That Might Confuse You**: Jargon and technical concepts explained; clicking any term opens an instant deep-dive explainer.
8. **The Bottom Line**: The final takeaway in three sentences or less.

### 2. Four Tailored Explanation Modes
Switch modes on the fly without re-extracting page content:
- **Ultra Simple**: Zero prior knowledge needed. Short sentences, basic vocabulary, strictly under 150 words.
- **Explain Like I'm 12**: Curious 12-year-old style. Friendly, relatable analogies, never childish or condescending.
- **Normal Human**: Clear adult language. Concise, retaining and defining core technical terms.
- **Deep Understanding**: Comprehensive breakdown for power readers. Covers assumptions, arguments, counterarguments, and uncertainties.

### 3. Dual AI Providers with Resilient Fallback
- **NVIDIA NIM**: Native integration with active high-performance models including `nvidia/nemotron-3.5-bolt-e4b` (ultra-fast primary default), `nvidia/nemotron-3-ultra-550b-a55b` (flagship 550B), and `nvidia/nemotron-3.5-lightning-30b-a3b` via `https://integrate.api.nvidia.com/v1`. Configured at low temperature (0.2) for strict factual loyalty.
- **OpenRouter**: Full integration with live-verified active free models including `openrouter/free` (auto-router), `nvidia/nemotron-3-ultra-550b-a55b:free`, `nvidia/nemotron-3.5-lightning:free`, `nvidia/nemotron-3.5-super-vl:free`, `liquid/lfm-2.5-2.6b:free`, and `cohere/north-mini-code:free`.
- **Automatic Fallback & Retry**: If the primary provider hits a rate limit, timeout, or server error, the extension classifies the issue, retries with exponential backoff, and automatically falls back to the secondary provider while displaying the active model badge.

### 4. Smart Content Extraction & Long-Document Chunking
- **Mozilla Readability Engine**: Extracts main article content while removing ads, cookie consent banners, navbars, and repetitive sidebars.
- **Semantic Fallback**: Handles documentation, developer wikis, and SPAs by falling back to `main`, `article`, `[role="main"]`, and `.docs-content`.
- **Native PDF Support**: Works directly on PDF URLs (even inside Chrome's built-in PDF viewer, where content scripts cannot run). The extension downloads the PDF, extracts all text — including headings derived from font-size analysis and paragraph grouping — via pdf.js running in a Chrome **Offscreen Document**, then routes it through the same summarization pipeline. Optimized rendering for arXiv: `/pdf/` URLs are resolved to the structured HTML version when available, falling back to abstract-page metadata, and to raw PDF parsing as a last resort.
- **Long-Document Chunking**: For articles exceeding the model budget, content is intelligently segmented at markdown heading boundaries with overlapping context windows. Chunks are extracted and synthesized via hierarchical map-reduce without losing key facts.

### 5. Interactive Superpowers
- **Explain a Specific Paragraph**: Highlight any text on any webpage to see a floating `[ 💡 Explain with Idiot Summary ]` action or use the Chrome right-click context menu.
- **Ask a Question About This Page**: Grounded Q&A input answering questions strictly based on the extracted article.
- **Concept Explainer Modal**: Click any difficult term in the summary to explore its plain-English definition and everyday analogy.
- **Reading History & Caching**: Locally stores past summaries (with search, delete, and clear options). Caches summaries by URL and content hash to eliminate redundant API calls.
- **Export & Print**: One-click Copy Full Summary, Copy Section, Export as Markdown (`.md`), and clean Print stylesheet.

---

## 🛠️ Technology Stack

- **Platform**: Chrome Extension Manifest V3 (MV3)
- **Language**: TypeScript 5.7+
- **Frontend**: React 18, Tailwind CSS, Lucide Icons
- **Build System**: Vite 6 (multi-entry rollup for popup, sidepanel, settings, offscreen PDF worker, and isolated IIFE content script)
- **PDF Extraction**: pdf.js (`pdfjs-dist`) running in a Chrome Offscreen Document
- **Extraction**: Mozilla Readability (`@mozilla/readability`) + DOMParser
- **Schema Validation**: Zod runtime validation
- **Testing**: Vitest + JSDOM + Testing Library (44 automated unit/integration tests)

---

## 🚀 Installation

### Option A: Download the Pre-built Zip (Easiest — No Build Required)

1. Download **`idiot-summary-chrome-v1.1.0.zip`** from the [Releases page](../../releases) of this repository (a copy is also kept in the repo root).
2. Unzip it — you get an `idiot-summary` folder containing `manifest.json`.
3. Open **Google Chrome** and navigate to:
   ```
   chrome://extensions
   ```
4. Enable the **Developer mode** toggle in the top-right corner.
5. Click the **Load unpacked** button in the top-left toolbar.
6. Select the extracted **`idiot-summary`** folder.
7. The **Idiot Summary** extension icon (warm chai cup) will appear in your Chrome toolbar — pin it for easy access.
8. Open the extension **Settings** and paste your API key(s) (see [Obtaining API Keys](#-obtaining-api-keys)).

> ✅ No Node.js, no npm, no build step needed. The zip is versioned with the release.

### Option B: Build From Source

#### Prerequisites
- Node.js (v18 or higher recommended; verified on Node v22)
- npm

#### 1. Install Dependencies
```bash
npm install
```

#### 2. Build Extension
```bash
npm run build
```
This runs TypeScript validation, compiles the HTML pages (`popup.html`, `sidepanel.html`, `settings.html`), and bundles the service worker and content script into the `dist/` directory.

#### 3. Load in Chrome
1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked** and select the **`dist`** folder from this repository.
4. Pin the extension to your toolbar for easy access.

#### 4. (Optional) Package Your Own Zip
```bash
npm run package:zip
```
Builds the extension and produces `idiot-summary-chrome-v1.1.0.zip` in the project root — the same format distributed via Releases.

---

## 🔧 Running Tests

```bash
npm test
```
Executes all 44 automated tests covering extraction, PDF text shaping, chunking, providers, fallback orchestration, schema validation, prompt injection defense, and UI rendering.

---

## 🔑 Obtaining API Keys

### Option A: NVIDIA NIM API Key (Recommended Primary)
1. Visit the [NVIDIA Build Catalog](https://build.nvidia.com).
2. Sign in or create a free NVIDIA developer account.
3. Navigate to [Nemotron 3.5 Lightning 30B](https://build.nvidia.com/nvidia/nemotron-3.5-lightning-30b-a3b).
4. Click **Get API Key** and generate your key (starts with `nvapi-...`).
5. Each free developer account receives complimentary API credits.

### Option B: OpenRouter API Key (Recommended Fallback / Free Models)
1. Visit [OpenRouter](https://openrouter.ai/keys).
2. Sign in with Google or GitHub.
3. Click **Create Key**, give it a name (e.g. `Idiot Summary`), and copy the key (starts with `sk-or-v1-...`).
4. OpenRouter provides access to multiple free models ending with `:free`.

---

## ⚙️ Extension Settings & Configuration

1. Right-click the Idiot Summary icon and choose **Options**, or click the **Settings gear** inside the popup or side panel.
2. In the Settings page:
   - Paste your **NVIDIA API Key** and/or **OpenRouter API Key**.
   - Click **Test Connection** to execute a real live health check (displays latency in ms).
   - Choose your **Primary Model** (Default: `nvidia/nemotron-3.5-bolt-e4b`).
   - Choose your **Fallback Model** (Default: `openrouter/free`).
   - Set your **Default Explanation Mode** (Default: `Explain Like I'm 12`).
   - Click **Save Settings**.

---

## 🔒 Privacy & Security

- **Strict Local Storage**: API keys and history are stored locally in `chrome.storage.local`. They are never transmitted to any third-party server or analytics tool.
- **Untrusted Content Quarantining**: Webpage content is isolated within `<UNTRUSTED_WEBPAGE_CONTENT>` data blocks with explicit system directives preventing prompt injection overrides.
- **Zero Background Tracking**: The extension only reads the active tab upon explicit user invocation. Password fields, input forms, and sensitive credentials are never read.

---

## 🧪 Testing & Verification

- **Automated Test Suite**:
  ```bash
  npm test
  ```
  Covers article extraction, documentation fallback, long-content chunking, provider integrations, rate-limit retries, primary-to-fallback switching, invalid JSON recovery, security boundaries, and storage persistence.

- **Manual Testing Checklist**:
  See [docs/MANUAL_TESTING.md](docs/MANUAL_TESTING.md) for a step-by-step verification checklist across Chrome browsers.

- **Architecture Documentation**:
  See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for sequence flowcharts and component deep dives.

- **Keyboard Shortcut**: `Alt+S` opens the Idiot Summary side panel on any page.

- **Publishing a Release** (maintainers): bump the version in `package.json`, `public/manifest.json`, and the `package:zip` script name, then run:
  ```bash
  npm run package:zip
  gh release create v1.0.0 idiot-summary-chrome-v1.0.0.zip --title "v1.0.0" --notes "Initial release."
  ```
