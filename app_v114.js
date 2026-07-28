const durationSlider=document.getElementById("duration");
const durationText=document.getElementById("durationText");
const startButton=document.getElementById("startButton");
const inhaleSlider=document.getElementById("inhaleSeconds");
const exhaleSlider=document.getElementById("exhaleSeconds");
const inhaleValue=document.getElementById("inhaleValue");
const exhaleValue=document.getElementById("exhaleValue");
const showTimerStart=document.getElementById("showTimerStart");
const showPhaseTextStart=document.getElementById("showPhaseTextStart");
const soundStart=document.getElementById("soundStart");
const shareLink=document.getElementById("shareLink");
let animationFrameId=null,sessionEndsAt=null,showTimer=true,soundEnabled=true,showPhaseText=true,sessionDurationSeconds=60,inhaleSeconds=4,exhaleSeconds=6,audioContext=null,currentPhase="prepare",activeSources=[],endRequested=false;
const audioFiles={inhale:"./einatmen.mp3?v=114",exhale:"./ausatmen.mp3?v=114",end:"./ende.mp3?v=114"};
const shareUrl="https://svnhppl.github.io/nomi/";
const chromeStoreUrl="https://chromewebstore.google.com/detail/lmfjbidhgcajjokbihfjeacleflmgmfl";
const shareSubject="Nomi Atemmeditation – kostenlose Chrome-Erweiterung";
const shareBody=`Hallo,

ich möchte dir Nomi empfehlen – eine kostenlose Atemmeditation.

Nomi hilft dabei, für einen Moment zur Ruhe zu kommen und Ein- und Ausatmung bewusst zu begleiten. Die Anwendung ist bewusst schlicht gestaltet und konzentriert sich ganz auf die Atmung – ohne Werbung, Anmeldung oder Ablenkungen.

Du kannst Nomi direkt im Browser nutzen:

Als Webseite:
${shareUrl}

Oder als Chrome-Erweiterung:
${chromeStoreUrl}

Viele Grüße`;
shareLink.href=`mailto:?subject=${encodeURIComponent(shareSubject)}&body=${encodeURIComponent(shareBody)}`;
durationSlider.addEventListener("input",updateDurationText);inhaleSlider.addEventListener("input",updateBreathText);exhaleSlider.addEventListener("input",updateBreathText);
startButton.addEventListener("click",async()=>{const durationMinutes=parseInt(durationSlider.value,10);inhaleSeconds=parseFloat(inhaleSlider.value);exhaleSeconds=parseFloat(exhaleSlider.value);sessionDurationSeconds=durationMinutes*60;showTimer=showTimerStart.checked;showPhaseText=showPhaseTextStart.checked;soundEnabled=soundStart.checked;endRequested=false;await unlockAudio();startSession(durationMinutes);try{await document.documentElement.requestFullscreen()}catch(error){}});
updateDurationText();updateBreathText();
function updateDurationText(){const minutes=parseInt(durationSlider.value,10);durationText.textContent=minutes===1?"1 Minute":`${minutes} Minutes`}
function updateBreathText(){inhaleValue.textContent=formatNumber(inhaleSlider.value);exhaleValue.textContent=formatNumber(exhaleSlider.value)}
function formatNumber(value){return Number(value).toLocaleString("en-US",{maximumFractionDigits:1})}
async function unlockAudio(){try{if(!audioContext)audioContext=new(window.AudioContext||window.webkitAudioContext)();if(audioContext.state==="suspended")await audioContext.resume();const osc=audioContext.createOscillator();const gain=audioContext.createGain();gain.gain.value=0.0001;osc.connect(gain);gain.connect(audioContext.destination);osc.start();osc.stop(audioContext.currentTime+0.04)}catch(error){}}
function petalSvg(index){return `<svg class="petal-svg" viewBox="0 0 100 180" preserveAspectRatio="none"><defs><radialGradient id="petalGradient" cx="56%" cy="38%" r="72%"><stop offset="0%" stop-color="rgba(88,190,255,.58)"/><stop offset="58%" stop-color="rgba(36,122,230,.50)"/><stop offset="100%" stop-color="rgba(8,43,135,.36)"/></radialGradient></defs><path class="petal-fill" d="M50 4 C72 16 91 45 84 82 C78 113 57 145 50 176 C31 151 13 118 18 77 C22 42 33 16 50 4 Z"/></svg>`}
function startSession(durationMinutes){document.body.innerHTML=`<main id="session"><div id="timer">${formatTime(durationMinutes*60)}</div><div id="phaseLabel"></div><div id="flowerStage" aria-hidden="true"><div id="breathFlower">${Array.from({length:8}).map((_,index)=>`<div class="breath-shape" data-index="${index}">${petalSvg(index)}</div>`).join("")}</div></div><div id="countdown"><div id="countdownLabel">Prepare</div><div id="countdownNumber">3</div></div><button id="exitButton" type="button">End</button><div id="endMessage">Completed</div></main>`;if(!showTimer)document.getElementById("timer").style.display="none";if(!showPhaseText)document.getElementById("phaseLabel").style.display="none";document.getElementById("exitButton").addEventListener("click",endImmediately);document.getElementById("endMessage").addEventListener("click",()=>window.location.reload());document.getElementById("session").addEventListener("click",()=>{if(currentPhase==="finished")window.location.reload()});updateFlower(0);startCountdown(3)}
function startCountdown(seconds){const countdownElement=document.getElementById("countdown"),countdownNumber=document.getElementById("countdownNumber");let count=seconds;currentPhase="prepare";document.getElementById("phaseLabel").textContent="";countdownNumber.textContent=count;const interval=setInterval(()=>{count-=1;if(count>0){countdownNumber.textContent=count;return}clearInterval(interval);countdownElement.textContent="";sessionEndsAt=performance.now()+sessionDurationSeconds*1000;startBreathingAnimation()},1000)}
function startBreathingAnimation(){const timerElement=document.getElementById("timer"),phaseLabel=document.getElementById("phaseLabel"),startTime=performance.now();function animate(now){let remainingSeconds=Math.max(0,Math.ceil((sessionEndsAt-now)/1000));if(showTimer)timerElement.textContent=formatTime(remainingSeconds);const elapsed=(now-startTime)/1000,timing=getBreathingTiming(elapsed),cycleLength=timing.inhale+timing.exhale,position=elapsed%cycleLength;let breathValue,phase,phaseDuration;if(position<=timing.inhale){phase="inhale";phaseDuration=timing.inhale;breathValue=easeInOutSine(position/timing.inhale)}else{phase="exhale";phaseDuration=timing.exhale;breathValue=1-easeInOutSine((position-timing.inhale)/timing.exhale)}if(remainingSeconds<=0)endRequested=true;if(phase!==currentPhase){currentPhase=phase;if(showPhaseText)phaseLabel.textContent=phase==="inhale"?"Inhale":"Exhale";playBreathSound(phase,phaseDuration)}updateFlower(breathValue);const exhaleAlmostDone=phase==="exhale"&&position>=cycleLength-.04;if(endRequested&&exhaleAlmostDone){finishSession();return}animationFrameId=requestAnimationFrame(animate)}animationFrameId=requestAnimationFrame(animate)}
function updateFlower(breathValue){const shapes=document.querySelectorAll(".breath-shape"),flower=document.getElementById("breathFlower");if(!flower)return;const phase=easeInOutSine(breathValue),scale=.66+phase*.34,rotation=(performance.now()/1000)*3;flower.style.transform=`scale(${scale.toFixed(4)}) rotate(${rotation.toFixed(3)}deg)`;shapes.forEach((shape,index)=>{const count=shapes.length,angle=360/count*index,radial=11+phase*39,petalScaleX=.86+phase*.12,petalScaleY=.84+phase*.36,localAngle=angle+(phase-.5)*2.0*(index%2===0?1:-1),opacity=.42+phase*.14;shape.style.opacity=opacity.toFixed(3);shape.style.transform=`translate(-50%, -50%) rotate(${localAngle.toFixed(3)}deg) translateY(-${radial.toFixed(3)}%) scale(${petalScaleX.toFixed(4)}, ${petalScaleY.toFixed(4)})`})}
function getBreathingTiming(elapsedSeconds){return{inhale:inhaleSeconds,exhale:exhaleSeconds}}
function playBreathSound(phase,phaseDuration){if(!soundEnabled)return;playHtmlAudio(audioFiles[phase],phaseDuration,()=>playGeneratedTone(phase,phaseDuration))}
function playHtmlAudio(src,targetDuration,onError,onEnded){try{const audio=new Audio(src);audio.preload="auto";audio.volume=.85;audio.addEventListener("loadedmetadata",()=>{if(Number.isFinite(audio.duration)&&audio.duration>0&&targetDuration)audio.playbackRate=Math.min(4,Math.max(.25,audio.duration/targetDuration))},{once:true});audio.addEventListener("ended",()=>{if(onEnded)onEnded()},{once:true});audio.addEventListener("error",()=>{if(onError)onError()},{once:true});const playPromise=audio.play();if(playPromise)playPromise.catch(()=>{if(onError)onError()});activeSources.push(audio);return audio}catch(error){if(onError)onError();return null}}
function playGeneratedTone(type,duration){if(!soundEnabled)return;try{if(!audioContext)audioContext=new(window.AudioContext||window.webkitAudioContext)();const now=audioContext.currentTime,osc=audioContext.createOscillator(),gain=audioContext.createGain();const end=now+duration;osc.type="sine";const startFreq=type==="inhale"?260:type==="exhale"?390:520;const endFreq=type==="inhale"?390:type==="exhale"?260:660;osc.frequency.setValueAtTime(startFreq,now);osc.frequency.linearRampToValueAtTime(endFreq,end);osc.connect(gain);gain.connect(audioContext.destination);gain.gain.setValueAtTime(.0001,now);gain.gain.linearRampToValueAtTime(.20,now+.2);gain.gain.setValueAtTime(.20,Math.max(now+.2,end-.25));gain.gain.linearRampToValueAtTime(.0001,end);osc.start(now);osc.stop(end+.03)}catch(error){}}
function playEndSoundThenComplete(){const endMessage=document.getElementById("endMessage");setTimeout(()=>{if(soundEnabled){playHtmlAudio(audioFiles.end,null,()=>{playGeneratedTone("end",.9);setTimeout(()=>endMessage.classList.add("visible"),950)},()=>endMessage.classList.add("visible"))}else{endMessage.classList.add("visible")}},560)}
function stopAudioSources(){activeSources.forEach(audio=>{try{audio.pause();audio.currentTime=0}catch(error){}});activeSources=[]}
function finishSession(){if(animationFrameId)cancelAnimationFrame(animationFrameId);currentPhase="finished";const session=document.getElementById("session"),phaseLabel=document.getElementById("phaseLabel");phaseLabel.textContent="";session.classList.add("fade-out");playEndSoundThenComplete()}
function endImmediately(){if(animationFrameId)cancelAnimationFrame(animationFrameId);stopAudioSources();if(document.fullscreenElement)document.exitFullscreen().catch(()=>{});window.location.reload()}
function formatTime(totalSeconds){const minutes=Math.floor(totalSeconds/60),seconds=totalSeconds%60;return`${String(minutes).padStart(2,"0")}:${String(seconds).padStart(2,"0")}`}
function easeInOutSine(value){return-(Math.cos(Math.PI*value)-1)/2}
