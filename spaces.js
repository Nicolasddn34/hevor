"use strict";
/* =====================================================================
   Hevor — espaces Moi / Club / Coach
   « Moi » = l'appli perso (app.js), totalement privée : rien n'en sort.
   « Club » = équipes (coach, joueur, spectateur). « Coach » = coach indépendant et ses clients.
   Chaque espace a ses propres données, son accueil et ses couleurs.
   ===================================================================== */
const SP={doc:{teams:[],home:'auto',name:''},ready:false,cur:'moi',open:{club:null,coach:null},tab:{},T:{},D:{},booted:false,touched:false,unsub:{}};
const MOI_TABS_HTML=document.querySelector('#tabs .in').innerHTML;
const ROLE_L={pending:'En attente',player:'Joueur',coach:'Coach',spectator:'Spectateur',client:'Client'};
const SPORTS=['Volley-ball','Handball','Football','Basket-ball','Rugby','Hockey','Water-polo','Athlétisme','Tennis','Natation','Cyclisme','Sports de combat','Autre'];
const SPICON={
  user:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c1-4.5 4-7 8-7s7 2.5 8 7"/></svg>',
  team:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.5 3.4-5.5 6.5-5.5s5.7 2 6.5 5.5M16 4.5a3.5 3.5 0 0 1 0 7M18.5 14.5c1.6.7 2.6 2.6 3 5.5"/></svg>',
  down:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>',
  shield:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l8 3v6c0 5-3.5 8-8 9.5C7.5 20 4 17 4 12V6z"/><path d="M12 9v6M9 12h6"/></svg>',
  link:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/></svg>',
  clock:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg>',
  crown:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8l4 4 5-7 5 7 4-4-2 11H5z"/></svg>',
  plus:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  lock:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>',
  play:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>',
  cal:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>',
  list:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01"/></svg>',
  home:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/></svg>',
  dumb:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11"/></svg>',
  pulse:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12h4l3-7 4 14 3-7h4"/></svg>',
  gear:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/></svg>',
  warn:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 3l9.5 17h-19z"/><path d="M12 10v4M12 17.5v.5"/></svg>'
};

/* ---------- références Firestore ---------- */
const spRef=()=>DB.doc(`data/users/${UID}/spaces`);
const teamRef=tid=>DB.doc(`teams/${tid}`);
const memRef=(tid,uid)=>DB.doc(`teams/${tid}/members/${uid}`);
const subCol=(tid,c)=>DB.collection(`teams/${tid}/${c}`);
const inviteRef=code=>DB.doc(`invites/${code}`);

/* ---------- état local (dernier espace ouvert) ---------- */
const spKey=()=>'hevor.sp:'+(UID||'local');
function spSaveLocal(){try{localStorage.setItem(spKey(),JSON.stringify({cur:SP.cur,open:SP.open,tab:SP.tab,doc:SP.doc}))}catch(e){}}
function spLoadLocal(){try{const o=JSON.parse(localStorage.getItem(spKey())||'null');if(o){SP.open={club:okId(o.open?.club)?o.open.club:null,coach:okId(o.open?.coach)?o.open.coach:null};SP.tab=o.tab&&typeof o.tab==='object'?o.tab:{};if(o.doc)SP.doc=cSpDoc(o.doc)}}catch(e){}}
function cSpDoc(o){o=o&&typeof o==='object'?o:{};return{teams:(Array.isArray(o.teams)?o.teams:[]).filter(okId).slice(0,50),home:typeof o.home==='string'&&/^(auto|moi|club|coach)(:[A-Za-z0-9_-]{1,48})?$/.test(o.home)?o.home:'auto',name:cStr(o.name,40)}}
async function spSaveDoc(){spSaveLocal();if(!DB)return;try{await q(spRef().set({teams:SP.doc.teams,home:SP.doc.home,name:SP.doc.name,stamp:Date.now()}))}catch(e){}}

/* ---------- équipes ---------- */
const teamsOf=kind=>SP.doc.teams.filter(t=>SP.T[t]&&SP.T[t].team&&SP.T[t].team.kind===kind);
const curTid=()=>{const k=SP.cur;if(k==='moi')return null;const list=teamsOf(k);if(SP.open[k]&&list.includes(SP.open[k]))return SP.open[k];return list.length===1?list[0]:null};
const curT=()=>{const t=curTid();return t?SP.T[t]:null};
const myRole=tid=>SP.T[tid]?.me?.role||null;
const isTeamOwner=tid=>SP.T[tid]?.team?.owner===UID;
function cTeam(id,d){d=d||{};const th=d.theme&&typeof d.theme==='object'?d.theme:null;
  return{id,kind:d.kind==='coach'?'coach':'club',name:cStr(d.name,60)||'Équipe',club:cStr(d.club,80),sport:cStr(d.sport,40),logo:typeof d.logo==='string'&&/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(d.logo)?d.logo:'',theme:th?cTheme(th):null,owner:cStr(d.owner,128),ownerName:cStr(d.ownerName,40),code:cStr(d.code,12)}}
function cMember(d){d=d||{};return{uid:cStr(d.uid,128),name:cStr(d.name,40)||'Sans nom',role:ROLE_L[d.role]?d.role:'pending',poste:cStr(d.poste,40),at:cNum(d.at,0,4102444800000,0),health:d.health?cNum(d.health,0,4102444800000,0):0}}
async function loadTeamHead(tid){
  try{
    const m=await memRef(tid,UID).get();
    if(!m.exists)return 'gone';
    const t=await teamRef(tid).get();
    if(!t.exists)return 'gone';
    SP.T[tid]={team:cTeam(tid,t.data()),me:cMember(m.data())};return 'ok';
  }catch(e){return SP.T[tid]?'ok':'err'}
}
async function spacesBoot(){
  if(!DB||!UID)return;
  spLoadLocal();
  try{const d=await spRef().get();if(d.exists)SP.doc=cSpDoc(d.data())}catch(e){}
  const res=await Promise.all(SP.doc.teams.map(async t=>[t,await loadTeamHead(t)]));
  const gone=res.filter(([,r])=>r==='gone').map(([t])=>t);
  if(gone.length){SP.doc.teams=SP.doc.teams.filter(t=>!gone.includes(t));gone.forEach(t=>{delete SP.T[t]});spSaveDoc()}
  SP.ready=true;
  if(!SP.booted){SP.booted=true;if(!SP.touched){const h=pickHome();SP.cur=h.space;if(h.tid)SP.open[h.space]=h.tid}}
  watchPending();
  applyTheme();render();
  const code=pendingJoin();if(code)openJoin(code);
}
function pickHome(){
  const h=SP.doc.home,[sp,tid]=h.split(':');
  const moiUsed=S.templates.length||S.sessions.length||S.active;
  if(sp==='moi')return{space:'moi'};
  if((sp==='club'||sp==='coach')&&teamsOf(sp).length)return{space:sp,tid:tid&&teamsOf(sp).includes(tid)?tid:null};
  if(moiUsed)return{space:'moi'};
  if(teamsOf('club').length)return{space:'club'};
  if(teamsOf('coach').length)return{space:'coach'};
  return{space:'moi'};
}
function spacesReset(){Object.values(SP.unsub).forEach(f=>{try{f()}catch(e){}});Object.assign(SP,{doc:{teams:[],home:'auto',name:''},ready:false,cur:'moi',open:{club:null,coach:null},tab:{},T:{},D:{},booted:false,touched:false,unsub:{}});applyTheme()}
/* l'attente d'un rôle se met à jour toute seule */
function watchPending(){
  for(const tid of SP.doc.teams){const T=SP.T[tid];if(!T||T.me.role!=='pending'||SP.unsub[tid])continue;
    try{SP.unsub[tid]=memRef(tid,UID).onSnapshot(s=>{if(!s.exists){return}const m=cMember(s.data());const was=SP.T[tid]?.me?.role;if(SP.T[tid])SP.T[tid].me=m;
      if(m.role!=='pending'){try{SP.unsub[tid]()}catch(e){}delete SP.unsub[tid];if(was==='pending'){delete SP.D[tid];if(curTid()===tid){render();toast(`Ton coach t'a ajouté comme ${ROLE_L[m.role].toLowerCase()}`)}}}},()=>{})}catch(e){}}
}

