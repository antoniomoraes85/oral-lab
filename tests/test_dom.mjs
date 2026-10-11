/* Teste de integração de estado/controladores com DOM simulado (não substitui navegador real). */
import assert from 'node:assert/strict';
import fs from 'node:fs';
let errors=[];
class El {
 constructor(tag='div'){this.tag=tag;this.children=[];this.style={};this.dataset={};this.attributes={};this.hidden=false;this.value='';this._text='';this._html='';this.events={};this.checked=false;this.disabled=false;this.className='';this.open=false;this.scrollTop=0;this.classList={toggle:(name,yes)=>{const base=this.className.split(' ').filter(s=>s&&s!==name);if(yes)base.push(name);this.className=base.join(' ');}};}
 set textContent(x){this._text=String(x);this.children=[];this._html='';}get textContent(){return this._text+this.children.map(c=>c.textContent||'').join('');}
 set innerHTML(x){this._html=String(x);this._text='';this.children=[];}get innerHTML(){return this._html;}
 append(...items){this.children.push(...items);}appendChild(x){this.children.push(x);return x;}
 replaceChildren(...items){this._text='';this.children=[...items];this._html='';}
 addEventListener(type,fn){this.events[type]=fn;}
 setAttribute(k,v){this.attributes[k]=v;}
 querySelector(selector){if(selector==='.module-name')return this._modName||(this._modName=new El());return new El();}
 click(){if(typeof this.onclick==='function')this.onclick();if(this.events.click)this.events.click({target:this});}
 focus(){}scrollIntoView(){}getBoundingClientRect(){return {top:150,bottom:180};}
}
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const map=new Map([...html.matchAll(/\bid="([a-zA-Z0-9-]+)"/g)].map(x=>[x[1],new El()]));
const modes=['short','medium','full'].map(m=>{const e=new El('button');e.dataset.mode=m;return e;});
const document={getElementById:id=>{if(!map.has(id))map.set(id,new El());return map.get(id);},createElement:tag=>new El(tag),createTextNode:text=>({textContent:String(text)}),querySelectorAll:selector=>selector==='[data-mode]'?modes:[],addEventListener(){},body:new El('body')};
globalThis.document=document;
const memory=new Map();globalThis.localStorage={getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,v)};
let fakePrints=0;
class FakeRecognition{
 static instances=[];constructor(){this.continuous=false;this.interimResults=false;FakeRecognition.instances.push(this);}start(){this.started=true;}stop(){this.started=false;queueMicrotask(()=>this.onend?.());}}
const w={SpeechRecognition:FakeRecognition,addEventListener(){},print(){fakePrints++}};globalThis.window=w;Object.defineProperty(globalThis,'navigator',{value:{},configurable:true});globalThis.location={protocol:'file:'};
globalThis.confirm=()=>true;globalThis.alert=()=>{};
globalThis.URL.createObjectURL=()=> 'blob:test';globalThis.URL.revokeObjectURL=()=>{};
await import('../app.js');
const $=id=>map.get(id);
assert.equal($('module-nav').children.length,6);
assert.equal($('source-list').children.length,7);
assert.ok($('tele-content').children.length>4);
// mudar de modo; editar e salvar
modes[0].events.click?.({target:modes[0]});
$('edit-button').click();assert.equal($('editor-modal').hidden,false);
$('editor-text').value='O trabalho de cuidado deve ser reconhecido como trabalho.';
$('editor-save').click();assert.equal($('editor-modal').hidden,true);
assert.ok($('tele-content').textContent.includes('O trabalho de cuidado'));
assert.ok(memory.get('oral-lab-v2').includes('O trabalho de cuidado deve'));
// microfone: consentimento e parcial/final
$('start-button').click();assert.equal($('privacy-modal').hidden,false);
$('voice-consent').onchange({target:{checked:true}});$('privacy-accept').click();
assert.equal(FakeRecognition.instances.length,1);
assert.equal(FakeRecognition.instances[0].lang,'pt-BR');
assert.equal(FakeRecognition.instances[0].continuous,true);
FakeRecognition.instances[0].onresult({results:[{isFinal:true,0:{transcript:'O trabalho de cuidado'}},{isFinal:false,0:{transcript:'deve ser reconhecido'}}]});
assert.ok(Number($('metric-words').textContent)>=3);
$('pause-button').click();await new Promise(r=>setTimeout(r,0));
assert.ok($('transcript').textContent.includes('trabalho de cuidado'));
const old=$('transcript').textContent;
$('resume-button').click();assert.equal(FakeRecognition.instances.length,2);
FakeRecognition.instances[1].onresult({results:[{isFinal:true,0:{transcript:'como trabalho'}}]});
assert.ok($('transcript').textContent.includes('como trabalho'));
assert.equal(($('transcript').textContent.match(/O trabalho de cuidado/g)||[]).length,1,'transcrição não duplicada');
$('pause-button').click();await new Promise(r=>setTimeout(r,0));$('save-session').click();assert.equal(JSON.parse(memory.get('oral-lab-v2')).history.length,1);
// Impressão montada com seis módulos e três versões
$('export-pdf').click();await new Promise(r=>setTimeout(r,220));
assert.equal($('print-root').children.length,9);assert.ok(fakePrints>0);
// controle de próximo
$('next-button').click();assert.equal($('tele-heading').textContent,'Consequências da desigualdade');
// biblioteca de simulados: criação, questões novas, exclusão e backup local
$('new-collection').click();
assert.equal($('collection-modal').hidden,false);
$('collection-name').value='Direito Constitucional';$('collection-desc').value='Banco de prova oral';
$('collection-save').click();
assert.equal(JSON.parse(memory.get('oral-lab-v2')).collections.length,2);
assert.equal($('module-nav').children.length,0);
$('new-question').click();
$('q-title').value='Controle concentrado';$('q-question').value='O que é controle concentrado?';
$('q-short').value='Explicação em trinta segundos.';$('q-medium').value='Explicação em noventa segundos.';$('q-full').value='Explicação fundamentada completa.';
$('q-arguments').value='Constituição\nCompetência\nEfeito';$('q-keywords').value='STF, Constituição';
$('question-save').click();
assert.equal($('module-nav').children.length,1);
assert.ok($('tele-heading').textContent.includes('Controle concentrado'));
const latest=JSON.parse(memory.get('oral-lab-v2'));
assert.equal(latest.collections[1].questions[0].full,'Explicação fundamentada completa.');
$('edit-question').click();$('q-question').value='Explique o controle concentrado.';$('question-save').click();
assert.equal($('main-question').textContent,'Explique o controle concentrado.');
$('collection-select').onchange({target:{value:'familias-cuidado'}});
assert.equal($('module-nav').children.length,6);
assert.equal($('collection-heading').textContent,'Direito das Famílias — Trabalho de cuidado');
assert.ok(!$('collection-modal').hidden===false);
console.log('PASS: DOM simulado e biblioteca de simulados — 6 módulos, editor/persistência, STT falso com pausa/retomada, histórico, preparação PDF, navegação');
