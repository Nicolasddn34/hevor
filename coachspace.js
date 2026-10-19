"use strict";
/* =====================================================================
   Hevor — espace Coach : coach indépendant et ses clients
   ===================================================================== */
const TABS_COACH={
  coach:[['clients','Clients',SPICON.team],['programs','Programmes',SPICON.dumb],['members','Inviter',SPICON.link]],
  client:[['mycoach','Mon coach',SPICON.user],['programs','Programmes',SPICON.dumb]]
};
const initials=n=>String(n||'?').trim().split(/\s+/).slice(0,2).map(w=>w[0]||'').join('').toUpperCase()||'?';
function renderCoachSpace(tid){
  const T=SP.T[tid],role=T.me.role==='coach'?'coach':'client',tabs=TABS_COACH[role];
  let tab=SP.tab[tid];if(!tabs.some(t=>t[0]===tab))tab=tabs[0][0];
  setTabs(tabs,tab);loadData(tid);
  const D=SP.D[tid],back=teamsOf('coach').length>1?'sp-list':'';
  let h=`<div class="wrap">${spTop(role==='coach'?(tab==='clients'?'Mes clients':T.team.name):'Mon coach',role==='coach'?T.team.name:(T.team.ownerName||T.team.name),'',back)}`;
  if(!D||(D.loading&&!D.at)){$('#view').innerHTML=h+`<p class="muted">Chargement…</p></div>`;return}
  h+=tab==='clients'?viewClients(tid):tab==='programs'?viewPrograms(tid):tab==='members'?membersSection(tid):viewMyCoach(tid);
  $('#view').innerHTML=h+'</div>';
}
function viewClients(tid){
  const D=dataOf(tid),now=Date.now(),cl=D.members.filter(m=>m.role==='client'),w0=wkStart(0);
  if(!cl.length)return `<div class="card empty"><h3>Pas encore de clients</h3><p>Envoie ton lien d'invitation à tes clients, puis valide leur demande.</p><button class="btn primary" data-act="sp-tab" data-v="members">Inviter un client</button></div>`;
  const pend=D.members.filter(m=>m.role==='pending').length;
  const active=cl.filter(c=>D.logs.some(l=>l.uid===c.uid&&l.at>=now-14*DAY)).length,s7=D.logs.filter(l=>l.at>=now-7*DAY&&cl.some(c=>c.uid===l.uid)).length,p7=D.programs.filter(p=>p.date>=now-7*DAY&&p.date<=now+7*DAY).length;
  let h=`<div class="tiles"><div class="tile"><span>Clients actifs</span><b class="num">${active}<small class="muted">/${cl.length}</small></b></div><div class="tile"><span>Séances 7 j</span><b class="num">${s7}</b></div><div class="tile"><span>Programmes</span><b class="num">${p7}</b></div></div>`;
  if(pend)h+=`<button class="card sp-rate" data-act="sp-tab" data-v="members"><span class="sp-ic">${SPICON.clock}</span><span class="m"><b>${pend} demande${pend>1?'s':''} en attente</b><small>Valide-les dans l'onglet Inviter</small></span>${ICON.chev}</button>`;
  h+=`<section><div class="list">`;
  for(const c of cl){const L=D.logs.filter(l=>l.uid===c.uid),last=L[L.length-1],wk=L.filter(l=>l.at>=w0).length,pw=D.programs.filter(p=>p.invitees.includes(c.uid)&&p.date>=w0&&p.date<w0+7*DAY).length;
    const idle=!last||now-last.at>6*DAY,tot=Math.max(pw,wk);
    h+=`<button class="card sp-client" data-act="cs-client" data-id="${tid}" data-u="${esc(c.uid)}"><div class="r"><span class="ini">${esc(initials(c.name))}</span><span class="m"><b>${esc(c.name)}</b><small class="muted">${esc(c.poste||'Client')}</small></span><span class="small muted">${last?ago(last.at):'aucune séance'}</span></div>
     <div class="r"><span class="bar"><i style="width:${tot?Math.round(Math.min(wk,tot)/tot*100):0}%;background:${tot&&wk>=tot?'var(--ok)':'var(--accent)'}"></i></span><span class="small num">${wk}/${tot||0} cette semaine</span></div>
     ${idle?`<span class="sp-idle">${last?`Aucune séance depuis ${Math.round((now-last.at)/DAY)} jours`:'Pas encore de séance'}</span>`:''}</button>`}
  return h+`</div></section>`;
}
function openClient(tid,uid){
  const D=dataOf(tid),c=D.members.find(m=>m.uid===uid);if(!c)return;
  const L=D.logs.filter(l=>l.uid===uid).slice().reverse(),P=D.programs.filter(p=>p.invitees.includes(uid)).slice().reverse();
  openSheet('cs-client',sheetHead(c.name,'cs-client-close')+`<div class="sheet-b"><div class="wrap sp-col">
   <div class="small muted">${esc(c.poste||'Client')} · depuis ${dfull(c.at)}</div>
   <section><div class="h2">Séances et ressentis</div>${L.length?L.slice(0,15).map(l=>`<div class="card sp-cl"><div class="r"><b>${esc(l.title)}</b><span class="small muted">${dShort(l.at)}</span></div><div class="small muted">${l.dur} min · difficulté ${l.rpe}/10${(l.items||[]).length?' · '+l.items.filter(i=>i.done).length+' exercice'+(l.items.filter(i=>i.done).length>1?'s':''):''}</div>
     ${l.comment?`<p class="sp-q2">« ${esc(l.comment)} »</p>`:''}
     ${l.note?`<p class="sp-fb"><b>Ton retour :</b> ${esc(l.note)}</p>`:''}
     <div class="sp-join"><input id="fb-${l.id}" placeholder="${l.note?'Modifier ton retour':'Écrire un retour'}" maxlength="300" aria-label="Retour pour cette séance"><button class="btn ghost" data-act="cs-fb" data-id="${tid}" data-l="${l.id}">Envoyer</button></div></div>`).join(''):'<p class="muted small" style="margin:0">Pas encore de séance.</p>'}</section>
   <section><div class="h2">Programmes envoyés · ${P.length}</div>${P.length?`<div class="list">${P.slice(0,10).map(p=>`<button class="row" data-act="tm-prog" data-id="${tid}" data-p="${p.id}"><div class="m"><div>${esc(p.title)}</div><small>${dShort(p.date)}</small></div>${D.logs.some(l=>l.programId===p.id&&l.uid===uid)?'<span class="rpill r-done">Fait ✓</span>':'<span class="rpill r-todo">À faire</span>'}</button>`).join('')}</div>`:'<p class="muted small" style="margin:0">Aucun programme envoyé.</p>'}</section>
  </div></div>`);
}
async function sendFeedback(tid,lid){
  const v=($('#fb-'+lid)?.value||'').trim().slice(0,300);if(!v){toast('Écris un retour');return}
  try{await subCol(tid,'logs').doc(lid).update({note:v,noteAt:Date.now()});const l=dataOf(tid).logs.find(x=>x.id===lid);if(l){l.note=v;l.noteAt=Date.now()}const u=l&&l.uid;if(u)openClient(tid,u);toast('Retour envoyé')}
  catch(e){toast('Envoi impossible.')}
}
function viewMyCoach(tid){
  const T=SP.T[tid],D=dataOf(tid),now=Date.now(),w0=wkStart(0);
  const todo=D.programs.filter(p=>!D.logs.some(l=>l.programId===p.id&&l.uid===UID)&&p.date>=sod(now)-2*DAY).sort((a,b)=>a.date-b.date);
  const next=todo[0],fb=D.logs.filter(l=>l.uid===UID&&l.note).sort((a,b)=>(b.noteAt||b.at)-(a.noteAt||a.at))[0];
  const wk=D.logs.filter(l=>l.uid===UID&&l.at>=w0),pw=D.programs.filter(p=>p.date>=w0&&p.date<w0+7*DAY);
  let h=`<section class="card sp-coachc"><span class="ini lg">${esc(initials(T.team.ownerName))}</span><div class="m"><b>${esc(T.team.ownerName||'Ton coach')}</b><small class="muted">${esc(T.team.name)} · suivi depuis ${dfull(T.me.at||now)}</small></div></section>`;
  const run=runLoad();if(run&&run.tid===tid)h+=`<div class="banner"><div><small>Séance en cours</small><br><b>${esc(run.title)}</b></div><button class="btn" data-act="run-resume">Reprendre</button></div>`;
  h+=next?`<section class="card sp-today"><small>${dayKey(next.date)===dayKey(now)?'Séance du jour':'Prochaine séance · '+dShort(next.date)} · envoyée par ${esc(T.team.ownerName||'ton coach')}</small><h3>${esc(next.title)}</h3><span class="small">${next.items.length} exercice${next.items.length>1?'s':''}</span>
     <div class="sp-2"><button class="btn primary" data-act="tm-run" data-id="${tid}" data-p="${next.id}">Démarrer</button><button class="btn ghost" data-act="tm-prog" data-id="${tid}" data-p="${next.id}">Voir</button></div></section>`
    :`<section class="card"><p class="muted" style="margin:0">Pas de séance en attente. Ton coach t'enverra la prochaine ici.</p></section>`;
  h+=`<section class="card"><div class="chart-h"><b>Cette semaine</b><b class="num">${wk.length} / ${Math.max(pw.length,wk.length)} séance${Math.max(pw.length,wk.length)>1?'s':''}</b></div><div class="wk dots">`;
  for(let i=0;i<7;i++){const t=w0+i*DAY,done=wk.some(l=>l.at>=t&&l.at<t+DAY),plan=pw.some(p=>p.date>=t&&p.date<t+DAY),today=t===sod(now);
    h+=`<div class="wd ${today?'today':''}"><i class="d ${done?'done':plan?'plan':''}"></i><span>${new Date(t).toLocaleDateString('fr-FR',{weekday:'narrow'})}</span></div>`}
  h+=`</div></section>`;
  if(fb)h+=`<section class="card"><div class="h2">Dernier retour de ${esc(T.team.ownerName||'ton coach')}</div><p style="margin:0">« ${esc(fb.note)} »</p><span class="small muted">${esc(fb.title)} · ${ago(fb.noteAt||fb.at)}</span></section>`;
  h+=`<p class="small muted sp-note">${SPICON.lock}Ces séances restent dans l'espace Coach. Ton espace « Moi » reste privé.</p>`+teamSettings(tid);
  return h;
}
Object.assign(ACT,{
  'cs-client':d=>openClient(d.id,d.u),'cs-client-close':()=>closeSheet('cs-client'),
  'cs-fb':d=>sendFeedback(d.id,d.l)
});
