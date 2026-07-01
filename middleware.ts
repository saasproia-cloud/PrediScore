import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { REF_COOKIE, REF_MAX_AGE } from "@/lib/affiliate/config";

function harden(response: NextResponse): NextResponse {
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=()",
  );
  return response;
}

// Rafraîchit la session Supabase à chaque requête (cookies). No-op tant que
// Supabase n'est pas configuré → l'app reste fonctionnelle en mode mock.
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const protectedApp =
    pathname === "/app" ||
    pathname.startsWith("/app/") ||
    (pathname === "/pricing" && request.nextUrl.searchParams.has("checkout"));

  // Affiliation : mémorise le code du lien ?ref=CODE dans un cookie (60 jours).
  const refParam = request.nextUrl.searchParams.get("ref");
  const setRef = (res: NextResponse): NextResponse => {
    if (refParam) {
      res.cookies.set(REF_COOKIE, refParam.slice(0, 64), {
        maxAge: REF_MAX_AGE,
        path: "/",
        sameSite: "lax",
        httpOnly: true,
      });
    }
    return res;
  };
  if (pathname === "/paywall" || pathname.startsWith("/paywall/")) {
    return harden(NextResponse.redirect(new URL("/app/subscription", request.url)));
  }
  if (pathname === "/settings" || pathname.startsWith("/settings/")) {
    return harden(NextResponse.redirect(new URL("/app/settings", request.url)));
  }
  if (pathname === "/dashboard" || pathname.startsWith("/dashboard/")) {
    const target = new URL("/app", request.url);
    const checkout = request.nextUrl.searchParams.get("checkout");
    if (checkout) target.searchParams.set("checkout", checkout);
    return harden(NextResponse.redirect(target));
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    if (protectedApp && process.env.NODE_ENV === "production") {
      const target = new URL("/connexion", request.url);
      target.searchParams.set("next", `${pathname}${request.nextUrl.search}`);
      return harden(NextResponse.redirect(target));
    }
    return harden(setRef(NextResponse.next()));
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  // IMPORTANT : ne rien exécuter entre createServerClient et getUser().
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (protectedApp && !user) {
    const target = new URL("/connexion", request.url);
    target.searchParams.set("next", `${pathname}${request.nextUrl.search}`);
    return harden(NextResponse.redirect(target));
  }

  return harden(setRef(response));
}

export const config = {
  matcher: [
    // Toutes les routes sauf assets statiques & images.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
