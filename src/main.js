import{getState,spend,win}from"./state/playerState.js";
import{initShop}from"./ui/shopUI.js";
import{initDeckBuilder,renderCollection}from"./ui/deckBuilder.js";
import{createBattle,playCard,attack,endTurn,cardById}from"./game/battleEngine.js";
window.duckSpend=spend;
const $=s=>document.querySelector(s);
let game=null,battleStarted=false,paidWin=false,selectedUnit=null,battle3d=null,battle3dLoading=false;const pending3d=[];
function refresh(){const s=getState();$("#soap").textContent=s.soap;$("#owned-count").textContent=Object.values(s.collection).reduce((a,b)=>a+b,0);$("#win-count").textContent=s.wins;$("#pack-count").textContent=s.packs;renderCollection(document.querySelector(".filter.active")?.dataset.filter||"all")}
function showBattleError(err){const el=$("#battle-message");if(el)el.textContent="Battle couldn't start: "+(err?.message||String(err));console.error("Duck Fight battle error",err)}
function go(n){document.querySelectorAll(".screen").forEach(x=>x.classList.toggle("active",x.id===n));document.querySelectorAll(".nav").forEach(x=>x.classList.toggle("active",x.dataset.go===n));const view=$("#view");view.scrollTop=0;if(n==="battle"&&!battleStarted){try{startBattle()}catch(err){battleStarted=false;showBattleError(err)}}}
document.querySelectorAll("[data-go]").forEach(b=>b.addEventListener("click",e=>{e.preventDefault();go(b.dataset.go)}));
window.addEventListener("playerstate",refresh);
initShop({onState:refresh});initDeckBuilder();refresh();
async function ensureBattle3D(){if(battle3d||battle3dLoading)return;battle3dLoading=true;try{const mod=await import("./scene/battleScene.js?v=directpawn1");battle3d=mod.mountBattleScene(document.querySelector(".arena"));if(battle3d){battle3d.setCardTapHandler(handleCardTap);while(pending3d.length){const [method,...args]=pending3d.shift();battle3d[method](...args)}}}catch(err){pending3d.length=0;console.warn("3D layer skipped; battle remains playable",err)}finally{battle3dLoading=false}}
function animate3d(method,...args){if(battle3d){battle3d[method](...args);return}if(battle3dLoading)pending3d.push([method,...args])}
function startBattle(){ensureBattle3D();const saved=getState();const validDeck=(Array.isArray(saved.deck)?saved.deck:[]).filter(id=>cardById(id));game=createBattle(validDeck);battleStarted=true;paidWin=false;selectedUnit=null;drawBattle()}
function autoAttackEmptyRival(){
 if(!game||game.over||game.enemy.board.length!==0)return false;
 let attacked=false;
 for(let i=0;i<game.player.board.length&&!game.over;i++){
  const duck=game.player.board[i];
  if(!duck.attacked){
   if(attack(game,"player",i)){
    animate3d("attackDirect",i);
    attacked=true;
   }
  }
 }
 return attacked;
}
function handleCardTap(side,index){
 if(!game||game.over||!Number.isInteger(index))return;
 if(side==="player"){
  if(!game.player.board[index])return;
  selectedUnit=selectedUnit===index?null:index;
  $("#battle-message").textContent=selectedUnit===null?"Choose a duck to attack.":"Selected "+game.player.board[index].name+". Now tap a rival duck to attack.";
  drawBattle();return;
 }
 if(side==="enemy"&&selectedUnit!==null&&game.player.board[selectedUnit]&&game.enemy.board[index]){
  const attacker=selectedUnit,ok=attack(game,"player",attacker,index);
  if(ok)animate3d("attack","player",attacker,index);
  selectedUnit=null;if(ok){if(game.enemy.board.length===0)autoAttackEmptyRival();drawBattle();}
 }
}
$("#battle").addEventListener("click",e=>{
 const button=e.target?.closest?.("button[data-unit]");
 if(button&&!battle3d)handleCardTap(button.dataset.side,Number(button.dataset.unit));
});
function drawBattle(){
 if(!game)return;
 $("#player-hp").textContent=game.player.hp+" ♥";$("#enemy-hp").textContent=game.enemy.hp+" ♥";
 $("#player-bubbles").textContent="🫧 "+game.player.b+" / "+game.player.maxB;$("#enemy-bubbles").textContent="🫧 "+game.enemy.b+" / "+game.enemy.maxB;
 $("#turn-label").textContent="TURN "+game.turn;$("#battle-message").textContent=game.log||"Your turn. Play a duck!";
 for(const side of ["player","enemy"]){const target=$(side==="player"?"#player-board":"#enemy-board");target.innerHTML=game[side].board.map((u,i)=>'<button type="button" class="unit '+(side==="enemy"?"enemy":"")+'" data-side="'+side+'" data-unit="'+i+'"><b>'+u.name+'</b><span>⚔ '+u.attack+' · ♥ '+u.hp+'</span></button>').join("")}
 animate3d("syncBoard",game.player.board,game.enemy.board);animate3d("selectUnit",selectedUnit);
 $("#player-board").querySelectorAll("[data-unit]").forEach(b=>{b.setAttribute("aria-label","Select "+game.player.board[Number(b.dataset.unit)].name+" to attack");b.setAttribute("aria-pressed",String(selectedUnit===Number(b.dataset.unit)))});
 $("#enemy-board").querySelectorAll("[data-unit]").forEach(b=>{b.setAttribute("aria-label",selectedUnit===null?"Enemy duck":"Attack "+game.enemy.board[Number(b.dataset.unit)].name);});
 const hand=$("#hand");hand.innerHTML=game.player.hand.map((id,i)=>{const c=cardById(id);return '<button type="button" class="hand-card" data-hand="'+i+'" '+(!c||game.player.b<c.cost||game.player.board.length>=6||game.over?"disabled":"")+'><img src="'+(c?.front||"./assets/cards/card-back.jpg")+'" alt=""><b>'+(c?.name||"Unknown duck")+'</b><small>'+(c?.cost??"?")+' 🫧 · '+(c?.attack??"?")+'/'+(c?.health??"?")+'</small></button>'}).join("");
 hand.querySelectorAll("[data-hand]").forEach(b=>b.addEventListener("click",()=>{const card=cardById(game.player.hand[Number(b.dataset.hand)]);if(playCard(game,"player",Number(b.dataset.hand))){selectedUnit=null;if(game.enemy.board.length===0)autoAttackEmptyRival();drawBattle()}}));
 if(game.over){$("#end-turn").textContent="MATCH OVER";$("#end-turn").disabled=true;if(game.enemy.hp<=0&&!paidWin){paidWin=true;win();refresh()}}else{$("#end-turn").textContent="END TURN →";$("#end-turn").disabled=false}
}
function restartBattle(){battleStarted=false;startBattle();$("#end-turn").disabled=false}
$("#new-match").addEventListener("click",()=>{try{restartBattle()}catch(err){showBattleError(err)}});
$("#end-turn").addEventListener("click",()=>{try{if(!game||game.over)return;selectedUnit=null;const oldEnemy=game.enemy.board.length;endTurn(game);if(game.enemy.board.length===0)autoAttackEmptyRival();drawBattle()}catch(err){showBattleError(err)}});
