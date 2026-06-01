const ALLOWED_HOSTS = [
  "pay.payos.vn",
  "checkout.payos.vn",
  "pay.payos.com",
];

const ALLOWED_PROTOCOLS = new Set(["https:"]);

const getS3Hosts = () => {
  const bucket = import.meta.env.VITE_S3_BUCKET;
  const region = import.meta.env.VITE_S3_REGION || "ap-southeast-1";
  if (bucket) {
    return [
      `${bucket}.s3.${region}.amazonaws.com`,
      `${bucket}.s3.amazonaws.com`,
    ];
  }
  return [];
};

const isAllowedHost = (hostname) => {
  if (ALLOWED_HOSTS.includes(hostname)) return true;
  for (const s3Host of getS3Hosts()) {
    if (hostname === s3Host) return true;
  }
  if (hostname.endsWith(".amazonaws.com") && hostname.includes(".s3.")) return true;
  return false;
};

const validateUrl = (urlString) => {
  if (!urlString || typeof urlString !== "string") return null;
  let parsed;
  try {
    parsed = new URL(urlString);
  } catch {
    return null;
  }
  if (!ALLOWED_PROTOCOLS.has(parsed.protocol)) return null;
  if (!isAllowedHost(parsed.hostname)) return null;
  return parsed.href;
};

const safeOpenExternal = (urlString) => {
  const safeUrl = validateUrl(urlString);
  if (!safeUrl) return false;
  window.open(safeUrl, "_blank", "noopener,noreferrer");
  return true;
};

const safeRedirect = (urlString) => {
  const safeUrl = validateUrl(urlString);
  if (!safeUrl) return false;
  window.location.href = safeUrl;
  return true;
};

export { safeOpenExternal, safeRedirect, validateUrl, isAllowedHost };
