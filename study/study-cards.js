/**
 * study/study-cards.js
 * Oral Lab 3.0 — Active Recall (Tarefa 04)
 *
 * CRUD completo de flashcards sobre o IndexedDB.
 *
 * Política de integridade referencial ao excluir um card:
 *   CASCADE — deleta automaticamente todos os registros de 'attempts'
 *   e o registro de 'schedules' associados ao card excluído.
 *   Subjects e topics NÃO são afetados pela exclusão de cards.
 *
 * Proteção de edições personalizadas:
 *   - importCards usa skipExisting:true por padrão para não sobrescrever
 *     cards já existentes (sejam eles do seed ou criados pelo usuário).
 *   - Para forçar atualização, passe { overwrite: true }.
 *
 * Preparação para revisão espaçada (Tarefa 05):
 *   - O store 'schedules' usa cardId como keyPath.
 *   - O store 'attempts' usa autoIncrement com índice em cardId.
 *   - Dados mínimos de entrada para SM-2 documentados em
 *     docs/ACTIVE_RECALL_STATUS.md (seção "Contrato de Dados — Tarefa 05").
 */

import { getAll, getById, getByIndex, upsert, deleteRecord, countRecords } from './study-db.js';

// ─── Validação ────────────────────────────────────────────────────────────────

/**
 * Valida os campos obrigatórios de um card.
 * @param {object} data
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateCard(data) {
  const errors = [];

  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['Dados do card ausentes ou inválidos.'] };
  }
  if (!data.id || typeof data.id !== 'string' || !data.id.trim()) {
    errors.push('Campo obrigatório: id (string não vazia).');
  }
  if (!data.subjectId || typeof data.subjectId !== 'string' || !data.subjectId.trim()) {
    errors.push('Campo obrigatório: subjectId (string não vazia).');
  }
  if (!data.topicId || typeof data.topicId !== 'string' || !data.topicId.trim()) {
    errors.push('Campo obrigatório: topicId (string não vazia).');
  }
  if (!data.question || typeof data.question !== 'string' || !data.question.trim()) {
    errors.push('Campo obrigatório: question (string não vazia).');
  }
  if (!data.answer || typeof data.answer !== 'string' || !data.answer.trim()) {
    errors.push('Campo obrigatório: answer (string não vazia).');
  }
  if (data.tags !== undefined) {
    if (!Array.isArray(data.tags)) {
      errors.push('Campo tags deve ser um array, se fornecido.');
    } else if (!data.tags.every(t => typeof t === 'string')) {
      errors.push('Todos os itens de tags devem ser strings.');
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Verifica se subjectId e topicId existem no banco.
 * @param {IDBDatabase} db
 * @param {string} subjectId
 * @param {string} topicId
 * @returns {Promise<{ valid: boolean, errors: string[] }>}
 */
export async function validateRelations(db, subjectId, topicId) {
  const errors = [];
  const subject = await getById(db, 'subjects', subjectId);
  if (!subject) errors.push(`subjectId "${subjectId}" não encontrado em subjects.`);

  const topic = await getById(db, 'topics', topicId);
  if (!topic) errors.push(`topicId "${topicId}" não encontrado em topics.`);

  if (topic && subject && topic.subjectId !== subjectId) {
    errors.push(`topicId "${topicId}" não pertence ao subjectId "${subjectId}".`);
  }

  return { valid: errors.length === 0, errors };
}

// ─── Geração de ID ────────────────────────────────────────────────────────────

