let THREE;
import { rollPack, rarityClass } from "../data/cards.js";
import { addCards } from "../state/playerState.js";

export function initShop({ onState }) {
  let pulls = [], index = 0, opened = false, dragging = false, dragStart = 0, tearStart = 0;
  let renderer, scene, camera, packGroup, tearGroup, tab, seam, perforation, raf = 0;
  const stage = document.querySelector("#pack-stage");
  const buy = document.querySelector("#buy-pack");
  const overlayMarkup = `
    <div class="pack-overlay-head"><div><small>WILD POND · COLLECTOR SERIES</small><b>BOOSTER PACK</b></div><button id="close-pack" class="close" aria-label="Close pack">✕</button></div>
    <div class="pack-3d-viewport" id="pack-3d-viewport"><div class="pack-grab-prompt" id="pack-grab-prompt">GRAB THE PULL TAB <span>↗</span></div></div>
    <p id="pack-hint" class="pack-overlay-hint">Touch and hold the little tab at the top-right, then pull it left to tear the foil.</p>
    <div id="reveals" class="reveals"></div>
    <button id="next-pull" class="big yellow hidden">REVEAL NEXT CARD</button>
    <button id="finish-pack" class="big hidden">ADD CARDS TO COLLECTION</button>`;
  stage.innerHTML = overlayMarkup;
  const viewport = stage.querySelector("#pack-3d-viewport");
  const hint = stage.querySelector("#pack-hint");
  const reveal = stage.querySelector("#reveals");
  const next = stage.querySelector("#next-pull");
  const finish = stage.querySelector("#finish-pack");
  const close = stage.querySelector("#close-pack");
  const prompt = stage.querySelector("#pack-grab-prompt");

  function makeArtwork() {
    const canvas = document.createElement("canvas");
    canvas.width = 768; canvas.height = 1080;
    const ctx = canvas.getContext("2d");
    const g = ctx.createLinearGradient(0,0,768,1080);
    g.addColorStop(0,"#ffdc8a");g.addColorStop(.28,"#f58ac2");g.addColorStop(.62,"#8864c9");g.addColorStop(1,"#42c9c9");
    ctx.fillStyle=g;ctx.fillRect(0,0,768,1080);
    const glow=ctx.createRadialGradient(380,470,30,380,470,520);glow.addColorStop(0,"#fff9");glow.addColorStop(1,"#fff0");ctx.fillStyle=glow;ctx.fillRect(0,0,768,1080);
    for(let i=0;i<22;i++){const x=(i*173+51)%768,y=(i*257+93)%1080;ctx.fillStyle="#fff7";ctx.beginPath();ctx.arc(x,y,5+(i%4)*4,0,Math.PI*2);ctx.fill();}
    ctx.fillStyle="#fff4";ctx.fillRect(25,25,718,1030);ctx.strokeStyle="#fff";ctx.lineWidth=13;ctx.strokeRect(25,25,718,1030);
    ctx.textAlign="center";ctx.shadowColor="#493064";ctx.shadowBlur=12;ctx.fillStyle="#fff5df";ctx.font="900 43px Arial";ctx.fillText("WILD POND  •  COLLECTOR SERIES",384,112);
    ctx.font="1000 98px Arial";ctx.lineWidth=13;ctx.strokeStyle="#50315f";ctx.strokeText("DUCK FIGHT",384,238);ctx.fillStyle="#fff7d7";ctx.fillText("DUCK FIGHT",384,238);ctx.shadowBlur=0;
    // A clean, original cartoon duck mascot printed directly on the foil.
    ctx.save();ctx.translate(384,570);
    ctx.fillStyle="#f8c94f";ctx.strokeStyle="#55345d";ctx.lineWidth=18;ctx.lineJoin="round";
    ctx.beginPath();ctx.ellipse(0,52,190,220,-.06,0,Math.PI*2);ctx.fill();ctx.stroke();
    ctx.beginPath();ctx.ellipse(-8,-132,151,143,0,0,Math.PI*2);ctx.fill();ctx.stroke();
    ctx.fillStyle="#fff";ctx.beginPath();ctx.ellipse(-63,-153,25,37,-.12,0,Math.PI*2);ctx.ellipse(48,-153,25,37,.12,0,Math.PI*2);ctx.fill();
    ctx.fillStyle="#332642";ctx.beginPath();ctx.arc(-57,-145,11,0,Math.PI*2);ctx.arc(54,-145,11,0,Math.PI*2);ctx.fill();
    ctx.fillStyle="#f58b56";ctx.beginPath();ctx.moveTo(-28,-105);ctx.quadraticCurveTo(5,-126,37,-105);ctx.quadraticCurveTo(8,-67,-28,-105);ctx.fill();ctx.stroke();
    ctx.fillStyle="#ffad52";ctx.beginPath();ctx.moveTo(-178,25);ctx.quadraticCurveTo(-280,-2,-230,105);ctx.quadraticCurveTo(-195,139,-159,105);ctx.fill();ctx.stroke();
    ctx.restore();
    ctx.textAlign="center";ctx.fillStyle="#fff8e8";ctx.strokeStyle="#50315f";ctx.lineWidth=7;ctx.font="1000 45px Arial";ctx.strokeText("5 DUCKS INSIDE!",384,925);ctx.fillText("5 DUCKS INSIDE!",384,925);
    ctx.font="900 27px Arial";ctx.fillStyle="#39264e";ctx.fillText("COLLECT • BATTLE • MAKE A SPLASH",384,985);
    return new THREE.CanvasTexture(canvas);
  }
  async function init3D() {
    if (!THREE) THREE = await import("three");
    if (renderer) { renderer.dispose(); viewport.replaceChildren(); }
    scene = new THREE.Scene();
    scene.background = new THREE.Color("#211b3d");
    camera = new THREE.PerspectiveCamera(34, 1, .1, 100);
    camera.position.set(0, .05, 9.6);
    renderer = new THREE.WebGLRenderer({ antialias:true, alpha:false });
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.className = "pack-3d-canvas";
    viewport.prepend(renderer.domElement);
    scene.add(new THREE.HemisphereLight(0xdedaff, 0x302044, 2.1));
    const key = new THREE.DirectionalLight(0xffedcf, 3.2); key.position.set(-3,5,7); scene.add(key);
    const rim = new THREE.PointLight(0x62e9ed, 75, 15); rim.position.set(3,1,4); scene.add(rim);
    const floor = new THREE.Mesh(new THREE.CircleGeometry(2.3,64),new THREE.MeshBasicMaterial({color:0x352a59,transparent:true,opacity:.5}));
    floor.rotation.x=-Math.PI/2;floor.position.set(0,-2.5,0);scene.add(floor);
    packGroup = new THREE.Group(); scene.add(packGroup);
    // A softly inflated foil pouch, with curved faces instead of a flat box.
    const foil = new THREE.MeshPhysicalMaterial({color:0xe9c4ec,metalness:.72,roughness:.28,clearcoat:1,clearcoatRoughness:.1});
    const pouchFace=(zSign,material)=>{
      const geo=new THREE.PlaneGeometry(2.62,3.72,28,38),pos=geo.attributes.position;
      for(let i=0;i<pos.count;i++){const x=pos.getX(i),y=pos.getY(i);const bulge=.105*(1-(x/1.31)**2)*Math.sin(Math.PI*(y+1.86)/3.72);const wrinkle=.012*Math.sin(x*17+y*8)*Math.sin((y+1.86)*Math.PI/3.72);pos.setZ(i,zSign*(bulge+wrinkle));}
      geo.computeVertexNormals();const mesh=new THREE.Mesh(geo,material);mesh.position.z=zSign*.105;return mesh;
    };
    packGroup.add(pouchFace(1,new THREE.MeshBasicMaterial({map:makeArtwork(),side:THREE.DoubleSide})));
    packGroup.add(pouchFace(-1,new THREE.MeshStandardMaterial({color:0x62427e,metalness:.76,roughness:.3,side:THREE.DoubleSide})));
    const sideMat=new THREE.MeshPhysicalMaterial({color:0xb879b9,metalness:.82,roughness:.24});
    for(const side of [-1,1]){
      const gusset=new THREE.Mesh(new THREE.BoxGeometry(.16,3.72,.25),sideMat);gusset.position.set(side*1.29,0,0);gusset.rotation.y=side*.18;packGroup.add(gusset);
      const fold=new THREE.Mesh(new THREE.BoxGeometry(.035,3.5,.27),new THREE.MeshStandardMaterial({color:0xffe8f7,metalness:.85,roughness:.2}));fold.position.set(side*1.205,0,.105);fold.rotation.y=side*.28;packGroup.add(fold);
    }
    // Heat-sealed crimp bands have many fine raised ribs, not a single bar.
    const seamMat=new THREE.MeshPhysicalMaterial({color:0xffe5f2,metalness:.94,roughness:.19,clearcoat:1});
    const addCrimp=(y)=>{
      const band=new THREE.Mesh(new THREE.BoxGeometry(2.72,.24,.12),seamMat);band.position.set(0,y,.13);packGroup.add(band);
      for(let x=-1.29;x<=1.29;x+=.075){const rib=new THREE.Mesh(new THREE.BoxGeometry(.018,.205,.025),new THREE.MeshStandardMaterial({color:0xb878b2,metalness:.8,roughness:.22}));rib.position.set(x,y,.205);packGroup.add(rib);}
      const edge=new THREE.Mesh(new THREE.BoxGeometry(2.68,.025,.025),new THREE.MeshBasicMaterial({color:0xffffff}));edge.position.set(0,y+.105,.218);packGroup.add(edge);
      return band;
    };
    seam=addCrimp(1.79);addCrimp(-1.79);
    // Perforation is a zig-zag tear path pressed into the foil, with tiny cut marks.
    perforation=new THREE.Group();perforation.position.set(0,1.64,.24);packGroup.add(perforation);
    const tearPath=[];
    for(let i=0;i<=42;i++){const x=-1.27+i*(2.54/42),y=(i%2===0?-.025:.025);tearPath.push(new THREE.Vector3(x,y,0));}
    const pathGeo=new THREE.BufferGeometry().setFromPoints(tearPath);
    perforation.add(new THREE.Line(pathGeo,new THREE.LineDashedMaterial({color:0x613e73,dashSize:.055,gapSize:.035,transparent:true,opacity:.9})));
    perforation.children[0].computeLineDistances();
    // The tear strip is a real flexible ribbon with a jagged lower edge.
    tearGroup=new THREE.Group();tearGroup.position.set(0,1.69,.27);packGroup.add(tearGroup);
    const ribbonShape=new THREE.Shape();ribbonShape.moveTo(-1.3,.15);ribbonShape.lineTo(1.3,.15);ribbonShape.lineTo(1.3,-.015);
    for(let i=42;i>=0;i--){const x=-1.3+i*(2.6/42),y=(i%2===0?-.075:-.015);ribbonShape.lineTo(x,y);}
    ribbonShape.close();
    const ribbonGeo=new THREE.ShapeGeometry(ribbonShape,2);
    const ribbon=new THREE.Mesh(ribbonGeo,new THREE.MeshPhysicalMaterial({color:0xffe8a5,metalness:.94,roughness:.14,clearcoat:1,side:THREE.DoubleSide}));ribbon.position.z=.025;tearGroup.add(ribbon);
    const ribbonRidge=new THREE.Mesh(new THREE.BoxGeometry(2.58,.035,.045),new THREE.MeshStandardMaterial({color:0xffffff,metalness:.9,roughness:.16}));ribbonRidge.position.set(0,.105,.045);tearGroup.add(ribbonRidge);
    // Folded corner pull tab: a small raised flap with a rounded grip loop.
    tab=new THREE.Group();tab.position.set(1.12,.12,.12);tearGroup.add(tab);
    const tabShape=new THREE.Shape();tabShape.moveTo(-.18,-.08);tabShape.quadraticCurveTo(-.24,.19,-.04,.27);tabShape.lineTo(.27,.22);tabShape.quadraticCurveTo(.4,.14,.29,-.08);tabShape.close();
    const tabMesh=new THREE.Mesh(new THREE.ExtrudeGeometry(tabShape,{depth:.055,bevelEnabled:true,bevelSegments:3,steps:1,bevelSize:.025,bevelThickness:.025}),new THREE.MeshPhysicalMaterial({color:0xfff0bd,metalness:.88,roughness:.13,clearcoat:1}));
    tabMesh.rotation.x=-.22;tabMesh.position.z=.075;tab.add(tabMesh);
    const grip=new THREE.Mesh(new THREE.TorusGeometry(.105,.025,8,24),new THREE.MeshStandardMaterial({color:0x9d5a94,metalness:.6,roughness:.25}));grip.position.set(.04,.09,.17);tab.add(grip);
    // Cards are tucked behind the foil and only become visible as the top peels back.
    const cardStack=new THREE.Group();cardStack.position.set(0,-.02,.28);packGroup.add(cardStack);
    for(let n=0;n<5;n++){const card=new THREE.Mesh(new THREE.BoxGeometry(2.28,3.23,.028),new THREE.MeshStandardMaterial({color:[0x91d9d5,0xe8c6ed,0xffd982,0x9d91dc,0xf5a5c6][n],roughness:.48}));card.position.set((n-2)*.025,(n-2)*.018,-.1-n*.012);card.rotation.z=(n-2)*.012;cardStack.add(card);}
    packGroup.rotation.set(.025,-.12,-.025);
    const resize=()=>{const w=Math.max(1,viewport.clientWidth),h=Math.max(1,viewport.clientHeight);renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();};
    resize();window.addEventListener("resize",resize);
    const animate=()=>{raf=requestAnimationFrame(animate);if(!dragging&&!opened)packGroup.rotation.y=-.13+Math.sin(performance.now()*.00065)*.055;renderer.render(scene,camera);};
    cancelAnimationFrame(raf);animate();
  }
  function raycast(event) {
    const rect=renderer.domElement.getBoundingClientRect();
    const pointer=new THREE.Vector2(((event.clientX-rect.left)/rect.width)*2-1,-((event.clientY-rect.top)/rect.height)*2+1);
    const ray=new THREE.Raycaster();ray.setFromCamera(pointer,camera);
    return ray.intersectObjects(tab.children,true).length>0 || ray.intersectObjects([tab],true).length>0;
  }
  function tearDown() {
    if(!renderer)return;
    cancelAnimationFrame(raf);renderer.dispose();renderer.domElement.remove();renderer=null;
  }
  function completeTear() {
    if(opened)return;
    opened=true;dragging=false;
    tearGroup.rotation.set(-.42,-.08,-.62);tearGroup.position.set(-1.92,2.23,.62);
    tearGroup.scale.set(.92,1.12,1);
    seam.visible=false;
    packGroup.rotation.set(-.1,.06,.02);
    perforation.visible=false;
    prompt.classList.add("hidden");
    hint.textContent="Foil torn! Your five ducks are ready…";
    window.setTimeout(show,650);
  }
  function show() {
    if(index>=pulls.length)return;
    const c=pulls[index++],el=document.createElement("div");
    el.className="pull-card "+rarityClass(c.rarity);
    const img=document.createElement("img");img.src=c.front||"./IMG_1483.jpeg";img.alt=c.name;img.loading="eager";
    const label=document.createElement("b");label.textContent=c.name+" · "+c.rarity;
    el.append(img,label);reveal.append(el);
    hint.textContent="CARD "+index+" OF 5 · "+c.rarity.toUpperCase();
    if(index<5){next.classList.remove("hidden");finish.classList.add("hidden");}
    else{next.classList.add("hidden");finish.classList.remove("hidden");hint.textContent="All five cards revealed! Add them to your collection.";}
  }
  function pointerDown(e) {
    if(opened||!renderer||!raycast(e))return;
    dragging=true;dragStart=e.clientX;tearStart=tearGroup.position.x;
    renderer.domElement.setPointerCapture?.(e.pointerId);
    tab.rotation.z=-.16;tab.rotation.x=-.3;
    hint.textContent="Pull the corner tab across the perforation to peel the foil…";
    e.preventDefault();
  }
  function pointerMove(e) {
    if(!dragging)return;
    const dx=(e.clientX-dragStart)/Math.max(1,viewport.clientWidth)*5.2;
    const progress=Math.max(0,Math.min(1,-dx/2.15));
    tearGroup.position.x=tearStart+dx;
    tearGroup.position.y=1.69+progress*.52;
    tearGroup.position.z=.27+progress*.34;
    tearGroup.rotation.z=-progress*.58;
    tearGroup.rotation.x=-progress*.22;
    tab.rotation.z=-.16-progress*.32;tab.rotation.x=-.3-progress*.38;
    packGroup.rotation.y=-.12-progress*.16;
    perforation.scale.x=Math.max(.02,1-progress);
    hint.textContent=progress>.92?"The last foil fibers are stretching…":"Peeling the crimped foil… "+Math.round(progress*100)+"%";
    if(progress>=1)completeTear();
    e.preventDefault();
  }
  function pointerUp(){if(!dragging)return;dragging=false;if(tearGroup.position.x<-.55)completeTear();else{tearGroup.position.x=0;tearGroup.position.y=1.69;tearGroup.position.z=.27;tearGroup.rotation.set(0,0,0);tab.rotation.set(-.22,0,0);perforation.scale.x=1;hint.textContent="Grab the raised corner tab and pull left along the jagged tear seam.";}}
  function bindCanvas() {
    renderer.domElement.addEventListener("pointerdown",pointerDown);
    renderer.domElement.addEventListener("pointermove",pointerMove);
    renderer.domElement.addEventListener("pointerup",pointerUp);
    renderer.domElement.addEventListener("pointercancel",pointerUp);
  }
  close.onclick=()=>{stage.classList.add("hidden");stage.classList.remove("pack-overlay");document.querySelector("#shop").append(stage);document.body.classList.remove("pack-opening-active");tearDown();};
  buy.onclick=()=>{
    if(!window.duckSpend(100)){buy.textContent="NEED 100 SOAP";window.setTimeout(()=>buy.textContent="BUY PACK · 100 🫧",1400);return;}
    pulls=rollPack();index=0;opened=false;reveal.replaceChildren();
    next.classList.add("hidden");finish.classList.add("hidden");
    document.body.append(stage);stage.classList.remove("hidden");stage.classList.add("pack-overlay");document.body.classList.add("pack-opening-active");
    hint.textContent="Touch and hold the small pull tab at the top-right, then drag it all the way left.";
    prompt.classList.remove("hidden");hint.textContent="Preparing your booster…";onState();
    init3D().then(()=>{bindCanvas();hint.textContent="Touch and hold the small pull tab at the top-right, then drag it all the way left.";}).catch(err=>{console.error("3D booster failed to initialize",err);hint.textContent="The 3D pack could not load. Check your connection and tap BUY PACK again.";stage.classList.remove("hidden");});
  };
  next.onclick=show;
  finish.onclick=()=>{addCards(pulls);stage.classList.add("hidden");stage.classList.remove("pack-overlay");document.querySelector("#shop").append(stage);document.body.classList.remove("pack-opening-active");tearDown();onState();};
  // Reopening starts with a clean overlay and a newly built physical pack.
}
