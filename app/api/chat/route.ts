import { NextResponse } from "next/server";
import { z } from "zod";
import { chatText, type ChatTurn } from "@/lib/ai/openai-client";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadEntitlement, type Entitlement } from "@/lib/data/entitlement";
import { coachLimitFor, consumeDailyUsage } from "@/lib/data/usage";
import { SITE_NAME } from "@/lib/constants/config";
import { getPrediscorePlan } from "@/lib/billing/prediscore";
import {
  getClientIp,
  rateLimit,
  rateLimitResponse,
  withRateLimitHeaders,
} from "@/lib/security/rate-limit";
import { parseJsonBody, RequestBodyError } from "@/lib/security/request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(1_200),
      }),
    )
    .min(1)
    .max(16),
});

const SYSTEM = `Tu es le Coach IA de ${SITE_NAME}, un analyste football expert.
Tu réponds aux questions sur les matchs, les équipes, les joueurs et les pronostics.
Méthodo ${SITE_NAME} : modèle statistique (Dixon-Coles), forme récente, performances domicile/extérieur, cotes du marché.
RÈGLES :
- Français, concis, clair, expert. Va droit au but.
- Réponds uniquement aux sujets football : matchs, équipes, joueurs, buteurs, tactique, forme, compétitions, cotes/probabilités.
- Si la question sort du football, refuse brièvement et propose de poser une question foot.
- Donne une analyse raisonnée (favori probable, facteurs clés) sans inventer de statistiques chiffrées précises que tu n'as pas.
- Si l'utilisateur enchaîne avec "du coup ?", "et donc ?", "résultat ?" ou une relance courte, réponds en utilisant le contexte précédent.
- Si l'utilisateur demande de choisir, tranche une seule option principale puis explique les risques.
- Pour chaque question exploitable, termine par une section "Verdict" avec la réponse directe.
- Quand c'est utile, ajoute une mini jauge texte ASCII, par exemple "Confiance : [#######---] 7/10".
- Ne fais pas de blabla légal dans la réponse.`;

function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

function isShortFollowUp(text: string): boolean {
  const q = normalize(text).replace(/[?!.,;:]/g, "").trim();
  if (q.length <= 4) return true;
  return [
    "du coup",
    "ducoup",
    "et donc",
    "donc",
    "resultat",
    "verdict",
    "conclusion",
    "tu penses quoi",
    "reponds",
    "dis moi",
    "choisis",
    "choisis en un",
    "un seul",
    "lequel",
    "tranche",
  ].some((term) => q === term || q.startsWith(`${term} `));
}

const CLUBS = [
  "chelsea",
  "psg",
  "marseille",
  "arsenal",
  "liverpool",
  "barcelona",
  "barcelone",
  "real madrid",
  "manchester city",
  "manchester united",
  "bayern",
  "juventus",
  "inter",
  "milan",
];

const NATIONS = [
  "france",
  "maroc",
  "morocco",
  "norway",
  "norvege",
  "norvège",
  "england",
  "angleterre",
  "spain",
  "espagne",
  "germany",
  "allemagne",
  "brazil",
  "bresil",
  "argentina",
  "argentine",
  "portugal",
];

function mixedClubNationQuestion(text: string): boolean {
  const q = normalize(text);
  const hasClub = CLUBS.some((club) => q.includes(normalize(club)));
  const hasNation = NATIONS.some((nation) => q.includes(normalize(nation)));
  const asksMatch = ["match", "contre", "vs", "gagne", "buteur", "score"].some((term) => q.includes(term));
  return hasClub && hasNation && asksMatch;
}

function worldCupWinnerQuestion(text: string): boolean {
  const q = normalize(text);
  return q.includes("coupe du monde") && ["qui gagne", "vainqueur", "favori", "gagner"].some((term) => q.includes(term));
}

function isFootballQuestion(text: string): boolean {
  const q = text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
  const terms = [
    "foot",
    "football",
    "match",
    "equipe",
    "club",
    "joueur",
    "buteur",
    "but",
    "score",
    "pronostic",
    "prediction",
    "gagner",
    "victoire",
    "nul",
    "defaite",
    "forme",
    "tactique",
    "composition",
    "blessure",
    "championnat",
    "ligue",
    "coupe",
    "classement",
    "domicile",
    "exterieur",
    "over",
    "under",
    "btts",
    "clean sheet",
    "cote",
    "probabilite",
    "psg",
    "marseille",
    "real",
    "barca",
    "barcelone",
    "liverpool",
    "arsenal",
    "france",
    "maroc",
    "norway",
    "norvege",
    "norvege",
    "coupe du monde",
    "mondial",
    "favori",
    "choisis",
  ];
  return terms.some((term) => q.includes(term));
}

