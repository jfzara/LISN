# Cache persistant — Upstash Redis (gratuit)

## Pourquoi
Même analyse = même résultat garanti pendant 30 jours.
Fonctionne entre cold starts, entre appareils, entre sessions.

## Setup (5 minutes)

### 1. Créer la base
- `upstash.com` → créer compte gratuit (GitHub login possible)
- **Create Database** → nom : `lisn-cache` → région : `eu-west-1`
- Copier les deux valeurs affichées :
  - `UPSTASH_REDIS_REST_URL`
  - `UPSTASH_REDIS_REST_TOKEN`

### 2. Variables d'environnement

**En local** — ajouter dans `.env.local` :
```
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxx
```

**Sur Vercel** — Settings → Environment Variables → ajouter les deux mêmes.

### 3. Installer le package
```bash
npm install @upstash/redis
```

### 4. Redéployer
```bash
vercel deploy
```

## Limites du tier gratuit
- 10,000 requêtes/jour → largement suffisant (chaque analyse = 1 write + 1 read)
- 256MB storage → chaque analyse ~2-5KB, soit ~50,000 analyses stockées
- Pas de carte bancaire requise

## Invalidation du cache
Pour forcer la re-analyse après mise à jour des prompts :
- Dashboard Upstash → **Flush Database** (vide tout)
- OU changer `v4` → `v5` dans `lib/lisn/analysisCache.js` (invalide toutes les clés)

## Sans Upstash configuré
Le système bascule sur le cache mémoire automatiquement.
Aucune erreur. Fonctionne normalement, sans persistance.
