import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
gsap.registerPlugin(ScrollTrigger);

export class ScrollController {
  constructor(sm) {
    this.sm=sm; this.camera=sm.camera;
    this.rig=sm.cameraRig; this.pivot=sm.cameraRig.getPivot();
    this.lights=sm.scene.userData.lights;
    this.proxy={fov:45,keyI:15,fillI:5,rimI:8,underI:3};
    if(window.matchMedia('(prefers-reduced-motion:reduce)').matches){this.rig.setToWaypoint('cta');return}
    ScrollTrigger.config({ignoreMobileResize:true});
    this._build(); this._animateElements(); this._scrollHint(); this._resize();
  }
  _sync(){
    const{camera,proxy,lights}=this;
    camera.fov=proxy.fov; camera.updateProjectionMatrix();
    if(lights){lights.keyLight.intensity=proxy.keyI;lights.fillLight.intensity=proxy.fillI;lights.rimLight.intensity=proxy.rimI;lights.underglow.intensity=proxy.underI}
  }
  _build(){
    const{camera,pivot}=this;
    // Hero
    gsap.timeline({scrollTrigger:{trigger:'#s-hero',start:'top top',end:'bottom top',scrub:1.5,invalidateOnRefresh:true,onEnter:()=>this._phase('hero'),onEnterBack:()=>this._phase('hero')}})
      .to(camera.position,{x:0,y:5,z:8,ease:'none'})
      .to(camera.rotation,{x:-.38,y:0,z:0,ease:'none'},'<')
      .to(pivot.rotation,{y:0,ease:'none'},'<')
      .to(this.proxy,{fov:45,keyI:15,fillI:5,rimI:8,underI:3,ease:'none',onUpdate:()=>this._sync()},'<');
    // Features
    gsap.timeline({scrollTrigger:{trigger:'#s-features',start:'top bottom',end:'bottom top',scrub:2,invalidateOnRefresh:true,onEnter:()=>this._phase('transition'),onEnterBack:()=>this._phase('transition')}})
      .to(camera.position,{x:-2,y:3,z:6,ease:'power1.inOut'})
      .to(camera.rotation,{x:-.2,y:.4,z:.1,ease:'power1.inOut'},'<')
      .to(pivot.rotation,{y:.3,ease:'sine.inOut'},'<')
      .to(this.proxy,{fov:40,keyI:18,fillI:4,rimI:10,underI:4,ease:'sine.inOut',onUpdate:()=>this._sync()},'<');
    // How it works
    gsap.timeline({scrollTrigger:{trigger:'#s-how',start:'top bottom',end:'bottom top',scrub:2.5,invalidateOnRefresh:true,onEnter:()=>this._phase('detail'),onEnterBack:()=>this._phase('detail')}})
      .to(camera.position,{x:1.5,y:.8,z:2.5,ease:'expo.inOut'})
      .to(camera.rotation,{x:-.1,y:.3,z:0,ease:'expo.inOut'},'<')
      .to(pivot.rotation,{y:-.2,ease:'expo.inOut'},'<')
      .to(this.proxy,{fov:35,keyI:22,fillI:1.5,rimI:14,underI:5,ease:'expo.inOut',onUpdate:()=>this._sync()},'<');
    // CTA
    gsap.timeline({scrollTrigger:{trigger:'#s-cta',start:'top bottom',end:'center center',scrub:1.8,invalidateOnRefresh:true,onEnter:()=>this._phase('cta'),onEnterBack:()=>this._phase('cta')}})
      .to(camera.position,{x:0,y:12,z:18,ease:'power3.out'})
      .to(camera.rotation,{x:-.5,y:0,z:0,ease:'power3.out'},'<')
      .to(pivot.rotation,{y:Math.PI*.12,ease:'power2.inOut'},'<')
      .to(this.proxy,{fov:50,keyI:10,fillI:4,rimI:6,underI:2,ease:'power3.out',onUpdate:()=>this._sync()},'<');
  }
  _phase(name){
    document.body.setAttribute('data-phase',name);
    const map={hero:0,transition:1,detail:2,cta:3};
    document.querySelectorAll('.pdot').forEach((d,i)=>d.classList.toggle('active',i===map[name]));
    if(this.sm.pcb){
      if(name==='detail'){this.sm.pcb.highlightComponent('ic',0x5FABDB);this.sm.pcb.highlightComponent('cap',0xD4AF37)}
      else this.sm.pcb.resetHighlights();
    }
  }
  _animateElements(){
    gsap.to('.hero-l',{opacity:1,y:0,duration:1.1,ease:'power3.out',delay:.5});
    gsap.to('.hero-r',{opacity:1,y:0,duration:1.1,ease:'power3.out',delay:.75});
    document.querySelectorAll('.eyebrow,.s-h2,.s-desc').forEach(el=>{
      gsap.to(el,{opacity:1,y:0,duration:.8,ease:'power2.out',scrollTrigger:{trigger:el,start:'top 85%',invalidateOnRefresh:true}});
    });
    document.querySelectorAll('.feat-sub-h,.feat-sub-p').forEach(el=>{
      gsap.to(el,{opacity:1,y:0,duration:.8,ease:'power2.out',scrollTrigger:{trigger:el,start:'top 85%',invalidateOnRefresh:true}});
    });
    gsap.to('#feat-grid',{opacity:1,y:0,duration:.9,ease:'power2.out',scrollTrigger:{trigger:'#feat-grid',start:'top 78%',invalidateOnRefresh:true}});
    gsap.to('#feat-btn',{opacity:1,y:0,duration:.7,delay:.2,ease:'power2.out',scrollTrigger:{trigger:'#feat-btn',start:'top 88%',invalidateOnRefresh:true}});
    gsap.to('#steps-grid',{opacity:1,y:0,duration:.9,ease:'power2.out',scrollTrigger:{trigger:'#steps-grid',start:'top 78%',invalidateOnRefresh:true}});
    gsap.to('.cta-images',{opacity:1,y:0,duration:.8,ease:'power2.out',scrollTrigger:{trigger:'.cta-images',start:'top 82%',invalidateOnRefresh:true}});
    gsap.to('#cta-trust',{opacity:1,duration:.7,delay:.3,scrollTrigger:{trigger:'#cta-trust',start:'top 88%',invalidateOnRefresh:true}});
  }
  _scrollHint(){
    const h=document.getElementById('scroll-hint');
    if(!h)return;
    ScrollTrigger.create({trigger:document.body,start:'3% top',onEnter:()=>gsap.to(h,{opacity:0,duration:.4}),onLeaveBack:()=>gsap.to(h,{opacity:1,duration:.4})});
  }
  _resize(){let t;window.addEventListener('resize',()=>{clearTimeout(t);t=setTimeout(()=>ScrollTrigger.refresh(true),200)})}
  destroy(){ScrollTrigger.killAll()}
}
