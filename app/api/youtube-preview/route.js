// app/api/youtube-preview/route.js
// Cherche une vidéo YouTube pour une œuvre musicale
// YouTube Data API v3 — gratuit, 10 000 req/jour, pas de Premium requis

export const dynamic = "force-dynamic";

const SEARCH_URL = "https://www.googleapis.com/youtube/v3/search";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const artist = (searchParams.get("artist") || "").trim();
  const title  = (searchParams.get("title")  || "").trim();

  if (!artist || !title) {
    return Response.json({ error: "artist et title requis" }, { status: 400 });
  }

  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "YOUTUBE_API_KEY manquant dans .env.local" }, { status: 500 });
  }

  try {
    // Stratégie de query : essayer du plus précis au plus souple
    const queries = [
      `${artist} ${title} full album`,
      `${artist} ${title} official`,
      `${artist} ${title}`,
    ];

    let videoId   = null;
    let videoTitle = null;
    let thumbnail = null;
    let channelTitle = null;

    for (const q of queries) {
      const url = new URL(SEARCH_URL);
      url.searchParams.set("part",        "snippet");
      url.searchParams.set("q",           q);
      url.searchParams.set("type",        "video");
      url.searchParams.set("videoCategoryId", "10"); // Music category
      url.searchParams.set("maxResults",  "5");
      url.searchParams.set("key",         apiKey);

      const res  = await fetch(url.toString());
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`YouTube API error ${res.status}: ${txt}`);
      }

      const data  = await res.json();
      const items = data?.items || [];

      if (!items.length) continue;

      // Priorité : vidéo dont le titre contient l'artiste ET le titre
      const artistLow = artist.toLowerCase();
      const titleLow  = title.toLowerCase();

      const best = items.find(item => {
        const t = item.snippet?.title?.toLowerCase() || "";
        return t.includes(artistLow.slice(0, 5)) || t.includes(titleLow.slice(0, 5));
      }) || items[0];

      videoId      = best.id?.videoId;
      videoTitle   = best.snippet?.title;
      thumbnail    = best.snippet?.thumbnails?.medium?.url ||
                     best.snippet?.thumbnails?.default?.url;
      channelTitle = best.snippet?.channelTitle;

      if (videoId) break;
    }

    if (!videoId) {
      return Response.json({
        videoId: null,
        debug: `Aucune vidéo YouTube pour "${title}" / "${artist}"`,
      }, { status: 404 });
    }

    return Response.json({
      videoId,
      videoTitle,
      thumbnail,
      channelTitle,
      embedUrl: `https://www.youtube.com/embed/${videoId}?autoplay=1&start=0`,
      watchUrl: `https://www.youtube.com/watch?v=${videoId}`,
    }, {
      headers: { "Cache-Control": "public, max-age=86400" },
    });

  } catch (err) {
    console.error("[youtube-preview]", err.message);
    return Response.json({ error: err.message, videoId: null }, { status: 500 });
  }
}
