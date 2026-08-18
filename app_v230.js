const STORAGE_KEY = "nomiSettingsV230";
const DEFAULTS = {
  duration: 1,
  rhythm: "longerExhale",
  showTimer: true,
  showPhaseText: true,
  sound: true,
  fullscreen: false,
  theme: "ocean",
  geometry: "orbs"
};

const RHYTHMS = {
  balanced: { inhale: 4.5, exhale: 4.5, label: "Balanced" },
  longerExhale: { inhale: 4.5, exhale: 6.5, label: "Longer Exhale" }
};

const audioFiles = {
  inhale: "./einatmen.mp3?v=230",
  exhale: "./ausatmen.mp3?v=230",
  end: "./ende.mp3?v=230"
};

const shareWebUrl = "https://svnhppl.github.io/nomi/";
const shareSubject = "Nomi – Atemmeditation für mehr Ruhe im Alltag";
const shareBody = `Hallo,
ich möchte diese kleine Atemmeditation mit dir teilen.
Sie heißt Nomi und hilft dabei, für einen Moment zur Ruhe zu kommen und Ein- und Ausatmung bewusst zu begleiten. Die Anwendung ist bewusst schlicht gestaltet und konzentriert sich ganz auf die Atmung – ohne Werbung, Anmeldung oder Ablenkungen.
Du kannst Nomi direkt im Browser nutzen:
${shareWebUrl}
Viele Grüße`;

// Global State
let settings = loadSettings();
let animationFrameId = null;
let prepareAnimationFrameId = null;
let sessionEndsAt = null;
let currentPhase = "idle";
let endRequested = false;
let sessionStartTime = null;
let isSessionPaused = false;
let pauseStartedAt = null;
let sessionControlsHideTimer = null;
let endTransitionTimer = null;
let pausedAudioKeys = [];
let wakeLock = null;

let audioElements = { inhale: null, exhale: null, end: null };

function initApp() {
  applySettingsToUi();
  applyTheme(settings.theme);
  prepareAudioElements();
  bindStartScreenEvents();
}

function bindStartScreenEvents() {
  const startBtn = document.getElementById("startButton");
  const infoBtn = document.getElementById("infoButton");
  const infoMdl = document.getElementById("infoModal");
  const closeInfoBtn = document.getElementById("closeInfoButton");
  const settingsBtn = document.getElementById("settingsButton");
  const settingsMdl = document.getElementById("settingsModal");
  const closeSettingsBtn = document.getElementById("closeSettingsButton");
  const saveSettingsBtn = document.getElementById("saveSettingsButton");
  const shareLnk = document.getElementById("shareLink");

  if (shareLnk) {
    shareLnk.href = `mailto:?subject=${encodeURIComponent(shareSubject)}&body=${encodeURIComponent(shareBody)}`;
  }

  if (startBtn) {
    startBtn.addEventListener("click", async () => {
      endRequested = false;
      prepareAudioElements();
      await unlockAudioElements();
      await acquireWakeLock();
      startSession();
      if (settings.fullscreen) {
        try {
          await document.documentElement.requestFullscreen();
        } catch (e) {}
      }
    });
  }

  if (infoBtn) infoBtn.addEventListener("click", openInfo);
  if (closeInfoBtn) closeInfoBtn.addEventListener("click", closeInfo);
  if (infoMdl) {
    infoMdl.addEventListener("click", (e) => {
      if (e.target === infoMdl) closeInfo();
    });
  }

  if (settingsBtn) settingsBtn.addEventListener("click", openSettings);
  if (closeSettingsBtn) closeSettingsBtn.addEventListener("click", closeSettings);
  if (settingsMdl) {
    settingsMdl.addEventListener("click", (e) => {
      if (e.target === settingsMdl) closeSettings();
    });
  }

  if (saveSettingsBtn) saveSettingsBtn.addEventListener("click", saveSettingsFromUi);
}

async function acquireWakeLock() {
  try {
    if ("wakeLock" in navigator) {
      wakeLock = await navigator.wakeLock.request("screen");
      wakeLock.addEventListener("release", () => {
        wakeLock = null;
      });
    }
  } catch (e) {
    wakeLock = null;
  }
}

