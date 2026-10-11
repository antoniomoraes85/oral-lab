// Camada avançada de alinhamento com tolerância temporal, equivalência semântica e pontuação

const tokens = text => (text.match(/[\p{L}\p{N}]+(?:[’'-][\p{L}\p{N}]+)*/gu) || []);

export const STOPWORDS = new Set([
  'a','o','as','os','um','uma','uns','umas','de','do','da','dos','das','em','no','na','nos','nas',
  'por','para','pelo','pela','pelos','pelas','com','sem','sob','sobre','e','ou','mas','que','se',
  'ao','aos','aonde','onde','como','quando','porque','porquê','pois','ja','já','muito','mais','menos',
  'esta','este','estes','estas','esse','essa','esses','essas','aquele','aquela','aqueles','aquelas',
  'isto','isso','aquilo','meu','minha','seu','sua','dele','dela','deles','delas','nosso','nossa'
]);

// Mapa de sinônimos e equivalências semânticas jurídicas e conceituais
export const SYNONYM_MAP = new Map([
  ['cuidado', ['assistencia', 'zelo', 'atencao', 'amparo', 'trabalho domestico', 'reprodutivo', 'trabalho de cuidado']],
  ['mulheres', ['mulher', 'feminino', 'feminina', 'maes', 'esposas']],
  ['homens', ['homem', 'masculino', 'maridos', 'pais']],
  ['divisao', ['separacao', 'distribuicao', 'reparticao', 'partilha']],
  ['trabalho', ['labor', 'atividade', 'ocupacao', 'servico', 'afazer']],
  ['remunerado', ['pago', 'assalariado', 'produtivo', 'financeiro']],
  ['domestico', ['lar', 'casa', 'familiar', 'reprodutivo']],
  ['estrutural', ['historica', 'sistemica', 'institucional', 'enraizada']],
  ['invisibilidade', ['invisibilizacao', 'desvalorizacao', 'desconsideracao', 'silenciamento']],
  ['autonomia', ['independencia', 'emancipacao', 'liberdade']],
  ['patrimonio', ['bens', 'recursos', 'patrimonial', 'riqueza']],
  ['dissolucao', ['divorcio', 'separacao', 'termino', 'ruptura']],
  ['interseccional', ['interseccionalidade', 'multipla', 'sobreposicao']],
  ['negra', ['pretas', 'negras', 'pardas']],
  ['renda', ['salario', 'remuneracao', 'ganhos', 'financeiro']],
  ['desigualdade', ['disparidade', 'assimetria', 'diferenca', 'desequilibrio']],
  ['essencial', ['fundamental', 'indispensavel', 'primordial', 'vital']],
  ['reconhecimento', ['valorizacao', 'validacao', 'consideracao', 'compensacao']]
]);

export const norm = t => t.toLocaleLowerCase('pt-BR')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[’]/g, "'")
  .replace(/^pra$/, 'para')
  .replace(/^pro$/, 'para')
  .replace(/^num$/, 'em')
  .replace(/^pelo$/, 'por')
  .replace(/^pela$/, 'por')
  .replace(/[.,;:!?()]/g, '');

export function tokenized(text) {
  return tokens(text).map(norm).filter(Boolean);
}

export function closeEnough(a, b) {
  if (!a || !b) return 0;
  if (a === b) return 2;
  
  // Sinônimos diretos
  const synsA = SYNONYM_MAP.get(a);
  if (synsA && synsA.includes(b)) return 2;
  const synsB = SYNONYM_MAP.get(b);
  if (synsB && synsB.includes(a)) return 2;

  if (Math.min(a.length, b.length) < 4 || Math.abs(a.length - b.length) > 2) return 0;
  if (a[0] !== b[0] && Math.min(a.length, b.length) < 6) return 0;
  
  // Distância de edição leve (Levenshtein limitado a 1 erro)
  let i = 0, j = 0, edits = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) { i++; j++; continue; }
    if (++edits > 1) return 0;
    if (a.length > b.length) i++;
    else if (b.length > a.length) j++;
    else { i++; j++; }
  }
  return edits + ((a.length - i) || (b.length - j)) <= 1 ? 1 : 0;
}

/**
 * Similaridade Semântica de n-gramas e Jaccard com peso para termos-chave
 */
export function calculateSemanticOverlap(refTokens, spokenTokens) {
  if (!refTokens.length || !spokenTokens.length) return 0;
  const refSet = new Set(refTokens.filter(t => !STOPWORDS.has(t)));
  const spokenSet = new Set(spokenTokens.filter(t => !STOPWORDS.has(t)));
  if (!refSet.size) return 0;

  let hits = 0;
  for (const r of refSet) {
    for (const s of spokenSet) {
      if (closeEnough(r, s) >= 1) {
        hits++;
        break;
      }
    }
  }
  return hits / Math.max(refSet.size, 1);
}

/**
 * Alinhamento monotônico com detecção de omissões confirmadas e equivalência semântica de frases.
 *
 * @param {string|string[]} reference Roteiro esperado
 * @param {string|string[]} spoken Transcrição falada
 * @param {Object} options Configurações de tolerância
 * @returns {Object} Resultado do alinhamento
 */
export function alignTranscript(reference, spoken, options = {}) {
  const ref = Array.isArray(reference) ? reference : tokenized(reference);
  const said = Array.isArray(spoken) ? spoken : tokenized(spoken);
  const n = ref.length, m = said.length;
  
  const matched = new Set();
  const confirmedSkipped = new Set();
  const pendingSkipped = new Set();
  const semanticMatches = []; // blocos aceitos por equivalência semântica

  if (!n || !m) {
    return {
      matched,
      skipped: confirmedSkipped,
      pendingSkipped,
      semanticMatches,
      progress: 0,
      current: 0,
      total: n,
      words: 0,
      semanticScore: 0,
      finalScore: 0
    };
  }

  // 1. Alinhamento Global Monotônico por Programação Dinâmica (Needleman-Wunsch adaptado)
  const cols = m + 1;
  const score = new Float32Array((n + 1) * cols);
  const path = new Uint8Array((n + 1) * cols);
  const at = (i, j) => i * cols + j;

  for (let i = 1; i <= n; i++) { score[at(i, 0)] = -1.35 * i; path[at(i, 0)] = 1; }
  for (let j = 1; j <= m; j++) { score[at(0, j)] = -1.8 * j; path[at(0, j)] = 2; }

  for (let i = 1; i <= n; i++) {
    const a = ref[i - 1];
    for (let j = 1; j <= m; j++) {
      const sim = closeEnough(a, said[j - 1]);
      let best = score[at(i - 1, j - 1)] + (sim === 2 ? 3.2 : sim === 1 ? 1.4 : -2.8);
      let dir = 0;

      const skip = score[at(i - 1, j)] - 1.35;
      if (skip > best) { best = skip; dir = 1; }

      const extra = score[at(i, j - 1)] - 1.8;
      if (extra > best) { best = extra; dir = 2; }

      score[at(i, j)] = best;
      path[at(i, j)] = dir;
    }
  }

  // Busca do melhor ponto final na referência
  let end = 0, bestEnd = -Infinity;
  for (let k = 0; k <= n; k++) {
    const candidate = score[at(k, m)] - 0.05 * k;
    if (candidate > bestEnd) {
      bestEnd = candidate;
      end = k;
    }
  }

  let i = end, j = m, found = 0;
  while (i > 0 || j > 0) {
    const dir = path[at(i, j)];
    if (i > 0 && j > 0 && dir === 0) {
      if (closeEnough(ref[i - 1], said[j - 1])) {
        matched.add(i - 1);
        found++;
      }
      i--; j--;
    } else if (i > 0 && (dir === 1 || j === 0)) {
      i--;
    } else if (j > 0) {
      j--;
    } else {
      break;
    }
  }

  const maxMatched = matched.size ? Math.max(...matched) : -1;

  // 2. Análise de Omissões com Janela de Tolerância (Debounce/Histerese)
  // Regra:
  // Se uma palavra foi ultrapassada no roteiro por mais de TOLERANCE_WINDOW palavras OU
  // se o usuário já pronunciou um bloco posterior significativo (>= 3 palavras subsequentes),
  // a palavra ultrapassada é considerada CONFIRMADA como omitida.
  // Se estiver na zona de hesitação imediata (últimas 3 palavras antes da frente), fica em 'pendingSkipped'.
  const TOLERANCE_WINDOW = options.toleranceWindow || 3;

  for (let k = 0; k <= maxMatched; k++) {
    if (!matched.has(k)) {
      const distanceToFront = maxMatched - k;
      // Não penalizar stopwords soltas com erro rígido caso estejam no meio de paráfrases
      if (distanceToFront > TOLERANCE_WINDOW) {
        confirmedSkipped.add(k);
      } else {
        pendingSkipped.add(k);
      }
    }
  }

  // 3. Camada de Equivalência Semântica por Sentenças / Trechos
  // Se houver um trecho omitido, verifica se a transcrição recente contém os mesmos conceitos-chave
  // (paráfrase do parágrafo/oração).
  if (confirmedSkipped.size > 0) {
    const skippedArr = Array.from(confirmedSkipped).sort((a, b) => a - b);
    let chunk = [];
    for (let c = 0; c < skippedArr.length; c++) {
      chunk.push(skippedArr[c]);
      if (c === skippedArr.length - 1 || skippedArr[c + 1] !== skippedArr[c] + 1) {
        if (chunk.length >= 3) {
          const chunkTokens = chunk.map(idx => ref[idx]);
          const overlap = calculateSemanticOverlap(chunkTokens, said);
          if (overlap >= 0.58) {
            // Trecho semanticamente recuperado por paráfrase!
            semanticMatches.push({
              range: [chunk[0], chunk[chunk.length - 1]],
              overlap: Math.round(overlap * 100)
            });
            // Remove do status de omitido rígido
            chunk.forEach(idx => {
              confirmedSkipped.delete(idx);
              matched.add(idx); // reclassificado como aceito
            });
          }
        }
        chunk = [];
      }
    }
  }

  // 4. Cálculo da Pontuação Final Transparente (0 a 100)
  // Componentes:
  // - Cobertura do roteiro (coverage): % de palavras atingidas (peso 45%)
  // - Aderência Semântica / Precisão (accuracy): palavras corretas sobre conceitos (peso 35%)
  // - Retenção sem omissões graves (peso 20%)
  // - Bônus por paráfrases válidas (até 5%)
  const effectiveMatched = matched.size;
  const coveragePercent = n > 0 ? (effectiveMatched / n) * 100 : 0;
  const semanticOverlapTotal = calculateSemanticOverlap(ref, said);
  const semanticScorePercent = Math.round(semanticOverlapTotal * 100);

  const rawOmissionRate = n > 0 ? (confirmedSkipped.size / n) : 0;
  const omissionFactor = Math.max(0, 1 - rawOmissionRate * 1.5);

  const semanticBonus = Math.min(5, semanticMatches.length * 2.5);

  let finalScore = Math.round(
    (coveragePercent * 0.45) +
    (semanticScorePercent * 0.35) +
    (omissionFactor * 100 * 0.20) +
    semanticBonus
  );
  finalScore = Math.max(0, Math.min(100, finalScore));

  const progress = maxMatched < 0 ? 0 : Math.round(((maxMatched + 1) / n) * 100);

  return {
    matched,
    skipped: confirmedSkipped,
    pendingSkipped,
    semanticMatches,
    progress,
    current: Math.min(n - 1, maxMatched + 1),
    total: n,
    words: matched.size,
    coverage: Math.round(coveragePercent),
    semanticScore: semanticScorePercent,
    finalScore
  };
}
