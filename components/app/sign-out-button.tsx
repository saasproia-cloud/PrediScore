"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { useAuth } from "@/context/auth-context";

export function SignOutButton() {
  const router = useRouter();
  const { signOut } = useAuth();

  return (
    <button
      type="button"
      onClick={async () => {
        await signOut();
        router.push("/connexion");
      }}
      className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border px-4 text-sm font-semibold text-muted-foreground transition hover:bg-card hover:text-foreground"
    >
      <LogOut className="h-4 w-4" />
      Déconnexion
    </button>
  );
}
