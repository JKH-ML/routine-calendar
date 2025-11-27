const weekdayRow = document.getElementById("weekdayRow");
const dayGrid = document.getElementById("dayGrid");
const monthLabel = document.getElementById("monthLabel");
const eventList = document.getElementById("eventList");
const sidebarTitle = document.getElementById("sidebarTitle");
const modalBackdrop = document.getElementById("modalBackdrop");
const modalEvent = document.getElementById("modalEvent");
const modalDelete = document.getElementById("modalDelete");
const modalTitleEl = document.getElementById("modalTitle");
const modalForm = document.getElementById("modalForm");
const inputEventId = document.getElementById("inputEventId");
const inputStartDate = document.getElementById("inputStartDate");
const inputEndDate = document.getElementById("inputEndDate");
const inputTitle = document.getElementById("inputTitle");
const inputTime = document.getElementById("inputTime");
const inputEndTime = document.getElementById("inputEndTime");
const inputAllDay = document.getElementById("inputAllDay");
const modalCancel = document.getElementById("modalCancel");
const modalClose = document.getElementById("modalClose");
const deleteClose = document.getElementById("deleteClose");
const deleteCancel = document.getElementById("deleteCancel");
const deleteConfirm = document.getElementById("deleteConfirm");
const deleteText = document.getElementById("deleteText");
const inputLocation = document.getElementById("inputLocation");
const inputReminder = document.getElementById("inputReminder");
const syncBtn = document.getElementById("syncBtn");

// Ritual emoji snippets (from assets/animated-emojis.txt)
const ritualEmojis = {
  "✏️": `<picture>
  <source srcset="https://fonts.gstatic.com/s/e/notoemoji/latest/270f_fe0f/512.webp" type="image/webp">
  <img src="https://fonts.gstatic.com/s/e/notoemoji/latest/270f_fe0f/512.gif" alt="✏️" width="16" height="16">
</picture>`,
  "🔥": `<picture>
  <source srcset="https://fonts.gstatic.com/s/e/notoemoji/latest/1f525/512.webp" type="image/webp">
  <img src="https://fonts.gstatic.com/s/e/notoemoji/latest/1f525/512.gif" alt="🔥" width="16" height="16">
</picture>`,
  "🚀": `<picture>
  <source srcset="https://fonts.gstatic.com/s/e/notoemoji/latest/1f680/512.webp" type="image/webp">
  <img src="https://fonts.gstatic.com/s/e/notoemoji/latest/1f680/512.gif" alt="🚀" width="16" height="16">
</picture>`
};

let events = {};
let modalState = { mode: "create", id: null, dateKey: null, endDateKey: null, allDay: false };

const weekdayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const state = {
  current: new Date(),
  selected: null,
  selectedKey: null
};

