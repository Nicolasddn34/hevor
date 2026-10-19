"use strict";
/* =====================================================================
   Hevor — équipe (espace Club) : vues coach, joueur et spectateur
   + feuilles partagées avec l'espace Coach : questionnaire, ressenti,
     planning, programmes et séance du programme.
   ===================================================================== */
const DAY=864e5;
const dayKey=t=>{const d=new Date(t);return d.getFullYear()+String(d.getMonth()+1).padStart(2,'0')+String(d.getDate()).padStart(2,'0')};
const keyTime=k=>new Date(+k.slice(0,4),+k.slice(4,6)-1,+k.slice(6,8)).getTime();
const hm=t=>new Date(t).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'}).replace(':','h');
const dLong=t=>new Date(t).toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'});
const dShort=t=>new Date(t).toLocaleDateString('fr-FR',{weekday:'short',day:'numeric',month:'short'}).replace(/\./g,'');
const wkStart=off=>{const d=new Date();d.setHours(0,0,0,0);const w=(d.getDay()+6)%7;d.setDate(d.getDate()-w+7*(off||0));return d.getTime()};
const isoDate=t=>{const d=new Date(t);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
const isoTime=t=>{const d=new Date(t);return String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0')};
const fromIso=(d,t)=>{const [y,m,da]=String(d||'').split('-').map(Number),[h,mi]=String(t||'00:00').split(':').map(Number);const x=new Date(y,(m||1)-1,da||1,h||0,mi||0);return isNaN(x)?null:x.getTime()};
const okUrl=u=>typeof u==='string'&&/^https:\/\/[^\s<>"']{4,490}$/.test(u);
const EVT={training:'Entraînement',muscu:'Muscu',match:'Match',video:'Vidéo',meeting:'Réunion',recup:'Récup'};
const RPE_L=['','Très facile','Facile','Facile','Modéré','Assez dur','Dur','Dur','Très dur','Très dur','Maximal'];

/* ---------- nettoyage des données lues ---------- */
const cIds=a=>(Array.isArray(a)?a:[]).filter(x=>typeof x==='string'&&x.length<=128).slice(0,200);
function cEvent(id,d){d=d||{};return{id,type:EVT[d.type]?d.type:'training',title:cStr(d.title,80)||EVT[d.type]||'Créneau',start:cNum(d.start,0,4102444800000,0),dur:Math.round(cNum(d.dur,0,1440,60)),place:cStr(d.place,80),invitees:cIds(d.invitees),video:okUrl(d.video)?d.video:'',by:cStr(d.by,128)}}
function cPItem(it){if(!it||!okId(it.exoId))return null;return{exoId:it.exoId,name:cStr(it.name,80)||exo(it.exoId).name,sets:Math.round(cNum(it.sets,1,10,3)),reps:Math.round(cNum(it.reps,1,100,10)),mode:MODES.includes(it.mode)?it.mode:'reps',dur:Math.round(cNum(it.dur,5,900,60)),lt:['free','pct','kg'].includes(it.lt)?it.lt:'free',lv:cNum(it.lv,0,2000,0),note:cStr(it.note,120)}}
function cProgram(id,d){d=d||{};return{id,title:cStr(d.title,80)||'Programme',date:cNum(d.date,0,4102444800000,0),eventId:okId(d.eventId)?d.eventId:'',items:(Array.isArray(d.items)?d.items:[]).slice(0,40).map(cPItem).filter(Boolean),invitees:cIds(d.invitees),note:cStr(d.note,300),by:cStr(d.by,128)}}
function cWell(id,d){d=d||{};const p={};if(d.pains&&typeof d.pains==='object')for(const k in d.pains){if(ZONE_L[k]){p[k]=Math.round(cNum(d.pains[k],1,5,1))}}
  return{id,uid:cStr(d.uid,128),day:/^\d{8}$/.test(d.day)?d.day:'00000000',at:cNum(d.at,0,4102444800000,0),mot:Math.round(cNum(d.mot,1,5,3)),som:Math.round(cNum(d.som,1,5,3)),pains:p}}
function cLog(id,d){d=d||{};return{id,uid:cStr(d.uid,128),kind:['training','program','match','free'].includes(d.kind)?d.kind:'training',eventId:okId(d.eventId)?d.eventId:'',programId:okId(d.programId)?d.programId:'',title:cStr(d.title,80)||'Séance',at:cNum(d.at,0,4102444800000,0),dur:Math.round(cNum(d.dur,0,600,0)),rpe:Math.round(cNum(d.rpe,1,10,5)),load:cNum(d.load,0,6000,0),comment:cStr(d.comment,500),note:cStr(d.note,500),noteAt:cNum(d.noteAt,0,4102444800000,0),
  items:(Array.isArray(d.items)?d.items:[]).slice(0,40).filter(it=>it&&okId(it.exoId)).map(it=>({exoId:it.exoId,name:cStr(it.name,80),weight:it.weight==null?null:cNum(it.weight,0,2000,0),done:Math.round(cNum(it.done,0,20,0)),sets:Math.round(cNum(it.sets,0,20,0)),reps:Math.round(cNum(it.reps,0,999,0))}))}}

/* ---------- chargement des données de l'équipe ---------- */
async function loadData(tid,force){
  const T=SP.T[tid];if(!T||!DB)return;const D=SP.D[tid];
  if(D&&D.loading)return;if(D&&!force&&Date.now()-D.at<45000)return;
  SP.D[tid]={members:[],events:[],programs:[],wellness:[],logs:[],...(D||{}),loading:true,at:D?D.at:0};
  const role=T.me.role,now=Date.now(),from=now-42*DAY,J={};
  try{const td=await teamRef(tid).get();if(td.exists)T.team=cTeam(tid,td.data())}catch(e){}
  if(role!=='client'&&role!=='pending')J.members=subCol(tid,'members').get();
  if(role==='coach'||role==='spectator')J.events=subCol(tid,'events').where('start','>=',now-70*DAY).get();
  else if(role==='player'||role==='client')J.events=subCol(tid,'events').where('invitees','array-contains',UID).get();
  if(role==='coach'){J.programs=subCol(tid,'programs').where('date','>=',now-70*DAY).get();J.wellness=subCol(tid,'wellness').where('day','>=',dayKey(from)).get();J.logs=subCol(tid,'logs').where('at','>=',from).get()}
  if(role==='player'||role==='client'){J.programs=subCol(tid,'programs').where('invitees','array-contains',UID).get();J.wellness=subCol(tid,'wellness').where('uid','==',UID).get();J.logs=subCol(tid,'logs').where('uid','==',UID).get()}
  const out={members:D?.members||[],events:D?.events||[],programs:D?.programs||[],wellness:D?.wellness||[],logs:D?.logs||[]};let err=false;
  await Promise.all(Object.entries(J).map(async([k,p])=>{try{const s=await p;
    out[k]=s.docs.map(x=>k==='members'?cMember(x.data()):k==='events'?cEvent(x.id,x.data()):k==='programs'?cProgram(x.id,x.data()):k==='wellness'?cWell(x.id,x.data()):cLog(x.id,x.data()))}catch(e){err=true}}));
  out.events.sort((a,b)=>a.start-b.start);out.programs.sort((a,b)=>a.date-b.date);out.logs.sort((a,b)=>a.at-b.at);out.wellness.sort((a,b)=>a.day<b.day?-1:1);
  const me=out.members.find(m=>m.uid===UID);if(me)T.me={...T.me,...me};
  SP.D[tid]={...out,at:Date.now(),loading:false,err};
  if(curTid()===tid&&SP.cur!=='moi')render();
}
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&SP.cur!=='moi'){const t=curTid();if(t)loadData(t,true)}});
const dataOf=tid=>SP.D[tid]||{members:[],events:[],programs:[],wellness:[],logs:[]};
const memName=(tid,uid)=>(dataOf(tid).members.find(m=>m.uid===uid)||{}).name||(uid===UID?SP.T[tid]?.me?.name:'')||'Joueur';

/* ---------- charge, forme et statut ---------- */
function loadStats(logs,uid,now=Date.now()){
  const L=logs.filter(l=>l.uid===uid);
  const acute=L.filter(l=>l.at>=now-7*DAY).reduce((a,l)=>a+l.load,0);
  const chronic=L.filter(l=>l.at<now-7*DAY&&l.at>=now-35*DAY).reduce((a,l)=>a+l.load,0)/4;
  return{acute,chronic,ratio:chronic>0?acute/chronic:null,n7:L.filter(l=>l.at>=now-7*DAY).length}
}
function lastWell(well,uid,days=3){const min=dayKey(Date.now()-(days-1)*DAY);const w=well.filter(x=>x.uid===uid&&x.day>=min);return w.length?w[w.length-1]:null}
const painMax=w=>w?Math.max(0,...Object.values(w.pains)):0;
function playerStatus(tid,uid){
  const D=dataOf(tid),st=loadStats(D.logs,uid),w=lastWell(D.wellness,uid),pm=painMax(w);
  const hasData=w||D.logs.some(l=>l.uid===uid&&l.at>=Date.now()-14*DAY);
  let s='none';
  if(hasData){s='v';if((st.ratio!=null&&st.ratio>=1.5)||pm>=4)s='r';else if((st.ratio!=null&&(st.ratio>=1.3||st.ratio<0.7))||pm>=2||(w&&(w.som<=2||w.mot<=2)))s='o'}
  return{s,st,w,pm}
}
const ST_L={r:'Rouge',o:'Orange',v:'Vert',none:'—'};
const pctTxt=r=>r==null?'—':(r>=1?'+':'−')+Math.abs(Math.round((r-1)*100))+' %';

