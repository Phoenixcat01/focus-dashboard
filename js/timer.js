import {
  getState,
  updateState,
  subscribe
} from "./storage.js";

const elements = {
  display: document.querySelector("#timer-display"),
  status: document.querySelector("#timer-status"),
  progressBar: document.querySelector("#timer-progress-bar"),
  progressTrack: document.querySelector(".progress-track"),
  announcement: document.querySelector("#timer-announcement"),
  sessionCount: document.querySelector("#session-count"),
  startButton: document.querySelector("#start-timer"),
  pauseButton: document.querySelector("#pause-timer"),
  resetButton: document.querySelector("#reset-timer")
};

let intervalId = null;

function getTimer() {
  return getState().timer;
}

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

function renderTimer(state) {
  const timer = state.timer;

  elements.display.textContent = formatTime(timer.remaining);

  const progress = timer.duration
    ? timer.remaining / timer.duration
    : 0;

  const safeProgress = Math.max(0, Math.min(1, progress));
  const progressPercent = Math.round((1 - safeProgress) * 100);

  elements.progressBar.style.transform = `scaleX(${safeProgress})`;
  elements.progressTrack.setAttribute("aria-valuenow", String(progressPercent));

  const labels = {
    idle: "Ready",
    running: "Focusing",
    paused: "Paused",
    completed: "Complete"
  };

  elements.status.textContent = labels[timer.status];
  elements.status.dataset.status = timer.status;

  elements.startButton.disabled = timer.status === "running";
  elements.pauseButton.disabled = timer.status !== "running";

  if (timer.status === "paused") {
    elements.startButton.querySelector("span").textContent = "Resume";
  } else if (timer.status === "completed") {
    elements.startButton.querySelector("span").textContent =
      "Start another session";
  } else {
    elements.startButton.querySelector("span").textContent = "Start";
  }
}

function renderSessionCount(state) {
  if (elements.sessionCount) {
    elements.sessionCount.textContent = state.sessionsCompleted;
  }
}

function render(state) {
  renderTimer(state);
  renderSessionCount(state);
}

function stopTicking() {
  if (intervalId !== null) {
    window.clearInterval(intervalId);
    intervalId = null;
  }
}

function updateTimerFromClock() {
  const timer = getTimer();

  if (timer.status !== "running" || !timer.endTime) {
    return;
  }

  const remaining = Math.max(0, (timer.endTime - Date.now()) / 1000);

  if (remaining <= 0) {
    completeTimer();
    return;
  }

  updateState((state) => ({
    ...state,
    timer: {
      ...state.timer,
      remaining
    }
  }));
}

function startTicking() {
  stopTicking();
  intervalId = window.setInterval(updateTimerFromClock, 250);
}

function startTimer() {
  const timer = getTimer();

  if (timer.status === "running") {
    return;
  }

  const endTime = Date.now() + timer.remaining * 1000;

  updateState((state) => ({
    ...state,
    timer: {
      ...state.timer,
      status: "running",
      endTime
    }
  }));

  startTicking();
  announce("Focus session started.");
}

function pauseTimer() {
  if (getTimer().status !== "running") {
    return;
  }

  updateTimerFromClock();

  const latestTimer = getTimer();

  if (latestTimer.status !== "running") {
    return;
  }

  updateState((state) => ({
    ...state,
    timer: {
      ...state.timer,
      status: "paused",
      endTime: null
    }
  }));

  stopTicking();
  announce("Focus session paused.");
}

function resetTimer() {
  stopTicking();

  updateState((state) => ({
    ...state,
    timer: {
      duration: state.timer.duration,
      remaining: state.timer.duration,
      status: "idle",
      endTime: null
    }
  }));

  announce("Focus session reset.");
}

function completeTimer() {
  stopTicking();

  if (getTimer().status === "completed") {
    return;
  }

  updateState((state) => ({
    ...state,
    timer: {
      ...state.timer,
      remaining: 0,
      status: "completed",
      endTime: null
    },
    sessionsCompleted: state.sessionsCompleted + 1
  }));

  announce("Focus session complete.");
}

function handleStart() {
  if (getTimer().status === "completed") {
    updateState((state) => ({
      ...state,
      timer: {
        ...state.timer,
        remaining: state.timer.duration,
        status: "idle"
      }
    }));
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

  if (isTyping || event.ctrlKey || event.metaKey || event.altKey) {
    return;
  }

  if (event.code === "Space") {
    event.preventDefault();

    if (getTimer().status === "running") {
      pauseTimer();
    } else {
      handleStart();
    }
  }

  if (event.key.toLowerCase() === "r") {
    resetTimer();
  }
}

function handleVisibilityChange() {
  if (
    document.visibilityState === "visible" &&
    getTimer().status === "running"
  ) {
    updateTimerFromClock();
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

  elements.startButton.addEventListener("click", handleStart);
  elements.pauseButton.addEventListener("click", pauseTimer);
  elements.resetButton.addEventListener("click", resetTimer);

  window.addEventListener("keydown", handleKeyboard);
  document.addEventListener("visibilitychange", handleVisibilityChange);

  subscribe(render);
  render(getState());

  const timer = getTimer();

  if (timer.status === "running") {
    if (timer.endTime && Date.now() >= timer.endTime) {
      completeTimer();
    } else {
      startTicking();
    }
  }
}

export {
  initializeTimer
};
