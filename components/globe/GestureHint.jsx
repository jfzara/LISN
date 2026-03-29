"use client";

/**
 * GestureHint — tutoriel gestuel mobile
 * Apparaît à l'arrivée sur mobile, 2 animations séquentielles
 * Disparaît après interaction ou après timeout
 * Se réactive si idle pendant 10s sans interaction
 */

import { useState, useEffect, useRef } from "react";

function PinchIcon({ color }) {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      {/* Doigt gauche */}
      <ellipse cx="14" cy="30" rx="5" ry="8" fill={color} opacity="0.7" />
      <line x1="14" y1="22" x2="10" y2="14" stroke={color} strokeWidth="2.5"
        strokeLinecap="round" opacity="0.7" />
      {/* Doigt droit */}
      <ellipse cx="34" cy="30" rx="5" ry="8" fill={color} opacity="0.7" />
      <line x1="34" y1="22" x2="38" y2="14" stroke={color} strokeWidth="2.5"
        strokeLinecap="round" opacity="0.7" />
      {/* Flèches écartement */}
      <line x1="8" y1="10" x2="2" y2="4" stroke={color} strokeWidth="2"
        strokeLinecap="round" opacity="0.5" />
      <line x1="40" y1="10" x2="46" y2="4" stroke={color} strokeWidth="2"
        strokeLinecap="round" opacity="0.5" />
    </svg>
  );
}

function RotateIcon({ color }) {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      {/* Arc de rotation */}
      <path d="M 8 24 A 16 16 0 0 1 40 24" stroke={color} strokeWidth="2.5"
        strokeLinecap="round" fill="none" opacity="0.6" />
      <polygon points="40,24 36,18 44,20" fill={color} opacity="0.6" />
      {/* Doigt */}
      <ellipse cx="24" cy="36" rx="5" ry="7" fill={color} opacity="0.8" />
      <line x1="24" y1="29" x2="24" y2="24" stroke={color} strokeWidth="2.5"
        strokeLinecap="round" opacity="0.8" />
    </svg>
  );
}

const HINTS = [
  {
    icon:  "pinch",
    label: "Pince pour zoomer",
  },
  {
    icon:  "rotate",
    label: "Glisse pour tourner",
  },
];

export default function GestureHint({ dark, mobile }) {
  const [step,    setStep]    = useState(0);  // 0=pinch, 1=rotate, 2=hidden
  const [visible, setVisible] = useState(false);
  const [opacity, setOpacity] = useState(0);
  const idleTimer  = useRef(null);
  const hideTimer  = useRef(null);
  const shownOnce  = useRef(false);

  const color = dark ? "#f2ead8" : "#120e0a";

  function show(fromStep = 0) {
    setStep(fromStep);
    setVisible(true);
    setTimeout(() => setOpacity(1), 50);
    // Avancer automatiquement
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      if (fromStep === 0) show(1);
      else hide();
    }, 2200);
  }

  function hide() {
    setOpacity(0);
    clearTimeout(hideTimer.current);
    setTimeout(() => setVisible(false), 400);
  }

  function resetIdleTimer() {
    clearTimeout(idleTimer.current);
    if (shownOnce.current) {
      idleTimer.current = setTimeout(() => show(0), 10000);
    }
  }

  useEffect(() => {
    if (!mobile) return;

    // Afficher au premier chargement après 1s
    const t = setTimeout(() => {
      shownOnce.current = true;
      show(0);
    }, 1000);

    // Écouter les interactions pour reset idle
    const events = ["touchstart", "touchmove", "pointerdown"];
    events.forEach(e => window.addEventListener(e, resetIdleTimer, { passive: true }));

    return () => {
      clearTimeout(t);
      clearTimeout(idleTimer.current);
      clearTimeout(hideTimer.current);
      events.forEach(e => window.removeEventListener(e, resetIdleTimer));
    };
  }, [mobile]);

  // Masquer dès qu'on interagit
  useEffect(() => {
    if (!mobile || !visible) return;
    function onInteract() { hide(); resetIdleTimer(); }
    window.addEventListener("touchstart", onInteract, { passive: true, once: true });
    return () => window.removeEventListener("touchstart", onInteract);
  }, [mobile, visible]);

  if (!mobile || !visible) return null;

  const hint = HINTS[step] || HINTS[0];

  return (
    <div style={{
      position: "fixed",
      bottom: 90,
      left: "50%",
      transform: "translateX(-50%)",
      zIndex: 50,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 8,
      opacity,
      transition: "opacity 0.4s ease",
      pointerEvents: "none",
    }}>
      <div style={{
        background: dark ? "rgba(5,4,3,0.75)" : "rgba(237,230,220,0.82)",
        backdropFilter: "blur(12px)",
        borderRadius: 2,
        padding: "12px 18px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
        border: `1px solid ${dark ? "rgba(242,234,216,0.12)" : "rgba(18,14,10,0.12)"}`,
      }}>
        {hint.icon === "pinch"
          ? <PinchIcon color={color} />
          : <RotateIcon color={color} />
        }
        <span style={{
          fontSize: 11,
          color,
          fontFamily: "'DM Mono', monospace",
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          opacity: 0.8,
        }}>
          {hint.label}
        </span>
      </div>

      {/* Indicateur de progression */}
      <div style={{ display: "flex", gap: 4 }}>
        {HINTS.map((_, i) => (
          <div key={i} style={{
            width: i === step ? 14 : 6,
            height: 3,
            borderRadius: 2,
            background: color,
            opacity: i === step ? 0.8 : 0.25,
            transition: "all 0.3s",
          }} />
        ))}
      </div>
    </div>
  );
}