/* ---------- silhouette des douleurs ---------- */
const ZONES={
 f:[['f_tete','Tête',80,28],['f_cou','Cou',80,55],['f_epD','Épaule droite',36,70],['f_epG','Épaule gauche',124,70],['f_abdo','Abdos',80,118],['f_coudeD','Coude droit',27,116],['f_coudeG','Coude gauche',133,116],['f_poigD','Poignet droit',27,158],['f_poigG','Poignet gauche',133,158],['f_hanD','Hanche droite',58,166],['f_hanG','Hanche gauche',102,166],['f_cuiD','Cuisse droite',60,210],['f_cuiG','Cuisse gauche',100,210],['f_genD','Genou droit',60,248],['f_genG','Genou gauche',100,248],['f_chevD','Cheville droite',60,299],['f_chevG','Cheville gauche',100,299]],
 b:[['b_nuque','Nuque',80,55],['b_epG','Épaule gauche (arrière)',36,70],['b_epD','Épaule droite (arrière)',124,70],['b_dos','Haut du dos',80,88],['b_lomb','Lombaires',80,134],['b_coudeG','Coude gauche (arrière)',27,116],['b_coudeD','Coude droit (arrière)',133,116],['b_fesG','Fessier gauche',60,166],['b_fesD','Fessier droit',100,166],['b_iscG','Ischio gauche',60,212],['b_iscD','Ischio droit',100,212],['b_molG','Mollet gauche',60,266],['b_molD','Mollet droit',100,266],['b_achG','Achille gauche',60,301],['b_achD','Achille droit',100,301]]
};
const ZONE_L=Object.fromEntries([...ZONES.f,...ZONES.b].map(z=>[z[0],z[1]]));
const BODY='<g class="bd-s"><circle cx="80" cy="28" r="20"/><rect x="72" y="46" width="16" height="14"/><rect x="40" y="58" width="80" height="96" rx="16"/><rect x="18" y="62" width="18" height="104" rx="9"/><rect x="124" y="62" width="18" height="104" rx="9"/><rect x="44" y="148" width="72" height="34" rx="10"/><rect x="45" y="176" width="31" height="134" rx="14"/><rect x="84" y="176" width="31" height="134" rx="14"/></g>';
function bodyMap(side,pains,o={}){
  const W=o.w||150,k=W/160,H=Math.round(320*k);
  let h=`<div class="bodymap" style="width:${W}px;height:${H}px"><svg viewBox="0 0 160 320" width="${W}" height="${H}" aria-hidden="true">${BODY}${side==='b'?'<path d="M80 62V150" class="bd-l"/>':''}</svg>`;
  for(const [id,label,x,y] of ZONES[side]){const v=pains[id];
    if(o.act)h+=`<button class="bz ${v?'on':''}" style="left:${Math.round(x*k-14)}px;top:${Math.round(y*k-14)}px" data-act="${o.act}" data-z="${id}" aria-label="${label}" aria-pressed="${!!v}"></button>`;
    else if(v)h+=`<span class="bz on s${v}" style="left:${Math.round(x*k-(o.dot||9))}px;top:${Math.round(y*k-(o.dot||9))}px;width:${(o.dot||9)*2}px;height:${(o.dot||9)*2}px" title="${label} ${v}/5"></span>`}
  return h+'</div>';
}

/* ---------- vue d'équipe ---------- */
const TABS_BY={
  coach:[['effectif','Effectif',SPICON.pulse],['planning','Planning',SPICON.cal],['programs','Programmes',SPICON.dumb],['members','Membres',SPICON.team]],
  player:[['home','Accueil',SPICON.home],['planning','Planning',SPICON.cal],['programs','Programmes',SPICON.dumb],['team','Équipe',SPICON.team]],
  spectator:[['planning','Planning',SPICON.cal],['team','Équipe',SPICON.team]]
};
function renderTeam(tid){
  const T=SP.T[tid],role=T.me.role,tabs=TABS_BY[role]||TABS_BY.spectator;
  let tab=SP.tab[tid];if(!tabs.some(t=>t[0]===tab))tab=tabs[0][0];
  setTabs(tabs,tab);loadData(tid);
  const D=SP.D[tid];
  let h=`<div class="wrap">${spTop(T.team.name,(T.team.club||'')+(role==='spectator'?' · spectateur':''),teamLogo(T.team),teamsOf('club').length>1?'sp-list':'')}`;
  if(!D||(D.loading&&!D.at)){$('#view').innerHTML=h+`<p class="muted">Chargement de l'équipe…</p></div>`;return}
  if(D.err&&!D.members.length&&!D.events.length)h+=`<div class="card sp-warn">${SPICON.warn}<span>Certaines données n'ont pas pu être chargées. Vérifie ta connexion.</span></div>`;
  h+=tab==='effectif'?viewEffectif(tid):tab==='planning'?viewPlanning(tid):tab==='programs'?viewPrograms(tid):tab==='members'?membersSection(tid):tab==='team'?viewRoster(tid):viewPlayerHome(tid);
  $('#view').innerHTML=h+'</div>';
  if(tab==='effectif')requestAnimationFrame(()=>{});
}

/* --- coach : effectif --- */
function viewEffectif(tid){
  const D=dataOf(tid),players=D.members.filter(m=>m.role==='player'),today=dayKey(Date.now());
  if(!players.length)return `<div class="card empty"><h3>Pas encore de joueurs</h3><p>Invite tes joueurs depuis l'onglet Membres, puis donne-leur le rôle de joueur.</p><button class="btn primary" data-act="sp-tab" data-v="members">Inviter des joueurs</button></div>`;
  const rows=players.map(p=>({p,...playerStatus(tid,p.uid)}));
  const cnt=s=>rows.filter(r=>r.s===s).length;
  const doneT=players.filter(p=>D.wellness.some(w=>w.uid===p.uid&&w.day===today)),miss=players.filter(p=>!doneT.includes(p));
  const alert=rows.filter(r=>r.s==='r').sort((a,b)=>(b.st.ratio||0)-(a.st.ratio||0))[0];
  const order={r:0,o:1,v:2,none:3};rows.sort((a,b)=>order[a.s]-order[b.s]||(b.st.ratio||0)-(a.st.ratio||0));
  let h=`<div class="tiles st3"><div class="tile t-r"><b class="num">${cnt('r')}</b><span>Rouge</span></div><div class="tile t-o"><b class="num">${cnt('o')}</b><span>Orange</span></div><div class="tile t-v"><b class="num">${cnt('v')}</b><span>Vert</span></div></div>
   <section class="card sp-q"><div class="r"><span>Questionnaires du matin</span><b class="num">${doneT.length} / ${players.length}</b></div><div class="bar"><i style="width:${Math.round(doneT.length/players.length*100)}%"></i></div>
   ${miss.length?`<div class="r"><span class="small muted">Pas encore remplis : ${esc(miss.slice(0,6).map(m=>m.name).join(', '))}${miss.length>6?'…':''}</span><button class="btn ghost sm" data-act="tm-remind" data-id="${tid}">Rappel</button></div>`:'<div class="small muted">Tout le monde a répondu ce matin.</div>'}</section>`;
  if(alert){const w=alert.w,pz=w?Object.entries(w.pains).sort((a,b)=>b[1]-a[1])[0]:null;
    h+=`<div class="card sp-alert">${SPICON.warn}<div><b>${esc(alert.p.name)}</b> ${alert.st.ratio!=null?`a une charge ${pctTxt(alert.st.ratio)} par rapport à son habitude`:'est à surveiller'}${pz?`, douleur ${esc(ZONE_L[pz[0]].toLowerCase())} ${pz[1]}/5`:''}.</div></div>`}
  h+=`<section><div class="h2">Effectif · ${players.length}<span class="small">Charge 7 j · douleur</span></div><div class="list">`;
  for(const r of rows){const pz=r.w?Object.entries(r.w.pains).sort((a,b)=>b[1]-a[1])[0]:null;
    h+=`<button class="row sp-pl" data-act="tm-player" data-id="${tid}" data-u="${esc(r.p.uid)}"><i class="sdot s-${r.s}"></i><div class="m"><div>${esc(r.p.name)}</div><small>${esc(r.p.poste||'')}</small></div><span class="ch num c-${r.s}">${pctTxt(r.st.ratio)}</span><span class="pz small">${pz?esc(ZONE_L[pz[0]].split(' ')[0])+' '+pz[1]+'/5':'—'}</span><span class="rpill s-${r.s}">${ST_L[r.s]}</span></button>`}
  h+=`</div><p class="small muted" style="margin:4px 0 0">Indicateur d'aide basé sur la charge (durée × difficulté) et le questionnaire du matin. Ce n'est pas un avis médical.</p></section>`;
  return h;
}
function openPlayer(tid,uid){
  const D=dataOf(tid),m=D.members.find(x=>x.uid===uid);if(!m)return;
  const {s,st,w}=playerStatus(tid,uid),now=Date.now();
  const well7=D.wellness.filter(x=>x.uid===uid&&x.day>=dayKey(now-6*DAY));
  const som=well7.length?well7.reduce((a,x)=>a+x.som,0)/well7.length:null;
  const pains={};well7.forEach(x=>{for(const k in x.pains)pains[k]=Math.max(pains[k]||0,x.pains[k])});
  const pf={},pb={};for(const k in pains)(k[0]==='f'?pf:pb)[k]=pains[k];
  const logs=D.logs.filter(l=>l.uid===uid).slice().reverse();
  const progs=D.programs.filter(p=>p.invitees.includes(uid)&&p.date>=now-7*DAY&&p.date<sod(now)+2*DAY);
  const doneP=progs.filter(p=>D.logs.some(l=>l.uid===uid&&l.programId===p.id));
  let h=sheetHead(m.name,'tm-player-close',`<span class="rpill s-${s}">${ST_L[s]}</span>`)+`<div class="sheet-b"><div class="wrap sp-col">
   <div class="small muted">${esc(m.poste||'Joueur')}</div>
   <div class="tiles"><div class="tile"><span>vs habituelle</span><b class="num c-${s}">${pctTxt(st.ratio)}</b></div><div class="tile"><span>Sommeil 7 j</span><b class="num">${som!=null?fmtN(som)+'/5':'—'}</b></div><div class="tile"><span>Programmes</span><b class="num">${progs.length?doneP.length+'/'+progs.length:'—'}</b></div></div>
   <section class="card"><div class="chart-h"><b>Charge · 6 semaines</b><span class="small muted">durée × difficulté</span></div><canvas class="chart" id="c-pl"></canvas></section>
   <section class="card"><div class="chart-h"><b>Douleurs · 7 jours</b></div>${Object.keys(pains).length?`<div class="sp-pains"><div class="bm2">${bodyMap('f',pf,{w:84,dot:7})}${bodyMap('b',pb,{w:84,dot:7})}</div><div class="list sm">${Object.entries(pains).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`<div class="pz-r"><b>${esc(ZONE_L[k])}</b><span class="num">${v}/5</span></div>`).join('')}</div></div>`:'<p class="muted small" style="margin:0">Aucune douleur signalée.</p>'}</section>
   <section class="card"><div class="chart-h"><b>Questionnaires</b><span class="small muted">motivation · sommeil</span></div>${well7.length?`<div class="wgrid">${well7.slice().reverse().map(x=>`<div><span>${dShort(keyTime(x.day))}</span><b class="num">${x.mot} · ${x.som}</b></div>`).join('')}</div>`:'<p class="muted small" style="margin:0">Aucun questionnaire cette semaine.</p>'}</section>
   <section><div class="h2">Derniers ressentis</div>${logs.length?`<div class="list">${logs.slice(0,8).map(l=>`<div class="row sp-log"><div class="m"><div>${esc(l.title)}</div><small>${dShort(l.at)} · ${l.dur} min · difficulté ${l.rpe}/10${l.comment?' · « '+esc(l.comment)+' »':''}</small></div><span class="num ch">${Math.round(l.load)}</span></div>`).join('')}</div>`:'<p class="muted small" style="margin:0">Pas encore de ressenti.</p>'}</section>
  </div></div>`;
  openSheet('tm-player',h);
  requestAnimationFrame(()=>{const cv=$('#c-pl');if(!cv)return;const labels=[],values=[];for(let k=5;k>=0;k--){const a=now-(k+1)*7*DAY,b=now-k*7*DAY;labels.push(k?dfr(a):'7 j');values.push(Math.round(D.logs.filter(l=>l.uid===uid&&l.at>=a&&l.at<b).reduce((x,l)=>x+l.load,0)))}drawChart(cv,{type:'bar',labels,values})});
}

