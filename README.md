# LISN

An interactive 3D atlas of music works, with a Next.js API layer that produces structured, LLM-generated analyses of tracks, albums and artists.

<!-- TODO: live URL -->

![screenshot](docs/screenshot.png) <!-- TODO: add screenshot -->

## Features

- 3D globe (Three.js via React Three Fiber) displaying about 3,000 works from a precomputed dataset (`data/worksSeed.js`), placed by "biome" (dense, atmospheric, structural, narrative, hybrid) and sized by score.
- Filters by biome, score range, decade and role (capital, city, village, bridge, island, hamlet).
- Navigation modes: random pick, guided "voyage" that hops every 6 seconds to a nearby work (angular distance on the globe + score difference), "explore around" and artist trajectory.
- Side-by-side comparison of two works selected on the globe.
- Audio preview: finds an official YouTube video for a work and embeds it.
- French / English interface, dark / light theme, mobile layout.
- API routes for full LLM analysis, comparison and discussion (see Architecture; these routes are not yet wired to the current globe UI, whose analysis and discussion panels show previews).

## Tech stack

- Framework: Next.js (App Router), React 19
- 3D: three, @react-three/fiber, @react-three/drei
- Styling: Tailwind CSS, inline styles
- LLM: Anthropic Messages API (Claude Sonnet, then Haiku), Groq (Llama 3.3 70B) as fallback
- Cache: Upstash Redis (REST), in-memory fallback
- External data: MusicBrainz, Cover Art Archive, Wikipedia REST API, YouTube Data API v3
- Hosting: Vercel (serverless functions, `maxDuration = 60`)

## Architecture

```
app/page.jsx            Globe UI (client component), reads data/worksSeed.js
components/globe/*      Scene, points, panels, modals, audio player
app/api/*               Server routes (Node and Edge runtimes)
lib/lisn/*              LLM client, cache, JSON parsing, normalisation, scoring, display adapter
```

API routes:

| Route | Method | What it does |
|---|---|---|
| `/api/analyse-fast` | POST | Short analysis of a track, album or artist. Builds a system prompt with a JSON schema per entity type, streams the model output to the client as NDJSON (`chunk` events, then a final `result`), then runs it through the pipeline below. |
| `/api/analyse` | POST | Same flow with a "deep" prompt (longer texts, worldview and full analysis fields, 4,000 max tokens). |
| `/api/compare` | POST | Gets analyses for two queries (from cache or by calling `/api/analyse-fast`), then asks the model for a JSON verdict (`verdict`, `reason`, `winner`) based on the seven score dimensions. |
| `/api/discuss` | POST | Chat about an analysed work. Sends the analysis context, conversation history and, optionally, the user's own scores so the model can discuss the differences. |
| `/api/resolve` | POST (Edge) | Disambiguation. Queries MusicBrainz; for tracks and albums, only returns candidates when several documented artists (Wikipedia link or tags) share the exact title. Otherwise lets the LLM identify the work. |
| `/api/cover` | GET (Edge) | Artwork lookup: MusicBrainz release search + Cover Art Archive for tracks and albums, Wikipedia summary thumbnail for artists (with filters to skip non-musicians). |
| `/api/youtube-preview` | GET | Runs up to four YouTube searches and scores each result (bonus for "- Topic" and VEVO channels and "official" titles, penalty for reactions, reviews, covers, rankings). Input validation and a per-IP in-memory rate limit (30 requests per minute). |
| `/api/globe` | GET | Builds globe points from `lisn_seed.csv` (deduplicated, mapped to genre regions). Prototype route; the current UI uses `data/worksSeed.js`. |

Analysis pipeline (`lib/lisn/runLisnPipeline.js`): parse the model's JSON (`parseModelJson`), normalise fields (`normalizeAnalysis`), derive display scores and apply score caps (`scoringRules`, e.g. singularity capped at 55 when the work depends heavily on a template), then shape the response for the UI (`displayAdapter`).

LLM client (`lib/lisn/llmClient.js`): calls the Anthropic Messages API directly with `fetch` and parses the server-sent events stream by hand to forward text deltas. Providers are tried in order: Sonnet, then Haiku, then Groq (non-streaming, iterating over a list of models in case one is decommissioned). Temperature is 0. Model names can be overridden with environment variables.

Cache (`lib/lisn/analysisCache.js`): results are stored in Upstash Redis for 30 days under the key `lisn:v8:<query>::<entityType>::<lang>`. A cache hit returns immediately with `X-Cache: HIT`. If Redis is not configured or fails, a 300-entry in-memory map is used instead. See `CACHE_SETUP.md`.

## Key decisions

- **30-day Redis cache.** On serverless functions, memory is lost on every cold start. A persistent cache means the same query always returns the same analysis (consistency of scores across users and sessions) and that each unique query is paid for only once in LLM tokens. The version prefix in the key (`v8`) lets a prompt change invalidate every entry at once.
- **Provider fallback chain.** Anthropic outages, rate limits or an empty balance should not break the app, so the client falls back to a cheaper model and then to Groq's free tier.
- **Streaming as NDJSON.** Analyses take several seconds; streaming text chunks keeps the UI responsive while the final, validated JSON is sent as a separate last event.
- **External lookups outside the LLM.** Artwork, YouTube previews and disambiguation use MusicBrainz, Wikipedia and YouTube rather than the model, so links and images point to real resources.

