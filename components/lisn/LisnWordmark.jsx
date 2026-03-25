// components/lisn/LisnWordmark.jsx
"use client";
import { useEffect, useRef, useState } from "react";

export default function LisnWordmark({ lang = "fr" }) {
  const lisnRef   = useRef(null);
  const ruleRef   = useRef(null);
  const outerRef  = useRef(null);
  const listenRef = useRef(null);
  const sloganRef = useRef(null);

  function play(ruleW) {
    const w = ruleW || 148;

    // Reset all
    [lisnRef, ruleRef, outerRef, listenRef, sloganRef].forEach(r => {
      if (r.current) { r.current.style.animation = "none"; r.current.offsetHeight; }
    });

    // Dynamic rule keyframe
    const styleId = "lisn-wm-rule-kf";
    let el = document.getElementById(styleId);
    if (!el) { el = document.createElement("style"); el.id = styleId; document.head.appendChild(el); }
    el.textContent = `@keyframes ruleWmGrow { 0%{width:0} 100%{width:${w}px} }`;

    // 1. lisn drops in — sharp, physical
    if (lisnRef.current)
      lisnRef.current.style.animation =
        "lisnWmIn 0.65s cubic-bezier(0.08, 0.9, 0.25, 1) 0.05s forwards";

    // 2. orange line shoots out
    if (ruleRef.current)
      ruleRef.current.style.animation =
        "ruleWmGrow 0.55s cubic-bezier(0.08, 1, 0.2, 1) 0.8s forwards";

    // 3. listen arrives from center, settles
    if (outerRef.current)
      outerRef.current.style.animation =
        "listenReveal 0.04s linear 1.42s forwards";
    if (listenRef.current)
      listenRef.current.style.animation =
        "listenSettle 0.75s cubic-bezier(0.08, 0.9, 0.25, 1) 1.42s both";

    // 4. slogan fades in slowly then slides right — cheeky, impertinent
    if (sloganRef.current)
      sloganRef.current.style.animation =
        "sloganIn 1.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) 2.3s both";
  }

  useEffect(() => {
    if (lisnRef.current) {
      lisnRef.current.style.opacity = "0";
      lisnRef.current.style.animation = "none";
      requestAnimationFrame(() => {
        const w = lisnRef.current?.getBoundingClientRect().width || 148;
        play(w);
      });
    } else {
      play(148);
    }
  }, []);

  const slogan = lang === "fr"
    ? "Mais tu peux toujours aimer ce que tu aimes."
    : "But you can still like what you like.";

  return (
    <>
      <style>{`
        @keyframes lisnWmIn {
          0%   { opacity:0; transform:translateY(14px) scaleY(0.9); }
          70%  { transform:translateY(-2px) scaleY(1.02); }
          100% { opacity:1; transform:translateY(0) scaleY(1); }
        }
        @keyframes listenReveal {
          to { opacity:1; }
        }
        @keyframes listenSettle {
          0%   { transform:scale(3.5) translateY(1px); opacity:0; letter-spacing:0.01em; }
          8%   { opacity:1; }
          100% { transform:scale(1) translateY(0); opacity:1; letter-spacing:0.28em; }
        }
        @keyframes sloganIn {
          0%   { opacity:0; transform:translateX(0px); }
          30%  { opacity:0.7; transform:translateX(0px); }
          70%  { opacity:1; transform:translateX(0px); }
          85%  { transform:translateX(0px); }
          100% { opacity:1; transform:translateX(6px); }
        }
      `}</style>

      <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-start" }}>

        {/* LISN */}
        <span ref={lisnRef} style={{
          fontFamily:"'Libre Baskerville', Georgia, serif",
          fontSize:"clamp(44px, 6vw, 62px)",
          fontWeight:400, fontStyle:"italic",
          letterSpacing:"-0.05em", lineHeight:1,
          color:"var(--ink)", opacity:0,
          display:"block",
        }}>lisn</span>

        {/* LINE + LISTEN */}
        <div style={{ display:"flex", alignItems:"center", marginTop:5 }}>
          <div ref={ruleRef} style={{
            height:"2.5px", width:0,
            background:"var(--accent)", flexShrink:0,
          }} />
          <div ref={outerRef} style={{ overflow:"visible", display:"flex", alignItems:"center", opacity:0 }}>
            <span ref={listenRef} style={{
              fontFamily:"'DM Mono', monospace",
              fontSize:"8px", fontWeight:400, letterSpacing:"0.28em",
              color:"var(--ink-3)", display:"inline-block",
              transformOrigin:"left center", paddingLeft:"9px", whiteSpace:"nowrap",
            }}>listen</span>
          </div>
        </div>

        {/* SLOGAN — appears after, slides right */}
        <span ref={sloganRef} style={{
          fontFamily:"'DM Mono', monospace",
          fontSize:"7px", fontWeight:400, letterSpacing:"0.12em",
          color:"var(--ink-3)", marginTop:8,
          opacity:0, whiteSpace:"nowrap",
          display:"block",
        }}>{slogan}</span>

      </div>
    </>
  );
}
