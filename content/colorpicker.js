let colorPickerActive = false;

const colorCursor = document.createElement('div');
colorCursor.style.cssText = `
  position: fixed;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 3px solid white;
  box-shadow: 0 0 0 1px black, inset 0 0 0 1px black;
  pointer-events: none;
  z-index: 9999999;
  display: none;
  transform: translate(-50%, -50%);
`;
document.body.appendChild(colorCursor);

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'COLORPICKER_ACTIVATE') {
    colorPickerActive = true;
    document.body.style.cursor = 'crosshair';
    colorCursor.style.display = 'block';
  }
  if (msg.type === 'COLORPICKER_DEACTIVATE') {
    colorPickerActive = false;
    document.body.style.cursor = '';
    colorCursor.style.display = 'none';
  }
});

document.addEventListener('mousemove', (e) => {
  if (!colorPickerActive) return;
  colorCursor.style.left = e.clientX + 'px';
  colorCursor.style.top = e.clientY + 'px';

  // Sample color from element under cursor
  const el = document.elementFromPoint(e.clientX, e.clientY);
  if (el && el !== colorCursor) {
    const color = getComputedStyle(el).backgroundColor;
    colorCursor.style.background = color;
  }
});

document.addEventListener('click', (e) => {
  if (!colorPickerActive) return;
  e.preventDefault();
  e.stopPropagation();

  colorPickerActive = false;
  document.body.style.cursor = '';
  colorCursor.style.display = 'none';

  const el = document.elementFromPoint(e.clientX, e.clientY);
  if (!el) return;

  const color = getComputedStyle(el).backgroundColor;
  const hex = rgbToHex(color);

  // Send picked color back to popup via storage
  chrome.storage.local.set({ 
  picked_color: hex,
  picked_color_timestamp: Date.now()
});
  chrome.runtime.sendMessage({ type: 'COLOR_PICKED', hex });
});

function rgbToHex(rgb) {
  const result = rgb.match(/\d+/g);
  if (!result || result.length < 3) return '#000000';
  return '#' + result.slice(0, 3).map(x => {
    const hex = parseInt(x).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}