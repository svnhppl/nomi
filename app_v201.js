const STORAGE_KEY="nomiSettingsV201";
const DEFAULTS={duration:1,inhale:4.5,exhale:6.5,showTimer:true,showPhaseText:true,sound:true,fullscreen:false,theme:"ocean"};
const audioFiles={inhale:"./einatmen.mp3?v=201",exhale:"./ausatmen.mp3?v=201",end:"./ende.mp3?v=201"};
const shareWebUrl="https://svnhppl.github.io/nomi/";
const shareChromeUrl="https://chromewebstore.google.com/detail/lmfjbidhgcajjokbihfjeacleflmgmfl";
const shareSubject="Nomi Atemmeditation – kostenlose Chrome-Erweiterung";
const shareBody=`Hallo,

ich möchte dir Nomi empfehlen – eine kostenlose Atemmeditation.

Nomi hilft dabei, für einen Moment zur Ruhe zu kommen und Ein- und Ausatmung bewusst zu begleiten. Die Anwendung ist bewusst schlicht gestaltet und konzentriert sich ganz auf die Atmung – ohne Werbung, Anmeldung oder Ablenkungen.

Du kannst Nomi direkt im Browser nutzen:

Als Webseite:
${shareWebUrl}

Oder als Chrome-Erweiterung:
${shareChromeUrl}

Viele Grüße`;

let settings=loadSettings();
let animationFrameId=null;
let sessionEndsAt=null;
let currentPhase="prepare";
let activeSources=[];
let endRequested=false;

const startButton=document.getElementById("startButton");
const settingsButton=document.getElementById("settingsButton");
const settingsModal=document.getElementById("settingsModal");
const closeSettingsButton=document.getElementById("closeSettingsButton");
const saveSettingsButton=document.getElementById("saveSettingsButton");
const sessionSummary=document.getElementById("sessionSummary");
const shareLink=document.getElementById("shareLink");
const inhaleInput=document.getElementById("inhaleSeconds");
const exhaleInput=document.getElementById("exhaleSeconds");
const showTimerToggle=document.getElementById("showTimerToggle");
const showPhaseTextToggle=document.getElementById("showPhaseTextToggle");
const soundToggle=document.getElementById("soundToggle");
const fullscreenToggle=document.getElementById("fullscreenToggle");

shareLink.href=`mailto:?subject=${encodeURIComponent(shareSubject)}&body=${encodeURIComponent(shareBody)}`;
applySettingsToUi();
applyTheme(settings.theme);

startButton.addEventListener("click",async()=>{
  endRequested=false;
  startSession();
  if(settings.fullscreen){
    try{await document.documentElement.requestFullscreen()}catch(error){}
  }
});
settingsButton.addEventListener("click",openSettings);
closeSettingsButton.addEventListener("click",closeSettings);
settingsModal.addEventListener("click",event=>{if(event.target===settingsModal)closeSettings()});
saveSettingsButton.addEventListener("click",saveSettingsFromUi);