function getRitualEmoji(title) {
  if (!title) return null;
  const trimmed = title.trim();
  const match = trimmed.match(/^#(\S+)/);
  if (!match) return null;
  const emoji = match[1];
  if (!ritualEmojis[emoji]) return null;
  return { emoji, html: ritualEmojis[emoji] };
}

function formatDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseDateKey(key) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

function formatDateLabel(key) {
  const d = parseDateKey(key);
  const weekdayNamesLocal = ["일", "월", "화", "수", "목", "금", "토"];
  return `${key}(${weekdayNamesLocal[d.getDay()]})`;
}

function buildRange(evt, startKey) {
  const endKey = evt.endDateKey || startKey;
  const isAllDay = !!evt.allDay;
  const startLabel = formatDateLabel(startKey);
  const endLabel = formatDateLabel(endKey);
  if (isAllDay) {
    if (startKey === endKey) return `${startLabel} · 하루종일`;
    return `${startLabel} → ${endLabel} · 하루종일`;
  }
  const startTime = evt.startTime || evt.time || "All day";
  const endTime = evt.endTime || startTime;
  if (startKey === endKey) return `${startLabel} · ${startTime} - ${endTime}`;
  return `${startLabel} ${startTime} → ${endLabel} ${endTime}`;
}

function setDateValue(input, key) {
  if (!input) return;
  try {
    const str = key || "";
    input.value = str;
  } catch {
    input.value = key;
  }
}

function openEventModal({ mode, id = null, title = "", time = "", endTime = "", dateKey, endDateKey = null, allDay = false, location = "", reminderMinutes = "" }) {
  const todayKey = formatDateKey(new Date());
  modalState = { mode, id, dateKey: dateKey || todayKey, endDateKey: endDateKey || dateKey || todayKey, allDay };
  modalTitleEl.textContent = mode === "create" ? "일정 추가" : "일정 수정";
  const startKey = dateKey || todayKey;
  const endKey = endDateKey || startKey;
  inputEventId.value = id || "";
  setDateValue(inputStartDate, startKey);
  setDateValue(inputEndDate, endKey);
  inputTitle.value = title;
  inputTime.value = time || "09:00";
  inputEndTime.value = endTime || "22:00";
  inputAllDay.checked = !!allDay;
  inputLocation.value = location || "";
  inputReminder.value = reminderMinutes ?? "";
  toggleTimeInputs();
  modalEvent.classList.remove("hidden");
  modalDelete.classList.add("hidden");
  modalBackdrop.classList.remove("hidden");
  inputTitle.focus();
}

function openDeleteModal({ id, title }) {
  modalState = { mode: "delete", id };
  deleteText.textContent = `"${title}" 일정을 삭제할까요?`;
  modalEvent.classList.add("hidden");
  modalDelete.classList.remove("hidden");
  modalBackdrop.classList.remove("hidden");
}

function closeModal() {
  modalBackdrop.classList.add("hidden");
}

function toggleTimeInputs() {
  const isAllDay = inputAllDay.checked;
  inputTime.disabled = isAllDay;
  inputEndTime.disabled = isAllDay;
  if (isAllDay) {
    inputTime.value = "";
    inputEndTime.value = "";
  }
}

function renderWeekdays() {
  weekdayRow.innerHTML = weekdayNames
    .map(name => `<div class="weekday">${name}</div>`)
    .join("");
}

let actionMenuId = 0;

function createEventRow(evt, dateKey) {
  const row = document.createElement("div");
  row.className = "event";
  const id = `menu-${actionMenuId++}`;
  const eventId = evt.id || `${dateKey}-${evt.title}-${evt.time}`;
  const range = buildRange(evt, dateKey);
  const hasLocation = !!evt.location;
  const hasReminder = evt.reminderMinutes !== undefined && evt.reminderMinutes !== null && evt.reminderMinutes !== "";
  row.innerHTML = `
    <div class="event-color" style="background:${evt.color}"></div>
    <div class="event-main">
      <div class="event-title">${evt.title}</div>
      <div class="event-time">${range}</div>
      ${hasLocation ? `<div class="event-meta"><img src="./assets/map-pin.png" class="icon" alt="" />${evt.location}</div>` : ""}
      ${hasReminder ? `<div class="event-meta"><img src="./assets/bell.png" class="icon" alt="" />${evt.reminderMinutes}분 전</div>` : ""}
    </div>
    <div class="event-actions">
      <button class="icon-btn ellipsis-btn" data-menu="${id}" aria-label="Actions">
        <img src="./assets/ellipsis.png" class="icon" alt="More" />
      </button>
      <div class="action-menu" id="${id}">
        <button class="icon-btn edit-btn"
                data-id="${eventId}"
                data-date="${dateKey}"
                data-end-date="${evt.endDateKey || dateKey}"
                data-time="${evt.startTime || evt.time || ''}"
                data-end-time="${evt.endTime || ''}"
                data-all-day="${evt.allDay ? "1" : "0"}"
                data-title="${evt.title}"
                data-location="${evt.location || ''}"
                data-reminder="${evt.reminderMinutes ?? ''}"
                aria-label="Edit">
          <img src="./assets/pencil.png" class="icon" alt="Edit" />
        </button>
        <button class="icon-btn delete-btn" data-id="${eventId}" aria-label="Delete">
          <img src="./assets/trash.png" class="icon" alt="Delete" />
        </button>
      </div>
    </div>`;
  return row;
}

function attachActionMenus() {
  const menus = document.querySelectorAll(".action-menu");
  const buttons = document.querySelectorAll(".ellipsis-btn");
  buttons.forEach(btn => {
    btn.onclick = () => {
      const targetId = btn.getAttribute("data-menu");
      menus.forEach(m => {
        if (m.id === targetId) {
          m.classList.toggle("open");
        } else {
          m.classList.remove("open");
        }
      });
    };
  });
  document.addEventListener("click", (e) => {
    if (!(e.target.closest && e.target.closest(".event-actions"))) {
      menus.forEach(m => m.classList.remove("open"));
    }
  }, { once: true });

  document.querySelectorAll(".edit-btn").forEach(btn => {
    btn.onclick = () => {
      const id = btn.getAttribute("data-id");
      const date = btn.getAttribute("data-date");
      const endDate = btn.getAttribute("data-end-date") || date;
      const currentTitle = btn.getAttribute("data-title");
      const currentTime = btn.getAttribute("data-time");
      const currentEndTime = btn.getAttribute("data-end-time");
      const allDay = btn.getAttribute("data-all-day") === "1";
      openEventModal({
        mode: "edit",
        id,
        dateKey: date,
        endDateKey: endDate,
        title: currentTitle,
        time: currentTime,
        endTime: currentEndTime,
        allDay,
        location: btn.getAttribute("data-location") || "",
        reminderMinutes: btn.getAttribute("data-reminder") || ""
      });
    };
  });

  document.querySelectorAll(".delete-btn").forEach(btn => {
    btn.onclick = () => {
      const id = btn.getAttribute("data-id");
      const title = btn.closest(".event")?.querySelector(".event-title")?.textContent || "이 일정";
      openDeleteModal({ id, title });
    };
  });
}

function renderEventsSidebar(dateKey, viewDate) {
  eventList.innerHTML = "";
  const todaysEvents = events[dateKey] || [];
  sidebarTitle.textContent = "일정";

  const renderGroup = (label, items) => {
    if (!items.length) return;
    const header = document.createElement("div");
    header.className = "chip";
    header.textContent = label;
    eventList.appendChild(header);

    items.forEach(evts => {
      (Array.isArray(evts) ? evts : [evts]).forEach(evt => {
        eventList.appendChild(createEventRow(evt, dateKey));
      });
    });
  };

  renderGroup("Selected day", todaysEvents);

  attachActionMenus();
}

function renderCalendar() {
  const viewDate = new Date(state.current);
  viewDate.setDate(1);
  const firstDay = viewDate.getDay();
  const month = viewDate.getMonth();
  const year = viewDate.getFullYear();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();
  const todayKey = formatDateKey(new Date());
  monthLabel.innerHTML = `${viewDate.toLocaleString("default", { month: "long" })}<span class="year">${year}</span>`;

  const cells = [];
  for (let i = firstDay - 1; i >= 0; i--) {
    const dayNum = daysInPrevMonth - i;
    const date = new Date(year, month - 1, dayNum);
    cells.push({ date, outside: true });
  }

  for (let i = 1; i <= daysInMonth; i++) {
    const date = new Date(year, month, i);
    cells.push({ date, outside: false });
  }

  while (cells.length % 7 !== 0) {
    const date = new Date(year, month + 1, cells.length - daysInMonth - firstDay + 1);
    cells.push({ date, outside: true });
  }

  dayGrid.innerHTML = cells
    .map(cell => {
      const key = formatDateKey(cell.date);
      const dayEvents = events[key] || [];
      const isToday = key === todayKey;
      const isSelected = state.selected && formatDateKey(state.selected) === key;
      const hasEvents = dayEvents.length > 0;
      const isFirst = cell.date.getDate() === 1;
      const ritualSet = new Set(
        dayEvents
          .map(evt => getRitualEmoji(evt.title)?.emoji)
          .filter(Boolean)
      );
      const hasRitualTrio = ["✏️", "🔥", "🚀"].every(r => ritualSet.has(r));
      let badges = "";
      if (hasEvents) {
        const dots = dayEvents
          .map(evt => {
            const ritual = getRitualEmoji(evt.title);
            if (ritual) {
              return `<span class="emoji-badge" title="${ritual.emoji} 리추얼">${ritual.html}</span>`;
            }
            return `<span class="dot"></span>`;
          })
          .join("");
        badges = `<div class="badge">${dots}</div>`;
      }
      return `
        <div class="day ${cell.outside ? "outside" : ""} ${isToday ? "today" : ""} ${isSelected ? "selected" : ""} ${isFirst ? "first-of-month" : ""} ${hasRitualTrio ? "iridescent" : ""}" data-date="${key}">
          <div class="day-number">${cell.date.getDate()}</div>
          ${badges}
        </div>`;
    })
    .join("");

  dayGrid.querySelectorAll(".day").forEach(dayEl => {
    dayEl.addEventListener("click", () => {
      state.selected = parseDateKey(dayEl.dataset.date);
      state.selectedKey = dayEl.dataset.date;
      renderCalendar();
      renderEventsSidebar(dayEl.dataset.date, state.current);
    });
  });

  const selectedKey = state.selected ? formatDateKey(state.selected) : todayKey;
  if (!state.selectedKey && state.selected) state.selectedKey = selectedKey;
  renderEventsSidebar(selectedKey, viewDate);
}

document.getElementById("prevMonth").addEventListener("click", () => {
  state.current.setMonth(state.current.getMonth() - 1);
  renderCalendar();
  ensureRangeForView();
});

document.getElementById("nextMonth").addEventListener("click", () => {
  state.current.setMonth(state.current.getMonth() + 1);
  renderCalendar();
});

document.getElementById("todayBtn").addEventListener("click", () => {
  state.current = new Date();
  state.selected = new Date();
  state.selectedKey = formatDateKey(state.selected);
  renderCalendar();
});

document.getElementById("newEvent").addEventListener("click", () => {
  const key = state.selectedKey || formatDateKey(state.selected || new Date());
  openEventModal({ mode: "create", dateKey: key });
});

syncBtn.addEventListener("click", () => {
  if (window.chrome?.webview?.postMessage) {
    window.chrome.webview.postMessage({ kind: "sync" });
  } else {
    renderCalendar();
  }
});

function ensureRangeForView() {
  if (!window.chrome?.webview?.postMessage) return;
  const start = new Date(state.current.getFullYear(), state.current.getMonth(), 1);
  const key = formatDateKey(start);
  window.chrome.webview.postMessage({ kind: "ensureRange", from: key });
}

// Receive events from the host (WPF) via WebView2 postMessage
window.chrome?.webview?.addEventListener("message", (event) => {
  const data = event.data;
  if (!data || data.kind !== "events" || !Array.isArray(data.items)) return;
  const nextEvents = {};
  data.items.forEach(item => {
    const key = item.startDateKey || item.dateKey;
    if (!key) return;
    nextEvents[key] = nextEvents[key] || [];
    nextEvents[key].push({
      id: item.id || `${key}-${item.title}-${item.time}`,
      title: item.title || "Event",
      startDateKey: key,
      endDateKey: item.endDateKey || key,
      startTime: item.startTime || item.time || "",
      endTime: item.endTime || "",
      allDay: item.allDay || false,
      location: item.location || "",
      reminderMinutes: item.reminderMinutes,
      color: "#22d3ee"
    });
  });
  events = nextEvents;
  renderCalendar();
  const selectedKey = state.selected ? formatDateKey(state.selected) : formatDateKey(new Date());
  renderEventsSidebar(selectedKey, state.current);
});

modalCancel.addEventListener("click", closeModal);
modalClose.addEventListener("click", closeModal);
deleteClose.addEventListener("click", closeModal);
deleteCancel.addEventListener("click", closeModal);
inputAllDay.addEventListener("change", toggleTimeInputs);

modalForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const title = inputTitle.value.trim();
  const time = inputTime.value.trim();
  const endTime = inputEndTime.value.trim();
  const dateKey = inputStartDate.value || formatDateKey(new Date());
  const endDateKey = inputEndDate.value || dateKey;
  const allDay = inputAllDay.checked;
  const location = inputLocation.value.trim();
  const reminderRaw = inputReminder.value ? parseInt(inputReminder.value, 10) : null;
  const reminderMinutes = Number.isFinite(reminderRaw) ? reminderRaw : null;
  if (!title) return;
  if (window.chrome?.webview?.postMessage) {
    if (modalState.mode === "create") {
      window.chrome.webview.postMessage({ kind: "createEvent", title, time, endTime, dateKey, endDateKey, allDay, location, reminderMinutes });
    } else {
      window.chrome.webview.postMessage({ kind: "editEvent", id: modalState.id, title, time, endTime, dateKey, endDateKey, allDay, location, reminderMinutes });
    }
  } else {
    events[dateKey] = events[dateKey] || [];
    const existingIndex = events[dateKey].findIndex(e => e.id === modalState.id);
    const payload = { id: modalState.id || `${dateKey}-${title}-${Date.now()}`, title, time, endTime, endDateKey, allDay, startDateKey: dateKey, location, reminderMinutes, color: "#22d3ee" };
    if (modalState.mode === "edit" && existingIndex >= 0) {
      events[dateKey][existingIndex] = { ...events[dateKey][existingIndex], ...payload };
    } else {
      events[dateKey].push(payload);
    }
    renderCalendar();
    renderEventsSidebar(dateKey, state.current);
  }
  closeModal();
});

deleteConfirm.addEventListener("click", () => {
  if (window.chrome?.webview?.postMessage) {
    window.chrome.webview.postMessage({ kind: "deleteEvent", id: modalState.id });
  } else {
    Object.keys(events).forEach(key => {
      events[key] = (events[key] || []).filter(e => e.id !== modalState.id);
    });
    renderCalendar();
    renderEventsSidebar(state.selected ? formatDateKey(state.selected) : formatDateKey(new Date()), state.current);
  }
  closeModal();
});

renderWeekdays();
renderCalendar();
