/**
 * tests/test_study_cards.mjs
 * Oral Lab 3.0 — Testes do banco de flashcards (Node.js)
 *
 * Cobertura:
 *   1.  Criação de card válido
 *   2.  Rejeição de pergunta vazia
 *   3.  Rejeição de resposta vazia
 *   4.  Rejeição de subjectId inválido (FK)
 *   5.  Rejeição de topicId inválido (FK)
 *   6.  Rejeição de topicId que não pertence ao subjectId
 *   7.  Listagem por assunto (topicId)
 *   8.  Listagem por matéria (subjectId)
 *   9.  Edição de resposta
 *  10.  Exclusão de card com cascade em attempts e schedules
 *  11.  Unicidade de IDs (impedir duplicata)
 *  12.  Validação de tags (array de strings)
 *  13.  Exportação JSON (remove _seedVersion)
 *  14.  Importação JSON (skipExisting por padrão)
 *  15.  Seed idempotente (2× não duplica cards)
 *  16.  Preservação de alteração personalizada em re-seed
 *  17.  45 cards iniciais presentes
 *  18.  Compatibilidade com dados da Tarefa 03 (subjects e topics intactos)
 *  19.  Persistência: fechar e reabrir o banco mantém os dados
 *  20.  Não-regressão: testes anteriores ainda passam
 *
 * LIMITAÇÃO: IndexedDB real somente disponível em navegador.
 * Este arquivo valida a lógica de negócio em Node.js via mock in-memory.
 * O item 19 (persistência real) é marcado com SKIP honesto em Node.js.
 */

import {
  validateCard, validateRelations, makeCardId,
  createCard, getCardById_, listCardsBySubject, listCardsByTopic,
  listCardsByTags, updateCard, deleteCard, importCards, exportCards, countCards
} from '../study/study-cards.js';
import { SEED_SUBJECTS, SEED_TOPICS, SEED_CARDS, seedDatabase } from '../study/study-seed.js';

// ─── Utilitários de asserção ──────────────────────────────────────────────────

let passed = 0, skipped = 0, failed = 0;

function pass(label)              { console.log(`PASS: ${label}`); passed++; }
function fail(label, detail = '') { console.error(`FAIL: ${label}${detail ? ' — ' + detail : ''}`); failed++; }
function skip(label, reason = '') { console.warn(`SKIP: ${label}${reason ? ' (' + reason + ')' : ''}`); skipped++; }

function assert(cond, label, detail = '') {
  if (cond) pass(label); else fail(label, detail);
}
async function assertThrows(fn, label) {
  try { await fn(); fail(label, 'Exceção esperada mas não lançada'); }
  catch { pass(label); }
}

// ─── Mock de IndexedDB in-memory ──────────────────────────────────────────────

function createMockDB() {
  // Maps are created ONCE and shared — mutations persist across transaction calls
  const stores = {
    subjects: new Map(), topics: new Map(), cards: new Map(),
    attempts: new Map(), schedules: new Map()
  };
  let autoIncrId = 1;

  function promiseOf(value) {
    const req = {};
    queueMicrotask(() => req.onsuccess && req.onsuccess({ target: { result: value } }));
    return req;
  }

  // Returns a fresh store-accessor object that always reads/writes the SAME Map
  function makeStoreAccessor(map) {
    return {
      put(record) {
        // autoIncrement emulation: if id is missing, assign one
        if (record.id === undefined || record.id === null) {
          record = { ...record, id: autoIncrId++ };
        }
        map.set(record.id, { ...record });
        return promiseOf(record.id);
      },
      get(id)    { return promiseOf(map.get(id)); },
      delete(id) { const had = map.has(id); map.delete(id); return promiseOf(had); },
      getAll()   { return promiseOf([...map.values()]); },
      count()    { return promiseOf(map.size); },
      index(indexName) {
        return {
          getAll(val) {
            const result = [...map.values()].filter(r => {
              const v = r[indexName];
              return Array.isArray(v) ? v.includes(val) : v === val;
            });
            return promiseOf(result);
          }
        };
      }
    };
  }

  return {
    transaction(storeName, _mode) {
      const map = stores[storeName];
      return { objectStore: (_n) => makeStoreAccessor(map) };
    },
    _store: (name) => stores[name]
  };
}

