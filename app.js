"use strict";
/* ---------- helpers ---------- */
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const gid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,7);
const clone=o=>JSON.parse(JSON.stringify(o));
const fmtN=n=>(Math.round(n*10)/10).toLocaleString('fr-FR');
const fmtKg=n=>fmtN(n)+' kg';
const numStr=n=>String(Math.round(n*10)/10).replace('.',',');
const parseW=v=>{if(v===''||v==null)return null;const n=parseFloat(String(v).replace(',','.'));return isFinite(n)&&n>=0?n:null};
const mmss=s=>{s=Math.max(0,Math.round(s));const h=Math.floor(s/3600),m=Math.floor(s%3600/60),r=String(s%60).padStart(2,'0');return h?h+':'+String(m).padStart(2,'0')+':'+r:m+':'+r};
const dfr=t=>new Date(t).toLocaleDateString('fr-FR',{day:'2-digit',month:'2-digit'});
const dfull=t=>new Date(t).toLocaleDateString('fr-FR',{day:'2-digit',month:'2-digit',year:'numeric'});
const sod=t=>{const d=new Date(t);d.setHours(0,0,0,0);return d.getTime()};
function ago(t){const d=Math.round((sod(Date.now())-sod(t))/864e5);if(d<=0)return "aujourd'hui";if(d===1)return 'hier';if(d<7)return `il y a ${d} j`;if(d<14)return 'il y a 1 sem.';if(d<60)return `il y a ${Math.round(d/7)} sem.`;return 'le '+dfr(t)}
const norm=s=>s.normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
const ICON={
  chev:'<svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>',
  back:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 6l-6 6 6 6"/></svg>',
  close:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  more:'<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>',
  search:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4-4"/></svg>',
  check:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>'
};

const LOGO='<img src="icons/logo.png" alt="">';
/* ---------- pictogram poses (100×100, ground at y=94) ---------- */
const STD='H50,14 N50,25 E51,40 W52,55 P50,53 K51,72 F50,92';
const FRONT='H50,13 N50,25 S44,27 E42,41 W41,55 P50,53 Q46,54 K46,72 F45,92';
const LYING='H18,64 N27,66 P54,67 K71,72 F73,92';
const HANG='W50,9 E49,20 H53,25 N50,32 P50,58 K52,74 F48,89';
const PAT={
 squat:{a:STD+' E40,31 W46,25',b:'H60,38 N57,48 E47,51 W52,45 P37,63 K58,70 F50,92',bar:'N',off:[-4,1]},
 bench:{a:LYING+' E28,52 W29,38',b:'E35,74 W30,60',props:['bench']},
 incline:{a:'H28,44 N34,51 P52,70 K70,72 F72,92 E35,37 W36,23',b:'E44,56 W38,44',props:['incline']},
 chestpress:{a:'H40,22 N40,32 P40,60 K58,62 F60,88 E33,40 W44,36',b:'E54,36 W68,35',props:['seatback']},
 fly:{sym:1,a:FRONT+' E32,34 W22,40',b:'E38,38 W47,44',pul:[6,6]},
 revfly:{like:'fly',swap:1},
 pullover:{a:LYING+' E14,60 W3,61',b:'E26,52 W28,38',props:['bench']},
 pushup:{a:'H18,54 N25,59 E26,74 W26,90 P56,75 K70,82 F86,90',b:'H18,72 N25,78 E37,82 P56,84 K70,87',notoe:1},
 dips:{a:'H50,18 N50,28 E50,40 W50,52 P50,56 K54,73 F46,86',b:'H52,34 N50,44 E38,44 P50,70 K56,84 F44,90',props:['parallel'],notoe:1},
 pullup:{a:HANG,b:'E40,16 H53,12 N50,20 P50,46 K52,62 F48,77',props:['pullbar'],notoe:1},
 hangraise:{a:HANG,b:'K66,57 F82,57',props:['pullbar'],notoe:1},
 pulldown:{a:'H50,30 N50,40 P50,64 K64,66 F64,88 E46,25 W44,11',b:'E40,46 W44,34',props:['seat'],pul:[45,-6]},
 row:{a:'H70,38 N63,43 E63,58 W64,72 P40,52 K47,72 F45,92',b:'E52,50 W60,61',pul:[66,93]},
 kickback:{a:'H70,38 N63,43 E52,49 W58,62 P40,52 K47,72 F45,92',b:'W38,47'},
 seatedrow:{a:'H54,53 N50,60 E58,68 W70,72 P40,82 K55,74 F70,84',b:'H40,50 N42,57 E30,66 W44,68',props:['lowrow'],pul:[96,72],notoe:1},
 clean:{a:'H62,40 N57,46 E57,65 W57,83 P40,55 K55,72 F50,92',b:STD+' E60,30 W53,24'},
 legraise:{a:'H12,86 N20,88 E28,90 W36,90 P48,90 K66,89 F84,90',b:'K60,72 F62,52',notoe:1},
 deadlift:{a:'H62,40 N57,46 E57,65 W57,83 P40,55 K55,72 F50,92',b:STD},
 goodmorning:{a:STD+' E40,31 W46,25',b:'H76,44 N67,46 E58,48 W63,44 P46,54 K50,72 F50,92',bar:'N',off:[-4,1]},
 swing:{a:'H60,40 N56,46 E54,62 W48,78 P40,55 K54,72 F50,92',b:STD+' E63,31 W77,27'},
 backext:{a:'F16,88 K29,76 P42,64 N56,82 H62,89 E52,74 W57,77',b:'N57,48 H62,42 E53,55 W58,52',props:['backext'],notoe:1},
 shrug:{sym:1,a:FRONT,b:'H50,10 N50,22 S44,23 E42,37 W41,51'},
 upright:{sym:1,a:FRONT+' E44,42 W47,56',b:'E33,28 W46,29'},
 lateral:{sym:1,a:FRONT+' E43,41 W44,55',b:'E33,30 W21,29',pul:[57,95]},
 frontraise:{a:STD,b:'E64,26 W78,27',pul:[60,95]},
 abduction:{sym:1,a:FRONT,b:'K41,72 F34,91'},
 adduction:{like:'abduction',swap:1},
 rotext:{sym:1,a:FRONT+' E43,41 W49,42',b:'W30,41',anc:[2,42]},
 rotint:{like:'rotext',swap:1},
 balance:{a:STD+' E58,34 W68,38 k61,63 f57,80',b:'H51,14 E57,35 W68,36 k60,62 f58,79'},
 ohp:{a:STD+' E40,32 W48,26',b:'E50,13 W50,1'},
 facepull:{a:STD+' E62,28 W76,27',b:'E40,23 W52,18',pul:[97,27]},
 curl:{a:STD,b:'W58,26',pul:[66,93]},
 preacher:{a:'H47,20 N50,30 P46,58 K64,60 F64,88 E63,46 W77,58',b:'W61,30',props:['preacher']},
 pushdown:{a:STD+' E52,40 W60,28',b:'W55,57',pul:[62,-6]},
 skull:{a:LYING+' E30,52 W30,38',b:'W19,57',props:['bench']},
 ohext:{a:STD+' E52,10 W41,21',b:'W54,-5',pul:[50,95]},
 legpress:{a:'H22,52 N28,59 P48,78 K56,58 F72,60 E36,70 W44,76',b:'K65,66 F83,52',props:['lpseat','sled'],notoe:1,nohand:1},
 legext:{a:'H40,22 N40,32 P40,60 K58,60 F58,84 E42,46 W48,61',b:'F80,57',props:['seatback'],legm:1,notoe:1,nohand:1},
 legcurlseat:{like:'legext',swap:1},
 legcurl:{a:'H14,56 N22,60 P50,60 K72,60 F92,60 E22,70 W30,67',b:'F77,41',props:['lcbench'],legm:1,notoe:1,nohand:1},
 lunge:{a:STD+' k50,72 f50,92',b:'H50,26 N50,37 E50,52 W50,67 P50,64 K66,70 F64,92 k40,84 f26,90'},
 hipthrust:{a:'H16,56 N24,60 E30,72 W42,80 P42,84 K60,70 F66,92',b:'E32,62 W44,60 P44,62 K63,66',props:['hipbench'],bar:'P',off:[0,-4]},
 glutebridge:{a:'H12,86 N20,88 E27,90 W34,90 P44,90 K60,72 F68,92',b:'P44,74 K60,68'},
 glutekick:{a:STD+' E58,36 W64,45 k51,72 f50,92',b:'K40,71 F28,84',pul:[4,93],to:'F',nohand:1},
 calf:{a:'H50,14 N50,25 E51,40 W52,55 P50,53 K51,72 F50,90',b:'H50,9 N50,20 E51,35 W52,50 P50,48 K51,67 F50,85'},
 calfseat:{a:'H40,22 N40,32 P40,60 K58,60 F58,86 E44,46 W54,58',b:'H40,20 N40,30 P40,57 K58,56 F58,81',props:['seatback'],nohand:1},
 crunch:{a:'H14,84 N22,86 E18,78 W14,80 P50,88 K62,70 F74,92',b:'H24,66 N30,74 E26,66 W22,69',pul:[2,60]},
 plank:{a:'H20,70 N27,74 E27,90 W38,90 P56,80 K70,84 F86,90',b:'P56,78',notoe:1},
 abwheel:{a:'H44,44 N49,51 E47,67 W46,83 P60,70 K62,90 F80,91',b:'H22,74 N30,78 E22,80 W14,84 P52,82',props:['wheel'],notoe:1},
 run:{a:'H54,14 N52,25 E44,36 W51,43 e60,35 w65,27 P50,52 K60,66 F54,84 k44,72 f33,81',b:'E60,35 W65,27 e44,36 w51,43 K44,72 F33,81 k60,66 f54,84',notoe:1},
 bike:{a:'H58,22 N54,32 E62,38 W67,36 P40,51 K58,54 F56,74 k50,60 f40,78',b:'K52,64 F42,78 k58,54 f56,74',props:['bike'],notoe:1},
 rower:{a:'H58,52 N54,60 E64,66 W74,66 P42,82 K58,70 F72,84',b:'H38,50 N40,57 E30,64 W46,66 K60,80 F72,84',props:['lowrow'],notoe:1},
 boxjump:{a:'H38,40 N36,48 E30,58 W24,62 P24,62 K40,70 F34,92',b:'H74,22 N72,32 E80,40 W86,37 P70,58 K80,66 F74,74',props:['box']},
 jumpsquat:{a:'H60,38 N57,48 E62,54 W72,50 P37,63 K58,70 F50,92',b:'H50,4 N50,15 E54,3 W58,-8 P50,43 K51,62 F50,82'},
 nordic:{a:'F12,90 K32,90 P33,66 N35,42 H36,33 E40,54 W46,58',b:'P49,74 N67,59 H74,53 E72,68 W78,77',props:['nordic'],notoe:1}
};
function parsePose(s){const o={};String(s||'').replace(/([A-Za-z])(-?[\d.]+),(-?[\d.]+)/g,(m,k,x,y)=>{o[k]=[+x,+y]});return o}
for(const k in PAT){const p=PAT[k];if(!p.like){p._a=parsePose(p.a);p._b={...p._a,...parsePose(p.b)}}}
for(const k in PAT){const p=PAT[k];if(p.like){const s=PAT[p.like];PAT[k]={...s,_a:p.swap?s._b:s._a,_b:p.swap?s._a:s._b}}}
function poseAt(p,t){const A=p._a,B=p._b,o={};for(const k in A){const a=A[k],b=B[k];o[k]=[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t]}return o}
const ln=(a,b,c)=>`<line x1="${a[0].toFixed(1)}" y1="${a[1].toFixed(1)}" x2="${b[0].toFixed(1)}" y2="${b[1].toFixed(1)}" class="${c}"/>`;
const pl=(pts,c)=>`<polyline points="${pts.map(p=>p[0].toFixed(1)+','+p[1].toFixed(1)).join(' ')}" class="${c}"/>`;
const mir=p=>[100-p[0],p[1]];
const PROPS={
 bench:()=>'<path d="M12 72H62M18 72V92M56 72V92" class="p"/>',
 incline:()=>'<path d="M22 46L54 77M54 77H66M58 77V92M30 60L30 92" class="p"/>',
 seatback:()=>'<path d="M33 24V64M33 64H56M44 64V92" class="p"/>',
 seat:()=>'<path d="M40 68H60M50 68V92M60 58H69" class="p"/>',
 pullbar:()=>'<path d="M24 8H76" class="p"/><path d="M26 8V16M74 8V16" class="pt"/>',
 parallel:()=>'<path d="M32 53H68" class="p"/><path d="M36 53V92M64 53V92" class="pt"/>',
 box:()=>'<rect x="62" y="75" width="26" height="18" rx="2" class="p" style="stroke-width:4"/>',
 lpseat:()=>'<path d="M14 54L40 84M40 84H54M30 76V92" class="p"/>',
 sled:q=>{const P=q.P,F=q.F,dx=F[0]-P[0],dy=F[1]-P[1],l=Math.hypot(dx,dy)||1,nx=-dy/l*11,ny=dx/l*11,ox=dx/l*3.5,oy=dy/l*3.5;return `<path d="M${(F[0]+ox+nx).toFixed(1)} ${(F[1]+oy+ny).toFixed(1)}L${(F[0]+ox-nx).toFixed(1)} ${(F[1]+oy-ny).toFixed(1)}" class="p" style="stroke:var(--accent)"/>`},
 preacher:()=>'<path d="M52 38L69 55M36 62H55M46 62V92" class="p"/>',
 backext:()=>'<path d="M34 62L48 76M41 69L41 92M8 86H22" class="p"/>',
 wheel:q=>`<circle cx="${q.W[0].toFixed(1)}" cy="88" r="5.5" class="eq"/>`,
 bike:()=>'<path d="M34 50H46M40 50L48 74L66 38M62 35H71" class="pt" style="stroke-width:3.5"/><circle cx="48" cy="74" r="8" class="pt" style="stroke-dasharray:3 3"/>',
 lowrow:()=>'<path d="M28 86H54M73 74V92" class="p"/>',
 hipbench:()=>'<path d="M4 63H28M14 63V92" class="p"/>',
 lcbench:()=>'<path d="M12 66H78M18 66V92M72 66V92" class="p"/>',
 nordic:()=>'<path d="M4 86H20" class="p"/>'
};
function plate(c){return `<circle cx="${c[0].toFixed(1)}" cy="${c[1].toFixed(1)}" r="7.5" class="eq"/><circle cx="${c[0].toFixed(1)}" cy="${c[1].toFixed(1)}" r="2" class="eqf"/>`}
function dumb(c){const x=c[0],y=c[1];return `<line x1="${(x-4).toFixed(1)}" y1="${y.toFixed(1)}" x2="${(x+4).toFixed(1)}" y2="${y.toFixed(1)}" class="cb" style="stroke-width:2.5"/><rect x="${(x-6.5).toFixed(1)}" y="${(y-3.6).toFixed(1)}" width="3.6" height="7.2" rx="1" class="eqf"/><rect x="${(x+2.9).toFixed(1)}" y="${(y-3.6).toFixed(1)}" width="3.6" height="7.2" rx="1" class="eqf"/>`}
function kb(c){return `<circle cx="${c[0].toFixed(1)}" cy="${(c[1]+6).toFixed(1)}" r="4.6" class="eqf"/><path d="M${(c[0]-3).toFixed(1)} ${(c[1]+3).toFixed(1)}Q${c[0].toFixed(1)} ${(c[1]-2).toFixed(1)} ${(c[0]+3).toFixed(1)} ${(c[1]+3).toFixed(1)}" class="cb" style="stroke-width:2"/>`}
function figSVG(ex,t){
  const p=PAT[ex.pat]||PAT.squat,q=poseAt(p,t),eq=ex.eq;let s='<line x1="6" y1="94" x2="94" y2="94" class="g"/>';
  (p.props||[]).forEach(k=>{s+=PROPS[k](q)});
  const arm=(N,E,W,c)=>pl([N,E,W],c),leg=(P,K,F,c)=>pl([P,K,F],c);
  const toe=F=>(!p.notoe&&!p.sym&&F[1]>=82)?ln(F,[F[0]+7,Math.min(93,F[1]+2.5)],'b'):'';
  // cables & bands behind body
  const hand=p.to==='F'?q.F:q.W;
  if(eq==='P'||eq==='E'){const a=eq==='E'?(p.anc||[96,hand[1]]):(p.pul||[60,-6]);const cls=eq==='E'?'bd':'cb';
    s+=ln(a,hand,cls)+(eq==='P'?`<circle cx="${a[0]}" cy="${a[1]}" r="2.6" class="eq" style="stroke-width:2"/>`:'');
    if(p.sym){const m2=mir(hand),am=mir(a);s+=ln(am,m2,cls)+(eq==='P'?`<circle cx="${am[0]}" cy="${am[1]}" r="2.6" class="eq" style="stroke-width:2"/>`:'')}}
  if(p.sym){
    const S=q.S||q.N,Q=q.Q||q.P;
    s+=ln(S,mir(S),'b')+ln(q.N,q.P,'b')+ln(Q,mir(Q),'b');
    s+=leg(Q,q.K,q.F,'b')+leg(mir(Q),mir(q.K),mir(q.F),'b');
    s+=arm(S,q.E,q.W,'b')+arm(mir(S),mir(q.E),mir(q.W),'b');
    s+=`<circle cx="${q.H[0].toFixed(1)}" cy="${q.H[1].toFixed(1)}" r="6.5" class="h"/>`;
    if(eq==='B'){const y=q.W[1],x1=q.W[0]-12,x2=100-q.W[0]+12;s+=`<line x1="${x1.toFixed(1)}" y1="${y.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y.toFixed(1)}" class="cb" style="stroke-width:2.6"/><rect x="${(x1-2).toFixed(1)}" y="${(y-8).toFixed(1)}" width="4" height="16" rx="1.5" class="eqf"/><rect x="${(x2-2).toFixed(1)}" y="${(y-8).toFixed(1)}" width="4" height="16" rx="1.5" class="eqf"/>`}
    else if(eq==='H')s+=dumb(q.W)+dumb(mir(q.W));
    else if(eq==='K')s+=kb(q.W)+kb(mir(q.W));
    else if(eq==='M'||eq==='P'||eq==='E')s+=`<circle cx="${q.W[0].toFixed(1)}" cy="${q.W[1].toFixed(1)}" r="2.8" class="eqf"/><circle cx="${(100-q.W[0]).toFixed(1)}" cy="${q.W[1].toFixed(1)}" r="2.8" class="eqf"/>`;
    return `<svg viewBox="0 -10 100 106" aria-hidden="true">${s}</svg>`;
  }
  if(q.k)s+=leg(q.P,q.k,q.f,'f');
  if(q.e)s+=arm(q.N,q.e,q.w,'f');
  s+=ln(q.N,q.P,'b')+leg(q.P,q.K,q.F,'b')+toe(q.F);
  const bodyFirst=p.bar==='N';
  if(eq==='B'&&p.bar){const o=p.off||[0,0],c=q[p.bar];s+=plate([c[0]+o[0],c[1]+o[1]])}
  s+=`<circle cx="${q.H[0].toFixed(1)}" cy="${q.H[1].toFixed(1)}" r="6.5" class="h"/>`;
  s+=arm(q.N,q.E,q.W,'b');
  if(eq==='B'&&!p.bar)s+=plate(q.W);
  else if(eq==='H')s+=dumb(q.W);
  else if(eq==='K')s+=kb(q.W);
  else if(eq==='M'){if(p.legm)s+=`<circle cx="${q.F[0].toFixed(1)}" cy="${(q.F[1]-1).toFixed(1)}" r="3.6" class="eqf"/>`;else if(!p.nohand)s+=`<circle cx="${q.W[0].toFixed(1)}" cy="${q.W[1].toFixed(1)}" r="3" class="eqf"/>`}
  else if((eq==='P'||eq==='E')&&p.to!=='F')s+=`<circle cx="${q.W[0].toFixed(1)}" cy="${q.W[1].toFixed(1)}" r="2.8" class="eqf"/>`;
  void bodyFirst;
  return `<svg viewBox="0 -10 100 106" aria-hidden="true">${s}</svg>`;
}

