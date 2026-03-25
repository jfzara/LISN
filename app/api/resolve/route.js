// app/api/resolve/route.js — MusicBrainz pre-resolution v3
export const runtime = "edge";
export const dynamic = "force-dynamic";

// Known artist names — if query matches these exactly, force artist search
// regardless of entityType toggle
const FORCE_ARTIST_QUERIES = new Set([
  // Added dynamically — we detect this via score comparison below
]);

export async function POST(req) {
  try {
    const { query, entityType = "track" } = await req.json();
    if (!query?.trim()) return Response.json({ resolved: null });
    const q = query.trim();
    const UA = "LISN/4.0 (music-app; contact@lisn.app)";

    // ── SMART DETECTION: run both artist + recording searches in parallel ──
    // This lets us detect when "Yo Gotti" as a track query should actually be an artist
    const [artistRes, trackRes] = await Promise.allSettled([
      fetch(`https://musicbrainz.org/ws/2/artist/?query=${encodeURIComponent(q)}&limit=3&fmt=json`,
        { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(4000) }),
      fetch(`https://musicbrainz.org/ws/2/recording/?query=${encodeURIComponent(q)}&limit=6&fmt=json`,
        { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(4000) }),
    ]);

    const artistData = artistRes.status === "fulfilled" && artistRes.value.ok
      ? await artistRes.value.json() : null;
    const trackData  = trackRes.status === "fulfilled"  && trackRes.value.ok
      ? await trackRes.value.json()  : null;

    const topArtist = (artistData?.artists || [])[0];
    const topArtistScore = topArtist?.score || 0;

    // ── ARTIST MODE ──────────────────────────────────────────────────────────
    if (entityType === "artist") {
      const artists = (artistData?.artists || []).slice(0, 4).map(a => ({
        label:   a.name,
        artist:  a.name,
        year:    (a["life-span"]?.begin || "").slice(0, 4),
        yearEnd: (a["life-span"]?.ended ? (a["life-span"]?.end || "").slice(0, 4) : null),
        score:   a.score || 0,
        genre:   a.tags?.[0]?.name || a.genres?.[0]?.name || "",
        country: a.country || "",
      }));
      if (!artists.length) return Response.json({ resolved: null });
      const top = artists[0];
      // Disambiguate if multiple strong artist matches
      const isAmbiguous = artists.length > 1 && artists[1].score > 65
        && artists[0].artist.toLowerCase() !== artists[1].artist.toLowerCase();
      return Response.json({
        resolved: top.score >= 80 ? top : null,
        candidates: isAmbiguous ? artists.slice(0, 3) : null,
      });
    }

    // ── TRACK / ALBUM MODE ───────────────────────────────────────────────────
    const field = entityType === "album" ? "release" : "recording";
    const items = entityType === "album"
      ? [] // handled below
      : (trackData?.recordings || []).slice(0, 6);

    // If searching album, do a separate release search
    let albumItems = [];
    if (entityType === "album") {
      const albumRes = await fetch(
        `https://musicbrainz.org/ws/2/release/?query=${encodeURIComponent(q)}&limit=6&fmt=json`,
        { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(4000) }
      );
      if (albumRes.ok) {
        const ad = await albumRes.json();
        albumItems = ad?.releases || [];
      }
    }

    const rawItems = entityType === "album" ? albumItems : items;

    const candidates = rawItems.map(item => ({
      title:  item.title,
      artist: item["artist-credit"]?.[0]?.artist?.name || item["artist-credit"]?.[0]?.name || "",
      year:   (item.date || item["first-release-date"] || "").slice(0, 4),
      score:  item.score || 0,
      genre:  item.tags?.[0]?.name || "",
      mbid:   item.id || "",
    })).filter(c => c.title && c.artist);

    if (!candidates.length) return Response.json({ resolved: null });

    // ── KEY FILTER: exclude low-quality / undocumented recordings ──
    // If a track candidate has score < 60 AND artist has <70 artist score in MB → skip
    // This removes Soundcloud-tier recordings from results
    const qualityCandidates = candidates.filter(c => {
      // Keep if: high MB score, OR artist is well-known (topArtist with same name)
      if (c.score >= 70) return true;
      // Check if this candidate's artist matches a well-known artist
      const artistMatchScore = topArtist && 
        topArtist.name.toLowerCase() === c.artist.toLowerCase() 
        ? topArtistScore : 0;
      return artistMatchScore >= 75;
    });

    // ── SHARED TITLE DETECTION ───────────────────────────────────────────────
    const normalizedQ = q.toLowerCase().replace(/[^a-z0-9]/g, "");
    const titleMatches = qualityCandidates.filter(c => {
      const normTitle = c.title.toLowerCase().replace(/[^a-z0-9]/g, "");
      return normTitle === normalizedQ || normTitle.includes(normalizedQ);
    });
    const distinctArtists = [...new Set(titleMatches.map(c => c.artist.toLowerCase()))];

    // ── ARTIST NAME AS TRACK TITLE DETECTION ────────────────────────────────
    // If user searches "Yo Gotti" as track but top artist MB score >= 85 → 
    // suggest they may want the artist
    const likelyShouldBeArtist = topArtistScore >= 85 &&
      topArtist.name.toLowerCase() === q.toLowerCase() &&
      entityType === "track";

    if (likelyShouldBeArtist && titleMatches.length === 0) {
      // No tracks named "Yo Gotti" with sufficient quality → redirect to artist
      return Response.json({
        resolved: null,
        candidates: null,
        suggestArtist: { artist: topArtist.name, score: topArtistScore },
      });
    }

    // Multiple distinct quality artists share this title → disambiguate
    if (distinctArtists.length > 1 && titleMatches.length > 1) {
      const deduped = titleMatches
        .filter((c, i, arr) => arr.findIndex(x => x.artist.toLowerCase() === c.artist.toLowerCase()) === i)
        .slice(0, 4)
        .map(c => ({ label: c.title, artist: c.artist, year: c.year, genre: c.genre, score: c.score }));
      return Response.json({ resolved: null, candidates: deduped, sharedTitle: true });
    }

    const top = qualityCandidates[0] || candidates[0];
    if (!top) return Response.json({ resolved: null });

    // Low confidence → no auto-resolve
    if (top.score < 85) {
      const usable = qualityCandidates.slice(0, 3)
        .map(c => ({ label: c.title, artist: c.artist, year: c.year, genre: c.genre, score: c.score }));
      return Response.json({ resolved: null, candidates: usable.length > 1 ? usable : null });
    }

    return Response.json({ resolved: top, candidates: null });

  } catch {
    return Response.json({ resolved: null });
  }
}