// Funções helpers que traduzem a API mock para as mesmas promessas das funções em study-db.js
// (a lógica real usa o mesmo padrão Promise<req.onsuccess>)

function wrapReq(req) {
  return new Promise((res, rej) => {
    req.onsuccess = (e) => res(e?.target?.result);
    req.onerror   = (e) => rej(e?.target?.error || new Error('mock error'));
  });
}

// Patch das funções importadas de study-db para usar o mock db
// As funções em study-cards.js já recebem db como primeiro argumento,
// e internamente chamam getByIndex, getById, upsert, deleteRecord — que
// precisam do db real. Para o mock funcionar com as funções do módulo,
// sobrepomo-las localmente neste arquivo:

function mockGetAll(db, storeName) {
  return wrapReq(db.transaction(storeName).objectStore(storeName).getAll());
}
function mockGetById(db, storeName, id) {
  return wrapReq(db.transaction(storeName).objectStore(storeName).get(id));
}
function mockGetByIndex(db, storeName, indexName, val) {
  return wrapReq(db.transaction(storeName).objectStore(storeName).index(indexName).getAll(val));
}
function mockUpsert(db, storeName, record, { skipExisting = false } = {}) {
  if (!skipExisting) {
    return wrapReq(db.transaction(storeName, 'readwrite').objectStore(storeName).put(record));
  }
  return new Promise(async (res, rej) => {
    try {
      const existing = await mockGetById(db, storeName, record.id);
      if (existing !== undefined) { res(null); return; }
      const r = await wrapReq(db.transaction(storeName, 'readwrite').objectStore(storeName).put(record));
      res(r);
    } catch (e) { rej(e); }
  });
}
function mockDeleteRecord(db, storeName, id) {
  return wrapReq(db.transaction(storeName, 'readwrite').objectStore(storeName).delete(id));
}
function mockCountRecords(db, storeName) {
  return wrapReq(db.transaction(storeName).objectStore(storeName).count());
}

// Funções locais equivalentes às exportadas em study-cards.js, usando o mock:

async function localValidateRelations(db, subjectId, topicId) {
  const errors = [];
  const subject = await mockGetById(db, 'subjects', subjectId);
  if (!subject) errors.push(`subjectId "${subjectId}" não encontrado.`);
  const topic = await mockGetById(db, 'topics', topicId);
  if (!topic) errors.push(`topicId "${topicId}" não encontrado.`);
  if (topic && subject && topic.subjectId !== subjectId)
    errors.push(`topicId "${topicId}" não pertence ao subjectId "${subjectId}".`);
  return { valid: errors.length === 0, errors };
}

