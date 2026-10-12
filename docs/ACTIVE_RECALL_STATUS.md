# ORAL LAB 3.0 — Active Recall: Status do Desenvolvimento

> **Branch:** `feat/active-recall-mvp`
> **Última atualização:** 2026-10-11 (Tarefa 04)

---

## Etapa Atual

**Tarefa 04 — Banco de Flashcards e Expansão Curricular** ✅ CONCLUÍDA

---

## Implementações Concluídas

### Tarefas 01 + 02 (branch `main` — publicado)
- Design premium com parallax, glassmorphism e micro-animações
- Detecção de omissões em vermelho + feedback sonoro via Web Audio API
- Alinhamento semântico com tolerância temporal e pontuação final
- Correção do fluxo SpeechRecognition (estados granulares, backoff exponencial)
- Modal de pontuação final com classificação pedagógica

### Tarefa 03 (branch `feat/active-recall-mvp` — commit `796b43f`)
- `study/study-db.js` — schema IndexedDB v1, 5 object stores
- `study/study-seed.js` — 9 matérias e 9 assuntos de Legislação
- `tests/test_study_seed.mjs` — 42 PASS

### Tarefa 04 (esta entrega)

| Arquivo | Tipo | Descrição |
|---------|------|-----------|
| [`study/study-db.js`](../study/study-db.js) | Modificado | Schema v2: índice multiEntry `tags` em `cards`; migração não-destrutiva; novos helpers `getByIndex`, `deleteRecord`; opção `skipExisting` em `upsert` |
| [`study/study-seed.js`](../study/study-seed.js) | Modificado | 48 tópicos (9 Legislação + 39 para demais matérias); 45 flashcards de Legislação; seed idempotente com `skipExisting:true` para cards |
| [`study/study-cards.js`](../study/study-cards.js) | Criado | CRUD completo: `validateCard`, `validateRelations`, `createCard`, `getCardById_`, `listCardsBySubject`, `listCardsByTopic`, `listCardsByTags`, `updateCard`, `deleteCard` (cascade), `importCards`, `exportCards`, `countCards` |
| [`tests/test_study_cards.mjs`](../tests/test_study_cards.mjs) | Criado | 63 PASS + 1 SKIP honesto — 20 cenários do spec |
| [`docs/ACTIVE_RECALL_STATUS.md`](./ACTIVE_RECALL_STATUS.md) | Modificado | Este documento |

#### Schema IndexedDB — Histórico de Versões

```
v1 (Tarefa 03):  subjects, topics, cards, attempts, schedules
v2 (Tarefa 04):  + índice multiEntry 'tags' em cards
                 + helpers getByIndex, deleteRecord
                 + skipExisting em upsert
```

#### Catálogo de Assuntos (48 tópicos totais)

| Matéria | Tópicos |
|---------|---------|
| Legislação | 9 (confirmados — edital TRT-4) |
| Português | 5 (preliminar) |
| Raciocínio Lógico-Matemático | 5 (preliminar) |
| Desenvolvimento / Engenharia de Software | 5 (preliminar) |
| Redes e Segurança | 5 (preliminar) |
| Arquitetura / Sistemas Operacionais | 5 (preliminar) |
| Banco de Dados / Dados / IA | 5 (preliminar) |
| Governança | 5 (preliminar) |
| Prova Discursiva — Redação | 4 (preliminar) |

> ⚠️ Tópicos marcados como "preliminar" não estão confirmados pelo edital oficial. Consulte o edital do TRT da 4ª Região.

#### Flashcards (45 iniciais)

| Assunto | Cards |
|---------|-------|
| Lei nº 8.112/1990 | 5 |
| Lei nº 9.784/1999 | 5 |
| Lei nº 8.429/1992 (redação original) | 5 |
| Lei nº 14.230/2021 | 5 |
| Lei nº 14.133/2021 | 5 |
| Lei nº 13.709/2018 (LGPD) | 5 |
| Lei nº 13.146/2015 (EPD) | 5 |
| Regimento Interno TRT-4 | 5 |
| Resolução CNJ nº 400/2021 | 5 |
| **Total** | **45** |

