// /components/lisn/LisnWordmark.jsx
"use client";
import { useEffect, useRef } from "react";

export default function LisnWordmark({ lang = "fr" }) {
  const lisnRef   = useRef(null);
  const ruleRef   = useRef(null);
  const outerRef  = useRef(null);
  const listenRef = useRef(null);

  function play() {
    [lisnRef, ruleRef, outerRef, listenRef].forEach(r => {
      if (r.current) { r.current.style.animation = "none"; r.current.offsetHeight; }
    });
    if (lisnRef.current)
      lisnRef.current.style.animation =
        "lisnWmIn 0.8s cubic-bezier(0.12, 0.9, 0.3, 1) 0.1s forwards";
    if (ruleRef.current)
      ruleRef.current.style.animation =
        "ruleWmGrow 0.9s cubic-bezier(0.12, 0.9, 0.25, 1) 0.85s forwards";
    if (outerRef.current)
      outerRef.current.style.animation =
        "listenWmReveal 0.05s linear 1.75s forwards";
    if (listenRef.current)
      listenRef.current.style.animation =
        "listenWmSettle 0.9s cubic-bezier(0.12, 0.9, 0.25, 1) 1.75s both";
  }

  useEffect(() => { play(); }, []);

  return (
    <>
      <style>{`
        @keyframes lisnWmIn {
          0%   { opacity:0; transform:translateY(12px) scaleY(0.94); }
          100% { opacity:1; transform:translateY(0)    scaleY(1); }
        }
        @keyframes ruleWmGrow {
          0%   { width:0; }
          100% { width:200px; }
        }
        @keyframes listenWmReveal {
          to { opacity:1; }
        }
        @keyframes listenWmSettle {
          0%   { transform:scale(3.2) translateY(1px); opacity:0; letter-spacing:0.02em; }
          6%   { opacity:1; }
          100% { transform:scale(1)   translateY(0);   opacity:1; letter-spacing:0.28em; }
        }
      `}</style>
      <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-start" }}>
        <span ref={lisnRef} style={{
          fontFamily:"'Libre Baskerville', Georgia, serif",
          fontSize:"72px", fontWeight:400, fontStyle:"italic",
          letterSpacing:"-0.05em", lineHeight:1,
          color:"var(--ink)", opacity:0,
        }}>lisn</span>
        <div style={{ display:"flex", alignItems:"center", marginTop:6 }}>
          <div ref={ruleRef} style={{ height:"2.5px", width:0, background:"var(--accent)", flexShrink:0 }} />
          <div ref={outerRef} style={{ overflow:"visible", display:"flex", alignItems:"center", opacity:0 }}>
            <span ref={listenRef} style={{
              fontFamily:"'DM Mono', monospace",
              fontSize:"9px", fontWeight:400, letterSpacing:"0.28em",
              color:"var(--ink-3)", display:"inline-block",
              transformOrigin:"left center", paddingLeft:"10px", whiteSpace:"nowrap",
            }}>listen</span>
          </div>
        </div>
      </div>
    </>
  );
}
