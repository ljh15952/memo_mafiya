const state = {
  manifest: [],
  flatFiles: [],
  currentIndex: 0,
  settings: {
    fontSize: 18,
    lineHeight: 1.8,
    contentWidth: 820,
    darkMode: false,
    tapScroll: true
  }
};

const els = {
  root: document.documentElement,
  bookTitle: document.getElementById('bookTitle'),
  chapterTitle: document.getElementById('chapterTitle'),
  content: document.getElementById('content'),
  toc: document.getElementById('toc'),
  sidebar: document.getElementById('sidebar'),
  settingsPanel: document.getElementById('settingsPanel'),
  backdrop: document.getElementById('backdrop'),
  tapHelp: document.getElementById('tapHelp'),
  menuBtn: document.getElementById('menuBtn'),
  closeMenuBtn: document.getElementById('closeMenuBtn'),
  settingsBtn: document.getElementById('settingsBtn'),
  closeSettingsBtn: document.getElementById('closeSettingsBtn'),
  fontSize: document.getElementById('fontSize'),
  fontSizeValue: document.getElementById('fontSizeValue'),
  lineHeight: document.getElementById('lineHeight'),
  lineHeightValue: document.getElementById('lineHeightValue'),
  contentWidth: document.getElementById('contentWidth'),
  contentWidthValue: document.getElementById('contentWidthValue'),
  darkMode: document.getElementById('darkMode'),
  tapScroll: document.getElementById('tapScroll'),
  prevBtn: document.getElementById('prevBtn'),
  nextBtn: document.getElementById('nextBtn')
};

init();

