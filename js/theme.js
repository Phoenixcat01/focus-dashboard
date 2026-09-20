import {
  getState,
  updateState,
  subscribe
} from "./storage.js";

const themeToggle =
  document.querySelector(
    "#theme-toggle"
  );

const themeLabel =
  document.querySelector(
    "#theme-toggle-label"
  );

function applyTheme(theme) {
  document.documentElement
    .dataset.theme = theme;

  const isDark =
    theme === "dark";

  if (themeToggle) {
    themeToggle.setAttribute(
      "aria-pressed",
      String(isDark)
    );

    themeToggle.setAttribute(
      "aria-label",
      isDark
        ? "Switch to light mode"
        : "Switch to dark mode"
    );
  }

  if (themeLabel) {
    themeLabel.textContent =
      isDark
        ? "Light mode"
        : "Dark mode";
  }
}

function toggleTheme() {
  const currentTheme =
    getState().theme;

  const nextTheme =
    currentTheme === "dark"
      ? "light"
      : "dark";

  updateState(
    (currentState) => ({
      ...currentState,
      theme: nextTheme
    })
  );
}

function initializeTheme() {
  if (!themeToggle) {
    return;
  }

  themeToggle.addEventListener(
    "click",
    toggleTheme
  );

  subscribe((state) => {
    applyTheme(state.theme);
  });

  applyTheme(
    getState().theme
  );
}

export {
  initializeTheme
};