// ============================================
// codeX100 — 100 Days of Code Tracker
// ============================================

(function () {
  'use strict';

  // ---- Constants ----
  const STORAGE_KEY = 'codex100_data';
  const TOTAL_DAYS = 100;

  // ---- DOM refs ----
  const grid = document.getElementById('days-grid');
  const statCompleted = document.getElementById('stat-completed');
  const statStreak = document.getElementById('stat-streak');
  const statRemaining = document.getElementById('stat-remaining');
  const progressFill = document.getElementById('progress-fill');
  const progressText = document.getElementById('progress-text');
  const modalOverlay = document.getElementById('modal-overlay');
  const modalDayNumber = document.getElementById('modal-day-number');
  const modalDate = document.getElementById('modal-date');
  const modalNote = document.getElementById('modal-note');
  const modalToggle = document.getElementById('modal-toggle');
  const modalSave = document.getElementById('modal-save');
  const modalClose = document.getElementById('modal-close');
  const modalChecklist = document.getElementById('modal-checklist');
  const checklistInput = document.getElementById('checklist-input');
  const checklistAddBtn = document.getElementById('checklist-add-btn');
  const resetBtn = document.getElementById('reset-btn');

  // ---- DOM refs (modal extras) ----
  const modalBody = document.querySelector('.modal-body');
  const modal = document.getElementById('modal');

  // ---- State ----
  let data = loadData();
  let activeDay = null; // currently open day index (0-based)
  let activeDayEditable = false; // whether the active day can be edited

  // ---- Helpers ----

  /** Get the start date — fixed once, stored in data */
  function getStartDate() {
    if (!data.startDate) {
      data.startDate = todayString();
      saveData();
    }
    return new Date(data.startDate + 'T00:00:00');
  }

  function todayString() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  /** Return formatted date string for a given day index */
  function dateForDay(index) {
    const start = getStartDate();
    const d = new Date(start);
    d.setDate(d.getDate() + index);
    return d;
  }

  function formatDate(date) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]} ${String(date.getDate()).padStart(2, '0')}`;
  }

  function formatDateLong(date) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]} ${String(date.getDate()).padStart(2, '0')}, ${date.getFullYear()}`;
  }

  function isToday(date) {
    const now = new Date();
    return date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth() &&
      date.getDate() === now.getDate();
  }

  // ---- Data persistence ----

  function loadData() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* ignore */ }
    return { days: {}, startDate: null };
  }

  function saveData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  function getDayData(index) {
    return data.days[index] || { completed: false, note: '', tasks: [] };
  }

  function setDayData(index, dayData) {
    data.days[index] = dayData;
    saveData();
  }

  // ---- Stats ----

  function calcStats() {
    let completed = 0;
    let streak = 0;
    let currentStreak = 0;

    for (let i = 0; i < TOTAL_DAYS; i++) {
      const d = getDayData(i);
      if (d.completed) {
        completed++;
        currentStreak++;
        if (currentStreak > streak) streak = currentStreak;
      } else {
        currentStreak = 0;
      }
    }

    return { completed, streak, remaining: TOTAL_DAYS - completed };
  }

  function updateStats() {
    const { completed, streak, remaining } = calcStats();
    animateValue(statCompleted, completed);
    animateValue(statStreak, streak);
    animateValue(statRemaining, remaining);

    const pct = Math.round((completed / TOTAL_DAYS) * 100);
    progressFill.style.width = pct + '%';
    progressText.textContent = pct + '%';
  }

  function animateValue(el, newVal) {
    const current = parseInt(el.textContent) || 0;
    if (current === newVal) return;
    el.textContent = newVal;
    el.style.transform = 'scale(1.2)';
    setTimeout(() => { el.style.transform = 'scale(1)'; }, 200);
  }

  // ---- Grid rendering ----

  function renderGrid() {
    grid.innerHTML = '';

    for (let i = 0; i < TOTAL_DAYS; i++) {
      const date = dateForDay(i);
      const dayData = getDayData(i);

      const card = document.createElement('div');
      card.className = 'day-card';
      card.id = `day-${i + 1}`;
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');
      card.setAttribute('aria-label', `Day ${i + 1}, ${formatDateLong(date)}`);

      if (dayData.completed) card.classList.add('completed');
      const hasContent = (dayData.note && dayData.note.trim()) || (dayData.tasks && dayData.tasks.length > 0);
      if (hasContent) card.classList.add('has-note');
      if (isToday(date)) card.classList.add('today');

      card.innerHTML = `
        <span class="day-number">${String(i + 1).padStart(2, '0')}</span>
        <span class="day-date">${formatDate(date)}</span>
      `;

      card.addEventListener('click', () => openModal(i));
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openModal(i);
        }
      });

      grid.appendChild(card);
    }
  }

  function refreshCard(index) {
    const card = document.getElementById(`day-${index + 1}`);
    if (!card) return;
    const dayData = getDayData(index);

    card.classList.toggle('completed', dayData.completed);
    const hasContent = (dayData.note && dayData.note.trim()) || (dayData.tasks && dayData.tasks.length > 0);
    card.classList.toggle('has-note', hasContent);
  }

  // ---- Modal ----

  function openModal(index) {
    activeDay = index;
    const date = dateForDay(index);
    const dayData = getDayData(index);
    activeDayEditable = isToday(date);

    modalDayNumber.textContent = `Day ${String(index + 1).padStart(2, '0')}`;
    modalDate.textContent = formatDateLong(date);
    modalNote.value = dayData.note || '';

    updateToggleButton(dayData.completed);
    renderChecklist(dayData.tasks || []);

    // Enable/disable editing based on whether it's today
    modalNote.disabled = !activeDayEditable;
    checklistInput.disabled = !activeDayEditable;
    checklistAddBtn.disabled = !activeDayEditable;
    modalToggle.disabled = !activeDayEditable;
    modalSave.disabled = !activeDayEditable;
    modal.classList.toggle('read-only', !activeDayEditable);

    modalOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';

    if (activeDayEditable) {
      setTimeout(() => modalNote.focus(), 300);
    }
  }

  function closeModal() {
    modalOverlay.classList.remove('active');
    document.body.style.overflow = '';
    activeDay = null;
  }

  function updateToggleButton(completed) {
    if (completed) {
      modalToggle.textContent = 'Completed ✓';
      modalToggle.classList.add('is-completed');
    } else {
      modalToggle.textContent = 'Mark Complete';
      modalToggle.classList.remove('is-completed');
    }
  }

  // ---- Checklist ----

  function renderChecklist(tasks) {
    modalChecklist.innerHTML = '';

    if (tasks.length === 0) {
      const empty = document.createElement('li');
      empty.className = 'checklist-empty';
      empty.textContent = 'No tasks yet';
      modalChecklist.appendChild(empty);
      return;
    }

    tasks.forEach((task, i) => {
      const li = document.createElement('li');
      li.className = 'checklist-item' + (task.done ? ' done' : '');

      const checkBox = document.createElement('div');
      checkBox.className = 'check-box' + (task.done ? ' checked' : '');
      if (activeDayEditable) {
        checkBox.addEventListener('click', () => toggleTask(i));
      } else {
        checkBox.style.cursor = 'default';
      }

      const text = document.createElement('span');
      text.className = 'check-text';
      text.textContent = task.text;

      li.appendChild(checkBox);
      li.appendChild(text);

      if (activeDayEditable) {
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'check-delete';
        deleteBtn.innerHTML = '×';
        deleteBtn.setAttribute('aria-label', 'Delete task');
        deleteBtn.addEventListener('click', () => deleteTask(i));
        li.appendChild(deleteBtn);
      }

      modalChecklist.appendChild(li);
    });
  }

  function addTask() {
    if (!activeDayEditable) return;
    const text = checklistInput.value.trim();
    if (!text || activeDay === null) return;

    const dayData = getDayData(activeDay);
    if (!dayData.tasks) dayData.tasks = [];
    dayData.tasks.push({ text, done: false });
    setDayData(activeDay, dayData);

    checklistInput.value = '';
    renderChecklist(dayData.tasks);
    refreshCard(activeDay);
  }

  function toggleTask(taskIndex) {
    if (!activeDayEditable || activeDay === null) return;
    const dayData = getDayData(activeDay);
    if (!dayData.tasks || !dayData.tasks[taskIndex]) return;

    dayData.tasks[taskIndex].done = !dayData.tasks[taskIndex].done;
    setDayData(activeDay, dayData);
    renderChecklist(dayData.tasks);
  }

  function deleteTask(taskIndex) {
    if (!activeDayEditable || activeDay === null) return;
    const dayData = getDayData(activeDay);
    if (!dayData.tasks) return;

    dayData.tasks.splice(taskIndex, 1);
    setDayData(activeDay, dayData);
    renderChecklist(dayData.tasks);
    refreshCard(activeDay);
  }

  // ---- Event Listeners ----

  modalToggle.addEventListener('click', () => {
    if (activeDay === null) return;
    const dayData = getDayData(activeDay);
    dayData.completed = !dayData.completed;
    setDayData(activeDay, dayData);

    updateToggleButton(dayData.completed);
    refreshCard(activeDay);
    updateStats();
  });

  modalSave.addEventListener('click', () => {
    if (activeDay === null) return;
    const dayData = getDayData(activeDay);
    dayData.note = modalNote.value;
    setDayData(activeDay, dayData);

    refreshCard(activeDay);
    closeModal();
  });

  checklistAddBtn.addEventListener('click', addTask);

  checklistInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTask();
    }
  });

  modalClose.addEventListener('click', closeModal);

  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalOverlay.classList.contains('active')) {
      closeModal();
    }
  });

  resetBtn.addEventListener('click', () => {
    if (confirm('Reset all progress? This cannot be undone.')) {
      data = { days: {}, startDate: data.startDate };
      saveData();
      renderGrid();
      updateStats();
    }
  });

  // ---- Init ----
  getStartDate();
  renderGrid();
  updateStats();
})();
