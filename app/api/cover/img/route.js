// Relais d'image : sert la pochette depuis notre propre origine,
// pour que le navigateur puisse en lire les pixels (couleur dominante).
const ALLOWED = ["upload.wikimedia.org", "coverartarchive.org"];

export async function GET(req) {
  const u = new URL(req.url).searchParams.get("u") || "";
  let target;
  try { target = new URL(u); } catch { return new Response("bad url", { status: 400 }); }
  if (target.protocol !== "https:" || !ALLOWED.includes(target.hostname)) {
    return new Response("host not allowed", { status: 400 });
  }
  try {
    const r = await fetch(target, { headers: { "User-Agent": "LISN/1.0 (cover proxy)" } });
    const type = r.headers.get("content-type") || "";
    if (!r.ok || !type.startsWith("image/")) return new Response("not found", { status: 404 });
    return new Response(r.body, {
      headers: { "Content-Type": type, "Cache-Control": "public, max-age=604800, immutable" },
    });
  } catch {
    return new Response("upstream error", { status: 502 });
  }
}
