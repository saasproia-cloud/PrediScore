// Supabase est OPTIONNEL au runtime : tant que les variables ne sont pas
// renseignées, l'app reste en mode mock (session + données en localStorage).
// Dès que les clés sont présentes, l'auth réelle + la persistance s'activent.
export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