/* ---------- exercise library ---------- */
const CATS=[['pecs','Pectoraux','bench'],['dos','Dos','pullup'],['epaules','Épaules','lateral'],['biceps','Biceps & avant-bras','curl'],['triceps','Triceps','pushdown'],['quadri','Quadriceps','squat'],['ischios','Ischios & fessiers','hipthrust'],['mollets','Mollets','calf'],['abdos','Abdos & gainage','crunch'],['cardio','Cardio','run'],['explo','Explosivité & prévention','boxjump']].map(([id,name,pat],i)=>({id,name,pat,col:['brick','rose','ember','sand','ash'][i%5]}));
const CATDEF={pecs:'H',dos:'B',epaules:'H',biceps:'H',triceps:'P',quadri:'B',ischios:'B',mollets:'M',abdos:'C',cardio:'X',explo:'C'};
const EQ={B:'Barre',H:'Haltères',M:'Machine',P:'Poulie',C:'Poids du corps',K:'Kettlebell',E:'Élastique',X:'Cardio'};
const EXOS_RAW=`dc-barre|Développé couché barre|pecs|B|bench
dc-halt|Développé couché haltères|pecs|H|bench
di-barre|Développé incliné barre|pecs|B|incline
di-halt|Développé incliné haltères|pecs|H|incline
dd-barre|Développé décliné barre|pecs|B|bench
dc-machine|Chest press machine|pecs|M|chestpress
ecarte-halt|Écarté couché haltères|pecs|H|bench
pec-deck|Pec deck (butterfly)|pecs|M|fly
vis-a-vis|Écarté poulie vis-à-vis|pecs|P|fly
pompes|Pompes|pecs|C|pushup
dips-pecs|Dips buste penché|pecs|C|dips
pullover|Pull-over haltère|pecs|H|pullover
tractions|Tractions pronation|dos|C|pullup
chin-up|Tractions supination|dos|C|pullup
tirage-vertical|Tirage vertical poulie haute|dos|P|pulldown
tirage-serre|Tirage vertical prise serrée|dos|P|pulldown
rowing-barre|Rowing barre|dos|B|row
rowing-halt|Rowing haltère un bras (tirage bûcheron)|dos|H|row
tirage-horiz|Tirage horizontal poulie basse|dos|P|seatedrow
rowing-machine|Rowing machine prise neutre|dos|M|seatedrow
t-bar|Rowing T-bar|dos|B|row
souleve|Soulevé de terre|dos|B|deadlift
pullover-poulie|Pull-over poulie bras tendus|dos|P|pushdown
lombaires|Extensions lombaires banc 45°|dos|C|backext
shrug-barre|Shrugs barre|dos|B|shrug
shrug-halt|Shrugs haltères|dos|H|shrug
dm-barre|Développé militaire barre|epaules|B|ohp
dm-halt|Développé épaules haltères|epaules|H|ohp
dm-machine|Développé épaules machine|epaules|M|ohp
arnold|Développé Arnold|epaules|H|ohp
elev-lat|Élévations latérales haltères|epaules|H|lateral
elev-lat-poulie|Élévations latérales poulie|epaules|P|lateral
elev-front|Élévations frontales|epaules|H|frontraise
oiseau|Oiseau (deltoïdes arrière)|epaules|H|row
reverse-pec|Reverse pec deck|epaules|M|revfly
face-pull|Face pull|epaules|P|facepull
tirage-menton|Tirage menton|epaules|B|upright
curl-barre|Curl barre|biceps|B|curl
curl-ez|Curl barre EZ|biceps|B|curl
curl-halt|Curl haltères|biceps|H|curl
curl-marteau|Curl marteau|biceps|H|curl
curl-incline|Curl incliné haltères|biceps|H|curl
curl-pupitre|Curl pupitre|biceps|B|preacher
curl-poulie|Curl poulie basse|biceps|P|curl
curl-concentre|Curl concentré|biceps|H|preacher
curl-poignets|Curl poignets barre|biceps|B|curl
pushdown|Extension triceps poulie haute|triceps|P|pushdown
pushdown-corde|Extension triceps à la corde|triceps|P|pushdown
barre-front|Barre au front (skull crusher)|triceps|B|skull
ext-nuque|Extension nuque haltère|triceps|H|ohext
ext-nuque-poulie|Extension nuque poulie|triceps|P|ohext
dips|Dips barres parallèles|triceps|C|dips
dips-banc|Dips entre deux bancs|triceps|C|dips
kickback|Kickback haltère|triceps|H|kickback
dc-serre|Développé couché prise serrée|triceps|B|bench
squat|Squat barre|quadri|B|squat
front-squat|Front squat|quadri|B|squat
goblet|Goblet squat|quadri|H|squat
presse|Presse à cuisses|quadri|M|legpress
hack|Hack squat machine|quadri|M|squat
leg-ext|Leg extension|quadri|M|legext
fentes|Fentes avant haltères|quadri|H|lunge
fentes-marchees|Fentes marchées|quadri|H|lunge
bulgare|Fentes bulgares|quadri|H|lunge
step-up|Step-up sur banc|quadri|H|lunge
sdt-roumain|Soulevé de terre roumain|ischios|B|deadlift
sdt-jt|Soulevé de terre jambes tendues haltères|ischios|H|deadlift
leg-curl-allonge|Leg curl allongé|ischios|M|legcurl
leg-curl-assis|Leg curl assis|ischios|M|legcurlseat
hip-thrust|Hip thrust barre|ischios|B|hipthrust
pont-fessier|Pont fessier|ischios|C|glutebridge
good-morning|Good morning|ischios|B|goodmorning
abducteurs|Machine abducteurs|ischios|M|abduction
adducteurs|Machine adducteurs|ischios|M|adduction
kickback-fessier|Kickback fessier poulie|ischios|P|glutekick
kb-swing|Kettlebell swing|ischios|K|swing
mollets-debout|Mollets debout machine|mollets|M|calf
mollets-assis|Mollets assis machine|mollets|M|calfseat
mollets-halt|Mollets debout haltères|mollets|H|calf
mollets-presse|Mollets à la presse|mollets|M|legpress
crunch|Crunch|abdos|C|crunch
crunch-poulie|Crunch à la poulie|abdos|P|crunch
releve-jambes|Relevés de jambes suspendu|abdos|C|hangraise
planche|Gainage planche|abdos|C|plank
gainage-lat|Gainage latéral|abdos|C|plank
russian|Russian twist|abdos|C|crunch
roue|Roue abdominale|abdos|C|abwheel
tapis|Tapis de course|cardio|X|run
velo|Vélo|cardio|X|bike
rameur|Rameur|cardio|X|rower
elliptique|Vélo elliptique|cardio|X|run
corde|Corde à sauter|cardio|X|calf
burpees|Burpees|cardio|C|pushup
box-jump|Box jump|explo|C|boxjump
squat-jump|Squat jump|explo|C|jumpsquat
fentes-sautees|Fentes sautées|explo|C|lunge
rot-ext|Rotation externe épaule élastique|explo|E|rotext
rot-int|Rotation interne épaule élastique|explo|E|rotint
ytw|Élévations Y-T-W|explo|H|lateral
nordic|Nordic hamstring curl|explo|C|nordic
copenhague|Gainage Copenhague (adducteurs)|explo|C|plank
med-ball|Lancer médecine-ball au-dessus de la tête|explo|C|ohp
equilibre|Équilibre unipodal|explo|C|balance
dc-smith|Développé couché Smith machine|pecs|M|bench
pompes-declinees|Pompes déclinées|pecs|C|pushup
ecarte-poulie-basse|Écarté poulie basse|pecs|P|fly
di-machine|Développé incliné machine|pecs|M|chestpress
tirage-inverse|Tirage vertical prise inversée|dos|P|pulldown
tirage-un-bras|Tirage vertical un bras|dos|P|pulldown
pendlay|Rowing Pendlay|dos|B|row
tractions-assistees|Tractions assistées machine|dos|M|pullup
trap-bar|Soulevé de terre trap bar|dos|B|deadlift
rack-pull|Rack pull|dos|B|deadlift
elev-lat-machine|Élévations latérales machine|epaules|M|lateral
landmine|Développé landmine|epaules|B|ohp
oiseau-poulie|Oiseau à la poulie|epaules|P|revfly
curl-araignee|Curl araignée|biceps|H|preacher
curl-bayesian|Curl Bayesian poulie|biceps|P|curl
curl-pupitre-machine|Curl pupitre machine|biceps|M|preacher
curl-inverse|Curl inversé barre|biceps|B|curl
ext-un-bras|Extension triceps un bras poulie|triceps|P|pushdown
dips-machine|Dips machine|triceps|M|dips
pompes-diamant|Pompes diamant|triceps|C|pushup
jm-press|JM press|triceps|B|skull
squat-smith|Squat Smith machine|quadri|M|squat
sissy|Sissy squat|quadri|C|squat
pendulum|Pendulum squat|quadri|M|squat
belt-squat|Belt squat|quadri|M|squat
fentes-arriere|Fentes arrière haltères|ischios|H|lunge
hip-thrust-machine|Hip thrust machine|ischios|M|hipthrust
ghr|Glute ham raise|ischios|C|nordic
mollets-unipodal|Mollets sur une jambe|mollets|H|calf
crunch-machine|Crunch machine|abdos|M|crunch
mountain|Mountain climbers|abdos|C|plank
pallof|Pallof press|abdos|P|rotext
escalier|Stairmaster (escalier)|cardio|X|lunge
assault-bike|Assault bike|cardio|X|bike
drop-jump|Drop jump|explo|C|jumpsquat
sauts-lateraux|Sauts latéraux|explo|C|jumpsquat
bondissements|Bondissements|explo|C|run
rot-ext-poulie|Rotation externe épaule poulie|explo|P|rotext
power-clean|Power clean (épaulé)|explo|B|clean
hang-clean|Hang clean (épaulé depuis les cuisses)|explo|B|clean
sdt-jt-barre|Soulevé de terre jambes tendues barre|ischios|B|deadlift
iso-dos|Isométrie dos (rowing tenu)|dos|B|row
iso-tractions|Isométrie tractions (maintien en haut)|dos|C|pullup
releve-sol|Relevés de jambes au sol|abdos|C|legraise
crunch-leste|Crunch lesté|abdos|H|crunch`;
const ALIAS={'dc-barre':'bench press','dc-halt':'dumbbell bench press','di-halt':'incline dumbbell press','di-barre':'incline bench press','vis-a-vis':'cable crossover cable fly écarté poulie','ecarte-halt':'dumbbell fly','pec-deck':'butterfly','dips-pecs':'chest dips','tractions':'pull-up pull up','chin-up':'chin up','tirage-vertical':'lat pulldown','tirage-horiz':'seated cable row','rowing-barre':'barbell row','rowing-halt':'bûcheron one arm dumbbell row','souleve':'deadlift','sdt-roumain':'rdl romanian deadlift','sdt-jt':'stiff leg deadlift','sdt-jt-barre':'stiff leg deadlift','dm-barre':'military press overhead press','elev-lat':'lateral raise','face-pull':'face pull','curl-barre':'curl biceps barbell curl','curl-halt':'curl biceps dumbbell curl','curl-marteau':'hammer curl','pushdown':'curl triceps triceps pushdown','pushdown-corde':'curl triceps rope pushdown','barre-front':'skull crusher','ext-nuque':'overhead extension','squat':'back squat','front-squat':'front squat','goblet':'goblet squat','presse':'leg press','leg-ext':'leg extension','leg-curl-allonge':'lying leg curl ischios','leg-curl-assis':'seated leg curl','bulgare':'squat bulgare bulgarian split squat','hip-thrust':'hip thrust','mollets-debout':'standing calf raise','planche':'gainage plank','releve-jambes':'hanging leg raise','releve-sol':'lying leg raise','crunch-leste':'weighted crunch','kb-swing':'kettlebell swing','box-jump':'box jump','nordic':'nordic','power-clean':'power clean épaulé haltérophilie','iso-dos':'isométrie isometric','iso-tractions':'isométrie dead hang'};
const EXOS=EXOS_RAW.split('\n').map(l=>{const[id,name,cat,eq,pat]=l.split('|');return{id,name,cat,eq,pat,al:ALIAS[id]||''}});
const EXMAP=Object.fromEntries(EXOS.map(e=>[e.id,e]));
function allExos(){return EXOS.concat(S.custom)}
function exo(id,fallbackName){return EXMAP[id]||S.custom.find(e=>e.id===id)||{id,name:fallbackName||'Exercice supprimé',cat:'',eq:'C',pat:'squat'}}

/* ---------- niveaux ---------- */
/* Seuil du niveau n = total soulevé depuis le début = 1,3 t × n^K, de 1,3 t (voiture) au niveau 1 à 5 200 t au niveau 100.
   Calé sur ~10 t par grosse séance, 4 séances/semaine : au moins un niveau par semaine pendant les ~35 premiers niveaux, niveau 100 vers 30 mois. */
const LV_K=Math.log(4000)/Math.log(100);
const OBJ_RAW=`Voiture|🚗
Éléphant d'Asie|🐘
Tyrannosaure|🦖
Cachalot femelle|🐳
Pelleteuse|🏗️
Tramway|🚊
Semi-remorque chargé|🚛
Brachiosaure|🦕
Boeing 737 chargé|✈️
Airbus A320 au décollage|✈️
Péniche|🚢
Locomotive de fret|🚂
Maison de plain-pied|🏠
Grue à tour|🏗️
Bateau-mouche|⛴️
Baleine bleue|🐋
Statue de la Liberté|🗽
Maison à étage|🏡
Boeing 787 au décollage|✈️
Airbus A350 au décollage|✈️
Éolienne|🌬️
Boeing 777 au décollage|✈️
Maison de ville|🏘️
Rame de TGV|🚄
Station spatiale internationale|🛰️
Bateau de pêche industriel|🚢
Voilier-école|⛵
Passerelle métallique|🌉
Airbus A380 au décollage|✈️
Chalet de montagne|🛖
Christ Rédempteur|🗿
Château d'eau|🚰
Fusée Ariane 6 au décollage|🚀
Double rame de TGV|🚄
Immeuble de 2 étages|🏢
Bateau de croisière fluviale|⛴️
Église de village|⛪
Train Intercités|🚆
Remorqueur de haute mer|🚢
Chalutier de haute mer|🚢
Pont routier|🌉
Moulin en pierre|🌾
Immeuble de 3 étages|🏢
Navire océanographique|🚢
Gare de village|🚉
Ferry|⛴️
Fusée Falcon Heavy au décollage|🚀
Phare en mer|🗼
Yacht de luxe de 60 m|🛥️
Immeuble de 4 étages|🏢
Grue portuaire|🏗️
Manoir en pierre|🏚️
Gymnase|🏟️
Paquebot fluvial|⛴️
Bateau de croisière côtier|⛴️
Sous-marin|🚢
Grande roue|🎡
Immeuble de 5 étages|🏢
Hôtel de ville|🏛️
Navire de recherche polaire|🚢
Petit porte-conteneurs|🚢
Ferry rapide|⛴️
Piscine olympique remplie|💧
Train de marchandises|🚆
Montagnes russes|🎢
Immeuble de 6 étages|🏢
Fusée Saturn V au décollage|🚀
Tribune de stade|🏟️
Chalutier-usine|🚢
Immeuble de 7 étages|🏢
Tour de télécommunication|📡
Navire d'expédition|🚢
Pont suspendu|🌉
Grand trois-mâts|⛵
Hôpital|🏥
Immeuble de 8 étages|🏢
Château fort|🏰
Usine|🏭
Immeuble de 9 étages|🏬
Gare de ville|🚉
Patinoire olympique|⛸️
Lycée|🏫
Immeuble de 10 étages|🏙️
Cargo|🚢
Centre aquatique|💦
Brise-glace|🚢
Tour de contrôle d'aéroport|🗼
Immeuble de 11 étages|🏙️
Musée|🏛️
Palais des sports|🏟️
Immeuble de 12 étages|🏙️
Navire de croisière d'expédition|⛴️
Château de la Loire|🏰
Immeuble de 13 étages|🏙️
Grand cargo frigorifique|🚢
Fusée Starship au décollage|🚀
Centre commercial|🏬
Tour de bureaux|🏢
Palais|🏯
Tour de 14 étages|🏙️`;
const roundT=x=>x<10?Math.round(x*10)/10:x<100?Math.round(x):Math.round(x/5)*5;
const TIERS=OBJ_RAW.split('\n').map((l,i)=>{const n=i+1,[name,emo]=l.split('|');return{n,thr:n===100?5200:roundT(1.3*Math.pow(n,LV_K)),name,emo,obj:true,mile:n%10===0}});
const fmtT=t=>(t<10?Math.round(t*100)/100:Math.round(t*10)/10).toLocaleString('fr-FR',{maximumFractionDigits:t<10?2:1})+'\u00a0t';
const nextObj=lvl=>TIERS[lvl]||null;
function passAt(totalKg){const t=totalKg/1000;let lvl=0;while(lvl<100&&TIERS[lvl].thr<=t+1e-9)lvl++;
  const no=nextObj(lvl);
  if(lvl>=100)return{lvl:100,t,done:true,into:0,need:0,pct:100,next:null,no:null};
  const base=lvl?TIERS[lvl-1].thr:0,next=TIERS[lvl],need=next.thr-base,into=Math.max(0,t-base);return{lvl,t,into,need,pct:Math.min(100,into/need*100),next,no}}
const P_LVL=()=>passAt(totalKg()).lvl;
const totalKg=()=>S.sessions.reduce((a,s)=>a+(s.tonnage||0),0);
/* ---------- state & local storage ---------- */
let LS='hevor.v1:anon';
function fresh(){return{v:1,templates:[],custom:[],sessions:[],active:null,settings:{restSet:90,restExo:120,sound:true},stamp:{meta:0,active:0},deleted:[],dirty:[]}}
let S=fresh();
function loadLocal(key){LS=key;S=fresh();try{const raw=localStorage.getItem(LS);if(raw){const o=JSON.parse(raw);S={...fresh(),...o,settings:{...fresh().settings,...(o.settings||{})},stamp:{...fresh().stamp,...(o.stamp||{})}}}}catch(e){}}
function persist(){try{localStorage.setItem(LS,JSON.stringify(S))}catch(e){}}
function mark(tok){if(!S.dirty.includes(tok))S.dirty.push(tok)}
function touchMeta(){S.stamp.meta=Date.now();mark('meta');persist();flushSoon()}
let activeTimer=null;
function touchActive(delay){S.stamp.active=Date.now();persist();clearTimeout(activeTimer);activeTimer=setTimeout(()=>{mark('active');persist();flush()},delay??1200)}
function touchSession(id){mark('s:'+id);persist();flushSoon()}


/* ---------- validation des données (fichiers importés et données du compte) ---------- */
const okId=v=>typeof v==='string'&&/^[A-Za-z0-9_-]{1,48}$/.test(v);
const cStr=(v,max)=>typeof v==='string'?v.replace(/[\u0000-\u001f\u007f]/g,'').slice(0,max):'';
const cNum=(v,min,max,def)=>{const n=Number(v);return Number.isFinite(n)?Math.min(max,Math.max(min,n)):def};
const MODES=['reps','max','time'];
function cTplItem(it){if(!it||!okId(it.exoId))return null;return{exoId:it.exoId,name:cStr(it.name,80)||undefined,sets:Math.round(cNum(it.sets,1,10,3)),reps:Math.round(cNum(it.reps,1,100,10)),mode:MODES.includes(it.mode)?it.mode:'reps',dur:Math.round(cNum(it.dur,5,14400,60)),restSet:Math.round(cNum(it.restSet,0,600,90)),restExo:Math.round(cNum(it.restExo,0,600,120)),...(it.uni===true?{uni:true}:{})}}
function cTemplate(t){if(!t||!okId(t.id))return null;return{id:t.id,name:cStr(t.name,60)||'Ma séance',items:(Array.isArray(t.items)?t.items:[]).slice(0,40).map(cTplItem).filter(Boolean)}}
function cCustom(e){if(!e||!okId(e.id))return null;return{id:e.id,name:cStr(e.name,60)||'Exercice',cat:CATS.some(c=>c.id===e.cat)?e.cat:'pecs',eq:EQ[e.eq]?e.eq:'C',pat:PAT[e.pat]?e.pat:'squat'}}
function cSession(x){if(!x||!okId(x.id))return null;
  const items=(Array.isArray(x.items)?x.items:[]).slice(0,60).map(it=>{if(!it||!okId(it.exoId))return null;const done=Math.round(cNum(it.done,0,20,0));
    return{exoId:it.exoId,name:cStr(it.name,80),weight:it.weight==null?null:cNum(it.weight,0,2000,0),sets:Math.round(cNum(it.sets,1,20,1)),reps:Math.round(cNum(it.reps,0,100,0)),mode:MODES.includes(it.mode)?it.mode:'reps',dur:it.dur==null?null:Math.round(cNum(it.dur,0,14400,60)),
      repsDone:Array.isArray(it.repsDone)?it.repsDone.slice(0,20).map(v=>Math.round(cNum(v,0,999,0))):null,totalReps:Math.round(cNum(it.totalReps,0,20000,0)),done,...(it.uni===true?{uni:true}:{})}}).filter(Boolean);
  const prs=(Array.isArray(x.prs)?x.prs:[]).slice(0,60).filter(p=>p&&okId(p.exoId)).map(p=>({exoId:p.exoId,name:cStr(p.name,80),w:cNum(p.w,0,2000,0),prev:cNum(p.prev,0,2000,0)}));
  return{id:x.id,tplId:okId(x.tplId)?x.tplId:null,name:cStr(x.name,60)||'Séance',date:cNum(x.date,946684800000,4102444800000,Date.now()),dur:Math.round(cNum(x.dur,0,86400,0)),items,tonnage:cNum(x.tonnage,0,1e7,0),prs}}
function cSettings(o){o=o&&typeof o==='object'?o:{};const r={restSet:Math.round(cNum(o.restSet,0,600,90)),restExo:Math.round(cNum(o.restExo,0,600,120)),sound:o.sound!==false};
  if(o.consent&&typeof o.consent==='object')r.consent={v:cStr(o.consent.v,20),at:cNum(o.consent.at,0,4102444800000,0)};return r}
const cList=(a,f,max)=>(Array.isArray(a)?a:[]).slice(0,max).map(f).filter(Boolean);

/* ---------- history index ---------- */
let IDX={};
function buildIdx(){
  IDX={};const ss=S.sessions.slice().sort((a,b)=>a.date-b.date);
  for(const s of ss)for(const it of s.items){if(!(it.done>0)||it.weight==null)continue;
    const x=IDX[it.exoId]||(IDX[it.exoId]={hist:[],rec:null,last:null});
    const prev=x.hist.length&&x.hist[x.hist.length-1].sid===s.id?x.hist[x.hist.length-1]:null;
    if(prev){prev.w=Math.max(prev.w,it.weight)}else x.hist.push({t:s.date,w:it.weight,sid:s.id});
    if(!x.rec||it.weight>x.rec.w)x.rec={w:it.weight,t:s.date};
    x.last={w:it.weight,t:s.date};
  }
}
const recOf=id=>IDX[id]?.rec||null, lastOf=id=>IDX[id]?.last||null;

