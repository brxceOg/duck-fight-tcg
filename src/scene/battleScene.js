import * as THREE from "three";

export function mountBattleScene(host){
  if(!host||host.dataset.duck3d==="ready")return host?.duck3dApi||null;
  host.dataset.duck3d="loading";
  let renderer,scene,camera,observer,raf=0,alive=true;
  const live=new Map(),motions=[];let onCardTap=()=>{};const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();
  const reduced=window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches||false;
  const cardW=1.15,cardL=1.52;
  try{
    scene=new THREE.Scene();
    camera=new THREE.PerspectiveCamera(43,1,.1,50);
    camera.position.set(0,7.2,7.5);camera.lookAt(0,0,0);
    renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:"low-power"});
    renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5));
    renderer.setClearColor(0x000000,0);
    renderer.domElement.className="battle-3d-canvas";
    renderer.domElement.setAttribute("aria-label","3D battle cards; tap a card to select or attack");renderer.domElement.style.touchAction="none";
    host.prepend(renderer.domElement);
    scene.add(new THREE.HemisphereLight(0xffffff,0x26364d,2));
    const key=new THREE.DirectionalLight(0xffffff,2.2);key.position.set(-3,8,5);scene.add(key);
    const rim=new THREE.PointLight(0x63e7df,1.1,12);rim.position.set(0,3,-3);scene.add(rim);
    const resize=()=>{if(!alive)return;const w=Math.max(host.clientWidth,1),h=Math.max(host.clientHeight,1);camera.aspect=w/h;camera.fov=w/h<.85?48:43;camera.position.z=w/h<.85?9.4:8.4;camera.updateProjectionMatrix();renderer.setSize(w,h,false)};
    if(typeof ResizeObserver!=="undefined"){observer=new ResizeObserver(resize);observer.observe(host)}else window.addEventListener("resize",resize);
    resize();
    const makeTexture=(card)=>{
      const canvas=document.createElement("canvas");canvas.width=512;canvas.height=700;
      const ctx=canvas.getContext("2d");
      if(card?.front){
        const tex=new THREE.TextureLoader().load(new URL(card.front,document.baseURI).href);
        tex.colorSpace=THREE.SRGBColorSpace;return tex;
      }
      const grad=ctx.createLinearGradient(0,0,512,700);grad.addColorStop(0,"#16a4a5");grad.addColorStop(1,"#ffd45f");
      ctx.fillStyle=grad;ctx.fillRect(0,0,512,700);ctx.strokeStyle="#fff";ctx.lineWidth=18;ctx.strokeRect(12,12,488,676);
      ctx.textAlign="center";ctx.fillStyle="#fff";ctx.font="240px sans-serif";ctx.fillText(card?.emoji||"🦆",256,390);
      ctx.font="bold 42px sans-serif";ctx.fillText((card?.name||"Rubber Duck").slice(0,22),256,570);
      ctx.font="bold 30px sans-serif";ctx.fillText("⚔ "+(card?.attack||1)+"    ♥ "+(card?.health||1),256,630);
      const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;return tex;
    };
    const positionFor=(side,index)=>({x:((index%3)-1)*1.42,z:(side==="player"?1:-1)*(1.65+Math.floor(index/3)*1.7)});
    const slotGeometry=new THREE.PlaneGeometry(1.28,1.68);
    const slotFill=new THREE.MeshBasicMaterial({color:0xb8fff4,transparent:true,opacity:.075,depthWrite:false,side:THREE.DoubleSide});
    const slotLine=new THREE.LineBasicMaterial({color:0xc8fff8,transparent:true,opacity:.24,depthWrite:false});
    for(const side of ["player","enemy"]){
      for(let i=0;i<6;i++){
        const p=positionFor(side,i);
        const group=new THREE.Group();group.position.set(p.x,.025,p.z);group.rotation.x=-Math.PI/2;
        const fill=new THREE.Mesh(slotGeometry,slotFill);fill.renderOrder=1;group.add(fill);
        const outline=new THREE.LineSegments(new THREE.EdgesGeometry(slotGeometry),slotLine);outline.renderOrder=2;group.add(outline);
        scene.add(group);
      }
    }
    const removeUnit=(unit)=>{
      const a=live.get(unit);if(!a)return;
      scene.remove(a.mesh);a.mesh.geometry.dispose();a.mesh.material.forEach(m=>m.dispose());a.tex.dispose();live.delete(unit);
    };
    const createUnit=(unit,side,index,count)=>{
      const tex=makeTexture(unit);
      const edge=new THREE.MeshStandardMaterial({color:side==="enemy"?0x6a315d:0x146c75,roughness:.4,metalness:.2});
      const face=new THREE.MeshStandardMaterial({map:tex,roughness:.48,metalness:.04});
      const mesh=new THREE.Mesh(new THREE.BoxGeometry(cardW,.075,cardL),[edge,edge,face,edge,edge,edge]);
      const pos=positionFor(side,index);
      mesh.position.set(pos.x,1.05,side==="player"?3.7:-3.7);
      mesh.rotation.set(Math.PI/2,side==="enemy"?Math.PI:0,side==="enemy"?-.12:.12);
      scene.add(mesh);
      mesh.userData.duckCard={side,index};
      const record={mesh,tex,side,index,selected:false,lift:0,fromTime:performance.now(),duration:reduced?1:720,startX:pos.x,startZ:side==="player"?3.7:-3.7,targetX:pos.x,targetZ:pos.z,kind:"place"};
      live.set(unit,record);
      motions.push(record);
    };
    const api={
      syncBoard(playerBoard=[],enemyBoard=[]){
        const present=new Set([...playerBoard,...enemyBoard]);
        for(const unit of [...live.keys()])if(!present.has(unit))removeUnit(unit);
        for(const [side,board] of [["player",playerBoard],["enemy",enemyBoard]]){
          board.forEach((unit,index)=>{
            let a=live.get(unit);
            if(!a){createUnit(unit,side,index,board.length);a=live.get(unit)}
            a.side=side;a.index=index;a.mesh.userData.duckCard={side,index};
            const p=positionFor(side,index);
            a.targetX=p.x;a.targetZ=p.z;
            if(a.kind!=="place"){a.mesh.position.x=p.x;a.mesh.position.z=p.z}
          });
        }
      },
      selectUnit(index=null){
        for(const a of live.values())a.selected=a.side==="player"&&a.index===index;
      },
      setCardTapHandler(handler){onCardTap=typeof handler==="function"?handler:()=>{};},
      attack(side="player",index=0,targetIndex=0){
        const board=[...live.entries()].filter(([,a])=>a.side===side).sort((x,y)=>x[1].index-y[1].index);
        const targetBoard=[...live.entries()].filter(([,a])=>a.side!==(side)).sort((x,y)=>x[1].index-y[1].index);
        const attacker=board[index]?.[1],target=targetBoard[targetIndex]?.[1];
        if(!attacker)return;
        const from=attacker.mesh.position.clone(),to=target?target.mesh.position.clone():new THREE.Vector3(from.x,.3,side==="player"?-2.35:2.35);
        motions.push({kind:"lunge",mesh:attacker.mesh,from,to,fromTime:performance.now(),duration:reduced?100:430});
      }
    };
    const onCardPointerDown=e=>{
      if(!alive||e.isPrimary===false||e.button!==0)return;
      const rect=renderer.domElement.getBoundingClientRect();
      if(!rect.width||!rect.height)return;
      pointer.set(((e.clientX-rect.left)/rect.width)*2-1,-((e.clientY-rect.top)/rect.height)*2+1);
      raycaster.setFromCamera(pointer,camera);
      const hits=raycaster.intersectObjects([...live.values()].map(a=>a.mesh),false);
      const card=hits[0]?.object?.userData?.duckCard;
      if(!card)return;
      e.preventDefault();
      onCardTap(card.side,card.index);
    };
    renderer.domElement.addEventListener("pointerdown",onCardPointerDown,{passive:false});
    host.duck3dApi=api;host.dataset.duck3d="ready";
    const render=(now)=>{
      if(!alive)return;
      for(let i=motions.length-1;i>=0;i--){
        const a=motions[i],p=Math.min(1,(now-a.fromTime)/a.duration),ease=1-Math.pow(1-p,3);
        if(a.kind==="place"){
          a.mesh.position.x=a.startX+(a.targetX-a.startX)*ease;
          a.mesh.position.z=a.startZ+(a.targetZ-a.startZ)*ease;
          a.mesh.position.y=.12+Math.sin(p*Math.PI)*.72;
          a.mesh.rotation.x=(Math.PI/2)*(1-ease);
          a.mesh.rotation.z=(a.side==="enemy"?-.12:.12)*(1-ease);
          if(p>=1){a.mesh.position.set(a.targetX,.11,a.targetZ);a.mesh.rotation.set(0,a.side==="enemy"?Math.PI:0,0);a.kind="rest";motions.splice(i,1)}
        }else if(a.kind==="lunge"){
          a.mesh.position.lerpVectors(a.from,a.to,Math.sin(p*Math.PI)*.72);
          a.mesh.position.y=.11+Math.sin(p*Math.PI)*.55;
          if(p>=1){a.mesh.position.copy(a.from);motions.splice(i,1)}
        }
      }
      for(const a of live.values()){
        if(a.kind!=="place"&&a.kind!=="lunge"){
          const liftTarget=a.selected?.42:0;
          a.lift+=(liftTarget-a.lift)*.12;
          const bob=a.selected?Math.sin(now*.0027+a.index*.65)*.045:0;
          a.mesh.position.y=.11+a.lift+bob;
        }
      }
      renderer.render(scene,camera);raf=requestAnimationFrame(render);
    };
    raf=requestAnimationFrame(render);
    host.addEventListener("duck3d-dispose",()=>{alive=false;cancelAnimationFrame(raf);observer?.disconnect();for(const unit of [...live.keys()])removeUnit(unit);renderer.domElement.removeEventListener("pointerdown",onCardPointerDown);renderer.dispose();renderer.domElement.remove()},{once:true});
    return api;
  }catch(err){host.dataset.duck3d="failed";renderer?.dispose();renderer?.domElement.remove();console.warn("3D battle layer unavailable; 2D battle remains active",err);return null}
}
