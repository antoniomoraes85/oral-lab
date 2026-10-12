/**
 * dashboard.js
 * MENTIVA — Mente Ativa | Dashboard principal
 *
 * Lê dados de:
 *   - localStorage: oral-lab-v2:collections (simulados e sessões)
 *   - IndexedDB:    oral-lab-active-recall-v1 (cards e schedules)
 *
 * Não modifica nenhum dado existente — somente leitura para o dashboard.
 */

'use strict';

// ─── Constants ────────────────────────────────────────────────────────────────

const LS_KEY    = 'oral-lab-v2';
const DB_NAME   = 'oral-lab-active-recall-v1';
const DB_VER    = 2;

// ─── Sidebar ──────────────────────────────────────────────────────────────────

const sidebar        = document.getElementById('sidebar');
const mainArea       = document.getElementById('main-area');
const sidebarToggle  = document.getElementById('sidebar-toggle');
const sidebarOverlay = document.getElementById('sidebar-overlay');
const hamburgerBtn   = document.getElementById('hamburger-btn');

let sidebarCollapsed = localStorage.getItem('mentiva-sidebar-collapsed') === '1';
applySidebarState();

sidebarToggle?.addEventListener('click', () => {
  sidebarCollapsed = !sidebarCollapsed;
  localStorage.setItem('mentiva-sidebar-collapsed', sidebarCollapsed ? '1' : '0');
  applySidebarState();
});

hamburgerBtn?.addEventListener('click', () => {
  sidebar.classList.toggle('mobile-open');
  sidebarOverlay.classList.toggle('visible');
});
sidebarOverlay?.addEventListener('click', closeMobileSidebar);

function applySidebarState() {
  if (window.innerWidth <= 768) return;
  sidebar.classList.toggle('collapsed', sidebarCollapsed);
  mainArea.classList.toggle('sidebar-collapsed', sidebarCollapsed);
}
function closeMobileSidebar() {
  sidebar.classList.remove('mobile-open');
  sidebarOverlay.classList.remove('visible');
}

window.addEventListener('resize', () => {
  if (window.innerWidth > 768) closeMobileSidebar();
});

// ─── WIP Modal (módulos em desenvolvimento) ───────────────────────────────────

const wipBackdrop = document.getElementById('wip-backdrop');
const wipTitle    = document.getElementById('wip-modal-title');
const wipDesc     = document.getElementById('wip-modal-desc');
const wipClose    = document.getElementById('wip-close');

function openWipModal(title, desc) {
  if (!wipBackdrop) return;
  wipTitle.textContent = title;
  wipDesc.textContent  = desc;
  wipBackdrop.classList.add('open');
}
wipClose?.addEventListener('click', () => wipBackdrop.classList.remove('open'));
wipBackdrop?.addEventListener('click', e => { if (e.target === wipBackdrop) wipBackdrop.classList.remove('open'); });

// Nav items WIP
document.querySelectorAll('[data-wip]').forEach(el => {
  el.addEventListener('click', e => {
    e.preventDefault();
    const mod = el.dataset.wip;
    const descs = {
      'Active Recall':     'O módulo de revisão espaçada com algoritmo SM-2 está em desenvolvimento. Estará disponível em breve.',
      'Flashcards':        'A interface de flashcards está em desenvolvimento como parte do módulo Active Recall.',
      'Banco de Questões': 'O banco de questões com filtros avançados está em desenvolvimento.',
      'Redação':           'O módulo de redação argumentativa estará disponível em uma próxima versão.',
      'Planos de Estudo':  'Os planos de estudo personalizados estão previstos para uma próxima versão.',
      'Desempenho':        'O dashboard de desempenho por matéria estará disponível em breve.',
      'Mapas Mentais':     'Os mapas mentais interativos estão em desenvolvimento.',
      'Materiais':         'A biblioteca de materiais de estudo estará disponível em breve.',
    };
    openWipModal(mod, descs[mod] || 'Este módulo está em desenvolvimento e será disponibilizado em breve.');
    closeMobileSidebar();
  });
});

// ─── Toast ────────────────────────────────────────────────────────────────────

