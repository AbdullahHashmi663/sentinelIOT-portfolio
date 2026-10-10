import './style.css';
import './center-stage.css';
import './component-guide.css';
import './story-motion.css';
import './downloads.css';
import './story-background.css';
import './splash.css';
import { createTextMotion } from './text-motion.js';
import { createComponentGuide } from './component-guide.js';
import { createStoryScroll } from './story-scroll.js';
import { createDownloadSection } from './downloads.js';
import { createStoryBackground } from './story-background.js';
import { createSplash } from './splash.js';
import { project, chapterStates } from './project.js';

const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
const motionButton=document.querySelector('#motion-toggle');
const stage=document.querySelector('#scene-stage');
const storyScroll=document.querySelector('#story-scroll');
const paneMedia=window.matchMedia('(max-width: 800px) and (min-height: 451px)');
const chapters=[...document.querySelectorAll('[data-scene]')];
const railLinks=[...document.querySelectorAll('.chapter-rail a')];
const dialog=document.querySelector('#model-dialog');
const progressBar=document.querySelector('.story-progress span');
let scene=null, paused=reducedMotion.matches,activeIndex=-1,scrollQueued=false,offsets=[];
let modelOpen=false,exploded=false;
let readingPane=paneMedia.matches,storyProgress=0,renderedChapter=0,initialHashPending=true;
let viewportWidth=window.innerWidth,viewportHeight=window.innerHeight;
const textMotion=createTextMotion({paused});
const storyBackground=createStoryBackground({paused});
const downloads=createDownloadSection({section:document.querySelector('#downloads'),leaders:document.querySelector('#download-leaders'),textMotion});
const componentGuide=createComponentGuide({root:document.querySelector('#component-guide'),dialog,textMotion,onJump:id=>railLinks.find(link=>link.hash==='#'+id)?.click()});
const storyScroller=createStoryScroll({getRoot:()=>readingPane?storyScroll:window,isEnabled:()=>!paused&&!modelOpen,isPane:()=>readingPane,onUpdate:requestUpdate});
const welcome=createSplash({root:document.querySelector('#welcome-splash'),replayButton:document.querySelector('#splash-replay'),reducedMotion,onToggle:open=>{storyScroller.stop();storyScroller.setEnabled(!paused&&!modelOpen&&!open);}});
const revealObserver=new IntersectionObserver(entries=>{
  for(const entry of entries){
    if(!entry.isIntersecting)continue;
    const el=entry.target;
    textMotion.reveal(el,{kind:el.matches('h1,h2,h3')?'headline':'body'});
    revealObserver.unobserve(el);
  }
},{threshold:.12});
const textTargets='h1,h2,h3,p,a,button,strong,.incident-line .mono,.fact-strip div>span,.dual-heads div>span,.saliency-preview div>span,.small-tag,.response-flow>span,.control-tags>span,.stack-number,.person-index,.supervisors .eyebrow,.end-note>span,.hero-bottom>.mono,.scroll-hint,.hero-credit>span,.site-footer>span';
document.querySelectorAll(textTargets).forEach(el=>{
  if(!el.closest('.scene-stage,.chapter-rail,noscript,#welcome-splash')&&!el.matches('.skip-link'))revealObserver.observe(el);
});
function updateText(element,text){
  textMotion.refresh(element);
  element.textContent=text;
  textMotion.reveal(element,{kind:'body',force:true});
}
function sceneCaptions(top,side,bottom,status,count){
  for(const [id,text] of [['scene-top-label',top],['scene-side-label',side],['scene-bottom-label',bottom],['scene-status',status],['scene-form-count',count]]){
    textMotion.caption(document.getElementById(id),text);
  }
}

function updateMotionLabel(){
  motionButton.setAttribute('aria-pressed',String(paused));
  textMotion.refresh(motionButton);
  motionButton.innerHTML=(paused?'Resume motion':'Pause motion')+' <span aria-hidden="true">'+(paused?'▶':'Ⅱ')+'</span>';
  motionButton.setAttribute('aria-label',paused?'Resume animation':'Pause animation');
  document.body.classList.toggle('motion-paused',paused);
  document.documentElement.style.scrollBehavior='auto';
  storyScroll.style.scrollBehavior='auto';
  textMotion.reveal(motionButton,{kind:'body',force:true});
}
function setPaused(value){
  paused=value;storyBackground.setPaused(value);scene?.setPaused(value);
  storyScroller.setEnabled(!value&&!modelOpen&&!welcome.isOpen);
  textMotion.setPaused(value);
  updateMotionLabel();
}
motionButton.addEventListener('click',()=>setPaused(!paused));
reducedMotion.addEventListener('change',event=>setPaused(event.matches));
updateMotionLabel();

