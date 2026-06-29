# PrediScore

**Analyse chaque match avant le coup d'envoi.**

PrediScore est une app d'analyse football : recherche d'équipes, fixtures réelles,
moteur statistique Dixon-Coles, probabilités de résultat, score exact, scénarios IA,
compétitions, classements, abonnement Whop et Coach IA.

## Stack

- Next.js 15 App Router + TypeScript
- Tailwind CSS + Framer Motion
- API-Football pour les données live avec fallback démo
- OpenAI pour les scénarios et le Coach IA
- Supabase pour l'auth, les abonnements et les quotas
- Whop pour checkout + webhooks

## Démarrer

```bash
npm install
npm run dev
```

Variables à préparer dans `.env` ou `.env.local` :

- `OPENAI_API_KEY`
- `API_FOOTBALL_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `WHOP_WEBHOOK_SECRET`
- `WHOP_PLAN_ESSENTIEL`
- `WHOP_PLAN_PRO`
- `WHOP_PLAN_LIFETIME`

## Routes principales

- `/` : landing PrediScore
- `/app` : analyse de match
- `/app/competitions` : compétitions, classements, matchs, joueurs, équipes
- `/app/coach` : Coach IA
- `/app/subscription` : abonnement dans le dashboard
- `/app/settings` : paramètres compte
- `/pricing` : abonnements Essentiel, Pro, À vie
