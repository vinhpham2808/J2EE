import { formatDate } from "./format";

export function formatRelativeTime(value) {
  if (!value) return "-";

  const raw = String(value);
  const parsed = new Date(raw.includes("T") ? raw : `${raw}T00:00:00`);
  const timestamp = parsed.getTime();

  if (!Number.isFinite(timestamp)) {
    return formatDate(value);
  }

  const diffMs = Date.now() - timestamp;
  if (diffMs < 0) return "Vừa xong";

  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "Vừa xong";
  if (minutes < 60) return `${minutes} phút trước`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} ngày trước`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months} tháng trước`;

  const years = Math.floor(months / 12);
  return `${years} năm trước`;
}
