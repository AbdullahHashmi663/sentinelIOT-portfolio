// Keep the story and its model on the same scroll position, regardless of whether
// the page uses the window or the compact reading pane. Native keyboard, focus,
// scrollbar, and reader touch scrolling remain in charge when they take over.
export function createStoryScroll({getRoot,isEnabled=()=>true,isPane=()=>false,onUpdate=()=>{}}){
  const nativeAreas='.component-inspector,dialog,select,input,textarea,[contenteditable]:not([contenteditable="false"]),[data-native-scroll]';
  const touchControls='.site-header,.chapter-rail,#component-guide,a,button,'+nativeAreas;
  const clamp=(value,min,max)=>Math.min(max,Math.max(min,value));
  const now=()=>performance.now();
  let root=null,limit=0,target=0,rendered=0,lastWritten=null,frame=0,lastFrame=0;
  let mode=null,jump=null,inertiaStarted=0,touch=null,manualEnabled=true,disposed=false;

  function position(){return root===window?window.scrollY:root.scrollTop;}
  function viewport(){return root===window?window.innerHeight:root.clientHeight;}
  function maximum(){
    if(root!==window)return Math.max(0,root.scrollHeight-root.clientHeight);
    const scrolling=document.scrollingElement||document.documentElement;
    return Math.max(0,scrolling.scrollHeight-window.innerHeight);
  }
  function enabled(){return manualEnabled&&isEnabled();}
  function elementFor(event){return event.target instanceof Element?event.target:event.target?.parentElement;}
  function modalOpen(){return Boolean(document.querySelector('dialog[open]'));}
  function clearAnimation(){
    if(frame)cancelAnimationFrame(frame);
    frame=0;lastFrame=0;mode=null;jump=null;inertiaStarted=0;
  }
  function syncCurrent(){rendered=target=clamp(position(),0,limit);lastWritten=null;}
  function cancelAtCurrent(){clearAnimation();syncCurrent();}
  function write(value){
    const next=clamp(value,0,limit);
    // Keep subpixel progress independently of the browser's rounded scrollTop.
    // Otherwise the final damped steps can round to zero and run forever.
    rendered=next;
    root.scrollTo({top:next,behavior:'instant'});
    // Reading the actual value also accounts for browser scroll rounding.
    lastWritten=position();
    onUpdate();
  }
  function rootScroll(){
    if(disposed)return;
    const current=position();
    if((mode||touch)&&lastWritten!==null&&Math.abs(current-lastWritten)>1.5){
      touch=null;cancelAtCurrent();
    }else if(!mode&&!touch){rendered=target=clamp(current,0,limit);lastWritten=null;}
    onUpdate();
  }
  function ensureRoot(){
    const next=getRoot()||window;
    if(next===root)return false;
    clearAnimation();touch=null;
    root?.removeEventListener('scroll',rootScroll);
    root=next;limit=maximum();syncCurrent();
    root.addEventListener('scroll',rootScroll,{passive:true});
    return true;
  }
  function refresh(){
    if(disposed)return;
    if(ensureRoot())return;
    limit=maximum();
    const current=position();
    if((mode||touch)&&lastWritten!==null&&Math.abs(current-lastWritten)>1.5){
      touch=null;cancelAtCurrent();return;
    }
    target=clamp(mode?target:current,0,limit);
    rendered=clamp(mode||touch?rendered:current,0,limit);
    if(jump)jump.to=target;
    if(!mode&&!touch)lastWritten=null;
  }
  function schedule(){if(!frame&&!disposed)frame=requestAnimationFrame(tick);}
  function tick(timestamp){
    frame=0;
    if(disposed||ensureRoot()||!mode)return;
    if(!enabled()){const destination=target;clearAnimation();write(destination);return;}
    const current=position();
    if(lastWritten!==null&&Math.abs(current-lastWritten)>1.5){cancelAtCurrent();return;}
    const elapsed=lastFrame?clamp(timestamp-lastFrame,0,48):1000/60;
    lastFrame=timestamp;
    if(mode==='jump'){
      const progress=clamp((timestamp-jump.started)/jump.duration,0,1);
      const eased=progress<.5?4*progress**3:1-(-2*progress+2)**3/2;
      write(jump.from+(jump.to-jump.from)*eased);
      if(progress>=1){clearAnimation();syncCurrent();return;}
    }else{
      const remainder=target-rendered;
      if(Math.abs(remainder)<.4||(mode==='inertia'&&timestamp-inertiaStarted>=450)){
        write(target);clearAnimation();syncCurrent();return;
      }
      write(rendered+remainder*(1-Math.exp(-elapsed/(mode==='inertia'?95:140))));
    }
    schedule();
  }
  function to(value,{immediate=false}={}){
    if(disposed||!Number.isFinite(value))return;
    refresh();touch=null;clearAnimation();
    const current=position();rendered=current;target=clamp(value,0,limit);lastWritten=current;
    const distance=Math.abs(target-current);
    if(immediate||!enabled()||distance<.5){write(target);target=position();return;}
    mode='jump';
    jump={from:current,to:target,started:now(),duration:clamp(600+Math.sqrt(distance)*7.5,600,1000)};
    schedule();
  }
  function nestedNativeArea(element){
    if(element?.closest(nativeAreas))return true;
    for(let item=element;item&&item!==root&&item!==document.body&&item!==document.documentElement;item=item.parentElement){
      if(item.scrollHeight<=item.clientHeight+1)continue;
      if(/^(auto|scroll|overlay)$/.test(getComputedStyle(item).overflowY))return true;
    }
    return false;
  }
  function wheel(event){
    if(disposed||event.defaultPrevented)return;
    refresh();
    const element=elementFor(event);
    if(event.ctrlKey||event.shiftKey||!event.deltaY||Math.abs(event.deltaX)>Math.abs(event.deltaY)||event.clientY<70||!event.cancelable)return;
    if(modalOpen()||nestedNativeArea(element)){if(mode)cancelAtCurrent();return;}
    const outsidePane=isPane()&&root!==window&&!root.contains(element);
    // Paused motion keeps the model's compact-screen gesture route usable.
    if(!enabled()&&!outsidePane)return;
    const unit=event.deltaMode===1?16:event.deltaMode===2?viewport():1;
    const delta=event.deltaY*unit;
    if(!Number.isFinite(delta))return;
    const current=position();
    if(!enabled()){
      if(event.cancelable)event.preventDefault();
      clearAnimation();target=clamp(current+delta,0,limit);write(target);return;
    }
    if(mode==='jump'||mode==='inertia'){clearAnimation();rendered=target=current;}
    touch=null;
    // A reversal changes direction immediately instead of first paying down
    // the unfinished distance accumulated by the previous wheel burst.
    const pending=target-rendered;
    if(pending*delta<0)rendered=target=current;
    const destination=clamp(target+delta,0,limit);
    if(destination===current&&!mode)return;
    if(event.cancelable)event.preventDefault();
    target=destination;mode='wheel';lastWritten=current;schedule();
  }
  function canDragModel(event){
    if(!isPane()||root===window||modalOpen()||event.touches.length!==1)return false;
    const element=elementFor(event),point=event.touches[0];
    return !root.contains(element)&&!element?.closest(touchControls)&&!nestedNativeArea(element)&&point.clientY>=70&&point.clientY<root.getBoundingClientRect().top;
  }
  function touchStart(event){
    if(disposed)return;
    refresh();cancelAtCurrent();touch=null;
    if(!canDragModel(event))return;
    const point=event.touches[0];
    touch={id:point.identifier,x:point.clientX,y:point.clientY,startedX:point.clientX,startedY:point.clientY,time:now(),velocity:0,moved:false};
    lastWritten=position();
  }
  function touchMove(event){
    if(!touch||disposed)return;
    if(event.touches.length!==1||!isPane()||modalOpen()||!event.cancelable){touch=null;cancelAtCurrent();return;}
    const point=[...event.touches].find(item=>item.identifier===touch.id);
    if(!point){touch=null;cancelAtCurrent();return;}
    const dx=point.clientX-touch.startedX,dy=point.clientY-touch.startedY;
    if(!touch.moved&&Math.abs(dx)>8&&Math.abs(dx)>Math.abs(dy)*1.2){touch=null;cancelAtCurrent();return;}
    if(!touch.moved&&Math.abs(dy)<3)return;
    if(event.cancelable)event.preventDefault();
    const timestamp=now(),delta=touch.y-point.clientY,elapsed=clamp(timestamp-touch.time,8,60);
    touch.velocity=clamp(touch.velocity*.55+delta/elapsed*.45,-1.4,1.4);
    touch.y=point.clientY;touch.x=point.clientX;touch.time=timestamp;touch.moved=true;
    target=clamp(rendered+delta,0,limit);write(target);
  }
  function touchEnd(event){
    if(!touch||disposed)return;
    if(event.touches.length){touch=null;cancelAtCurrent();return;}
    const gesture=touch;touch=null;
    const age=now()-gesture.time;
    if(!gesture.moved||!enabled()||age>100){syncCurrent();return;}
    const velocity=gesture.velocity*Math.exp(-age/75);
    const distance=clamp(velocity*125,-Math.min(220,viewport()*.6),Math.min(220,viewport()*.6));
    if(Math.abs(distance)<8){syncCurrent();return;}
    target=clamp(position()+distance,0,limit);
    if(Math.abs(target-position())<.5){syncCurrent();return;}
    rendered=position();mode='inertia';inertiaStarted=now();lastWritten=position();schedule();
  }
  function touchCancel(){touch=null;if(root)cancelAtCurrent();}
  function keydown(event){
    if(!mode)return;
    if(['Tab','ArrowUp','ArrowDown','PageUp','PageDown','Home','End',' ','Spacebar'].includes(event.key))cancelAtCurrent();
  }
  function pointerdown(event){if(mode&&event.button===0)cancelAtCurrent();}
  function visibility(){if(document.hidden){touch=null;cancelAtCurrent();}}
  function setEnabled(value){
    if(disposed)return;
    refresh();manualEnabled=Boolean(value);
    if(!manualEnabled){
      const destination=target,wasMoving=Boolean(mode);
      touch=null;clearAnimation();
      if(wasMoving)write(destination);
      syncCurrent();
    }
  }
  function stop(){if(!disposed){ensureRoot();touch=null;cancelAtCurrent();}}
  function dispose(){
    if(disposed)return;
    stop();disposed=true;
    root?.removeEventListener('scroll',rootScroll);
    window.removeEventListener('wheel',wheel);
    window.removeEventListener('touchstart',touchStart);
    window.removeEventListener('touchmove',touchMove);
    window.removeEventListener('touchend',touchEnd);
    window.removeEventListener('touchcancel',touchCancel);
    window.removeEventListener('keydown',keydown);
    window.removeEventListener('pointerdown',pointerdown);
    document.removeEventListener('visibilitychange',visibility);
  }
  window.addEventListener('wheel',wheel,{passive:false});
  window.addEventListener('touchstart',touchStart,{passive:true});
  window.addEventListener('touchmove',touchMove,{passive:false});
  window.addEventListener('touchend',touchEnd,{passive:true});
  window.addEventListener('touchcancel',touchCancel,{passive:true});
  window.addEventListener('keydown',keydown);
  window.addEventListener('pointerdown',pointerdown,{passive:true});
  document.addEventListener('visibilitychange',visibility);
  refresh();
  return {to,refresh,setEnabled,stop,dispose};
}
