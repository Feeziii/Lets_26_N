const scenes = [...document.querySelectorAll('.scene')];
const navDots = [...document.querySelectorAll('#progress button')];
const nextButtons = [...document.querySelectorAll('[data-next]')];
const starsLayer = document.getElementById('stars');
const reasonCard = document.getElementById('reasonCard');
const reasonText = document.getElementById('reasonText');
const reasonNumber = document.getElementById('reasonNumber');
const reasonCount = document.getElementById('reasonCount');
const reasonsDone = document.getElementById('reasonsDone');
const typedLetter = document.getElementById('typedLetter');
const caret = document.getElementById('caret');
const letterNext = document.getElementById('letterNext');
const confettiCanvas = document.getElementById('confetti');
const pandaAudio = document.getElementById('pandaAudio');
const pandaSoundBtn = document.getElementById('pandaSoundBtn');
const backgroundMusic = document.getElementById('backgroundMusic');
const finalPageMusic = document.getElementById('finalPageMusic');
const cakeFlightField = document.getElementById('cakeFlightField');
if (backgroundMusic) {
  backgroundMusic.loop = true;
  backgroundMusic.volume = 0.34;
}
if (finalPageMusic) {
  finalPageMusic.loop = true;
  finalPageMusic.volume = 0.58;
}
let pandaAudioPlayed = false;
let pandaPlayRequestId = 0;

let current = 0;
let popped = 0;
let typingTimer = null;
let confettiRaf = 0;
const letter = `Enakku innum theriyala nee eppadi en life‑il vannu… paksha athinu njan nanniyullavan. Nee thappa pannaalum, naan kopa pidikkum… bcz neeum ente family‑la oru aal tha.. Incase naan illainaalum… nee over stress aayal mirror nokku, alu moonjiya naan sonnadhu ninnile ninnal orma varum… kandippa sirippu varum & relax aayidum. Cry varumbol video eduthu nokku… kandippa naan ninnile thonnum, nee thanne smile cheyyum, Life‑il nee santhosham aayirikka enikku mathi… unoda sirippu thanne ninte confidence‑um azhagayum highlight cheyyum. Unakku oru problem undenkil, yaar aayalum paravala… nee kooptaal unakkaaga naan angane iruppen. En wish – nee smile stop panna koodadhu… aarengilum vendi nirtharuthu.`;

function makeStars() {
  const count = Math.min(85, Math.max(42, Math.floor(window.innerWidth / 15)));
  const frag = document.createDocumentFragment();
  for (let i = 0; i < count; i++) {
    const s = document.createElement('span');
    s.className = `star ${Math.random() > .8 ? 'star--gold' : ''}`;
    const size = (Math.random() * 2.8 + 1).toFixed(1);
    s.style.width = `${size}px`;
    s.style.height = `${size}px`;
    s.style.left = `${Math.random() * 100}%`;
    s.style.top = `${Math.random() * 100}%`;
    s.style.animationDelay = `${-(Math.random() * 4)}s`;
    frag.appendChild(s);
  }
  starsLayer.replaceChildren(frag);
}

function clearConfetti() {
  cancelAnimationFrame(confettiRaf);
  confettiRaf = 0;
  const ctx = confettiCanvas.getContext('2d');
  if (ctx) ctx.clearRect(0, 0, confettiCanvas.clientWidth, confettiCanvas.clientHeight);
  confettiCanvas.classList.remove('is-active');
}

function safePlayAudio(audio, isAllowed = () => true) {
  if (!audio || !isAllowed()) return;

  const attemptPlay = () => {
    if (!isAllowed()) return;
    const playPromise = audio.play();
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch(() => {
        // If the browser blocks playback, retry on the next real user gesture,
        // but only while this track still belongs to the active scene.
        const retry = () => {
          if (!audio || !audio.paused || !isAllowed()) return;
          const retryPromise = audio.play();
          if (retryPromise && typeof retryPromise.catch === 'function') {
            retryPromise.catch(() => {});
          }
        };
        document.addEventListener('pointerdown', retry, { once: true });
        document.addEventListener('keydown', retry, { once: true });
      });
    }
  };

  attemptPlay();
}

