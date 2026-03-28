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

---

# Groq — Free LLM Fallback

LISN uses Groq as automatic fallback when Anthropic is unavailable (no credits, rate limit, overload).
Model: **llama-3.3-70b-versatile** — free tier, 6000 requests/day, good quality.

## Setup (2 minutes)

1. `console.groq.com` → create free account
2. API Keys → Create API Key
3. Add to `.env.local`:
```
GROQ_API_KEY=gsk_...
```
4. Add to Vercel Settings → Environment Variables: `GROQ_API_KEY`

## Fallback order

1. **Anthropic Sonnet** (best quality, paid)
2. **Anthropic Haiku** (fast, cheap — if Sonnet fails)
3. **Groq Llama 3.3 70B** (free — if both Anthropic fail)

No code changes needed. The fallback is automatic.

## Cost estimate in production

With Upstash cache (30-day TTL):
- ~80% of requests served from cache → $0
- ~20% new unique queries:
  - Groq free tier covers ~6000 new analyses/day at $0
  - Beyond free tier: Anthropic Haiku ~$0.002/analysis
  - Premium users: Anthropic Sonnet ~$0.05/analysis

For a typical indie app: monthly cost < $5 until you have 1000+ daily active users.
