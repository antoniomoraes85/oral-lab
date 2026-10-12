/**
 * study/study-seed.js
 * Oral Lab 3.0 — Active Recall  (Tarefa 04 — expandido)
 *
 * AVISO: Esta estrutura é uma aproximação para fins de estudo.
 * Consulte sempre o edital oficial do TRT da 4ª Região para a lista
 * de matérias, assuntos e pesos vigentes.
 *
 * Inicialização idempotente: usa upsert (IDBObjectStore.put) com
 * IDs estáveis. Executar duas vezes não cria duplicatas.
 * Cards do seed não sobrescrevem alterações personalizadas do usuário
 * (a função seedDatabase usa skipExisting:true para cards).
 */

import { upsert } from './study-db.js';

// ─────────────────────────────────────────────────────────────────────────────
// MATÉRIAS (mantidas integralmente da Tarefa 03)
// ─────────────────────────────────────────────────────────────────────────────

export const SEED_SUBJECTS = [
  { id:'subj-portugues',      slug:'portugues',                          name:'Português',                               category:'geral',         weight:1,    createdAt:'2026-10-11T00:00:00.000Z' },
  { id:'subj-raciocinio-logico', slug:'raciocinio-logico-matematico',    name:'Raciocínio Lógico-Matemático',            category:'geral',         weight:1,    createdAt:'2026-10-11T00:00:00.000Z' },
  { id:'subj-legislacao',     slug:'legislacao',                         name:'Legislação',                              category:'geral',         weight:1,    createdAt:'2026-10-11T00:00:00.000Z' },
  { id:'subj-dev-engenharia', slug:'desenvolvimento-engenharia-software',name:'Desenvolvimento / Engenharia de Software', category:'especifico',    weight:2,    createdAt:'2026-10-11T00:00:00.000Z' },
  { id:'subj-redes-seguranca',slug:'redes-seguranca',                    name:'Redes e Segurança',                       category:'especifico',    weight:2,    createdAt:'2026-10-11T00:00:00.000Z' },
  { id:'subj-arq-sistemas',   slug:'arquitetura-sistemas-operacionais',  name:'Arquitetura / Sistemas Operacionais',     category:'especifico',    weight:2,    createdAt:'2026-10-11T00:00:00.000Z' },
  { id:'subj-bd-dados-ia',    slug:'banco-dados-dados-ia',               name:'Banco de Dados / Dados / IA',             category:'especifico',    weight:2,    createdAt:'2026-10-11T00:00:00.000Z' },
  { id:'subj-governanca',     slug:'governanca',                         name:'Governança',                              category:'especifico',    weight:2,    createdAt:'2026-10-11T00:00:00.000Z' },
  { id:'subj-discursiva',     slug:'prova-discursiva-redacao',           name:'Prova Discursiva — Redação',              category:'complementar',  weight:null, createdAt:'2026-10-11T00:00:00.000Z' },
];

// ─────────────────────────────────────────────────────────────────────────────
// ASSUNTOS
// ─────────────────────────────────────────────────────────────────────────────
// Os 9 assuntos de Legislação são confirmados (Tarefa 03).
// Os demais são PRELIMINARES para fins de estudo — verifique o edital oficial.

const TS = '2026-10-11T00:00:00.000Z';

