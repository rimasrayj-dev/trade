// ── ORDER BOOK ──

function renderBook(){
  const pr=prices[S.pair]; const asks=[],bids=[];
  for(let i=0;i<10;i++){
    const ap=pr*(1+(4e-4+i*2.5e-4)*(1+Math.random()*.4)),av=+(Math.random()*6+.05).toFixed(4);
    asks.push({p:ap,q:av,t:ap*av});
  }
  for(let i=0;i<10;i++){
    const bp=pr*(1-(4e-4+i*2.5e-4)*(1+Math.random()*.4)),bv=+(Math.random()*6+.05).toFixed(4);
    bids.push({p:bp,q:bv,t:bp*bv});
  }
  const mx=Math.max(...[...asks,...bids].map(r=>r.q));
  document.getElementById('obA').innerHTML=[...asks].reverse().map(r=>{
    const w=(r.q/mx*100).toFixed(0);
    return`<div class="obr ask" onclick="setLP(${r.p.toFixed(2)})"><div class="obf" style="width:${w}%"></div><span>${fp(r.p)}</span><span style="color:var(--t2)">${r.q}</span><span class="dim">${(r.t/1000).toFixed(1)}K</span></div>`;
  }).join('');
  const pp=PAIRS.find(x=>x.sym===S.pair);
  document.getElementById('obP').textContent='$'+fp(pr);
  const mt=document.getElementById('obT');mt.textContent=(pp.ch>=0?'+':'')+pp.ch.toFixed(2)+'%';mt.className='ob-mt '+(pp.ch>=0?'up':'dn');
  document.getElementById('obB').innerHTML=bids.map(r=>{
    const w=(r.q/mx*100).toFixed(0);
    return`<div class="obr bid" onclick="setLP(${r.p.toFixed(2)})"><div class="obf" style="width:${w}%"></div><span>${fp(r.p)}</span><span style="color:var(--t2)">${r.q}</span><span class="dim">${(r.t/1000).toFixed(1)}K</span></div>`;
  }).join('');
}

function setLP(p){
  if(S.otype!=='market') document.getElementById('lp').value=p;
}