## Getting started

Requirements: Node.js 18+.

```bash
git clone https://github.com/jfzara/LISN.git
cd LISN
npm install
# create .env.local with the variables below
npm run dev
```

Open http://localhost:3000.

Environment variables (`.env.local`):

```
ANTHROPIC_API_KEY=your_anthropic_key          # analysis, compare, discuss
ANTHROPIC_MODEL_FULL=optional_model_override  # default: Sonnet
ANTHROPIC_MODEL_FAST=optional_model_override  # default: Haiku
GROQ_API_KEY=your_groq_key                    # optional fallback
UPSTASH_REDIS_REST_URL=your_upstash_url       # optional, persistent cache
UPSTASH_REDIS_REST_TOKEN=your_upstash_token   # optional, persistent cache
YOUTUBE_API_KEY=your_youtube_key              # audio previews
NEXT_PUBLIC_APP_URL=your_app_url              # optional, CORS origin for /api/youtube-preview
```

The globe itself works without any key; previews need `YOUTUBE_API_KEY`.

## Known limitations / next steps

- The analysis, compare and discuss routes are not yet connected to the globe UI; the analysis and discussion modals currently show previews.
- Works on the globe come from a precomputed static file, not from live analyses.
- Fast and deep analyses share the same cache key, and failed parses are cached like successful results.
- The YouTube rate limit is in memory, so it is per serverless instance.
- No automated tests yet.

## Author

Jeff Zara — [GitHub](https://github.com/jfzara)

---

## Français

# LISN

Un atlas 3D interactif d'œuvres musicales, avec une couche d'API Next.js qui produit des analyses structurées, générées par LLM, de morceaux, d'albums et d'artistes.

<!-- TODO: live URL -->

![screenshot](docs/screenshot.png) <!-- TODO: add screenshot -->

### Fonctionnalités

- Globe 3D (Three.js via React Three Fiber) affichant environ 3 000 œuvres issues d'un jeu de données précalculé (`data/worksSeed.js`), placées par « biome » (dense, atmosphérique, structurel, narratif, hybride) et dimensionnées selon leur score.
- Filtres par biome, plage de score, décennie et rôle (capitale, ville, village, pont, île, hameau).
- Modes de navigation : tirage au hasard, « voyage » guidé qui passe toutes les 6 secondes à une œuvre voisine (distance angulaire sur le globe + écart de score), « explorer autour » et trajectoire d'un artiste.
- Comparaison côte à côte de deux œuvres sélectionnées sur le globe.
- Écoute : recherche une vidéo YouTube officielle de l'œuvre et l'intègre.
- Interface français / anglais, thème sombre / clair, mise en page mobile.
- Routes d'API pour l'analyse complète, la comparaison et la discussion par LLM (voir Architecture ; ces routes ne sont pas encore branchées à l'interface du globe, dont les panneaux d'analyse et de discussion affichent des aperçus).

### Stack technique

- Framework : Next.js (App Router), React 19
- 3D : three, @react-three/fiber, @react-three/drei
- Styles : Tailwind CSS, styles inline
- LLM : API Messages d'Anthropic (Claude Sonnet, puis Haiku), Groq (Llama 3.3 70B) en repli
- Cache : Upstash Redis (REST), repli en mémoire
- Données externes : MusicBrainz, Cover Art Archive, API REST de Wikipédia, YouTube Data API v3
- Hébergement : Vercel (fonctions serverless, `maxDuration = 60`)

### Architecture

```
app/page.jsx            Interface du globe (composant client), lit data/worksSeed.js
components/globe/*      Scène, points, panneaux, modales, lecteur audio
app/api/*               Routes serveur (runtimes Node et Edge)
lib/lisn/*              Client LLM, cache, parsing JSON, normalisation, scores, adaptateur d'affichage
```

Routes d'API :

| Route | Méthode | Rôle |
|---|---|---|
| `/api/analyse-fast` | POST | Analyse courte d'un morceau, album ou artiste. Construit un prompt système avec un schéma JSON par type d'entité, diffuse la sortie du modèle au client en NDJSON (événements `chunk`, puis un `result` final), puis la fait passer dans le pipeline ci-dessous. |
| `/api/analyse` | POST | Même flux avec un prompt « approfondi » (textes plus longs, champs worldview et analyse complète, 4 000 tokens max). |
| `/api/compare` | POST | Récupère les analyses de deux requêtes (depuis le cache ou en appelant `/api/analyse-fast`), puis demande au modèle un verdict JSON (`verdict`, `reason`, `winner`) fondé sur les sept dimensions de score. |
| `/api/discuss` | POST | Discussion autour d'une œuvre analysée. Envoie le contexte d'analyse, l'historique et, en option, les scores proposés par l'utilisateur pour que le modèle discute les écarts. |
| `/api/resolve` | POST (Edge) | Désambiguïsation. Interroge MusicBrainz ; pour les morceaux et albums, ne renvoie des candidats que si plusieurs artistes documentés (lien Wikipédia ou tags) partagent exactement le même titre. Sinon, laisse le LLM identifier l'œuvre. |
| `/api/cover` | GET (Edge) | Recherche de visuel : MusicBrainz + Cover Art Archive pour les morceaux et albums, miniature Wikipédia pour les artistes (avec filtres pour écarter les homonymes non musiciens). |
| `/api/youtube-preview` | GET | Lance jusqu'à quatre recherches YouTube et note chaque résultat (bonus pour les chaînes « - Topic » et VEVO et les titres « official », pénalité pour réactions, critiques, reprises, classements). Validation des entrées et limitation par IP en mémoire (30 requêtes par minute). |
| `/api/globe` | GET | Construit les points du globe à partir de `lisn_seed.csv` (dédoublonnés, répartis par région de genre). Route prototype ; l'interface actuelle utilise `data/worksSeed.js`. |

Pipeline d'analyse (`lib/lisn/runLisnPipeline.js`) : parsing du JSON du modèle (`parseModelJson`), normalisation des champs (`normalizeAnalysis`), calcul des scores affichés et application de plafonds (`scoringRules`, p. ex. singularité plafonnée à 55 quand l'œuvre dépend fortement d'un gabarit), puis mise en forme pour l'interface (`displayAdapter`).

Client LLM (`lib/lisn/llmClient.js`) : appelle directement l'API Messages d'Anthropic avec `fetch` et parse lui-même le flux server-sent events pour relayer les fragments de texte. Les fournisseurs sont essayés dans l'ordre : Sonnet, puis Haiku, puis Groq (sans streaming, en parcourant une liste de modèles au cas où l'un serait retiré). Température à 0. Les noms de modèles sont configurables par variables d'environnement.

