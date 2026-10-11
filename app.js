import { MODULES as ORIGINAL_QUESTIONS, SOURCES } from './content.js';
import { alignTranscript, tokenized } from './alignment.js';

const $ = id => document.getElementById(id);
const modes = { short: '30 segundos', medium: '90 segundos', full: 'Completa' };
const storageKey = 'oral-lab-v2';
const seedId = 'familias-cuidado';

const makeSeed = () => ({
  id: seedId,
  name: 'Direito das Famílias — Trabalho de cuidado',
  description: 'Simulado inicial: cuidado, desigualdade de gênero e direitos das mulheres.',
  questions: ORIGINAL_QUESTIONS.map((q, i) => ({ ...q, id: `seed-${i + 1}` }))
});

let store = {
  collections: [makeSeed()],
  activeCollectionId: seedId,
  edits: {},
  history: [],
  fontSize: 22,
  consent: false,
  soundEnabled: true
};

let persistent = true;
try {
  const newer = localStorage.getItem(storageKey);
  if (newer) {
    const parsed = JSON.parse(newer);
    if (parsed && Array.isArray(parsed.collections) && parsed.collections.length) {
      store = { ...store, ...parsed };
    }
  } else {
    const old = localStorage.getItem('brunella-interview-studio-v1');
    if (old) {
      const legacy = JSON.parse(old);
      if (legacy?.edits) {
        for (const [key, v] of Object.entries(legacy.edits)) {
          const match = key.match(/^([0-5]):(short|medium|full)$/);
          if (match && typeof v === 'string') store.edits[`${seedId}:seed-${Number(match[1]) + 1}:${match[2]}`] = v;
        }
      }
      if (Array.isArray(legacy.history)) store.history = legacy.history.map(e => ({ ...e, collectionId: seedId }));
      if (Number.isInteger(legacy.fontSize)) store.fontSize = legacy.fontSize;
      if (typeof legacy.consent === 'boolean') store.consent = legacy.consent;
    }
  }
  if (typeof store.soundEnabled !== 'boolean') store.soundEnabled = true;
  localStorage.setItem(storageKey, JSON.stringify(store));
} catch (e) {
  persistent = false;
}

if (!Array.isArray(store.collections) || !store.collections.length) store.collections = [makeSeed()];
if (!store.collections.some(x => x.id === store.activeCollectionId)) store.activeCollectionId = store.collections[0].id;
if (!store.edits || typeof store.edits !== 'object') store.edits = {};

