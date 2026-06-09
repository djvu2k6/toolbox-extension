const toolsGrid = document.querySelector('.tools-grid');
const toolView = document.getElementById('toolView');
const toolTitle = document.getElementById('toolTitle');
const toolContent = document.getElementById('toolContent');
const backBtn = document.getElementById('backBtn');

// Theme
const themeToggle = document.getElementById('themeToggle');
chrome.storage.local.get('toolbox_theme', (data) => {
  if (data.toolbox_theme === 'light') {
    document.body.classList.add('light');
    themeToggle.innerHTML = '<i data-lucide="sun" width="14" height="14"></i>';
    lucide.createIcons();
  }
});

themeToggle.addEventListener('click', () => {
  const isLight = document.body.classList.toggle('light');
  chrome.storage.local.set({ toolbox_theme: isLight ? 'light' : 'dark' });
  themeToggle.innerHTML = isLight
    ? '<i data-lucide="sun" width="14" height="14"></i>'
    : '<i data-lucide="moon" width="14" height="14"></i>';
  lucide.createIcons();
});
// ADD FORMATTIME RIGHT HERE
function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}
// Tool definitions - we'll add each tool here day by day
const tools = {
  notepad: {
    name: ' Notepad',
    render: renderNotepad
  },
  pomodoro: {
    name: ' Pomodoro',
    render: renderPomodoro
  },
  wordcount: {
    name: ' Word Counter',
    render: renderWordCount
  },
  todo: {
    name: ' Todo',
    render: renderTodo
  }, highlighter: {
    name: ' Highlighter',
    render: renderHighlighter
  },
  sticky: {
    name: ' Sticky Notes',
    render: renderSticky
  },
  colorpicker: {
    name: ' Color Picker',
    render: renderColorPicker
  },
ruler: {
    name: ' Ruler',
    render: renderRuler
  },
screenshot: {
    name: ' Screenshot',
    render: renderScreenshot
  },
reader: {
    name: ' Reader Mode',
    render: renderReaderMode
  },
imgdownloader: {
    name: ' Image DL',
    render: renderImageDownloader
  },
};

// Navigation
document.querySelectorAll('.tool-item').forEach(item => {
  item.addEventListener('click', () => {
    const toolKey = item.dataset.tool;
    if (tools[toolKey]) {
      openTool(toolKey);
    }
  });
});

backBtn.addEventListener('click', () => {
  toolView.style.display = 'none';
  toolsGrid.style.display = 'grid';
});

function openTool(toolKey) {
  toolsGrid.style.display = 'none';
  toolView.style.display = 'block';
  toolTitle.textContent = tools[toolKey].name;
  toolContent.innerHTML = '';
  tools[toolKey].render();
}

// NOTEPAD
function renderNotepad() {
  toolContent.innerHTML = `
    <textarea class="notepad-area" id="notepadText" placeholder="Start typing... your notes are saved automatically."></textarea>
    <div class="notepad-footer">
      <span class="char-count" id="charCount">0 characters</span>
      <button class="clear-btn" id="clearNotepad">Clear</button>
    </div>
  `;

  const textarea = document.getElementById('notepadText');
  const charCount = document.getElementById('charCount');
  const clearBtn = document.getElementById('clearNotepad');

  // Load saved note
  chrome.storage.local.get('notepad_content', (data) => {
    if (data.notepad_content) {
      textarea.value = data.notepad_content;
      charCount.textContent = `${data.notepad_content.length} characters`;
    }
  });

  // Save on every keystroke
  textarea.addEventListener('input', () => {
    const val = textarea.value;
    chrome.storage.local.set({ notepad_content: val });
    charCount.textContent = `${val.length} characters`;
  });

  // Clear
  clearBtn.addEventListener('click', () => {
    if (confirm('Clear all notes?')) {
      textarea.value = '';
      charCount.textContent = '0 characters';
      chrome.storage.local.remove('notepad_content');
    }
  });
}

