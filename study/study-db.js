/**
 * study/study-db.js
 * Oral Lab 3.0 — Active Recall
 *
 * Camada de persistência via IndexedDB para o banco de estudos.
 * Não toca no localStorage nem nos dados do app 2.0.
 *
 * Object stores criadas nesta versão:
 *   subjects   — matérias (Português, Legislação, etc.)
 *   topics     — assuntos vinculados a uma matéria (Lei nº 8.112…)
 *   cards      — flashcards (reservado para Tarefa 04)
 *   attempts   — histórico de tentativas por flashcard
 *   schedules  — agenda de revisão espaçada (SM-2 / FS-RS)
 *
 * Versão do schema: 1
 * Nome do banco   : oral-lab-active-recall-v1
 */

export const DB_NAME    = 'oral-lab-active-recall-v1';
export const DB_VERSION = 1;

/**
 * Abre (e cria, se necessário) o banco IndexedDB.
 * Retorna uma Promise<IDBDatabase>.
 *
 * @returns {Promise<IDBDatabase>}
 */
export function openDB() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB não disponível neste ambiente.'));
      return;
    }

    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onerror = () => reject(req.error);

    req.onblocked = () => {
      console.warn('[StudyDB] Upgrade bloqueado — feche outras abas do Oral Lab.');
    };

    // Criação/migração de schema — executado apenas quando a versão muda
    req.onupgradeneeded = (e) => {
      const db = e.target.result;

      // subjects — matérias
      if (!db.objectStoreNames.contains('subjects')) {
        const subj = db.createObjectStore('subjects', { keyPath: 'id' });
        subj.createIndex('slug',     'slug',     { unique: true });
        subj.createIndex('category', 'category', { unique: false });
      }

      // topics — assuntos vinculados a uma matéria
      if (!db.objectStoreNames.contains('topics')) {
        const top = db.createObjectStore('topics', { keyPath: 'id' });
        top.createIndex('subjectId', 'subjectId', { unique: false });
        top.createIndex('slug',      'slug',      { unique: true  });
      }

      // cards — flashcards (schema reservado, populado na Tarefa 04)
      if (!db.objectStoreNames.contains('cards')) {
        const cards = db.createObjectStore('cards', { keyPath: 'id' });
        cards.createIndex('topicId',    'topicId',    { unique: false });
        cards.createIndex('subjectId',  'subjectId',  { unique: false });
        cards.createIndex('nextReview', 'nextReview', { unique: false });
      }

      // attempts — histórico de tentativas por flashcard
      if (!db.objectStoreNames.contains('attempts')) {
        const att = db.createObjectStore('attempts', {
          keyPath: 'id',
          autoIncrement: true
        });
        att.createIndex('cardId',    'cardId',    { unique: false });
        att.createIndex('createdAt', 'createdAt', { unique: false });
      }

      // schedules — agenda de revisão espaçada
      if (!db.objectStoreNames.contains('schedules')) {
        const sch = db.createObjectStore('schedules', { keyPath: 'cardId' });
        sch.createIndex('nextReview', 'nextReview', { unique: false });
      }

      console.info(`[StudyDB] Schema v${DB_VERSION} criado/migrado com sucesso.`);
    };

    req.onsuccess = () => resolve(req.result);
  });
}

// ─── API mínima de leitura ────────────────────────────────────────────────────

/**
 * Retorna todos os registros de um object store.
 *
 * @param {IDBDatabase} db
 * @param {string} storeName
 * @returns {Promise<Array>}
 */
export function getAll(db, storeName) {
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(storeName, 'readonly');
    const req = tx.objectStore(storeName).getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
}

/**
 * Retorna um registro pelo seu id.
 *
 * @param {IDBDatabase} db
 * @param {string} storeName
 * @param {string} id
 * @returns {Promise<object|undefined>}
 */
export function getById(db, storeName, id) {
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(storeName, 'readonly');
    const req = tx.objectStore(storeName).get(id);
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
}

/**
 * Retorna todos os topics de uma matéria (por subjectId).
 *
 * @param {IDBDatabase} db
 * @param {string} subjectId
 * @returns {Promise<Array>}
 */
export function getTopicsBySubject(db, subjectId) {
  return new Promise((resolve, reject) => {
    const tx    = db.transaction('topics', 'readonly');
    const index = tx.objectStore('topics').index('subjectId');
    const req   = index.getAll(subjectId);
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
}

/**
 * Retorna todos os subjects de uma categoria.
 *
 * @param {IDBDatabase} db
 * @param {string} category  ex: 'geral', 'especifico', 'complementar'
 * @returns {Promise<Array>}
 */
export function getSubjectsByCategory(db, category) {
  return new Promise((resolve, reject) => {
    const tx    = db.transaction('subjects', 'readonly');
    const index = tx.objectStore('subjects').index('category');
    const req   = index.getAll(category);
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
}

/**
 * Insere ou atualiza um registro (put idempotente — não cria duplicata se o id já existir).
 *
 * @param {IDBDatabase} db
 * @param {string} storeName
 * @param {object} record
 * @returns {Promise<IDBValidKey>}
 */
export function upsert(db, storeName, record) {
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(storeName, 'readwrite');
    const req = tx.objectStore(storeName).put(record);
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
}

/**
 * Conta registros em um object store.
 *
 * @param {IDBDatabase} db
 * @param {string} storeName
 * @returns {Promise<number>}
 */
export function countRecords(db, storeName) {
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(storeName, 'readonly');
    const req = tx.objectStore(storeName).count();
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
}
