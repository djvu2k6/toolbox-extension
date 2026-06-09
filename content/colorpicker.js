let colorPickerActive = false;

const colorCursor = document.createElement('div');
colorCursor.style.cssText = `
  position:fixed;
  width:28px;height:28px;
  border-radius:50%;
  border:3px solid white;
  box-shadow:0 0 0 2px #000, 0 0 0 4px rgba(255,255,255,0.5), inset 0 0 0 1px rgba(0,0,0,0.3);
  pointer-events:none;
  z-index:9999999;
  display:none;
  transform:translate(-50%,-50%);
  transition:background 0.05s;
`;
document.body.appendChild(colorCursor);

// Tooltip showing hex value
const colorTooltip = document.createElement('div');
colorTooltip.style.cssText = `
  position:fixed;background:rgba(0,0,0,0.8);color:white;
  padding:4px 8px;border-radius:4px;font-size:12px;
  font-family:monospace;pointer-events:none;
  z-index:9999999;display:none;
`;
document.body.appendChild(colorTooltip);

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'COLORPICKER_ACTIVATE') {
    colorPickerActive = true;
    document.body.style.cursor = 'none';
    colorCursor.style.display = 'block';
    colorTooltip.style.display = 'block';
  }
  if (msg.type === 'COLORPICKER_DEACTIVATE') {
    deactivatePicker();
  }
});

function deactivatePicker() {
  colorPickerActive = false;
  document.body.style.cursor = '';
  colorCursor.style.display = 'none';
  colorTooltip.style.display = 'none';
}

document.addEventListener('mousemove', (e) => {
  if (!colorPickerActive) return;

  colorCursor.style.left = e.clientX + 'px';
  colorCursor.style.top = e.clientY + 'px';
  colorTooltip.style.left = (e.clientX + 20) + 'px';
  colorTooltip.style.top = (e.clientY - 10) + 'px';

  // Use element at point for background color
  colorCursor.style.display = 'none';
  colorTooltip.style.display = 'none';
  const el = document.elementFromPoint(e.clientX, e.clientY);
  colorCursor.style.display = 'block';
  colorTooltip.style.display = 'block';

  if (el) {
    const style = getComputedStyle(el);
    // Try background first, fall back to color (text)
    let color = style.backgroundColor;
    if (!color || color === 'rgba(0, 0, 0, 0)' || color === 'transparent') {
      color = style.color;
    }
    const hex = rgbToHex(color);
    colorCursor.style.background = hex;
    colorTooltip.textContent = hex.toUpperCase();
  }
});

document.addEventListener('click', (e) => {
  if (!colorPickerActive) return;
  e.preventDefault();
  e.stopPropagation();

  colorCursor.style.display = 'none';
  colorTooltip.style.display = 'none';
  const el = document.elementFromPoint(e.clientX, e.clientY);
  colorCursor.style.display = 'block';
  colorTooltip.style.display = 'block';

  if (!el) return;

  const style = getComputedStyle(el);
  let color = style.backgroundColor;
  if (!color || color === 'rgba(0, 0, 0, 0)' || color === 'transparent') {
    color = style.color;
  }

  const hex = rgbToHex(color);
  chrome.storage.local.set({
    picked_color: hex,
    picked_color_timestamp: Date.now()
  });

  deactivatePicker();
});

function rgbToHex(rgb) {
  const result = rgb.match(/\d+/g);
  if (!result || result.length < 3) return '#000000';
  return '#' + result.slice(0, 3).map(x => {
    const h = parseInt(x).toString(16);
    return h.length === 1 ? '0' + h : h;
  }).join('');
}