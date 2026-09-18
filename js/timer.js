const TIMER_DURATION = 25 * 60;

const timerState = {
  status: "idle",
  duration: TIMER_DURATION,
  remaining: TIMER_DURATION,
  endTime: null,
  intervalId: null
};

const elements = {
  display: document.querySelector("#timer-display"),
  status: document.querySelector("#timer-status"),
  progressBar: document.querySelector("#timer-progress-bar"),
  announcement: document.querySelector("#timer-announcement"),

  startButton: document.querySelector("#start-timer"),
  pauseButton: document.querySelector("#pause-timer"),
  resetButton: document.querySelector("#reset-timer")
};

function formatTime(seconds) {
  const safeSeconds = Math.max(0, Math.ceil(seconds));

  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(
    remainingSeconds
  ).padStart(2, "0")}`;
}

function announce(message) {
  if (!elements.announcement) {
    return;
  }

  elements.announcement.textContent = "";

  window.setTimeout(() => {
    elements.announcement.textContent = message;
  }, 10);
}

function updateDisplay() {
  elements.display.textContent = formatTime(
    timerState.remaining
  );
}

function updateProgress() {
  const progress =
    timerState.remaining / timerState.duration;

  elements.progressBar.style.transform =
    `scaleX(${Math.max(0, Math.min(1, progress))})`;
}

function updateStatus() {
  const statusLabels = {
    idle: "Ready",
    running: "Focusing",
    paused: "Paused",
    completed: "Complete"
  };

  const status = timerState.status;

  elements.status.textContent =
    statusLabels[status];

  elements.status.dataset.status = status;
}

function updateButtons() {
  const {
    status
  } = timerState;

  elements.startButton.disabled =
    status === "running";

  elements.pauseButton.disabled =
    status !== "running";

  if (status === "paused") {
    elements.startButton.textContent = "Resume";
  } else if (status === "completed") {
    elements.startButton.textContent =
      "Start another session";
  } else {
    elements.startButton.textContent = "Start";
  }
}

function renderTimer() {
  updateDisplay();
  updateProgress();
  updateStatus();
  updateButtons();
}

function clearTimerInterval() {
  if (timerState.intervalId !== null) {
    window.clearInterval(timerState.intervalId);

    timerState.intervalId = null;
  }
}

function tick() {
  if (timerState.status !== "running") {
    return;
  }

  const now = Date.now();

  const remainingMilliseconds =
    timerState.endTime - now;

  timerState.remaining =
    Math.max(0, remainingMilliseconds / 1000);

  if (timerState.remaining <= 0) {
    completeTimer();
    return;
  }

  renderTimer();
}

function startTimer() {
  if (timerState.status === "running") {
    return;
  }

  const now = Date.now();

  timerState.endTime =
    now + timerState.remaining * 1000;

  timerState.status = "running";

  clearTimerInterval();

  timerState.intervalId =
    window.setInterval(tick, 250);

  renderTimer();

  announce("Focus session started.");
}

function pauseTimer() {
  if (timerState.status !== "running") {
    return;
  }

  tick();

  timerState.status = "paused";

  timerState.endTime = null;

  clearTimerInterval();

  renderTimer();

  announce("Focus session paused.");
}

function resetTimer() {
  clearTimerInterval();

  timerState.status = "idle";

  timerState.remaining =
    timerState.duration;

  timerState.endTime = null;

  renderTimer();

  announce("Focus session reset.");
}

function completeTimer() {
  clearTimerInterval();

  timerState.remaining = 0;

  timerState.endTime = null;

  timerState.status = "completed";

  renderTimer();

  announce("Focus session complete.");
}

function handleStart() {
  if (timerState.status === "completed") {
    timerState.remaining =
      timerState.duration;
  }

  startTimer();
}

function handleKeyboard(event) {
  const target = event.target;

  const isTyping =
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement ||
    target.isContentEditable;

  if (isTyping) {
    return;
  }

  if (event.code === "Space") {
    event.preventDefault();

    if (timerState.status === "running") {
      pauseTimer();
    } else {
      handleStart();
    }

    return;
  }

  if (event.key.toLowerCase() === "r") {
    resetTimer();
  }
}

function handleVisibilityChange() {
  if (
    document.visibilityState === "visible" &&
    timerState.status === "running"
  ) {
    tick();
  }
}

function initializeTimer() {
  if (
    !elements.display ||
    !elements.startButton ||
    !elements.pauseButton ||
    !elements.resetButton
  ) {
    return;
  }

  elements.startButton.addEventListener(
    "click",
    handleStart
  );

  elements.pauseButton.addEventListener(
    "click",
    pauseTimer
  );

  elements.resetButton.addEventListener(
    "click",
    resetTimer
  );

  window.addEventListener(
    "keydown",
    handleKeyboard
  );

  document.addEventListener(
    "visibilitychange",
    handleVisibilityChange
  );

  renderTimer();
}

export {
  initializeTimer
};