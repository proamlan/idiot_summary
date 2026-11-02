# Idiot Summary — Manual Testing Checklist for Chrome

This checklist verifies all Chrome Extension interactions, Side Panel behavior, permissions, and AI provider integrations.

---

### Pre-Requisite
1. Build the extension:
   ```bash
   npm run build
   ```
2. Open Google Chrome.
3. Navigate to `chrome://extensions`.
4. Enable **Developer mode** (top-right toggle).
5. Click **Load unpacked** and select the `dist` directory inside `/Users/plaban/Projects/amlan/idiot_summary/dist`.
6. Confirm the extension loads with:
   - Name: **Idiot Summary**
   - Version: **1.0.0**
   - Icon: Warm Chai cup icon

---

### Test Suite 1: Popup UI & Side Panel Launch
- [ ] **Popup Render**: Click the Idiot Summary extension icon in the Chrome toolbar.
  - Verify compact popup (~340px) opens cleanly.
  - Verify current page title and domain are displayed.
  - Verify 4 mode buttons (Ultra Simple, ELI12, Normal Human, Deep Understanding) are visible and selectable.
  - Verify model selector shows current primary model.
- [ ] **Explain This Page Trigger**: Click "Explain This Page" in the popup.
  - Verify Chrome Side Panel opens on the right side of the browser.
  - Verify the popup closes cleanly.
  - Verify two-stage loading skeleton appears ("Extracting main article...", then "Explaining like you're a beginner...").

---

### Test Test 2: Side Panel Reading Experience & Modes
- [ ] **Structured Dashboard Sections**:
  - Verify Section 1: **THE BIG IDEA** (1-2 sentences).
  - Verify Section 2: **EXPLAIN IT LIKE I'M 12** (conversational everyday language).
  - Verify Section 3: **THE IMPORTANT STUFF** (numbered bullet list).
  - Verify Section 4: **WHY SHOULD I CARE?** (practical real-world importance).
  - Verify Section 5: **REAL-WORLD EXAMPLE** (everyday analogy).
  - Verify Section 6: **NUMBERS THAT MATTER** (accurate statistics/dates).
  - Verify Section 7: **THINGS THAT MIGHT CONFUSE YOU** (jargon terms).
  - Verify Section 8: **THE BOTTOM LINE** (concluding takeaway).
  - Verify empty sections are omitted gracefully.
- [ ] **Mode Switching**:
  - Switch from "ELI12" to "Ultra Simple" using the header tabs.
  - Verify the summary recalculates without re-extracting the page DOM.
  - Verify Ultra Simple summary is concise (< 150 words).
  - Switch to "Deep Understanding" and verify technical nuances and counterarguments appear.

---

### Test Suite 3: Interactive Features
- [ ] **Explain Specific Paragraph (Text Selection)**:
  - Highlight any paragraph on the webpage.
  - Verify floating button appears near the cursor: `[ 💡 Explain with Idiot Summary ]`.
  - Click the floating button.
  - Verify Side Panel opens displaying the selected snippet and simplified explanation.
  - Alternatively, right-click highlighted text and choose "Explain with Idiot Summary" from the Chrome context menu.
- [ ] **Explain Difficult Term**:
  - In the summary, click any term under "Things That Might Confuse You".
  - Verify the Concept Explainer modal opens with a plain-English definition and everyday analogy.
  - Type a custom term into the lookup box and verify it returns a tailored explanation.
- [ ] **Ask a Question About This Page**:
  - Click one of the sample prompt chips (e.g. "What is the author's main argument?").
  - Verify the model returns an answer strictly grounded in the page content.
  - Ask an unrelated question (e.g. "What is the recipe for chocolate cake?").
  - Verify the response states: "The webpage does not provide information to answer this question."

---

### Test Suite 4: Copy, Export & Print
- [ ] **Copy Full Summary**: Click the copy icon in the header. Verify entire summary markdown is in clipboard.
- [ ] **Copy Individual Section**: Hover over "The Big Idea" and click the copy icon. Verify only that section is copied.
- [ ] **Export as Markdown**: Click the download icon in the header. Verify an `idiot-summary-<title>.md` file downloads.
- [ ] **Print Clean Summary**: Click the printer icon. Verify browser print dialog opens with clean styling (no UI clutter).

---

### Test Suite 5: Settings & Provider Verification
- [ ] **Open Settings**: Click the settings gear in popup or side panel.
  - Verify Settings page opens in a full tab (`settings.html`).
- [ ] **Configure NVIDIA NIM Key**:
  - Enter valid NVIDIA API key (`nvapi-...`).
  - Click "Test Connection".
  - Verify real health check executes and reports latency (e.g., `Connected! Latency: 420ms`).
- [ ] **Configure OpenRouter Key**:
  - Enter OpenRouter key (`sk-or-v1-...`).
  - Click "Test Connection".
  - Verify green connection status.
- [ ] **Save Settings**: Click "Save Settings". Refresh page and verify all fields persist.
- [ ] **Clear API Keys**: Click "Clear Stored API Keys", confirm dialog, verify fields are cleared.

---

### Test Suite 6: Edge Cases & Error Handling
- [ ] **Unsupported URL**: Open `chrome://settings` and trigger the extension.
  - Verify friendly message: "Browser internal pages cannot be accessed by extensions."
- [ ] **Missing API Key**: Clear API keys and attempt to summarize.
  - Verify actionable error banner appears with a one-click button "Configure API Keys in Settings".
- [ ] **Fallback Verification**:
  - Enter invalid NVIDIA key and valid OpenRouter key with OpenRouter set as fallback.
  - Trigger summarization.
  - Verify fallback triggers smoothly and badge displays: `(Fallback provider used)`.