// TODO
function renderTodo() {
  toolContent.innerHTML = `
    <div class="todo-input-row">
      <input class="todo-input" id="todoInput" placeholder="Add a task..." maxlength="100"/>
      <button class="add-btn" id="addTodo">+</button>
    </div>
    <div class="todo-list" id="todoList"></div>
    <div class="todo-footer">
      <span class="todo-count" id="todoCount"></span>
      <button class="clear-done-btn" id="clearDone">Clear done</button>
    </div>
  `;

  const input = document.getElementById('todoInput');
  const addBtn = document.getElementById('addTodo');
  const todoList = document.getElementById('todoList');
  const todoCount = document.getElementById('todoCount');
  const clearDoneBtn = document.getElementById('clearDone');

  let todos = [];

  // Load saved todos
  chrome.storage.local.get('toolbox_todos', (data) => {
    todos = data.toolbox_todos || [];
    renderList();
  });

  function saveTodos() {
    chrome.storage.local.set({ toolbox_todos: todos });
  }

  function renderList() {
    todoList.innerHTML = '';
    const remaining = todos.filter(t => !t.done).length;
    todoCount.textContent = `${remaining} remaining`;

    if (todos.length === 0) {
      todoList.innerHTML = '<p style="color:#555;font-size:12px;text-align:center;padding:20px 0;">No tasks yet. Add one above.</p>';
      return;
    }

    todos.forEach((todo, index) => {
      const item = document.createElement('div');
      item.className = `todo-item ${todo.done ? 'done' : ''}`;
      item.innerHTML = `
        <input type="checkbox" class="todo-checkbox" ${todo.done ? 'checked' : ''} data-index="${index}">
        <span class="todo-text">${todo.text}</span>
        <button class="todo-delete" data-index="${index}">×</button>
      `;
      todoList.appendChild(item);
    });

    // Checkbox toggle
    todoList.querySelectorAll('.todo-checkbox').forEach(cb => {
      cb.addEventListener('change', (e) => {
        todos[e.target.dataset.index].done = e.target.checked;
        saveTodos();
        renderList();
      });
    });

    // Delete
    todoList.querySelectorAll('.todo-delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        todos.splice(e.target.dataset.index, 1);
        saveTodos();
        renderList();
      });
    });
  }

  function addTodo() {
    const text = input.value.trim();
    if (!text) return;
    todos.unshift({ text, done: false });
    saveTodos();
    renderList();
    input.value = '';
    input.focus();
  }

  addBtn.addEventListener('click', addTodo);

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') addTodo();
  });

  clearDoneBtn.addEventListener('click', () => {
    todos = todos.filter(t => !t.done);
    saveTodos();
    renderList();
  });
}

