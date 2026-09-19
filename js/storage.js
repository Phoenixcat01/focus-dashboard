const STORAGE_KEY = "focus-dashboard-state";

const DEFAULT_STATE = {
  tasks: [],

  timer: {
    duration: 25 * 60,
    remaining: 25 * 60,
    status: "idle",
    endTime: null
  },

  sessionsCompleted: 0,

  theme: "light"
};

let state = loadState();

const listeners = new Set();

function loadState() {
  try {
    const savedState =
      localStorage.getItem(STORAGE_KEY);

    if (!savedState) {
      return structuredClone(DEFAULT_STATE);
    }

    const parsedState =
      JSON.parse(savedState);

    return {
      ...structuredClone(DEFAULT_STATE),
      ...parsedState,

      timer: {
        ...DEFAULT_STATE.timer,
        ...parsedState.timer
      }
    };
  } catch (error) {
    console.error(
      "Failed to load Focus state:",
      error
    );

    return structuredClone(DEFAULT_STATE);
  }
}

function saveState() {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(state)
    );
  } catch (error) {
    console.error(
      "Failed to save Focus state:",
      error
    );
  }
}

function getState() {
  return state;
}

function updateState(updater) {
  const nextState = updater(state);

  if (!nextState) {
    return;
  }

  state = nextState;

  saveState();

  listeners.forEach((listener) => {
    listener(state);
  });
}

function subscribe(listener) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

function resetState() {
  state = structuredClone(DEFAULT_STATE);

  saveState();

  listeners.forEach((listener) => {
    listener(state);
  });
}

export {
  getState,
  updateState,
  subscribe,
  saveState,
  resetState
};