const activeCollection = () => store.collections.find(x => x.id === store.activeCollectionId) || store.collections[0];
let MODULES = activeCollection().questions;
const makeId = () => `q-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

let moduleIndex = 0, mode = 'full', memory = false, voice = null;
const voiceSupported = !!(window.SpeechRecognition || window.webkitSpeechRecognition);
let listening = false, paused = false, recognitionDesired = false;
let finalizedSegments = [], currentRecognitionFinal = '', currentRecognitionInterim = '', manualOverride = '';
let runStart = null, elapsedMs = 0, timerHandle = null;

// Diagnóstico e controle de reinicialização progressiva do SpeechRecognition
let restartAttempts = 0;
const MAX_RESTART_ATTEMPTS = 5;
let restartTimer = null;
let diagResultsCount = 0;
let diagLastErrorCode = 'Nenhum';

let highlightResult = {
  matched: new Set(),
  skipped: new Set(),
  pendingSkipped: new Set(),
  semanticMatches: [],
  progress: 0,
  current: 0,
  total: 0,
  words: 0,
  coverage: 0,
  semanticScore: 0,
  finalScore: 0
};

let currentWordEls = [];
let toastHandle = null;
let lastAutoScroll = -1;

// Gerenciamento do Som de Erro em Omissões (Web Audio API sintetizada, discreta e sem arquivos externos)
let audioCtx = null;
let lastOmissionCount = 0;
let lastSoundPlayTime = 0;

function playSubtleErrorSound() {
  if (!store.soundEnabled) return;
  const now = performance.now();
  // Evitar cascata sonora: intervalo mínimo de 1.8s entre bipes
  if (now - lastSoundPlayTime < 1800) return;
  lastSoundPlayTime = now;

  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    if (!audioCtx) audioCtx = new AudioContextClass();
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    // Som suave, discreto e curto (duplo tom amigável de alerta leve)
    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(240, audioCtx.currentTime + 0.14);

    gain.gain.setValueAtTime(0.0001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.08, audioCtx.currentTime + 0.02); // volume baixo
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.14);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + 0.15);
  } catch (err) {
    // Falha silenciosa de áudio
  }
}

function updateSoundButtonUI() {
  const btn = $('sound-toggle');
  const icon = $('sound-icon');
  const text = $('sound-text');
  if (!btn) return;
  if (store.soundEnabled) {
    btn.classList.remove('muted');
    if (icon) icon.textContent = '🔔';
    if (text) text.textContent = 'Som Ativo';
  } else {
    btn.classList.add('muted');
    if (icon) icon.textContent = '🔕';
    if (text) text.textContent = 'Sem Som';
  }
}

function toggleSound() {
  store.soundEnabled = !store.soundEnabled;
  persist();
  updateSoundButtonUI();
  toast(store.soundEnabled ? 'Feedback sonoro de omissões ATIVADO.' : 'Feedback sonoro DESATIVADO.');
}

function persist() {
  try {
    localStorage.setItem(storageKey, JSON.stringify(store));
    persistent = true;
    $('storage-status').textContent = 'Dados neste dispositivo';
    return true;
  } catch (e) {
    persistent = false;
    $('storage-status').textContent = 'Armazenamento indisponível';
    toast('Dados não puderam ser salvos: exporte um backup JSON.');
    return false;
  }
}

function toast(msg) {
  const el = $('toast');
  if (!el) return;
  el.textContent = msg;
  el.hidden = false;
  clearTimeout(toastHandle);
  toastHandle = setTimeout(() => el.hidden = true, 5000);
}

const editionKey = (i, m) => `${store.activeCollectionId}:${MODULES[i]?.id}:${m}`;

function currentText(i = moduleIndex, m = mode) {
  const value = store.edits[editionKey(i, m)];
  return typeof value === 'string' ? value : (MODULES[i]?.[m] || '');
}

function renderModules() {
  const nav = $('module-nav');
  nav.replaceChildren();
  MODULES.forEach((mod, i) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'module-tab' + (i === moduleIndex ? ' active' : '');
    button.setAttribute('aria-current', i === moduleIndex ? 'step' : 'false');
    button.innerHTML = `<span class="module-no">PERGUNTA ${String(i + 1).padStart(2, '0')}</span><span class="module-name"></span>`;
    button.querySelector('.module-name').textContent = mod.title;
    button.addEventListener('click', () => selectModule(i));
    nav.append(button);
  });
  $('overall-counter').innerHTML = `${String(MODULES.length ? moduleIndex + 1 : 0).padStart(2, '0')} <small>/ ${String(MODULES.length).padStart(2, '0')}</small>`;
  $('overall-fill').style.width = (MODULES.length ? (moduleIndex + 1) / MODULES.length * 100 : 0) + '%';
}

function renderContent() {
  const mod = MODULES[moduleIndex] || {
    title: 'Comece criando uma questão',
    question: 'Este simulado ainda não tem perguntas.',
    idea: 'Adicione uma questão para montar seu próprio roteiro.',
    arguments: [],
    closing: '',
    followup: '',
    alert: '',
    keywords: []
  };

  $('section-label').textContent = `QUESTÃO ${String(MODULES.length ? moduleIndex + 1 : 0).padStart(2, '0')}`;
  $('tele-heading').textContent = mod.title;
  $('main-question').textContent = mod.question;

  document.querySelectorAll('[data-mode]').forEach(b => {
    b.classList.toggle('active', b.dataset.mode === mode);
    b.setAttribute('aria-pressed', String(b.dataset.mode === mode));
  });

  $('idea-text').textContent = mod.idea;
  $('argument-list').replaceChildren();
  mod.arguments.forEach(a => {
    const li = document.createElement('li');
    li.textContent = a;
    $('argument-list').append(li);
  });
  $('closing-text').textContent = mod.closing;
  $('follow-up').textContent = mod.followup;
  $('legal-alert').textContent = mod.alert;

  const map = $('mind-map');
  map.replaceChildren();
  mod.keywords.forEach((s, i) => {
    if (i) {
      const arrow = document.createElement('span');
      arrow.className = 'map-connector';
      arrow.textContent = '→';
      map.append(arrow);
    }
    const node = document.createElement('span');
    node.className = 'map-node';
    node.textContent = s;
    map.append(node);
  });

  const keywords = $('keywords-content');
  keywords.replaceChildren();
  const big = document.createElement('p');
  big.className = 'memory-center';
  big.textContent = mod.idea;
  keywords.append(big);
  mod.keywords.forEach(s => {
    const pill = document.createElement('span');
    pill.className = 'keyword-pill';
    pill.textContent = s;
    keywords.append(pill);
  });
  const hint = document.createElement('p');
  hint.className = 'memory-flow';
  hint.textContent = 'Use os conceitos acima para construir a resposta com suas próprias palavras.';
  keywords.append(hint);

  $('font-size-label').textContent = `${store.fontSize} px`;
  $('tele-content').style.fontSize = `${store.fontSize}px`;
  $('tele-content').hidden = memory;
  keywords.hidden = !memory;
  renderTeleprompter();
}

function renderTeleprompter() {
  const text = currentText();
  const out = $('tele-content');
  out.replaceChildren();
  currentWordEls = [];

  const paragraphs = text.split(/\n\s*\n/);
  let wordIndex = 0;
  for (const para of paragraphs) {
    const p = document.createElement('p');
    const parts = para.split(/([\p{L}\p{N}]+(?:[’'-][\p{L}\p{N}]+)*)/gu);
    parts.forEach((part, index) => {
      if (index % 2 === 1) {
        const el = document.createElement('span');
        el.className = 'word';
        el.dataset.wordIndex = wordIndex++;
        el.textContent = part;
        currentWordEls.push(el);
        p.appendChild(el);
      } else {
        p.appendChild(document.createTextNode(part));
      }
    });
    out.appendChild(p);
  }
  lastAutoScroll = -1;
  lastOmissionCount = 0;
  refreshTranscript();
}

function transcriptText() {
  return manualOverride || [...finalizedSegments, currentRecognitionFinal, currentRecognitionInterim].filter(Boolean).join(' ').trim();
}

function refreshTranscript() {
  const text = transcriptText();
  highlightResult = alignTranscript(tokenized(currentText()), tokenized(text));
  const h = highlightResult;

  // Atualiza métricas na interface
  $('metric-words').textContent = String(h.words);
  $('metric-skipped').textContent = String(h.skipped.size);
  $('metric-score').textContent = `${h.finalScore}%`;
  $('word-position').textContent = `${h.words} / ${h.total} palavras`;
  $('progress-label').textContent = `${h.progress}%`;
  $('progress-fill').style.width = `${h.progress}%`;

  // Disparo de Som de Erro em Omissão Confirmada
  if (h.skipped.size > lastOmissionCount) {
    playSubtleErrorSound();
    lastOmissionCount = h.skipped.size;
  }

  // Mapeamento dos blocos aceitos por equivalência semântica
  const semanticSet = new Set();
  h.semanticMatches.forEach(sm => {
    for (let idx = sm.range[0]; idx <= sm.range[1]; idx++) {
      semanticSet.add(idx);
    }
  });

  // Atualização visual das palavras com as classes exigidas
  for (let idx = 0; idx < currentWordEls.length; idx++) {
    let cl = 'word';
    if (semanticSet.has(idx)) {
      cl += ' semantic'; // Azul: paráfrase aceita semanticamente
    } else if (h.matched.has(idx)) {
      cl += ' matched'; // Verde: correto
    } else if (h.skipped.has(idx)) {
      cl += ' skipped'; // Vermelho: omitido / pulado
    } else if (h.pendingSkipped && h.pendingSkipped.has(idx)) {
      cl += ' pending'; // Hesitação em janela de tolerância
    } else if (idx === h.current && text) {
      cl += ' current'; // Dourado: palavra em foco
    }
    currentWordEls[idx].className = cl;
  }

  // Scroll automático suave mantendo a linha atual visível
  if (text && h.current !== lastAutoScroll && h.progress > 0) {
    lastAutoScroll = h.current;
    const target = currentWordEls[h.current];
    if (target) {
      const rect = target.getBoundingClientRect();
      const parent = $('tele-window').getBoundingClientRect();
      if (rect.top < parent.top + 65 || rect.bottom > parent.bottom - 90) {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }

  $('transcript').textContent = text || 'A transcrição aparecerá aqui conforme você falar.';
}

function renderClock() {
  const ms = elapsedMs + (runStart ? performance.now() - runStart : 0);
  const t = Math.floor(ms / 1000);
  $('metric-time').textContent = `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
}

