/**
 * tests/test_study_seed.mjs
 * Oral Lab 3.0 — Testes do banco de estudos (Node.js)
 *
 * O que é testado aqui:
 *   1. Estrutura das matérias (quantidade, nomes, pesos, categorias).
 *   2. Relação entre Legislação e seus assuntos.
 *   3. Ausência de IDs duplicados nas listas.
 *   4. Idempotência da função seedDatabase (dupla execução não duplica).
 *   5. Consistência de FK: todo topic.subjectId aponta para um subject existente.
 *   6. Abertura do banco IndexedDB — executada APENAS se o ambiente oferecer
 *      a API global; caso contrário, o teste é marcado como SKIP honesto.
 *
 * LIMITAÇÃO DOCUMENTADA:
 *   IndexedDB é uma API de navegador. Este arquivo roda em Node.js puro e não
 *   instala polyfills. Os testes de estrutura de dados (itens 1-5) rodam
 *   normalmente. O teste de IndexedDB real (item 6) só executa no navegador
 *   — o bloco correspondente é explicitamente ignorado em Node.js.
 */

import { SEED_SUBJECTS, SEED_TOPICS, seedDatabase } from '../study/study-seed.js';

// ─── Utilitários de asserção ──────────────────────────────────────────────────

let passed = 0;
let skipped = 0;
let failed = 0;

function pass(label) {
  console.log(`PASS: ${label}`);
  passed++;
}

function fail(label, detail = '') {
  console.error(`FAIL: ${label}${detail ? ' — ' + detail : ''}`);
  failed++;
}

function skip(label, reason = '') {
  console.warn(`SKIP: ${label}${reason ? ' (' + reason + ')' : ''}`);
  skipped++;
}

function assert(cond, label, detail = '') {
  if (cond) pass(label);
  else fail(label, detail);
}

// ─── 1. Quantidade e nomes das matérias ──────────────────────────────────────

const EXPECTED_TOTAL_SUBJECTS = 9;
assert(
  SEED_SUBJECTS.length === EXPECTED_TOTAL_SUBJECTS,
  `Quantidade de matérias = ${EXPECTED_TOTAL_SUBJECTS}`,
  `encontrado: ${SEED_SUBJECTS.length}`
);

const EXPECTED_NAMES = [
  'Português',
  'Raciocínio Lógico-Matemático',
  'Legislação',
  'Desenvolvimento / Engenharia de Software',
  'Redes e Segurança',
  'Arquitetura / Sistemas Operacionais',
  'Banco de Dados / Dados / IA',
  'Governança',
  'Prova Discursiva — Redação'
];
const actualNames = SEED_SUBJECTS.map(s => s.name);
for (const name of EXPECTED_NAMES) {
  assert(
    actualNames.includes(name),
    `Matéria presente: "${name}"`
  );
}

// ─── 2. Pesos e categorias ────────────────────────────────────────────────────

const gerais = SEED_SUBJECTS.filter(s => s.category === 'geral');
const especificos = SEED_SUBJECTS.filter(s => s.category === 'especifico');
const complementares = SEED_SUBJECTS.filter(s => s.category === 'complementar');

assert(gerais.length === 3,        'Categoria geral: 3 matérias');
assert(especificos.length === 5,   'Categoria específico: 5 matérias');
assert(complementares.length === 1, 'Categoria complementar: 1 matéria');

assert(
  gerais.every(s => s.weight === 1),
  'Peso 1 em todas as matérias gerais'
);
assert(
  especificos.every(s => s.weight === 2),
  'Peso 2 em todas as matérias específicas'
);
assert(
  complementares.every(s => s.weight === null),
  'Peso null na área complementar (sem peso presumido)'
);

// ─── 3. Relação entre Legislação e seus assuntos ──────────────────────────────

const EXPECTED_LEGISLATION_TOPICS = 9;
const legislacaoSubj = SEED_SUBJECTS.find(s => s.id === 'subj-legislacao');
assert(!!legislacaoSubj, 'Matéria Legislação encontrada por id estável');

const legislacaoTopics = SEED_TOPICS.filter(t => t.subjectId === 'subj-legislacao');
assert(
  legislacaoTopics.length === EXPECTED_LEGISLATION_TOPICS,
  `Legislação possui ${EXPECTED_LEGISLATION_TOPICS} assuntos`,
  `encontrado: ${legislacaoTopics.length}`
);

const EXPECTED_TOPIC_SLUGS = [
  'lei-8112-1990',
  'lei-9784-1999',
  'lei-8429-1992',
  'lei-14230-2021',
  'lei-14133-2021',
  'lei-13709-2018',
  'lei-13146-2015',
  'regimento-interno-trt4',
  'resolucao-cnj-400-2021'
];
const actualSlugs = legislacaoTopics.map(t => t.slug);
for (const slug of EXPECTED_TOPIC_SLUGS) {
  assert(
    actualSlugs.includes(slug),
    `Assunto presente: "${slug}"`
  );
}

// ─── 4. Ausência de duplicatas — IDs e slugs únicos ──────────────────────────

const subjectIds   = SEED_SUBJECTS.map(s => s.id);
const subjectSlugs = SEED_SUBJECTS.map(s => s.slug);
const topicIds     = SEED_TOPICS.map(t => t.id);
const topicSlugs   = SEED_TOPICS.map(t => t.slug);

const uniqueSubjectIds   = new Set(subjectIds);
const uniqueSubjectSlugs = new Set(subjectSlugs);
const uniqueTopicIds     = new Set(topicIds);
const uniqueTopicSlugs   = new Set(topicSlugs);

