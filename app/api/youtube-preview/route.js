// app/api/youtube-preview/route.js
// YouTube Data API v3 — avec scoring pour éviter réactions/critiques/covers

export const dynamic = "force-dynamic";

const SEARCH_URL = "https://www.googleapis.com/youtube/v3/search";

// Mots qui trahissent une vidéo non originale
const BLACKLIST = [
  "reaction", "react ", "reacting", "reacts", "first time hearing",
  "listening to for the first", "my reaction",
  "review", "album review", "track review", "critique",
  "analysis", "analyzing", "breakdown", "explained", "dissected",
  "cover", " covered by", "covering", "performed by",
  "top 10", "top 5", "best songs", "worst songs", "ranked", "tier list",
  " vs ", "versus", "compared to",
  "making of", "behind the scenes",
];

// Signaux d'une vidéo officielle
const WHITELIST = [
  "official", "officiel",
  " audio",
  "full album", "album complet",
  "vevo",
];

function scoreVideo(item, artist, title) {
  const vtitle  = (item.snippet?.title        || "").toLowerCase();
  const channel = (item.snippet?.channelTitle || "").toLowerCase();
  const artistL = artist.toLowerCase();
  const titleL  = title.toLowerCase();
  let score = 0;

  // ── Signaux positifs ──────────────────────────────────────────
  // Chaîne "Artist - Topic" = auto-générée YouTube Music = source officielle
  if (channel.includes("- topic") || channel.includes("topic")) score += 12;

  // Chaîne ressemble à l'artiste
  const artistWords = artistL.split(/\s+/).filter(w => w.length > 2);
  const channelMatchCount = artistWords.filter(w => channel.includes(w)).length;
  if (channelMatchCount > 0) score += channelMatchCount * 4;

  // Titre contient l'artiste et le titre de l'œuvre
  if (vtitle.includes(artistL.slice(0, 6))) score += 3;
  if (vtitle.includes(titleL.slice(0, 6)))  score += 3;

  // Signaux whitelist dans le titre
  for (const w of WHITELIST) {
    if (vtitle.includes(w)) { score += 5; break; }
  }

  // Chaîne VEVO
  if (channel.includes("vevo")) score += 8;

  // ── Pénalités ────────────────────────────────────────────────
  for (const w of BLACKLIST) {
    if (vtitle.includes(w)) { score -= 20; break; }
  }

  // Titres qui commencent par le nom du channel ≠ artiste = suspect
  if (!channel.includes(artistL.slice(0, 4)) &&
      vtitle.startsWith(channel.slice(0, 6))) {
    score -= 5;
  }

  return score;
}

// ── Rate limiting simple en mémoire ──────────────────────────────
// Pas de Redis requis — suffisant pour un MVP
const RATE_STORE = new Map();
const RATE_LIMIT  = 30;   // requêtes max par fenêtre
const RATE_WINDOW = 60_000; // 60 secondes

function isRateLimited(ip) {
  const now   = Date.now();
  const entry = RATE_STORE.get(ip) || { count: 0, reset: now + RATE_WINDOW };
  if (now > entry.reset) {
    RATE_STORE.set(ip, { count: 1, reset: now + RATE_WINDOW });
    return false;
  }
  entry.count++;
  RATE_STORE.set(ip, entry);
  return entry.count > RATE_LIMIT;
}

// Nettoyer le store périodiquement pour éviter les fuites mémoire
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of RATE_STORE) {
    if (now > val.reset) RATE_STORE.delete(key);
  }
}, 120_000);

export async function GET(req) {
  // ── Rate limiting ──────────────────────────────────────────────
  const forwarded = req.headers.get("x-forwarded-for");
  const ip        = forwarded ? forwarded.split(",")[0].trim() : "unknown";
  if (isRateLimited(ip)) {
    return Response.json({ error: "Trop de requêtes" }, { status: 429 });
  }

  const { searchParams } = new URL(req.url);

  // ── Validation et sanitisation des inputs ─────────────────────
  const artist = (searchParams.get("artist") || "").trim().slice(0, 120);
  const title  = (searchParams.get("title")  || "").trim().slice(0, 120);

  // Rejeter les inputs vides ou suspicieux
  if (!artist || !title) {
    return Response.json({ error: "Paramètres manquants" }, { status: 400 });
  }

  // Caractères autorisés — lettres, chiffres, espaces, ponctuation courante
  const SAFE_PATTERN = /^[\p{L}\p{N}\s\-_.,!?'"&()[\]éèêëàâùûüôîïçœæÉÈÊËÀÂÙÛÜÔÎÏÇŒÆ]+$/u;
  if (!SAFE_PATTERN.test(artist) || !SAFE_PATTERN.test(title)) {
    return Response.json({ error: "Caractères non autorisés" }, { status: 400 });
  }

  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "Service indisponible" }, { status: 503 });
  }

  try {
    // Queries dans l'ordre — s'arrête dès qu'on trouve un bon résultat
    const queries = [
      `${artist} ${title} official audio`,
      `${artist} ${title} full album`,
      `${artist} ${title}`,
      `${title} ${artist}`,
    ];

    let bestItem  = null;
    let bestScore = -Infinity;
    let allItems  = [];

    for (const q of queries) {
      const url = new URL(SEARCH_URL);
      url.searchParams.set("part",            "snippet");
      url.searchParams.set("q",               q);
      url.searchParams.set("type",            "video");
      url.searchParams.set("videoCategoryId", "10"); // Music
      url.searchParams.set("maxResults",      "8");  // Plus de résultats = meilleur scoring
      url.searchParams.set("key",             apiKey);

      const res = await fetch(url.toString());
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`YouTube API error ${res.status}: ${txt}`);
      }

      const data  = await res.json();
      const items = data?.items || [];
      allItems    = [...allItems, ...items];

      // Scorer tous les résultats de cette query
      for (const item of items) {
        const s = scoreVideo(item, artist, title);
        if (s > bestScore) {
          bestScore = s;
          bestItem  = item;
        }
      }

      // Si on a un résultat avec un bon score → on s'arrête
      if (bestScore >= 8) break;
    }

    // Fallback : si tous les scores sont négatifs (= que des réactions/covers)
    // on prend quand même le moins mauvais plutôt que rien
    if (!bestItem && allItems.length > 0) {
      bestItem  = allItems[0];
      bestScore = 0;
    }

    if (!bestItem) {
      return Response.json({
        videoId: null,
      }, { status: 404 });
    }

    const videoId      = bestItem.id?.videoId;
    const videoTitle   = bestItem.snippet?.title;
    const thumbnail    = bestItem.snippet?.thumbnails?.medium?.url ||
                         bestItem.snippet?.thumbnails?.default?.url;
    const channelTitle = bestItem.snippet?.channelTitle;

    if (!videoId) {
      return Response.json({ videoId: null }, { status: 404 });
    }

    return Response.json({
      videoId,
      videoTitle,
      thumbnail,
      channelTitle,
      embedUrl:  `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&start=20`,
      watchUrl:  `https://www.youtube.com/watch?v=${videoId}`,
    }, {
      headers: {
        "Cache-Control": "public, max-age=86400",
        "Content-Type":  "application/json",
        "X-Content-Type-Options": "nosniff",
      },
    });

  } catch (err) {
    console.error("[youtube-preview]", err.message); // log serveur seulement
    return Response.json({ error: "Erreur de recherche", videoId: null }, { status: 500 });
  }
}
