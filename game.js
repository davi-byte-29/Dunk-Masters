const $=i=>document.getElementById(i),W=900,H=450,FL=390,G=.5,GB=G*.9,RY=175,HX=72;
const cv=$('c'),cx=cv.getContext('2d'),B=v=>+!!v;
let mode,S,peer,conn,bg,run=0,acc=0,lt=0,sn=0,prevIn='',keys={},tin={l:0,r:0,j:0,h:0,d:0};
const BS=2;let K=1,gin={l:0,r:0,j:0,h:0,d:0},lat={j:0,h:0,d:0},lq=0,ping=0,pgT=0,sT=0,ra=0,jto=0;
const show=id=>document.querySelectorAll('.scr').forEach(e=>e.classList.toggle('on',e.id==id));
const mk=(x,d)=>({x,y:FL,vx:0,vy:0,d,s:0,h:0,dsh:0,dc:0,dd:1,in:{l:0,r:0,j:0,h:0,d:0}});
function reset(s,full){s.p=[mk(230,1),mk(670,-1)];s.b={x:450,y:140,vx:0,vy:0};s.cd=full?120:70;s.st='play';s.msg='';s.hold=-1;s.ng=[-1,0];s.who=-1;s.sh=0;s.dn=null;s.dk=0}
function fresh(){const s={sc:[0,0],t:60,last:-1,lx:450,gt:0};reset(s,1);return s}
const ang=p=>p.s>0?(p.h?-1.35+(14-p.s)/14*1.15:.9-2.5*Math.sin((14-p.s)/14*Math.PI)):.9;
const hand=p=>{const a=ang(p);return[p.x+p.d*(8+Math.cos(a)*46),p.y-48+Math.sin(a)*46]};

/* ---------- física ---------- */
function shoot(s,p,i){
  const b=s.b,tx=p.d>0?W-HX:HX,dx=tx-b.x,ad=Math.abs(dx),air=p.y<FL-25;
  /* arco balístico exato: sobe até 'top' e desce pelo centro do aro */
  const top=Math.max(30,Math.min(b.y,RY)-(air?60:85)-Math.min(ad,520)*.07);
  const v0=-Math.sqrt(2*GB*Math.max(20,b.y-top)),t=Math.max(18,Math.round(-v0/GB+Math.sqrt(2*(RY-top)/GB)));
  const o=s.p[1-i],near=Math.abs(o.x-p.x)<110?(o.y<FL-20?.05:.025):0,e=(air?.07:.11)+ad/W*(air?.22:.36)+near,r=()=>(Math.random()-.5)*2;
  b.vy=(RY-b.y-GB*t*(t+1)/2)/t*(1+r()*e*.4);
  b.vx=dx/t*(1+r()*e);
  s.last=i;s.lx=b.x;s.dk=0;
}
const fall=p=>{p.vy+=G;p.y+=p.vy;if(p.y>=FL){p.y=FL;p.vy=0}};
function bphys(s,solid){
  const b=s.b,py=b.y;
  b.vy+=GB;b.x+=b.vx;b.y+=b.vy;
  if(b.y>FL+8){b.y=FL+8;b.vy*=-.74;b.vx*=.97;if(Math.abs(b.vy)<1.5)b.vy=0}
  if(b.x<30){b.x=30;b.vx=Math.abs(b.vx)*.6}
  if(b.x>W-30){b.x=W-30;b.vx=-Math.abs(b.vx)*.6}
  if(b.y<14){b.y=14;b.vy=Math.abs(b.vy)*.5}
  if(!solid)return py;
  if(b.y>66&&b.y<204){/* tabela */
    if(b.x<46&&b.vx<0){b.x=46;b.vx=Math.abs(b.vx)*.55}
    if(b.x>W-46&&b.vx>0){b.x=W-46;b.vx=-Math.abs(b.vx)*.55}}
  [106,W-106].forEach(x=>{const dx=b.x-x,dy=b.y-RY,d=Math.hypot(dx,dy);
    if(d<17&&d>0){const nx=dx/d,ny=dy/d,dot=b.vx*nx+b.vy*ny;b.x=x+nx*17;b.y=RY+ny*17;
      if(dot<0){b.vx-=1.5*dot*nx;b.vy-=1.5*dot*ny}}});
  return py}
/* enterrada: 0-20 impulso • 20-30 prepara • 30-37 crava • 37-72 pendurado no aro */
function dunkStep(s){
  const D=s.dn,p=s.p[D.i],d=p.d,tx=D.tx,b=s.b,t=++D.t,E=u=>u*u*(3-2*u);
  const cX=tx-d*70,cY=RY+84,hX=tx-d*52,hY=RY+76;let x,y;
  if(t<=20){const u=t/20;x=D.sx+(cX-D.sx)*E(u);y=D.sy+(cY-D.sy)*(1-(1-u)*(1-u))}
  else if(t<=37){const u=E((t-20)/17);x=cX+(hX-cX)*u;y=cY+(hY-cY)*u-Math.sin(u*Math.PI)*10}
  else{const u=t-37;x=hX+d*Math.sin(u/7)*3;y=hY+Math.min(u,26)*.7+Math.sin(u/5)*3}
  p.x=x;p.y=y;p.vx=p.vy=0;
  if(t<=37){const u=t<30?0:E((t-30)/7),ox=p.x+d*26,oy=p.y-120;b.x=ox+(tx-ox)*u;b.y=oy+(RY+14-oy)*u;b.vx=b.vy=0}
  if(t==37&&s.st=='play'){s.hold=-1;s.ng=[-1,0];b.vy=4;s.last=D.i;s.sc[D.i]+=2;s.who=D.i;s.st='goal';s.gt=120;s.msg='ENTERRADA! +2';s.dk=1}
  if(t>=72){s.dn=null;p.vy=0}
}
function step(s){
  if(s.st=='goal'){
    s.p.forEach((p,i)=>{if(s.dn&&s.dn.i==i)return;p.vx=0;p.dsh=0;fall(p)});
    if(s.dn)dunkStep(s);bphys(s,0);
    if(--s.gt<=0)reset(s,0);return}
  if(s.st!='play')return;
  s.p.forEach((p,i)=>{const n=p.in;if(s.dn&&s.dn.i==i)return;
    if(p.dc>0)p.dc--;
    if(n.d&&p.dc<=0&&p.dsh<=0){p.dsh=12;p.dc=60;p.dd=(n.r-n.l)||p.d}
    if(p.dsh>0){p.dsh--;p.vx=p.dd*10.5}else p.vx=(n.r-n.l)*5.4;
    if(n.j&&p.y>=FL)p.vy=-12;
    if(n.h&&p.s<=0){p.s=14;p.h=0;
      if(s.hold==i&&s.cd<=0&&!s.dn){const tx=p.d>0?W-HX:HX;
        if(p.y<FL-30&&(tx-p.x)*p.d>-20&&Math.abs(tx-p.x)<230){s.dn={i,t:0,sx:p.x,sy:p.y,tx};p.s=0}/* enterrada! */
        else{p.h=1;s.b.x=p.x+p.d*16;s.b.y=p.y-102;shoot(s,p,i);s.hold=-1;s.ng=[i,25]}}}
    if(p.s>0)p.s--;
    p.vy+=G;p.x=Math.max(50,Math.min(W-50,p.x+p.vx));p.y+=p.vy;if(p.y>=FL){p.y=FL;p.vy=0}});
  if(s.cd>0){s.cd--;return}
  const b=s.b;s.t-=1/60;
  if(s.ng[1]>0)s.ng[1]--;
  if(s.dn)dunkStep(s);
  else{
    s.p.forEach((p,i)=>{
      if(p.s>0&&!p.h){const[hx,hy]=hand(p);if(Math.hypot(b.x-hx,b.y-hy)<44){p.h=1;
        if(s.hold<0)shoot(s,p,i);else if(s.hold!=i){s.hold=i;s.ng=[-1,0]}}}});
    s.p.forEach((p,i)=>{/* dash: arranca a bola da mão do outro jogador */
      if(p.dsh>0&&s.hold>=0&&s.hold!=i&&Math.hypot(b.x-(p.x+p.d*20),b.y-(p.y-48))<46){
        const o=s.p[s.hold];s.hold=i;s.ng=[-1,0];s.sh=0;o.dsh=0;o.x=Math.max(50,Math.min(W-50,o.x+p.dd*22));p.dsh=Math.min(p.dsh,3)}});
    if(s.hold<0)s.p.forEach((p,i)=>{
      if(s.hold<0&&!(s.ng[0]==i&&s.ng[1]>0)&&Math.hypot(b.x-(p.x+p.d*8),b.y-(p.y-55))<46)s.hold=i});
    if(s.hold>=0){s.sh++;if(s.sh>420){const h=s.hold;s.hold=-1;s.ng=[h,40];b.vy=-6;b.vx=-s.p[h].d*3}}else s.sh=0;
    if(s.hold>=0){const p=s.p[s.hold];b.x=p.x+p.d*26;b.y=p.y-46+Math.sin(p.x/8)*(p.vx?4:0);b.vx=b.vy=0}
    else{
      const py=bphys(s,1);
      [[HX,1],[W-HX,0]].forEach(([x,who])=>{
        if(s.st=='play'&&py<RY&&b.y>=RY&&b.vy>0&&Math.abs(b.x-x)<26){
          const far=Math.abs(s.lx-(who?HX:W-HX))>420,pts=(s.last==who&&far)?3:2;
          s.sc[who]+=pts;s.who=who;s.st='goal';s.gt=110;s.dk=0;b.vx=(x-b.x)*.08;s.msg=pts==3?'TRIPLE! +3':'CESTA! +2'}});
    }
  }
  if(s.t<=0&&s.st=='play'){s.t=0;s.st='end'}
}