/* --- planning --- */
const PW={};
function weekStrip(tid,evs){
  const off=PW[tid]||0,a=wkStart(off),today=sod(Date.now());
  let h=`<div class="wk-nav"><button class="icon-btn" data-act="tm-wk" data-id="${tid}" data-d="-1" aria-label="Semaine précédente">${ICON.back}</button><b>${off===0?'Cette semaine':off===1?'Semaine prochaine':off===-1?'Semaine dernière':'Semaine du '+dfr(a)}</b><button class="icon-btn" data-act="tm-wk" data-id="${tid}" data-d="1" aria-label="Semaine suivante" style="transform:scaleX(-1)">${ICON.back}</button></div><div class="wk">`;
  for(let i=0;i<7;i++){const t=a+i*DAY,n=evs.filter(e=>e.start>=t&&e.start<t+DAY).length;h+=`<div class="wd ${t===today?'today':''}"><span>${new Date(t).toLocaleDateString('fr-FR',{weekday:'short'}).replace('.','')}</span><b>${new Date(t).getDate()}</b><i class="${n?'on':''}"></i></div>`}
  return h+'</div>';
}
function evRow(tid,e,o={}){
  const vid=e.video?`<a class="icon-btn ev-vid" href="${esc(e.video)}" target="_blank" rel="noopener noreferrer" aria-label="Ouvrir la vidéo">${SPICON.play}</a>`:'';
  const inv=o.count?`<span class="small muted">${e.invitees.length} convoqué${e.invitees.length>1?'s':''}</span>`:'';
  return `<div class="ev ev-${e.type}"><button class="ev-b" data-act="tm-ev" data-id="${tid}" data-e="${e.id}"><span class="ev-t"><span class="small muted">${o.day?dShort(e.start):''}</span><b class="num">${hm(e.start)}</b></span><span class="ev-m"><span class="ev-k">${EVT[e.type]}</span><b>${esc(e.title)}</b><small class="muted">${e.dur} min${e.place?' · '+esc(e.place):''}</small>${inv}</span></button>${vid}</div>`;
}
function viewPlanning(tid){
  const T=SP.T[tid],D=dataOf(tid),role=T.me.role,off=PW[tid]||0,a=wkStart(off),b=a+7*DAY;
  const evs=D.events.filter(e=>e.start>=a&&e.start<b);
  let h=weekStrip(tid,D.events);
  if(role==='player'||role==='client')h+=`<p class="small muted sp-note">${SPICON.lock}Tu ne vois que les créneaux où ton coach t'a convoqué.</p>`;
  if(!evs.length)h+=`<div class="card"><p class="muted" style="margin:0">Rien de prévu ${off===0?'cette semaine':'sur cette semaine'}.</p></div>`;
  else{let last='';h+=`<div class="list">`;for(const e of evs){const k=dayKey(e.start);if(k!==last){last=k;h+=`<div class="ev-day">${dLong(e.start)}</div>`}h+=evRow(tid,e,{count:role==='coach'})}h+=`</div>`}
  if(role==='coach')h+=`<section><button class="btn primary block" data-act="tm-ev-new" data-id="${tid}">+ Nouveau créneau</button></section>`;
  return h;
}
let EV=null;
function openEvent(tid,eid){
  const T=SP.T[tid],D=dataOf(tid),e=D.events.find(x=>x.id===eid);if(!e)return;
  const role=T.me.role,past=e.start<Date.now(),myLog=D.logs.find(l=>l.uid===UID&&l.eventId===e.id);
  const names=role==='coach'?e.invitees.map(u=>memName(tid,u)):[];
  openSheet('tm-ev',sheetHead(e.title,'tm-ev-close')+`<div class="sheet-b"><div class="wrap sp-col">
   <div class="card ev-card ev-${e.type}"><span class="ev-k">${EVT[e.type]}</span><b style="text-transform:capitalize">${dLong(e.start)}</b><span>${hm(e.start)} · ${e.dur} min</span>${e.place?`<span class="muted">${esc(e.place)}</span>`:''}</div>
   ${e.video?`<a class="btn ghost block" href="${esc(e.video)}" target="_blank" rel="noopener noreferrer">${SPICON.play} Ouvrir la vidéo</a>`:''}
   ${role==='coach'?`<section class="card"><div class="h2">Convoqués · ${e.invitees.length}</div><p style="margin:0">${esc(names.join(', ')||'Personne')}</p></section>
     <div class="sp-2"><button class="btn ghost" data-act="tm-ev-edit" data-id="${tid}" data-e="${e.id}">Modifier</button><button class="btn danger" data-act="tm-ev-del" data-id="${tid}" data-e="${e.id}">Supprimer</button></div>`:''}
   ${(role==='player'||role==='client')&&past&&['training','muscu','match','recup'].includes(e.type)?(myLog?`<div class="card"><b>Ressenti donné ✓</b><p class="small muted" style="margin:4px 0 0">Difficulté ${myLog.rpe}/10 · ${myLog.dur} min</p></div>`:`<button class="btn primary block" data-act="tm-rs-ev" data-id="${tid}" data-e="${e.id}">Donner mon ressenti</button>`):''}
  </div></div>`);
}
function openEventEdit(tid,eid){
  const D=dataOf(tid),e=eid?D.events.find(x=>x.id===eid):null,t0=e?e.start:(()=>{const d=new Date();d.setDate(d.getDate()+1);d.setHours(18,0,0,0);return d.getTime()})();
  const players=D.members.filter(m=>m.role==='player'||m.role==='client');
  EV={tid,id:e?e.id:null,type:e?e.type:'training',dest:e&&e.invitees.length<players.length?'sel':'all',sel:new Set(e?e.invitees:players.map(p=>p.uid))};
  renderEventEdit({title:e?e.title:'',date:isoDate(t0),time:isoTime(t0),dur:e?e.dur:90,place:e?e.place:'',video:e?e.video:''});
}
function renderEventEdit(v){
  const D=dataOf(EV.tid),players=D.members.filter(m=>m.role==='player'||m.role==='client');
  openSheet('tm-eved',sheetHead(EV.id?'Modifier le créneau':'Nouveau créneau','tm-eved-close')+`<div class="sheet-b"><div class="wrap sp-col">
   <div class="chips left">${Object.entries(EVT).map(([k,l])=>`<button class="chip-b" data-act="tm-evtype" data-v="${k}" aria-pressed="${EV.type===k}">${l}</button>`).join('')}</div>
   <div class="field"><label for="ev-title">Titre</label><input id="ev-title" value="${esc(v.title)}" placeholder="${esc(EVT[EV.type])}" maxlength="80"></div>
   <div class="sp-2"><div class="field"><label for="ev-date">Date</label><input id="ev-date" type="date" value="${v.date}"></div><div class="field"><label for="ev-time">Heure</label><input id="ev-time" type="time" value="${v.time}"></div></div>
   <div class="sp-2"><div class="field"><label for="ev-dur">Durée (min)</label><input id="ev-dur" type="number" inputmode="numeric" min="5" max="600" value="${v.dur}"></div><div class="field"><label for="ev-place">Lieu</label><input id="ev-place" value="${esc(v.place)}" maxlength="80" placeholder="Gymnase…"></div></div>
   <div class="field"><span class="flabel">Qui est convoqué ? <b class="num" style="color:var(--pr)">${EV.dest==='all'?players.length:EV.sel.size} / ${players.length}</b></span>
    <div class="seg" style="grid-template-columns:1fr 1fr"><button data-act="tm-evdest" data-v="all" aria-pressed="${EV.dest==='all'}">Tout le groupe</button><button data-act="tm-evdest" data-v="sel" aria-pressed="${EV.dest==='sel'}">Sélection</button></div></div>
   ${EV.dest==='sel'?`<div class="card sp-checks">${players.length?players.map(p=>`<label><input type="checkbox" data-evu="${esc(p.uid)}" ${EV.sel.has(p.uid)?'checked':''}><span>${esc(p.name)}</span><small class="muted">${esc(p.poste||'')}</small></label>`).join(''):'<p class="muted small" style="margin:0">Pas encore de joueurs dans l\'équipe.</p>'}</div>`:''}
   <div class="field"><label for="ev-video">Lien vidéo (facultatif)</label><input id="ev-video" type="url" inputmode="url" value="${esc(v.video)}" placeholder="https://… (YouTube, Drive…)"></div>
  </div></div><div class="sheet-f"><div class="in"><button class="btn primary" data-act="tm-ev-save">${EV.id?'Enregistrer':'Publier le créneau'}</button></div></div>`);
}
const evVals=()=>({title:$('#ev-title').value,date:$('#ev-date').value,time:$('#ev-time').value,dur:$('#ev-dur').value,place:$('#ev-place').value,video:$('#ev-video').value});
async function saveEvent(btn){
  const v=evVals(),start=fromIso(v.date,v.time),dur=Math.round(cNum(v.dur,5,600,60)),video=v.video.trim();
  if(!start){toast('Indique une date valide');return}
  if(video&&!okUrl(video)){$('#ev-video').focus();toast('Le lien vidéo doit commencer par https://');return}
  const D=dataOf(EV.tid),players=D.members.filter(m=>m.role==='player'||m.role==='client');
  const invitees=EV.dest==='all'?players.map(p=>p.uid):[...EV.sel].filter(u=>players.some(p=>p.uid===u));
  const doc={type:EV.type,title:v.title.trim().slice(0,80)||EVT[EV.type],start,dur,place:v.place.trim().slice(0,80),invitees,by:UID,at:Date.now()};if(video)doc.video=video;
  btn.disabled=true;const id=EV.id||gid();
  try{await subCol(EV.tid,'events').doc(id).set(doc);const e=cEvent(id,doc);D.events=D.events.filter(x=>x.id!==id).concat(e).sort((a,b)=>a.start-b.start);
    closeSheet('tm-eved');closeSheet('tm-ev');EV=null;render();toast(`Créneau publié · visible par ${invitees.length} joueur${invitees.length>1?'s':''}`)}
  catch(x){btn.disabled=false;toast('Enregistrement impossible. Vérifie ta connexion.')}
}
async function delEvent(tid,eid){try{await subCol(tid,'events').doc(eid).delete();const D=dataOf(tid);D.events=D.events.filter(e=>e.id!==eid);closeModal();closeSheet('tm-ev');render();toast('Créneau supprimé')}catch(e){toast('Suppression impossible.')}}

