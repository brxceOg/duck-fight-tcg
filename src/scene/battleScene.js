import * as THREE from "three";

export function mountBattleScene(host){
  if(!host||host.dataset.duck3d==="ready")return host?.duck3dApi||null;
  host.dataset.duck3d="loading";
  let renderer,scene,camera,observer,raf=0,alive=true;
  const cards=[];
  const reduced=window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches||false;
  try{
    scene=new THREE.Scene();
    camera=new THREE.PerspectiveCamera(43,1,.1,50);
    camera.position.set(0,8,8.5);camera.lookAt(0,0,0);
    renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:"low-power"});
    renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5));
    renderer.setClearColor(0x000000,0);
    renderer.domElement.className="battle-3d-canvas";
    renderer.domElement.setAttribute("aria-hidden","true");
    host.prepend(renderer.domElement);
    scene.add(new THREE.HemisphereLight(0xffffff,0x26364d,2));
    const key=new THREE.DirectionalLight(0xffffff,2.2);key.position.set(-3,8,5);scene.add(key);
    const rim=new THREE.PointLight(0x63e7df,1.1,12);rim.position.set(0,3,-3);scene.add(rim);
    const resize=()=>{if(!alive)return;const w=Math.max(host.clientWidth,1),h=Math.max(host.clientHeight,1);camera.aspect=w/h;camera.fov=w/h<.85?48:43;camera.position.z=w/h<.85?10:8.5;camera.updateProjectionMatrix();renderer.setSize(w,h,false)};
    if(typeof ResizeObserver!=="undefined"){observer=new ResizeObserver(resize);observer.observe(host)}else window.addEventListener("resize",resize);
    resize();
    const api={
      playCard(card,side="player"){
        const canvas=document.createElement("canvas");canvas.width=512;canvas.height=700;
        const ctx=canvas.getContext("2d");
        const grad=ctx.createLinearGradient(0,0,512,700);grad.addColorStop(0,side==="enemy"?"#39234f":"#126b77");grad.addColorStop(1,side==="enemy"?"#db6899":"#ffd45f");
        ctx.fillStyle=grad;ctx.fillRect(0,0,512,700);ctx.strokeStyle="#fff";ctx.lineWidth=18;ctx.strokeRect(12,12,488,676);
        ctx.fillStyle="#fff";ctx.textAlign="center";ctx.font="bold 190px system-ui";ctx.fillText(card?.emoji||"🦆",256,360);
        ctx.font="bold 42px system-ui";ctx.fillText((card?.name||"Rubber Duck").slice(0,22),256,570);
        ctx.font="bold 30px system-ui";ctx.fillText("⚔ "+(card?.attack||1)+"     ♥ "+(card?.health||1),256,630);
        const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;
        const back=new THREE.MeshStandardMaterial({color:side==="enemy"?0x522d63:0x167d83,roughness:.45,metalness:.15});
        const face=new THREE.MeshStandardMaterial({map:tex,roughness:.5,metalness:.08});
        const mesh=new THREE.Mesh(new THREE.BoxGeometry(1.35,.075,1.85),[back,back,face,back,back,back]);
        mesh.position.set((Math.random()-.5)*.22,.24,side==="player"?3.9:-3.9);
        mesh.rotation.set(0,side==="enemy"?Math.PI:0,side==="enemy"?-.14:.14);
        mesh.scale.setScalar(.9);scene.add(mesh);
        const targetZ=side==="player"?1.25:-1.25;
        cards.push({mesh,from:performance.now(),duration:reduced?180:720,startZ:mesh.position.z,targetZ,kind:"play",side,tex});
        if(cards.length>10){const old=cards.shift();scene.remove(old.mesh);old.mesh.geometry.dispose();old.mesh.material.forEach?.(m=>m.dispose());old.tex.dispose()}
      },
      attack(side="player",index=0,targetIndex=0){
        const z=side==="player"?1.45:-1.45;
        const x=(index-1)*1.25,tx=(targetIndex-1)*1.25;
        const from=performance.now();
        const marker=new THREE.Mesh(new THREE.SphereGeometry(.18,12,8),new THREE.MeshBasicMaterial({color:side==="player"?0xffd45f:0xff55a4}));
        marker.position.set(x,.45,z);scene.add(marker);
        cards.push({mesh:marker,from,duration:reduced?140:440,startZ:z,targetZ:side==="player"?-1.1:1.1,kind:"attack",startX:x,targetX:tx,side});
      }
    };
    host.duck3dApi=api;host.dataset.duck3d="ready";
    const render=(now)=>{if(!alive)return;for(let i=cards.length-1;i>=0;i--){const a=cards[i],p=Math.min(1,(now-a.from)/a.duration),ease=p<.5?4*p*p*p:1-Math.pow(-2*p+2,3)/2;if(a.kind==="play"){a.mesh.position.z=a.startZ+(a.targetZ-a.startZ)*ease;a.mesh.position.y=.24+Math.sin(p*Math.PI)*.95;a.mesh.rotation.y=(a.side==="enemy"?Math.PI:0)+(a.side==="enemy"?-1:1)*(1-p)*.7;a.mesh.scale.setScalar(.9+.1*ease);if(p>=1){a.mesh.position.y=.08;cards.splice(i,1);cards.push({...a,kind:"rest",from:now,duration:2600,startZ:a.targetZ,targetZ:a.targetZ})}}else if(a.kind==="attack"){a.mesh.position.z=a.startZ+(a.targetZ-a.startZ)*Math.sin(p*Math.PI);a.mesh.position.x=a.startX+(a.targetX-a.startX)*ease;if(p>=1){scene.remove(a.mesh);a.mesh.geometry.dispose();a.mesh.material.dispose();cards.splice(i,1)}}else if(a.kind==="rest"&&p>=1){scene.remove(a.mesh);a.mesh.geometry.dispose();a.mesh.material.forEach?.(m=>m.dispose());a.tex?.dispose();cards.splice(i,1)}}
      renderer.render(scene,camera);raf=requestAnimationFrame(render)};
    raf=requestAnimationFrame(render);
    host.addEventListener("duck3d-dispose",()=>{alive=false;cancelAnimationFrame(raf);observer?.disconnect();renderer.dispose();renderer.domElement.remove()},{once:true});
    return api;
  }catch(err){host.dataset.duck3d="failed";renderer?.dispose();renderer?.domElement.remove();console.warn("3D battle layer unavailable; 2D battle remains active",err);return null}
}