/* ---------- visual ---------- */
function star(g,x,y,r,c){g.fillStyle=c;g.beginPath();for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,q=i%2?r*.45:r;g.lineTo(x+Math.cos(a)*q,y+Math.sin(a)*q)}g.fill()}
function hoop(g){
  g.fillStyle='#0a1433';g.fillRect(0,290,16,130);
  g.fillStyle='#00e5ff';g.fillRect(14,290,2,130);star(g,8,350,6,'#00e5ff');
  g.fillStyle='#4a5a8c';g.fillRect(14,190,5,110);
  g.fillStyle='#2a3566';g.fillRect(12,196,10,10);g.fillStyle='#00e5ff';g.fillRect(16,196,3,10);
}
function board(side){
  cx.save();if(side){cx.translate(W,0);cx.scale(-1,1)}
  const k=rimK[side];cx.translate(Math.sin(T/26)*k*3,0);
  cx.save();cx.shadowColor='#00e5ff';cx.shadowBlur=10;cx.fillStyle='rgba(120,225,255,.30)';cx.strokeStyle='#00e5ff';cx.lineWidth=3;
  cx.fillRect(16,70,16,130);cx.strokeRect(16,70,16,130);cx.restore();
  cx.fillStyle='#ffffff55';cx.fillRect(19,76,4,118);
  cx.strokeStyle='#ff2e88';cx.lineWidth=3;cx.strokeRect(17,128,12,40);
  cx.save();cx.translate(32,RY);cx.rotate(k*(.16+Math.sin(T/40)*.06));
  cx.shadowColor='#ff7a1a';cx.shadowBlur=8;
  cx.strokeStyle='#ff7a1a';cx.lineWidth=6;cx.beginPath();cx.moveTo(0,0);cx.lineTo(74,0);cx.stroke();
  cx.shadowBlur=0;cx.fillStyle='#ffb066';cx.fillRect(0,-3,74,2);cx.restore();cx.restore();
}
function mkBg(){
  const c=document.createElement('canvas');c.width=W*BS;c.height=H*BS;const g=c.getContext('2d');g.scale(BS,BS);
  let s=7;const R=()=>(s=s*16807%2147483647)/2147483647;
  cr=document.createElement('canvas');cr.width=W*BS;cr.height=H*BS;const g2=cr.getContext('2d');g2.scale(BS,BS);
  /* plateia de LEDs */
  g2.fillStyle='#050a1c';g2.fillRect(0,0,W,H);
  const cols=['#00e5ff','#7c4dff','#ff2e88','#1b5cff','#0e2a5e','#12204a'];
  for(let y=40;y<250;y+=13)for(let x=(y/13%2)*6;x<W;x+=13){
    g2.fillStyle='#0a1230';g2.fillRect(x-4,y+4,9,9);
    const col=cols[R()*6|0];g2.globalAlpha=R()<.5?.55:.9;g2.fillStyle=col;g2.beginPath();g2.arc(x,y,4.2,0,7);g2.fill()}
  g2.globalAlpha=1;g2.fillStyle='rgba(2,5,18,.38)';g2.fillRect(0,0,W,260);
  /* treliça de luz no teto */
  g.fillStyle='#070d22';g.fillRect(0,0,W,22);g.fillStyle='#00e5ff55';g.fillRect(0,21,W,2);
  for(let x=20,n=0;x<W;x+=60,n++){g.save();g.shadowColor=n%2?'#ff2e88':'#00e5ff';g.shadowBlur=14;g.fillStyle=n%2?'#ffb0d4':'#c8fbff';g.beginPath();g.arc(x,12,5.5,0,7);g.fill();g.restore()}
  /* painéis holográficos */
  [190,330,570,710].forEach((x,n)=>{const col=n%2?'#ff2e88':'#00e5ff';
    g.save();g.shadowColor=col;g.shadowBlur=14;g.fillStyle='#07123a';g.beginPath();g.moveTo(x-22,75);g.lineTo(x+22,75);g.lineTo(x+22,150);g.lineTo(x,168);g.lineTo(x-22,150);g.closePath();g.fill();
    g.strokeStyle=col;g.lineWidth=2.5;g.stroke();g.restore();
    g.strokeStyle='rgba(255,255,255,.07)';g.lineWidth=1;for(let y=80;y<150;y+=4){g.beginPath();g.moveTo(x-20,y);g.lineTo(x+20,y);g.stroke()}
    g.strokeStyle=col;g.lineWidth=2;g.beginPath();g.arc(x,112,13,0,7);g.moveTo(x-13,112);g.lineTo(x+13,112);g.moveTo(x,99);g.lineTo(x,125);g.stroke();
    g.fillStyle='#fff';g.beginPath();g.arc(x,112,3,0,7);g.fill()});
  g.save();g.shadowColor='#7c4dff';g.shadowBlur=10;g.strokeStyle='#7c4dff';g.lineWidth=4;g.beginPath();g.moveTo(0,70);g.quadraticCurveTo(450,115,W,70);g.stroke();g.restore();
  /* faixa LED */
  g.fillStyle='#070d22';g.fillRect(0,250,W,26);
  g.fillStyle='#00e5ff55';for(let x=6;x<W;x+=30)g.fillRect(x,258,14,3);
  g.save();g.shadowColor='#00e5ff';g.shadowBlur=10;g.fillStyle='#00e5ff';g.fillRect(0,272,W,3);g.restore();
  /* quadra escura com linhas neon */
  const f=g.createLinearGradient(0,276,0,H);f.addColorStop(0,'#0d1840');f.addColorStop(1,'#040816');
  g.fillStyle=f;g.fillRect(0,276,W,H-276);
  g.strokeStyle='rgba(0,229,255,.10)';g.lineWidth=1;for(let x=0;x<W;x+=45){g.beginPath();g.moveTo(x,276);g.lineTo(x-(450-x)*.18,H);g.stroke()}
  g.strokeStyle='rgba(0,229,255,.07)';[292,316,344,378,414].forEach(y=>{g.beginPath();g.moveTo(0,y);g.lineTo(W,y);g.stroke()});
  g.fillStyle='rgba(124,77,255,.5)';g.fillRect(0,300,W,10);
  g.save();g.shadowColor='#00e5ff';g.shadowBlur=10;g.lineWidth=2;g.strokeStyle='#00e5ff';g.fillStyle='rgba(0,229,255,.10)';
  [[110,362],[790,362]].forEach(([x,y])=>{g.beginPath();g.ellipse(x,y,115,36,0,0,7);g.fill();g.stroke()});
  g.strokeStyle='#7ff3ff';g.lineWidth=2.5;g.beginPath();g.moveTo(450,310);g.lineTo(450,H);g.stroke();
  g.fillStyle='rgba(124,77,255,.22)';g.beginPath();g.ellipse(450,375,125,30,0,0,7);g.fill();g.stroke();g.restore();
  star(g,450,375,34,'rgba(127,243,255,.55)');
  /* rodapé */
  g.fillStyle='#050a1e';g.fillRect(0,418,W,32);g.fillStyle='#00e5ff88';g.fillRect(0,418,W,2);
  g.save();g.shadowColor='#00e5ff';g.shadowBlur=8;g.fillStyle='#7ff3ff';g.font='19px Impact,sans-serif';g.textAlign='center';g.fillText('D U N K   M A S T E R S   •   N E O N   A R E N A',450,441);g.restore();
  hoop(g);g.save();g.translate(W,0);g.scale(-1,1);hoop(g);g.restore();
  return c;
}
const PL=[{sk:'#8a5a44',sd:'#6a4231',jc:'#0aa5ff',jd:'#064a8a',jt:'#00ffd5',sh:'#00e5ff',hr:'#15151c',bd:'#00e5ff',wb:'#fff',n:'1',ch:1},{sk:'#f2c4a0',sd:'#d49a76',jc:'#ff2e88',jd:'#8a0f4a',jt:'#fff',sh:'#ffd23f',hr:'#ff3b2f',bd:null,wb:'#ffd23f',n:'2',kp:'#2a2a3a'}];
let cr,vg,P=[],shake=0,flash=0,prev=null,excite=0,netT=0,netSide=0,rimK=[0,0],zoom=0,zx=450,fire=[0,0],sz=[0,0],bsq=0,brot=0,trail=[],dp,db,T=0,AC;
/* som */
const snd=(f,d,t='sine',v=.12,e=0)=>{try{AC=AC||new AudioContext();const o=AC.createOscillator(),g=AC.createGain(),n=AC.currentTime;o.type=t;o.frequency.setValueAtTime(f,n);if(e)o.frequency.exponentialRampToValueAtTime(e,n+d);g.gain.setValueAtTime(v,n);g.gain.exponentialRampToValueAtTime(.001,n+d);o.connect(g).connect(AC.destination);o.start();o.stop(n+d)}catch(x){}};
const SFX={bounce:()=>snd(160,.12,'sine',.25,60),shot:()=>snd(300,.15,'triangle',.12,700),swish:()=>snd(1100,.35,'sawtooth',.04,300),goal:()=>{snd(523,.15,'square',.07);setTimeout(()=>snd(784,.3,'square',.07),130)},grab:()=>snd(220,.08,'square',.05),dunk:()=>{snd(95,.4,'sawtooth',.3,40);snd(1600,.25,'square',.05,200)},dash:()=>snd(500,.2,'sawtooth',.05,140),whistle:()=>snd(1900,.45,'sine',.1,1600),jump:()=>snd(250,.1,'sine',.07,450)};
/* partículas e efeitos */
const sp=(x,y,n,o={})=>{for(let i=0;i<n;i++){const a=(o.a??Math.random()*6.28)+(Math.random()-.5)*(o.sp??6.28),v=(o.v||3)*(.4+Math.random());P.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,l:o.l||30,m:o.l||30,ring:o.ring,c:o.c||'#fff',r:o.r||3,g:o.g??.15})}};
function fx(s){
  if(prev){
    s.p.forEach((p,i)=>{const q=prev.p[i];
      if(q.y<FL-8&&p.y>=FL){sp(p.x,FL+6,10,{a:-Math.PI/2,sp:2.6,v:2.5,c:'#6fc8ff',l:24,g:.05});sz[i]=.3;SFX.bounce()}
      if(q.y>=FL&&p.vy<-5){sz[i]=-.28;SFX.jump()}
      if(p.vx&&p.y>=FL&&Math.random()<.3)sp(p.x,FL+6,1,{a:-Math.PI/2,sp:1,v:1,c:'#6fc8ffaa',r:2,l:16,g:0})});
    if(prev.hold>=0&&s.hold<0&&s.st=='play'){SFX.shot();sp(s.b.x,s.b.y,8,{c:'#ffb347',v:3,l:20})}
    if(prev.hold<0&&s.hold>=0)SFX.grab();
    s.p.forEach((p,i)=>{if(prev.p[i].ds==0&&p.dsh>0){SFX.dash();sp(p.x-p.dd*14,FL+4,8,{a:p.dd>0?Math.PI:0,sp:.8,v:3,c:'#6fc8ff',l:20,g:0,r:3})}
      if(p.dsh>0&&p.y>=FL-2)sp(p.x-p.dd*12,p.y-10-Math.random()*40,1,{a:p.dd>0?Math.PI:0,sp:.2,v:4,c:'#ffffffaa',l:12,g:0,r:2.5})});
    if(prev.hold>=0&&s.hold>=0&&prev.hold!=s.hold&&s.st=='play'){shake=Math.max(shake,8);flash=Math.max(flash,.2);SFX.grab();SFX.bounce();const b=s.b;sp(b.x,b.y,16,{c:'#7fe7ff',v:5,l:24,g:.05,r:3});sp(b.x,b.y,10,{c:'#fff',v:3,l:16,g:0})}
    const b=s.b;
    if(s.hold<0&&prev.b.vy>2&&b.vy<0&&b.y>FL){SFX.bounce();bsq=.5;sp(b.x,FL+10,5,{a:-Math.PI/2,sp:2,c:'#6fc8ff',l:18})}
    if(s.hold<0&&s.last>=0&&fire[s.last]>=2&&Math.random()<.8)sp(b.x,b.y,1,{c:'#ff7a1a',v:1,l:18,g:-.05,r:5});
    if(prev.st!='goal'&&s.st=='goal'){const who=s.who,hx=who?HX:W-HX;
      fire[who]++;fire[1-who]=0;netT=30;netSide=who?0:1;excite=1;shake=s.dk?32:12;flash=s.dk?.8:.55;rimK[netSide]=s.dk?1:.35;SFX.goal();SFX.swish();
      if(s.dk){zoom=1;zx=hx;SFX.dunk();sp(hx,RY,1,{ring:140,c:'#ffd23f',v:.001,l:24,g:0});sp(hx,RY,1,{ring:80,c:'#fff',v:.001,l:16,g:0});sp(hx,RY+20,26,{c:'#ffb347',v:7,l:34,g:.2,r:4})}
      ['#00e5ff','#ff2e88','#7c4dff','#ffd23f','#fff'].forEach(c=>sp(hx,RY+30,14,{c,v:6,l:60,g:.12,r:4}))}
    if(prev.st!='end'&&s.st=='end')SFX.whistle();
    if(prev.cd>0&&s.cd==0&&s.st=='play')SFX.whistle();
    if(!prev.dn&&s.dn){SFX.jump();const p=s.p[s.dn.i];sp(p.x,FL+6,14,{a:-Math.PI/2,sp:3,v:3,c:'#6fc8ff',l:26,g:.05})}
    if(s.dn&&s.dn.t<=37){const p=s.p[s.dn.i];sp(p.x,p.y-60,1,{c:PL[s.dn.i].jc,v:.6,l:16,g:0,r:7})}
  }
  prev={dn:!!s.dn,p:s.p.map(p=>({y:p.y,ds:p.dsh})),b:{...s.b},hold:s.hold,st:s.st,cd:s.cd};
}
function update(s){
  T=performance.now();fx(s);const k=mode=='guest'?.5:1;
  s.p.forEach((p,i)=>{const d=dp[i];if(Math.abs(p.x-d.x)>150){d.x=p.x;d.y=p.y}d.x+=(p.x-d.x)*k;d.y+=(p.y-d.y)*k;sz[i]*=.85});
  if(Math.hypot(s.b.x-db.x,s.b.y-db.y)>150){db.x=s.b.x;db.y=s.b.y}
  db.x+=(s.b.x-db.x)*k;db.y+=(s.b.y-db.y)*k;
  brot+=(s.hold>=0?s.p[s.hold].vx:s.b.vx)*.05;bsq*=.8;
  if(s.hold<0&&Math.hypot(s.b.vx,s.b.vy)>7){trail.push([db.x,db.y]);if(trail.length>9)trail.shift()}else if(trail.length)trail.shift();
  P=P.filter(q=>(q.l--,q.x+=q.vx,q.y+=q.vy,q.vy+=q.g,q.l>0)).slice(-400);
  shake*=.88;flash*=.9;zoom*=.92;rimK=rimK.map(v=>v*.95);excite*=.985;if(netT>0)netT--;
  if(Math.random()<.06+excite*.3)P.push({x:Math.random()*W,y:40+Math.random()*190,vx:0,vy:0,l:6,m:6,c:'#fff',r:4,g:0});
}
/* desenho */
function net(side){
  cx.save();if(side){cx.translate(W,0);cx.scale(-1,1)}
  const k=netSide==side?netT/30:0,sw=Math.sin(netT*.7)*k*9,st=Math.sin(k*Math.PI)*14;
  cx.strokeStyle='#ffffffd0';cx.lineWidth=1.6;
  for(let i=0;i<=5;i++){const tx=36+i*13.2,bx=48+i*9.6+sw;cx.beginPath();cx.moveTo(tx,RY+3);cx.quadraticCurveTo((tx+bx)/2+sw*.4,RY+22,bx,RY+44+st);cx.stroke()}
  for(let j=1;j<=4;j++){const y=RY+3+(41+st)*j/4,o=sw*j/4;cx.beginPath();cx.moveTo(36+12*j/4+o,y);cx.lineTo(102-6*j/4+o,y);cx.stroke()}
  cx.restore();
}
function player(p,i,s){
  const k=PL[i],t=T,ph=p.x/11,air=p.y<FL-4,du=s.dn&&s.dn.i==i?s.dn:null,mv=Math.abs(p.vx)>.5&&!air,hold=s.hold==i,
    cel=!du&&s.st=='goal'&&s.who==i,sad=s.st=='goal'&&s.who==1-i,hp=cel||!!du;
  const bob=du?0:cel?-Math.abs(Math.sin(t/110))*22:mv?-Math.abs(Math.sin(ph*2))*3:Math.sin(t/260+i*2)*-1.2;
  const q=sz[i],lean=du?-.08:p.dsh>0?.3*p.dd*p.d:(p.vx*p.d)*.012;
  cx.save();cx.translate(p.x,p.y+bob);cx.scale(p.d*(1+q*.5),1-q);
  cx.translate(0,-30);cx.rotate(lean);cx.translate(0,30);cx.lineCap='round';cx.lineJoin='round';
  const ln=(a,b,c,d,w,col)=>{cx.strokeStyle=col;cx.lineWidth=w;cx.beginPath();cx.moveTo(a,b);cx.lineTo(c,d);cx.stroke()};
  const arm=(sx,a,len,bk)=>{
    if(!du)len*=.78;const c=bk?k.sd:k.sk,sa=Math.sin(a),ca=Math.cos(a),hx=sx+ca*len,hy=-50+sa*len,bend=Math.min(6,len*.16),sg=sa<-.3?1:-1,
      ex=(sx+hx)/2+sg*sa*bend,ey=(-50+hy)/2-sg*ca*bend,P=(x1,y1,x2,y2,r)=>[x1+(x2-x1)*r,y1+(y2-y1)*r];
    ln(sx,-50,ex,ey,9,c);ln(ex,ey,hx,hy,7.5,c);
    cx.fillStyle=c;cx.beginPath();cx.arc(ex,ey,3.8,0,7);cx.fill();
    if(!bk){let p0=P(sx,-50,ex,ey,.2),p1=P(sx,-50,ex,ey,.8);ln(p0[0],p0[1]-1.5,p1[0],p1[1]-1.5,3,'rgba(255,255,255,.2)');
      p0=P(sx,-50,ex,ey,.3);p1=P(sx,-50,ex,ey,.9);ln(p0[0],p0[1]+3,p1[0],p1[1]+3,2.5,'rgba(0,0,0,.12)')}
    const w1=P(ex,ey,hx,hy,.62),w2=P(ex,ey,hx,hy,.84);
    ln(w1[0],w1[1],w2[0],w2[1],8.6,k.wb);ln(w1[0],w1[1],w2[0],w2[1],1.4,k.jt=='#fff'?k.jc:k.jt);
    cx.fillStyle=c;cx.beginPath();cx.ellipse(hx+ca*2,hy+sa*2,6,5.4,a,0,7);cx.fill();
    cx.fillStyle=k.sd;cx.beginPath();cx.arc(hx+Math.cos(a-1.05)*4.6+ca*2,hy+Math.sin(a-1.05)*4.6+sa*2,2.3,0,7);cx.fill();
    cx.strokeStyle='rgba(0,0,0,.22)';cx.lineWidth=1;cx.beginPath();
    for(let n=-1;n<=1;n+=2){const q=a+n*.35;cx.moveTo(hx+Math.cos(q)*3.2+ca*2,hy+Math.sin(q)*3.2+sa*2);cx.lineTo(hx+Math.cos(q)*6.6+ca*2,hy+Math.sin(q)*6.6+sa*2)}cx.stroke();
    };
  let a1,l1,a2,l2;
  if(du){const g=du.t<=37?[db.x,db.y]:[du.tx-p.d*30,RY-2],ai=(sx,dy)=>{const lx=(g[0]-p.x)*p.d-sx,ly=g[1]+dy-p.y+50;return[Math.atan2(ly,lx),Math.min(80,Math.hypot(lx,ly))]};
    [a2,l2]=ai(-8,3);[a1,l1]=ai(8,-3)}
  else{a2=hold?.25:cel?-1.2:air?-1.2:mv?1.5+Math.sin(ph)*.8:1.5+Math.sin(t/300)*.06;l2=hold?22:38;a1=cel?-1.9:hold?.05:ang(p);l1=hold?20:42}
  const up=du||cel;
  arm(-8,a2,l2,1);
  [-1,1].forEach(sx=>{const w=ph+(sx>0?0:Math.PI),bk=sx<0;
    const fo=du?[sx>0?15:-9,sx>0?-13:-3]:air?[sx*(p.vy<0?4:10),p.vy<0?-14:-3]:mv?[sx*3+Math.sin(w)*12,-Math.max(0,Math.cos(w))*7]:[sx*7,0];
    const hx=sx*6,hy=-24,fx=fo[0],fy=-10+fo[1],f=r=>[hx+(fx-hx)*r,hy+(fy-hy)*r];
    ln(hx,hy,fx,fy,10,bk?k.sd:k.sk);let u=f(.5),v=f(1);ln(u[0],u[1],v[0],v[1],11,'#fff');
    u=f(.58);v=f(.7);ln(u[0],u[1],v[0],v[1],11,k.jt=='#fff'?k.jc:k.jt);
    if(k.kp&&!bk){u=f(.18);v=f(.4);ln(u[0],u[1],v[0],v[1],12,k.kp)}
    cx.fillStyle='#222';cx.beginPath();cx.ellipse(fx+3,fy+6.5,14,5,0,0,7);cx.fill();
    cx.fillStyle=k.sh;cx.beginPath();cx.ellipse(fx+3,fy+3.5,13,7,0,0,7);cx.fill();
    cx.fillStyle='#fff';cx.beginPath();cx.ellipse(fx+10,fy+4.5,5,4,0,0,7);cx.fill();
    cx.fillStyle=k.jt=='#fff'?k.jc:k.jt;cx.beginPath();cx.ellipse(fx-7,fy+3,4,5,0,0,7);cx.fill();ln(fx-6,fy+5,fx+8,fy+6,1.6,'#fff');ln(fx-2,fy+1,fx+4,fy-1,2,'#fff');ln(fx+1,fy+3,fx+7,fy+1,2,'#fff')});
  cx.fillStyle=k.skn||k.sk;cx.fillRect(-6,-72,12,12);cx.fillStyle='rgba(0,0,0,.18)';cx.fillRect(-6,-72,12,5);
  cx.fillStyle=k.jd;cx.beginPath();cx.roundRect(-18,-34,36,16,4);cx.fill();
  cx.fillStyle=k.jt;cx.fillRect(-18,-34,36,3);cx.fillRect(10,-30,3,12);
  cx.fillStyle=k.jc;cx.beginPath();cx.roundRect(-17,-62,34,32,8);cx.fill();
  cx.fillStyle='rgba(0,0,0,.18)';cx.beginPath();cx.roundRect(-17,-62,13,32,[8,0,0,8]);cx.fill();
  cx.strokeStyle=k.jt;cx.lineWidth=2;cx.beginPath();cx.moveTo(-14,-61);cx.lineTo(-8,-62);cx.moveTo(14,-61);cx.lineTo(8,-62);cx.stroke();
  cx.fillStyle='#ffffff30';cx.beginPath();cx.roundRect(8,-58,6,10,3);cx.fill();
  cx.fillStyle=k.jt;cx.fillRect(-17,-33,34,3);ln(-15,-58,-15,-35,2.5,k.jt);
  cx.fillStyle='#ffffff45';cx.fillRect(-4,-47,21,2);
  cx.fillStyle=k.sk;cx.beginPath();cx.moveTo(-8,-62);cx.lineTo(0,-51);cx.lineTo(8,-62);cx.fill();
  ln(-8,-62,0,-51,2.4,k.jt);ln(0,-51,8,-62,2.4,k.jt);
  if(k.ch){cx.strokeStyle='#ffd23f';cx.lineWidth=2;cx.beginPath();cx.arc(0,-64,9,.3,Math.PI-.3);cx.stroke();cx.fillStyle='#ffd23f';cx.beginPath();cx.arc(0,-54.5,2.6,0,7);cx.fill()}
  cx.fillStyle='#fff';cx.font='bold 17px Arial';cx.textAlign='center';cx.lineWidth=3;cx.strokeStyle=k.jd;
  cx.save();cx.scale(p.d,1);cx.strokeText(k.n,0,-31);cx.fillText(k.n,0,-31);cx.restore();
  const a=a1;
  if(p.s>0&&!hold&&!du){cx.strokeStyle='rgba(255,255,255,.5)';cx.lineWidth=5;cx.beginPath();cx.arc(8,-50,48,a-.1,a+.9);cx.stroke()}
  if(!up)arm(8,a,l1,0);
  cx.save();cx.translate(0,-84);cx.rotate(lean*.8+(sad?.12:0));
  if(i==0){cx.fillStyle=k.hr;cx.beginPath();cx.ellipse(-8,-14,30,25,0,0,7);cx.fill()}
  else{cx.fillStyle=k.hr;cx.beginPath();cx.moveTo(-18,-20);cx.quadraticCurveTo(-48,-16,-42,14);cx.quadraticCurveTo(-32,2,-18,-4);cx.fill()}
  cx.fillStyle=k.sd;cx.beginPath();cx.ellipse(-24,3,6,9,0,0,7);cx.fill();
  if(i==0){cx.fillStyle='#ffd23f';cx.beginPath();cx.arc(-25,10,2.4,0,7);cx.fill()}
  cx.fillStyle=k.sk;cx.beginPath();cx.ellipse(0,0,27,30,0,0,7);cx.fill();
  cx.strokeStyle='rgba(0,0,0,.2)';cx.lineWidth=2;cx.beginPath();cx.ellipse(0,0,27,30,0,0,7);cx.stroke();
  cx.fillStyle='rgba(255,255,255,.16)';cx.beginPath();cx.ellipse(8,-10,13,10,-.4,0,7);cx.fill();
  cx.fillStyle='rgba(0,0,0,.1)';cx.beginPath();cx.ellipse(0,0,27,30,0,.5,Math.PI-.5);cx.fill();
  if(i==0){cx.fillStyle='#111d';cx.beginPath();cx.ellipse(0,0,27,30,0,.45,Math.PI-.45);cx.fill();cx.beginPath();cx.ellipse(12,12,9,3.5,0,0,7);cx.fill()}
  cx.fillStyle=k.sd;cx.beginPath();cx.ellipse(26,4,4.5,4,0,0,7);cx.fill();
  cx.fillStyle='rgba(255,80,90,.28)';cx.beginPath();cx.arc(15,9,6,0,7);cx.fill();
  if(i){cx.fillStyle='#b86a3a';[[18,5],[13,7],[21,10],[10,11],[16,12]].forEach(([x,y])=>{cx.beginPath();cx.arc(x,y,1.1,0,7);cx.fill()})}
  cx.fillStyle=k.hr;cx.beginPath();cx.ellipse(0,-17,28,14,0,Math.PI,0);cx.fill();
  if(i==0){cx.fillRect(-28,-18,6,16);cx.fillStyle='#3a3a4a';cx.beginPath();cx.ellipse(6,-26,14,3,-.2,0,7);cx.fill();
    cx.strokeStyle='#3a3a4a';cx.lineWidth=1.6;[[-14,-22],[-3,-26],[8,-23]].forEach(([x,y])=>{cx.beginPath();cx.arc(x,y,6,Math.PI*1.1,Math.PI*1.9);cx.stroke()});
    cx.fillStyle=k.bd;cx.fillRect(-27.5,-14,55,7);cx.fillStyle='#fff';cx.fillRect(-27.5,-11.5,55,1.6)}
  else{cx.fillStyle=k.hr;for(let n=-3;n<=3;n++){cx.beginPath();cx.moveTo(n*8-7,-26);cx.lineTo(n*8+5,-54+Math.abs(n)*4);cx.lineTo(n*8+8,-24);cx.fill()}
    cx.beginPath();cx.ellipse(12,-23,10,6,.3,0,7);cx.fill();
    cx.strokeStyle='#ff8a70';cx.lineWidth=1.8;for(let n=-2;n<=2;n++){cx.beginPath();cx.moveTo(n*8,-28);cx.lineTo(n*8+4,-44+Math.abs(n)*3);cx.stroke()}cx.fillStyle='#ff8a70';cx.beginPath();cx.ellipse(2,-30,8,3,.2,0,7);cx.fill()}
  const bl=t%3200<130?.15:1,lk=Math.max(-2,Math.min(2,(db.x-p.x)*p.d/90));
  cx.fillStyle='#fff';cx.beginPath();cx.ellipse(10,-2,6.5,6*bl,0,0,7);cx.ellipse(-4,-2,5.5,6*bl,0,0,7);cx.fill();
  cx.fillStyle=i?'#2a6bd8':'#2a1a10';cx.beginPath();cx.arc(12+lk,-2,3.2,0,7);cx.arc(-2+lk,-2,3,0,7);cx.fill();
  cx.fillStyle='#111';cx.beginPath();cx.arc(12+lk,-2,1.8,0,7);cx.arc(-2+lk,-2,1.7,0,7);cx.fill();
  cx.fillStyle='#fff';cx.beginPath();cx.arc(13+lk,-3.4,1,0,7);cx.arc(-1+lk,-3.4,.9,0,7);cx.fill();
  cx.strokeStyle=k.hr;cx.lineWidth=3.6;const ang_=(p.s>0||sad||du)?.35:0;
  cx.beginPath();cx.moveTo(5,-10-ang_*8);cx.lineTo(15,-10+ang_*10);cx.moveTo(-10,-10+ang_*10);cx.lineTo(0,-10-ang_*8);cx.stroke();
  cx.strokeStyle='#300';cx.fillStyle='#5a0a0a';cx.lineWidth=3;cx.beginPath();
  if(hp||p.s>0){cx.ellipse(5,14,7,hp?8:5,0,0,7);cx.fill();cx.fillStyle='#fff';cx.fillRect(-1,8,12,3);cx.fillStyle='#e8607a';cx.beginPath();cx.ellipse(5,19,4,2.5,0,0,7);cx.fill()}
  else if(sad)cx.arc(5,20,6,Math.PI+.2,-.2);else cx.arc(5,10,6,.1,Math.PI-.1);
  cx.stroke();cx.restore();
  if(up)arm(8,a,l1,0);
  cx.restore();
}
function ball(s){
  const b=db,h=FL+8-b.y,sh=Math.max(.4,1-h/380),on=s.last>=0&&fire[s.last]>=2;
  cx.fillStyle='rgba(0,0,0,'+.3*sh+')';cx.beginPath();cx.ellipse(b.x,FL+16,13*sh,4*sh,0,0,7);cx.fill();
  trail.forEach((q,i)=>{cx.fillStyle='rgba(255,150,50,'+i/trail.length*.35+')';cx.beginPath();cx.arc(q[0],q[1],14*i/trail.length,0,7);cx.fill()});
  cx.save();cx.translate(b.x,b.y);cx.scale(1+bsq*.4,1-bsq*.4);cx.rotate(brot);
  if(on){cx.shadowColor='#ff6a00';cx.shadowBlur=20}
  const g=cx.createRadialGradient(-4,-5,2,0,0,14);g.addColorStop(0,'#ffa550');g.addColorStop(1,'#c4500f');
  cx.fillStyle=g;cx.beginPath();cx.arc(0,0,14,0,7);cx.fill();cx.shadowBlur=0;
  cx.strokeStyle='#2a1208';cx.lineWidth=1.6;cx.beginPath();cx.arc(0,0,14,0,7);cx.moveTo(-14,0);cx.lineTo(14,0);cx.moveTo(0,-14);cx.lineTo(0,14);
  cx.moveTo(-9,-10);cx.quadraticCurveTo(0,0,-9,10);cx.moveTo(9,-10);cx.quadraticCurveTo(0,0,9,10);cx.stroke();cx.restore();
}
function draw(s){
  cx.setTransform(K,0,0,K,0,0);cx.save();cx.fillStyle='#050a1a';cx.fillRect(0,0,W,H);
  if(zoom>.01){const z=1+zoom*.07;cx.translate(zx,230);cx.scale(z,z);cx.translate(-zx,-230)}
  if(shake>.5)cx.translate((Math.random()-.5)*shake,(Math.random()-.5)*shake);
  cx.drawImage(cr,0,0,W,H);
  for(let y=36;y<256;y+=13){const bo=Math.sin(T/180+y*.7)*(1+excite*4)*.7;cx.drawImage(cr,0,y*BS,W*BS,13*BS,0,y+bo,W,13)}
  cx.drawImage(bg,0,0,W,H);board(0);board(1);
  cx.save();cx.globalCompositeOperation='lighter';
  for(let i=0;i<4;i++){const x=150+i*200,o=Math.sin(T/1500+i*1.7)*70,g=cx.createLinearGradient(x,0,x+o,300);g.addColorStop(0,'rgba(80,200,255,.14)');g.addColorStop(1,'rgba(80,200,255,0)');
    cx.fillStyle=g;cx.beginPath();cx.moveTo(x-8,0);cx.lineTo(x+8,0);cx.lineTo(x+o+60,300);cx.lineTo(x+o-60,300);cx.fill()}
  cx.restore();
  s.p.forEach((p,i)=>{const sc=Math.max(.5,1-(FL-dp[i].y)/320);cx.fillStyle='rgba(0,0,0,.32)';cx.beginPath();cx.ellipse(dp[i].x,FL+8,27*sc,7*sc,0,0,7);cx.fill()});
  s.p.forEach((p,i)=>{if(p.dsh>0){cx.save();[.3,.16].forEach((al,n)=>{cx.globalAlpha=al;player({...p,x:dp[i].x-p.dd*(n+1)*15,y:dp[i].y},i,s)});cx.restore()}player({...p,x:dp[i].x,y:dp[i].y},i,s)});
  ball(s);net(0);net(1);
  P.forEach(q=>{cx.globalAlpha=q.l/q.m;if(q.ring){cx.strokeStyle=q.c;cx.lineWidth=5;cx.beginPath();cx.arc(q.x,q.y,(1-q.l/q.m)*q.ring,0,7);cx.stroke();return}cx.fillStyle=q.c;cx.beginPath();cx.arc(q.x,q.y,q.r*(q.g<0?q.l/q.m:1),0,7);cx.fill()});cx.globalAlpha=1;
  s.p.forEach((p,i)=>{const d=dp[i];if(p.dc>0&&s.st=='play'){cx.fillStyle='#0008';cx.fillRect(d.x-20,d.y+16,40,4);cx.fillStyle='#7fe7ff';cx.fillRect(d.x-19,d.y+17,38*(1-p.dc/60),2)}const me=mode=='local'?['P1','P2'][i]:(i==(mode=='host'?0:1)?'VOCÊ':null);
    if(me){cx.fillStyle='#fff';cx.font='15px Impact,sans-serif';cx.textAlign='center';cx.strokeStyle='#000a';cx.lineWidth=3;cx.strokeText(me,d.x,d.y-140);cx.fillText(me,d.x,d.y-140);
      cx.fillStyle=PL[i].jc;cx.beginPath();cx.moveTo(d.x-6,d.y-136);cx.lineTo(d.x+6,d.y-136);cx.lineTo(d.x,d.y-129);cx.fill()}
    if(s.hold==i&&s.st=='play'){const f=Math.max(0,(420-s.sh)/420);cx.fillStyle='#0008';cx.fillRect(d.x-24,d.y-158,48,6);cx.fillStyle=f<.25?'#ff4b4b':'#7dff9a';cx.fillRect(d.x-23,d.y-157,46*f,4)}});
  let m=s.msg,sc=1;
  if(s.st=='play'&&s.cd>0){m=String(Math.ceil(s.cd/40));sc=1+(s.cd%40)/40*.8}
  else if(s.st=='goal'){const f=Math.max(0,Math.min(1,((s.dk?120:110)-s.gt)/14));sc=1+2.7*Math.pow(f-1,3)+1.7*Math.pow(f-1,2)}
  if(m){cx.save();cx.translate(450,190);cx.scale(sc,sc);cx.rotate(-.05);cx.font=(m.length>9?'50px':'64px')+' Impact,sans-serif';cx.textAlign='center';cx.lineWidth=9;cx.strokeStyle='#061233';cx.strokeText(m,0,0);
    const g=cx.createLinearGradient(0,-50,0,10);g.addColorStop(0,'#e6fdff');g.addColorStop(1,'#00d4ff');cx.fillStyle=g;cx.fillText(m,0,0);
    if(s.st=='goal'&&fire[s.who]>=3){cx.font='34px Impact,sans-serif';cx.fillStyle='#ff5a1a';cx.strokeText('🔥 ON FIRE! 🔥',0,46);cx.fillText('🔥 ON FIRE! 🔥',0,46)}
    cx.restore()}
  cx.restore();
  if(flash>.02){cx.fillStyle='rgba(255,255,255,'+flash+')';cx.fillRect(0,0,W,H)}
  cx.drawImage(vg,0,0,W,H);
}
function hud(){
  $('tm').textContent=S.t.toFixed(1);
  ['s1','s2'].forEach((id,i)=>{const e=$(id);if(e.textContent!=S.sc[i]){e.textContent=S.sc[i];e.classList.remove('pop');void e.offsetWidth;e.classList.add('pop')}});$('tm').classList.toggle('low',S.t<10);
  const e=S.st=='end';$('end').classList.toggle('on',e);
  if(e){const[a,b]=S.sc,n=mode=='local'?['P1','P2']:mode=='host'?['VOCÊ','OPP']:['OPP','VOCÊ'];
    $('eh').textContent=a==b?'EMPATE!':(a>b?n[0]:n[1])+' VENCEU!';$('et').textContent=a+' x '+b;
    $('bAgain').style.display=mode=='guest'?'none':'';}
  $('ew').style.display=e&&mode=='guest'?'block':'none';
  $('ping').textContent=mode=='local'?'':(ping?'● '+ping+' ms':'● ...');
}

