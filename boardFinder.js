//  Snowboard Finder - Wiring Layer
//  Loads boards.json, runs scoring, exposes a clean API

import { scoreAllBoards, recommendSize } from './scoringEngine.js';

// ── Internal state ────────────────────────────────────────────

let _boards = null;        // cached board data after first fetch
let _loadPromise = null;   // prevents duplicate in-flight fetches

// ── Board loader ──────────────────────────────────────────────

/**
 * Fetches and caches boards.json.
 * Safe to call multiple times — only fetches once.
 *
 * @param {string} [url='./boards.json']
 * @returns {Promise<Array>}
 */
async function loadBoards(url = './boards.json') {
  if (_boards) return _boards;

  if (!_loadPromise) {
    _loadPromise = fetch(url)
      .then(res => {
        if (!res.ok) throw new Error(`Failed to load boards: ${res.status} ${res.statusText}`);
        return res.json();
      })
      .then(data => {
        _boards = data;
        return _boards;
      })
      .catch(err => {
        _loadPromise = null; // allow retry on next call if fetch failed
        throw err;
      });
  }

  return _loadPromise;
}

// ── Main API ──────────────────────────────────────────────────

/**
 * Run the full scoring pipeline against all boards.
 *
 * @param {Object} userInputs
 * @param {number}   userInputs.heightCm
 * @param {number}   userInputs.weightKg
 * @param {number}   userInputs.bootSizeUK
 * @param {string}   userInputs.ability        — 'beg' | 'beg-int' | 'int' | 'int-adv' | 'adv'
 * @param {string[]} userInputs.terrainFocus   — up to 3 of: groomers | park | powder | trees | tech | backcountry
 * @param {string}   userInputs.preferredFeel  — playful | balanced | aggressive | surfy
 * @param {string}   userInputs.ridingStyle    — all-mountain | freeride | park | piste | powder | touring
 *
 * @param {Object}  [options]
 * @param {number}  [options.limit]            — max results to return (default: all)
 * @param {number}  [options.minPct]           — filter out boards below this % match (default: 0)
 * @param {string}  [options.boardsUrl]        — custom path to boards.json
 *
 * @returns {Promise<Array<{
 *   board:     Object,
 *   total:     number,
 *   pct:       number,
 *   eligible:  boolean,
 *   breakdown: { ability, ridingStyle, weight, styleFit, bootWidth, height }
 * }>>}
 */
export async function findBoards(userInputs, options = {}) {
  const { limit, minPct = 0, boardsUrl } = options;
  const { budget } = userInputs;

  const boards = await loadBoards(boardsUrl);

  let results = scoreAllBoards(userInputs, boards).map(result => ({
    ...result,
    recommendedSize: recommendSize(userInputs.heightCm, userInputs.weightKg, result.board.sizes),
  }));

  if (minPct > 0) {
    results = results.filter(r => r.pct >= minPct);
  }

// if a budget was set but nothing falls within it, return the 3 cheapest boards with an overBudget flag so the UI can warn the user rather than showing nothing  
if (budget) {
  const withinBudget = results.filter(r => r.board.price <= budget);
  if (withinBudget.length === 0) {
    // Nothing in budget — return the 3 cheapest results instead with a flag
    results = results
      .sort((a, b) => a.board.price - b.board.price)
      .slice(0, 3)
      .map(r => ({ ...r, overBudget: true }));
  } else {
    results = withinBudget;
  }
}

  if (limit) {
    results = results.slice(0, limit);
  }

  return results;
}

/**
 * Pre-loads boards.json into the cache without running scoring.
 * Call this on page load to eliminate fetch latency when the
 * user submits the form.
 *
 * @param {string} [boardsUrl]
 * @returns {Promise<void>}
 */
export async function preloadBoards(boardsUrl) {
  await loadBoards(boardsUrl);
}

/**
 * Returns the raw cached board list.
 * Returns null if loadBoards hasn't been called yet.
 *
 * @returns {Array|null}
 */
export function getCachedBoards() {
  return _boards;
}