/* ---------- cloud save (claude db) ---------- */
let DB=null,UID=null,flushing=false,flushT=null,syncState='local';
const SYNC_TXT={ok:'Sauvegardé',saving:'Sauvegarde…',offline:'Hors ligne · gardé sur le téléphone',retry:'Serveur injoignable · nouvel essai bientôt',local:'Sur ce téléphone uniquement',pending:'En file d\'attente · envoi au retour du réseau',quota:'Espace de sauvegarde plein',wait:'Connexion…'};
function setSync(s){syncState=s;document.querySelectorAll('.sync').forEach(el=>{el.dataset.s=s;const t=el.querySelector('.st-t');if(t)t.textContent=SYNC_TXT[s]})}
const syncChip=()=>`<button class="sync" data-act="tab" data-v="more" data-s="${syncState}"><span class="dot"></span><span class="st-t">${SYNC_TXT[syncState]}</span></button>`;
const metaRef=()=>DB.doc(`data/users/${UID}/meta`);
const activeRef=()=>DB.doc(`data/users/${UID}/active`);
const sessCol=()=>DB.doc(`data/users/${UID}/profile`).collection('sessions');
async function pull(){
  if(!DB)return;
  const m=await metaRef().get();
  if(m.exists){const d=m.data()||{};const ds=d.stamp||0;
    const del=new Set([...(S.deleted||[]),...(d.deleted||[])]);
    if(ds>S.stamp.meta){S.templates=cList(d.templates,cTemplate,200);S.custom=cList(d.custom,cCustom,500);S.settings={...S.settings,...cSettings(d.settings)};S.stamp.meta=ds}
    else if(S.stamp.meta>ds)mark('meta');
    if(del.size!==(d.deleted||[]).length)mark('meta');
    S.deleted=[...del];
  }else if(S.stamp.meta||S.templates.length||S.custom.length){mark('meta')}
  const a=await activeRef().get();
  if(a.exists){const d=a.data()||{};if((d.stamp||0)>S.stamp.active){S.active=d.session||null;S.stamp.active=d.stamp||0}else if(S.stamp.active>(d.stamp||0))mark('active')}
  else if(S.active)mark('active');
  const q=await sessCol().get();const cloud=new Set();const del=new Set(S.deleted);
  for(const doc of q.docs){cloud.add(doc.id);if(del.has(doc.id)){mark('d:'+doc.id);continue}
    if(!S.sessions.some(s=>s.id===doc.id)){const d=cSession(doc.data());if(d)S.sessions.push(d)}}
  for(const s of S.sessions)if(!cloud.has(s.id))mark('s:'+s.id);
  S.sessions.sort((a,b)=>a.date-b.date);
  persist();buildIdx();render();

}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function q(p){if(!p)return;p.catch(()=>{});return Promise.race([p,sleep(5000).then(()=>{queued=true})])}
let queued=false;
async function write(tok){return q(write0(tok))}
function write0(tok){
  if(tok==='meta')return metaRef().set({templates:S.templates,custom:S.custom,settings:S.settings,deleted:S.deleted.slice(-500),stamp:S.stamp.meta});
  if(tok==='active')return activeRef().set({session:S.active,stamp:S.stamp.active});
  if(tok.startsWith('s:')){const s=S.sessions.find(x=>x.id===tok.slice(2));if(s)return sessCol().doc(s.id).set(s);return}
  if(tok.startsWith('d:'))return sessCol().doc(tok.slice(2)).delete();
}
async function flushCheck(){if(!DB||!fs)return;try{await fs.waitForPendingWrites();if(!S.dirty.length)setSync('ok')}catch(e){}}
function flushSoon(){clearTimeout(flushT);flushT=setTimeout(flush,400)}
async function flush(){
  if(!DB){setSync('local');return}
  if(flushing)return;
  if(!S.dirty.length){if(syncState!=='pending')setSync(navigator.onLine===false?'offline':'ok');return}
  flushing=true;setSync('saving');
  queued=false;try{while(S.dirty.length){const tok=S.dirty[0];await write(tok);S.dirty=S.dirty.filter(t=>t!==tok);persist()}setSync(queued?'pending':'ok');if(queued)setTimeout(flushCheck,20000)}
  catch(e){const c=e&&e.code;if(c==='quota_exceeded')setSync('quota');else if(c==='invalid_argument'){S.dirty.shift();persist();setSync('retry');setTimeout(flush,2000)}else if(c==='revoked'||c==='not_granted'){DB=null;setSync('local')}else{setSync(navigator.onLine===false?'offline':'retry');setTimeout(flush,15000)}}
  finally{flushing=false}
}
window.addEventListener('online',()=>{flush();flushCheck()});
window.addEventListener('offline',()=>setSync(DB?'offline':'local'));
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'){if(DB&&!S.active)pull().then(flush).catch(()=>{});else flush();if(S.active)wake()}});
/* ---------- accounts (Firebase) ---------- */
const FBC=window.HEVOR_FIREBASE||null;let fbAuth=null,fs=null,USER=null;
function fbReady(){return !!(window.firebase&&FBC&&FBC.apiKey&&!/^A_REMPLIR/.test(FBC.apiKey))}
/* Plusieurs comptes sur le même appareil : chaque compte a sa propre instance Firebase,
   donc sa propre connexion gardée en mémoire. Changer de compte = recharger sur l'autre instance, sans retaper le mot de passe. */
const ACC_RE=/^(\[DEFAULT\]|acc-[a-z0-9]{4,16})$/,ACC_MAX=5;let ACC_APP='[DEFAULT]',accSwitching=false;
function accList(){try{const a=JSON.parse(localStorage.getItem('hevor.accounts')||'[]');return Array.isArray(a)?a.filter(x=>x&&ACC_RE.test(x.app)&&typeof x.email==='string'&&typeof x.uid==='string').slice(0,ACC_MAX):[]}catch(e){return[]}}
function accSave(a){try{localStorage.setItem('hevor.accounts',JSON.stringify(a.slice(0,ACC_MAX)))}catch(e){}}
function accCur(){let c='';try{c=localStorage.getItem('hevor.acc')||''}catch(e){}return ACC_RE.test(c)?c:'[DEFAULT]'}
function accGo(app){accSwitching=true;try{localStorage.setItem('hevor.acc',app);localStorage.setItem('fonte.view','home')}catch(e){}location.reload()}
function accRemember(u){
  const a=accList(),dup=a.find(x=>x.uid===u.uid&&x.app!==ACC_APP);
  if(dup){fbAuth.signOut().catch(()=>{}).finally(()=>accGo(dup.app));return false}
  const i=a.findIndex(x=>x.app===ACC_APP),e={app:ACC_APP,uid:u.uid,email:String(u.email||'').slice(0,120)};
  if(i>=0)a[i]=e;else a.push(e);accSave(a);try{localStorage.removeItem('hevor.accPrev')}catch(x){}return true;
}
function accForget(app){accSave(accList().filter(x=>x.app!==app))}
function bootAccounts(){
  if(!fbReady()){startApp(null);return}
  ACC_APP=accCur();
  try{const app=ACC_APP==='[DEFAULT]'?firebase.initializeApp(FBC):firebase.initializeApp(FBC,ACC_APP);fbAuth=app.auth();fs=app.firestore();
    try{fs.settings({ignoreUndefinedProperties:true,merge:true})}catch(e){}
    fs.enablePersistence({synchronizeTabs:true}).catch(()=>{});
  }catch(e){startApp(null);return}
  fbAuth.onAuthStateChanged(async u=>{
    if(accSwitching)return;
    if(!u){USER=null;DB=null;UID=null;if(typeof spacesReset==='function')spacesReset();showLogin();return}
    if(!accRemember(u))return;
    USER=u;UID=u.uid;DB=fs;startApp(u);setSync('wait');if(typeof spacesBoot==='function')spacesBoot();
    try{await pull();if(pendingConsent){S.settings.consent={v:LEGAL_V,at:pendingConsent};pendingConsent=0;touchMeta()}await flush()}catch(e){setSync(navigator.onLine===false?'offline':'retry');setTimeout(()=>{pull().then(flush).catch(()=>{})},15000)}
  });
}
function startApp(u){
  loadLocal(u?'hevor.v1:'+u.uid:'hevor.v1:local');
  $('#tabs').hidden=false;document.body.classList.add('has-nav');buildIdx();passScrolled=false;render();if(S.active)ensureTick();if(!u)setSync('local');
}
let loginMode='in',pendingConsent=0,pendingName=null;const LEGAL_V='2026-10-19c';
function showLogin(msg){
  $('#tabs').hidden=true;document.body.classList.remove('has-nav');document.querySelectorAll('.sheet').forEach(e=>e.remove());closeModal();
  const up=loginMode==='up',reset=loginMode==='reset';
  $('#view').innerHTML=`<div class="wrap"><div class="login"><div class="logo xl">${LOGO}</div><div><div class="brand">Hevor</div><div class="sub muted">${reset?'Reçois un lien pour choisir un nouveau mot de passe.':up?'Crée ton compte pour sauvegarder tes séances.':'Ton carnet de musculation. Connecte-toi pour retrouver tes séances.'}</div></div>
   <form id="login-form" novalidate>${up?`<div class="ed-grid"><div class="field"><label for="lg-first">Prénom</label><input id="lg-first" autocomplete="given-name" maxlength="30" required></div><div class="field"><label for="lg-last">Nom</label><input id="lg-last" autocomplete="family-name" maxlength="30" required></div></div><p class="small muted" style="margin:-4px 0 0">Ton nom reste privé. Il n'est visible que par les coachs et équipes que tu rejoins, pour qu'ils sachent qui tu es.</p>`:''}<div class="field"><label for="lg-mail">E-mail</label><input id="lg-mail" type="email" autocomplete="email" inputmode="email" required></div>
   ${reset?'':`<div class="field"><label for="lg-pass">Mot de passe</label><input id="lg-pass" type="password" autocomplete="${up?'new-password':'current-password'}" minlength="${up?8:6}" required></div>`}
   ${up?`<label class="consent" for="lg-ok"><input type="checkbox" id="lg-ok"><span>J'accepte les <button type="button" class="linkin" data-act="legal" data-k="cgu">conditions d'utilisation</button> et j'ai lu la <button type="button" class="linkin" data-act="legal" data-k="privacy">politique de confidentialité</button>.</span></label>`:''}
   <p class="err" id="lg-err" role="alert">${esc(msg||'')}</p>
   <button class="btn primary block" type="submit">${reset?'Envoyer le lien':up?'Créer mon compte':'Se connecter'}</button></form>
   <div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap">${reset?'<button class="linkbtn" data-act="lg-mode" data-m="in">Retour à la connexion</button>':up?'<button class="linkbtn" data-act="lg-mode" data-m="in">J\'ai déjà un compte</button>':'<button class="linkbtn" data-act="lg-mode" data-m="up">Créer un compte</button><button class="linkbtn" data-act="lg-mode" data-m="reset">Mot de passe oublié</button>'}</div>
   ${accBackRow()}
   ${installHint()}
   <p class="legal-foot"><button class="linkin" data-act="legal" data-k="privacy">Confidentialité</button> · <button class="linkin" data-act="legal" data-k="cgu">Conditions d'utilisation</button> · <button class="linkin" data-act="legal" data-k="legal">Mentions légales</button></p></div></div>`;
  $('#login-form').addEventListener('submit',loginSubmit);
}
function accBackRow(){const o=accList().filter(x=>x.app!==ACC_APP);if(!o.length)return'';
  return `<div class="acc-back"><div class="small muted">Comptes déjà connectés sur cet appareil</div>${o.map(x=>`<button class="linkbtn" data-act="acc-switch" data-app="${esc(x.app)}">Revenir à ${esc(x.email)}</button>`).join('')}</div>`}
const AUTHERR={'auth/invalid-email':'Adresse e-mail invalide.','auth/missing-password':'Indique ton mot de passe.','auth/weak-password':'Mot de passe trop faible : au moins 8 caractères.','auth/email-already-in-use':'Un compte existe déjà avec cet e-mail. Connecte-toi.','auth/invalid-credential':'E-mail ou mot de passe incorrect.','auth/wrong-password':'E-mail ou mot de passe incorrect.','auth/user-not-found':'Aucun compte avec cet e-mail.','auth/too-many-requests':'Trop d\'essais. Réessaie dans quelques minutes.','auth/network-request-failed':'Pas de connexion. Il faut du réseau pour te connecter la première fois.'};
async function loginSubmit(e){
  e.preventDefault();const mail=$('#lg-mail').value.trim(),pass=$('#lg-pass')?.value||'',err=$('#lg-err'),btn=e.target.querySelector('button[type=submit]');
  err.textContent='';
  if(loginMode==='up'){const fi=($('#lg-first').value||'').trim().replace(/\s+/g,' ').slice(0,30),la=($('#lg-last').value||'').trim().replace(/\s+/g,' ').slice(0,30);if(!fi||!la){err.textContent='Indique ton prénom et ton nom.';return}pendingName={first:fi,last:la};if(pass.length<8){err.textContent='Choisis un mot de passe d\'au moins 8 caractères.';return}if(!$('#lg-ok').checked){err.textContent='Accepte les conditions d\'utilisation pour créer ton compte.';return}pendingConsent=Date.now()}
  if(loginMode!=='up'){pendingName=null}
  btn.disabled=true;
  try{if(loginMode==='reset'){await fbAuth.sendPasswordResetEmail(mail);loginMode='in';showLogin('Lien envoyé. Regarde tes e-mails puis connecte-toi.');return}
    if(loginMode==='up')await fbAuth.createUserWithEmailAndPassword(mail,pass);else await fbAuth.signInWithEmailAndPassword(mail,pass);}
  catch(x){pendingName=null;pendingConsent=0;err.textContent=AUTHERR[x&&x.code]||'Connexion impossible. Réessaie.';btn.disabled=false}
}
const isStandalone=()=>window.matchMedia&&matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
function installHint(){
  if(isStandalone())return'';
  const ios=/iPhone|iPad|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
  if(!ios&&!/Android|Mobile/.test(navigator.userAgent)&&matchMedia('(pointer:fine)').matches)return `<div class="install"><div><b>Installe Hevor sur ton ordinateur.</b><br>Dans Chrome ou Edge : clique sur l'icône d'installation à droite de la barre d'adresse. Hevor s'ouvrira dans sa propre fenêtre.</div></div>`;
  return `<div class="install"><div><b>Installe Hevor sur ton écran d'accueil.</b><br>${ios?'Dans Safari : bouton Partager, puis « Sur l\'écran d\'accueil ».':'Dans Chrome : menu ⋮, puis « Installer l\'application » ou « Ajouter à l\'écran d\'accueil ».'}</div></div>`;
}

/* ---------- UI state ---------- */
const APP_VERSION='2.9.0';let delAsk=false;
let navStack=[];
function pushNav(){try{history.pushState({hevor:1},'')}catch(e){}}
const backBtn=()=>navStack.length?`<button class="icon-btn backb" data-act="go-back" aria-label="Retour">${ICON.back}</button>`:'';
function goBack(){
  if($('#modal')){closeModal();return true}
  const sheets=[...document.querySelectorAll('.sheet')];
  if(sheets.length){const top=sheets.sort((a,b)=>(+b.style.zIndex)-(+a.style.zIndex))[0];const b=top.querySelector('[data-back]');if(b){b.click()}else top.remove();return true}
  if(navStack.length){VIEW=navStack.pop();try{localStorage.setItem('fonte.view',VIEW)}catch(e){}render();window.scrollTo(0,0);return true}
  if(VIEW==='lib'&&libB.folder){libB.folder=null;render();return true}
  return false;
}
window.addEventListener('popstate',()=>{if(!goBack())return});let logoutAsk=false;
let VIEW='home';try{VIEW=localStorage.getItem('fonte.view')||'home'}catch(e){}
const libB={folder:null,q:''};
let pick=null;      // {sel:Set, folder, q, target:'editor'|'session'}
let ed=null;        // template draft
let edConfirm=false;
let menuOpen=-1;
let statsExo=null;
let histOpen=null;

