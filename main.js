import { findBoards, preloadBoards } from './boardFinder.js';

// Pre-fetch boards.json immediately so its cached before the user submits the form
preloadBoards();

// ── Terrain checkbox — max 3 ──────────────────────────────────
const terrainCheckboxes = document.querySelectorAll('input[name="terrain"]');
// once 3 terrain options are checked, disable remaining unchecked ones so user can't select more than 3
terrainCheckboxes.forEach(cb => {
  cb.addEventListener('change', () => {
    const checked = document.querySelectorAll('input[name="terrain"]:checked');
    terrainCheckboxes.forEach(c => {
      if (!c.checked) c.disabled = checked.length >= 3;
    });
  });
});

// ── DOM refs ──────────────────────────────────────────────────
const form            = document.getElementById('finder-form');
const submitBtn       = document.getElementById('submit-btn');
const status          = document.getElementById('status');
const quizPanel       = document.getElementById('quiz-panel');
const resultsPanel    = document.getElementById('results-panel');
const topPicksGrid    = document.getElementById('top-picks-grid');
const alsoGrid        = document.getElementById('also-consider-grid');
const alsoSection     = document.getElementById('also-consider-section');
const resultsTitle    = document.getElementById('results-title');
const resultsSub      = document.getElementById('results-subtitle');
const backBtn         = document.getElementById('back-btn');
const modalOverlay    = document.getElementById('modal-overlay');
const modalEl         = document.getElementById('modal');
const modalContent    = document.getElementById('modal-content');
const modalClose      = document.getElementById('modal-close');

// stores full scored result set so filters can re-slice without re-running scoring
let allResults        = [];

// ── Filter functions ──────────────────────────────────────────
// derives available brands dynamically from the result set and populates the dropdown
function populateBrandFilter(results) {
  const brandSelect = document.getElementById('filter-brand');
  const brands = [...new Set(results.map(r => r.board.brand))].sort();
  brandSelect.innerHTML = '<option value="">All brands</option>';
  brands.forEach(brand => {
    const opt = document.createElement('option');
    opt.value = brand;
    opt.textContent = brand;
    brandSelect.appendChild(opt);
  });
}
function applyFilters() {
  const brand    = document.getElementById('filter-brand').value;
  const flex     = document.getElementById('filter-flex').value;
  const maxPrice = parseInt(document.getElementById('price-range').value);

  const filtered = allResults.filter(r => {
    if (brand && r.board.brand !== brand) return false;
    // 1000 is the sliders 'no limit' value, only apply price filtering below it
    if (maxPrice < 1000 && r.board.price > maxPrice) return false;
    if (flex === 'soft'   && r.board.flex > 3) return false;
    if (flex === 'medium' && (r.board.flex < 4 || r.board.flex > 6)) return false;
    if (flex === 'stiff'  && r.board.flex < 7) return false;
    return true;
  });

  const resultMap = new Map(allResults.map(r => [r.board.id, r]));
  const topPicks     = filtered.filter(r => r.pct >= 75).slice(0, 3);
  const alsoConsider = filtered.slice(topPicks.length, topPicks.length + 5);

  topPicksGrid.innerHTML = '';
  alsoGrid.innerHTML = '';

  if (filtered.length === 0) {
    topPicksGrid.innerHTML = '<p style="color:var(--muted);font-size:14px;padding:12px 0;">No boards match these filters.</p>';
    alsoSection.classList.add('hidden');
    return;
  }

  renderGrid(topPicks.length > 0 ? topPicks : filtered.slice(0, 3), topPicksGrid, resultMap);

  if (alsoConsider.length > 0) {
    alsoSection.classList.remove('hidden');
    renderGrid(alsoConsider, alsoGrid, resultMap);
  } else {
    alsoSection.classList.add('hidden');
  }
}

// ── Back button ───────────────────────────────────────────────
backBtn.addEventListener('click', () => {
  resultsPanel.classList.add('hidden');
  quizPanel.classList.remove('hidden');
  topPicksGrid.innerHTML = '';
  alsoGrid.innerHTML = '';
  alsoSection.classList.add('hidden');
  status.textContent = '';

  // Clear all form inputs
  form.reset();
  terrainCheckboxes.forEach(cb => cb.disabled = false);
});

