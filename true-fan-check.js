/* ============================================================
   realme "True Fan Check" — standalone, framework-free module.

   Not security-grade bot protection — a fun, on-brand friction layer
   shown right before a submission (not on every page load), so casual
   visitors browsing/searching the tracker are never interrupted.

   To disable entirely: set ENABLED to false below. Nothing else on the
   site needs to change — TrueFanCheck.verify() just resolves instantly.

   All trivia/tagline content below is limited to facts that are
   independently verifiable (realmeow's name, that it's a cat-inspired
   yellow mascot, and realme's "Dare to Leap" tagline) — nothing here is
   invented. The mascot artwork is an original simple design inspired by
   realmeow's colors/silhouette, not a reproduction of realme's actual
   mascot artwork.
   ============================================================ */

(function(){

const CONFIG = {
  ENABLED: true,
  SITE_NAME: "Update Tracker"
};

if (!CONFIG.ENABLED) {
  window.TrueFanCheck = { verify: () => Promise.resolve() };
  return;
}

// ---- Verified-only content banks ----------------------------------

const WORD_BANK = ["realme", "realmeow", "community", "leap", "yellow", "meow", "tracker", "update", "narzo", "neo"];

const TAGLINES = [
  { prompt: 'Complete realme\'s real tagline: "Dare to ____"', answer: "leap" }
];

const MASCOT_TRIVIA = [
  { q: "What's the name of realme's official mascot?", answer: "realmeow", options: ["realmeow", "realbot", "trendcat"] },
  { q: "realme's mascot is inspired by which animal?", answer: "cat", options: ["cat", "dog", "fox"] },
  { q: "What color is realmeow, matching realme's brand color?", answer: "yellow", options: ["yellow", "blue", "green"] }
];

const SPELLING_DECOYS = ["realme", "realm3", "rea1me", "Realme", "raelme", "realmee"];

// ---- Recent-puzzle memory (variety across visits, no backend) ------

function getRecentSignatures(){
  try{ return JSON.parse(localStorage.getItem('tfc_recent') || '[]'); }catch(e){ return []; }
}
function rememberSignature(sig){
  try{
    const recent = getRecentSignatures();
    recent.push(sig);
    while(recent.length > 200) recent.shift();
    localStorage.setItem('tfc_recent', JSON.stringify(recent));
  }catch(e){}
}
function wasRecentlyUsed(sig){
  return getRecentSignatures().includes(sig);
}

function shuffle(arr){
  const a = arr.slice();
  for(let i = a.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function pick(arr){ return arr[Math.floor(Math.random() * arr.length)]; }

// ---- Puzzle generators (each returns {type, question, options?, answer, signature}) ----

function genUnscramble(){
  const word = pick(WORD_BANK);
  let letters;
  let attempt = 0;
  do{
    letters = shuffle(word.split(''));
    attempt++;
  } while(letters.join('') === word && attempt < 8);
  return {
    type: 'text',
    question: `Unscramble this realme-related word:`,
    display: letters.join(' ').toUpperCase(),
    answer: word.toLowerCase(),
    signature: 'unscramble:' + word
  };
}

function genFillBlank(){
  const word = pick(WORD_BANK);
  const chars = word.split('');
  const maskCount = Math.max(1, Math.round(chars.length * 0.5));
  const indices = shuffle(chars.map((_, i) => i)).slice(0, maskCount);
  const display = chars.map((c, i) => indices.includes(i) ? '_' : c.toUpperCase()).join(' ');
  return {
    type: 'text',
    question: `Fill in the missing letters:`,
    display,
    answer: word.toLowerCase(),
    signature: 'fillblank:' + word + ':' + indices.join(',')
  };
}

function genSpelling(){
  const decoys = shuffle(SPELLING_DECOYS.filter(d => d !== 'realme')).slice(0, 2);
  const options = shuffle(['realme', ...decoys]);
  return {
    type: 'mcq',
    question: 'Which option is spelled exactly like the real brand name?',
    options,
    answer: 'realme',
    signature: 'spelling:' + options.join(',')
  };
}

function genTagline(){
  const t = pick(TAGLINES);
  return {
    type: 'text',
    question: t.prompt,
    answer: t.answer.toLowerCase(),
    signature: 'tagline:' + t.answer
  };
}

function genMascotTrivia(){
  const t = pick(MASCOT_TRIVIA);
  const options = shuffle(t.options);
  return {
    type: 'mcq',
    question: t.q,
    options,
    answer: t.answer,
    signature: 'trivia:' + t.q
  };
}

const GENERATORS = [genUnscramble, genFillBlank, genFillBlank, genSpelling, genTagline, genMascotTrivia, genMascotTrivia];

function generatePuzzle(){
  let puzzle;
  let tries = 0;
  do{
    puzzle = pick(GENERATORS)();
    tries++;
  } while(wasRecentlyUsed(puzzle.signature) && tries < 12);
  rememberSignature(puzzle.signature);
  return puzzle;
}

const FALLBACK_PUZZLE = {
  type: 'text',
  question: "Okay, okay — let's make this easy.",
  display: 'TYPE: realme',
  answer: 'realme',
  signature: 'fallback'
};

// ---- Original mascot SVG (inspired by realmeow's yellow cat-with-visor
// silhouette, but an independent simple design, not a reproduction) ----

function mascotSVG(){
  return `<svg viewBox="0 0 100 100" width="100%" height="100%" aria-hidden="true">
    <ellipse cx="50" cy="80" rx="19" ry="14" fill="var(--yellow, #FFC915)"/>
    <rect x="33" y="46" width="34" height="38" rx="16" fill="var(--yellow, #FFC915)"/>
    <circle cx="50" cy="40" r="24" fill="var(--yellow, #FFC915)"/>
    <path d="M30 24 L38 8 L44 26 Z" fill="var(--yellow, #FFC915)"/>
    <path d="M70 24 L62 8 L56 26 Z" fill="var(--yellow, #FFC915)"/>
    <rect x="26" y="34" width="48" height="13" rx="6.5" fill="#14161c"/>
    <rect x="30" y="37" width="14" height="3" rx="1.5" fill="rgba(255,255,255,0.5)"/>
    <path d="M46 49 L50 53 L54 49 Z" fill="#14161c"/>
    <ellipse cx="20" cy="68" rx="6" ry="11" fill="var(--yellow, #FFC915)"/>
    <ellipse cx="80" cy="68" rx="6" ry="11" fill="var(--yellow, #FFC915)"/>
  </svg>`;
}

// ---- DOM build & state ---------------------------------------------

let resolveVerify = null;
let currentPuzzle = null;
let failedOnce = false;

function buildOverlay(){
  const overlay = document.createElement('div');
  overlay.id = 'tfc-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-labelledby', 'tfc-heading');
  overlay.innerHTML = `
    <div class="tfc-card">
      <div id="tfc-gate-body">
        <div class="tfc-mascot-wrap">
          <div class="tfc-mascot-glow"></div>
          <div class="tfc-mascot-float" id="tfc-mascot-slot">${mascotSVG()}</div>
        </div>
        <div class="tfc-badge">🔒 Fan Verification</div>
        <h3 class="tfc-heading" id="tfc-heading">True Fan Check</h3>
        <p class="tfc-intro">One tiny check before this goes in — let's see what kind of realme fan you are. 🐾</p>
        <div class="tfc-status" id="tfc-status"><span class="tfc-status-dot"></span><span>Fan Check • 1 question</span></div>
        <div class="tfc-puzzle-card" id="tfc-puzzle-card"></div>
      </div>
      <div class="tfc-success" id="tfc-success">
        <div class="tfc-mascot-wrap tfc-mascot-pop" id="tfc-success-mascot-wrap">
          <div class="tfc-mascot-glow"></div>
          ${mascotSVG()}
        </div>
        <div class="tfc-success-icon">✅</div>
        <p class="tfc-success-title">Meow~ True Fan Verified!</p>
        <p class="tfc-success-sub">Welcome to ${CONFIG.SITE_NAME} — community access granted.</p>
      </div>
    </div>
  `;
  return overlay;
}

function renderPuzzle(puzzle){
  const card = document.getElementById('tfc-puzzle-card');
  if(!card) return;
  let html = `<p class="tfc-question">${escapeHtmlLocal(puzzle.question)}</p>`;
  if(puzzle.display){
    html += `<p class="tfc-word-display">${escapeHtmlLocal(puzzle.display)}</p>`;
  }
  if(puzzle.type === 'mcq'){
    html += `<div class="tfc-options">`;
    puzzle.options.forEach(opt => {
      html += `<button type="button" class="tfc-option-btn" data-answer="${escapeHtmlLocal(opt)}">${escapeHtmlLocal(opt)}</button>`;
    });
    html += `</div>`;
  } else {
    html += `<div class="tfc-text-row">
      <input type="text" class="tfc-text-input" id="tfc-text-answer" autocomplete="off" autocapitalize="off">
      <button type="button" class="tfc-verify-btn" id="tfc-verify-btn">Verify</button>
    </div>`;
  }
  card.innerHTML = html;

  if(puzzle.type === 'mcq'){
    card.querySelectorAll('.tfc-option-btn').forEach(btn => {
      btn.addEventListener('click', () => handleAnswer(btn.dataset.answer, btn));
    });
  } else {
    const input = document.getElementById('tfc-text-answer');
    const btn = document.getElementById('tfc-verify-btn');
    const submit = () => handleAnswer(input.value, btn);
    btn.addEventListener('click', submit);
    input.addEventListener('keydown', (e) => { if(e.key === 'Enter') submit(); });
    setTimeout(() => input.focus(), 50);
  }
}

function escapeHtmlLocal(str){
  const div = document.createElement('div');
  div.textContent = String(str == null ? '' : str);
  return div.innerHTML;
}

function handleAnswer(given, triggerEl){
  const normalizedGiven = String(given || '').trim().toLowerCase();
  const correct = normalizedGiven === currentPuzzle.answer.toLowerCase();

  if(correct){
    if(triggerEl && triggerEl.classList.contains('tfc-option-btn')){
      triggerEl.classList.add('tfc-selected-right');
    }
    setTimeout(showSuccess, 250);
    return;
  }

  // Wrong answer
  const card = document.getElementById('tfc-puzzle-card');
  if(triggerEl && triggerEl.classList.contains('tfc-option-btn')){
    triggerEl.classList.add('tfc-selected-wrong');
  }
  if(card){
    card.classList.remove('tfc-shake');
    void card.offsetWidth;
    card.classList.add('tfc-shake');
  }

  if(!failedOnce){
    failedOnce = true;
    setTimeout(() => {
      currentPuzzle = FALLBACK_PUZZLE;
      const status = document.getElementById('tfc-status');
      if(status) status.innerHTML = '<span class="tfc-status-dot"></span><span>Easy Mode • One last try</span>';
      renderPuzzle(currentPuzzle);
    }, 420);
  } else {
    // Already on the fallback and still wrong - just re-show it, no new
    // harder puzzle, no lockout.
    setTimeout(() => renderPuzzle(currentPuzzle), 420);
  }
}

function showSuccess(){
  const gateBody = document.getElementById('tfc-gate-body');
  const success = document.getElementById('tfc-success');
  if(gateBody) gateBody.style.display = 'none';
  if(success){
    success.classList.add('tfc-show');
    spawnConfetti(success);
  }

  try{ sessionStorage.setItem('tfc_verified', '1'); }catch(e){}

  // Resolve the promise now so the real submission proceeds immediately,
  // rather than waiting on the celebratory animation to finish playing.
  if(resolveVerify){
    const resolve = resolveVerify;
    resolveVerify = null;
    resolve();
  }

  setTimeout(() => {
    const overlay = document.getElementById('tfc-overlay');
    if(!overlay) return;
    overlay.classList.add('tfc-fade-out');
    setTimeout(() => { overlay.remove(); }, 450);
  }, 1500);
}

function spawnConfetti(container){
  const colors = ['#FFC915', '#3ecf8e', '#f2f2f4', '#e5484d'];
  for(let i = 0; i < 24; i++){
    const piece = document.createElement('div');
    piece.className = 'tfc-confetti-piece';
    const angle = Math.random() * Math.PI * 2;
    const dist = 60 + Math.random() * 70;
    piece.style.setProperty('--tfc-cx', Math.cos(angle) * dist + 'px');
    piece.style.setProperty('--tfc-cy', Math.sin(angle) * dist - 30 + 'px');
    piece.style.setProperty('--tfc-cr', (Math.random() * 360) + 'deg');
    piece.style.background = colors[i % colors.length];
    piece.style.animationDelay = (Math.random() * 0.15) + 's';
    container.appendChild(piece);
  }
}

// ---- Public API -------------------------------------------------------

window.TrueFanCheck = {
  verify: function(){
    let alreadyVerified = false;
    try{ alreadyVerified = sessionStorage.getItem('tfc_verified') === '1'; }catch(e){}
    if(alreadyVerified){
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      resolveVerify = resolve;
      failedOnce = false;
      currentPuzzle = generatePuzzle();

      const existing = document.getElementById('tfc-overlay');
      if(existing) existing.remove();

      const overlay = buildOverlay();
      document.body.appendChild(overlay);
      renderPuzzle(currentPuzzle);
    });
  }
};

})();