function stopClock() {
  if (runStart) {
    elapsedMs += performance.now() - runStart;
    runStart = null;
  }
  clearInterval(timerHandle);
  renderClock();
}

function startClock() {
  if (!runStart) runStart = performance.now();
  clearInterval(timerHandle);
  timerHandle = setInterval(renderClock, 250);
  renderClock();
}

function updateDiag(stateText = null) {
  if (stateText && $('diag-state')) $('diag-state').textContent = stateText;
  if ($('diag-support')) $('diag-support').textContent = voiceSupported ? 'Suportado (Web Speech API)' : 'Não suportado no navegador';
  if ($('diag-last-error')) $('diag-last-error').textContent = diagLastErrorCode;
  if ($('diag-results-count')) $('diag-results-count').textContent = String(diagResultsCount);
  if ($('diag-restarts-count')) $('diag-restarts-count').textContent = `${restartAttempts} / ${MAX_RESTART_ATTEMPTS}`;
}

function status(text, state = 'idle') {
  if ($('speech-status')) $('speech-status').textContent = text;
  if ($('dock-status')) $('dock-status').textContent = text;
  if ($('mic-dot')) $('mic-dot').className = 'mic-dot ' + state;
  if ($('start-button')) $('start-button').disabled = listening;
  if ($('pause-button')) $('pause-button').disabled = !listening;
  if ($('resume-button')) $('resume-button').hidden = !paused;
  if ($('pause-button')) $('pause-button').hidden = paused;
  updateDiag(text);
}

function commitRecognition() {
  const complete = [currentRecognitionFinal, currentRecognitionInterim].filter(Boolean).join(' ').trim();
  if (complete) {
    // Evita duplicar segmento se já for igual ao último inserido
    const lastSeg = finalizedSegments[finalizedSegments.length - 1];
    if (lastSeg !== complete) {
      finalizedSegments.push(complete);
    }
  }
  currentRecognitionFinal = '';
  currentRecognitionInterim = '';
}