function loadSettings(){
  try{return {...DEFAULTS,...JSON.parse(localStorage.getItem(STORAGE_KEY)||"{}")}}
  catch(error){return {...DEFAULTS}}
}
function persistSettings(){localStorage.setItem(STORAGE_KEY,JSON.stringify(settings))}
function applyTheme(theme){document.documentElement.dataset.theme=theme||"ocean"}
function applySettingsToUi(){
  document.querySelectorAll('input[name="theme"]').forEach(input=>input.checked=input.value===settings.theme);
  document.querySelectorAll('input[name="duration"]').forEach(input=>input.checked=Number(input.value)===Number(settings.duration));
  inhaleInput.value=settings.inhale;
  exhaleInput.value=settings.exhale;
  showTimerToggle.checked=settings.showTimer;
  showPhaseTextToggle.checked=settings.showPhaseText;
  soundToggle.checked=settings.sound;
  fullscreenToggle.checked=settings.fullscreen;
  updateSummary();
}
function updateSummary(){sessionSummary.textContent=Number(settings.duration)===1?"1 Minute":`${settings.duration} Minutes`}
function openSettings(){applySettingsToUi();settingsModal.hidden=false}
function closeSettings(){settingsModal.hidden=true}
function sanitizeSeconds(value,fallback){
  const parsed=Number.parseFloat(String(value).replace(",","."));
  if(!Number.isFinite(parsed))return fallback;
  return Math.min(8,Math.max(4,Math.round(parsed*2)/2));
}
function saveSettingsFromUi(){
  const selectedTheme=document.querySelector('input[name="theme"]:checked');
  const selectedDuration=document.querySelector('input[name="duration"]:checked');
  settings={
    theme:selectedTheme?selectedTheme.value:"ocean",
    duration:selectedDuration?Number(selectedDuration.value):1,
    inhale:sanitizeSeconds(inhaleInput.value,4.5),
    exhale:sanitizeSeconds(exhaleInput.value,6.5),
    showTimer:showTimerToggle.checked,
    showPhaseText:showPhaseTextToggle.checked,
    sound:soundToggle.checked,
    fullscreen:fullscreenToggle.checked
  };
  persistSettings();
  applySettingsToUi();
  applyTheme(settings.theme);
  closeSettings();
}
function petalSvg(index){
  return `<svg class="petal-svg" viewBox="0 0 100 180" preserveAspectRatio="none"><defs><radialGradient id="petalGradient" cx="56%" cy="38%" r="72%"><stop class="petal-stop-1" offset="0%"/><stop class="petal-stop-2" offset="58%"/><stop class="petal-stop-3" offset="100%"/></radialGradient></defs><path class="petal-fill" d="M50 4 C72 16 91 45 84 82 C78 113 57 145 50 176 C31 151 13 118 18 77 C22 42 33 16 50 4 Z"/></svg>`;
}
function startSession(){
  document.body.innerHTML=`<main id="session"><div id="timer">${formatTime(settings.duration*60)}</div><div id="phaseLabel"></div><div id="flowerStage" aria-hidden="true"><div id="breathFlower">${Array.from({length:8}).map((_,index)=>`<div class="breath-shape" data-index="${index}">${petalSvg(index)}</div>`).join("")}</div></div><div id="countdown"><div id="countdownLabel">Prepare</div><div id="countdownNumber">3</div></div><button id="exitButton" type="button">End</button><div id="endMessage">Completed</div></main>`;
  applyTheme(settings.theme);
  if(!settings.showTimer)document.getElementById("timer").style.display="none";
  if(!settings.showPhaseText)document.getElementById("phaseLabel").style.display="none";
  document.getElementById("exitButton").addEventListener("click",endImmediately);
  document.getElementById("endMessage").addEventListener("click",()=>window.location.reload());
  document.getElementById("session").addEventListener("click",()=>{if(currentPhase==="finished")window.location.reload()});
  updateFlower(0);
  startCountdown(3);
}
function startCountdown(seconds){
  const countdownElement=document.getElementById("countdown");
  const countdownNumber=document.getElementById("countdownNumber");
  let count=seconds;
  currentPhase="prepare";
  document.getElementById("phaseLabel").textContent="";
  countdownNumber.textContent=count;
  const interval=setInterval(()=>{
    count-=1;
    if(count>0){countdownNumber.textContent=count;return}
    clearInterval(interval);
    countdownElement.textContent="";
    sessionEndsAt=performance.now()+settings.duration*60*1000;
    startBreathingAnimation();
  },1000);
}
function startBreathingAnimation(){
  const timerElement=document.getElementById("timer");
  const phaseLabel=document.getElementById("phaseLabel");
  const startTime=performance.now();
  function animate(now){
    const remainingSeconds=Math.max(0,Math.ceil((sessionEndsAt-now)/1000));
    if(settings.showTimer)timerElement.textContent=formatTime(remainingSeconds);
    const elapsed=(now-startTime)/1000;
    const cycleLength=settings.inhale+settings.exhale;
    const position=elapsed%cycleLength;
    let breathValue,phase,phaseDuration;
    if(position<=settings.inhale){
      phase="inhale";
      phaseDuration=settings.inhale;
      breathValue=easeInOutSine(position/settings.inhale);
    }else{
      phase="exhale";
      phaseDuration=settings.exhale;
      breathValue=1-easeInOutSine((position-settings.inhale)/settings.exhale);
    }
    if(remainingSeconds<=0)endRequested=true;
    if(phase!==currentPhase){
      currentPhase=phase;
      if(settings.showPhaseText)phaseLabel.textContent=phase==="inhale"?"Inhale":"Exhale";
      playBreathSound(phase,phaseDuration);
    }
    updateFlower(breathValue);
    const exhaleAlmostDone=phase==="exhale"&&position>=cycleLength-.04;
    if(endRequested&&exhaleAlmostDone){finishSession();return}
    animationFrameId=requestAnimationFrame(animate);
  }
  animationFrameId=requestAnimationFrame(animate);
}
function updateFlower(breathValue){
  const shapes=document.querySelectorAll(".breath-shape");
  const flower=document.getElementById("breathFlower");
  if(!flower)return;
  const phase=easeInOutSine(breathValue);
  const scale=.66+phase*.34;
  const rotation=(performance.now()/1000)*3;
  flower.style.transform=`scale(${scale.toFixed(4)}) rotate(${rotation.toFixed(3)}deg)`;
  shapes.forEach((shape,index)=>{
    const count=shapes.length;
    const angle=360/count*index;
    const radial=11+phase*39;
    const petalScaleX=.86+phase*.12;
    const petalScaleY=.84+phase*.36;
    const localAngle=angle+(phase-.5)*2.0*(index%2===0?1:-1);
    const opacity=.42+phase*.14;
    shape.style.opacity=opacity.toFixed(3);
    shape.style.transform=`translate(-50%, -50%) rotate(${localAngle.toFixed(3)}deg) translateY(-${radial.toFixed(3)}%) scale(${petalScaleX.toFixed(4)}, ${petalScaleY.toFixed(4)})`;
  });
}
function playBreathSound(phase,phaseDuration){
  if(!settings.sound)return;
  playHtmlAudio(audioFiles[phase],phaseDuration);
}
function playHtmlAudio(src,targetDuration,onEnded){
  try{
    const audio=new Audio(src);
    audio.preload="auto";
    audio.volume=.85;
    audio.addEventListener("loadedmetadata",()=>{
      if(Number.isFinite(audio.duration)&&audio.duration>0&&targetDuration){
        audio.playbackRate=Math.min(4,Math.max(.25,audio.duration/targetDuration));
      }
    },{once:true});
    audio.addEventListener("ended",()=>{if(onEnded)onEnded()},{once:true});
    audio.addEventListener("error",()=>{if(onEnded)onEnded()},{once:true});
    const playPromise=audio.play();
    if(playPromise)playPromise.catch(()=>{if(onEnded)onEnded()});
    activeSources.push(audio);
    return audio;
  }catch(error){
    if(onEnded)onEnded();
    return null;
  }
}
function playEndSoundThenComplete(){
  const endMessage=document.getElementById("endMessage");
  setTimeout(()=>{
    if(settings.sound){
      playHtmlAudio(audioFiles.end,null,()=>endMessage.classList.add("visible"));
    }else{
      endMessage.classList.add("visible");
    }
  },560);
}
function stopAudioSources(){
  activeSources.forEach(audio=>{try{audio.pause();audio.currentTime=0}catch(error){}});
  activeSources=[];
}
function finishSession(){
  if(animationFrameId)cancelAnimationFrame(animationFrameId);
  currentPhase="finished";
  const session=document.getElementById("session");
  const phaseLabel=document.getElementById("phaseLabel");
  phaseLabel.textContent="";
  session.classList.add("fade-out");
  playEndSoundThenComplete();
}
function endImmediately(){
  if(animationFrameId)cancelAnimationFrame(animationFrameId);
  stopAudioSources();
  if(document.fullscreenElement)document.exitFullscreen().catch(()=>{});
  window.location.reload();
}
function formatTime(totalSeconds){
  const minutes=Math.floor(totalSeconds/60);
  const seconds=totalSeconds%60;
  return `${String(minutes).padStart(2,"0")}:${String(seconds).padStart(2,"0")}`;
}
function easeInOutSine(value){return-(Math.cos(Math.PI*value)-1)/2}