function stopAudio(audio, rewind = false) {
  if (!audio) return;
  audio.pause();
  if (rewind) {
    try { audio.currentTime = 0; } catch (_) {}
  }
}

function syncAudioForScene(index) {
  const finalSceneIndex = scenes.length - 1;
  const isIntro = index === 0;
  const isFinalPage = index === finalSceneIndex;

  // Stop and invalidate pending panda playback as soon as the visitor leaves
  // the intro, so a late media-ready event cannot restart the voice.
  if (!isIntro && pandaAudio) {
    pandaPlayRequestId += 1;
    stopAudio(pandaAudio, true);
  }

  if (isIntro) {
    // Page 1: no background music. Keep the regular track position for later.
    stopAudio(backgroundMusic);
    stopAudio(finalPageMusic, true);
    return;
  }

  if (isFinalPage) {
    // Final page: play only the uploaded Kalla Nikkiriye song, continuously.
    stopAudio(backgroundMusic);
    if (finalPageMusic) {
      finalPageMusic.loop = true;
      stopAudio(finalPageMusic, true);
      safePlayAudio(finalPageMusic, () => current === finalSceneIndex);
    }
    return;
  }

  // Pages 2 through 8: play only the regular Background.mp3 track.
  // The final-page song is stopped and rewound so it never overlaps.
  stopAudio(finalPageMusic, true);
  if (backgroundMusic) {
    backgroundMusic.loop = true;
    safePlayAudio(backgroundMusic, () => current > 0 && current < finalSceneIndex);
  }
}

function goTo(index, {instant = false} = {}) {
  if (index < 0 || index >= scenes.length || index === current) return;

  if (index !== 8) clearConfetti();

  scenes[current].classList.remove('scene--active');
  scenes[index].classList.add('scene--active');
  navDots.forEach((d, i) => d.classList.toggle('active', i === index));
  current = index;

  syncAudioForScene(index);
  if (index === 0) {
    pandaAudioPlayed = false;
    playPandaMessage(true);
  }
  if (index === 2) startCakeBalloons();
  else stopCakeBalloons();

  if (index === 7) startLetter();
  if (index === 8) startFinale();
  if (index === 3) resetBalloonCard();
  if (instant) document.body.offsetHeight;
}

function next() {
  if (current < scenes.length - 1) goTo(current + 1);
}

nextButtons.forEach(btn => btn.addEventListener('click', next));
navDots.forEach(dot => dot.addEventListener('click', () => goTo(Number(dot.dataset.index))));

document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); next(); }
  if (e.key === 'ArrowLeft') { e.preventDefault(); goTo(current - 1); }
});

// Cake-page party: launch balloons on a short, independent schedule. Each balloon
// has a safety timeout as well as animationend handling, so one missed browser event
// cannot leave a balloon frozen on the screen.
const cakeBalloonTimers = new Set();
const cakeBalloonActive = new Set();
const cakeBalloonColors = ['pink', 'blue', 'gold', 'lilac', 'peach'];
let cakeBalloonSpawnTimer = null;
let lastCakeBalloonLane = -1;

function cakeTimeout(callback, delay) {
  const timer = window.setTimeout(() => {
    cakeBalloonTimers.delete(timer);
    callback();
  }, delay);
  cakeBalloonTimers.add(timer);
  return timer;
}

function clearCakeTimeout(timer) {
  if (timer === null || timer === undefined) return;
  window.clearTimeout(timer);
  cakeBalloonTimers.delete(timer);
}

function stopCakeBalloons() {
  cakeBalloonTimers.forEach((timer) => window.clearTimeout(timer));
  cakeBalloonTimers.clear();
  cakeBalloonSpawnTimer = null;
  cakeBalloonActive.forEach((flyer) => flyer.remove());
  cakeBalloonActive.clear();
  if (cakeFlightField) cakeFlightField.replaceChildren();
}