function newRecognizer() {
  const Voice = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!Voice) return null;
  const r = new Voice();
  r.lang = 'pt-BR';
  r.continuous = true;
  r.interimResults = true;
  r.maxAlternatives = 1;

  // Eventos de Ciclo de Vida do SpeechRecognition
  r.onstart = () => {
    console.info('[SpeechRecognition] onstart: serviço iniciado com sucesso.');
    restartAttempts = 0; // Reconhecimento ativo com sucesso zera tentativas de reinicialização
    status('Ouvindo em português (Brasil)...', 'listening');
  };

  r.onaudiostart = () => {
    console.info('[SpeechRecognition] onaudiostart: captura de áudio ativa.');
  };

  r.onspeechstart = () => {
    console.info('[SpeechRecognition] onspeechstart: fala humana detectada.');
    status('Recebendo transcrição...', 'speaking');
  };

  r.onspeechend = () => {
    console.info('[SpeechRecognition] onspeechend: pausa na fala detectada.');
    if (listening && !paused) {
      status('Ouvindo em português (Brasil)...', 'listening');
    }
  };

  r.onaudioend = () => {
    console.info('[SpeechRecognition] onaudioend: captura de áudio suspensa.');
  };

  r.onresult = e => {
    diagResultsCount++;
    console.info(`[SpeechRecognition] onresult: ${e.results.length} resultados (último índice: ${e.resultIndex}).`);

    let finalized = [], interim = [];
    for (let k = 0; k < e.results.length; k++) {
      const row = e.results[k];
      const text = (row[0]?.transcript || '').trim();
      if (!text) continue;
      if (row.isFinal) {
        finalized.push(text);
      } else {
        interim.push(text);
      }
    }

    currentRecognitionFinal = finalized.join(' ').trim();
    currentRecognitionInterim = interim.join(' ').trim();
    refreshTranscript();
    updateDiag('Recebendo transcrição');
  };

  r.onerror = e => {
    diagLastErrorCode = e.error || 'desconhecido';
    console.warn(`[SpeechRecognition] onerror: ${e.error}`);
    updateDiag();

    // Tratamento específico de cada erro
    switch (e.error) {
      case 'not-allowed':
      case 'service-not-allowed':
        recognitionDesired = false;
        listening = false;
        paused = true;
        stopClock();
        status('Permissão de microfone negada no navegador', 'error');
        if ($('manual-details')) $('manual-details').open = true;
        toast('Permissão de microfone negada. Autorize nas configurações do navegador ou use o modo manual.');
        break;

      case 'audio-capture':
        recognitionDesired = false;
        listening = false;
        paused = true;
        stopClock();
        status('Nenhum microfone encontrado ou dispositivo em uso', 'error');
        if ($('manual-details')) $('manual-details').open = true;
        toast('Microfone não detectado. Verifique os dispositivos de áudio.');
        break;

      case 'language-not-supported':
        recognitionDesired = false;
        listening = false;
        paused = true;
        stopClock();
        status('Idioma pt-BR não suportado pelo navegador', 'error');
        toast('O serviço do navegador não suporta reconhecimento em português (Brasil).');
        break;

      case 'network':
        status('Falha de rede no serviço de voz do navegador', 'error');
        toast('Erro de rede na Web Speech API do navegador. Verifique a conexão.');
        break;

      case 'no-speech':
        if (listening && !paused) {
          status('Sem fala detectada; aguardando...', 'listening');
        }
        break;

      case 'aborted':
        console.info('[SpeechRecognition] onerror: sessão abortada intencionalmente.');
        break;

      default:
        toast(`Reconhecimento de voz: ${e.error}`);
        break;
    }
  };

  r.onend = () => {
    console.info('[SpeechRecognition] onend: sessão finalizada.');
    commitRecognition();
    refreshTranscript();
    voice = null;

    if (recognitionDesired && listening && !paused) {
      if (restartAttempts < MAX_RESTART_ATTEMPTS) {
        restartAttempts++;
        const backoffDelay = Math.min(1500, 250 * Math.pow(1.5, restartAttempts));
        status(`Reiniciando escuta (${restartAttempts}/${MAX_RESTART_ATTEMPTS})...`, 'starting');
        clearTimeout(restartTimer);
        restartTimer = setTimeout(() => {
          if (recognitionDesired && listening && !paused) {
            try {
              voice = newRecognizer();
              voice.start();
            } catch (err) {
              console.warn('[SpeechRecognition] Falha ao reiniciar:', err);
              if (restartAttempts >= MAX_RESTART_ATTEMPTS) {
                recognitionDesired = false;
                listening = false;
                paused = true;
                stopClock();
                status('Limite de tentativas de microfone atingido', 'paused');
                toast('O serviço de reconhecimento não respondeu. Use a transcrição manual ou tente novamente.');
              }
            }
          }
        }, backoffDelay);
      } else {
        recognitionDesired = false;
        listening = false;
        paused = true;
        stopClock();
        status('Serviço de voz suspenso (muitas tentativas)', 'paused');
        if ($('manual-details')) $('manual-details').open = true;
        toast('Serviço de reconhecimento suspenso após múltiplas tentativas. Use o modo manual.');
      }
    } else if (!listening) {
      status(paused ? 'Treino pausado' : 'Treino encerrado', paused ? 'paused' : 'idle');
    }
  };

  return r;
}

function beginVoice() {
  if (!MODULES.length) {
    toast('Adicione uma questão antes de iniciar o treino.');
    return;
  }
  if (!voiceSupported) {
    if ($('manual-details')) $('manual-details').open = true;
    toast('Este navegador não oferece SpeechRecognition. Use a transcrição manual.');
    status('Modo manual disponível', 'idle');
    return;
  }

  manualOverride = '';
  recognitionDesired = true;
  listening = true;
  paused = false;
  restartAttempts = 0;
  clearTimeout(restartTimer);

  // Não marca como "Ouvindo" ainda; aguarda a confirmação de onstart
  status('Iniciando microfone...', 'starting');
  startClock();

  try {
    voice = newRecognizer();
    voice.start();
  } catch (e) {
    console.error('[SpeechRecognition] Exceção em start():', e);
    diagLastErrorCode = e.message || 'falha_start';
    recognitionDesired = false;
    listening = false;
    paused = true;
    stopClock();
    status('Microfone não iniciado', 'paused');
    if ($('manual-details')) $('manual-details').open = true;
    toast('Não foi possível iniciar o microfone. Verifique permissões e conexão segura.');
  }
}

function startVoice() {
  if (!voiceSupported) {
    beginVoice();
    return;
  }
  if (!store.consent) {
    status('Solicitando permissão...', 'requesting');
    if ($('privacy-modal')) $('privacy-modal').hidden = false;
    return;
  }
  beginVoice();
}

function pauseVoice() {
  if (!listening) return;
  recognitionDesired = false;
  listening = false;
  paused = true;
  clearTimeout(restartTimer);
  stopClock();
  status('Treino pausado', 'paused');
  try { voice?.stop(); } catch (e) {}
}

