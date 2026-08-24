// ── Receipt-printer submission animation (optional add-on) ────────────
// Delete this file (and its <script> tag in index.html) to fall back to
// the plain "Thank you!" confirmation baked into index.html. No other
// changes needed anywhere else — handleSubmit() calls window.showThankYou,
// which this file overrides only if it successfully loads and runs.
(function(){
  const panel = document.getElementById('submitPanel');
  if(!panel) return; // core markup missing/renamed — bail safely, plain thank-you still works

  panel.insertAdjacentHTML('beforeend', `
    <div class="thankyou-overlay" id="thankyouOverlay">
      <div class="rt-slot" id="rtSlot">
        <div class="rt-led"></div>
        <div class="rt-slot-label" id="rtSlotLabel">Printing your receipt…</div>
      </div>
      <div class="rt-slot-mouth"></div>

      <div class="rt-paper-wrap" id="rtPaperWrap">
        <div class="rt-printhead" id="rtPrinthead"></div>
        <div class="rt-paper" id="rtPaper">
          <div class="rt-brand rt-ink">UPDATE TRACKER<span>SUBMISSION RECEIPT</span></div>
          <hr class="rt-div rt-ink">
          <div class="rt-row rt-ink"><span class="k">Device</span><span class="v" id="rtDevice">—</span></div>
          <div class="rt-row rt-ink"><span class="k">Previous ver.</span><span class="v" id="rtPrev">—</span></div>
          <div class="rt-row rt-ink"><span class="k">Latest ver.</span><span class="v" id="rtCurr">—</span></div>
          <div class="rt-row rt-ink"><span class="k">Submitted</span><span class="v" id="rtTime">—</span></div>
          <div class="rt-row rt-ink"><span class="k">Status</span><span class="v ok" id="rtStatus">Received ✓</span></div>
          <div class="rt-stamp" id="rtStamp"><div class="rt-stamp-ring"><div class="rt-stamp-ring-in"><span class="rt-stamp-word">SUBMITTED</span></div></div></div>
          <hr class="rt-div rt-ink">
          <div class="rt-thanks2 rt-ink">THANK YOU FOR CONTRIBUTING!</div>
          <div class="rt-sub2 rt-ink">Your submission helps the whole community. It's live now, tagged Unverified until confirmed.</div>
          <div class="rt-barcode rt-ink" id="rtBarcode"></div>
          <div class="rt-tear rt-ink" id="rtTear"></div>
        </div>
        <img id="rtPaperImg" class="rt-receipt-img" style="display:none;" alt="Submission receipt">
      </div>

      <div class="rt-actions" id="rtActions">
        <button class="rt-btn2" id="rtDownloadBtn" type="button">Download receipt</button>
        <div class="rt-hint">Tip: long-press the receipt above to save it directly</div>
        <button class="rt-again" id="rtAgainBtn" type="button">Submit another device</button>
      </div>
    </div>
  `);

  const RT_PRINT_DURATION = 2000;
  const RT_REDUCE_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let rtRenderedDataUrl = null;

  function rtFinalizeImage(){
    const paper = document.getElementById('rtPaper');
    const img   = document.getElementById('rtPaperImg');
    if(typeof html2canvas === 'undefined') return; // library not loaded — live paper stays visible, which is fine
    html2canvas(paper, {backgroundColor:'#F7F5EF', scale:2}).then(canvas => {
      rtRenderedDataUrl = canvas.toDataURL('image/png');
      img.src = rtRenderedDataUrl;
      img.style.display = 'block';
      paper.style.display = 'none';
    }).catch(() => { /* download button still works straight off the live DOM as a fallback */ });
  }

  function rtBuildBarcode(seedStr){
    const wrap = document.getElementById('rtBarcode');
    if(!wrap) return;
    wrap.innerHTML = '';
    let seed = 0;
    const s = String(seedStr || 'update-tracker');
    for(let i = 0; i < s.length; i++){ seed = (seed * 31 + s.charCodeAt(i)) >>> 0; }
    const frag = document.createDocumentFragment();
    for(let i = 0; i < 32; i++){
      seed = (seed * 1103515245 + 12345) >>> 0;
      const bar = document.createElement('span');
      bar.style.width = (2 + (seed % 4)) + 'px'; // 2-5px, varied per submission
      frag.appendChild(bar);
    }
    wrap.appendChild(frag);
  }

  function rtBuildTear(){
    const wrap = document.getElementById('rtTear');
    if(!wrap) return;
    const frag = document.createDocumentFragment();
    for(let i = 0; i < 26; i++){ frag.appendChild(document.createElement('span')); }
    wrap.appendChild(frag);
  }
  rtBuildTear();

  function showReceiptSlip(device, prevVersion, currVersion){
    const slot      = document.getElementById('rtSlot');
    const slotLabel = document.getElementById('rtSlotLabel');
    const paperWrap = document.getElementById('rtPaperWrap');
    const printhead = document.getElementById('rtPrinthead');
    const actions   = document.getElementById('rtActions');
    const paper     = document.getElementById('rtPaper');
    const img       = document.getElementById('rtPaperImg');
    const stampRing = document.querySelector('#rtStamp .rt-stamp-ring');
    const inkBlocks = paper.querySelectorAll('.rt-ink');

    paper.style.display = '';
    img.style.display = 'none';
    img.src = '';
    rtRenderedDataUrl = null;

    document.getElementById('rtDevice').textContent = device || '—';
    document.getElementById('rtPrev').textContent   = prevVersion || '—';
    document.getElementById('rtCurr').textContent   = currVersion || '—';
    document.getElementById('rtTime').textContent   = new Date().toLocaleString('en-IN',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'});
    rtBuildBarcode([device, prevVersion, currVersion, Date.now()].join('|'));

    paperWrap.style.clipPath = 'inset(0 0 100% 0)';
    printhead.style.top = '0%';
    printhead.style.opacity = '0';
    inkBlocks.forEach(el => el.classList.remove('lit'));
    if(stampRing) stampRing.classList.remove('stamped');
    actions.classList.remove('show');
    slot.classList.add('printing');
    slotLabel.textContent = 'Printing your receipt…';

    if(RT_REDUCE_MOTION){
      paperWrap.style.clipPath = 'inset(0 0 0% 0)';
      inkBlocks.forEach(el => el.classList.add('lit'));
      slot.classList.remove('printing');
      slotLabel.textContent = 'Submission received ✓';
      actions.classList.add('show');
      if(stampRing) stampRing.classList.add('stamped');
      rtFinalizeImage();
      return;
    }

    printhead.style.opacity = '1';
    inkBlocks.forEach((el, i) => {
      const delay = (i / inkBlocks.length) * (RT_PRINT_DURATION * 0.85);
      setTimeout(() => el.classList.add('lit'), delay);
    });

    const start = performance.now();
    function tick(now){
      const t = Math.min((now - start) / RT_PRINT_DURATION, 1);
      const eased = 1 - Math.pow(1 - t, 2);
      paperWrap.style.clipPath = `inset(0 0 ${(1 - eased) * 100}% 0)`;
      printhead.style.top = (eased * 100) + '%';
      if(t < 1){
        requestAnimationFrame(tick);
      } else {
        printhead.style.opacity = '0';
        slot.classList.remove('printing');
        slotLabel.textContent = 'Submission received ✓';
        actions.classList.add('show');
        setTimeout(() => {
          if(stampRing) stampRing.classList.add('stamped');
          setTimeout(rtFinalizeImage, 420);
        }, 150);
      }
    }
    requestAnimationFrame(tick);
  }

  document.getElementById('rtDownloadBtn').addEventListener('click', () => {
    const finish = (url) => {
      const link = document.createElement('a');
      const dev = (document.getElementById('rtDevice').textContent || 'device').replace(/\s+/g,'_');
      link.download = `receipt-${dev}.png`;
      link.href = url;
      link.click();
    };
    if(rtRenderedDataUrl){ finish(rtRenderedDataUrl); return; }
    if(typeof html2canvas === 'undefined'){ alert('Could not prepare the download — the receipt still works, just try again or long-press it to save.'); return; }
    html2canvas(document.getElementById('rtPaper'), {backgroundColor:'#F7F5EF', scale:2}).then(c => finish(c.toDataURL('image/png')));
  });

  document.getElementById('rtAgainBtn').addEventListener('click', closeThankYou);

  // Take over from the plain fallback now that everything above worked.
  window.showThankYou = function(device, old, latest){
    document.getElementById('thankyouOverlay').classList.add('show');
    showReceiptSlip(device, old, latest);
  };
})();