function releaseWakeLock() {
  try {
    if (wakeLock) {
      const lock = wakeLock;
      wakeLock = null;
      lock.release();
    }
  } catch (e) {
    wakeLock = null;
  }
}

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible" && sessionEndsAt && currentPhase !== "finished" && currentPhase !== "idle" && !isSessionPaused) {
    acquireWakeLock();
  }
});
window.addEventListener("beforeunload", releaseWakeLock);

function loadSettings() {
  try {
    const saved = { ...DEFAULTS, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") };
    if (!RHYTHMS[saved.rhythm]) saved.rhythm = "longerExhale";
    if (!["petals", "orbs"].includes(saved.geometry)) saved.geometry = "orbs";
    return saved;
  } catch (e) {
    return { ...DEFAULTS };
  }
}

function persistSettings() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

function currentRhythm() {
  return RHYTHMS[settings.rhythm] || RHYTHMS.longerExhale;
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme || "ocean";
  document.documentElement.dataset.geometry = settings.geometry || "orbs";
}

function applySettingsToUi() {
  const showTimerToggle = document.getElementById("showTimerToggle");
  const showPhaseTextToggle = document.getElementById("showPhaseTextToggle");
  const soundToggle = document.getElementById("soundToggle");
  const fullscreenToggle = document.getElementById("fullscreenToggle");

  document.querySelectorAll('input[name="theme"]').forEach(i => (i.checked = i.value === settings.theme));
  document.querySelectorAll('input[name="geometry"]').forEach(i => (i.checked = i.value === settings.geometry));
  document.querySelectorAll('input[name="duration"]').forEach(i => (i.checked = Number(i.value) === Number(settings.duration)));
  document.querySelectorAll('input[name="rhythm"]').forEach(i => (i.checked = i.value === settings.rhythm));

  if (showTimerToggle) showTimerToggle.checked = settings.showTimer;
  if (showPhaseTextToggle) showPhaseTextToggle.checked = settings.showPhaseText;
  if (soundToggle) soundToggle.checked = settings.sound;
  if (fullscreenToggle) fullscreenToggle.checked = settings.fullscreen;
  updateSummary();
}

function updateSummary() {
  const el = document.getElementById("sessionSummary");
  if (el) el.textContent = Number(settings.duration) === 1 ? "1 Minute" : `${settings.duration} Minutes`;
}

function openInfo() {
  const infoModal = document.getElementById("infoModal");
  if (infoModal) {
    infoModal.hidden = false;
    infoModal.classList.remove("closing");
    requestAnimationFrame(() => infoModal.classList.add("open"));
  }
}

function closeInfo() {
  const infoModal = document.getElementById("infoModal");
  if (infoModal) {
    infoModal.classList.remove("open");
    infoModal.classList.add("closing");
    setTimeout(() => {
      infoModal.hidden = true;
      infoModal.classList.remove("closing");
    }, 170);
  }
}

function openSettings() {
  const settingsModal = document.getElementById("settingsModal");
  applySettingsToUi();
  if (settingsModal) {
    settingsModal.hidden = false;
    settingsModal.classList.remove("closing");
    requestAnimationFrame(() => settingsModal.classList.add("open"));
  }
}

function closeSettings() {
  const settingsModal = document.getElementById("settingsModal");
  if (settingsModal) {
    settingsModal.classList.remove("open");
    settingsModal.classList.add("closing");
    setTimeout(() => {
      settingsModal.hidden = true;
      settingsModal.classList.remove("closing");
    }, 170);
  }
}

function saveSettingsFromUi() {
  const theme = document.querySelector('input[name="theme"]:checked');
  const geometry = document.querySelector('input[name="geometry"]:checked');
  const duration = document.querySelector('input[name="duration"]:checked');
  const rhythm = document.querySelector('input[name="rhythm"]:checked');
  const showTimerToggle = document.getElementById("showTimerToggle");
  const showPhaseTextToggle = document.getElementById("showPhaseTextToggle");
  const soundToggle = document.getElementById("soundToggle");
  const fullscreenToggle = document.getElementById("fullscreenToggle");

  settings = {
    theme: theme ? theme.value : "ocean",
    geometry: geometry ? geometry.value : "orbs",
    duration: duration ? Number(duration.value) : 1,
    rhythm: rhythm ? rhythm.value : "longerExhale",
    showTimer: showTimerToggle ? showTimerToggle.checked : true,
    showPhaseText: showPhaseTextToggle ? showPhaseTextToggle.checked : true,
    sound: soundToggle ? soundToggle.checked : true,
    fullscreen: fullscreenToggle ? fullscreenToggle.checked : false
  };

  persistSettings();
  applySettingsToUi();
  applyTheme(settings.theme);
  closeSettings();
}

function prepareAudioElements() {
  Object.keys(audioFiles).forEach(k => {
    if (!audioElements[k] || audioElements[k].src.indexOf(audioFiles[k].replace("./", "")) === -1) {
      const a = new Audio(audioFiles[k]);
      a.preload = "auto";
      a.playsInline = true;
      a.volume = 0.85;
      a.load();
      audioElements[k] = a;
    }
  });
}

async function unlockAudioElements() {
  if (!settings.sound) return;
  for (const k of Object.keys(audioElements)) {
    const a = audioElements[k];
    if (!a) continue;
    try {
      a.muted = true;
      a.currentTime = 0;
      const p = a.play();
      if (p) await p;
      a.pause();
      a.currentTime = 0;
      a.muted = false;
    } catch (e) {
      try {
        a.muted = false;
        a.pause();
        a.currentTime = 0;
      } catch (x) {}
    }
  }
}

function petalSvg() {
  return `<svg class="petal-svg" viewBox="0 0 100 180" preserveAspectRatio="none"><defs><radialGradient id="petalGradient" cx="56%" cy="38%" r="72%"><stop class="petal-stop-1" offset="0%"/><stop class="petal-stop-2" offset="58%"/><stop class="petal-stop-3" offset="100%"/></radialGradient></defs><path class="petal-fill" d="M50 4 C72 16 91 45 84 82 C78 113 57 145 50 176 C31 151 13 118 18 77 C22 42 33 16 50 4 Z"/></svg>`;
}

function orbMarkup() {
  return `<div class="orb-shape" aria-hidden="true"></div>`;
}

function shapeMarkup() {
  return settings.geometry === "orbs" ? orbMarkup() : petalSvg();
}

function sessionShapesMarkup() {
  return Array.from({ length: 8 })
    .map((_, i) => `<div class="breath-shape" data-index="${i}">${shapeMarkup()}</div>`)
    .join("");
}

function startSession() {
  // Reset all session state
  sessionStartTime = null;
  isSessionPaused = false;
  pauseStartedAt = null;
  currentPhase = "prepare";
  endRequested = false;
  clearSessionControlsHideTimer();
  if (endTransitionTimer) {
    clearTimeout(endTransitionTimer);
    endTransitionTimer = null;
  }

  document.body.innerHTML = `
    <main id="session" class="preparing">
      <div id="timer"><div id="sessionProgress" aria-label="Remaining time"><div id="sessionProgressFill"></div></div></div>
      <div id="phaseLabel"></div>
      <div id="flowerStage" aria-hidden="true"><div id="breathFlower">${sessionShapesMarkup()}</div></div>
      <div id="countdown"><div id="countdownLabel">Prepare</div></div>
      <div id="sessionControls" hidden>
        <button id="pauseResumeButton" type="button">Pause</button>
        <button id="endSessionButton" type="button">End</button>
      </div>
      <div id="endMessage">Completed</div>
    </main>
  `;

  applyTheme(settings.theme);
  if (!settings.showTimer) document.getElementById("timer").style.display = "none";
  if (!settings.showPhaseText) document.getElementById("phaseLabel").style.display = "none";

  document.getElementById("pauseResumeButton").addEventListener("click", (e) => {
    e.stopPropagation();
    togglePauseResume();
  });

  document.getElementById("endSessionButton").addEventListener("click", (e) => {
    e.stopPropagation();
    endImmediately();
  });

  document.getElementById("endMessage").addEventListener("click", () => {
    if (currentPhase === "finished") renderStartScreenSmooth();
  });

  document.getElementById("session").addEventListener("click", (e) => {
    if (currentPhase === "finished" || currentPhase === "prepare" || e.target.closest("#sessionControls")) return;
    showSessionControls(true);
  });

  updateFlower(1);
  startCountdown(3);
}

function startCountdown(seconds) {
  const el = document.getElementById("countdown");
  const label = document.getElementById("countdownLabel");
  if (el) {
    el.hidden = false;
    el.style.display = "grid";
  }
  if (label) {
    label.style.opacity = ".92";
    label.style.filter = "blur(0)";
  }
  if (prepareAnimationFrameId) cancelAnimationFrame(prepareAnimationFrameId);

  let start = null;
  const duration = seconds * 1000;

  function step(now) {
    if (currentPhase !== "prepare") return;
    if (!start) start = now;
    const raw = Math.min(1, (now - start) / duration);
    const eased = easeInOutSine(raw);
    updateFlower(1 - eased);

    if (label) {
      label.style.opacity = String(Math.max(0, 0.92 * (1 - raw)));
      label.style.filter = `blur(${(raw * 1.4).toFixed(2)}px)`;
    }

    if (raw < 1) {
      prepareAnimationFrameId = requestAnimationFrame(step);
      return;
    }

    prepareAnimationFrameId = null;
    updateFlower(0);
    if (el) {
      el.hidden = true;
      el.style.display = "none";
    }
    document.getElementById("session")?.classList.remove("preparing");
    sessionStartTime = now;
    sessionEndsAt = now + settings.duration * 60 * 1000;
    currentPhase = "running";
    startBreathingAnimation();
  }

  prepareAnimationFrameId = requestAnimationFrame(step);
}

function startBreathingAnimation() {
  const timer = document.getElementById("timer");
  const phaseLabel = document.getElementById("phaseLabel");
  const rhythm = currentRhythm();

  function animate(now) {
    if (isSessionPaused || currentPhase === "finished" || currentPhase === "idle") return;

    const remaining = Math.max(0, Math.ceil((sessionEndsAt - now) / 1000));
    if (settings.showTimer) {
      const fill = timer?.querySelector("#sessionProgressFill");
      if (fill) {
        const ratio = Math.max(0, Math.min(1, (sessionEndsAt - now) / (settings.duration * 60 * 1000)));
        fill.style.width = `${(ratio * 100).toFixed(2)}%`;
      }
    }

    const elapsed = (now - sessionStartTime) / 1000;
    const cycle = rhythm.inhale + rhythm.exhale;
    const pos = elapsed % cycle;

    let value, phase, phaseDuration;
    if (pos <= rhythm.inhale) {
      phase = "inhale";
      phaseDuration = rhythm.inhale;
      value = easeInOutSine(pos / rhythm.inhale);
    } else {
      phase = "exhale";
      phaseDuration = rhythm.exhale;
      value = 1 - easeInOutSine((pos - rhythm.inhale) / rhythm.exhale);
    }

    if (remaining <= 0) endRequested = true;

    if (phase !== currentPhase) {
      currentPhase = phase;
      if (settings.showPhaseText && phaseLabel) {
        phaseLabel.textContent = phase === "inhale" ? "Inhale" : "Exhale";
      }
      playBreathSound(phase, phaseDuration);
    }

    updateFlower(value);

    if (endRequested && phase === "exhale" && pos >= cycle - 0.04) {
      finishSession();
      return;
    }

    animationFrameId = requestAnimationFrame(animate);
  }

  animationFrameId = requestAnimationFrame(animate);
}

function updateFlower(breathValue) {
  const shapes = document.querySelectorAll(".breath-shape");
  const flower = document.getElementById("breathFlower");
  if (!flower) return;

  const isDesktop = window.innerWidth >= 768 && window.innerHeight >= 600;
  const baseScale = isDesktop ? 0.72 : 0.54;
  const growth = isDesktop ? 0.34 : 0.26;

  const phase = easeInOutSine(breathValue);
  const scale = baseScale + phase * growth;
  const rotation = (performance.now() / 1000) * 3;

  flower.style.transform = `scale(${scale.toFixed(4)}) rotate(${rotation.toFixed(3)}deg)`;

  shapes.forEach((shape, index) => {
    const count = shapes.length;
    const angle = (360 / count) * index;
    const isOrbs = settings.geometry === "orbs";
    const radial = 5 + phase * 28;
    const sx = 1.02 + phase * 0.14;
    const sy = 1.02 + phase * 0.14;
    const localAngle = isOrbs ? angle : angle + (phase - 0.5) * 2.0 * (index % 2 === 0 ? 1 : -1);
    const opacity = isOrbs ? 0.42 + phase * 0.16 : 0.42 + phase * 0.14;

    shape.style.opacity = opacity.toFixed(3);
    shape.style.transform = `translate(-50%, -50%) rotate(${localAngle.toFixed(3)}deg) translateY(-${radial.toFixed(3)}%) scale(${sx.toFixed(4)}, ${sy.toFixed(4)})`;
  });
}

function clearSessionControlsHideTimer() {
  if (sessionControlsHideTimer) {
    clearTimeout(sessionControlsHideTimer);
    sessionControlsHideTimer = null;
  }
}

function showSessionControls(autoHide) {
  const c = document.getElementById("sessionControls");
  if (c) c.hidden = false;
  clearSessionControlsHideTimer();
  if (autoHide && !isSessionPaused) {
    sessionControlsHideTimer = setTimeout(() => hideSessionControls(), 3000);
  }
}

function hideSessionControls() {
  if (isSessionPaused) return;
  const c = document.getElementById("sessionControls");
  if (c) c.hidden = true;
  clearSessionControlsHideTimer();
}

function togglePauseResume() {
  isSessionPaused ? resumeSession() : pauseSession();
}

function pauseSession() {
  if (isSessionPaused || currentPhase === "prepare" || currentPhase === "finished" || currentPhase === "idle") return;
  isSessionPaused = true;
  pauseStartedAt = performance.now();
  clearSessionControlsHideTimer();
  if (animationFrameId) cancelAnimationFrame(animationFrameId);
  pauseAudioForSessionPause();
  const b = document.getElementById("pauseResumeButton");
  if (b) b.textContent = "Resume";
  showSessionControls(false);
}

function resumeSession() {
  if (!isSessionPaused) return;
  const now = performance.now();
  const pausedFor = now - pauseStartedAt;
  sessionStartTime += pausedFor;
  sessionEndsAt += pausedFor;
  pauseStartedAt = null;
  isSessionPaused = false;
  const b = document.getElementById("pauseResumeButton");
  if (b) b.textContent = "Pause";
  resumeAudioAfterSessionPause();
  showSessionControls(true);
  startBreathingAnimation();
}

function playBreathSound(phase, phaseDuration) {
  if (!settings.sound) return;
  playPersistentAudio(phase, phaseDuration);
}

function playPersistentAudio(key, targetDuration, onEnded) {
  const a = audioElements[key];
  let finished = false;
  const triggerEnd = () => {
    if (finished) return;
    finished = true;
    if (onEnded) onEnded();
  };

  if (!a) {
    triggerEnd();
    return;
  }

  try {
    a.pause();
    a.currentTime = 0;
    a.muted = false;
    a.volume = 0.85;
    if (Number.isFinite(a.duration) && a.duration > 0 && targetDuration) {
      a.playbackRate = Math.min(4, Math.max(0.25, a.duration / targetDuration));
    } else {
      a.playbackRate = 1;
    }
    a.onended = () => triggerEnd();
    a.onerror = () => triggerEnd();
    const p = a.play();
    if (p) {
      p.catch(() => triggerEnd());
    }
    if (onEnded) {
      setTimeout(() => triggerEnd(), 2800);
    }
  } catch (e) {
    triggerEnd();
  }
}

function pauseAudioForSessionPause() {
  pausedAudioKeys = [];
  Object.entries(audioElements).forEach(([k, a]) => {
    try {
      if (a && !a.paused && !a.ended) {
        pausedAudioKeys.push(k);
        a.pause();
      }
    } catch (e) {}
  });
}

function resumeAudioAfterSessionPause() {
  if (!settings.sound) return;
  const keys = [...pausedAudioKeys];
  pausedAudioKeys = [];
  keys.forEach((k) => {
    const a = audioElements[k];
    if (!a) return;
    try {
      const p = a.play();
      if (p) p.catch(() => {});
    } catch (e) {}
  });
}

function stopAudioSources() {
  pausedAudioKeys = [];
  Object.values(audioElements).forEach((a) => {
    try {
      if (a) {
        a.pause();
        a.currentTime = 0;
      }
    } catch (e) {}
  });
}

function finishSession() {
  releaseWakeLock();
  if (animationFrameId) cancelAnimationFrame(animationFrameId);
  if (prepareAnimationFrameId) cancelAnimationFrame(prepareAnimationFrameId);
  currentPhase = "finished";

  const session = document.getElementById("session");
  const label = document.getElementById("phaseLabel");
  if (label) label.textContent = "";
  if (session) session.classList.add("fade-out");

  const msg = document.getElementById("endMessage");

  setTimeout(() => {
    if (msg) msg.classList.add("visible");
    if (settings.sound) {
      playPersistentAudio("end", null, () => renderStartScreenSmooth());
    } else {
      setTimeout(() => renderStartScreenSmooth(), 1600);
    }
  }, 560);
}

function renderStartScreenSmooth() {
  if (endTransitionTimer) clearTimeout(endTransitionTimer);
  const session = document.getElementById("session");
  const endMsg = document.getElementById("endMessage");
  if (session) {
    if (endMsg) endMsg.style.opacity = "0";
    session.classList.add("fade-to-start");
    endTransitionTimer = setTimeout(() => {
      endTransitionTimer = null;
      renderStartScreen();
    }, 1600);
  } else {
    renderStartScreen();
  }
}

function renderStartScreen() {
  // Completely reset all transient execution state
  if (animationFrameId) cancelAnimationFrame(animationFrameId);
  if (prepareAnimationFrameId) cancelAnimationFrame(prepareAnimationFrameId);
  if (endTransitionTimer) clearTimeout(endTransitionTimer);
  clearSessionControlsHideTimer();
  stopAudioSources();
  releaseWakeLock();

  currentPhase = "idle";
  sessionStartTime = null;
  sessionEndsAt = null;
  isSessionPaused = false;
  pauseStartedAt = null;
  endRequested = false;

  document.body.innerHTML = `<main id="app" class="start-screen fade-in-start">
      <section class="start-content" aria-label="Nomi Start">
        <div class="start-flower" aria-hidden="true"><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span></div>
        <h1>Nomi</h1>
        <p class="subtitle">Breathing Meditation</p>
        <p id="sessionSummary" class="session-summary" hidden></p>
        <button id="startButton" type="button">Start</button>
        <div class="start-tools" aria-label="Secondary actions">
          <button id="infoButton" class="tool-button" type="button" aria-label="About Nomi">
            <svg viewBox="0 0 64 64" aria-hidden="true" focusable="false"><path d="M32 6 C17.64 6 6 17.64 6 32 C6 46.36 17.64 58 32 58 C46.36 58 58 46.36 58 32 C58 17.64 46.36 6 32 6 Z M32 51 C21.51 51 13 42.49 13 32 C13 21.51 21.51 13 32 13 C42.49 13 51 21.51 51 32 C51 42.49 42.49 51 32 51 Z"></path><circle cx="32" cy="22" r="4.2"></circle><rect x="28.5" y="29" width="7" height="16" rx="3.5"></rect></svg>
          </button>
          <button id="settingsButton" class="tool-button" type="button" aria-label="Settings">
            <svg viewBox="0 0 64 64" aria-hidden="true" focusable="false"><rect x="6" y="12" width="52" height="7" rx="3.5"></rect><circle cx="30" cy="15.5" r="8.5"></circle><rect x="6" y="29" width="52" height="7" rx="3.5"></rect><circle cx="43" cy="32.5" r="8.5"></circle><rect x="6" y="46" width="52" height="7" rx="3.5"></rect><circle cx="22" cy="49.5" r="8.5"></circle></svg>
          </button>
          <a id="shareLink" class="tool-button" href="#" aria-label="Share">
            <svg viewBox="0 0 64 64" aria-hidden="true" focusable="false"><circle cx="18" cy="32" r="9"></circle><circle cx="47" cy="16" r="9"></circle><circle cx="47" cy="48" r="9"></circle><rect x="22" y="22" width="28" height="7" rx="3.5" transform="rotate(-29 36 25.5)"></rect><rect x="22" y="35" width="28" height="7" rx="3.5" transform="rotate(29 36 38.5)"></rect></svg>
          </a>
        </div>
      </section>

      <!-- Info Modal -->
      <section id="infoModal" class="modal" aria-label="About Nomi" hidden>
        <div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="infoTitle">
          <div class="modal-header">
            <h2 id="infoTitle">About Nomi</h2>
            <button id="closeInfoButton" class="close-button" type="button" aria-label="Close Info">Close</button>
          </div>
          <div class="info-body">
            <p>A minimalist space to catch your breath. Simply follow the rhythm:</p>
            <ul>
              <li><strong>Inhale</strong> when the circle expands</li>
              <li><strong>Exhale</strong> when it contracts</li>
            </ul>
            <p class="info-footer">No tracking, no login, no data. Just you and your breath.</p>
          </div>
        </div>
      </section>

      <!-- Settings Modal -->
      <section id="settingsModal" class="modal" aria-label="Settings" hidden>
        <div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="settingsTitle">
          <div class="modal-header">
            <h2 id="settingsTitle">Settings</h2>
            <button id="closeSettingsButton" class="close-button" type="button" aria-label="Close Settings">Close</button>
          </div>
          <div class="settings-section duration-section">
            <h3>Duration</h3>
            <div class="segmented duration-options" role="radiogroup" aria-label="Duration">
              <label><input type="radio" name="duration" value="1"><span>1 min</span></label>
              <label><input type="radio" name="duration" value="3"><span>3 min</span></label>
              <label><input type="radio" name="duration" value="5"><span>5 min</span></label>
              <label><input type="radio" name="duration" value="10"><span>10 min</span></label>
            </div>
          </div>
          <div class="settings-section rhythm-section">
            <h3>Breathing Rhythm</h3>
            <div class="rhythm-options" role="radiogroup" aria-label="Breathing Rhythm">
              <label><input type="radio" name="rhythm" value="balanced"><span><strong>Balanced</strong><small>4.5 / 4.5 sec</small></span></label>
              <label><input type="radio" name="rhythm" value="longerExhale"><span><strong>Longer Exhale</strong><small>4.5 / 6.5 sec</small></span></label>
            </div>
          </div>
          <div class="settings-section geometry-section">
            <h3>Animation Style</h3>
            <div class="segmented geometry-options" role="radiogroup" aria-label="Animation Style">
              <label><input type="radio" name="geometry" value="petals"><span>Petals</span></label>
              <label><input type="radio" name="geometry" value="orbs"><span>Orbs</span></label>
            </div>
          </div>
          <div class="settings-section theme-section">
            <h3>Theme</h3>
            <div class="segmented theme-options" role="radiogroup" aria-label="Theme">
              <label><input type="radio" name="theme" value="ocean"><span>Ocean</span></label>
              <label><input type="radio" name="theme" value="twilight"><span>Twilight</span></label>
              <label><input type="radio" name="theme" value="forest"><span>Forest</span></label>
            </div>
          </div>
          <div class="settings-section switches">
            <label><span>Show Remaining Time</span><input id="showTimerToggle" type="checkbox"></label>
            <label><span>Show Breathing Text</span><input id="showPhaseTextToggle" type="checkbox"></label>
            <label><span>Breathing Sound</span><input id="soundToggle" type="checkbox"></label>
            <label><span>Start in Fullscreen</span><input id="fullscreenToggle" type="checkbox"></label>
          </div>
          <div class="settings-actions">
            <button id="saveSettingsButton" class="save-button" type="button">Save</button>
          </div>
        </div>
      </section>
    </main>`;

  bindStartScreenEvents();
  applySettingsToUi();
  applyTheme(settings.theme);
}

function endImmediately() {
  releaseWakeLock();
  if (animationFrameId) cancelAnimationFrame(animationFrameId);
  if (prepareAnimationFrameId) cancelAnimationFrame(prepareAnimationFrameId);
  if (endTransitionTimer) clearTimeout(endTransitionTimer);
  clearSessionControlsHideTimer();
  stopAudioSources();
  if (document.fullscreenElement) {
    document.exitFullscreen().catch(() => {});
  }
  renderStartScreen();
}

function easeInOutSine(v) {
  v = Math.max(0, Math.min(1, v));
  return -(Math.cos(Math.PI * v) - 1) / 2;
}

// Initialize application
initApp();
