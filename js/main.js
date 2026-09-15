const dayConfig = {
  monday: {
    label: "Monday",
    short: "Mon",
    number: "001",
    code: "DAY 01",
    color: "#CEDDEB",
    accent: "#F6385A",
    copy: "fresh week\nfresh start"
  },
  tuesday: {
    label: "Tuesday",
    short: "Tue",
    number: "002",
    code: "DAY 02",
    color: "#F4A0BC",
    accent: "#F6385A",
    copy: "take small steps\nmake steady progress"
  },
  wednesday: {
    label: "Wednesday",
    short: "Wed",
    number: "003",
    code: "DAY 03",
    color: "#F9DB99",
    accent: "#F47A20",
    copy: "midweek glow\nkeep going"
  },
  thursday: {
    label: "Thursday",
    short: "Thu",
    number: "004",
    code: "DAY 04",
    color: "#AED5C7",
    accent: "#F6385A",
    copy: "slow down\nstay grounded"
  },
  friday: {
    label: "Friday",
    short: "Fri",
    number: "005",
    code: "DAY 05",
    color: "#F47A20",
    accent: "#F47A20",
    copy: "finish bright\nweekend in sight"
  },
  saturday: {
    label: "Saturday",
    short: "Sat",
    number: "006",
    code: "DAY 06",
    color: "#F6385A",
    accent: "#F6385A",
    copy: "make it fun\nmake it yours"
  },
  sunday: {
    label: "Sunday",
    short: "Sun",
    number: "007",
    code: "DAY 07",
    color: "#FFB495",
    accent: "#F47A20",
    copy: "soft reset\nfor tomorrow"
  }
};

const state = {
  selectedDay: "tuesday",
  timerSeconds: 19 * 60 + 46,
  timerRunning: false,
  timerId: null,
  taskSequence: 1
};

const views = {
  shelf: document.querySelector("#shelf-view"),
  detail: document.querySelector("#detail-view"),
  board: document.querySelector("#board-view")
};

