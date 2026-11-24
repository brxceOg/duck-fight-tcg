export const CARDS=[
{id:"library-mage",name:"Arcane Quacker",set:"Classic Bath",rarity:"Ultra Rare",cost:3,attack:3,health:4,ability:"On Play: draw a card.",front:"./IMG_1429.jpeg"},
{id:"nightmare-duck",name:"The Dread Quacker",set:"Pirate Cove",rarity:"Secret Rare",cost:4,attack:5,health:3,ability:"On Attack: deal 1 extra damage.",front:"./IMG_1430.jpeg"},
{id:"bubble-buddy",name:"Bubble Buddy",set:"Classic Bath",rarity:"Common",cost:1,attack:1,health:3,ability:"A loyal little blocker.",emoji:"🫧"},
{id:"squeaky-scout",name:"Squeaky Scout",set:"Classic Bath",rarity:"Common",cost:1,attack:2,health:2,ability:"Quick on its feet.",emoji:"🐤"},
{id:"rubber-royal",name:"Rubber Royal",set:"Classic Bath",rarity:"Rare",cost:3,attack:2,health:5,ability:"Classic Bath ducks gain +1 Health.",emoji:"👑"},
{id:"captain-quack",name:"Captain Quack",set:"Classic Bath",rarity:"Ultra Rare",cost:4,attack:4,health:4,ability:"A fearless leader.",emoji:"⚓"},
{id:"deckhand-drake",name:"Deckhand Drake",set:"Pirate Cove",rarity:"Common",cost:1,attack:2,health:2,ability:"Ready to sail.",emoji:"🏴‍☠️"},
{id:"periscope-pip",name:"Periscope Pip",set:"Pirate Cove",rarity:"Common",cost:2,attack:1,health:4,ability:"Keeps watch over the crew.",emoji:"🔭"},
{id:"cannon-quacker",name:"Cannon Quacker",set:"Pirate Cove",rarity:"Rare",cost:3,attack:4,health:2,ability:"Hits hard, but lightly armored.",emoji:"💣"},
{id:"treasure-diver",name:"Treasure Diver",set:"Pirate Cove",rarity:"Ultra Rare",cost:4,attack:3,health:5,ability:"Pirate Cove ducks gain +1 Attack.",emoji:"💎"}];
export const DROP={Common:65,Rare:25,"Ultra Rare":8,"Secret Rare":2};
export const rarityClass=r=>r.replace(" ","").toLowerCase();
export function weightedRarity(guaranteed=false){let a=Object.entries(DROP).filter(([r])=>!guaranteed||r!=="Common"),sum=a.reduce((s,x)=>s+x[1],0),n=Math.random()*sum;for(const [r,w] of a){n-=w;if(n<=0)return r}return a[0][0]}
export function rollPack(){return Array.from({length:5},(_,i)=>{let r=weightedRarity(i===4),p=CARDS.filter(c=>c.rarity===r);return p[Math.floor(Math.random()*p.length)]})}