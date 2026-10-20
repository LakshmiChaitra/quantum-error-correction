const assert=require('node:assert/strict'),q=require('../core.js'),fs=require('node:fs');
for(const d of [3,5,7]){
 const model=JSON.parse(fs.readFileSync(`${__dirname}/../models/d${d}.json`));
 let neuralMatches=0;
 for(let i=0;i<2**d;i++){
  const e=Array.from({length:d},(_,j)=>(i>>j)&1),s=q.syndrome(e),b=q.baseline(s),m=q.learned(s,model);
  assert.deepEqual(q.syndrome(b),s);assert.deepEqual(q.syndrome(m),s);
  if(e.reduce((a,b)=>a+b,0)<d/2)assert.deepEqual(b,e);
 }
 for(let i=0;i<2**(d-1);i++){const s=Array.from({length:d-1},(_,j)=>(i>>j)&1);if(q.baseline(s).every((v,j)=>v===q.learned(s,model)[j]))neuralMatches++;}
 for(const p of [0,.05,.1,.2,.5]){
  const choose=(n,k)=>{let v=1;for(let i=1;i<=k;i++)v=v*(n-i+1)/i;return v;};
  let expected=0;for(let k=(d+1)/2;k<=d;k++)expected+=choose(d,k)*p**k*(1-p)**(d-k);
  assert.ok(Math.abs(q.exactRate(d,p,q.baseline)-expected)<1e-12);
 }
 console.log(`d=${d}: all patterns verified; trained model agrees with optimum on ${neuralMatches}/${2**(d-1)} syndromes`);
}
