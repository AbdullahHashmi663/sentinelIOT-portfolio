import * as THREE from 'three';
import { animate, createTimeline } from 'animejs';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { forms, nodePosition, outlinePoint, morphSegment } from './morphs.js';
import { modelComponents } from './components.js';

const TAU = Math.PI * 2;
const palette = [0xff7768, 0xf4c66c, 0xb3df93, 0x8cdbcd, 0x83b5ef, 0xb4a0fa, 0xffa6c2];
const nodeNames = ['Network', 'Fridge', 'GPS_Tracker', 'Garage_Door', 'Modbus', 'Motion_Light', 'Thermostat', 'Weather', 'Linux_Disk', 'Linux_Memory', 'Linux_Process', 'Windows_7', 'Windows_10'];
const metal = () => new THREE.MeshStandardMaterial({color:0x363735,metalness:.78,roughness:.3});
const glow = (color, intensity = 1.25) => new THREE.MeshStandardMaterial({color,emissive:color,emissiveIntensity:intensity,metalness:.15,roughness:.4});
const vec = (x,y,z) => new THREE.Vector3(x,y,z);

function outlinedBox(parent, size, position, material, color = 0x5f625b) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size),material);
  mesh.position.set(...position);
  parent.add(mesh);
  const edge = new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry),new THREE.LineBasicMaterial({color,transparent:true,opacity:.7}));
  mesh.add(edge);
  return mesh;
}

