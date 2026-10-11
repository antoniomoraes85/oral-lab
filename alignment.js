const tokens = text=>(text.match(/[\p{L}\p{N}]+(?:[’'-][\p{L}\p{N}]+)*/gu)||[]);
const norm=t=>t.toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[’]/g,"'").replace(/^pra$/,'para').replace(/^pro$/,'para').replace(/^num$/,'em');
export function tokenized(text){return tokens(text).map(norm)}
function closeEnough(a,b){if(a===b)return 2;if(Math.min(a.length,b.length)<5||Math.abs(a.length-b.length)>1||a[0]!==b[0])return 0;let i=0,j=0,edits=0;while(i<a.length&&j<b.length){if(a[i]===b[j]){i++;j++;continue;}if(++edits>1)return 0;if(a.length>b.length)i++;else if(b.length>a.length)j++;else {i++;j++;}}return edits+((a.length-i)||(b.length-j))<=1?1:0;}
/** Alinhamento global monotônico de sequências, com penalidades para saltos, inserções e divergências.
    O caminho não depende da última palavra isolada; coincidências repetidas não provocam saltos arbitrários. */
export function alignTranscript(reference,spoken){const ref=Array.isArray(reference)?reference:tokenized(reference),said=Array.isArray(spoken)?spoken:tokenized(spoken);
  const n=ref.length,m=said.length,matched=new Set(),skipped=new Set();
  if(!n||!m)return {matched,skipped,progress:0,current:0,total:n,words:0};
  const cols=m+1,score=new Float32Array((n+1)*cols),path=new Uint8Array((n+1)*cols);
  const at=(i,j)=>i*cols+j;
  for(let i=1;i<=n;i++){score[at(i,0)]=-1.35*i;path[at(i,0)]=1;}
  for(let j=1;j<=m;j++){score[at(0,j)]=-1.8*j;path[at(0,j)]=2;}
  for(let i=1;i<=n;i++){const a=ref[i-1];for(let j=1;j<=m;j++){
      const sim=closeEnough(a,said[j-1]);let best=score[at(i-1,j-1)]+(sim===2?3:sim===1?1:-2.8),dir=0;
      const skip=score[at(i-1,j)]-1.35;if(skip>best){best=skip;dir=1;}
      const extra=score[at(i,j-1)]-1.8;if(extra>best){best=extra;dir=2;}
      score[at(i,j)]=best;path[at(i,j)]=dir;
  }}
  let end=0,bestEnd=-Infinity;for(let k=0;k<=n;k++){const candidate=score[at(k,m)]-0.055*k;if(candidate>bestEnd){bestEnd=candidate;end=k;}}
  let i=end,j=m,found=0;
  while(i>0||j>0){const dir=path[at(i,j)];if(i>0&&j>0&&dir===0){if(closeEnough(ref[i-1],said[j-1])){matched.add(i-1);found++;}i--;j--;}else if(i>0&&(dir===1||j===0))i--;else if(j>0)j--;else break;}
  const max=matched.size?Math.max(...matched):-1;
  for(let k=0;k<max;k++)if(!matched.has(k))skipped.add(k);
  return {matched,skipped,progress:max<0?0:Math.round((max+1)/n*100),current:Math.min(n-1,max+1),total:n,words:found};
}
