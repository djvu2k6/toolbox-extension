// Default state
const DEFAULT_STATE = {
  seconds: 25 * 60,
  running: false,
  sessions: 0,
  customMinutes: 25
};

let pomodoroState = { ...DEFAULT_STATE };
let pomodoroInterval = null;

// Load persisted state on startup
chrome.storage.local.get('pomodoro_state', (data) => {
  if (data.pomodoro_state) {
    pomodoroState = data.pomodoro_state;
    // If it was running when browser closed, don't auto-resume
    // Just mark it as paused
    pomodoroState.running = false;
  }
});

function saveState() {
  chrome.storage.local.set({ pomodoro_state: pomodoroState });
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'POMO_GET_STATE') {
    sendResponse({ ...pomodoroState });
  }

  if (msg.type === 'POMO_START') {
    if (!pomodoroState.running) {
      pomodoroState.running = true;
      saveState();
      startAlarm(); // replaced setInterval
    }
    sendResponse({ ...pomodoroState });
  }

  if (msg.type === 'POMO_PAUSE') {
    pomodoroState.running = false;
    stopAlarm(); // replaced clearInterval
    saveState();
    sendResponse({ ...pomodoroState });
  }

  if (msg.type === 'POMO_RESET') {
    stopAlarm();
    pomodoroState.running = false;
    pomodoroState.seconds = pomodoroState.customMinutes * 60;
    saveState();
    sendResponse({ ...pomodoroState });
  }

  if (msg.type === 'POMO_SET_DURATION') {
    clearInterval(pomodoroInterval);
    pomodoroState.running = false;
    pomodoroState.customMinutes = msg.minutes;
    pomodoroState.seconds = msg.minutes * 60;
    saveState();
    sendResponse({ ...pomodoroState });
  }

  return true;
});

// Replace setInterval with alarms for reliability
function startAlarm() {
  chrome.alarms.create('pomodoro_tick', { periodInMinutes: 1/60 });
}

function stopAlarm() {
  chrome.alarms.clear('pomodoro_tick');
}

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'pomodoro_tick' && pomodoroState.running) {
    tick();
  }
});

function tick() {
  if (pomodoroState.seconds <= 0) {
    stopAlarm();
    pomodoroState.running = false;
    pomodoroState.sessions++;
    pomodoroState.seconds = pomodoroState.customMinutes * 60;
    saveState();

    chrome.notifications.create(`pomo_done_${Date.now()}`, {
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: '🍅 Pomodoro Complete!',
      message: `Session ${pomodoroState.sessions} done! Take a 5 minute break.`,
      priority: 2
    });
    return;
  }
  pomodoroState.seconds--;
  saveState();
}

let fullPageFrames = [];
let fullPageMeta = {};

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'FULLPAGE_START') {
    fullPageFrames = [];
    fullPageMeta = {
      totalHeight: msg.totalHeight,
      viewportHeight: msg.viewportHeight,
      viewportWidth: msg.viewportWidth
    };
    sendResponse({});
  }

  if (msg.type === 'FULLPAGE_CAPTURE_FRAME') {
    chrome.tabs.captureVisibleTab(null, { format: 'png' }, (dataUrl) => {
      fullPageFrames.push({ dataUrl, scrollY: msg.scrollY });
      sendResponse({});
    });
    return true;
  }

  if (msg.type === 'FULLPAGE_STITCH') {
    stitchFrames();
    sendResponse({});
  }

  return true;
});

function stitchFrames() {
  const { totalHeight, viewportHeight, viewportWidth } = fullPageMeta;

  // Use offscreen canvas to stitch
  const canvas = new OffscreenCanvas(viewportWidth, totalHeight);
  const ctx = canvas.getContext('2d');

  let processed = 0;

  fullPageFrames.forEach((frame) => {
    fetch(frame.dataUrl)
      .then(r => r.blob())
      .then(blob => createImageBitmap(blob))
      .then(bitmap => {
        ctx.drawImage(bitmap, 0, frame.scrollY);
        processed++;
        if (processed === fullPageFrames.length) {
          canvas.convertToBlob({ type: 'image/png' }).then(blob => {
            const url = URL.createObjectURL(blob);
            chrome.downloads.download({
              url,
              filename: `fullpage-${Date.now()}.png`
            });
            chrome.storage.local.set({ fullpage_capture_done: true });
          });
        }
      });
  });
}