// ── Filter event listeners ────────────────────────────────────
const priceRange = document.getElementById('price-range');
const priceLabel = document.getElementById('price-label');

document.getElementById('filter-brand').addEventListener('change', applyFilters);
document.getElementById('filter-flex').addEventListener('change', applyFilters);

priceRange.addEventListener('input', () => {
  priceLabel.textContent = priceRange.value == 1000 ? '1000+' : priceRange.value;
  applyFilters();
});

document.getElementById('filter-reset').addEventListener('click', () => {
  document.getElementById('filter-brand').value = '';
  document.getElementById('filter-flex').value = '';
  priceRange.value = 1000;
  priceLabel.textContent = '1000+';
  applyFilters();
});

// ── Modal controls ────────────────────────────────────────────
// lock body scroll while modal is open so background doesnt scroll behind it
function openModal(html) {
  modalContent.innerHTML = html;
  modalOverlay.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}
function closeModal() {
  modalOverlay.classList.add('hidden');
  document.body.style.overflow = '';
}
// close modal on: X button click, backdrop click, esc key
modalClose.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', e => { if (e.target === modalOverlay) closeModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

// ── Helper: match colour class ────────────────────────────────
// maps a match percentage to a CSS class that controls the colour of the match badge
function matchClass(pct) {
  if (pct >= 75) return 'match-high';
  if (pct >= 55) return 'match-mid';
  return 'match-low';
}

// ── Build board card HTML ─────────────────────────────────────
function buildCard(result) {
  const { board, pct, recommendedSize } = result;
  const mc = matchClass(pct);

  const imgSrc = board.image_url || '';
  // if board image fails, hide image and replace with placeholder emoji
  const imgHtml = `<img class="card-image" src="${imgSrc}" alt="${board.brand} ${board.model}"
    onerror="this.style.display='none';this.nextElementSibling.style.display='flex';" /><div class="card-image-placeholder" style="display:none">🏂</div>`;

  const specsHtml = [
    board.profile,
    board.shape,
    `flex ${board.flex}/10`,
    board.category,
  ].map(s => `<span class="spec-tag">${s}</span>`).join('');

  return `
    <div class="board-card" data-id="${board.id}">
      ${imgHtml}
      <div class="card-body">
        <span class="card-match ${mc}">${pct}% match</span>
        ${result.overBudget ? `<span class="over-budget-badge">Over budget</span>` : ''}
        <div class="card-brand">${board.brand}</div>
        <div class="card-model">${board.model}</div>
        <div class="card-desc">${board.description}</div>
        <div class="card-specs">${specsHtml}</div>
      </div>
      <div class="card-footer">
        <div>
          <div class="card-price">£${board.price}</div>
          ${recommendedSize ? `<div class="card-size">Rec. size: ${recommendedSize}cm</div>` : ''}
        </div>
        <span class="card-cta">View details
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </span>
      </div>
    </div>
  `;
}

// ── Build modal HTML ──────────────────────────────────────────
function buildModal(result) {
  const { board, pct, recommendedSize } = result;
  const mc = matchClass(pct);

  const imgSrc = board.image_url || '';
  const imgHtml = `<img class="modal-image" src="${imgSrc}" alt="${board.brand} ${board.model}"
    onerror="this.style.display='none';this.nextElementSibling.style.display='flex';" /><div class="modal-image-placeholder" style="display:none">🏂</div>`;

  const affiliateHtml = board.affiliate_url
    ? `<a class="affiliate-btn" href="${board.affiliate_url}" target="_blank" rel="noopener noreferrer">
         BUY NOW
         <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
       </a>`
    : '';

  const specsHtml = [
    { label: 'Profile',  val: board.profile },
    { label: 'Shape',    val: board.shape },
    { label: 'Flex',     val: `${board.flex}/10` },
    { label: 'Category', val: board.category },
    { label: 'Width',    val: board.width },
    { label: 'Powder',   val: board.powder_friendly ? 'Yes' : 'No' },
    { label: 'Edge hold',val: board.edge_hold },
    ...(recommendedSize ? [{ label: 'Rec. size', val: `${recommendedSize}cm` }] : []),
  ].map(s => `<div class="modal-spec"><strong>${s.val}</strong>${s.label}</div>`).join('');

  const fullDesc = board.full_description || board.description;
  const whyHtml  = board.why_recommended
    ? `<div class="modal-section">
         <div class="modal-section-title">WHY THIS BOARD IS FOR YOU</div>
         <div class="why-box"><p>${board.why_recommended}</p></div>
       </div>`
    : '';

  return `
    ${imgHtml}
    <div class="modal-body">
      <div class="modal-meta">
        <span class="modal-brand">${board.brand}</span>
        <span class="card-match ${mc} modal-match-badge">${pct}% match</span>
      </div>
      <div class="modal-model">${board.model}</div>
      <div class="modal-specs-row">${specsHtml}</div>

      <div class="modal-section">
        <div class="modal-section-title">ABOUT THIS BOARD</div>
        <p>${fullDesc}</p>
      </div>

      ${whyHtml}

      <div class="modal-price-row">
        <div>
          <div class="modal-price"><span>$</span>${board.price}</div>
          ${recommendedSize ? `<div class="modal-size">Recommended size for you: ${recommendedSize}cm</div>` : ''}
        </div>
        ${affiliateHtml}
      </div>
    </div>
  `;
}

