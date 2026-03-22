# Guide des Variables d'Environnement — LiveBoard

Ce document liste l'ensemble des variables d'environnement (clés secrètes et publiques API) requises pour faire fonctionner le projet **LiveBoard**, aussi bien en local sur votre machine que sur l'hébergement de production Vercel.

## 1. Liste des Variables Récapitulative

### Variables Principales (Obligatoires pur le MVP et la vue Web TV)

| Nom de la variable | Description | Où la récupérer dans Supabase ? |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | L'URL d'API d'accès à la base de donnée de votre projet Supabase. | **Supabase Dashboard** > icône d'engrenage (Project Settings) > **API** > Champ "Project URL" |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | La clé publique (anonyme) permettant au site/ordinateur de naviguer sur la base sans causer de faille de sécurité. | **Supabase Dashboard** > icône d'engrenage (Project Settings) > **API** > "Project API keys" > Clé taguée `anon` et `public` |

### Variables Secondaires (Requises seulement si l'on construit de futures logiques complexes côté Server API)

| Nom de la variable | Description | Où la récupérer dans Supabase ? |
| :--- | :--- | :--- |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé "maîtresse" de votre base de données accordant tous les droits d'écriture, qui bypass toute sécurité (RLS). **Elle ne doit jamais être visible du public ni prefixée par `NEXT_PUBLIC_`.** | **Supabase Dashboard** > icône d'engrenage (Project Settings) > **API** > "Project API keys" > Clé taguée `service_role` et `secret` |

---

## 2. Où et comment les configurer selon son contexte ?

### A. Sur votre Ordinateur personnel (Developpement Local)
Pour que vous puissiez faire tourner et éditer le code sur votre ordinateur (`npm run dev`) et le tester en direct avec votre base :
1. Créez un fichier texte nommé exactement `.env.local` à la racine de votre projet de code (à côté de `package.json`).
2. Collez-y vos propres valeurs en suivant cette syntaxe (sans guillemets) :

```env
# ──── Fichier .env.local ────
NEXT_PUBLIC_SUPABASE_URL=https://<votre-id-projet-supabase>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUz...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUz...
```
*(Aucune inquiétude, nous avons mis en place une sécurité dans `.gitignore` pour éviter que votre fichier .env.local ne se retrouve publié au grand public ou sur GitHub).*


### B. Sur Vercel (Production Serveur Live)
Pour que votre site publié sur le domaine en `.vercel.app` fonctionne en communiquant avec la vraie base de données :
1. Connectez-vous à votre [Tableau de bord Vercel](https://vercel.com/dashboard).
2. Sélectionnez le projet propre à "Liveboard" (`sautBPJEPS` / `project-04wvf`).
3. Allez dans l'onglet **Settings** du projet, en haut.
4. Sur le menu de navigation à gauche, cliquez sur **Environment Variables**.
5. Renseignez les variables une par une :
   - Remplir *Key:* avec `NEXT_PUBLIC_SUPABASE_URL` | Remplir *Value:* `https://<...>.supabase.co` | *Cliquez sur "Save"*
   - Remplir *Key:* avec `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Remplir *Value:* `eyJhbGciOiJIUz...` | *Cliquez sur "Save"*
   - (Optionnel) Même procédé pour `SUPABASE_SERVICE_ROLE_KEY` s'il est utilisé un jour.

> **⚠️ NOTE CRUCIALE SUR VERCEL** : 
Chaque fois que vous déclarez, modifiez, ou vérifiez des "Environment Variables" sur Vercel, un redéploiement manuel du site internet entier est obligatoire. Sans cela, Vercel ne refera pas sa routine et le site continuera de planter en utilisant une "ancienne logique". 
> **Faire l'Update :** Allez dans l'onglet principal "Deployments" du tableau Vercel > Cliquez sur les 3 points à coté du dernier en date > Fates *"Redeploy"*.