export function createSentinelModel() {
  const root = new THREE.Group(); root.name = 'Sentinel_Assembly';
  const core = new THREE.Group(); core.name = 'Sentinel_Core'; root.add(core);
  const bottom = outlinedBox(core,[1.75,.28,1.75],[0,-.58,0],metal(),0x898c7f); bottom.name = 'Core_Base';
  const layers = [];
  const layerNames = ['Input_Projection','Convolution','Self_Attention','Prediction_Heads'];
  for(let i=0;i<4;i++){
    const plate = new THREE.Group(); plate.name = layerNames[i]; plate.position.y = -.27+i*.22; core.add(plate);
    outlinedBox(plate,[1.5,.065,1.5],[0,0,0],metal(),palette[i]);
    const frame = new THREE.Mesh(new THREE.BoxGeometry(1.52,.015,1.52),glow(palette[i],.8)); frame.position.y=.045; plate.add(frame);
    const centerPlate = new THREE.Mesh(new THREE.BoxGeometry(1.42,.025,1.42),metal()); centerPlate.position.y=.055; plate.add(centerPlate);
    for(let j=0;j<6;j++){
      const line = new THREE.Mesh(new THREE.BoxGeometry(.95,.013,.015),glow(palette[i],1));
      line.position.set(0,.073,-.46+j*.18); plate.add(line);
      const stud = new THREE.Mesh(new THREE.BoxGeometry(.09,.028,.09),glow(palette[i],1.2));
      stud.position.set(-.5+(j%3)*.5,.08,-.46+Math.floor(j/3)*.9); plate.add(stud);
    }
    layers.push(plate);
  }
  const lid = new THREE.Group(); lid.name = 'Core_Lid'; lid.position.y=.72; core.add(lid);
  outlinedBox(lid,[1.75,.12,1.75],[0,0,0],metal(),0x9b9b8b);
  const lidChip = outlinedBox(lid,[.75,.11,.75],[0,.12,0],metal(),0xff7768); lidChip.name = 'Sentinel_Processor';
  const diamond = new THREE.Mesh(new THREE.OctahedronGeometry(.24),glow(0xff7768,1.4)); diamond.position.set(0,.43,0); lid.add(diamond);
  const pins=[];
  for(let i=0;i<32;i++){
    const side=Math.floor(i/8), n=i%8, p=-.7+n*.2;
    const pin=new THREE.Mesh(new THREE.BoxGeometry(side%2===0?.085:.25,.05,side%2===0?.25:.085),new THREE.MeshStandardMaterial({color:0xb5aa80,metalness:.85,roughness:.25}));
    pin.position.set(side===1?1:side===3?-1:p,-.55,side===0?1:side===2?-1:p); core.add(pin); pins.push(pin);
  }
  const orbit = new THREE.Group(); orbit.name='Telemetry_Orbit'; root.add(orbit);
  const rings=[];
  for(let i=0;i<7;i++){
    const ring = new THREE.Mesh(new THREE.TorusGeometry(3.13,.012,6,44,TAU/7-.06),glow(palette[i],1.7));
    ring.geometry.getAttribute('position').setUsage(THREE.DynamicDrawUsage);
    ring.geometry.getAttribute('normal').setUsage(THREE.DynamicDrawUsage);
    ring.rotation.z=i*TAU/7; ring.frustumCulled=false; orbit.add(ring); rings.push(ring);
  }
  const guides=new THREE.Group(); guides.name='Orbit_Guides'; orbit.add(guides);
  for(let k=0;k<3;k++){
    const hoop=new THREE.Mesh(new THREE.TorusGeometry(2.85-k*.09,.008,5,150),new THREE.MeshBasicMaterial({color:0x62665a,transparent:true,opacity:.17}));
    guides.add(hoop);
  }
  for(let i=0;i<100;i++){
    const a=i*TAU/100;
    const tick=new THREE.Mesh(new THREE.BoxGeometry(.013,i%5===0?.105:.045,.02),new THREE.MeshBasicMaterial({color:i%5===0?0x898d7d:0x4a4c42}));
    tick.position.set(Math.cos(a)*2.96,Math.sin(a)*2.96,0); tick.rotation.z=a-Math.PI/2; guides.add(tick);
  }
  const gyro=new THREE.Group(); gyro.name='Context_Rings'; root.add(gyro);
  for(let i=0;i<3;i++){
    const hoop = new THREE.Mesh(new THREE.TorusGeometry(1.55+i*.18,.009,6,160),glow(palette[i+3],.65));
    hoop.rotation.set(.7+i*.52,.4+i*.68,.25); gyro.add(hoop);
  }
  const nodes=[], paths=[], packets=[];
  for(let i=0;i<13;i++){
    const a=i*TAU/13+.3, r=2.44;
    const pos=vec(Math.cos(a)*r,Math.sin(a)*r,-.45+Math.sin(a)*.3);
    const node=new THREE.Group(); node.name='Source_'+String(i).padStart(2,'0')+'_'+nodeNames[i]; node.position.copy(pos); node.rotation.set(.3,-.4,a*.13);
    const body=outlinedBox(node,[.3,.32,.32],[0,0,0],metal(),palette[i%7]);
    const port=new THREE.Mesh(new THREE.BoxGeometry(.2,.028,.335),glow(palette[i%7],1.1)); port.position.y=.09; node.add(port);
    for(let j=0;j<3;j++){
      const lamp=new THREE.Mesh(new THREE.BoxGeometry(.024,.024,.035),glow(palette[i%7],1.8)); lamp.position.set(-.075+j*.075,-.07,.17); node.add(lamp);
    }
    orbit.add(node); nodes.push({group:node,port,body,base:pos.clone()});
    const curve = new THREE.QuadraticBezierCurve3(pos.clone(),pos.clone().multiplyScalar(.65).add(vec(0,0,.6)),vec(0,0,0));
    const path=new THREE.Line(new THREE.BufferGeometry().setFromPoints(curve.getPoints(35)),new THREE.LineBasicMaterial({color:palette[i%7],transparent:true,opacity:.15}));
    path.geometry.getAttribute('position').setUsage(THREE.DynamicDrawUsage); path.frustumCulled=false;
    orbit.add(path); paths.push(path);
    const packet=new THREE.Mesh(new THREE.SphereGeometry(.032,6,6),glow(palette[i%7],2));
    orbit.add(packet); packets.push({mesh:packet,curve,offset:i/13});
  }
  const intruder=new THREE.Group(); intruder.name='Illustrative_Threat'; orbit.add(intruder);
  const threat=new THREE.Mesh(new THREE.OctahedronGeometry(.15),glow(0xff5e52,2.5)); intruder.add(threat);
  const threatHalo=new THREE.Mesh(new THREE.TorusGeometry(.23,.009,5,40),glow(0xff5e52,1.5)); intruder.add(threatHalo);
  const shield=new THREE.Mesh(new THREE.IcosahedronGeometry(1.4,2),new THREE.MeshBasicMaterial({color:0x8cdbcd,wireframe:true,transparent:true,opacity:0})); shield.name='Containment_Boundary'; root.add(shield);
  const barsGroup=new THREE.Group(); barsGroup.name='Saliency_Features'; root.add(barsGroup);
  const bars=[];
  for(let i=0;i<7;i++){
    const h=[.96,.72,.59,.45,.32,.22,.13][i];
    const bar=new THREE.Mesh(new THREE.BoxGeometry(.11,h,.11),glow(palette[i],.18)); bar.position.set(-.6+i*.2,h/2+.02,.1); bar.userData.height=h; barsGroup.add(bar); bars.push(bar);
  }
  barsGroup.visible=false;
  const proof=new THREE.Group(); proof.name='Audit_Record'; root.add(proof);
  outlinedBox(proof,[.55,.65,.1],[0,0,0],metal(),0xb3df93);
  for(let i=0;i<4;i++){
    const line=new THREE.Mesh(new THREE.BoxGeometry(.33-i*.04,.025,.01),glow(0xb3df93,1)); line.position.set(-i*.02,.18-i*.12,.06); proof.add(line);
  }
  proof.position.set(1.1,-1.65,.6); proof.visible=false;
  return {root,core,bottom,pins,layers,lid,orbit,rings,guides,gyro,nodes,paths,packets,intruder,shield,barsGroup,bars,proof,diamond};
}