/* ---------- entrada ---------- */
function readIn(s){
  const k=keys;
  if(mode=='local')return s?{l:B(k.ArrowLeft),r:B(k.ArrowRight),j:B(k.ArrowUp),h:B(k.KeyL),d:B(k.ArrowDown)}:{l:B(k.KeyA||tin.l),r:B(k.KeyD||tin.r),j:B(k.KeyW||tin.j),h:B(k.KeyF||tin.h),d:B(k.KeyS||tin.d)};
  return{l:B(k.KeyA||k.ArrowLeft||tin.l),r:B(k.KeyD||k.ArrowRight||tin.r),j:B(k.KeyW||k.ArrowUp||k.Space||tin.j),h:B(k.KeyF||k.KeyL||k.Enter||tin.h),d:B(k.KeyS||k.ArrowDown||k.ShiftLeft||k.ShiftRight||tin.d)};
}
addEventListener('keydown',e=>{keys[e.code]=1;if(run&&(e.code.startsWith('Arrow')||e.code=='Space'))e.preventDefault()});
addEventListener('keyup',e=>keys[e.code]=0);
addEventListener('blur',()=>{keys={};['l','r','j','h','d'].forEach(k=>btn(k,0))});
const unlock=()=>{try{AC=AC||new AudioContext();if(AC.state!='running')AC.resume()}catch(e){}};
['pointerdown','touchstart','keydown'].forEach(t=>addEventListener(t,unlock,{passive:true}));
document.addEventListener('gesturestart',e=>e.preventDefault());
document.addEventListener('contextmenu',e=>{if(run)e.preventDefault()});
function btn(k,v){tin[k]=v;document.querySelectorAll('#tc [data-k="'+k+'"]').forEach(b=>b.classList.toggle('on',!!v))}
document.querySelectorAll('#tc .acts button').forEach(b=>{const k=b.dataset.k;
  b.addEventListener('pointerdown',e=>{e.preventDefault();try{b.setPointerCapture(e.pointerId)}catch(x){}btn(k,1)});
  ['pointerup','pointercancel','lostpointercapture'].forEach(t=>b.addEventListener(t,()=>btn(k,0)))});