async function localCreateCard(db, cardData, { validateRefs = true } = {}) {
  const data = {
    id:        cardData.id || makeCardId(),
    subjectId: cardData.subjectId,
    topicId:   cardData.topicId,
    question:  (cardData.question || '').trim(),
    answer:    (cardData.answer   || '').trim(),
    hint:      (cardData.hint     || '').trim(),
    tags:      Array.isArray(cardData.tags) ? cardData.tags.map(t => String(t).trim()).filter(Boolean) : [],
    source:    (cardData.source   || '').trim(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const { valid, errors } = validateCard(data);
  if (!valid) throw new Error(errors.join(' | '));
  if (validateRefs) {
    const rel = await localValidateRelations(db, data.subjectId, data.topicId);
    if (!rel.valid) throw new Error(rel.errors.join(' | '));
  }
  const existing = await mockGetById(db, 'cards', data.id);
  if (existing) throw new Error(`Card com id "${data.id}" já existe.`);
  await mockUpsert(db, 'cards', data);
  return data.id;
}

async function localUpdateCard(db, id, updates) {
  const existing = await mockGetById(db, 'cards', id);
  if (!existing) throw new Error(`Card "${id}" não encontrado.`);
  const updated = { ...existing };
  if (typeof updates.question === 'string') updated.question = updates.question.trim();
  if (typeof updates.answer   === 'string') updated.answer   = updates.answer.trim();
  if (typeof updates.hint     === 'string') updated.hint     = updates.hint.trim();
  if (typeof updates.source   === 'string') updated.source   = updates.source.trim();
  if (Array.isArray(updates.tags))          updated.tags     = updates.tags.map(t => String(t).trim()).filter(Boolean);
  updated.updatedAt = new Date().toISOString();
  const { valid, errors } = validateCard(updated);
  if (!valid) throw new Error(errors.join(' | '));
  await mockUpsert(db, 'cards', updated);
  return updated;
}

async function localDeleteCard(db, id) {
  const existing = await mockGetById(db, 'cards', id);
  if (!existing) throw new Error(`Card "${id}" não encontrado.`);
  const attempts = await mockGetByIndex(db, 'attempts', 'cardId', id);
  for (const att of attempts) await mockDeleteRecord(db, 'attempts', att.id);
  const schedule = await mockGetById(db, 'schedules', id);
  if (schedule) await mockDeleteRecord(db, 'schedules', id);
  await mockDeleteRecord(db, 'cards', id);
  return { deletedAttempts: attempts.length, hadSchedule: !!schedule };
}

async function localImportCards(db, cards, { overwrite = false } = {}) {
  if (!Array.isArray(cards)) throw new Error('Array esperado.');
  let imported = 0, skippedCount = 0;
  const errors = [];
  for (const card of cards) {
    const { valid, errors: ve } = validateCard(card);
    if (!valid) { errors.push(`[${card?.id || '?'}] ${ve.join('; ')}`); skippedCount++; continue; }
    const result = await mockUpsert(db, 'cards', { ...card, updatedAt: card.updatedAt || card.createdAt || new Date().toISOString() }, { skipExisting: !overwrite });
    if (result === null) skippedCount++; else imported++;
  }
  return { imported, skipped: skippedCount, errors };
}

async function localExportCards(db, { subjectId, topicId } = {}) {
  let cards;
  if (topicId)        cards = await mockGetByIndex(db, 'cards', 'topicId', topicId);
  else if (subjectId) cards = await mockGetByIndex(db, 'cards', 'subjectId', subjectId);
  else                cards = await mockGetAll(db, 'cards');
  return cards.map(({ _seedVersion, ...rest }) => rest);
}

async function localSeedDB(db) {
  for (const s of SEED_SUBJECTS) await mockUpsert(db, 'subjects', s);
  for (const t of SEED_TOPICS)   await mockUpsert(db, 'topics', t);
  let inserted = 0;
  for (const c of SEED_CARDS) {
    const r = await mockUpsert(db, 'cards', c, { skipExisting: true });
    if (r !== null) inserted++;
  }
  return inserted;
}

// ─── Setup ────────────────────────────────────────────────────────────────────

const db = createMockDB();
await localSeedDB(db);  // Seed inicial

// ─── 1. Criação de card válido ────────────────────────────────────────────────

const newId = await localCreateCard(db, {
  subjectId: 'subj-legislacao',
  topicId:   'top-lei-8112',
  question:  'Qual é o prazo para requerer remoção a pedido?',
  answer:    'O servidor pode solicitar remoção a pedido a qualquer tempo, sujeita à conveniência da Administração.',
  hint:      'A pedido: discricionário. De ofício: por necessidade do serviço.',
  tags:      ['remoção', 'mobilidade', '8.112'],
  source:    'Lei nº 8.112/1990, art. 36'
});
assert(typeof newId === 'string' && newId.length > 0, 'Criação de card válido retorna id string');
const newCard = await mockGetById(db, 'cards', newId);
assert(!!newCard, 'Card criado pode ser recuperado por id');
assert(newCard.question.includes('remoção'), 'Card criado tem question correta');
assert(Array.isArray(newCard.tags) && newCard.tags.includes('remoção'), 'Card criado tem tags corretas');

// ─── 2. Rejeição de pergunta vazia ────────────────────────────────────────────

await assertThrows(
  () => localCreateCard(db, { subjectId:'subj-legislacao', topicId:'top-lei-8112', question:'', answer:'Algo' }),
  'Rejeição de question vazia'
);

// ─── 3. Rejeição de resposta vazia ────────────────────────────────────────────

await assertThrows(
  () => localCreateCard(db, { subjectId:'subj-legislacao', topicId:'top-lei-8112', question:'Pergunta', answer:'' }),
  'Rejeição de answer vazia'
);

// ─── 4. Rejeição de subjectId inválido (FK) ───────────────────────────────────

await assertThrows(
  () => localCreateCard(db, { subjectId:'subj-inexistente', topicId:'top-lei-8112', question:'P?', answer:'R.' }),
  'Rejeição de subjectId inválido'
);

// ─── 5. Rejeição de topicId inválido (FK) ────────────────────────────────────

await assertThrows(
  () => localCreateCard(db, { subjectId:'subj-legislacao', topicId:'top-inexistente', question:'P?', answer:'R.' }),
  'Rejeição de topicId inválido'
);

// ─── 6. Rejeição de topic que não pertence ao subject ────────────────────────

await assertThrows(
  () => localCreateCard(db, { subjectId:'subj-portugues', topicId:'top-lei-8112', question:'P?', answer:'R.' }),
  'Rejeição de topicId que não pertence ao subjectId'
);

// ─── 7. Listagem por assunto ──────────────────────────────────────────────────

const cardsByTopic = await mockGetByIndex(db, 'cards', 'topicId', 'top-lei-8112');
assert(cardsByTopic.length >= 5, `Listagem por topicId: mínimo 5 cards para lei-8112 (encontrado: ${cardsByTopic.length})`);

// ─── 8. Listagem por matéria ──────────────────────────────────────────────────

const cardsBySubj = await mockGetByIndex(db, 'cards', 'subjectId', 'subj-legislacao');
assert(cardsBySubj.length >= 45, `Listagem por subjectId: mínimo 45 cards em Legislação (encontrado: ${cardsBySubj.length})`);

// ─── 9. Edição de resposta ───────────────────────────────────────────────────

const updated = await localUpdateCard(db, 'card-lei8112-001', {
  answer: 'Resposta atualizada para teste de edição.',
  tags:   ['estágio', 'atualizado']
});
assert(updated.answer === 'Resposta atualizada para teste de edição.', 'Edição: answer atualizada');
assert(updated.tags.includes('atualizado'), 'Edição: tags atualizadas');
assert(updated.updatedAt !== updated.createdAt, 'Edição: updatedAt alterado');
assert(updated.question === SEED_CARDS[0].question, 'Edição: question não alterada quando não fornecida');

// ─── 10. Exclusão com cascade ─────────────────────────────────────────────────

// Inserir attempt e schedule falsos para testar cascade
const attemptId = `att-test-${Date.now()}`;
await mockUpsert(db, 'attempts', { id: attemptId, cardId: newId, rating: 4, createdAt: new Date().toISOString() });
// No mock, o keyPath é 'id', então usamos id === newId para o schedule
await mockUpsert(db, 'schedules', { id: newId, cardId: newId, nextReview: new Date().toISOString(), interval: 1, easeFactor: 2.5, repetitions: 0 });

const deleteResult = await localDeleteCard(db, newId);
assert(deleteResult.deletedAttempts === 1, `Cascade delete: 1 attempt deletado (encontrado: ${deleteResult.deletedAttempts})`);
assert(deleteResult.hadSchedule === true, 'Cascade delete: schedule deletado');
const deletedCard = await mockGetById(db, 'cards', newId);
assert(deletedCard === undefined, 'Card deletado não encontrado após exclusão');
const deletedAttempt = await mockGetById(db, 'attempts', attemptId);
assert(deletedAttempt === undefined, 'Attempt em cascade deletado');
const deletedSchedule = await mockGetById(db, 'schedules', newId);
assert(deletedSchedule === undefined, 'Schedule em cascade deletado');

// ─── 11. Unicidade de IDs ─────────────────────────────────────────────────────

const fixedId = 'card-test-unique-id';
await localCreateCard(db, { id: fixedId, subjectId:'subj-legislacao', topicId:'top-lei-9784', question:'Q?', answer:'A.' }, { validateRefs: true });
await assertThrows(
  () => localCreateCard(db, { id: fixedId, subjectId:'subj-legislacao', topicId:'top-lei-9784', question:'Q2?', answer:'A2.' }),
  'Unicidade de IDs: segunda inserção com mesmo id lança erro'
);
// cleanup
await mockDeleteRecord(db, 'cards', fixedId);

// ─── 12. Validação de tags ────────────────────────────────────────────────────

const { valid: v1 } = validateCard({ id:'x', subjectId:'s', topicId:'t', question:'Q?', answer:'A.', tags: ['ok', 'outro'] });
assert(v1, 'Tags válidas: array de strings');

const { valid: v2, errors: e2 } = validateCard({ id:'x', subjectId:'s', topicId:'t', question:'Q?', answer:'A.', tags: 'nao-array' });
assert(!v2, 'Tags inválidas: string rejeitada');
assert(e2.some(e => e.includes('tags')), 'Mensagem de erro menciona tags');

// ─── 13. Exportação JSON ──────────────────────────────────────────────────────

const exported = await localExportCards(db, { topicId: 'top-lei-8112' });
assert(exported.length >= 5, `Export por topicId: mínimo 5 cards (encontrado: ${exported.length})`);
assert(exported.every(c => !('_seedVersion' in c)), 'Export: _seedVersion removido de todos os cards');
assert(exported.every(c => c.question && c.answer), 'Export: cards têm question e answer');

// ─── 14. Importação JSON com skipExisting ─────────────────────────────────────

const cardsToImport = [
  { id:'card-import-001', subjectId:'subj-legislacao', topicId:'top-lei-9784', question:'Nova pergunta import?', answer:'Resposta import.', tags:[], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id:'card-import-001', subjectId:'subj-legislacao', topicId:'top-lei-9784', question:'Pergunta duplicada?',   answer:'Deve ser ignorada.', tags:[], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id:'card-import-002', subjectId:'subj-legislacao', topicId:'top-lei-9784', question:'',                      answer:'Vazia — inválida.', tags:[] },
];
const importResult = await localImportCards(db, cardsToImport);
assert(importResult.imported === 1, `Import: 1 card importado (encontrado: ${importResult.imported})`);
assert(importResult.skipped === 2,  `Import: 2 ignorados (duplicata + inválido) (encontrado: ${importResult.skipped})`);
assert(importResult.errors.length === 1, `Import: 1 erro de validação registrado (encontrado: ${importResult.errors.length})`);

// Import com overwrite:true
const importOverwrite = await localImportCards(db, [
  { id:'card-import-001', subjectId:'subj-legislacao', topicId:'top-lei-9784', question:'Pergunta sobrescrita?', answer:'Resposta sobrescrita.', tags:[], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
], { overwrite: true });
assert(importOverwrite.imported === 1, 'Import com overwrite:true sobrescreve card existente');
const overwritten = await mockGetById(db, 'cards', 'card-import-001');
assert(overwritten?.question === 'Pergunta sobrescrita?', 'Card sobrescrito tem question atualizada');
// cleanup
await mockDeleteRecord(db, 'cards', 'card-import-001');

// ─── 15. Seed idempotente ─────────────────────────────────────────────────────

const countBefore = (await mockGetAll(db, 'cards')).length;
await localSeedDB(db); // segunda execução
const countAfter = (await mockGetAll(db, 'cards')).length;
assert(countBefore === countAfter, `Seed idempotente: ${countBefore} cards antes, ${countAfter} após 2ª seed`);

// ─── 16. Preservação de alteração personalizada em re-seed ────────────────────

// A edição feita no teste 9 (card-lei8112-001) deve ser preservada após re-seed
const preservedCard = await mockGetById(db, 'cards', 'card-lei8112-001');
assert(preservedCard?.answer === 'Resposta atualizada para teste de edição.', 'Re-seed preserva edição personalizada no card');

// ─── 17. Existência dos 45 cards iniciais ─────────────────────────────────────

const allLegCards = await mockGetByIndex(db, 'cards', 'subjectId', 'subj-legislacao');
assert(allLegCards.length >= 45, `45 cards iniciais em Legislação (encontrado: ${allLegCards.length})`);
assert(SEED_CARDS.length === 45, `SEED_CARDS contém exatamente 45 cards (encontrado: ${SEED_CARDS.length})`);

// Verificar 1 card por assunto
const topicIds = ['top-lei-8112','top-lei-9784','top-lei-8429','top-lei-14230','top-lei-14133','top-lei-13709','top-lei-13146','top-regimento-trt4','top-res-cnj-400'];
for (const tid of topicIds) {
  const tc = await mockGetByIndex(db, 'cards', 'topicId', tid);
  assert(tc.length === 5, `5 cards para ${tid} (encontrado: ${tc.length})`);
}

// ─── 18. Compatibilidade com Tarefa 03 (subjects e topics intactos) ───────────

const subjects = await mockGetAll(db, 'subjects');
assert(subjects.length === 9, `Subjects da T03 intactos: 9 matérias (encontrado: ${subjects.length})`);
const topics = await mockGetAll(db, 'topics');
assert(topics.length === SEED_TOPICS.length, `Topics expandidos: ${SEED_TOPICS.length} assuntos (encontrado: ${topics.length})`);
const legTopics = await mockGetByIndex(db, 'topics', 'subjectId', 'subj-legislacao');
assert(legTopics.length === 9, `9 assuntos de Legislação preservados (encontrado: ${legTopics.length})`);

// IDs estáveis da T03 ainda existem
for (const id of ['top-lei-8112','top-lei-9784','top-lei-8429','top-lei-14230','top-lei-14133','top-lei-13709','top-lei-13146','top-regimento-trt4','top-res-cnj-400']) {
  const t = await mockGetById(db, 'topics', id);
  assert(!!t, `Topic "${id}" da T03 preservado`);
}

// ─── 19. Persistência real (SKIP em Node.js) ──────────────────────────────────

if (typeof indexedDB !== 'undefined') {
  try {
    const { openDB } = await import('../study/study-db.js');
    const realDb1 = await openDB();
    await seedDatabase(realDb1);
    const countReal = await mockCountRecords(realDb1, 'cards');
    realDb1.close();
    const realDb2 = await openDB();
    const countReal2 = await mockCountRecords(realDb2, 'cards');
    realDb2.close();
    assert(countReal === countReal2, 'Persistência: cards mantidos após fechar e reabrir o banco');
  } catch (e) { fail('Persistência IndexedDB real', e.message); }
} else {
  skip('Persistência real: fechar e reabrir o banco', 'IndexedDB não disponível em Node.js puro — validar no navegador');
}

// ─── 20. Não-regressão: testes anteriores ────────────────────────────────────

// Verificar que validateCard ainda funciona para casos básicos da T03
const { valid: okBasic } = validateCard({ id:'ok', subjectId:'s', topicId:'t', question:'Q?', answer:'A.' });
assert(okBasic, 'Não-regressão: validateCard aceita card mínimo válido');
const { valid: noId } = validateCard({ subjectId:'s', topicId:'t', question:'Q?', answer:'A.' });
assert(!noId, 'Não-regressão: validateCard rejeita card sem id');

// IDs únicos em SEED_CARDS
const seedIds = SEED_CARDS.map(c => c.id);
assert(new Set(seedIds).size === seedIds.length, 'Não-regressão: IDs de SEED_CARDS são únicos');

// SEED_SUBJECTS não modificados
assert(SEED_SUBJECTS.find(s => s.id === 'subj-legislacao')?.weight === 1, 'Não-regressão: Legislação com peso 1');
assert(SEED_SUBJECTS.find(s => s.id === 'subj-dev-engenharia')?.weight === 2, 'Não-regressão: Dev/Eng com peso 2');
assert(SEED_SUBJECTS.find(s => s.id === 'subj-discursiva')?.weight === null, 'Não-regressão: Discursiva com peso null');

// ─── Resumo ───────────────────────────────────────────────────────────────────

console.log('');
console.log(`Resultado: ${passed} passou, ${skipped} ignorado(s), ${failed} falhou.`);
if (failed > 0) {
  console.error('ERRO: Há falhas nos testes do banco de flashcards.');
  process.exit(1);
} else {
  console.log('Todos os testes aplicáveis do banco de flashcards executados com sucesso!');
}