function prepareTransform(target){
  return {
    position:new THREE.Vector3(...target.position),
    quaternion:new THREE.Quaternion().setFromEuler(new THREE.Euler(...target.rotation)),
    scale:new THREE.Vector3(...target.scale),
  };
}
function applyTransform(object,from,to,mix){
  object.position.lerpVectors(from.position,to.position,mix);
  object.quaternion.slerpQuaternions(from.quaternion,to.quaternion,mix);
  object.scale.lerpVectors(from.scale,to.scale,mix);
}
function arcVertices(form,segment){
  const vertices=new Float32Array(7*45*3), arc=(TAU/7-.06)/TAU;
  for(let j=0;j<=6;j++)for(let i=0;i<=44;i++){
    const t=segment/7+i/44*arc,phi=j/6*TAU;
    const p=outlinePoint(form,t,segment),before=outlinePoint(form,t-.0001,segment),after=outlinePoint(form,t+.0001,segment);
    const dx=after[0]-before[0],dy=after[1]-before[1],length=Math.hypot(dx,dy)||1;
    const n=(j*45+i)*3;
    vertices[n]=p[0]-dy/length*Math.cos(phi)*.014;
    vertices[n+1]=p[1]+dx/length*Math.cos(phi)*.014;
    vertices[n+2]=p[2]+Math.sin(phi)*.014;
  }
  return vertices;
}

