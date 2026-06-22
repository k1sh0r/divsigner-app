// Shared guard for the relay proxy. The relay forwards browser requests to an
// arbitrary user-supplied base URL (the "Custom (OpenAI-compatible)" provider),
// so a static host allowlist is wrong — instead we allow any *public* host and
// block private/internal targets to prevent the relay being abused as an SSRF
// vector (cloud metadata, localhost, internal services).
//
// Limits worth knowing (see the relay's security notes): we validate the
// literal host, not the DNS resolution, so a public hostname that resolves to
// a private IP (a DNS-rebinding style attack) is not caught here. The prod
// relay runs on Vercel Edge, which has no DNS-resolution API, so this is the
// achievable bar there; redirects ARE re-validated (see fetchWithRedirectGuard)
// since that is the most common bypass.

export interface TargetCheck {
  ok: boolean;
  reason?: string;
}

function isPrivateIPv4(host: string): boolean {
  // `host` is already URL-normalised to canonical dotted-decimal by the WHATWG
  // URL parser (it folds hex/octal/decimal forms, e.g. 0xa9fea9fe ->
  // 169.254.169.254), so a plain dotted-quad match is sufficient.
  const m = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!m) return false;
  const a = Number(m[1]);
  const b = Number(m[2]);
  if (a === 0 || a === 127 || a === 10) return true; // this-host, loopback, private
  if (a === 169 && b === 254) return true; // link-local incl. 169.254.169.254 metadata
  if (a === 172 && b >= 16 && b <= 31) return true; // private
  if (a === 192 && b === 168) return true; // private
  return false;
}

function isPrivateIPv6(host: string): boolean {
  // Only called for actual IPv6 literals (brackets already stripped).
  const h = host.toLowerCase();
  if (h === "::1" || h === "::") return true;
  // IPv4-mapped (::ffff:127.0.0.1) — re-check the embedded v4. The URL parser
  // compresses the dotted form to hex (::ffff:7f00:1), so handle both.
  const dotted = h.match(/^::(?:ffff:)?(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/);
  if (dotted && isPrivateIPv4(dotted[1]!)) return true;
  const hex = h.match(/^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/);
  if (hex) {
    const hi = parseInt(hex[1]!, 16);
    const lo = parseInt(hex[2]!, 16);
    const v4 = `${hi >> 8}.${hi & 0xff}.${lo >> 8}.${lo & 0xff}`;
    if (isPrivateIPv4(v4)) return true;
  }
  // fc00::/7 unique-local, fe80::/10 link-local.
  const first = h.split(":")[0] ?? "";
  if (/^f[cd]/.test(first)) return true; // fc.. / fd..
  if (first === "fe80") return true;
  return false;
}

function isPrivateHost(hostname: string): boolean {
  const stripped = hostname.replace(/^\[|\]$/g, "");
  const h = stripped.toLowerCase();

  if (h === "localhost" || h === "0.0.0.0") return true;
  if (
    h.endsWith(".localhost") ||
    h.endsWith(".local") ||
    h.endsWith(".internal")
  ) {
    return true;
  }

  // IPv6 literals contain a colon; everything else is treated as v4-or-name.
  if (stripped.includes(":")) return isPrivateIPv6(stripped);
  return isPrivateIPv4(h);
}

/**
 * Validate a relay target.
 *
 * @param allowPrivate  When true (local dev only) skip the private-host and
 *   https-only checks, so a developer can point at e.g. http://localhost:11434.
 */
export function isTargetAllowed(
  targetUrl: string,
  { allowPrivate = false }: { allowPrivate?: boolean } = {},
): TargetCheck {
  let url: URL;
  try {
    url = new URL(targetUrl);
  } catch {
    return { ok: false, reason: "Invalid target URL" };
  }

  if (allowPrivate) {
    if (url.protocol !== "https:" && url.protocol !== "http:") {
      return { ok: false, reason: "Only http(s) targets are allowed" };
    }
    return { ok: true };
  }

  if (url.protocol !== "https:") {
    return { ok: false, reason: "Only https:// targets are allowed" };
  }
  if (isPrivateHost(url.hostname)) {
    return { ok: false, reason: "Target host is not allowed" };
  }
  return { ok: true };
}

/**
 * fetch() that re-validates every redirect hop against isTargetAllowed, so an
 * allowed upstream cannot 3xx-redirect the relay into a private/internal host.
 * Uses the global fetch available in both the Node dev server and Vercel Edge.
 */
export async function fetchWithRedirectGuard(
  targetUrl: string,
  options: RequestInit,
  {
    allowPrivate = false,
    maxRedirects = 3,
  }: { allowPrivate?: boolean; maxRedirects?: number } = {},
): Promise<Response> {
  let url = targetUrl;
  for (let hop = 0; hop <= maxRedirects; hop++) {
    const res = await fetch(url, { ...options, redirect: "manual" });
    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get("location");
      if (!location) return res; // 3xx without Location — nothing to follow
      const next = new URL(location, url).toString();
      const check = isTargetAllowed(next, { allowPrivate });
      if (!check.ok) {
        throw new Error(
          `Blocked redirect to disallowed host: ${check.reason}`,
        );
      }
      url = next;
      continue;
    }
    return res;
  }
  throw new Error("Too many redirects");
}