/* ---------- render: main views ---------- */
function render(){
  if(document.getElementById('sheet-acc'))renderAcc();
  if(typeof spRender==='function'&&spRender())return;
  document.querySelectorAll('.tab').forEach(b=>b.setAttribute('aria-current',b.dataset.v===VIEW?'page':'false'));
  const v=$('#view');
  v.innerHTML=VIEW==='pass'?viewPass():VIEW==='lib'?viewLib():VIEW==='stats'?viewStats():VIEW==='more'?viewMore():viewHome();
  if(VIEW==='stats')requestAnimationFrame(drawStats);
  document.body.classList.toggle('on-pass',VIEW==='pass');document.documentElement.classList.toggle('on-pass',VIEW==='pass');
  if(VIEW==='pass'){fitPassTop();if(!passScrolled){passScrolled=true;scrollToCur(false)}setupTiles()}else if(tileObs){tileObs.disconnect();tileObs=null}
  if(VIEW==='pass')registerAnim();
  if(VIEW!=='pass')passScrolled=false;
  if(S.active&&$('#sheet-session'))renderSession();
}
function tplMin(t){let s=0;t.items.forEach((it,i)=>{s+=it.sets*(modeOf(it)==='time'?(it.dur||60):40)+(it.sets-1)*it.restSet+(i<t.items.length-1?it.restExo:0)});return Math.max(5,Math.round(s/60/5)*5)}
function lastDoneTpl(id){for(let i=S.sessions.length-1;i>=0;i--)if(S.sessions[i].tplId===id)return S.sessions[i].date;return null}
function viewHome(){
  const now=Date.now();
  let h=`<div class="wrap"><header class="top">${backBtn()}<div class="logo-row"><div class="logo">${LOGO}</div><div><div class="brand">Hevor</div><div class="sub">${new Date(now).toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'})}</div></div></div>${typeof spPill==='function'?spPill():''}</header>`;
  if(S.active){const a=S.active,done=a.items.reduce((n,it)=>n+it.done.filter(Boolean).length,0),tot=a.items.reduce((n,it)=>n+it.done.length,0);
    h+=`<div class="banner"><div><small>Séance en cours</small><br><b>${esc(a.name)}</b><div class="small">${done}/${tot} séries · ${Math.round((now-a.start)/60000)} min</div></div><button class="btn" data-act="resume">Reprendre</button></div>`}
  h+=`<section><div class="h2">Mes séances</div>`;
  if(!S.templates.length){
    h+=`<div class="card empty"><div class="fig">${figSVG(EXMAP['dc-barre'],1)}</div><h3>Crée ta première séance</h3><p>Choisis tes exercices dans la bibliothèque, fixe séries, reps et temps de repos. Tu la relanceras en un geste à chaque entraînement.</p>
      <button class="btn primary block" data-act="new-tpl">Nouvelle séance</button><button class="btn ghost block" data-act="samples">Ajouter 3 séances exemples (modifiables)</button></div>`;
  }else{
    for(const t of S.templates){const ld=lastDoneTpl(t.id);
      h+=`<article class="card tpl"><div class="tpl-top"><div class="tpl-figs">${t.items.slice(0,3).map(it=>`<div class="fig">${figSVG(exo(it.exoId,it.name),1)}</div>`).join('')}</div>
        <div style="min-width:0"><h3>${esc(t.name)}</h3><p>${t.items.length} exercice${t.items.length>1?'s':''} · env. ${tplMin(t)} min${ld?' · faite '+ago(ld):''}</p></div></div>
        <div class="tpl-actions"><button class="btn primary" data-act="start" data-id="${esc(t.id)}" ${S.active?'disabled':''}>Démarrer</button><button class="btn ghost" data-act="edit" data-id="${esc(t.id)}">Modifier</button></div></article>`}
    h+=`<button class="btn line" data-act="new-tpl">+ Nouvelle séance</button>`;
  }
  h+=`</section><section><div class="h2">Historique<span class="small">${S.sessions.length} séance${S.sessions.length>1?'s':''}</span></div>`;
  if(!S.sessions.length)h+=`<p class="muted small" style="margin:0">Tes séances terminées s'afficheront ici avec le poids total soulevé.</p>`;
  else h+=`<div class="list">`+S.sessions.slice().reverse().slice(0,20).map(s=>{const d=new Date(s.date);
    return `<button class="hist" data-act="hist" data-id="${esc(s.id)}"><div class="d"><b>${d.getDate()}</b><span>${d.toLocaleDateString('fr-FR',{month:'short'}).replace('.','')}</span></div><div class="m"><div>${esc(s.name)}</div><span class="small muted">${s.items.filter(i=>i.done>0).length} exercices · ${Math.round(s.dur/60)} min${s.prs?.length?` · <b style="color:var(--pr)">${s.prs.length} record${s.prs.length>1?'s':''}</b>`:''}</span></div><div class="t num">${fmtKg(s.tonnage)}</div></button>`}).join('')+`</div>`;
  h+=`</section></div>`;return h;
}
function exoRow(e,mode,sel){
  const r=recOf(e.id);
  return `<button class="row ${sel?'sel':''}" data-act="${mode==='pick'?'pick-toggle':'exo-open'}" data-id="${esc(e.id)}"><div class="fig sm">${figSVG(e,1)}</div><div class="m"><div>${esc(e.name)}</div><small>${EQ[e.eq]||''}${r?` · record <b>${fmtKg(r.w)}</b>`:''}</small></div>${mode==='pick'?`<span class="chk">${ICON.check}</span>`:ICON.chev}</button>`;
}
function browseRes(B,mode){
  const sel=mode==='pick'?pick.sel:null;
  if(B.q.trim()){const q=norm(B.q.trim());const r=allExos().filter(e=>norm(e.name).includes(q)||norm(e.al||'').includes(q)||norm(EQ[e.eq]||'').includes(q));
    return r.length?`<div class="list">${r.map(e=>exoRow(e,mode,sel&&sel.has(e.id))).join('')}</div>`:`<p class="muted">Aucun exercice ne correspond. Tu peux le créer depuis l'onglet Exercices.</p>`}
  if(B.folder){const c=CATS.find(c=>c.id===B.folder);const r=allExos().filter(e=>e.cat===B.folder);
    return `<button class="back" data-act="${mode}-folder" data-id="">${ICON.back}Tous les dossiers</button><div class="folder-title">${esc(c.name)}</div><div class="list">${r.map(e=>exoRow(e,mode,sel&&sel.has(e.id))).join('')}</div>`}
  return `<div class="folders">${CATS.map(c=>{const n=allExos().filter(e=>e.cat===c.id).length;return `<button class="folder" style="--fc:var(--c-${c.col})" data-act="${mode}-folder" data-id="${c.id}"><div class="fig">${figSVG({pat:c.pat,eq:CATDEF[c.id]},1)}</div><b><i class="dot"></i>${esc(c.name)}</b><span>${n} exercices</span></button>`}).join('')}</div>`;
}
function viewLib(){
  return `<div class="wrap"><header class="top">${backBtn()}<div><div class="brand">Exercices</div><div class="sub">${allExos().length} exercices rangés par zone</div></div>${typeof spPill==='function'?spPill():''}</header>
  <div class="search">${ICON.search}<input id="lib-q" type="search" placeholder="Chercher un exercice, une machine…" value="${esc(libB.q)}" autocomplete="off"></div>
  <section id="lib-res">${browseRes(libB,'lib')}</section>
  <section><button class="btn line" data-act="custom-new">+ Créer un exercice</button></section></div>`;
}
let passScrolled=false;
const MAP_W=360,MANOR_LV=[8,23,38,53,68,83,98],MAP_TOP=430,MAP_BOT=310,TILE=900;
const MAP_FIGS=['squat','dc-barre','tractions','souleve','dm-barre','curl-halt','hip-thrust','fentes','kb-swing','box-jump','rowing-barre','presse','dips','elev-lat','power-clean','face-pull','pompes','releve-jambes','planche','tapis'];
function rng(seed){return()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
let MAP=null;
function buildMap(){
  if(MAP)return MAP;
  const r=rng(20261017),steps=[];let sum=0;for(let i=0;i<99;i++){const st=168+r()*26;steps.push(st);sum+=st}
  const H=Math.round(MAP_TOP+sum+MAP_BOT);
  const pts=[];let y=H-MAP_BOT;
  for(let i=0;i<100;i++){const x=180+118*Math.sin(i*1.75+0.7*Math.sin(i*0.31))+(r()-.5)*26;pts.push({x,y});y-=steps[i]||0}
  const manors=MANOR_LV.map((L,k)=>({L,side:k%2?1:-1}));
  manors.forEach(m=>{for(let j=m.L-2;j<=m.L;j++){if(j<0||j>99)continue;const p=pts[j];p.x=m.side<0?Math.max(p.x,236+r()*30):Math.min(p.x,124-r()*30)}});
  pts.forEach(p=>{p.x=Math.max(64,Math.min(296,p.x))});
  manors.forEach(m=>{const p=pts[m.L-1];m.x=m.side<0?78:282;m.y=p.y+30});
  const figs=[];for(let L=5;L<=100;L+=5){const a=pts[L-1],b=pts[Math.min(99,L)],mx=(a.x+b.x)/2,my=(a.y+b.y)/2,side=mx>180?-1:1;figs.push({L,ex:MAP_FIGS[L/5-1],x:Math.max(46,Math.min(314,mx+side*118)),y:my})}
  const road=[];for(let i=0;i<pts.length;i++){road.push(pts[i]);if(i<pts.length-1){const a=pts[i],b=pts[i+1],mx=(a.x+b.x)/2,my=(a.y+b.y)/2,bend=(i%2?1:-1)*(26+r()*22);road.push({x:Math.max(40,Math.min(320,mx+bend)),y:my})}}
  const d=smoothPath(road);
  const segs=[];for(let i=0;i<road.length-1;i++){const a=road[i],b=road[i+1];for(let t=0;t<=1;t+=.2)segs.push({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t})}
  const near=(x,y,pad)=>{for(const q of segs){if(Math.abs(q.y-y)<pad&&Math.hypot(q.x-x,q.y-y)<pad)return true}return false};
  const free=(x,y,pad)=>{if(near(x,y,pad))return false;
    for(const p of pts){if(Math.abs(x-p.x)<70&&y>p.y-46&&y<p.y+86)return false}
    for(const m of manors){if(Math.abs(x-m.x)<92&&y>m.y-160&&y<m.y+30)return false}
    for(const f of figs){if(Math.abs(x-f.x)<48&&Math.abs(y-f.y)<54)return false}return true};
  const sc=[];
  for(let i=0;i<H/5;i++){const x=r()*MAP_W,y=r()*H;if(free(x,y,36))sc.push({t:'grass',x,y,s:.7+r()*.8,v:r()})}
  for(let i=0;i<H/70;i++){const x=r()*MAP_W,y=r()*H;if(free(x,y,40))sc.push({t:'rock',x,y,s:.6+r()*1.1,v:r()})}
  for(let i=0;i<H/110;i++){const x=r()*MAP_W,y=r()*H;if(free(x,y,44))sc.push({t:'log',x,y,s:.8+r()*.5,v:r()})}
  for(const q of segs){if(r()<.05){const side=r()<.5?-1:1,x=q.x+side*(34+r()*10),y=q.y+(r()-.5)*20;if(free(x,y,30))sc.push({t:'mush',x,y,s:.8+r()*.5,v:r()})}}
  for(let yy=-20;yy<H+30;yy+=26){for(let xx=0;xx<MAP_W+20;xx+=24){const tx=xx+(r()-.5)*20,ty=yy+(r()-.5)*20;if(r()<.12)continue;if(!free(tx,ty,58))continue;
    const k=r();sc.push({t:k<.12?'oak':k<.2?'bush':'pine',x:tx,y:ty,s:.75+r()*.75,v:Math.floor(r()*3),w:r()})}}
  sc.sort((a,b)=>a.y-b.y);
  const fog=[];for(let i=0;i<H/170;i++)fog.push({x:r()*MAP_W,y:r()*H,r:110+r()*150,c:r()<.6?'rgba(140,60,64,.20)':'rgba(0,0,0,.35)'});
  const emb=[];for(let i=0;i<H/34;i++)emb.push({x:r()*MAP_W,y:r()*H,r:.5+r()*1.2,a:.15+r()*.5});
  const spk=[];for(let i=0;i<H/3;i++)spk.push({x:r()*MAP_W,y:r()*H,r:.6+r()*2.2,c:r()<.5?'rgba(0,0,0,.35)':'rgba(90,38,42,.22)'});
  let ov=`<defs><radialGradient id="wglow"><stop offset="0" stop-color="#E07B4A" stop-opacity=".45"/><stop offset="1" stop-color="#E07B4A" stop-opacity="0"/></radialGradient></defs>`;
  for(const m of manors)ov+=manorSVG(m.x,m.y,m.side,r);
  MAP={H,pts,road,d,figs,manors,sc,fog,emb,spk,ov,tiles:Math.ceil(H/TILE)};return MAP;
}
function manorSVG(x,y,side,r){
  const W='#2b1719',RF='#130a0b',TR='#4a2326',win=()=>r()<.7?'#E07B4A':'#2a1214';
  const g=(xx,yy,w,h)=>`<rect x="${xx}" y="${yy}" width="${w}" height="${h}" rx="1.5" fill="${win()}"/>`;
  let s=`<g transform="translate(${x} ${y}) scale(${side<0?1:-1} 1)">`;
  s+=`<ellipse cx="0" cy="4" rx="84" ry="11" fill="#050303" opacity=".75"/><circle cx="0" cy="-50" r="74" fill="url(#wglow)" opacity=".55"/>`;
  s+=`<rect x="-72" y="-46" width="24" height="46" fill="${W}" stroke="#0f0808" stroke-width="1.5"/><path d="M-76 -46L-60 -66L-44 -46Z" fill="${RF}"/>`;
  s+=`<rect x="48" y="-46" width="24" height="46" fill="${W}" stroke="#0f0808" stroke-width="1.5"/><path d="M44 -46L60 -66L76 -46Z" fill="${RF}"/>`;
  s+=`<rect x="-50" y="-72" width="100" height="72" fill="${W}" stroke="#0f0808" stroke-width="1.5"/>`;
  s+=`<path d="M-50 -72H50" stroke="#1a0d0e" stroke-width="1"/>`+[-58,-44,-30].map(yy=>`<path d="M-50 ${yy}H50" stroke="#24131500" stroke-width="1"/>`).join('');
  s+=`<path d="M-56 -72L-28 -102L0 -72Z" fill="${RF}"/><path d="M0 -72L28 -102L56 -72Z" fill="${RF}"/><path d="M-56 -72H56" stroke="${TR}" stroke-width="3"/>`;
  s+=`<rect x="-14" y="-112" width="28" height="44" fill="${W}" stroke="#0f0808" stroke-width="1.5"/><path d="M-19 -112L0 -146L19 -112Z" fill="${RF}"/><path d="M0 -146V-154" stroke="${TR}" stroke-width="2"/>`;
  s+=`<rect x="30" y="-112" width="9" height="22" fill="#1a0d0e"/>`+g(-6,-104,12,14);
  [-42,-24,16,34].forEach(xx=>{s+=g(xx,-62,9,13);s+=g(xx,-36,9,13)});
  s+=g(-66,-34,12,12)+g(54,-34,12,12);
  s+=`<path d="M-9 0V-22Q0 -32 9 -22V0Z" fill="#0c0606"/><path d="M-9 0V-22Q0 -32 9 -22V0" fill="none" stroke="#E07B4A" stroke-opacity=".5" stroke-width="1.5"/>`;
  s+=`<path d="M-92 2H92" stroke="#1a0d0e" stroke-width="2"/>`+Array.from({length:12},(_,i)=>`<path d="M${-88+i*16} 2V-10l2 -4 2 4V2" fill="#1a0d0e"/>`).join('');
  return s+`</g>`;
}
function smoothPath(p){if(!p.length)return'';let d=`M${p[0].x.toFixed(1)} ${p[0].y.toFixed(1)}`;for(let i=0;i<p.length-1;i++){const a=p[i-1]||p[i],b=p[i],c=p[i+1],e=p[i+2]||c;
  d+=` C${(b.x+(c.x-a.x)/6).toFixed(1)} ${(b.y+(c.y-a.y)/6).toFixed(1)} ${(c.x-(e.x-b.x)/6).toFixed(1)} ${(c.y-(e.y-b.y)/6).toFixed(1)} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`}return d}
/* ---- forêt dessinée en canvas, par tuiles, seulement près de l'écran ---- */
const PINE=[['#5c232a','#3c161c','#230c11','#6e2c33'],['#4c1c23','#321318','#1c0a0e','#5f252c'],['#3f181d','#291015','#17090b','#4f1f25']];
function ell(g,x,y,rx,ry){g.beginPath();g.ellipse(x,y,Math.max(.1,rx),Math.max(.1,ry),0,0,Math.PI*2);g.fill()}
const DRAW={
  grass(g,o){const s=o.s;g.lineCap='round';g.lineWidth=1.3*s;g.strokeStyle=o.v<.5?'#3e191c':'#56232a';g.beginPath();
    for(const[dx,h]of[[-2.6,5],[0,7.5],[2.6,5.5],[-1.2,6.2]]){g.moveTo(o.x+dx*s*.4,o.y);g.quadraticCurveTo(o.x+dx*s*.6,o.y-h*s*.6,o.x+dx*s,o.y-h*s)}g.stroke()},
  rock(g,o){const s=o.s;g.fillStyle='rgba(0,0,0,.5)';ell(g,o.x+2*s,o.y+2*s,9*s,4*s);g.fillStyle='#1d1213';g.beginPath();g.moveTo(o.x-8*s,o.y+1*s);g.lineTo(o.x-6*s,o.y-5*s);g.lineTo(o.x+1*s,o.y-8*s);g.lineTo(o.x+7*s,o.y-4*s);g.lineTo(o.x+8*s,o.y+1*s);g.closePath();g.fill();
    g.fillStyle='#3a2826';g.beginPath();g.moveTo(o.x-6*s,o.y-5*s);g.lineTo(o.x+1*s,o.y-8*s);g.lineTo(o.x+2*s,o.y-3*s);g.lineTo(o.x-4*s,o.y-1*s);g.closePath();g.fill()},
  log(g,o){const s=o.s,a=(o.v-.5)*.8;g.save();g.translate(o.x,o.y);g.rotate(a);g.fillStyle='rgba(0,0,0,.45)';ell(g,2,3*s,16*s,4*s);g.fillStyle='#24120f';g.fillRect(-15*s,-3.5*s,30*s,7*s);g.fillStyle='#3a1f19';g.fillRect(-15*s,-3.5*s,30*s,2.5*s);
    g.fillStyle='#4a2a22';ell(g,15*s,0,2.6*s,3.5*s);g.fillStyle='#2a1612';ell(g,15*s,0,1.2*s,1.8*s);g.restore()},
  mush(g,o){const s=o.s,gr=g.createRadialGradient(o.x,o.y-3*s,0,o.x,o.y-3*s,14*s);gr.addColorStop(0,'rgba(224,123,74,.35)');gr.addColorStop(1,'rgba(224,123,74,0)');g.fillStyle=gr;g.fillRect(o.x-14*s,o.y-17*s,28*s,28*s);
    g.fillStyle='#d9c3b8';g.fillRect(o.x-.9*s,o.y-3*s,1.8*s,3.5*s);g.fillStyle='#C9625F';g.beginPath();g.ellipse(o.x,o.y-3*s,3.6*s,2.4*s,0,Math.PI,0);g.fill();g.fillStyle='#f3d2c8';ell(g,o.x-1.2*s,o.y-4*s,.5*s,.5*s)},
  bush(g,o){const s=o.s,P=PINE[o.v];g.fillStyle='rgba(0,0,0,.45)';ell(g,o.x+3*s,o.y+2*s,13*s,4*s);
    [[-6,-4,7,2],[5,-4,7,2],[0,-8,8,1],[-3,-9,5,0],[4,-10,4,3]].forEach(([dx,dy,rr,c])=>{g.fillStyle=P[c];ell(g,o.x+dx*s,o.y+dy*s,rr*s,rr*s*.9)})},
  oak(g,o){const s=o.s,P=PINE[o.v];g.fillStyle='rgba(0,0,0,.5)';ell(g,o.x+5*s,o.y+2*s,17*s,5*s);g.fillStyle='#140809';g.fillRect(o.x-2.2*s,o.y-12*s,4.4*s,13*s);
    [[0,-20,13,2],[-9,-15,9,2],[9,-15,9,1],[-5,-25,9,1],[6,-26,8,1],[-6,-23,6,0],[2,-29,5,0],[-10,-18,4,3]].forEach(([dx,dy,rr,c])=>{g.fillStyle=P[c];ell(g,o.x+dx*s,o.y+dy*s,rr*s,rr*s)})},
  pine(g,o){const s=o.s,P=PINE[o.v],w=15*s,h=48*s,x=o.x,y=o.y;
    g.fillStyle='rgba(0,0,0,.5)';ell(g,x+5*s,y+2*s,w*1.15,4.5*s);
    g.fillStyle='#120708';g.fillRect(x-1.8*s,y-9*s,3.6*s,10*s);
    for(let k=0;k<4;k++){const tw=w*(1-k*.2),base=y-6*s-k*h*.19,top=base-h*.36*(1-k*.06),jag=2.2*s;
      g.fillStyle=P[0];g.beginPath();g.moveTo(x,top);g.lineTo(x-tw,base);g.lineTo(x-tw*.66,base-jag);g.lineTo(x-tw*.42,base+jag*.5);g.lineTo(x-tw*.18,base-jag*.8);g.lineTo(x,base+jag*.6);g.closePath();g.fill();
      g.fillStyle=P[1];g.beginPath();g.moveTo(x,top);g.lineTo(x,base+jag*.6);g.lineTo(x+tw*.2,base-jag*.7);g.lineTo(x+tw*.45,base+jag*.4);g.lineTo(x+tw*.7,base-jag);g.lineTo(x+tw,base);g.closePath();g.fill();
      g.fillStyle=P[2];g.beginPath();g.moveTo(x+tw*.45,base+jag*.4);g.lineTo(x+tw*.7,base-jag);g.lineTo(x+tw,base);g.lineTo(x+tw*.72,base+jag*.3);g.closePath();g.fill();
      if(o.w>.55){g.strokeStyle=P[3];g.lineWidth=.9*s;g.beginPath();g.moveTo(x-tw*.15,top+(base-top)*.35);g.lineTo(x-tw*.5,base-jag*.4);g.stroke()}}}
};
function paintForest(g,M,y0,y1){
  g.fillStyle='#130a0b';g.fillRect(0,y0-2,MAP_W,y1-y0+4);
  for(const f of M.fog){if(f.y+f.r<y0||f.y-f.r>y1)continue;const gr=g.createRadialGradient(f.x,f.y,0,f.x,f.y,f.r);gr.addColorStop(0,f.c);gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.fillRect(f.x-f.r,f.y-f.r,2*f.r,2*f.r)}
  for(const p of M.spk){if(p.y<y0-4||p.y>y1+4)continue;g.fillStyle=p.c;ell(g,p.x,p.y,p.r,p.r*.7)}
  const rp=M.rp||(M.rp=new Path2D(M.d));g.lineCap='round';g.lineJoin='round';
  g.strokeStyle='rgba(0,0,0,.55)';g.lineWidth=66;g.stroke(rp);
  g.strokeStyle='#2c1a17';g.lineWidth=50;g.stroke(rp);
  g.strokeStyle='#3d2622';g.lineWidth=42;g.stroke(rp);
  g.strokeStyle='rgba(88,56,48,.55)';g.lineWidth=20;g.stroke(rp);
  g.setLineDash([1.5,7]);g.strokeStyle='rgba(15,8,8,.45)';g.lineWidth=34;g.stroke(rp);g.setLineDash([3,13]);g.strokeStyle='rgba(110,70,60,.35)';g.lineWidth=26;g.stroke(rp);g.setLineDash([]);
  for(const o of M.sc){if(o.y<y0-100||o.y>y1+40)continue;DRAW[o.t](g,o)}
  for(const e of M.emb){if(e.y<y0-4||e.y>y1+4)continue;g.fillStyle=`rgba(224,123,74,${e.a})`;ell(g,e.x,e.y,e.r,e.r)}
}
let tileObs=null;
function drawTile(c,M){
  if(c.dataset.on)return;const i=+c.dataset.i,y0=i*TILE,y1=Math.min(M.H,y0+TILE);
  const cw=c.clientWidth,ch=c.clientHeight;if(!cw||!ch)return;
  const dpr=Math.min(2,window.devicePixelRatio||1);c.width=Math.round(cw*dpr);c.height=Math.round(ch*dpr);
  const g=c.getContext('2d');const k=cw/MAP_W*dpr,ky=c.height/(y1-y0);g.setTransform(k,0,0,ky,0,-y0*ky);
  paintForest(g,M,y0,y1);c.dataset.on='1';
}
const TILE_CACHE=new Map();
function setupTiles(){
  if(tileObs)tileObs.disconnect();const M=buildMap();
  document.querySelectorAll('.map-tile').forEach(ph=>{const old=TILE_CACHE.get(ph.dataset.i);if(old&&old.dataset.on&&old.clientWidth===0&&Math.abs(old.width-Math.round(ph.clientWidth*Math.min(2,window.devicePixelRatio||1)))<2){old.setAttribute('style',ph.getAttribute('style'));ph.replaceWith(old)}});
  const cv=[...document.querySelectorAll('.map-tile')];cv.forEach(c=>TILE_CACHE.set(c.dataset.i,c));
  const vh=window.innerHeight;cv.forEach(c=>{const b=c.getBoundingClientRect();if(b.bottom>-vh&&b.top<2*vh)drawTile(c,M)});
  if(!('IntersectionObserver' in window)){cv.forEach(c=>drawTile(c,M));return}
  tileObs=new IntersectionObserver(es=>{for(const e of es){const c=e.target;if(e.isIntersecting)drawTile(c,M);else if(c.dataset.on){c.width=0;c.height=0;c.dataset.on='';TILE_CACHE.delete(c.dataset.i)}}},{rootMargin:'1500px 0px'});
  cv.forEach(c=>tileObs.observe(c));
}
function fitPassTop(){const pt=document.querySelector('.pass-top'),m=document.getElementById('map');if(pt&&m)m.style.marginTop=(-pt.offsetHeight)+'px'}
function levelPct(T,P){if(T.n<=P.lvl)return 100;if(T.n===P.lvl+1)return P.pct;return 0}
function viewPass(){
  const P=passAt(totalKg()),M=buildMap(),H=M.H,pts=M.pts;
  const done=P.lvl?smoothPath(M.road.slice(0,Math.min(M.road.length,P.lvl*2+1))):'';
  let h=`<div class="wrap map-wrap"><div class="pass-top"><header class="top ptop">${backBtn()}<div><div class="brand">Niveaux</div></div>${typeof spPill==='function'?spPill():''}</header>
  <section class="pass-hero2"><div class="ph-emo">${P.no?P.no.emo:'🏆'}</div>
   <div class="ph-main"><div class="ph-k">Niveau</div><div class="ph-lvl num">${P.lvl}<span>/100</span></div>${P.done?'<div class="ph-next">Tout est débloqué !</div>':`<div class="ph-next">Prochain : <b>${esc(P.no.name)}</b></div>`}</div>
   <div class="ph-side"><button class="ph-go" data-act="map-cur">Voir mon niveau ↓</button><div class="ph-tot">Total soulevé<b class="num">${fmtT(P.t)}</b></div></div>
   ${P.done?'':`<div class="pbar"><i style="width:${P.pct.toFixed(1)}%"></i></div><div class="ph-row num"><span>${fmtT(P.into)} / ${fmtT(P.need)}</span><span>encore ${fmtT(P.need-P.into)}</span></div>`}</section></div>
  <div class="map" id="map" style="aspect-ratio:${MAP_W}/${H}">`;
  for(let i=0;i<M.tiles;i++){const y0=i*TILE,th=Math.min(TILE,H-y0);h+=`<canvas class="map-tile" data-i="${i}" style="top:${(y0/H*100).toFixed(4)}%;height:${(th/H*100).toFixed(4)}%"></canvas>`}
  h+=`<svg class="map-svg" viewBox="0 0 ${MAP_W} ${H}" preserveAspectRatio="none" aria-hidden="true">${M.ov}${done?`<path d="${done}" class="road-done"/>`:''}</svg>`;
  for(const f of M.figs)h+=`<div class="fig anim mapfig" data-hum="1" data-ex="${f.ex}" style="left:${(f.x/MAP_W*100).toFixed(2)}%;top:${(f.y/H*100).toFixed(3)}%">${figHuman(exo(f.ex),0)}</div>`;
  const R0=30,C=2*Math.PI*R0;
  TIERS.forEach((T,i)=>{const p=pts[i],pct=levelPct(T,P),st=T.n<=P.lvl?'done':T.n===P.lvl+1?'cur':'lock';
    h+=`<button class="nd ${st} ${T.mile?'mile':''}" style="left:${(p.x/MAP_W*100).toFixed(2)}%;top:${(p.y/H*100).toFixed(3)}%" data-act="nd" data-n="${T.n}" ${st==='cur'?'id="nd-cur"':''} aria-label="Niveau ${T.n} : ${esc(T.name)}">
     <svg class="ring" viewBox="0 0 72 72"><circle cx="36" cy="36" r="${R0}" class="rg-bg"/><circle cx="36" cy="36" r="${R0}" class="rg-fg" ${pct<=0?'style="display:none"':''} stroke-dasharray="${(C*pct/100).toFixed(2)} ${C.toFixed(2)}" transform="rotate(-90 36 36)"/></svg>
     <span class="nd-in">${T.emo}</span><span class="nd-n num">${T.n}</span>${st==='done'?'<span class="nd-ok">✓</span>':''}
     <span class="nd-lab"><b>${esc(T.name)}</b><small class="num">${fmtT(T.thr)}</small></span></button>`});
  h+=`</div></div>`;return h;
}
/* bonhomme plus réaliste (volumes, ombre, membres arrière plus sombres) pour la carte */
function figHuman(ex,t){
  const p=PAT[ex.pat]||PAT.squat,q=poseAt(p,t),eq=ex.eq,L='#efe0da',Dk='#9a7e79',HAIR='#2b1517';
  const f=n=>n.toFixed(1),seg=(a,b,w,c)=>`<line x1="${f(a[0])}" y1="${f(a[1])}" x2="${f(b[0])}" y2="${f(b[1])}" stroke="${c}" stroke-width="${w}" stroke-linecap="round"/>`;
  const head=(Hh,N)=>{const nx=N[0]+(Hh[0]-N[0])*.45,ny=N[1]+(Hh[1]-N[1])*.45;return seg(N,[nx,ny],4.6,L)+`<circle cx="${f(Hh[0])}" cy="${f(Hh[1])}" r="7.4" fill="${L}"/><path d="M${f(Hh[0]-7.2)} ${f(Hh[1]-1)}a7.3 7.3 0 0 1 14.4 0q-3 -2.6 -7.2 -2.6t-7.2 2.6z" fill="${HAIR}"/>`};
  const foot=(K,F,c)=>F[1]>=80?seg(F,[F[0]+(F[0]>=K[0]?6:5),Math.min(93.5,F[1]+1.5)],4.2,c):'';
  let s=`<ellipse cx="50" cy="94.5" rx="24" ry="3.6" fill="rgba(0,0,0,.5)"/>`;
  (p.props||[]).forEach(k=>{s+=PROPS[k](q)});
  const hand=p.to==='F'?q.F:q.W;
  if(eq==='P'||eq==='E'){const a=eq==='E'?(p.anc||[96,hand[1]]):(p.pul||[60,-6]);const cls=eq==='E'?'bd':'cb';s+=ln(a,hand,cls);if(p.sym){s+=ln(mir(a),mir(hand),cls)}}
  if(p.sym){const S=q.S||q.N,Q=q.Q||q.P;
    s+=seg(Q,q.K,9,L)+seg(q.K,q.F,7,L)+seg(mir(Q),mir(q.K),9,L)+seg(mir(q.K),mir(q.F),7,L);
    s+=`<path d="M${f(S[0]-1)} ${f(S[1])}L${f(100-S[0]+1)} ${f(S[1])}L${f(100-Q[0])} ${f(Q[1])}L${f(Q[0])} ${f(Q[1])}Z" fill="${L}" stroke="${L}" stroke-width="5" stroke-linejoin="round"/>`;
    s+=`<path d="M${f(Q[0])} ${f(Q[1]-2)}L${f(100-Q[0])} ${f(Q[1]-2)}" stroke="${Dk}" stroke-width="3"/>`;
    s+=seg(S,q.E,6.6,L)+seg(q.E,q.W,5.6,L)+seg(mir(S),mir(q.E),6.6,L)+seg(mir(q.E),mir(q.W),5.6,L)+head(q.H,q.N);
    if(eq==='B'){const y=q.W[1],x1=q.W[0]-12,x2=100-q.W[0]+12;s+=`<line x1="${f(x1)}" y1="${f(y)}" x2="${f(x2)}" y2="${f(y)}" class="cb" style="stroke-width:2.6"/><rect x="${f(x1-2)}" y="${f(y-8)}" width="4" height="16" rx="1.5" class="eqf"/><rect x="${f(x2-2)}" y="${f(y-8)}" width="4" height="16" rx="1.5" class="eqf"/>`}
    else if(eq==='H')s+=dumb(q.W)+dumb(mir(q.W));else if(eq==='K')s+=kb(q.W)+kb(mir(q.W));
    return `<svg viewBox="0 -10 100 106" aria-hidden="true">${s}</svg>`}
  if(q.k)s+=seg(q.P,q.k,8.4,Dk)+seg(q.k,q.f,6.6,Dk)+foot(q.k,q.f,Dk);
  if(q.e)s+=seg(q.N,q.e,6.2,Dk)+seg(q.e,q.w,5.2,Dk);
  s+=seg(q.P,q.K,9.4,L)+seg(q.K,q.F,7.2,L)+(p.notoe?'':foot(q.K,q.F,L));
  s+=seg(q.N,q.P,12,L);
  const tm=[q.N[0]+(q.P[0]-q.N[0])*.55,q.N[1]+(q.P[1]-q.N[1])*.55];s+=seg(tm,q.P,5,'#d8c4bd');
  if(eq==='B'&&p.bar){const o=p.off||[0,0],c=q[p.bar];s+=plate([c[0]+o[0],c[1]+o[1]])}
  s+=head(q.H,q.N);
  s+=seg(q.N,q.E,7,L)+seg(q.E,q.W,5.8,L)+`<circle cx="${f(q.W[0])}" cy="${f(q.W[1])}" r="2.8" fill="${L}"/>`;
  if(eq==='B'&&!p.bar)s+=plate(q.W);else if(eq==='H')s+=dumb(q.W);else if(eq==='K')s+=kb(q.W);
  else if(eq==='M'&&p.legm)s+=`<circle cx="${f(q.F[0])}" cy="${f(q.F[1]-1)}" r="3.6" class="eqf"/>`;
  return `<svg viewBox="0 -10 100 106" aria-hidden="true">${s}</svg>`;
}
function scrollToCur(smooth){const c=document.getElementById('nd-cur')||document.querySelector('.nd.done:last-of-type');if(c)c.scrollIntoView({block:'center',behavior:smooth?'smooth':'auto'})}
function viewStats(){
  let h=`<div class="wrap"><header class="top">${backBtn()}<div><div class="brand">Stats</div><div class="sub">Ta progression, séance après séance</div></div>${typeof spPill==='function'?spPill():''}</header>`;
  if(!S.sessions.length)return h+`<div class="card empty"><div class="fig">${figSVG(EXMAP['squat'],1)}</div><h3>Pas encore de données</h3><p>Termine une première séance : le poids soulevé, tes records et ta progression par exercice apparaîtront ici.</p></div></div>`;
  const tot=S.sessions.reduce((a,s)=>a+s.tonnage,0);const m30=S.sessions.filter(s=>s.date>Date.now()-30*864e5).length;
  h+=`<div class="tiles"><div class="tile"><span>Séances</span><b class="num">${S.sessions.length}</b></div><div class="tile"><span>30 derniers j</span><b class="num">${m30}</b></div><div class="tile"><span>Total soulevé</span><b class="num">${tot>=1000?fmtN(tot/1000)+' t':fmtKg(tot)}</b></div></div>`;
  h+=`<section class="card"><div class="chart-h"><b>Poids soulevé par séance</b><span class="small muted">${Math.min(12,S.sessions.length)} dernières</span></div><canvas class="chart" id="c-ton"></canvas></section>`;
  const ids=Object.keys(IDX).sort((a,b)=>IDX[b].hist.length-IDX[a].hist.length);
  if(ids.length){if(!statsExo||!IDX[statsExo])statsExo=ids[0];const x=IDX[statsExo],first=x.hist[0].w,last=x.hist[x.hist.length-1].w,diff=last-first;
    h+=`<section class="card"><div class="field" style="margin-bottom:10px"><label for="st-exo">Progression par exercice</label><select id="st-exo">${ids.map(id=>`<option value="${id}" ${id===statsExo?'selected':''}>${esc(exo(id).name)} (${IDX[id].hist.length})</option>`).join('')}</select></div>
    <canvas class="chart" id="c-exo"></canvas>
    <div class="kv"><span class="chip" style="background:var(--pr-soft);color:var(--pr)">Record ${fmtKg(x.rec.w)} · ${dfr(x.rec.t)}</span><span class="chip">Départ ${fmtKg(first)}</span><span class="chip">${diff>=0?'+':''}${fmtKg(diff)}${first>0?` (${diff>=0?'+':''}${Math.round(diff/first*100)} %)`:''}</span></div></section>`}
  h+=`<section><button class="btn primary block" data-act="pdf">Exporter le bilan en PDF</button><p class="small muted" style="margin:0">Le PDF contient le poids soulevé par séance et une courbe de progression pour chaque exercice.</p></section></div>`;
  return h;
}
function viewMore(){
  const st=S.settings;
  return `<div class="wrap"><header class="top">${backBtn()}<div><div class="brand">Réglages</div><div class="sub">Sauvegarde et préférences</div></div>${typeof spPill==='function'?spPill():''}</header>
  ${USER&&typeof spacesUsed==='function'?`<section class="card"><div class="h2">Mes espaces</div><p class="small muted" style="margin:0 0 6px">Chaque espace est séparé : ton espace « Moi » reste privé.</p><div class="legal-list">
   <button class="row" data-act="sp-go" data-v="club"><div class="m"><div>Club</div><small>${teamsOf('club').length?teamsOf('club').length+' équipe'+(teamsOf('club').length>1?'s':''):'Créer ou rejoindre une équipe'}</small></div>${ICON.chev}</button>
   <button class="row" data-act="sp-go" data-v="coach"><div class="m"><div>Coaching</div><small>${teamsOf('coach').length?coachSub(teamsOf('coach')):'Coacher des clients ou rejoindre ton coach'}</small></div>${ICON.chev}</button>
   <button class="row" data-act="sp-home"><div class="m"><div>Espace d'accueil</div><small>Celui qui s'ouvre au lancement</small></div>${ICON.chev}</button></div></section>`:''}
  <section class="card"><div class="h2" style="margin-bottom:4px">Sauvegarde</div>
   <p style="margin:0">${syncChip()}</p>
   <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap"><button class="btn ghost" data-act="export-json">Exporter une copie</button><button class="btn ghost" data-act="import-json">Importer une copie</button></div></section>
  ${USER?`<section class="card"><div class="legal-list"><button class="row" data-act="acc-open"><span class="acc-av" aria-hidden="true">${esc((USER.email||'?').charAt(0).toUpperCase())}</span><div class="m"><div>Gérer mon compte</div><small>${esc(USER.email||'')}</small></div>${ICON.chev}</button></div></section>`:''}
  <section class="card"><div class="h2">Informations légales</div><div class="legal-list"><button class="row" data-act="legal" data-k="privacy"><div class="m"><div>Politique de confidentialité</div><small>Tes données et tes droits</small></div>${ICON.chev}</button><button class="row" data-act="legal" data-k="cgu"><div class="m"><div>Conditions d'utilisation</div><small>Règles d'usage et santé</small></div>${ICON.chev}</button><button class="row" data-act="legal" data-k="legal"><div class="m"><div>Mentions légales</div><small>Éditeur et hébergeurs</small></div>${ICON.chev}</button></div></section>
  <section class="card"><div class="h2">Repos par défaut</div>
   <div class="ed-grid">${stepper('Entre séries',st.restSet,'set-rs')}${stepper('Entre exercices',st.restExo,'set-re')}</div>
   <div class="set-row"><div><div style="font-weight:600">Bip et vibration</div><div class="small muted">À la fin de chaque temps de repos</div></div><button class="toggle" data-act="sound" aria-pressed="${!!st.sound}" aria-label="Bip et vibration"></button></div></section>
  <section class="card"><div class="h2">Mettre Hevor sur l'écran d'accueil</div>
   <ol class="steps small"><li><b>iPhone :</b> dans Safari, bouton Partager puis « Sur l'écran d'accueil ».</li><li><b>Android :</b> dans Chrome, menu ⋮ puis « Installer l'application ».</li><li><b>Ordinateur :</b> dans Chrome ou Edge, icône d'installation à droite de la barre d'adresse.</li></ol>
   <p class="small muted" style="margin:8px 0 0">Une fois installée, Hevor s'ouvre même sans réseau. Les séances faites hors ligne partent sur ton compte au retour de la connexion.</p></section>
  <p class="small muted" style="text-align:center;margin:18px 0 0">Hevor · version ${APP_VERSION}</p></div>`;
}
function stepper(label,val,act,i,k,fmt){
  const disp=fmt==='n'?val:mmss(val);
  const out=k==='dur'?`<button type="button" class="num stp-val" data-act="dur-pick" data-src="${act}" data-i="${i}" aria-label="Choisir la durée : ${disp}">${disp}</button>`:`<output class="num">${disp}</output>`;
  return `<div class="stp"><span>${label}</span><div><button data-act="${act}" data-d="-1" ${i!=null?`data-i="${i}" data-k="${k}"`:''} aria-label="Moins">−</button>${out}<button data-act="${act}" data-d="1" ${i!=null?`data-i="${i}" data-k="${k}"`:''} aria-label="Plus">+</button></div></div>`;
}

/* ---------- feuille « Mon compte » ---------- */
function renderAcc(){
  if(!USER){closeSheet('acc');return}
  const list=accList(),others=list.filter(x=>x.app!==ACC_APP);
  const row=x=>`<button class="row" data-act="acc-switch" data-app="${esc(x.app)}"><span class="acc-av" aria-hidden="true">${esc(x.email.charAt(0).toUpperCase()||'?')}</span><div class="m"><div>${esc(x.email)}</div><small>Passer sur ce compte</small></div>${ICON.chev}</button>`;
  const h=sheetHead('Mon compte','acc-close')+`<div class="sheet-b"><div class="wrap" style="display:flex;flex-direction:column;gap:12px">
   <section class="card"><div class="acc-me"><span class="acc-av lg" aria-hidden="true">${esc((USER.email||'?').charAt(0).toUpperCase())}</span><div><div style="font-weight:700">${esc(USER.email||'')}</div><div class="small muted">Compte connecté</div></div></div>${typeof spNameRow==='function'?spNameRow():''}</section>
   <section class="card"><div class="h2">Changer de compte</div><div class="legal-list">${others.map(row).join('')}${list.length<ACC_MAX?`<button class="row" data-act="acc-add"><span class="acc-av add" aria-hidden="true">+</span><div class="m"><div>Ajouter un compte</div><small>Une autre adresse e-mail</small></div>${ICON.chev}</button>`:''}</div>
</section>
   <section class="card">${logoutAsk?`<div class="confirm"><p>${S.dirty.length?'Des données ne sont pas encore envoyées. Reconnecte-toi au réseau avant de te déconnecter.':'Te déconnecter de '+esc(USER.email||'ce compte')+' sur cet appareil ?'}</p><div class="r"><button class="btn ghost" data-act="logout-no">Annuler</button>${S.dirty.length?'':'<button class="btn danger" data-act="logout-yes">Se déconnecter</button>'}</div></div>`:'<button class="btn ghost block" data-act="logout">Se déconnecter</button>'}
    ${delAsk?`<form class="confirm" id="del-form" style="margin-top:10px" novalidate><p>Supprimer définitivement ton compte et toutes tes séances ? Cette action est irréversible. Pense à exporter une copie avant.</p><div class="field"><label for="del-pass">Ton mot de passe pour confirmer</label><input id="del-pass" type="password" autocomplete="current-password"></div><p class="err" id="del-err" role="alert"></p><div class="r"><button type="button" class="btn ghost" data-act="del-no">Annuler</button><button type="submit" class="btn danger">Supprimer mon compte</button></div></form>`:'<button class="linkbtn danger-link" style="margin-top:6px" data-act="del-ask">Supprimer mon compte</button>'}</section>
  </div></div>`;
  const el=openSheet('acc',h);const f=el.querySelector('#del-form');if(f&&!f.dataset.b){f.dataset.b='1';f.addEventListener('submit',deleteAccount)}
}
const accRe=()=>{if(document.getElementById('sheet-acc'))renderAcc();else render()};

/* ---------- sélecteur de durée, façon minuteur iPhone ---------- */
const DUR_MAX=14400,WH=40;let durCb=null;
function durBump(v,dir){v=v||60;const st=dir>0?(v<60?5:v<600?15:v<3600?60:300):(v<=60?5:v<=600?15:v<=3600?60:300);return Math.min(DUR_MAX,Math.max(5,v+dir*st))}
function wheelCol(id,n,step,unit,lab){let h='';for(let k=0;k<n;k++)h+=`<div class="whi">${unit==='h'?k*step:String(k*step).padStart(2,'0')}</div>`;return `<div class="whc"><div class="whl" id="${id}" tabindex="0" role="listbox" aria-label="${lab}">${h}</div><span class="whu">${unit}</span></div>`}
function openDurPicker(val,cb){
  durCb=cb;val=Math.max(5,Math.min(DUR_MAX,val||60));
  modal(`<div class="k">Durée</div>
   <div class="wheel"><div class="whbar" aria-hidden="true"></div>${wheelCol('wh-h',5,1,'h','Heures')}${wheelCol('wh-m',60,1,'min','Minutes')}${wheelCol('wh-s',12,5,'s','Secondes')}</div>
   <div class="dur-quick">${[[30,'30 s'],[60,'1 min'],[300,'5 min'],[900,'15 min'],[1800,'30 min'],[3600,'1 h']].map(([v,l])=>`<button class="chip" data-act="dur-q" data-v="${v}">${l}</button>`).join('')}</div>
   <div class="acts"><button class="btn primary" data-act="dur-ok">Valider</button><button class="btn ghost" data-act="modal-close">Annuler</button></div>`);
  durSet(val,false);
}
function durSet(v,smooth){const ks=[Math.floor(v/3600),Math.floor(v%3600/60),Math.round(v%60/5)];['wh-h','wh-m','wh-s'].forEach((id,n)=>{const el=document.getElementById(id);if(el)el.scrollTo({top:ks[n]*WH,behavior:smooth?'smooth':'auto'})});durMark()}
function durRead(){const g=id=>{const el=document.getElementById(id);return el?Math.max(0,Math.round(el.scrollTop/WH)):0};return Math.min(DUR_MAX,g('wh-h')*3600+g('wh-m')*60+g('wh-s')*5)}
function durMark(){document.querySelectorAll('.whl').forEach(el=>{const k=Math.round(el.scrollTop/WH);[...el.children].forEach((c,j)=>c.classList.toggle('on',j===k))})}
document.addEventListener('scroll',e=>{if(e.target.classList&&e.target.classList.contains('whl'))durMark()},true);
document.addEventListener('keydown',e=>{const el=e.target;if(!el.classList||!el.classList.contains('whl'))return;if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();el.scrollBy({top:e.key==='ArrowDown'?WH:-WH,behavior:'smooth'})}else if(e.key==='Enter'){e.preventDefault();ACT['dur-ok']()}});

