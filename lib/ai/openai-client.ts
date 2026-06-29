// Client OpenAI minimal via fetch — SERVER ONLY (importé uniquement par la route/orchestrateur).
// N'utilise QUE process.env.OPENAI_API_KEY (jamais NEXT_PUBLIC_*).

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const DEFAULT_MODEL = "gpt-4o-mini";
// Modèle PREMIUM réservé au vrai plan post-paiement (1 seul appel par utilisateur,
// ≤ 1/mois ensuite). gpt-4.1 : moins cher que gpt-4o à qualité au moins équivalente
// (meilleur suivi d'instructions + sortie JSON) → on baisse le coût de l'appel le plus
// cher sans dégrader le plan. Réversible : poser OPENAI_PLAN_MODEL pour forcer un autre
// modèle (ex. "gpt-4o"). En cas d'échec API, fallback automatique vers le mock déterministe.
const DEFAULT_PLAN_MODEL = "gpt-4.1";

export function isOpenAIConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}

export function openaiModel(): string {
  return process.env.OPENAI_MODEL || DEFAULT_MODEL;
}

// Modèle utilisé pour la génération du parcours payé. Valeur finale fixée à
// l'étape « config OpenAI » (ex. gpt-4o, gpt-4.1).
export function openaiPlanModel(): string {
  return process.env.OPENAI_PLAN_MODEL || DEFAULT_PLAN_MODEL;
}

interface ChatOptions {
  system: string;
  user: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  timeoutMs?: number;
}

// Renvoie le contenu JSON brut (string) ou null en cas d'échec.
export async function chatJSON({
  system,
  user,
  model,
  maxTokens = 3500,
  temperature = 0.5,
  timeoutMs = 60_000,
}: ChatOptions): Promise<string | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(OPENAI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model || openaiModel(),
        temperature,
        max_tokens: maxTokens,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
      signal: controller.signal,
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error(`[prediscore][openai] HTTP ${res.status}: ${body.slice(0, 500)}`);
      return null;
    }
    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content;
    return typeof content === "string" ? content : null;
  } catch (e) {
    const msg = e instanceof Error ? `${e.name}: ${e.message}` : String(e);
    console.error(`[prediscore][openai] échec requête (${msg}) → fallback mock`);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

// Complétion TEXTE libre (≠ JSON) — utilisée par le coach. Renvoie le texte ou
// null en cas d'échec (le caller retombe alors sur le mock déterministe).
export async function chatText({
  system,
  messages,
  model,
  maxTokens = 500,
  temperature = 0.6,
  timeoutMs = 30_000,
}: {
  system: string;
  messages: ChatTurn[];
  model?: string;
  maxTokens?: number;
  temperature?: number;
  timeoutMs?: number;
}): Promise<string | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(OPENAI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model || openaiModel(),
        temperature,
        max_tokens: maxTokens,
        messages: [{ role: "system", content: system }, ...messages],
      }),
      signal: controller.signal,
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error(`[prediscore][openai] coach HTTP ${res.status}: ${body.slice(0, 300)}`);
      return null;
    }
    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content;
    return typeof content === "string" ? content : null;
  } catch (e) {
    const msg = e instanceof Error ? `${e.name}: ${e.message}` : String(e);
    console.error(`[prediscore][openai] coach échec (${msg}) → fallback mock`);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