function resumeVoice() {
  if (!paused) return;
  beginVoice();
}

function stopVoice() {
  recognitionDesired = false;
  listening = false;
  paused = false;
  clearTimeout(restartTimer);
  stopClock();
  try { voice?.stop(); } catch (e) {}
  voice = null;
}

function clearRun() {
  stopVoice();
  finalizedSegments = [];
  currentRecognitionFinal = '';
  currentRecognitionInterim = '';
  manualOverride = '';
  elapsedMs = 0;
  runStart = null;
  lastOmissionCount = 0;
  status('Pronto para praticar', 'idle');
  $('tele-window').scrollTop = 0;
  renderClock();
  refreshTranscript();
}

function selectModule(i) {
  if (i === moduleIndex) return;
  stopVoice();
  moduleIndex = i;
  clearRun();
  renderModules();
  renderContent();
}

// Conclusão e Relatório de Pontuação Final
function finishSession() {
  stopVoice();
  refreshTranscript();
  status('Ensaio concluído', 'done');

  const h = highlightResult;
  $('final-score-val').textContent = String(h.finalScore);
  $('modal-coverage-val').textContent = `${h.coverage}%`;
  $('modal-semantic-val').textContent = `${h.semanticScore}%`;
  $('modal-skipped-val').textContent = `${h.skipped.size} palavras`;
  $('modal-paraphrases-val').textContent = `${h.semanticMatches.length} trecho(s)`;

  // Qualificação pedagógica
  const ratingTitle = $('score-rating-title');
  const ratingDesc = $('score-rating-desc');
  if (h.finalScore >= 85) {
    ratingTitle.textContent = 'Desempenho Excelente (Aprovado)';
    ratingDesc.textContent = 'Domínio pleno do roteiro com ótima cobertura conceitual e fluência argumentativa.';
  } else if (h.finalScore >= 70) {
    ratingTitle.textContent = 'Desempenho Muito Bom';
    ratingDesc.textContent = 'Roteiro bem sustentado com pequenas omissões ou paráfrases que mantiveram a ideia central.';
  } else if (h.finalScore >= 50) {
    ratingTitle.textContent = 'Desempenho Regular';
    ratingDesc.textContent = 'Pontos essenciais foram transmitidos, mas há omissões expressivas que merecem reforço.';
  } else {
    ratingTitle.textContent = 'Necessita de Mais Treino';
    ratingDesc.textContent = 'Muitas palavras-chave foram puladas. Recomendamos treinar primeiro a versão de 30 segundos.';
  }

  // Lista de trechos omitidos
  const omissionsBox = $('omissions-container');
  const omissionsTags = $('omissions-tags');
  omissionsTags.replaceChildren();

  if (h.skipped.size > 0) {
    omissionsBox.hidden = false;
    const skippedArr = Array.from(h.skipped).slice(0, 20); // primeiras 20 palavras
    skippedArr.forEach(idx => {
      const el = currentWordEls[idx];
      if (el) {
        const pill = document.createElement('span');
        pill.className = 'omission-pill';
        pill.textContent = el.textContent;
        omissionsTags.append(pill);
      }
    });
    if (h.skipped.size > 20) {
      const more = document.createElement('span');
      more.className = 'omission-pill';
      more.textContent = `+ ${h.skipped.size - 20} outras...`;
      omissionsTags.append(more);
    }
  } else {
    omissionsBox.hidden = true;
  }

  $('score-modal').hidden = false;
}

function openEditor() {
  if (!MODULES.length) {
    toast('Crie uma questão antes de editar respostas.');
    return;
  }
  pauseVoice();
  $('editor-subtitle').textContent = `Pergunta ${moduleIndex + 1} · Versão ${modes[mode]}`;
  $('editor-text').value = currentText();
  $('editor-modal').hidden = false;
  $('editor-text').focus();
}

function closeEditor() {
  $('editor-modal').hidden = true;
}

function saveEditor() {
  const text = $('editor-text').value.trim();
  if (!text) {
    toast('O roteiro não pode ficar vazio.');
    return;
  }
  store.edits[editionKey(moduleIndex, mode)] = text;
  persist();
  closeEditor();
  clearRun();
  renderTeleprompter();
  toast('Resposta salva neste dispositivo.');
}

function restoreEditor() {
  if (!confirm('Restaurar o texto original desta versão?')) return;
  delete store.edits[editionKey(moduleIndex, mode)];
  persist();
  $('editor-text').value = MODULES[moduleIndex]?.[mode] || '';
  clearRun();
  renderTeleprompter();
  toast('Versão original restaurada.');
}

function saveSession() {
  stopClock();
  if (!transcriptText()) {
    toast('Não há transcrição para registrar nesta sessão.');
    return;
  }
  const item = {
    date: new Date().toISOString(),
    collectionId: store.activeCollectionId,
    questionId: MODULES[moduleIndex]?.id,
    module: moduleIndex,
    mode,
    seconds: Math.round(elapsedMs / 1000),
    words: highlightResult.words,
    progress: highlightResult.progress,
    skipped: highlightResult.skipped.size,
    score: highlightResult.finalScore,
    paraphrases: highlightResult.semanticMatches.length,
    transcript: transcriptText()
  };
  store.history.unshift(item);
  store.history = store.history.slice(0, 30);
  persist();
  renderHistory();
  toast('Sessão registrada no histórico com pontuação.');
}

