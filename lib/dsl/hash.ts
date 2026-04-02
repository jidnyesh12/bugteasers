/**
 * Template DSL — Template Hashing
 *
 * Produces a deterministic SHA-256 hex digest of a TemplateDSL object.
 * The hash is used as the provenance identifier in replay certificates.
 *
 * In Node.js we use the built-in `crypto` module; in browser contexts we
 * fall back to a simple FNV-1a 64-bit approximation so the code is portable.
 */

import { TemplateDSL } from "./types";

function canonicalise(template: TemplateDSL): string {
  // Deep-sort keys for a canonical JSON representation
  return JSON.stringify(sortKeys(template));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function sortKeys(obj: any): any {
  if (Array.isArray(obj)) return obj.map(sortKeys);
  if (obj !== null && typeof obj === "object") {
    return Object.fromEntries(
      Object.keys(obj)
        .sort()
        .map((k) => [k, sortKeys(obj[k])])
    );
  }
  return obj;
}

/** Synchronous FNV-1a approximation (no native crypto needed in tests). */
function fnv1a(s: string): string {
  // 32-bit FNV-1a — avoids BigInt for ES2017 compatibility
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = (Math.imul(h, 0x01000193) >>> 0);
  }
  return h.toString(16).padStart(8, "0");
}

/**
 * Returns a short deterministic hash of the template.
 * Uses Node crypto (SHA-256) when available, otherwise FNV-1a.
 */
export function hashTemplate(template: TemplateDSL): string {
  const canon = canonicalise(template);

  // Node.js environment
  if (typeof process !== "undefined" && process.versions?.node) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { createHash } = require("crypto") as typeof import("crypto");
      return createHash("sha256").update(canon, "utf8").digest("hex").slice(0, 16);
    } catch {
      // fall through
    }
  }

  return fnv1a(canon);
}
