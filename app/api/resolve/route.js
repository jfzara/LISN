// app/api/resolve/route.js — v5 — conservative, LLM-first
// MusicBrainz is used ONLY to detect shared titles between documented artists.
// For everything else, we let the LLM handle identification directly.
export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    const { query, entityType = "track" } = await req.json();
    if (!query?.trim()) return Response.json({ resolved: null });
    const q = query.trim();
    const UA = "LISN/4.0 (music-app; contact@lisn.app)";

    // ── ARTIST MODE ─────────────────────────────────────────────────────────
    // Simple: find the artist, return if confident
    if (entityType === "artist") {
      const res = await fetch(
        `https://musicbrainz.org/ws/2/artist/?query=${encodeURIComponent(q)}&limit=3&fmt=json`,
        { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(4000) }
      );
      if (!res.ok) return Response.json({ resolved: null });
      const data = await res.json();
      const artists = (data?.artists || []).slice(0, 3).map(a => ({
        label:   a.name,
        artist:  a.name,
        year:    (a["life-span"]?.begin || "").slice(0, 4),
        score:   a.score || 0,
        genre:   a.tags?.[0]?.name || a.genres?.[0]?.name || "",
        country: a.country || "",
      }));
      if (!artists.length) return Response.json({ resolved: null });
      const top = artists[0];
      const isAmbiguous = artists.length > 1
        && artists[1].score > 70
        && artists[0].artist.toLowerCase() !== artists[1].artist.toLowerCase();
      // No minimum threshold for artists — LLM knows well-known artists regardless
      return Response.json({
        resolved: top.score >= 50 ? top : null,
        candidates: isAmbiguous ? artists.slice(0, 3) : null,
      });
    }

    // ── TRACK / ALBUM MODE ───────────────────────────────────────────────────
    // CONSERVATIVE APPROACH:
    // Only use MB to detect "shared title by multiple KNOWN artists"
    // We do NOT filter recordings by quality here — too unreliable
    // Instead: only show disambiguation when multiple ARTISTS with MB score >= 60
    // have recordings with this exact title.
    // For everything else: return null → LLM handles it directly

    const field = entityType === "album" ? "release" : "recording";
    const mbKey  = entityType === "album" ? "releases" : "recordings";

    const res = await fetch(
      `https://musicbrainz.org/ws/2/${field}/?query=title:${encodeURIComponent(`"${q}"`)}&limit=10&fmt=json`,
      { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(5000) }
    );
    if (!res.ok) return Response.json({ resolved: null });
    const data = await res.json();
    const items = (data?.[mbKey] || []).slice(0, 10);

    // Extract artist IDs from results
    const byArtist = {};
    for (const item of items) {
      const artistName = item["artist-credit"]?.[0]?.artist?.name || item["artist-credit"]?.[0]?.name;
      const artistId   = item["artist-credit"]?.[0]?.artist?.id;
      const normTitle  = item.title?.toLowerCase().replace(/[^a-z0-9]/g, "");
      const normQ      = q.toLowerCase().replace(/[^a-z0-9]/g, "");
      if (!artistName || normTitle !== normQ) continue;
      if (!byArtist[artistName]) {
        byArtist[artistName] = {
          artist:   artistName,
          artistId: artistId || "",
          year:     (item.date || item["first-release-date"] || "").slice(0, 4),
          genre:    item.tags?.[0]?.name || "",
          recScore: item.score || 0,
        };
      }
    }

    const uniqueArtists = Object.values(byArtist);
    if (uniqueArtists.length < 2) {
      // Only 0 or 1 artist has this exact title — no disambiguation needed
      // Let the LLM identify it directly
      return Response.json({ resolved: null, candidates: null });
    }

    // Multiple artists share this title — verify which ones are documented
    // Check artist scores in parallel (max 5)
    const toCheck = uniqueArtists.slice(0, 5);
    await Promise.allSettled(
      toCheck.filter(a => a.artistId).map(async (a) => {
        try {
          const ar = await fetch(
            `https://musicbrainz.org/ws/2/artist/${a.artistId}?fmt=json`,
            { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(3000) }
          );
          if (ar.ok) {
            const ad = await ar.json();
            const hasWiki = (ad?.relations || []).some(r =>
              r.url?.resource?.includes("wikipedia")
            );
            const tagCount = (ad?.tags || []).length;
            a.artistScore = hasWiki ? 90 : tagCount >= 2 ? 75 : tagCount >= 1 ? 55 : 20;
          } else { a.artistScore = 20; }
        } catch { a.artistScore = 20; }
      })
    );

    // Only show disambiguation for artists who are actually documented
    const documented = toCheck.filter(a => (a.artistScore || 0) >= 55);

    if (documented.length < 2) {
      // Less than 2 documented artists → no disambiguation needed, let LLM handle
      return Response.json({ resolved: null, candidates: null });
    }

    // Genuine shared title between documented artists → disambiguate
    const candidates = documented
      .sort((a, b) => (b.artistScore || 0) - (a.artistScore || 0))
      .slice(0, 4)
      .map(a => ({
        label:  q,
        artist: a.artist,
        year:   a.year,
        genre:  a.genre,
      }));

    return Response.json({ resolved: null, candidates, sharedTitle: true });

  } catch {
    return Response.json({ resolved: null });
  }
}
