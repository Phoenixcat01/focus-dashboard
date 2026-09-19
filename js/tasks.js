import {
  getState,
  updateState,
  subscribe
} from "./storage.js";

const elements = {
  form: document.querySelector("#task-form"),
  input: document.querySelector("#task-input"),
  list: document.querySelector("#task-list"),
  emptyState: document.querySelector("#task-empty-state"),
  count: document.querySelector("#task-count")
};

function createTaskId() {
  return `task-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

function escapeHTML(value) {
  const element = document.createElement("div");
  element.textContent = value;
  return element.innerHTML;
}

function addTask(title) {
  const cleanTitle = title.trim();

  if (!cleanTitle) {
    return;
  }

  const task = {
    id: createTaskId(),
    title: cleanTitle,
    completed: false,
    createdAt: Date.now()
  };

  updateState((state) => ({
    ...state,
    tasks: [...state.tasks, task]
  }));
}

function toggleTask(taskId) {
  updateState((state) => ({
    ...state,
    tasks: state.tasks.map((task) =>
      task.id === taskId
        ? { ...task, completed: !task.completed }
        : task
    )
  }));
}

function deleteTask(taskId) {
  updateState((state) => ({
    ...state,
    tasks: state.tasks.filter((task) => task.id !== taskId)
  }));
}

function editTask(taskId, title) {
  const cleanTitle = title.trim();

  if (!cleanTitle) {
    return;
  }

  updateState((state) => ({
    ...state,
    tasks: state.tasks.map((task) =>
      task.id === taskId
        ? {
            ...task,
            title: cleanTitle,
            updatedAt: Date.now()
          }
        : task
    )
  }));
}

function getTaskStats(tasks) {
  const completed = tasks.filter((task) => task.completed).length;

  return {
    total: tasks.length,
    completed,
    remaining: tasks.length - completed
  };
}

function renderTasks(state) {
  const stats = getTaskStats(state.tasks);

  elements.list.innerHTML = "";
  elements.emptyState.hidden = state.tasks.length > 0;

  elements.count.textContent = `${stats.remaining} ${
    stats.remaining === 1 ? "task" : "tasks"
  } left`;

  state.tasks.forEach((task) => {
    elements.list.appendChild(createTaskElement(task));
  });
}

function createTaskElement(task) {
  const article = document.createElement("article");

  article.className = "task-item";

  if (task.completed) {
    article.classList.add("is-completed");
  }

  article.dataset.taskId = task.id;

  article.innerHTML = `
    <div class="task-main">
      <input
        class="task-checkbox"
        type="checkbox"
        ${task.completed ? "checked" : ""}
        aria-label="Complete ${escapeHTML(task.title)}"
      />

      <span class="task-title">
        ${escapeHTML(task.title)}
      </span>
    </div>

    <div class="task-actions">
      <button
        class="button button-ghost task-edit"
        type="button"
        aria-label="Edit ${escapeHTML(task.title)}"
      >
        <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 20h9"></path>
          <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z"></path>
        </svg>
        <span>Edit</span>
      </button>

      <button
        class="button button-ghost task-delete"
        type="button"
        aria-label="Delete ${escapeHTML(task.title)}"
      >
        <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M3 6h18"></path>
          <path d="M8 6V4h8v2"></path>
          <path d="m19 6-1 15H6L5 6"></path>
          <path d="M10 11v6M14 11v6"></path>
        </svg>
        <span>Delete</span>
      </button>
    </div>
  `;

  return article;
}

function enterEditMode(taskItem) {
  const taskId = taskItem.dataset.taskId;
  const task = getState().tasks.find((item) => item.id === taskId);

  if (!task) {
    return;
  }

  taskItem.innerHTML = `
    <form class="task-edit-form">
      <label class="sr-only" for="edit-${task.id}">
        Edit task
      </label>

      <input
        id="edit-${task.id}"
        class="task-edit-input"
        type="text"
        value="${escapeHTML(task.title)}"
        maxlength="120"
        required
      />

      <div class="task-actions">
        <button
          class="button button-primary"
          type="submit"
        >
          <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
            <path d="m5 12 4 4L19 6"></path>
          </svg>
          <span>Save</span>
        </button>

        <button
          class="button button-ghost task-cancel-edit"
          type="button"
        >
          <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 6l12 12M18 6 6 18"></path>
          </svg>
          <span>Cancel</span>
        </button>
      </div>
    </form>
  `;

  const input = taskItem.querySelector(".task-edit-input");
  input.focus();
  input.select();
}

function restoreTaskElement(taskItem) {
  const taskId = taskItem.dataset.taskId;
  const task = getState().tasks.find((item) => item.id === taskId);

  if (!task) {
    return;
  }

  taskItem.replaceWith(createTaskElement(task));
}

function handleFormSubmit(event) {
  event.preventDefault();

  if (!elements.input.value.trim()) {
    elements.input.focus();
    return;
  }

  addTask(elements.input.value);
  elements.form.reset();
  elements.input.focus();
}

function handleListClick(event) {
  const taskItem = event.target.closest(".task-item");

  if (!taskItem) {
    return;
  }

  const taskId = taskItem.dataset.taskId;

  if (event.target.closest(".task-delete")) {
    deleteTask(taskId);
    return;
  }

  if (event.target.closest(".task-edit")) {
    enterEditMode(taskItem);
    return;
  }

  if (event.target.closest(".task-cancel-edit")) {
    restoreTaskElement(taskItem);
  }
}

function handleListChange(event) {
  if (!event.target.classList.contains("task-checkbox")) {
    return;
  }

  const taskItem = event.target.closest(".task-item");

  if (taskItem) {
    toggleTask(taskItem.dataset.taskId);
  }
}

function handleEditSubmit(event) {
  const form = event.target.closest(".task-edit-form");

  if (!form) {
    return;
  }

  event.preventDefault();

  const taskItem = form.closest(".task-item");
  const input = form.querySelector(".task-edit-input");

  if (!input.value.trim()) {
    input.focus();
    return;
  }

  editTask(taskItem.dataset.taskId, input.value);
}

function initializeTasks() {
  if (!elements.form || !elements.input || !elements.list) {
    return;
  }

  elements.form.addEventListener("submit", handleFormSubmit);
  elements.list.addEventListener("click", handleListClick);
  elements.list.addEventListener("change", handleListChange);
  elements.list.addEventListener("submit", handleEditSubmit);

  subscribe(renderTasks);
  renderTasks(getState());
}

export {
  initializeTasks
};
