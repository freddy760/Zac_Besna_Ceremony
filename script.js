/* =========================================================
   BESNA CEREMONY — Slideshow engine
   - Auto-advances every ~3s with a soft dissolve
   - Slow Ken-Burns zoom on each photo
   - Prev / Next / Play-Pause, progress, captions
   - Optional looping music with mute/unmute
   - Keyboard (← → space) and touch-swipe support
   ========================================================= */

/* ---------------------------------------------------------
   1) THE SLIDES
   Order comes from besna_final_sequence.csv.
   Captions are added ONLY for a few key moments — leave the
   others as '' (empty) so most photos show with no caption.
   To use your own filenames, just edit the `src` values.
   --------------------------------------------------------- */
const slides = [
  { src: 'images/01.jpg', caption: '' },                          // 01 — Cover family portrait
  { src: 'images/02.jpg', caption: '' },                          // 02 — Strong family portrait
  { src: 'images/03.jpg', caption: '' },                          // 03 — Warm family candid
  { src: 'images/04.jpg', caption: 'The ceremony begins' },       // 04 — Ceremony detail shot
  { src: 'images/05.jpg', caption: '' },                          // 05 — Opening seated portrait
  { src: 'images/06.jpg', caption: '' },                          // 06 — Seated portrait with support
  { src: 'images/07.jpg', caption: '' },                          // 07 — Seated smiling portrait
  { src: 'images/08.jpg', caption: '' },                          // 08 — Seated portrait looking up
  { src: 'images/09.jpg', caption: 'A moment of blessing' },      // 09 — Blessing moment
  { src: 'images/10.jpg', caption: '' },                          // 10 — Blessing interaction
  { src: 'images/11.jpg', caption: '' },                          // 11 — Family interaction during ritual
  { src: 'images/12.jpg', caption: '' },                          // 12 — Happy expression during ritual
  { src: 'images/13.jpg', caption: '' },                          // 13 — Portrait during ritual
  { src: 'images/14.jpg', caption: '' },                          // 14 — Clear ritual frame
  { src: 'images/15.jpg', caption: '' },                          // 15 — Clean concluding ritual frame
  { src: 'images/16.jpg', caption: 'Surrounded by those we love' },// 16 — Group ritual wide shot
  { src: 'images/17.jpg', caption: '' },                          // 17 — Group ritual close shot
  { src: 'images/18.jpg', caption: '' },                          // 18 — Parents/couple portrait with ritual item
  { src: 'images/19.jpg', caption: "A father's tender love" },    // 19 — Tender father-child moment
  { src: 'images/20.jpg', caption: '' },                          // 20 — Strong child solo portrait
  { src: 'images/21.jpg', caption: 'Held close, with love' },     // 21 — Affectionate closing moment
  { src: 'images/22.jpg', caption: '' },                          // 22 — Father-child close portrait
  { src: 'images/23.jpg', caption: '' },                          // 23 — Father-child close portrait variant
  { src: 'images/24.jpg', caption: '' },                          // 24 — Seated portrait alternate
  { src: 'images/25.jpg', caption: '' },                          // 25 — Close father-child portrait
  { src: 'images/26.jpg', caption: '' },                          // 26 — Father kneeling beside child
  { src: 'images/27.jpg', caption: '' },                          // 27 — Family portrait on sofa
  { src: 'images/28.jpg', caption: '' },                          // 28 — Ritual close-up with participants
  { src: 'images/29.jpg', caption: '' },                          // 29 — Parent and child affectionate portrait
  { src: 'images/30.jpg', caption: "A mother's gentle embrace" }, // 30 — Mother and baby portrait
  { src: 'images/31.jpg', caption: '' },                          // 31 — Father-child seated portrait
  { src: 'images/32.jpg', caption: 'Together, we celebrate' },    // 32 — Group ritual storytelling frame
];