/* --- programmes --- */
function recordsClub(tid){const r={};for(const l of dataOf(tid).logs)if(l.uid===UID)for(const it of l.items||[])if(it.weight!=null&&it.done>0)r[it.exoId]=Math.max(r[it.exoId]||0,it.weight);return r}
const round05=x=>Math.round(x*2)/2;
function loadTxt(it,rec){if(it.lt==='kg')return fmtKg(it.lv);if(it.lt==='pct'){const r=rec&&rec[it.exoId];return `${fmtN(it.lv)} % du record${r?' · '+fmtKg(round05(r*it.lv/100)):''}`}return ''}
const pVol=it=>it.mode==='time'?`${it.sets} × ${mmss(it.dur)}`:it.mode==='max'?`${it.sets} × max`:`${it.sets} × ${it.reps}`;
function viewPrograms(tid){
  const T=SP.T[tid],D=dataOf(tid),role=T.me.role,now=Date.now();
  if(role==='coach'){
    const up=D.programs.filter(p=>p.date>=sod(now)),past=D.programs.filter(p=>p.date<sod(now)).reverse();
    const card=p=>{const done=new Set(D.logs.filter(l=>l.programId===p.id).map(l=>l.uid)).size;return `<button class="row sp-prog" data-act="tm-prog" data-id="${tid}" data-p="${p.id}"><div class="m"><div>${esc(p.title)}</div><small>${dShort(p.date)} · ${p.items.length} exercice${p.items.length>1?'s':''} · ${p.invitees.length} destinataire${p.invitees.length>1?'s':''}</small></div><span class="num ch">${done}/${p.invitees.length}</span></button>`};
    let h=`<section><button class="btn primary block" data-act="tm-prog-new" data-id="${tid}">+ Nouveau programme</button><p class="small muted" style="margin:0">Remplace la feuille papier : tes joueurs suivent le programme en salle et notent leurs charges.</p></section>`;
    h+=`<section><div class="h2">À venir · ${up.length}</div>${up.length?`<div class="list">${up.map(card).join('')}</div>`:'<p class="muted small" style="margin:0">Aucun programme prévu.</p>'}</section>`;
    if(past.length)h+=`<section><div class="h2">Passés</div><div class="list">${past.slice(0,15).map(card).join('')}</div></section>`;
    return h;
  }
  const mine=D.programs.slice().sort((a,b)=>b.date-a.date),done=id=>D.logs.find(l=>l.programId===id&&l.uid===UID);
  const todo=mine.filter(p=>!done(p.id)&&p.date>=sod(now)-2*DAY).sort((a,b)=>a.date-b.date),rest=mine.filter(p=>!todo.includes(p));
  const card=p=>{const d=done(p.id);return `<button class="row sp-prog" data-act="tm-prog" data-id="${tid}" data-p="${p.id}"><div class="m"><div>${esc(p.title)}</div><small>${dShort(p.date)} · ${p.items.length} exercice${p.items.length>1?'s':''}</small></div>${d?`<span class="rpill r-done">Fait ✓</span>`:`<span class="rpill r-todo">À faire</span>`}</button>`};
  let h=`<section><div class="h2">À faire · ${todo.length}</div>${todo.length?`<div class="list">${todo.map(card).join('')}</div>`:'<p class="muted small" style="margin:0">Aucun programme à faire pour le moment.</p>'}</section>`;
  if(rest.length)h+=`<section><div class="h2">Historique</div><div class="list">${rest.slice(0,20).map(card).join('')}</div></section>`;
  return h;
}
function openProgram(tid,pid){
  const T=SP.T[tid],D=dataOf(tid),p=D.programs.find(x=>x.id===pid);if(!p)return;
  const role=T.me.role,rec=role==='coach'?null:recordsClub(tid),myLog=D.logs.find(l=>l.programId===p.id&&l.uid===UID);
  let h=sheetHead(p.title,'tm-prog-close')+`<div class="sheet-b"><div class="wrap sp-col"><div class="small muted" style="text-transform:capitalize">${dLong(p.date)}${p.eventId&&D.events.find(e=>e.id===p.eventId)?' · lié au créneau de '+hm(D.events.find(e=>e.id===p.eventId).start):''}</div>
   ${p.note?`<div class="card sp-note2">${esc(p.note)}</div>`:''}
   <div class="list">${p.items.map((it,i)=>{const e=exo(it.exoId,it.name);return `<div class="row"><div class="fig sm">${figSVG(e,1)}</div><div class="m"><div>${esc(it.name||e.name)}</div><small>${pVol(it)}${loadTxt(it,rec)?' · '+esc(loadTxt(it,rec)):''}${it.note?' · '+esc(it.note):''}</small></div></div>`}).join('')}</div>`;
  if(role==='coach'){const who=p.invitees.map(u=>({u,n:memName(tid,u),l:D.logs.find(l=>l.programId===p.id&&l.uid===u)}));
    h+=`<section class="card"><div class="h2">Suivi · ${who.filter(x=>x.l).length}/${who.length}</div><div class="list sm">${who.map(x=>`<div class="pz-r"><b>${esc(x.n)}</b><span class="small ${x.l?'':'muted'}">${x.l?`Fait · ${x.l.rpe}/10`:'Pas encore'}</span></div>`).join('')}</div></section>
    <div class="sp-2"><button class="btn ghost" data-act="tm-prog-edit" data-id="${tid}" data-p="${p.id}">Modifier</button><button class="btn danger" data-act="tm-prog-del" data-id="${tid}" data-p="${p.id}">Supprimer</button></div>`}
  else if(myLog)h+=`<div class="card"><b>Fait ✓ ${ago(myLog.at)}</b><p class="small muted" style="margin:4px 0 0">Difficulté ${myLog.rpe}/10 · ${myLog.dur} min${myLog.note?` · retour du coach : « ${esc(myLog.note)} »`:''}</p></div>`;
  h+=`</div></div>`;
  if(role!=='coach'&&!myLog)h+=`<div class="sheet-f"><div class="in"><button class="btn primary" data-act="tm-run" data-id="${tid}" data-p="${p.id}">Démarrer</button></div></div>`;
  openSheet('tm-prog',h);
}
/* éditeur de programme (coach) */
let PE=null;
function openProgEdit(tid,pid){
  const D=dataOf(tid),p=pid?D.programs.find(x=>x.id===pid):null,players=D.members.filter(m=>m.role==='player'||m.role==='client');
  PE={tid,id:p?p.id:null,title:p?p.title:'',date:isoDate(p?p.date:Date.now()+DAY),eventId:p?p.eventId:'',items:p?clone(p.items):[],note:p?p.note:'',dest:p?(p.eventId?'event':p.invitees.length<players.length?'sel':'all'):'all',sel:new Set(p?p.invitees:players.map(m=>m.uid))};
  renderProgEdit();
}
function progVals(){if(!$('#pe-title'))return;PE.title=$('#pe-title').value;PE.date=$('#pe-date').value;PE.note=$('#pe-note').value;PE.items.forEach((it,i)=>{const n=$('#pe-n-'+i);if(n)it.note=n.value;const v=$('#pe-v-'+i);if(v)it.lv=cNum(String(v.value).replace(',','.'),0,2000,0)})}
function renderProgEdit(){
  const D=dataOf(PE.tid),players=D.members.filter(m=>m.role==='player'||m.role==='client'),now=Date.now();
  const evs=D.events.filter(e=>e.start>=sod(now)&&e.start<now+21*DAY);
  const sc=document.querySelector('#sheet-tm-ped .sheet-b')?.scrollTop||0;
  let h=sheetHead(PE.id?'Modifier le programme':'Nouveau programme','tm-ped-close')+`<div class="sheet-b"><div class="wrap sp-col">
   <div class="field"><label for="pe-title">Titre</label><input id="pe-title" value="${esc(PE.title)}" placeholder="Ex. Force · bas du corps" maxlength="80"></div>
   <div class="sp-2"><div class="field"><label for="pe-date">Date</label><input id="pe-date" type="date" value="${PE.date}"></div>
   <div class="field"><label for="pe-ev">Lié au créneau</label><select id="pe-ev"><option value="">Aucun</option>${evs.map(e=>`<option value="${e.id}" ${PE.eventId===e.id?'selected':''}>${esc(dShort(e.start)+' '+hm(e.start)+' · '+e.title)}</option>`).join('')}</select></div></div>
   <div class="field"><label for="pe-note">Consigne générale (facultatif)</label><input id="pe-note" value="${esc(PE.note)}" maxlength="300" placeholder="Ex. Échauffement 10 min avant"></div>
   <div class="h2">Exercices · ${PE.items.length}</div>`;
  PE.items.forEach((it,i)=>{const e=exo(it.exoId,it.name);
    h+=`<div class="card ed-item"><div class="ed-top"><div class="fig sm">${figSVG(e,1)}</div><div class="nm">${esc(it.name||e.name)}<small>${EQ[e.eq]||''}</small></div>
     <button class="icon-btn" data-act="pe-move" data-i="${i}" data-d="-1" aria-label="Monter" ${i===0?'disabled':''}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 15l6-6 6 6"/></svg></button>
     <button class="icon-btn" data-act="pe-del" data-i="${i}" aria-label="Retirer">${ICON.close}</button></div>
     <div class="seg" role="group" aria-label="Type de série">${[['reps','Reps'],['max','Max'],['time','Durée']].map(([m,l])=>`<button data-act="pe-mode" data-i="${i}" data-m="${m}" aria-pressed="${it.mode===m}">${l}</button>`).join('')}</div>
     <div class="ed-grid">${stepper('Séries',it.sets,'pe-stp',i,'sets','n')}${it.mode==='reps'?stepper('Reps',it.reps,'pe-stp',i,'reps','n'):it.mode==='time'?stepper('Durée',it.dur,'pe-stp',i,'dur'):'<div class="ed-note">Le joueur note ses reps</div>'}</div>
     <div class="seg" role="group" aria-label="Charge">${[['free','Libre'],['pct','% du record'],['kg','Kg fixe']].map(([m,l])=>`<button data-act="pe-lt" data-i="${i}" data-m="${m}" aria-pressed="${it.lt===m}">${l}</button>`).join('')}</div>
     ${it.lt!=='free'?`<div class="field"><label for="pe-v-${i}">${it.lt==='pct'?'Pourcentage du record du joueur':'Charge en kg'}</label><input id="pe-v-${i}" inputmode="decimal" value="${it.lv?numStr(it.lv):''}" placeholder="${it.lt==='pct'?'80':'20'}"></div>`:''}
     <div class="field"><label for="pe-n-${i}">Consigne (facultatif)</label><input id="pe-n-${i}" value="${esc(it.note)}" maxlength="120" placeholder="Ex. Tempo lent, repos 2 min"></div></div>`});
  h+=`<button class="btn line" data-act="pe-add">+ Ajouter des exercices</button>
   <div class="field"><span class="flabel">Envoyer à <b class="num" style="color:var(--pr)">${progDest().length} / ${players.length}</b></span>
    <div class="seg"><button data-act="pe-dest" data-v="all" aria-pressed="${PE.dest==='all'}">Tout le groupe</button><button data-act="pe-dest" data-v="event" aria-pressed="${PE.dest==='event'}" ${PE.eventId?'':'disabled'}>Convoqués</button><button data-act="pe-dest" data-v="sel" aria-pressed="${PE.dest==='sel'}">Sélection</button></div></div>
   ${PE.dest==='sel'?`<div class="card sp-checks">${players.map(p=>`<label><input type="checkbox" data-peu="${esc(p.uid)}" ${PE.sel.has(p.uid)?'checked':''}><span>${esc(p.name)}</span><small class="muted">${esc(p.poste||'')}</small></label>`).join('')||'<p class="muted small" style="margin:0">Pas encore de joueurs.</p>'}</div>`:''}
   <p class="small muted" style="margin:0">Avec « % du record », la charge est calculée pour chaque joueur à partir de ses records dans cet espace.</p>
  </div></div><div class="sheet-f"><div class="in"><button class="btn primary" data-act="pe-save">${PE.id?'Enregistrer':'Envoyer le programme'}</button></div></div>`;
  const el=openSheet('tm-ped',h);el.querySelector('.sheet-b').scrollTop=sc;
}
function progDest(){const D=dataOf(PE.tid),players=D.members.filter(m=>m.role==='player'||m.role==='client').map(m=>m.uid);
  if(PE.dest==='event'){const e=D.events.find(x=>x.id===PE.eventId);return e?e.invitees.filter(u=>players.includes(u)):[]}
  if(PE.dest==='sel')return[...PE.sel].filter(u=>players.includes(u));return players}
