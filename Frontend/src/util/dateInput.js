const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const ISO_DATETIME_PATTERN = /^(\d{4}-\d{2}-\d{2})T/;
const DISPLAY_DATE_PATTERN = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;

const pad = (value) => String(value).padStart(2, "0");

const isValidDateParts = (day, month, year) => {
  if (!Number.isInteger(day) || !Number.isInteger(month) || !Number.isInteger(year)) {
    return false;
  }

  const normalizedDate = new Date(Date.UTC(year, month - 1, day));

  return (
    normalizedDate.getUTCFullYear() === year &&
    normalizedDate.getUTCMonth() === month - 1 &&
    normalizedDate.getUTCDate() === day
  );
};

const buildIsoDate = (year, month, day) => `${year}-${pad(month)}-${pad(day)}`;

export const formatLocalDateToIso = (date = new Date()) => (
  buildIsoDate(date.getFullYear(), date.getMonth() + 1, date.getDate())
);

export const getTodayIsoDate = () => formatLocalDateToIso(new Date());

export const normalizeToIsoDate = (value) => {
  if (!value) return "";

  const normalizedValue = String(value).trim();
  if (!normalizedValue) return "";

  const isoDateTimeMatch = normalizedValue.match(ISO_DATETIME_PATTERN);
  if (isoDateTimeMatch) {
    return normalizeToIsoDate(isoDateTimeMatch[1]);
  }

  const isoMatch = normalizedValue.match(ISO_DATE_PATTERN);
  if (isoMatch) {
    const year = Number(isoMatch[1]);
    const month = Number(isoMatch[2]);
    const day = Number(isoMatch[3]);

    return isValidDateParts(day, month, year) ? buildIsoDate(year, month, day) : "";
  }

  const displayMatch = normalizedValue.match(DISPLAY_DATE_PATTERN);
  if (displayMatch) {
    const day = Number(displayMatch[1]);
    const month = Number(displayMatch[2]);
    const year = Number(displayMatch[3]);

    return isValidDateParts(day, month, year) ? buildIsoDate(year, month, day) : "";
  }

  return "";
};

export const formatDateForDisplay = (value) => {
  const isoDate = normalizeToIsoDate(value);
  if (!isoDate) return "";

  const [, year, month, day] = isoDate.match(ISO_DATE_PATTERN);
  return `${day}/${month}/${year}`;
};

export const sanitizeDateInput = (value) => {
  if (!value) return "";

  const normalizedValue = String(value).trim();
  const isoDate = normalizeToIsoDate(normalizedValue);
  if (isoDate) {
    return formatDateForDisplay(isoDate);
  }

  const digitsOnly = normalizedValue.replace(/\D/g, "").slice(0, 8);
  if (!digitsOnly) return "";

  if (digitsOnly.length <= 2) return digitsOnly;
  if (digitsOnly.length <= 4) return `${digitsOnly.slice(0, 2)}/${digitsOnly.slice(2)}`;

  return `${digitsOnly.slice(0, 2)}/${digitsOnly.slice(2, 4)}/${digitsOnly.slice(4)}`;
};

export const parseDisplayDateToIso = (value) => normalizeToIsoDate(value);

export const isIsoDateAfter = (candidate, comparison) => {
  const normalizedCandidate = normalizeToIsoDate(candidate);
  const normalizedComparison = normalizeToIsoDate(comparison);

  if (!normalizedCandidate || !normalizedComparison) return false;
  return normalizedCandidate > normalizedComparison;
};

export const getMonthFilterValue = (value) => {
  const isoDate = normalizeToIsoDate(value);
  return isoDate ? isoDate.slice(0, 7) : "";
};
