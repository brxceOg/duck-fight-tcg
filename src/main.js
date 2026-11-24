import{getState,spend,win}from"./state/playerState.js";
import{initShop}from"./ui/shopUI.js";
import{initDeckBuilder,renderCollection}from"./ui/deckBuilder.js";
import{createBattle,playCard,attack,endTurn,cardById}from"./game/battleEngine.js";
window.duckSpend=spend;
const $=s=>document.querySelector(s);
let game=null, battleStarted=false, paidWin=false;
function refresh(){
 const s=getState();
 $("#soap").textContent=s.soap;
 $("#owned-count").textContent=Object.values(s.collection).reduce((a,b)=>a+b,0);
 $("#win-count").textContent=s.wins;
 $("#pack-count").textContent=s.packs;
 renderCollection(document.querySelector(".filter.active")?.dataset.filter||"all");
}
function go(n){
 document.querySelectorAll(".screen").forEach(x=>x.classList.toggle("active",x.id===n));
 document.querySelectorAll(".nav").forEach(x=>x.classList.toggle("active",x.dataset.go===n));
 const view=$("#view"); view.scrollTop=0;
 if(n==="battle"&&!battleStarted)startBattle();
}
document.addEventListener("click",e=>{
 const b=e.target.closest("[data-go]");
 if(b){e.preventDefault();go(b.dataset.go)}
});
window.addEventListener("playerstate",refresh);
initShop({onState:refresh});
initDeckBuilder();
refresh();
function startBattle(){
 game=createBattle(getState().deck);
 battleStarted=true;paidWin=false;
 drawBattle();
}
function drawBattle(){
 if(!game)return;
 $("#player-hp").textContent=game.player.hp+" ♥";
 $("#enemy-hp").textContent=game.enemy.hp+" ♥";
 $("#player-bubbles").textContent="🫧 "+game.player.b+" / "+game.player.maxB;
 $("#enemy-bubbles").textContent="🫧 "+game.enemy.b+" / "+game.enemy.maxB;
 $("#turn-label").textContent="TURN "+game.turn;
 $("#battle-message").textContent=game.log;
 for(const side of ["player","enemy"]){
  const target=$(side==="player"?"#player-board":"#enemy-board");
  target.innerHTML=game[side].board.map((u,i)=>'<div class="unit '+(side==="enemy"?"enemy":"")+'"><b>'+u.name+'</b><span>⚔ '+u.attack+' · ♥ '+u.hp+'</span></div>').join("");
 }
 const hand=$("#hand");
 hand.innerHTML=game.player.hand.map((id,i)=>{
  const c=cardById(id);
  return '<button class="hand-card" data-hand="'+i+'" '+(!c||game.player.b<c.cost||game.player.board.length>=3||game.over?"disabled":"")+'><img src="'+(c?.front||"./assets/cards/card-back.jpg")+'" alt=""><b>'+c?.name+'</b><small>'+c?.cost+' 🫧 · '+c?.attack+'/'+c?.health+'</small></button>';
 }).join("");
 hand.querySelectorAll("[data-hand]").forEach(b=>b.addEventListener("click",()=>{
  if(playCard(game,"player",Number(b.dataset.hand)))drawBattle();
 }));
 if(game.over){
  $("#end-turn").textContent="MATCH OVER";
  $("#end-turn").disabled=true;
  if(game.enemy.hp<=0&&!paidWin){paidWin=true;win();refresh()}
 }else{
  $("#end-turn").textContent="END TURN →";
  $("#end-turn").disabled=false;
 }
}
function restartBattle(){battleStarted=false;startBattle();$("#end-turn").disabled=false}
$("#new-match").addEventListener("click",restartBattle);
$("#end-turn").addEventListener("click",()=>{
 if(!game||game.over)return;
 endTurn(game);
 drawBattle();
});