// POMODORO
function renderPomodoro() {
  const circumference = 2 * Math.PI * 70;

  toolContent.innerHTML = `
    <div class="pomodoro-container">
      <div class="pomodoro-ring">
        <svg width="160" height="160" viewBox="0 0 160 160">
          <circle class="ring-bg" cx="80" cy="80" r="70"/>
          <circle class="ring-progress" id="ringProgress" cx="80" cy="80" r="70"
            stroke-dasharray="${circumference}"
            stroke-dashoffset="0"/>
        </svg>
        <div class="pomodoro-time" id="pomodoroDisplay">25:00</div>
        <div class="pomodoro-label" id="pomodoroStatus">READY</div>
      </div>

      <div class="duration-picker">
        <label class="duration-label">Session length</label>
        <div class="duration-options">
          <button class="duration-btn" data-mins="15">15m</button>
          <button class="duration-btn" data-mins="25">25m</button>
          <button class="duration-btn" data-mins="30">30m</button>
          <button class="duration-btn" data-mins="45">45m</button>
          <button class="duration-btn" data-mins="60">60m</button>
        </div>
      </div>

      <div class="pomodoro-controls">
        <button class="pomo-btn pomo-start" id="pomoToggle">Start</button>
        <button class="pomo-btn pomo-reset" id="pomoReset">Reset</button>
      </div>
      <div class="pomodoro-sessions">
        <div style="text-align:center;margin-bottom:6px;" id="sessionLabel">Sessions today: 0</div>
        <div class="session-dots" id="sessionDots"></div>
      </div>
    </div>
  `;

  const display = document.getElementById('pomodoroDisplay');
  const status = document.getElementById('pomodoroStatus');
  const ring = document.getElementById('ringProgress');
  const toggleBtn = document.getElementById('pomoToggle');
  const resetBtn = document.getElementById('pomoReset');
  const sessionLabel = document.getElementById('sessionLabel');
  const dots = document.getElementById('sessionDots');

  let totalSeconds = 25 * 60;
  let pollingInterval = null;

 function updateUI(state) {
    if (!state) return;
    totalSeconds = state.customMinutes * 60;
    display.textContent = formatTime(state.seconds);
    status.textContent = state.running ? 'FOCUS' : (state.seconds === totalSeconds ? 'READY' : 'PAUSED');
    toggleBtn.textContent = state.running ? 'Pause' : 'Start';
    sessionLabel.textContent = `Sessions today: ${state.sessions}`;

    const progress = state.seconds / totalSeconds;
    ring.style.strokeDashoffset = circumference * (1 - progress);

    // Highlight active duration button
    document.querySelectorAll('.duration-btn').forEach(btn => {
      btn.classList.toggle('active', parseInt(btn.dataset.mins) === state.customMinutes);
    });

    // Render dots
    dots.innerHTML = '';
    for (let i = 0; i < 4; i++) {
      const dot = document.createElement('div');
      dot.className = `session-dot ${i < (state.sessions % 4) ? 'filled' : ''}`;
      dots.appendChild(dot);
    }
  }

  // Get initial state from service worker
  chrome.runtime.sendMessage({ type: 'POMO_GET_STATE' }, (state) => {
    updateUI(state);
  });

  // Poll every second to keep display in sync
  pollingInterval = setInterval(() => {
    chrome.runtime.sendMessage({ type: 'POMO_GET_STATE' }, (state) => {
      if (state) updateUI(state);
    });
  }, 1000);

  // Clean up polling when user navigates away
  backBtn.addEventListener('click', () => {
    clearInterval(pollingInterval);
  }, { once: true });

  // Controls
  toggleBtn.addEventListener('click', () => {
    const msgType = toggleBtn.textContent === 'Pause' ? 'POMO_PAUSE' : 'POMO_START';
    chrome.runtime.sendMessage({ type: msgType }, updateUI);
  });

  resetBtn.addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: 'POMO_RESET' }, updateUI);
  });

  // Duration picker
  document.querySelectorAll('.duration-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const mins = parseInt(btn.dataset.mins);
      chrome.runtime.sendMessage({ type: 'POMO_SET_DURATION', minutes: mins }, updateUI);
    });
  });
}
// WORD COUNTER
function renderWordCount() {
  toolContent.innerHTML = `
    <textarea class="notepad-area" id="wcText" placeholder="Paste or type any text here..." style="height:180px;"></textarea>
    <div class="wc-stats" id="wcStats">
      <div class="wc-stat-box">
        <span class="wc-number" id="wcWords">0</span>
        <span class="wc-label">Words</span>
      </div>
      <div class="wc-stat-box">
        <span class="wc-number" id="wcChars">0</span>
        <span class="wc-label">Characters</span>
      </div>
      <div class="wc-stat-box">
        <span class="wc-number" id="wcNoSpace">0</span>
        <span class="wc-label">No Spaces</span>
      </div>
      <div class="wc-stat-box">
        <span class="wc-number" id="wcRead">0s</span>
        <span class="wc-label">Read Time</span>
      </div>
    </div>
    <button class="clear-btn" id="wcClear" style="margin-top:8px;">Clear</button>
  `;

  const textarea = document.getElementById('wcText');
  const wcWords = document.getElementById('wcWords');
  const wcChars = document.getElementById('wcChars');
  const wcNoSpace = document.getElementById('wcNoSpace');
  const wcRead = document.getElementById('wcRead');
  const wcClear = document.getElementById('wcClear');

  function analyze() {
    const text = textarea.value;
    const words = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
    const chars = text.length;
    const noSpace = text.replace(/\s/g, '').length;
    const readSeconds = Math.ceil((words / 200) * 60);
    const readTime = readSeconds < 60
      ? `${readSeconds}s`
      : `${Math.ceil(readSeconds / 60)}m`;

    wcWords.textContent = words;
    wcChars.textContent = chars;
    wcNoSpace.textContent = noSpace;
    wcRead.textContent = readTime;
  }

  textarea.addEventListener('input', analyze);

  wcClear.addEventListener('click', () => {
    textarea.value = '';
    analyze();
    textarea.focus();
  });
}