/* direcional: deslizar o dedo troca de ◀ para ▶ sem soltar */
const pad=document.querySelector('#tc .pad');let padOn=0;
const padSet=e=>{const r=pad.getBoundingClientRect(),right=e.clientX-r.left>=r.width/2;btn('l',right?0:1);btn('r',right?1:0)};
pad.addEventListener('pointerdown',e=>{e.preventDefault();padOn=1;try{pad.setPointerCapture(e.pointerId)}catch(x){}padSet(e)});
pad.addEventListener('pointermove',e=>{if(padOn)padSet(e)});
['pointerup','pointercancel','lostpointercapture'].forEach(t=>pad.addEventListener(t,()=>{padOn=0;btn('l',0);btn('r',0)}));
function fit(){const cw=cv.clientWidth||W;K=Math.max(1,Math.min(1.75,cw*(window.devicePixelRatio||1)/W));
  const w=Math.round(W*K),h=Math.round(H*K);if(cv.width!=w){cv.width=w;cv.height=h}K=cv.width/W}
addEventListener('resize',()=>{if(run)fit()});
$('bFs').onclick=()=>{const d=document,e=d.documentElement;try{(d.fullscreenElement||d.webkitFullscreenElement)?(d.exitFullscreen||d.webkitExitFullscreen).call(d):(e.requestFullscreen||e.webkitRequestFullscreen).call(e)}catch(x){}};
if(!(document.documentElement.requestFullscreen||document.documentElement.webkitRequestFullscreen))$('bFs').style.display='none';
let wl=null;async function lock(){try{wl=await navigator.wakeLock.request('screen')}catch(e){}}
document.addEventListener('visibilitychange',()=>{if(run&&!document.hidden)lock()});

