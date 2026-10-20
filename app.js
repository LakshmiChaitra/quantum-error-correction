const $=id=>document.getElementById(id);
let d=5,errors=Array(5).fill(0),model=null,loadId=0;
const percent=v=>(v*100).toFixed(3)+'%';
async function load(){
 const request=++loadId;model=null;render();$('status').textContent='Loading trained model…';
 try{const response=await fetch(`models/d${d}.json`);if(!response.ok)throw Error('Model unavailable');const m=await response.json();if(request!==loadId)return;model=m;$('status').textContent=`Model ready / distance ${d}`;$('model-link').href=`models/d${d}.json`;render();}
 catch(e){if(request===loadId){$('status').textContent='Model unavailable. Please reload.';render();}}
}
function render(){
 const s=QEC.syndrome(errors),base=QEC.baseline(s);
 $('qubits').replaceChildren(...errors.map((v,i)=>{const b=document.createElement('button');b.type='button';b.textContent=v?'X':'0';b.className=v?'error':'';b.dataset.index=`Q${i+1}`;b.setAttribute('aria-label',`Qubit ${i+1}: ${v?'X error':'clean'}`);b.setAttribute('aria-pressed',String(Boolean(v)));b.addEventListener('click',()=>{errors[i]^=1;render();$('qubits').children[i].focus({preventScroll:true});});return b;}));
 $('checks').replaceChildren(...s.map((v,i)=>{const e=document.createElement('span');e.className=v?'on':'';e.textContent=`s${i+1} · ${v}`;return e;}));
 const count=errors.reduce((a,b)=>a+b,0);
 $('error-count').textContent=`${count} ${count===1?'ERROR':'ERRORS'} INJECTED`;
 $('syndrome-label').textContent=`SYNDROME / ${s.join('')}`;
 $('circuit-count').textContent=`0${d} DATA QUBITS · 0${d-1} CHECKS`;
 show('baseline',base);
 if(model)show('ml',QEC.learned(s,model));else{$('ml-pattern').textContent='—';$('ml-result').textContent='Awaiting model';$('ml-result').className='pending';}
 const p=+$('noise').value/100;
 $('noise-label').replaceChildren(document.createTextNode(Math.round(p*100)),Object.assign(document.createElement('span'),{textContent:'%'}));
 $('raw-rate').textContent=percent(p);
 const b=QEC.exactRate(d,p,QEC.baseline),m=model?QEC.exactRate(d,p,s=>QEC.learned(s,model)):null;
 $('baseline-rate').textContent=percent(b);$('ml-rate').textContent=m===null?'—':percent(m);$('export').disabled=!model;
 const gain=$('gain');gain.replaceChildren(document.createTextNode(m===null?'—':m===0?'0 errors':`${(p/m).toFixed(1)}×`));const caption=document.createElement('small');caption.textContent=m===0?'AT ZERO PHYSICAL NOISE':'LOWER ERROR VS. UNENCODED';gain.append(caption);
 renderChart(p);
}
function show(prefix,correction){
 $(prefix+'-pattern').textContent=correction.map(v=>v?'X':'·').join(' ');
 const failed=errors.some((v,i)=>v!==correction[i]);
 $(prefix+'-result').textContent=failed?'Logical X remains':'Successful correction';$(prefix+'-result').className=failed?'fail':'';
}
function renderChart(selected){
 const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');svg.setAttribute('viewBox','0 0 620 205');svg.setAttribute('role','img');svg.setAttribute('aria-label','Logical error probability from zero to fifty percent physical noise, comparing unencoded, minimum-weight, and trained neural decoders.');
 const make=(tag,attrs,text)=>{const e=document.createElementNS(ns,tag);Object.entries(attrs).forEach(([k,v])=>e.setAttribute(k,v));if(text!==undefined)e.textContent=text;svg.append(e);return e;};
 const x=p=>40+p/.5*562,y=p=>169-p/.5*145;
 for(const p of [0,.1,.2,.3,.4,.5]){make('line',{x1:40,x2:602,y1:y(p),y2:y(p),stroke:'#283248','stroke-width':'.6','stroke-dasharray':'3 5'});make('text',{x:31,y:y(p)+3,fill:'#637591','font-size':'8','text-anchor':'end','font-family':'monospace'},`${Math.round(p*100)}%`);make('text',{x:x(p),y:190,fill:'#637591','font-size':'8','text-anchor':'middle','font-family':'monospace'},`${Math.round(p*100)}%`);}
 const series=[{color:'#61718e',fn:p=>p,dash:'4 5'},{color:'#81f4e0',fn:p=>QEC.exactRate(d,p,QEC.baseline)},{color:'#b8a5fc',fn:model?p=>QEC.exactRate(d,p,s=>QEC.learned(s,model)):null,dash:'3 4'}];
 series.forEach(({color,fn,dash})=>{if(!fn)return;const points=Array.from({length:51},(_,i)=>{const p=i/100;return `${i?'L':'M'}${x(p).toFixed(2)},${y(fn(p)).toFixed(2)}`;}).join(' ');make('path',{d:points,fill:'none',stroke:color,'stroke-width':dash?'1.7':'2.6',...(dash?{'stroke-dasharray':dash}:{})});});
 make('line',{x1:x(selected),x2:x(selected),y1:18,y2:169,stroke:'#d4e5ff44','stroke-width':1});
 series.forEach(({color,fn})=>{if(fn)make('circle',{cx:x(selected),cy:y(fn(selected)),r:3,fill:color,stroke:'#0d121e','stroke-width':1.5});});
 make('text',{x:Math.max(65,Math.min(577,x(selected))),y:11,fill:'#a8bbd7','font-size':8,'text-anchor':'middle','font-family':'monospace'},`${Math.round(selected*100)}% NOISE`);
 $('performance-chart').replaceChildren(svg);
}
$('distance').addEventListener('change',()=>{d=+$('distance').value;errors=Array(d).fill(0);load();});
$('noise').addEventListener('input',render);
$('sample').addEventListener('click',()=>{const random=new Uint32Array(d);crypto.getRandomValues(random);errors=Array.from(random,v=>v/4294967296<+$('noise').value/100?1:0);render();});
$('clear').addEventListener('click',()=>{errors.fill(0);render();});
$('export').addEventListener('click',()=>{if(!model)return;const p=+$('noise').value/100,result={distance:d,physical_error_probability:p,noise_model:model.noise_model,error_pattern:errors,syndrome:QEC.syndrome(errors),baseline_logical_error_rate:QEC.exactRate(d,p,QEC.baseline),bilstm_logical_error_rate:QEC.exactRate(d,p,s=>QEC.learned(s,model)),model};const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(result,null,2)],{type:'application/json'}));a.download=`qec-d${d}-experiment.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);});
load();
