# Démarche — Connexion & Authentification Backend

> Ce document résume **toutes les étapes** pour connecter le projet LiveBoard
> aux services backend (Supabase, Vercel, GitHub) et les rendre opérationnels.

---

## 1. Supabase — Base de données & Temps réel

### 1.1 Projet déjà créé ✅

| Élément | Valeur |
|---|---|
| **Project ID** | `gzotyormnepwhckfzxua` |
| **URL** | `https://gzotyormnepwhckfzxua.supabase.co` |
| **Publishable Key** | *(voir Supabase Dashboard → API)* |
| **Secret API Key** | *(voir Supabase Dashboard → API)* |
| **Legacy Anon Key** | *(voir Supabase Dashboard → API → anon public)* |
| **Legacy Service Role Key** | *(voir Supabase Dashboard → API → service_role)* |

### 1.2 Étapes restantes côté Supabase

#### a) Créer les tables dans la base de données

Se rendre dans **Supabase Dashboard → SQL Editor** et exécuter les scripts de création
des tables `disciplines`, `participants`, `scores`, `sponsors` et `settings`
(schéma défini dans `Stack.md` §3).

> [!IMPORTANT]
> Les tables doivent être créées **avant** de lancer l'application, sinon les
> requêtes Supabase renverront des erreurs `relation does not exist`.

#### b) Activer les Row Level Security (RLS)

Pour chaque table, dans **Supabase Dashboard → Authentication → Policies** :

| Table | Lecture (`SELECT`) | Écriture (`INSERT/UPDATE/DELETE`) |
|---|---|---|
| `disciplines` | ✅ Publique (tous) | 🔒 Admin authentifié uniquement |
| `participants` | ✅ Publique | 🔒 Admin authentifié uniquement |
| `scores` | ✅ Publique | 🔒 Admin authentifié uniquement |
| `sponsors` | ✅ Publique | 🔒 Admin authentifié uniquement |
| `settings` | ✅ Publique | 🔒 Admin authentifié uniquement |

#### c) Créer le bucket Storage pour les médias sponsors

1. Aller dans **Supabase Dashboard → Storage**
2. Créer un bucket nommé `sponsors-media`
3. Rendre le bucket **public** (les images/vidéos doivent être accessibles sans auth depuis la vue TV)
4. Définir les policies : upload/delete réservé à l'admin authentifié

#### d) Activer Realtime sur les tables nécessaires

1. Aller dans **Supabase Dashboard → Database → Replication**
2. Activer la **Publication Realtime** pour les tables :
   - `scores`
   - `participants`
   - `sponsors`
   - `settings`

> [!TIP]
> Seules ces 4 tables ont besoin du Realtime. Ne pas activer `disciplines`
> (rarement modifiée, pas besoin de push temps réel).

#### e) Créer le compte administrateur

1. Aller dans **Supabase Dashboard → Authentication → Users**
2. Créer manuellement un utilisateur avec email/mot de passe
3. Cet utilisateur sera le seul à pouvoir accéder au dashboard admin

---

## 2. Vercel — Hébergement & Déploiement

### 2.1 Projet déjà lié ✅

| Élément | Valeur |
|---|---|
| **Vercel Project ID** | `prj_9yMdNtMyIzx5fKcV3nOPJORr9jbT` |
| **GitHub Repo** | `https://github.com/FantasmaGlad/sautBPJEPS.git` |

### 2.2 Étapes restantes côté Vercel

#### a) Configurer les variables d'environnement

Dans **Vercel → Project Settings → Environment Variables**, ajouter :

| Variable | Valeur | Environnements |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://gzotyormnepwhckfzxua.supabase.co` | Production, Preview, Dev |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | La clé Legacy Anon Key (JWT `eyJ...L7c`) | Production, Preview, Dev |
| `SUPABASE_SERVICE_ROLE_KEY` | La clé Legacy Service Role (JWT `eyJ...oiU`) | Production, Preview, Dev |

> [!CAUTION]
> `SUPABASE_SERVICE_ROLE_KEY` bypass toutes les RLS. Elle ne doit **jamais** être
> préfixée par `NEXT_PUBLIC_` et ne sera utilisée que côté serveur (API routes).

#### b) Vérifier le framework preset

Dans **Vercel → Project Settings → General** :
- Framework Preset : **Next.js**
- Build Command : `next build` (par défaut)
- Output Directory : `.next` (par défaut)

---

## 3. Fichier `.env.local` — Développement local

Créer ce fichier **à la racine du projet** (il est déjà dans le `.gitignore` de Next.js) :

```env
# ──── Supabase ────
NEXT_PUBLIC_SUPABASE_URL=https://gzotyormnepwhckfzxua.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<votre_clé_anon_jwt>
SUPABASE_SERVICE_ROLE_KEY=<votre_clé_service_role_jwt>
```

> [!WARNING]
> Ne **jamais** committer ce fichier. Ajoutez `.env.local` au `.gitignore`.

---

## 4. Checklist récapitulative

| # | Étape | Service | Statut |
|---|---|---|---|
| 1 | Créer le projet Supabase | Supabase | ✅ Fait |
| 2 | Récupérer les clés API | Supabase | ✅ Fait |
| 3 | Lier le repo GitHub à Vercel | Vercel | ✅ Fait |
| 4 | Installer `@supabase/supabase-js` | npm | ✅ Fait |
| 5 | Installer les Agent Skills Supabase | npm | ✅ Fait |
| 6 | **Initialiser le projet Next.js** | Local | ⬜ À faire |
| 7 | **Créer le fichier `.env.local`** | Local | ⬜ À faire |
| 8 | **Créer les tables dans Supabase** | Supabase Dashboard | ⬜ À faire |
| 9 | **Activer RLS + policies** | Supabase Dashboard | ⬜ À faire |
| 10 | **Créer le bucket `sponsors-media`** | Supabase Dashboard | ⬜ À faire |
| 11 | **Activer Realtime** sur les tables | Supabase Dashboard | ⬜ À faire |
| 12 | **Créer le compte admin** | Supabase Auth | ⬜ À faire |
| 13 | **Configurer les env vars sur Vercel** | Vercel Dashboard | ⬜ À faire |
| 14 | **Premier déploiement** | Vercel (auto via push Git) | ⬜ À faire |

---

## 5. Note sur les clés API Supabase

Supabase propose désormais deux systèmes de clés :

| Type | Clés fournies | Usage dans ce projet |
|---|---|---|
| **Nouvelles clés** (publishable / secret) | `sb_publishable_...` / `sb_secret_...` | Utilisables, mais le SDK `@supabase/ssr` utilise par convention les JWT anon/service_role. |
| **Legacy JWT** (anon / service_role) | `eyJ...L7c` / `eyJ...oiU` | **← À utiliser dans le projet.** Ce sont les clés attendues par `createBrowserClient` et `createServerClient`. |

> [!IMPORTANT]
> Pour le `.env.local` et Vercel, utilisez les **clés Legacy JWT** (anon et service_role),
> pas les nouvelles clés publishable/secret. Le SDK Supabase SSR les attend sous cette forme.
