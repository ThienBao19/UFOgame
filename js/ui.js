// DOM UI: HUD, class list drawer, result card, history, persistence.
(function () {
  'use strict';
  const NS = window.UFO;
  const { clamp, shuffle, pick } = NS.util;

  const STORE_KEY = 'ufo-goi-bai:v1';
  const MAX_NAMES = 80;
  const MAX_PICK = 5;
  const MAX_HISTORY = 60;
  const MAX_NAME_LEN = 40;
  const DEFAULT_NAMES = [
    'Nguyễn Minh Anh', 'Trần Gia Bảo', 'Lê Ngọc Châu', 'Phạm Đức Duy', 'Hoàng Thu Hà',
    'Vũ Quang Huy', 'Đặng Khánh Linh', 'Bùi Tuấn Kiệt', 'Đỗ Phương Mai', 'Ngô Hoàng Nam',
    'Dương Bảo Ngọc', 'Lý Thành Phát', 'Hồ Diễm Quỳnh', 'Phan Nhật Quang', 'Trịnh Thanh Tâm',
    'Võ Minh Thư', 'Đinh Gia Hân', 'Tạ Quốc Trung', 'Lương Thảo Vy', 'Mai Đức Thịnh',
    'Cao Hải Yến', 'Châu Khôi Nguyên', 'Lâm Bảo Trâm', 'Tô Anh Khoa', 'Huỳnh Mỹ Uyên',
    'Kiều Tiến Đạt', 'La Thùy Dung', 'Quách Minh Khang', 'Trương Hà My', 'Đoàn Văn Long',
  ];
  const TAGLINES = [
    'Mời em lên bảng trả bài!', 'UFO đã chọn bạn rồi nha!', 'Chuẩn bị bài chưa nè?',
    'Bị bắt cóc thành công 🛸', 'Tự tin lên nào!', 'Cả lớp vỗ tay cổ vũ!',
  ];

  const $ = (id) => document.getElementById(id);
  const state = {
    className: 'Lớp 8A1',
    names: DEFAULT_NAMES.slice(),
    count: 2,
    noRepeat: true,
    sound: true,
    called: [],
    history: [],
  };
  let resolveResult = null;
  let toastTimer = 0;

  function loadState() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      const strings = (arr) => (Array.isArray(arr) ? arr.filter((x) => typeof x === 'string') : []);
      const names = strings(data.names).slice(0, MAX_NAMES);
      if (names.length) state.names = names;
      if (typeof data.className === 'string') state.className = data.className.slice(0, MAX_NAME_LEN);
      if (Number.isFinite(data.count)) state.count = clamp(Math.round(data.count), 1, MAX_PICK);
      if (typeof data.noRepeat === 'boolean') state.noRepeat = data.noRepeat;
      if (typeof data.sound === 'boolean') state.sound = data.sound;
      state.called = strings(data.called);
      if (Array.isArray(data.history)) {
        state.history = data.history
          .filter((h) => h && Number.isFinite(h.at) && Array.isArray(h.names))
          .slice(0, MAX_HISTORY);
      }
    } catch (err) {
      console.warn('Không đọc được dữ liệu đã lưu', err);
    }
  }

  function saveState() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(state));
    } catch (err) {
      console.warn('Không lưu được dữ liệu', err);
    }
  }

  function applyRoster() {
    const called = new Set(state.called);
    NS.world.setRoster(state.names, called);
    updateHud();
  }

  function updateHud() {
    const students = NS.world.students;
    const total = students.length;
    const done = students.filter((s) => s.called).length;
    $('countVal').textContent = String(state.count);
    $('classLabel').textContent = state.className || 'Lớp học';
    $('statLabel').textContent = state.noRepeat
      ? `Còn ${total - done}/${total} bạn chưa lên bảng`
      : `${total} học sinh · đã gọi ${done}`;
    document.title = `UFO Gọi Bài · ${state.className}`;
    $('btnSound').classList.toggle('off', !state.sound);
    $('btnSound').setAttribute('aria-pressed', String(state.sound));
  }

  function toast(msg) {
    const el = $('toast');
    el.textContent = msg;
    el.hidden = false;
    el.classList.remove('show');
    void el.offsetWidth;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      el.hidden = true;
    }, 3200);
  }

  function drawVictims() {
    const students = NS.world.students;
    if (!students.length) return [];
    const n = clamp(state.count, 1, Math.min(MAX_PICK, students.length));
    let pool = state.noRepeat ? students.filter((s) => !s.called) : students.slice();
    if (pool.length < n) {
      students.forEach((s) => {
        s.called = false;
      });
      state.called = [];
      pool = students.slice();
      toast('Cả lớp đã lên bảng hết lượt — bắt đầu vòng mới!');
    }
    return shuffle(pool).slice(0, n);
  }

  function recordCall(victims) {
    victims.forEach((v) => {
      v.called = true;
      v.tagW = 0;
    });
    state.called = [...new Set([...state.called, ...victims.map((v) => v.name)])];
    state.history = [{ at: Date.now(), names: victims.map((v) => v.name) }, ...state.history].slice(0, MAX_HISTORY);
    saveState();
    updateHud();
    renderHistory();
  }

  function formatTime(d) {
    const p = (n) => String(n).padStart(2, '0');
    return `${p(d.getHours())}:${p(d.getMinutes())} · ${p(d.getDate())}/${p(d.getMonth() + 1)}`;
  }

  function resultItem(v, i) {
    const li = document.createElement('li');
    li.style.setProperty('--i', String(i));
    const cv = document.createElement('canvas');
    cv.width = 160;
    cv.height = 160;
    NS.drawAvatar(cv, v.look);
    const text = document.createElement('div');
    const name = document.createElement('strong');
    name.textContent = v.name;
    const tag = document.createElement('span');
    tag.textContent = pick(TAGLINES);
    text.append(name, tag);
    li.append(cv, text);
    return li;
  }

  function showResult(victims) {
    $('resultList').replaceChildren(...victims.map(resultItem));
    $('resultMeta').textContent = `${state.className} · ${formatTime(new Date())}`;
    $('modal').hidden = false;
    setTimeout(() => $('btnRelease').focus(), 50);
    return new Promise((resolve) => {
      resolveResult = resolve;
    });
  }

  function closeResult(choice) {
    if (!resolveResult) return;
    NS.audio.click();
    $('modal').hidden = true;
    const done = resolveResult;
    resolveResult = null;
    done(choice);
  }

  function setBusy(isBusy) {
    ['btnSummon', 'countDec', 'countInc', 'btnSettings'].forEach((id) => {
      $(id).disabled = isBusy;
    });
    document.body.classList.toggle('busy', isBusy);
  }

  function renderHistory() {
    const list = $('historyList');
    if (!state.history.length) {
      const empty = document.createElement('li');
      empty.className = 'empty';
      empty.textContent = 'Chưa có lượt gọi nào.';
      list.replaceChildren(empty);
      return;
    }
    list.replaceChildren(...state.history.map((h) => {
      const li = document.createElement('li');
      const time = document.createElement('time');
      time.textContent = formatTime(new Date(h.at));
      const names = document.createElement('span');
      names.textContent = h.names.join(', ');
      li.append(time, names);
      return li;
    }));
  }

  function openDrawer() {
    $('inpClass').value = state.className;
    $('inpNames').value = state.names.join('\n');
    $('chkNoRepeat').checked = state.noRepeat;
    updateNameCount();
    renderHistory();
    $('drawer').hidden = false;
  }

  function closeDrawer() {
    $('drawer').hidden = true;
  }

  function parseNames(text) {
    const cleaned = text
      .split(/\r?\n/)
      .map((line) => line.replace(/\s+/g, ' ').trim().slice(0, MAX_NAME_LEN))
      .filter(Boolean);
    return [...new Set(cleaned)].slice(0, MAX_NAMES);
  }

  function updateNameCount() {
    const n = parseNames($('inpNames').value).length;
    $('nameCount').textContent = `${n} học sinh`;
  }

  function saveDrawer() {
    const names = parseNames($('inpNames').value);
    if (!names.length) {
      toast('Danh sách đang trống — hãy nhập ít nhất 1 tên.');
      return;
    }
    const keep = new Set(names);
    state.names = names;
    state.className = $('inpClass').value.trim().slice(0, MAX_NAME_LEN) || 'Lớp học';
    state.noRepeat = $('chkNoRepeat').checked;
    state.called = state.called.filter((n) => keep.has(n));
    saveState();
    applyRoster();
    closeDrawer();
    toast(`Đã cập nhật danh sách (${names.length} học sinh)`);
  }

  function resetRound() {
    state.called = [];
    NS.world.students.forEach((s) => {
      s.called = false;
      s.tagW = 0;
    });
    saveState();
    updateHud();
    toast('Đã đặt lại lượt gọi — mọi bạn đều có thể bị bắt!');
  }

  function clearHistory() {
    state.history = [];
    saveState();
    renderHistory();
  }

  function changeCount(delta) {
    state.count = clamp(state.count + delta, 1, MAX_PICK);
    NS.audio.click();
    saveState();
    updateHud();
  }

  function toggleSound() {
    state.sound = !state.sound;
    NS.audio.setEnabled(state.sound);
    if (state.sound) NS.audio.click();
    saveState();
    updateHud();
  }

  function toggleFullscreen() {
    const doc = document;
    if (doc.fullscreenElement) doc.exitFullscreen().catch(() => null);
    else doc.documentElement.requestFullscreen?.().catch(() => toast('Trình duyệt không cho phép toàn màn hình.'));
  }

  function summon() {
    NS.audio.unlock();
    NS.director.run();
  }

  function isTyping(e) {
    const tag = e.target && e.target.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA';
  }

  function handleKey(e) {
    if (isTyping(e)) {
      if (e.key === 'Escape') closeDrawer();
      return;
    }
    if (!$('modal').hidden) {
      if (e.key === 'Enter' || e.key === 'Escape') {
        e.preventDefault();
        closeResult('release');
      }
      return;
    }
    if (e.code === 'Space') {
      e.preventDefault();
      if (!NS.director.isBusy() && $('drawer').hidden) summon();
    } else if (e.key === 'f' || e.key === 'F') toggleFullscreen();
    else if (e.key === 'm' || e.key === 'M') toggleSound();
    else if (e.key === 'Escape') closeDrawer();
    else if (e.key === 'ArrowUp' || e.key === '+') changeCount(1);
    else if (e.key === 'ArrowDown' || e.key === '-') changeCount(-1);
  }

  function bind() {
    $('btnSummon').addEventListener('click', summon);
    $('countDec').addEventListener('click', () => changeCount(-1));
    $('countInc').addEventListener('click', () => changeCount(1));
    $('btnSound').addEventListener('click', toggleSound);
    $('btnFull').addEventListener('click', toggleFullscreen);
    $('btnSettings').addEventListener('click', openDrawer);
    $('btnCloseDrawer').addEventListener('click', closeDrawer);
    $('btnSaveDrawer').addEventListener('click', saveDrawer);
    $('btnResetRound').addEventListener('click', resetRound);
    $('btnClearHistory').addEventListener('click', clearHistory);
    $('inpNames').addEventListener('input', updateNameCount);
    $('btnRelease').addEventListener('click', () => closeResult('release'));
    $('btnAgain').addEventListener('click', () => closeResult('again'));
    window.addEventListener('keydown', handleKey);
  }

  function init() {
    loadState();
    NS.audio.setEnabled(state.sound);
    bind();
    applyRoster();
    renderHistory();
  }

  NS.ui = { init, state, drawVictims, recordCall, showResult, setBusy, toast };
})();