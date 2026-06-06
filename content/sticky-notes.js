let stickyActive = false;
let stickyColor = 'yellow';

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'STICKY_ACTIVATE') {
    stickyActive = true;
    document.body.style.cursor = 'crosshair';
  }
  if (msg.type === 'STICKY_DEACTIVATE') {
    stickyActive = false;
    document.body.style.cursor = '';
  }
  if (msg.type === 'STICKY_SET_COLOR') {
    stickyColor = msg.color;
  }
});

document.addEventListener('click', (e) => {
  if (!stickyActive) return;
  if (e.target.closest('.toolbox-sticky')) return;

  stickyActive = false;
  document.body.style.cursor = '';

  createSticky(e.clientX, e.clientY, stickyColor, '');
});

function createSticky(x, y, color, text) {
  const sticky = document.createElement('div');
  sticky.className = `toolbox-sticky ${color !== 'yellow' ? color : ''}`;
  sticky.style.left = x + 'px';
  sticky.style.top = y + 'px';

  sticky.innerHTML = `
    <div class="sticky-header">
      <div class="sticky-color-dot" style="background:#ffeb3b" data-color="yellow"></div>
      <div class="sticky-color-dot" style="background:#90caf9" data-color="blue"></div>
      <div class="sticky-color-dot" style="background:#f48fb1" data-color="pink"></div>
      <button class="sticky-close">×</button>
    </div>
    <textarea class="sticky-textarea" placeholder="Type your note...">${text}</textarea>
  `;

  document.body.appendChild(sticky);

  // Close
  sticky.querySelector('.sticky-close').addEventListener('click', () => {
    sticky.remove();
    saveStickies();
  });

  // Color change
  sticky.querySelectorAll('.sticky-color-dot').forEach(dot => {
    dot.addEventListener('click', () => {
      const c = dot.dataset.color;
      sticky.className = `toolbox-sticky ${c !== 'yellow' ? c : ''}`;
      saveStickies();
    });
  });

  // Save on type
  sticky.querySelector('.sticky-textarea').addEventListener('input', saveStickies);

  // Drag
  makeDraggable(sticky, sticky.querySelector('.sticky-header'));

  saveStickies();
}

function makeDraggable(el, handle) {
  let startX, startY, startLeft, startTop;

  handle.addEventListener('mousedown', (e) => {
    startX = e.clientX;
    startY = e.clientY;
    startLeft = parseInt(el.style.left) || 0;
    startTop = parseInt(el.style.top) || 0;

    function onMove(e) {
      el.style.left = (startLeft + e.clientX - startX) + 'px';
      el.style.top = (startTop + e.clientY - startY) + 'px';
    }

    function onUp() {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      saveStickies();
    }

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  });
}

function saveStickies() {
  const stickies = [];
  document.querySelectorAll('.toolbox-sticky').forEach(s => {
    stickies.push({
      x: parseInt(s.style.left),
      y: parseInt(s.style.top),
      color: s.classList.contains('blue') ? 'blue' : s.classList.contains('pink') ? 'pink' : 'yellow',
      text: s.querySelector('.sticky-textarea').value
    });
  });
  const key = `stickies_${location.href}`;
  chrome.storage.local.set({ [key]: stickies });
}

// Load saved stickies on page load
window.addEventListener('load', () => {
  const key = `stickies_${location.href}`;
  chrome.storage.local.get(key, (data) => {
    if (data[key]) {
      data[key].forEach(s => createSticky(s.x, s.y, s.color, s.text));
    }
  });
});