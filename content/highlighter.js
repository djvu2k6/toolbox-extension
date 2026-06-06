let highlightColor = 'yellow';
let highlightActive = false;

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'HIGHLIGHTER_SET_COLOR') {
    highlightColor = msg.color;
  }
  if (msg.type === 'HIGHLIGHTER_ACTIVATE') {
    highlightActive = true;
    document.body.style.cursor = 'text';
  }
  if (msg.type === 'HIGHLIGHTER_DEACTIVATE') {
    highlightActive = false;
    document.body.style.cursor = '';
  }
});

document.addEventListener('mouseup', () => {
  if (!highlightActive) return;

  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return;
  const text = selection.toString().trim();
  if (!text) return;

  const range = selection.getRangeAt(0);
  const span = document.createElement('span');
  span.className = `toolbox-highlight ${highlightColor !== 'yellow' ? highlightColor : ''}`;
  span.dataset.toolboxHighlight = 'true';

  try {
    range.surroundContents(span);
    selection.removeAllRanges();
    saveHighlights();
  } catch (e) {
    // Selection spans multiple elements - skip
  }
});

function saveHighlights() {
  const highlights = [];
  document.querySelectorAll('[data-toolbox-highlight]').forEach(el => {
    highlights.push({
      text: el.textContent,
      color: el.className.replace('toolbox-highlight', '').trim() || 'yellow'
    });
  });
  const key = `highlights_${location.href}`;
  chrome.storage.local.set({ [key]: highlights });
}