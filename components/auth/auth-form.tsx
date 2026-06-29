"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type Mode = "signup" | "login";

// Mode mock (Supabase non configuré) : email fictif pour Google.
const GOOGLE_MOCK_EMAIL = "joueur.google@gmail.com";

function getPublicOrigin() {
  const configuredOrigin = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configuredOrigin) return configuredOrigin.replace(/\/$/, "");
  return window.location.origin;
}

function frenchAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("already registered") || m.includes("already been registered"))
    return "Un compte existe déjà avec cet email. Passe sur « Connexion ».";
  if (m.includes("invalid login") || m.includes("invalid credentials"))
    return "Email ou mot de passe incorrect.";
  if (m.includes("password")) return "Mot de passe trop court (6 caractères min).";
  if (m.includes("email")) return "Email invalide.";
  return "Une erreur est survenue. Réessaie.";
}

export function AuthForm({ redirectTo = "/app" }: { redirectTo?: string }) {
  const router = useRouter();
  const { signIn, supabaseEnabled } = useAuth();
  const [mode, setMode] = useState<Mode>("signup");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pending) return;
    const cleanEmail = email.trim();
    if (!cleanEmail) return;
    setError(null);

    // Mode mock : aucune vraie auth, on continue directement.
    if (!supabaseEnabled) {
      signIn({ email: cleanEmail, name: name.trim() || undefined, provider: "email" });
      setPending(true);
      router.prefetch(redirectTo);
      setTimeout(() => router.push(redirectTo), 400);
      return;
    }

    const client = getSupabaseBrowserClient();
    if (!client) return;
    setPending(true);
    try {
      if (mode === "signup") {
        const { data, error: err } = await client.auth.signUp({
          email: cleanEmail,
          password,
          options: name.trim() ? { data: { full_name: name.trim() } } : undefined,
        });
        if (err) {
          setError(frenchAuthError(err.message));
          setPending(false);
          return;
        }
        if (!data.session) {
          // Pas de session après signUp ⇒ « Confirm email » encore activé côté
          // Supabase. On tente une connexion directe (cas où la confirmation a
          // été désactivée dans le dashboard) pour entrer sans vérification email.
          const { error: signInErr } = await client.auth.signInWithPassword({
            email: cleanEmail,
            password,
          });
          if (signInErr) {
            // La confirmation email est toujours active côté Supabase : il faut
            // la désactiver (Authentication → Sign In / Providers → Email →
            // décocher « Confirm email ») pour une inscription sans vérification.
            setError(
              "Désactive « Confirm email » dans Supabase pour une inscription directe (ou vérifie tes emails en attendant).",
            );
            setPending(false);
            return;
          }
        }
      } else {
        const { error: err } = await client.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });
        if (err) {
          setError(frenchAuthError(err.message));
          setPending(false);
          return;
        }
      }
      router.push(redirectTo);
    } catch {
      setError("Une erreur est survenue. Réessaie.");
      setPending(false);
    }
  };

  const handleGoogle = async () => {
    if (pending) return;
    setError(null);

    if (!supabaseEnabled) {
      signIn({ email: GOOGLE_MOCK_EMAIL, provider: "google" });
      setPending(true);
      setTimeout(() => router.push(redirectTo), 400);
      return;
    }

    const client = getSupabaseBrowserClient();
    if (!client) return;
    setPending(true);
    const callback = `${getPublicOrigin()}/auth/callback?next=${encodeURIComponent(redirectTo)}`;
    const { error: err } = await client.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: callback },
    });
    if (err) {
      setError("Connexion Google indisponible pour le moment.");
      setPending(false);
    }
    // Sinon : redirection plein écran vers Google → retour via /auth/callback.
  };

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8 text-center lg:text-left">
        <h1 className="text-2xl font-semibold tracking-tight">
          {mode === "signup" ? "Crée ton compte" : "Bon retour"}
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {mode === "signup"
            ? "Crée ton accès pour sauvegarder tes analyses et gérer ton abonnement."
            : "Connecte-toi pour retrouver tes analyses et ton abonnement."}
        </p>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-1 rounded-xl border border-border bg-card/60 p-1">
        <TabButton
          active={mode === "signup"}
          onClick={() => {
            setMode("signup");
            setError(null);
          }}
        >
          Inscription
        </TabButton>
        <TabButton
          active={mode === "login"}
          onClick={() => {
            setMode("login");
            setError(null);
          }}
        >
          Connexion
        </TabButton>
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={handleGoogle}
        disabled={pending}
      >
        <GoogleGlyph />
        Continuer avec Google
      </Button>

      <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        ou avec ton email
        <span className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={handleEmailSubmit} className="space-y-4">
        {mode === "signup" && (
          <div className="space-y-1.5">
            <Label htmlFor="name">Prénom (optionnel)</Label>
            <Input
              id="name"
              autoComplete="given-name"
              placeholder="Ton prénom"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
        )}
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            required
            autoComplete="email"
            placeholder="toi@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Mot de passe</Label>
          <Input
            id="password"
            type="password"
            required
            minLength={6}
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {error && (
          <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        <Button type="submit" className="w-full font-semibold" disabled={pending}>
          {pending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Un instant…
            </>
          ) : (
            <>
              {mode === "signup" ? "Créer mon compte" : "Se connecter"}
              <ArrowRight className="size-4" />
            </>
          )}
        </Button>
      </form>

      <p className="mt-6 text-center text-xs text-muted-foreground/70">
        En continuant, tu acceptes nos conditions. PrediScore fournit une lecture
        football informative, sans garantie de résultat.
      </p>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-primary text-primary-foreground shadow-glow"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function GoogleGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.26 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06L5.84 9.9C6.71 7.31 9.14 5.38 12 5.38Z"
      />
    </svg>
  );
}
