// The existing 3D loop supplies displayed story progress. No extra motion loop.
const moods=[
  {chapter:1,name:'network',grid:.13},
  {chapter:2,name:'intrusion',grid:0},
  {chapter:4,name:'explanation',grid:.18},
  {chapter:5,name:'response',grid:.09},
  {chapter:9,name:'downloads',grid:.2},
];
const clamp=(value,min,max)=>Math.min(max,Math.max(min,value));
const ease=value=>value*value*(3-2*value);

export function createStoryBackground({paused=false}={}){
  const root=document.createElement('div');root.className='story-background';root.setAttribute('aria-hidden','true');
  const base=document.createElement('div');base.className='story-background__base';root.append(base);
  const fields=moods.map(mood=>{
    const element=document.createElement('div');element.className='story-background__field';element.dataset.mood=mood.name;root.append(element);
    return {...mood,element,opacity:'',transform:'',visible:false};
  });
  const grid=document.createElement('div');grid.className='story-background__grid';root.append(grid);
  document.body.prepend(root);document.body.classList.add('has-story-background');
  let progress=0,exploring=false,lastKey='',lastGrid='',disposed=false;
  function paint(){
    if(disposed)return;
    const value=exploring?0:paused?Math.round(progress):progress;
    const key=`${value.toFixed(3)}:${paused}:${exploring}`;
    if(key===lastKey)return;
    lastKey=key;
    let gridWeight=0;
    for(const field of fields){
      const distance=clamp(value-field.chapter,-1,1);
      const weight=ease(Math.max(0,1-Math.abs(distance)));
      const opacity=weight.toFixed(3),visible=weight>=.001;
      const transform=paused?'none':`translate3d(${(distance*22).toFixed(2)}px,${(-distance*14).toFixed(2)}px,0)`;
      if(field.opacity!==opacity){field.element.style.opacity=opacity;field.opacity=opacity;}
      if(field.visible!==visible){field.element.classList.toggle('is-visible',visible);field.visible=visible;}
      if(visible&&field.transform!==transform){field.element.style.transform=transform;field.transform=transform;}
      gridWeight+=weight*field.grid;
    }
    const opacity=gridWeight.toFixed(3);
    if(lastGrid!==opacity){grid.style.opacity=opacity;lastGrid=opacity;}
    root.dataset.progress=value.toFixed(3);
    root.dataset.mood=exploring?'studio':moods.find(mood=>mood.chapter===Math.round(value))?.name||'charcoal';
  }
  paint();
  return {
    setProgress(value){if(!Number.isFinite(value))return;progress=clamp(value,0,9);paint();},
    setPaused(value){paused=Boolean(value);paint();},
    setExploring(value){exploring=Boolean(value);paint();},
    dispose(){disposed=true;root.remove();document.body.classList.remove('has-story-background');},
  };
}
