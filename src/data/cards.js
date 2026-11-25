export const CARDS=[
{id:"foxy-duck",name:"Foxy Duck",set:"Pirate’s Revenge",rarity:"Secret Rare",cost:2,attack:3,health:2,ability:"HOOK • Deal 1 damage and make the target untargetable for one turn. Cooldown: 2 turns.",abilityKey:"hook",front:"./Foxy duck.JPG"},
{id:"twilight-duck",name:"Twilight Sparkle Duck",set:"Elements of Harmony",rarity:"Secret Rare",cost:3,attack:2,health:3,ability:"TELEKINESIS • Return an enemy duck to its deck. Twilight is stunned for one turn. Cooldown: 4 turns.",abilityKey:"telekinesis",front:"./IMG_1456.jpeg"},
{id:"misa-duck",name:"Misa Duck",set:"Kira’s Devotion",rarity:"Secret Rare",cost:3,attack:4,health:1,ability:"DEATH NOTE • Mark an enemy duck to die at the end of your turn. Misa is stunned for one turn. Once per battle.",abilityKey:"death-note",front:"./IMG_1469.jpeg"},
{id:"jeff-duck",name:"Jeff the Killer Duck",set:"Nightmare Files",rarity:"Secret Rare",cost:2,attack:2,health:2,ability:"CIRCULAR SLASH • Deal 2 damage to the target and each adjacent enemy duck. Cooldown: 2 turns.",abilityKey:"slash",front:"./IMG_1471.jpeg"},
{id:"basic-rubber-ducky",name:"Basic Rubber Ducky",set:"Bath Basics",rarity:"Common",cost:1,attack:1,health:1,ability:"No special ability.",front:"./IMG_1460.jpeg"},
{id:"nanami-duck",name:"Nanami Duck",set:"Kiss of the Kami",rarity:"Secret Rare",cost:3,attack:1,health:3,ability:"SUMMON TOMOE • Once per battle, summon Tomoe into the closest open slot. Tomoe guards Nanami until he is defeated.",abilityKey:"summon-tomoe",front:"./IMG_1482.jpeg"},
{id:"tomoe-minion",name:"Tomoe",set:"Kiss of the Kami",rarity:"Minion",cardType:"Minion",cost:0,attack:4,health:3,ability:"GUARDIAN • A summoned minion. Protects Nanami from enemy targeting and can attack once per turn.",front:"./IMG_1459.jpeg"},
{id:"finn-duck",name:"Finn the Human Duck",set:"Land of Ooo",rarity:"Secret Rare",cost:4,attack:5,health:4,ability:"SWORD LEAP • Leap onto a targeted enemy and strike for 5 damage. Cooldown: 3 turns.",abilityKey:"sword-leap",front:"./IMG_1474.jpeg"},
{id:"maomao-duck",name:"Maomao Duck",set:"The Apothecary’s Notes",rarity:"Secret Rare",cost:3,attack:1,health:3,ability:"POTION • Cleanse an ally's debuffs, including ability stun, and restore 1 health.",abilityKey:"potion",front:"./IMG_1476.jpeg"},
{id:"tohru-duck",name:"Tohru Duck",set:"Fruits Basket",rarity:"Secret Rare",cost:3,attack:1,health:2,ability:"ONIGIRI FEAST • Heal all your ducks for 2 and give them +3 attack until the end of the turn.",abilityKey:"onigiri",front:"./IMG_1477.jpeg"},
{id:"goku-duck",name:"Goku Duck",set:"Saiyan Legends",rarity:"Secret Rare",cost:5,attack:4,health:5,ability:"KAMEHAMEHA • Deal 10 damage to a targeted enemy. Cooldown: 2 turns. PASSIVE: Gain +1 attack and +1 maximum/current health at the end of every turn.",abilityKey:"kamehameha",passiveKey:"saiyan-growth",front:"./IMG_1480.jpeg"},
{id:"miku-duck",name:"Hatsune Miku Duck",set:"Virtual Pop Star",rarity:"Secret Rare",cost:4,attack:3,health:2,ability:"WORLD IS MINE • Force every enemy duck to dance, stunning them so they cannot attack for 2 turns.",abilityKey:"dance",front:"./IMG_1478.jpeg"},
{id:"library-mage",name:"Arcane Quacker",set:"Classic Bath",rarity:"Ultra Rare",cost:3,attack:3,health:4,ability:"On Play: draw a card."},
{id:"nightmare-duck",name:"The Dread Quacker",set:"Pirate Cove",rarity:"Secret Rare",cost:4,attack:5,health:3,ability:"On Attack: deal 1 extra damage.",front:"./IMG_1430.jpeg"},
{id:"bubble-buddy",name:"Bubble Buddy",set:"Classic Bath",rarity:"Common",cost:1,attack:1,health:3,ability:"A loyal little blocker.",emoji:"🫧"},
{id:"squeaky-scout",name:"Squeaky Scout",set:"Classic Bath",rarity:"Common",cost:1,attack:2,health:2,ability:"Quick on its feet.",emoji:"🐤"},
{id:"rubber-royal",name:"Rubber Royal",set:"Classic Bath",rarity:"Rare",cost:3,attack:2,health:5,ability:"Classic Bath ducks gain +1 Health.",emoji:"👑"},
{id:"captain-quack",name:"Captain Quack",set:"Classic Bath",rarity:"Ultra Rare",cost:4,attack:4,health:4,ability:"A fearless leader.",emoji:"⚓"},
{id:"deckhand-drake",name:"Deckhand Drake",set:"Pirate Cove",rarity:"Common",cost:1,attack:2,health:2,ability:"Ready to sail.",emoji:"🏴‍☠️"},
{id:"periscope-pip",name:"Periscope Pip",set:"Pirate Cove",rarity:"Common",cost:2,attack:1,health:4,ability:"Keeps watch over the crew.",emoji:"🔭"},
{id:"cannon-quacker",name:"Cannon Quacker",set:"Pirate Cove",rarity:"Rare",cost:3,attack:4,health:2,ability:"Hits hard, but lightly armored.",emoji:"💣"},
{id:"treasure-diver",name:"Treasure Diver",set:"Pirate Cove",rarity:"Ultra Rare",cost:4,attack:3,health:5,ability:"Pirate Cove ducks gain +1 Attack.",emoji:"💎"}];
export const BOOSTER_CARDS=CARDS.filter(c=>c.cardType!=="Minion");
export const DROP={Common:65,Rare:25,"Ultra Rare":8,"Secret Rare":2};
export const rarityClass=r=>r.replace(" ","").toLowerCase();
export function weightedRarity(guaranteed=false){let a=Object.entries(DROP).filter(([r])=>!guaranteed||r!=="Common"),sum=a.reduce((s,x)=>s+x[1],0),n=Math.random()*sum;for(const [r,w] of a){n-=w;if(n<=0)return r}return a[0][0]}
export function rollPack(){return Array.from({length:5},(_,i)=>{let r=weightedRarity(i===4),p=BOOSTER_CARDS.filter(c=>c.rarity===r);return p[Math.floor(Math.random()*p.length)]})}
