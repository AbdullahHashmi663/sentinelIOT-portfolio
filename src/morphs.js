// Every chapter rearranges the same processor, thirteen nodes and seven light arcs.
// Targets are deterministic so scrolling backwards retraces the transformation.
const TAU = Math.PI * 2;
const PI = Math.PI;
const transform = (position=[0,0,0],rotation=[0,0,0],scale=[1,1,1]) => ({position,rotation,scale});
const plate = (x,y,z=0,rx=0,ry=0,rz=0,sx=1,sy=1,sz=1) => transform([x,y,z],[rx,ry,rz],[sx,sy,sz]);
const assembled = () => Array.from({length:4},(_,i)=>plate(0,-.27+i*.22));

export const forms = [
  {
    name:'Sentinel core', core:transform([0,0,0],[.32,.6,.13]), layers:assembled(),
    base:plate(0,-.58), lid:plate(0,.72), nodeScale:1, gyro:1, guides:1,
  },
  {
    name:'Connected constellation', core:transform([0,0,0],[.12,.3,0],[.7,.7,.7]),
    layers:[plate(-1.35,.1,-.5),plate(1.35,.1,-.5),plate(0,-.1,1.5),plate(0,.8)],
    base:plate(0,-.6,0,0,0,0,.65,1,.65), lid:plate(0,1.3,0,0,0,0,.65,1,.65), nodeScale:1.1, gyro:0, guides:0,
  },
  {
    name:'Disrupted spiral', core:transform([0,0,0],[.25,.5,-.16],[.85,.85,.85]),
    layers:[plate(-.75,-.85,.1,.1,-.3,-.25),plate(.85,-.25,.25,-.1,.3,.18),plate(-.65,.5,-.3,.2,-.35,-.14),plate(.55,1.2,.1,-.1,.4,.24)],
    base:plate(-.25,-1.55,0,.08,-.3,-.12), lid:plate(.7,1.9,.2,.2,.3,.2,.8,1,.8), nodeScale:1.05, gyro:.45, guides:0,
  },
  {
    name:'Conformer tower', core:transform([0,0,0],[.18,.48,0],[.9,.9,.9]),
    layers:Array.from({length:4},(_,i)=>plate(0,-1.45+i,0,0,(i%2?1:-1)*.2)),
    base:plate(0,-2.15,0,0,0,0,.8,.7,.8), lid:plate(0,2.35,0,0,0,0,.75,1,.75), nodeScale:.9, gyro:.7, guides:0,
  },
  {
    name:'Feature landscape', core:transform([0,0,0],[.04,.12,0]),
    layers:Array.from({length:4},(_,i)=>plate(-.75+i*.5,.7+i*.13,-.8+i*.12,PI/2,0,-.12+i*.08,.65,1,1)),
    base:plate(0,-1.7,0,0,0,0,1.65,.6,.55), lid:plate(1.65,1.5,0,PI/2,0,0,.45,1,.45), nodeScale:.8, gyro:0, guides:0,
  },
  {
    name:'Containment shield', core:transform([0,0,0],[.08,.15,0]),
    layers:[plate(-.6,.65,0,PI/2,0,-.15,.8,1,.85),plate(.6,.65,0,PI/2,0,.15,.8,1,.85),plate(-.42,-.62,.1,PI/2,0,.3,.65,1,.75),plate(.42,-.62,.1,PI/2,0,-.3,.65,1,.75)],
    base:plate(0,-1.65,-.25,0,0,0,.6,.6,.6), lid:plate(0,1.85,0,PI/2,0,0,.45,1,.45), nodeScale:.95, gyro:0, guides:0,
  },
  {
    name:'Evidence folio', core:transform([-.2,0,0],[.1,-.3,-.06]),
    layers:Array.from({length:4},(_,i)=>plate(-.45+i*.25,-.2+i*.22,-.3+i*.18,PI/2,0,-.08+i*.05,1.35,1,1.55)),
    base:plate(0,-1.9,-.35,0,0,0,1.4,.5,.55), lid:plate(.9,1.65,.4,PI/2,0,-.12,.45,1,.45), nodeScale:.8, gyro:0, guides:0,
  },
  {
    name:'Connected architecture', core:transform([0,0,0],[.22,.4,0],[.95,.95,.95]),
    layers:[plate(0,-1.6),plate(0,-.55),plate(0,.55),plate(0,1.6)],
    base:plate(0,-2.05,0,0,0,0,.85,.6,.85), lid:plate(0,2.15,0,0,0,0,.7,1,.7), nodeScale:.9, gyro:0, guides:0,
  },
  {
    name:'Sentinel signature', core:transform([0,0,0],[.32,.6,.13],[1.1,1.1,1.1]), layers:assembled(),
    base:plate(0,-.58), lid:plate(0,.72), nodeScale:.85, gyro:.8, guides:.4,
  },
  {
    name:'Deployment arrows', core:transform([0,.32,.16],[0,0,0],[.9,.9,.9]),
    layers:[
      plate(-1.48,.12,0,PI/2,0,0,1.2,1,.16),
      plate(1.48,.12,0,PI/2,0,0,1.2,1,.16),
      plate(-.16,-1.48,.02,PI/2,0,-PI/2,.85,1,.13),
      plate(.16,-1.48,.02,PI/2,0,-PI/2,.85,1,.13),
    ],
    base:plate(0,0,-.08,PI/2,0,PI/4,.4,.8,.4),
    lid:plate(0,-2.76,.04,PI/2,0,PI/4,.52,1,.52), nodeScale:.72, gyro:0, guides:0,
  },
];

