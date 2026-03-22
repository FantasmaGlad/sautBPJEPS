# Stack Technique — LiveBoard

> Compétition Détente Sèche & Squat Sauté en Longueur

---

## 1. Vue d'ensemble de l'architecture

```
┌──────────────┐        ┌──────────────────┐        ┌──────────────┐
│  Vue TV      │◄──wss──┤   Supabase       │◄──API──┤  Dashboard   │
│  (Next.js)   │        │  (BDD + Realtime │        │  Admin       │
│  plein écran │        │   + Storage)     │        │  (Next.js)   │
└──────────────┘        └──────────────────┘        └──────────────┘
       │                                                   │
       └──────────── Déploiement : Vercel ─────────────────┘
```

---

## 2. Stack technique retenue

### Frontend — Next.js (App Router)

| Choix | Justification |
|---|---|
| **Next.js 14** (App Router) | SSR/SSG natif, routing file-based, React Server Components pour les pages statiques (login, admin), client components pour le temps réel (TV). |
| **TypeScript** | Sécurité des types sur l'ensemble du projet, autocomplétion, robustesse. |
| **Framer Motion** | Animations fluides et performantes : transitions de rang, entrée/sortie des sponsors, flash "NOUVEAU RECORD", bandeau défilant. Bien intégré à React. |
| **CSS Modules + variables CSS** | Styles scopés, thématisation simple (couleurs de l'événement). Pas de dépendance externe lourde. |

### Backend & Base de données — Supabase

| Choix | Justification |
|---|---|
| **Supabase (PostgreSQL)** | Base relationnelle hébergée avec API REST + Realtime intégré. Parfaitement adapté au modèle de données (participants, scores, disciplines, sponsors). |
| **Supabase Realtime** | Abonnement aux changements de la table `scores` et `settings` via WebSocket → mise à jour instantanée de la vue TV sans polling. |
| **Supabase Storage** | Bucket pour les médias sponsors (images et vidéos `.mp4`). Upload direct depuis le dashboard admin, URL publiques pour l'affichage TV. |
| **Supabase Auth** | Authentification de l'administrateur par email/mot de passe. Protège le dashboard admin. Pas de gestion utilisateur complexe nécessaire. |
| **Row Level Security (RLS)** | Lecture publique pour la vue TV (scores, classement, sponsors actifs), écriture restreinte à l'admin authentifié. |

### Hébergement — Vercel

| Choix | Justification |
|---|---|
| **Vercel** | Intégration native avec Next.js, déploiement automatique via Git, CDN mondial, preview deployments, HTTPS automatique. |
| **Edge Functions** | Possibilité future d'ajouter de la logique serveur légère (webhooks, calcul de classement côté serveur). |

---

## 3. Schéma de la base de données

```sql
-- Disciplines (Détente Sèche, Squat Sauté)
disciplines (
  id          uuid PRIMARY KEY,
  name        text NOT NULL,          -- "Détente Sèche" | "Squat Sauté"
  coefficient numeric NOT NULL,       -- ex: 0.6, 0.4
  created_at  timestamptz
)

-- Participants
participants (
  id          uuid PRIMARY KEY,
  first_name  text NOT NULL,
  last_name   text NOT NULL,
  category    text NOT NULL,          -- "H" | "F"
  created_at  timestamptz
)

-- Scores (un seul score actif par participant × discipline)
scores (
  id              uuid PRIMARY KEY,
  participant_id  uuid REFERENCES participants,
  discipline_id   uuid REFERENCES disciplines,
  value           numeric NOT NULL,
  is_active       boolean DEFAULT true,
  recorded_at     timestamptz DEFAULT now()
)

-- Sponsors
sponsors (
  id              uuid PRIMARY KEY,
  name            text NOT NULL,
  media_url       text NOT NULL,       -- URL Supabase Storage
  media_type      text NOT NULL,       -- "image" | "video"
  display_order   integer NOT NULL,
  duration_sec    integer DEFAULT 5,
  is_active       boolean DEFAULT true,
  created_at      timestamptz
)

-- Paramètres globaux (ligne unique)
settings (
  id                    uuid PRIMARY KEY,
  event_name            text DEFAULT 'LiveBoard',
  carousel_interval_min integer DEFAULT 3,
  carousel_duration_sec integer DEFAULT 15,
  display_mode          text DEFAULT 'all'  -- "all" | "sponsors_only" | "ranking_only"
)
```

---

## 4. Flux temps réel

- La vue TV s'abonne aux tables `scores`, `participants`, `sponsors` et `settings`.
- Chaque modification déclenche un re-render React ciblé avec animation Framer Motion.
- Aucun polling ; latence < 1 seconde.

---

## 5. Dépendances principales

```json
{
  "dependencies": {
    "next": "14.x",
    "react": "^18.x",
    "react-dom": "^18.x",
    "@supabase/supabase-js": "^2.x",
    "framer-motion": "^11.x"
  },
  "devDependencies": {
    "typescript": "^5.x",
    "@types/react": "^18.x",
    "eslint": "^8.x",
    "eslint-config-next": "14.x"
  }
}
```

> **Zéro dépendance superflue.** Pas de librairie UI lourde (MUI, Chakra) — le design TV broadcast nécessite un contrôle CSS total.

---

## 6. Clés d'API et variables d'environnement à fournir

Créez un fichier `.env.local` à la racine du projet avec les variables suivantes :

### Supabase (obligatoire)

| Variable | Où la trouver | Rôle |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API → Project URL | URL de votre projet Supabase. Préfixée `NEXT_PUBLIC_` car utilisée côté client (vue TV + admin). |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API → `anon` `public` | Clé publique (anonyme). Sécurisée par les règles RLS. Utilisée côté client. |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API → `service_role` | Clé admin, **côté serveur uniquement**. Bypass les RLS. Utilisée pour les opérations sensibles (API routes Next.js). ⚠️ **Ne jamais exposer côté client.** |

### Template `.env.local`

```env
# ──── Supabase ────
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
```

---

## 7. Services à créer (comptes nécessaires)

| Service | URL | Plan recommandé | Action requise |
|---|---|---|---|
| **Supabase** | [supabase.com](https://supabase.com) | Free (suffisant pour un événement) | Créer un projet → récupérer les 3 clés API |
| **Vercel** | [vercel.com](https://vercel.com) | Hobby (gratuit) | Connecter le repo Git → configurer les variables d'env |
| **GitHub / GitLab** | — | Gratuit | Héberger le code source, connecté à Vercel pour le CI/CD |

---

## 8. Résumé des choix

| Couche | Technologie | Pourquoi |
|---|---|---|
| **Framework** | Next.js 14 (App Router) | SSR, routing, React, écosystème mature |
| **Langage** | TypeScript | Fiabilité, DX |
| **Animations** | Framer Motion | Animations déclaratives React, performantes |
| **Styles** | CSS Modules + CSS custom properties | Contrôle total, léger, pas de runtime CSS-in-JS |
| **BDD** | Supabase (PostgreSQL) | Relationnel, Realtime natif, Storage intégré, Auth |
| **Temps réel** | Supabase Realtime (WebSocket) | Zéro config, intégré à la BDD |
| **Stockage médias** | Supabase Storage | Bucket intégré, URLs publiques |
| **Auth** | Supabase Auth | Simple, suffisant (1 admin) |
| **Hébergement** | Vercel | Natif Next.js, CDN, HTTPS, CI/CD |
| **Contrôle de version** | Git + GitHub | Standard, intégration Vercel |
