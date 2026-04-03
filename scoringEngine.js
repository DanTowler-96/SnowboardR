//  Snowboard Finder — Scoring Engine
//  scoreBoard(userInputs, board) → { total, pct, breakdown }

// ── Attribute maps ────────────────────────────────────────────
// maps each terrain type to board attribute tags that suit
const TERRAIN_ATTRS = {
  groomers:    ['camber', 'med-flex', 'directional-twin'],
  park:        ['twin', 'soft-flex', 'freestyle'],
  powder:      ['directional', 'rocker', 'setback'],
  trees:       ['med-flex', 'soft-flex', 'short-edge'],
  tech:        ['stiff-flex', 'strong-edge', 'camber'],
  backcountry: ['stiff-flex', 'setback', 'wide-nose'],
};

// maps each preferred feel to the board attribute tags that match
const FEEL_ATTRS = {
  playful:    ['soft-flex', 'rocker', 'twin'],
  balanced:   ['med-flex', 'directional-twin'],
  aggressive: ['stiff-flex', 'camber', 'directional'],
  surfy:      ['rocker', 'powder-shape', 'directional', 'setback'],
};

// ── Riding style cross-score matrix ──────────────────────────
// [selectedStyle][boardStyle] → points out of 25

const RIDING_STYLE_MATRIX = {
  'all-mountain': { 'all-mountain': 25, freeride: 18, piste: 16, powder: 14, park: 12, touring: 8 },
  freeride:       { freeride: 25, powder: 21, touring: 18, 'all-mountain': 16, piste: 14, park: 4 },
  park:           { park: 25, 'all-mountain': 16, freeride: 8, piste: 6, powder: 4, touring: 2 },
  piste:          { piste: 25, 'all-mountain': 20, freeride: 14, touring: 10, powder: 6, park: 4 },
  powder:         { powder: 25, freeride: 21, backcountry: 20, 'all-mountain': 14, touring: 12, piste: 4, park: 2 },
  touring:        { touring: 25, backcountry: 22, freeride: 16, powder: 14, 'all-mountain': 10, piste: 8, park: 2 },
};

// ── Boot size → width category overlap ───────────────────────
// Returns a score out of 15

function scoreBootWidth(bootSizeUK, boardWidth) {
  const ranges = {
    narrow:   { min: 4,   max: 6.5 },
    regular:  { min: 6,   max: 9   },
    'mid-wide': { min: 8.5, max: 10.5 },
    wide:     { min: 10,  max: 13  },
  };

  const range = ranges[boardWidth];
  if (!range) return 0;

  const size = parseFloat(bootSizeUK);

  if (size >= range.min && size <= range.max) return 15;

  const distanceBelow = size < range.min ? range.min - size : 0;
  const distanceAbove = size > range.max ? size - range.max : 0;
  // use the larger of the 2 distances, penalise boots that are far outside the range 
  const distance = Math.max(distanceBelow, distanceAbove);

  if (distance <= 1)  return 10;
  if (distance <= 2)  return 5;
  return 0;
}

// ── Weight scoring ────────────────────────────────────────────
// Returns a score out of 25

function scoreWeight(weightKg, boardMinWeight, boardMaxWeight) {
  const weight = parseFloat(weightKg);
  const min = parseFloat(boardMinWeight);
  const max = parseFloat(boardMaxWeight);

  if (weight >= min && weight <= max) return 25;

  const distanceBelow = weight < min ? min - weight : 0;
  const distanceAbove = weight > max ? weight - max : 0;
  const distance = Math.max(distanceBelow, distanceAbove);

  if (distance <= 5)  return 18;
  if (distance <= 10) return 10;
  if (distance <= 15) return 4;
  return 0;
}

// ── Height scoring ────────────────────────────────────────────
// Returns a score out of 10.
// Derives an ideal size range from weight first, then refines with height.