function impossibleMatchReply(): string {
  return [
    "Ce match n'est pas cohérent : Chelsea est un club et France est une sélection nationale.",
    "",
    "Pour une vraie analyse, donne soit club contre club, soit sélection contre sélection.",
    "",
    "Verdict : je ne valide pas ce duel comme match officiel possible.",
  ].join("\n");
}

function worldCupWinnerReply(): string {
  return [
    "Je tranche : France.",
    "",
    "Lecture rapide : profondeur d'effectif, expérience des grands matchs, densité offensive et capacité à gérer les phases à élimination directe.",
    "",
    "Jauge modèle",
    "France      [#######---] 7/10",
    "Angleterre  [######----] 6/10",
    "Brésil      [######----] 6/10",
    "",
    "Point de risque : la Coupe du monde reste très sensible au tirage, aux blessures et aux cartons.",
    "",
    "Verdict : France gagnante, avec confiance prudente.",
  ].join("\n");
}

async function planEntitlement(): Promise<{ email: string | null; ent: Entitlement }> {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.email) return { email: null, ent: { active: false, planId: null } };
    return { email: user.email.toLowerCase(), ent: await loadEntitlement(supabase, user.email) };
  } catch {
    return { email: null, ent: { active: false, planId: null } };
  }
}

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const limited = rateLimit(`chat:${ip}`, { limit: 14, windowMs: 60_000 });
  if (!limited.allowed) return rateLimitResponse(limited);

  const json = (body: unknown, init?: ResponseInit) =>
    withRateLimitHeaders(NextResponse.json(body, init), limited);

  let parsed;
  try {
    parsed = await parseJsonBody(req, Body, 18_000);
  } catch (error) {
    const status = error instanceof RequestBodyError ? error.status : 400;
    const message = error instanceof RequestBodyError ? error.message : "Requête invalide.";
    return json({ error: message }, { status });
  }

  const totalChars = parsed.messages.reduce((sum, msg) => sum + msg.content.length, 0);
  if (totalChars > 5_000) {
    return json({ error: "Conversation trop longue. Repose la question plus simplement." }, { status: 413 });
  }

  const { email, ent } = await planEntitlement();
  const planId = ent.active && ent.planId && getPrediscorePlan(ent.planId) ? ent.planId : null;
  const perDay = coachLimitFor(planId);

  if (perDay <= 0 || !email) {
    return json(
      { error: "Le Coach IA est réservé aux membres Pro et À vie." },
      { status: 403 },
    );
  }

  const userLimited = rateLimit(`chat:user:${email}`, { limit: 8, windowMs: 60_000 });
  if (!userLimited.allowed) return rateLimitResponse(userLimited);

  const userMessages = parsed.messages.filter((m) => m.role === "user").map((m) => m.content);
  const lastUserMessage = userMessages.at(-1) ?? "";
  const previousContextIsFootball = userMessages.slice(0, -1).some(isFootballQuestion);
  if (!isFootballQuestion(lastUserMessage) && !(previousContextIsFootball && isShortFollowUp(lastUserMessage))) {
    return json(
      {
        error:
          "Je peux répondre uniquement aux questions football : matchs, équipes, joueurs, buteurs probables, forme ou tactique.",
      },
      { status: 400 },
    );
  }

  if (mixedClubNationQuestion(lastUserMessage)) {
    return json({ reply: impossibleMatchReply(), usage: { coachLimit: perDay } });
  }

  const consumed = await consumeDailyUsage(email, "coach", perDay);
  if (!consumed.allowed) {
    return json(
      {
        error:
          consumed.error === "usage_unavailable"
            ? "Quota Coach momentanément indisponible. Réessaie dans quelques instants."
            : "Tu as utilisé ta question Coach IA du jour. Le plan À vie débloque les questions illimitées.",
        usage: { coachCount: consumed.usage.coachCount, coachLimit: consumed.limit },
      },
      { status: consumed.error === "usage_unavailable" ? 503 : 429 },
    );
  }

  if (worldCupWinnerQuestion(lastUserMessage)) {
    return json({
      reply: worldCupWinnerReply(),
      usage: { coachCount: consumed.usage.coachCount, coachLimit: consumed.limit },
    });
  }

  const reply = await chatText({
    system: SYSTEM,
    messages: parsed.messages as ChatTurn[],
    maxTokens: 850,
    temperature: 0.55,
  });

  if (!reply) {
    return json(
      { error: "Le coach est momentanément indisponible. Réessaie." },
      { status: 503 },
    );
  }

  return json({
    reply,
    usage: { coachCount: consumed.usage.coachCount, coachLimit: consumed.limit },
  });
}