/* ---------- loop ---------- */
function loop(ts){
  if(!run)return;requestAnimationFrame(loop);
  const dt=Math.min(50,ts-lt);lt=ts;acc+=dt;ra+=dt;
  if(mode=='guest'){acc=0;const i=readIn(1),j=JSON.stringify(i);
    if(conn&&conn.open&&(j!=prevIn||ts-sT>100)){conn.send({i});prevIn=j;sT=ts}}
  else while(acc>=16.67){acc-=16.67;S.p[0].in=readIn(0);S.p[1].in=mode=='local'?readIn(1):gIn();
    step(S);if(mode=='host'&&++sn%2==0&&conn&&conn.open){S.q=sn;conn.send(S)}}
  if(conn&&conn.open&&ts-pgT>2000){pgT=ts;conn.send({pg:ts})}
  if(ra<15)return;ra=Math.max(0,ra-16.67);/* mesmo ritmo (~60 quadros) em telas de 60/90/120/144 Hz */
  update(S);draw(S);hud();
}
function start(m){
  mode=m;S=fresh();bg=bg||mkBg();if(!vg){vg=document.createElement('canvas');vg.width=W;vg.height=H;const g=vg.getContext('2d'),r=g.createRadialGradient(450,225,200,450,225,520);r.addColorStop(0,'#0000');r.addColorStop(1,'rgba(0,0,0,.5)');g.fillStyle=r;g.fillRect(0,0,W,H)}
  dp=[{x:230,y:FL},{x:670,y:FL}];db={x:450,y:140};P=[];fire=[0,0];prev=null;trail=[];sz=[0,0];keys={};
  gin={l:0,r:0,j:0,h:0,d:0};lat={j:0,h:0,d:0};lq=0;ping=0;pgT=0;sT=0;ra=0;prevIn='';
  clearTimeout(jto);unlock();
  show('game');fit();lock();
  $('n1').textContent=m=='local'?'P1':m=='host'?'VOCÊ':'OPP';
  $('n2').textContent=m=='local'?'P2':m=='host'?'OPP':'VOCÊ';
  $('hint').textContent=m=='local'?'P1: A D mover • W pular • F arremessar/roubar • S dash  |  P2: ← → mover • ↑ pular • L arremessar/roubar • ↓ dash':'Setas/A D mover • W/↑ pular • F/L arremessar/roubar • S/↓/Shift dash (tira a bola) • pule perto da cesta com a bola + F/L = ENTERRADA';
  run=1;lt=performance.now();acc=0;requestAnimationFrame(loop);
}
function cleanup(){clearTimeout(jto);try{peer&&peer.destroy()}catch(e){}peer=conn=null;$('rc').style.display='none'}
function quit(){run=0;cleanup();try{wl&&wl.release()}catch(e){}wl=null;$('status').textContent='';show('menu')}

