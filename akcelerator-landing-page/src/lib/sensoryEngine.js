const MK='aa_sound_muted',RK='aa_pending_return_v1',win=()=>typeof window<'u',vib=(v)=>{try{navigator.vibrate?.(v);}catch{}};
let ac=null,mem=null;
const sto=(s,k,v)=>{try{return v===undefined?s.getItem(k):s.setItem(k,v);}catch{}};
export const isSoundMuted=()=>win()&&sto(localStorage,MK)==='1';
export const toggleSoundMuted=()=>{const n=!isSoundMuted();sto(localStorage,MK,n?'1':'0');return n;};
export const prefersReducedMotion=()=>!!(win()&&matchMedia?.('(prefers-reduced-motion:reduce)').matches);
export const isAnimalAction=(a)=>/utulek|animals|útulk|zvíř|misk/i.test(`${a?.id} ${a?.category} ${a?.values} ${a?.title}`);
function ctx(){if(!win()||isSoundMuted())return null;try{ac=ac||new(window.AudioContext||window.webkitAudioContext)();ac.state==='suspended'&&ac.resume().catch(()=>{});return ac;}catch{return null;}}
function tone(f,dur=0.25,tp='sine',d=0,pk=0.035,ef=0){
const c=ctx();if(!c)return null;
try{const t=c.currentTime+d,o=c.createOscillator(),g=c.createGain(),r=(p,v,x)=>p.linearRampToValueAtTime(v,x);o.type=tp;o.frequency.value=f;if(ef)r(o.frequency,ef,t+dur*0.85);g.gain.setValueAtTime(0.001,t);r(g.gain,pk,t+0.02);r(g.gain,0.0001,t+dur);o.connect(g);g.connect(c.destination);o.start(t);o.stop(t+dur+0.02);return g;}catch{return null;}
}
export function startHoldSpark(el,cb){
const t0=performance.now(),red=prefersReducedMotion(),sp=(v)=>el?.style?.setProperty('--spark-charge',v);
let id=0,d=0;vib([10,20,40]);
const g1=tone(294,0.68,'sine',0,0.04,440),g2=tone(587,0.68,'triangle',0,0.02,659),step=(now)=>{const p=red?1:Math.min(1,(now-t0)/600);sp(p.toFixed(2));if(p>=1&&!d){d=1;el?.classList?.add('spark-ready');vib(35);tone(587,0.28);tone(880,0.28,'triangle');cb?.();return;}if(p<1)id=requestAnimationFrame(step);};
id=requestAnimationFrame(step);
return(rel=false)=>{cancelAnimationFrame(id);sp('0');el?.classList?.remove('spark-ready');try{[g1,g2].forEach((g)=>g?.gain.setTargetAtTime(0.0001,ac?.currentTime||0,0.02));}catch{}if(rel&&performance.now()-t0<200)tone(659,0.12);};
}
export function playPayoffAsmr(m='kibble'){
if(m!=='kibble')return[523,659,784,1046].forEach((f,i)=>tone(f,0.3,'sine',i*0.06));
const c=ctx();
if(c)try{
const sr=c.sampleRate,l=sr>>6,b=c.createBuffer(1,l,sr),d=b.getChannelData(0);
for(let i=0;i<l;i++)d[i]=(Math.random()*2-1)*(1-i/l);
for(let k=0;k<12;k++){
const t=c.currentTime+k*0.038,s=c.createBufferSource(),f=c.createBiquadFilter(),g=c.createGain();
s.buffer=b;f.type='bandpass';f.frequency.value=950+((k*137)%700);f.Q.value=6.5;
g.gain.setValueAtTime(0.05,t);g.gain.linearRampToValueAtTime(0.001,t+0.016);
s.connect(f);f.connect(g);g.connect(c.destination);s.start(t);
}
}catch{}
tone(523,0.35,'sine',0.42);tone(784,0.35,'triangle',0.42);
}
const sync=(r)=>{mem=r;const s=JSON.stringify(r);win()&&(sto(sessionStorage,RK,s),sto(localStorage,RK,s));};
export const savePendingPartnerReturn=(a)=>a&&sync({id:a.id,title:a.title,category:a.category,values:a.values,ts:Date.now()});
export function consumePendingPartnerReturn(m=3e3){
const r=mem||(win()&&JSON.parse(sto(sessionStorage,RK)||sto(localStorage,RK)||'null')),dt=r?Date.now()-(r.ts||0):0;
if(!r||r.consumed||dt<m||dt>18e5)return null;
sync({...r,consumed:1});return{...r,consumed:true,elapsedMs:dt};
}
export function mountImpactCanvas(cv,o={}){
const c=cv?.getContext?.('2d');if(!c)return()=>{};
const k=(o.mode||'kibble')==='kibble',w=cv.width||300,h=cv.height||92,red=prefersReducedMotion(),by=h-12,cs=k?['#92400e','#d97706']:['#fde68a','#34d399'];
let gx=0,id=0;
const ps=Array.from({length:30},(_,i)=>({x:w/2+((i%7)-3)*(k?11:16),y:red?by-10:k?-6-i*4.5:h-6-((i*7)%(h-14)),vx:((i%5)-2)*0.35,vy:k?1.3:-0.6-(i%4)*0.15,c:cs[i%2]}));
if(red)o.onWeightUpdate?.(25);
const onO=(e)=>{if(typeof e?.gamma==='number')gx=Math.max(-0.35,Math.min(0.35,e.gamma*0.009));};
const onP=(e)=>{const b=cv.getBoundingClientRect();if(b.width)gx=((e.clientX-b.left)/b.width-0.5)*0.38;};
addEventListener('deviceorientation',onO);cv.addEventListener('pointermove',onP);
const fn=()=>{
c.clearRect(0,0,w,h);let n=0;
for(let i=0;i<30;i++){
const p=ps[i],fl=by-4-(i%3)*2;
if(!red){
p.vx=(p.vx+gx)*0.92;p.vy+=k?0.42:-0.012;p.x+=p.vx;p.y+=p.vy;
if(k&&p.y>fl){p.y=fl;p.vy*=-0.38;}
if(k&&(p.x<74||p.x>w-74)){p.x=p.x<74?74:w-74;p.vx*=-0.5;}
if(!k&&p.y<6){p.y=h-6;p.vy=-0.6-(i%4)*0.15;}
}
if(p.y>=by-22)n++;
c.fillStyle=p.c;c.beginPath();c.arc(p.x,p.y,3.5,0,6.3);c.fill();
}
if(k){
o.onWeightUpdate?.(Math.min(25,Math.round((n*5)/6)));
c.strokeStyle='#047857';c.lineWidth=3;c.beginPath();c.moveTo(60,by-14);c.lineTo(84,by+3);c.lineTo(w-84,by+3);c.lineTo(w-60,by-14);c.stroke();
}
if(!red)id=requestAnimationFrame(fn);
};
fn();
return()=>{cancelAnimationFrame(id);removeEventListener('deviceorientation',onO);cv.removeEventListener('pointermove',onP);};
}
export async function fetchAmbientPulse(){
try{const r=await fetch('/api/pulse');if(r.ok)return await r.json();}catch{}
return{message:'Před chvílí někdo v Brně naplnil misku v útulku',source:'local'};
}