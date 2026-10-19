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
function cPItem(it){if(!it||!okId(it.exoId))return null;return{exoId:it.exoId,name:cStr(it.name,80)||exo(it.exoId).name,sets:Math.round(cNum(it.sets,1,10,3)),reps:Math.round(cNum(it.reps,1,100,10)),mode:MODES.includes(it.mode)?it.mode:'reps',dur:Math.round(cNum(it.dur,5,14400,60)),lt:['free','pct','kg'].includes(it.lt)?it.lt:'free',lv:cNum(it.lv,0,2000,0),note:cStr(it.note,120)}}
function cProgram(id,d){d=d||{};return{id,title:cStr(d.title,80)||'Programme',date:cNum(d.date,0,4102444800000,0),eventId:okId(d.eventId)?d.eventId:'',items:(Array.isArray(d.items)?d.items:[]).slice(0,40).map(cPItem).filter(Boolean),invitees:cIds(d.invitees),note:cStr(d.note,300),by:cStr(d.by,128)}}
const avgOf=a=>a.length?a.reduce((x,y)=>x+y,0)/a.length:null;
/* questionnaires créés par les coachs du club : matin, soir ou après une séance */
const QTYPES={scale:'Échelle',yn:'Oui / Non',num:'Nombre',text:'Texte libre',body:'Douleurs (silhouette)',rpe:'Difficulté de la séance'};
const QID=/^[A-Za-z0-9]{1,12}$/,QSID=/^[A-Za-z0-9]{1,16}$/;
const QWHEN={morning:'Chaque matin',evening:'Chaque soir',after:'Après la séance'};
const QAFT={training:'Entraînement',muscu:'Muscu',match:'Match',recup:'Récup'};
const EVENING_H=17;
function cQ(q){if(!q||!QID.test(q.id)||!QTYPES[q.t])return null;const o={id:q.id,t:q.t,l:cStr(q.l,80)||QTYPES[q.t],req:q.t==='rpe'?q.req!==false:q.t!=='body'&&q.req===true};
  if(q.t==='scale'){o.n=q.n===10?10:5;o.hi=q.hi==='bad'?'bad':'good'}else if(q.t==='yn')o.w=['yes','no'].includes(q.w)?q.w:'';else if(q.t==='num')o.u=cStr(q.u,12);return o}
function cQuest(id,d){d=d||{};const when=QWHEN[d.when]?d.when:'morning';let body=false,rpe=false;
  const qs=(Array.isArray(d.qs)?d.qs:[]).slice(0,15).map(cQ).filter(q=>{if(!q)return false;if(q.t==='body'){if(body)return false;body=true}if(q.t==='rpe'){if(rpe||when!=='after')return false;rpe=true}return true});
  const aft=(Array.isArray(d.aft)?d.aft:[]).filter(t=>QAFT[t]);
  return{id,title:cStr(d.title,60)||(when==='after'?'Ressenti après séance':'Questionnaire de santé'),when,aft:when==='after'?(aft.length?aft:['training','muscu']):[],on:d.on===true&&qs.length>0,qs,at:cNum(d.at,0,4102444800000,0)}}
/* modèles proposés au coach */
const QUEST_TPLS={
  health:()=>({title:'Questionnaire de santé',when:'morning',qs:[{id:'mot',t:'scale',l:'Motivation',n:5,hi:'good',req:true},{id:'som',t:'scale',l:'Qualité du sommeil',n:5,hi:'good',req:true},{id:'fat',t:'scale',l:'Fatigue',n:5,hi:'bad',req:true},{id:'pz',t:'body',l:'Où as-tu mal ?',req:false}]}),
  after:()=>({title:'Ressenti après séance',when:'after',aft:['training','muscu','match'],qs:[{id:'rpe',t:'rpe',l:"C'était dur ?",req:true},{id:'com',t:'text',l:'Un mot pour le coach',req:false}]}),
  evening:()=>({title:'Bilan du soir',when:'evening',qs:[{id:'fat',t:'scale',l:'Fatigue',n:5,hi:'bad',req:true},{id:'pz',t:'body',l:'Où as-tu mal ?',req:false}]}),
  empty:()=>({title:'',when:'morning',qs:[]})
};
const questsOf=tid=>dataOf(tid).quests||[];
const questById=(tid,id)=>questsOf(tid).find(q=>q.id===id)||null;
const activeQuests=tid=>questsOf(tid).filter(q=>q.on);
function cWell(id,d){d=d||{};const p={};if(d.pains&&typeof d.pains==='object')for(const k in d.pains){if(ZONE_L[k]){p[k]=Math.round(cNum(d.pains[k],1,5,1))}}
  const a={};if(d.ans&&typeof d.ans==='object'){let n=0;for(const k in d.ans){if(!QID.test(k)||++n>20)continue;const v=d.ans[k];if(typeof v==='boolean')a[k]=v;else if(typeof v==='number'&&Number.isFinite(v))a[k]=Math.max(-1e6,Math.min(1e6,v));else if(typeof v==='string'&&v.trim())a[k]=v.slice(0,200)}}
  if(a.mot==null&&d.mot!=null)a.mot=Math.round(cNum(d.mot,1,5,3));if(a.som==null&&d.som!=null)a.som=Math.round(cNum(d.som,1,5,3));
  return{id,uid:cStr(d.uid,128),qid:typeof d.qid==='string'&&QSID.test(d.qid)?d.qid:'quest',ev:okId(d.ev)?d.ev:'',day:/^\d{8}$/.test(d.day)?d.day:'00000000',at:cNum(d.at,0,4102444800000,0),ans:a,pains:p}}
/* réponse d'un joueur à un questionnaire, pour un jour (matin, soir) ou une séance (après) */
const findAns=(tid,uid,qid,key)=>dataOf(tid).wellness.find(w=>w.uid===uid&&w.qid===qid&&(w.ev?w.ev===key:w.day===key))||null;
const wellId=(uid,q,key)=>uid+'_'+q.id+'_'+key;
/* ce que le joueur doit remplir : questionnaires du jour et des séances déjà commencées */
function dueList(tid,uid,o={}){
  const D=dataOf(tid),now=Date.now(),today=dayKey(now),out=[],days=o.days||1;
  for(const q of activeQuests(tid)){
    if(q.when!=='after'){if(q.when==='evening'&&new Date(now).getHours()<EVENING_H&&!o.all)continue;out.push({q,key:today,day:today,done:!!findAns(tid,uid,q.id,today)});continue}
    for(const e of D.events)if(e.invitees.includes(uid)&&q.aft.includes(e.type)&&e.start<=now&&e.start>=sod(now)-(days-1)*DAY)out.push({q,ev:e,key:e.id,day:dayKey(e.start),done:!!findAns(tid,uid,q.id,e.id)})
  }
  return out;
}
/* questionnaires « après séance » qui concernent un créneau */
const evQuests=(tid,e)=>activeQuests(tid).filter(q=>q.when==='after'&&q.aft.includes(e.type));
/* score d'une réponse : 1 = très bien, 0 = très mal (null si la question ne se note pas) */
function qScore(q,v){if(v==null)return null;if(q.t==='scale'){if(typeof v!=='number')return null;const r=(Math.min(q.n,Math.max(1,v))-1)/(q.n-1);return q.hi==='bad'?1-r:r}
  if(q.t==='yn'&&q.w&&typeof v==='boolean')return (q.w==='yes')===v?0:1;return null}
const qBad=(q,v)=>{const s=qScore(q,v);return s!=null&&s<=0.25};
function qTxt(q,v){if(v==null||v==='')return'—';if(q.t==='scale')return v+'/'+q.n;if(q.t==='rpe')return v+'/10';if(q.t==='yn')return v?'Oui':'Non';if(q.t==='num')return fmtN(v)+(q.u?' '+q.u:'');return String(v)}
/* indice de forme d'un questionnaire : moyenne des réponses notées, ramenée sur 5 */
function formeOf(w,tid){const quest=questById(tid,w.qid);if(!quest)return null;const sc=quest.qs.map(q=>qScore(q,w.ans[q.id])).filter(x=>x!=null);return sc.length?1+4*avgOf(sc):null}
const badOf=(w,tid)=>{const quest=questById(tid,w.qid);return quest?quest.qs.filter(q=>qBad(q,w.ans[q.id])):[]};

function cLog(id,d){d=d||{};return{id,uid:cStr(d.uid,128),kind:['training','program','match','free','muscu','recup'].includes(d.kind)?d.kind:'training',eventId:okId(d.eventId)?d.eventId:'',programId:okId(d.programId)?d.programId:'',title:cStr(d.title,80)||'Séance',at:cNum(d.at,0,4102444800000,0),dur:Math.round(cNum(d.dur,0,600,0)),rpe:d.rpe?Math.round(cNum(d.rpe,1,10,5)):0,load:cNum(d.load,0,6000,0),comment:cStr(d.comment,500),note:cStr(d.note,500),noteAt:cNum(d.noteAt,0,4102444800000,0),
  items:(Array.isArray(d.items)?d.items:[]).slice(0,40).filter(it=>it&&okId(it.exoId)).map(it=>({exoId:it.exoId,name:cStr(it.name,80),weight:it.weight==null?null:cNum(it.weight,0,2000,0),done:Math.round(cNum(it.done,0,20,0)),sets:Math.round(cNum(it.sets,0,20,0)),reps:Math.round(cNum(it.reps,0,999,0))}))}}

/* ---------- chargement des données de l'équipe ---------- */
async function loadData(tid,force){
  const T=SP.T[tid];if(!T||!DB)return;const D=SP.D[tid];
  if(D&&D.loading)return;if(D&&!force&&Date.now()-D.at<45000)return;
  SP.D[tid]={members:[],events:[],programs:[],wellness:[],logs:[],quests:[],...(D||{}),loading:true,at:D?D.at:0};
  const role=T.me.role,now=Date.now(),from=now-366*DAY,J={};
  try{const td=await teamRef(tid).get();if(td.exists)T.team=cTeam(tid,td.data())}catch(e){}
  const club=T.team.kind==='club';
  if(role!=='client'&&role!=='pending')J.members=subCol(tid,'members').get();
  if(role==='coach'||role==='spectator')J.events=subCol(tid,'events').where('start','>=',now-70*DAY).get();
  else if(role==='player'||role==='client')J.events=subCol(tid,'events').where('invitees','array-contains',UID).get();
  if(role==='coach'){J.programs=club?subCol(tid,'programs').get():subCol(tid,'programs').where('date','>=',now-70*DAY).get();J.wellness=subCol(tid,'wellness').where('day','>=',dayKey(from)).get();J.logs=subCol(tid,'logs').where('at','>=',from).get()}
  if(role==='player'||role==='client'){J.programs=club?subCol(tid,'programs').get():subCol(tid,'programs').where('invitees','array-contains',UID).get();J.wellness=subCol(tid,'wellness').where('uid','==',UID).get();J.logs=subCol(tid,'logs').where('uid','==',UID).get()}
  if(club&&(role==='coach'||role==='player'))J.quests=subCol(tid,'quests').get();
  const out={members:D?.members||[],events:D?.events||[],programs:D?.programs||[],wellness:D?.wellness||[],logs:D?.logs||[],quests:D?.quests||[]};let err=false,legacy=null;
  // ancien questionnaire unique (config/quest) : repris comme un questionnaire du matin
  const QP=(club&&(role==='coach'||role==='player'))?DB.doc(`teams/${tid}/config/quest`).get().then(q=>{if(q.exists){const x=q.data()||{};legacy=cQuest('quest',{...x,title:'Questionnaire de santé',when:'morning'});if(!legacy.qs.length)legacy=null}}).catch(()=>{}):Promise.resolve();
  await Promise.all(Object.entries(J).map(async([k,p])=>{try{const s=await p;
    out[k]=s.docs.map(x=>k==='members'?cMember(x.data()):k==='events'?cEvent(x.id,x.data()):k==='programs'?cProgram(x.id,x.data()):k==='wellness'?cWell(x.id,x.data()):k==='quests'?cQuest(x.id,x.data()):cLog(x.id,x.data()))}catch(e){if(k!=='quests')err=true}}).concat(QP));
  if(legacy&&!out.quests.some(q=>q.id==='quest'))out.quests.unshift({...legacy,legacy:true});
  out.quests.sort((a,b)=>a.at-b.at);
  out.events.sort((a,b)=>a.start-b.start);out.programs.sort((a,b)=>club?b.date-a.date:a.date-b.date);out.logs.sort((a,b)=>a.at-b.at);out.wellness.sort((a,b)=>a.day<b.day?-1:1);
  const me=out.members.find(m=>m.uid===UID);if(me)T.me={...T.me,...me};
  SP.D[tid]={...out,at:Date.now(),loading:false,err};
  if(typeof syncInvite==='function'&&!err)syncInvite(tid);
  if(curTid()===tid&&SP.cur!=='moi')render();
}
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&SP.cur!=='moi'){const t=curTid();if(t)loadData(t,true)}});
const dataOf=tid=>SP.D[tid]||{members:[],events:[],programs:[],wellness:[],logs:[],quests:[]};
const memName=(tid,uid)=>(dataOf(tid).members.find(m=>m.uid===uid)||{}).name||(uid===UID?SP.T[tid]?.me?.name:'')||'Joueur';