/* ---------- sheets ---------- */
function openSheet(id,html){let el=document.getElementById('sheet-'+id);if(!el){pushNav();el=document.createElement('div');el.id='sheet-'+id;el.className='sheet';el.style.zIndex=40+document.querySelectorAll('.sheet').length;document.body.appendChild(el)}el.innerHTML=html;return el}
function closeSheet(id){document.getElementById('sheet-'+id)?.remove()}
const sheetHead=(title,closeAct,extra='')=>`<div class="sheet-h"><button class="icon-btn" data-act="${closeAct}" data-back="1" aria-label="Retour">${ICON.back}</button><h2>${esc(title)}</h2>${extra}</div>`;

/* editor */
function openEditor(id){const t=id&&S.templates.find(x=>x.id===id);ed=t?clone(t):{id:gid(),name:'',items:[],isNew:true};edConfirm=false;renderEditor()}
function renderEditor(){
  const sc=document.querySelector('#sheet-editor .sheet-b')?.scrollTop||0;
  let h=sheetHead(ed.isNew?'Nouvelle séance':'Modifier la séance','ed-close')+`<div class="sheet-b"><div class="wrap" style="display:flex;flex-direction:column;gap:12px">
   <div class="field"><label for="ed-name">Nom de la séance</label><input id="ed-name" value="${esc(ed.name)}" placeholder="Ex. Push, Haut du corps, Jambes" autocomplete="off"></div>`;
  if(!ed.items.length)h+=`<p class="muted" style="margin:4px 0">Ajoute des exercices depuis la bibliothèque. Tu régleras ensuite séries, reps et repos pour chacun.</p>`;
  ed.items.forEach((it,i)=>{const e=exo(it.exoId,it.name);
    h+=`<div class="card ed-item"><div class="ed-top"><div class="fig sm">${figSVG(e,1)}</div><div class="nm">${esc(e.name)}<small>${EQ[e.eq]||''}</small></div>
      <button class="icon-btn" data-act="ed-move" data-i="${i}" data-d="-1" aria-label="Monter" ${i===0?'disabled':''}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 15l6-6 6 6"/></svg></button>
      <button class="icon-btn" data-act="ed-move" data-i="${i}" data-d="1" aria-label="Descendre" ${i===ed.items.length-1?'disabled':''}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 9l6 6 6-6"/></svg></button>
      <button class="icon-btn" data-act="ed-del" data-i="${i}" aria-label="Retirer">${ICON.close}</button></div>
      <div class="seg" role="group" aria-label="Type de série">${[['reps','Reps'],['max','Max'],['time','Durée']].map(([m,l])=>`<button data-act="ed-mode" data-i="${i}" data-m="${m}" aria-pressed="${modeOf(it)===m}">${l}</button>`).join('')}</div>${uniRow(it,'ed-uni',i)}
      <div class="ed-grid">${stepper('Séries',it.sets,'ed-stp',i,'sets','n')}${modeOf(it)==='reps'?stepper('Reps',it.reps,'ed-stp',i,'reps','n'):modeOf(it)==='time'?stepper('Durée',it.dur||60,'ed-stp',i,'dur'):'<div class="ed-note">Tu noteras tes reps à chaque série</div>'}${stepper('Repos entre séries',it.restSet,'ed-stp',i,'restSet')}${stepper('Repos après l\'exo',it.restExo,'ed-stp',i,'restExo')}</div></div>`});
  h+=`<button class="btn line" data-act="ed-add">+ Ajouter des exercices</button>`;
  if(!ed.isNew)h+=edConfirm?`<div class="confirm"><p>Supprimer « ${esc(ed.name||'cette séance')} » ? L'historique déjà enregistré est conservé.</p><div class="r"><button class="btn ghost" data-act="ed-del-no">Annuler</button><button class="btn danger" data-act="ed-del-yes">Supprimer</button></div></div>`:`<button class="btn danger" data-act="ed-del-tpl">Supprimer cette séance</button>`;
  h+=`</div></div><div class="sheet-f"><div class="in"><button class="btn primary" data-act="ed-save">Enregistrer</button></div></div>`;
  const el=openSheet('editor',h);el.querySelector('.sheet-b').scrollTop=sc;
}
const LIM={sets:[1,10,1],reps:[1,100,1],dur:[5,14400,5],restSet:[0,600,15],restExo:[0,600,15]};
const TIMEIDS=new Set(['planche','gainage-lat','copenhague','iso-dos','iso-tractions','equilibre','corde','tapis','velo','rameur','elliptique','escalier','assault-bike']);
const newItem=id=>{const st=S.settings,t=TIMEIDS.has(id);return{exoId:id,sets:3,reps:10,mode:t?'time':'reps',dur:t?60:60,restSet:st.restSet,restExo:st.restExo}};
const modeOf=it=>it.mode||'reps';
const uniOk=it=>!!it.uni&&modeOf(it)!=='time',uniS=it=>uniOk(it)?' / côté':'';
function uniRow(it,act,i){if(modeOf(it)==='time')return '';return `<div class="uni-row"><div><div class="t">Un côté à la fois</div><div class="small muted">Une jambe ou un bras : les reps comptent pour chaque côté (×2 dans le poids soulevé)</div></div><button class="toggle" data-act="${act}" data-i="${i}" aria-pressed="${!!it.uni}" aria-label="Un côté à la fois"></button></div>`}
function volTxt(it){const m=modeOf(it);return m==='time'?`${it.sets} × ${mmss(it.dur||60)}`:m==='max'?`${it.sets} × max${uniS(it)}`:`${it.sets} × ${it.reps} reps${uniS(it)}`}

/* picker */
function openPicker(target){pick={sel:new Set(),folder:null,q:'',target};renderPicker()}
function renderPicker(){
  const n=pick.sel.size;
  const h=sheetHead('Ajouter des exercices','pick-close')+`<div class="sheet-b"><div class="wrap"><div class="search">${ICON.search}<input id="pick-q" type="search" placeholder="Chercher un exercice…" value="${esc(pick.q)}" autocomplete="off"></div><section id="pick-res">${browseRes(pick,'pick')}</section></div></div>
   <div class="sheet-f"><div class="in"><button class="btn primary" data-act="pick-done" ${n?'':'disabled'}>${n?`Ajouter ${n} exercice${n>1?'s':''}`:'Sélectionne des exercices'}</button></div></div>`;
  const sc=document.querySelector('#sheet-picker .sheet-b')?.scrollTop||0;
  const el=openSheet('picker',h);el.querySelector('.sheet-b').scrollTop=sc;
}

