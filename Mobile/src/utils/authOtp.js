import { getApiErrorMessage } from "./format";

export function getRetryAfterSeconds(error) {
  const retryAfterSeconds = Number(error?.response?.data?.retryAfterSeconds);
  if (Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0) {
    return Math.ceil(retryAfterSeconds);
  }

  const message = getApiErrorMessage(error, "");
  const match = message.match(/(\d+)\s*(giây|s|seconds?)/i);
  return match ? Number(match[1]) : 0;
}