function readingAnchors(){
  const limit=readingPane?storyScroll.scrollHeight-storyScroll.clientHeight:document.documentElement.scrollHeight-window.innerHeight;
  return [...offsets,Math.max(offsets.at(-1)||0,limit)];
}
function measure(){
  const changed=readingPane!==paneMedia.matches;
  const resized=viewportWidth!==window.innerWidth||viewportHeight!==window.innerHeight;
  viewportWidth=window.innerWidth;viewportHeight=window.innerHeight;
  if(changed||resized)storyScroller.stop();
  readingPane=paneMedia.matches;
  const y=readingPane?storyScroll.scrollTop:window.scrollY;
  const origin=readingPane?storyScroll.getBoundingClientRect().top:0;
  offsets=chapters.map(section=>section.getBoundingClientRect().top+y-origin);
  if(changed||resized){
    const anchors=readingAnchors();
    const from=Math.min(anchors.length-1,Math.floor(storyProgress)),to=Math.min(anchors.length-1,from+1);
    const target=anchors[from]+(anchors[to]-anchors[from])*(storyProgress-from);
    if(readingPane)storyScroll.scrollTo({top:target,behavior:'instant'});
    else window.scrollTo({top:target,behavior:'instant'});
  }
  storyScroller.refresh();
  if(initialHashPending){
    initialHashPending=false;
    const index=chapters.findIndex(section=>'#'+section.id===location.hash);
    if(index>=0)storyScroller.to(offsets[index],{immediate:true});
  }
  requestUpdate();
}
function chapterProgress(y,anchors=offsets){
  if(y<=anchors[0])return 0;
  for(let i=0;i<anchors.length-1;i++){
    if(y<anchors[i+1])return i+(y-anchors[i])/(anchors[i+1]-anchors[i]);
  }
  return anchors.length-1;
}
function update(){
  scrollQueued=false;
  const y=readingPane?storyScroll.scrollTop:window.scrollY,progress=chapterProgress(y);
  storyProgress=chapterProgress(y,readingAnchors());
  const index=Math.min(chapterStates.length-1,Math.round(progress));
  progressBar.style.transform=`scaleX(${Math.min(1,Math.max(0,storyProgress/(chapters.length)))})`;
  scene?.setProgress(progress,index);
  if(!scene)storyBackground.setProgress(paused?index:progress);
  applyChapter(scene&&!paused?renderedChapter:index);
  scene?.setVisible(true);
}
function applyChapter(index){
  document.body.classList.toggle('is-team',index===8&&!modelOpen);
  document.body.classList.toggle('is-system',index===7&&!modelOpen);
  document.body.classList.toggle('is-downloads',index===9&&!modelOpen);
  downloads.setActive(index===9&&!modelOpen);
  stage.setAttribute('aria-hidden','false');
  if(index!==activeIndex){
    activeIndex=index;
    const state=chapterStates[index];
    if(!modelOpen)componentGuide.setChapter(index);
    document.documentElement.style.setProperty('--accent',state.color);
    if(!modelOpen)sceneCaptions(state.top,state.side,state.bottom,state.status,String(index+1).padStart(2,'0')+' / '+String(chapterStates.length).padStart(2,'0'));
    stage.dataset.form=state.form;
    if(!modelOpen)stage.setAttribute('aria-label',state.description);
    railLinks.forEach((link,i)=>{
      i===index?link.setAttribute('aria-current','step'):link.removeAttribute('aria-current');
      link.classList.toggle('is-visited',i<index);
    });
  }
}
function requestUpdate(){if(!scrollQueued){scrollQueued=true;requestAnimationFrame(update);}}
window.addEventListener('scroll',requestUpdate,{passive:true});
storyScroll.addEventListener('scroll',requestUpdate,{passive:true});
// Chapter navigation shares the wheel/touch controller, including guide jumps.
document.addEventListener('click',event=>{
  const link=event.target.closest?.('a[href]');
  if(!link||event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey||link.target==='_blank'||link.hasAttribute('download'))return;
  const destination=new URL(link.href,location.href);
  if(destination.origin!==location.origin||destination.pathname!==location.pathname||destination.search!==location.search)return;
  if(destination.hash==='#main'){storyScroller.stop();return;}
  const index=chapters.findIndex(section=>'#'+section.id===destination.hash);
  if(index<0)return;
  event.preventDefault();
  if(location.hash!==destination.hash)history.pushState(null,'',destination.hash);
  storyScroller.to(offsets[index],{immediate:paused});
});
function restoreHash(){
  storyScroller.stop();
  requestAnimationFrame(()=>{
    const index=chapters.findIndex(section=>'#'+section.id===location.hash);
    if(index>=0)storyScroller.to(offsets[index],{immediate:true});
  });
}
window.addEventListener('popstate',restoreHash);
window.addEventListener('hashchange',restoreHash);
window.addEventListener('resize',measure);
new ResizeObserver(measure).observe(document.querySelector('main'));
document.fonts.ready.then(measure);
measure();