function scoreHeight(heightCm, weightKg, boardSizes) {
  const height = parseFloat(heightCm);
  const weight = parseFloat(weightKg);

  // Step 1 — derive ideal size range from weight (primary)
  let weightIdealMin, weightIdealMax;
  if (weight < 50)       { weightIdealMin = 138; weightIdealMax = 148; }
  else if (weight < 65)  { weightIdealMin = 144; weightIdealMax = 152; }
  else if (weight < 80)  { weightIdealMin = 150; weightIdealMax = 158; }
  else if (weight < 95)  { weightIdealMin = 154; weightIdealMax = 162; }
  else                   { weightIdealMin = 158; weightIdealMax = 166; }

  // Step 2 — derive height preferred zone (narrower window inside weight range)
  let heightPreferredMin, heightPreferredMax;
  if (height < 160)      { heightPreferredMin = 140; heightPreferredMax = 148; }
  else if (height < 170) { heightPreferredMin = 145; heightPreferredMax = 152; }
  else if (height < 180) { heightPreferredMin = 150; heightPreferredMax = 158; }
  else if (height < 190) { heightPreferredMin = 154; heightPreferredMax = 162; }
  else                   { heightPreferredMin = 158; heightPreferredMax = 166; }

  // Step 3 — score each available board size, return best match
  const sizes = Array.isArray(boardSizes) ? boardSizes : [];
  if (sizes.length === 0) return 5; // neutral if no size data

  const best = sizes.reduce((bestScore, size) => {
    const s = parseFloat(size);
    let pts = 0;

    const inWeightRange = s >= weightIdealMin && s <= weightIdealMax;
    const inHeightZone  = s >= heightPreferredMin && s <= heightPreferredMax;
    const closeOutside  = s >= weightIdealMin - 2 && s <= weightIdealMax + 2;

    if (inWeightRange && inHeightZone) pts = 10;   // preferred zone
    else if (inWeightRange)            pts = 7;    // ideal range
    else if (closeOutside)             pts = 4;    // close outside
    else                               pts = 0;

    return pts > bestScore ? pts : bestScore;
  }, 0);

  return best;
}

// ── Ability scoring ───────────────────────────────────────────
// Returns a score out of 25

function scoreAbility(userAbility, boardAbility) {
  const abilityScores = {
    beg:     { beg: 25, 'beg-int': 20, int: 8, 'int-adv': 2, adv: 0 },
    'beg-int': { beg: 20, 'beg-int': 25, int: 18, 'int-adv': 8,  adv: 2 },
    int:     { beg: 8,  'beg-int': 18, int: 25, 'int-adv': 20, adv: 10 },
    'int-adv': { beg: 2,  'beg-int': 8,  int: 20, 'int-adv': 25, adv: 20 },
    adv:     { beg: 0,  'beg-int': 2,  int: 10, 'int-adv': 20, adv: 25 },
  };

  const row = abilityScores[userAbility];
  if (!row) return 0;
  return row[boardAbility] ?? 0;
}

// ── Riding style scoring ──────────────────────────────────────
// Returns a score out of 25

function scoreRidingStyle(userStyle, boardStyle) {
  const row = RIDING_STYLE_MATRIX[userStyle];
  if (!row) return 0;
  return row[boardStyle] ?? 0;
}

// ── Merged style fit scoring (terrain + feel union) ───────────
// Returns a score out of 25

function scoreStyleFit(terrainFocus, preferredFeel, boardTags) {
  // Build union of voted attributes (no double-counting)
  const terrainVotes = new Set(
    (terrainFocus || []).flatMap(t => TERRAIN_ATTRS[t] || [])
  );
  const feelVotes = new Set(
    preferredFeel ? (FEEL_ATTRS[preferredFeel] || []) : []
  );
  // union terrain and feel attributes to aviod double-counting overlapping tags
  const union = new Set([...terrainVotes, ...feelVotes]);

  if (union.size === 0) return 0;

  const tags = new Set(boardTags || []);
  const matchedCount = [...union].filter(attr => tags.has(attr)).length;

  const raw = (matchedCount / union.size) * 25;
  return Math.round(Math.min(raw, 25));
}

// ─────────────────────────────────────────────────────────────
//  MAIN EXPORT — scoreBoard
//
//  userInputs: {
//    heightCm:     number,
//    weightKg:     number,
//    bootSizeUK:   number,
//    ability:      'beg' | 'beg-int' | 'int' | 'int-adv' | 'adv',
//    terrainFocus: string[]  (up to 3),
//    preferredFeel: string   (one of: playful | balanced | aggressive | surfy),
//    ridingStyle:  string    (one of: all-mountain | freeride | park | piste | powder | touring),
//  }
//
//  board: {
//    brand, model, category,
//    ability_level: string,
//    riding_style:  string,
//    flex:          number (0–10),
//    shape:         string,
//    profile:       string,
//    min_weight:    number,
//    max_weight:    number,
//    sizes:         number[],
//    width:         'narrow' | 'regular' | 'mid-wide' | 'wide',
//    tags:          string[],
//    ... (other display fields)
//  }
//
//  Returns: {
//    total:     number  (raw points, max ~120),
//    pct:       number  (0–100, normalised match percentage),
//    breakdown: { ability, ridingStyle, weight, styleFit, bootWidth, height }
//    eligible:  boolean (false if weight score is 0 — board is unsuitable)
//  }
// ─────────────────────────────────────────────────────────────

// maximum possible raw score across all 6 criteria (25+25+25+25+15+10) = 120
// used to normalise total into a %
const MAX_TOTAL = 120;

