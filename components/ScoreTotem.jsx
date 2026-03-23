export default function ScoreTotem({ score }) {
  const safeScore = Math.max(0, Math.min(100, Number(score || 0)));
  const intensity = safeScore / 100;
  const accentOpacity = 0.22 + intensity * 0.55;
  const baseOpacity = 0.08 + intensity * 0.2;
  const circumference = 2 * Math.PI * 82;
  const dash = circumference * intensity;

  return (
    <div className="lisn-score-totem" style={{ color: "#315443" }}>
      <svg className="lisn-score-totem-svg" viewBox="0 0 220 220" fill="none" xmlns="http://www.w3.org/2000/svg">
        <line x1="18" y1="18" x2="58" y2="18" stroke="currentColor" strokeOpacity={baseOpacity * 2.2} strokeWidth="0.75" />
        <line x1="18" y1="18" x2="18" y2="58" stroke="currentColor" strokeOpacity={baseOpacity * 2.2} strokeWidth="0.75" />
        <line x1="202" y1="202" x2="162" y2="202" stroke="currentColor" strokeOpacity={baseOpacity * 1.3} strokeWidth="0.75" />
        <line x1="202" y1="202" x2="202" y2="162" stroke="currentColor" strokeOpacity={baseOpacity * 1.3} strokeWidth="0.75" />
        <circle cx="110" cy="110" r="82" stroke="currentColor" strokeOpacity={baseOpacity * 1.7} strokeWidth="0.8" strokeDasharray="4 7" />
        <circle
          cx="110"
          cy="110"
          r="82"
          stroke="currentColor"
          strokeOpacity={accentOpacity}
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
          transform="rotate(-90 110 110)"
        />
      </svg>

      <div className="lisn-score-totem-center">
        <div className="lisn-score-totem-label">Score LISN</div>
        <div className="lisn-score-totem-number">{safeScore}</div>
        <div className="lisn-score-totem-denom">/100</div>
      </div>

      <style jsx>{`
        .lisn-score-totem {
          position: relative;
          width: 228px;
          height: 228px;
          display: grid;
          place-items: center;
        }

        .lisn-score-totem::after {
          content: "";
          position: absolute;
          inset: 38px;
          border-radius: 999px;
          background: radial-gradient(circle, rgba(49, 84, 67, 0.08), transparent 70%);
          filter: blur(18px);
          pointer-events: none;
        }

        .lisn-score-totem-svg {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
        }

        .lisn-score-totem-center {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: #14120f;
        }

        .lisn-score-totem-label,
        .lisn-score-totem-denom {
          font-family: var(--font-mono);
          font-size: 0.58rem;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: rgba(20, 18, 15, 0.5);
        }

        .lisn-score-totem-number {
          margin-top: 0.2rem;
          font-family: var(--font-serif);
          font-size: 4.9rem;
          line-height: 0.95;
          letter-spacing: -0.03em;
          font-weight: 500;
        }

        .lisn-score-totem-denom {
          margin-top: 0.18rem;
        }

        @media (max-width: 720px) {
          .lisn-score-totem {
            width: 192px;
            height: 192px;
          }

          .lisn-score-totem-number {
            font-size: 4rem;
          }
        }
      `}</style>
    </div>
  );
}
