import{CARDS}from"../data/cards.js";
const shuffle=a=>a.sort(()=>Math.random()-.5);
export const cardById=id=>CARDS.find(c=>c.id===id);
const other=side=>side==="player"?"enemy":"player";
const removeDead=(board)=>board.filter(u=>u.hp>0);
export function createBattle(ids){
 let d=ids.length?ids:CARDS.filter(c=>c.cost<=3).map(c=>c.id);
 return{player:{hp:5,maxB:1,b:1,board:[],hand:shuffle([...d,...d]).slice(0,4)},enemy:{hp:5,maxB:1,b:1,board:[],hand:shuffle([...CARDS,...CARDS].map(c=>c.id)).slice(0,4),deck:[]},turn:1,over:false,log:"Your turn. Play a duck!"}
}
export function playCard(g,side,i){
 let p=g[side],c=cardById(p.hand[i]);
 if(g.over||!c||p.b<c.cost||p.board.length>=6)return false;
 p.b-=c.cost;p.hand.splice(i,1);
 p.board.push({...c,hp:c.health,attacked:false,stunnedUntil:0,abilityReadyAt:0,untargetableUntil:0,markedForDeath:false,abilityUsed:false});
 if(c.id==="library-mage")p.hand.push(shuffle(CARDS.map(x=>x.id))[0]);
 g.log=c.name+" joins the flock!";return true
}
export function attack(g,side,i,t=0){
 let p=g[side],o=g[other(side)],u=p.board[i];
 if(!u||u.attacked||g.over||g.turn<(u.stunnedUntil||0))return false;
 if(o.board.length){
  let v=o.board[t];if(!v||g.turn<(v.untargetableUntil||0))return false;
  v.hp-=u.attack;if(v.hp<=0){g.log=v.name+" was knocked out!";o.board.splice(t,1)}
 }else{o.hp=Math.max(0,o.hp-u.attack);g.log="Direct hit! "+u.attack+" Heart damage."}
 u.attacked=true;
 if(o.hp<=0){g.over=true;g.log=side==="player"?"YOU WIN! +60 Soap":"The rival wins this round!"}
 return true
}
export function canUseAbility(g,side,index){
 const u=g?.[side]?.board?.[index];if(!u||g.over||g.turn<(u.stunnedUntil||0)||g.turn<(u.abilityReadyAt||0))return false;
 if(u.abilityKey==="death-note"&&u.abilityUsed)return false;
 return !!u.abilityKey&&u.abilityKey!=="";
}
export function useAbility(g,side,index,targetIndex){
 const p=g[side],o=g[other(side)],u=p.board[index],v=o.board[targetIndex];
 if(!canUseAbility(g,side,index)||!v||g.turn<(v.untargetableUntil||0))return{ok:false};
 const key=u.abilityKey;let animation=key;
 if(key==="hook"){
  v.hp-=1;v.untargetableUntil=g.turn+1;u.abilityReadyAt=g.turn+2;
  if(v.hp<=0)o.board.splice(targetIndex,1);
  g.log=u.name+" hooks "+v.name+"! It takes 1 damage and is pinned.";
 }else if(key==="telekinesis"){
  o.board.splice(targetIndex,1);o.deck??=[];o.deck.push(v.id);u.stunnedUntil=g.turn+2;u.abilityReadyAt=g.turn+4;
  g.log=u.name+" lifts "+v.name+" with magic and sends it back to the rival deck!";
 }else if(key==="death-note"){
  v.markedForDeath=true;u.stunnedUntil=g.turn+2;u.abilityUsed=true;
  g.log=v.name+" has been marked for death!";
 }else if(key==="slash"){
  const targetRow=Math.floor(targetIndex/3),targetCol=targetIndex%3;
  const hit=[];
  o.board.forEach((unit,i)=>{const row=Math.floor(i/3),col=i%3;if(Math.abs(row-targetRow)+Math.abs(col-targetCol)<=1){unit.hp-=2;hit.push(unit.name)}});
  o.board=removeDead(o.board);u.abilityReadyAt=g.turn+2;
  g.log="Jeff's circular slash hits "+hit.join(", ")+" for 2 damage!";
 }else return{ok:false};
 if(o.hp<=0){g.over=true;g.log="YOU WIN! +60 Soap"}
 return{ok:true,animation,targetIndex};
}
export function endTurn(g){
 if(g.over)return;
 // Misa's mark resolves at the end of the activating player's turn.
 for(const side of ["player","enemy"]){const p=g[side];for(let i=p.board.length-1;i>=0;i--)if(p.board[i].markedForDeath){g.log=p.board[i].name+" was claimed by the Death Note!";p.board.splice(i,1)}}
 g.turn++;
 for(const side of ["player","enemy"]){let p=g[side];p.maxB=Math.min(10,p.maxB+1);p.b=p.maxB;p.board.forEach(u=>u.attacked=false)}
 const p=g.enemy;
 let choice=p.hand.map((id,i)=>({c:cardById(id),i})).filter(x=>x.c.cost<=p.b&&p.board.length<6).sort((a,b)=>b.c.attack-a.c.attack)[0];
 if(choice)playCard(g,"enemy",choice.i);
 p.board.forEach((u,i)=>{if(!u.attacked&&g.turn>=(u.stunnedUntil||0))attack(g,"enemy",i,0)});
 if(!g.over)g.log="Your turn. Make your move!";
}