export const SEED_TOPICS = [
  // ── Legislação (9 assuntos confirmados) ───────────────────────────────────
  { id:'top-lei-8112',       slug:'lei-8112-1990',            name:'Lei nº 8.112/1990 — Regime Jurídico dos Servidores Públicos',     subjectId:'subj-legislacao',      order:1,  createdAt:TS },
  { id:'top-lei-9784',       slug:'lei-9784-1999',            name:'Lei nº 9.784/1999 — Processo Administrativo Federal',             subjectId:'subj-legislacao',      order:2,  createdAt:TS },
  { id:'top-lei-8429',       slug:'lei-8429-1992',            name:'Lei nº 8.429/1992 — Improbidade Administrativa (redação original)',subjectId:'subj-legislacao',      order:3,  createdAt:TS },
  { id:'top-lei-14230',      slug:'lei-14230-2021',           name:'Lei nº 14.230/2021 — Nova Improbidade Administrativa',            subjectId:'subj-legislacao',      order:4,  createdAt:TS },
  { id:'top-lei-14133',      slug:'lei-14133-2021',           name:'Lei nº 14.133/2021 — Nova Lei de Licitações e Contratos',         subjectId:'subj-legislacao',      order:5,  createdAt:TS },
  { id:'top-lei-13709',      slug:'lei-13709-2018',           name:'Lei nº 13.709/2018 — LGPD',                                      subjectId:'subj-legislacao',      order:6,  createdAt:TS },
  { id:'top-lei-13146',      slug:'lei-13146-2015',           name:'Lei nº 13.146/2015 — Estatuto da Pessoa com Deficiência',         subjectId:'subj-legislacao',      order:7,  createdAt:TS },
  { id:'top-regimento-trt4', slug:'regimento-interno-trt4',   name:'Regimento Interno do TRT da 4ª Região',                          subjectId:'subj-legislacao',      order:8,  createdAt:TS },
  { id:'top-res-cnj-400',    slug:'resolucao-cnj-400-2021',   name:'Resolução CNJ nº 400/2021',                                      subjectId:'subj-legislacao',      order:9,  createdAt:TS },

  // ── Português (preliminar — verificar edital) ─────────────────────────────
  { id:'top-port-001', slug:'interpretacao-compreensao-texto', name:'Interpretação e Compreensão de Texto',  subjectId:'subj-portugues',         order:1, createdAt:TS },
  { id:'top-port-002', slug:'gramatica-norma-culta',           name:'Gramática e Norma Culta',               subjectId:'subj-portugues',         order:2, createdAt:TS },
  { id:'top-port-003', slug:'redacao-oficial',                 name:'Redação Oficial (Manual da Presidência)', subjectId:'subj-portugues',        order:3, createdAt:TS },
  { id:'top-port-004', slug:'coesao-coerencia-textual',        name:'Coesão e Coerência Textual',            subjectId:'subj-portugues',         order:4, createdAt:TS },
  { id:'top-port-005', slug:'ortografia-pontuacao',            name:'Ortografia e Pontuação (Acordo de 2009)', subjectId:'subj-portugues',        order:5, createdAt:TS },

  // ── Raciocínio Lógico-Matemático (preliminar) ─────────────────────────────
  { id:'top-rl-001', slug:'logica-proposicional',           name:'Lógica Proposicional e Dedutiva',         subjectId:'subj-raciocinio-logico', order:1, createdAt:TS },
  { id:'top-rl-002', slug:'raciocinio-quantitativo',        name:'Raciocínio Quantitativo e Financeiro',    subjectId:'subj-raciocinio-logico', order:2, createdAt:TS },
  { id:'top-rl-003', slug:'sequencias-progressoes',         name:'Sequências, PA e PG',                     subjectId:'subj-raciocinio-logico', order:3, createdAt:TS },
  { id:'top-rl-004', slug:'combinatoria-probabilidade',     name:'Análise Combinatória e Probabilidade',    subjectId:'subj-raciocinio-logico', order:4, createdAt:TS },
  { id:'top-rl-005', slug:'geometria-basica',               name:'Geometria Plana e Espacial Básica',       subjectId:'subj-raciocinio-logico', order:5, createdAt:TS },

  // ── Dev / Engenharia de Software (preliminar) ─────────────────────────────
  { id:'top-dev-001', slug:'metodologias-ageis',            name:'Metodologias Ágeis (Scrum, Kanban, XP)',  subjectId:'subj-dev-engenharia',    order:1, createdAt:TS },
  { id:'top-dev-002', slug:'design-patterns',               name:'Padrões de Projeto (GoF)',                subjectId:'subj-dev-engenharia',    order:2, createdAt:TS },
  { id:'top-dev-003', slug:'devops-ci-cd',                  name:'DevOps, CI/CD e Controle de Versão',      subjectId:'subj-dev-engenharia',    order:3, createdAt:TS },
  { id:'top-dev-004', slug:'testes-software',               name:'Testes de Software (unitário, integração, E2E)', subjectId:'subj-dev-engenharia', order:4, createdAt:TS },
  { id:'top-dev-005', slug:'microsservicos-api',            name:'Microsserviços, APIs REST e GraphQL',     subjectId:'subj-dev-engenharia',    order:5, createdAt:TS },

  // ── Redes e Segurança (preliminar) ───────────────────────────────────────
  { id:'top-redes-001', slug:'protocolo-tcp-ip',            name:'Modelo OSI/TCP-IP e Protocolos de Rede',  subjectId:'subj-redes-seguranca',   order:1, createdAt:TS },
  { id:'top-redes-002', slug:'criptografia-pki',            name:'Criptografia, PKI e Certificados Digitais', subjectId:'subj-redes-seguranca', order:2, createdAt:TS },
  { id:'top-redes-003', slug:'firewall-ids-ips',            name:'Firewall, IDS/IPS e Proxy',               subjectId:'subj-redes-seguranca',   order:3, createdAt:TS },
  { id:'top-redes-004', slug:'vpn-redes-privadas',          name:'VPN, SD-WAN e Redes Privadas',            subjectId:'subj-redes-seguranca',   order:4, createdAt:TS },
  { id:'top-redes-005', slug:'ataques-vulnerabilidades',    name:'Ataques, Vulnerabilidades e OWASP Top 10', subjectId:'subj-redes-seguranca',   order:5, createdAt:TS },

  // ── Arquitetura / Sistemas Operacionais (preliminar) ─────────────────────
  { id:'top-arq-001', slug:'sistemas-operacionais-base',   name:'Sistemas Operacionais (Linux e Windows)',  subjectId:'subj-arq-sistemas',      order:1, createdAt:TS },
  { id:'top-arq-002', slug:'virtualizacao-containers',     name:'Virtualização e Containers (Docker, K8s)', subjectId:'subj-arq-sistemas',      order:2, createdAt:TS },
  { id:'top-arq-003', slug:'arquitetura-nuvem',            name:'Computação em Nuvem (IaaS, PaaS, SaaS)',   subjectId:'subj-arq-sistemas',      order:3, createdAt:TS },
  { id:'top-arq-004', slug:'alta-disponibilidade-backup',  name:'Alta Disponibilidade, Backup e Recuperação', subjectId:'subj-arq-sistemas',    order:4, createdAt:TS },
  { id:'top-arq-005', slug:'processos-memoria-so',         name:'Gerenciamento de Processos e Memória',     subjectId:'subj-arq-sistemas',      order:5, createdAt:TS },

  // ── Banco de Dados / Dados / IA (preliminar) ─────────────────────────────
  { id:'top-bd-001', slug:'sql-modelagem-relacional',      name:'SQL e Modelagem Relacional',               subjectId:'subj-bd-dados-ia',       order:1, createdAt:TS },
  { id:'top-bd-002', slug:'nosql-bancos-distribuidos',     name:'NoSQL e Bancos Distribuídos',              subjectId:'subj-bd-dados-ia',       order:2, createdAt:TS },
  { id:'top-bd-003', slug:'machine-learning-deep-learning',name:'Machine Learning e Deep Learning',         subjectId:'subj-bd-dados-ia',       order:3, createdAt:TS },
  { id:'top-bd-004', slug:'bi-data-warehouse',             name:'Business Intelligence e Data Warehouse',   subjectId:'subj-bd-dados-ia',       order:4, createdAt:TS },
  { id:'top-bd-005', slug:'big-data-processamento',        name:'Big Data e Processamento de Dados',        subjectId:'subj-bd-dados-ia',       order:5, createdAt:TS },

  // ── Governança (preliminar) ───────────────────────────────────────────────
  { id:'top-gov-001', slug:'cobit-itil',                   name:'COBIT e ITIL — Governança e Gestão de TI', subjectId:'subj-governanca',        order:1, createdAt:TS },
  { id:'top-gov-002', slug:'gestao-riscos-iso31000',       name:'Gestão de Riscos (ISO 31000)',              subjectId:'subj-governanca',        order:2, createdAt:TS },
  { id:'top-gov-003', slug:'seg-info-iso27001',            name:'Segurança da Informação (ISO/IEC 27001)',   subjectId:'subj-governanca',        order:3, createdAt:TS },
  { id:'top-gov-004', slug:'governanca-ti-setor-publico',  name:'Governança de TI no Setor Público',        subjectId:'subj-governanca',        order:4, createdAt:TS },
  { id:'top-gov-005', slug:'gerenciamento-projetos-pmbok', name:'Gerenciamento de Projetos (PMBOK, Agile)',  subjectId:'subj-governanca',        order:5, createdAt:TS },

  // ── Prova Discursiva (preliminar) ────────────────────────────────────────
  { id:'top-disc-001', slug:'dissertacao-argumentativa',   name:'Estrutura da Dissertação Argumentativa',   subjectId:'subj-discursiva',        order:1, createdAt:TS },
  { id:'top-disc-002', slug:'coesao-discursiva',           name:'Coesão, Coerência e Progressão Textual',   subjectId:'subj-discursiva',        order:2, createdAt:TS },
  { id:'top-disc-003', slug:'fundamentacao-juridica',      name:'Argumentação e Fundamentação Jurídica',    subjectId:'subj-discursiva',        order:3, createdAt:TS },
  { id:'top-disc-004', slug:'redacao-documentos-oficiais', name:'Redação de Pareceres e Documentos Oficiais', subjectId:'subj-discursiva',       order:4, createdAt:TS },
];