// HIGHLIGHTER
function renderHighlighter() {
  toolContent.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:16px;padding:10px 0;">
      <p style="font-size:13px;color:#aaa;line-height:1.6;">
        Select any text on the page to highlight it.
      </p>
      <div style="display:flex;flex-direction:column;gap:8px;">
        <span style="font-size:11px;color:#555;text-transform:uppercase;letter-spacing:1px;">Color</span>
        <div style="display:flex;gap:10px;">
          <div class="color-swatch active" data-color="yellow" style="background:#ffeb3b;width:32px;height:32px;border-radius:50%;cursor:pointer;border:2px solid white;"></div>
          <div class="color-swatch" data-color="blue" style="background:#90caf9;width:32px;height:32px;border-radius:50%;cursor:pointer;border:2px solid transparent;"></div>
          <div class="color-swatch" data-color="pink" style="background:#f48fb1;width:32px;height:32px;border-radius:50%;cursor:pointer;border:2px solid transparent;"></div>
          <div class="color-swatch" data-color="green" style="background:#a5d6a7;width:32px;height:32px;border-radius:50%;cursor:pointer;border:2px solid transparent;"></div>
        </div>
      </div>
      <button class="pomo-btn pomo-start" id="highlightToggle" style="width:100%;">Activate Highlighter</button>
      <button class="pomo-btn pomo-reset" id="eraseHighlights" style="width:100%;"> Erase All Highlights</button>
      <p style="font-size:11px;color:#555;text-align:center;">Highlighter stays active after closing this popup</p>
    </div>
  `;

  let activeColor = 'yellow';
  let active = false;

  document.querySelectorAll('.color-swatch').forEach(swatch => {
    swatch.addEventListener('click', () => {
      document.querySelectorAll('.color-swatch').forEach(s => s.style.border = '2px solid transparent');
      swatch.style.border = '2px solid white';
      activeColor = swatch.dataset.color;
      sendToActiveTab({ type: 'HIGHLIGHTER_SET_COLOR', color: activeColor });
    });
  });

  document.getElementById('highlightToggle').addEventListener('click', () => {
    active = !active;
    const btn = document.getElementById('highlightToggle');
    if (active) {
      btn.textContent = 'Deactivate Highlighter';
      btn.style.background = '#555';
      sendToActiveTab({ type: 'HIGHLIGHTER_ACTIVATE' });
    } else {
      btn.textContent = 'Activate Highlighter';
      btn.style.background = '';
      sendToActiveTab({ type: 'HIGHLIGHTER_DEACTIVATE' });
    }
  });

  document.getElementById('eraseHighlights').addEventListener('click', () => {
    sendToActiveTab({ type: 'HIGHLIGHTER_ERASE_ALL' });
  });
}
// STICKY NOTES
function renderSticky() {
  toolContent.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:16px;padding:10px 0;">
      <p style="font-size:13px;color:#aaa;line-height:1.6;">
        Click anywhere on the page to place a sticky note. Notes are saved per page.
      </p>
      <div style="display:flex;flex-direction:column;gap:8px;">
        <span style="font-size:11px;color:#555;text-transform:uppercase;letter-spacing:1px;">Color</span>
        <div style="display:flex;gap:10px;">
          <div class="sticky-swatch active" data-color="yellow" style="background:#ffeb3b;width:32px;height:32px;border-radius:50%;cursor:pointer;border:2px solid white;"></div>
          <div class="sticky-swatch" data-color="blue" style="background:#90caf9;width:32px;height:32px;border-radius:50%;cursor:pointer;border:2px solid transparent;"></div>
          <div class="sticky-swatch" data-color="pink" style="background:#f48fb1;width:32px;height:32px;border-radius:50%;cursor:pointer;border:2px solid transparent;"></div>
        </div>
      </div>
      <button class="pomo-btn pomo-start" id="stickyToggle" style="width:100%;">Place Sticky Note</button>
      <p style="font-size:11px;color:#555;text-align:center;">Click on the page after pressing the button</p>
    </div>
  `;

  let stickyColor = 'yellow';

  document.querySelectorAll('.sticky-swatch').forEach(swatch => {
    swatch.addEventListener('click', () => {
      document.querySelectorAll('.sticky-swatch').forEach(s => s.style.border = '2px solid transparent');
      swatch.style.border = '2px solid white';
      stickyColor = swatch.dataset.color;
      sendToActiveTab({ type: 'STICKY_SET_COLOR', color: stickyColor });
    });
  });

  document.getElementById('stickyToggle').addEventListener('click', () => {
    sendToActiveTab({ type: 'STICKY_ACTIVATE' });
    window.close(); // Close popup so user can click on page
  });
}