/* exercise detail */
let animEls=[];
function openExo(id){
  const e=exo(id),x=IDX[id],cat=CATS.find(c=>c.id===e.cat);const isCustom=!EXMAP[id];
  let h=sheetHead(e.name,'exo-close')+`<div class="sheet-b"><div class="wrap" style="display:flex;flex-direction:column;gap:14px">
   <div class="fig lg anim" data-ex="${id}">${figSVG(e,0)}</div>
   <div class="chips" style="justify-content:flex-start"><span class="chip">${esc(cat?cat.name:'')}</span><span class="chip">${EQ[e.eq]||''}</span>${isCustom?'<span class="chip">Perso</span>':''}</div>
   <div class="stats3"><div class="st rec"><span class="lbl">Record</span><b>${x?fmtKg(x.rec.w):'—'}</b><small>${x?dfr(x.rec.t):'pas encore'}</small></div><div class="st"><span class="lbl">Dernière fois</span><b>${x?fmtKg(x.last.w):'—'}</b><small>${x?ago(x.last.t):'jamais faite'}</small></div><div class="st"><span class="lbl">Séances</span><b>${x?x.hist.length:0}</b><small>avec cet exo</small></div></div>`;
  if(x&&x.hist.length>1)h+=`<div class="card"><div class="chart-h"><b>Progression</b><span class="small muted">poids max par séance</span></div><canvas class="chart" id="c-detail"></canvas></div>`;
  if(isCustom)h+=`<button class="btn danger" data-act="custom-del" data-id="${esc(id)}">Supprimer cet exercice perso</button>`;
  h+=`</div></div>`;
  openSheet('exo',h);registerAnim();
  if(x&&x.hist.length>1)requestAnimationFrame(()=>{const cv=$('#c-detail');if(cv)drawChart(cv,{type:'line',labels:x.hist.map(p=>dfr(p.t)),values:x.hist.map(p=>p.w),rec:x.rec.w})});
}
function openCustom(){
  const h=sheetHead('Créer un exercice','custom-close')+`<div class="sheet-b"><div class="wrap" style="display:flex;flex-direction:column;gap:12px">
   <div class="field"><label for="cu-name">Nom</label><input id="cu-name" placeholder="Ex. Presse inclinée Hammer" autocomplete="off"></div>
   <div class="field"><label for="cu-cat">Dossier</label><select id="cu-cat">${CATS.map(c=>`<option value="${c.id}">${esc(c.name)}</option>`).join('')}</select></div>
   <div class="field"><label for="cu-eq">Matériel</label><select id="cu-eq">${Object.entries(EQ).map(([k,v])=>`<option value="${k}">${v}</option>`).join('')}</select></div>
   <div class="field"><label for="cu-pat">Illustration</label><select id="cu-pat">${PATLIST.map(([k,v])=>`<option value="${k}">${v}</option>`).join('')}</select></div>
   <div class="fig lg" id="cu-prev">${figSVG({pat:'bench',eq:'C'},1)}</div></div></div>
   <div class="sheet-f"><div class="in"><button class="btn primary" data-act="custom-save">Créer l'exercice</button></div></div>`;
  openSheet('custom',h);const upd=()=>{$('#cu-prev').innerHTML=figSVG({pat:$('#cu-pat').value,eq:$('#cu-eq').value},1)};
  $('#cu-cat').addEventListener('change',()=>{$('#cu-pat').value=CATS.find(c=>c.id===$('#cu-cat').value).pat;upd()});['#cu-eq','#cu-pat'].forEach(s=>$(s).addEventListener('change',upd));
  $('#cu-pat').value='bench';upd();
}
const PATLIST=[['bench','Développé allongé'],['incline','Développé incliné'],['chestpress','Poussée assise'],['fly','Écarté'],['pushup','Pompe'],['dips','Dips'],['pullup','Traction'],['pulldown','Tirage vertical'],['row','Rowing buste penché'],['seatedrow','Tirage assis'],['deadlift','Soulevé de terre'],['shrug','Shrug'],['ohp','Développé au-dessus de la tête'],['lateral','Élévation latérale'],['frontraise','Élévation frontale'],['facepull','Face pull'],['curl','Curl'],['preacher','Curl pupitre'],['pushdown','Extension poulie haute'],['skull','Barre au front'],['ohext','Extension nuque'],['squat','Squat'],['lunge','Fente'],['legpress','Presse'],['legext','Leg extension'],['legcurl','Leg curl allongé'],['hipthrust','Hip thrust'],['glutebridge','Pont fessier'],['abduction','Abduction'],['calf','Mollets debout'],['crunch','Crunch'],['plank','Gainage'],['hangraise','Relevé de jambes'],['run','Course'],['bike','Vélo'],['rower','Rameur'],['boxjump','Saut sur box'],['rotext','Rotation d\'épaule'],['nordic','Nordic']];

/* history detail */
function openHist(id){
  const s=S.sessions.find(x=>x.id===id);if(!s)return;histOpen={id,confirm:false};renderHist();
}
function renderHist(){
  const s=S.sessions.find(x=>x.id===histOpen.id);if(!s){closeSheet('hist');return}
  
  let h=sheetHead(s.name,'hist-close')+`<div class="sheet-b"><div class="wrap" style="display:flex;flex-direction:column;gap:12px">
   <div class="card" style="display:flex;gap:14px;align-items:center"><div style="font-size:44px">🏋️</div><div><div class="small muted" style="text-transform:capitalize">${new Date(s.date).toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</div><div style="font-family:var(--f-display);font-size:28px;font-weight:700" class="num">${fmtKg(s.tonnage)}</div><div class="small muted">${Math.round(s.dur/60)} min · ${s.items.reduce((n,i)=>n+i.done,0)} séries</div></div></div>
   <div class="list">${s.items.map(it=>{const e=exo(it.exoId,it.name);const pr=(s.prs||[]).some(p=>p.exoId===it.exoId);return `<div class="row"><div class="fig sm">${figSVG(e,1)}</div><div class="m"><div>${esc(e.name)}</div><small>${it.mode==='max'?`${it.done}/${it.sets} séries max : ${(it.repsDone||[]).join(', ')} reps${it.uni?' / côté':''}`:it.mode==='time'?`${it.done}/${it.sets} séries × ${mmss(it.dur||60)}`:`${it.done}/${it.sets} séries × ${it.reps} reps${it.uni?' / côté':''}`}${pr?' · <b>record</b>':''}</small></div><div class="t num" style="font-family:var(--f-display);font-weight:700;font-size:19px">${it.weight!=null?fmtKg(it.weight):'—'}</div></div>`}).join('')}</div>`;
  h+=histOpen.confirm?`<div class="confirm"><p>Supprimer cette séance de l'historique ? Les records seront recalculés.</p><div class="r"><button class="btn ghost" data-act="hist-del-no">Annuler</button><button class="btn danger" data-act="hist-del-yes">Supprimer</button></div></div>`:`<button class="btn danger" data-act="hist-del">Supprimer cette séance</button>`;
  h+=`</div></div>`;openSheet('hist',h);
}

/* ---------- live session ---------- */
let wakeLock=null;
async function wake(){try{if(navigator.wakeLock&&!wakeLock){wakeLock=await navigator.wakeLock.request('screen');wakeLock.addEventListener('release',()=>{wakeLock=null})}}catch(e){}}
function startSession(id){
  const t=S.templates.find(x=>x.id===id);if(!t||S.active)return;
  S.active={id:gid(),tplId:t.id,name:t.name,start:Date.now(),items:t.items.map(it=>({...it,mode:modeOf(it),name:exo(it.exoId).name,weight:'',done:Array(it.sets).fill(false),repsDone:Array(it.sets).fill('')})),timer:null};
  touchActive(0);openSession();render();
}
function openSession(){menuOpen=-1;openSheet('session','');renderSession();wake();ensureTick()}
function curIndex(){return S.active.items.findIndex(it=>!it.done.every(Boolean))}
function renderSession(){
  const a=S.active;const el=document.getElementById('sheet-session');if(!a||!el)return;
  const sc=el.querySelector('.sheet-b')?.scrollTop||0;const ci=curIndex();
  let h=`<div class="sheet-h sess-h"><button class="icon-btn" data-act="sess-min" aria-label="Réduire">${ICON.back}</button><h2>${esc(a.name)}</h2><span class="elapsed num" id="elapsed">${mmss((Date.now()-a.start)/1000)}</span><button class="btn primary" style="min-height:38px;padding:0 12px" data-act="sess-end">Terminer</button></div>
   <div class="sheet-b"><div class="wrap" style="display:flex;flex-direction:column;gap:12px">`;
  a.items.forEach((it,i)=>{h+=sessCard(it,i,i===ci)});
  h+=`<button class="btn line" data-act="sess-add">+ Ajouter un exercice à cette séance</button></div></div><div id="rest-slot"></div>`;
  el.innerHTML=h;el.querySelector('.sheet-b').scrollTop=sc;registerAnim();updateRest();
}
function sessCard(it,i,cur){
  const e=exo(it.exoId,it.name),rec=recOf(it.exoId),last=lastOf(it.exoId);
  const all=it.done.every(Boolean),w=parseW(it.weight),isPR=w!=null&&rec&&w>rec.w;
  return `<article class="sc ${all?'done':''} ${cur?'cur':''}" id="sc-${i}">
   <div class="sc-head"><div class="fig ${cur?'anim':''}" data-ex="${it.exoId}">${figSVG(e,cur?0:1)}</div>
    <div class="sc-title"><h3>${esc(e.name)}</h3><p>${volTxt(it)} · repos ${mmss(it.restSet)}${all?' · terminé':''}</p></div>
    <button class="icon-btn" data-act="sx-menu" data-i="${i}" aria-label="Options de l'exercice">${ICON.more}</button></div>
   ${menuOpen===i?`<div class="sc-menu"><button class="btn ghost" data-act="sx-move" data-i="${i}" data-d="-1" ${i===0?'disabled':''}>Monter</button><button class="btn ghost" data-act="sx-move" data-i="${i}" data-d="1" ${i===S.active.items.length-1?'disabled':''}>Descendre</button><button class="btn ghost" data-act="sx-addset" data-i="${i}">+1 série</button><button class="btn ghost" data-act="sx-delset" data-i="${i}" ${it.done.length<=1?'disabled':''}>−1 série</button><button class="btn danger" data-act="sx-del" data-i="${i}">Retirer</button></div>`:''}
   <div class="stats3">
    <div class="st rec"><span class="lbl">Record</span><b class="num">${rec?fmtKg(rec.w):'—'}</b><small>${rec?dfr(rec.t):'pas encore'}</small></div>
    <div class="st"><span class="lbl">Dernière fois</span><b class="num">${last?fmtKg(last.w):'—'}</b><small>${last?ago(last.t):'première fois'}</small></div>
    <label class="st in" for="w-${i}"><span class="lbl">Aujourd'hui</span><span class="inrow"><input id="w-${i}" data-wi="${i}" inputmode="decimal" enterkeyhint="done" placeholder="${last?numStr(last.w):'0'}" value="${esc(it.weight)}" autocomplete="off" aria-label="Poids aujourd'hui en kg"><span>kg</span></span><small class="${isPR?'prtag':''}" id="prt-${i}">${isPR?'Nouveau record !':'&nbsp;'}</small></label>
   </div>
   <div class="sets">${it.done.map((d,j)=>setHTML(it,i,j,d)).join('')}</div>
  </article>`;
}
function setHTML(it,i,j,d){
  const m=modeOf(it),t=S.active.timer,run=t&&t.kind==='work'&&t.i===i&&t.j===j;
  if(m==='max'){const v=(it.repsDone||[])[j]??'';return `<div class="set max ${d?'on':''}"><span class="sn">Série ${j+1}</span><input id="r-${i}-${j}" data-ri="${i}" data-rj="${j}" inputmode="numeric" placeholder="${uniOk(it)?'reps / côté':'reps'}" value="${esc(v)}" autocomplete="off" aria-label="Reps faites série ${j+1}${uniOk(it)?' par côté':''}"><button class="ck" data-act="set" data-i="${i}" data-j="${j}" aria-pressed="${d}" aria-label="Valider la série ${j+1}">✓</button></div>`}
  if(m==='time')return `<button class="set ${d?'on':''} ${run?'run':''}" data-act="set" data-i="${i}" data-j="${j}" aria-pressed="${d}"><span class="sn">${run?'En cours':'Série '+(j+1)}</span><span class="sr">${d?mmss(it.dur||60):run?'…':'▶ '+mmss(it.dur||60)}</span><span class="ck">✓</span></button>`;
  return `<button class="set ${d?'on':''}" data-act="set" data-i="${i}" data-j="${j}" aria-pressed="${d}"><span class="sn">Série ${j+1}</span><span class="sr">${it.reps} reps${uniS(it)}</span><span class="ck">✓</span></button>`;
}
function afterSetDone(i){
  const a=S.active,it=a.items[i],all=it.done.every(Boolean);
  if(!all){const nx=it.done.indexOf(false);startTimer('set',it.restSet,`Série ${nx+1} · ${exo(it.exoId,it.name).name}`)}
  else{const ni=curIndex();if(ni>=0){startTimer('exo',it.restExo,exo(a.items[ni].exoId,a.items[ni].name).name)}else{a.timer=null;toast('Toutes les séries sont validées. Termine ta séance quand tu veux.')}}
  touchActive(400);renderSession();
  if(all){const ni=curIndex();if(ni>=0)setTimeout(()=>document.getElementById('sc-'+ni)?.scrollIntoView({behavior:'smooth',block:'start'}),120)}
}
function toggleSet(i,j){
  const a=S.active,it=a.items[i];if(!it)return;
  const m=modeOf(it),t=a.timer;
  if(it.done[j]){it.done[j]=false;touchActive();renderSession();return}
  if(m==='time'&&t&&t.kind==='work'&&t.i===i&&t.j===j){a.timer=null;it.done[j]=true;afterSetDone(i);return}
  if(m==='max'&&!(parseInt((it.repsDone||[])[j],10)>0)){const box=$(`#r-${i}-${j}`);const c=box?.closest('.set');c?.classList.remove('shake');void c?.offsetWidth;c?.classList.add('shake');box?.focus();toast('Indique le nombre de reps faites');return}
  if(parseW(it.weight)==null){const e=exo(it.exoId),last=lastOf(it.exoId);
    if(last){it.weight=numStr(last.w);toast(`Poids de la dernière fois repris : ${fmtKg(last.w)}`)}
    else if(e.eq==='C'||e.eq==='X'){it.weight='0'}
    else{const box=document.querySelector(`#sc-${i} .st.in`);box?.classList.remove('shake');void box?.offsetWidth;box?.classList.add('shake');$('#w-'+i)?.focus();toast("Indique d'abord le poids utilisé");return}}
  unlockAudio();
  if(m==='time'){const d=it.dur||60;a.timer={kind:'work',i,j,end:Date.now()+d*1000,total:d,label:`${exo(it.exoId,it.name).name} · série ${j+1}`,fired:false};ensureTick();touchActive(400);renderSession();return}
  it.done[j]=true;afterSetDone(i);
}
function startTimer(kind,sec,label){if(!sec){S.active.timer=null;updateRest();return}S.active.timer={kind,end:Date.now()+sec*1000,total:sec,label,fired:false};ensureTick();updateRest()}
let tickH=null;
function ensureTick(){if(!tickH)tickH=setInterval(tick,250)}
function tick(){
  if(!S.active){clearInterval(tickH);tickH=null;return}
  const el=$('#elapsed');if(el)el.textContent=mmss((Date.now()-S.active.start)/1000);
  const t=S.active.timer;if(!t)return;
  if(!t.fired&&Date.now()>=t.end&&t.kind==='work'){ding();const it=S.active.items[t.i];S.active.timer=null;if(it){it.done[t.j]=true;afterSetDone(t.i)}return}
  if(!t.fired&&Date.now()>=t.end){t.fired=true;ding();touchActive();setTimeout(()=>{if(S.active&&S.active.timer===t){S.active.timer=null;touchActive();updateRest()}},3000)}
  updateRest();
}
function updateRest(){
  const slot=$('#rest-slot');if(!slot)return;const t=S.active&&S.active.timer;
  if(!t){slot.innerHTML='';return}
  const rem=Math.max(0,(t.end-Date.now())/1000),pct=Math.min(100,(1-rem/t.total)*100);
  const work=t.kind==='work';
  const html=`<div class="rest ${t.fired?'ding':''} ${work?'work':''}" role="timer" aria-live="off"><div class="in"><div class="r1"><div class="clock num">${t.fired?'0:00':mmss(Math.ceil(rem))}</div><div class="lab"><small>${work?'Effort en cours':t.fired?"C'est reparti":t.kind==='set'?'Repos · prochaine':'Repos · exercice suivant'}</small><div>${esc(t.label)}</div></div></div><div class="bar"><i style="width:${pct.toFixed(1)}%"></i></div>
   <div class="r2"><button data-act="rest-adj" data-d="-15">−15 s</button><button data-act="rest-adj" data-d="15">+15 s</button><button class="go" data-act="rest-skip">${work?'Série finie':t.fired?'OK':'Passer'}</button></div></div></div>`;
  if(!slot.firstChild){slot.innerHTML=html;return}
  slot.querySelector('.clock').textContent=t.fired?'0:00':mmss(Math.ceil(rem));slot.querySelector('.bar i').style.width=pct.toFixed(1)+'%';
  const r=slot.querySelector('.rest');if(t.fired!==r.classList.contains('ding'))slot.innerHTML=html;
}
let AC=null;
function unlockAudio(){try{if(!AC)AC=new (window.AudioContext||window.webkitAudioContext)();if(AC.state==='suspended')AC.resume()}catch(e){}}
function ding(){
  if(!S.settings.sound)return;
  try{navigator.vibrate&&navigator.vibrate([250,120,250,120,400])}catch(e){}
  try{if(!AC)return;const t0=AC.currentTime;[0,.22,.44].forEach((d,k)=>{const o=AC.createOscillator(),g=AC.createGain();o.type='sine';o.frequency.value=k===2?1320:880;g.gain.setValueAtTime(0,t0+d);g.gain.linearRampToValueAtTime(.35,t0+d+.02);g.gain.exponentialRampToValueAtTime(.001,t0+d+.18);o.connect(g).connect(AC.destination);o.start(t0+d);o.stop(t0+d+.2)})}catch(e){}
}
function endConfirm(){
  const a=S.active,done=a.items.reduce((n,it)=>n+it.done.filter(Boolean).length,0),tot=a.items.reduce((n,it)=>n+it.done.length,0);
  modal(`<h3>Terminer la séance ?</h3><p class="muted" style="margin:0">${done} série${done>1?'s':''} validée${done>1?'s':''} sur ${tot}. Seules les séries cochées comptent pour le poids total et les records.</p>
   <div class="acts"><button class="btn primary" data-act="sess-finish" ${done?'':'disabled'}>Terminer et voir le bilan</button><button class="btn ghost" data-act="modal-close">Continuer la séance</button><button class="btn danger" data-act="sess-discard">Abandonner sans enregistrer</button></div>`);
}
function finishSession(){
  const a=S.active;if(!a)return;
  const prs=[];
  const items=a.items.map(it=>{const n=it.done.filter(Boolean).length;const w=parseW(it.weight);const m=modeOf(it);
    const rd=m==='max'?it.done.map((d,j)=>d?(parseInt((it.repsDone||[])[j],10)||0):null).filter(x=>x!=null):null;
    const uni=uniOk(it),totalReps=(m==='max'?rd.reduce((a,b)=>a+b,0):m==='time'?0:it.reps*n)*(uni?2:1);
    return{exoId:it.exoId,name:exo(it.exoId,it.name).name,weight:n?(w??0):null,sets:it.sets,reps:it.reps,mode:m,dur:it.dur||null,repsDone:rd,totalReps,done:n,...(uni?{uni:true}:{})}});
  const seen=new Set();
  for(const it of items){if(!it.done||seen.has(it.exoId))continue;const r=recOf(it.exoId);const best=Math.max(...items.filter(x=>x.exoId===it.exoId&&x.done).map(x=>x.weight));seen.add(it.exoId);
    if(r&&best>r.w)prs.push({exoId:it.exoId,name:it.name,w:best,prev:r.w})}
  const tonnage=items.reduce((s,it)=>s+(it.done?(it.weight||0)*it.totalReps:0),0);
  const sets=items.reduce((s,it)=>s+it.done,0);
  const s={id:a.id,tplId:a.tplId,name:a.name,date:a.start,dur:Math.round((Date.now()-a.start)/1000),items,tonnage,prs};
  S.sessions.push(s);S.active=null;
  touchActive(0);touchSession(s.id);buildIdx();
  closeSheet('session');try{wakeLock&&wakeLock.release()}catch(e){};
  VIEW='home';render();
  const after=totalKg(),A=passAt(after),B=passAt(after-tonnage),gainedN=A.lvl-B.lvl,objs=TIERS.slice(B.lvl,A.lvl).filter(T=>T.obj);
  const startPct=gainedN?0:B.pct,big=objs.length?objs[objs.length-1]:null;
  modal(`<div class="emo">${big?big.emo:(A.no?A.no.emo:'🏆')}</div>
   <div class="k">Aujourd'hui tu as soulevé</div><div class="big num">${fmtKg(tonnage)}</div>
   ${gainedN?`<div class="cmp">${gainedN>1?`+${gainedN} niveaux : tu passes au niveau ${A.lvl}`:`Niveau ${A.lvl} atteint`} !</div>`:`<div class="cmp">Niveau ${A.lvl}/100</div>`}
   ${objs.length?`<div class="unl"><div class="k">${objs.length>1?objs.length+' objets débloqués':'Objet débloqué'}</div>${objs.slice(-4).reverse().map(T=>`<div><span>${T.emo}</span><span>Niveau ${T.n} · ${esc(T.name)}</span></div>`).join('')}</div>`:''}
   ${A.done?'':`<div class="mbar"><i id="mbar-i" style="width:${startPct.toFixed(1)}%"></i></div><div class="mrow num"><span>Niveau ${A.lvl+1} dans ${fmtT(A.need-A.into)}</span><span>${A.no?A.no.emo+' '+esc(A.no.name)+' dans '+fmtT(A.no.thr-A.t):''}</span></div>`}
   <div class="chips"><span class="chip">${Math.round(s.dur/60)} min</span><span class="chip">${sets} séries</span><span class="chip">${items.filter(i=>i.done).length} exercices</span></div>
   ${prs.length?`<div class="prs"><div class="k">${prs.length>1?prs.length+' nouveaux records':'Nouveau record'}</div>${prs.map(p=>`<div><span>${esc(p.name)}</span><span>${fmtKg(p.w)} (+${fmtN(p.w-p.prev)})</span></div>`).join('')}</div>`:''}
   <div class="acts"><button class="btn primary" data-act="modal-close">Super</button><button class="btn ghost" data-act="see-pass">Voir mes niveaux</button></div>`);
  if(!A.done)setTimeout(()=>{const b=document.getElementById('mbar-i');if(b)b.style.width=A.pct.toFixed(1)+'%'},350);
}

