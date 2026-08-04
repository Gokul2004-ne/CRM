import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Security Firewall patterns to block malicious payloads
const SUSPICIOUS_PATTERNS = [
  /<script\b[^>]*>/i,
  /javascript:/i,
  /union\s+select/i,
  /select\s+.*\s+from/i,
  /insert\s+into/i,
  /delete\s+from/i,
  /drop\s+table/i,
  /exec\s*\(/i,
  /\.\.\/\.\.\//,
  /etc\/passwd/i
];

export function proxy(request: NextRequest) {
  const url = request.nextUrl.pathname;
  const searchParams = request.nextUrl.search;

  // Firewall check on URL query params
  for (const pattern of SUSPICIOUS_PATTERNS) {
    if (pattern.test(url) || pattern.test(searchParams)) {
      return new NextResponse(
        JSON.stringify({ error: "Access Denied by Security Firewall Shield", code: "FIREWALL_BLOCKED" }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }
  }

  const response = NextResponse.next();

  // Enforce Security Firewall Headers on every response
  response.headers.set("X-Firewall-Status", "ACTIVE_PROTECTED");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