// Helper — send message to current active tab
function sendToActiveTab(msg) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, msg);
    }
  });
}
// COLOR PICKER
function renderColorPicker() {
  toolContent.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:16px;padding:10px 0;align-items:center;">
      <div style="display:flex;gap:12px;align-items:center;width:100%;">
        <div id="colorPreview" style="
          width:60px;height:60px;border-radius:12px;flex-shrink:0;
          background:#1a1a1a;border:3px solid #2a2a2a;
          transition:background 0.2s;
        "></div>
        <div style="display:flex;flex-direction:column;gap:4px;">
          <span id="colorHex" style="font-size:20px;font-weight:700;letter-spacing:2px;color:white;">#000000</span>
          <span id="colorRgb" style="font-size:12px;color:#555;">rgb(0, 0, 0)</span>
        </div>
      </div>

      <div style="display:flex;gap:8px;width:100%;">
        <button class="pomo-btn pomo-start" id="copyHex" style="flex:1;font-size:12px;">Copy HEX</button>
        <button class="pomo-btn pomo-reset" id="copyRgb" style="flex:1;font-size:12px;">Copy RGB</button>
      </div>

      <button class="pomo-btn pomo-start" id="pickColor" style="width:100%;background:#ff4444;">
         Pick Color from Page
      </button>

      <div id="colorHistory" style="width:100%;">
        <div style="font-size:11px;color:#555;margin-bottom:6px;text-transform:uppercase;letter-spacing:1px;">Recent</div>
        <div id="historyDots" style="display:flex;gap:6px;flex-wrap:wrap;"></div>
      </div>

      <p style="font-size:11px;color:#555;text-align:center;">
        Click "Pick Color" then click any element on the page
      </p>
    </div>
  `;

  const preview = document.getElementById('colorPreview');
  const hexDisplay = document.getElementById('colorHex');
  const rgbDisplay = document.getElementById('colorRgb');
  const historyDots = document.getElementById('historyDots');
  let colorHistory = [];

  // Load last picked color and history
  chrome.storage.local.get(['picked_color', 'color_history'], (data) => {
    if (data.picked_color) updateColor(data.picked_color);
    if (data.color_history) {
      colorHistory = data.color_history;
      renderHistory();
    }
  });

  // Poll for new picked color every 500ms
  // This way popup stays open and updates when user picks
  let polling = setInterval(() => {
    chrome.storage.local.get('picked_color_timestamp', (data) => {
      if (data.picked_color_timestamp !== lastTimestamp) {
        lastTimestamp = data.picked_color_timestamp;
        chrome.storage.local.get('picked_color', (d) => {
          if (d.picked_color) updateColor(d.picked_color);
        });
      }
    });
  }, 300);

  let lastTimestamp = null;

  // Cleanup polling when leaving tool
  backBtn.addEventListener('click', () => clearInterval(polling), { once: true });

  function updateColor(hex) {
    preview.style.background = hex;
    hexDisplay.textContent = hex.toUpperCase();
    const r = parseInt(hex.slice(1,3),16);
    const g = parseInt(hex.slice(3,5),16);
    const b = parseInt(hex.slice(5,7),16);
    rgbDisplay.textContent = `rgb(${r}, ${g}, ${b})`;

    if (!colorHistory.includes(hex)) {
      colorHistory.unshift(hex);
      colorHistory = colorHistory.slice(0, 10);
      chrome.storage.local.set({ color_history: colorHistory });
      renderHistory();
    }
  }

  function renderHistory() {
    historyDots.innerHTML = '';
    colorHistory.forEach(hex => {
      const dot = document.createElement('div');
      dot.style.cssText = `width:24px;height:24px;border-radius:50%;background:${hex};cursor:pointer;border:2px solid #2a2a2a;`;
      dot.title = hex;
      dot.addEventListener('click', () => updateColor(hex));
      historyDots.appendChild(dot);
    });
  }

  document.getElementById('copyHex').addEventListener('click', () => {
    navigator.clipboard.writeText(hexDisplay.textContent);
    document.getElementById('copyHex').textContent = 'Copied!';
    setTimeout(() => document.getElementById('copyHex').textContent = 'Copy HEX', 1500);
  });

  document.getElementById('copyRgb').addEventListener('click', () => {
    navigator.clipboard.writeText(rgbDisplay.textContent);
    document.getElementById('copyRgb').textContent = 'Copied!';
    setTimeout(() => document.getElementById('copyRgb').textContent = 'Copy RGB', 1500);
  });

  document.getElementById('pickColor').addEventListener('click', () => {
    sendToActiveTab({ type: 'COLORPICKER_ACTIVATE' });
    // Don't close popup - just minimize it
    window.close();
  });
}

