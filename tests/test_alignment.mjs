import assert from 'node:assert/strict';
import {alignTranscript,tokenized} from '../alignment.js';
const cases=[
  {name:'prefixo simples',r:'o cuidado é uma necessidade humana',s:'o cuidado é uma',index:3,matches:4},
  {name:'acentuação e case',r:'Gênero e autonomia econômica',s:'GENERO E AUTONOMIA ECONOMICA',index:3,matches:4},
  {name:'omissões',r:'o cuidado não é apenas uma tarefa privada',s:'o cuidado é uma tarefa',index:6,matches:5},
  {name:'palavras repetidas',r:'cuidado trabalho cuidado trabalho conclusão',s:'cuidado trabalho',index:1,matches:2},
  {name:'longos saltos',r:'cuidado trabalho igualdade trabalho cuidado sistema lei social',s:'cuidado trabalho',index:1,matches:2},
  {name:'fala extra',r:'o cuidado é importante para todos',s:'então o cuidado é importante',index:3,matches:4},
  {name:'variação pequena',r:'reconhecimento econômico e social',s:'reconhecimeto economico e social',index:3,matches:4},
];
for (const c of cases){const out=alignTranscript(tokenized(c.r),tokenized(c.s));assert.equal(out.current,Math.min(tokenized(c.r).length-1,c.index+1),JSON.stringify({case:c.name,out:{progress:out.progress,current:out.current,words:out.words}}));assert.ok(out.words>=c.matches-1,c.name);console.log('PASS',c.name, out.progress,out.words);}
const full=alignTranscript(tokenized('Um trabalho de cuidado desigual e persistente.'),tokenized('Um trabalho de cuidado desigual e persistente.'));assert.equal(full.progress,100);assert.equal(full.words,7);
console.log('8 testes de alinhamento executados com sucesso');