function renderHistory() {
  const hist = $('history-list');
  hist.replaceChildren();
  if (!store.history?.length) {
    hist.textContent = 'Nenhuma sessão salva.';
    return;
  }
  store.history.forEach(e => {
    const row = document.createElement('div');
    row.className = 'history-row';
    const scoreText = e.score !== undefined ? ` · Score ${e.score}%` : '';
    row.textContent = `${new Date(e.date).toLocaleString('pt-BR')} · ${(store.collections.find(c => c.id === e.collectionId)?.name || 'Simulado')} · Q${e.module + 1} · ${modes[e.mode] || e.mode} · ${e.seconds}s · avanço ${e.progress}%${scoreText}`;
    hist.append(row);
  });
}

function downloadFile(name, content, mime) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

function exportJSON() {
  downloadFile(
    'oral-lab-backup.json',
    JSON.stringify({
      application: 'Oral Lab',
      version: 2,
      exportedAt: new Date().toISOString(),
      collections: store.collections,
      activeCollectionId: store.activeCollectionId,
      edits: store.edits,
      history: store.history,
      fontSize: store.fontSize,
      soundEnabled: store.soundEnabled
    }, null, 2),
    'application/json;charset=utf-8'
  );
  toast('Backup completo exportado em JSON.');
}

async function importJSON(file) {
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    if (!data || data.application !== 'Oral Lab' || data.version !== 2 || !Array.isArray(data.collections) || !data.collections.length) {
      throw Error('Arquivo não reconhecido como backup Oral Lab v2');
    }
    if (!confirm('Importar o backup? Substituirá simulados e edições locais.')) return;
    store.collections = data.collections;
    store.activeCollectionId = store.collections.some(c => c.id === data.activeCollectionId) ? data.activeCollectionId : store.collections[0].id;
    store.edits = data.edits && typeof data.edits === 'object' ? data.edits : {};
    store.history = Array.isArray(data.history) ? data.history.slice(0, 100) : [];
    store.fontSize = Number.isInteger(data.fontSize) ? Math.max(16, Math.min(32, data.fontSize)) : store.fontSize;
    if (typeof data.soundEnabled === 'boolean') store.soundEnabled = data.soundEnabled;

    moduleIndex = 0;
    MODULES = activeCollection().questions;
    persist();
    clearRun();
    renderLibrary();
    renderModules();
    renderContent();
    renderHistory();
    updateSoundButtonUI();
    toast('Simulados importados com sucesso.');
  } catch (e) {
    toast(`Falha na importação: ${e.message}`);
  }
}

function renderLibrary() {
  const sel = $('collection-select');
  sel.replaceChildren();
  store.collections.forEach(c => {
    const o = document.createElement('option');
    o.value = c.id;
    o.textContent = c.name;
    sel.append(o);
  });
  sel.value = store.activeCollectionId;
  const c = activeCollection();
  $('collection-heading').textContent = c.name;
  $('collection-description').textContent = c.description || 'Simulado personalizável';
  $('delete-collection').disabled = store.collections.length <= 1;
}

function selectCollection(id) {
  if (!store.collections.some(c => c.id === id)) return;
  stopVoice();
  store.activeCollectionId = id;
  MODULES = activeCollection().questions;
  moduleIndex = 0;
  mode = 'full';
  persist();
  clearRun();
  renderLibrary();
  renderModules();
  renderContent();
  renderSources();
}

let editingCollection = false;
function openCollectionEditor(edit = false) {
  editingCollection = edit;
  const c = activeCollection();
  $('collection-modal-title').textContent = edit ? 'Editar simulado' : 'Criar simulado';
  $('collection-name').value = edit ? c.name : '';
  $('collection-desc').value = edit ? (c.description || '') : '';
  $('collection-modal').hidden = false;
  $('collection-name').focus();
}

function saveCollection() {
  const name = $('collection-name').value.trim();
  if (!name) {
    toast('Informe um nome para o simulado.');
    return;
  }
  const description = $('collection-desc').value.trim();
  if (editingCollection) {
    activeCollection().name = name;
    activeCollection().description = description;
    persist();
    renderLibrary();
  } else {
    const id = makeId();
    store.collections.push({ id, name, description, questions: [] });
    selectCollection(id);
  }
  $('collection-modal').hidden = true;
  toast(editingCollection ? 'Simulado renomeado.' : 'Novo simulado criado com sucesso.');
}

function deleteCollection() {
  if (store.collections.length <= 1) return;
  if (!confirm(`Excluir o simulado “${activeCollection().name}” e suas questões?`)) return;
  const id = store.activeCollectionId;
  store.collections = store.collections.filter(c => c.id !== id);
  for (const k of Object.keys(store.edits)) {
    if (k.startsWith(id + ':')) delete store.edits[k];
  }
  selectCollection(store.collections[0].id);
  toast('Simulado excluído do dispositivo.');
}

let editingQuestion = false;
const qFields = ['title', 'question', 'short', 'medium', 'full', 'idea', 'arguments', 'keywords', 'closing', 'followup', 'alert'];

function openQuestionEditor(edit = false) {
  editingQuestion = edit;
  const q = edit ? MODULES[moduleIndex] : null;
  if (edit && !q) return;
  $('question-modal-title').textContent = edit ? 'Editar questão e guia' : 'Nova questão';
  for (const name of qFields) {
    let v = '';
    if (q) {
      v = ['short', 'medium', 'full'].includes(name)
        ? currentText(moduleIndex, name)
        : name === 'arguments'
          ? (q.arguments || []).join('\n')
          : name === 'keywords'
            ? (q.keywords || []).join(', ')
            : q[name] || '';
    }
    $('q-' + name).value = v;
  }
  $('question-modal').hidden = false;
  $('q-title').focus();
}

