/**
 * study/study-db.js
 * Oral Lab 3.0 — Active Recall
 *
 * Camada de persistência via IndexedDB para o banco de estudos.
 * Não toca no localStorage nem nos dados do app 2.0.
 *
 * Object stores:
 *   subjects   — matérias (Português, Legislação, etc.)
 *   topics     — assuntos vinculados a uma matéria (Lei nº 8.112…)
 *   cards      — flashcards
 *   attempts   — histórico de tentativas por flashcard
 *   schedules  — agenda de revisão espaçada (SM-2 / FS-RS)
 *
 * Histórico de versões:
 *   v1 — schema inicial (Tarefa 03)
 *   v2 — índice multiEntry 'tags' adicionado ao store 'cards' (Tarefa 04)
 *
 * Nome do banco: oral-lab-active-recall-v1
 */

export const DB_NAME    = 'oral-lab-active-recall-v1';
export const DB_VERSION = 2;

/**
 * Abre (e migra, se necessário) o banco IndexedDB.
 * @returns {Promise<IDBDatabase>}
 */
export function openDB() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB não disponível neste ambiente.'));
      return;
    }

    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onerror   = () => reject(req.error);
    req.onblocked = () => {
      console.warn('[StudyDB] Upgrade bloqueado — feche outras abas do Oral Lab.');
    };

    req.onupgradeneeded = (e) => {
      const db         = e.target.result;
      const oldVersion = e.oldVersion;

      // ── v1: criação inicial do schema ────────────────────────────────────
      if (oldVersion < 1) {
        // subjects
        const subj = db.createObjectStore('subjects', { keyPath: 'id' });
        subj.createIndex('slug',     'slug',     { unique: true  });
        subj.createIndex('category', 'category', { unique: false });

        // topics
        const top = db.createObjectStore('topics', { keyPath: 'id' });
        top.createIndex('subjectId', 'subjectId', { unique: false });
        top.createIndex('slug',      'slug',      { unique: true  });

        // cards
        const cards = db.createObjectStore('cards', { keyPath: 'id' });
        cards.createIndex('topicId',    'topicId',    { unique: false });
        cards.createIndex('subjectId',  'subjectId',  { unique: false });
        cards.createIndex('nextReview', 'nextReview', { unique: false });

        // attempts
        const att = db.createObjectStore('attempts', {
          keyPath: 'id', autoIncrement: true
        });
        att.createIndex('cardId',    'cardId',    { unique: false });
        att.createIndex('createdAt', 'createdAt', { unique: false });

        // schedules
        const sch = db.createObjectStore('schedules', { keyPath: 'cardId' });
        sch.createIndex('nextReview', 'nextReview', { unique: false });
      }

      // ── v2: índice multiEntry de tags em cards ────────────────────────────
      if (oldVersion < 2) {
        const cardsStore = e.target.transaction.objectStore('cards');
        if (!cardsStore.indexNames.contains('tags')) {
          cardsStore.createIndex('tags', 'tags', { multiEntry: true, unique: false });
        }
      }

      console.info(`[StudyDB] Schema migrado de v${oldVersion} → v${DB_VERSION}.`);
    };

    req.onsuccess = () => resolve(req.result);
  });
}

// ─── API mínima ───────────────────────────────────────────────────────────────

/** Retorna todos os registros de um store. */
export function getAll(db, storeName) {
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(storeName, 'readonly');
    const req = tx.objectStore(storeName).getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
}

/** Retorna um registro pelo id. */
export function getById(db, storeName, id) {
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(storeName, 'readonly');
    const req = tx.objectStore(storeName).get(id);
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
}

/** Retorna registros de um store por valor de índice. */
export function getByIndex(db, storeName, indexName, value) {
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(storeName, 'readonly');
    const index = tx.objectStore(storeName).index(indexName);
    const req   = index.getAll(value);
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
}

/** Retorna todos os topics de uma matéria. */
export const getTopicsBySubject = (db, subjectId) =>
  getByIndex(db, 'topics', 'subjectId', subjectId);

/** Retorna todos os subjects de uma categoria. */
export const getSubjectsByCategory = (db, category) =>
  getByIndex(db, 'subjects', 'category', category);

/** Retorna todos os cards de um topic. */
export const getCardsByTopic = (db, topicId) =>
  getByIndex(db, 'cards', 'topicId', topicId);

/** Retorna todos os cards de um subject. */
export const getCardsBySubject = (db, subjectId) =>
  getByIndex(db, 'cards', 'subjectId', subjectId);

/**
 * Insere ou atualiza um registro (idempotente por id).
 * Não sobrescreve se a opção skipExisting for true e o registro já existir.
 */
export function upsert(db, storeName, record, { skipExisting = false } = {}) {
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);

    if (!skipExisting) {
      const req = store.put(record);
      req.onsuccess = () => resolve(req.result);
      req.onerror   = () => reject(req.error);
      return;
    }

    // Verifica existência antes de inserir
    const getReq = store.get(record.id);
    getReq.onsuccess = () => {
      if (getReq.result !== undefined) {
        resolve(null); // já existe — não sobrescreve
        return;
      }
      const putReq = store.put(record);
      putReq.onsuccess = () => resolve(putReq.result);
      putReq.onerror   = () => reject(putReq.error);
    };
    getReq.onerror = () => reject(getReq.error);
  });
}

/** Remove um registro pelo id. */
export function deleteRecord(db, storeName, id) {
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(storeName, 'readwrite');
    const req = tx.objectStore(storeName).delete(id);
    req.onsuccess = () => resolve();
    req.onerror   = () => reject(req.error);
  });
}

/** Conta registros em um store. */
export function countRecords(db, storeName) {
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(storeName, 'readonly');
    const req = tx.objectStore(storeName).count();
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
}
