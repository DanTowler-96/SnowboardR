// Sends user inputs to the server and returns scored, ranked results
export async function findBoards(userInputs, options = {}) {
  const response = await fetch('/api/boards/find', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userInputs),
  });

  if (!response.ok) {
    throw new Error(`Server error: ${response.status}`);
  }

  let results = await response.json();

  const { limit, minPct = 0 } = options;

  if (minPct > 0) {
    results = results.filter(r => r.pct >= minPct);
  }

  if (limit) {
    results = results.slice(0, limit);
  }

  return results;
}

// No longer needed - server handles data loading now
// Kept as a no-op so any existing calls don't break
export async function preloadBoards() {}
export function getCachedBoards() { return null; }