/* ---------- modal & toast ---------- */
function modal(html){closeModal();const d=document.createElement('div');d.className='scrim';d.id='modal';d.innerHTML=`<div class="modal" role="dialog" aria-modal="true">${html}</div>`;d.addEventListener('click',e=>{if(e.target===d)closeModal()});document.body.appendChild(d)}
function closeModal(){$('#modal')?.remove()}
let toastT=null;
function toast(msg){$('#toast')?.remove();const d=document.createElement('div');d.className='toast';d.id='toast';d.setAttribute('role','status');d.textContent=msg;document.body.appendChild(d);clearTimeout(toastT);toastT=setTimeout(()=>d.remove(),2800)}

/* ---------- pictogram animation ---------- */
const reduceMotion=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
let animRAF=null;
function registerAnim(){animEls=[...document.querySelectorAll('.fig.anim[data-ex]')];if(!animRAF&&animEls.length&&!reduceMotion)animRAF=requestAnimationFrame(animLoop)}
function animLoop(ts){
  animEls=animEls.filter(el=>el.isConnected);if(!animEls.length){animRAF=null;return}
  const per=2600,ph=(ts%per)/per;let t;if(ph<.15)t=0;else if(ph<.5)t=(1-Math.cos((ph-.15)/.35*Math.PI))/2;else if(ph<.65)t=1;else t=(1+Math.cos((ph-.65)/.35*Math.PI))/2;
  const vh=window.innerHeight;for(const el of animEls){if(el.dataset.hum){const b=el.getBoundingClientRect();if(b.bottom<-50||b.top>vh+50)continue;el.innerHTML=figHuman(exo(el.dataset.ex),t)}else el.innerHTML=figSVG(exo(el.dataset.ex),t)}
  animRAF=requestAnimationFrame(animLoop);
}

/* ---------- charts (canvas, no library) ---------- */
function cssVar(n){return getComputedStyle(document.documentElement).getPropertyValue(n).trim()}
function screenCols(){return{ink:cssVar('--ink'),muted:cssVar('--muted'),grid:cssVar('--line'),accent:cssVar('--accent'),pr:cssVar('--pr'),bg:cssVar('--surface')}}
const PDFCOL={ink:'#1C1515',muted:'#6E5F5E',grid:'#EADFDE',accent:'#8C4848',pr:'#B8862B',bg:'#FFFFFF'};
function niceTicks(min,max,n=4){if(max-min<1e-9){min-=5;max+=5}const st0=(max-min)/n,mag=10**Math.floor(Math.log10(st0)),e=st0/mag,step=(e>=7.5?10:e>=3.5?5:e>=1.5?2:1)*mag;const lo=Math.floor(min/step)*step,hi=Math.ceil(max/step)*step,t=[];for(let v=lo;v<=hi+step/2;v+=step)t.push(+v.toFixed(6));return t}
function drawChart(cv,o){
  const col=o.col||screenCols(),dpr=o.dpr||window.devicePixelRatio||1,W=o.w||cv.clientWidth||320,H=o.h||cv.clientHeight||210;
  cv.width=Math.round(W*dpr);cv.height=Math.round(H*dpr);const g=cv.getContext('2d');g.setTransform(dpr,0,0,dpr,0,0);
  if(o.w){g.fillStyle=col.bg;g.fillRect(0,0,W,H)}else g.clearRect(0,0,W,H);
  const vals=o.values,n=vals.length;if(!n)return;
  const fs=o.fs||12,font=(wt=500,s=fs)=>`${wt} ${s}px Barlow, system-ui, sans-serif`;
  let vmin,vmax;if(o.type==='bar'){vmin=0;vmax=Math.max(...vals)||10}else{vmin=Math.min(...vals,o.rec??Infinity);vmax=Math.max(...vals,o.rec??-Infinity);const pad=(vmax-vmin)*.18||5;vmin=Math.max(0,vmin-pad);vmax+=pad}
  const ticks=niceTicks(vmin,vmax),y0=ticks[0],y1=ticks[ticks.length-1];
  g.font=font();const lw=Math.max(...ticks.map(t=>g.measureText(fmtTick(t)).width));
  const L=lw+14,R=o.type==='bar'?8:18,T=18,B=fs+14,pw=W-L-R,ph=H-T-B,Y=v=>T+ph-(v-y0)/(y1-y0)*ph;
  g.textAlign='right';g.textBaseline='middle';
  ticks.forEach(t=>{g.strokeStyle=col.grid;g.lineWidth=1;g.beginPath();g.moveTo(L,Math.round(Y(t))+.5);g.lineTo(W-R,Math.round(Y(t))+.5);g.stroke();g.fillStyle=col.muted;g.fillText(fmtTick(t),L-8,Y(t))});
  let X;
  if(o.type==='bar'){const slot=pw/n,bw=Math.min(34,slot*.62);X=i=>L+slot*i+slot/2;
    vals.forEach((v,i)=>{const x=X(i)-bw/2,y=Y(v),hh=Y(y0)-y;g.fillStyle=col.accent;g.globalAlpha=i===n-1?1:.42;rr(g,x,y,bw,Math.max(hh,1),Math.min(4,bw/2));g.fill();g.globalAlpha=1});
    const mi=vals.indexOf(Math.max(...vals));g.fillStyle=col.ink;g.font=font(700);g.textAlign='center';g.textBaseline='bottom';g.fillText(fmtTick(vals[mi]),X(mi),Y(vals[mi])-4);
  }else{X=i=>n===1?L+pw/2:L+i*(pw/(n-1));
    const grad=g.createLinearGradient(0,T,0,T+ph);grad.addColorStop(0,hexA(col.accent,.22));grad.addColorStop(1,hexA(col.accent,0));
    if(n>1){g.beginPath();g.moveTo(X(0),Y(vals[0]));vals.forEach((v,i)=>g.lineTo(X(i),Y(v)));g.lineTo(X(n-1),Y(y0));g.lineTo(X(0),Y(y0));g.closePath();g.fillStyle=grad;g.fill();
      g.beginPath();vals.forEach((v,i)=>i?g.lineTo(X(i),Y(v)):g.moveTo(X(i),Y(v)));g.strokeStyle=col.accent;g.lineWidth=2.5;g.lineJoin='round';g.stroke()}
    vals.forEach((v,i)=>{g.beginPath();g.arc(X(i),Y(v),i===n-1?5:3,0,7);g.fillStyle=i===n-1?col.accent:col.bg;g.fill();g.lineWidth=2;g.strokeStyle=col.accent;g.stroke()});
    if(o.rec!=null){const y=Math.round(Y(o.rec))+.5;g.setLineDash([5,4]);g.strokeStyle=col.pr;g.lineWidth=1.5;g.beginPath();g.moveTo(L,y);g.lineTo(W-R,y);g.stroke();g.setLineDash([]);g.fillStyle=col.pr;g.font=font(700);g.textAlign='left';g.textBaseline='bottom';g.fillText('Record '+fmtTick(o.rec)+' kg',L+4,y-3)}
    const lv=vals[n-1];g.fillStyle=col.ink;g.font=font(700);g.textAlign=n===1?'center':'right';g.textBaseline='bottom';if(o.rec==null||Math.abs(Y(lv)-Y(o.rec))>16)g.fillText(fmtTick(lv),X(n-1)+(n===1?0:4),Y(lv)-8);
  }
  g.fillStyle=col.muted;g.font=font();g.textBaseline='top';const step=Math.max(1,Math.ceil(n/(o.w?8:5)));
  for(let i=0;i<n;i++){if(i%step&&i!==n-1)continue;if(i!==n-1&&n-1-i<step*.7)continue;g.textAlign=o.type==='bar'?'center':i===0&&n>1?'left':i===n-1&&n>1?'right':'center';g.fillText(o.labels[i],X(i),T+ph+8)}
}
function rr(g,x,y,w,h,r){g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.lineTo(x+w,y+h);g.lineTo(x,y+h);g.arcTo(x,y,x+w,y,r);g.closePath()}
function hexA(c,a){c=c.trim();if(c[0]==='#'){let h=c.slice(1);if(h.length===3)h=h.split('').map(x=>x+x).join('');const n=parseInt(h,16);return `rgba(${n>>16&255},${n>>8&255},${n&255},${a})`}return c}
function fmtTick(t){return(Math.round(t*10)/10).toLocaleString('fr-FR').replace(/ | /g,' ')}
function drawStats(){
  const cv=$('#c-ton');if(cv){const ss=S.sessions.slice(-12);drawChart(cv,{type:'bar',labels:ss.map(s=>dfr(s.date)),values:ss.map(s=>Math.round(s.tonnage))})}
  const c2=$('#c-exo');if(c2&&statsExo&&IDX[statsExo]){const x=IDX[statsExo];drawChart(c2,{type:'line',labels:x.hist.map(p=>dfr(p.t)),values:x.hist.map(p=>p.w),rec:x.rec.w})}
}
let rzT;window.addEventListener('resize',()=>{clearTimeout(rzT);rzT=setTimeout(()=>{if(VIEW==='stats')drawStats();if(VIEW==='pass'){fitPassTop();document.querySelectorAll('.map-tile').forEach(c=>{c.dataset.on='';c.width=0});setupTiles()}},150)});

/* ---------- exports ---------- */
async function getDownloads(){return{save:async({filename,data})=>{
  const type=filename.endsWith('.pdf')?'application/pdf':filename.endsWith('.json')?'application/json':'application/octet-stream';
  const blob=data instanceof Blob?data:new Blob([data],{type});
  const ios=/iPhone|iPad|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
  try{const file=new File([blob],filename,{type});if(ios&&navigator.canShare&&navigator.canShare({files:[file]})){await navigator.share({files:[file],title:filename});return{status:'saved'}}}
  catch(e){if(e&&e.name==='AbortError')throw{code:'declined'}}
  const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),5000);return{status:'saved'};
}}}
const pdfTxt=s=>String(s).replace(/[  ]/g,' ').replace(/[—–]/g,'-').replace(/[^\x00-\xFF]/g,'');
function loadScript(src){return new Promise((res,rej)=>{const sc=document.createElement('script');sc.src=src;sc.onload=res;sc.onerror=rej;document.head.appendChild(sc)})}
async function exportPDF(btn){
  if(!window.jspdf){try{await loadScript('vendor/jspdf.umd.min.js')}catch(e){}}
  if(!window.jspdf){toast("Le module PDF n'a pas pu se charger. Vérifie ta connexion puis réessaie.");return}
  const dl=await getDownloads();if(!dl){toast("L'export de fichiers n'est pas disponible dans cette vue.");return}
  btn&&(btn.disabled=true);
  try{
    const {jsPDF}=window.jspdf,doc=new jsPDF({unit:'mm',format:'a4'}),ss=S.sessions;
    const tot=ss.reduce((a,s)=>a+s.tonnage,0);let y=18;
    doc.setFont('helvetica','bold');doc.setFontSize(22);doc.setTextColor(23,27,33);doc.setFillColor(140,72,72);doc.rect(15,y-7,9,9,'F');doc.text('HEVOR',27,y);
    doc.setFontSize(13);doc.text(pdfTxt('Bilan musculation'),58,y);
    doc.setFont('helvetica','normal');doc.setFontSize(10);doc.setTextColor(95,103,114);
    doc.text(pdfTxt(`Du ${dfull(ss[0].date)} au ${dfull(ss[ss.length-1].date)} · ${ss.length} séances · ${fmtTick(Math.round(tot))} kg soulevés au total`),15,y+7);
    doc.text(pdfTxt(`Exporté le ${dfull(Date.now())}`),15,y+12);y+=22;
    const chartImg=(o,wmm,hmm)=>{const cv=document.createElement('canvas');drawChart(cv,{...o,w:wmm*5,h:hmm*5,dpr:2,fs:13,col:PDFCOL});return cv.toDataURL('image/png')};
    doc.setFont('helvetica','bold');doc.setFontSize(12);doc.setTextColor(23,27,33);doc.text(pdfTxt('Poids soulevé par séance (kg)'),15,y);y+=3;
    const last=ss.slice(-24);doc.addImage(chartImg({type:'bar',labels:last.map(s=>dfr(s.date)),values:last.map(s=>Math.round(s.tonnage))},180,62),'PNG',15,y,180,62);y+=70;
    const ids=Object.keys(IDX).sort((a,b)=>IDX[b].hist.length-IDX[a].hist.length);
    doc.setFont('helvetica','bold');doc.setFontSize(12);doc.text(pdfTxt('Progression par exercice (poids max par séance, kg)'),15,y);y+=6;
    for(const id of ids){const x=IDX[id];if(y>222){doc.addPage();y=18}
      const first=x.hist[0].w,lst=x.hist[x.hist.length-1].w,d=lst-first;
      doc.setFont('helvetica','bold');doc.setFontSize(11);doc.setTextColor(23,27,33);doc.text(pdfTxt(exo(id).name),15,y);
      doc.setFont('helvetica','normal');doc.setFontSize(9);doc.setTextColor(95,103,114);
      doc.text(pdfTxt(`Record ${fmtTick(x.rec.w)} kg le ${dfull(x.rec.t)} · départ ${fmtTick(first)} kg · ${d>=0?'+':''}${fmtTick(d)} kg · ${x.hist.length} séance${x.hist.length>1?'s':''}`),15,y+5);
      doc.addImage(chartImg({type:'line',labels:x.hist.map(p=>dfr(p.t)),values:x.hist.map(p=>p.w),rec:x.rec.w},180,52),'PNG',15,y+7,180,52);y+=64}
    const blob=doc.output('blob');
    await dl.save({filename:`hevor-bilan-${new Date().toISOString().slice(0,10)}.pdf`,data:blob});toast('Bilan PDF enregistré');
  }catch(e){if(e&&e.code==='declined')toast('Export annulé');else toast("L'export a échoué. Réessaie dans un instant.")}
  finally{btn&&(btn.disabled=false)}
}
async function exportJSON(){
  const dl=await getDownloads();if(!dl){toast("L'export de fichiers n'est pas disponible dans cette vue.");return}
  const data=JSON.stringify({app:'hevor',v:1,exported:Date.now(),templates:S.templates,custom:S.custom,sessions:S.sessions,settings:S.settings},null,1);
  try{await dl.save({filename:`hevor-sauvegarde-${new Date().toISOString().slice(0,10)}.json`,data});toast('Copie enregistrée')}catch(e){toast(e&&e.code==='declined'?'Export annulé':"L'export a échoué.")}
}
$('#imp').addEventListener('change',async e=>{
  const f=e.target.files[0];e.target.value='';if(!f)return;
  if(f.size>8e6){toast('Fichier trop volumineux pour une sauvegarde Hevor.');return}
  try{const o=JSON.parse(await f.text());if(!o||(o.app!=='hevor'&&o.app!=='fonte'))throw 0;
    o.templates=cList(o.templates,cTemplate,200);o.custom=cList(o.custom,cCustom,500);o.sessions=cList(o.sessions,cSession,5000);
    const byId=(arr,add)=>{const m=new Map(arr.map(x=>[x.id,x]));(add||[]).forEach(x=>{if(x&&x.id)m.set(x.id,x)});return[...m.values()]};
    const del=new Set(S.deleted);
    S.templates=byId(S.templates,o.templates);S.custom=byId(S.custom,o.custom);
    const before=new Set(S.sessions.map(s=>s.id));
    S.sessions=byId(S.sessions,(o.sessions||[]).filter(s=>!del.has(s.id))).sort((a,b)=>a.date-b.date);
    S.sessions.forEach(s=>{if(!before.has(s.id))mark('s:'+s.id)});
    touchMeta();buildIdx();render();toast(`Copie importée : ${S.sessions.length-before.size} séance(s) ajoutée(s)`);
  }catch(err){toast("Ce fichier n'est pas une sauvegarde Hevor valide.")}
});


/* ---------- suppression du compte (droit à l'effacement) ---------- */
async function deleteAccount(e){
  e.preventDefault();const err=$('#del-err'),btn=e.target.querySelector('button[type=submit]'),pass=$('#del-pass').value;
  if(!USER||!fbAuth){err.textContent='Connecte-toi pour supprimer ton compte.';return}
  if(!pass){err.textContent='Indique ton mot de passe.';return}
  if(navigator.onLine===false){err.textContent='Il faut du réseau pour supprimer ton compte.';return}
  btn.disabled=true;err.textContent='Suppression en cours…';
  try{
    await USER.reauthenticateWithCredential(firebase.auth.EmailAuthProvider.credential(USER.email,pass));
    if(typeof spacesWipe==='function'){try{await spacesWipe()}catch(x){if(x&&x.spMsg){btn.disabled=false;err.textContent=x.spMsg;return}throw x}}
    const uid=USER.uid,base=fs.doc(`data/users/${uid}/profile`);
    const ss=await base.collection('sessions').get();
    for(const d of ss.docs)await d.ref.delete();
    for(const k of ['meta','active','profile'])await fs.doc(`data/users/${uid}/${k}`).delete();
    try{await fs.doc(`data/users/${uid}/spaces`).delete()}catch(x){}
    try{localStorage.removeItem('hevor.v1:'+uid)}catch(x){}
    S=fresh();DB=null;delAsk=false;
    const me=ACC_APP,next=accList().find(x=>x.app!==me);accForget(me);if(next)accSwitching=true;
    await USER.delete();closeSheet('acc');
    toast('Ton compte et toutes tes données ont été supprimés.');
    if(next)setTimeout(()=>accGo(next.app),1200);
  }catch(x){btn.disabled=false;const c=x&&x.code;err.textContent=c==='auth/wrong-password'||c==='auth/invalid-credential'?'Mot de passe incorrect.':c==='auth/too-many-requests'?'Trop d\'essais. Réessaie dans quelques minutes.':c==='auth/network-request-failed'?'Pas de connexion. Réessaie avec du réseau.':'La suppression a échoué. Réessaie.'}
}


