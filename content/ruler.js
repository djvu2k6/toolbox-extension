let rulerActive = false;
let startX, startY;
let rulerOverlay = null;
let rulerLabel = null;

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'RULER_ACTIVATE') {
    rulerActive = true;
    document.body.style.cursor = 'crosshair';
    showRulerHint();
  }
});

function showRulerHint() {
  const hint = document.createElement('div');
  hint.id = 'toolbox-ruler-hint';
  hint.style.cssText = `
    position:fixed;top:20px;left:50%;transform:translateX(-50%);
    background:rgba(0,0,0,0.8);color:white;padding:8px 16px;
    border-radius:20px;font-size:13px;z-index:9999999;
    font-family:sans-serif;pointer-events:none;
  `;
  hint.textContent = '📏 Click and drag to measure';
  document.body.appendChild(hint);
  setTimeout(() => hint.remove(), 2000);
}

document.addEventListener('mousedown', (e) => {
  if (!rulerActive) return;
  startX = e.clientX;
  startY = e.clientY;

  // Remove old overlay
  if (rulerOverlay) rulerOverlay.remove();
  if (rulerLabel) rulerLabel.remove();

  // Create measurement overlay
  rulerOverlay = document.createElement('div');
  rulerOverlay.style.cssText = `
    position:fixed;
    left:${startX}px;top:${startY}px;
    width:0;height:0;
    background:rgba(255,68,68,0.15);
    border:2px solid #ff4444;
    z-index:9999998;
    pointer-events:none;
  `;
  document.body.appendChild(rulerOverlay);

  // Dimension label
  rulerLabel = document.createElement('div');
  rulerLabel.style.cssText = `
    position:fixed;
    background:#ff4444;color:white;
    padding:4px 8px;border-radius:4px;
    font-size:12px;font-weight:700;
    font-family:monospace;
    z-index:9999999;
    pointer-events:none;
  `;
  document.body.appendChild(rulerLabel);
});

document.addEventListener('mousemove', (e) => {
  if (!rulerActive || !rulerOverlay) return;

  const w = Math.abs(e.clientX - startX);
  const h = Math.abs(e.clientY - startY);
  const left = Math.min(e.clientX, startX);
  const top = Math.min(e.clientY, startY);

  rulerOverlay.style.left = left + 'px';
  rulerOverlay.style.top = top + 'px';
  rulerOverlay.style.width = w + 'px';
  rulerOverlay.style.height = h + 'px';

  rulerLabel.textContent = `${w} × ${h} px`;
  rulerLabel.style.left = (left + w/2 - 40) + 'px';
  rulerLabel.style.top = (top - 28) + 'px';
});

document.addEventListener('mouseup', (e) => {
  if (!rulerActive) return;
  rulerActive = false;
  document.body.style.cursor = '';

  const w = Math.abs(e.clientX - startX);
  const h = Math.abs(e.clientY - startY);

  // Keep the measurement visible for 3 seconds
  setTimeout(() => {
    if (rulerOverlay) rulerOverlay.remove();
    if (rulerLabel) rulerLabel.remove();
  }, 3000);
});