/* The opening and closing text slides (no photo). */
const titleSlide = {
  type: 'text',
  ornament: '\u2766',                          // ❦ floral ornament
  h1: 'Besna Ceremony',
  h2: 'A Beautiful Family Celebration',
  p:  'With love, blessings, and cherished memories',
};
const endSlide = {
  type: 'text',
  ornament: '\u2766',
  h1: 'Thank You',
  h2: 'For being part of this special celebration',
  p:  'With love and blessings',
};

/* ---------------------------------------------------------
   2) SETTINGS
   --------------------------------------------------------- */
const PHOTO_MS  = 3000;   // each photo shows ~3 seconds
const TITLE_MS  = 5000;   // title / thank-you linger a little longer
const FADE_MS   = 1400;   // must match --fade-seconds in style.css

/* ---------------------------------------------------------
   3) BUILD THE DECK
   Full deck = [title]  +  [32 photos]  +  [thank you]
   --------------------------------------------------------- */
const deck       = document.getElementById('deck');
const captionEl  = document.getElementById('caption');
const progressEl = document.getElementById('progress');
const viewport   = document.getElementById('viewport');

const photoCount = slides.length;
const fullDeck   = [titleSlide, ...slides, endSlide];

fullDeck.forEach((item, i) => {
  const el = document.createElement('div');
  el.className = 'slide';

  if (item.type === 'text') {
    el.classList.add('slide--text');
    el.innerHTML = `
      <div class="ornament">${item.ornament}</div>
      <h1>${item.h1}</h1>
      <h2>${item.h2}</h2>
      <div class="rule"></div>
      <p>${item.p}</p>`;
  } else {
    el.classList.add('slide--photo');

    // Blurred backdrop (a soft, on-palette fill behind the full photo)
    const bg = document.createElement('div');
    bg.className = 'slide-bg';
    bg.style.backgroundImage = `url("${item.src}")`;

    // The sharp, full photo — shown complete via object-fit: contain
    const img = document.createElement('img');
    img.className = 'slide-photo';
    img.src = item.src;
    img.alt = item.caption || 'Besna ceremony photo';
    img.loading = i <= 2 ? 'eager' : 'lazy';   // first slides load immediately

    // Make the gentle zoom run a touch longer than the slide so it never snaps
    el.style.setProperty('--kb-seconds', ((PHOTO_MS + FADE_MS * 2) / 1000) + 's');

    el.appendChild(bg);
    el.appendChild(img);
  }
  deck.appendChild(el);
});

const slideEls = Array.from(deck.children);
const TOTAL    = slideEls.length;

/* ---------------------------------------------------------
   4) STATE & CORE NAVIGATION
   --------------------------------------------------------- */
let current = 0;
let playing = true;
let timer   = null;

function isPhoto(i)      { return i >= 1 && i <= photoCount; }
function photoNumber(i)  { return i; }                      // index 1 == photo 1

function show(index) {
  // wrap around the whole deck
  index = (index + TOTAL) % TOTAL;

  slideEls[current].classList.remove('is-active');
  current = index;
  const el = slideEls[current];

  // Re-trigger the gentle Ken-Burns animation on both photo layers
  el.querySelectorAll('.slide-photo, .slide-bg').forEach((node) => {
    node.style.animation = 'none';
    void node.offsetWidth;          // force reflow so the animation restarts
    node.style.animation = '';
  });

  el.classList.add('is-active');

  updateCaption();
  updateProgress();
}

function next() { show(current + 1); }
function prev() { show(current - 1); }

/* ---------------------------------------------------------
   5) CAPTION & PROGRESS
   --------------------------------------------------------- */
function updateCaption() {
  const item = fullDeck[current];
  const text = (item && item.type !== 'text' && item.caption) ? item.caption : '';
  captionEl.textContent = text;
  captionEl.classList.toggle('show', text !== '');
}

function updateProgress() {
  if (isPhoto(current)) {
    progressEl.textContent = `Photo ${photoNumber(current)} of ${photoCount}`;
  } else if (current === 0) {
    progressEl.textContent = 'Welcome';
  } else {
    progressEl.textContent = 'Thank you';
  }
}