/* ---------- informations légales ---------- */
const CONTACT=(typeof window.HEVOR_CONTACT==='string'&&/^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/.test(window.HEVOR_CONTACT))?window.HEVOR_CONTACT:'';
const contactLine=()=>CONTACT?`par e-mail à <b>${esc(CONTACT)}</b>`:`directement dans l'appli (Réglages)`;
const LEGAL={
privacy:{t:'Confidentialité',h:()=>`
<p class="lg-date">Politique de confidentialité · mise à jour le 19 octobre 2026</p>
<h3>1. Qui est responsable de tes données ?</h3>
<p>Hevor est édité par un particulier, à titre gratuit et non commercial (voir les mentions légales). Il est responsable du traitement de tes données. Tu peux le contacter ${contactLine()}.</p>
<h3>2. Quelles données sont collectées ?</h3>
<ul><li><b>Ton compte</b> : ton prénom, ton nom, ton adresse e-mail et ton mot de passe. Le mot de passe est chiffré par Google : personne, pas même l'éditeur, ne peut le lire.</li>
<li><b>Ton entraînement</b> : tes séances, exercices, poids, séries, répétitions, durées, dates, exercices personnalisés et réglages.</li>
<li><b>Si tu utilises un espace Club ou Coach</b> : ton nom, le poste que le coach t'attribue (ou l'objectif que tu indiques à ton coach), ton rôle, le planning, les programmes reçus, les séances faites dans cet espace et tes ressentis (durée, difficulté, commentaire). Dans un club, et seulement avec ton accord, tes réponses au questionnaire de santé préparé par le coach (par exemple motivation, sommeil, fatigue, douleurs).</li>
<li><b>Des données techniques</b> : l'identifiant de ton compte et, pour la sécurité, les données de connexion (dont l'adresse IP) traitées par les hébergeurs.</li></ul>
<p>Hevor ne demande ni ton âge, ni ta position, ni tes contacts, ni tes photos. Ton prénom et ton nom servent uniquement à ce que les coachs et équipes que tu rejoins sachent qui tu es : ils ne sont jamais affichés publiquement ni aux autres utilisateurs. Dans l'espace « Moi », n'y saisis pas d'informations médicales.</p>
<h3>3. Pourquoi ?</h3>
<p>Uniquement pour faire fonctionner Hevor : ton compte, la sauvegarde et la synchronisation de tes séances, tes records, tes statistiques et tes niveaux, et, si tu rejoins une équipe ou un coach, le suivi de ton entraînement par eux. Base légale : l'exécution des conditions d'utilisation que tu acceptes (article 6.1.b du RGPD). Les réponses au questionnaire de santé sont des données de santé : elles ne sont traitées qu'avec ton consentement explicite (article 9.2.a du RGPD), que tu peux retirer à tout moment. La sécurité du service repose sur l'intérêt légitime (article 6.1.f).</p>
<h3>4. Ce que Hevor ne fait pas</h3>
<p>Pas de publicité, pas de revente de données, pas de profilage, pas de mesure d'audience, pas de cookies de suivi.</p>
<h3>5. Qui a accès à tes données ?</h3>
<p>Ton espace « Moi » : toi seul. Des règles d'accès empêchent tout autre utilisateur de le lire, même les coachs de tes équipes.</p>
<p>Dans une équipe (espace Club) :</p><ul><li><b>Les coachs de l'équipe</b> voient ton nom, ton poste, les séances et ressentis faits dans l'équipe et, si tu as donné ton accord, tes réponses aux questionnaires (santé, ressenti après les séances).</li><li><b>Les autres joueurs et le staff</b> voient seulement ton nom, ton poste et ton rôle. Le staff voit aussi le planning de l'équipe. Ils ne voient jamais tes données de forme ou de santé.</li><li><b>Toi, joueur</b>, tu ne vois que les créneaux et programmes auxquels ton coach t'a convoqué.</li></ul>
<p>Avec un coach indépendant (espace Coaching) : ton coach voit ton nom, ton objectif, les séances faites dans cet espace et tes ressentis. Les autres clients ne voient rien de toi.</p>
<p>Deux prestataires techniques interviennent :</p>
<ul><li><b>Google (Firebase)</b> gère les comptes et stocke tes séances. Les séances sont stockées en France (Paris). Les données de compte peuvent être traitées aux États-Unis, dans le cadre du Data Privacy Framework UE–États-Unis et des clauses contractuelles types de la Commission européenne.</li>
<li><b>GitHub</b> héberge l'appli. Il reçoit ton adresse IP quand l'appli se charge. Ce transfert est encadré de la même façon.</li></ul>
<p>L'éditeur ne consulte pas tes données, sauf à ta demande ou si la loi l'y oblige.</p>
<h3>6. Combien de temps ?</h3>
<p>Tant que ton compte existe. Si tu supprimes ton compte, tes données sont effacées immédiatement de la base, puis des sauvegardes techniques de Google selon leurs délais. Un compte inactif depuis 3 ans peut être supprimé, après un e-mail d'avertissement.</p><p>Si tu quittes une équipe ou un coach, tes réponses aux questionnaires et tes ressentis dans cet espace sont effacés. Si tu retires ton accord pour le questionnaire, tes réponses sont effacées. Quand le propriétaire supprime une équipe, toutes ses données sont effacées.</p>
<h3>7. Stockage sur ton appareil</h3>
<p>Hevor enregistre tes données et ta session sur ton téléphone pour fonctionner hors connexion. Ce stockage est strictement nécessaire au service : il ne demande pas de consentement (article 82 de la loi Informatique et Libertés). Les polices et bibliothèques sont livrées avec l'appli : aucun site tiers n'est appelé pour l'affichage.</p>
<h3>8. Sécurité</h3>
<p>Connexion chiffrée (HTTPS), mots de passe chiffrés par Google, politique de sécurité qui bloque le chargement de code extérieur. Des règles d'accès vérifiées par le serveur, et non par l'appli, limitent chaque personne à ce que son rôle permet : ton espace « Moi » n'est lisible que par toi ; dans une équipe, les données de forme ne sont lisibles que par toi et les coachs. Les codes d'invitation sont aléatoires, peuvent être renouvelés par le propriétaire, et une personne qui rejoint ne voit rien tant qu'un rôle ne lui a pas été attribué.</p>
<h3>9. Tes droits</h3>
<p>Tu as un droit d'accès, de rectification, d'effacement, de portabilité, de limitation et d'opposition. Tu peux les exercer directement :</p>
<ul><li><b>Accès et portabilité</b> : Réglages › Exporter une copie.</li><li><b>Rectification</b> : modifie ou supprime tes séances et exercices, ton nom (Réglages › Compte) et ton poste (Équipe › Mon profil).</li><li><b>Retrait du consentement</b> : Équipe › Mes réponses aux questionnaires.</li><li><b>Effacement</b> : quitte l'équipe, ou Réglages › Supprimer mon compte.</li></ul>
<p>Pour toute autre demande, contacte l'éditeur ${contactLine()}. Réponse sous un mois. Tu peux aussi adresser une réclamation à la CNIL (cnil.fr).</p>
<h3>10. Âge</h3>
<p>Hevor est destiné aux personnes de 15 ans et plus. En dessous, l'accord d'un parent est nécessaire, notamment pour rejoindre une équipe et pour répondre au questionnaire de santé.</p>
<h3>11. Modifications</h3>
<p>Cette politique peut évoluer. La date de mise à jour figure en haut de la page.</p>`},
cgu:{t:'Conditions d\'utilisation',h:()=>`
<p class="lg-date">Conditions générales d'utilisation · mise à jour le 19 octobre 2026</p>
<h3>1. Objet</h3><p>Hevor est un carnet d'entraînement gratuit : séances, chronomètre de repos, records, statistiques et niveaux dans ton espace « Moi » ; suivi d'équipe (planning, programmes, questionnaires, ressentis) dans l'espace Club ; suivi par un coach indépendant dans l'espace Coaching.</p>
<h3>2. Accès et compte</h3><p>L'utilisation demande un compte avec une adresse e-mail valide, ton prénom et ton nom réels : ils permettent aux coachs de savoir qui rejoint leur équipe. Il est interdit d'usurper l'identité d'une autre personne. Hevor est destiné aux personnes de 15 ans et plus, ou avec l'accord d'un parent. Tu es responsable de la confidentialité de ton mot de passe.</p>
<h3>3. Bonne utilisation</h3><p>Il est interdit de tenter d'accéder aux données d'autres utilisateurs, de perturber le service ou d'y enregistrer des contenus illicites. Le propriétaire d'une équipe ou d'un espace coaching n'invite que les personnes concernées, attribue les rôles avec soin et utilise les informations de ses joueurs ou clients uniquement pour leur entraînement. Il s'assure que les joueurs mineurs ont l'accord d'un parent. Les liens vidéo ajoutés au planning restent sous la responsabilité de celui qui les publie.</p>
<h3>4. Santé et sécurité</h3><p><b>Hevor n'est pas un dispositif médical et ne donne pas de conseil médical.</b> Les exercices, illustrations, séances exemples et temps de repos sont indicatifs. Les indicateurs de charge et de forme (rouge, orange, vert) sont une aide pour le coach, pas un diagnostic. Consulte un médecin avant de commencer un programme ou en cas de douleur, échauffe-toi et adapte tes charges à ton niveau. La pratique sportive se fait sous ta responsabilité.</p>
<h3>5. Disponibilité</h3><p>Hevor est fourni gratuitement, en l'état. L'éditeur fait de son mieux pour que le service fonctionne, sans pouvoir le garantir en permanence. Il peut le faire évoluer, le suspendre ou l'arrêter. Pense à exporter régulièrement une copie de tes données.</p>
<h3>6. Responsabilité</h3><p>L'éditeur n'est responsable que des dommages directs causés par une faute prouvée de sa part. Il n'est pas responsable des blessures liées à ta pratique sportive, ni d'une mauvaise utilisation de l'appli.</p>
<h3>7. Propriété intellectuelle</h3><p>Le nom Hevor, le logo, le design, les illustrations et les textes appartiennent à l'éditeur. Tes données d'entraînement t'appartiennent.</p>
<h3>8. Fin du compte</h3><p>Tu peux supprimer ton compte à tout moment depuis les Réglages. L'éditeur peut supprimer un compte qui ne respecte pas ces conditions.</p>
<h3>9. Modifications</h3><p>Ces conditions peuvent évoluer. Tu en seras informé dans l'appli. Continuer à utiliser Hevor vaut acceptation de la nouvelle version.</p>
<h3>10. Droit applicable</h3><p>Ces conditions sont soumises au droit français. En cas de désaccord, contacte d'abord l'éditeur ${contactLine()} pour trouver une solution amiable.</p>`},
legal:{t:'Mentions légales',h:()=>`
<p class="lg-date">Mentions légales · mise à jour le 19 octobre 2026</p>
<h3>Éditeur</h3><p>Hevor est édité par un particulier, à titre non professionnel et non commercial. Conformément à l'article 6, III, 2° de la loi n° 2004-575 du 21 juin 2004 pour la confiance dans l'économie numérique, l'éditeur a choisi de ne pas publier son identité ; ses coordonnées ont été communiquées à l'hébergeur. Contact : ${contactLine()}.</p>
<h3>Directeur de la publication</h3><p>L'éditeur.</p>
<h3>Hébergement de l'appli</h3><p>GitHub, Inc. (GitHub Pages), 88 Colin P. Kelly Jr. Street, San Francisco, CA 94107, États-Unis. github.com</p>
<h3>Hébergement des données</h3><p>Google Ireland Limited, Gordon House, Barrow Street, Dublin 4, Irlande (Firebase Authentication et Cloud Firestore). Données d'entraînement et d'équipe stockées dans la région europe-west9 (Paris, France). firebase.google.com</p>
<h3>Propriété intellectuelle</h3><p>Le nom Hevor, le logo, le design, les pictogrammes et les textes sont la propriété de l'éditeur. Police Barlow : SIL Open Font License. Bibliothèques Firebase (licence Apache 2.0), jsPDF et QR Code Generator de Kazuhiko Arase (licence MIT). « QR Code » est une marque déposée de DENSO WAVE INCORPORATED. Les émojis sont affichés par le système de ton appareil. Les noms de produits cités dans les niveaux (avions, trains, fusées…) le sont à titre descriptif et restent la propriété de leurs titulaires.</p>
<h3>Données personnelles</h3><p>Voir la politique de confidentialité.</p>`}
};
function openLegal(k){const L=LEGAL[k];if(!L)return;openSheet('legal',sheetHead(L.t,'legal-close')+`<div class="sheet-b"><div class="wrap legal-doc">${L.h()}</div></div>`)}

/* ---------- sample templates ---------- */
function addSamples(){
  const mk=(name,arr)=>({id:gid(),name,items:arr.map(([exoId,sets,reps,rs,re])=>({exoId,sets,reps,restSet:rs,restExo:re}))});
  S.templates.push(
    mk('Push',[['dc-barre',4,8,120,150],['di-halt',3,10,90,120],['dm-halt',3,10,90,120],['elev-lat',3,12,60,90],['pushdown',3,12,60,0]]),
    mk('Pull',[['tractions',4,6,120,150],['rowing-barre',4,8,120,120],['tirage-horiz',3,10,90,120],['face-pull',3,15,60,90],['curl-halt',3,10,60,0]]),
    mk('Jambes',[['squat',4,6,150,180],['presse',3,10,120,120],['sdt-roumain',3,8,120,150],['leg-curl-allonge',3,12,90,90],['mollets-debout',4,12,60,0]]));
  touchMeta();render();toast('3 séances ajoutées. Modifie-les à ta façon.');
}

/* ---------- actions ---------- */
const ACT={
  tab:d=>{if(d.v!==VIEW){navStack.push(VIEW);pushNav()}if(d.v==='pass')passScrolled=false;VIEW=d.v;try{localStorage.setItem('fonte.view',VIEW)}catch(e){}closeSheet('exo');if(VIEW!=='pass')window.scrollTo(0,0);render();if(VIEW!=='pass')window.scrollTo(0,0)},
  'new-tpl':()=>openEditor(null), edit:d=>openEditor(d.id), samples:addSamples,
  start:d=>startSession(d.id), resume:()=>openSession(),
  'ed-close':()=>{closeSheet('editor');ed=null},
  'ed-stp':d=>{const it=ed.items[+d.i],[mn,mx,st]=LIM[d.k];it[d.k]=d.k==='dur'?durBump(it.dur,+d.d):Math.min(mx,Math.max(mn,(it[d.k]??0)+st*(+d.d)));renderEditor()},
  'dur-pick':d=>{if(d.src==='ed-stp'&&ed){const it=ed.items[+d.i];if(it)openDurPicker(it.dur,v=>{it.dur=v;renderEditor()})}else if(d.src==='pe-stp'&&typeof PE!=='undefined'&&PE){progVals();const it=PE.items[+d.i];if(it)openDurPicker(it.dur,v=>{it.dur=v;renderProgEdit()})}},
  'dur-q':d=>durSet(+d.v,true),
  'dur-ok':()=>{const v=Math.max(5,durRead()),cb=durCb;durCb=null;closeModal();if(cb)cb(v)},
  'ed-uni':d=>{const it=ed.items[+d.i];if(it.uni)delete it.uni;else it.uni=true;renderEditor()},
  'ed-mode':d=>{const it=ed.items[+d.i];it.mode=d.m;if(d.m==='time'&&!it.dur)it.dur=60;renderEditor()},
  'ed-move':d=>{const i=+d.i,j=i+(+d.d);if(j<0||j>=ed.items.length)return;[ed.items[i],ed.items[j]]=[ed.items[j],ed.items[i]];renderEditor()},
  'ed-del':d=>{ed.items.splice(+d.i,1);renderEditor()},
  'ed-add':()=>openPicker('editor'),
  'ed-del-tpl':()=>{edConfirm=true;renderEditor()}, 'ed-del-no':()=>{edConfirm=false;renderEditor()},
  'ed-del-yes':()=>{S.templates=S.templates.filter(t=>t.id!==ed.id);touchMeta();closeSheet('editor');ed=null;render();toast('Séance supprimée')},
  'ed-save':()=>{if(!ed.items.length){toast('Ajoute au moins un exercice');return}const name=(ed.name||'').trim()||'Ma séance';const t={id:ed.id,name,items:ed.items};
    const k=S.templates.findIndex(x=>x.id===t.id);if(k>=0)S.templates[k]=t;else S.templates.push(t);touchMeta();closeSheet('editor');ed=null;render();toast('Séance enregistrée')},
  'pick-close':()=>{closeSheet('picker');pick=null},
  'pick-folder':d=>{pick.folder=d.id||null;renderPicker();document.querySelector('#sheet-picker .sheet-b').scrollTop=0},
  'pick-toggle':d=>{pick.sel.has(d.id)?pick.sel.delete(d.id):pick.sel.add(d.id);renderPicker()},
  'pick-done':()=>{const ids=[...pick.sel],st=S.settings;
    if(pick.target==='editor'){ids.forEach(id=>ed.items.push(newItem(id)));closeSheet('picker');pick=null;renderEditor()}
    else{ids.forEach(id=>S.active.items.push({...newItem(id),name:exo(id).name,weight:'',done:[false,false,false],repsDone:['','','']}));closeSheet('picker');pick=null;touchActive(0);renderSession()}},
  'lib-folder':d=>{libB.folder=d.id||null;$('#lib-res').innerHTML=browseRes(libB,'lib');window.scrollTo(0,0)},
  'exo-open':d=>openExo(d.id), 'exo-close':()=>closeSheet('exo'),
  'custom-new':()=>openCustom(), 'custom-close':()=>closeSheet('custom'),
  'custom-save':()=>{const name=$('#cu-name').value.trim();if(!name){$('#cu-name').focus();toast("Donne un nom à l'exercice");return}
    const e={id:'c-'+gid(),name,cat:$('#cu-cat').value,eq:$('#cu-eq').value,pat:$('#cu-pat').value};S.custom.push(e);touchMeta();closeSheet('custom');libB.folder=e.cat;libB.q='';render();toast('Exercice créé')},
  'custom-del':d=>{S.custom=S.custom.filter(e=>e.id!==d.id);touchMeta();closeSheet('exo');render();toast('Exercice supprimé')},
  hist:d=>openHist(d.id), 'hist-close':()=>{closeSheet('hist');histOpen=null},
  'hist-del':()=>{histOpen.confirm=true;renderHist()}, 'hist-del-no':()=>{histOpen.confirm=false;renderHist()},
  'hist-del-yes':()=>{const id=histOpen.id;S.sessions=S.sessions.filter(s=>s.id!==id);S.deleted.push(id);S.dirty=S.dirty.filter(t=>t!=='s:'+id);mark('d:'+id);touchMeta();buildIdx();closeSheet('hist');histOpen=null;render();toast('Séance supprimée')},
  'sess-min':()=>{closeSheet('session');render()},
  'sess-end':()=>endConfirm(), 'sess-finish':()=>{closeModal();finishSession()},
  'sess-discard':()=>{closeModal();S.active=null;touchActive(0);closeSheet('session');render();toast('Séance abandonnée')},
  'sess-add':()=>openPicker('session'),
  set:d=>toggleSet(+d.i,+d.j),
  'sx-menu':d=>{menuOpen=menuOpen===+d.i?-1:+d.i;renderSession()},
  'sx-move':d=>{const a=S.active.items,i=+d.i,j=i+(+d.d);if(j<0||j>=a.length)return;[a[i],a[j]]=[a[j],a[i]];menuOpen=j;touchActive();renderSession()},
  'sx-addset':d=>{const it=S.active.items[+d.i];it.done.push(false);(it.repsDone||(it.repsDone=[])).push('');it.sets=it.done.length;touchActive();renderSession()},
  'sx-delset':d=>{const a=S.active,i=+d.i,it=a.items[i];if(!it||it.done.length<=1)return;const j=it.done.length-1;it.done.pop();if(it.repsDone)it.repsDone.length=Math.min(it.repsDone.length,it.done.length);it.sets=it.done.length;const t=a.timer;if(t&&t.kind==='work'&&t.i===i&&t.j===j)a.timer=null;touchActive();renderSession()},
  'sx-del':d=>{S.active.items.splice(+d.i,1);menuOpen=-1;touchActive();renderSession()},
  'rest-adj':d=>{const t=S.active.timer;if(!t)return;if(t.fired){t.fired=false;t.end=Date.now()}t.end=Math.max(Date.now()+1000,t.end+(+d.d)*1000);t.total=Math.max(t.total,(t.end-Date.now())/1000);touchActive();updateRest()},
  'rest-skip':()=>{const t=S.active.timer;if(t&&t.kind==='work'){const it=S.active.items[t.i];S.active.timer=null;if(it){it.done[t.j]=true;afterSetDone(t.i)}return}S.active.timer=null;touchActive();updateRest()},
  'modal-close':()=>closeModal(),
  'map-cur':()=>scrollToCur(true),
  nd:d=>{const T=TIERS[+d.n-1],P=passAt(totalKg()),st=T.n<=P.lvl?'done':T.n===P.lvl+1?'cur':'lock';
    modal(`<div class="emo">${T.emo}</div><div class="k">Niveau ${T.n}</div><h3>${esc(T.name)}</h3><p class="muted" style="margin:0">Se débloque quand ton total soulevé atteint <b class="num">${fmtT(T.thr)}</b>.</p>
     ${st==='done'?'<div class="cmp" style="color:var(--ok)">Débloqué ✓</div>':st==='cur'?`<div class="mbar"><i style="width:${P.pct.toFixed(1)}%"></i></div><div class="mrow num"><span>${fmtT(P.into)} / ${fmtT(P.need)}</span><span>encore ${fmtT(P.need-P.into)}</span></div>`:`<div class="cmp">Encore ${fmtT(T.thr-P.t)} au total</div>`}
     <div class="acts"><button class="btn primary" data-act="modal-close">OK</button></div>`)},
  'see-pass':()=>{closeModal();ACT.tab({v:'pass'})},
  'go-back':()=>goBack(),
  'lg-mode':d=>{loginMode=d.m;showLogin()},
  logout:()=>{logoutAsk=true;accRe()}, 'logout-no':()=>{logoutAsk=false;accRe()},
  'del-ask':()=>{delAsk=true;accRe();setTimeout(()=>{const f=$('#del-form');if(f){if(!f.dataset.b){f.dataset.b='1';f.addEventListener('submit',deleteAccount)}f.scrollIntoView({block:'center'})}},30)},
  'del-no':()=>{delAsk=false;accRe()},
  'acc-open':()=>{logoutAsk=false;delAsk=false;renderAcc()},
  'acc-close':()=>{logoutAsk=false;delAsk=false;closeSheet('acc')},
  'acc-switch':d=>{if(!ACC_RE.test(d.app||''))return;if(S&&S.active){toast('Termine ou abandonne ta séance en cours avant de changer de compte.');return}accGo(d.app)},
  'acc-add':()=>{if(S&&S.active){toast('Termine ou abandonne ta séance en cours avant d\'ajouter un compte.');return}if(accList().length>=ACC_MAX){toast('5 comptes maximum sur cet appareil.');return}
    let id='';try{const b=new Uint8Array(6);crypto.getRandomValues(b);id=[...b].map(x=>(x%36).toString(36)).join('')}catch(e){id=Math.random().toString(36).slice(2,8)}
    loginMode='in';accGo('acc-'+id)},
  legal:d=>openLegal(d.k), 'legal-close':()=>closeSheet('legal'),
  'logout-yes':async()=>{logoutAsk=false;const me=ACC_APP,next=accList().find(x=>x.app!==me);accForget(me);if(next)accSwitching=true;try{await fbAuth.signOut()}catch(e){}if(next)accGo(next.app);else{closeSheet('acc');if(me!=='[DEFAULT]'){try{localStorage.removeItem('hevor.acc')}catch(e){}}}},
  pdf:(d,b)=>exportPDF(b), 'export-json':()=>exportJSON(), 'import-json':()=>$('#imp').click(),
  'set-rs':d=>{S.settings.restSet=Math.min(600,Math.max(0,S.settings.restSet+15*(+d.d)));touchMeta();render()},
  'set-re':d=>{S.settings.restExo=Math.min(600,Math.max(0,S.settings.restExo+15*(+d.d)));touchMeta();render()},
  sound:()=>{S.settings.sound=!S.settings.sound;touchMeta();render();if(S.settings.sound){unlockAudio();ding()}}
};
document.addEventListener('click',e=>{const b=e.target.closest('[data-act]');if(!b||b.disabled)return;const f=ACT[b.dataset.act];if(f){e.preventDefault();f(b.dataset,b,e)}});
document.addEventListener('input',e=>{
  const t=e.target;
  if(t.dataset.wi!=null&&S.active){const i=+t.dataset.wi,it=S.active.items[i];if(!it)return;it.weight=t.value.replace(/[^\d.,]/g,'');if(it.weight!==t.value)t.value=it.weight;
    const w=parseW(it.weight),r=recOf(it.exoId),pr=$('#prt-'+i);if(pr){const is=w!=null&&r&&w>r.w;pr.className=is?'prtag':'';pr.innerHTML=is?'Nouveau record !':'&nbsp;'}touchActive(1500);return}
  if(t.dataset.ri!=null&&S.active){const it=S.active.items[+t.dataset.ri];if(!it)return;const v=t.value.replace(/\D/g,'').slice(0,3);if(v!==t.value)t.value=v;(it.repsDone||(it.repsDone=[]))[+t.dataset.rj]=v;touchActive(1500);return}
  if(t.id==='ed-name'&&ed){ed.name=t.value;return}
  if(t.id==='lib-q'){libB.q=t.value;$('#lib-res').innerHTML=browseRes(libB,'lib');return}
  if(t.id==='pick-q'&&pick){pick.q=t.value;$('#pick-res').innerHTML=browseRes(pick,'pick');return}
});
document.addEventListener('change',e=>{if(e.target.id==='st-exo'){statsExo=e.target.value;render()}});
document.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.dataset&&e.target.dataset.wi!=null)e.target.blur();
  if(e.key==='Escape'&&($('#modal')||document.querySelector('.sheet'))){e.preventDefault();goBack()}});

/* ---------- boot ---------- */
// démarrage une fois tous les scripts chargés (espaces Club et Coach compris)
window.addEventListener('DOMContentLoaded',bootAccounts);
if('serviceWorker' in navigator&&location.protocol==='https:'){
  let reloaded=false;const hadSW=!!navigator.serviceWorker.controller;
  navigator.serviceWorker.addEventListener('controllerchange',()=>{if(hadSW&&!reloaded&&!S.active){reloaded=true;location.reload()}});
  window.addEventListener('load',()=>{navigator.serviceWorker.register('sw.js',{updateViaCache:'none'}).then(r=>{r.update();document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')r.update()})}).catch(()=>{})});
}

/* ---------- œil pour afficher le mot de passe ---------- */
const EYE='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>';
const EYE_OFF='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3l18 18"/><path d="M10.6 5.1A10.9 10.9 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-3.2 4.1M6.6 6.6C3.8 8.4 2 12 2 12s3.6 7 10 7a10 10 0 0 0 5.4-1.6"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/></svg>';
function enhancePw(root){(root||document).querySelectorAll('input[type=password]:not([data-pw])').forEach(inp=>{
  inp.dataset.pw='1';const w=document.createElement('span');w.className='pw-wrap';inp.parentNode.insertBefore(w,inp);w.appendChild(inp);
  const b=document.createElement('button');b.type='button';b.className='pw-eye';b.setAttribute('aria-label','Afficher le mot de passe');b.setAttribute('aria-pressed','false');b.innerHTML=EYE;
  b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();const show=inp.type==='password';inp.type=show?'text':'password';b.innerHTML=show?EYE_OFF:EYE;b.setAttribute('aria-pressed',String(show));b.setAttribute('aria-label',show?'Masquer le mot de passe':'Afficher le mot de passe');inp.focus()});
  w.appendChild(b)})}
new MutationObserver(()=>enhancePw()).observe(document.body,{childList:true,subtree:true});enhancePw();
