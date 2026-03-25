// app/api/cover/route.js
// /app/api/cover/route.js
export const runtime = "edge"; // faster, no cold start
export const dynamic = "force-dynamic";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const artist     = (searchParams.get("artist") || "").trim();
  const title      = (searchParams.get("title")  || "").trim();
  const album      = (searchParams.get("album")  || "").trim();
  const entityType = searchParams.get("type")    || "track";

  const headers = {
    "Content-Type": "application/json",
    "Cache-Control": "public, max-age=3600, s-maxage=3600",
  };

  if (!artist) return new Response(JSON.stringify({ url: null }), { headers });

  try {
    if (entityType === "artist") {
      // Try REST summary first (fastest)
      const r1 = await fetch(
        `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(artist)}`,
        { headers: { "User-Agent": "LISN/3.5 music-app" }, signal: AbortSignal.timeout(4000) }
      );
      if (r1.ok) {
        const d = await r1.json();
        const url = d?.thumbnail?.source || d?.originalimage?.source;
        if (url) return new Response(JSON.stringify({ url }), { headers });
      }
      // Fallback: MediaWiki API
      const r2 = await fetch(
        `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(artist)}&prop=pageimages&format=json&pithumbsize=400&origin=*`,
        { signal: AbortSignal.timeout(4000) }
      );
      if (r2.ok) {
        const d = await r2.json();
        const pages = Object.values(d?.query?.pages || {});
        const url = pages[0]?.thumbnail?.source;
        if (url) return new Response(JSON.stringify({ url }), { headers });
      }
      return new Response(JSON.stringify({ url: null }), { headers });
    }

    // Track / Album — MusicBrainz lookup
    const term = album || title;
    const field = album ? "release" : "recording";
    const q = `${field}:"${term}" AND artist:"${artist}"`;
    const r3 = await fetch(
      `https://musicbrainz.org/ws/2/release/?query=${encodeURIComponent(q)}&limit=3&fmt=json`,
      {
        headers: { "User-Agent": "LISN/3.5 (music-app; contact@lisn.app)" },
        signal: AbortSignal.timeout(5000),
      }
    );
    if (!r3.ok) return new Response(JSON.stringify({ url: null }), { headers });
    const mb = await r3.json();

    for (const release of (mb?.releases || [])) {
      const mbid = release?.id;
      if (!mbid) continue;
      try {
        const r4 = await fetch(
          `https://coverartarchive.org/release/${mbid}/front-250`,
          { method: "HEAD", signal: AbortSignal.timeout(3000) }
        );
        if (r4.ok) {
          return new Response(
            JSON.stringify({ url: `https://coverartarchive.org/release/${mbid}/front-250` }),
            { headers }
          );
        }
      } catch { continue; }
    }

    return new Response(JSON.stringify({ url: null }), { headers });
  } catch (e) {
    return new Response(JSON.stringify({ url: null, error: String(e) }), { headers });
  }
}
