const crypto = require("crypto");

const toHHmm = (unixSeconds) => {
  const date = new Date(Number(unixSeconds) * 1000);
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
};

const formatDuration = (seconds) => {
  const totalMinutes = Math.max(1, Math.floor(Number(seconds || 0) / 60));
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h}h ${m}m`;
};

const buildPNR = () => {
  const part = crypto.randomBytes(4).toString("hex").toUpperCase();
  return `PNR${part}`;
};

const seededRandomInt = (seed, min, max) => {
  const hash = crypto.createHash("sha256").update(seed).digest("hex");
  const value = parseInt(hash.slice(0, 8), 16) / 0xffffffff;
  return Math.floor(min + value * (max - min + 1));
};

module.exports = {
  toHHmm,
  formatDuration,
  buildPNR,
  seededRandomInt,
};
