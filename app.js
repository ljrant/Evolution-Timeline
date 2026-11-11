'use strict';
// Ages are measured in years before present; 0 = present. Approximate dates are educational.
const EARTH = 4.54e9;
const EVENTS = [
 {id:'earth',name:'Formation of Earth',type:'point',age:4.54e9,category:'COSMIC ORIGINS',icon:'◈',description:'The planet coalesces from the early Solar System.',related:['oceans','moon']},
 {id:'moon',name:'Formation of the Moon',type:'point',age:4.51e9,category:'COSMIC ORIGINS',icon:'◐',description:'A giant impact likely forms the Moon.',related:['earth']},
 {id:'oceans',name:'First liquid oceans',type:'point',age:4.4e9,category:'EARLY EARTH',icon:'≈',description:'Evidence for early surface water.',related:['earth','life']},
 {id:'life',name:'Earliest evidence of life',type:'point',age:3.7e9,category:'EARLY LIFE',icon:'✳',description:'Possible early microbial biosignatures.',related:['oceans','photosynthesis']},
 {id:'photosynthesis',name:'Oxygenic photosynthesis',type:'range',start:2.7e9,end:0,category:'EARLY LIFE',icon:'☼',description:'A biological process that still continues.',related:['life','oxygen']},
 {id:'oxygen',name:'Great Oxidation Event',type:'range',start:2.4e9,end:2.05e9,category:'EARTH SYSTEMS',icon:'○',description:'Atmospheric oxygen increases substantially.',related:['photosynthesis','eukaryotes']},
 {id:'eukaryotes',name:'First eukaryotes',type:'point',age:1.8e9,category:'COMPLEX LIFE',icon:'✺',description:'Cells with nuclei appear.',related:['oxygen','multicellular']},
 {id:'multicellular',name:'Multicellular organisms',type:'point',age:1e9,category:'COMPLEX LIFE',icon:'✿',description:'Complex multicellular lineages emerge.',related:['eukaryotes','cambrian']},
 {id:'snowball',name:'Cryogenian glaciations',type:'range',start:720e6,end:635e6,category:'EARTH SYSTEMS',icon:'❄',description:'Intervals of extreme global glaciation.',related:['cambrian']},
 {id:'cambrian',name:'Cambrian explosion',type:'range',start:538.8e6,end:520e6,category:'COMPLEX LIFE',icon:'✳',description:'Rapid diversification in the animal fossil record.',related:['multicellular','landplants']},
 {id:'landplants',name:'Plants colonize land',type:'point',age:470e6,category:'LIFE ON LAND',icon:'♣',description:'Early land plants change terrestrial habitats.',related:['cambrian','forests']},
 {id:'forests',name:'First forests',type:'point',age:385e6,category:'LIFE ON LAND',icon:'♠',description:'Tree-sized plants form forest ecosystems.',related:['landplants','dinosaurs']},
 {id:'dinosaurs',name:'Age of non-avian dinosaurs',type:'range',start:230e6,end:66e6,category:'MESOZOIC',icon:'△',description:'Dinosaurs diversify and dominate many land ecosystems.',related:['forests','extinction']},
 {id:'mammals',name:'Early mammals',type:'point',age:225e6,category:'MESOZOIC',icon:'◇',description:'The earliest mammaliaforms arise.',related:['dinosaurs','humans']},
 {id:'flowering',name:'Flowering plants emerge',type:'point',age:140e6,category:'MESOZOIC',icon:'✿',description:'Angiosperms begin diversifying.',related:['dinosaurs','extinction']},
 {id:'extinction',name:'K–Pg mass extinction',type:'point',age:66e6,category:'CENOZOIC',icon:'✧',description:'Non-avian dinosaurs disappear; mammals radiate.',related:['dinosaurs','mammals']},
 {id:'hominins',name:'Earliest hominins',type:'point',age:7e6,category:'HUMAN ORIGINS',icon:'♙',description:'Early members of the human lineage.',related:['humans']},
 {id:'humans',name:'Homo sapiens appear',type:'point',age:300e3,category:'HUMAN ORIGINS',icon:'◎',description:'Our species emerges in Africa.',related:['hominins','agriculture']},
 {id:'agriculture',name:'Beginning of agriculture',type:'point',age:12e3,category:'HUMAN ORIGINS',icon:'❖',description:'Cultivation and domestication spread in several regions.',related:['humans']}
];
const $ = s => document.querySelector(s);
const byId = id => document.getElementById(id);
const state = {placements:{},links:[],selected:new Set(),active:null,filter:'all',search:'',scale:1,offset:0,drag:null,linkMode:false,reveal:false};
const viewport=byId('timelineViewport');
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const timeToU= age=>1-Math.log10(1+clamp(age,0,EARTH))/Math.log10(1+EARTH);
const uToTime= u=>Math.pow(10,(1-clamp(u,0,1))*Math.log10(1+EARTH))-1;
const xFromAge= age=> (timeToU(age)*state.scale-state.offset)*viewport.clientWidth;
const ageFromX= x=>uToTime((x/viewport.clientWidth+state.offset)/state.scale);
const ageText= n=> n>=1e9?(n/1e9).toFixed(n>=1e9?2:1).replace(/\.00$/,'')+' Ga':n>=1e6?+(n/1e6).toFixed(2)+' Ma':n>=1e3?+(n/1e3).toFixed(1)+' ka':n<1?'Today':Math.round(n)+' years ago';
const eventById = id=>EVENTS.find(e=>e.id===id);
const placedCount=()=>Object.keys(state.placements).length;
let toastTimer;
function toast(message){const el=byId('toast');el.textContent=message;el.hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.hidden=true,2600)}
function store(){try{localStorage.setItem('epoch-evolution-v1',JSON.stringify({placements:state.placements,links:state.links}))}catch{}}
function load(){try{const data=JSON.parse(localStorage.getItem('epoch-evolution-v1')||'{}');if(data.placements&&typeof data.placements==='object') for(const [id,p] of Object.entries(data.placements)){const e=eventById(id);if(!e||!p)continue;if(e.type==='point'&&Number.isFinite(p.age))state.placements[id]={age:clamp(p.age,0,EARTH)};else if(e.type==='range'&&Number.isFinite(p.start)&&Number.isFinite(p.end))state.placements[id]={start:clamp(Math.max(p.start,p.end),0,EARTH),end:clamp(Math.min(p.start,p.end),0,EARTH)}}if(Array.isArray(data.links))state.links=data.links.filter(pair=>Array.isArray(pair)&&pair.length===2&&pair.every(id=>state.placements[id]));}catch{}}
function renderedX(clientX){const b=viewport.getBoundingClientRect();return clientX-b.left}
function setViewport(scale,centerU=.5,centerScreen=.5){const next=clamp(scale,1,65);state.offset=clamp(centerU*next-centerScreen,0,next-1);state.scale=next;document.querySelectorAll('.preset').forEach(b=>b.classList.toggle('active',b.dataset.preset==='all'&&next===1));renderTimeline()}
function zoom(factor,clientX){const x=clientX===undefined?viewport.clientWidth/2:renderedX(clientX);const ratio=clamp(x/viewport.clientWidth,0,1);setViewport(state.scale*factor,(ratio+state.offset)/state.scale,ratio)}
function preset(name){const ages={all:[EARTH,0],early:[EARTH,5e8],dinos:[3e8,4e7],recent:[1e7,0]};const [old,young]=ages[name];const left=timeToU(old),right=timeToU(young);const s=1/Math.max(right-left,.015);state.scale=s;state.offset=left*s;document.querySelectorAll('.preset').forEach(b=>b.classList.toggle('active',b.dataset.preset===name));renderTimeline()}
function pointAge(id){const p=state.placements[id],e=eventById(id);return e.type==='point'?p.age:(p.start+p.end)/2}
function rangeRow(id){return EVENTS.filter(e=>e.type==='range').findIndex(e=>e.id===id)}
function renderTimeline(){
 const w=viewport.clientWidth;
 const eraItems=[{start:EARTH,end:4e9,name:'HADEAN'},{start:4e9,end:2.5e9,name:'ARCHEAN'},{start:2.5e9,end:538.8e6,name:'PROTEROZOIC'},{start:538.8e6,end:251.9e6,name:'PALEOZOIC'},{start:251.9e6,end:66e6,name:'MESOZOIC'},{start:66e6,end:0,name:'CENOZOIC'}];
 byId('eraLayer').innerHTML=eraItems.map((e,i)=>{const x=xFromAge(e.start),end=xFromAge(e.end);if(end<0||x>w)return '';return '<div class="era-band" style="left:'+x+'px;width:'+Math.max(end-x,0)+'px;background:'+(i%2?'#183a4936':'#0e263836')+'"></div><div class="era-label" style="left:'+Math.max(10,x+12)+'px">'+e.name+'</div>'}).join('');
 const ticks=[4.54e9,4e9,3e9,2e9,1e9,5e8,2e8,1e8,5e7,1e7,1e6,1e5,1e4,1e3,1e2,10,0];
 const marked=[];byId('gridLayer').innerHTML=ticks.map(age=>{const x=xFromAge(age);if(x<-40||x>w+40)return '';const label=ageText(age);const show=marked.every(p=>Math.abs(p-x)>62);if(show)marked.push(x);return '<div class="tick major" style="left:'+x+'px"></div>'+(show?'<span class="tick-label" style="left:'+clamp(x,38,w-36)+'px">'+label+'</span>':'')}).join('');
 const labelL=ageText(ageFromX(0)),labelR=ageText(ageFromX(w));byId('viewportLabel').textContent=labelL+' → '+labelR;
 const placed=EVENTS.filter(e=>state.placements[e.id]);
 byId('eventsLayer').innerHTML=placed.map(e=>{const p=state.placements[e.id],selected=state.selected.has(e.id)?' selected':'',escaped=e.name.replaceAll('&','&amp;').replaceAll('<','&lt;');
  if(e.type==='point'){const x=xFromAge(p.age);return '<div class="event-marker point'+selected+'" data-id="'+e.id+'" role="button" tabindex="0" aria-label="'+escaped+', placed at '+ageText(p.age)+'; use arrow keys to adjust" title="'+escaped+' — '+ageText(p.age)+'" style="left:'+x+'px"><span class="event-label">'+escaped+'</span><span class="pin"></span></div>'}
  const x=xFromAge(p.start),x2=xFromAge(p.end),width=Math.max(12,x2-x);const row=rangeRow(e.id)%5;
  return '<div class="event-marker range'+selected+'" data-id="'+e.id+'" role="button" tabindex="0" aria-label="'+escaped+', from '+ageText(p.start)+' to '+ageText(p.end)+'" title="'+escaped+' | '+ageText(p.start)+' → '+ageText(p.end)+'" style="left:'+x+'px;width:'+width+'px;top:'+(249+row*25)+'px"><span class="range-label">'+escaped+'</span><span class="range-handle start" data-handle="start"></span><span class="range-inner"></span><span class="range-handle end" data-handle="end"></span></div>'
 }).join('');
 const svg=byId('linksSvg');svg.setAttribute('viewBox','0 0 '+w+' '+viewport.clientHeight);
 svg.innerHTML=state.links.map(([a,b])=>{if(!state.placements[a]||!state.placements[b])return '';const x1=xFromAge(pointAge(a)),x2=xFromAge(pointAge(b)),y1=eventById(a).type==='point'?125:260+rangeRow(a)%5*25,y2=eventById(b).type==='point'?125:260+rangeRow(b)%5*25;return '<path class="link-path" d="M'+x1+','+y1+' Q'+((x1+x2)/2)+','+(Math.max(y1,y2)+50)+' '+x2+','+y2+'"></path>'}).join('');
 byId('emptyPrompt').hidden=placed.length>0;
 byId('selectionCount').textContent=state.selected.size+' selected';
 byId('scoreButton').disabled=!placed.length;
 byId('progressFill').style.width=(100*placed.length/EVENTS.length)+'%';
 byId('bankCounter').textContent=placed.length+' / '+EVENTS.length;
 byId('remainingCount').textContent=(EVENTS.length-placed.length)+' remaining';
}
function renderBank(){
 const query=state.search.toLowerCase(),seen=EVENTS.filter(e=>(state.filter==='all'||e.type===state.filter)&&[e.name,e.category,e.description].join(' ').toLowerCase().includes(query));
 const groups=[...new Set(seen.map(e=>e.category))];
 byId('eventList').innerHTML=seen.length?groups.map(group=>'<div class="bank-section-label">'+group+'</div>'+seen.filter(e=>e.category===group).map(e=>{const done=!!state.placements[e.id],type=e.type==='point'?'SINGULAR EVENT':'ONGOING EVENT';return '<div class="bank-card '+(e.type==='range'?'range-card ':'')+(done?'placed':'')+'" data-bank-id="'+e.id+'" draggable="false" tabindex="0" role="button" aria-label="'+e.name+', '+type+(done?', already placed':'')+'"><span class="grip">⠿</span><span class="card-icon">'+e.icon+'</span><div class="bank-card-content"><h3>'+e.name+'</h3><p>'+type+(done?' · PLACED':'')+'</p></div><span class="card-action">'+(done?'✓':'+')+'</span></div>'}).join('')).join(''):'<div class="bank-empty">No matching events. Try another search.</div>';
}
function refresh(){renderBank();renderTimeline()}
function place(id,atAge){const e=eventById(id);if(!e||state.placements[id])return;const at=clamp(atAge,0,EARTH);if(e.type==='point')state.placements[id]={age:at};else {const targetSpan=Math.max(3e5,e.start-e.end),a=clamp(at+targetSpan/2,0,EARTH),b=clamp(at-targetSpan/2,0,EARTH);state.placements[id]={start:Math.max(a,b),end:Math.min(a,b)}}state.selected.clear();state.selected.add(id);state.active=null;state.reveal=false;store();refresh();toast('Placed: '+e.name)}
function moveSet(ids,deltaU){for(const id of ids){const e=eventById(id),p=state.placements[id];if(!p)continue;if(e.type==='point')p.age=uToTime(clamp(timeToU(p.age)+deltaU,0,1));else {const a=timeToU(p.start),b=timeToU(p.end),safe=clamp(deltaU,-a,1-b);p.start=uToTime(a+safe);p.end=uToTime(b+safe)}}}
function selectMarker(id,shift){if(state.linkMode){if(!state.active){state.active=id;toast('Select the second event to connect')}else if(state.active!==id){const a=state.active,b=id,key=[a,b].sort();if(!state.links.some(pair=>pair[0]===key[0]&&pair[1]===key[1]))state.links.push(key);else state.links=state.links.filter(pair=>!(pair[0]===key[0]&&pair[1]===key[1]));state.active=null;store();toast('Event link updated')}renderTimeline();return}if(shift){state.selected.has(id)?state.selected.delete(id):state.selected.add(id)}else if(!state.selected.has(id)){state.selected.clear();state.selected.add(id)}renderTimeline()}
function pointerMove(e){
 const d=state.drag;if(!d)return;const x=renderedX(e.clientX),dx=e.clientX-d.lastX;d.lastX=e.clientX;
 if(d.kind==='bank'){if(Math.abs(e.clientX-d.startX)+Math.abs(e.clientY-d.startY)>7)d.moved=true;byId('dragGhost').hidden=!d.moved;byId('dragGhost').textContent=eventById(d.id).name;byId('dragGhost').style.left=(e.clientX+14)+'px';byId('dragGhost').style.top=(e.clientY+15)+'px';const rect=viewport.getBoundingClientRect();const inside=e.clientX>=rect.left&&e.clientX<=rect.right&&e.clientY>=rect.top&&e.clientY<=rect.bottom;byId('dropPreview').hidden=!inside||!d.moved;byId('dropPreview').style.left=x+'px';return}
 if(d.kind==='pan'){state.offset=clamp(state.offset-dx/viewport.clientWidth,0,state.scale-1);renderTimeline()}
 if(d.kind==='move'){const step=dx/viewport.clientWidth/state.scale;moveSet(d.ids,step);renderTimeline()}
 if(d.kind==='resize'){const p=state.placements[d.id];if(!p)return;const value=ageFromX(x);if(d.handle==='start')p.start=Math.max(p.end,value);else p.end=Math.min(p.start,value);renderTimeline()}
}
function pointerUp(e){const d=state.drag;if(!d)return;state.drag=null;viewport.classList.remove('panning');byId('dragGhost').hidden=true;byId('dropPreview').hidden=true;const rect=viewport.getBoundingClientRect();if(d.kind==='bank'){if(d.moved&&e.clientX>=rect.left&&e.clientX<=rect.right&&e.clientY>=rect.top&&e.clientY<=rect.bottom){place(d.id,ageFromX(renderedX(e.clientX)))}else if(!d.moved){if(state.placements[d.id]){state.selected.clear();state.selected.add(d.id);refresh();toast('Already placed — drag the event on the timeline to move it')}else{state.active=d.id;toast('Click the timeline to place '+eventById(d.id).name)}}}else if(d.kind==='move'||d.kind==='resize'){store()}refresh()}
byId('eventList').addEventListener('pointerdown',e=>{const card=e.target.closest('[data-bank-id]');if(!card||e.button!==0)return;const id=card.dataset.bankId;if(state.placements[id])return;e.preventDefault();state.drag={kind:'bank',id,startX:e.clientX,startY:e.clientY,lastX:e.clientX,moved:false}});
viewport.addEventListener('pointerdown',e=>{
 if(e.button!==0)return;const marker=e.target.closest('[data-id]');if(marker){const id=marker.dataset.id;if(state.linkMode){selectMarker(id,false);return}selectMarker(id,e.shiftKey||e.ctrlKey||e.metaKey);const handle=e.target.dataset.handle;if(handle){state.drag={kind:'resize',id,handle,lastX:e.clientX}}else state.drag={kind:'move',ids:[...state.selected],lastX:e.clientX};e.preventDefault();return}
 if(state.active){place(state.active,ageFromX(renderedX(e.clientX)));return}
 if(e.shiftKey){state.selected.clear();renderTimeline();return}
 state.drag={kind:'pan',lastX:e.clientX};viewport.classList.add('panning');
});
window.addEventListener('pointermove',pointerMove);
window.addEventListener('pointerup',pointerUp);
window.addEventListener('pointercancel',pointerUp);
viewport.addEventListener('wheel',e=>{e.preventDefault();zoom(Math.exp(-e.deltaY*.0015),e.clientX)},{passive:false});
viewport.addEventListener('keydown',e=>{const marker=e.target.closest('[data-id]');if(!marker)return;const id=marker.dataset.id;if(['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();state.selected.clear();state.selected.add(id);moveSet([id],(e.key==='ArrowLeft'?-1:1)*(.012/state.scale));store();renderTimeline();viewport.querySelector('[data-id="'+id+'"]')?.focus()}});
byId('zoomIn').onclick=()=>zoom(1.8);byId('zoomOut').onclick=()=>zoom(1/1.8);byId('zoomReset').onclick=()=>preset('all');
document.querySelectorAll('.preset').forEach(b=>b.onclick=()=>preset(b.dataset.preset));
document.querySelectorAll('.filter').forEach(b=>b.onclick=()=>{state.filter=b.dataset.filter;document.querySelectorAll('.filter').forEach(x=>x.classList.toggle('active',x===b));renderBank()});
byId('eventSearch').addEventListener('input',e=>{state.search=e.target.value;renderBank()});
byId('selectAll').onclick=()=>{state.selected=new Set(Object.keys(state.placements));renderTimeline()};
byId('clearSelection').onclick=()=>{state.selected.clear();state.active=null;renderTimeline()};
byId('linkMode').onclick=()=>{state.linkMode=!state.linkMode;state.active=null;byId('linkMode').classList.toggle('pressed',state.linkMode);byId('linkMode').setAttribute('aria-pressed',String(state.linkMode));toast(state.linkMode?'Click two placed events to toggle their connection':'Link mode off')};
byId('restartButton').onclick=()=>{if(!confirm('Remove all event placements and links, and start a new round?'))return;state.placements={};state.links=[];state.selected.clear();state.active=null;state.reveal=false;store();refresh()};
function trueU(e,which='center'){return timeToU(which==='start'?e.start:which==='end'?e.end:e.type==='point'?e.age:(e.start+e.end)/2)}
function scoreForEvent(e){const p=state.placements[e.id];if(!p)return null;const actual=trueU(e),guess=timeToU(e.type==='point'?p.age:(p.start+p.end)/2);const centerErr=Math.abs(actual-guess);
 if(e.type==='point')return Math.round(100*Math.exp(-centerErr/.08));
 const startErr=Math.abs(timeToU(p.start)-timeToU(e.start)),endErr=Math.abs(timeToU(p.end)-timeToU(e.end));
 return Math.round(100*Math.exp(-(centerErr*.4+(startErr+endErr)*.3)/.08));
}
function computeScore(){
 const present=EVENTS.filter(e=>state.placements[e.id]);const temporal=present.reduce((a,e)=>a+scoreForEvent(e),0)/(present.length||1);
 let correct=0,total=0;for(let i=0;i<present.length;i++)for(let j=i+1;j<present.length;j++){const a=present[i],b=present[j],expected=Math.sign(trueU(a)-trueU(b)),guess=Math.sign(timeToU(pointAge(a.id))-timeToU(pointAge(b.id)));if(expected!==0){total++;if(expected===guess)correct++}}
 const order=total?100*correct/total:100;
 const relevantPairs=[];for(const a of present)for(const id of a.related||[])if(state.placements[id]&&a.id<id)relevantPairs.push([a.id,id]);const linked=relevantPairs.filter(pair=>state.links.some(q=>pair.every(x=>q.includes(x)))).length;const links=relevantPairs.length?Math.round(linked/relevantPairs.length*100):100;
 const score=Math.round(temporal*.7+order*.25+links*.05);
 return {present,score,temporal:Math.round(temporal),order:Math.round(order),links,linked,totalLinks:relevantPairs.length};
}
function openScore(){const r=computeScore();byId('scoreTotal').textContent=r.score;byId('scoreTemporal').textContent=r.temporal+'%';byId('scoreOrder').textContent=r.order+'%';byId('scoreLinks').textContent=r.linked+' / '+r.totalLinks;byId('scoreRows').innerHTML=r.present.map(e=>{const p=state.placements[e.id],guess=e.type==='point'?ageText(p.age):ageText(p.start)+' → '+ageText(p.end),truth=e.type==='point'?ageText(e.age):ageText(e.start)+' → '+ageText(e.end);return '<div class="score-row"><div><strong>'+e.name+'</strong><small>YOU: '+guess+'<br>ACTUAL: '+truth+'</small></div><span class="result-score">'+scoreForEvent(e)+'/100</span></div>'}).join('');byId('scoreDialog').hidden=false}
function closeScore(){byId('scoreDialog').hidden=true}
byId('scoreButton').onclick=openScore;byId('closeScore').onclick=closeScore;byId('continueButton').onclick=closeScore;
byId('revealButton').onclick=()=>{for(const e of EVENTS)if(state.placements[e.id])state.placements[e.id]=e.type==='point'?{age:e.age}:{start:e.start,end:e.end};state.reveal=true;store();refresh();closeScore();toast('True positions revealed for placed events')};
byId('helpButton').onclick=()=>byId('helpDialog').hidden=false;
byId('closeHelp').onclick=byId('startPlaying').onclick=()=>byId('helpDialog').hidden=true;
document.querySelectorAll('.overlay').forEach(el=>el.addEventListener('click',e=>{if(e.target===el)el.hidden=true}));
document.addEventListener('keydown',e=>{if(e.key==='Escape'){document.querySelectorAll('.overlay').forEach(el=>el.hidden=true);state.active=null;state.linkMode=false;byId('linkMode').classList.remove('pressed')}});
let touchPoints=new Map(),pinchStart=null;
viewport.addEventListener('touchstart',e=>{for(const t of e.changedTouches)touchPoints.set(t.identifier,{x:t.clientX,y:t.clientY});if(touchPoints.size===2){const a=[...touchPoints.values()];pinchStart={distance:Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y),scale:state.scale,center:(a[0].x+a[1].x)/2,centerU:(renderedX((a[0].x+a[1].x)/2)/viewport.clientWidth+state.offset)/state.scale}}},{passive:true});
viewport.addEventListener('touchmove',e=>{for(const t of e.changedTouches)if(touchPoints.has(t.identifier))touchPoints.set(t.identifier,{x:t.clientX,y:t.clientY});if(pinchStart&&touchPoints.size===2){const a=[...touchPoints.values()],dist=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y);setViewport(pinchStart.scale*dist/pinchStart.distance,pinchStart.centerU,clamp(renderedX((a[0].x+a[1].x)/2)/viewport.clientWidth,0,1))}},{passive:true});
function endTouch(e){for(const t of e.changedTouches)touchPoints.delete(t.identifier);if(touchPoints.size<2)pinchStart=null}
viewport.addEventListener('touchend',endTouch);viewport.addEventListener('touchcancel',endTouch);
window.addEventListener('resize',renderTimeline);
load();refresh();
