import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SceneManager }       from './scene/SceneManager.js';
import { ProceduralPCB }      from './scene/ProceduralPCB.js';
import { LayerManager }       from './layers/LayerManager.js';
import { ScrollController }   from './animation/ScrollController.js';
import { setupPostProcessing } from './PostProcessing.js';
import { PerformanceManager } from './utils/PerformanceManager.js';
import { applyMobileScrollFix } from './utils/MobileScrollFix.js';
import { AudioManager }       from './audio/AudioManager.js';
import { createUnderglowMaterial } from './shaders/UnderglowShader.js';

gsap.registerPlugin(ScrollTrigger);
document.body.style.height = '500vh';

async function init() {
  applyMobileScrollFix();

  const sm = new SceneManager(document.getElementById('cv'));
  const { composer, bloom } = setupPostProcessing(sm.renderer, sm.scene, sm.camera);
  sm.setComposer(composer); sm.bloom = bloom;

  const pcb = new ProceduralPCB(sm.scene);
  pcb.build(); sm.pcb = pcb;

  const underglowMat = createUnderglowMaterial();
  sm.registerShaderMaterial(underglowMat);
  const sub = sm.scene.getObjectByName('PCB_Substrate');
  if(sub) sub.material = underglowMat;

  const layers = new LayerManager(sm.scene);
  const perf = new PerformanceManager(sm.renderer, composer);

  sm.onTick = (cp) => {
    layers.updateParallax(cp.x, cp.y);
    perf.tick();
    if(sm.bloom){
      const p = document.body.getAttribute('data-phase')||'hero';
      const m = {hero:.7,transition:1.1,detail:1.6,cta:.8};
      sm.bloom.strength += ((m[p]||.7)-sm.bloom.strength)*.04;
    }
  };

  const sc = new ScrollController(sm);
  const audio = new AudioManager();

  // Mute button
  const mb = document.getElementById('mb');
  if(mb) mb.addEventListener('click',()=>{
    const m = audio.toggleMute();
    mb.classList.toggle('muted',m);
    const sw = mb.querySelector('.sw');
    if(sw) sw.style.opacity = m?'0':'1';
  });

  // Upload drag
  const uz = document.getElementById('uz');
  if(uz){
    uz.addEventListener('dragover',e=>{e.preventDefault();uz.style.borderColor='var(--blue)';uz.style.background='var(--blue-10)'});
    uz.addEventListener('dragleave',()=>{uz.style.borderColor='';uz.style.background=''});
    uz.addEventListener('drop',e=>{e.preventDefault();uz.querySelector('h4').textContent='✓ File received';uz.style.borderColor='';uz.style.background=''});
  }

  // Hero entrance
  gsap.to('.hero-left',{opacity:1,y:0,duration:1.1,ease:'power3.out',delay:.6});
  gsap.to('.hero-right',{opacity:1,y:0,duration:1.1,ease:'power3.out',delay:.85});

  setTimeout(()=>pcb.playAssemblyAnimation(),700);

  // Loading fade
  let pct=0;
  const bar=document.getElementById('lbf'), pctEl=document.getElementById('lp');
  const iv=setInterval(()=>{
    pct+=Math.random()*22+8;
    if(pct>=100){pct=100;clearInterval(iv);
      setTimeout(()=>{const s=document.getElementById('ls');if(s)gsap.to(s,{opacity:0,duration:.6,onComplete:()=>s.remove()})},200);
    }
    if(bar)bar.style.width=pct+'%';
    if(pctEl)pctEl.textContent=Math.floor(pct)+'%';
  },65);

  window.addEventListener('pagehide',()=>{sm.destroy();sc.destroy();audio.destroy()});
}

init().catch(e=>{console.error(e);const s=document.getElementById('ls');if(s)s.remove()});
