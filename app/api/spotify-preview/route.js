// app/api/spotify-preview/route.js
// Cherche un track Spotify et retourne son ID pour l'embed iframe
// Les preview_url directes sont mortes depuis nov 2023 — on utilise l'embed à la place

export const runtime = "edge";
export const dynamic = "force-dynamic";

const TOKEN_URL  = "https://accounts.spotify.com/api/token";
const SEARCH_URL = "https://api.spotify.com/v1/search";

let cachedToken = null;
let tokenExpiry = 0;

async function getAccessToken() {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken;

  const id     = process.env.SPOTIFY_CLIENT_ID;
  const secret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!id || !secret) throw new Error("Spotify credentials manquantes");

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${btoa(`${id}:${secret}`)}`,
      "Content-Type":  "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) throw new Error(`Token error: ${res.status}`);
  const data = await res.json();
  cachedToken = data.access_token;
  tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
  return cachedToken;
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const artist = (searchParams.get("artist") || "").trim();
  const title  = (searchParams.get("title")  || "").trim();

  if (!artist || !title) {
    return Response.json({ error: "artist et title requis" }, { status: 400 });
  }

  try {
    const token = await getAccessToken();

    // Query souple — sans guillemets pour plus de résultats
    const q   = encodeURIComponent(`${title} ${artist}`);
    const url = `${SEARCH_URL}?q=${q}&type=track&limit=5&market=FR`;

    const res  = await fetch(url, {
      headers: { "Authorization": `Bearer ${token}` },
    });

    if (!res.ok) throw new Error(`Search error: ${res.status}`);
    const data = await res.json();
    const tracks = data?.tracks?.items || [];

    if (!tracks.length) {
      return Response.json({ spotifyId: null }, { status: 404 });
    }

    // Prendre le meilleur match — priorité au bon artiste
    const artistLow = artist.toLowerCase();
    const best = tracks.find(t =>
      t.artists?.some(a => a.name.toLowerCase().includes(artistLow) ||
                           artistLow.includes(a.name.toLowerCase()))
    ) || tracks[0];

    return Response.json({
      spotifyId:  best.id,
      spotifyUri: best.uri,
      trackName:  best.name,
      artistName: best.artists?.[0]?.name,
      albumName:  best.album?.name,
      albumArt:   best.album?.images?.[1]?.url || best.album?.images?.[0]?.url,
      spotifyUrl: best.external_urls?.spotify,
      durationMs: best.duration_ms,
      // preview_url gardé si dispo (rare mais ça arrive encore)
      previewUrl: best.preview_url || null,
    }, {
      headers: { "Cache-Control": "public, max-age=86400" },
    });

  } catch (err) {
    console.error("[spotify-preview]", err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
