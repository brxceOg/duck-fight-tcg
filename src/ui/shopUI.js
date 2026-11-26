import * as THREE from "three";
import { rollPack, rarityClass } from "../data/cards.js";
import { addCards } from "../state/playerState.js";

export function initShop({ onState }) {
  let pulls = [], index = 0, opened = false, dragging = false, dragStart = 0, tearStart = 0;
  let renderer, scene, camera, packGroup, tearGroup, tab, seam, raf = 0;
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
    canvas.width = 512; canvas.height = 768;
    const ctx = canvas.getContext("2d");
    const g = ctx.createLinearGradient(0, 0, 512, 768);
    g.addColorStop(0, "#ffe88a"); g.addColorStop(.34, "#f36db5");
    g.addColorStop(.68, "#9259c9"); g.addColorStop(1, "#43d9d5");
    ctx.fillStyle = g; ctx.fillRect(0, 0, 512, 768);
    for (let n=0;n<28;n++){ctx.fillStyle="rgba(255,255,255,.12)";ctx.beginPath();ctx.arc((n*137)%512,(n*211)%768,8+(n%5)*7,0,Math.PI*2);ctx.fill();}
    ctx.strokeStyle="rgba(255,255,255,.75)";ctx.lineWidth=8;ctx.strokeRect(18,18,476,732);
    ctx.textAlign="center";ctx.fillStyle="#39234e";ctx.font="900 31px Arial";ctx.fillText("THE COLLECTOR SERIES",256,104);
    ctx.font="1000 76px Arial";ctx.fillText("DUCK FIGHT",256,190);
    ctx.font="170px Arial";ctx.fillText("🦆",256,440);
    ctx.font="900 27px Arial";ctx.fillText("WILD POND  ·  5 CARDS",256,674);
    return new THREE.CanvasTexture(canvas);
  }
  function init3D() {
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
    const foil = new THREE.MeshPhysicalMaterial({color:0xe5a9df,metalness:.78,roughness:.23,clearcoat:1,clearcoatRoughness:.12});
    const body = new THREE.Mesh(new THREE.BoxGeometry(2.62,3.72,.16),foil); packGroup.add(body);
    const front = new THREE.Mesh(new THREE.PlaneGeometry(2.59,3.69),new THREE.MeshBasicMaterial({map:makeArtwork()}));
    front.position.z=.087;packGroup.add(front);
    const back = new THREE.Mesh(new THREE.PlaneGeometry(2.59,3.69),new THREE.MeshStandardMaterial({color:0x583b80,metalness:.65,roughness:.3}));
    back.position.z=-.087;back.rotation.y=Math.PI;packGroup.add(back);
    // Crimped foil seams along the top and bottom.
    const seamMat = new THREE.MeshStandardMaterial({color:0xf7d8f1,metalness:.9,roughness:.2});
    seam = new THREE.Mesh(new THREE.BoxGeometry(2.7,.18,.22),seamMat); seam.position.set(0,1.9,0);packGroup.add(seam);
    const bottom = new THREE.Mesh(new THREE.BoxGeometry(2.7,.16,.22),seamMat);bottom.position.y=-1.9;packGroup.add(bottom);
    // A separate foil tear strip and raised pull tab are actual 3D meshes.
    tearGroup = new THREE.Group();tearGroup.position.set(0,1.83,.17);packGroup.add(tearGroup);
    const strip = new THREE.Mesh(new THREE.BoxGeometry(2.55,.13,.07),new THREE.MeshPhysicalMaterial({color:0xffe8a5,metalness:.9,roughness:.16,clearcoat:1}));
    tearGroup.add(strip);
    const tabMat = new THREE.MeshPhysicalMaterial({color:0xfff0bd,metalness:.85,roughness:.14,clearcoat:1,side:THREE.DoubleSide});
    tab = new THREE.Mesh(new THREE.BoxGeometry(.34,.34,.12),tabMat);tab.position.set(1.28,.08,.04);tearGroup.add(tab);
    const tabFace = new THREE.Mesh(new THREE.PlaneGeometry(.24,.24),new THREE.MeshBasicMaterial({color:0xff8ac5,side:THREE.DoubleSide}));
    tabFace.position.set(1.28,.08,.108);tearGroup.add(tabFace);
    const cardStack = new THREE.Group();cardStack.position.set(0,-.05,.25);packGroup.add(cardStack);
    for(let n=0;n<5;n++){const card=new THREE.Mesh(new THREE.BoxGeometry(2.25,3.2,.025),new THREE.MeshStandardMaterial({color:[0x91d9d5,0xe8c6ed,0xffd982,0x9d91dc,0xf5a5c6][n],roughness:.55}));card.position.set((n-2)*.035,(n-2)*.025,-.08-n*.01);card.rotation.z=(n-2)*.018;cardStack.add(card);}
    packGroup.rotation.set(.04,-.13,-.035);
    const resize=()=>{const w=Math.max(1,viewport.clientWidth),h=Math.max(1,viewport.clientHeight);renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();};
    resize();window.addEventListener("resize",resize);
    const animate=()=>{raf=requestAnimationFrame(animate);if(!dragging&&!opened)packGroup.rotation.y=-.13+Math.sin(performance.now()*.00065)*.055;renderer.render(scene,camera);};
    cancelAnimationFrame(raf);animate();
  }
  function raycast(event) {
    const rect=renderer.domElement.getBoundingClientRect();
    const pointer=new THREE.Vector2(((event.clientX-rect.left)/rect.width)*2-1,-((event.clientY-rect.top)/rect.height)*2+1);
    const ray=new THREE.Raycaster();ray.setFromCamera(pointer,camera);
    return ray.intersectObjects([tab],true).length>0;
  }
  function tearDown() {
    if(!renderer)return;
    cancelAnimationFrame(raf);renderer.dispose();renderer.domElement.remove();renderer=null;
  }
  function completeTear() {
    if(opened)return;
    opened=true;dragging=false;
    tearGroup.rotation.z=-.32;tearGroup.position.set(-1.8,2.1,.55);
    seam.visible=false;
    packGroup.rotation.set(-.12,.08,.025);
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
    hint.textContent="Keep pulling left to tear the sealed foil…";
    e.preventDefault();
  }
  function pointerMove(e) {
    if(!dragging)return;
    const dx=(e.clientX-dragStart)/Math.max(1,viewport.clientWidth)*5.2;
    const progress=Math.max(0,Math.min(1,-dx/2.15));
    tearGroup.position.x=tearStart+dx;
    tearGroup.position.y=1.83+progress*.34;
    tearGroup.rotation.z=-progress*.42;
    packGroup.rotation.y=-.13-progress*.13;
    hint.textContent=progress>.92?"Release to finish the tear…":"Pulling foil… "+Math.round(progress*100)+"%";
    if(progress>=1)completeTear();
    e.preventDefault();
  }
  function pointerUp(){if(!dragging)return;dragging=false;if(tearGroup.position.x<-.55)completeTear();else{tearGroup.position.x=0;tearGroup.position.y=1.83;tearGroup.rotation.z=0;hint.textContent="Grab the pull tab again and pull farther left.";}}
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
    prompt.classList.remove("hidden");init3D();bindCanvas();onState();
  };
  next.onclick=show;
  finish.onclick=()=>{addCards(pulls);stage.classList.add("hidden");stage.classList.remove("pack-overlay");document.querySelector("#shop").append(stage);document.body.classList.remove("pack-opening-active");tearDown();onState();};
  // Reopening starts with a clean overlay and a newly built physical pack.
}
