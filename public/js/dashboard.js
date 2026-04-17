// public/js/dashboard.js — TimeFlow Interactive Dashboard (Complete & Bug-Free)

const token = localStorage.getItem('token');
const user  = JSON.parse(localStorage.getItem('user') || '{}');

if (!token) window.location.href = '/';

let pieChartInstance    = null;
let barChartInstance    = null;
let overviewPieInstance = null;
let selectedCategory    = '';

// ─── AUTH HEADERS ────────────────────────────────────────────
function authHeaders() {
  return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
}

// ─── TOAST NOTIFICATIONS ─────────────────────────────────────
function showToast(msg, type = 'success') {
  const container = document.getElementById('toastContainer');
  const t = document.createElement('div');
  t.className = `toast toast-${type}`;
  t.textContent = msg;
  container.appendChild(t);
  setTimeout(() => {
    t.classList.add('out');
    setTimeout(() => t.remove(), 300);
  }, 3200);
}

// ─── LIVE CLOCK ──────────────────────────────────────────────
function startClock() {
  function tick() {
    const now = new Date();
    const pad = n => String(n).padStart(2, '0');
    const el  = document.getElementById('liveClock');
    if (el) el.innerHTML =
      `${pad(now.getHours())}<span class="clock-colon">:</span>${pad(now.getMinutes())}<span class="clock-colon">:</span>${pad(now.getSeconds())}`;
  }
  tick();
  setInterval(tick, 1000);
}

// ─── TIME MATH ───────────────────────────────────────────────
function calcDurationMinutes(start, end) {
  if (!start || !end) return 0;
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  return Math.max(0, (eh * 60 + em) - (sh * 60 + sm));
}

function formatDuration(minutes) {
  if (!minutes || minutes <= 0) return '0m';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

// ─── CATEGORY SELECTOR ───────────────────────────────────────
function selectCategory(cat, btn) {
  selectedCategory = cat;
  document.getElementById('category').value = cat;
  document.querySelectorAll('.cat-btn').forEach(b =>
    b.classList.remove('active', 'study', 'work', 'break', 'exercise'));
  btn.classList.add('active', cat);
}

// ─── SIDEBAR MOBILE CONTROLS ─────────────────────────────────
function toggleSidebar() {
  const sidebar  = document.querySelector('.sidebar');
  const overlay  = document.getElementById('sidebarOverlay');
  const btn      = document.getElementById('mobileToggle');
  const isOpen   = sidebar.classList.contains('open');

  if (isOpen) {
    closeSidebar();
  } else {
    sidebar.classList.add('open');
    overlay.classList.add('visible');
    btn.textContent = '✕';   // change icon to close
    btn.setAttribute('aria-label', 'Close navigation');
    document.body.style.overflow = 'hidden'; // prevent background scroll
  }
}

function closeSidebar() {
  const sidebar = document.querySelector('.sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  const btn     = document.getElementById('mobileToggle');

  sidebar.classList.remove('open');
  overlay.classList.remove('visible');
  btn.textContent = '☰';
  btn.setAttribute('aria-label', 'Toggle navigation');
  document.body.style.overflow = '';
}

// ─── SECTION NAV ─────────────────────────────────────────────
function showSection(id, navBtn) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
  document.getElementById(`section-${id}`).classList.add('active');
  navBtn.classList.add('active');
  if (id === 'overview') loadStats();
  closeSidebar(); // close sidebar on nav (mobile UX)
}

// ─── INIT ────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // User info
  document.getElementById('userName').textContent = user.name || 'User';
  document.getElementById('userAvatar').textContent = (user.name || 'U')[0].toUpperCase();
  const greetEl = document.getElementById('greetName');
  if (greetEl) greetEl.textContent = (user.name || '').split(' ')[0];

  // Date + greeting
  const now  = new Date();
  const hour = now.getHours();
  document.getElementById('todayDate').textContent = now.toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
  document.getElementById('greeting').textContent =
    hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';

  // Default dates
  const today = now.toISOString().split('T')[0];
  document.getElementById('taskDate').value    = today;
  document.getElementById('filterDate').value  = today;

  startClock();
  loadStats();

  // Time auto-calc listeners
  document.getElementById('startTime').addEventListener('change', calcAndShowDuration);
  document.getElementById('endTime').addEventListener('change', calcAndShowDuration);

  // Form submit handlers
  document.getElementById('taskForm').addEventListener('submit', handleAddTask);
  document.getElementById('editTaskForm').addEventListener('submit', handleEditTask);

  // Keyboard: Escape closes modal AND sidebar
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      closeEditModal();
      closeSidebar();
    }
  });
});

