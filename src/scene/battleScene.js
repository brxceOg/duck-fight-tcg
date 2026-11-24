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
    // Separate cosmetic mats for each side; each extends beyond all six card slots.
    // Keep each mat self-contained so future cosmetic unlocks can swap its materials/textures.
    const createCardMat=(side)=>{
      const isPlayer=side==="player";
      const mat=new THREE.Group();
      mat.position.set(0,0,isPlayer?2.5:-2.5);
      const base=new THREE.Mesh(
        new THREE.BoxGeometry(4.5,.065,3.82),
        new THREE.MeshStandardMaterial({color:isPlayer?0x102936:0x25213d,roughness:.78,metalness:.18})
      );
      base.position.y=-.0375;mat.add(base);
      const top=new THREE.Mesh(
        new THREE.PlaneGeometry(4.42,3.73),
        new THREE.MeshStandardMaterial({color:isPlayer?0x183b48:0x342b50,roughness:.92,metalness:.04})
      );
      top.rotation.x=-Math.PI/2;top.position.y=-.003;mat.add(top);
      const trimMaterial=new THREE.MeshStandardMaterial({color:isPlayer?0xd6aa52:0x9e8bd5,roughness:.38,metalness:.68,emissive:isPlayer?0x38200a:0x21133d,emissiveIntensity:.16});
      const trim=new THREE.Group();
      const trimLong=new THREE.BoxGeometry(4.4,.018,.035);
      const trimShort=new THREE.BoxGeometry(.035,.018,3.72);
      for(const z of [-1.86,1.86]){const edge=new THREE.Mesh(trimLong,trimMaterial);edge.position.set(0,.012,z);trim.add(edge)}
      for(const x of [-2.2,2.2]){const edge=new THREE.Mesh(trimShort,trimMaterial);edge.position.set(x,.012,0);trim.add(edge)}
      mat.add(trim);
      scene.add(mat);
      return mat;
    };
    const playerMat=createCardMat("player");
    const enemyMat=createCardMat("enemy");
    // Compact 3D pawn emblems mark the head of each player's mat.
    const createPawn=(side)=>{
      const isPlayer=side==="player";
      const pawn=new THREE.Group();
      pawn.position.set(0,.005,isPlayer?4.78:-4.78);
      const metal=new THREE.MeshStandardMaterial({
        color:isPlayer?0xe5bd69:0xb8a9e8,
        metalness:.78,roughness:.24,
        emissive:isPlayer?0x50300b:0x30204f,emissiveIntensity:.2
      });
      const dark=new THREE.MeshStandardMaterial({color:isPlayer?0x263b43:0x302a49,metalness:.72,roughness:.3});
      const foot=new THREE.Mesh(new THREE.CylinderGeometry(.265,.29,.075,32),dark);
      foot.position.y=.045;pawn.add(foot);
      const profile=[
        new THREE.Vector2(0,0),new THREE.Vector2(.19,0.025),
        new THREE.Vector2(.245,.075),new THREE.Vector2(.235,.12),
        new THREE.Vector2(.16,.17),new THREE.Vector2(.115,.27),
        new THREE.Vector2(.105,.39),new THREE.Vector2(.17,.49),
        new THREE.Vector2(.19,.55),new THREE.Vector2(.15,.59),
        new THREE.Vector2(0,.59)
      ];
      const body=new THREE.Mesh(new THREE.LatheGeometry(profile,32),metal);
      body.position.y=.085;pawn.add(body);
      const collar=new THREE.Mesh(new THREE.TorusGeometry(.125,.025,8,28),dark);
      collar.rotation.x=Math.PI/2;collar.position.y=.39;pawn.add(collar);
      const head=new THREE.Mesh(new THREE.SphereGeometry(.19,28,20),metal);
      head.position.y=.76;pawn.add(head);
      const crown=new THREE.Mesh(new THREE.SphereGeometry(.045,16,12),dark);
      crown.position.y=.925;pawn.add(crown);
      scene.add(pawn);
      return pawn;
    };
    const playerPawn=createPawn("player");
    const enemyPawn=createPawn("enemy");
    // Pawn-centered red crosshair reticle and generous invisible touch target.
    // The reticle faces the camera so its dot and crosshair stay crisp on mobile.
    const pawnTarget=new THREE.Group();
    pawnTarget.position.set(0,.62,enemyPawn.position.z);
    const targetMaterial=new THREE.MeshBasicMaterial({color:0xff3030,depthTest:false,transparent:true});
    const targetDot=new THREE.Mesh(new THREE.SphereGeometry(.085,20,16),targetMaterial);
    targetDot.position.z=.035;targetDot.renderOrder=12;pawnTarget.add(targetDot);
    const targetRing=new THREE.Mesh(
      new THREE.TorusGeometry(.29,.022,8,40),
      new THREE.MeshBasicMaterial({color:0xff3030,depthTest:false})
    );
    targetRing.renderOrder=11;pawnTarget.add(targetRing);
    const addCrosshairBar=(x,y,w,h)=>{
      const bar=new THREE.Mesh(
        new THREE.BoxGeometry(w,h,.018),
        new THREE.MeshBasicMaterial({color:0xff3030,depthTest:false})
      );
      bar.position.set(x,y,.018);bar.renderOrder=11;pawnTarget.add(bar);
    };
    addCrosshairBar(0,.405,.105,.025);
    addCrosshairBar(0,-.405,.105,.025);
    addCrosshairBar(-.405,0,.025,.105);
    addCrosshairBar(.405,0,.025,.105);
    const targetHit=new THREE.Mesh(
      new THREE.SphereGeometry(.48,20,16),
      new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false})
    );
    targetHit.userData.duckPawnTarget=true;pawnTarget.add(targetHit);
    pawnTarget.visible=false;scene.add(pawnTarget);

    // Raised center rail separates the rival mats without obstructing card slots.
    const divider=new THREE.Group();
    divider.position.set(0,.045,0);
    const railBase=new THREE.Mesh(
      new THREE.BoxGeometry(4.95,.075,.18),
      new THREE.MeshStandardMaterial({color:0x102c3a,roughness:.32,metalness:.72})
    );
    divider.add(railBase);
    const railGold=new THREE.Mesh(
      new THREE.BoxGeometry(4.72,.018,.035),
      new THREE.MeshStandardMaterial({color:0xffd45f,emissive:0x8a5617,emissiveIntensity:.55,metalness:.65,roughness:.3})
    );
    railGold.position.set(0,.048,-.052);divider.add(railGold);
    const railAqua=new THREE.Mesh(
      new THREE.BoxGeometry(4.72,.018,.035),
      new THREE.MeshStandardMaterial({color:0x63e7df,emissive:0x126e78,emissiveIntensity:.6,metalness:.55,roughness:.3})
    );
    railAqua.position.set(0,.048,.052);divider.add(railAqua);
    const crest=new THREE.Mesh(
      new THREE.CylinderGeometry(.245,.245,.075,40),
      new THREE.MeshStandardMaterial({color:0x252342,metalness:.72,roughness:.28})
    );
    crest.position.y=.065;divider.add(crest);
    const crestRing=new THREE.Mesh(
      new THREE.TorusGeometry(.205,.018,8,40),
      new THREE.MeshStandardMaterial({color:0xffd45f,emissive:0x8a5617,emissiveIntensity:.5,metalness:.7,roughness:.25})
    );
    crestRing.rotation.x=Math.PI/2;crestRing.position.y=.108;divider.add(crestRing);
    const emblem=document.createElement("canvas");emblem.width=128;emblem.height=128;
    const ec=emblem.getContext("2d");ec.clearRect(0,0,128,128);ec.fillStyle="#fff4c5";
    ec.font="900 48px Nunito, sans-serif";ec.textAlign="center";ec.textBaseline="middle";ec.fillText("VS",64,66);
    const emblemTexture=new THREE.CanvasTexture(emblem);
    const emblemMesh=new THREE.Mesh(new THREE.PlaneGeometry(.31,.31),new THREE.MeshBasicMaterial({map:emblemTexture,transparent:true,depthWrite:false}));
    emblemMesh.rotation.x=-Math.PI/2;emblemMesh.position.y=.11;divider.add(emblemMesh);
    scene.add(divider);
    const resize=()=>{if(!alive)return;const w=Math.max(host.clientWidth,1),h=Math.max(host.clientHeight,1);camera.aspect=w/h;camera.fov=w/h<.85?48:43;camera.position.z=w/h<.85?9.4:8.4;camera.updateProjectionMatrix();renderer.setSize(w,h,false)};
    if(typeof ResizeObserver!=="undefined"){observer=new ResizeObserver(resize);observer.observe(host)}else window.addEventListener("resize",resize);
    resize();
    const cardBackTexture=new THREE.TextureLoader().load(new URL("./IMG_1418.jpeg",document.baseURI).href);
    cardBackTexture.colorSpace=THREE.SRGBColorSpace;
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
      const back=new THREE.MeshStandardMaterial({map:cardBackTexture,roughness:.48,metalness:.04});
      // BoxGeometry material order: +X, -X, +Y (front), -Y (card back), +Z, -Z.
      const mesh=new THREE.Mesh(new THREE.BoxGeometry(cardW,.075,cardL),[edge,edge,face,back,edge,edge]);
      const pos=positionFor(side,index);
      mesh.position.set(pos.x,1.05,side==="player"?3.7:-3.7);
      mesh.rotation.set(-Math.PI/2,side==="enemy"?Math.PI:0,side==="enemy"?-.12:.12);
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
      setPawnTargetable(enabled=false){pawnTarget.visible=!!enabled;},
      setCardTapHandler(handler){onCardTap=typeof handler==="function"?handler:()=>{};},
      attackDirect(side="player",index=0){
        const attacker=[...live.values()].find(a=>a.side===side&&a.index===index);
        if(!attacker)return;
        const from=attacker.mesh.position.clone();
        const pawn=side==="player"?enemyPawn:playerPawn;
        const to=pawn.position.clone();to.y=.72;
        motions.push({kind:"lunge",mesh:attacker.mesh,from,to,fromTime:performance.now(),duration:reduced?100:520});
      },
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
      const targets=pawnTarget.visible?raycaster.intersectObjects([targetHit],false):[];
      if(targets.length){e.preventDefault();onCardTap("enemy-pawn",0);return}
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
          a.mesh.rotation.x=(-Math.PI/2)*(1-ease);
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
      if(pawnTarget.visible)pawnTarget.quaternion.copy(camera.quaternion);
      renderer.render(scene,camera);raf=requestAnimationFrame(render);
    };
    raf=requestAnimationFrame(render);
    host.addEventListener("duck3d-dispose",()=>{alive=false;cancelAnimationFrame(raf);observer?.disconnect();for(const unit of [...live.keys()])removeUnit(unit);renderer.domElement.removeEventListener("pointerdown",onCardPointerDown);cardBackTexture.dispose();renderer.dispose();renderer.domElement.remove()},{once:true});
    return api;
  }catch(err){host.dataset.duck3d="failed";renderer?.dispose();renderer?.domElement.remove();console.warn("3D battle layer unavailable; 2D battle remains active",err);return null}
}