const replayButton=document.querySelector('#replay-incident');
const containButton=document.querySelector('#contain-demo');
const modelButton=document.querySelector('#model-open');
const exportButton=document.querySelector('#export-model');
const sceneControls=[replayButton,containButton,modelButton,exportButton];
sceneControls.forEach(b=>b.disabled=true);
function sceneFailure(){
  stage.classList.remove('is-ready');
  componentGuide.unavailable();
  updateText(document.querySelector('#fallback-message'),'The story is ready in a text-friendly view.');
  updateText(document.querySelector('#model-message'),'3D is unavailable in this browser. The full project story remains accessible.');
  sceneControls.forEach(b=>b.disabled=true);
  updateText(document.querySelector('#contain-status'),'The full response story is available above. 3D controls need WebGL support.');
  welcome.ready({fallback:true});
}
stage.addEventListener('scene-error',()=>{scene?.dispose();scene=null;sceneFailure();});
try{
  const {createScene}=await import('./scene.js');
  scene=await createScene(document.querySelector('#scene-mount'),{reducedMotion:paused,modelUrl:project.modelUrl,onProgress:progress=>storyBackground.setProgress(progress),onComponents:frame=>{componentGuide.update(frame);downloads.update(frame);},onChapter:index=>{renderedChapter=index;applyChapter(index);}});
  stage.classList.add('is-ready');
  sceneControls.forEach(b=>b.disabled=false);
  welcome.ready();
  update();
}catch(error){
  console.warn('3D experience unavailable:',error.message);
  sceneFailure();
}
replayButton.addEventListener('click',()=>{scene?.replayIncident();});
containButton.addEventListener('click',()=>{
  scene?.contain();
  updateText(document.querySelector('#contain-status'),'Demonstration complete: the boundary isolates the suspicious path while other nodes stay connected.');
});
function closeModel(){
  modelOpen=false;storyBackground.setExploring(false);storyScroller.setEnabled(!paused&&!welcome.isOpen);componentGuide.setExploring(false);scene?.explore(false);document.body.classList.remove('is-model-view');activeIndex=-1;requestUpdate();
}
modelButton.addEventListener('click',()=>{
  storyScroller.stop();modelOpen=true;storyBackground.setExploring(true);storyScroller.setEnabled(false);componentGuide.setExploring(true);scene?.explore(true);document.body.classList.add('is-model-view');
  document.body.classList.remove('is-team','is-system','is-downloads');downloads.setActive(false);scene?.setVisible(true);dialog.showModal();
  sceneCaptions('SENTINEL / MODEL LAB','ROTATE · INSPECT · EXPORT','A CORE WORTH EXPLORING','Explore the core','3D / LAB');
  stage.setAttribute('aria-label','A centered three-dimensional Sentinel core. Rotate it, open its layers, or export it for Blender.');
  dialog.querySelectorAll(textTargets).forEach(el=>textMotion.reveal(el,{kind:el.matches('h2')?'headline':'body',force:true}));
});
document.querySelector('#model-close').addEventListener('click',()=>dialog.close());
dialog.addEventListener('close',closeModel);
dialog.addEventListener('click',event=>{
  if(event.target!==dialog)return;
  const r=dialog.getBoundingClientRect();
  if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();
});
document.querySelector('#rotate-left').addEventListener('click',()=>scene?.rotate(-1));
document.querySelector('#rotate-right').addEventListener('click',()=>scene?.rotate(1));
document.querySelector('#explode-model').addEventListener('click',event=>{
  exploded=!exploded;scene?.explode(exploded);
  event.currentTarget.setAttribute('aria-pressed',String(exploded));
  updateText(event.currentTarget,exploded?'Close layers':'Open layers');
});
document.querySelector('#model-reset').addEventListener('click',()=>{
  scene?.reset();exploded=false;
  document.querySelector('#explode-model').setAttribute('aria-pressed','false');
  updateText(document.querySelector('#explode-model'),'Open layers');
});
exportButton.addEventListener('click',async()=>{
  if(!scene)return;
  exportButton.disabled=true;
  const message=document.querySelector('#model-message');
  updateText(message,'Preparing your Blender-compatible model…');
  try{
    const data=await scene.exportModel();
    const blob=new Blob([data],{type:'model/gltf-binary'});
    const url=URL.createObjectURL(blob),link=document.createElement('a');
    link.href=url;link.download='sentinel-iot-core.glb';document.body.append(link);link.click();link.remove();
    setTimeout(()=>URL.revokeObjectURL(url),10000);
    updateText(message,'Export ready. Import sentinel-iot-core.glb in Blender using glTF 2.0.');
  }catch(error){updateText(message,'Export could not finish. Try resetting the model and exporting again.');console.warn(error);}
  finally{exportButton.disabled=false;}
});
window.addEventListener('pagehide',event=>{
  storyScroller.stop();
  if(event.persisted){welcome.suspend();scene?.setVisible(false);return;}
  welcome.dispose();scene?.dispose();storyBackground.dispose();storyScroller.dispose();revealObserver.disconnect();componentGuide.dispose();downloads.dispose();textMotion.dispose();
});
window.addEventListener('pageshow',event=>{if(event.persisted){measure();update();welcome.resume();}});