export function scoreBoard(userInputs, board) {
  const {
    heightCm,
    weightKg,
    bootSizeUK,
    ability,
    terrainFocus,
    preferredFeel,
    ridingStyle,
  } = userInputs;

  const ability_score     = scoreAbility(ability, board.ability_level);
  const ridingStyle_score = scoreRidingStyle(ridingStyle, board.riding_style);
  const weight_score      = scoreWeight(weightKg, board.min_weight, board.max_weight);
  const styleFit_score    = scoreStyleFit(terrainFocus, preferredFeel, board.tags);
  const bootWidth_score   = scoreBootWidth(bootSizeUK, board.width);
  const height_score      = scoreHeight(heightCm, weightKg, board.sizes);

  const total = (
    ability_score +
    ridingStyle_score +
    weight_score +
    styleFit_score +
    bootWidth_score +
    height_score
  );

  const pct = Math.round((total / MAX_TOTAL) * 100);

  // Boards more than 15 kg outside weight range are flagged ineligible
  const eligible = weight_score > 0;

  return {
    total,
    pct,
    eligible,
    breakdown: {
      ability:      ability_score,      // /25
      ridingStyle:  ridingStyle_score,  // /25
      weight:       weight_score,        // /25
      styleFit:     styleFit_score,      // /25
      bootWidth:    bootWidth_score,     // /15
      height:       height_score,        // /10
    },
  };
}

// ─────────────────────────────────────────────────────────────
//  scoreAllBoards — rank a full board list
//
//  Returns boards sorted by pct descending, ineligible boards
//  filtered out entirely.
// ─────────────────────────────────────────────────────────────

export function scoreAllBoards(userInputs, boards) {
  return boards
    .map(board => ({ board, ...scoreBoard(userInputs, board) }))
    .filter(result => result.eligible)
    .sort((a, b) => b.pct - a.pct);
}

// ─────────────────────────────────────────────────────────────
//  recommendSize — pick the single best size for a user
//
//  Uses the same weight + height logic as scoreHeight but
//  returns the winning size (cm) rather than a score.
//
//  Priority order:
//    1. In both weight ideal range AND height preferred zone
//    2. In weight ideal range only
//    3. Within 2cm of weight ideal range (close outside)
//    4. Closest available size to the weight ideal midpoint
//
//  @param {number}   heightCm
//  @param {number}   weightKg
//  @param {number[]} sizes     — available sizes from the board
//  @returns {number|null}      — recommended size in cm, or null if no sizes
// ─────────────────────────────────────────────────────────────

export function recommendSize(heightCm, weightKg, sizes) {
  if (!Array.isArray(sizes) || sizes.length === 0) return null;
  if (sizes.length === 1) return sizes[0];

  const height = parseFloat(heightCm);
  const weight = parseFloat(weightKg);

  // Derive weight ideal range (mirrors scoreHeight)
  let weightIdealMin, weightIdealMax;
  if (weight < 50)       { weightIdealMin = 138; weightIdealMax = 148; }
  else if (weight < 65)  { weightIdealMin = 144; weightIdealMax = 152; }
  else if (weight < 80)  { weightIdealMin = 150; weightIdealMax = 158; }
  else if (weight < 95)  { weightIdealMin = 154; weightIdealMax = 162; }
  else                   { weightIdealMin = 158; weightIdealMax = 166; }

  // Derive height preferred zone (mirrors scoreHeight)
  let heightPreferredMin, heightPreferredMax;
  if (height < 160)      { heightPreferredMin = 140; heightPreferredMax = 148; }
  else if (height < 170) { heightPreferredMin = 145; heightPreferredMax = 152; }
  else if (height < 180) { heightPreferredMin = 150; heightPreferredMax = 158; }
  else if (height < 190) { heightPreferredMin = 154; heightPreferredMax = 162; }
  else                   { heightPreferredMin = 158; heightPreferredMax = 166; }

  const weightMid = (weightIdealMin + weightIdealMax) / 2;

  // Score each size, tracking the actual size alongside its score
  const scored = sizes.map(size => {
    const s = parseFloat(size);
    const inWeightRange = s >= weightIdealMin && s <= weightIdealMax;
    const inHeightZone  = s >= heightPreferredMin && s <= heightPreferredMax;
    const closeOutside  = s >= weightIdealMin - 2 && s <= weightIdealMax + 2;

    let pts;
    if (inWeightRange && inHeightZone) pts = 10;
    else if (inWeightRange)            pts = 7;
    else if (closeOutside)             pts = 4;
    else                               pts = 0;

    // Secondary sort: proximity to weight midpoint breaks ties
    const proximity = Math.abs(s - weightMid);
    return { size: s, pts, proximity };
  });

  // Sort: highest pts first, then closest to weight midpoint
  scored.sort((a, b) => b.pts - a.pts || a.proximity - b.proximity);

  // If nothing scored, fall back to size closest to the weight midpoint
  if (scored[0].pts === 0) {
    return scored.reduce((best, cur) =>
      cur.proximity < best.proximity ? cur : best
    ).size;
  }

  return scored[0].size;
}