// ─── DURATION DISPLAY ────────────────────────────────────────
function calcAndShowDuration() {
  const start = document.getElementById('startTime').value;
  const end   = document.getElementById('endTime').value;
  const mins  = calcDurationMinutes(start, end);
  const el    = document.getElementById('durationDisplay');
  if (mins > 0) {
    el.textContent        = `${mins} min  ·  ${formatDuration(mins)}`;
    el.style.borderColor  = 'rgba(251,191,36,0.5)';
    el.style.boxShadow    = '0 0 16px rgba(251,191,36,0.12)';
  } else {
    el.textContent        = '— min';
    el.style.borderColor  = 'rgba(251,191,36,0.2)';
    el.style.boxShadow    = 'none';
  }
}

// ─── COUNTER ANIMATION ───────────────────────────────────────
function animateCount(el, target, suffix = '', duration = 650) {
  if (!el) return;
  const startTime = performance.now();
  function step(t) {
    const progress = Math.min((t - startTime) / duration, 1);
    const ease     = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(target * ease) + suffix;
    if (progress < 1) requestAnimationFrame(step);
    else el.textContent = target + suffix;
  }
  requestAnimationFrame(step);
}

// ─── LOAD STATS ──────────────────────────────────────────────
async function loadStats() {
  try {
    const res  = await fetch('/api/tasks/stats', { headers: authHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    const s = data.stats;

    // ── Stat cards ──
    animateCount(document.getElementById('statTotalTasks'),    s.totalTasks || 0);
    animateCount(document.getElementById('statTotalHours'),    parseFloat(s.totalHours || 0), 'h');
    animateCount(document.getElementById('statCompleted'),     s.completedCount || 0);
    document.getElementById('statProductiveHours').textContent = formatDuration(s.productiveMinutes || 0);
    document.getElementById('statBreakTime').textContent       = formatDuration(s.breakMinutes || 0);

    // ── Completion progress bar ──
    const totalTasks = s.totalTasks  || 0;
    const doneTasks  = s.completedCount || 0;
    const donePct    = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
    const fracEl     = document.getElementById('completionFraction');
    const fillEl     = document.getElementById('completionFill');
    if (fracEl) fracEl.textContent = `${doneTasks} / ${totalTasks}`;
    if (fillEl) setTimeout(() => { fillEl.style.width = `${donePct}%`; }, 300);

    // ── Productivity ring ──
    const pct  = s.productivityPercent || 0;
    const circ = 2 * Math.PI * 54; // circumference for r=54
    const fill = document.getElementById('ringFill');
    if (fill) fill.style.strokeDashoffset = circ - (circ * pct / 100);
    const pctEl = document.getElementById('productivityPct');
    if (pctEl) pctEl.textContent = `${pct}%`;

    // ── Mini category bars (use totalMinutes to avoid variable conflict) ──
    const totalMins = s.totalMinutes || 1;
    const cats      = s.categoryBreakdown || {};
    ['study', 'work', 'break', 'exercise'].forEach(cat => {
      const mins   = cats[cat] || 0;
      const catPct = Math.round((mins / totalMins) * 100);
      const valEl  = document.getElementById(`${cat}Val`);
      const barEl  = document.getElementById(`${cat}Bar`);
      if (valEl) valEl.textContent = formatDuration(mins);
      if (barEl) setTimeout(() => { barEl.style.width = `${catPct}%`; }, 200);
    });

    // ── Activity bars ──
    renderActivityBars(s.last7Days || []);

    // ── Overview pie ──
    renderOverviewPie(s.categoryBreakdown || {});

  } catch (err) {
    console.error('Stats error:', err);
  }
}

// ─── ACTIVITY BARS ───────────────────────────────────────────
function renderActivityBars(days) {
  const barsEl   = document.getElementById('activityBars');
  const labelsEl = document.getElementById('activityLabels');
  if (!barsEl || !days.length) return;

  const maxMins = Math.max(...days.map(d => d.totalMinutes), 1);

  barsEl.innerHTML = days.map((d, i) => {
    const pct    = d.totalMinutes / maxMins;
    const height = Math.max(4, Math.round(pct * 56));
    const level  = pct === 0 ? 0 : pct < 0.25 ? 1 : pct < 0.5 ? 2 : pct < 0.75 ? 3 : 4;
    return `<div class="activity-bar" data-level="${level}"
      style="height:${height}px;animation-delay:${i * 0.06}s"
      title="${d.label}: ${formatDuration(d.totalMinutes)}"></div>`;
  }).join('');

  if (labelsEl) labelsEl.innerHTML = days.map(d => `<span>${d.label}</span>`).join('');
}

// ─── ADD TASK ────────────────────────────────────────────────
async function handleAddTask(e) {
  e.preventDefault();
  const alertEl   = document.getElementById('taskAlertMsg');
  const successEl = document.getElementById('taskSuccessMsg');
  alertEl.classList.remove('show');
  successEl.classList.remove('show');

  const taskName  = document.getElementById('taskName').value.trim();
  const category  = document.getElementById('category').value;
  const startTime = document.getElementById('startTime').value;
  const endTime   = document.getElementById('endTime').value;
  const date      = document.getElementById('taskDate').value;

  // Validation
  if (!taskName)  return showAlert(alertEl, 'Please enter a task name.');
  if (!category)  return showAlert(alertEl, 'Please select a category.');
  if (!startTime || !endTime || !date) return showAlert(alertEl, 'Please fill in all time fields.');

  const duration = calcDurationMinutes(startTime, endTime);
  if (duration <= 0) return showAlert(alertEl, 'End time must be after start time.');

  const btn     = document.getElementById('taskSubmitBtn');
  btn.disabled  = true;
  btn.innerHTML = '<span class="spinner"></span> Saving…';

  try {
    const res  = await fetch('/api/tasks', {
      method: 'POST', headers: authHeaders(),
      body: JSON.stringify({ taskName, category, startTime, endTime, duration, date })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);

    showToast(`✅ "${taskName}" added!`, 'success');

    // Reset form
    document.getElementById('taskForm').reset();
    document.getElementById('taskDate').value    = new Date().toISOString().split('T')[0];
    document.getElementById('durationDisplay').textContent = '— min';
    document.getElementById('durationDisplay').style.borderColor = 'rgba(251,191,36,0.2)';
    document.getElementById('durationDisplay').style.boxShadow   = 'none';
    selectedCategory = '';
    document.querySelectorAll('.cat-btn').forEach(b =>
      b.classList.remove('active', 'study', 'work', 'break', 'exercise'));

    loadStats();

  } catch (err) {
    showAlert(alertEl, err.message || 'Failed to save task.');
    showToast('❌ Failed to add task', 'error');
  } finally {
    btn.disabled    = false;
    btn.textContent = '➕ Add Task';
  }
}

function showAlert(el, msg) {
  el.textContent = msg;
  el.classList.add('show');
}

// ─── TOGGLE COMPLETE ─────────────────────────────────────────
async function toggleComplete(taskId, btn) {
  // Optimistic UI: immediately reflect change
  const isCurrentlyDone = btn.classList.contains('completed');
  const row             = btn.closest('tr');

  btn.classList.toggle('completed', !isCurrentlyDone);
  btn.classList.add('just-completed');
  row.classList.toggle('completed-row', !isCurrentlyDone);
  setTimeout(() => btn.classList.remove('just-completed'), 500);

  try {
    const res  = await fetch(`/api/tasks/${taskId}/toggle`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({})  // some servers need a body with PATCH
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);

    const isNowDone = data.task.completed;

    // Confirm final state from server
    btn.classList.toggle('completed', isNowDone);
    btn.setAttribute('title', isNowDone ? 'Mark as incomplete' : 'Mark as complete');
    row.classList.toggle('completed-row', isNowDone);

    if (isNowDone) {
      showToast('🎉 Task completed! Great work!', 'success');
      spawnConfetti(btn);
    } else {
      showToast('↩️ Task marked as incomplete', 'info');
    }

    loadStats(); // refresh counters & progress bar silently

  } catch (err) {
    // Revert optimistic update on error
    btn.classList.toggle('completed', isCurrentlyDone);
    row.classList.toggle('completed-row', isCurrentlyDone);
    showToast(`❌ ${err.message}`, 'error');
  }
}

// ─── CONFETTI BURST ──────────────────────────────────────────
function spawnConfetti(anchor) {
  const rect   = anchor.getBoundingClientRect();
  const cx     = rect.left + rect.width  / 2;
  const cy     = rect.top  + rect.height / 2;
  const colors = ['#fbbf24', '#10b981', '#8b5cf6', '#f43f5e', '#06b6d4', '#f97316', '#a78bfa'];

  for (let i = 0; i < 22; i++) {
    const p      = document.createElement('div');
    p.className  = 'confetti-particle';
    const angle  = (i / 22) * 360;
    const dist   = 35 + Math.random() * 50;
    const dx     = Math.cos((angle * Math.PI) / 180) * dist;
    const dy     = Math.sin((angle * Math.PI) / 180) * dist;
    const color  = colors[i % colors.length];
    const dur    = 650 + Math.random() * 350;

    Object.assign(p.style, {
      position:   'fixed',
      left:       `${cx}px`,
      top:        `${cy}px`,
      background: color,
      width:      `${4 + Math.random() * 4}px`,
      height:     `${4 + Math.random() * 4}px`,
      borderRadius: Math.random() > 0.5 ? '50%' : '2px',
      pointerEvents: 'none',
      zIndex:     '9999',
      transform:  'translate(-50%, -50%)',
      opacity:    '1',
    });
    document.body.appendChild(p);

    const startTime = performance.now();
    (function animP(t) {
      const prog  = Math.min((t - startTime) / dur, 1);
      const ease  = 1 - Math.pow(1 - prog, 3);
      const rise  = prog * 70;
      p.style.transform = `translate(calc(-50% + ${dx * ease}px), calc(-50% + ${dy * ease - rise}px)) rotate(${prog * 600}deg) scale(${1 - prog * 0.8})`;
      p.style.opacity   = String(1 - prog);
      if (prog < 1) requestAnimationFrame(animP);
      else p.remove();
    })(performance.now());
  }
}

// ─── LOAD TASKS ──────────────────────────────────────────────
async function loadTasks() {
  const tbody   = document.getElementById('tasksTableBody');
  const noTasks = document.getElementById('noTasksMsg');
  const countEl = document.getElementById('taskCount');

  tbody.innerHTML     = `<tr><td colspan="8" style="text-align:center;padding:2.5rem;color:var(--txt3)"><span class="spinner"></span></td></tr>`;
  noTasks.style.display = 'none';

  try {
    const date     = document.getElementById('filterDate').value;
    const category = document.getElementById('filterCategory').value;
    const params   = [];
    if (date)     params.push(`date=${date}`);
    if (category) params.push(`category=${category}`);
    const qs = params.length ? '?' + params.join('&') : '';

    const res  = await fetch(`/api/tasks${qs}`, { headers: authHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);

    const tasks = data.tasks;
    if (countEl) countEl.textContent = `${tasks.length} task${tasks.length !== 1 ? 's' : ''}`;

    if (!tasks.length) {
      tbody.innerHTML       = '';
      noTasks.style.display = 'block';
      return;
    }

    tbody.innerHTML = tasks.map((t, i) => `
      <tr class="task-row${t.completed ? ' completed-row' : ''}" style="animation-delay:${i * 0.04}s">
        <td>
          <button
            class="btn-done${t.completed ? ' completed' : ''}"
            title="${t.completed ? 'Mark as incomplete' : 'Mark as complete'}"
            onclick="toggleComplete('${t._id}', this)"
            aria-label="${t.completed ? 'Mark as incomplete' : 'Mark task as complete'}"
          ></button>
        </td>
        <td class="task-name-cell">${escapeHTML(t.taskName)}</td>
        <td><span class="category-badge badge-${t.category}">${categoryEmoji(t.category)} ${t.category}</span></td>
        <td style="font-family:var(--mono);font-size:0.75rem;color:var(--txt2)">${t.date}</td>
        <td class="time-cell">${t.startTime}</td>
        <td class="time-cell">${t.endTime}</td>
        <td class="duration-cell">${formatDuration(t.duration)}</td>
        <td class="actions-cell">
          <button class="btn btn-edit btn-sm"
            onclick="openEditModal('${t._id}','${escapeHTML(t.taskName)}','${t.category}','${t.startTime}','${t.endTime}','${t.date}')">✏️</button>
          <button class="btn btn-danger btn-sm"
            onclick="deleteTask('${t._id}','${escapeHTML(t.taskName)}')">🗑️</button>
        </td>
      </tr>`).join('');

  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;color:var(--rose);padding:1.5rem">${escapeHTML(err.message)}</td></tr>`;
  }
}

// ─── DELETE TASK ─────────────────────────────────────────────
async function deleteTask(id, name) {
  if (!confirm(`Delete "${name}"?\nThis cannot be undone.`)) return;
  try {
    const res  = await fetch(`/api/tasks/${id}`, { method: 'DELETE', headers: authHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    showToast(`🗑️ "${name}" deleted`, 'info');
    loadTasks();
    loadStats();
  } catch (err) {
    showToast(`❌ ${err.message}`, 'error');
  }
}

// ─── EDIT MODAL ──────────────────────────────────────────────
function openEditModal(id, name, category, startTime, endTime, date) {
  document.getElementById('editTaskId').value    = id;
  document.getElementById('editTaskName').value  = name;
  document.getElementById('editCategory').value  = category;
  document.getElementById('editStartTime').value = startTime;
  document.getElementById('editEndTime').value   = endTime;
  document.getElementById('editDate').value      = date;
  document.getElementById('editModal').classList.add('open');
  // Focus first input for accessibility
  setTimeout(() => document.getElementById('editTaskName').focus(), 150);
}

function closeEditModal() {
  document.getElementById('editModal').classList.remove('open');
}

async function handleEditTask(e) {
  e.preventDefault();
  const id        = document.getElementById('editTaskId').value;
  const taskName  = document.getElementById('editTaskName').value.trim();
  const category  = document.getElementById('editCategory').value;
  const startTime = document.getElementById('editStartTime').value;
  const endTime   = document.getElementById('editEndTime').value;
  const date      = document.getElementById('editDate').value;

  const submitBtn = e.target.querySelector('[type="submit"]');
  submitBtn.disabled  = true;
  submitBtn.innerHTML = '<span class="spinner"></span> Saving…';

  try {
    const res  = await fetch(`/api/tasks/${id}`, {
      method: 'PUT', headers: authHeaders(),
      body: JSON.stringify({ taskName, category, startTime, endTime, date })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    showToast('✅ Task updated!', 'success');
    closeEditModal();
    loadTasks();
    loadStats();
  } catch (err) {
    showToast(`❌ ${err.message}`, 'error');
  } finally {
    submitBtn.disabled  = false;
    submitBtn.innerHTML = '💾 Save Changes';
  }
}

// ─── FILTERS ─────────────────────────────────────────────────
function clearFilters() {
  document.getElementById('filterDate').value     = '';
  document.getElementById('filterCategory').value = '';
  loadTasks();
}

// ─── CHARTS ──────────────────────────────────────────────────
const CAT_COLORS = {
  study:    { bg: 'rgba(99,102,241,0.75)',  border: '#6366f1' },
  work:     { bg: 'rgba(251,191,36,0.75)',  border: '#fbbf24' },
  break:    { bg: 'rgba(16,185,129,0.75)',  border: '#10b981' },
  exercise: { bg: 'rgba(139,92,246,0.75)', border: '#8b5cf6' }
};

async function loadCharts() {
  try {
    const res  = await fetch('/api/tasks/stats', { headers: authHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    renderPieChart(data.stats.categoryBreakdown || {}, 'pieChart');
    renderBarChart(data.stats.last7Days || []);
  } catch (err) {
    console.error('Chart error:', err);
  }
}

function renderOverviewPie(breakdown) {
  renderPieChart(breakdown, 'overviewPieChart', true);
}

function renderPieChart(breakdown, canvasId, isOverview = false) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const labels  = Object.keys(breakdown).filter(k => breakdown[k] > 0);
  if (!labels.length) return;
  const values  = labels.map(k => breakdown[k]);
  const colors  = labels.map(k => CAT_COLORS[k]?.bg     || 'rgba(128,128,128,0.7)');
  const borders = labels.map(k => CAT_COLORS[k]?.border || '#888');

  if (isOverview && overviewPieInstance)  overviewPieInstance.destroy();
  if (!isOverview && pieChartInstance)    pieChartInstance.destroy();

  const chart = new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels: labels.map(l => l[0].toUpperCase() + l.slice(1)),
      datasets: [{ data: values, backgroundColor: colors, borderColor: borders, borderWidth: 2, hoverOffset: 10 }]
    },
    options: {
      responsive: true, maintainAspectRatio: false, cutout: '65%',
      plugins: {
        legend: { position: 'bottom', labels: {
          color: 'rgba(241,240,255,0.55)', padding: 16,
          font: { family: 'Cabinet Grotesk', size: 12 }, usePointStyle: true
        }},
        tooltip: { callbacks: { label: ctx => `  ${ctx.label}: ${formatDuration(ctx.parsed)} (${ctx.parsed}min)` } }
      },
      animation: { animateRotate: true, duration: 900, easing: 'easeOutQuart' }
    }
  });

  if (isOverview) overviewPieInstance = chart;
  else            pieChartInstance    = chart;
}

function renderBarChart(days) {
  const canvas = document.getElementById('barChart');
  if (!canvas) return;
  if (barChartInstance) barChartInstance.destroy();

  barChartInstance = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: days.map(d => d.label),
      datasets: [
        {
          label: 'Productive (hrs)',
          data: days.map(d => +(d.productiveMinutes / 60).toFixed(1)),
          backgroundColor: 'rgba(251,191,36,0.75)', borderColor: '#fbbf24',
          borderWidth: 1, borderRadius: 6
        },
        {
          label: 'Break (hrs)',
          data: days.map(d => +((d.totalMinutes - d.productiveMinutes) / 60).toFixed(1)),
          backgroundColor: 'rgba(16,185,129,0.5)', borderColor: '#10b981',
          borderWidth: 1, borderRadius: 6
        }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      scales: {
        x: { stacked: true, grid: { color: 'rgba(255,255,255,0.04)' },
             ticks: { color: 'rgba(241,240,255,0.4)', font: { family: 'Cabinet Grotesk' } } },
        y: { stacked: true, beginAtZero: true, grid: { color: 'rgba(255,255,255,0.04)' },
             ticks: { color: 'rgba(241,240,255,0.4)', font: { family: 'JetBrains Mono' }, callback: v => `${v}h` } }
      },
      plugins: {
        legend: { labels: { color: 'rgba(241,240,255,0.55)', font: { family: 'Cabinet Grotesk', size: 12 }, usePointStyle: true } }
      },
      animation: { duration: 800, easing: 'easeOutQuart' }
    }
  });
}

// ─── LOGOUT ──────────────────────────────────────────────────
function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/';
}

// ─── UTILS ───────────────────────────────────────────────────
function categoryEmoji(cat) {
  return { study: '📚', work: '💼', break: '☕', exercise: '🏃' }[cat] || '📌';
}

function escapeHTML(str) {
  const d = document.createElement('div');
  d.appendChild(document.createTextNode(str || ''));
  return d.innerHTML;
}