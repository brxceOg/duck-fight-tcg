import{CARDS}from"../data/cards.js";import{getState,addToDeck,removeFromDeck,clearDeck}from"../state/playerState.js";
const placeholder=(c)=>"data:image/svg+xml;charset=UTF-8,"+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="512" height="700" viewBox="0 0 512 700"><defs><linearGradient id="g" x2="1" y2="1"><stop stop-color="#16a4a5"/><stop offset="1" stop-color="#ffd45f"/></linearGradient></defs><rect width="512" height="700" fill="url(#g)"/><rect x="12" y="12" width="488" height="676" rx="16" fill="none" stroke="white" stroke-width="18"/><text x="256" y="385" text-anchor="middle" font-size="220">🦆</text><text x="256" y="565" text-anchor="middle" fill="white" font-family="sans-serif" font-size="38" font-weight="bold">'+c.name+'</text><text x="256" y="630" text-anchor="middle" fill="white" font-family="sans-serif" font-size="30" font-weight="bold">⚔ '+c.attack+'    ♥ '+c.health+'</text></svg>');
export function renderCollection(filter="all"){
 let s=getState(),grid=document.querySelector("#card-grid"),filters=document.querySelector(".filters");grid.innerHTML="";
 const collectible=CARDS.filter(c=>c.cardType!=="Minion");const sets=[...new Set(collectible.map(c=>c.set))];
 filters.innerHTML='<button class="filter '+(filter==="all"?"active":"")+'" data-filter="all">All</button>'+sets.map(set=>'<button class="filter '+(filter===set?"active":"")+'" data-filter="'+set+'">'+set+'</button>').join("");
 filters.querySelectorAll(".filter").forEach(b=>b.onclick=()=>renderCollection(b.dataset.filter));
 collectible.filter(c=>(filter==="all"||c.set===filter)&&(s.collection[c.id]||0)>0).forEach(c=>{
  const inDeck=s.deck.includes(c.id);let el=document.createElement("div");el.className="collection-card"+(inDeck?" is-in-deck":"");const art=c.front||placeholder(c);
  el.innerHTML=(inDeck?'<span class="in-deck-indicator" aria-label="In deck"><span>✓</span></span><span class="deck-art-wash" aria-hidden="true"></span>':'')+'<span class="qty">×'+s.collection[c.id]+'</span><img src="'+art+'" alt="'+c.name+'"><div class="meta"><b>'+c.name+'</b><small>'+c.rarity+" · "+c.cost+' bubbles</small><small>'+c.set+'</small>'+(inDeck?'<div class="deck-selected-state"><span>✓</span> Selected</div>':'<button class="link add">+ Add to deck</button>')+'</div>';
  el.querySelector("img").onclick=()=>{document.querySelector("#inspect-card").innerHTML='<img src="'+art+'" alt="'+c.name+'">';document.querySelector("#inspect").classList.remove("hidden")};
  el.querySelector(".add").onclick=()=>{if(addToDeck(c.id))renderCollection(filter)};grid.append(el)
 });
 let d=s.deck.map(id=>CARDS.find(c=>c.id===id)).filter(Boolean);const deckLimit=collectible.length;
 document.querySelector("#deck-count").textContent=d.length+" / "+deckLimit+" cards";
 const deckList=document.querySelector("#deck-list");deckList.innerHTML=d.map(c=>'<button type="button" class="deck-card-thumb" data-id="'+c.id+'" aria-label="Remove '+c.name+' from deck" title="Tap to remove '+c.name+'"><img src="'+(c.front||placeholder(c))+'" alt="'+c.name+'" loading="lazy"><span>✕</span></button>').join("");
 deckList.querySelectorAll(".deck-card-thumb").forEach(b=>b.onclick=()=>{removeFromDeck(b.dataset.id);renderCollection(filter)});
}
export function initDeckBuilder(){document.querySelector("#clear-deck").onclick=()=>{clearDeck();renderCollection(document.querySelector(".filter.active")?.dataset.filter||"all")};document.querySelector("#inspect-close").onclick=()=>document.querySelector("#inspect").classList.add("hidden");renderCollection()}