/* ---------- online (salas via PeerJS — funciona entre PC, celular e tablet) ---------- */
const st=t=>$('status').textContent=t,CH='ABCDEFGHJKLMNPQRSTUVWXYZ23456789',PRE='dunkmasters-';
/* STUN + TURN: o TURN garante a conexão mesmo com redes diferentes (4G x Wi-Fi). Troque pelo seu servidor TURN, se tiver. */
const ICE={config:{iceServers:[
  {urls:'stun:stun.l.google.com:19302'},{urls:'stun:stun1.l.google.com:19302'},{urls:'stun:global.stun.twilio.com:3478'},
  {urls:['turn:openrelay.metered.ca:80','turn:openrelay.metered.ca:443','turn:openrelay.metered.ca:443?transport=tcp'],username:'openrelayproject',credential:'openrelayproject'}]}};
const link=code=>location.href.split(/[?#]/)[0]+'?sala='+code;
const errMsg=e=>({'peer-unavailable':'Sala não encontrada. Confira o código.','network':'Sem conexão com o servidor. Verifique sua internet.','server-error':'Servidor indisponível. Tente de novo em instantes.',
  'socket-error':'Sem conexão com o servidor. Verifique sua internet.','socket-closed':'Conexão com o servidor foi encerrada.','browser-incompatible':'Este navegador não suporta o modo online.','webrtc':'Falha na conexão entre os aparelhos.'}[e.type]||'Erro: '+e.type);
const onPing=d=>{if(d.pg!=null&&conn&&conn.open)conn.send({pq:d.pg});else if(d.pq!=null)ping=Math.max(1,Math.round(performance.now()-d.pq))};
function gIn(){const o={...gin};['j','h','d'].forEach(k=>{if(lat[k]>0){o[k]=1;lat[k]--}});return o}
const noLib=()=>typeof Peer=='undefined'&&(st('Não foi possível carregar o modo online. Verifique a internet e recarregue a página.'),1);
function leave(msg){run=0;cleanup();try{wl&&wl.release()}catch(e){}show('online');st(msg)}
function createRoom(){
  if(noLib())return;
  const code=Array.from({length:4},()=>CH[Math.random()*CH.length|0]).join('');
  st('Criando sala...');cleanup();
  const p=peer=new Peer(PRE+code,ICE);
  p.on('open',()=>{st('Sala criada! Passe o código (ou o link) para o amigo. Aguardando oponente...');$('rcode').textContent=code;$('rc').style.display='flex'});
  p.on('error',e=>e.type=='unavailable-id'?createRoom():st(errMsg(e)));
  p.on('disconnected',()=>{try{p.reconnect()}catch(x){}});
  p.on('connection',c=>{if(conn&&conn.open)return c.close();conn=c;
    c.on('open',()=>start('host'));
    c.on('data',d=>{if(d.i){gin=d.i;['j','h','d'].forEach(k=>{if(d.i[k])lat[k]=4})}else onPing(d)});
    c.on('close',()=>{if(run)leave('O oponente saiu da sala.')});
    c.on('error',()=>{if(run)leave('A conexão com o oponente caiu.')})});
}
function joinRoom(){
  const code=$('code').value.trim().toUpperCase();if(code.length<4)return st('Digite o código de 4 caracteres.');
  if(noLib())return;
  st('Conectando...');cleanup();
  const p=peer=new Peer(undefined,ICE);
  jto=setTimeout(()=>{if(!run){cleanup();st('Tempo esgotado. Confira o código e a internet — se persistir, tente outra rede (ex.: Wi-Fi em vez de 4G).')}},20000);
  p.on('error',e=>{clearTimeout(jto);st(errMsg(e))});
  p.on('disconnected',()=>{try{p.reconnect()}catch(x){}});
  p.on('open',()=>{const c=conn=p.connect(PRE+code,{reliable:false});
    c.on('open',()=>{clearTimeout(jto);start('guest')});
    c.on('data',d=>{if(d.p){if(d.q==null||d.q>lq){lq=d.q||lq;S=d}}else onPing(d)});
    c.on('close',()=>{if(run)leave('A sala foi encerrada.')});
    c.on('error',()=>{if(run)leave('A conexão com a sala caiu.')})});
}
$('bShare').onclick=async()=>{const code=$('rcode').textContent,u=link(code),t='Vem jogar Dunk Masters comigo! Código da sala: '+code;
  try{if(navigator.share){await navigator.share({title:'Dunk Masters',text:t,url:u});return}}catch(e){if(e&&e.name=='AbortError')return}
  try{await navigator.clipboard.writeText(t+' '+u);st('Link copiado! Mande para o seu amigo.')}catch(e){st('Link da sala: '+u)}};
$('code').addEventListener('keydown',e=>{if(e.key=='Enter')joinRoom()});
$('bLocal').onclick=()=>start('local');
$('bOnline').onclick=()=>show('online');
$('bBack').onclick=quit;
$('bCreate').onclick=createRoom;$('bJoin').onclick=joinRoom;
$('bQuit').onclick=quit;$('bMenu').onclick=quit;
$('bAgain').onclick=()=>{S=fresh();if(mode=='host'&&conn&&conn.open)conn.send(S)};
/* abrir pelo link da sala (?sala=ABCD) já tenta entrar */
const qs=new URLSearchParams(location.search).get('sala');
if(qs){show('online');$('code').value=qs.toUpperCase().slice(0,4);joinRoom()}