/* ---------- charge, forme et statut ---------- */
function loadStats(logs,uid,now=Date.now()){
  const L=logs.filter(l=>l.uid===uid);
  const acute=L.filter(l=>l.at>=now-7*DAY).reduce((a,l)=>a+l.load,0);
  const chronic=L.filter(l=>l.at<now-7*DAY&&l.at>=now-35*DAY).reduce((a,l)=>a+l.load,0)/4;
  return{acute,chronic,ratio:chronic>0?acute/chronic:null,n7:L.filter(l=>l.at>=now-7*DAY).length}
}
/* dernière réponse de chaque questionnaire sur les derniers jours, fusionnée (douleurs comprises) */
function lastWell(tid,uid,days=3){const min=dayKey(Date.now()-(days-1)*DAY),by={};
  for(const x of dataOf(tid).wellness)if(x.uid===uid&&x.day>=min){const b=by[x.qid];if(!b||x.at>=b.at)by[x.qid]=x}
  const ws=Object.values(by);if(!ws.length)return null;
  const pains={};let bad=[];for(const w of ws){for(const k in w.pains)pains[k]=Math.max(pains[k]||0,w.pains[k]);bad=bad.concat(badOf(w,tid))}
  return{pains,bad,list:ws}}
const painMax=w=>w?Math.max(0,...Object.values(w.pains)):0;
function playerStatus(tid,uid){
  const D=dataOf(tid),st=loadStats(D.logs,uid),w=lastWell(tid,uid),pm=painMax(w),bad=w?w.bad:[];
  const hasData=w||D.logs.some(l=>l.uid===uid&&l.at>=Date.now()-14*DAY);
  let s='none';
  if(hasData){s='v';if((st.ratio!=null&&st.ratio>=1.5)||pm>=4)s='r';else if((st.ratio!=null&&(st.ratio>=1.3||st.ratio<0.7))||pm>=2||bad.length)s='o'}
  return{s,st,w,pm,bad}
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
const ST_ICON='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19h16M7 15l4-5 3 3 5-7"/></svg>';
const TABS_BY={
  coach:[['effectif','Effectif',SPICON.pulse],['planning','Planning',SPICON.cal],['programs','Programmes',SPICON.dumb],['stats','Stats',ST_ICON],['settings','Réglages',SPICON.gear]],
  player:[['home','Accueil',SPICON.home],['planning','Planning',SPICON.cal],['programs','Programmes',SPICON.dumb],['stats','Stats',ST_ICON],['team','Équipe',SPICON.team]],
  spectator:[['planning','Planning',SPICON.cal],['team','Équipe',SPICON.team]]
};
function renderTeam(tid){
  const T=SP.T[tid],role=T.me.role,tabs=TABS_BY[role]||TABS_BY.spectator;
  let tab=SP.tab[tid];if(tab==='members')tab='settings';if(!tabs.some(t=>t[0]===tab))tab=tabs[0][0];
  setTabs(tabs,tab);loadData(tid);
  const D=SP.D[tid];
  let h=`<div class="wrap">${teamTop(tid,(T.team.club||'')+(role==='spectator'?' · staff':''))}`;
  if(!D||(D.loading&&!D.at)){$('#view').innerHTML=h+`<p class="muted">Chargement de l'équipe…</p></div>`;return}
  if(D.err&&!D.members.length&&!D.events.length)h+=`<div class="card sp-warn">${SPICON.warn}<span>Certaines données n'ont pas pu être chargées. Vérifie ta connexion.</span></div>`;
  h+=tab==='effectif'?viewEffectif(tid):tab==='planning'?viewPlanning(tid):tab==='programs'?viewPrograms(tid):tab==='settings'?settingsSection(tid):tab==='stats'?viewTeamStats(tid):tab==='team'?viewRoster(tid):viewPlayerHome(tid);
  $('#view').innerHTML=h+'</div>';
  if(tab==='stats')requestAnimationFrame(()=>drawTeamStats(tid));
}

/* --- coach : effectif --- */
function viewEffectif(tid){
  const D=dataOf(tid),players=D.members.filter(m=>m.role==='player'),today=dayKey(Date.now());
  if(!players.length)return `<div class="card empty"><h3>Pas encore de joueurs</h3><p>Invite tes joueurs avec le code de l'onglet Réglages, puis donne-leur le rôle de joueur.</p><button class="btn primary" data-act="sp-tab" data-v="settings">Inviter des joueurs</button></div>`;
  const rows=players.map(p=>{const due=dueList(tid,p.uid);return{p,due,...playerStatus(tid,p.uid)}});
  const cnt=s=>rows.filter(r=>r.s===s).length,hasQ=activeQuests(tid).length>0;
  const upToDate=rows.filter(r=>r.due.length&&r.due.every(x=>x.done)).length,withDue=rows.filter(r=>r.due.length).length;
  const alert=rows.filter(r=>r.s==='r').sort((a,b)=>(b.st.ratio||0)-(a.st.ratio||0))[0];
  const order={r:0,o:1,v:2,none:3};rows.sort((a,b)=>order[a.s]-order[b.s]||(b.st.ratio||0)-(a.st.ratio||0));
  let h=`<div class="tiles st3"><div class="tile t-r"><b class="num">${cnt('r')}</b><span>Rouge</span></div><div class="tile t-o"><b class="num">${cnt('o')}</b><span>Orange</span></div><div class="tile t-v"><b class="num">${cnt('v')}</b><span>Vert</span></div></div>`;
  if(hasQ&&withDue)h+=`<div class="sp-qline"><span class="small">Questionnaires du jour : <b class="num">${upToDate} / ${withDue}</b> à jour</span>${upToDate<withDue?`<button class="btn ghost sm" data-act="tm-remind" data-id="${tid}">Rappel</button>`:''}</div>`;
  if(alert){const w=alert.w,pz=w?Object.entries(w.pains).sort((a,b)=>b[1]-a[1])[0]:null;
    h+=`<div class="card sp-alert">${SPICON.warn}<div><b>${esc(alert.p.name)}</b> ${alert.st.ratio!=null?`a une charge ${pctTxt(alert.st.ratio)} par rapport à son habitude`:'est à surveiller'}${pz?`, douleur ${esc(ZONE_L[pz[0]].toLowerCase())} ${pz[1]}/5`:''}.</div></div>`}
  h+=`<section><div class="h2">Effectif · ${players.length}<span class="small">Charge 7 j · douleur${hasQ?' · questionnaires':''}</span></div><div class="list">`;
  for(const r of rows){const pz=r.w?Object.entries(r.w.pains).sort((a,b)=>b[1]-a[1])[0]:null,nd=r.due.filter(x=>x.done).length;
    const qc=!hasQ?'':!r.due.length?`<span class="qchip na" title="Rien à remplir pour le moment">–</span>`:nd===r.due.length?`<span class="qchip ok" title="Questionnaires remplis" aria-label="Questionnaires remplis">${ICON.check}</span>`:`<span class="qchip no" title="${nd} sur ${r.due.length} rempli${nd>1?'s':''}" aria-label="Questionnaires pas remplis">${r.due.length>1?nd+'/'+r.due.length:'✕'}</span>`;
    h+=`<button class="row sp-pl" data-act="tm-player" data-id="${tid}" data-u="${esc(r.p.uid)}"><i class="sdot s-${r.s}"></i><div class="m"><div>${esc(r.p.name)}</div><small>${esc(r.p.poste||'')}</small></div><span class="ch num c-${r.s}">${pctTxt(r.st.ratio)}</span><span class="pz small">${pz?esc(ZONE_L[pz[0]].split(' ')[0])+' '+pz[1]+'/5':'—'}</span>${qc}<span class="rpill s-${r.s}">${ST_L[r.s]}</span></button>`}
  h+=`</div><p class="small muted" style="margin:4px 0 0">Indicateur d'aide basé sur la charge (durée × difficulté)${hasQ?' et les questionnaires':''}. Ce n'est pas un avis médical.</p></section>`;
  return h+staffSection(tid);
}
function staffSection(tid){
  const T=SP.T[tid],D=dataOf(tid),own=isTeamOwner(tid),st=D.members.filter(m=>m.role==='coach'||m.role==='spectator');
  if(!st.length)return'';
  return `<section><div class="h2">Staff · ${st.length}</div><div class="list">${st.map(m=>`<button class="row sp-mem" ${own&&m.uid!==UID?`data-act="sp-mem" data-id="${tid}" data-u="${esc(m.uid)}"`:'disabled'}><div class="m"><div>${esc(m.name)}${m.uid===UID?' <span class="muted small">(toi)</span>':''}</div><small>${esc(m.poste||'')}</small></div>${T.team.owner===m.uid?`<span class="rpill r-owner">${SPICON.crown}Propriétaire</span>`:`<span class="rpill r-${m.role}">${ROLE_L[m.role]}</span>`}</button>`).join('')}</div>${own?'<p class="small muted" style="margin:4px 0 0">Touche un joueur ou un membre du staff pour changer son rôle ou le retirer.</p>':''}</section>`;
}
function teamTop(tid,sub){
  const T=SP.T[tid],n=teamsOf(T.team.kind).length;
  return `<header class="top"><button class="team-sw" data-act="sp-teams" aria-label="Changer d'équipe (équipe actuelle : ${esc(T.team.name)})">${teamLogo(T.team)}<span class="m"><span class="brand sp-brand">${esc(T.team.name)}</span><span class="sub sp-sub">${esc(sub)}${sub?' · ':''}${n>1?n+' équipes':'Mes équipes'}</span></span>${SPICON.down}</button>${spPill()}</header>`;
}
function openPlayer(tid,uid){
  const D=dataOf(tid),m=D.members.find(x=>x.uid===uid);if(!m)return;
  const {s,st}=playerStatus(tid,uid),now=Date.now();
  const well7=D.wellness.filter(x=>x.uid===uid&&x.day>=dayKey(now-6*DAY));
  const fo=avgOf(well7.map(x=>formeOf(x,tid)).filter(x=>x!=null)),hasQ=questsOf(tid).length>0;
  const pains={};well7.forEach(x=>{for(const k in x.pains)pains[k]=Math.max(pains[k]||0,x.pains[k])});
  const pf={},pb={};for(const k in pains)(k[0]==='f'?pf:pb)[k]=pains[k];
  const logs=D.logs.filter(l=>l.uid===uid).slice().reverse();
  const mu7=D.logs.filter(l=>l.uid===uid&&l.kind==='program'&&l.at>=now-7*DAY).length;
  const qhist=well7.slice().sort((a,b)=>b.at-a.at).map(x=>{const q=questById(tid,x.qid);if(!q)return'';const qa=q.qs.filter(y=>y.t!=='body');const e=x.ev?D.events.find(z=>z.id===x.ev):null;
    return `<div class="qh"><b>${dShort(keyTime(x.day))}<small class="muted"> · ${esc(q.title)}${e?' · '+esc(e.title):''}</small></b><div class="qa">${qa.map(y=>`<span class="${qBad(y,x.ans[y.id])?'bad':''}"><small>${esc(y.l)}</small>${esc(qTxt(y,x.ans[y.id]))}</span>`).join('')||'<span class="muted small">Douleurs seulement</span>'}</div></div>`}).join('');
  let h=sheetHead(m.name,'tm-player-close',`<span class="rpill s-${s}">${ST_L[s]}</span>${isTeamOwner(tid)&&uid!==UID?`<button class="btn ghost sm" data-act="sp-mem" data-id="${tid}" data-u="${esc(uid)}">Gérer</button>`:''}`)+`<div class="sheet-b"><div class="wrap sp-col">
   <div class="small muted">${esc(m.poste||'Joueur')}</div>
   <div class="tiles"><div class="tile"><span>vs habituelle</span><b class="num c-${s}">${pctTxt(st.ratio)}</b></div><div class="tile"><span>Forme 7 j</span><b class="num">${fo!=null?fmtN(Math.round(fo*10)/10)+'/5':'—'}</b></div><div class="tile"><span>Muscu 7 j</span><b class="num">${mu7}</b></div></div>
   <section class="card"><div class="chart-h"><b>Charge · 6 semaines</b><span class="small muted">durée × difficulté</span></div><canvas class="chart" id="c-pl"></canvas></section>
   <section class="card"><div class="chart-h"><b>Douleurs · 7 jours</b></div>${Object.keys(pains).length?`<div class="sp-pains"><div class="bm2">${bodyMap('f',pf,{w:84,dot:7})}${bodyMap('b',pb,{w:84,dot:7})}</div><div class="list sm">${Object.entries(pains).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`<div class="pz-r"><b>${esc(ZONE_L[k])}</b><span class="num">${v}/5</span></div>`).join('')}</div></div>`:'<p class="muted small" style="margin:0">Aucune douleur signalée.</p>'}</section>
   ${hasQ||well7.length?`<section class="card"><div class="chart-h"><b>Questionnaires · 7 jours</b><span class="small muted">${well7.length} réponse${well7.length>1?'s':''}</span></div>${qhist?`<div class="qhist">${qhist}</div>`:'<p class="muted small" style="margin:0">Aucune réponse cette semaine.</p>'}</section>`:''}
   <section><div class="h2">Dernières séances</div>${logs.length?`<div class="list">${logs.slice(0,8).map(l=>`<div class="row sp-log"><div class="m"><div>${esc(l.title)}</div><small>${dShort(l.at)} · ${l.dur} min${l.rpe?' · difficulté '+l.rpe+'/10':''}${l.comment?' · « '+esc(l.comment)+' »':''}</small></div><span class="num ch">${l.load?Math.round(l.load):'—'}</span></div>`).join('')}</div>`:'<p class="muted small" style="margin:0">Pas encore de séance.</p>'}</section>
  </div></div>`;
  openSheet('tm-player',h);
  requestAnimationFrame(()=>{const cv=$('#c-pl');if(!cv)return;const labels=[],values=[];for(let k=5;k>=0;k--){const a=now-(k+1)*7*DAY,b=now-k*7*DAY;labels.push(k?dfr(a):'7 j');values.push(Math.round(D.logs.filter(l=>l.uid===uid&&l.at>=a&&l.at<b).reduce((x,l)=>x+l.load,0)))}drawChart(cv,{type:'bar',labels,values})});
}


