"use client";
import { useEffect, useState } from "react";
import { hashTint, tintFromImage } from "./tint";

// Pochette + teinte de l'œuvre en cours. Appelé une seule fois, au niveau
// de la page, pour que la couleur suive l'œuvre quel que soit le panneau affiché.
export function useCover(work, onTint) {
  const [url, setUrl] = useState(null);
  useEffect(() => {
    setUrl(null);
    if (!work) { onTint?.(null); return; }
    let alive = true;
    const fallback = () => { if (alive) onTint?.(hashTint(`${work.artist}·${work.title}`)); };
    const timer = setTimeout(fallback, 4000);
    const q = new URLSearchParams({ artist: work.artist || "", title: work.title || "", type: work.entityType || "album" });
    if (work.entityType === "album") q.set("album", work.title || "");
    fetch(`/api/cover?${q}`)
      .then(r => r.json())
      .then(async d => {
        if (!alive) return;
        if (!d?.url) { clearTimeout(timer); return fallback(); }
        const src = `/api/cover/img?u=${encodeURIComponent(d.url)}`;
        const tint = await tintFromImage(src);
        if (!alive) return;
        clearTimeout(timer);
        if (tint) { setUrl(src); onTint?.(tint); } else fallback();
      })
      .catch(() => { clearTimeout(timer); fallback(); });
    return () => { alive = false; clearTimeout(timer); };
  }, [work?.id]);
  return url;
}