async function saveProg(btn){
  progVals();const date=fromIso(PE.date,'12:00');
  if(!PE.items.length){toast('Ajoute au moins un exercice');return}if(!date){toast('Indique une date');return}
  const invitees=progDest();if(!invitees.length){toast('Choisis au moins un destinataire');return}
  const doc={title:(PE.title||'').trim().slice(0,80)||'Programme',date,eventId:PE.eventId||'',items:PE.items.map(it=>({exoId:it.exoId,name:(it.name||exo(it.exoId).name).slice(0,80),sets:it.sets,reps:it.reps,mode:it.mode,dur:it.dur,lt:it.lt,lv:it.lv||0,note:(it.note||'').slice(0,120)})),invitees,note:(PE.note||'').trim().slice(0,300),by:UID,at:Date.now()};
  btn.disabled=true;const id=PE.id||gid();
  try{await subCol(PE.tid,'programs').doc(id).set(doc);const D=dataOf(PE.tid);D.programs=D.programs.filter(p=>p.id!==id).concat(cProgram(id,doc)).sort((a,b)=>a.date-b.date);
    closeSheet('tm-ped');closeSheet('tm-prog');const n=invitees.length;PE=null;render();toast(`Programme envoyé à ${n} ${SP.T[curTid()]?.team.kind==='coach'?'client':'joueur'}${n>1?'s':''}`)}
  catch(x){btn.disabled=false;toast('Envoi impossible. Vérifie ta connexion.')}
}
async function delProg(tid,pid){try{await subCol(tid,'programs').doc(pid).delete();const D=dataOf(tid);D.programs=D.programs.filter(p=>p.id!==pid);closeModal();closeSheet('tm-prog');render();toast('Programme supprimé')}catch(e){toast('Suppression impossible.')}}
/* sélecteur d'exercices : on masque les records de « Moi » */
let IDX_SAVED=null;
function pickForProgram(){progVals();IDX_SAVED=IDX;IDX={};openPicker('program')}
function restoreIdx(){if(IDX_SAVED){IDX=IDX_SAVED;IDX_SAVED=null}}