/* ---------------------------------------------------------
   6) AUTOPLAY (with timing that suits the slide type)
   --------------------------------------------------------- */
function scheduleNext() {
  clearTimeout(timer);
  if (!playing) return;
  const dwell = isPhoto(current) ? PHOTO_MS : TITLE_MS;
  timer = setTimeout(() => { next(); scheduleNext(); }, dwell + FADE_MS);
}

function play() {
  playing = true;
  viewport.classList.remove('is-paused');
  playBtn.setAttribute('aria-label', 'Pause slideshow');
  scheduleNext();
}
function pause() {
  playing = false;
  viewport.classList.add('is-paused');
  playBtn.setAttribute('aria-label', 'Play slideshow');
  clearTimeout(timer);
}
function togglePlay() { playing ? pause() : play(); }

/* When the user navigates manually, gently restart the timer. */
function manualGo(fn) { fn(); if (playing) scheduleNext(); }

/* ---------------------------------------------------------
   7) CONTROL BUTTONS
   --------------------------------------------------------- */
const prevBtn  = document.getElementById('prevBtn');
const nextBtn  = document.getElementById('nextBtn');
const playBtn  = document.getElementById('playBtn');
const musicBtn = document.getElementById('musicBtn');
const muteBtn  = document.getElementById('muteBtn');

prevBtn.addEventListener('click', () => manualGo(prev));
nextBtn.addEventListener('click', () => manualGo(next));
playBtn.addEventListener('click', togglePlay);

/* ---------------------------------------------------------
   8) MUSIC  (browsers block autoplay, so it starts on click)
   --------------------------------------------------------- */
const audio = document.getElementById('bgMusic');
let musicReady = false;

musicBtn.addEventListener('click', () => {
  if (audio.paused) {
    audio.volume = 0;                       // start silent, then fade up softly
    audio.play().then(() => {
      musicReady = true;
      muteBtn.hidden = false;
      musicBtn.querySelector('.music-label').textContent = 'Pause Music';
      fadeVolume(0.45, 1500);               // gentle fade-in to a soft level
    }).catch(() => {
      // If the file is missing, let the user know gracefully.
      musicBtn.querySelector('.music-label').textContent = 'Music unavailable';
    });
  } else {
    audio.pause();
    musicBtn.querySelector('.music-label').textContent = 'Play Soft Music';
  }
});

muteBtn.addEventListener('click', () => {
  audio.muted = !audio.muted;
  viewport.classList.toggle('is-muted', audio.muted);
  muteBtn.setAttribute('aria-label', audio.muted ? 'Unmute music' : 'Mute music');
});

/* Smoothly ramp the volume so music never jolts in. */
function fadeVolume(target, ms) {
  const steps = 30, start = audio.volume, step = (target - start) / steps;
  let n = 0;
  const id = setInterval(() => {
    n++;
    audio.volume = Math.min(1, Math.max(0, start + step * n));
    if (n >= steps) clearInterval(id);
  }, ms / steps);
}

/* ---------------------------------------------------------
   9) KEYBOARD SUPPORT  (← → and space)
   --------------------------------------------------------- */
document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowRight')      { e.preventDefault(); manualGo(next); }
  else if (e.key === 'ArrowLeft')  { e.preventDefault(); manualGo(prev); }
  else if (e.key === ' ')          { e.preventDefault(); togglePlay(); }
});

/* ---------------------------------------------------------
   10) TOUCH / SWIPE SUPPORT
   --------------------------------------------------------- */
let touchX = null;
viewport.addEventListener('touchstart', (e) => { touchX = e.changedTouches[0].clientX; }, { passive: true });
viewport.addEventListener('touchend', (e) => {
  if (touchX === null) return;
  const dx = e.changedTouches[0].clientX - touchX;
  if (Math.abs(dx) > 45) manualGo(dx < 0 ? next : prev);  // swipe left = next
  touchX = null;
}, { passive: true });

/* ---------------------------------------------------------
   11) START
   --------------------------------------------------------- */
show(0);
play();
