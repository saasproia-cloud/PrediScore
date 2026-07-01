"use client";

import { useEffect } from "react";

// Détecte ?ref=CODE, log le clic une fois, puis nettoie l'URL (le cookie est
// déjà posé par le middleware).
export function RefTracker() {
  useEffect(() => {
    const url = new URL(window.location.href);
    const code = url.searchParams.get("ref");
    if (!code) return;

    try {
      if (sessionStorage.getItem("prediscore.ref.tracked") === code) return;
      sessionStorage.setItem("prediscore.ref.tracked", code);
    } catch {
      // sessionStorage indisponible → on log quand même.
    }

    fetch("/api/aff/click", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
      keepalive: true,
    }).catch(() => {});

    url.searchParams.delete("ref");
    window.history.replaceState({}, "", url.toString());
  }, []);

  return null;
}
