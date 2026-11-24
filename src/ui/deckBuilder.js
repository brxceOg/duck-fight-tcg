import{CARDS}from"../data/cards.js";import{getState,addToDeck,removeFromDeck,clearDeck}from"../state/playerState.js";
export function renderCollection(filter="all"){
 let s=getState(),grid=document.querySelector("#card-grid"),filters=document.querySelector(".filters");grid.innerHTML="";
 const sets=[...new Set(CARDS.map(c=>c.set))];
 filters.innerHTML='<button class="filter '+(filter==="all"?"active":"")+'" data-filter="all">All</button>'+sets.map(set=>'<button class="filter '+(filter===set?"active":"")+'" data-filter="'+set+'">'+set+'</button>').join("");
 filters.querySelectorAll(".filter").forEach(b=>b.onclick=()=>renderCollection(b.dataset.filter));
 CARDS.filter(c=>(filter==="all"||c.set===filter)&&(s.collection[c.id]||0)>0).forEach(c=>{
  let el=document.createElement("div");el.className="collection-card";
  el.innerHTML='<span class="qty">×'+s.collection[c.id]+'</span><img src="'+(c.front||"./assets/cards/card-back.jpg")+'" alt="'+c.name+'"><div class="meta"><b>'+c.name+'</b><small>'+c.rarity+" · "+c.cost+' bubbles</small><small>'+c.set+'</small><button class="link add">+ Add to deck</button></div>';
  el.querySelector("img").onclick=()=>{document.querySelector("#inspect-card").innerHTML='<img src="'+c.front+'">';document.querySelector("#inspect").classList.remove("hidden")};
  el.querySelector(".add").onclick=()=>{addToDeck(c.id);renderCollection(filter)};grid.append(el)
 });
 let d=s.deck.map(id=>CARDS.find(c=>c.id===id)).filter(Boolean);
 document.querySelector("#deck-count").textContent=d.length+" / 20 cards";
 document.querySelector("#deck-list").innerHTML=d.map(c=>'<button class="deck-chip" data-id="'+c.id+'">'+c.name+" ✕</button>").join("");
 document.querySelectorAll(".deck-chip").forEach(b=>b.onclick=()=>{removeFromDeck(b.dataset.id);renderCollection(filter)});
}
export function initDeckBuilder(){document.querySelector("#clear-deck").onclick=()=>{clearDeck();renderCollection(document.querySelector(".filter.active")?.dataset.filter||"all")};document.querySelector("#inspect-close").onclick=()=>document.querySelector("#inspect").classList.add("hidden");renderCollection()}
