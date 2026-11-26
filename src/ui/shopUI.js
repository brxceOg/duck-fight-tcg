import{rollPack,rarityClass}from"../data/cards.js";import{addCards}from"../state/playerState.js";
export function initShop({onState}){
 let pulls=[],i=0,opened=false,dragStart=null;
 const stage=document.querySelector("#pack-stage"),reveal=document.querySelector("#reveals"),hint=document.querySelector("#pack-hint"),next=document.querySelector("#next-pull"),finish=document.querySelector("#finish-pack"),pack=document.querySelector("#pack-3d"),rip=document.querySelector("#rip-pack");
 const packMarkup='<div class="pack-back"></div><div class="pack-side"></div><div class="pack-side right"></div><div class="pack-card-stack"><i></i><i></i><i></i></div><div class="pack-front"><div class="pack-brand"><small>THE COLLECTOR SERIES</small><strong>DUCK FIGHT</strong><span class="pack-duck">🦆</span></div><div class="pack-seal">✦</div><div class="pack-edition">WILD POND · 5 CARDS</div></div><div class="pack-crimp top"></div><div class="pack-crimp bottom"></div><div class="pack-seam"></div><div class="pack-tear"></div>';
 const resetPack=()=>{pack.className="pack-3d";pack.innerHTML=packMarkup;pack.setAttribute("aria-label","Sealed Wild Pond foil booster pack");rip.disabled=false;rip.classList.remove("hidden");rip.textContent="✂ RIP OPEN PACK";opened=false;dragStart=null};
 const show=()=>{
  if(i>=pulls.length)return;
  const c=pulls[i++],el=document.createElement("div");
  el.className="pull-card "+rarityClass(c.rarity);
  const img=document.createElement("img");img.src=c.front||"./IMG_1483.jpeg";img.alt=c.name;img.loading="eager";
  const label=document.createElement("b");label.textContent=c.name+" · "+c.rarity;
  el.append(img,label);reveal.append(el);
  hint.textContent="CARD "+i+" OF 5 · "+c.rarity.toUpperCase();
  if(i<5){next.classList.remove("hidden");finish.classList.add("hidden")}
  else{next.classList.add("hidden");finish.classList.remove("hidden");hint.textContent="All five cards revealed! Add them to your collection."}
 };
 const ripOpen=()=>{
  if(opened||!pulls.length)return;
  opened=true;rip.disabled=true;rip.textContent="OPENING…";hint.textContent="The foil tears with a satisfying rip…";
  pack.classList.add("ripping");
  window.setTimeout(()=>{pack.classList.remove("ripping");pack.classList.add("opened");hint.textContent="The pack is open! Here comes your first duck…";window.setTimeout(show,380)},620);
 };
 pack.addEventListener("pointerdown",e=>{if(opened)return;const rect=pack.getBoundingClientRect();dragStart={y:e.clientY,top:e.clientY-rect.top}});
 pack.addEventListener("pointerup",e=>{if(!dragStart||opened)return;const delta=e.clientY-dragStart.y,top=dragStart.top;dragStart=null;if(top<88&&delta<-24)ripOpen()});
 pack.addEventListener("pointercancel",()=>{dragStart=null});
 rip.addEventListener("click",ripOpen);
 document.querySelector("#buy-pack").onclick=()=>{
  if(!window.duckSpend(100)){hint.textContent="Not enough Soap!";return}
  pulls=rollPack();i=0;reveal.replaceChildren();resetPack();stage.classList.remove("hidden");hint.textContent="Drag upward across the sealed top edge, or tap RIP OPEN PACK.";next.classList.add("hidden");finish.classList.add("hidden");onState();
 };
 next.onclick=show;
 finish.onclick=()=>{addCards(pulls);stage.classList.add("hidden");onState()};
 document.querySelector("#close-pack").onclick=()=>stage.classList.add("hidden");
 resetPack();
}