async function init() {
  loadSettings();
  applySettings();
  bindEvents();

  try {
    const res = await fetch('./manifest.json', { cache: 'no-store' });
    if (!res.ok) throw new Error(`manifest.jsonを読み込めません: ${res.status}`);
    state.manifest = await res.json();
    state.flatFiles = flattenManifest(state.manifest);
    renderToc();

    const pathFromHash = decodeURIComponent(location.hash.replace(/^#/, ''));
    const startIndex = state.flatFiles.findIndex(item => item.path === pathFromHash);
    await loadMarkdown(startIndex >= 0 ? startIndex : 0);
  } catch (err) {
    showError(err);
  }
}

function flattenManifest(groups) {
  return groups.flatMap(group =>
    group.files.map(file => ({
      group: group.title,
      title: file.title,
      path: file.path
    }))
  );
}

function renderToc() {
  els.toc.innerHTML = '';

  state.manifest.forEach(group => {
    const wrap = document.createElement('div');
    wrap.className = 'toc-group';

    const title = document.createElement('div');
    title.className = 'toc-group-title';
    title.textContent = group.title;
    wrap.appendChild(title);

    group.files.forEach(file => {
      const globalIndex = state.flatFiles.findIndex(item => item.path === file.path);
      const btn = document.createElement('button');
      btn.className = 'toc-link';
      btn.textContent = file.title;
      btn.type = 'button';
      btn.dataset.index = String(globalIndex);
      btn.addEventListener('click', () => loadMarkdown(globalIndex));
      wrap.appendChild(btn);
    });

    els.toc.appendChild(wrap);
  });
}

async function loadMarkdown(index) {
  if (!state.flatFiles.length) return;
  const safeIndex = Math.max(0, Math.min(index, state.flatFiles.length - 1));
  const item = state.flatFiles[safeIndex];
  state.currentIndex = safeIndex;

  els.bookTitle.textContent = item.group;
  els.chapterTitle.textContent = item.title;
  document.title = `${item.title} - Markdown WebViewer`;

  setActiveToc();
  closePanels();
  els.content.innerHTML = '<p>読み込み中...</p>';

  const res = await fetch(encodeURI(item.path), { cache: 'no-store' });
  if (!res.ok) throw new Error(`${item.path} を読み込めません: ${res.status}`);

  const md = await res.text();
  const html = marked.parse(md, {
    gfm: true,
    breaks: true
  });

  els.content.innerHTML = DOMPurify.sanitize(html);
  location.hash = encodeURIComponent(item.path);
  window.scrollTo({ top: 0, behavior: 'instant' });
}

function setActiveToc() {
  document.querySelectorAll('.toc-link').forEach(btn => {
    btn.classList.toggle('active', Number(btn.dataset.index) === state.currentIndex);
  });
}

function loadSettings() {
  const saved = localStorage.getItem('mdViewerSettings');
  if (!saved) return;

  try {
    state.settings = { ...state.settings, ...JSON.parse(saved) };
  } catch {
    localStorage.removeItem('mdViewerSettings');
  }
}

function saveSettings() {
  localStorage.setItem('mdViewerSettings', JSON.stringify(state.settings));
}

function applySettings() {
  els.root.style.setProperty('--font-size', `${state.settings.fontSize}px`);
  els.root.style.setProperty('--line-height', state.settings.lineHeight);
  els.root.style.setProperty('--content-width', `${state.settings.contentWidth}px`);
  els.root.classList.toggle('dark', state.settings.darkMode);

  els.fontSize.value = state.settings.fontSize;
  els.fontSizeValue.value = `${state.settings.fontSize}px`;
  els.lineHeight.value = state.settings.lineHeight;
  els.lineHeightValue.value = String(state.settings.lineHeight);
  els.contentWidth.value = state.settings.contentWidth;
  els.contentWidthValue.value = `${state.settings.contentWidth}px`;
  els.darkMode.checked = state.settings.darkMode;
  els.tapScroll.checked = state.settings.tapScroll;
}

function bindEvents() {
  els.menuBtn.addEventListener('click', () => openSidebar());
  els.closeMenuBtn.addEventListener('click', closePanels);
  els.settingsBtn.addEventListener('click', () => openSettings());
  els.closeSettingsBtn.addEventListener('click', closePanels);
  els.backdrop.addEventListener('click', closePanels);

  els.fontSize.addEventListener('input', e => updateSetting('fontSize', Number(e.target.value)));
  els.lineHeight.addEventListener('input', e => updateSetting('lineHeight', Number(e.target.value)));
  els.contentWidth.addEventListener('input', e => updateSetting('contentWidth', Number(e.target.value)));
  els.darkMode.addEventListener('change', e => updateSetting('darkMode', e.target.checked));
  els.tapScroll.addEventListener('change', e => updateSetting('tapScroll', e.target.checked));

  els.prevBtn.addEventListener('click', () => loadMarkdown(state.currentIndex - 1));
  els.nextBtn.addEventListener('click', () => loadMarkdown(state.currentIndex + 1));

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closePanels();
    if (e.key === 'ArrowRight' || e.key === 'PageDown') pageScroll(1);
    if (e.key === 'ArrowLeft' || e.key === 'PageUp') pageScroll(-1);
    if (e.key === 'n' || e.key === 'N') loadMarkdown(state.currentIndex + 1);
    if (e.key === 'p' || e.key === 'P') loadMarkdown(state.currentIndex - 1);
  });

  document.addEventListener('pointerup', e => {
    if (!state.settings.tapScroll) return;
    if (els.sidebar.classList.contains('open') || els.settingsPanel.classList.contains('open')) return;
    if (e.target.closest('button, a, input, textarea, select, label')) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;

    const yRatio = e.clientY / window.innerHeight;
    if (yRatio >= 0.42) pageScroll(1);
    else pageScroll(-1);
  });
}

function updateSetting(key, value) {
  state.settings[key] = value;
  applySettings();
  saveSettings();
}

function pageScroll(direction) {
  const amount = Math.max(280, window.innerHeight * 0.82) * direction;
  window.scrollBy({ top: amount, behavior: 'smooth' });
  showTapHelp();
}

function showTapHelp() {
  els.tapHelp.classList.add('show');
  clearTimeout(showTapHelp.timer);
  showTapHelp.timer = setTimeout(() => els.tapHelp.classList.remove('show'), 900);
}

function openSidebar() {
  els.sidebar.classList.add('open');
  els.backdrop.classList.add('open');
}

function openSettings() {
  els.settingsPanel.classList.add('open');
  els.backdrop.classList.add('open');
}

function closePanels() {
  els.sidebar.classList.remove('open');
  els.settingsPanel.classList.remove('open');
  els.backdrop.classList.remove('open');
}

function showError(err) {
  console.error(err);
  els.chapterTitle.textContent = 'エラー';
  els.content.innerHTML = `
    <h1>読み込みエラー</h1>
    <p>${escapeHtml(err.message)}</p>
    <p>GitHub Pagesで公開する場合、<code>index.html</code> と <code>manifest.json</code> を同じ階層に置いてください。</p>
  `;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