/* --- statistiques du club : le coach voit l'équipe, le joueur seulement les siennes --- */
const SPER={},SPX={};
const PERS=[[365,'1 an'],[60,'2 mois'],[30,'1 mois'],[7,'1 semaine']];
const perTxt=p=>p===7?'7 derniers jours':p===30?'30 derniers jours':p===60?'2 derniers mois':'12 derniers mois';
/* charge découpée selon la période : jours (1 semaine), semaines (1 ou 2 mois), mois (1 an) */
function periodLoad(logs,per,now){const labels=[],values=[],sum=(a,b)=>Math.round(logs.filter(l=>l.at>=a&&l.at<b).reduce((x,l)=>x+l.load,0));
  if(per<=7){const t0=sod(now);for(let k=6;k>=0;k--){const a=t0-k*DAY;labels.push(k?new Date(a).toLocaleDateString('fr-FR',{weekday:'short'}).replace('.',''):"Auj.");values.push(sum(a,a+DAY))}}
  else if(per<=60){const n=Math.ceil(per/7);for(let k=n-1;k>=0;k--){const a=now-(k+1)*7*DAY,b=now-k*7*DAY;labels.push(k?dfr(a):'7 j');values.push(sum(a,b))}}
  else{const d=new Date(now);d.setDate(1);d.setHours(0,0,0,0);for(let k=11;k>=0;k--){const a=new Date(d.getFullYear(),d.getMonth()-k,1).getTime(),b=new Date(d.getFullYear(),d.getMonth()-k+1,1).getTime();labels.push(new Date(a).toLocaleDateString('fr-FR',{month:'short'}).replace('.',''));values.push(sum(a,b))}}
  return{labels,values}}
const chartTitle=p=>p<=7?'7 derniers jours':p<=60?(p===30?'1 mois':'2 mois')+' · par semaine':'1 an · par mois';
function viewTeamStats(tid){
  const T=SP.T[tid],D=dataOf(tid),role=T.me.role,per=SPER[tid]||30,now=Date.now(),from=now-per*DAY;
  let h=`<div class="seg st-per" role="group" aria-label="Période">${PERS.map(([v,l])=>`<button data-act="tm-sper" data-id="${tid}" data-v="${v}" aria-pressed="${per===v}">${l}</button>`).join('')}</div>`;
  if(role==='coach'){
    const players=D.members.filter(m=>m.role==='player'),pid=new Set(players.map(p=>p.uid));
    if(!players.length)return h+`<div class="card empty"><h3>Pas encore de statistiques</h3><p>Elles apparaîtront quand tes joueurs feront des séances et répondront aux questionnaires.</p></div>`;
    const L=D.logs.filter(l=>l.at>=from&&pid.has(l.uid)),W=D.wellness.filter(w=>w.day>=dayKey(from)&&pid.has(w.uid)),R=L.filter(l=>l.rpe),rpe=avgOf(R.map(l=>l.rpe)),showQ=questsOf(tid).length>0||W.length>0;
    h+=`<div class="tiles st5"><div class="tile"><span>Séances</span><b class="num">${L.length}</b></div><div class="tile"><span>Charge totale</span><b class="num">${fmtN(Math.round(L.reduce((a,l)=>a+l.load,0)))}</b></div><div class="tile"><span>Difficulté moy.</span><b class="num">${rpe!=null?fmtN(Math.round(rpe*10)/10)+'/10':'—'}</b></div><div class="tile"><span>Séances muscu</span><b class="num">${L.filter(l=>l.kind==='program').length}</b></div>${showQ?`<div class="tile"><span>Questionnaires</span><b class="num">${W.length}</b></div>`:''}</div>
     <section class="card"><div class="chart-h"><b>Charge de l'équipe · ${chartTitle(per)}</b><span class="small muted">durée × difficulté</span></div><canvas class="chart" id="c-tst"></canvas></section>
     <section><div class="h2">Par joueur<span class="small">${perTxt(per)}</span></div><div class="st-table" role="table">
      <div class="st-r st-hd" role="row"><span>Joueur</span><span>Séances</span><span>Charge</span><span>Difficulté</span><span>Muscu</span><span>Forme</span></div>`;
    const rows=players.map(p=>{const l=L.filter(x=>x.uid===p.uid),w=W.filter(x=>x.uid===p.uid);
      return{p,n:l.length,load:Math.round(l.reduce((a,x)=>a+x.load,0)),rpe:avgOf(l.filter(x=>x.rpe).map(x=>x.rpe)),mu:l.filter(x=>x.kind==='program').length,fo:avgOf(w.map(x=>formeOf(x,tid)).filter(x=>x!=null))}}).sort((a,b)=>b.load-a.load);
    for(const r of rows)h+=`<button class="st-r" role="row" data-act="tm-player" data-id="${tid}" data-u="${esc(r.p.uid)}"><span class="st-n">${esc(r.p.name)}</span><span class="num" data-l="Séances">${r.n}</span><span class="num" data-l="Charge">${fmtN(r.load)}</span><span class="num" data-l="Difficulté">${r.rpe!=null?fmtN(Math.round(r.rpe*10)/10):'—'}</span><span class="num" data-l="Muscu">${r.mu}</span><span class="num" data-l="Forme">${r.fo!=null?fmtN(Math.round(r.fo*10)/10)+'/5':'—'}</span></button>`;
    return h+`</div><p class="small muted" style="margin:6px 0 0">Touche un joueur pour voir son détail. « Forme » est la moyenne des réponses notées aux questionnaires, ramenée sur 5. Les réponses ne sont visibles que si le joueur a donné son accord.</p></section>`;
  }
  // joueur : uniquement ses propres données
  const mine=D.logs.filter(l=>l.uid===UID),L=mine.filter(l=>l.at>=from),rpe=avgOf(L.filter(l=>l.rpe).map(l=>l.rpe));
  h+=`<p class="small muted sp-note">${SPICON.lock}Tes statistiques ne sont visibles que par toi et les coachs de l'équipe.</p>
   <div class="tiles"><div class="tile"><span>Mes séances</span><b class="num">${L.length}</b></div><div class="tile"><span>Ma charge</span><b class="num">${fmtN(Math.round(L.reduce((a,l)=>a+l.load,0)))}</b></div><div class="tile"><span>Difficulté moy.</span><b class="num">${rpe!=null?fmtN(Math.round(rpe*10)/10)+'/10':'—'}</b></div><div class="tile"><span>Séances muscu</span><b class="num">${L.filter(l=>l.kind==='program').length}</b></div></div>
   <section class="card"><div class="chart-h"><b>Ma charge · ${chartTitle(per)}</b><span class="small muted">durée × difficulté</span></div><canvas class="chart" id="c-tst"></canvas></section>`;
  const best={};for(const l of mine)for(const it of l.items||[])if(it.weight!=null&&it.done>0){const b=best[it.exoId];if(!b||it.weight>b.w)best[it.exoId]={w:it.weight,n:it.name,t:l.at}}
  const ids=Object.keys(best);
  if(ids.length){const sel=SPX[tid]&&best[SPX[tid]]?SPX[tid]:ids.sort((a,b)=>best[b].w-best[a].w)[0];SPX[tid]=sel;
    h+=`<section class="card"><div class="field" style="margin-bottom:10px"><label for="tst-exo">Ma progression par exercice · ${perTxt(per)}</label><select id="tst-exo">${ids.map(id=>`<option value="${id}" ${id===sel?'selected':''}>${esc(best[id].n||exo(id).name)}</option>`).join('')}</select></div><canvas class="chart" id="c-tsx"></canvas></section>
     <section><div class="h2">Mes records dans l'équipe</div><p class="small muted" style="margin:0 0 6px">La charge la plus lourde que tu as faite sur chaque exercice pendant les programmes du coach. C'est elle qui sert à calculer tes charges « % du record ».</p><div class="list">${ids.sort((a,b)=>best[b].w-best[a].w).slice(0,12).map(id=>{const e=exo(id,best[id].n);return `<div class="row"><div class="fig sm">${figSVG(e,1)}</div><div class="m"><div>${esc(best[id].n||e.name)}</div><small>${dShort(best[id].t)}</small></div><b class="num" style="color:var(--pr)">${fmtKg(best[id].w)}</b></div>`}).join('')}</div></section>`}
  else h+=`<p class="muted small">Tes records apparaîtront quand tu auras fait un programme de ton coach en notant tes charges.</p>`;
  return h;
}
function drawTeamStats(tid){
  const T=SP.T[tid];if(!T)return;const D=dataOf(tid),now=Date.now(),cv=$('#c-tst'),per=SPER[tid]||30;
  if(cv){const pid=new Set(D.members.filter(m=>m.role==='player').map(m=>m.uid));const logs=T.me.role==='coach'?D.logs.filter(l=>pid.has(l.uid)):D.logs.filter(l=>l.uid===UID);drawChart(cv,{type:'bar',...periodLoad(logs,per,now)})}
  const c2=$('#c-tsx'),id=SPX[tid];
  if(c2&&id){const pts=[];for(const l of D.logs)if(l.uid===UID&&l.at>=now-per*DAY){const w=Math.max(-1,...(l.items||[]).filter(it=>it.exoId===id&&it.weight!=null&&it.done>0).map(it=>it.weight));if(w>=0)pts.push({t:l.at,w})}
    pts.sort((a,b)=>a.t-b.t);if(pts.length)drawChart(c2,{type:'line',labels:pts.map(p=>dfr(p.t)),values:pts.map(p=>p.w),rec:Math.max(...pts.map(p=>p.w))})}
}
document.addEventListener('change',e=>{if(e.target.id==='tst-exo'){const t=curTid();if(t){SPX[t]=e.target.value;render()}}});

