import{getState,spend,win}from"./state/playerState.js";
import{initShop}from"./ui/shopUI.js";
import{initDeckBuilder,renderCollection}from"./ui/deckBuilder.js";
import{createBattle,playCard,attack,endTurn,cardById}from"./game/battleEngine.js";
window.duckSpend=spend;
const $=s=>document.querySelector(s);
let game=null,battleStarted=false,paidWin=false,selectedUnit=null;
function refresh(){const s=getState();$("#soap").textContent=s.soap;$("#owned-count").textContent=Object.values(s.collection).reduce((a,b)=>a+b,0);$("#win-count").textContent=s.wins;$("#pack-count").textContent=s.packs;renderCollection(document.querySelector(".filter.active")?.dataset.filter||"all")}
function showBattleError(err){const el=$("#battle-message");if(el)el.textContent="Battle couldn't start: "+(err?.message||String(err));console.error("Duck Fight battle error",err)}
function go(n){document.querySelectorAll(".screen").forEach(x=>x.classList.toggle("active",x.id===n));document.querySelectorAll(".nav").forEach(x=>x.classList.toggle("active",x.dataset.go===n));const view=$("#view");view.scrollTop=0;if(n==="battle"&&!battleStarted){try{startBattle()}catch(err){battleStarted=false;showBattleError(err)}}}
document.addEventListener("click",e=>{const b=e.target.closest("[data-go]");if(b){e.preventDefault();go(b.dataset.go)}});
window.addEventListener("playerstate",refresh);
initShop({onState:refresh});initDeckBuilder();refresh();
function startBattle(){const saved=getState();const validDeck=(Array.isArray(saved.deck)?saved.deck:[]).filter(id=>cardById(id));game=createBattle(validDeck);battleStarted=true;paidWin=false;selectedUnit=null;drawBattle()}
function drawBattle(){
 if(!game)return;
 $("#player-hp").textContent=game.player.hp+" ♥";$("#enemy-hp").textContent=game.enemy.hp+" ♥";
 $("#player-bubbles").textContent="🫧 "+game.player.b+" / "+game.player.maxB;$("#enemy-bubbles").textContent="🫧 "+game.enemy.b+" / "+game.enemy.maxB;
 $("#turn-label").textContent="TURN "+game.turn;$("#battle-message").textContent=game.log||"Your turn. Play a duck!";
 for(const side of ["player","enemy"]){const target=$(side==="player"?"#player-board":"#enemy-board");target.innerHTML=game[side].board.map((u,i)=>'<button type="button" class="unit '+(side==="enemy"?"enemy":"")+(selectedUnit===i&&side==="player"?" selected":"")+'" data-side="'+side+'" data-unit="'+i+'"><b>'+u.name+'</b><span>⚔ '+u.attack+' · ♥ '+u.hp+'</span></button>').join("")}
 $("#player-board").querySelectorAll("[data-unit]").forEach(b=>b.addEventListener("click",()=>{if(game.over)return;selectedUnit=Number(b.dataset.unit);$("#battle-message").textContent="Duck selected. Tap an enemy duck to attack, or tap it again to go direct if the enemy board is clear.";drawBattle()}));
 $("#enemy-board").querySelectorAll("[data-unit]").forEach(b=>b.addEventListener("click",()=>{if(game.over||selectedUnit===null)return;const ok=attack(game,"player",selectedUnit,Number(b.dataset.unit));selectedUnit=null;if(ok)drawBattle()}));
 const hand=$("#hand");hand.innerHTML=game.player.hand.map((id,i)=>{const c=cardById(id);return '<button type="button" class="hand-card" data-hand="'+i+'" '+(!c||game.player.b<c.cost||game.player.board.length>=3||game.over?"disabled":"")+'><img src="'+(c?.front||"./assets/cards/card-back.jpg")+'" alt=""><b>'+(c?.name||"Unknown duck")+'</b><small>'+(c?.cost??"?")+' 🫧 · '+(c?.attack??"?")+'/'+(c?.health??"?")+'</small></button>'}).join("");
 hand.querySelectorAll("[data-hand]").forEach(b=>b.addEventListener("click",()=>{if(playCard(game,"player",Number(b.dataset.hand))){selectedUnit=null;drawBattle()}}));
 if(game.over){$("#end-turn").textContent="MATCH OVER";$("#end-turn").disabled=true;if(game.enemy.hp<=0&&!paidWin){paidWin=true;win();refresh()}}else{$("#end-turn").textContent="END TURN →";$("#end-turn").disabled=false}
}
function restartBattle(){battleStarted=false;startBattle();$("#end-turn").disabled=false}
$("#new-match").addEventListener("click",()=>{try{restartBattle()}catch(err){showBattleError(err)}});
$("#end-turn").addEventListener("click",()=>{try{if(!game||game.over)return;selectedUnit=null;endTurn(game);drawBattle()}catch(err){showBattleError(err)}});