function saveQuestion() {
  const title = $('q-title').value.trim(), question = $('q-question').value.trim();
  if (!title || !question) {
    toast('Informe o título e o enunciado da questão.');
    return;
  }
  const q = { id: editingQuestion ? MODULES[moduleIndex].id : makeId(), title, question };
  for (const name of ['short', 'medium', 'full', 'idea', 'closing', 'followup', 'alert']) {
    q[name] = $('q-' + name).value.trim();
  }
  q.arguments = $('q-arguments').value.split(/\n/).map(s => s.trim()).filter(Boolean);
  q.keywords = $('q-keywords').value.split(',').map(s => s.trim()).filter(Boolean);
  if (!q.full || !q.short || !q.medium) {
    toast('Preencha as três versões de resposta para ativar o teleprompter.');
    return;
  }

  if (editingQuestion) {
    const index = moduleIndex;
    MODULES[index] = q;
    for (const m of ['short', 'medium', 'full']) delete store.edits[editionKey(index, m)];
  } else {
    MODULES.push(q);
    moduleIndex = MODULES.length - 1;
  }

  $('question-modal').hidden = true;
  persist();
  clearRun();
  renderModules();
  renderContent();
  toast(editingQuestion ? 'Questão atualizada.' : 'Questão adicionada.');
}

function deleteQuestion() {
  if (!MODULES.length) return;
  if (!confirm(`Excluir a questão “${MODULES[moduleIndex].title}”?`)) return;
  for (const m of ['short', 'medium', 'full']) delete store.edits[editionKey(moduleIndex, m)];
  MODULES.splice(moduleIndex, 1);
  moduleIndex = Math.min(moduleIndex, Math.max(0, MODULES.length - 1));
  persist();
  clearRun();
  renderModules();
  renderContent();
  toast('Questão excluída.');
}

function printParagraphs(target, text) {
  String(text).split(/\n\s*\n/).forEach(line => {
    const p = document.createElement('p');
    p.textContent = line;
    target.append(p);
  });
}

function addPrintSection(parent, title, text) {
  const h = document.createElement('h3');
  h.textContent = title;
  parent.append(h);
  printParagraphs(parent, text);
}

function buildPrint() {
  const root = $('print-root');
  root.replaceChildren();
  const cover = document.createElement('div');
  cover.className = 'print-cover';
  cover.innerHTML = `<div class="cap">ORAL LAB · GUIA DE PROVA ORAL</div><h1>PROVAS<br><em>ORAIS</em></h1><p>${activeCollection().name}</p><footer>${MODULES.length} questões · Respostas completas e sintetizadas · Mapas mentais</footer>`;
  root.append(cover);

  const toc = document.createElement('section');
  toc.className = 'print-toc';
  toc.innerHTML = '<div class="print-header">Guia de preparação</div><h2>Sumário</h2>';
  const list = document.createElement('ol');
  MODULES.forEach(mod => {
    const li = document.createElement('li');
    li.textContent = mod.title;
    list.append(li);
  });
  toc.append(list);
  root.append(toc);

  MODULES.forEach((mod, i) => {
    const section = document.createElement('section');
    section.className = 'print-module';
    section.innerHTML = `<div class="print-header">QUESTÃO ${String(i + 1).padStart(2, '0')} / ${String(MODULES.length).padStart(2, '0')}</div><h2>${mod.title}</h2><p class="q">${mod.question}</p>`;
    addPrintSection(section, 'Resposta completa', currentText(i, 'full'));
    addPrintSection(section, 'Versão de 90 segundos', currentText(i, 'medium'));
    addPrintSection(section, 'Versão de 30 segundos', currentText(i, 'short'));
    root.append(section);
  });

  const refs = document.createElement('section');
  refs.className = 'print-sources';
  refs.innerHTML = '<div class="print-header">Fontes prioritárias e legislação</div><h2>Referências & orientações de treino</h2>';
  if (store.activeCollectionId === seedId) {
    SOURCES.forEach(source => {
      const p = document.createElement('p');
      p.textContent = `${source.name}. ${source.detail}`;
      refs.append(p);
    });
  }
  root.append(refs);
}

function exportPDF() {
  buildPrint();
  toast('Na janela de impressão, escolha “Salvar como PDF”.');
  setTimeout(() => window.print(), 120);
}

function renderSources() {
  const root = $('source-list');
  root.replaceChildren();
  if (store.activeCollectionId !== seedId) {
    root.textContent = 'Adicione suas fontes aos roteiros e confirme a validade de todas as informações antes do exame.';
    return;
  }
  SOURCES.forEach(s => {
    const div = document.createElement('div');
    div.className = 'source-row';
    const strong = document.createElement('strong');
    strong.textContent = s.name;
    div.append(strong, document.createTextNode(' — ' + s.detail));
    root.append(div);
  });
}

function setFont(s) {
  store.fontSize = Math.max(16, Math.min(32, s));
  persist();
  $('tele-content').style.fontSize = store.fontSize + 'px';
  $('font-size-label').textContent = store.fontSize + ' px';
}