/* --- séance d'un programme (joueur / client), séparée de « Moi » --- */
let RUN=null;
const runKey=()=>'hevor.run:'+UID;
function runSave(){try{localStorage.setItem(runKey(),JSON.stringify(RUN))}catch(e){}}
function runLoad(){try{const o=JSON.parse(localStorage.getItem(runKey())||'null');if(o&&okId(o.tid)&&okId(o.pid)&&Array.isArray(o.items))return o}catch(e){}return null}
function startRun(tid,pid){
  const p=dataOf(tid).programs.find(x=>x.id===pid);if(!p)return;
  const prev=runLoad();
  if(prev&&prev.pid===pid&&prev.tid===tid)RUN=prev;
  else{const rec=recordsClub(tid);RUN={tid,pid,title:p.title,start:Date.now(),items:p.items.map(it=>({...it,w:it.lt==='kg'?numStr(it.lv):it.lt==='pct'&&rec[it.exoId]?numStr(round05(rec[it.exoId]*it.lv/100)):'',done:Array(it.sets).fill(false),rd:Array(it.sets).fill('')}))}}
  runSave();closeSheet('tm-prog');renderRun();
}
function renderRun(){
  if(!RUN)return;const rec=recordsClub(RUN.tid);const sc=document.querySelector('#sheet-tm-run .sheet-b')?.scrollTop||0;
  const nd=RUN.items.reduce((n,it)=>n+it.done.filter(Boolean).length,0),nt=RUN.items.reduce((n,it)=>n+it.done.length,0);
  let h=`<div class="sheet-h sess-h"><button class="icon-btn" data-act="run-min" aria-label="Réduire">${ICON.back}</button><h2>${esc(RUN.title)}</h2><span class="elapsed num">${nd}/${nt}</span><button class="btn primary" style="min-height:38px;padding:0 12px" data-act="run-end">Terminer</button></div><div class="sheet-b"><div class="wrap sp-col">`;
  RUN.items.forEach((it,i)=>{const e=exo(it.exoId,it.name),r=rec[it.exoId],all=it.done.every(Boolean);
    h+=`<article class="sc ${all?'done':''}"><div class="sc-head"><div class="fig">${figSVG(e,1)}</div><div class="sc-title"><h3>${esc(it.name||e.name)}</h3><p>${pVol(it)}${loadTxt(it,rec)?' · '+esc(loadTxt(it,rec)):''}</p>${it.note?`<p class="sp-cons">${esc(it.note)}</p>`:''}</div></div>
     <div class="stats3"><div class="st rec"><span class="lbl">Record club</span><b class="num">${r?fmtKg(r):'—'}</b><small>dans cet espace</small></div><div class="st"><span class="lbl">Objectif</span><b class="num">${it.lt==='kg'?fmtKg(it.lv):it.lt==='pct'&&r?fmtKg(round05(r*it.lv/100)):'—'}</b><small>${it.lt==='pct'?fmtN(it.lv)+' %':it.lt==='kg'?'fixé par le coach':'libre'}</small></div>
     <label class="st in" for="rw-${i}"><span class="lbl">Aujourd'hui</span><span class="inrow"><input id="rw-${i}" data-rwi="${i}" inputmode="decimal" placeholder="0" value="${esc(it.w)}" autocomplete="off" aria-label="Poids en kg"><span>kg</span></span><small>${r&&parseW(it.w)>r?'<span class="prtag">Nouveau record !</span>':'&nbsp;'}</small></label></div>
     <div class="sets">${it.done.map((d,j)=>it.mode==='max'?`<div class="set max ${d?'on':''}"><span class="sn">Série ${j+1}</span><input data-rri="${i}" data-rrj="${j}" inputmode="numeric" placeholder="reps" value="${esc(it.rd[j])}" aria-label="Reps série ${j+1}"><button class="ck" data-act="run-set" data-i="${i}" data-j="${j}" aria-pressed="${d}" aria-label="Valider la série ${j+1}">✓</button></div>`:`<button class="set ${d?'on':''}" data-act="run-set" data-i="${i}" data-j="${j}" aria-pressed="${d}"><span class="sn">Série ${j+1}</span><span class="sr">${it.mode==='time'?mmss(it.dur):it.reps+' reps'}</span><span class="ck">✓</span></button>`).join('')}</div></article>`});
  h+=`<p class="small muted" style="margin:0">Cette séance est enregistrée dans l'espace de l'équipe, pas dans « Moi ».</p></div></div>`;
  const el=openSheet('tm-run',h);el.querySelector('.sheet-b').scrollTop=sc;
}
function runSet(i,j){const it=RUN.items[i];if(!it)return;
  if(!it.done[j]&&it.mode==='max'&&!(parseInt(it.rd[j],10)>0)){toast('Indique le nombre de reps faites');return}
  if(!it.done[j]&&parseW(it.w)==null&&!['C','X'].includes(exo(it.exoId).eq)){$('#rw-'+i)?.focus();toast("Indique d'abord le poids utilisé");return}
  it.done[j]=!it.done[j];runSave();renderRun()}
function runFinish(){
  const items=RUN.items.map(it=>{const n=it.done.filter(Boolean).length,w=parseW(it.w);return{exoId:it.exoId,name:(it.name||exo(it.exoId).name).slice(0,80),weight:n?(w??0):null,done:n,sets:it.sets,reps:it.mode==='max'?it.rd.reduce((a,v,j)=>a+(it.done[j]?(parseInt(v,10)||0):0),0):it.mode==='time'?0:it.reps*n}});
  if(!items.some(x=>x.done)){toast('Valide au moins une série');return}
  const dur=Math.max(5,Math.round((Date.now()-RUN.start)/60000));
  openRessenti(RUN.tid,{kind:'program',programId:RUN.pid,title:RUN.title,dur,items,fromRun:true});
}

/* --- ressenti après séance --- */
let RS=null;
function openRessenti(tid,o){RS={tid,kind:o.kind||'training',eventId:o.eventId||'',programId:o.programId||'',title:o.title||'Séance',dur:o.dur||60,rpe:o.rpe||0,items:o.items||null,fromRun:!!o.fromRun,comment:''};renderRessenti()}
function renderRessenti(){
  const T=SP.T[RS.tid];
  openSheet('tm-rs',sheetHead('Fin de séance','tm-rs-close')+`<div class="sheet-b"><div class="wrap sp-col">
   <div><h1 class="sp-h1">C'était dur ?</h1><div class="muted small">${esc(RS.title)}</div></div>
   <section class="card"><div class="chart-h"><b>Difficulté</b><b class="num" style="color:var(--pr)">${RS.rpe?RS.rpe+'/10 · '+RPE_L[RS.rpe]:'—'}</b></div>
    <div class="rpe">${[1,2,3,4,5,6,7,8,9,10].map(n=>`<button data-act="rs-rpe" data-v="${n}" aria-pressed="${RS.rpe===n}" aria-label="Difficulté ${n} sur 10">${n}</button>`).join('')}</div>
    <div class="rpe-l small muted"><span>Très facile</span><span>Maximal</span></div></section>
   <div class="ed-grid">${stepper('Durée (min)',RS.dur,'rs-dur',null,null,'n')}<div class="stp"><span>Charge</span><div><output class="num">${RS.rpe?RS.dur*RS.rpe:'—'}</output><small class="muted">UA</small></div></div></div>
   <div class="field"><label for="rs-com">Un mot pour ${T.team.kind==='coach'?'ton coach':'le coach'} (facultatif)</label><input id="rs-com" value="${esc(RS.comment)}" maxlength="300" placeholder="Ex. épaule un peu raide en fin de séance"></div>
   <p class="small muted" style="margin:0">Visible seulement par ${T.team.kind==='coach'?'ton coach':'les coachs de '+esc(T.team.name)}.</p>
  </div></div><div class="sheet-f"><div class="in"><button class="btn primary" data-act="rs-save" ${RS.rpe?'':'disabled'}>Envoyer</button></div></div>`);
}
async function saveRessenti(btn){
  RS.comment=($('#rs-com')?.value||'').trim().slice(0,300);
  const doc={uid:UID,kind:RS.kind,title:RS.title.slice(0,80),at:Date.now(),dur:RS.dur,rpe:RS.rpe,load:RS.dur*RS.rpe};
  if(RS.eventId)doc.eventId=RS.eventId;if(RS.programId)doc.programId=RS.programId;if(RS.comment)doc.comment=RS.comment;if(RS.items)doc.items=RS.items;
  btn.disabled=true;const id=gid();
  try{await subCol(RS.tid,'logs').doc(id).set(doc);const D=dataOf(RS.tid);D.logs.push(cLog(id,doc));
    if(RS.fromRun){RUN=null;try{localStorage.removeItem(runKey())}catch(e){}closeSheet('tm-run')}
    closeSheet('tm-rs');closeSheet('tm-ev');RS=null;render();toast('Ressenti envoyé')}
  catch(e){btn.disabled=false;toast('Envoi impossible. Vérifie ta connexion.')}
}