> Os cards de Regimento Interno TRT-4 e Resolução CNJ 400/2021 indicam
> fontes oficiais para verificação independente onde o conteúdo específico
> não pôde ser confirmado sem acesso ao texto vigente.

#### Política de Integridade Referencial

**Exclusão de card (CASCADE):**
- Deleta todos os `attempts` vinculados pelo índice `cardId`
- Deleta o `schedule` vinculado (keyPath = `cardId`)
- `subjects` e `topics` **NÃO** são afetados

**Proteção de edições personalizadas:**
- `importCards` usa `skipExisting:true` por padrão
- `seedDatabase` usa `skipExisting:true` para cards
- Re-seed nunca sobrescreve cards modificados pelo usuário

---

## Preparação para Revisão Espaçada — Contrato de Dados (Tarefa 05)

### Dados de entrada mínimos para SM-2

O store `schedules` recebe, após cada sessão de revisão:

```js
{
  cardId:      string,   // FK → cards.id
  nextReview:  ISO8601,  // data da próxima revisão
  interval:    number,   // dias até a próxima revisão (I)
  easeFactor:  number,   // fator de facilidade (EF, inicial 2.5)
  repetitions: number    // número de repetições consecutivas corretas (n)
}
```

O store `attempts` recebe, após cada avaliação:

```js
{
  // id: autoIncrement
  cardId:    string,   // FK → cards.id
  rating:    0–5,      // nota de recuperação (0=falha, 3=aceitável, 5=perfeito)
  createdAt: ISO8601
}
```

O algoritmo SM-2 usa: `rating`, `interval`, `easeFactor`, `repetitions`
para calcular o próximo `interval` e `nextReview`. Implementação: Tarefa 05.

---

## Testes Executados

| Suite | Resultado |
|-------|-----------|
| `test_alignment.mjs` | **11 PASS** ✅ |
| `test_dom.mjs` | **1 PASS** ✅ |
| `test_study_seed.mjs` | **81 PASS · 1 SKIP** ✅ |
| `test_study_cards.mjs` | **63 PASS · 1 SKIP** ✅ |

SKIP em ambas as suítes: IndexedDB real — API ausente em Node.js puro.
Para validar, abra o console do navegador e execute:
```js
import('./study/study-db.js').then(m => m.openDB()).then(db => console.log('OK', db.name, 'v', db.version));
```

---

## Arquivos NÃO modificados na Tarefa 04

`app.js` · `alignment.js` · `styles.css` · `index.html` ·
`content.js` · `content-data.json` · `service-worker.js` — **intactos**

---

## Pendências e Limitações

- [ ] IndexedDB real ainda não validado no navegador (aguarda Tarefa 06)
- [ ] Tópicos preliminares precisam de confirmação pelo edital oficial
- [ ] Cards de Regimento TRT-4 e CNJ 400/2021 indicam fontes para verificação
- [ ] Seed de flashcards para matérias não-Legislação (Tarefa 04+)
- [ ] Algoritmo SM-2 completo — **Tarefa 05**
- [ ] Interface visual de flashcards — **Tarefa 06**
- [ ] Dashboard de progresso — **Tarefa 07**

---

## Próximo Passo — Tarefa 05: Revisão Espaçada (SM-2)

**Contrato de dados definido acima.** A Tarefa 05 implementará:

1. `study/study-srs.js` — algoritmo SM-2 (ou FSRS como alternativa)
2. Funções: `scheduleCard(db, cardId, rating)`, `getDueCards(db, limit)`
3. Integração com stores `attempts` e `schedules`
4. Testes: `tests/test_study_srs.mjs`
5. Sem interface visual (permanece na Tarefa 06)