// RULER
function renderRuler() {
  toolContent.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:16px;padding:10px 0;">
      <p style="font-size:13px;color:#aaa;line-height:1.6;">
        Click and drag anywhere on the page to measure distances in pixels.
      </p>
      <div id="rulerPreview" style="
        background:#1a1a1a;border:1px solid #2a2a2a;
        border-radius:10px;padding:16px;text-align:center;
      ">
        <div style="display:flex;justify-content:center;align-items:center;gap:8px;margin-bottom:8px;">
          <div style="height:2px;background:#ff4444;width:30px;"></div>
          <span style="font-size:11px;color:#555;">RULER</span>
          <div style="height:2px;background:#ff4444;width:30px;"></div>
        </div>
        <div id="rulerW" style="font-size:20px;font-weight:700;color:#ff4444;">— × —</div>
        <div style="font-size:11px;color:#555;margin-top:4px;">width × height (px)</div>
      </div>
      <button class="pomo-btn pomo-start" id="rulerActivate" style="width:100%;">
         Activate Ruler
      </button>
      <p style="font-size:11px;color:#555;text-align:center;">
        After activating — click and drag on the page to measure
      </p>
    </div>
  `;

  document.getElementById('rulerActivate').addEventListener('click', () => {
    sendToActiveTab({ type: 'RULER_ACTIVATE' });
    window.close();
  });
}

// SCREENSHOT
function renderScreenshot() {
  toolContent.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:16px;padding:10px 0;">
      <p style="font-size:13px;color:#aaa;line-height:1.6;">
        Capture the current page as a PNG image.
      </p>
      <button class="pomo-btn pomo-start" id="visibleShot" style="width:100%;">
         Capture Visible Area
      </button>
      <button class="pomo-btn pomo-reset" id="fullShot" style="width:100%;">
         Capture Full Page
      </button>
      <div id="screenshotStatus" 
        style="font-size:12px;color:#aaa;text-align:center;min-height:20px;">
      </div>
    </div>
  `;

  const status = document.getElementById('screenshotStatus');

  // Visible shot — simple and reliable
  document.getElementById('visibleShot').addEventListener('click', () => {
    status.textContent = 'Capturing...';
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.captureVisibleTab(null, { format: 'png' }, (dataUrl) => {
        if (chrome.runtime.lastError) {
          status.textContent = 'Error: ' + chrome.runtime.lastError.message;
          return;
        }
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = `screenshot-${Date.now()}.png`;
        a.click();
        status.textContent = '✓ Saved!';
        setTimeout(() => status.textContent = '', 2000);
      });
    });
  });

  // Full page shot
  document.getElementById('fullShot').addEventListener('click', () => {
    status.textContent = 'Starting full page capture...';

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tabId = tabs[0].id;

      // Step 1 — get page dimensions
      chrome.scripting.executeScript({
        target: { tabId },
        func: () => ({
          totalHeight: document.documentElement.scrollHeight,
          viewportHeight: window.innerHeight,
          viewportWidth: window.innerWidth,
          originalScroll: window.scrollY
        })
      }, (results) => {
        if (!results || !results[0]) {
          status.textContent = 'Error getting page dimensions';
          return;
        }

        const { totalHeight, viewportHeight, viewportWidth, originalScroll } = results[0].result;
        const frames = [];
        let currentScroll = 0;

        status.textContent = `Capturing... 0%`;

        function captureFrame() {
          // Scroll to position
          chrome.scripting.executeScript({
            target: { tabId },
           func: (scrollY) => {
  // Hide fixed elements during capture to prevent duplication
  const fixedEls = document.querySelectorAll('*');
  const hidden = [];
  fixedEls.forEach(el => {
    const pos = getComputedStyle(el).position;
    if (pos === 'fixed' || pos === 'sticky') {
      hidden.push({ el, display: el.style.display });
      el.style.display = 'none';
    }
  });
  window.scrollTo(0, scrollY);
  // Store hidden elements to restore after capture
  window._toolboxHidden = hidden;
  return window.scrollY;
},
            args: [currentScroll]
          }, () => {
            // Wait for scroll and render
            setTimeout(() => {
              chrome.tabs.captureVisibleTab(null, { format: 'png' }, (dataUrl) => {
                if (chrome.runtime.lastError) {
                  status.textContent = 'Capture error: ' + chrome.runtime.lastError.message;
                  return;
                }

                frames.push({ dataUrl, scrollY: currentScroll });
                const percent = Math.min(100, Math.round((currentScroll / totalHeight) * 100));
                status.textContent = `Capturing... ${percent}%`;

                currentScroll += viewportHeight;

                if (currentScroll < totalHeight) {
                  captureFrame();
                } else {
                  // Restore scroll
                  chrome.scripting.executeScript({
                    target: { tabId },
                    func: (s) => window.scrollTo(0, s),
                    args: [originalScroll]
                  });

                  status.textContent = 'Stitching image...';
                  stitchFrames(frames, viewportWidth, viewportHeight, totalHeight, status);
                }
              });
            }, 400);
          });
        }

        // Restore fixed elements
chrome.scripting.executeScript({
  target: { tabId },
  func: () => {
    if (window._toolboxHidden) {
      window._toolboxHidden.forEach(({ el, display }) => {
        el.style.display = display;
      });
      window._toolboxHidden = null;
    }
  }
});

        captureFrame();
      });
    });
  });
}