const clusters = [[-1.8,.9,-.35],[1.35,1.05,.05],[.3,-1.65,.3]];
const shieldVertices = [[0,2.9],[2.35,1.65],[1.9,-.9],[0,-2.7],[-1.9,-.9],[-2.35,1.65],[0,2.9]];
const folioVertices = [[-2.15,2.5],[1.6,2.5],[2.15,1.9],[2.15,-2.5],[-2.15,-2.5],[-2.15,2.5]];
// The final orbit becomes three distinct, closed arrow outlines. Each old arc
// covers one interval of an arrow, retaining its small luminous separation.
const deploymentArrows = [
  [[-.52,.7],[-1.95,.7],[-1.95,1.24],[-3,.42],[-1.95,-.4],[-1.95,.14],[-.52,.14],[-.52,.7]],
  [[.52,.7],[1.95,.7],[1.95,1.24],[3,.42],[1.95,-.4],[1.95,.14],[.52,.14],[.52,.7]],
  [[-.27,-.18],[-.27,-1.75],[-.85,-1.75],[0,-2.9],[.85,-1.75],[.27,-1.75],[.27,-.18],[-.27,-.18]],
];
const deploymentNodes = [
  [-.7,.42,.16],[-1.43,.42,.16],[-2.13,.95,.16],[-2.82,.42,.16],[-2.13,-.11,.16],
  [.7,.42,.16],[1.43,.42,.16],[2.13,.95,.16],[2.82,.42,.16],[2.13,-.11,.16],
  [0,-.64,.16],[0,-1.5,.16],[0,-2.7,.16],
];
function polygon(vertices,t){
  const lengths=vertices.slice(1).map((v,i)=>Math.hypot(v[0]-vertices[i][0],v[1]-vertices[i][1]));
  let distance=((t%1)+1)%1*lengths.reduce((a,b)=>a+b,0);
  for(let i=0;i<lengths.length;i++){
    if(distance<=lengths[i]){const f=distance/lengths[i];return [vertices[i][0]+(vertices[i+1][0]-vertices[i][0])*f,vertices[i][1]+(vertices[i+1][1]-vertices[i][1])*f,0];}
    distance-=lengths[i];
  }
  return [...vertices[0],0];
}

// Light arcs change their actual silhouette, from orbit to helix, shield and folio.
export function outlinePoint(form,t,segment=0){
  const a=t*TAU;
  if(form===1){
    const group=segment%3,c=clusters[group],local=(t*7-segment)*TAU;
    return [c[0]+Math.cos(local)*1.18,c[1]+Math.sin(local)*1.18,c[2]];
  }
  if(form===2)return [Math.cos(a)*2.9,Math.sin(a)*2.65,Math.sin(a*2)*.85];
  if(form===3)return [Math.cos(a*1.55)*2.05,(t-.5)*5.8,Math.sin(a*1.55)*1.1];
  if(form===4)return polygon([[-2.7,2.45],[2.7,2.45],[2.7,-1.9],[-2.7,-1.9],[-2.7,2.45]],t);
  if(form===5)return polygon(shieldVertices,t);
  if(form===6)return polygon(folioVertices,t);
  if(form===7){const c=segment%3,local=(t*7-segment)*TAU;return [Math.cos(local)*2.65,(c-1)*1.85+Math.sin(local)*.42,Math.sin(local)*.65];}
  if(form===9){
    const group=segment<2?0:segment<4?1:2,start=[0,2,4][group],count=[2,2,3][group];
    const local=t*7-segment;
    return polygon(deploymentArrows[group],(segment-start+local)/count);
  }
  const r=form===8?2.6:3.13;
  return [Math.cos(a)*r,Math.sin(a)*r,0];
}

export function nodePosition(form,i){
  const a=i*TAU/13+.3;
  if(form===1){
    const group=i===0?0:i<=7?1:2,c=clusters[group],n=group===0?0:group===1?i-1:i-8,count=[1,7,5][group];
    const theta=n*TAU/count+.35;
    return [c[0]+Math.cos(theta)*.9,c[1]+Math.sin(theta)*.9,c[2]+Math.sin(theta)*.3];
  }
  if(form===2){const r=2.3+(i%3)*.3;return [Math.cos(a)*r,Math.sin(a)*r,Math.sin(a*2)*.8];}
  if(form===3){const t=i/12,theta=t*TAU*1.55;return [Math.cos(theta)*2.05,(t-.5)*5.3,Math.sin(theta)*1.1];}
  if(form===4){const h=[1.9,1.5,1.12,.8,.48,.2,.03][i%7];return i<7?[-2.1+i*.7,-1.45+h,.6]:[-1.9+(i-7)*.76,2,.05];}
  if(form===5){const p=polygon(shieldVertices,i/13);return [p[0]*.9,p[1]*.9,.3];}
  if(form===6)return [-2.65+i*.44,-2.8+(i%2)*.22,.3];
  if(form===7){const row=i<4?0:i<9?1:2,start=[0,4,9][row],count=[4,5,4][row];return [(i-start-(count-1)/2)*1.08,(row-1)*1.85,.65];}
  if(form===9)return [...deploymentNodes[i]];
  const r=form===8?2.17:2.44;
  return [Math.cos(a)*r,Math.sin(a)*r,-.45+Math.sin(a)*.3];
}

export function morphSegment(value){
  const clamped=Math.max(0,Math.min(forms.length-1,value));
  const from=Math.floor(clamped),to=Math.min(forms.length-1,from+1);
  return {from,to,mix:clamped-from};
}
