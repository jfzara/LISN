// app/api/cover/route.js
export const runtime = "edge";
export const dynamic = "force-dynamic";

const UA = "LISN/4.0 (music-app; contact@lisn.app)";
const headers = {
  "Content-Type": "application/json",
  "Cache-Control": "public, max-age=86400, s-maxage=86400",
};

// Try Wikipedia with multiple strategies to avoid disambiguation pages
async function fetchArtistImage(artist) {
  // Strategy 1: exact artist name
  const attempts = [
    artist,
    `${artist} singer`,
    `${artist} musician`,
    `${artist} rapper`,
    `${artist} chanteur`,
  ];

  for (const query of attempts) {
    try {
      // REST summary API — fastest
      const r = await fetch(
        `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`,
        { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(3000) }
      );
      if (r.ok) {
        const d = await r.json();
        // Reject if description suggests wrong entity (writer, playwright, etc.)
        const desc = (d?.description || "").toLowerCase();
        const title = (d?.title || "").toLowerCase();
        const isMusicRelated = 
          desc.includes("singer") || desc.includes("rapper") || desc.includes("musician") ||
          desc.includes("artist") || desc.includes("chanteur") || desc.includes("chanteuse") ||
          desc.includes("band") || desc.includes("group") || desc.includes("dj") ||
          desc.includes("producer") || desc.includes("r&b") || desc.includes("hip-hop") ||
          desc.includes("pop") || desc.includes("rock") || desc.includes("jazz");
        const isWrongEntity =
          desc.includes("playwright") || desc.includes("dramatist") ||
          desc.includes("novelist") || desc.includes("poet") ||
          desc.includes("painter") || desc.includes("philosopher") ||
          desc.includes("politician") || desc.includes("athlete") ||
          (query === artist && !isMusicRelated && attempts.indexOf(query) === 0);

        if (isWrongEntity && query === artist) continue; // try next strategy

        const url = d?.thumbnail?.source || d?.originalimage?.source;
        if (url) return url;
      }
    } catch { continue; }
  }

  // Fallback: MediaWiki search API
  try {
    const r = await fetch(
      `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(artist + " singer musician")}&srlimit=3&format=json&origin=*`,
      { signal: AbortSignal.timeout(3000) }
    );
    if (r.ok) {
      const d = await r.json();
      const results = d?.query?.search || [];
      for (const result of results) {
        const desc = (result.snippet || "").toLowerCase();
        if (desc.includes("singer") || desc.includes("rapper") || desc.includes("musician") ||
            desc.includes("chanteur") || desc.includes("band")) {
          // Fetch thumbnail for this page
          const pageR = await fetch(
            `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(result.title)}`,
            { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(3000) }
          );
          if (pageR.ok) {
            const pd = await pageR.json();
            const url = pd?.thumbnail?.source;
            if (url) return url;
          }
        }
      }
    }
  } catch {}

  return null;
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const artist     = (searchParams.get("artist") || "").trim();
  const title      = (searchParams.get("title")  || "").trim();
  const album      = (searchParams.get("album")  || "").trim();
  const entityType = searchParams.get("type")    || "track";

  if (!artist) return new Response(JSON.stringify({ url: null }), { headers });

  try {
    if (entityType === "artist") {
      const url = await fetchArtistImage(artist);
      return new Response(JSON.stringify({ url }), { headers });
    }

    // Track / Album — MusicBrainz + Cover Art Archive
    const term  = album || title;
    const field = album ? "release" : "recording";
    const q     = `${field}:"${term}" AND artist:"${artist}"`;

    const r3 = await fetch(
      `https://musicbrainz.org/ws/2/release/?query=${encodeURIComponent(q)}&limit=3&fmt=json`,
      { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(5000) }
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

    // Fallback: try artist image for track/album
    const artistUrl = await fetchArtistImage(artist);
    return new Response(JSON.stringify({ url: artistUrl }), { headers });

  } catch (e) {
    return new Response(JSON.stringify({ url: null }), { headers });
  }
}
