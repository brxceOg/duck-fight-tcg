import{CARDS}from"../data/cards.js";import{getState,addToDeck,removeFromDeck,clearDeck}from"../state/playerState.js";
let activeFilter="all";
const placeholder=(card)=>"data:image/svg+xml;charset=UTF-8,"+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="512" height="700" viewBox="0 0 512 700"><defs><linearGradient id="g" x2="1" y2="1"><stop stop-color="#16a4a5"/><stop offset="1" stop-color="#ffd45f"/></linearGradient></defs><rect width="512" height="700" fill="url(#g)"/><rect x="12" y="12" width="488" height="676" rx="16" fill="none" stroke="white" stroke-width="18"/><text x="256" y="385" text-anchor="middle" font-size="220">🦆</text><text x="256" y="565" text-anchor="middle" fill="white" font-family="sans-serif" font-size="38" font-weight="bold">'+card.name+'</text><text x="256" y="630" text-anchor="middle" fill="white" font-family="sans-serif" font-size="30" font-weight="bold">⚔ '+card.attack+'    ♥ '+card.health+'</text></svg>');
export function renderCollection(filter=activeFilter){
 activeFilter=filter||"all";
 const state=getState(),grid=document.querySelector("#card-grid"),filters=document.querySelector("#collection .collection-browser .filters");
 if(!grid||!filters)return;
 const collectible=CARDS.filter(card=>card.cardType!=="Minion");
 const sets=[...new Set(collectible.map(card=>card.set))];
 filters.innerHTML='<button class="filter '+(activeFilter==="all"?"active":"")+'" data-filter="all">All</button>'+sets.map(set=>'<button class="filter '+(activeFilter===set?"active":"")+'" data-filter="'+set+'">'+set+'</button>').join("");
 filters.querySelectorAll(".filter").forEach(button=>button.addEventListener("click",()=>renderCollection(button.dataset.filter)));
 grid.replaceChildren();
 // Ownership controls visibility; deck membership only changes the visual selected state.
 const owned=collectible.filter(card=>(state.collection[card.id]||0)>0);
 owned.filter(card=>activeFilter==="all"||card.set===activeFilter).forEach(card=>{
  const inDeck=state.deck.includes(card.id),art=card.front||placeholder(card);
  const el=document.createElement("article");
  el.className="collection-card"+(inDeck?" is-in-deck":"");
  const img=document.createElement("img");img.src=art;img.alt=card.name;img.loading="lazy";
  img.addEventListener("click",()=>{document.querySelector("#inspect-card").innerHTML='<img src="'+art+'" alt="'+card.name+'">';document.querySelector("#inspect").classList.remove("hidden")});
  const qty=document.createElement("span");qty.className="qty";qty.textContent="×"+state.collection[card.id];
  const meta=document.createElement("div");meta.className="meta";
  const name=document.createElement("b");name.textContent=card.name;
  const rarity=document.createElement("small");rarity.textContent=card.rarity+" · "+card.cost+" bubbles";
  const set=document.createElement("small");set.textContent=card.set;
  meta.append(name,rarity,set);
  if(inDeck){
   const selected=document.createElement("div");selected.className="deck-selected-state";selected.innerHTML='<span>✓</span> Selected';meta.append(selected);
   const badge=document.createElement("span");badge.className="in-deck-indicator";badge.setAttribute("aria-label","In deck");badge.innerHTML="<span>✓</span>";
   const wash=document.createElement("span");wash.className="deck-art-wash";wash.setAttribute("aria-hidden","true");el.append(badge,wash);
  }else{
   const add=document.createElement("button");add.type="button";add.className="link add";add.textContent="+ Add to deck";
   add.addEventListener("click",()=>{if(addToDeck(card.id))renderCollection(activeFilter)});
   meta.append(add);
  }
  el.append(qty,img,meta);grid.append(el);
 });
 const deck=state.deck.map(id=>collectible.find(card=>card.id===id)).filter(Boolean);
 document.querySelector("#deck-count").textContent=deck.length+" / "+collectible.length+" cards";
 const deckList=document.querySelector("#deck-list");
 deckList.replaceChildren();
 deck.forEach(card=>{
  const button=document.createElement("button");button.type="button";button.className="deck-card-thumb";button.dataset.id=card.id;button.setAttribute("aria-label","Remove "+card.name+" from deck");button.title="Tap to remove "+card.name;
  const img=document.createElement("img");img.src=card.front||placeholder(card);img.alt=card.name;img.loading="lazy";
  const remove=document.createElement("span");remove.textContent="✕";button.append(img,remove);
  button.addEventListener("click",()=>{removeFromDeck(card.id);renderCollection(activeFilter)});
  deckList.append(button);
 });
}
export function initDeckBuilder(){
 document.querySelector("#clear-deck").addEventListener("click",()=>{clearDeck();renderCollection(activeFilter)});
 document.querySelector("#inspect-close").addEventListener("click",()=>document.querySelector("#inspect").classList.add("hidden"));
 renderCollection("all");
}
