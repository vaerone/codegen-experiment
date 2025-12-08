import crypto from "crypto";

export function hash(str) {
  return crypto.createHash("sha1").update(str).digest("hex");
}