Cache (`lib/lisn/analysisCache.js`) : les résultats sont stockés dans Upstash Redis pendant 30 jours sous la clé `lisn:v8:<requête>::<type>::<langue>`. Un hit renvoie immédiatement la réponse avec `X-Cache: HIT`. Si Redis n'est pas configuré ou échoue, une map en mémoire de 300 entrées prend le relais. Voir `CACHE_SETUP.md`.

### Décisions techniques

- **Cache Redis de 30 jours.** Sur des fonctions serverless, la mémoire est perdue à chaque démarrage à froid. Un cache persistant garantit que la même requête renvoie toujours la même analyse (scores cohérents entre utilisateurs et sessions) et que chaque requête unique n'est payée qu'une fois en tokens. Le préfixe de version dans la clé (`v8`) permet d'invalider toutes les entrées d'un coup après une modification des prompts.
- **Chaîne de repli entre fournisseurs.** Une panne, une limite de débit ou un solde épuisé chez Anthropic ne doit pas casser l'application : le client bascule sur un modèle moins coûteux, puis sur l'offre gratuite de Groq.
- **Streaming en NDJSON.** Une analyse prend plusieurs secondes ; diffuser le texte au fil de l'eau garde l'interface réactive, tandis que le JSON final validé arrive dans un dernier événement distinct.
- **Recherches externes hors LLM.** Visuels, extraits YouTube et désambiguïsation passent par MusicBrainz, Wikipédia et YouTube plutôt que par le modèle, pour que liens et images pointent vers des ressources réelles.

### Démarrage

Prérequis : Node.js 18+.

```bash
git clone https://github.com/jfzara/LISN.git
cd LISN
npm install
# créer .env.local avec les variables ci-dessous
npm run dev
```

Ouvrir http://localhost:3000.

Variables d'environnement (`.env.local`) :

```
ANTHROPIC_API_KEY=your_anthropic_key          # analyse, comparaison, discussion
ANTHROPIC_MODEL_FULL=optional_model_override  # défaut : Sonnet
ANTHROPIC_MODEL_FAST=optional_model_override  # défaut : Haiku
GROQ_API_KEY=your_groq_key                    # repli optionnel
UPSTASH_REDIS_REST_URL=your_upstash_url       # optionnel, cache persistant
UPSTASH_REDIS_REST_TOKEN=your_upstash_token   # optionnel, cache persistant
YOUTUBE_API_KEY=your_youtube_key              # extraits audio
NEXT_PUBLIC_APP_URL=your_app_url              # optionnel, origine CORS de /api/youtube-preview
```

Le globe fonctionne sans aucune clé ; les extraits nécessitent `YOUTUBE_API_KEY`.

### Limites connues / prochaines étapes

- Les routes d'analyse, de comparaison et de discussion ne sont pas encore reliées à l'interface du globe ; les modales d'analyse et de discussion affichent pour l'instant des aperçus.
- Les œuvres du globe proviennent d'un fichier statique précalculé, pas d'analyses en direct.
- Les analyses rapide et approfondie partagent la même clé de cache, et les échecs de parsing sont mis en cache comme des résultats valides.
- La limitation de débit YouTube est en mémoire, donc propre à chaque instance serverless.
- Pas encore de tests automatisés.

### Auteur

Jeff Zara — [GitHub](https://github.com/jfzara)