/* --- planning --- */
const PW={};
function weekStrip(tid,evs){
  const off=PW[tid]||0,a=wkStart(off),today=sod(Date.now());
  let h=`<div class="wk-nav"><button class="icon-btn" data-act="tm-wk" data-id="${tid}" data-d="-1" aria-label="Semaine précédente">${ICON.back}</button><b>${off===0?'Cette semaine':off===1?'Semaine prochaine':off===-1?'Semaine dernière':'Semaine du '+dfr(a)}</b><button class="icon-btn" data-act="tm-wk" data-id="${tid}" data-d="1" aria-label="Semaine suivante" style="transform:scaleX(-1)">${ICON.back}</button></div><div class="wk">`;
  for(let i=0;i<7;i++){const t=a+i*DAY,n=evs.filter(e=>e.start>=t&&e.start<t+DAY).length;h+=`<div class="wd ${t===today?'today':''}"><span>${new Date(t).toLocaleDateString('fr-FR',{weekday:'short'}).replace('.','')}</span><b>${new Date(t).getDate()}</b><i class="${n?'on':''}"></i></div>`}
  return h+'</div>';
}
const QICON='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4h6v3H9zM9 12h6M9 16h4"/></svg>';
/* questionnaires « après séance » du joueur pour ce créneau : ouverts dès le début du créneau */
function evDue(tid,e){if(SP.T[tid]?.me.role!=='player'||e.start>Date.now()||!e.invitees.includes(UID))return[];return evQuests(tid,e).map(q=>({q,ev:e,key:e.id,day:dayKey(e.start),done:!!findAns(tid,UID,q.id,e.id)}))}
const qBadge=(tid,x)=>`<button class="icon-btn qbadge ${x.done?'ok':''}" data-act="tm-q" data-id="${tid}" data-q="${x.q.id}" ${x.ev?`data-e="${x.ev.id}"`:''} aria-label="${esc(x.q.title)} : ${x.done?'rempli':'à remplir'}">${x.done?ICON.check:QICON}${x.done?'':'<i class="rdot"></i>'}</button>`;
function evRow(tid,e,o={}){
  const vid=e.video?`<a class="icon-btn ev-vid" href="${esc(e.video)}" target="_blank" rel="noopener noreferrer" aria-label="Ouvrir la vidéo">${SPICON.play}</a>`:'';
  const inv=o.count?`<span class="small muted">${e.invitees.length} convoqué${e.invitees.length>1?'s':''}</span>`:'';
  const qs=evDue(tid,e).map(x=>qBadge(tid,x)).join('');
  return `<div class="ev ev-${e.type}"><button class="ev-b" data-act="tm-ev" data-id="${tid}" data-e="${e.id}"><span class="ev-t"><span class="small muted">${o.day?dShort(e.start):''}</span><b class="num">${hm(e.start)}</b></span><span class="ev-m"><span class="ev-k">${EVT[e.type]}</span><b>${esc(e.title)}</b><small class="muted">${e.dur} min${e.place?' · '+esc(e.place):''}</small>${inv}</span></button>${qs}${vid}</div>`;
}
/* questionnaire du matin ou du soir dans le planning du joueur */
function qRow(tid,x){
  const late=x.q.when==='evening'&&new Date().getHours()<EVENING_H;
  return `<div class="ev ev-quest"><button class="ev-b" data-act="tm-q" data-id="${tid}" data-q="${x.q.id}" ${late?'disabled':''}><span class="ev-t"><span class="small muted"></span><b class="num">${x.q.when==='evening'?'Soir':'Matin'}</b></span><span class="ev-m"><span class="ev-k">Questionnaire</span><b>${esc(x.q.title)}</b><small class="muted">${x.done?'Rempli · touche pour modifier':late?'À remplir à partir de '+EVENING_H+'h':'À remplir aujourd\'hui'}</small></span></button>${late?'':qBadge(tid,x)}</div>`;
}
function viewPlanning(tid){
  const T=SP.T[tid],D=dataOf(tid),role=T.me.role,off=PW[tid]||0,a=wkStart(off),b=a+7*DAY,today=sod(Date.now());
  const evs=D.events.filter(e=>e.start>=a&&e.start<b);
  const dq=role==='player'&&today>=a&&today<b?dueList(tid,UID,{all:true}).filter(x=>!x.ev):[];
  let h=weekStrip(tid,D.events);
  if(role==='player'||role==='client')h+=`<p class="small muted sp-note">${SPICON.lock}Tu ne vois que les créneaux où ton coach t'a convoqué.</p>`;
  if(!evs.length&&!dq.length)h+=`<div class="card"><p class="muted" style="margin:0">Rien de prévu ${off===0?'cette semaine':'sur cette semaine'}.</p></div>`;
  else{const days=[...new Set(evs.map(e=>sod(e.start)).concat(dq.length?[today]:[]))].sort((x,y)=>x-y);h+=`<div class="list">`;
    for(const d of days){h+=`<div class="ev-day">${dLong(d)}</div>`;
      if(d===today)h+=dq.filter(x=>x.q.when==='morning').map(x=>qRow(tid,x)).join('');
      for(const e of evs.filter(e=>sod(e.start)===d))h+=evRow(tid,e,{count:role==='coach'});
      if(d===today)h+=dq.filter(x=>x.q.when==='evening').map(x=>qRow(tid,x)).join('')}
    h+=`</div>`}
  if(role==='coach')h+=`<section><button class="btn primary block" data-act="tm-ev-new" data-id="${tid}">+ Nouveau créneau</button></section>`;
  return h;
}
let EV=null;
const DEF_DUR={training:120,muscu:90,match:120,video:60,meeting:60,recup:60};
function openEvent(tid,eid){
  const T=SP.T[tid],D=dataOf(tid),e=D.events.find(x=>x.id===eid);if(!e)return;
  const role=T.me.role,past=e.start<Date.now(),myLog=D.logs.find(l=>l.uid===UID&&l.eventId===e.id);
  const names=role==='coach'?e.invitees.map(u=>memName(tid,u)):[];
  openSheet('tm-ev',sheetHead(e.title,'tm-ev-close')+`<div class="sheet-b"><div class="wrap sp-col">
   <div class="card ev-card ev-${e.type}"><span class="ev-k">${EVT[e.type]}</span><b style="text-transform:capitalize">${dLong(e.start)}</b><span>${hm(e.start)} · ${e.dur} min</span>${e.place?`<span class="muted">${esc(e.place)}</span>`:''}</div>
   ${e.video?`<a class="btn ghost block" href="${esc(e.video)}" target="_blank" rel="noopener noreferrer">${SPICON.play} Ouvrir la vidéo</a>`:''}
   ${role==='coach'?`<section class="card"><div class="h2">Convoqués · ${e.invitees.length}</div><p style="margin:0">${esc(names.join(', ')||'Personne')}</p></section>
     <div class="sp-2"><button class="btn ghost" data-act="tm-ev-edit" data-id="${tid}" data-e="${e.id}">Modifier</button><button class="btn danger" data-act="tm-ev-del" data-id="${tid}" data-e="${e.id}">Supprimer</button></div>`:''}
   ${role==='player'?(()=>{const qs=evDue(tid,e),fut=e.start>Date.now()?evQuests(tid,e):[];
     return (qs.length?`<section><div class="h2">Questionnaire${qs.length>1?'s':''}</div><div class="list">${qs.map(x=>`<button class="row sp-qrow" data-act="tm-q" data-id="${tid}" data-q="${x.q.id}" data-e="${e.id}"><span class="qbadge-s ${x.done?'ok':''}">${x.done?ICON.check:QICON}${x.done?'':'<i class="rdot"></i>'}</span><div class="m"><div>${esc(x.q.title)}</div><small>${x.done?'Rempli · touche pour modifier':'À remplir après la séance'}</small></div>${ICON.chev}</button>`).join('')}</div></section>`:'')
       +(fut.length?`<p class="small muted" style="margin:0">${esc(fut.map(q=>q.title).join(', '))} : à remplir à partir du début de la séance.</p>`:'')
       +(e.type==='muscu'?`<button class="btn ghost block" data-act="tm-progs-go" data-id="${tid}">${SPICON.dumb} Voir les programmes de muscu</button>`:'')})():''}
  </div></div>`);
}
function openEventEdit(tid,eid){
  const D=dataOf(tid),e=eid?D.events.find(x=>x.id===eid):null,t0=e?e.start:(()=>{const d=new Date();d.setDate(d.getDate()+1);d.setHours(18,0,0,0);return d.getTime()})();
  const players=D.members.filter(m=>m.role==='player'||m.role==='client');
  EV={tid,durTouched:!!e,id:e?e.id:null,type:e?e.type:'training',dest:e&&e.invitees.length<players.length?'sel':'all',sel:new Set(e?e.invitees:players.map(p=>p.uid))};
  renderEventEdit({title:e?e.title:'',date:isoDate(t0),time:isoTime(t0),dur:e?e.dur:DEF_DUR.training,place:e?e.place:'',video:e?e.video:''});
}
function renderEventEdit(v){
  const D=dataOf(EV.tid),players=D.members.filter(m=>m.role==='player'||m.role==='client');
  openSheet('tm-eved',sheetHead(EV.id?'Modifier le créneau':'Nouveau créneau','tm-eved-close')+`<div class="sheet-b"><div class="wrap sp-col">
   <div class="chips left">${Object.entries(EVT).map(([k,l])=>`<button class="chip-b" data-act="tm-evtype" data-v="${k}" aria-pressed="${EV.type===k}">${l}</button>`).join('')}</div>
   <div class="field"><label for="ev-title">Titre</label><input id="ev-title" value="${esc(v.title)}" placeholder="${esc(EVT[EV.type])}" maxlength="80"></div>
   <div class="sp-2"><div class="field"><label for="ev-date">Date</label><input id="ev-date" type="date" value="${v.date}"></div><div class="field"><label for="ev-time">Heure</label><input id="ev-time" type="time" value="${v.time}"></div></div>
   <div class="sp-2"><div class="field"><label for="ev-dur">Durée (min)</label><input id="ev-dur" type="number" inputmode="numeric" min="5" max="600" value="${v.dur}"></div><div class="field"><label for="ev-place">Lieu (facultatif)</label><input id="ev-place" value="${esc(v.place)}" maxlength="80" placeholder="Gymnase…"></div></div>
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
const PSUB={};
function viewPrograms(tid){
  const T=SP.T[tid],D=dataOf(tid),role=T.me.role,now=Date.now();
  if(T.team.kind==='club')return viewClubPrograms(tid);
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
/* club : programmes sans date, visibles par tous les joueurs et faisables à volonté */
function viewClubPrograms(tid){
  const T=SP.T[tid],D=dataOf(tid),role=T.me.role,sub=role==='coach'&&PSUB[tid]==='quests'?'quests':'muscu';
  const nQ=questsOf(tid).length,nOn=activeQuests(tid).length;
  let h='';
  if(role==='coach')h+=`<div class="seg two st-sub" role="group" aria-label="Rubrique"><button data-act="tm-psub" data-id="${tid}" data-v="muscu" aria-pressed="${sub==='muscu'}">Muscu · ${D.programs.length}</button><button data-act="tm-psub" data-id="${tid}" data-v="quests" aria-pressed="${sub==='quests'}">Questionnaires${nQ?` · ${nOn}/${nQ}`:''}</button></div>`;
  if(sub==='quests')return h+viewQuestList(tid);
  const last=pid=>{const l=D.logs.filter(x=>x.programId===pid&&x.uid===UID);return l.length?l[l.length-1]:null};
  const card=p=>{const l=role==='coach'?null:last(p.id);return `<button class="row sp-prog" data-act="tm-prog" data-id="${tid}" data-p="${p.id}"><div class="m"><div>${esc(p.title)}</div><small>${p.items.length} exercice${p.items.length>1?'s':''}${l?' · fait '+ago(l.at):''}</small></div>${ICON.chev}</button>`};
  if(role==='coach')h+=`<section><button class="btn primary block" data-act="tm-prog-new" data-id="${tid}">+ Nouveau programme</button><p class="small muted" style="margin:0">Tous tes joueurs voient tes programmes et peuvent les démarrer quand ils veulent, autant de fois qu'ils veulent. Dans le planning, crée simplement un créneau « Muscu » et dis-leur lequel faire.</p></section>`;
  const run=role==='player'?runLoad():null;if(run&&run.tid===tid)h+=`<div class="banner"><div><small>Programme en cours</small><br><b>${esc(run.title)}</b></div><button class="btn" data-act="run-resume">Reprendre</button></div>`;
  h+=`<section><div class="h2">Programmes · ${D.programs.length}</div>${D.programs.length?`<div class="list">${D.programs.map(card).join('')}</div>`:`<p class="muted small" style="margin:0">${role==='coach'?'Aucun programme pour le moment.':'Ton coach n\'a pas encore créé de programme.'}</p>`}</section>`;
  return h;
}
/* coach : liste des questionnaires */
function viewQuestList(tid){
  const Qs=questsOf(tid);
  let h=`<section><button class="btn primary block" data-act="tm-qe-new" data-id="${tid}">+ Nouveau questionnaire</button><p class="small muted" style="margin:0">Choisis quand tes joueurs le remplissent : chaque matin, chaque soir ou juste après une séance. Il apparaît dans leur planning, avec une pastille rouge tant qu'il n'est pas rempli.</p></section>`;
  if(!Qs.length)return h+`<div class="card empty"><h3>Aucun questionnaire</h3><p>Tant que tu n'en crées pas, tes joueurs n'ont rien à remplir et l'effectif se base seulement sur la charge.</p></div>`;
  h+=`<div class="list">${Qs.map(q=>`<div class="row sp-quest"><button class="m" data-act="tm-qe" data-id="${tid}" data-q="${q.id}"><div>${esc(q.title)}</div><small>${QWHEN[q.when]}${q.when==='after'?' · '+esc(q.aft.map(t=>QAFT[t].toLowerCase()).join(', ')):''} · ${q.qs.length} question${q.qs.length>1?'s':''}</small></button><span class="rpill ${q.on?'r-done':'r-off'}">${q.on?'Activé':'Désactivé'}</span><button class="toggle" data-act="tm-qon" data-id="${tid}" data-q="${q.id}" aria-pressed="${q.on}" aria-label="${q.on?'Désactiver':'Activer'} ${esc(q.title)}" ${q.qs.length?'':'disabled'}></button></div>`).join('')}</div>`;
  return h+`<p class="small muted" style="margin:0">Les réponses sont des données de santé : chaque joueur donne son accord une seule fois, et seuls les coachs de l'équipe les voient.</p>`;
}
function openProgram(tid,pid){
  const T=SP.T[tid],D=dataOf(tid),p=D.programs.find(x=>x.id===pid);if(!p)return;
  const role=T.me.role,rec=role==='coach'?null:recordsClub(tid),club=T.team.kind==='club';
  if(club)return openClubProgram(tid,p,role,rec);
  const myLog=D.logs.find(l=>l.programId===p.id&&l.uid===UID);
  let h=sheetHead(p.title,'tm-prog-close')+`<div class="sheet-b"><div class="wrap sp-col"><div class="small muted" style="text-transform:capitalize">${dLong(p.date)}</div>
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
function openClubProgram(tid,p,role,rec){
  const D=dataOf(tid),mine=D.logs.filter(l=>l.programId===p.id&&l.uid===UID).sort((a,b)=>b.at-a.at);
  let h=sheetHead(p.title,'tm-prog-close')+`<div class="sheet-b"><div class="wrap sp-col">
   ${p.note?`<div class="card sp-note2">${esc(p.note)}</div>`:''}
   <div class="list">${p.items.map(it=>{const e=exo(it.exoId,it.name);return `<div class="row"><div class="fig sm">${figSVG(e,1)}</div><div class="m"><div>${esc(it.name||e.name)}</div><small>${pVol(it)}${loadTxt(it,rec)?' · '+esc(loadTxt(it,rec)):''}${it.note?' · '+esc(it.note):''}</small></div></div>`}).join('')}</div>`;
  if(role==='coach'){const L=D.logs.filter(l=>l.programId===p.id).sort((a,b)=>b.at-a.at).slice(0,10);
    h+=`<section class="card"><div class="h2">Dernières séances</div>${L.length?`<div class="list sm">${L.map(l=>`<div class="pz-r"><b>${esc(memName(tid,l.uid))}</b><span class="small muted">${ago(l.at)}${l.rpe?' · '+l.rpe+'/10':''}</span></div>`).join('')}</div>`:'<p class="muted small" style="margin:0">Personne ne l\'a encore fait.</p>'}</section>
    <div class="sp-2"><button class="btn ghost" data-act="tm-prog-edit" data-id="${tid}" data-p="${p.id}">Modifier</button><button class="btn danger" data-act="tm-prog-del" data-id="${tid}" data-p="${p.id}">Supprimer</button></div>`}
  else if(mine.length)h+=`<p class="small muted" style="margin:0">Dernière fois ${ago(mine[0].at)}.</p>`;
  h+=`</div></div>`;
  if(role==='player')h+=`<div class="sheet-f"><div class="in"><button class="btn primary" data-act="tm-run" data-id="${tid}" data-p="${p.id}">Démarrer</button></div></div>`;
  openSheet('tm-prog',h);
}
/* éditeur de programme (coach) */
let PE=null;
function openProgEdit(tid,pid){
  const D=dataOf(tid),p=pid?D.programs.find(x=>x.id===pid):null,players=D.members.filter(m=>m.role==='player'||m.role==='client');
  PE={tid,club:SP.T[tid].team.kind==='club',at0:p?p.date:0,id:p?p.id:null,title:p?p.title:'',date:isoDate(p?p.date:Date.now()+DAY),eventId:p?p.eventId:'',items:p?clone(p.items):[],note:p?p.note:'',dest:p?(p.invitees.length<players.length?'sel':'all'):'all',sel:new Set(p?p.invitees:players.map(m=>m.uid))};
  renderProgEdit();
}
function progVals(){if(!$('#pe-title'))return;PE.title=$('#pe-title').value;if($('#pe-date'))PE.date=$('#pe-date').value;PE.note=$('#pe-note').value;PE.items.forEach((it,i)=>{const n=$('#pe-n-'+i);if(n)it.note=n.value;const v=$('#pe-v-'+i);if(v)it.lv=cNum(String(v.value).replace(',','.'),0,2000,0)})}
function renderProgEdit(){
  const D=dataOf(PE.tid),players=D.members.filter(m=>m.role==='player'||m.role==='client'),now=Date.now();
  const evs=D.events.filter(e=>e.start>=sod(now)&&e.start<now+21*DAY);
  const sc=document.querySelector('#sheet-tm-ped .sheet-b')?.scrollTop||0;
  let h=sheetHead(PE.id?'Modifier le programme':'Nouveau programme','tm-ped-close')+`<div class="sheet-b"><div class="wrap sp-col">
   <div class="field"><label for="pe-title">Titre</label><input id="pe-title" value="${esc(PE.title)}" placeholder="Ex. Force · bas du corps" maxlength="80"></div>
   ${PE.club?'':`<div class="field"><label for="pe-date">Date</label><input id="pe-date" type="date" value="${PE.date}"></div>`}
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
   ${PE.club?'<p class="small muted" style="margin:0">Le programme sera visible par tous les joueurs de l\'équipe, qui pourront le démarrer quand ils veulent.</p>':`<div class="field"><span class="flabel">Envoyer à <b class="num" style="color:var(--pr)">${progDest().length} / ${players.length}</b></span>
    <div class="seg" style="grid-template-columns:1fr 1fr"><button data-act="pe-dest" data-v="all" aria-pressed="${PE.dest==='all'}">Tout le groupe</button><button data-act="pe-dest" data-v="sel" aria-pressed="${PE.dest==='sel'}">Sélection</button></div></div>
   ${PE.dest==='sel'?`<div class="card sp-checks">${players.map(p=>`<label><input type="checkbox" data-peu="${esc(p.uid)}" ${PE.sel.has(p.uid)?'checked':''}><span>${esc(p.name)}</span><small class="muted">${esc(p.poste||'')}</small></label>`).join('')||'<p class="muted small" style="margin:0">Pas encore de joueurs.</p>'}</div>`:''}`}
   <p class="small muted" style="margin:0">Avec « % du record », la charge est calculée pour chaque joueur à partir de ses records dans cet espace.</p>
  </div></div><div class="sheet-f"><div class="in"><button class="btn primary" data-act="pe-save">${PE.id?'Enregistrer':PE.club?'Publier le programme':'Envoyer le programme'}</button></div></div>`;
  const el=openSheet('tm-ped',h);el.querySelector('.sheet-b').scrollTop=sc;
}
function progDest(){const D=dataOf(PE.tid),players=D.members.filter(m=>m.role==='player'||m.role==='client').map(m=>m.uid);
  if(PE.dest==='event'){const e=D.events.find(x=>x.id===PE.eventId);return e?e.invitees.filter(u=>players.includes(u)):[]}
  if(PE.dest==='sel')return[...PE.sel].filter(u=>players.includes(u));return players}
async function saveProg(btn){
  progVals();const date=PE.club?(PE.at0||Date.now()):fromIso(PE.date,'12:00');
  if(!PE.items.length){toast('Ajoute au moins un exercice');return}if(!date){toast('Indique une date');return}
  const invitees=PE.club?[]:progDest();if(!PE.club&&!invitees.length){toast('Choisis au moins un destinataire');return}
  const doc={title:(PE.title||'').trim().slice(0,80)||'Programme',date,eventId:PE.eventId||'',items:PE.items.map(it=>({exoId:it.exoId,name:(it.name||exo(it.exoId).name).slice(0,80),sets:it.sets,reps:it.reps,mode:it.mode,dur:it.dur,lt:it.lt,lv:it.lv||0,note:(it.note||'').slice(0,120)})),invitees,note:(PE.note||'').trim().slice(0,300),by:UID,at:Date.now()};
  btn.disabled=true;const id=PE.id||gid();
  try{await subCol(PE.tid,'programs').doc(id).set(doc);const D=dataOf(PE.tid);const club=PE.club;D.programs=D.programs.filter(p=>p.id!==id).concat(cProgram(id,doc)).sort((a,b)=>club?b.date-a.date:a.date-b.date);
    closeSheet('tm-ped');closeSheet('tm-prog');const n=invitees.length;PE=null;render();toast(club?'Programme publié · visible par tous les joueurs':`Programme envoyé à ${n} client${n>1?'s':''}`)}
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
  const dur=Math.min(600,Math.max(5,Math.round((Date.now()-RUN.start)/60000)));
  if(SP.T[RUN.tid]?.team.kind==='club')return saveClubRun(dur,items);
  openRessenti(RUN.tid,{kind:'program',programId:RUN.pid,title:RUN.title,dur,items,fromRun:true});
}
/* club : la séance est enregistrée telle quelle ; le ressenti passe par les questionnaires « après la séance » */
async function saveClubRun(dur,items){
  const tid=RUN.tid,D=dataOf(tid),now=Date.now();
  const ev=D.events.filter(e=>e.type==='muscu'&&e.invitees.includes(UID)&&dayKey(e.start)===dayKey(now)&&e.start<=now+3*3600000).sort((a,b)=>Math.abs(a.start-now)-Math.abs(b.start-now))[0];
  const doc={uid:UID,kind:'program',programId:RUN.pid,title:RUN.title.slice(0,80),at:now,dur,load:0,items};if(ev)doc.eventId=ev.id;
  const id=gid();
  try{await subCol(tid,'logs').doc(id).set(doc);D.logs.push(cLog(id,doc));RUN=null;try{localStorage.removeItem(runKey())}catch(e){}closeSheet('tm-run');render();
    const due=ev?evDue(tid,ev).filter(x=>!x.done):[];
    if(due.length){toast('Séance enregistrée');openQuest(tid,due[0].q.id,ev.id)}else toast('Séance enregistrée')}
  catch(e){toast('Enregistrement impossible. Vérifie ta connexion.')}
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
  const sk=streak(tid);
  let h='';
  if(kind==='club'){const due=dueList(tid,UID,{days:2}),todo=due.filter(x=>!x.done),done=due.filter(x=>x.done);
    for(const x of todo)h+=`<button class="sp-qcta" data-act="tm-q" data-id="${tid}" data-q="${x.q.id}" ${x.ev?`data-e="${x.ev.id}"`:''}><span class="sp-ic">${QICON}</span><span class="m"><b>${esc(x.q.title)}</b><small>${x.ev?esc(x.ev.title)+' · '+dShort(x.ev.start)+' '+hm(x.ev.start):'À remplir aujourd\'hui'} · demandé par ton coach</small></span>${ICON.chev}</button>`;
    if(done.length&&!todo.length)h+=`<div class="card sp-qdone"><span class="sp-ic ok">${ICON.check}</span><span class="m"><b>Questionnaires à jour</b><small>${sk>1?`Série de ${sk} jours · `:''}Modifiable depuis le planning</small></span></div>`}
  const todayEv=D.events.filter(e=>dayKey(e.start)===today);
  h+=`<section><div class="h2">Aujourd'hui<span class="small" style="text-transform:none;letter-spacing:0">${dLong(now)}</span></div>${todayEv.length?`<div class="list">${todayEv.map(e=>evRow(tid,e)).join('')}</div>`:'<p class="muted small" style="margin:0">Rien de prévu aujourd\'hui.</p>'}</section>`;
  if(kind==='coach'){const todo=D.programs.filter(p=>!D.logs.some(l=>l.programId===p.id&&l.uid===UID)&&p.date>=sod(now)-2*DAY).sort((a,b)=>a.date-b.date);
  if(todo.length)h+=`<section><div class="h2">Programmes à faire</div><div class="list">${todo.slice(0,3).map(p=>`<button class="row sp-prog" data-act="tm-prog" data-id="${tid}" data-p="${p.id}"><div class="m"><div>${esc(p.title)}</div><small>${dShort(p.date)} · ${p.items.length} exercices</small></div>${ICON.chev}</button>`).join('')}</div></section>`}
  const nm=D.events.find(e=>e.type==='match'&&e.start>=now);
  if(nm){const j=Math.round((sod(nm.start)-sod(now))/DAY);h+=`<section class="card sp-match"><div><small>Prochain match</small><b>${esc(nm.title)}</b><span class="muted small">${dShort(nm.start)} · ${hm(nm.start)}${nm.place?' · '+esc(nm.place):''}</span></div><span class="j num">${j<=0?'Jour J':'J-'+j}</span></section>`}
  const run=runLoad();if(run&&run.tid===tid)h=`<div class="banner"><div><small>Programme en cours</small><br><b>${esc(run.title)}</b></div><button class="btn" data-act="run-resume">Reprendre</button></div>`+h;
  return h;
}
/* --- équipe (joueur et spectateur) --- */
function viewRoster(tid){
  const T=SP.T[tid],D=dataOf(tid),ms=D.members.filter(m=>m.role!=='pending');
  const g=(r,l)=>{const a=ms.filter(m=>m.role===r);return a.length?`<div class="small muted sp-gl">${l} · ${a.length}</div><div class="roster">${a.map(m=>`<div class="rm"><b>${esc(m.name)}${m.uid===UID?' <span class="muted small">(toi)</span>':''}</b><small>${esc(m.poste||ROLE_L[m.role])}</small></div>`).join('')}</div>`:''};
  let h=`<section>${g('coach','Coachs')}${g('player','Joueurs')}${g('spectator','Staff')}</section>`;
  if(T.me.role==='spectator')h+=`<p class="small muted sp-note">${SPICON.lock}Accès en lecture : liste de l'équipe et planning. Aucune donnée de forme ni de santé.</p>`;
  return h+teamSettings(tid);
}