/* ---------- espaces utilisés et bascule ---------- */
function spacesUsed(){const u=[];if(S.templates.length||S.sessions.length||S.active)u.push('moi');if(teamsOf('club').length)u.push('club');if(teamsOf('coach').length)u.push('coach');return u}
const SPACE_L={moi:'Moi',club:'Club',coach:'Coach'};
function spPill(){
  const used=spacesUsed();
  if(used.length>=2||(SP.cur!=='moi'&&!used.includes(SP.cur)))return `<button class="sp-pill" data-act="sp-sheet" aria-label="Changer d'espace (espace actuel : ${SPACE_L[SP.cur]})"><span class="sp-pill-ic">${SP.cur==='moi'?SPICON.user:SP.cur==='club'?SPICON.shield:SPICON.team}</span>${SPACE_L[SP.cur]}${SPICON.down}</button>`;
  if(SP.cur!=='moi')return `<button class="icon-btn sp-me" data-act="sp-sheet" aria-label="Mes espaces et mon compte">${SPICON.user}</button>`;
  return '';
}
function setSpace(sp,tid){
  SP.touched=true;closeModal();document.querySelectorAll('.sheet').forEach(e=>e.remove());
  const from=SP.cur;SP.cur=sp;if(tid!==undefined&&sp!=='moi')SP.open[sp]=tid;
  if(sp==='moi'&&(from!=='moi'||!['home','lib','pass','stats','more'].includes(VIEW)))VIEW='home';
  navStack=[];spSaveLocal();applyTheme();render();window.scrollTo(0,0);
}
function drawer(html){closeModal();const d=document.createElement('div');d.className='scrim drawer';d.id='modal';d.innerHTML=`<div class="modal drawer-p" role="dialog" aria-modal="true"><div class="grab"></div>${html}</div>`;d.addEventListener('click',e=>{if(e.target===d)closeModal()});document.body.appendChild(d);pushNav()}
function openSpaces(){
  const club=teamsOf('club'),coach=teamsOf('coach');
  const clubs=new Set(club.map(t=>norm(SP.T[t].team.club||SP.T[t].team.name)));
  const row=(sp,title,sub,ic,cls)=>`<button class="sp-row ${cls||''} ${SP.cur===sp?'on':''}" data-act="sp-go" data-v="${sp}"><span class="sp-ic">${ic}</span><span class="m"><b>${title}${SP.doc.home.split(':')[0]===sp?' <i class="sp-home">Accueil</i>':''}</b><small>${sub}</small></span>${SP.cur===sp?`<span class="sp-ok" aria-label="Espace ouvert">${ICON.check}</span>`:ICON.chev}</button>`;
  drawer(`<div class="sp-dh"><h3>Mes espaces</h3><button class="linkbtn" data-act="sp-home">Espace d'accueil</button></div>
   ${row('moi','Moi','Mon entraînement perso · privé',`<span class="logo">${LOGO}</span>`,'moi')}
   ${row('club','Club',club.length?`${club.length} équipe${club.length>1?'s':''} · ${clubs.size} club${clubs.size>1?'s':''}`:'Créer ou rejoindre une équipe',SPICON.shield,'club')}
   ${row('coach','Coach',coach.length?coachSub(coach):'Coacher des clients ou rejoindre ton coach',SPICON.team,'coach')}
   <p class="small muted sp-note">${SPICON.lock}Chaque espace est séparé : rien de « Moi » n'est visible ailleurs.</p>
   <button class="btn ghost block" data-act="sp-account">Mon compte et réglages</button>`);
}
function coachSub(list){const mine=list.filter(t=>myRole(t)==='coach'),cl=list.filter(t=>myRole(t)!=='coach');const a=[];if(mine.length)a.push(mine.length>1?`${mine.length} espaces coaching`:'Mes clients');if(cl.length)a.push(cl.length>1?`${cl.length} coachs`:'Mon coach');return a.join(' · ')}
function openHomePick(){
  closeModal();
  const opts=[['auto','Automatique',"Ouvre l'espace où tu as de l'activité. Si « Moi » est vide, tu arrives sur ton club."],['moi','Moi','Mon entraînement perso']];
  teamsOf('club').forEach(t=>{const T=SP.T[t].team;opts.push(['club:'+t,'Club · '+T.name,T.club])});
  if(teamsOf('coach').length)opts.push(['coach','Coach',coachSub(teamsOf('coach'))]);
  const cur=SP.doc.home==='club'&&teamsOf('club').length===1?'club:'+teamsOf('club')[0]:SP.doc.home;
  openSheet('sp-home',sheetHead("Espace d'accueil",'sp-home-close')+`<div class="sheet-b"><div class="wrap sp-col">
   <p class="muted small" style="margin:0">L'espace qui s'ouvre quand tu lances Hevor.</p>
   <fieldset class="sp-radios"><legend class="vh">Espace d'accueil</legend>${opts.map(([v,l,s])=>`<label class="sp-radio"><input type="radio" name="sp-home" value="${esc(v)}" ${v===cur?'checked':''}><span><b>${esc(l)}</b>${s?`<small>${esc(s)}</small>`:''}</span></label>`).join('')}</fieldset>
   <p class="small muted" style="margin:0">Le bouton pour changer d'espace n'apparaît qu'à partir de deux espaces utilisés.</p></div></div>`);
}

