"use client";

import { Suspense } from "react";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { WorldCupPanel } from "@/components/auth/worldcup-panel";
import { AuthForm } from "@/components/auth/auth-form";

export default function ConnexionPage() {
  return (
    <Suspense
      fallback={
        <div className="grid min-h-dvh place-items-center">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <ConnexionContent />
    </Suspense>
  );
}

function ConnexionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { hydrated, session } = useAuth();
  const rawNext = searchParams.get("next");
  const redirectTo =
    rawNext && rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/app";

  // Déjà connecté → on reprend là où il en est (pas besoin de re-login).
  useEffect(() => {
    if (hydrated && session) {
      router.replace(redirectTo);
    }
  }, [hydrated, redirectTo, session, router]);

  if (!hydrated || session) {
    return (
      <div className="grid min-h-dvh place-items-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <WorldCupPanel />
      <main className="flex items-center justify-center px-6 py-12">
        <AuthForm redirectTo={redirectTo} />
      </main>
    </div>
  );
}
