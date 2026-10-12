/**
 * study/study-seed.js
 * Oral Lab 3.0 — Active Recall
 *
 * Cadastro inicial das matérias e assuntos do TRT da 4ª Região.
 *
 * AVISO: Esta estrutura é uma aproximação para fins de estudo.
 * Consulte sempre o edital oficial do concurso para obter a lista
 * de matérias, assuntos e pesos vigentes.
 *
 * Inicialização idempotente: usa `upsert` (IDBObjectStore.put) com
 * IDs estáveis — executar duas vezes não cria duplicatas.
 */

import { upsert } from './study-db.js';

// ─── Matérias ─────────────────────────────────────────────────────────────────

/**
 * @typedef {Object} Subject
 * @property {string} id         - Identificador estável (slug com prefixo 'subj-')
 * @property {string} slug       - Slug legível único
 * @property {string} name       - Nome exibido ao usuário
 * @property {string} category   - 'geral' | 'especifico' | 'complementar'
 * @property {number|null} weight - Peso da matéria (null quando não definido)
 * @property {string} createdAt  - ISO 8601
 */

/** @type {Subject[]} */
export const SEED_SUBJECTS = [
  // ── Conhecimentos Gerais (Peso 1) ──────────────────────────────────────────
  {
    id: 'subj-portugues',
    slug: 'portugues',
    name: 'Português',
    category: 'geral',
    weight: 1,
    createdAt: '2026-10-11T00:00:00.000Z'
  },
  {
    id: 'subj-raciocinio-logico',
    slug: 'raciocinio-logico-matematico',
    name: 'Raciocínio Lógico-Matemático',
    category: 'geral',
    weight: 1,
    createdAt: '2026-10-11T00:00:00.000Z'
  },
  {
    id: 'subj-legislacao',
    slug: 'legislacao',
    name: 'Legislação',
    category: 'geral',
    weight: 1,
    createdAt: '2026-10-11T00:00:00.000Z'
  },

  // ── Conhecimentos Específicos (Peso 2) ─────────────────────────────────────
  {
    id: 'subj-dev-engenharia',
    slug: 'desenvolvimento-engenharia-software',
    name: 'Desenvolvimento / Engenharia de Software',
    category: 'especifico',
    weight: 2,
    createdAt: '2026-10-11T00:00:00.000Z'
  },
  {
    id: 'subj-redes-seguranca',
    slug: 'redes-seguranca',
    name: 'Redes e Segurança',
    category: 'especifico',
    weight: 2,
    createdAt: '2026-10-11T00:00:00.000Z'
  },
  {
    id: 'subj-arq-sistemas',
    slug: 'arquitetura-sistemas-operacionais',
    name: 'Arquitetura / Sistemas Operacionais',
    category: 'especifico',
    weight: 2,
    createdAt: '2026-10-11T00:00:00.000Z'
  },
  {
    id: 'subj-bd-dados-ia',
    slug: 'banco-dados-dados-ia',
    name: 'Banco de Dados / Dados / IA',
    category: 'especifico',
    weight: 2,
    createdAt: '2026-10-11T00:00:00.000Z'
  },
  {
    id: 'subj-governanca',
    slug: 'governanca',
    name: 'Governança',
    category: 'especifico',
    weight: 2,
    createdAt: '2026-10-11T00:00:00.000Z'
  },

  // ── Área Complementar ──────────────────────────────────────────────────────
  {
    id: 'subj-discursiva',
    slug: 'prova-discursiva-redacao',
    name: 'Prova Discursiva — Redação',
    category: 'complementar',
    weight: null,    // Sem peso presumido na área complementar
    createdAt: '2026-10-11T00:00:00.000Z'
  }
];

// ─── Assuntos (Topics) ────────────────────────────────────────────────────────

/**
 * @typedef {Object} Topic
 * @property {string} id        - Identificador estável (slug com prefixo 'top-')
 * @property {string} slug      - Slug legível único
 * @property {string} name      - Nome exibido ao usuário
 * @property {string} subjectId - FK → Subject.id
 * @property {number} order     - Ordem sugerida de estudo dentro da matéria
 * @property {string} createdAt - ISO 8601
 */