function popCakeBalloon(flyer) {
  if (!flyer || !flyer.isConnected || flyer.classList.contains('is-popping')) return;

  const rect = flyer.getBoundingClientRect();
  const appRect = document.querySelector('.app').getBoundingClientRect();
  const x = rect.left + rect.width / 2 - appRect.left;
  const y = rect.top + rect.height * .3 - appRect.top;
  flyer.classList.add('is-popping');
  spawnParticles(x, y, 12 + Math.floor(Math.random() * 6));
  const popLabel = document.createElement('span');
  popLabel.className = 'cake-pop-label';
  popLabel.textContent = '😂Nithya Ai 😂';
  popLabel.style.left = `${(x / Math.max(1, appRect.width)) * 100}%`;
  popLabel.style.top = `${(y / Math.max(1, appRect.height)) * 100}%`;
  cakeFlightField.appendChild(popLabel);
  cakeTimeout(() => popLabel.remove(), 900);
  cakeTimeout(() => {
    cakeBalloonActive.delete(flyer);
    flyer.remove();
  }, 300);
}

function launchCakeBalloon() {
  if (!cakeFlightField || current !== 2 || cakeBalloonActive.size >= 6) return;

  const isMobile = window.innerWidth <= 640;
  const lanes = isMobile ? [7, 19, 81, 93] : [7, 17, 27, 73, 83, 93];
  let laneIndex = Math.floor(Math.random() * lanes.length);
  if (lanes.length > 1 && laneIndex === lastCakeBalloonLane) {
    laneIndex = (laneIndex + 1 + Math.floor(Math.random() * (lanes.length - 1))) % lanes.length;
  }
  lastCakeBalloonLane = laneIndex;

  const flyer = document.createElement('span');
  const color = cakeBalloonColors[Math.floor(Math.random() * cakeBalloonColors.length)];
  const size = (isMobile ? 31 : 34) + Math.random() * (isMobile ? 9 : 17);
  const drift = 12 + Math.random() * 28;
  const duration = 3.8 + Math.random() * 1.1;
  flyer.className = `cake-flight-balloon cake-flight-balloon--${color}`;
  flyer.innerHTML = '<span class="cake-flight-balloon__body"></span><span class="cake-flight-balloon__string"></span>';
  flyer.style.left = `${lanes[laneIndex]}%`;
  flyer.style.setProperty('--balloon-size', `${size}px`);
  flyer.style.setProperty('--drift', `${drift}px`);
  flyer.style.setProperty('--flight-duration', `${duration}s`);
  cakeFlightField.appendChild(flyer);
  cakeBalloonActive.add(flyer);

  // Usually handled by animationend; this timeout catches suspended tabs or
  // animation events skipped by some file:// browser sessions.
  flyer._riseFailsafe = cakeTimeout(() => popCakeBalloon(flyer), duration * 1000 + 160);
  flyer.addEventListener('animationend', (event) => {
    if (event.animationName !== 'cakeBalloonRise' || !flyer.isConnected) return;
    clearCakeTimeout(flyer._riseFailsafe);
    popCakeBalloon(flyer);
  });
}

function scheduleCakeBalloon(delay) {
  if (current !== 2 || !cakeFlightField) return;
  cakeBalloonSpawnTimer = cakeTimeout(() => {
    cakeBalloonSpawnTimer = null;
    if (current !== 2) return;
    launchCakeBalloon();
    scheduleCakeBalloon(760 + Math.random() * 280);
  }, delay);
}

