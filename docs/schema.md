# Schéma de données PrediScore

Le SQL de référence est dans `supabase/schema.sql`.

## Tables principales

| Table | Rôle |
|---|---|
| `payments` | Abonnements Whop par email (`essentiel`, `pro`, `lifetime`). |
| `daily_usage` | Compteurs journaliers d'analyses complètes et de questions Coach IA. |
| `analysis_history` | Analyses déjà générées par utilisateur et par match. |

## Quotas

- Gratuit : aperçu uniquement, aucune prédiction premium envoyée.
- Essentiel : 1 analyse complète par jour.
- Pro : analyses illimitées + 1 question Coach IA par jour.
- Lifetime : analyses et Coach IA illimités.

## Sécurité

`payments`, `daily_usage` et `analysis_history` sont écrites côté serveur via
`service_role`. Les utilisateurs authentifiés peuvent uniquement lire leurs
propres lignes via RLS.