/* ---------- couleurs ---------- */
const hexRgb=h=>{h=h.replace('#','');return[parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)]};
function rgbHsl(r,g,b){r/=255;g/=255;b/=255;const mx=Math.max(r,g,b),mn=Math.min(r,g,b),l=(mx+mn)/2;let h=0,s=0;if(mx!==mn){const d=mx-mn;s=l>.5?d/(2-mx-mn):d/(mx+mn);h=mx===r?(g-b)/d+(g<b?6:0):mx===g?(b-r)/d+2:(r-g)/d+4;h*=60}return[h,s*100,l*100]}
function hslHex(h,s,l){h=((h%360)+360)%360;s=Math.max(0,Math.min(100,s))/100;l=Math.max(0,Math.min(100,l))/100;const k=n=>(n+h/30)%12,a=s*Math.min(l,1-l),f=n=>l-a*Math.max(-1,Math.min(k(n)-3,Math.min(9-k(n),1)));return'#'+[f(0),f(8),f(4)].map(x=>Math.round(x*255).toString(16).padStart(2,'0')).join('')}
function lum(hex){const c=hexRgb(hex).map(v=>{v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4)});return .2126*c[0]+.7152*c[1]+.0722*c[2]}
const contrast=(a,b)=>{const x=lum(a),y=lum(b);return(Math.max(x,y)+.05)/(Math.min(x,y)+.05)};
const THEME_KEYS=['bg','surface','surface2','ink','muted','line','prop','brand','accent','accent-soft','on-accent','pr','pr-soft','link'];
function cTheme(t){const o={};for(const k of THEME_KEYS){if(typeof t[k]!=='string'||!/^#[0-9a-fA-F]{6}$/.test(t[k]))return null;o[k]=t[k]}return o}
function makeTheme(c1,c2){
  let [h,s]=c1?rgbHsl(...hexRgb(c1)):[215,18];
  if(s<14){if(c2){const x=rgbHsl(...hexRgb(c2));if(x[1]>=14){[h,s]=x;c2=null}else{h=215;s=14}}else{h=215;s=14}}
  const t={bg:hslHex(h,Math.min(45,Math.max(18,s*.55)),7),surface:hslHex(h,Math.min(40,Math.max(16,s*.5)),12),surface2:hslHex(h,Math.min(34,Math.max(14,s*.45)),17),
    line:hslHex(h,Math.min(30,Math.max(12,s*.4)),24),prop:hslHex(h,18,38),ink:hslHex(h,30,95),muted:hslHex(h,18,70),'accent-soft':hslHex(h,Math.min(45,s*.6+10),18),'on-accent':'#FFFFFF'};
  const sa=Math.min(85,Math.max(50,s));let L=52;while(L>22&&contrast(hslHex(h,sa,L),'#FFFFFF')<4.6)L-=2;t.accent=hslHex(h,sa,L);t.brand=t.accent;
  t.link=hslHex(h,Math.min(90,Math.max(55,s)),74);
  let h2,s2;if(c2){[h2,s2]=rgbHsl(...hexRgb(c2));if(s2<20){h2=45;s2=88}}else{h2=45;s2=88}
  t.pr=hslHex(h2,Math.max(60,s2),66);t['pr-soft']=hslHex(h2,40,15);
  return t;
}
const COACH_THEME={bg:'#13110D',surface:'#1F1A12',surface2:'#2A2318',ink:'#F3EEE4',muted:'#ADA290',line:'#3A3122',prop:'#5A4C33',brand:'#8A6A2A',accent:'#E5B24E','accent-soft':'#3A2D16','on-accent':'#1A1408',pr:'#F2D08A','pr-soft':'#3A2D16',link:'#E5B24E'};
const NEUTRAL_THEME=makeTheme('#3A4552',null);
function applyTheme(){
  const root=document.documentElement,T=curT();
  const th=SP.cur==='coach'?COACH_THEME:SP.cur==='club'?((T&&T.team.theme)||NEUTRAL_THEME):null;
  THEME_KEYS.forEach(k=>root.style.removeProperty('--'+k));
  root.style.background='';
  if(th){THEME_KEYS.forEach(k=>root.style.setProperty('--'+k,th[k]));root.style.background=th.bg}
  document.body.dataset.space=SP.cur;
  const m=document.querySelector('meta[name=theme-color]');if(m)m.setAttribute('content',th?th.bg:'#120D0D');
}
/* logo du club : redimensionné sur le téléphone, couleurs détectées */
function readLogo(file){return new Promise((res,rej)=>{
  if(!file||!/^image\//.test(file.type)){rej('type');return}
  if(file.size>15e6){rej('size');return}
  const url=URL.createObjectURL(file),img=new Image();
  img.onload=()=>{try{
    const S0=192,k=Math.min(1,S0/Math.max(img.width,img.height)),w=Math.max(1,Math.round(img.width*k)),h=Math.max(1,Math.round(img.height*k));
    const cv=document.createElement('canvas');cv.width=w;cv.height=h;const g=cv.getContext('2d');g.drawImage(img,0,0,w,h);
    let data=cv.toDataURL('image/webp',.86);if(!/^data:image\/webp/.test(data)||data.length>150000)data=cv.toDataURL('image/png');
    if(data.length>150000)data=cv.toDataURL('image/jpeg',.82);
    const sm=document.createElement('canvas');sm.width=48;sm.height=48;const g2=sm.getContext('2d');g2.drawImage(img,0,0,48,48);
    const px=g2.getImageData(0,0,48,48).data;URL.revokeObjectURL(url);
    res({data,colors:logoColors(px)});
  }catch(e){URL.revokeObjectURL(url);rej('read')}};
  img.onerror=()=>{URL.revokeObjectURL(url);rej('read')};img.src=url;
})}
function logoColors(px){
  const bins=Array.from({length:24},()=>({w:0,r:0,g:0,b:0}));let gray={w:0,r:0,g:0,b:0};
  for(let i=0;i<px.length;i+=4){const a=px[i+3];if(a<200)continue;const r=px[i],g=px[i+1],b=px[i+2],[h,s,l]=rgbHsl(r,g,b);
    if(l>94||l<6)continue;
    if(s<18||l>88||l<12){gray.w++;gray.r+=r;gray.g+=g;gray.b+=b;continue}
    const B=bins[Math.floor(h/15)%24],w=s/100;B.w+=w;B.r+=r*w;B.g+=g*w;B.b+=b*w}
  const hex=B=>'#'+[B.r/B.w,B.g/B.w,B.b/B.w].map(v=>Math.round(v).toString(16).padStart(2,'0')).join('');
  const order=bins.map((B,i)=>({...B,i})).filter(B=>B.w>0).sort((a,b)=>b.w-a.w);
  if(!order.length)return gray.w?[hex(gray),null]:[null,null];
  const top=order[0];const sec=order.find(B=>Math.min(Math.abs(B.i-top.i),24-Math.abs(B.i-top.i))>=3&&B.w>=top.w*.08);
  return[hex(top),sec?hex(sec):null];
}

/* ---------- onglets et en-tête ---------- */
function setTabs(list,cur){
  const nav=$('#tabs'),inn=nav.querySelector('.in');
  if(!list){if(inn.dataset.sp){inn.innerHTML=MOI_TABS_HTML;inn.dataset.sp='';inn.style.gridTemplateColumns=''}nav.hidden=false;return}
  if(!list.length){nav.hidden=true;inn.dataset.sp='1';return}
  nav.hidden=false;inn.dataset.sp='1';inn.style.gridTemplateColumns=`repeat(${list.length},1fr)`;
  inn.innerHTML=list.map(([v,l,ic])=>`<button class="tab" data-act="sp-tab" data-v="${v}" aria-current="${v===cur?'page':'false'}">${ic}${l}</button>`).join('');
}
const teamLogo=(T,cls)=>T&&T.logo?`<span class="tlogo ${cls||''}"><img src="${T.logo}" alt=""></span>`:`<span class="tlogo ${cls||''} none" aria-hidden="true">${SPICON.shield}</span>`;
function spTop(title,sub,logo,back){
  return `<header class="top">${back?`<button class="icon-btn backb" data-act="${back}" aria-label="Retour">${ICON.back}</button>`:''}<div class="logo-row" style="min-width:0">${logo||''}<div style="min-width:0"><div class="brand sp-brand">${esc(title)}</div>${sub?`<div class="sub sp-sub">${esc(sub)}</div>`:''}</div></div>${spPill()}</header>`;
}

/* ---------- rendu des espaces (appelé par render() de app.js) ---------- */
function spRender(){
  if(SP.cur==='moi'){setTabs(null);document.body.dataset.space='moi';return false}
  const v=$('#view');document.body.classList.remove('on-pass');document.documentElement.classList.remove('on-pass');
  if(!DB){setTabs([]);v.innerHTML=`<div class="wrap">${spTop(SPACE_L[SP.cur],'')}<div class="card empty"><h3>Connexion nécessaire</h3><p>Les espaces Club et Coach demandent un compte Hevor connecté.</p><button class="btn primary" data-act="sp-go" data-v="moi">Revenir à Moi</button></div></div>`;return true}
  if(!SP.ready){setTabs([]);v.innerHTML=`<div class="wrap">${spTop(SPACE_L[SP.cur],'Chargement…')}<p class="muted">Chargement de tes équipes…</p></div>`;return true}
  const tid=curTid();
  if(tid){const T=SP.T[tid];
    if(T.me.role==='pending'){setTabs([]);v.innerHTML=viewPending(tid);return true}
    if(T.team.kind==='coach')renderCoachSpace(tid);else renderTeam(tid);
    return true}
  setTabs([]);
  const list=teamsOf(SP.cur);
  v.innerHTML=list.length?viewTeamList(SP.cur):SP.cur==='club'?viewClubEmpty():viewCoachEmpty();
  return true;
}
function viewClubEmpty(){
  return `<div class="wrap">${spTop('Club','')}
   <div class="sp-hero"><h1>Ton équipe,<br>au même endroit</h1><p class="muted">Planning, programmes du prépa, questionnaires et matchs. Séparé de ton espace perso.</p></div>
   <section><button class="sp-big" data-act="sp-create" data-k="club"><span class="sp-ic">${SPICON.shield}</span><b>Créer une équipe</b><span class="muted small">Tu es coach ou responsable : crée l'équipe, invite tout le monde, attribue les rôles.</span></button>
   ${joinCard()}</section></div>`;
}
function viewCoachEmpty(){
  return `<div class="wrap">${spTop('Coach','')}
   <div class="sp-hero"><h1>Coaching<br>en direct</h1><p class="muted">Envoie des programmes à tes clients et suis leurs séances, ou rejoins ton coach. Séparé de ton espace perso.</p></div>
   <section><button class="sp-big" data-act="sp-create" data-k="coach"><span class="sp-ic">${SPICON.team}</span><b>Je suis coach</b><span class="muted small">Crée ton espace coaching et invite tes clients avec un lien.</span></button>
   ${joinCard('Tu as un coach ? Colle le lien ou le code qu\'il t\'a envoyé')}</section></div>`;
}
function joinCard(lbl){return `<div class="sp-big as-div"><span class="sp-ic">${SPICON.link}</span><b>Rejoindre ${SP.cur==='coach'?'mon coach':'une équipe'}</b>
   <label for="sp-code" class="muted small">${esc(lbl||'Colle le lien ou le code reçu de ton coach')}</label>
   <div class="sp-join"><input id="sp-code" placeholder="Ex. K7M4QX2P" autocomplete="off" autocapitalize="characters" enterkeyhint="go"><button class="btn primary" data-act="sp-join-code">Rejoindre</button></div>
   <span class="small muted">Tu peux aussi scanner le QR code de ton coach avec l'appareil photo du téléphone.</span></div>`}
function viewTeamList(kind){
  const list=teamsOf(kind);let h=`<div class="wrap">${spTop(kind==='club'?'Mes équipes':'Coaching','')}`;
  if(kind==='club'){
    const groups=new Map();list.forEach(t=>{const T=SP.T[t].team,k=norm(T.club||T.name);if(!groups.has(k))groups.set(k,[]);groups.get(k).push(t)});
    for(const ts of groups.values()){const T0=SP.T[ts[0]].team,th=T0.theme||NEUTRAL_THEME;
      h+=`<section class="sp-club" style="--cb:${th.bg};--cs:${th.surface};--cl:${th.line};--ci:${th.ink};--cm:${th.muted};--ca:${th.link}"><div class="sp-club-h">${teamLogo(T0)}<div><b>${esc(T0.club||T0.name)}</b><small>${ts.length} équipe${ts.length>1?'s':''}</small></div></div>
       ${ts.map(t=>{const T=SP.T[t];return `<button class="sp-team" data-act="sp-open" data-id="${t}"><span class="m"><b>${esc(T.team.name)}</b><small>${esc(T.team.sport||'')}</small></span><span class="rpill r-${T.me.role}">${ROLE_L[T.me.role]}</span></button>`}).join('')}</section>`}
  }else{
    h+=`<div class="list">${list.map(t=>{const T=SP.T[t];return `<button class="sp-team coach" data-act="sp-open" data-id="${t}"><span class="m"><b>${esc(T.me.role==='coach'?T.team.name:'Mon coach · '+(T.team.ownerName||T.team.name))}</b><small>${T.me.role==='coach'?'Mes clients':esc(T.team.name)}</small></span><span class="rpill r-${T.me.role}">${ROLE_L[T.me.role]}</span></button>`}).join('')}</div>`;
  }
  h+=`<section><div class="sp-2"><button class="btn ghost" data-act="sp-create" data-k="${kind}">${kind==='club'?'Créer une équipe':'Créer mon coaching'}</button><button class="btn ghost" data-act="sp-join-sheet">Rejoindre</button></div></section></div>`;
  return h;
}
function viewPending(tid){
  const T=SP.T[tid];
  return `<div class="wrap">${spTop(T.team.name,T.team.club||'',teamLogo(T.team),teamsOf(SP.cur).length>1?'sp-list':'')}
   <div class="sp-wait"><div class="sp-wait-ic">${SPICON.clock}</div><h1>Demande envoyée</h1>
   <p>Tu as rejoint <b>${esc(T.team.name)}</b>${T.team.kind==='club'&&T.team.club?` du club ${esc(T.team.club)}`:''}. ${T.team.kind==='coach'?'Ton coach':'Un coach'} doit maintenant valider ton rôle.</p>
   <div class="card sp-steps"><div class="ok">${ICON.check}<span>Lien d'invitation valide</span></div><div class="cur"><i></i><span>Rôle en attente${T.team.kind==='club'?' : joueur, coach ou spectateur':''}</span></div><div class="todo"><i></i><span>Accès ${T.team.kind==='club'?"à l'équipe":'à ton coaching'}</span></div></div>
   <p class="small muted">Cet écran se met à jour tout seul dès que c'est validé. En attendant, tu ne vois aucune donnée ${T.team.kind==='club'?"de l'équipe":''}.</p>
   <button class="btn ghost block" data-act="sp-go" data-v="moi">Aller dans mon espace Moi</button><button class="linkbtn danger-link" data-act="sp-cancel-join" data-id="${tid}">Annuler ma demande</button></div></div>`;
}

/* ---------- créer une équipe ---------- */
let CT=null;
function openCreate(kind){
  closeModal();CT={kind,logo:'',colors:[null,null],theme:null};
  const nm=SP.doc.name||'';
  const clubs=[...new Set(teamsOf('club').map(t=>SP.T[t].team.club).filter(Boolean))];
  const h=kind==='club'?`
   <div class="field"><label for="ct-club">Club</label><input id="ct-club" list="ct-clubs" placeholder="Ex. Volley Club de ta ville" autocomplete="off" maxlength="80"><datalist id="ct-clubs">${clubs.map(c=>`<option value="${esc(c)}">`).join('')}</datalist></div>
   <div class="field"><span class="flabel">Logo du club</span><div class="ct-logo"><span id="ct-logo-prev">${teamLogo(null,'lg')}</span><div class="m"><b id="ct-logo-name">Aucun logo</b><small class="muted">Les couleurs de l'espace seront prises dans le logo.</small><div class="sw" id="ct-sw"></div></div><label class="btn ghost" for="ct-file">Importer</label><input type="file" id="ct-file" accept="image/png,image/jpeg,image/webp" hidden></div></div>
   <div class="sp-2"><div class="field"><label for="ct-name">Nom de l'équipe</label><input id="ct-name" placeholder="Ex. Seniors M" maxlength="60" autocomplete="off"></div>
   <div class="field"><label for="ct-sport">Sport</label><select id="ct-sport">${SPORTS.map(s=>`<option>${s}</option>`).join('')}</select></div></div>
   <div class="field"><label for="ct-me">Ton prénom (visible par l'équipe)</label><input id="ct-me" value="${esc(nm)}" maxlength="40" autocomplete="given-name"></div>
   <div class="field"><span class="flabel">Aperçu de l'espace</span><div id="ct-prev"></div></div>
   <p class="small muted" style="margin:0">Tu en deviens le propriétaire. Tu pourras transmettre ce rôle à un autre coach.</p>`:`
   <div class="field"><label for="ct-me">Ton prénom (visible par tes clients)</label><input id="ct-me" value="${esc(nm)}" maxlength="40" autocomplete="given-name"></div>
   <div class="field"><label for="ct-name">Nom de ton coaching</label><input id="ct-name" placeholder="Ex. Coaching de ${esc(nm||'Nico')}" maxlength="60" autocomplete="off"></div>
   <p class="small muted" style="margin:0">Tes clients rejoignent avec un lien. Tu valides chaque demande, puis tu leur envoies leurs programmes.</p>`;
  openSheet('sp-create',sheetHead(kind==='club'?'Créer une équipe':'Créer mon coaching','sp-create-close')+`<div class="sheet-b"><div class="wrap sp-col">${h}</div></div>
   <div class="sheet-f"><div class="in"><button class="btn primary" data-act="sp-create-save">${kind==='club'?"Créer l'équipe":'Créer mon espace coaching'}</button></div></div>`);
  if(kind==='club'){$('#ct-file').addEventListener('change',onLogoFile);ctPreview()}
}
async function onLogoFile(e){const f=e.target.files[0];e.target.value='';if(!f)return;
  try{const r=await readLogo(f);CT.logo=r.data;CT.colors=r.colors;$('#ct-logo-prev').innerHTML=`<span class="tlogo lg"><img src="${r.data}" alt=""></span>`;$('#ct-logo-name').textContent=f.name.slice(0,40);
    $('#ct-sw').innerHTML=r.colors.filter(Boolean).map(c=>`<i style="background:${c}"></i>`).join('');ctPreview()}
  catch(x){toast(x==='size'?'Image trop lourde.':"Cette image n'a pas pu être lue. Essaie un PNG ou un JPEG.")}}
function ctPreview(){const el=$('#ct-prev');if(!el)return;const th=makeTheme(CT.colors[0],CT.colors[1]);CT.theme=th;const nm=$('#ct-name')?.value||'Seniors M',club=$('#ct-club')?.value||'Ton club';
  el.innerHTML=`<div class="ct-prev" style="background:${th.bg};border-color:${th.line};color:${th.ink}"><div class="r">${CT.logo?`<span class="tlogo"><img src="${CT.logo}" alt=""></span>`:`<span class="tlogo none" style="color:${th.muted}">${SPICON.shield}</span>`}<div><b>${esc(nm)}</b><small style="color:${th.muted}">${esc(club)}</small></div></div>
   <div class="r2"><span style="background:${th.accent};color:${th['on-accent']}">Bouton</span><span style="background:${th.surface};color:${th.pr}">Record</span></div></div>`}
function genCode(){const A='ABCDEFGHJKLMNPQRSTUVWXYZ23456789',b=new Uint8Array(8);crypto.getRandomValues(b);return[...b].map(x=>A[x%A.length]).join('')}
async function createSave(btn){
  const kind=CT.kind,me=($('#ct-me').value||'').trim().slice(0,40);
  let name=($('#ct-name').value||'').trim().slice(0,60);const club=kind==='club'?($('#ct-club').value||'').trim().slice(0,80):'';
  if(kind==='club'&&!club){$('#ct-club').focus();toast('Indique le nom du club');return}
  if(!me){$('#ct-me').focus();toast('Indique ton prénom');return}
  if(!name){if(kind==='club'){$('#ct-name').focus();toast("Donne un nom à l'équipe");return}name='Coaching de '+me}
  if(navigator.onLine===false){toast('Il faut du réseau pour créer une équipe.');return}
  btn.disabled=true;
  const tid=gid(),code=genCode(),now=Date.now();
  const team={kind,name,club,owner:UID,ownerName:me,code,at:now};
  if(kind==='club'){team.sport=$('#ct-sport').value;if(CT.logo)team.logo=CT.logo;team.theme=CT.theme||makeTheme(CT.colors[0],CT.colors[1])}
  try{const b=DB.batch();b.set(teamRef(tid),team);b.set(memRef(tid,UID),{uid:UID,name:me,role:'coach',at:now});b.set(inviteRef(code),{tid,name,club,kind,at:now});await b.commit();
    SP.doc.teams.push(tid);SP.doc.name=me;await spSaveDoc();SP.T[tid]={team:cTeam(tid,team),me:cMember({uid:UID,name:me,role:'coach',at:now})};
    closeSheet('sp-create');CT=null;SP.tab[tid]='members';setSpace(kind,tid);toast(kind==='club'?'Équipe créée. Invite tes joueurs avec le lien.':'Espace coaching créé. Invite tes clients avec le lien.')}
  catch(e){btn.disabled=false;toast(e&&e.code==='permission-denied'?"Création refusée par le serveur. Les règles de sécurité Firebase doivent être mises à jour.":"La création a échoué. Vérifie ta connexion et réessaie.")}
}

/* ---------- rejoindre ---------- */
function parseCode(v){v=String(v||'').trim();const m=v.match(/[?&]join=([A-Za-z0-9]{6,12})/);if(m)v=m[1];v=v.replace(/[\s-]/g,'').toUpperCase();return/^[A-Z0-9]{6,12}$/.test(v)?v:null}
function pendingJoin(){let c=null;try{c=sessionStorage.getItem('hevor.join');sessionStorage.removeItem('hevor.join')}catch(e){}return parseCode(c)}
(function grabJoin(){try{const u=new URL(location.href),c=u.searchParams.get('join');if(c){sessionStorage.setItem('hevor.join',c);u.searchParams.delete('join');history.replaceState(history.state,'',u.pathname+(u.search||'')+u.hash)}}catch(e){}})();
function openJoinSheet(){closeModal();openSheet('sp-joinc',sheetHead('Rejoindre','sp-joinc-close')+`<div class="sheet-b"><div class="wrap sp-col">${joinCard()}</div></div>`)}
async function openJoin(code){
  if(!DB){toast('Connecte-toi pour rejoindre une équipe.');return}
  let inv;try{const d=await inviteRef(code).get();if(!d.exists){toast("Ce lien d'invitation n'est plus valable. Demande-en un nouveau à ton coach.");return}inv=d.data()}catch(e){toast("Impossible de vérifier l'invitation. Vérifie ta connexion.");return}
  const tid=okId(inv.tid)?inv.tid:null;if(!tid)return;
  if(SP.doc.teams.includes(tid)&&SP.T[tid]){setSpace(SP.T[tid].team.kind,tid);toast('Tu fais déjà partie de cette équipe');return}
  const kind=inv.kind==='coach'?'coach':'club';
  closeSheet('sp-joinc');
  openSheet('sp-join',sheetHead(kind==='club'?'Rejoindre une équipe':'Rejoindre mon coach','sp-join-close')+`<div class="sheet-b"><div class="wrap sp-col">
   <div class="card sp-inv"><span class="sp-ic">${kind==='club'?SPICON.shield:SPICON.team}</span><div><b>${esc(cStr(inv.name,60))}</b><small class="muted">${esc(kind==='club'?cStr(inv.club,80):'Espace coaching')}</small></div></div>
   <div class="field"><label for="jn-me">Ton prénom (visible par ${kind==='club'?"l'équipe":'ton coach'})</label><input id="jn-me" value="${esc(SP.doc.name||'')}" maxlength="40" autocomplete="given-name"></div>
   ${kind==='club'?`<div class="field"><label for="jn-poste">Poste (facultatif)</label><input id="jn-poste" placeholder="Ex. Passeur, ailier, gardien…" maxlength="40" autocomplete="off"></div>`:`<div class="field"><label for="jn-poste">Ton objectif (facultatif)</label><input id="jn-poste" placeholder="Ex. Prise de masse, reprise…" maxlength="40" autocomplete="off"></div>`}
   <p class="small muted" style="margin:0">Tu arriveras en attente : ${kind==='club'?'un coach':'ton coach'} choisit ensuite ton rôle. Ton espace « Moi » reste privé.</p></div></div>
   <div class="sheet-f"><div class="in"><button class="btn primary" data-act="sp-join-go" data-id="${tid}" data-code="${code}" data-k="${kind}">Rejoindre</button></div></div>`);
}
async function joinGo(d,btn){
  const tid=d.id,code=d.code,kind=d.k,me=($('#jn-me').value||'').trim().slice(0,40),poste=($('#jn-poste').value||'').trim().slice(0,40);
  if(!me){$('#jn-me').focus();toast('Indique ton prénom');return}
  btn.disabled=true;
  try{const ex=await memRef(tid,UID).get();
    if(!ex.exists){const m={uid:UID,name:me,role:'pending',code,at:Date.now()};if(poste)m.poste=poste;await memRef(tid,UID).set(m)}
    if(!SP.doc.teams.includes(tid))SP.doc.teams.push(tid);SP.doc.name=me;await spSaveDoc();
    const r=await loadTeamHead(tid);if(r!=='ok')throw 0;
    closeSheet('sp-join');setSpace(kind,tid);watchPending()}
  catch(e){btn.disabled=false;toast(e&&e.code==='permission-denied'?"Ce lien d'invitation n'est plus valable.":'Impossible de rejoindre pour le moment. Réessaie.')}
}
async function cancelJoin(tid){
  try{await memRef(tid,UID).delete()}catch(e){}
  try{SP.unsub[tid]&&SP.unsub[tid]()}catch(e){}delete SP.unsub[tid];
  SP.doc.teams=SP.doc.teams.filter(t=>t!==tid);delete SP.T[tid];delete SP.D[tid];await spSaveDoc();render();toast('Demande annulée');
}

/* ---------- QR code et lien d'invitation ---------- */
const joinUrl=code=>location.origin+location.pathname.replace(/index\.html$/,'')+'?join='+code;
async function qrSVG(text){
  if(!window.qrcode){try{await loadScript('vendor/qrcode.js')}catch(e){return''}}
  try{const qr=qrcode(0,'M');qr.addData(text);qr.make();const n=qr.getModuleCount(),m=3;let d='';
    for(let r=0;r<n;r++)for(let c=0;c<n;c++)if(qr.isDark(r,c))d+=`M${c+m} ${r+m}h1v1h-1z`;
    return `<svg viewBox="0 0 ${n+2*m} ${n+2*m}" role="img" aria-label="QR code d'invitation" shape-rendering="crispEdges"><rect width="${n+2*m}" height="${n+2*m}" fill="#FFFFFF"/><path d="${d}" fill="#000000"/></svg>`}catch(e){return''}
}
function inviteCard(tid){
  const T=SP.T[tid].team,url=joinUrl(T.code);
  setTimeout(async()=>{const el=document.getElementById('qr-'+tid);if(el&&!el.dataset.on){el.dataset.on='1';el.innerHTML=await qrSVG(url)}},0);
  return `<section class="card sp-invite"><div class="h2">Inviter ${T.kind==='club'?"dans l'équipe":'des clients'}</div>
   <p class="small muted" style="margin:0">Envoie ce lien à tes ${T.kind==='club'?'joueurs, aux autres coachs et au staff':'clients'}. Rien à télécharger sur un store.</p>
   <div class="qr" id="qr-${tid}"></div>
   <div class="sp-link"><span class="num">${esc(url.replace(/^https?:\/\//,''))}</span><button class="btn primary" data-act="sp-copy" data-u="${esc(url)}">Copier</button></div>
   <div class="sp-2"><button class="btn ghost" data-act="sp-share" data-u="${esc(url)}" data-n="${esc(T.name)}">Partager</button>${isTeamOwner(tid)?`<button class="btn ghost" data-act="sp-newcode" data-id="${tid}">Nouveau lien</button>`:'<span></span>'}</div>
   <p class="small muted sp-note">${SPICON.clock}Ceux qui rejoignent arrivent en attente : ils ne voient rien tant que ${isTeamOwner(tid)?'tu ne leur as pas':"le propriétaire ne leur a pas"} donné un rôle.</p></section>`;
}
async function copyText(t){try{await navigator.clipboard.writeText(t);toast('Lien copié')}catch(e){toast('Copie impossible : sélectionne le lien à la main.')}}
async function newCode(tid){
  const T=SP.T[tid].team,code=genCode();
  try{const b=DB.batch();b.update(teamRef(tid),{code});b.set(inviteRef(code),{tid,name:T.name,club:T.club,kind:T.kind,at:Date.now()});if(T.code)b.delete(inviteRef(T.code));await b.commit();T.code=code;render();toast("Nouveau lien créé. L'ancien ne fonctionne plus.")}
  catch(e){toast('Impossible de changer le lien pour le moment.')}
}

/* ---------- membres et rôles ---------- */
const SPM={pick:{},open:null};
const rolesFor=T=>T.kind==='club'?['player','coach','spectator']:['client','coach'];
function membersSection(tid){
  const T=SP.T[tid],D=SP.D[tid]||{},ms=(D.members||[]),own=isTeamOwner(tid);
  const pend=ms.filter(m=>m.role==='pending'),act=ms.filter(m=>m.role!=='pending');
  let h=inviteCard(tid);
  if(pend.length){h+=`<section><div class="h2" style="color:var(--pr)">En attente · ${pend.length}<span class="small">${own?'Choisis un rôle puis valide':'Le propriétaire valide les rôles'}</span></div><div class="list">`;
    for(const m of pend){const cur=SPM.pick[m.uid]||(T.team.kind==='club'?'player':'client');
      h+=`<div class="card sp-pend"><div class="r"><div class="m"><b>${esc(m.name)}</b><small class="muted">${m.poste?esc(m.poste)+' · ':''}a rejoint ${ago(m.at)}</small></div>${own?`<button class="icon-btn" data-act="sp-refuse" data-id="${tid}" data-u="${esc(m.uid)}" aria-label="Refuser ${esc(m.name)}">${ICON.close}</button>`:''}</div>
       ${own?`<div class="sp-roles">${rolesFor(T.team).map(r=>`<button data-act="sp-pick" data-u="${esc(m.uid)}" data-r="${r}" aria-pressed="${cur===r}">${ROLE_L[r]}</button>`).join('')}<button class="btn primary" data-act="sp-accept" data-id="${tid}" data-u="${esc(m.uid)}">Valider</button></div>`:''}</div>`}
    h+=`</div></section>`}
  const groups=T.team.kind==='club'?[['coach','Coachs'],['player','Joueurs'],['spectator','Spectateurs']]:[['coach','Coachs'],['client','Clients']];
  h+=`<section><div class="h2">${T.team.kind==='club'?'Équipe':'Membres'} · ${act.length}</div>`;
  for(const [r,l] of groups){const g=act.filter(m=>m.role===r);if(!g.length)continue;
    h+=`<div class="small muted sp-gl">${l}</div><div class="list">${g.map(m=>`<button class="row sp-mem" ${own&&m.uid!==UID?`data-act="sp-mem" data-id="${tid}" data-u="${esc(m.uid)}"`:'disabled'}><div class="m"><div>${esc(m.name)}${m.uid===UID?' <span class="muted small">(toi)</span>':''}</div><small>${esc(m.poste||'')}</small></div>${T.team.owner===m.uid?`<span class="rpill r-owner">${SPICON.crown}Propriétaire</span>`:`<span class="rpill r-${m.role}">${ROLE_L[m.role]}</span>`}</button>`).join('')}</div>`}
  h+=`</section>`+teamSettings(tid);
  return h;
}
function teamSettings(tid){
  const T=SP.T[tid],own=isTeamOwner(tid);
  return `<section class="card"><div class="h2">${T.team.kind==='club'?"Réglages de l'équipe":'Réglages'}</div><div class="legal-list">
   <button class="row" data-act="sp-me-edit" data-id="${tid}"><div class="m"><div>Mon profil ${T.team.kind==='club'?"d'équipe":''}</div><small>${esc(T.me.name)}${T.me.poste?' · '+esc(T.me.poste):''}</small></div>${ICON.chev}</button>
   ${own&&T.team.kind==='club'?`<button class="row" data-act="sp-team-edit" data-id="${tid}"><div class="m"><div>Modifier l'équipe</div><small>Nom, club, logo et couleurs</small></div>${ICON.chev}</button>`:''}
   ${own?`<button class="row" data-act="sp-transfer" data-id="${tid}"><div class="m"><div>Transférer la propriété</div><small>À un autre coach ${T.team.kind==='club'?"de l'équipe":''}</small></div>${ICON.chev}</button>`:''}
   ${T.team.kind==='club'&&T.me.role==='player'?`<button class="row" data-act="sp-health" data-id="${tid}"><div class="m"><div>Mes réponses aux questionnaires</div><small>${T.me.health?'Consentement donné · tu peux le retirer':'Aucun consentement donné'}</small></div>${ICON.chev}</button>`:''}
   </div>${own?`<button class="linkbtn danger-link" data-act="sp-del-team" data-id="${tid}">Supprimer ${T.team.kind==='club'?"l'équipe":"l'espace coaching"}</button>`:`<button class="linkbtn danger-link" data-act="sp-leave" data-id="${tid}">Quitter ${T.team.kind==='club'?"l'équipe":'ce coaching'}</button>`}</section>`;
}
async function acceptMember(tid,uid){
  const T=SP.T[tid],role=SPM.pick[uid]||(T.team.kind==='club'?'player':'client');
  try{await memRef(tid,uid).update({role});const m=(SP.D[tid].members||[]).find(x=>x.uid===uid);if(m)m.role=role;delete SPM.pick[uid];render();toast(`${m?m.name:'Membre'} ajouté comme ${ROLE_L[role].toLowerCase()}`)}
  catch(e){toast('Validation impossible pour le moment.')}
}
async function removeMember(tid,uid,msg){
  try{await memRef(tid,uid).delete();SP.D[tid].members=(SP.D[tid].members||[]).filter(m=>m.uid!==uid);closeSheet('sp-mem');render();toast(msg||'Membre retiré')}catch(e){toast('Action impossible pour le moment.')}
}
function openMember(tid,uid){
  const T=SP.T[tid],m=(SP.D[tid]?.members||[]).find(x=>x.uid===uid);if(!m)return;SPM.open={tid,uid,role:m.role,confirm:false};renderMember()}
function renderMember(){
  const {tid,uid}=SPM.open,T=SP.T[tid],m=(SP.D[tid]?.members||[]).find(x=>x.uid===uid);if(!m){closeSheet('sp-mem');return}
  openSheet('sp-mem',sheetHead(m.name,'sp-mem-close')+`<div class="sheet-b"><div class="wrap sp-col">
   <div class="field"><span class="flabel">Rôle</span><div class="seg" style="grid-template-columns:repeat(${rolesFor(T.team).length},1fr)">${rolesFor(T.team).map(r=>`<button data-act="sp-mrole" data-r="${r}" aria-pressed="${SPM.open.role===r}">${ROLE_L[r]}</button>`).join('')}</div></div>
   <p class="small muted" style="margin:0">${SPM.open.role==='spectator'?"Un spectateur voit seulement la liste de l'équipe et le planning. Aucune donnée de forme ni de santé.":SPM.open.role==='coach'?"Un coach voit l'effectif, les questionnaires, les ressentis et gère le planning et les programmes.":SPM.open.role==='client'?'Un client reçoit tes programmes et te partage ses séances et ressentis.':'Un joueur voit son planning, ses programmes et remplit ses questionnaires.'}</p>
   <div class="field"><label for="mm-poste">${T.team.kind==='club'?'Poste':'Objectif'}</label><input id="mm-poste" value="${esc(m.poste)}" maxlength="40" autocomplete="off"></div>
   ${m.role==='coach'?`<button class="btn ghost" data-act="sp-make-owner" data-id="${tid}" data-u="${esc(uid)}">${SPICON.crown} Nommer propriétaire</button>`:''}
   ${SPM.open.confirm?`<div class="confirm"><p>Retirer ${esc(m.name)} ${T.team.kind==='club'?"de l'équipe":'de ton coaching'} ? Il n'aura plus accès à rien.</p><div class="r"><button class="btn ghost" data-act="sp-mrm-no">Annuler</button><button class="btn danger" data-act="sp-mrm-yes">Retirer</button></div></div>`:`<button class="btn danger" data-act="sp-mrm">Retirer ${T.team.kind==='club'?"de l'équipe":'du coaching'}</button>`}</div></div>
   <div class="sheet-f"><div class="in"><button class="btn primary" data-act="sp-msave">Enregistrer</button></div></div>`);
}
async function saveMember(){
  const {tid,uid,role}=SPM.open,m=(SP.D[tid]?.members||[]).find(x=>x.uid===uid),poste=($('#mm-poste').value||'').trim().slice(0,40);
  try{await memRef(tid,uid).update({role,poste});if(m){m.role=role;m.poste=poste}closeSheet('sp-mem');SPM.open=null;render();toast('Enregistré')}catch(e){toast('Enregistrement impossible.')}
}
async function makeOwner(tid,uid){
  const m=(SP.D[tid]?.members||[]).find(x=>x.uid===uid);if(!m||m.role!=='coach')return;
  modal(`<h3>Nommer ${esc(m.name)} propriétaire ?</h3><p class="muted" style="margin:0">Il gérera les rôles et ${SP.T[tid].team.kind==='club'?"l'équipe":'le coaching'}. Tu resteras coach.</p><div class="acts"><button class="btn primary" data-act="sp-owner-yes" data-id="${tid}" data-u="${esc(uid)}">Confirmer</button><button class="btn ghost" data-act="modal-close">Annuler</button></div>`);
}
async function ownerYes(tid,uid){
  const m=(SP.D[tid]?.members||[]).find(x=>x.uid===uid);closeModal();
  try{await teamRef(tid).update({owner:uid,ownerName:m.name});SP.T[tid].team.owner=uid;SP.T[tid].team.ownerName=m.name;closeSheet('sp-mem');closeSheet('sp-transfer');render();toast(`${m.name} est maintenant propriétaire`)}catch(e){toast('Transfert impossible pour le moment.')}
}
function openTransfer(tid){
  const coaches=(SP.D[tid]?.members||[]).filter(m=>m.role==='coach'&&m.uid!==UID);
  openSheet('sp-transfer',sheetHead('Transférer la propriété','sp-transfer-close')+`<div class="sheet-b"><div class="wrap sp-col">
   <p class="muted" style="margin:0">Le propriétaire gère les rôles, les invitations et ${SP.T[tid].team.kind==='club'?"l'équipe":'le coaching'}. Il doit être coach.</p>
   ${coaches.length?`<div class="list">${coaches.map(m=>`<button class="row" data-act="sp-make-owner" data-id="${tid}" data-u="${esc(m.uid)}"><div class="m"><div>${esc(m.name)}</div><small>${esc(m.poste||'Coach')}</small></div>${ICON.chev}</button>`).join('')}</div>`:`<div class="card"><p style="margin:0">Aucun autre coach pour l'instant. Donne d'abord le rôle de coach à quelqu'un dans la liste des membres.</p></div>`}</div></div>`);
}
function openMeEdit(tid){
  const T=SP.T[tid];
  openSheet('sp-meed',sheetHead('Mon profil','sp-meed-close')+`<div class="sheet-b"><div class="wrap sp-col">
   <div class="field"><label for="me-name">Prénom</label><input id="me-name" value="${esc(T.me.name)}" maxlength="40"></div>
   <div class="field"><label for="me-poste">${T.team.kind==='club'?'Poste':'Objectif'}</label><input id="me-poste" value="${esc(T.me.poste)}" maxlength="40"></div></div></div>
   <div class="sheet-f"><div class="in"><button class="btn primary" data-act="sp-me-save" data-id="${tid}">Enregistrer</button></div></div>`);
}
async function meSave(tid){
  const T=SP.T[tid],name=($('#me-name').value||'').trim().slice(0,40),poste=($('#me-poste').value||'').trim().slice(0,40);
  if(!name){toast('Indique ton prénom');return}
  try{await memRef(tid,UID).update({name,poste});T.me.name=name;T.me.poste=poste;const m=(SP.D[tid]?.members||[]).find(x=>x.uid===UID);if(m){m.name=name;m.poste=poste}
    if(T.team.owner===UID&&T.team.ownerName!==name){try{await teamRef(tid).update({ownerName:name});T.team.ownerName=name}catch(e){}}
    closeSheet('sp-meed');render();toast('Profil enregistré')}catch(e){toast('Enregistrement impossible.')}
}
let TE=null;
function openTeamEdit(tid){
  const T=SP.T[tid].team;TE={tid,logo:T.logo,theme:T.theme,colors:[null,null]};
  openSheet('sp-ted',sheetHead("Modifier l'équipe",'sp-ted-close')+`<div class="sheet-b"><div class="wrap sp-col">
   <div class="field"><label for="te-club">Club</label><input id="te-club" value="${esc(T.club)}" maxlength="80"></div>
   <div class="field"><label for="te-name">Nom de l'équipe</label><input id="te-name" value="${esc(T.name)}" maxlength="60"></div>
   <div class="field"><label for="te-sport">Sport</label><select id="te-sport">${SPORTS.map(s=>`<option ${s===T.sport?'selected':''}>${s}</option>`).join('')}</select></div>
   <div class="field"><span class="flabel">Logo</span><div class="ct-logo"><span id="te-prev">${teamLogo(T,'lg')}</span><div class="m"><b>Logo du club</b><small class="muted">Changer le logo met à jour les couleurs de l'espace.</small></div><label class="btn ghost" for="te-file">Changer</label><input type="file" id="te-file" accept="image/png,image/jpeg,image/webp" hidden></div></div></div></div>
   <div class="sheet-f"><div class="in"><button class="btn primary" data-act="sp-team-save">Enregistrer</button></div></div>`);
  $('#te-file').addEventListener('change',async e=>{const f=e.target.files[0];e.target.value='';if(!f)return;try{const r=await readLogo(f);TE.logo=r.data;TE.theme=makeTheme(r.colors[0],r.colors[1]);$('#te-prev').innerHTML=`<span class="tlogo lg"><img src="${r.data}" alt=""></span>`}catch(x){toast("Cette image n'a pas pu être lue.")}});
}
async function teamSave(){
  const T=SP.T[TE.tid].team,club=($('#te-club').value||'').trim().slice(0,80),name=($('#te-name').value||'').trim().slice(0,60),sport=$('#te-sport').value;
  if(!club||!name){toast('Le club et le nom sont obligatoires');return}
  const up={club,name,sport};if(TE.logo&&TE.logo!==T.logo){up.logo=TE.logo;up.theme=TE.theme}
  try{const b=DB.batch();b.update(teamRef(TE.tid),up);if(T.code)b.set(inviteRef(T.code),{tid:TE.tid,name,club,kind:T.kind,at:Date.now()});await b.commit();
    Object.assign(T,{club,name,sport},up.logo?{logo:up.logo,theme:cTheme(up.theme)}:{});closeSheet('sp-ted');TE=null;applyTheme();render();toast('Équipe mise à jour')}
  catch(e){toast('Enregistrement impossible.')}
}
async function delDocs(qry){const s=await qry.get();for(let i=0;i<s.docs.length;i+=400){const b=DB.batch();s.docs.slice(i,i+400).forEach(d=>b.delete(d.ref));await b.commit()}}
async function deleteTeam(tid){
  const T=SP.T[tid].team;
  for(const c of ['events','programs','wellness','logs'])await delDocs(subCol(tid,c));
  const ms=await subCol(tid,'members').get();for(const d of ms.docs)if(d.id!==UID)await d.ref.delete();
  if(T.code){try{await inviteRef(T.code).delete()}catch(e){}}
  await teamRef(tid).delete();await memRef(tid,UID).delete();
}
async function leaveTeam(tid){
  for(const c of ['wellness','logs'])await delDocs(subCol(tid,c).where('uid','==',UID));
  await memRef(tid,UID).delete();
}
function askDelTeam(tid){const T=SP.T[tid].team;
  modal(`<h3>Supprimer ${esc(T.name)} ?</h3><p class="muted" style="margin:0">Le planning, les programmes, les questionnaires et les ressentis seront effacés. Tous les membres perdront l'accès. C'est définitif.</p><div class="acts"><button class="btn danger" data-act="sp-del-yes" data-id="${tid}">Supprimer définitivement</button><button class="btn ghost" data-act="modal-close">Annuler</button></div>`)}
function askLeave(tid){const T=SP.T[tid].team;
  modal(`<h3>Quitter ${esc(T.name)} ?</h3><p class="muted" style="margin:0">Tes réponses aux questionnaires et tes ressentis dans ${T.kind==='club'?'cette équipe':'ce coaching'} seront effacés. Ton espace « Moi » ne change pas.</p><div class="acts"><button class="btn danger" data-act="sp-leave-yes" data-id="${tid}">Quitter</button><button class="btn ghost" data-act="modal-close">Annuler</button></div>`)}
async function afterGone(tid,msg){const kind=SP.T[tid]?.team?.kind||SP.cur;SP.doc.teams=SP.doc.teams.filter(t=>t!==tid);delete SP.T[tid];delete SP.D[tid];if(SP.open[kind]===tid)SP.open[kind]=null;if(SP.doc.home.endsWith(':'+tid))SP.doc.home='auto';await spSaveDoc();closeModal();document.querySelectorAll('.sheet').forEach(e=>e.remove());applyTheme();render();toast(msg)}
/* suppression du compte : on quitte ou supprime chaque équipe d'abord */
async function spacesWipe(){
  if(!DB)return;
  await Promise.all(SP.doc.teams.map(loadTeamHead));
  for(const tid of SP.doc.teams.slice()){const T=SP.T[tid];if(!T)continue;
    if(T.team.owner===UID){const ms=await subCol(tid,'members').get();if(ms.docs.some(d=>d.id!==UID))throw{spMsg:`Tu es propriétaire de « ${T.team.name} ». Transfère d'abord la propriété à un autre coach, ou supprime l'équipe.`};await deleteTeam(tid)}
    else await leaveTeam(tid)}
  try{await spRef().delete()}catch(e){}
  spacesReset();
}

/* ---------- actions ---------- */
Object.assign(ACT,{
  'sp-sheet':()=>openSpaces(),
  'sp-go':d=>setSpace(d.v),
  'sp-home':()=>openHomePick(),'sp-home-close':()=>closeSheet('sp-home'),
  'sp-account':()=>{setSpace('moi');VIEW='more';render()},
  'sp-tab':d=>{const tid=curTid();if(!tid)return;SP.tab[tid]=d.v;spSaveLocal();render();window.scrollTo(0,0)},
  'sp-open':d=>{SP.open[SP.cur]=d.id;spSaveLocal();applyTheme();render();window.scrollTo(0,0)},
  'sp-list':()=>{SP.open[SP.cur]=null;spSaveLocal();applyTheme();render();window.scrollTo(0,0)},
  'sp-create':d=>openCreate(d.k),'sp-create-close':()=>{closeSheet('sp-create');CT=null},'sp-create-save':(d,b)=>createSave(b),
  'sp-join-code':()=>{const c=parseCode($('#sp-code')?.value);if(!c){$('#sp-code')?.focus();toast('Code ou lien invalide');return}openJoin(c)},
  'sp-join-sheet':()=>openJoinSheet(),'sp-joinc-close':()=>closeSheet('sp-joinc'),
  'sp-join-close':()=>closeSheet('sp-join'),'sp-join-go':(d,b)=>joinGo(d,b),
  'sp-cancel-join':d=>cancelJoin(d.id),
  'sp-copy':d=>copyText(d.u),
  'sp-share':async d=>{if(navigator.share){try{await navigator.share({title:'Hevor · '+d.n,text:`Rejoins ${d.n} sur Hevor :`,url:d.u})}catch(e){}}else copyText(d.u)},
  'sp-newcode':d=>newCode(d.id),
  'sp-pick':d=>{SPM.pick[d.u]=d.r;render()},
  'sp-accept':d=>acceptMember(d.id,d.u),
  'sp-refuse':d=>removeMember(d.id,d.u,'Demande refusée'),
  'sp-mem':d=>openMember(d.id,d.u),'sp-mem-close':()=>{closeSheet('sp-mem');SPM.open=null},
  'sp-mrole':d=>{SPM.open.role=d.r;const p=$('#mm-poste')?.value;renderMember();if(p!=null)$('#mm-poste').value=p},
  'sp-msave':()=>saveMember(),
  'sp-mrm':()=>{SPM.open.confirm=true;renderMember()},'sp-mrm-no':()=>{SPM.open.confirm=false;renderMember()},
  'sp-mrm-yes':()=>{const {tid,uid}=SPM.open;SPM.open=null;removeMember(tid,uid)},
  'sp-make-owner':d=>makeOwner(d.id,d.u),'sp-owner-yes':d=>ownerYes(d.id,d.u),
  'sp-transfer':d=>openTransfer(d.id),'sp-transfer-close':()=>closeSheet('sp-transfer'),
  'sp-me-edit':d=>openMeEdit(d.id),'sp-meed-close':()=>closeSheet('sp-meed'),'sp-me-save':d=>meSave(d.id),
  'sp-team-edit':d=>openTeamEdit(d.id),'sp-ted-close':()=>{closeSheet('sp-ted');TE=null},'sp-team-save':()=>teamSave(),
  'sp-del-team':d=>askDelTeam(d.id),
  'sp-del-yes':async(d,b)=>{b.disabled=true;try{await deleteTeam(d.id);await afterGone(d.id,'Équipe supprimée')}catch(e){b.disabled=false;toast('Suppression impossible pour le moment.')}},
  'sp-leave':d=>askLeave(d.id),
  'sp-leave-yes':async(d,b)=>{b.disabled=true;try{await leaveTeam(d.id);await afterGone(d.id,'Tu as quitté '+(SP.T[d.id]?.team?.name||"l'équipe"))}catch(e){b.disabled=false;toast('Action impossible pour le moment.')}}
});
document.addEventListener('change',e=>{
  if(e.target.name==='sp-home'){SP.doc.home=e.target.value;spSaveDoc();toast("Espace d'accueil enregistré")}
});
document.addEventListener('input',e=>{if((e.target.id==='ct-name'||e.target.id==='ct-club')&&CT)ctPreview()});
document.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.id==='sp-code'){e.preventDefault();ACT['sp-join-code']()}});