/* --- questionnaires (données de santé : un seul consentement par équipe) --- */
let QS=null;
function openQuest(tid,qid,evId){
  const q=questById(tid,qid);if(!q||!q.on){toast("Ce questionnaire n'est pas activé par ton coach.");return}
  const T=SP.T[tid],D=dataOf(tid),now=Date.now(),e=evId?D.events.find(x=>x.id===evId):null;
  if(q.when==='after'&&!e)return;
  if(e&&e.start>now){toast('À remplir à partir du début de la séance.');return}
  if(q.when==='evening'&&new Date(now).getHours()<EVENING_H){toast(`Ce questionnaire se remplit à partir de ${EVENING_H}h.`);return}
  const key=e?e.id:dayKey(now),w=findAns(tid,UID,q.id,key);
  const ans=w?{...w.ans}:{};
  const rq=q.qs.find(x=>x.t==='rpe');if(rq&&e&&ans[rq.id]==null){const l=D.logs.find(x=>x.uid===UID&&x.eventId===e.id&&x.rpe);if(l)ans[rq.id]=l.rpe}
  QS={tid,qid:q.id,ev:e?e.id:'',key,day:e?dayKey(e.start):key,ans,pains:w?{...w.pains}:{},side:'f',consent:!!T.me.health};renderQuest();
}
const qsQuest=()=>questById(QS.tid,QS.qid)||{qs:[],title:'Questionnaire'};
function qVals(){if(!QS)return;document.querySelectorAll('[data-qin]').forEach(el=>{const q=qsQuest().qs.find(x=>x.id===el.dataset.qin);if(!q)return;const v=el.value.trim();
  if(q.t==='num'){const n=Number(v.replace(',','.'));if(v&&Number.isFinite(n))QS.ans[q.id]=n;else delete QS.ans[q.id]}else{if(v)QS.ans[q.id]=v.slice(0,200);else delete QS.ans[q.id]}})}
