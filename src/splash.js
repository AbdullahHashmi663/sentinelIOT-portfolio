import { animate, stagger } from 'animejs';

const MAX_VISIBLE=2000,MIN_VISIBLE=900,EXIT_DURATION=180;

/** Adopt the first-paint loading gate; every opening closes automatically. */
export function createSplash({root,replayButton,reducedMotion,onToggle=()=>{}}){
  const skip=root.querySelector('[data-splash-skip]');
  const status=root.querySelector('[data-splash-status]');
  const boot=window.sentinelBoot;
  const effects=new Set();
  let closing=false,disposed=false,returnFocus=null,hasOpened=false,savedReading=null;
  let isInitial=false,openedAt=0,deadline=0,hardTimer=0,readyTimer=0,prepared=false,preparing=false,fallbackReady=false;
  const still=()=>reducedMotion.matches||document.body.classList.contains('motion-paused');
  const words=[...root.querySelectorAll('[data-splash-word]')];
  for(const word of words){
    const text=word.textContent;
    word.textContent='';
    for(const letter of Array.from(text)){
      const span=document.createElement('span');span.className='splash-letter';span.textContent=letter;word.append(span);
    }
  }
  function stopEffects(){for(const effect of effects)effect.revert();effects.clear();}
  function run(target,options){const effect=animate(target,options);effects.add(effect);return effect;}
  function reveal(){
    stopEffects();
    // The initial shield and loading track animate from the first paint. Keep
    // their wordmark readable while the module adopts the loading screen.
    if(isInitial||still())return;
    run(root.querySelectorAll('[data-splash-reveal]'),{opacity:[0,1],translateY:[14,0],filter:['blur(6px)','blur(0px)'],delay:stagger(40,{start:40}),duration:430,ease:'out(3)'});
    run(root.querySelectorAll('.splash-letter'),{opacity:[0,1],translateY:[28,0],rotateX:[-65,0],delay:stagger(22,{start:60}),duration:560,ease:'out(4)'});
    run(root.querySelectorAll('.splash-phase-line'),{scaleX:[0,1],delay:stagger(80,{start:180}),duration:460,ease:'out(3)'});
    const path=root.querySelector('.splash-emblem-outline'),length=path.getTotalLength();
    run(path,{strokeDasharray:length,strokeDashoffset:[length,0],duration:700,ease:'inOut(3)'});
  }
  function clearTimers(){clearTimeout(hardTimer);clearTimeout(readyTimer);hardTimer=readyTimer=0;}
  function scheduleReady(){
    if(!root.open||!prepared||closing||disposed)return;
    clearTimeout(readyTimer);
    readyTimer=setTimeout(()=>dismiss(),Math.max(0,openedAt+MIN_VISIBLE-performance.now()));
  }
  function open({initial=false}={}){
    if(disposed||root.open)return;
    clearTimers();stopEffects();closing=false;returnFocus=document.activeElement;isInitial=initial;
    openedAt=initial?boot.startedAt:performance.now();deadline=initial?boot.deadline:openedAt+MAX_VISIBLE;
    const reader=document.querySelector('#story-scroll');
    savedReading={reader,top:reader?.scrollTop||0,y:window.scrollY,width:window.innerWidth,height:window.innerHeight};
    document.documentElement.classList.add('splash-open');document.body.classList.add('splash-open');
    root.hidden=false;onToggle(true);root.showModal();hasOpened=true;
    if(!initial)skip.focus({preventScroll:true});
    if(!initial)hardTimer=setTimeout(()=>finish({reason:'deadline'}),Math.max(0,deadline-performance.now()));
    reveal();scheduleReady();
  }
  function complete({restoreFocus=!isInitial}={}){
    clearTimers();stopEffects();
    if(root.open)root.close();
    root.hidden=true;closing=false;
    document.documentElement.classList.remove('splash-open');document.body.classList.remove('splash-open');
    onToggle(false);
    const target=returnFocus instanceof HTMLElement&&returnFocus!==document.body&&returnFocus.isConnected?returnFocus:document.querySelector('.site-header .wordmark');
    if(restoreFocus)target?.focus({preventScroll:true});
    // Native dialog focus restoration can scroll its opener into view. Restore
    // the saved reading position after that step, unless the layout was resized.
    if(restoreFocus&&savedReading&&savedReading.width===window.innerWidth&&savedReading.height===window.innerHeight){
      window.scrollTo({top:savedReading.y,behavior:'instant'});
      savedReading.reader?.scrollTo({top:savedReading.top,behavior:'instant'});
    }
  }
  function finish({reason='ready',restoreFocus=!isInitial}={}){
    root.dataset.splashDuration=(performance.now()-openedAt).toFixed(1);root.dataset.splashReason=reason;
    if(isInitial&&boot?.active){boot.finish(reason);return;}
    complete({restoreFocus});
  }
  function dismiss({instant=false}={}){
    if(disposed||!root.open||closing)return;
    closing=true;
    clearTimeout(readyTimer);
    if(instant||still()){finish({reason:instant?'skipped':'ready'});return;}
    stopEffects();
    const duration=Math.min(EXIT_DURATION,deadline-performance.now());
    if(duration<=0){finish({reason:'deadline'});return;}
    run(root,{opacity:[1,0],translateY:[0,-12],duration,ease:'inOut(3)',onComplete:()=>finish()});
  }
  const onSkip=()=>dismiss({instant:true});
  const onCancel=event=>{event.preventDefault();dismiss({instant:true});};
  const onWheel=event=>event.preventDefault();
  const onTouch=event=>event.preventDefault();
  const onKey=event=>{
    if(['ArrowUp','ArrowDown','PageUp','PageDown','Home','End'].includes(event.key))event.preventDefault();
    if(event.key===' '&&event.target===root)event.preventDefault();
  };
  const onMotion=()=>{if(!root.open)return;if(closing)finish();else reveal();};
  skip.addEventListener('click',onSkip);
  root.addEventListener('cancel',onCancel);root.addEventListener('wheel',onWheel,{passive:false});
  root.addEventListener('touchmove',onTouch,{passive:false});root.addEventListener('keydown',onKey);
  replayButton?.addEventListener('click',open);reducedMotion.addEventListener('change',onMotion);
  if(boot?.active){boot.claim(()=>complete({restoreFocus:false}));open({initial:true});}
  else root.hidden=true;
  return {
    get isOpen(){return root.open;},
    ready({fallback=false}={}){
      fallbackReady=fallback;
      if(preparing)return;preparing=true;
      const pageReady=document.readyState==='complete'?Promise.resolve():new Promise(resolve=>window.addEventListener('load',resolve,{once:true}));
      // Read font readiness after its non-blocking stylesheet has settled.
      Promise.allSettled([pageReady]).then(()=>Promise.allSettled([document.fonts?.ready||Promise.resolve()])).then(()=>{
        if(disposed)return;prepared=true;status.textContent=fallbackReady?'Your story is ready':'Experience ready';root.classList.add('is-prepared');scheduleReady();
      });
    },
    suspend(){if(root.open){if(closing)finish();else stopEffects();}},
    resume(){if(root.open&&hasOpened){if(performance.now()>=deadline)finish({reason:'deadline'});else{reveal();scheduleReady();}}},
    dispose(){
      if(root.open)finish({reason:'disposed',restoreFocus:false});disposed=true;clearTimers();stopEffects();
      skip.removeEventListener('click',onSkip);
      root.removeEventListener('cancel',onCancel);root.removeEventListener('wheel',onWheel);
      root.removeEventListener('touchmove',onTouch);root.removeEventListener('keydown',onKey);
      replayButton?.removeEventListener('click',open);reducedMotion.removeEventListener('change',onMotion);
    },
  };
}
