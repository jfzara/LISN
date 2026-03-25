// app/api/resolve/route.js
// /app/api/resolve/route.js — MusicBrainz pre-resolution
export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    const { query, entityType = "track" } = await req.json();
    if (!query?.trim()) return Response.json({ resolved: null });
    const q = query.trim();
    const UA = "LISN/4.0 (music-app; contact@lisn.app)";

    if (entityType === "track" || entityType === "album") {
      const field = entityType === "album" ? "release" : "recording";
      const res = await fetch(
        `https://musicbrainz.org/ws/2/${field}/?query=${encodeURIComponent(q)}&limit=5&fmt=json`,
        { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(4000) }
      );
      if (!res.ok) return Response.json({ resolved: null });
      const data = await res.json();
      const items = (data?.recordings || data?.releases || []).slice(0, 4);
      if (!items.length) return Response.json({ resolved: null });

      const candidates = items.map(item => ({
        title:  item.title,
        artist: item["artist-credit"]?.[0]?.artist?.name || item["artist-credit"]?.[0]?.name || "",
        year:   (item.date || item["first-release-date"] || "").slice(0, 4),
        score:  item.score || 0,
        genre:  item.tags?.[0]?.name || "",
      })).filter(c => c.title && c.artist);

      if (!candidates.length) return Response.json({ resolved: null });
      const top = candidates[0];

      // Ambiguous: multiple results with similar titles
      const isAmbiguous = candidates.length > 1 &&
        candidates[1].score > 60 &&
        candidates[0].title.toLowerCase() !== query.toLowerCase();

      return Response.json({
        resolved: top,
        candidates: isAmbiguous ? candidates.slice(0, 3) : null
      });
    }

    if (entityType === "artist") {
      const res = await fetch(
        `https://musicbrainz.org/ws/2/artist/?query=${encodeURIComponent(q)}&limit=4&fmt=json`,
        { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(4000) }
      );
      if (!res.ok) return Response.json({ resolved: null });
      const data = await res.json();
      const artists = (data?.artists || []).slice(0, 3).map(a => ({
        artist: a.name,
        year:   (a["life-span"]?.begin || "").slice(0, 4),
        score:  a.score || 0,
        genre:  a.tags?.[0]?.name || a.genres?.[0]?.name || "",
      }));
      if (!artists.length) return Response.json({ resolved: null });
      return Response.json({ resolved: artists[0], candidates: null });
    }

    return Response.json({ resolved: null });
  } catch {
    return Response.json({ resolved: null });
  }
}