function startCakeBalloons() {
  stopCakeBalloons();
  if (!cakeFlightField || current !== 2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // Start immediately, then stagger the next balloons so the celebration feels continuous.
  launchCakeBalloon();
  cakeTimeout(() => launchCakeBalloon(), 260);
  cakeTimeout(() => launchCakeBalloon(), 560);
  scheduleCakeBalloon(850);
}

// Balloon interaction.
const balloons = [...document.querySelectorAll('.balloon')];
function resetBalloonCard() {
  popped = 0;
  balloons.forEach(b => b.classList.remove('pop'));
  reasonCount.textContent = '0 / 5 popped';
  reasonNumber.textContent = '1';
  reasonText.textContent = balloons[0]?.dataset.reason || '';
  reasonsDone.classList.add('is-hidden');
}

balloons.forEach((balloon, idx) => {
  balloon.addEventListener('click', () => {
    if (balloon.classList.contains('pop')) return;
    popped += 1;
    balloon.classList.add('pop');
    reasonNumber.textContent = String(idx + 1);
    reasonText.textContent = balloon.dataset.reason;
    reasonCard.classList.remove('flash');
    requestAnimationFrame(() => reasonCard.classList.add('flash'));
    reasonCount.textContent = `${popped} / 5 popped`;
    burstAtBalloon(balloon);
    if (popped === balloons.length) {
      setTimeout(() => reasonsDone.classList.remove('is-hidden'), 420);
    }
  });
});

function burstAtBalloon(el) {
  const rect = el.getBoundingClientRect();
  const root = document.querySelector('.app').getBoundingClientRect();
  const x = rect.left + rect.width / 2 - root.left;
  const y = rect.top + rect.height / 2 - root.top;
  spawnParticles(x, y, 18);
}

// Tiny DOM particles for local interactions.
function spawnParticles(x, y, count = 15) {
  for (let i = 0; i < count; i++) {
    const p = document.createElement('i');
    p.style.position = 'absolute';
    p.style.left = `${x}px`;
    p.style.top = `${y}px`;
    p.style.width = `${4 + Math.random() * 5}px`;
    p.style.height = `${4 + Math.random() * 7}px`;
    p.style.borderRadius = Math.random() > .55 ? '2px' : '50%';
    p.style.background = ['#ffd26f','#f8acc4','#9fe9e3','#d9b4ff'][i % 4];
    p.style.zIndex = '15';
    p.style.pointerEvents = 'none';
    document.querySelector('.app').appendChild(p);
    const dx = (Math.random() - .5) * 160;
    const dy = (Math.random() - .5) * 160 - 40;
    const rot = (Math.random() - .5) * 600;
    p.animate([
      { transform:'translate(-50%,-50%) scale(1)', opacity:1 },
      { transform:`translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) rotate(${rot}deg) scale(.7)`, opacity:0 }
    ], { duration: 700 + Math.random()*350, easing:'cubic-bezier(.18,.72,.24,1)', fill:'forwards' }).finished.then(()=>p.remove()).catch(()=>p.remove());
  }
}

// Panda animation is a transparent animated WebP. Its motion is synchronized
// to the voice: wait until the browser confirms audio playback, then replace the
// image element so the WebP restarts from frame one at the beginning of speech.
function restartPandaAnimation() {
  if (current !== 0) return;
  const oldImage = document.querySelector('.panda-animation');
  if (!oldImage) return;

  const source = oldImage.dataset.animationSrc || oldImage.currentSrc || oldImage.src;
  const freshImage = oldImage.cloneNode(false);
  freshImage.classList.remove('panda-animation--sync-pending');
  freshImage.removeAttribute('src');

  let swapped = false;
  const swapIn = () => {
    if (swapped) return;
    swapped = true;
    if (current === 0 && oldImage.isConnected) oldImage.replaceWith(freshImage);
  };
  freshImage.addEventListener('load', swapIn, { once: true });
  freshImage.addEventListener('error', () => {
    if (current === 0 && oldImage.isConnected) oldImage.classList.remove('panda-animation--sync-pending');
  }, { once: true });
  freshImage.src = source;
  if (freshImage.complete && freshImage.naturalWidth > 0) requestAnimationFrame(swapIn);
}

// Start the voice first. The play() promise resolves once playback has actually
// started; only then is the animated panda restarted, preventing the visible
// action from running ahead while the browser buffers the MP3.
async function playPandaMessage(force = false) {
  if (!pandaAudio || current !== 0) return;
  if (!force && pandaAudioPlayed) return;

  const requestId = ++pandaPlayRequestId;
  // Hide the currently running loop while the voice restarts, so its old motion
  // cannot get ahead of the newly started greeting.
  document.querySelector('.panda-animation')?.classList.add('panda-animation--sync-pending');
  stopAudio(pandaAudio, true);

  try {
    const playPromise = pandaAudio.play();
    if (playPromise && typeof playPromise.then === 'function') await playPromise;
    if (requestId !== pandaPlayRequestId || current !== 0) return;
    pandaAudioPlayed = true;
    restartPandaAnimation();
  } catch (_) {
    // Autoplay may be blocked for local files. Reveal the panda; the hear-panda
    // button retries playback and restarts its animation in sync on user input.
    if (requestId === pandaPlayRequestId && current === 0) {
      document.querySelector('.panda-animation')?.classList.remove('panda-animation--sync-pending');
    }
  }
}

function initPanda() {
  if (pandaAudio) {
    pandaAudio.preload = 'auto';
    pandaAudio.load();
  }
  if (pandaSoundBtn) pandaSoundBtn.addEventListener('click', (event) => {
    event.stopPropagation();
    playPandaMessage(true);
  });
  playPandaMessage(false);
}

// Letter typewriter.
function startLetter() {
  clearInterval(typingTimer);
  typedLetter.textContent = '';
  caret.classList.remove('is-hidden');
  letterNext.classList.add('is-hidden');
  let i = 0;
  typingTimer = setInterval(() => {
    typedLetter.textContent += letter[i++] || '';
    if (i > letter.length) {
      clearInterval(typingTimer);
      caret.classList.add('is-hidden');
      letterNext.classList.remove('is-hidden');
    }
  }, 28);
}

// Final confetti on canvas.
function startFinale() {
  confettiCanvas.classList.add('is-active');
  const ctx = confettiCanvas.getContext('2d');
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const rect = confettiCanvas.getBoundingClientRect();
  confettiCanvas.width = rect.width * dpr;
  confettiCanvas.height = rect.height * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const pieces = Array.from({length: 140}, (_, i) => ({
    x: Math.random() * rect.width,
    y: -20 - Math.random() * rect.height,
    w: 4 + Math.random() * 5,
    h: 7 + Math.random() * 9,
    r: Math.random() * Math.PI,
    vy: 1.8 + Math.random() * 2.4,
    vx: (Math.random() - .5) * 1.2,
    vr: (Math.random() - .5) * .16,
    c: ['#ffd26f','#f2a4c2','#9be9df','#d6b4ff','#fff1d5'][i % 5]
  }));

  cancelAnimationFrame(confettiRaf);
  const tick = () => {
    ctx.clearRect(0,0,rect.width,rect.height);
    pieces.forEach(p => {
      p.y += p.vy; p.x += p.vx; p.r += p.vr;
      if (p.y > rect.height + 30) { p.y = -20; p.x = Math.random() * rect.width; }
      if (p.x < -20) p.x = rect.width + 20;
      if (p.x > rect.width + 20) p.x = -20;
      ctx.save();
      ctx.translate(p.x,p.y); ctx.rotate(p.r);
      ctx.fillStyle = p.c;
      ctx.globalAlpha = .9;
      ctx.fillRect(-p.w/2,-p.h/2,p.w,p.h);
      ctx.restore();
    });
    confettiRaf = requestAnimationFrame(tick);
  };
  tick();
}

function setupFinalConfettiDecor() {
  const rain = document.querySelector('.confetti-rain');
  const frag = document.createDocumentFragment();
  for (let i=0;i<55;i++) {
    const s=document.createElement('span');
    s.style.left=`${Math.random()*100}%`;
    s.style.animationDelay=`${-(Math.random()*6)}s`;
    s.style.animationDuration=`${4+Math.random()*5}s`;
    s.style.transform=`rotate(${Math.random()*90}deg)`;
    s.style.background=['#ffd26f','#f2a4c2','#9be9df','#d6b4ff','#fff1d5'][i%5];
    frag.appendChild(s);
  }
  rain.replaceChildren(frag);
}

document.getElementById('replay').addEventListener('click', () => {
  clearConfetti();
  goTo(0);
  resetBalloonCard();
});

document.getElementById('openLetter').addEventListener('click', () => {
  goTo(7);
});

makeStars();
setupFinalConfettiDecor();
resetBalloonCard();
initPanda();

window.addEventListener('resize', () => {
  makeStars();
  if (current === 8) startFinale();
  else clearConfetti();
});

clearConfetti();