/* --- joueur : accueil --- */
function streak(tid){const W=new Set(dataOf(tid).wellness.filter(w=>w.uid===UID).map(w=>w.day));let n=0,t=Date.now();if(!W.has(dayKey(t)))t-=DAY;while(W.has(dayKey(t))){n++;t-=DAY}return n}
function viewPlayerHome(tid){
  const T=SP.T[tid],D=dataOf(tid),now=Date.now(),today=dayKey(now),kind=T.team.kind;
  const wToday=D.wellness.find(w=>w.uid===UID&&w.day===today),sk=streak(tid);
  let h='';
  if(kind==='club')h+=wToday?`<button class="card sp-qdone" data-act="tm-q" data-id="${tid}"><span class="sp-ic ok">${ICON.check}</span><span class="m"><b>Questionnaire du matin fait</b><small>${sk>1?`Série de ${sk} jours · `:''}Touche pour modifier</small></span></button>`
    :`<button class="sp-qcta" data-act="tm-q" data-id="${tid}"><span class="sp-ic">${SPICON.clock}</span><span class="m"><b>Questionnaire du matin</b><small>15 secondes${sk?` · série de ${sk} jour${sk>1?'s':''}`:''}</small></span>${ICON.chev}</button>`;
  const toRate=D.events.filter(e=>['training','muscu','match','recup'].includes(e.type)&&e.start+e.dur*60000<=now&&e.start>=now-36*3600000&&!D.logs.some(l=>l.uid===UID&&l.eventId===e.id));
  for(const e of toRate.slice(-2))h+=`<button class="card sp-rate" data-act="tm-rs-ev" data-id="${tid}" data-e="${e.id}"><span class="sp-ic">${SPICON.pulse}</span><span class="m"><b>Comment c'était ?</b><small>${esc(e.title)} · ${dShort(e.start)} ${hm(e.start)}</small></span>${ICON.chev}</button>`;
  const todayEv=D.events.filter(e=>dayKey(e.start)===today);
  h+=`<section><div class="h2">Aujourd'hui<span class="small" style="text-transform:none;letter-spacing:0">${dLong(now)}</span></div>${todayEv.length?`<div class="list">${todayEv.map(e=>evRow(tid,e)).join('')}</div>`:'<p class="muted small" style="margin:0">Rien de prévu aujourd\'hui.</p>'}</section>`;
  const todo=D.programs.filter(p=>!D.logs.some(l=>l.programId===p.id&&l.uid===UID)&&p.date>=sod(now)-2*DAY).sort((a,b)=>a.date-b.date);
  if(todo.length)h+=`<section><div class="h2">Programmes à faire</div><div class="list">${todo.slice(0,3).map(p=>`<button class="row sp-prog" data-act="tm-prog" data-id="${tid}" data-p="${p.id}"><div class="m"><div>${esc(p.title)}</div><small>${dShort(p.date)} · ${p.items.length} exercices</small></div>${ICON.chev}</button>`).join('')}</div></section>`;
  const nm=D.events.find(e=>e.type==='match'&&e.start>=now);
  if(nm){const j=Math.round((sod(nm.start)-sod(now))/DAY);h+=`<section class="card sp-match"><div><small>Prochain match</small><b>${esc(nm.title)}</b><span class="muted small">${dShort(nm.start)} · ${hm(nm.start)}${nm.place?' · '+esc(nm.place):''}</span></div><span class="j num">${j<=0?'Jour J':'J-'+j}</span></section>`}
  const run=runLoad();if(run&&run.tid===tid)h=`<div class="banner"><div><small>Programme en cours</small><br><b>${esc(run.title)}</b></div><button class="btn" data-act="run-resume">Reprendre</button></div>`+h;
  return h;
}
/* --- équipe (joueur et spectateur) --- */
function viewRoster(tid){
  const T=SP.T[tid],D=dataOf(tid),ms=D.members.filter(m=>m.role!=='pending');
  const g=(r,l)=>{const a=ms.filter(m=>m.role===r);return a.length?`<div class="small muted sp-gl">${l} · ${a.length}</div><div class="roster">${a.map(m=>`<div class="rm"><b>${esc(m.name)}${m.uid===UID?' <span class="muted small">(toi)</span>':''}</b><small>${esc(m.poste||ROLE_L[m.role])}</small></div>`).join('')}</div>`:''};
  let h=`<section>${g('coach','Coachs')}${g('player','Joueurs')}</section>`;
  if(T.me.role==='spectator')h+=`<p class="small muted sp-note">${SPICON.lock}Accès en lecture : liste de l'équipe et planning. Aucune donnée de forme ni de santé.</p>`;
  return h+teamSettings(tid);
}

/* --- questionnaire du matin (données de santé : consentement explicite) --- */
let QS=null;
function openQuest(tid){
  const T=SP.T[tid],D=dataOf(tid),w=D.wellness.find(x=>x.uid===UID&&x.day===dayKey(Date.now()));
  QS={tid,mot:w?w.mot:0,som:w?w.som:0,pains:w?{...w.pains}:{},side:'f',consent:!!T.me.health};renderQuest();
}
function renderQuest(){
  const T=SP.T[QS.tid];
  if(!QS.consent){openSheet('tm-q',sheetHead('Questionnaire du matin','tm-q-close')+`<div class="sheet-b"><div class="wrap sp-col">
    <div class="card sp-consent"><span class="sp-ic">${SPICON.lock}</span><h3>Avant de commencer</h3>
    <p>Ce questionnaire contient des informations sur ta forme : motivation, sommeil et douleurs. Ce sont des <b>données de santé</b>.</p>
    <p>Elles sont visibles <b>uniquement par toi et les coachs de ${esc(T.team.name)}</b>, jamais par les autres joueurs ni les spectateurs. Ton espace « Moi » n'est pas concerné.</p>
    <p class="small muted">Tu peux retirer ton accord quand tu veux, dans Équipe › Mes réponses aux questionnaires : tes réponses sont alors effacées. Si tu as moins de 15 ans, demande d'abord l'accord d'un parent.</p>
    <label class="consent" for="q-ok"><input type="checkbox" id="q-ok"><span>J'accepte que mes réponses soient partagées avec les coachs de l'équipe.</span></label></div></div></div>
    <div class="sheet-f"><div class="in"><button class="btn primary" data-act="q-consent">Continuer</button></div></div>`);return}
  const sc=document.querySelector('#sheet-tm-q .sheet-b')?.scrollTop||0;
  const sel=ZONES[QS.side].filter(z=>QS.pains[z[0]]),other=Object.keys(QS.pains).filter(k=>k[0]!==QS.side).length;
  const scale=(k,l)=>`<div class="qrow"><b>${l}</b><div class="q5">${[1,2,3,4,5].map(n=>`<button data-act="q-set" data-k="${k}" data-v="${n}" aria-pressed="${QS[k]===n}" aria-label="${l} ${n} sur 5">${n}</button>`).join('')}</div></div>`;
  const h=sheetHead('Questionnaire du matin','tm-q-close')+`<div class="sheet-b"><div class="wrap sp-col">
   <h1 class="sp-h1">Comment tu te sens ?</h1>
   <section class="card">${scale('mot','Motivation')}${scale('som','Sommeil')}<div class="small muted">1 = très mal · 5 = excellent</div></section>
   <section class="card"><div class="chart-h"><b>Où as-tu mal ?</b><div class="seg mini"><button data-act="q-side" data-v="f" aria-pressed="${QS.side==='f'}">Face</button><button data-act="q-side" data-v="b" aria-pressed="${QS.side==='b'}">Dos</button></div></div>
    <div class="qmap">${bodyMap(QS.side,QS.pains,{act:'q-zone',w:150})}<div class="qsel">${sel.length?sel.map(([id,l])=>`<div class="qz"><b>${esc(l)}</b><small class="muted">Intensité de la douleur</small><div class="q5 sm">${[1,2,3,4,5].map(n=>`<button data-act="q-int" data-z="${id}" data-v="${n}" aria-pressed="${QS.pains[id]===n}" aria-label="Intensité ${n} sur 5">${n}</button>`).join('')}</div></div>`).join(''):`<p class="small muted" style="margin:0">Touche une zone de la silhouette si tu as mal. Sinon, rien à faire.</p>`}
    ${other?`<p class="small muted" style="margin:0">+ ${other} zone${other>1?'s':''} côté ${QS.side==='f'?'dos':'face'}</p>`:''}</div></div></section>
  </div></div><div class="sheet-f"><div class="in"><button class="btn primary" data-act="q-save" ${QS.mot&&QS.som?'':'disabled'}>Envoyer</button></div></div>`;
  const el=openSheet('tm-q',h);el.querySelector('.sheet-b').scrollTop=sc;
}
async function saveQuest(btn){
  const day=dayKey(Date.now()),doc={uid:UID,day,at:Date.now(),mot:QS.mot,som:QS.som,pains:QS.pains};btn.disabled=true;
  try{await subCol(QS.tid,'wellness').doc(UID+'_'+day).set(doc);const D=dataOf(QS.tid);D.wellness=D.wellness.filter(w=>!(w.uid===UID&&w.day===day)).concat(cWell(UID+'_'+day,doc));closeSheet('tm-q');QS=null;render();toast('Questionnaire envoyé · merci !')}
  catch(e){btn.disabled=false;toast('Envoi impossible. Vérifie ta connexion.')}
}
function openHealth(tid){
  const T=SP.T[tid];
  openSheet('tm-h',sheetHead('Mes réponses','tm-h-close')+`<div class="sheet-b"><div class="wrap sp-col"><div class="card">
   <p style="margin:0">${T.me.health?`Tu as accepté le ${dfull(T.me.health)} que tes réponses au questionnaire du matin soient visibles par les coachs de <b>${esc(T.team.name)}</b>.`:"Tu n'as pas donné ton accord : aucune réponse n'est partagée."}</p></div>
   ${T.me.health?`<button class="btn danger" data-act="q-revoke" data-id="${tid}">Retirer mon accord et effacer mes réponses</button>`:''}</div></div>`);
}
async function revokeHealth(tid,btn){
  btn.disabled=true;
  try{await delDocs(subCol(tid,'wellness').where('uid','==',UID));await memRef(tid,UID).update({health:0});SP.T[tid].me.health=0;const D=dataOf(tid);D.wellness=D.wellness.filter(w=>w.uid!==UID);closeSheet('tm-h');render();toast('Accord retiré, réponses effacées')}
  catch(e){btn.disabled=false;toast('Action impossible pour le moment.')}
}