// Inicialização e Efeito Parallax Suave no Fundo
function initParallax() {
  const layer1 = $('parallax-layer-1');
  const layer2 = $('parallax-layer-2');
  const layer3 = $('parallax-layer-3');
  if (!layer1 || !layer2 || !layer3) return;

  const handleMove = e => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const clientX = e.clientX || (e.touches && e.touches[0]?.clientX) || window.innerWidth / 2;
    const clientY = e.clientY || (e.touches && e.touches[0]?.clientY) || window.innerHeight / 2;
    const xPct = (clientX / window.innerWidth) - 0.5;
    const yPct = (clientY / window.innerHeight) - 0.5;

    // Camadas com diferentes profundidades e sem vibração
    layer1.style.transform = `translate3d(${xPct * 8}px, ${yPct * 8}px, 0)`;
    layer2.style.transform = `translate3d(${xPct * -14}px, ${yPct * -14}px, 0)`;
    layer3.style.transform = `translate3d(${xPct * 20}px, ${yPct * 20}px, 0)`;
  };

  window.addEventListener('mousemove', handleMove, { passive: true });
}

function bind() {
  document.querySelectorAll('[data-mode]').forEach(b => b.addEventListener('click', () => {
    const next = b.dataset.mode;
    if (next === mode) return;
    clearRun();
    mode = next;
    renderContent();
  }));

  $('font-down').onclick = () => setFont(store.fontSize - 2);
  $('font-up').onclick = () => setFont(store.fontSize + 2);
  $('memory-toggle').onchange = e => { memory = e.target.checked; renderContent(); };
  $('sound-toggle').onclick = toggleSound;

  $('edit-button').onclick = openEditor;
  $('editor-close').onclick = closeEditor;
  $('editor-cancel').onclick = closeEditor;
  $('editor-save').onclick = saveEditor;
  $('restore-version').onclick = restoreEditor;

  $('start-button').onclick = startVoice;
  $('pause-button').onclick = pauseVoice;
  $('resume-button').onclick = resumeVoice;
  $('finish-button').onclick = finishSession;
  $('restart-button').onclick = clearRun;
  $('next-button').onclick = () => MODULES.length ? selectModule((moduleIndex + 1) % MODULES.length) : toast('Adicione uma questão.');

  $('new-collection').onclick = () => openCollectionEditor(false);
  $('rename-collection').onclick = () => openCollectionEditor(true);
  $('delete-collection').onclick = deleteCollection;
  $('collection-select').onchange = e => selectCollection(e.target.value);

  $('new-question').onclick = () => openQuestionEditor(false);
  $('edit-question').onclick = () => openQuestionEditor(true);
  $('delete-question').onclick = deleteQuestion;

  $('collection-close').onclick = $('collection-cancel').onclick = () => $('collection-modal').hidden = true;
  $('collection-save').onclick = saveCollection;
  $('question-close').onclick = $('question-cancel').onclick = () => $('question-modal').hidden = true;
  $('question-save').onclick = saveQuestion;

  $('settings-toggle').onclick = () => { $('settings-modal').hidden = false; renderHistory(); };
  $('settings-close').onclick = () => $('settings-modal').hidden = true;

  $('score-close').onclick = () => $('score-modal').hidden = true;
  $('repeat-session-btn').onclick = () => { $('score-modal').hidden = true; clearRun(); };
  $('save-modal-session-btn').onclick = () => { saveSession(); $('score-modal').hidden = true; };

  $('voice-consent').onchange = e => $('privacy-accept').disabled = !e.target.checked;
  $('privacy-accept').onclick = () => {
    store.consent = true;
    persist();
    $('privacy-modal').hidden = true;
    beginVoice();
  };
  $('privacy-cancel').onclick = () => $('privacy-modal').hidden = true;

  $('analyze-manual').onclick = () => {
    pauseVoice();
    manualOverride = $('manual-transcript').value.trim();
    if (!manualOverride) {
      toast('Digite ou cole a transcrição primeiro.');
      return;
    }
    refreshTranscript();
    toast('Comparação manual concluída com pontuação.');
  };
  $('clear-transcript').onclick = clearRun;
  $('save-session').onclick = saveSession;

  $('export-json').onclick = exportJSON;
  $('import-json').onclick = () => $('import-file').click();
  $('import-file').onchange = e => { importJSON(e.target.files[0]); e.target.value = ''; };
  $('export-pdf').onclick = exportPDF;

  $('erase-data').onclick = () => {
    if (!confirm('Apagar todos os simulados, respostas editadas e histórico?')) return;
    store.collections = [makeSeed()];
    store.activeCollectionId = seedId;
    store.edits = {};
    store.history = [];
    MODULES = activeCollection().questions;
    moduleIndex = 0;
    persist();
    clearRun();
    renderLibrary();
    renderModules();
    renderContent();
    renderSources();
    renderHistory();
    toast('Simulado inicial restaurado.');
  };

  const modals = ['editor-modal', 'settings-modal', 'privacy-modal', 'collection-modal', 'question-modal', 'score-modal'];
  modals.forEach(name => {
    const el = $(name);
    if (el) el.addEventListener('click', e => { if (e.target === el) el.hidden = true; });
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      modals.forEach(name => { const el = $(name); if (el) el.hidden = true; });
    }
  });

  window.addEventListener('beforeprint', buildPrint);
  window.addEventListener('pagehide', stopVoice);
}

if (!persistent) $('storage-status').textContent = 'Armazenamento indisponível';
if (!voiceSupported) {
  $('speech-status').textContent = 'Reconhecimento não disponível neste navegador';
  $('manual-details').open = true;
}

renderLibrary();
renderModules();
renderContent();
renderHistory();
renderSources();
renderClock();
updateSoundButtonUI();
initParallax();
bind();

if ('serviceWorker' in navigator && location.protocol === 'https:') {
  navigator.serviceWorker.register('./service-worker.js').catch(() => {});
}