// ─────────────────────────────────────────────────────────────────────────────
// FLASHCARDS — 45 cards de Legislação (5 por assunto)
// Conteúdo baseado nos textos normativos vigentes indicados em 'source'.
// Regras editoriais:
//   - Nenhum artigo inventado ou revogado apresentado como vigente.
//   - Onde há incerteza, a fonte é indicada para verificação independente.
//   - Regimento Interno TRT-4 e CNJ 400/2021 marcados como [VERIFICAR OFICIAL].
// ─────────────────────────────────────────────────────────────────────────────

export const SEED_CARDS = [

  // ── Lei nº 8.112/1990 ──────────────────────────────────────────────────────
  {
    id:'card-lei8112-001', subjectId:'subj-legislacao', topicId:'top-lei-8112',
    question:'Qual é o prazo do estágio probatório para servidores públicos federais, conforme a Lei nº 8.112/1990 com redação dada pela Lei nº 11.784/2008?',
    answer:'3 anos (36 meses), durante os quais o servidor é avaliado quanto a assiduidade, disciplina, capacidade de iniciativa, produtividade e responsabilidade.',
    hint:'Mesmo prazo da estabilidade: 3 anos.',
    tags:['estágio probatório','prazo','avaliação'],
    source:'Lei nº 8.112/1990, art. 20, caput (redação da Lei nº 11.784/2008)',
    createdAt:TS, updatedAt:TS, _seedVersion:1
  },
  {
    id:'card-lei8112-002', subjectId:'subj-legislacao', topicId:'top-lei-8112',
    question:'Como a Lei nº 8.112/1990 distingue "vencimento" de "remuneração"?',
    answer:'"Vencimento" é a retribuição pecuniária pelo exercício do cargo, com valor fixado em lei. "Remuneração" é o vencimento acrescido das vantagens pecuniárias permanentes estabelecidas em lei.',
    hint:'Vencimento = base; remuneração = vencimento + vantagens.',
    tags:['vencimento','remuneração','remuneração servidor'],
    source:'Lei nº 8.112/1990, arts. 40 e 41',
    createdAt:TS, updatedAt:TS, _seedVersion:1
  },
  {
    id:'card-lei8112-003', subjectId:'subj-legislacao', topicId:'top-lei-8112',
    question:'O que configura abandono de cargo segundo a Lei nº 8.112/1990 e qual é a penalidade?',
    answer:'A ausência intencional do servidor ao serviço por mais de 30 dias consecutivos configura abandono de cargo, punível com demissão.',
    hint:'30 dias consecutivos = abandono = demissão.',
    tags:['abandono de cargo','demissão','assiduidade'],
    source:'Lei nº 8.112/1990, arts. 132, II e 138',
    createdAt:TS, updatedAt:TS, _seedVersion:1
  },
  {
    id:'card-lei8112-004', subjectId:'subj-legislacao', topicId:'top-lei-8112',
    question:'Quais são as exceções constitucionais à proibição de acumulação de cargos públicos?',
    answer:'A CF/88 admite: (1) dois cargos de professor; (2) um cargo de professor com outro técnico ou científico; (3) dois cargos ou empregos privativos de profissionais de saúde com profissões regulamentadas. A carga horária total deve ser compatível.',
    hint:'Professor+professor; professor+técnico/científico; saúde+saúde.',
    tags:['acumulação de cargos','professor','saúde','CF/88'],
    source:'CF/88, art. 37, XVI; Lei nº 8.112/1990, art. 118',
    createdAt:TS, updatedAt:TS, _seedVersion:1
  },
  {
    id:'card-lei8112-005', subjectId:'subj-legislacao', topicId:'top-lei-8112',
    question:'Quais são os tipos de licença sem remuneração previstos na Lei nº 8.112/1990?',
    answer:'Licença para acompanhamento do cônjuge ou companheiro (art. 84); licença para tratar de interesses particulares (art. 91), concedida a critério da Administração por até 3 anos. Nas demais licenças (capacitação, doença em familiar, gestante) há remuneração.',
    hint:'Sem remuneração: cônjuge e interesses particulares.',
    tags:['licença','remuneração','cônjuge','interesses particulares'],
    source:'Lei nº 8.112/1990, arts. 84 e 91',
    createdAt:TS, updatedAt:TS, _seedVersion:1
  },

  // ── Lei nº 9.784/1999 ──────────────────────────────────────────────────────
  {
    id:'card-lei9784-001', subjectId:'subj-legislacao', topicId:'top-lei-9784',
    question:'Quais são os princípios explicitamente listados no art. 2º da Lei nº 9.784/1999?',
    answer:'Legalidade, finalidade, motivação, razoabilidade, proporcionalidade, moralidade, ampla defesa, contraditório, segurança jurídica, interesse público e eficiência — total de 11 princípios.',
    hint:'11 princípios: inclui eficiência e proporcionalidade, além dos clássicos.',
    tags:['princípios','processo administrativo','legalidade','eficiência'],
    source:'Lei nº 9.784/1999, art. 2º, caput',
    createdAt:TS, updatedAt:TS, _seedVersion:1
  },
  {
    id:'card-lei9784-002', subjectId:'subj-legislacao', topicId:'top-lei-9784',
    question:'Qual é o prazo para a Administração Federal decidir os processos administrativos, conforme a Lei nº 9.784/1999?',
    answer:'Até 30 dias, prorrogável por igual período mediante justificativa expressa. O não pronunciamento não implica aprovação tácita.',
    hint:'30 + 30 dias, sempre justificados. Silêncio ≠ aprovação.',
    tags:['prazo de decisão','silêncio administrativo','processo administrativo'],
    source:'Lei nº 9.784/1999, art. 49',
    createdAt:TS, updatedAt:TS, _seedVersion:1
  },
  {
    id:'card-lei9784-003', subjectId:'subj-legislacao', topicId:'top-lei-9784',
    question:'Em que prazo deve ser interposto o recurso administrativo na Lei nº 9.784/1999 e qual é seu efeito ordinário?',
    answer:'10 dias contados da ciência ou divulgação da decisão. O efeito ordinário é apenas devolutivo; o suspensivo pode ser atribuído pela autoridade competente quando houver risco de dano de difícil reparação.',
    hint:'10 dias; efeito devolutivo como regra — suspensivo é exceção.',
    tags:['recurso administrativo','prazo','efeito devolutivo'],
    source:'Lei nº 9.784/1999, arts. 59 e 61',
    createdAt:TS, updatedAt:TS, _seedVersion:1
  },
  {
    id:'card-lei9784-004', subjectId:'subj-legislacao', topicId:'top-lei-9784',
    question:'O que exige o princípio da motivação no processo administrativo federal e em que casos ela é obrigatória?',
    answer:'A motivação exige a indicação dos fatos e dos fundamentos jurídicos de cada decisão. É obrigatória nas decisões que neguem, limitem ou afetem direitos; imponham ou agravem deveres, encargos ou sanções; decidam recursos; dispensem ou declarem a inexigibilidade de licitação; e em outras hipóteses do art. 50. Despachos de mero expediente são dispensados de motivação elaborada.',
    hint:'Regra: motivar. Exceção: meros despachos de expediente.',
    tags:['motivação','fundamentação','princípios'],
    source:'Lei nº 9.784/1999, arts. 2º e 50',
    createdAt:TS, updatedAt:TS, _seedVersion:1
  },
  {
    id:'card-lei9784-005', subjectId:'subj-legislacao', topicId:'top-lei-9784',
    question:'Qual é o prazo para a Administração anular seus próprios atos administrativos que geraram efeitos favoráveis aos administrados, segundo a Lei nº 9.784/1999?',
    answer:'5 anos, contados da data em que os atos foram praticados, salvo comprovada má-fé do administrado, caso em que não há prazo.',
    hint:'5 anos para anular, salvo má-fé.',
    tags:['anulação','autotutela','prazo','má-fé'],
    source:'Lei nº 9.784/1999, art. 54',
    createdAt:TS, updatedAt:TS, _seedVersion:1
  },

  // ── Lei nº 8.429/1992 (redação original) ──────────────────────────────────
  {
    id:'card-lei8429-001', subjectId:'subj-legislacao', topicId:'top-lei-8429',
    question:'Quais são as três categorias de atos de improbidade na redação original da Lei nº 8.429/1992?',
    answer:'(1) Atos que importam enriquecimento ilícito (art. 9º); (2) Atos que causam prejuízo ao erário (art. 10); (3) Atos que atentam contra os princípios da Administração Pública (art. 11).',
    hint:'Enriquecimento / Dano ao erário / Violação de princípios.',
    tags:['improbidade','categorias','enriquecimento ilícito','erário'],
    source:'Lei nº 8.429/1992, arts. 9º, 10 e 11 (redação original)',
    createdAt:TS, updatedAt:TS, _seedVersion:1
  },
  {
    id:'card-lei8429-002', subjectId:'subj-legislacao', topicId:'top-lei-8429',
    question:'Quem pode ser sujeito ativo da improbidade administrativa na redação original da Lei nº 8.429/1992?',
    answer:'Qualquer agente público (servidor ou não, ainda que transitoriamente ou sem remuneração), além de particulares que induzam, concorram ou se beneficiem do ato ímprobo. "Agente público" é definido em sentido amplo.',
    hint:'Agente público amplo + particulares que concorrem ou se beneficiam.',
    tags:['sujeito ativo','agente público','particular'],
    source:'Lei nº 8.429/1992, arts. 1º, 2º e 3º (redação original)',
    createdAt:TS, updatedAt:TS, _seedVersion:1
  },
  {
    id:'card-lei8429-003', subjectId:'subj-legislacao', topicId:'top-lei-8429',
    question:'Quais sanções a redação original da Lei nº 8.429/1992 previa para atos de enriquecimento ilícito (art. 9º)?',
    answer:'Perda dos bens ou valores acrescidos ilicitamente; ressarcimento integral do dano (se houver); perda da função pública; suspensão dos direitos políticos por 8 a 10 anos; pagamento de multa civil de até 3 vezes o valor acrescido; proibição de contratar com o Poder Público por 10 anos.',
    hint:'Enriquecimento ilícito: suspensão política 8–10 anos e multa até 3× o valor.',
    tags:['sanções','enriquecimento ilícito','suspensão política','multa'],
    source:'Lei nº 8.429/1992, art. 12, I (redação original)',
    createdAt:TS, updatedAt:TS, _seedVersion:1
  },
  {
    id:'card-lei8429-004', subjectId:'subj-legislacao', topicId:'top-lei-8429',
    question:'Qual era o prazo prescricional das ações de improbidade na redação original da Lei nº 8.429/1992?',
    answer:'5 anos após o término do exercício do mandato, de cargo em comissão ou de função de confiança. Para servidores efetivos sem função de confiança, aplicava-se analogicamente a prescrição da lei específica ou o prazo de 5 anos. O STF considerou a ação de ressarcimento ao erário imprescritível (RE 852.475, Tema 897).',
    hint:'5 anos do fim do mandato ou da função. Ressarcimento = imprescritível (STF).',
    tags:['prescrição','improbidade','ressarcimento','imprescritível'],
    source:'Lei nº 8.429/1992, art. 23 (redação original); STF, RE 852.475',
    createdAt:TS, updatedAt:TS, _seedVersion:1
  },
  {
    id:'card-lei8429-005', subjectId:'subj-legislacao', topicId:'top-lei-8429',
    question:'Na redação original da Lei nº 8.429/1992, o art. 10 (atos que causam dano ao erário) admitia a modalidade culposa?',
    answer:'Sim. A redação original do art. 10 previa expressamente a modalidade culposa ("qualquer ação ou omissão, dolosa ou culposa"), o que foi suprimido pela Lei nº 14.230/2021, que passou a exigir dolo específico para qualquer modalidade de improbidade.',
    hint:'Art. 10 original: dolo OU culpa. Lei 14.230/2021: dolo específico apenas.',
    tags:['dolo','culpa','art. 10','improbidade'],
    source:'Lei nº 8.429/1992, art. 10 (redação original); Lei nº 14.230/2021',
    createdAt:TS, updatedAt:TS, _seedVersion:1
  },

  // ── Lei nº 14.230/2021 ─────────────────────────────────────────────────────
  {
    id:'card-lei14230-001', subjectId:'subj-legislacao', topicId:'top-lei-14230',
    question:'Qual a principal mudança da Lei nº 14.230/2021 quanto ao elemento subjetivo da improbidade administrativa?',
    answer:'Exige-se exclusivamente o dolo específico — a vontade livre e consciente de praticar o ato e alcançar o resultado ímprobo. A modalidade culposa foi eliminada de todas as categorias de improbidade.',
    hint:'Dolo específico obrigatório; culpa foi extinta.',
    tags:['dolo específico','elemento subjetivo','culpa','14.230/2021'],
    source:'Lei nº 14.230/2021, art. 1º, §§ 1º e 2º (nova redação da LIA)',
    createdAt:TS, updatedAt:TS, _seedVersion:1
  },
  {
    id:'card-lei14230-002', subjectId:'subj-legislacao', topicId:'top-lei-14230',
    question:'Qual é o novo prazo prescricional instituído pela Lei nº 14.230/2021 para a ação de improbidade?',
    answer:'8 anos contados da data do fato ou, em caso de infração permanente, da data em que cessou a permanência. A contagem anterior (a partir do fim do mandato) foi revogada.',
    hint:'8 anos do fato — não mais do fim do mandato.',
    tags:['prescrição','prazo','14.230/2021'],
    source:'Lei nº 14.230/2021, art. 23 (nova redação)',
    createdAt:TS, updatedAt:TS, _seedVersion:1
  },
  {
    id:'card-lei14230-003', subjectId:'subj-legislacao', topicId:'top-lei-14230',
    question:'O que é o Acordo de Não Persecução Cível (ANPC) e quem pode celebrá-lo?',
    answer:'É negócio jurídico processual celebrado entre o Ministério Público e o investigado (pessoa física ou jurídica), pelo qual o investigado reconhece o ato ímprobo, assume obrigações de reparação e/ou multa, e o MP não ajuíza ou desiste da ação. Depende de aprovação judicial e de prévia comunicação ao órgão de revisão do MP.',
    hint:'ANPC: MP + investigado, aprovação judicial obrigatória.',
    tags:['ANPC','acordo','Ministério Público','14.230/2021'],
    source:'Lei nº 14.230/2021, art. 17-B (inserido na LIA)',
    createdAt:TS, updatedAt:TS, _seedVersion:1
  },
  {
    id:'card-lei14230-004', subjectId:'subj-legislacao', topicId:'top-lei-14230',
    question:'Quem tem legitimidade ativa para propor a ação de improbidade administrativa após a Lei nº 14.230/2021?',
    answer:'Exclusivamente o Ministério Público. A legitimidade da pessoa jurídica lesada, antes prevista, foi suprimida. O MP atua como autor exclusivo.',
    hint:'Legitimidade exclusiva: MP. A pessoa jurídica lesada perdeu a legitimidade.',
    tags:['legitimidade','Ministério Público','ação de improbidade'],
    source:'Lei nº 14.230/2021, art. 17, caput (nova redação)',
    createdAt:TS, updatedAt:TS, _seedVersion:1
  },
  {
    id:'card-lei14230-005', subjectId:'subj-legislacao', topicId:'top-lei-14230',
    question:'O STF decidiu pela retroatividade das disposições mais benéficas da Lei nº 14.230/2021? Como?',
    answer:'Sim. No julgamento do Tema 1199 (ADIs 6.622, 7.236 e 7.237), o STF decidiu pela retroatividade das normas mais benéficas da Lei nº 14.230/2021, inclusive a exigência de dolo específico e o novo prazo prescricional, para ações em curso sem trânsito em julgado. As regras mais gravosas não retroagem.',
    hint:'Tema 1199 STF: retroatividade das normas benéficas, sem trânsito em julgado.',
    tags:['retroatividade','STF','Tema 1199','14.230/2021'],
    source:'STF, Tema 1199 (ADIs 6.622, 7.236 e 7.237)',
    createdAt:TS, updatedAt:TS, _seedVersion:1
  },

  // ── Lei nº 14.133/2021 ─────────────────────────────────────────────────────
  {
    id:'card-lei14133-001', subjectId:'subj-legislacao', topicId:'top-lei-14133',
    question:'Quais são as modalidades de licitação previstas na Lei nº 14.133/2021?',
    answer:'Pregão, Concorrência, Concurso, Leilão e Diálogo Competitivo (5 modalidades). Foram extintas a Tomada de Preços e o Convite, que existiam na Lei nº 8.666/1993.',
    hint:'5 modalidades; Tomada de Preços e Convite foram extintas.',
    tags:['modalidades','licitação','pregão','diálogo competitivo','14.133/2021'],
    source:'Lei nº 14.133/2021, art. 28',
    createdAt:TS, updatedAt:TS, _seedVersion:1
  },
  {
    id:'card-lei14133-002', subjectId:'subj-legislacao', topicId:'top-lei-14133',
    question:'O que é o Diálogo Competitivo e quando é aplicável?',
    answer:'Modalidade destinada a contratações em que a Administração precisa dialogar com licitantes previamente selecionados para desenvolver alternativas a necessidades complexas ou inovadoras. Aplica-se quando não existem soluções disponíveis no mercado ou quando a Administração não consegue definir técnica e especificações por si só. O diálogo é sigiloso.',
    hint:'Diálogo Competitivo = necessidade complexa/inovadora, solução a ser construída.',
    tags:['diálogo competitivo','inovação','modalidade','14.133/2021'],
    source:'Lei nº 14.133/2021, arts. 32–34',
    createdAt:TS, updatedAt:TS, _seedVersion:1
  },
  {
    id:'card-lei14133-003', subjectId:'subj-legislacao', topicId:'top-lei-14133',
    question:'O que é o Portal Nacional de Contratações Públicas (PNCP) e qual é seu papel?',
    answer:'Sítio eletrônico oficial para divulgação centralizada e obrigatória de todos os atos de licitações e contratos federais, estaduais e municipais. A publicação no PNCP substitui o Diário Oficial como condição de validade e eficácia. Devem ser publicados editais, contratos, atas, apostilas, relatórios e avisos de contratação direta.',
    hint:'PNCP substitui o Diário Oficial como condição de eficácia dos atos.',
    tags:['PNCP','publicidade','diário oficial','14.133/2021'],
    source:'Lei nº 14.133/2021, arts. 174–180',
    createdAt:TS, updatedAt:TS, _seedVersion:1
  },
  {
    id:'card-lei14133-004', subjectId:'subj-legislacao', topicId:'top-lei-14133',
    question:'Quais são os critérios de julgamento das propostas na Lei nº 14.133/2021?',
    answer:'Menor preço; Maior desconto; Melhor técnica ou conteúdo artístico; Técnica e preço; Maior lance (leilão); Maior retorno econômico. O último é novidade em relação à Lei nº 8.666/1993.',
    hint:'6 critérios; "maior retorno econômico" é novidade.',
    tags:['critério de julgamento','menor preço','técnica e preço','14.133/2021'],
    source:'Lei nº 14.133/2021, art. 33',
    createdAt:TS, updatedAt:TS, _seedVersion:1
  },
  {
    id:'card-lei14133-005', subjectId:'subj-legislacao', topicId:'top-lei-14133',
    question:'Qual é a regra geral de vigência dos contratos de serviços contínuos na Lei nº 14.133/2021 e quando é permitida prorrogação além de 5 anos?',
    answer:'Regra geral: até 5 anos para contratos de serviços e fornecimentos contínuos. Prorrogação além de 5 anos é admitida para serviços com regime de dedicação exclusiva de mão de obra ou fornecimento de equipamentos, desde que comprovada vantajosidade — podendo chegar a 10 anos.',
    hint:'5 anos como regra; até 10 anos com dedicação exclusiva e comprovação de vantagem.',
    tags:['vigência','contratos','serviços contínuos','prorrogação','14.133/2021'],
    source:'Lei nº 14.133/2021, arts. 106, 107 e 111',
    createdAt:TS, updatedAt:TS, _seedVersion:1
  },

  // ── Lei nº 13.709/2018 — LGPD ─────────────────────────────────────────────
  {
    id:'card-lei13709-001', subjectId:'subj-legislacao', topicId:'top-lei-13709',
    question:'Quais são as 10 bases legais para tratamento de dados pessoais previstas no art. 7º da LGPD?',
    answer:'(1) Consentimento; (2) Cumprimento de obrigação legal ou regulatória; (3) Execução de políticas públicas pela Administração; (4) Estudos por órgão de pesquisa; (5) Execução de contrato ou procedimentos pré-contratuais; (6) Exercício regular de direitos em processo judicial/administrativo/arbitral; (7) Proteção da vida ou incolumidade física; (8) Tutela da saúde; (9) Interesse legítimo do controlador; (10) Proteção ao crédito.',
    hint:'São 10 bases — consentimento é apenas uma delas.',
    tags:['bases legais','consentimento','tratamento de dados','LGPD'],
    source:'Lei nº 13.709/2018, art. 7º',
    createdAt:TS, updatedAt:TS, _seedVersion:1
  },
  {
    id:'card-lei13709-002', subjectId:'subj-legislacao', topicId:'top-lei-13709',
    question:'Quais são os direitos do titular de dados pessoais previstos no art. 18 da LGPD?',
    answer:'Confirmação da existência de tratamento; acesso; correção de dados incompletos/inexatos; anonimização, bloqueio ou eliminação de dados desnecessários; portabilidade; informação sobre compartilhamento; informação sobre recusa de consentimento e consequências; revogação do consentimento; revisão de decisões automatizadas; petição à ANPD.',
    hint:'9 direitos: confirmação, acesso, correção, eliminação, portabilidade, informação (2×), revogação, revisão, petição.',
    tags:['direitos do titular','LGPD','portabilidade','consentimento'],
    source:'Lei nº 13.709/2018, art. 18',
    createdAt:TS, updatedAt:TS, _seedVersion:1
  },
  {
    id:'card-lei13709-003', subjectId:'subj-legislacao', topicId:'top-lei-13709',
    question:'O que são dados pessoais sensíveis na LGPD e qual o tratamento diferenciado que recebem?',
    answer:'São dados sobre: origem racial/étnica, convicção religiosa, opinião política, filiação a organização sindical, religiosa, filosófica ou política; dados de saúde ou vida sexual; dados genéticos ou biométricos quando vinculados a pessoa natural. Recebem tratamento mais restrito: as hipóteses do art. 11 são mais limitadas e exigem, em regra, consentimento específico e destacado ou obrigação legal/regulatória.',
    hint:'Sensíveis: saúde, etnia, religião, genética, biometria — regras mais restritas (art. 11).',
    tags:['dados sensíveis','biometria','saúde','LGPD'],
    source:'Lei nº 13.709/2018, arts. 5º, II e 11',
    createdAt:TS, updatedAt:TS, _seedVersion:1
  },
  {
    id:'card-lei13709-004', subjectId:'subj-legislacao', topicId:'top-lei-13709',
    question:'Qual é a natureza jurídica e as competências principais da ANPD?',
    answer:'Autarquia especial, com independência técnica, administrativa e financeira. Compete à ANPD: zelar pela proteção de dados; editar normas e regulamentos; fiscalizar e aplicar sanções; promover a Política Nacional de Proteção de Dados; elaborar estudos; articular com autoridades de outros países; estimular padrões de interoperabilidade.',
    hint:'ANPD: autarquia especial — regula, fiscaliza e sanciona.',
    tags:['ANPD','fiscalização','sanções','autarquia','LGPD'],
    source:'Lei nº 13.709/2018, arts. 5º, XIX e 55-A a 55-L',
    createdAt:TS, updatedAt:TS, _seedVersion:1
  },
  {
    id:'card-lei13709-005', subjectId:'subj-legislacao', topicId:'top-lei-13709',
    question:'Quais são as atribuições mínimas do encarregado de proteção de dados (DPO) na LGPD?',
    answer:'Aceitar reclamações e comunicações dos titulares; prestar esclarecimentos e adotar providências; receber comunicações da ANPD; orientar os funcionários do controlador; executar demais atribuições do controlador ou de normas complementares. O encarregado atua como canal entre controlador, titulares e ANPD.',
    hint:'DPO = canal controlador ↔ titulares ↔ ANPD.',
    tags:['DPO','encarregado','LGPD','canal de comunicação'],
    source:'Lei nº 13.709/2018, art. 41',
    createdAt:TS, updatedAt:TS, _seedVersion:1
  },

  // ── Lei nº 13.146/2015 — EPD ──────────────────────────────────────────────
  {
    id:'card-lei13146-001', subjectId:'subj-legislacao', topicId:'top-lei-13146',
    question:'Qual é o modelo de deficiência adotado pela Lei nº 13.146/2015 e como define pessoa com deficiência?',
    answer:'Adota o modelo social: pessoa com deficiência é aquela que tem impedimento de longo prazo de natureza física, mental, intelectual ou sensorial, o qual, em interação com barreiras, pode obstruir sua participação plena e efetiva na sociedade em igualdade de condições. A deficiência resulta da interação entre o indivíduo e o ambiente.',
    hint:'Modelo social: deficiência = impedimento + barreiras do ambiente.',
    tags:['modelo social','deficiência','EPD','13.146/2015'],
    source:'Lei nº 13.146/2015, art. 2º; Convenção de Nova York (Decreto nº 6.949/2009)',
    createdAt:TS, updatedAt:TS, _seedVersion:1
  },
  {
    id:'card-lei13146-002', subjectId:'subj-legislacao', topicId:'top-lei-13146',
    question:'Como a Lei nº 13.146/2015 alterou as regras de capacidade civil do Código Civil?',
    answer:'Revogou as hipóteses de incapacidade absoluta (art. 3º do CC) que incluíam pessoas com deficiência mental ou que não conseguiam exprimir vontade. Todas as pessoas com deficiência passaram a ter capacidade legal plena. A curatela foi restringida a medida excepcional para atos patrimoniais e negociais, não abrangendo direitos existenciais (casamento, voto, trabalho, reprodução, sexualidade).',
    hint:'Capacidade plena para todos. Curatela: só atos patrimoniais, não direitos existenciais.',
    tags:['capacidade civil','curatela','Código Civil','EPD'],
    source:'Lei nº 13.146/2015, arts. 84, 85 e 114 (alterações no CC)',
    createdAt:TS, updatedAt:TS, _seedVersion:1
  },
  {
    id:'card-lei13146-003', subjectId:'subj-legislacao', topicId:'top-lei-13146',
    question:'O que é a Tomada de Decisão Apoiada (TDA) e como se distingue da curatela?',
    answer:'A TDA é o processo pelo qual a pessoa com deficiência elege ao menos 2 pessoas idôneas para prestar-lhe apoio na tomada de decisões sobre atos da vida civil. Os apoiadores fornecem informações e elementos, mas a decisão final é sempre da própria pessoa. Diferencia-se da curatela porque não há substituição da vontade — o curador decide em lugar do curatelado.',
    hint:'TDA: a pessoa decide, com apoio. Curatela: o curador decide no lugar.',
    tags:['TDA','tomada de decisão apoiada','curatela','EPD'],
    source:'Lei nº 13.146/2015, art. 116 (inseriu art. 1.783-A no CC)',
    createdAt:TS, updatedAt:TS, _seedVersion:1
  },
  {
    id:'card-lei13146-004', subjectId:'subj-legislacao', topicId:'top-lei-13146',
    question:'Como a Lei nº 13.146/2015 define acessibilidade?',
    answer:'Possibilidade e condição de alcance para utilização, com segurança e autonomia, de espaços, mobiliários, equipamentos, edificações, transportes, informação, comunicação e outros serviços e instalações abertos ao público, de uso público ou privados de uso coletivo, na zona urbana e rural, por pessoa com deficiência ou com mobilidade reduzida.',
    hint:'Alcance com segurança e autonomia para todos os espaços e serviços — urbano e rural.',
    tags:['acessibilidade','autonomia','EPD','13.146/2015'],
    source:'Lei nº 13.146/2015, art. 3º, I',
    createdAt:TS, updatedAt:TS, _seedVersion:1
  },
  {
    id:'card-lei13146-005', subjectId:'subj-legislacao', topicId:'top-lei-13146',
    question:'O que configura discriminação em razão de deficiência, segundo a Lei nº 13.146/2015?',
    answer:'Toda forma de distinção, restrição ou exclusão baseada na deficiência que impeça ou anule o reconhecimento, o gozo ou o exercício de direitos e liberdades fundamentais. Inclui a recusa em oferecer adaptação razoável. A discriminação pode ser direta (ação explícita) ou indireta (critérios aparentemente neutros que prejudicam desproporcionalmente pessoas com deficiência).',
    hint:'Discriminação direta + indireta; recusa de adaptação razoável também é discriminação.',
    tags:['discriminação','adaptação razoável','EPD','13.146/2015'],
    source:'Lei nº 13.146/2015, arts. 4º e 3º, IV',
    createdAt:TS, updatedAt:TS, _seedVersion:1
  },

  // ── Regimento Interno TRT-4 ────────────────────────────────────────────────
  // NOTA: Cards baseados na estrutura normativa geral dos TRTs (CLT/CF/88).
  // Provisões específicas do Regimento Interno devem ser verificadas no texto
  // oficial vigente disponível em https://www.trt4.jus.br
  {
    id:'card-regtrt4-001', subjectId:'subj-legislacao', topicId:'top-regimento-trt4',
    question:'Qual é a área de jurisdição do TRT da 4ª Região e em que base normativa se fundamenta?',
    answer:'O TRT da 4ª Região tem jurisdição sobre o estado do Rio Grande do Sul. Sua criação se fundamenta na estrutura da Justiça do Trabalho prevista na CF/88 (art. 111-A) e na CLT. O regimento interno detalha a organização interna, a distribuição de competências entre turmas e as normas de funcionamento dos serviços judiciários.',
    hint:'Jurisdição: Rio Grande do Sul. Verifique a composição atual no regimento vigente.',
    tags:['TRT-4','jurisdição','Rio Grande do Sul','regimento interno'],
    source:'CF/88, art. 111-A; CLT, arts. 670 e ss.; Regimento Interno TRT-4 (trt4.jus.br)',
    createdAt:TS, updatedAt:TS, _seedVersion:1
  },
  {
    id:'card-regtrt4-002', subjectId:'subj-legislacao', topicId:'top-regimento-trt4',
    question:'Quais são os órgãos colegiados típicos de um Tribunal Regional do Trabalho previstos na CLT e nos regimentos internos?',
    answer:'Tribunal Pleno (ou Tribunal Pleno e Órgão Especial, conforme o porte); Turmas (para julgamento de recursos ordinários, de revista e agravos); Seção Especializada em Dissídios Coletivos (SDC); Seção Especializada em Dissídios Individuais (SDI), quando houver. A composição exata e o número de turmas do TRT-4 constam do seu Regimento Interno vigente.',
    hint:'Pleno, Turmas, SDC, SDI — composição exata: verificar regimento TRT-4.',
    tags:['órgãos colegiados','turmas','SDC','SDI','regimento interno'],
    source:'CLT, arts. 670–682; Regimento Interno TRT-4 (trt4.jus.br)',
    createdAt:TS, updatedAt:TS, _seedVersion:1
  },
  {
    id:'card-regtrt4-003', subjectId:'subj-legislacao', topicId:'top-regimento-trt4',
    question:'Qual é a competência originária do TRT da 4ª Região para julgamento de dissídios coletivos?',
    answer:'Conciliar e julgar os dissídios coletivos de trabalho (de natureza econômica ou jurídica) cuja base territorial esteja compreendida na sua jurisdição (Rio Grande do Sul). Inclui também a revisão de sentenças normativas em dissídios coletivos. O procedimento está previsto na CLT (arts. 856–875) e regulamentado no regimento interno.',
    hint:'Dissídios coletivos do RS = competência originária do TRT-4.',
    tags:['dissídio coletivo','competência originária','TRT-4'],
    source:'CF/88, art. 114, §§ 1º e 2º; CLT, art. 856; Regimento Interno TRT-4',
    createdAt:TS, updatedAt:TS, _seedVersion:1
  },
  {
    id:'card-regtrt4-004', subjectId:'subj-legislacao', topicId:'top-regimento-trt4',
    question:'Como o Regimento Interno do TRT-4 regula a distribuição de processos entre as turmas?',
    answer:'[VERIFICAR OFICIAL] A distribuição de processos entre as turmas segue critérios de aleatoriedade e equilíbrio de acervo, conforme normas do CNJ e do próprio regimento. Os processos são distribuídos eletronicamente pelo sistema PJe. Consulte o Regimento Interno vigente do TRT-4 em trt4.jus.br para os critérios específicos e as competências de cada turma.',
    hint:'Distribuição aleatória via PJe. Detalhes das turmas: verificar regimento vigente.',
    tags:['distribuição','turmas','PJe','regimento interno','TRT-4'],
    source:'Regimento Interno TRT-4 — verificar versão vigente em trt4.jus.br',
    createdAt:TS, updatedAt:TS, _seedVersion:1
  },
  {
    id:'card-regtrt4-005', subjectId:'subj-legislacao', topicId:'top-regimento-trt4',
    question:'Qual é o papel da Presidência do TRT da 4ª Região segundo a CLT e os regimentos internos dos TRTs?',
    answer:'A Presidência dirige os trabalhos administrativos e judiciários do Tribunal, representa-o institucionalmente, preside as sessões do Pleno, despacha atos administrativos de gestão, superintende os serviços auxiliares, e tem competências monocráticas para liminares e tutelas de urgência previstas no regimento. O cargo é ocupado por desembargador eleito pelo Pleno. Detalhes: verificar o Regimento Interno vigente.',
    hint:'Presidência: direção administrativa e judiciária, representação institucional.',
    tags:['presidência','TRT-4','regimento interno','desembargador'],
    source:'CLT, arts. 670 e ss.; Regimento Interno TRT-4 (trt4.jus.br)',
    createdAt:TS, updatedAt:TS, _seedVersion:1
  },

  // ── Resolução CNJ nº 400/2021 ─────────────────────────────────────────────
  // NOTA: A Resolução CNJ nº 400/2021 deve ser verificada no portal do CNJ
  // (https://atos.cnj.jus.br) para confirmar ementa, artigos e vigência.
  // Os cards abaixo contextualizam o papel do CNJ e o tema da resolução.
  {
    id:'card-cnj400-001', subjectId:'subj-legislacao', topicId:'top-res-cnj-400',
    question:'Qual é o papel do Conselho Nacional de Justiça (CNJ) no sistema judiciário e que tipo de ato normativo são as Resoluções CNJ?',
    answer:'O CNJ é órgão de controle administrativo e financeiro do Poder Judiciário (CF/88, art. 103-B). Suas Resoluções têm caráter normativo-geral, vinculando todos os tribunais nacionais. Elas regulam temas como gestão documental, sustentabilidade, dados abertos, fluxo de processos e política judiciária, com observância obrigatória pelos tribunais.',
    hint:'CNJ: órgão de controle do Judiciário; Resoluções = vinculantes para todos os tribunais.',
    tags:['CNJ','resolução','controle do judiciário','CF/88'],
    source:'CF/88, art. 103-B; Lei nº 11.364/2006; portal atos.cnj.jus.br',
    createdAt:TS, updatedAt:TS, _seedVersion:1
  },
  {
    id:'card-cnj400-002', subjectId:'subj-legislacao', topicId:'top-res-cnj-400',
    question:'O que trata a Resolução CNJ nº 400/2021? [VERIFICAR OFICIAL]',
    answer:'[VERIFICAR OFICIAL] A Resolução CNJ nº 400/2021 deve ser consultada diretamente em atos.cnj.jus.br para confirmação de sua ementa e conteúdo vigente. O estudo de resoluções do CNJ exige leitura do texto oficial para evitar confusão entre números de resoluções que podem ter sido renumeradas, alteradas ou revogadas após publicação.',
    hint:'Consulte atos.cnj.jus.br: buscar "Resolução 400/2021" para ementa e texto vigente.',
    tags:['CNJ','400/2021','verificar oficial'],
    source:'Verificar em: https://atos.cnj.jus.br/atos/detalhar/3774 (confirmar numeração)',
    createdAt:TS, updatedAt:TS, _seedVersion:1
  },
  {
    id:'card-cnj400-003', subjectId:'subj-legislacao', topicId:'top-res-cnj-400',
    question:'Quais são os temas geralmente regulados pelo CNJ por meio de resoluções no âmbito da gestão judiciária?',
    answer:'Gestão de pessoas e quadro de servidores; política documental e descarte de autos; dados abertos e transparência; metas anuais de produtividade; sustentabilidade ambiental; tecnologia da informação e modernização; conciliação e mediação; atenção prioritária ao 1º grau; controle de nepotismo; e padronização de procedimentos. Cada resolução aborda um tema específico.',
    hint:'Temas típicos de resoluções CNJ: gestão, transparência, TI, conciliação, metas.',
    tags:['CNJ','gestão judiciária','resoluções','temas'],
    source:'Portal CNJ — atos.cnj.jus.br',
    createdAt:TS, updatedAt:TS, _seedVersion:1
  },
  {
    id:'card-cnj400-004', subjectId:'subj-legislacao', topicId:'top-res-cnj-400',
    question:'Como o candidato deve estudar Resoluções CNJ em concursos para o Judiciário?',
    answer:'Leia o texto oficial completo da resolução indicada no edital (disponível em atos.cnj.jus.br). Identifique: (1) o problema regulado; (2) as obrigações impostas aos tribunais; (3) os prazos e os responsáveis; (4) eventuais sanções ou consequências pelo descumprimento. Fique atento a atualizações e resoluções que possam ter alterado o texto original.',
    hint:'Estudo de resolução CNJ: texto oficial completo + obrigações + prazos + responsáveis.',
    tags:['metodologia','estudo','concurso','CNJ'],
    source:'Recomendação de estudo — verificar edital oficial do TRT-4',
    createdAt:TS, updatedAt:TS, _seedVersion:1
  },
  {
    id:'card-cnj400-005', subjectId:'subj-legislacao', topicId:'top-res-cnj-400',
    question:'Qual a diferença entre Resolução, Instrução Normativa e Portaria do CNJ?',
    answer:'Resolução: ato normativo de maior hierarquia no CNJ, de caráter geral e vinculante para todos os tribunais — aprovada pelo Plenário do CNJ. Instrução Normativa: regulamenta resolução específica com detalhes operacionais. Portaria: ato administrativo interno do CNJ, normalmente de caráter específico ou organizacional, de menor alcance normativo.',
    hint:'Resolução (vinculante, geral) > Instrução Normativa (operacional) > Portaria (interna).',
    tags:['CNJ','resolução','instrução normativa','portaria','hierarquia normativa'],
    source:'Regimento Interno do CNJ; CF/88, art. 103-B',
    createdAt:TS, updatedAt:TS, _seedVersion:1
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// SEED IDEMPOTENTE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Popula subjects e topics via put (upsert total — idempotente).
 * Popula cards via put com skipExisting:true — não sobrescreve
 * cards já existentes (protege edições personalizadas do usuário).
 *
 * @param {IDBDatabase} db
 * @returns {Promise<{ subjects: number, topics: number, cards: number }>}
 */
export async function seedDatabase(db) {
  let subjCount = 0, topicCount = 0, cardCount = 0;

  for (const subj of SEED_SUBJECTS) {
    await upsert(db, 'subjects', subj);
    subjCount++;
  }
  for (const topic of SEED_TOPICS) {
    await upsert(db, 'topics', topic);
    topicCount++;
  }
  for (const card of SEED_CARDS) {
    // skipExisting:true — não sobrescreve alteração do usuário
    const result = await upsert(db, 'cards', card, { skipExisting: true });
    if (result !== null) cardCount++;
  }

  console.info(`[StudySeed] Seed concluído: ${subjCount} matérias, ${topicCount} assuntos, ${cardCount} cards inseridos.`);
  return { subjects: subjCount, topics: topicCount, cards: cardCount };
}
