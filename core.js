(function(root){
function syndrome(e){return e.slice(1).map((v,i)=>v^e[i]);}
function representative(s,first=0){const e=[first];s.forEach(v=>e.push(e.at(-1)^v));return e;}
function baseline(s){const e=representative(s);return e.reduce((a,b)=>a+b,0)>e.length/2?e.map(v=>1-v):e;}
function index(s){return s.reduce((a,b,i)=>a+(b<<i),0);}
function learned(s,model){return representative(s,model.p_e0[index(s)]>=.5?1:0);}
function exactRate(d,p,decode){let total=0;for(let i=0;i<2**d;i++){const e=Array.from({length:d},(_,j)=>(i>>j)&1),k=e.reduce((a,b)=>a+b,0),correction=decode(syndrome(e));if(e.some((v,j)=>v!==correction[j]))total+=p**k*(1-p)**(d-k);}return total;}
const api={syndrome,representative,baseline,index,learned,exactRate};if(typeof module!=='undefined')module.exports=api;root.QEC=api;
})(globalThis);
