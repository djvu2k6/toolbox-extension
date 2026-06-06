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
      clearInterval(pomodoroInterval);
      pomodoroInterval = setInterval(tick, 1000);
    }
    sendResponse({ ...pomodoroState });
  }

  if (msg.type === 'POMO_PAUSE') {
    pomodoroState.running = false;
    clearInterval(pomodoroInterval);
    saveState();
    sendResponse({ ...pomodoroState });
  }

  if (msg.type === 'POMO_RESET') {
    clearInterval(pomodoroInterval);
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

function tick() {
  if (pomodoroState.seconds <= 0) {
    clearInterval(pomodoroInterval);
    pomodoroState.running = false;
    pomodoroState.sessions++;
    pomodoroState.seconds = pomodoroState.customMinutes * 60;
    saveState();

    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: '🍅 Toolbox Pomodoro',
      message: `Session ${pomodoroState.sessions} complete! Time for a break.`
    });
    return;
  }

  pomodoroState.seconds--;
  saveState();
}