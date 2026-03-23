// /app/api/cover/route.js — proxy cover art to avoid CORS
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const artist     = searchParams.get("artist") || "";
  const title      = searchParams.get("title")  || "";
  const album      = searchParams.get("album")  || "";
  const entityType = searchParams.get("type")   || "track";

  try {
    if (entityType === "artist") {
      const res = await fetch(
        `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(artist)}`,
        { headers: { "User-Agent": "LISN/3.4 (music-evaluation-app)" } }
      );
      if (res.ok) {
        const data = await res.json();
        const img = data?.thumbnail?.source || data?.originalimage?.source;
        if (img) return Response.json({ url: img }, { headers: { "Cache-Control": "public, max-age=3600" } });
      }
      const search = await fetch(
        `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(artist)}&prop=pageimages&format=json&pithumbsize=300`,
        { headers: { "User-Agent": "LISN/3.4" } }
      );
      if (search.ok) {
        const sd = await search.json();
        const pages = Object.values(sd?.query?.pages || {});
        const thumb = pages[0]?.thumbnail?.source;
        if (thumb) return Response.json({ url: thumb }, { headers: { "Cache-Control": "public, max-age=3600" } });
      }
      return Response.json({ url: null });
    }

    const q = album
      ? `release:"${album}" AND artist:"${artist}"`
      : `recording:"${title}" AND artist:"${artist}"`;
    const mb = await fetch(
      `https://musicbrainz.org/ws/2/release/?query=${encodeURIComponent(q)}&limit=3&fmt=json`,
      { headers: { "User-Agent": "LISN/3.4 (music-evaluation-app; contact@lisn.app)" } }
    );
    if (!mb.ok) return Response.json({ url: null });
    const mbData = await mb.json();

    for (const release of (mbData?.releases || [])) {
      const mbid = release?.id;
      if (!mbid) continue;
      const head = await fetch(`https://coverartarchive.org/release/${mbid}/front-250`, { method: "HEAD" });
      if (head.ok) {
        return Response.json(
          { url: `https://coverartarchive.org/release/${mbid}/front-250` },
          { headers: { "Cache-Control": "public, max-age=3600" } }
        );
      }
    }
    return Response.json({ url: null });
  } catch (e) {
    return Response.json({ url: null });
  }
}