export async function createScene(mount, {reducedMotion=false,modelUrl=null,onComponents=null,onChapter=null,onProgress=null}={}) {
  const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5));
  renderer.setClearColor(0x232321,0);
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.12;
  const framing=document.createElement('div');
  framing.className='scene-framing';framing.setAttribute('aria-hidden','true');
  mount.append(framing,renderer.domElement);
  const scene=new THREE.Scene();
  const camera=new THREE.PerspectiveCamera(37,1,.1,60);
  camera.position.set(0,1.25,10.8); camera.lookAt(0,0,0);
  scene.add(new THREE.HemisphereLight(0xf4efdc,0x161b20,2));
  const key=new THREE.DirectionalLight(0xffead8,4); key.position.set(4,5,6); scene.add(key);
  const rim=new THREE.DirectionalLight(0x8cdbcd,3); rim.position.set(-4,-1,2); scene.add(rim);
  const point=new THREE.PointLight(0xff7768,9,12); point.position.set(0,1,2); scene.add(point);
  const model=createSentinelModel(); scene.add(model.root); model.core.rotation.set(.32,.6,.13);
  const composer=new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene,camera));
  const bloom=new UnrealBloomPass(new THREE.Vector2(1,1),.45,.6,1.15); composer.addPass(bloom);
  composer.addPass(new OutputPass());

  let importedCore=null;
  if(modelUrl){
    try{
      const gltf=await new GLTFLoader().loadAsync(modelUrl);
      importedCore=gltf.scene; importedCore.name='Blender_Sentinel_Core';
      const box=new THREE.Box3().setFromObject(importedCore);
      const size=box.getSize(new THREE.Vector3()), center=box.getCenter(new THREE.Vector3());
      const max=Math.max(size.x,size.y,size.z);
      if(max>0){importedCore.scale.setScalar(2.1/max); importedCore.position.copy(center).multiplyScalar(-2.1/max);}
      model.core.visible=false; model.root.add(importedCore);
    }catch(error){console.warn('Blender model unavailable; using the procedural Sentinel model.',error.message);}
  }

  const targets=forms.map((form,i)=>({
    core:prepareTransform(form.core),base:prepareTransform(form.base),lid:prepareTransform(form.lid),
    layers:form.layers.map(prepareTransform),nodes:Array.from({length:13},(_,n)=>new THREE.Vector3(...nodePosition(i,n))),
    arcs:Array.from({length:7},(_,segment)=>arcVertices(i,segment)),
  }));
  // Track the actual morphing arc vertices nearest each final arrow tip.
  const downloadAnchors=[[-3,.42,0],[3,.42,0],[0,-2.9,0]].map(tip=>{
    let nearest={ring:0,vertex:0},distance=Infinity;
    targets[9].arcs.forEach((vertices,ring)=>{
      for(let vertex=0;vertex<vertices.length/3;vertex++){
        const offset=vertex*3,d=(vertices[offset]-tip[0])**2+(vertices[offset+1]-tip[1])**2+(vertices[offset+2]-tip[2])**2;
        if(d<distance){distance=d;nearest={ring,vertex};}
      }
    });
    return nearest;
  });
  const arcColors=palette.map(color=>new THREE.Color(color));
  const arrowColors=[0xb3df93,0xc0b5ff,0xff7768].map(color=>new THREE.Color(color));
  const pose={form:0,turn:0,tilt:0,alert:0,saliency:0,shield:0,proof:0,scale:1,context:0,cameraY:1.25};
  const timeline=createTimeline({autoplay:false,defaults:{duration:1000,ease:'inOutSine'}});
  const poses=[
    {form:0,turn:.1,tilt:0,alert:0,saliency:0,shield:0,proof:0,scale:1,context:0,cameraY:1.25},
    {form:1,turn:.32,tilt:0,alert:0,saliency:0,shield:0,proof:0,scale:1,context:.25,cameraY:.8},
    {form:2,turn:.65,tilt:-.03,alert:1,saliency:0,shield:0,proof:0,scale:1,context:.35,cameraY:.8},
    {form:3,turn:1.22,tilt:0,alert:.3,saliency:0,shield:0,proof:0,scale:.95,context:1,cameraY:1.1},
    {form:4,turn:1.65,tilt:0,alert:0,saliency:1,shield:0,proof:0,scale:1,context:.65,cameraY:.4},
    {form:5,turn:2.25,tilt:0,alert:.65,saliency:0,shield:1,proof:0,scale:1,context:.35,cameraY:.5},
    {form:6,turn:2.85,tilt:0,alert:0,saliency:0,shield:0,proof:1,scale:1,context:.2,cameraY:.4},
    {form:7,turn:3.25,tilt:0,alert:0,saliency:0,shield:0,proof:0,scale:.95,context:.6,cameraY:1.1},
    {form:8,turn:3.6,tilt:0,alert:0,saliency:0,shield:0,proof:0,scale:1,context:0,cameraY:1.25},
    {form:9,turn:0,tilt:0,alert:0,saliency:0,shield:0,proof:0,scale:1,context:0,cameraY:.4},
  ];
  Object.assign(pose,poses[0]);
  for(let i=1;i<poses.length;i++) timeline.add(pose,poses[i],(i-1)*1000);
  let progress=0,displayProgress=0,snapshot=0,hasProgress=false,lastChapter=-1,paused=reducedMotion,visible=true,exploring=false,rotation=0,exploded=false,lastTime=0,time=0,disposed=false,lastMorph=-1,frameScale=1;
  const scratch=new THREE.Vector3();
  const labelPoint=new THREE.Vector3(),componentPoints={};
  let renderWidth=0,renderHeight=0;
  function projectComponents(){
    if(!onComponents)return;
    for(const component of modelComponents){
      const [kind,index]=component.anchor.split(':');
      let object;
      labelPoint.set(0,0,0);
      if(kind==='layer'){object=model.layers[Number(index)];labelPoint.set(.65,.08,.35);}
      else if(kind==='node')object=model.nodes[Number(index)].group;
      else if(kind==='path'){object=model.orbit;model.packets[Number(index)].curve.getPoint(.5,labelPoint);}
      else if(kind==='packet')object=model.packets[Number(index)].mesh;
      else if(kind==='orbit'){object=model.rings[1];labelPoint.fromBufferAttribute(object.geometry.getAttribute('position'),22);}
      else if(kind==='gyro'){object=model.gyro.children[0];labelPoint.set(1.55,0,0);}
      else if(kind==='saliency'){object=model.bars[0];labelPoint.set(0,.48,0);}
      else if(kind==='shield'){object=model.shield;labelPoint.set(1.1,0,0);}
      else object=({core:importedCore||model.core,base:model.bottom,lid:model.lid,beacon:model.diamond,pins:model.pins[18],threat:model.intruder,evidence:model.proof})[kind];
      let visible=Boolean(object);
      for(let parent=object;parent;parent=parent.parent)if(!parent.visible)visible=false;
      if(kind==='shield')visible=visible&&object.material.opacity>.03;
      if(object)object.localToWorld(labelPoint);
      labelPoint.project(camera);
      const point=componentPoints[component.id]??(componentPoints[component.id]={});
      point.x=(labelPoint.x*.5+.5)*renderWidth;point.y=(-labelPoint.y*.5+.5)*renderHeight;
      point.visible=visible;point.inFrame=labelPoint.z>=-1&&labelPoint.z<=1&&point.x>=0&&point.x<=renderWidth&&point.y>=70&&point.y<=renderHeight;
    }
    downloadAnchors.forEach((anchor,i)=>{
      const ring=model.rings[anchor.ring];
      labelPoint.fromBufferAttribute(ring.geometry.getAttribute('position'),anchor.vertex);
      ring.localToWorld(labelPoint);labelPoint.project(camera);
      const id=['download-host','download-client','download-dashboard'][i];
      const point=componentPoints[id]??(componentPoints[id]={});
      point.x=(labelPoint.x*.5+.5)*renderWidth;point.y=(-labelPoint.y*.5+.5)*renderHeight;
      point.visible=!exploring;point.inFrame=labelPoint.z>=-1&&labelPoint.z<=1&&point.x>=0&&point.x<=renderWidth&&point.y>=70&&point.y<=renderHeight;
    });
    onComponents({points:componentPoints,width:renderWidth,height:renderHeight});
  }
  const incidentPulse={value:0},containPulse={value:0};
  let incidentActive=false,containActive=false;
  const transientAnimations=new Set();
  function pulse(target,onComplete,duration){
    const a=animate(target,{value:[0,1],duration:paused?1:duration,ease:'inOut(2)',onRender:requestDraw,onComplete});
    transientAnimations.add(a); a.then(()=>transientAnimations.delete(a)); requestDraw();
  }
  function draw(){
    if(disposed)return;
    const idle=paused?0:Math.sin(time*.35)*.04;
    model.root.rotation.y=(exploring?0:pose.turn*.025)+rotation;
    model.root.rotation.z=pose.tilt+idle;
    model.root.scale.setScalar(exploring?1:pose.scale);
    const form=exploring?0:pose.form;
    const {from,to,mix}=morphSegment(form),a=targets[from],b=targets[to];
    const lerp=(key)=>THREE.MathUtils.lerp(forms[from][key],forms[to][key],mix);
    applyTransform(model.core,a.core,b.core,mix);
    applyTransform(model.bottom,a.base,b.base,mix);
    applyTransform(model.lid,a.lid,b.lid,mix);
    model.layers.forEach((layer,i)=>{
      applyTransform(layer,a.layers[i],b.layers[i],mix);
      if(exploring&&exploded)layer.position.y+=(i-1.5)*.5;
    });
    if(exploring&&exploded)model.lid.position.y+=1.1;
    // Buffer geometry and packet curves only change when the scroll pose changes.
    if(form!==lastMorph){
      model.nodes.forEach((node,i)=>{
        node.group.position.lerpVectors(a.nodes[i],b.nodes[i],mix);
        node.group.scale.setScalar(lerp('nodeScale'));
        node.group.rotation.set(.2,-.25,THREE.MathUtils.lerp(from===2?i*.25:0,to===2?i*.25:0,mix));
        const curve=model.packets[i].curve;
        curve.v0.copy(node.group.position);
        curve.v1.copy(curve.v0).multiplyScalar(.55); curve.v1.z+=.65;
        curve.v2.set(0,THREE.MathUtils.lerp(from===7?(i<4?-1.6:i<9?-.05:1.6):0,to===7?(i<4?-1.6:i<9?-.05:1.6):0,mix),0);
        const points=model.paths[i].geometry.getAttribute('position');
        for(let n=0;n<points.count;n++){curve.getPoint(n/(points.count-1),scratch);points.setXYZ(n,scratch.x,scratch.y,scratch.z);}
        points.needsUpdate=true;
      });
      model.rings.forEach((ring,i)=>{
        ring.rotation.set(0,0,0);
        const arrowColor=arrowColors[i<2?0:i<4?1:2],arrowMix=THREE.MathUtils.clamp(form-8,0,1);
        ring.material.color.copy(arcColors[i]).lerp(arrowColor,arrowMix);
        ring.material.emissive.copy(ring.material.color);
        const positions=ring.geometry.getAttribute('position'),start=a.arcs[i],end=b.arcs[i];
        for(let n=0;n<positions.array.length;n++)positions.array[n]=THREE.MathUtils.lerp(start[n],end[n],mix);
        positions.needsUpdate=true;
        ring.geometry.computeVertexNormals();
      });
      lastMorph=form;
      mount.dataset.morph=form.toFixed(3);
    }
    model.orbit.rotation.z=0;
    model.guides.visible=lerp('guides')>.01; model.guides.scale.setScalar(Math.max(.001,lerp('guides')));
    model.pins.forEach(pin=>{pin.visible=form<.02||(form>7.98&&form<8.5);});
    model.gyro.rotation.set(.15+pose.context*.2,pose.turn*.3+(paused?0:time*.035),.15);
    model.gyro.visible=lerp('gyro')>.01;model.gyro.scale.setScalar(Math.max(.001,lerp('gyro')));
    model.barsGroup.visible=!exploring&&pose.saliency>.01;
    model.barsGroup.position.set(0,-1.5,.8);
    model.barsGroup.scale.set(3.2,Math.max(.001,pose.saliency*2.7),2);
    const alert=exploring?0:incidentActive?1:pose.alert;
    const contained=exploring?0:containActive?containPulse.value:pose.shield;
    model.intruder.visible=alert>.02;
    const incoming=incidentActive?incidentPulse.value:paused?.65:(time*.22)%1;
    model.packets[4].curve.getPoint(contained>.5?Math.min(incoming,.58):incoming,model.intruder.position);
    model.intruder.scale.setScalar(.5+alert*.8);
    model.intruder.rotation.z=paused?0:time;
    model.nodes[4].port.material.emissive.setHex(alert>.5?0xff5e52:palette[4]);
    model.paths[4].material.color.setHex(alert>.5?0xff5e52:palette[4]);
    model.paths[4].material.opacity=.15+alert*.5;
    model.shield.material.opacity=contained*.22;
    model.shield.scale.set(1.7,1.95,.45);
    model.shield.rotation.y=paused?0:time*.04;
    model.proof.visible=!exploring&&pose.proof>.01;
    model.proof.position.set(1.9,-1.15,.8);
    model.proof.scale.setScalar(Math.max(.001,pose.proof*1.35));
    model.proof.rotation.y=pose.turn*.25;
    model.diamond.rotation.y=paused?0:time*.3;
    for(const packet of model.packets){
      const p=paused?packet.offset:(time*.13+packet.offset)%1;
      packet.curve.getPoint(p,packet.mesh.position); packet.mesh.visible=!exploring;
    }
    if(importedCore){importedCore.position.y=Math.sin(form*Math.PI)*.4;importedCore.rotation.y=pose.turn*.2;}
    camera.position.y=(exploring?1.25:pose.cameraY)*frameScale;camera.lookAt(0,0,0);
    composer.render();
    const chapter=Math.min(forms.length-1,Math.round(displayProgress));
    if(chapter!==lastChapter){lastChapter=chapter;onChapter?.(chapter);}
    onProgress?.(displayProgress);
    projectComponents();
  }
  function requestDraw(){ if(paused||!visible||document.hidden) draw(); }
  function refreshLoop(){
    const run=!paused&&visible&&!document.hidden&&!disposed;
    lastTime=0;
    renderer.setAnimationLoop(run?(stamp)=>{
      const delta=lastTime?Math.min((stamp-lastTime)/1000,.1):1/60;
      time+=Math.min(delta,.05);lastTime=stamp;
      // Follow real reading position with a short, frame-rate-independent settle.
      const distance=progress-displayProgress;
      displayProgress=Math.abs(distance)<.0005?progress:displayProgress+distance*(1-Math.exp(-delta/.085));
      timeline.seek(displayProgress*1000);draw();
    }:null);
    if(!disposed) draw();
  }
  function resize(){
    const {width,height}=mount.getBoundingClientRect();
    if(!width||!height)return;
    renderWidth=width;renderHeight=height;
    camera.aspect=width/height;
    // Fill the viewport with the canvas while preserving the model's visual size.
    const band=framing.getBoundingClientRect();
    frameScale=height/band.height;
    camera.position.z=3.7*height/(Math.tan(THREE.MathUtils.degToRad(camera.fov/2))*Math.min(band.width,band.height));
    camera.far=Math.max(60,camera.position.z+15);
    camera.updateProjectionMatrix();
    renderer.setSize(width,height,false); composer.setSize(width,height); draw();
  }
  const ro=new ResizeObserver(resize); ro.observe(mount);
  const onVisibility=()=>refreshLoop(); document.addEventListener('visibilitychange',onVisibility);
  const contextLost=(event)=>{event.preventDefault(); renderer.setAnimationLoop(null); mount.dispatchEvent(new CustomEvent('scene-error',{bubbles:true}));};
  renderer.domElement.addEventListener('webglcontextlost',contextLost);
  resize();refreshLoop();
  return {
    setProgress(value,chapter=Math.round(value)){progress=THREE.MathUtils.clamp(value,0,forms.length-1);snapshot=chapter;if(Math.abs(progress-2)>.65)incidentActive=false;if(Math.abs(progress-5)>.65)containActive=false;if(paused||!hasProgress){displayProgress=paused?snapshot:progress;timeline.seek(displayProgress*1000);}hasProgress=true;requestDraw();},
    setPaused(value){paused=value;if(value){displayProgress=snapshot;timeline.seek(displayProgress*1000);}for(const a of transientAnimations){value?a.pause():a.resume();}refreshLoop();},
    setVisible(value){if(visible===value)return;visible=value;refreshLoop();},
    replayIncident(){incidentActive=true;pulse(incidentPulse,()=>{incidentActive=false;requestDraw();},2200);},
    contain(){containActive=true;pulse(containPulse,()=>requestDraw(),1100);},
    explore(value){exploring=value;draw();},
    rotate(direction){rotation+=direction*Math.PI/6;draw();},
    explode(value){exploded=value;draw();},
    reset(){rotation=0;exploded=false;draw();},
    async exportModel(){return new GLTFExporter().parseAsync(model.root,{binary:true,onlyVisible:true});},
    dispose(){
      disposed=true;renderer.setAnimationLoop(null);timeline.revert();for(const a of transientAnimations)a.revert();
      ro.disconnect();document.removeEventListener('visibilitychange',onVisibility);renderer.domElement.removeEventListener('webglcontextlost',contextLost);
      scene.traverse(obj=>{obj.geometry?.dispose();if(obj.material){const mats=Array.isArray(obj.material)?obj.material:[obj.material];mats.forEach(m=>m.dispose());}});
      composer.dispose();renderer.dispose();renderer.domElement.remove();framing.remove();
    },
  };
}
