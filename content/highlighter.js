let highlightColor = 'yellow';
let highlightActive = false;

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'HIGHLIGHTER_SET_COLOR') highlightColor = msg.color;
  if (msg.type === 'HIGHLIGHTER_ACTIVATE') {
    highlightActive = true;
    document.body.style.cursor = 'text';
    showHighlightHint();
  }
  if (msg.type === 'HIGHLIGHTER_DEACTIVATE') {
    highlightActive = false;
    document.body.style.cursor = '';
  }
  if (msg.type === 'HIGHLIGHTER_ERASE_ALL') {
    document.querySelectorAll('[data-toolbox-highlight]').forEach(el => {
      el.parentNode.replaceChild(document.createTextNode(el.textContent), el);
    });
    chrome.storage.local.remove(`highlights_${location.href}`);
  }
});

function showHighlightHint() {
  const existing = document.getElementById('toolbox-hl-hint');
  if (existing) return;
  const hint = document.createElement('div');
  hint.id = 'toolbox-hl-hint';
  hint.style.cssText = `
    position:fixed;top:16px;left:50%;transform:translateX(-50%);
    background:rgba(0,0,0,0.85);color:white;padding:7px 16px;
    border-radius:20px;font-size:13px;z-index:9999999;
    font-family:sans-serif;pointer-events:none;
    border:1px solid rgba(255,255,255,0.1);
  `;
  hint.textContent = '✏️ Highlighter active — select text to highlight';
  document.body.appendChild(hint);
  setTimeout(() => hint.remove(), 2500);
}

document.addEventListener('mouseup', (e) => {
  if (!highlightActive) return;

  // Small delay to let selection settle
  setTimeout(() => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    const text = selection.toString().trim();
    if (!text || text.length < 1) return;

    const range = selection.getRangeAt(0);

    // Use extractContents + wrap approach for cross-element selections
    try {
      const fragment = range.extractContents();
      const span = document.createElement('span');
      span.className = `toolbox-highlight${highlightColor !== 'yellow' ? ' ' + highlightColor : ''}`;
      span.dataset.toolboxHighlight = 'true';
      span.appendChild(fragment);
      range.insertNode(span);
      selection.removeAllRanges();
      saveHighlights();
    } catch (e) {
      // Last resort fallback
      try {
        const span = document.createElement('span');
        span.className = `toolbox-highlight${highlightColor !== 'yellow' ? ' ' + highlightColor : ''}`;
        span.dataset.toolboxHighlight = 'true';
        range.surroundContents(span);
        selection.removeAllRanges();
        saveHighlights();
      } catch (e2) {
        selection.removeAllRanges();
      }
    }
  }, 10);
});

function saveHighlights() {
  const highlights = [];
  document.querySelectorAll('[data-toolbox-highlight]').forEach(el => {
    highlights.push({
      text: el.textContent,
      color: el.className.replace('toolbox-highlight', '').trim() || 'yellow'
    });
  });
  chrome.storage.local.set({ [`highlights_${location.href}`]: highlights });
}