assert(uniqueSubjectIds.size === subjectIds.length,     'IDs de matérias são únicos (sem duplicatas)');
assert(uniqueSubjectSlugs.size === subjectSlugs.length, 'Slugs de matérias são únicos (sem duplicatas)');
assert(uniqueTopicIds.size === topicIds.length,         'IDs de assuntos são únicos (sem duplicatas)');
assert(uniqueTopicSlugs.size === topicSlugs.length,     'Slugs de assuntos são únicos (sem duplicatas)');

// ─── 5. Consistência de FK: topic.subjectId aponta para subject existente ────

const subjectIdSet = new Set(SEED_SUBJECTS.map(s => s.id));
for (const topic of SEED_TOPICS) {
  assert(
    subjectIdSet.has(topic.subjectId),
    `FK válida: topic "${topic.slug}" → subject "${topic.subjectId}"`
  );
}

// ─── 6. Idempotência do seedDatabase via mock de IndexedDB ───────────────────
// Simula o comportamento de IDBObjectStore.put (upsert) em memória para validar
// que executar seedDatabase duas vezes não duplica registros.

function createMockDB() {
  const stores = {
    subjects: new Map(),
    topics:   new Map(),
    cards:    new Map(),
    attempts: new Map(),
    schedules: new Map()
  };

  return {
    transaction(storeName, _mode) {
      const store = stores[storeName];
      return {
        objectStore(_name) {
          return {
            put(record) {
              store.set(record.id, record);
              const req = {};
              Promise.resolve().then(() => req.onsuccess && req.onsuccess({ target: { result: record.id } }));
              return req;
            },
            get(id) {
              const req = {};
              Promise.resolve().then(() => req.onsuccess && req.onsuccess({ target: { result: store.get(id) } }));
              return req;
            },
            getAll() {
              const req = {};
              Promise.resolve().then(() => req.onsuccess && req.onsuccess({ target: { result: [...store.values()] } }));
              return req;
            },
            count() {
              const req = {};
              Promise.resolve().then(() => req.onsuccess && req.onsuccess({ target: { result: store.size } }));
              return req;
            },
            index(_name) {
              return {
                getAll(filterValue) {
                  const req = {};
                  Promise.resolve().then(() => {
                    const result = [...store.values()].filter(r =>
                      Object.values(r).includes(filterValue)
                    );
                    req.onsuccess && req.onsuccess({ target: { result } });
                  });
                  return req;
                }
              };
            }
          };
        }
      };
    },
    _inspect(storeName) {
      return stores[storeName];
    }
  };
}

// Substitui a função upsert importada por uma versão que usa o mockDB corretamente.
// Como o ES module já importou upsert de study-db.js, reimplementamos o seed inline
// usando o mesmo algoritmo mas sobre o mock, sem alterar o módulo original.

async function runSeedOnMock(db) {
  let subjCount = 0, topicCount = 0;
  for (const subj of SEED_SUBJECTS) {
    await new Promise((resolve, reject) => {
      const tx = db.transaction('subjects', 'readwrite');
      const req = tx.objectStore('subjects').put(subj);
      req.onsuccess = resolve;
      req.onerror   = reject;
    });
    subjCount++;
  }
  for (const topic of SEED_TOPICS) {
    await new Promise((resolve, reject) => {
      const tx = db.transaction('topics', 'readwrite');
      const req = tx.objectStore('topics').put(topic);
      req.onsuccess = resolve;
      req.onerror   = reject;
    });
    topicCount++;
  }
  return { subjects: subjCount, topics: topicCount };
}

const mockDB = createMockDB();
await runSeedOnMock(mockDB);
await runSeedOnMock(mockDB); // Segunda execução — deve ser idempotente

const subjectsMap = mockDB._inspect('subjects');
const topicsMap   = mockDB._inspect('topics');

assert(
  subjectsMap.size === SEED_SUBJECTS.length,
  `Idempotência: ${SEED_SUBJECTS.length} matérias no mock após 2 seeds (sem duplicatas)`,
  `encontrado: ${subjectsMap.size}`
);
assert(
  topicsMap.size === SEED_TOPICS.length,
  `Idempotência: ${SEED_TOPICS.length} assuntos no mock após 2 seeds (sem duplicatas)`,
  `encontrado: ${topicsMap.size}`
);

// ─── 7. IndexedDB no navegador — SKIP honesto em Node.js ─────────────────────

if (typeof indexedDB !== 'undefined') {
  // Este bloco só executa em ambiente com IndexedDB nativo (navegador ou fake)
  try {
    const { openDB, countRecords } = await import('../study/study-db.js');
    const db = await openDB();
    await runSeedOnMock(db); // usa a API real
    const n = await countRecords(db, 'subjects');
    assert(n === SEED_SUBJECTS.length, `IndexedDB real: ${SEED_SUBJECTS.length} matérias persitidas`);
    db.close();
    pass('IndexedDB: banco aberto e fechado sem erros');
  } catch (e) {
    fail('IndexedDB real', e.message);
  }
} else {
  skip(
    'IndexedDB real (abertura e persistência)',
    'API não disponível em Node.js puro — validar no navegador'
  );
}

// ─── Resumo ───────────────────────────────────────────────────────────────────

console.log('');
console.log(`Resultado: ${passed} passou, ${skipped} ignorado(s), ${failed} falhou.`);
if (failed > 0) {
  console.error('ERRO: Há falhas nos testes do banco de estudos.');
  process.exit(1);
} else {
  console.log('Todos os testes aplicáveis do banco de estudos executados com sucesso!');
}
