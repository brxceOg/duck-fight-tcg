import{CARDS}from"../data/cards.js";
import{getState,addToDeck,removeFromDeck,clearDeck}from"../state/playerState.js";
let deckSet="all",deckRarity="all",deckSearch="",deckSort="name",collectionSet="all",collectionSearch="";
const playable=()=>CARDS.filter(c=>c.cardType!=="Minion");
const placeholder=card=>"data:image/svg+xml;charset=UTF-8,"+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="512" height="700" viewBox="0 0 512 700"><defs><linearGradient id="g" x2="1" y2="1"><stop stop-color="#16a4a5"/><stop offset="1" stop-color="#ffd45f"/></linearGradient></defs><rect width="512" height="700" fill="url(#g)"/><rect x="12" y="12" width="488" height="676" rx="16" fill="none" stroke="white" stroke-width="18"/><text x="256" y="385" text-anchor="middle" font-size="220">🦆</text><text x="256" y="565" text-anchor="middle" fill="white" font-family="sans-serif" font-size="38" font-weight="bold">'+card.name+'</text><text x="256" y="630" text-anchor="middle" fill="white" font-family="sans-serif" font-size="30" font-weight="bold">⚔ '+card.attack+'    ♥ '+card.health+'</text></svg>');
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const art=c=>c.front||placeholder(c);
const openInspect=c=>{const target=document.querySelector("#inspect-card");target.innerHTML='<img src="'+art(c)+'" alt="'+esc(c.name)+'"><div class="inspect-meta"><b>'+esc(c.name)+'</b><small>'+esc(c.rarity)+' · '+c.cost+' bubbles · '+c.attack+' ATK / '+c.health+' HP</small><p>'+esc(c.ability||"")+'</p></div>';document.querySelector("#inspect").classList.remove("hidden")};
const ownedCards=state=>playable().filter(c=>(state.collection[c.id]||0)>0);
function fillSelect(select,values,label){if(!select)return;const prior=select.value||"all";select.innerHTML='<option value="all">All '+label+'</option>'+values.map(v=>'<option value="'+esc(v)+'">'+esc(v)+'</option>').join("");select.value=values.includes(prior)?prior:"all"}
function cardElement(card,state,{inDeck=false,showAdd=false}={}){
 const el=document.createElement("article");el.className="collection-card"+(inDeck?" is-in-deck":"");
 const img=document.createElement("img");img.src=art(card);img.alt=card.name;img.loading="lazy";img.addEventListener("click",()=>openInspect(card));
 const qty=document.createElement("span");qty.className="qty";qty.textContent="×"+(state.collection[card.id]||0);
 const meta=document.createElement("div");meta.className="meta";
 const name=document.createElement("b");name.textContent=card.name;
 const details=document.createElement("small");details.textContent=card.rarity+" · "+card.cost+" bubbles";
 const set=document.createElement("small");set.textContent=card.set;
 meta.append(name,details,set);
 if(inDeck){const tag=document.createElement("span");tag.className="card-deck-tag";tag.textContent="IN ACTIVE DECK";meta.append(tag)}
 if(showAdd){const add=document.createElement("button");add.type="button";add.className="add-card-button";add.textContent=inDeck?"✓ ADDED":"+ ADD TO DECK";add.disabled=inDeck||getState().deck.length>=playable().length;add.addEventListener("click",()=>{if(addToDeck(card.id)){renderDeckBuilder();renderCollection()}});meta.append(add)}
 el.append(qty,img,meta);return el;
}
export function renderDeckBuilder(){
 const state=getState(),pool=document.querySelector("#deck-card-grid"),list=document.querySelector("#deck-list");if(!pool||!list)return;
 const owned=ownedCards(state),deck=state.deck.map(id=>playable().find(c=>c.id===id)).filter(Boolean);
 fillSelect(document.querySelector("#deck-set-filter"),[...new Set(owned.map(c=>c.set))].sort(),"sets");
 fillSelect(document.querySelector("#deck-rarity-filter"),[...new Set(owned.map(c=>c.rarity))].sort(),"rarities");
 const q=deckSearch.trim().toLowerCase();
 let visible=owned.filter(c=>(deckSet==="all"||c.set===deckSet)&&(deckRarity==="all"||c.rarity===deckRarity)&&(!q||c.name.toLowerCase().includes(q)||c.set.toLowerCase().includes(q)));
 visible.sort((a,b)=>deckSort==="cost"?a.cost-b.cost||a.name.localeCompare(b.name):deckSort==="rarity"?a.rarity.localeCompare(b.rarity)||a.name.localeCompare(b.name):a.name.localeCompare(b.name));
 pool.replaceChildren();visible.forEach(c=>pool.append(cardElement(c,state,{inDeck:state.deck.includes(c.id),showAdd:true})));
 document.querySelector("#pool-count").textContent=visible.length+" AVAILABLE";
 document.querySelector("#deck-count").textContent=deck.length+" cards in your active deck";
 document.querySelector("#deck-size").textContent=deck.length;
 const avg=deck.length?deck.reduce((n,c)=>n+c.cost,0)/deck.length:0;
 document.querySelector("#deck-avg-cost").textContent=deck.length?avg.toFixed(1):"—";
 document.querySelector("#deck-power").textContent=deck.reduce((n,c)=>n+c.attack+c.health,0);
 const readiness=document.querySelector("#deck-readiness");
 readiness.classList.toggle("ready",deck.length>0);
 readiness.textContent=deck.length? "✓ Deck ready to take into battle · "+new Set(deck.map(c=>c.set)).size+" sets represented":"Add at least one card to make this deck playable.";
 list.replaceChildren();
 deck.forEach((card,index)=>{const button=document.createElement("button");button.type="button";button.className="deck-card-thumb";button.title="Remove "+card.name+" from active deck";button.setAttribute("aria-label","Remove "+card.name+" from active deck");const img=document.createElement("img");img.src=art(card);img.alt=card.name;const remove=document.createElement("span");remove.textContent="−";button.append(img,remove);button.addEventListener("click",()=>{removeFromDeck(card.id);renderDeckBuilder();renderCollection()});list.append(button)});
}
export function renderCollection(){
 const state=getState(),grid=document.querySelector("#card-grid");if(!grid)return;
 const owned=ownedCards(state),q=collectionSearch.trim().toLowerCase();
 fillSelect(document.querySelector("#collection-set-filter"),[...new Set(owned.map(c=>c.set))].sort(),"sets");
 const visible=owned.filter(c=>(collectionSet==="all"||c.set===collectionSet)&&(!q||c.name.toLowerCase().includes(q)||c.set.toLowerCase().includes(q)));
 grid.replaceChildren();visible.forEach(c=>grid.append(cardElement(c,state,{inDeck:state.deck.includes(c.id)})));
 document.querySelector("#collection-total").textContent=visible.length+" / "+owned.length+" CARDS";
}
export function initDeckBuilder(){
 const bind=(id,fn)=>document.querySelector(id)?.addEventListener("input",fn);
 bind("#deck-search",e=>{deckSearch=e.target.value;renderDeckBuilder()});
 document.querySelector("#deck-set-filter")?.addEventListener("change",e=>{deckSet=e.target.value;renderDeckBuilder()});
 document.querySelector("#deck-rarity-filter")?.addEventListener("change",e=>{deckRarity=e.target.value;renderDeckBuilder()});
 document.querySelector("#deck-sort")?.addEventListener("change",e=>{deckSort=e.target.value;renderDeckBuilder()});
 bind("#collection-search",e=>{collectionSearch=e.target.value;renderCollection()});
 document.querySelector("#collection-set-filter")?.addEventListener("change",e=>{collectionSet=e.target.value;renderCollection()});
 document.querySelector("#clear-deck").addEventListener("click",()=>{clearDeck();renderDeckBuilder();renderCollection()});
 document.querySelector("#inspect-close").addEventListener("click",()=>document.querySelector("#inspect").classList.add("hidden"));
 renderDeckBuilder();renderCollection();
}