function showToast(msg, dur = 3000) {
  const toast = document.getElementById('mentiva-toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), dur);
}

// ─── COSMOS CANVAS ────────────────────────────────────────────────────────────
// Efeito: estrelas + rede neural + horizonte planetário
// Suave, científico, sem neon excessivo.

function initCosmosCanvas() {
  const canvas = document.getElementById('cosmos-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  let W, H, nodes, raf;
  const NODE_COUNT  = 28;
  const MAX_DIST    = 130;
  const STAR_COUNT  = 90;
  let stars         = [];
  let driftX = 0, driftY = 0;
  let targetX = 0, targetY = 0;
  let reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let isMobile = window.innerWidth < 768;

  function resize() {
    W = canvas.offsetWidth;
    H = canvas.offsetHeight;
    canvas.width  = W * (window.devicePixelRatio || 1);
    canvas.height = H * (window.devicePixelRatio || 1);
    ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
    isMobile = W < 768;
    initParticles();
  }

  function initParticles() {
    // Stars — only in the right 65% of the canvas
    stars = Array.from({ length: STAR_COUNT }, () => ({
      x:  W * 0.35 + Math.random() * W * 0.65,
      y:  Math.random() * H,
      r:  Math.random() * 1.2 + 0.3,
      a:  Math.random() * 0.5 + 0.3,
      da: (Math.random() * 0.004 + 0.001) * (Math.random() < 0.5 ? 1 : -1),
    }));

    // Neural network nodes — right 60%
    nodes = Array.from({ length: NODE_COUNT }, () => ({
      x:  W * 0.38 + Math.random() * W * 0.58,
      y:  Math.random() * H,
      vx: (Math.random() - 0.5) * 0.18,
      vy: (Math.random() - 0.5) * 0.18,
      r:  Math.random() * 2.2 + 0.8,
    }));
  }

  function drawBg() {
    // Base: transparent — will show through the CSS bg color
    ctx.clearRect(0, 0, W, H);

    // Dark cosmos area (right portion)
    const gradient = ctx.createLinearGradient(W * 0.28, 0, W, 0);
    gradient.addColorStop(0,    'rgba(16,42,67,0)');
    gradient.addColorStop(0.18, 'rgba(16,42,67,0.92)');
    gradient.addColorStop(1,    'rgba(8,22,40,0.98)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, W, H);

    // Subtle planet horizon arc (bottom-right)
    const arcGrad = ctx.createRadialGradient(
      W * 0.82, H * 1.3, H * 0.3,
      W * 0.82, H * 1.3, H * 1.0
    );
    arcGrad.addColorStop(0,   'rgba(22,140,128,0.18)');
    arcGrad.addColorStop(0.5, 'rgba(23,105,170,0.08)');
    arcGrad.addColorStop(1,   'transparent');
    ctx.fillStyle = arcGrad;
    ctx.fillRect(0, 0, W, H);
  }

  function drawStars(t) {
    stars.forEach(s => {
      s.a += s.da;
      if (s.a <= 0.1 || s.a >= 0.85) s.da *= -1;
      ctx.beginPath();
      ctx.arc(
        s.x + (reduced ? 0 : driftX * 0.3),
        s.y + (reduced ? 0 : driftY * 0.3),
        s.r, 0, Math.PI * 2
      );
      ctx.fillStyle = `rgba(255,255,255,${s.a})`;
      ctx.fill();
    });
  }

  function drawNetwork(t) {
    // Move nodes
    if (!reduced) {
      nodes.forEach(n => {
        n.x += n.vx + driftX * 0.04;
        n.y += n.vy + driftY * 0.04;
        if (n.x < W * 0.35 || n.x > W) n.vx *= -1;
        if (n.y < 0 || n.y > H) n.vy *= -1;
      });
    }

    // Draw edges
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[j].x - nodes[i].x;
        const dy = nodes[j].y - nodes[i].y;
        const d  = Math.sqrt(dx * dx + dy * dy);
        if (d < MAX_DIST) {
          const alpha = (1 - d / MAX_DIST) * 0.35;
          ctx.beginPath();
          ctx.moveTo(nodes[i].x, nodes[i].y);
          ctx.lineTo(nodes[j].x, nodes[j].y);
          ctx.strokeStyle = `rgba(198,155,86,${alpha})`;
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
      }
    }

    // Draw nodes
    nodes.forEach(n => {
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.fill();
    });
  }

  function drawBrainOutline() {
    // Simple abstract brain silhouette using bezier curves
    ctx.save();
    const bx = W * 0.78, by = H * 0.42, bw = H * 0.52, bh = H * 0.52;
    ctx.translate(bx, by);
    ctx.scale(bw / 200, bh / 200);

    ctx.beginPath();
    // Left hemisphere outline (rough brain shape)
    ctx.moveTo(-10, -30);
    ctx.bezierCurveTo(-60, -90, -100, -70, -95, -10);
    ctx.bezierCurveTo(-100, 30, -80, 70, -30, 90);
    ctx.bezierCurveTo(-10, 100, 10, 100, 30, 90);
    ctx.bezierCurveTo(80, 70, 100, 30, 95, -10);
    ctx.bezierCurveTo(100, -70, 60, -90, 10, -30);
    ctx.closePath();
    ctx.strokeStyle = 'rgba(22,140,128,0.22)';
    ctx.lineWidth = 6;
    ctx.stroke();

    // Inner fold lines
    ctx.beginPath();
    ctx.moveTo(-30, -60); ctx.quadraticCurveTo(-50, 0, -20, 60);
    ctx.moveTo(30, -60);  ctx.quadraticCurveTo(50, 0, 20, 60);
    ctx.moveTo(-70, -20); ctx.quadraticCurveTo(-20, 0, -70, 30);
    ctx.moveTo(70, -20);  ctx.quadraticCurveTo(20, 0, 70, 30);
    ctx.strokeStyle = 'rgba(23,105,170,0.15)';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.restore();
  }

  function frame(t) {
    if (!reduced && !isMobile) {
      driftX += (targetX - driftX) * 0.06;
      driftY += (targetY - driftY) * 0.06;
    }
    drawBg();
    drawStars(t);
    drawNetwork(t);
    drawBrainOutline();
    raf = requestAnimationFrame(frame);
  }

  // Parallax on mouse move (desktop only)
  if (!isMobile && !reduced) {
    document.addEventListener('mousemove', e => {
      targetX = (e.clientX / window.innerWidth  - 0.5) * 18;
      targetY = (e.clientY / window.innerHeight - 0.5) * 10;
    });
  }

  // Parallax on scroll
  if (!reduced) {
    document.addEventListener('scroll', () => {
      const hero = canvas.closest('.hero-banner');
      if (!hero) return;
      const offset = window.scrollY * 0.35;
      hero.style.setProperty('--scroll-offset', `${offset}px`);
    }, { passive: true });
  }

  window.addEventListener('resize', () => { resize(); });
  resize();
  raf = requestAnimationFrame(frame);
}

// ─── localStorage helpers ─────────────────────────────────────────────────────

function loadLocalState() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function getSessionHistory(state) {
  if (!state) return [];
  const history = [];
  const cols = state.collections || {};
  Object.values(cols).forEach(col => {
    (col.sessionHistory || []).forEach(s => {
      history.push({
        date:       s.savedAt || s.date,
        collection: col.name,
        question:   s.questionTitle || s.question || '—',
        score:      s.score,
        duration:   s.duration,
        mode:       s.mode,
      });
    });
  });
  return history.sort((a, b) => (b.date || '') > (a.date || '') ? 1 : -1);
}

function getResumeItems(state) {
  if (!state) return [];
  const items = [];
  const cols = state.collections || {};
  const active = state.activeCollection;
  Object.entries(cols).forEach(([id, col]) => {
    if (!col.questions?.length) return;
    const lastIdx   = state.currentQuestionIndex?.[id] ?? 0;
    const total     = col.questions.length;
    const pct       = Math.round((lastIdx / total) * 100);
    const lastDate  = (col.sessionHistory || []).at(-1)?.savedAt || col.updatedAt;
    items.push({ id, name: col.name, pct, lastIdx, total, lastDate, isActive: id === active });
  });
  return items.sort((a, b) => (b.isActive ? 1 : 0) - (a.isActive ? 1 : 0));
}

// ─── Dashboard Sections ───────────────────────────────────────────────────────

function renderStats(state) {
  const el = id => document.getElementById(id);
  if (!state) {
    el('stat-sessions')?.textContent && (el('stat-sessions').textContent = '0');
    return;
  }
  const history  = getSessionHistory(state);
  const sessions = history.length;
  let totalMin = 0;
  let totalScore = 0, scoredCount = 0;
  history.forEach(s => {
    if (s.duration) {
      const [m, sec] = String(s.duration).split(':').map(Number);
      totalMin += (m || 0) + (sec || 0) / 60;
    }
    if (typeof s.score === 'number') { totalScore += s.score; scoredCount++; }
  });
  const avgScore = scoredCount ? Math.round(totalScore / scoredCount) : null;
  const hours    = Math.floor(totalMin / 60);
  const mins     = Math.round(totalMin % 60);

  if (el('stat-sessions'))  el('stat-sessions').textContent  = sessions;
  if (el('stat-time'))      el('stat-time').textContent      = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  if (el('stat-avg')) {
    el('stat-avg').textContent = avgScore !== null ? `${avgScore}%` : '—';
  }
  if (el('stat-flashcards')) el('stat-flashcards').textContent = '—';

  // Progress bars
  if (el('progress-oral')) {
    const pct = Math.min(sessions * 5, 100);
    el('progress-oral').style.width = `${pct}%`;
    el('progress-oral-pct').textContent = `${pct}%`;
  }
}

function renderResumeSection(state) {
  const container = document.getElementById('resume-container');
  if (!container) return;
  const items = getResumeItems(state);
  if (!items.length) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📖</div>
        <div class="empty-state-title">Nenhum simulado iniciado ainda</div>
        <div class="empty-state-desc">Comece sua primeira sessão de prova oral e acompanhe seu progresso aqui.</div>
        <a href="./index.html" class="empty-state-cta">Iniciar prova oral →</a>
      </div>`;
    return;
  }
  container.innerHTML = items.slice(0, 3).map(item => {
    const date = item.lastDate ? new Date(item.lastDate).toLocaleDateString('pt-BR', { day:'2-digit', month:'short' }) : '—';
    return `
      <a href="./index.html" class="resume-card">
        <div class="resume-card-icon teal-lt" style="background:var(--teal-lt)">🎤</div>
        <div class="resume-card-body">
          <div class="resume-card-label">Prova Oral · Última interação ${date}</div>
          <div class="resume-card-title">${escapeHtml(item.name)}</div>
          <div class="resume-progress-track">
            <div class="resume-progress-fill" style="width:${item.pct}%"></div>
          </div>
          <div class="resume-card-meta">Questão ${item.lastIdx + 1} de ${item.total} · ${item.pct}% concluído</div>
        </div>
        <span class="resume-cta">Continuar →</span>
      </a>`;
  }).join('');
}

function renderSessionsTable(state) {
  const tbody = document.getElementById('sessions-tbody');
  if (!tbody) return;
  const history = getSessionHistory(state).slice(0, 8);
  if (!history.length) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--text-3);padding:24px">Nenhuma sessão salva ainda.</td></tr>`;
    return;
  }
  tbody.innerHTML = history.map(s => {
    const date     = s.date ? new Date(s.date).toLocaleDateString('pt-BR', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' }) : '—';
    const scoreVal = typeof s.score === 'number' ? s.score : null;
    const pillCls  = scoreVal === null ? 'none' : scoreVal >= 80 ? 'good' : scoreVal >= 55 ? 'ok' : 'low';
    const pillTxt  = scoreVal !== null ? `${scoreVal}%` : '—';
    return `<tr>
      <td>${date}</td>
      <td>Prova Oral</td>
      <td style="max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escapeHtml(s.collection || '—')}</td>
      <td><span class="score-pill ${pillCls}">${pillTxt}</span></td>
      <td>${s.duration || '—'}</td>
    </tr>`;
  }).join('');
}

// ─── IndexedDB — cards para revisão ──────────────────────────────────────────

async function loadReviewCount() {
  const el = document.getElementById('review-count');
  const btn = document.getElementById('review-btn');
  const note = document.getElementById('review-note');
  if (!el) return;

  try {
    const db = await openDB();
    const schedules = await getAllFromStore(db, 'schedules');
    const now   = new Date();
    const due   = schedules.filter(s => s.nextReview && new Date(s.nextReview) <= now);
    el.textContent   = due.length;

    if (due.length === 0) {
      if (btn) { btn.disabled = true; btn.textContent = 'Sem revisões pendentes'; }
      if (note) note.textContent = 'Você está em dia com suas revisões! 🎉';
    } else {
      if (btn) {
        btn.disabled = false;
        btn.textContent = `Revisar ${due.length} card${due.length > 1 ? 's' : ''} →`;
      }
      if (note) note.textContent = `${due.length} card${due.length > 1 ? 's' : ''} aguardando revisão hoje.`;
    }
    db.close();
  } catch {
    el.textContent = '—';
    if (note) note.textContent = 'Active Recall em desenvolvimento — disponível em breve.';
    if (btn) { btn.disabled = true; btn.textContent = 'Em breve'; }
  }
}

function openDB() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') { reject(new Error('IndexedDB indisponível')); return; }
    const req = indexedDB.open(DB_NAME, DB_VER);
    req.onerror   = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = () => {}; // não cria schema novo aqui
  });
}

function getAllFromStore(db, storeName) {
  return new Promise((resolve, reject) => {
    try {
      const tx  = db.transaction(storeName, 'readonly');
      const req = tx.objectStore(storeName).getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror   = () => reject(req.error);
    } catch { resolve([]); }
  });
}

// ─── Utilidades ───────────────────────────────────────────────────────────────

function escapeHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-BR', { day:'2-digit', month:'short' });
}

// ─── Greeting dinâmico ────────────────────────────────────────────────────────

function setGreeting() {
  const el = document.getElementById('dashboard-greeting');
  if (!el) return;
  const h = new Date().getHours();
  const g = h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
  el.textContent = `${g}! Pronto para estudar?`;
}

// ─── Boot ─────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  initCosmosCanvas();
  setGreeting();

  const state = loadLocalState();
  renderStats(state);
  renderResumeSection(state);
  renderSessionsTable(state);
  loadReviewCount();

  // Fechar sidebar mobile ao clicar em link de navegação
  document.querySelectorAll('.nav-item').forEach(el => {
    el.addEventListener('click', closeMobileSidebar);
  });
});
