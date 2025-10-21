const words=[
  "time","year","people","way","day","man","thing","woman","life","child","world","school","state","family","student","group","country","problem","hand","part","place","case","week","company","system","program","question","work","government","number","night","point","home","water","room","mother","area","money","story","fact","month","lot","right","study","book","eye","job","word","business","issue","side","kind","head","house","service","friend","father","power","hour","game","line","end","member","law","car","city","community","name","president","team","minute","idea","kid","body","information","back","parent","face","others","level","office","door","health","person","art","war","history","party","result","change","morning","reason","research","girl","guy","moment","air","teacher","force","education",
  "phone","music","voice","paper","tree","fire","street","heart","light","brother","sister","future","window","wall","space","food","table","chair","sound","town","horse","color","church","king","court","garden","field","river","market","language","letter","report","movie","video","photo","road","travel","nature","mountain","ocean","island","weather","summer","winter","spring","season","dream","hope","plan","purpose","method","design","project","subject","record","leader","guide","choice","price","value","style","culture","future","energy","planet","sky","cloud","animal","plant","bird","fish","insect","flower","forest","desert","beach","stone","metal","paper","glass","wood","plastic","computer","phone","screen","internet","website","software","network","message","email","picture","camera","image","color","shape","size","weight","speed","distance","height","width","length","volume","amount","total","average","minimum","maximum","percent","degree","measure","scale"
];

const charGroups={
  lower:"abcdefghijklmnopqrstuvwxyz".split(""),
  upper:"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split(""),
  numbers:"0123456789".split(""),
  special:"!@#$%^&*()-_=+[]{}|;:,.<>?/~`".split("")
};

let characters=[];

const MAX_WORDS=5;
const PADDING=40;
const SPAWN_INTERVAL=2000;

let activeWords=[];
let score=0;
let spawnTimer=null;
let easyMode=false;

const container=document.getElementById("wordContainer");
const input=document.getElementById("input");
const scoreEl=document.getElementById("score");
const feedback=document.getElementById("feedback");
const resetBtn=document.getElementById("resetBtn");
const modeBtn=document.getElementById("modeBtn");
const modeText=document.getElementById("modeText");
const charOptions=document.getElementById("charOptions");
const optLower=document.getElementById("optLower");
const optUpper=document.getElementById("optUpper");
const optNumbers=document.getElementById("optNumbers");
const optSpecial=document.getElementById("optSpecial");

function rand(min,max){return Math.floor(Math.random()*(max-min))+min}

function buildCharacterPool(){
  characters=[];
  if(optLower.checked)characters.push(...charGroups.lower);
  if(optUpper.checked)characters.push(...charGroups.upper);
  if(optNumbers.checked)characters.push(...charGroups.numbers);
  if(optSpecial.checked)characters.push(...charGroups.special);
  
  if(characters.length===0){
    optLower.checked=true;
    characters.push(...charGroups.lower);
  }
}

function getSpawnedChars(){
  return activeWords.map(w=>w.text);
}

function randomWord(){
  if(easyMode){
    const spawned=getSpawnedChars();
    const available=characters.filter(c=>!spawned.includes(c));
    
    if(available.length===0){
      return characters[rand(0,characters.length)];
    }
    
    return available[rand(0,available.length)];
  }else{
    const spawnedWords=activeWords.map(w=>w.text.toLowerCase());
    const available=words.filter(w=>!spawnedWords.includes(w.toLowerCase()));
    
    if(available.length===0){
      return words[rand(0,words.length)];
    }
    
    return available[rand(0,available.length)];
  }
}

function getRectWithPadding(x,y,w,h){
  return{x:x-PADDING,y:y-PADDING,w:w+PADDING*2,h:h+PADDING*2};
}

function rectsOverlap(r1,r2){
  return!(r1.x+r1.w<r2.x||r2.x+r2.w<r1.x||r1.y+r1.h<r2.y||r2.y+r2.h<r1.y);
}

function findNonOverlappingPosition(width,height){
  const containerRect=container.getBoundingClientRect();
  const borderPadding=60;
  const maxX=containerRect.width-width-borderPadding;
  const maxY=containerRect.height-height-borderPadding;
  if(maxX<borderPadding||maxY<borderPadding)return null;
  
  let attempts=0;
  while(attempts<100){
    const x=rand(borderPadding,maxX);
    const y=rand(borderPadding,maxY);
    const testRect=getRectWithPadding(x,y,width,height);
    
    let overlap=false;
    for(const aw of activeWords){
      const awRect=getRectWithPadding(aw.x,aw.y,aw.width,aw.height);
      if(rectsOverlap(testRect,awRect)){
        overlap=true;
        break;
      }
    }
    if(!overlap)return{x,y};
    attempts++;
  }
  return null;
}

function renderWord(wordObj,typed){
  const text=wordObj.text;
  const lower=text.toLowerCase();
  const typedLower=typed.toLowerCase();
  let html="";
  
  let matches=lower.startsWith(typedLower)&&typedLower.length>0;
  
  for(let i=0;i<text.length;i++){
    const ch=text[i];
    if(matches&&i<typedLower.length){
      html+=`<span class="char good">${escapeHTML(ch)}</span>`;
    }else{
      html+=`<span class="char">${escapeHTML(ch)}</span>`;
    }
  }
  wordObj.el.innerHTML=html;
}