// Stitch frames in popup context using canvas
function stitchFrames(frames, width, viewportHeight, totalHeight, status) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = totalHeight;
  const ctx = canvas.getContext('2d');

  let loaded = 0;

  frames.forEach((frame) => {
    const img = new Image();
    img.onload = () => {
      // For the last frame, only draw the remaining portion
      const isLast = frame.scrollY + viewportHeight > totalHeight;
      if (isLast) {
        const remaining = totalHeight - frame.scrollY;
        const srcY = viewportHeight - remaining;
        ctx.drawImage(img, 0, srcY, width, remaining, 0, frame.scrollY, width, remaining);
      } else {
        ctx.drawImage(img, 0, frame.scrollY);
      }

      loaded++;
      if (loaded === frames.length) {
        // Download
        const dataUrl = canvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = `fullpage-${Date.now()}.png`;
        a.click();
        status.textContent = '✓ Full page saved!';
        setTimeout(() => status.textContent = '', 3000);
      }
    };
    img.src = frame.dataUrl;
  });
}

// READER MODE
function renderReaderMode() {
  toolContent.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:16px;padding:10px 0;">
      <p style="font-size:13px;color:#aaa;line-height:1.6;">
        Strip away ads, sidebars, and clutter for clean reading.
      </p>
      <button class="pomo-btn pomo-start" id="readerToggle" style="width:100%;">
         Enter Reader Mode
      </button>
      <button class="pomo-btn pomo-reset" id="readerExit" style="width:100%;">
        ✕ Exit Reader Mode
      </button>
      <p style="font-size:11px;color:#555;text-align:center;">
        You can also exit by clicking the button on the page itself
      </p>
    </div>
  `;

  document.getElementById('readerToggle').addEventListener('click', () => {
    sendToActiveTab({ type: 'READER_TOGGLE' });
    window.close();
  });

  document.getElementById('readerExit').addEventListener('click', () => {
    sendToActiveTab({ type: 'READER_TOGGLE' });
    window.close();
  });
}

// IMAGE DOWNLOADER
function renderImageDownloader() {
  toolContent.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:12px;padding:10px 0;">
      <p style="font-size:13px;color:#aaa;line-height:1.6;">
        Find and download all images on the current page.
      </p>
      <button class="pomo-btn pomo-start" id="scanImages" style="width:100%;"> Scan Page Images</button>
      <div id="imageResults" style="
        max-height:180px;overflow-y:auto;
        display:flex;flex-direction:column;gap:6px;
      "></div>
      <div id="imgStatus" style="font-size:12px;color:#555;text-align:center;"></div>
    </div>
  `;

  document.getElementById('scanImages').addEventListener('click', () => {
    const status = document.getElementById('imgStatus');
    const results = document.getElementById('imageResults');
    status.textContent = 'Scanning...';
    results.innerHTML = '';

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        func: () => {
          return Array.from(document.querySelectorAll('img'))
            .filter(img => img.naturalWidth > 100 && img.naturalHeight > 100 && img.src)
            .map(img => ({ src: img.src, alt: img.alt || 'image' }))
            .slice(0, 20);
        }
      }, (results_raw) => {
        const images = results_raw?.[0]?.result || [];
        status.textContent = `Found ${images.length} images`;

        if (images.length === 0) {
          results.innerHTML = '<p style="color:#555;font-size:12px;text-align:center;">No images found</p>';
          return;
        }

        images.forEach((img, i) => {
          const row = document.createElement('div');
          row.style.cssText = 'display:flex;align-items:center;gap:8px;background:#1a1a1a;border-radius:8px;padding:6px;';
          row.innerHTML = `
            <img src="${img.src}" style="width:40px;height:40px;object-fit:cover;border-radius:4px;flex-shrink:0;">
            <span style="font-size:11px;color:#aaa;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${img.alt}</span>
            <button style="
              background:#ff4444;border:none;color:white;
              padding:4px 8px;border-radius:4px;cursor:pointer;
              font-size:11px;flex-shrink:0;
            " data-src="${img.src}">DL</button>
          `;
          row.querySelector('button').addEventListener('click', (e) => {
            const a = document.createElement('a');
            a.href = e.target.dataset.src;
            a.download = `image-${i + 1}.png`;
            a.target = '_blank';
            a.click();row.querySelector('button').addEventListener('click', (e) => {
            const src = e.target.dataset.src;
            // Fetch image as blob to force download
            fetch(src)
              .then(r => r.blob())
              .then(blob => {
                const reader = new FileReader();
                reader.onload = () => {
                  const a = document.createElement('a');
                  a.href = reader.result;
                  a.download = `image-${i + 1}.png`;
                  a.click();
                };
                reader.readAsDataURL(blob);
              })
              .catch(() => {
                // Fallback — open in new tab
                chrome.tabs.create({ url: src });
              });
          });
          });
          results.appendChild(row);
        });
      });
    });
  });
}
// Initialize icons
lucide.createIcons();