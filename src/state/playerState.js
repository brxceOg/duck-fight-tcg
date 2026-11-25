import{CARDS}from"../data/cards.js";
const KEY="duckFightTCG.save.v1";
const STARTER_IDS=CARDS.filter(c=>c.cardType!=="Minion").map(c=>c.id);
const starterCollection=()=>Object.fromEntries(STARTER_IDS.map(id=>[id,1]));
const fresh=()=>({soap:500,collection:starterCollection(),deck:[...STARTER_IDS],wins:0,packs:0});
let s=load();
function load(){
 try{
  const saved=JSON.parse(localStorage.getItem(KEY))||{};
  const base=fresh();
  // Temporary testing setup: every playable card is owned and included in the starter deck.
  // Preserve wallet/progression, but migrate existing saves to the same complete card pool.
  const savedDeck=Array.isArray(saved.deck)?saved.deck.filter((id,i,a)=>STARTER_IDS.includes(id)&&a.indexOf(id)===i):[...STARTER_IDS];
  return{...base,...saved,collection:{...starterCollection(),...(saved.collection||{})},deck:savedDeck};
 }catch{return fresh()}
}
function save(change="general"){localStorage.setItem(KEY,JSON.stringify(s));window.dispatchEvent(new CustomEvent("playerstate",{detail:{change}}))}
export const getState=()=>structuredClone(s);
export function spend(n){if(s.soap<n)return false;s.soap-=n;save();return true}
export function addSoap(n){s.soap+=n;save()}
export function addCards(a){a.forEach(c=>s.collection[c.id]=(s.collection[c.id]||0)+1);s.packs++;save("collection")}
export function addToDeck(id){if(CARDS.find(c=>c.id===id)?.cardType==="Minion")return false;let n=s.collection[id]||0;if(!n||s.deck.includes(id)||s.deck.length>=STARTER_IDS.length)return false;s.deck.push(id);save("deck");return true}
export function removeFromDeck(id){let i=s.deck.indexOf(id);if(i>=0){s.deck.splice(i,1);save("deck")}}
export function clearDeck(){s.deck=[];save("deck")}
export function win(){s.wins++;addSoap(60)}