function questMissing(Q){return Q.qs.filter(q=>q.req&&(QS.ans[q.id]==null||QS.ans[q.id]===''))}
/* accord donné une seule fois pour tous les questionnaires de l'équipe */
function consentCard(T,o={}){
  return `<div class="card sp-consent"><span class="sp-ic">${SPICON.lock}</span><h3>${o.title||'Avant de commencer'}</h3>
    <p>Les questionnaires préparés par tes coachs (forme, sommeil, douleurs, ressenti après les séances…) contiennent des <b>données de santé</b>.</p>
    <p>Tes réponses sont visibles <b>uniquement par toi et les coachs de ${esc(T.team.name)}</b>, jamais par les autres joueurs ni le staff. Ton espace « Moi » n'est pas concerné.</p>
    <p class="small muted">Ton accord vaut pour tous les questionnaires de cette équipe : il ne te sera plus demandé. Tu peux le retirer quand tu veux dans Équipe › Mes réponses aux questionnaires (tes réponses sont alors effacées). Si tu as moins de 15 ans, demande d'abord l'accord d'un parent.</p>
    <label class="consent" for="${o.id||'q-ok'}"><input type="checkbox" id="${o.id||'q-ok'}"><span>J'accepte que mes réponses soient partagées avec les coachs de l'équipe.</span></label>${o.btn||''}</div>`;
}
function renderQuest(){
  const T=SP.T[QS.tid],Q=qsQuest(),D=dataOf(QS.tid),e=QS.ev?D.events.find(x=>x.id===QS.ev):null;
  if(!QS.consent){openSheet('tm-q',sheetHead(Q.title,'tm-q-close')+`<div class="sheet-b"><div class="wrap sp-col">${consentCard(T)}</div></div>
    <div class="sheet-f"><div class="in"><button class="btn primary" data-act="q-consent">Continuer</button></div></div>`);return}
  const sc=document.querySelector('#sheet-tm-q .sheet-b')?.scrollTop||0;
  const block=q=>{const v=QS.ans[q.id],star=q.req?' <span class="req" aria-label="obligatoire">*</span>':'';
    if(q.t==='rpe')return `<section class="card qcard"><div class="chart-h"><b class="ql">${esc(q.l)}${star}</b><b class="num" style="color:var(--pr)">${v?v+'/10 · '+RPE_L[v]:''}</b></div><div class="rpe">${[1,2,3,4,5,6,7,8,9,10].map(x=>`<button data-act="q-set" data-k="${q.id}" data-v="${x}" aria-pressed="${v===x}" aria-label="Difficulté ${x} sur 10">${x}</button>`).join('')}</div><div class="rpe-l small muted"><span>Très facile</span><span>Maximal</span></div></section>`;
    if(q.t==='scale'){const n=q.n;return `<section class="card qcard"><b class="ql">${esc(q.l)}${star}</b><div class="q5 ${n===10?'q10':''}">${Array.from({length:n},(_,k)=>k+1).map(x=>`<button data-act="q-set" data-k="${q.id}" data-v="${x}" aria-pressed="${v===x}" aria-label="${esc(q.l)} ${x} sur ${n}">${x}</button>`).join('')}</div><div class="small muted qleg"><span>1 = ${q.hi==='bad'?'pas du tout':'très mal'}</span><span>${n} = ${q.hi==='bad'?'énormément':'excellent'}</span></div></section>`}
    if(q.t==='yn')return `<section class="card qcard"><b class="ql">${esc(q.l)}${star}</b><div class="seg two"><button data-act="q-yn" data-k="${q.id}" data-v="1" aria-pressed="${v===true}">Oui</button><button data-act="q-yn" data-k="${q.id}" data-v="0" aria-pressed="${v===false}">Non</button></div></section>`;
    if(q.t==='num')return `<section class="card qcard"><label class="ql" for="qi-${q.id}">${esc(q.l)}${star}</label><div class="qnum"><input id="qi-${q.id}" data-qin="${q.id}" type="text" inputmode="decimal" value="${v!=null?esc(String(v)):''}" autocomplete="off">${q.u?`<span>${esc(q.u)}</span>`:''}</div></section>`;
    if(q.t==='text')return `<section class="card qcard"><label class="ql" for="qi-${q.id}">${esc(q.l)}${star}</label><div class="field" style="margin:0"><input id="qi-${q.id}" data-qin="${q.id}" maxlength="200" value="${v!=null?esc(String(v)):''}" autocomplete="off"></div></section>`;
    const sel=ZONES[QS.side].filter(z=>QS.pains[z[0]]),other=Object.keys(QS.pains).filter(k=>k[0]!==QS.side).length;
    return `<section class="card"><div class="chart-h"><b>${esc(q.l)}</b><div class="seg mini"><button data-act="q-side" data-v="f" aria-pressed="${QS.side==='f'}">Face</button><button data-act="q-side" data-v="b" aria-pressed="${QS.side==='b'}">Dos</button></div></div>
    <div class="qmap">${bodyMap(QS.side,QS.pains,{act:'q-zone',w:150})}<div class="qsel">${sel.length?sel.map(([id,l])=>`<div class="qz"><b>${esc(l)}</b><small class="muted">Intensité de la douleur</small><div class="q5 sm">${[1,2,3,4,5].map(n=>`<button data-act="q-int" data-z="${id}" data-v="${n}" aria-pressed="${QS.pains[id]===n}" aria-label="Intensité ${n} sur 5">${n}</button>`).join('')}</div></div>`).join(''):`<p class="small muted" style="margin:0">Touche une zone de la silhouette si tu as mal. Sinon, rien à faire.</p>`}
    ${other?`<p class="small muted" style="margin:0">+ ${other} zone${other>1?'s':''} côté ${QS.side==='f'?'dos':'face'}</p>`:''}</div></div></section>`};
  const miss=questMissing(Q);
  const h=sheetHead(Q.title,'tm-q-close')+`<div class="sheet-b"><div class="wrap sp-col">
   <div><h1 class="sp-h1">${e?"Comment c'était ?":'Comment tu te sens ?'}</h1>${e?`<div class="muted small">${esc(e.title)} · ${dShort(e.start)} ${hm(e.start)}</div>`:''}</div>
   ${Q.qs.map(block).join('')}
   ${Q.qs.some(q=>q.req)?'<p class="small muted" style="margin:0">* réponse obligatoire</p>':''}
  </div></div><div class="sheet-f"><div class="in"><button class="btn primary" data-act="q-save" ${miss.length?'disabled':''}>Envoyer</button></div></div>`;
  const el=openSheet('tm-q',h);el.querySelector('.sheet-b').scrollTop=sc;
}
function questSaveBtn(){const b=document.querySelector('#sheet-tm-q [data-act="q-save"]');if(b&&QS){qVals();b.disabled=questMissing(qsQuest()).length>0}}
document.addEventListener('input',e=>{if(e.target.dataset&&e.target.dataset.qin)questSaveBtn()});
async function saveQuest(btn){
  qVals();const Q=qsQuest(),tid=QS.tid;if(questMissing(Q).length){toast('Réponds aux questions obligatoires.');return}
  const ids=new Set(Q.qs.map(q=>q.id)),ans={};for(const k in QS.ans)if(ids.has(k))ans[k]=QS.ans[k];
  const doc={uid:UID,qid:Q.id,day:QS.day,at:Date.now(),ans,pains:Q.qs.some(q=>q.t==='body')?QS.pains:{}};if(QS.ev)doc.ev=QS.ev;
  const wid=wellId(UID,Q,QS.key);btn.disabled=true;
  try{await subCol(tid,'wellness').doc(wid).set(doc);const D=dataOf(tid);D.wellness=D.wellness.filter(w=>w.id!==wid).concat(cWell(wid,doc));
    // difficulté de la séance : elle alimente la charge (durée × difficulté)
    const rq=Q.qs.find(q=>q.t==='rpe'),rpe=rq?ans[rq.id]:null,e=QS.ev?D.events.find(x=>x.id===QS.ev):null;
    if(e&&rpe>=1&&rpe<=10)await saveEvLoad(tid,e,Math.round(rpe));
    closeSheet('tm-q');closeSheet('tm-ev');QS=null;render();toast('Questionnaire envoyé · merci !')}
  catch(e){btn.disabled=false;toast('Envoi impossible. Vérifie ta connexion.')}
}
async function saveEvLoad(tid,e,rpe){
  const D=dataOf(tid),l=D.logs.find(x=>x.uid===UID&&x.eventId===e.id);
  try{if(l){const dur=l.dur||Math.min(600,e.dur);await subCol(tid,'logs').doc(l.id).update({rpe,dur,load:dur*rpe});Object.assign(l,{rpe,dur,load:dur*rpe})}
    else{const dur=Math.min(600,e.dur),id=gid(),doc={uid:UID,kind:['match','muscu','recup'].includes(e.type)?e.type:'training',eventId:e.id,title:e.title.slice(0,80),at:Math.min(Date.now(),e.start+e.dur*60000),dur,rpe,load:dur*rpe};
      await subCol(tid,'logs').doc(id).set(doc);D.logs.push(cLog(id,doc));D.logs.sort((a,b)=>a.at-b.at)}}catch(x){}
}