/* ---------- actions ---------- */
const origPickDone=ACT['pick-done'],origPickClose=ACT['pick-close'];
Object.assign(ACT,{
  'pick-done':()=>{if(pick&&pick.target==='program'&&PE){[...pick.sel].forEach(id=>{const e=exo(id);PE.items.push({exoId:id,name:e.name,sets:3,reps:10,mode:TIMEIDS.has(id)?'time':'reps',dur:60,lt:'free',lv:0,note:''})});closeSheet('picker');pick=null;restoreIdx();renderProgEdit();return}origPickDone()},
  'pick-close':()=>{const p=pick&&pick.target==='program';origPickClose();if(p)restoreIdx()},
  'tm-player':d=>openPlayer(d.id,d.u),'tm-player-close':()=>closeSheet('tm-player'),
  'tm-remind':async()=>{const t='Pensez à remplir le questionnaire du matin sur Hevor (15 secondes) 💪';if(navigator.share){try{await navigator.share({text:t})}catch(e){}}else{try{await navigator.clipboard.writeText(t);toast('Message de rappel copié : colle-le dans le groupe de l\'équipe')}catch(e){toast(t)}}},
  'tm-wk':d=>{PW[d.id]=(PW[d.id]||0)+(+d.d);render()},
  'tm-ev':d=>openEvent(d.id,d.e),'tm-ev-close':()=>closeSheet('tm-ev'),
  'tm-ev-new':d=>openEventEdit(d.id,null),'tm-ev-edit':d=>openEventEdit(d.id,d.e),'tm-eved-close':()=>{closeSheet('tm-eved');EV=null},
  'tm-evtype':d=>{const v=evVals();EV.type=d.v;renderEventEdit(v)},
  'tm-evdest':d=>{const v=evVals();EV.dest=d.v;renderEventEdit(v)},
  'tm-ev-save':(d,b)=>saveEvent(b),
  'tm-ev-del':d=>modal(`<h3>Supprimer ce créneau ?</h3><p class="muted" style="margin:0">Il disparaîtra du planning de tous les joueurs.</p><div class="acts"><button class="btn danger" data-act="tm-ev-del-yes" data-id="${d.id}" data-e="${d.e}">Supprimer</button><button class="btn ghost" data-act="modal-close">Annuler</button></div>`),
  'tm-ev-del-yes':d=>delEvent(d.id,d.e),
  'tm-rs-ev':d=>{const e=dataOf(d.id).events.find(x=>x.id===d.e);if(!e)return;openRessenti(d.id,{kind:e.type==='match'?'match':'training',eventId:e.id,title:e.title,dur:e.dur})},
  'tm-prog':d=>openProgram(d.id,d.p),'tm-prog-close':()=>closeSheet('tm-prog'),
  'tm-prog-new':d=>openProgEdit(d.id,null),'tm-prog-edit':d=>openProgEdit(d.id,d.p),'tm-ped-close':()=>{closeSheet('tm-ped');PE=null},
  'tm-prog-del':d=>modal(`<h3>Supprimer ce programme ?</h3><p class="muted" style="margin:0">Il disparaîtra pour tous les destinataires. Les séances déjà faites restent dans leur historique.</p><div class="acts"><button class="btn danger" data-act="tm-prog-del-yes" data-id="${d.id}" data-p="${d.p}">Supprimer</button><button class="btn ghost" data-act="modal-close">Annuler</button></div>`),
  'tm-prog-del-yes':d=>delProg(d.id,d.p),
  'pe-add':()=>pickForProgram(),
  'pe-del':d=>{progVals();PE.items.splice(+d.i,1);renderProgEdit()},
  'pe-move':d=>{progVals();const i=+d.i,j=i+(+d.d);if(j<0||j>=PE.items.length)return;[PE.items[i],PE.items[j]]=[PE.items[j],PE.items[i]];renderProgEdit()},
  'pe-mode':d=>{progVals();PE.items[+d.i].mode=d.m;renderProgEdit()},
  'pe-lt':d=>{progVals();const it=PE.items[+d.i];it.lt=d.m;if(d.m==='pct'&&!it.lv)it.lv=75;renderProgEdit()},
  'pe-stp':d=>{progVals();const it=PE.items[+d.i],[mn,mx,st]=LIM[d.k];it[d.k]=Math.min(mx,Math.max(mn,(it[d.k]??0)+st*(+d.d)));renderProgEdit()},
  'pe-dest':d=>{progVals();PE.dest=d.v;renderProgEdit()},
  'pe-save':(d,b)=>saveProg(b),
  'tm-run':d=>startRun(d.id,d.p),'run-resume':()=>{RUN=runLoad();if(RUN)renderRun()},
  'run-min':()=>{closeSheet('tm-run');render()},'run-set':d=>runSet(+d.i,+d.j),
  'run-end':()=>{const nd=RUN.items.reduce((n,it)=>n+it.done.filter(Boolean).length,0);modal(`<h3>Terminer la séance ?</h3><p class="muted" style="margin:0">${nd} série${nd>1?'s':''} validée${nd>1?'s':''}. Tu donneras ensuite ton ressenti.</p><div class="acts"><button class="btn primary" data-act="run-finish" ${nd?'':'disabled'}>Terminer</button><button class="btn ghost" data-act="modal-close">Continuer</button><button class="btn danger" data-act="run-discard">Abandonner</button></div>`)},
  'run-finish':()=>{closeModal();runFinish()},
  'run-discard':()=>{closeModal();RUN=null;try{localStorage.removeItem(runKey())}catch(e){}closeSheet('tm-run');render();toast('Séance abandonnée')},
  'tm-rs-close':()=>{closeSheet('tm-rs');RS=null},
  'rs-rpe':d=>{RS.comment=$('#rs-com')?.value||'';RS.rpe=+d.v;renderRessenti()},
  'rs-dur':d=>{RS.comment=$('#rs-com')?.value||'';RS.dur=Math.min(600,Math.max(5,RS.dur+5*(+d.d)));renderRessenti()},
  'rs-save':(d,b)=>saveRessenti(b),
  'tm-q':d=>openQuest(d.id),'tm-q-close':()=>{closeSheet('tm-q');QS=null},
  'q-consent':async(d,b)=>{if(!$('#q-ok').checked){toast("Coche la case pour donner ton accord, ou ferme le questionnaire.");return}b.disabled=true;const now=Date.now();
    try{await memRef(QS.tid,UID).update({health:now});SP.T[QS.tid].me.health=now;QS.consent=true;renderQuest()}catch(e){b.disabled=false;toast('Enregistrement impossible.')}},
  'q-set':d=>{QS[d.k]=+d.v;renderQuest()},
  'q-side':d=>{QS.side=d.v;renderQuest()},
  'q-zone':d=>{if(QS.pains[d.z])delete QS.pains[d.z];else QS.pains[d.z]=1;renderQuest()},
  'q-int':d=>{QS.pains[d.z]=+d.v;renderQuest()},
  'q-save':(d,b)=>saveQuest(b),
  'sp-health':d=>openHealth(d.id),'tm-h-close':()=>closeSheet('tm-h'),'q-revoke':(d,b)=>revokeHealth(d.id,b)
});
document.addEventListener('input',e=>{const t=e.target;
  if(t.dataset.rwi!=null&&RUN){const it=RUN.items[+t.dataset.rwi];if(!it)return;it.w=t.value.replace(/[^\d.,]/g,'');if(it.w!==t.value)t.value=it.w;runSave();return}
  if(t.dataset.rri!=null&&RUN){const it=RUN.items[+t.dataset.rri];if(!it)return;const v=t.value.replace(/\D/g,'').slice(0,3);if(v!==t.value)t.value=v;it.rd[+t.dataset.rrj]=v;runSave();return}
});
document.addEventListener('change',e=>{const t=e.target;
  if(t.dataset.evu!=null&&EV){t.checked?EV.sel.add(t.dataset.evu):EV.sel.delete(t.dataset.evu);const v=evVals();renderEventEdit(v);return}
  if(t.dataset.peu!=null&&PE){progVals();t.checked?PE.sel.add(t.dataset.peu):PE.sel.delete(t.dataset.peu);renderProgEdit();return}
  if(t.id==='pe-ev'&&PE){progVals();PE.eventId=t.value;const e=dataOf(PE.tid).events.find(x=>x.id===t.value);if(e){PE.date=isoDate(e.start);if(PE.dest==='all')PE.dest='event'}else if(PE.dest==='event')PE.dest='all';renderProgEdit();return}
});
