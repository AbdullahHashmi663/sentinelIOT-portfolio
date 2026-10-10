import { modelComponents, chapterComponents } from './components.js';

const byId=new Map(modelComponents.map(component=>[component.id,component]));
const chapterIds=['intro','network','intrusion','detection','explanation','response','evidence','system','team','downloads'];
const chapterFor=component=>({saliency:4,shield:5,evidence:6,threat:2,pins:8}[component.anchor]??(component.anchor.startsWith('layer:')?3:component.group==='Telemetry'?1:0));
const svgNS='http://www.w3.org/2000/svg';

export function createComponentGuide({root,dialog,textMotion,onJump}){
  root.innerHTML=`<svg class="component-leaders" aria-hidden="true"></svg>
    <button class="component-guide-toggle" type="button" aria-controls="component-inspector" aria-expanded="false">Component guide <span aria-hidden="true">↗</span></button>
    <div class="component-callouts"></div>
    <section class="component-inspector" id="component-inspector" role="region" aria-labelledby="component-title" hidden>
      <div class="component-panel-top"><span class="eyebrow">MODEL / COMPONENT GUIDE</span><button class="component-close" type="button" aria-label="Close component guide">×</button></div>
      <p class="component-category"></p><h2 id="component-title" tabindex="-1"></h2>
      <p class="component-description"></p><p class="component-visibility" role="status"></p>
      <button class="component-jump" type="button">Show in the story <span aria-hidden="true">↗</span></button>
      <label class="component-select-label" for="component-select">Choose a component</label><select id="component-select"></select>
      <p class="component-guide-note">30 components · 13 telemetry sources<br>Labels follow the model as it transforms.</p>
    </section>`;
  const svg=root.querySelector('svg'),calloutRoot=root.querySelector('.component-callouts');
  const toggle=root.querySelector('.component-guide-toggle'),panel=root.querySelector('.component-inspector');
  const title=panel.querySelector('h2'),description=panel.querySelector('.component-description');
  const category=panel.querySelector('.component-category'),status=panel.querySelector('.component-visibility');
  const select=panel.querySelector('select'),jump=panel.querySelector('.component-jump');
  const lab=document.createElement('section');lab.className='lab-component-guide';
  lab.innerHTML='<label class="component-select-label" for="lab-component-select">Inspect a component</label><select id="lab-component-select"></select><p class="lab-component-description"></p><p class="lab-component-visibility" role="status"></p><button class="component-jump" type="button">Show in the story <span aria-hidden="true">↗</span></button>';
  dialog.querySelector('#model-message').before(lab);
  const labSelect=lab.querySelector('select'),labDescription=lab.querySelector('.lab-component-description');
  const labStatus=lab.querySelector('.lab-component-visibility'),labJump=lab.querySelector('button');
  for(const menu of [select,labSelect]){
    for(const group of ['Intelligence','Telemetry','Story visuals']){
      const optgroup=document.createElement('optgroup');optgroup.label=group;
      for(const component of modelComponents.filter(component=>component.group===group)){
        const option=document.createElement('option');option.value=component.id;option.textContent=component.title;optgroup.append(option);
      }
      menu.append(optgroup);
    }
  }
  const slots=Array.from({length:3},(_,index)=>{
    const button=document.createElement('button');button.type='button';button.className='component-callout';
    button.setAttribute('aria-controls','component-inspector');button.setAttribute('aria-expanded','false');
    button.innerHTML=`<span class="component-index" aria-hidden="true">${String(index+1).padStart(2,'0')}</span><span class="component-copy"><strong></strong><small></small></span>`;
    calloutRoot.append(button);
    const line=document.createElementNS(svgNS,'path');line.setAttribute('class','component-leader');
    const dot=document.createElementNS(svgNS,'circle');dot.setAttribute('class','component-endpoint');dot.setAttribute('r','3');
    svg.append(line,dot);
    button.addEventListener('click',()=>open(button.dataset.component,button));
    return {button,line,dot,title:button.querySelector('strong'),short:button.querySelector('small')};
  });
  const selectedLine=document.createElementNS(svgNS,'path');selectedLine.setAttribute('class','component-leader selected');
  const selectedDot=document.createElementNS(svgNS,'circle');selectedDot.setAttribute('class','component-target');selectedDot.setAttribute('r','9');
  svg.append(selectedLine,selectedDot);
  let chapter=0,selected='core',exploring=false,opened=false,returnFocus=null,returnComponent=null,positions=null,viewport={width:0,height:0},lastAvailability='';
  const compact=window.matchMedia('(max-width:800px) and (min-height:451px)');
  let layoutDirty=true,titleRect=null,lastViewBox='',lastHighlight=null,lastSelectedLine=null;

  function write(element,value,kind='body'){
    textMotion.refresh(element);element.textContent=value;textMotion.reveal(element,{kind,force:true});
  }
  function updateSlots(){
    layoutDirty=true;
    const ids=[...(exploring?['input','convolution','prediction']:chapterComponents[chapter])];
    if(exploring&&!ids.includes(selected))ids[0]=selected;
    slots.forEach((slot,index)=>{
      const component=byId.get(ids[index]);
      if(slot.button.dataset.component!==component.id){
        slot.button.dataset.component=component.id;
        slot.button.setAttribute('aria-label',`Inspect ${component.title}`);
        write(slot.title,component.title);write(slot.short,component.short);
      }
      slot.button.setAttribute('aria-expanded',String(opened&&selected===component.id));
      slot.button.classList.toggle('is-selected',selected===component.id&&(opened||exploring));
    });
    root.dataset.chapter=String(chapter);
    layout();
  }
  function renderDetail(){
    const component=byId.get(selected);
    write(category,component.group);write(title,component.title,'headline');write(description,component.description);
    write(labDescription,component.description);
    select.value=selected;labSelect.value=selected;root.dataset.selected=selected;
    lastAvailability='';updateAvailability();updateSlots();
  }
  function updateAvailability(){
    const available=positions?.[selected]?.visible;
    if(available===undefined)return;
    const key=`${available}:${exploring}:${selected}:${chapter}`;
    if(key===lastAvailability)return;
    lastAvailability=key;
    const component=byId.get(selected);
    const needsOpenLayers=component.anchor.startsWith('layer:')&&!exploring&&chapter!==3&&chapter!==7;
    const message=available?(needsOpenLayers?'Open the detection chapter to see this layer clearly.':'Highlighted on the model.'):exploring?'This part appears during the story.':`This part appears in the ${['introduction','connected world','intrusion','detection','explanation','response','evidence','system','team'][chapterFor(component)]} chapter.`;
    status.textContent=message;labStatus.textContent=message;
    jump.hidden=available&&!needsOpenLayers;labJump.hidden=available;
  }
  function open(id,trigger){
    selected=id;returnFocus=trigger;returnComponent=trigger?.dataset.component;opened=true;panel.hidden=false;
    root.classList.add('is-inspecting');toggle.setAttribute('aria-expanded','true');
    renderDetail();title.focus({preventScroll:true});
    textMotion.reveal(panel.querySelector('.component-guide-note'),{force:true});
  }
  function close(restoreFocus=true){
    opened=false;panel.hidden=true;root.classList.remove('is-inspecting');toggle.setAttribute('aria-expanded','false');
    slots.forEach(slot=>slot.button.setAttribute('aria-expanded','false'));
    layoutDirty=true;layout();
    if(restoreFocus){
      const sameComponent=!returnComponent||returnFocus?.dataset.component===returnComponent;
      const target=returnFocus?.isConnected&&!returnFocus.hidden&&returnFocus.getClientRects().length&&sameComponent?returnFocus:toggle;
      target.focus({preventScroll:true});
    }
    returnFocus=null;returnComponent=null;
  }
  function showInStory(){
    const id=selected,target=chapterFor(byId.get(id));
    const reveal=()=>{close(false);onJump(chapterIds[target]);open(id,toggle);};
    if(dialog.open){dialog.addEventListener('close',reveal,{once:true});dialog.close();}
    else reveal();
  }
  toggle.addEventListener('click',()=>opened?close():open(chapterComponents[chapter][0],toggle));
  panel.querySelector('.component-close').addEventListener('click',()=>close());
  select.addEventListener('change',()=>{selected=select.value;renderDetail();});
  labSelect.addEventListener('change',()=>{selected=labSelect.value;renderDetail();});
  jump.addEventListener('click',showInStory);labJump.addEventListener('click',showInStory);
  const keydown=event=>{if(event.key==='Escape'&&opened){event.preventDefault();event.stopPropagation();close();}};
  const focusin=event=>{
    if(!opened||root.contains(event.target))return;
    // A bottom inspector must not obscure keyboard focus in the story beneath it.
    if(compact.matches)close(false);
  };
  document.addEventListener('keydown',keydown);document.addEventListener('focusin',focusin);

  function layout(){
    if(!positions)return;
    const mobile=compact.matches;
    const viewBox=`0 0 ${viewport.width} ${viewport.height}`;
    if(lastViewBox!==viewBox){svg.setAttribute('viewBox',viewBox);lastViewBox=viewBox;}
    slots.forEach((slot,index)=>{
      const point=positions[slot.button.dataset.component];
      const show=Boolean(point?.visible&&point.inFrame&&(!opened||mobile));
      if(slot.show!==show){
        layoutDirty=true;slot.show=show;
        slot.button.hidden=!show;slot.line.style.display=show?'':'none';slot.dot.style.display=show?'':'none';
      }
      if(!show)return;
      if(layoutDirty&&mobile){
        // The three names stay in the top band; their lines follow the actual parts.
        const x=(index+.5)*viewport.width/3,y=132;
        slot.button.style.left=`${x}px`;slot.button.style.top=`${y}px`;
        slot.button.style.transform='translate(-50%,0)';
      }else if(layoutDirty){
        const header=Number.parseFloat(getComputedStyle(root).getPropertyValue('--stage-header'))||86;
        const first=Math.max(header+110,viewport.height*.27),last=viewport.height-230;
        slot.button.style.left='73vw';slot.button.style.top=`${first+(Math.max(first+100,last)-first)*index/2}px`;
        slot.button.style.transform='none';
      }
      if(layoutDirty||!slot.rect)slot.rect=slot.button.getBoundingClientRect();
      const r=slot.rect,endX=mobile?r.x+r.width/2:r.x-8,endY=mobile?r.bottom+6:r.y+r.height/2;
      const elbowX=mobile?endX:Math.max(point.x+24,endX-28);
      slot.line.setAttribute('d',`M ${point.x} ${point.y} L ${elbowX} ${point.y} L ${endX} ${endY}`);
      slot.dot.setAttribute('cx',point.x);slot.dot.setAttribute('cy',point.y);
    });
    const point=positions[selected],highlight=Boolean(point?.visible&&point.inFrame&&(opened||exploring));
    const showLine=highlight&&!mobile&&opened;
    if(lastHighlight!==highlight){selectedDot.style.display=highlight?'':'none';lastHighlight=highlight;}
    if(lastSelectedLine!==showLine){selectedLine.style.display=showLine?'':'none';lastSelectedLine=showLine;}
    if(highlight){
      selectedDot.setAttribute('cx',point.x);selectedDot.setAttribute('cy',point.y);
      if(!mobile&&opened){if(layoutDirty||!titleRect)titleRect=title.getBoundingClientRect();const r=titleRect;selectedLine.setAttribute('d',`M ${point.x} ${point.y} L ${r.x-22} ${point.y} L ${r.x-8} ${r.y+r.height/2}`);}
    }
    layoutDirty=false;
  }
  updateSlots();
  const observedSizes=new WeakMap();
  const labelResize=new ResizeObserver(entries=>{
    let changed=false;
    for(const entry of entries){
      const previous=observedSizes.get(entry.target),{width,height}=entry.contentRect;
      if(!previous||Math.abs(previous.width-width)>.25||Math.abs(previous.height-height)>.25)changed=true;
      observedSizes.set(entry.target,{width,height});
    }
    if(changed){layoutDirty=true;layout();}
  });
  slots.forEach(slot=>labelResize.observe(slot.button));labelResize.observe(title);
  return {
    update({points,width,height}){if(width!==viewport.width||height!==viewport.height)layoutDirty=true;positions=points;viewport={width,height};root.classList.add('is-ready');updateAvailability();layout();},
    setChapter(index){if(chapter===index)return;chapter=index;updateAvailability();updateSlots();},
    setExploring(value){exploring=value;close(false);root.classList.toggle('is-exploring',value);if(value){selected='input';renderDetail();}else updateSlots();},
    unavailable(){root.hidden=true;lab.hidden=true;},
    dispose(){labelResize.disconnect();document.removeEventListener('keydown',keydown);document.removeEventListener('focusin',focusin);},
  };
}