function escapeHTML(s){
  const div=document.createElement("div");
  div.textContent=s;
  return div.innerHTML;
}

function spawnWord(){
  if(activeWords.length>=MAX_WORDS)return;
  
  const text=randomWord();
  const el=document.createElement("div");
  el.className="word";
  el.style.opacity="0";
  container.appendChild(el);
  
  const wordObj={text,x:0,y:0,width:0,height:0,el};
  renderWord(wordObj,"");
  
  const rect=el.getBoundingClientRect();
  const width=rect.width;
  const height=rect.height;
  
  const pos=findNonOverlappingPosition(width,height);
  if(!pos){
    container.removeChild(el);
    return;
  }
  
  el.style.left=pos.x+"px";
  el.style.top=pos.y+"px";
  el.style.opacity="1";
  
  wordObj.x=pos.x;
  wordObj.y=pos.y;
  wordObj.width=width;
  wordObj.height=height;
  
  activeWords.push(wordObj);
}

function createFirework(x,y){
  const colors=["#22c55e","#86efac","#4ade80","#10b981","#fbbf24"];
  const particleCount=20;
  
  for(let i=0;i<particleCount;i++){
    const particle=document.createElement("div");
    particle.className="firework-particle";
    particle.style.left=x+"px";
    particle.style.top=y+"px";
    particle.style.background=colors[Math.floor(Math.random()*colors.length)];
    
    const angle=(Math.PI*2*i)/particleCount;
    const velocity=rand(100,200);
    const tx=Math.cos(angle)*velocity;
    const ty=Math.sin(angle)*velocity;
    
    particle.style.setProperty("--tx",tx+"px");
    particle.style.setProperty("--ty",ty+"px");
    
    container.appendChild(particle);
    
    setTimeout(()=>{
      if(particle.parentNode){
        container.removeChild(particle);
      }
    },800);
  }
}

function removeWord(wordObj){
  const idx=activeWords.indexOf(wordObj);
  if(idx===-1)return;
  
  const rect=wordObj.el.getBoundingClientRect();
  const containerRect=container.getBoundingClientRect();
  const x=rect.left+rect.width/2-containerRect.left;
  const y=rect.top+rect.height/2-containerRect.top;
  
  createFirework(x,y);
  
  wordObj.el.classList.add("matched");
  setTimeout(()=>{
    if(wordObj.el.parentNode){
      container.removeChild(wordObj.el);
    }
  },400);
  
  activeWords.splice(idx,1);
  
  score+=1;
  scoreEl.textContent=String(score);
  scoreEl.classList.remove("pulse");
  void scoreEl.offsetWidth;
  scoreEl.classList.add("pulse");
  
  feedback.textContent="Nice!";
  setTimeout(()=>{if(feedback.textContent==="Nice!")feedback.textContent=""},800);
}

input.addEventListener("input",()=>{
  const typed=input.value.trim();
  
  if(easyMode){
    if(!typed)return;
    const lastChar=typed[typed.length-1];
    
    for(const wordObj of activeWords){
      if(wordObj.text===lastChar){
        removeWord(wordObj);
        input.value="";
        spawnWord();
        break;
      }
    }
  }else{
    for(const wordObj of activeWords){
      renderWord(wordObj,typed);
    }
    
    if(!typed)return;
    
    const typedLower=typed.toLowerCase();
    for(const wordObj of activeWords){
      if(wordObj.text.toLowerCase()===typedLower){
        removeWord(wordObj);
        input.value="";
        for(const w of activeWords){
          renderWord(w,"");
        }
        spawnWord();
        break;
      }
    }
  }
});

function reset(){
  for(const wordObj of activeWords){
    if(wordObj.el.parentNode){
      container.removeChild(wordObj.el);
    }
  }
  activeWords=[];
  score=0;
  scoreEl.textContent="0";
  input.value="";
  feedback.textContent="";
  startGame();
}

function startGame(){
  if(spawnTimer)clearInterval(spawnTimer);
  
  for(let i=0;i<Math.min(3,MAX_WORDS);i++){
    setTimeout(()=>spawnWord(),i*300);
  }
  
  spawnTimer=setInterval(()=>{
    if(activeWords.length<MAX_WORDS){
      spawnWord();
    }
  },SPAWN_INTERVAL);
}

function toggleMode(){
  easyMode=!easyMode;
  modeText.textContent=easyMode?"Easy":"Normal";
  input.placeholder=easyMode?"Type any character...":"Type any word...";
  
  if(easyMode){
    charOptions.classList.remove("hidden");
    buildCharacterPool();
  }else{
    charOptions.classList.add("hidden");
  }
  
  reset();
}

function onCharOptionChange(){
  buildCharacterPool();
  reset();
}

resetBtn.addEventListener("click",reset);
modeBtn.addEventListener("click",toggleMode);
optLower.addEventListener("change",onCharOptionChange);
optUpper.addEventListener("change",onCharOptionChange);
optNumbers.addEventListener("change",onCharOptionChange);
optSpecial.addEventListener("change",onCharOptionChange);

window.addEventListener("load",()=>{
  buildCharacterPool();
  startGame();
  setTimeout(()=>input.focus(),100);
});
