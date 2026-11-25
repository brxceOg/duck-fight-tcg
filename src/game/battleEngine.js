import{CARDS,BOOSTER_CARDS}from"../data/cards.js";
let instanceSequence=0;
const shuffle=a=>a.sort(()=>Math.random()-.5);
export const cardById=id=>CARDS.find(c=>c.id===id);
const other=side=>side==="player"?"enemy":"player";
const removeDead=board=>board.filter(u=>u.hp>0);
const guardedTarget=(board,index)=>{
 const target=board[index];if(!target)return index;
 const guardIndex=board.findIndex(u=>u.cardType==="Minion"&&u.protectsUid===target.uid&&u.hp>0);
 return guardIndex>=0?guardIndex:index;
};
const newUnit=(card,side,extra={})=>({...card,uid:side+"-"+(++instanceSequence),hp:card.health,maxHp:card.health,attacked:false,stunnedUntil:0,abilityReadyAt:0,untargetableUntil:0,markedForDeath:false,abilityUsed:false,side,slot:0,summonedAtTurn:0,...extra});
const firstOpenSlot=board=>[0,1,2,3,4,5].find(slot=>!board.some(u=>u.slot===slot));
const closestOpenSlot=(board,anchorSlot)=>{
 const occupied=new Set(board.map(u=>u.slot)),open=[0,1,2,3,4,5].filter(slot=>!occupied.has(slot));
 const row=slot=>Math.floor(slot/3),col=slot=>slot%3;
 return open.sort((a,b)=>{
  const da=Math.abs(row(a)-row(anchorSlot))+Math.abs(col(a)-col(anchorSlot));
  const db=Math.abs(row(b)-row(anchorSlot))+Math.abs(col(b)-col(anchorSlot));
  return da-db||a-b;
 })[0];
};
export function createBattle(ids){
 const valid=(Array.isArray(ids)?ids:[]).filter(id=>{const c=cardById(id);return c&&c.cardType!=="Minion"});
 const d=valid.length?valid:BOOSTER_CARDS.filter(c=>c.cost<=3).map(c=>c.id);
 const openingHand=shuffle([...d,...d]).slice(0,4);
 return{player:{hp:5,maxB:1,b:1,board:[],hand:openingHand},enemy:{hp:5,maxB:1,b:1,board:[],hand:shuffle([...BOOSTER_CARDS,...BOOSTER_CARDS].map(c=>c.id)).slice(0,4),deck:[]},turn:1,over:false,deathNoteUsed:false,nanamiSummonUsed:false,log:"Your turn. Play a duck!"}
}
export function playCard(g,side,i){
 let p=g[side],c=cardById(p.hand[i]);
 if(g.over||!c||c.cardType==="Minion"||p.b<c.cost||p.board.length>=6)return false;
 p.b-=c.cost;p.hand.splice(i,1);
 p.board.push(newUnit(c,side,{slot:firstOpenSlot(p.board)}));
 if(c.id==="library-mage")p.hand.push(shuffle(BOOSTER_CARDS.map(x=>x.id))[0]);
 g.log=c.name+" joins the flock!";return true
}
export function attack(g,side,i,t=0){
 let p=g[side],o=g[other(side)],u=p.board[i];
 if(!u||u.attacked||g.over||g.turn<(u.stunnedUntil||0))return false;
 if(o.board.length){
  const resolved=guardedTarget(o.board,t);let v=o.board[resolved];
  if(!v||g.turn<(v.untargetableUntil||0))return false;
  v.hp-=u.attack;g.lastTargetIndex=resolved;
  if(v.hp<=0){g.log=v.name+" was knocked out!";o.board.splice(resolved,1)}
 }else{o.hp=Math.max(0,o.hp-u.attack);g.lastTargetIndex=-1;g.log="Direct hit! "+u.attack+" Heart damage."}
 u.attacked=true;
 if(o.hp<=0){g.over=true;g.log=side==="player"?"YOU WIN! +60 Soap":"The rival wins this round!"}
 return true
}
export function canUseAbility(g,side,index){
 const u=g?.[side]?.board?.[index];if(!u||g.over||!u.abilityKey||g.turn<(u.stunnedUntil||0)||g.turn<(u.abilityReadyAt||0))return false;
 if(u.abilityKey==="death-note"&&g.deathNoteUsed)return false;
 if(u.abilityKey==="summon-tomoe"&&(g.nanamiSummonUsed||g[side].board.length>=6))return false;
 return true;
}
export function useAbility(g,side,index,targetIndex){
 const p=g[side],o=g[other(side)],u=p.board[index];
 if(!canUseAbility(g,side,index))return{ok:false};
 const key=u.abilityKey,enemyTarget=["hook","telekinesis","death-note","slash","sword-leap","kamehameha"].includes(key),allyTarget=key==="potion";
 let resolvedIndex=targetIndex,v=null,targetSide=null;
 if(enemyTarget){
  if(!Number.isInteger(targetIndex)||!o.board[targetIndex])return{ok:false};
  resolvedIndex=guardedTarget(o.board,targetIndex);v=o.board[resolvedIndex];targetSide=other(side);
  if(g.turn<(v.untargetableUntil||0))return{ok:false};
 }else if(allyTarget){
  if(!Number.isInteger(targetIndex)||!p.board[targetIndex])return{ok:false};
  v=p.board[targetIndex];targetSide=side;
 }
 let animation={type:key,ownerSide:side};
 if(key==="hook"){
  v.hp-=1;v.untargetableUntil=g.turn+2;u.abilityReadyAt=g.turn+3;
  if(v.hp<=0)o.board.splice(resolvedIndex,1);
  g.log=u.name+" hooks "+v.name+"! It takes 1 damage and is pinned.";
 }else if(key==="telekinesis"){
  o.board.splice(resolvedIndex,1);o.deck??=[];o.deck.push(v.id);u.stunnedUntil=g.turn+2;u.abilityReadyAt=g.turn+5;
  g.log=u.name+" lifts "+v.name+" with magic and sends it back to the rival deck!";
 }else if(key==="death-note"){
  v.markedForDeath=true;u.stunnedUntil=g.turn+2;g.deathNoteUsed=true;u.abilityUsed=true;
  g.log=v.name+" has been marked for death!";
 }else if(key==="slash"){
  const targetRow=Math.floor(resolvedIndex/3),targetCol=resolvedIndex%3,hit=[];
  o.board.forEach((unit,i)=>{const row=Math.floor(i/3),col=i%3;if(Math.abs(row-targetRow)+Math.abs(col-targetCol)<=1){unit.hp-=2;hit.push(unit.name)}});
  o.board=removeDead(o.board);u.abilityReadyAt=g.turn+2;
  g.log="Jeff's circular slash hits "+hit.join(", ")+" for 2 damage!";
 }else if(key==="summon-tomoe"){
  const minion=cardById("tomoe-minion");if(!minion||p.board.length>=6)return{ok:false};
  const slotIndex=closestOpenSlot(p.board,u.slot??index);
  if(slotIndex===undefined)return{ok:false};
  const summoned=newUnit(minion,side,{protectsUid:u.uid,summonedAtTurn:g.turn,slot:slotIndex});
  p.board.push(summoned);g.nanamiSummonUsed=true;u.abilityUsed=true;
  animation={type:"summon-tomoe",ownerSide:side,slotIndex,summonedUid:summoned.uid};
  g.log="Tomoe descends from the sky and takes his place beside Nanami!";
  resolvedIndex=slotIndex;targetSide=side;
 }else if(key==="sword-leap"){
  v.hp-=5;u.abilityReadyAt=g.turn+4;
  if(v.hp<=0)o.board.splice(resolvedIndex,1);
  g.log="Finn leaps in with a sword strike for 5 damage!";
 }else if(key==="potion"){
  v.hp=Math.min(v.maxHp??v.health,v.hp+1);v.stunnedUntil=0;v.untargetableUntil=0;v.markedForDeath=false;
  v.attackDebuff=0;u.abilityReadyAt=g.turn+1;
  g.log="Maomao's potion cleanses "+v.name+" and restores 1 health!";
 }else if(key==="onigiri"){
  p.board.forEach(unit=>{unit.hp=Math.min(unit.maxHp??unit.health,unit.hp+2);unit.attack+=3;unit.temporaryAttackBonus=(unit.temporaryAttackBonus||0)+3});
  u.abilityReadyAt=g.turn+1;
  animation={type:key,ownerSide:side,targetIndices:p.board.map((_,i)=>i)};
  g.log="Tohru shares onigiri! Your flock heals 2 and gains +3 attack this turn.";
 }else if(key==="kamehameha"){
  v.hp-=10;u.abilityReadyAt=g.turn+3;
  if(v.hp<=0)o.board.splice(resolvedIndex,1);
  g.log="Goku unleashes a Kamehameha for 10 damage!";
 }else if(key==="dance"){
  o.board.forEach(unit=>{unit.stunnedUntil=Math.max(unit.stunnedUntil||0,g.turn+4)});
  u.abilityReadyAt=g.turn+1;
  animation={type:key,ownerSide:side,targetIndices:o.board.map((_,i)=>i)};
  g.log="Miku's song takes over the arena! Every enemy duck dances and cannot attack for 2 turns.";
 }else return{ok:false};
 if(o.hp<=0){g.over=true;g.log="YOU WIN! +60 Soap"}
 return{ok:true,animation,targetIndex:resolvedIndex,targetSide};
}
export function endTurn(g){
 if(g.over)return;
 for(const side of ["player","enemy"]){const p=g[side];for(let i=p.board.length-1;i>=0;i--)if(p.board[i].markedForDeath){g.log=p.board[i].name+" was claimed by the Death Note!";p.board.splice(i,1)}}
 for(const side of ["player","enemy"]){const p=g[side];p.board.forEach(u=>{
  if(u.temporaryAttackBonus){u.attack=Math.max(0,u.attack-u.temporaryAttackBonus);u.temporaryAttackBonus=0}
  if(u.passiveKey==="saiyan-growth"){u.attack+=1;u.hp+=1;u.maxHp=(u.maxHp??u.health)+1;u.health=(u.health??u.maxHp)+1}
 })}
 g.turn++;
 for(const side of ["player","enemy"]){let p=g[side];p.maxB=Math.min(10,p.maxB+1);p.b=p.maxB;p.board.forEach(u=>u.attacked=false)}
 const p=g.enemy;
 let choice=p.hand.map((id,i)=>({c:cardById(id),i})).filter(x=>x.c&&x.c.cardType!=="Minion"&&x.c.cost<=p.b&&p.board.length<6).sort((a,b)=>b.c.attack-a.c.attack)[0];
 if(choice)playCard(g,"enemy",choice.i);
 p.board.forEach((u,i)=>{if(!u.attacked&&g.turn>=(u.stunnedUntil||0))attack(g,"enemy",i,0)});
 if(!g.over)g.log="Your turn. Make your move!";
}