/** @type {Topic[]} */
export const SEED_TOPICS = [
  // ── Legislação — assuntos detalhados ──────────────────────────────────────
  {
    id: 'top-lei-8112',
    slug: 'lei-8112-1990',
    name: 'Lei nº 8.112/1990 — Regime Jurídico dos Servidores Públicos',
    subjectId: 'subj-legislacao',
    order: 1,
    createdAt: '2026-10-11T00:00:00.000Z'
  },
  {
    id: 'top-lei-9784',
    slug: 'lei-9784-1999',
    name: 'Lei nº 9.784/1999 — Processo Administrativo Federal',
    subjectId: 'subj-legislacao',
    order: 2,
    createdAt: '2026-10-11T00:00:00.000Z'
  },
  {
    id: 'top-lei-8429',
    slug: 'lei-8429-1992',
    name: 'Lei nº 8.429/1992 — Improbidade Administrativa (redação original)',
    subjectId: 'subj-legislacao',
    order: 3,
    createdAt: '2026-10-11T00:00:00.000Z'
  },
  {
    id: 'top-lei-14230',
    slug: 'lei-14230-2021',
    name: 'Lei nº 14.230/2021 — Nova Improbidade Administrativa',
    subjectId: 'subj-legislacao',
    order: 4,
    createdAt: '2026-10-11T00:00:00.000Z'
  },
  {
    id: 'top-lei-14133',
    slug: 'lei-14133-2021',
    name: 'Lei nº 14.133/2021 — Nova Lei de Licitações e Contratos',
    subjectId: 'subj-legislacao',
    order: 5,
    createdAt: '2026-10-11T00:00:00.000Z'
  },
  {
    id: 'top-lei-13709',
    slug: 'lei-13709-2018',
    name: 'Lei nº 13.709/2018 — LGPD',
    subjectId: 'subj-legislacao',
    order: 6,
    createdAt: '2026-10-11T00:00:00.000Z'
  },
  {
    id: 'top-lei-13146',
    slug: 'lei-13146-2015',
    name: 'Lei nº 13.146/2015 — Estatuto da Pessoa com Deficiência',
    subjectId: 'subj-legislacao',
    order: 7,
    createdAt: '2026-10-11T00:00:00.000Z'
  },
  {
    id: 'top-regimento-trt4',
    slug: 'regimento-interno-trt4',
    name: 'Regimento Interno do TRT da 4ª Região',
    subjectId: 'subj-legislacao',
    order: 8,
    createdAt: '2026-10-11T00:00:00.000Z'
  },
  {
    id: 'top-res-cnj-400',
    slug: 'resolucao-cnj-400-2021',
    name: 'Resolução CNJ nº 400/2021',
    subjectId: 'subj-legislacao',
    order: 9,
    createdAt: '2026-10-11T00:00:00.000Z'
  }
  // Demais matérias (Português, Raciocínio, Específicas, Discursiva)
  // não possuem assuntos detalhados nesta semente — serão expandidos na Tarefa 04.
];

// ─── Função de seed idempotente ───────────────────────────────────────────────

/**
 * Popula o banco com subjects e topics usando `put` (upsert).
 * Seguro para executar múltiplas vezes — não cria duplicatas.
 *
 * @param {IDBDatabase} db
 * @returns {Promise<{ subjects: number, topics: number }>}
 */
export async function seedDatabase(db) {
  let subjCount = 0;
  let topicCount = 0;

  for (const subj of SEED_SUBJECTS) {
    await upsert(db, 'subjects', subj);
    subjCount++;
  }

  for (const topic of SEED_TOPICS) {
    await upsert(db, 'topics', topic);
    topicCount++;
  }

  console.info(`[StudySeed] Seed concluído: ${subjCount} matérias, ${topicCount} assuntos.`);
  return { subjects: subjCount, topics: topicCount };
}
