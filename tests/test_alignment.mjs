import assert from 'node:assert/strict';
import { alignTranscript, tokenized, closeEnough, calculateSemanticOverlap } from '../alignment.js';

const cases = [
  { name: 'prefixo simples', r: 'o cuidado é uma necessidade humana', s: 'o cuidado é uma', index: 3, matches: 4 },
  { name: 'acentuação e case', r: 'Gênero e autonomia econômica', s: 'GENERO E AUTONOMIA ECONOMICA', index: 3, matches: 4 },
  { name: 'omissões', r: 'o cuidado não é apenas uma tarefa privada', s: 'o cuidado é uma tarefa', index: 6, matches: 5 },
  { name: 'palavras repetidas', r: 'cuidado trabalho cuidado trabalho conclusão', s: 'cuidado trabalho', index: 1, matches: 2 },
  { name: 'longos saltos', r: 'cuidado trabalho igualdade trabalho cuidado sistema lei social', s: 'cuidado trabalho', index: 1, matches: 2 },
  { name: 'fala extra', r: 'o cuidado é importante para todos', s: 'então o cuidado é importante', index: 3, matches: 4 },
  { name: 'variação pequena', r: 'reconhecimento econômico e social', s: 'reconhecimeto economico e social', index: 3, matches: 4 },
];

for (const c of cases) {
  const out = alignTranscript(tokenized(c.r), tokenized(c.s));
  assert.equal(out.current, Math.min(tokenized(c.r).length - 1, c.index + 1));
  assert.ok(out.words >= c.matches - 1, c.name);
  console.log('PASS', c.name, out.progress, out.words);
}

// 1. Teste de correspondência integral
const full = alignTranscript(
  tokenized('Um trabalho de cuidado desigual e persistente.'),
  tokenized('Um trabalho de cuidado desigual e persistente.')
);
assert.equal(full.progress, 100);
assert.equal(full.words, 7);
assert.equal(full.skipped.size, 0);
assert.ok(full.finalScore >= 95, 'Score deve ser excelente');
console.log('PASS correspondência integral: score', full.finalScore);

// 2. Teste de detecção de palavra/trecho omitido (pulado)
// Exemplo: O usuário fala o início e pula "desigual e persistente" falando algo bem à frente
const omissionTest = alignTranscript(
  tokenized('A divisão sexual do trabalho doméstico gera desigualdade estrutural e sobrecarga histórica para as mulheres.'),
  tokenized('A divisão sexual gera sobrecarga histórica para as mulheres.')
);
assert.ok(omissionTest.skipped.size > 0, 'Deve identificar palavras omitidas no trecho pulado');
console.log('PASS detecção de omissão real: palavras puladas =', omissionTest.skipped.size);

// 3. Teste de tolerância temporal / hesitação (não marcar em vermelho imediatamente)
const hesitationTest = alignTranscript(
  tokenized('O reconhecimento do cuidado é indispensável.'),
  tokenized('O reconhecimento')
);
assert.equal(hesitationTest.skipped.size, 0, 'Micro-hesitação ou parada no início não deve marcar omissão confirmada');
console.log('PASS tolerância a hesitação: omissões confirmadas =', hesitationTest.skipped.size);

// 4. Teste de aceitação por equivalência semântica e sinônimos jurídicos
const synCheck = closeEnough('cuidado', 'zelo');
assert.ok(synCheck >= 2, 'Sinônimo cuidado -> zelo deve ser aceito');

const semanticParaphrase = alignTranscript(
  tokenized('A distribuição desigual do cuidado é resultado da divisão sexual do trabalho.'),
  tokenized('A partilha assimétrica do trabalho de cuidado decorre da separação de funções entre homens e mulheres.')
);
assert.ok(semanticParaphrase.semanticScore > 40, 'Deve capturar overlap semântico em paráfrases');
assert.ok(semanticParaphrase.finalScore > 35, 'Score deve refletir aderência semântica');
console.log('PASS equivalência semântica: overlap =', semanticParaphrase.semanticScore, 'score =', semanticParaphrase.finalScore);

console.log('Todos os testes de alinhamento, omissão e semântica executados com sucesso!');
