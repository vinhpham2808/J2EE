const forecastDrafts = new Map();

function buildKey(year, month) {
  const y = Number(year);
  const m = Number(month);
  if (!Number.isInteger(y) || !Number.isInteger(m) || m < 1 || m > 12) {
    return null;
  }
  return `${y}-${m}`;
}

export function saveAiForecastDraft(result, fallbackYear, fallbackMonth) {
  if (!result) return null;

  const year = Number(result.year || fallbackYear);
  const month = Number(result.month || fallbackMonth);
  const key = buildKey(year, month);
  if (!key) return null;

  const draft = {
    ...result,
    year,
    month,
    categories: Array.isArray(result.categories) ? result.categories : [],
    anomalies: Array.isArray(result.anomalies) ? result.anomalies : [],
    generatedAt: result.generatedAt || new Date().toISOString(),
    savedAt: new Date().toISOString(),
  };

  forecastDrafts.set(key, draft);
  return draft;
}

export function getAiForecastDraft(year, month) {
  const key = buildKey(year, month);
  return key ? forecastDrafts.get(key) || null : null;
}

export function clearAiForecastDraft(year, month) {
  const key = buildKey(year, month);
  if (key) forecastDrafts.delete(key);
}
