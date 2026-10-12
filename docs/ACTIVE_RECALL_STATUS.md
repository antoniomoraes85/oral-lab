# ORAL LAB 3.0 — Active Recall: Status do Desenvolvimento

> **Branch:** `feat/active-recall-mvp`
> **Última atualização:** 2026-10-11

---

## Etapa Atual

**Tarefa 03 — Banco de Matérias e Assuntos** ✅ CONCLUÍDA

---

## Implementações Concluídas

### Tarefa 01 + 02 (branch `main`)
- Design premium com parallax, glassmorphism e micro-animações
- Detecção de omissões em vermelho com feedback sonoro via Web Audio API
- Alinhamento semântico com tolerância temporal e pontuação final
- Correção completa do fluxo SpeechRecognition (estados granulares, backoff exponencial)
- Modal de pontuação final com classificação pedagógica

### Tarefa 03 — Esta branch

| Arquivo | Descrição |
|---------|-----------|
| [`study/study-db.js`](../study/study-db.js) | Camada IndexedDB: `openDB()`, `getAll()`, `getById()`, `getTopicsBySubject()`, `getSubjectsByCategory()`, `upsert()`, `countRecords()` |
| [`study/study-seed.js`](../study/study-seed.js) | Seed idempotente com `SEED_SUBJECTS` (9 matérias) e `SEED_TOPICS` (9 assuntos de Legislação) |
| [`tests/test_study_seed.mjs`](../tests/test_study_seed.mjs) | Suite de testes Node.js com 43 asserções |
| [`docs/ACTIVE_RECALL_STATUS.md`](./ACTIVE_RECALL_STATUS.md) | Este documento |

#### Object Stores criadas no IndexedDB (`oral-lab-active-recall-v1`, schema v1)

```
subjects   — matérias (id, slug, name, category, weight, createdAt)
             índices: slug (unique), category
topics     — assuntos (id, slug, name, subjectId, order, createdAt)
             índices: subjectId, slug (unique)
cards      — flashcards (reservado — Tarefa 04)
             índices: topicId, subjectId, nextReview
attempts   — histórico de tentativas (autoIncrement)
             índices: cardId, createdAt
schedules  — agenda de revisão espaçada
             índice: nextReview
```

#### Matérias cadastradas

| Matéria | Categoria | Peso |
|---------|-----------|------|
| Português | geral | 1 |
| Raciocínio Lógico-Matemático | geral | 1 |
| Legislação | geral | 1 |
| Desenvolvimento / Engenharia de Software | especifico | 2 |
| Redes e Segurança | especifico | 2 |
| Arquitetura / Sistemas Operacionais | especifico | 2 |
| Banco de Dados / Dados / IA | especifico | 2 |
| Governança | especifico | 2 |
| Prova Discursiva — Redação | complementar | null |

#### Assuntos de Legislação cadastrados (9)

`lei-8112-1990` · `lei-9784-1999` · `lei-8429-1992` · `lei-14230-2021` ·
`lei-14133-2021` · `lei-13709-2018` · `lei-13146-2015` ·
`regimento-interno-trt4` · `resolucao-cnj-400-2021`

> ⚠️ **Aviso editorial:** esta estrutura é uma aproximação para fins de estudo.
> Consulte sempre o edital oficial do TRT da 4ª Região para pesos e assuntos vigentes.

---

## Testes Realizados

### Suíte de alinhamento (`test_alignment.mjs`) — ✅ 11 PASS

```
PASS prefixo simples 67 4
PASS acentuação e case 100 4
PASS omissões 88 5
PASS palavras repetidas 40 2
PASS longos saltos 25 2
PASS fala extra 67 4
PASS variação pequena 100 4
PASS correspondência integral: score 100
PASS detecção de omissão real: palavras puladas = 6
PASS tolerância a hesitação: omissões confirmadas = 0
PASS equivalência semântica: overlap = 43 score = 49
```

### Suíte DOM (`test_dom.mjs`) — ✅ 1 PASS

```
PASS: DOM simulado e biblioteca de simulados — 6 módulos, editor/persistência,
      STT falso com pausa/retomada, histórico, preparação PDF, navegação
```

### Suíte do banco de estudos (`test_study_seed.mjs`) — ✅ 42 PASS · ⏭ 1 SKIP

| Grupo | Asserções |
|-------|-----------|
| Quantidade de matérias (9) | PASS |
| Todos os nomes das 9 matérias | PASS (9/9) |
| Categorias corretas (3 geral, 5 específico, 1 complementar) | PASS |
| Pesos (1, 2 e null) | PASS |
| Matéria Legislação encontrada por id estável | PASS |
| 9 assuntos vinculados à Legislação | PASS |
| Todos os slugs dos 9 assuntos presentes | PASS (9/9) |
| IDs e slugs únicos (subjects e topics) | PASS (4/4) |
| FKs topic→subject válidas | PASS (9/9) |
| Idempotência: 2 seeds no mock não duplicam | PASS (2/2) |
| IndexedDB real (abertura no navegador) | **SKIP** — API ausente em Node.js puro |

> **Limitação documentada:** o teste de abertura real do IndexedDB é marcado como
> `SKIP` honesto em Node.js. Nenhum polyfill foi instalado. Para validar o
> comportamento real, abrir o console do navegador e executar:
> ```js
> import('./study/study-db.js').then(m => m.openDB()).then(db => console.log('OK', db.name));
> ```

---

## Pendências

- [ ] **Tarefa 04** — Flashcards: criar, editar e associar cards a topics
- [ ] **Tarefa 05** — Algoritmo SM-2/FS-RS: calcular próximas revisões e popular `schedules`
- [ ] **Tarefa 06** — Interface de flashcards (tela separada, sem alterar o layout 2.0)
- [ ] **Tarefa 07** — Dashboard de progresso por matéria
- [ ] Seed de assuntos para Português, Raciocínio e matérias específicas
- [ ] Validação manual do IndexedDB no navegador (Chrome/Edge)

---

## Arquivos NÃO modificados nesta tarefa

- `app.js` — intacto
- `alignment.js` — intacto
- `styles.css` — intacto
- `index.html` — intacto
- `content.js` / `content-data.json` — intactos
- `service-worker.js` — intacto
- localStorage do app 2.0 — não tocado

---

## Próximo Passo Previsto

**Tarefa 04 — Flashcards:**
- Definir schema do card (`question`, `answer`, `hint`, `topicId`, `subjectId`, `tags`)
- Criar `study/study-cards.js` com CRUD de cards
- Seed de 5 cards-exemplo por assunto de Legislação
- Testes Node.js para CRUD e relacionamentos