// ── Render boards into a grid ─────────────────────────────────
function renderGrid(results, container, resultMap) {
  container.innerHTML = results.map(r => buildCard(r)).join('');
  container.querySelectorAll('.board-card').forEach(card => {
    // look up full result object by board ID so we can pass it to modal
    card.addEventListener('click', () => {
      const r = resultMap.get(card.dataset.id);
      if (r) openModal(buildModal(r));
    });
  });
}

// ── Form submit ───────────────────────────────────────────────
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const heightCm   = parseFloat(document.getElementById('height').value);
  const weightKg   = parseFloat(document.getElementById('weight').value);
  const bootSizeUK = parseFloat(document.getElementById('boot-size').value);
  const ability    = document.getElementById('ability').value;
  const feel       = document.getElementById('feel').value;
  const ridingStyle = document.getElementById('riding-style').value;
  const terrainFocus = [...document.querySelectorAll('input[name="terrain"]:checked')].map(cb => cb.value);
  const budget = parseFloat(document.getElementById('budget').value) || null;

  if (!heightCm || !weightKg || !bootSizeUK || !ability || !feel || !ridingStyle) {
    status.textContent = 'Please fill in all fields.';
    return;
  }
  if (terrainFocus.length === 0) {
    status.textContent = 'Please select at least one terrain focus.';
    return;
  }

  status.textContent = '';
  submitBtn.disabled = true;
  submitBtn.querySelector('span').textContent = 'SEARCHING…';

  try {
    const userInputs = { heightCm, weightKg, bootSizeUK, ability, terrainFocus, preferredFeel: feel, ridingStyle, budget };
    const results = await findBoards(userInputs, { minPct: 30 });

    if (results.length === 0) {
      status.textContent = 'No matching boards found. Try broadening your inputs.';
      return;
    }

  // Switch panels
quizPanel.classList.add('hidden');
resultsPanel.classList.remove('hidden');
resultsTitle.textContent = 'YOUR RESULTS';

// Store results and render via filters
allResults = results;
populateBrandFilter(results);

// if no results fall within budget, warn user rather than silently showing over-budget boards
if (budget) {
  const withinBudget = results.filter(r => r.board.price <= budget);
  if (withinBudget.length === 0) {
    resultsSub.textContent = `No boards found within £${budget}. Showing the closest matches over budget.`;  
  } else {
    resultsSub.textContent = `Based on your height, weight, ability and terrain preferences.`;
  }
}

// Reset filter UI
document.getElementById('filter-brand').value = '';
document.getElementById('filter-flex').value = '';
priceRange.value = 1000;
priceLabel.textContent = '1000+';

applyFilters(); 

    window.scrollTo({ top: 0, behavior: 'smooth' });

  } catch (err) {
    status.textContent = 'Something went wrong. Please try again.';
    console.error('boardFinder error:', err);
  } finally {
    submitBtn.disabled = false;
    submitBtn.querySelector('span').textContent = 'FIND MY BOARD';
  }
});