/* --- coach : créer, activer et désactiver les questionnaires --- */
let QE=null;
const newQid=(tid)=>{let id;do{id='q'+Math.random().toString(36).slice(2,10).replace(/[^a-z0-9]/g,'')}while(!QSID.test(id)||questById(tid,id));return id};
function openQuestNew(tid){
  modal(`<h3>Nouveau questionnaire</h3><div class="legal-list" style="text-align:left">${[['health','Santé du matin','Motivation, sommeil, fatigue, douleurs · chaque matin'],['after','Ressenti après séance','Difficulté de 1 à 10 (sert à calculer la charge) · après chaque séance'],['evening','Bilan du soir','Fatigue et douleurs · chaque soir'],['empty','Questionnaire vide','Tu choisis tout']].map(([k,l,d])=>`<button class="row" data-act="tm-qe-tpl" data-id="${tid}" data-v="${k}"><div class="m"><div>${l}</div><small>${d}</small></div>${ICON.chev}</button>`).join('')}</div>
   <div class="acts"><button class="btn ghost" data-act="modal-close">Annuler</button></div>`)}
function openQuestEdit(tid,qid,tpl){
  const q=qid?questById(tid,qid):null,base=q||cQuest('',{...QUEST_TPLS[tpl||'empty'](),on:false});
  QE={tid,id:q?q.id:null,legacy:!!(q&&q.legacy),title:q?q.title:QUEST_TPLS[tpl||'empty']().title,when:base.when,aft:new Set(base.aft.length?base.aft:['training','muscu']),on:q?q.on:true,qs:(q?q.qs:(QUEST_TPLS[tpl||'empty']().qs)).map(x=>({...x})),tpl:!q&&tpl&&tpl!=='empty'};
  renderQuestEdit();
}
function qeVals(){if(!QE)return;const t=$('#qe-title');if(t)QE.title=t.value.slice(0,60);QE.qs.forEach((q,i)=>{const l=$('#qe-l-'+i);if(l)q.l=l.value.slice(0,80);const u=$('#qe-u-'+i);if(u)q.u=u.value.slice(0,12)})}
function renderQuestEdit(){
  const sc=document.querySelector('#sheet-tm-qe .sheet-b')?.scrollTop||0,n=QE.qs.length,on=QE.on&&n>0;
  const card=(q,i)=>`<section class="card qe"><div class="qe-h"><span class="qe-n num">${i+1}</span><span class="chip">${QTYPES[q.t]}</span><span style="flex:1"></span>
    <button class="icon-btn sm" data-act="qe-mv" data-i="${i}" data-d="-1" ${i?'':'disabled'} aria-label="Monter">↑</button><button class="icon-btn sm" data-act="qe-mv" data-i="${i}" data-d="1" ${i<n-1?'':'disabled'} aria-label="Descendre">↓</button><button class="icon-btn sm" data-act="qe-del" data-i="${i}" aria-label="Supprimer la question">✕</button></div>
    <div class="field" style="margin:0"><label for="qe-l-${i}">Question</label><input id="qe-l-${i}" value="${esc(q.l)}" maxlength="80" placeholder="Ex. Comment as-tu dormi ?" autocomplete="off"></div>
    ${q.t==='rpe'?'<p class="small muted" style="margin:0">Note de 1 (très facile) à 10 (maximal). Multipliée par la durée de la séance, elle donne la charge utilisée dans l\'effectif et les stats.</p>':''}
    ${q.t==='scale'?`<div class="qe-o"><span class="small muted">Notes</span><div class="seg two mini"><button data-act="qe-set" data-i="${i}" data-k="n" data-v="5" aria-pressed="${q.n!==10}">1 à 5</button><button data-act="qe-set" data-i="${i}" data-k="n" data-v="10" aria-pressed="${q.n===10}">1 à 10</button></div></div>
      <div class="qe-o"><span class="small muted">Une note haute, c'est</span><div class="seg two mini"><button data-act="qe-set" data-i="${i}" data-k="hi" data-v="good" aria-pressed="${q.hi!=='bad'}">Bien</button><button data-act="qe-set" data-i="${i}" data-k="hi" data-v="bad" aria-pressed="${q.hi==='bad'}">Mauvais</button></div></div>`:''}
    ${q.t==='yn'?`<div class="qe-o"><span class="small muted">Alerter si la réponse est</span><div class="seg mini three"><button data-act="qe-set" data-i="${i}" data-k="w" data-v="yes" aria-pressed="${q.w==='yes'}">Oui</button><button data-act="qe-set" data-i="${i}" data-k="w" data-v="no" aria-pressed="${q.w==='no'}">Non</button><button data-act="qe-set" data-i="${i}" data-k="w" data-v="" aria-pressed="${!q.w}">Jamais</button></div></div>`:''}
    ${q.t==='num'?`<div class="field" style="margin:0"><label for="qe-u-${i}">Unité (facultatif)</label><input id="qe-u-${i}" value="${esc(q.u||'')}" maxlength="12" placeholder="Ex. kg, h, bpm" autocomplete="off"></div>`:''}
    ${q.t==='body'?'<p class="small muted" style="margin:0">Le joueur touche les zones où il a mal sur une silhouette et note l\'intensité de 1 à 5.</p>':`<div class="set-row" style="padding:0"><div class="small">Réponse obligatoire</div><button class="toggle" data-act="qe-req" data-i="${i}" aria-pressed="${!!q.req}" aria-label="Réponse obligatoire"></button></div>`}
   </section>`;
  const h=sheetHead(QE.id?'Modifier le questionnaire':'Nouveau questionnaire','tm-qe-close')+`<div class="sheet-b"><div class="wrap sp-col">
   <div class="field"><label for="qe-title">Nom du questionnaire</label><input id="qe-title" value="${esc(QE.title)}" maxlength="60" placeholder="Ex. Santé du matin" autocomplete="off"></div>
   <div class="field"><span class="flabel">Quand le remplir ?</span><div class="seg" role="group">${Object.entries(QWHEN).map(([k,l])=>`<button data-act="qe-when" data-v="${k}" aria-pressed="${QE.when===k}">${l}</button>`).join('')}</div></div>
   ${QE.when==='after'?`<div class="field"><span class="flabel">Après quelles séances ?</span><div class="chips left">${Object.entries(QAFT).map(([k,l])=>`<button class="chip-b" data-act="qe-aft" data-v="${k}" aria-pressed="${QE.aft.has(k)}">${l}</button>`).join('')}</div><p class="small muted" style="margin:0">Il apparaît sur le créneau du planning avec une pastille rouge, dès le début de la séance.</p></div>`
     :`<p class="small muted" style="margin:0">${QE.when==='morning'?'Il apparaît chaque jour en haut du planning de tes joueurs.':`Il apparaît chaque jour dans le planning de tes joueurs, à remplir à partir de ${EVENING_H}h.`}</p>`}
   <section class="card"><div class="set-row" style="padding:0"><div><div style="font-weight:700">${on?'Activé':'Désactivé'}</div><div class="small muted">${!n?'Ajoute au moins une question pour pouvoir l\'activer.':on?'Tes joueurs le voient dans leur planning et doivent y répondre.':'Tes joueurs ne le voient pas. Leurs anciennes réponses restent consultables.'}</div></div><button class="toggle" data-act="qe-on" aria-pressed="${on}" aria-label="Activer le questionnaire" ${n?'':'disabled'}></button></div></section>
   ${QE.tpl?'<p class="small muted" style="margin:0">Voici un modèle pour démarrer : modifie, supprime ou ajoute les questions que tu veux.</p>':''}
   ${QE.qs.map(card).join('')||'<div class="card empty"><p style="margin:0">Aucune question. Ajoute ta première question.</p></div>'}
   ${n<15?`<button class="btn ghost block" data-act="qe-add">+ Ajouter une question</button>`:'<p class="small muted" style="margin:0">15 questions maximum.</p>'}
   ${QE.id?`<button class="linkbtn danger-link" data-act="qe-delq">Supprimer ce questionnaire</button>`:''}
  </div></div><div class="sheet-f"><div class="in"><button class="btn primary" data-act="qe-save">Enregistrer</button></div></div>`;
  const el=openSheet('tm-qe',h);el.querySelector('.sheet-b').scrollTop=sc;
}
function qeAddMenu(){const hasBody=QE.qs.some(q=>q.t==='body'),hasRpe=QE.qs.some(q=>q.t==='rpe');
  modal(`<h3>Type de question</h3><div class="legal-list" style="text-align:left">${[...(QE.when==='after'&&!hasRpe?[['rpe','Difficulté de la séance','Note de 1 à 10 qui calcule la charge']]:[]),['scale','Échelle','Une note de 1 à 5 ou de 1 à 10 (forme, sommeil, fatigue…)'],['yn','Oui / Non','Ex. As-tu été malade ? As-tu pris un médicament ?'],['num','Nombre','Ex. poids, heures de sommeil, pouls au réveil'],['text','Texte libre','Le joueur écrit ce qu\'il veut'],...(hasBody?[]:[['body','Douleurs','Silhouette à toucher, intensité de 1 à 5']])].map(([t,l,d])=>`<button class="row" data-act="qe-add-t" data-t="${t}"><div class="m"><div>${l}</div><small>${d}</small></div>${ICON.chev}</button>`).join('')}</div>
   <div class="acts"><button class="btn ghost" data-act="modal-close">Annuler</button></div>`)}
const questDoc=q=>({title:q.title,when:q.when,aft:q.when==='after'?q.aft:[],on:q.on&&q.qs.length>0,qs:q.qs.map(x=>JSON.parse(JSON.stringify(x))),at:Date.now(),by:UID});
async function writeQuest(tid,id,doc,legacy){
  await subCol(tid,'quests').doc(id).set(doc);
  if(legacy){try{await DB.doc(`teams/${tid}/config/quest`).delete()}catch(e){}}
  const D=SP.D[tid];if(D){D.quests=(D.quests||[]).filter(q=>q.id!==id).concat(cQuest(id,doc)).sort((a,b)=>a.at-b.at)}
}
async function saveQuestEdit(btn){
  qeVals();const title=(QE.title||'').trim(),qs=QE.qs.map(q=>({...q,l:(q.l||'').trim()}));
  if(!title){$('#qe-title')?.focus();toast('Donne un nom au questionnaire.');return}
  if(qs.some(q=>!q.l)){toast('Écris le texte de chaque question.');return}
  if(QE.when==='after'&&!QE.aft.size){toast('Choisis au moins un type de séance.');return}
  const c=cQuest('x',{title,when:QE.when,aft:[...QE.aft],on:QE.on,qs});
  if(QE.when!=='after'&&qs.some(q=>q.t==='rpe'))toast('La difficulté de la séance ne sert qu\'après une séance : question retirée.');
  const id=QE.id||newQid(QE.tid),doc=questDoc({...c,on:QE.on});btn.disabled=true;
  try{await writeQuest(QE.tid,id,doc,QE.legacy);closeSheet('tm-qe');const on=doc.on;QE=null;render();toast(on?'Questionnaire enregistré et activé':'Questionnaire enregistré · désactivé')}
  catch(e){btn.disabled=false;toast(e&&e.code==='permission-denied'?"Enregistrement refusé : publie les nouvelles règles Firestore.":'Enregistrement impossible. Vérifie ta connexion.')}
}
async function toggleQuest(tid,qid,btn){
  const q=questById(tid,qid);if(!q||!q.qs.length)return;btn.disabled=true;
  try{await writeQuest(tid,q.id,questDoc({...q,on:!q.on}),q.legacy);render();toast(q.on?'Questionnaire désactivé':'Questionnaire activé')}
  catch(e){btn.disabled=false;toast(e&&e.code==='permission-denied'?"Action refusée : publie les nouvelles règles Firestore.":'Action impossible. Vérifie ta connexion.')}
}
async function delQuest(tid,qid){
  const q=questById(tid,qid);if(!q)return;
  try{if(q.legacy)await DB.doc(`teams/${tid}/config/quest`).delete();else await subCol(tid,'quests').doc(qid).delete();
    const D=SP.D[tid];if(D)D.quests=D.quests.filter(x=>x.id!==qid);closeModal();closeSheet('tm-qe');QE=null;render();toast('Questionnaire supprimé')}
  catch(e){toast('Suppression impossible.')}
}
function openHealth(tid){
  const T=SP.T[tid];
  openSheet('tm-h',sheetHead('Mes réponses','tm-h-close')+`<div class="sheet-b"><div class="wrap sp-col">${T.me.health?`<div class="card">
   <p style="margin:0">Tu as accepté le ${dfull(T.me.health)} que tes réponses aux questionnaires soient visibles par les coachs de <b>${esc(T.team.name)}</b>. Cet accord vaut pour tous les questionnaires de l'équipe.</p></div>
   <button class="btn danger" data-act="q-revoke" data-id="${tid}">Retirer mon accord et effacer mes réponses</button>`
   :consentCard(T,{title:'Questionnaires de l\'équipe',id:'h-ok',btn:`<button class="btn primary block" data-act="h-consent" data-id="${tid}">Donner mon accord</button>`})}</div></div>`);
}
async function giveConsent(tid,b){const now=Date.now();b.disabled=true;
  try{await memRef(tid,UID).update({health:now});SP.T[tid].me.health=now;const D=SP.D[tid];if(D){const m=D.members.find(x=>x.uid===UID);if(m)m.health=now}return true}catch(e){b.disabled=false;toast('Enregistrement impossible.');return false}}
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
  'tm-remind':async()=>{const t='Pensez à remplir vos questionnaires sur Hevor 💪';if(navigator.share){try{await navigator.share({text:t})}catch(e){}}else{try{await navigator.clipboard.writeText(t);toast('Message de rappel copié : colle-le dans le groupe de l\'équipe')}catch(e){toast(t)}}},
  'tm-wk':d=>{PW[d.id]=(PW[d.id]||0)+(+d.d);render()},
  'tm-sper':d=>{SPER[d.id]=+d.v;render()},
  'tm-psub':d=>{PSUB[d.id]=d.v;render()},
  'tm-progs-go':d=>{closeSheet('tm-ev');SP.tab[d.id]='programs';PSUB[d.id]='muscu';render();window.scrollTo(0,0)},
  'tm-ev':d=>openEvent(d.id,d.e),'tm-ev-close':()=>closeSheet('tm-ev'),
  'tm-ev-new':d=>openEventEdit(d.id,null),'tm-ev-edit':d=>openEventEdit(d.id,d.e),'tm-eved-close':()=>{closeSheet('tm-eved');EV=null},
  'tm-evtype':d=>{const v=evVals();EV.type=d.v;if(!EV.durTouched)v.dur=DEF_DUR[d.v]||90;renderEventEdit(v)},
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
  'pe-stp':d=>{progVals();const it=PE.items[+d.i],[mn,mx,st]=LIM[d.k];it[d.k]=d.k==='dur'?durBump(it.dur,+d.d):Math.min(mx,Math.max(mn,(it[d.k]??0)+st*(+d.d)));renderProgEdit()},
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
  'tm-q':d=>openQuest(d.id,d.q,d.e),'tm-q-close':()=>{closeSheet('tm-q');QS=null},
  'q-consent':async(d,b)=>{if(!$('#q-ok').checked){toast("Coche la case pour donner ton accord, ou ferme le questionnaire.");return}if(await giveConsent(QS.tid,b)){QS.consent=true;renderQuest()}},
  'h-consent':async(d,b)=>{if(!$('#h-ok').checked){toast('Coche la case pour donner ton accord.');return}if(await giveConsent(d.id,b)){closeSheet('tm-h');render();toast('Accord enregistré · il ne te sera plus demandé')}},
  'q-set':d=>{qVals();QS.ans[d.k]=+d.v;renderQuest()},
  'q-yn':d=>{qVals();QS.ans[d.k]=d.v==='1';renderQuest()},
  'q-side':d=>{qVals();QS.side=d.v;renderQuest()},
  'q-zone':d=>{qVals();if(QS.pains[d.z])delete QS.pains[d.z];else QS.pains[d.z]=1;renderQuest()},
  'q-int':d=>{qVals();QS.pains[d.z]=+d.v;renderQuest()},
  'tm-qe':d=>{if(!d.q){SP.tab[d.id]='programs';PSUB[d.id]='quests';render();window.scrollTo(0,0);return}openQuestEdit(d.id,d.q)},'tm-qe-close':()=>{closeSheet('tm-qe');QE=null},
  'tm-qe-new':d=>openQuestNew(d.id),'tm-qe-tpl':d=>{closeModal();openQuestEdit(d.id,null,d.v)},
  'tm-qon':(d,b)=>toggleQuest(d.id,d.q,b),
  'qe-on':()=>{qeVals();if(!QE.qs.length)return;QE.on=!QE.on;renderQuestEdit()},
  'qe-when':d=>{qeVals();QE.when=d.v;if(d.v!=='after')QE.qs=QE.qs.filter(q=>q.t!=='rpe');renderQuestEdit()},
  'qe-aft':d=>{qeVals();QE.aft.has(d.v)?QE.aft.delete(d.v):QE.aft.add(d.v);renderQuestEdit()},
  'qe-delq':()=>{qeVals();modal(`<h3>Supprimer ce questionnaire ?</h3><p class="muted" style="margin:0">Il disparaîtra du planning de tes joueurs. Leurs réponses déjà envoyées restent dans leur historique.</p><div class="acts"><button class="btn danger" data-act="qe-delq-yes">Supprimer</button><button class="btn ghost" data-act="modal-close">Annuler</button></div>`)},
  'qe-delq-yes':()=>{if(QE&&QE.id)delQuest(QE.tid,QE.id)},
  'qe-req':d=>{qeVals();const q=QE.qs[+d.i];q.req=!q.req;renderQuestEdit()},
  'qe-set':d=>{qeVals();const q=QE.qs[+d.i];q[d.k]=d.k==='n'?+d.v:d.v;renderQuestEdit()},
  'qe-mv':d=>{qeVals();const i=+d.i,j=i+(+d.d);if(j<0||j>=QE.qs.length)return;[QE.qs[i],QE.qs[j]]=[QE.qs[j],QE.qs[i]];renderQuestEdit()},
  'qe-del':d=>{qeVals();QE.qs.splice(+d.i,1);renderQuestEdit()},
  'qe-add':()=>{qeVals();qeAddMenu()},
  'qe-add-t':d=>{closeModal();let id='';do{id='q'+Math.random().toString(36).slice(2,8)}while(QE.qs.some(q=>q.id===id));
    const q={id,t:d.t,l:'',req:d.t!=='body'&&d.t!=='text'};if(d.t==='rpe')q.l="C'était dur ?";if(d.t==='scale'){q.n=5;q.hi='good'}if(d.t==='yn')q.w='';if(d.t==='num')q.u='';if(d.t==='body')q.l='Où as-tu mal ?';
    QE.qs.push(q);QE.tpl=false;renderQuestEdit();setTimeout(()=>{const el=$('#qe-l-'+(QE.qs.length-1));if(el){el.focus();el.scrollIntoView({block:'center'})}},40)},
  'qe-save':(d,b)=>saveQuestEdit(b),
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
  if(t.id==='ev-dur'&&EV){EV.durTouched=true}
  if(t.id==='pe-ev'&&PE){progVals();PE.eventId=t.value;const e=dataOf(PE.tid).events.find(x=>x.id===t.value);if(e){PE.date=isoDate(e.start);if(PE.dest==='all')PE.dest='event'}else if(PE.dest==='event')PE.dest='all';renderProgEdit();return}
});
