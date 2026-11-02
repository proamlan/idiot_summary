/**
 * Handles text selection on webpages to show a subtle floating action button
 * for explaining specific paragraphs or sentences.
 */

let floatingBtn: HTMLButtonElement | null = null;
let currentSelectedText = '';
let currentContext = '';

function removeFloatingButton() {
  if (floatingBtn && floatingBtn.parentNode) {
    floatingBtn.parentNode.removeChild(floatingBtn);
    floatingBtn = null;
  }
}

function createFloatingButton(x: number, y: number) {
  removeFloatingButton();

  floatingBtn = document.createElement('button');
  floatingBtn.id = 'idiot-summary-selection-btn';
  floatingBtn.setAttribute('type', 'button');
  
  // Style with inline styles to avoid conflict with page CSS
  Object.assign(floatingBtn.style, {
    position: 'absolute',
    left: `${x}px`,
    top: `${y}px`,
    zIndex: '2147483647',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    backgroundColor: '#c56f2c',
    color: '#ffffff',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: '12px',
    fontWeight: '600',
    lineHeight: '1',
    borderRadius: '9999px',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    boxShadow: '0 4px 14px rgba(0, 0, 0, 0.18)',
    cursor: 'pointer',
    transition: 'transform 0.15s ease, background-color 0.15s ease',
    userSelect: 'none',
  });

  floatingBtn.innerHTML = `
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/>
      <path d="M9 18h6"/>
      <path d="M10 22h4"/>
    </svg>
    <span>Explain with Idiot Summary</span>
  `;

  floatingBtn.addEventListener('mouseenter', () => {
    if (floatingBtn) {
      floatingBtn.style.transform = 'scale(1.04)';
      floatingBtn.style.backgroundColor = '#a35326';
    }
  });

  floatingBtn.addEventListener('mouseleave', () => {
    if (floatingBtn) {
      floatingBtn.style.transform = 'scale(1)';
      floatingBtn.style.backgroundColor = '#c56f2c';
    }
  });

  floatingBtn.addEventListener('mousedown', (e) => {
    e.stopPropagation();
  });

  floatingBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!currentSelectedText) return;

    try {
      if (typeof chrome !== 'undefined' && chrome.runtime) {
        chrome.runtime.sendMessage({
          type: 'EXPLAIN_SELECTION',
          selectedText: currentSelectedText,
          context: currentContext,
        });
      }
    } catch (err) {
      console.warn('Failed to send selection message to extension:', err);
    }

    removeFloatingButton();
  });

  document.body.appendChild(floatingBtn);
}

export function initSelectionHandler() {
  document.addEventListener('mouseup', () => {
    setTimeout(() => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) {
        removeFloatingButton();
        return;
      }

      const text = selection.toString().trim();
      if (text.length < 10 || text.length > 5000) {
        removeFloatingButton();
        return;
      }

      // Check if selection is inside an editable field or password
      const activeEl = document.activeElement;
      if (
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          (activeEl as HTMLElement).isContentEditable)
      ) {
        // Never trigger on inputs, form fields, or passwords for privacy
        removeFloatingButton();
        return;
      }

      currentSelectedText = text;

      // Extract minimal context from parent container
      try {
        const range = selection.getRangeAt(0);
        const parent = range.commonAncestorContainer;
        const containerEl = parent.nodeType === Node.ELEMENT_NODE ? (parent as HTMLElement) : parent.parentElement;
        currentContext = (containerEl?.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 500);

        const rect = range.getBoundingClientRect();
        if (rect.width === 0 && rect.height === 0) return;

        const scrollX = window.scrollX || window.pageXOffset;
        const scrollY = window.scrollY || window.pageYOffset;

        // Position 8px above selection or below if at top of viewport
        let top = rect.top + scrollY - 36;
        if (rect.top < 45) {
          top = rect.bottom + scrollY + 8;
        }
        const left = Math.max(10, Math.min(window.innerWidth - 220, rect.left + scrollX + rect.width / 2 - 90));

        createFloatingButton(left, top);
      } catch {
        removeFloatingButton();
      }
    }, 10);
  });

  // Clear button on keydown or scroll
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      removeFloatingButton();
    }
  });

  document.addEventListener('mousedown', (e) => {
    if (floatingBtn && !floatingBtn.contains(e.target as Node)) {
      removeFloatingButton();
    }
  });
}