function showView(name) {
  Object.entries(views).forEach(([key, view]) => {
    const active = key === name;
    view.hidden = !active;
    view.classList.toggle("planner__view--active", active);
  });
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function applySelectedDay(day) {
  const config = dayConfig[day];
  if (!config) return;

  state.selectedDay = day;
  document.documentElement.style.setProperty("--selected-day", config.color);
  document.documentElement.style.setProperty("--selected-accent", config.accent);

  document.querySelector(".cassette-detail__number").textContent = config.number;
  document.querySelector(".cassette-detail__day-code").textContent = config.code;
  document.querySelector(".cassette-detail__tape-name").textContent = config.label.toUpperCase();
  document.querySelector(".cassette-detail__title").textContent = config.label;

  const openTaskButton = document.querySelector('[data-action="open-tasks"]');
  openTaskButton.textContent = `Open ${config.label}'s Tasks →`;

  document.querySelector(".task-board__title").textContent = config.label;
  document.querySelector(".task-board__case-title").innerHTML = `${config.label.toUpperCase()}<br>FOCUS`;
  document.querySelector(".task-board__case-copy").innerHTML = config.copy.replace("\n", "<br>");
  document.querySelector(".task-board__mini-label").textContent = config.label.toUpperCase();

  document.querySelectorAll(".day-nav__item").forEach((button) => {
    const active = button.dataset.day === day;
    button.classList.toggle("day-nav__item--active", active);
    button.setAttribute("aria-current", active ? "true" : "false");
  });
}

function formatTimer(seconds) {
  const safeSeconds = Math.max(0, seconds);
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
}

function renderTimer() {
  const timer = document.querySelector("[data-timer]");
  timer.textContent = formatTimer(state.timerSeconds);
}

function setTimerRunning(running) {
  state.timerRunning = running;
  const toggleButton = document.querySelector('[data-action="toggle-timer"]');
  toggleButton.textContent = running ? "Ⅱ" : "▶";
  toggleButton.setAttribute("aria-label", running ? "Pause timer" : "Start timer");

  if (state.timerId) {
    window.clearInterval(state.timerId);
    state.timerId = null;
  }

  if (running) {
    state.timerId = window.setInterval(() => {
      if (state.timerSeconds <= 0) {
        setTimerRunning(false);
        return;
      }
      state.timerSeconds -= 1;
      renderTimer();
    }, 1000);
  }
}

function updateTaskStats() {
  const todo = document.querySelector('[data-column="todo"]');
  const progress = document.querySelector('[data-column="progress"]');
  const done = document.querySelector('[data-column="done"]');

  const todoCount = todo.querySelectorAll(".task-card").length;
  const progressCount = progress.querySelectorAll(".task-card").length;
  const doneCount = done.querySelectorAll(".task-card").length;
  const total = todoCount + progressCount + doneCount;
  const completion = total ? Math.round((doneCount / total) * 100) : 0;

  document.querySelector('[data-count="todo"]').textContent = todoCount;
  document.querySelector('[data-count="progress"]').textContent = progressCount;
  document.querySelector('[data-count="done"]').textContent = doneCount;
  document.querySelector("[data-task-count]").textContent = total;
  document.querySelector("[data-done-count]").textContent = doneCount;
  document.querySelector("[data-completion]").textContent = `${completion}%`;
  document.querySelector("[data-progress-bar]").style.width = `${completion}%`;

  done.classList.toggle("kanban__cards--empty", doneCount === 0);
  let empty = done.querySelector(".kanban__empty");
  if (doneCount === 0 && !empty) {
    empty = document.createElement("p");
    empty.className = "kanban__empty";
    empty.textContent = "Nothing finished yet";
    done.appendChild(empty);
  } else if (doneCount > 0 && empty) {
    empty.remove();
  }
}

function moveTask(card) {
  const currentColumn = card.closest("[data-column]");
  if (!currentColumn) return;

  const columnName = currentColumn.dataset.column;
  const nextColumnName = columnName === "todo" ? "progress" : "done";
  if (columnName === "done") return;

  const nextColumn = document.querySelector(`[data-column="${nextColumnName}"]`);
  const empty = nextColumn.querySelector(".kanban__empty");
  if (empty) empty.remove();
  nextColumn.classList.remove("kanban__cards--empty");

  if (nextColumnName === "progress") {
    card.classList.add("task-card--active");
    card.querySelector(".task-card__check").setAttribute("aria-label", `Mark ${card.querySelector(".task-card__title").textContent} as done`);
  } else {
    card.classList.remove("task-card--active");
    card.querySelector(".task-card__check").setAttribute("aria-label", "Task completed");
  }

  nextColumn.appendChild(card);
  updateTaskStats();
}

function addTask() {
  const todo = document.querySelector('[data-column="todo"]');
  const card = document.createElement("article");
  const taskNumber = state.taskSequence++;
  card.className = "task-card";
  card.dataset.taskId = `new-task-${taskNumber}`;
  card.innerHTML = `
    <button class="task-card__check" type="button" aria-label="Move New task ${taskNumber} to in progress"></button>
    <div class="task-card__content">
      <h4 class="task-card__title">New task ${taskNumber}</h4>
      <p class="task-card__time">15 min</p>
    </div>
  `;
  todo.appendChild(card);
  updateTaskStats();
}

document.addEventListener("click", (event) => {
  const dayButton = event.target.closest("[data-day]");
  if (dayButton) {
    applySelectedDay(dayButton.dataset.day);
    if (dayButton.classList.contains("tape-shelf__item")) showView("detail");
    return;
  }

  const actionElement = event.target.closest("[data-action]");
  if (actionElement) {
    const action = actionElement.dataset.action;

    if (action === "go-shelf" || action === "back-shelf") {
      event.preventDefault();
      showView("shelf");
    }

    if (action === "open-planner") {
      showView("shelf");
      document.querySelector(".tape-shelf__list").scrollIntoView({ behavior: "smooth", block: "center" });
    }

    if (action === "open-tasks") showView("board");
    if (action === "back-detail") showView("detail");
    if (action === "add-task") addTask();

    if (action === "toggle-timer") setTimerRunning(!state.timerRunning);

    if (action === "minus-five") {
      state.timerSeconds = Math.max(0, state.timerSeconds - 300);
      renderTimer();
    }

    if (action === "plus-five") {
      state.timerSeconds += 300;
      renderTimer();
    }
  }

  const checkButton = event.target.closest(".task-card__check");
  if (checkButton) {
    const card = checkButton.closest(".task-card");
    moveTask(card);
  }

  const closeTimer = event.target.closest(".focus-timer__close");
  if (closeTimer) {
    closeTimer.closest(".focus-timer").hidden = true;
    setTimerRunning(false);
  }
});

applySelectedDay(state.selectedDay);
renderTimer();
updateTaskStats();