/** Gera um id estável baseado em timestamp + random. */
export function makeCardId() {
  return `card-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

// ─── CRUD ─────────────────────────────────────────────────────────────────────

/**
 * Cria um novo flashcard.
 * Lança erro se validação falhar ou se id já existir.
 *
 * @param {IDBDatabase} db
 * @param {object} cardData  — campos: id?, subjectId, topicId, question, answer, hint?, tags?, source?
 * @param {{ validateRefs?: boolean }} opts
 * @returns {Promise<string>}  id do card criado
 */
export async function createCard(db, cardData, { validateRefs = true } = {}) {
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
  if (!valid) throw new Error(`Card inválido: ${errors.join(' | ')}`);

  if (validateRefs) {
    const rel = await validateRelations(db, data.subjectId, data.topicId);
    if (!rel.valid) throw new Error(`Relacionamentos inválidos: ${rel.errors.join(' | ')}`);
  }

  // Impede duplicação de ID
  const existing = await getById(db, 'cards', data.id);
  if (existing) throw new Error(`Card com id "${data.id}" já existe.`);

  await upsert(db, 'cards', data);
  return data.id;
}

/**
 * Retorna um card pelo id.
 * @param {IDBDatabase} db
 * @param {string} id
 * @returns {Promise<object|undefined>}
 */
export const getCardById_ = (db, id) => getById(db, 'cards', id);

/**
 * Lista todos os cards de uma matéria.
 * @param {IDBDatabase} db
 * @param {string} subjectId
 * @returns {Promise<object[]>}
 */
export const listCardsBySubject = (db, subjectId) =>
  getByIndex(db, 'cards', 'subjectId', subjectId);

/**
 * Lista todos os cards de um assunto.
 * @param {IDBDatabase} db
 * @param {string} topicId
 * @returns {Promise<object[]>}
 */
export const listCardsByTopic = (db, topicId) =>
  getByIndex(db, 'cards', 'topicId', topicId);

/**
 * Filtra cards que contenham TODAS as tags fornecidas.
 * Busca via índice multiEntry para a primeira tag e filtra o restante em memória.
 *
 * @param {IDBDatabase} db
 * @param {string[]} tags
 * @returns {Promise<object[]>}
 */
export async function listCardsByTags(db, tags) {
  if (!Array.isArray(tags) || tags.length === 0) return getAll(db, 'cards');
  const [first, ...rest] = tags.map(t => t.trim()).filter(Boolean);
  const candidates = await getByIndex(db, 'cards', 'tags', first);
  if (rest.length === 0) return candidates;
  return candidates.filter(c =>
    rest.every(tag => Array.isArray(c.tags) && c.tags.includes(tag))
  );
}

/**
 * Atualiza campos de um card existente.
 * Campos não fornecidos são mantidos intactos.
 * Atualiza updatedAt automaticamente.
 *
 * @param {IDBDatabase} db
 * @param {string} id
 * @param {object} updates   — { question?, answer?, hint?, tags?, source? }
 * @returns {Promise<object>}  card atualizado
 */
export async function updateCard(db, id, updates) {
  const existing = await getById(db, 'cards', id);
  if (!existing) throw new Error(`Card "${id}" não encontrado.`);

  const updated = { ...existing };
  if (typeof updates.question === 'string') updated.question = updates.question.trim();
  if (typeof updates.answer   === 'string') updated.answer   = updates.answer.trim();
  if (typeof updates.hint     === 'string') updated.hint     = updates.hint.trim();
  if (typeof updates.source   === 'string') updated.source   = updates.source.trim();
  if (Array.isArray(updates.tags))          updated.tags     = updates.tags.map(t => String(t).trim()).filter(Boolean);
  updated.updatedAt = new Date().toISOString();

  const { valid, errors } = validateCard(updated);
  if (!valid) throw new Error(`Atualização inválida: ${errors.join(' | ')}`);

  await upsert(db, 'cards', updated);
  return updated;
}

/**
 * Exclui um card e em cascata seus attempts e schedule.
 * Política explícita: attempts e schedules do card são deletados.
 * Subjects e topics NÃO são afetados.
 *
 * @param {IDBDatabase} db
 * @param {string} id
 * @returns {Promise<{ deletedAttempts: number, hadSchedule: boolean }>}
 */
export async function deleteCard(db, id) {
  const existing = await getById(db, 'cards', id);
  if (!existing) throw new Error(`Card "${id}" não encontrado.`);

  // 1. Cascade: deletar attempts vinculados
  const attempts = await getByIndex(db, 'attempts', 'cardId', id);
  for (const att of attempts) {
    await deleteRecord(db, 'attempts', att.id);
  }

  // 2. Cascade: deletar schedule vinculado (keyPath = cardId)
  const schedule = await getById(db, 'schedules', id);
  if (schedule) await deleteRecord(db, 'schedules', id);

  // 3. Deletar o card
  await deleteRecord(db, 'cards', id);

  return { deletedAttempts: attempts.length, hadSchedule: !!schedule };
}

// ─── Operações em lote ────────────────────────────────────────────────────────

/**
 * Importa um array de cards a partir de JSON.
 * Por padrão (skipExisting:true), não sobrescreve cards já existentes —
 * protege edições personalizadas do usuário.
 *
 * @param {IDBDatabase} db
 * @param {object[]} cards
 * @param {{ overwrite?: boolean, validateRefs?: boolean }} opts
 * @returns {Promise<{ imported: number, skipped: number, errors: string[] }>}
 */
export async function importCards(db, cards, { overwrite = false, validateRefs = false } = {}) {
  if (!Array.isArray(cards)) throw new Error('Argumento deve ser um array de cards.');
  let imported = 0, skipped = 0;
  const errors = [];

  for (const card of cards) {
    const { valid, errors: ve } = validateCard(card);
    if (!valid) { errors.push(`[${card?.id || '?'}] ${ve.join('; ')}`); skipped++; continue; }

    if (validateRefs) {
      const rel = await validateRelations(db, card.subjectId, card.topicId);
      if (!rel.valid) { errors.push(`[${card.id}] ${rel.errors.join('; ')}`); skipped++; continue; }
    }

    const result = await upsert(db, 'cards', { ...card, updatedAt: card.updatedAt || card.createdAt || new Date().toISOString() }, { skipExisting: !overwrite });
    if (result === null) { skipped++; } else { imported++; }
  }

  return { imported, skipped, errors };
}

/**
 * Exporta cards em formato JSON.
 * @param {IDBDatabase} db
 * @param {{ subjectId?: string, topicId?: string }} filter
 * @returns {Promise<object[]>}
 */
export async function exportCards(db, { subjectId, topicId } = {}) {
  let cards;
  if (topicId)       cards = await listCardsByTopic(db, topicId);
  else if (subjectId) cards = await listCardsBySubject(db, subjectId);
  else                cards = await getAll(db, 'cards');

  // Remove campos internos sensíveis antes de exportar
  return cards.map(({ _seedVersion, ...rest }) => rest);
}

/**
 * Conta cards no banco, opcionalmente por matéria ou assunto.
 * @param {IDBDatabase} db
 * @param {{ subjectId?: string, topicId?: string }} filter
 * @returns {Promise<number>}
 */
export async function countCards(db, { subjectId, topicId } = {}) {
  if (topicId || subjectId) {
    const list = topicId
      ? await listCardsByTopic(db, topicId)
      : await listCardsBySubject(db, subjectId);
    return list.length;
  }
  return countRecords(db, 'cards');
}
