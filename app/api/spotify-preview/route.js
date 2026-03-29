// app/api/spotify-preview/route.js
// Récupère une preview MP3 30s depuis Spotify Search API
// Pas d'authentification utilisateur — client credentials uniquement

export const runtime = "edge";
export const dynamic = "force-dynamic";

const TOKEN_URL = "https://accounts.spotify.com/api/token";
const SEARCH_URL = "https://api.spotify.com/v1/search";

// Cache token en mémoire (durée de vie ~1h côté edge)
let cachedToken = null;
let tokenExpiry = 0;

async function getAccessToken() {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken;

  const id     = process.env.SPOTIFY_CLIENT_ID;
  const secret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!id || !secret) throw new Error("Spotify credentials manquantes");

  const creds = btoa(`${id}:${secret}`);
  const res   = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${creds}`,
      "Content-Type":  "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) throw new Error(`Spotify token error: ${res.status}`);
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

    // Requête Spotify Search
    const q   = encodeURIComponent(`track:"${title}" artist:"${artist}"`);
    const url = `${SEARCH_URL}?q=${q}&type=track&limit=3&market=FR`;

    const res  = await fetch(url, {
      headers: { "Authorization": `Bearer ${token}` },
    });

    if (!res.ok) throw new Error(`Spotify search error: ${res.status}`);
    const data = await res.json();

    const tracks = data?.tracks?.items || [];

    // Chercher d'abord une track avec preview_url
    const withPreview = tracks.find(t => t.preview_url);

    if (withPreview) {
      return Response.json({
        previewUrl:  withPreview.preview_url,
        trackName:   withPreview.name,
        artistName:  withPreview.artists?.[0]?.name,
        albumName:   withPreview.album?.name,
        albumArt:    withPreview.album?.images?.[1]?.url || withPreview.album?.images?.[0]?.url,
        spotifyUrl:  withPreview.external_urls?.spotify,
        durationMs:  withPreview.duration_ms,
      }, {
        headers: { "Cache-Control": "public, max-age=86400" },
      });
    }

    // Fallback — retourner les métadonnées sans preview
    if (tracks.length > 0) {
      const t = tracks[0];
      return Response.json({
        previewUrl:  null,
        trackName:   t.name,
        artistName:  t.artists?.[0]?.name,
        albumName:   t.album?.name,
        albumArt:    t.album?.images?.[1]?.url || t.album?.images?.[0]?.url,
        spotifyUrl:  t.external_urls?.spotify,
        durationMs:  t.duration_ms,
      }, {
        headers: { "Cache-Control": "public, max-age=86400" },
      });
    }

    return Response.json({ previewUrl: null }, { status: 404 });

  } catch (err) {
    console.error("[spotify-preview]", err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
