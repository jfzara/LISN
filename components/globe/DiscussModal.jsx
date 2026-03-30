"use client";

/**
 * DiscussModal — teaser du mode "Discuter avec LISN"
 * Montre un aperçu d'une vraie conversation avec LISN
 * puis blur + invitation à passer Pro
 */

const BIOME_COLOR = {
  dense:"#FF6B2F", atmospheric:"#4ABFFF", structural:"#E8C97A",
  narrative:"#FF9A4D", hybrid:"#C07AE8",
};

// Aperçu de conversation mock — par biome
const MOCK_CONVO = {
  fr:{
    dense: [
      { role:"user", text:"Pourquoi est-ce que j'aime autant cette musique alors que je ne sais pas vraiment l'expliquer ?" },
      { role:"lisn", text:"Ce que vous ressentez correspond à quelque chose de structuralement précis. Cette œuvre opère à haute densité — plusieurs strates simultanées en tension, aucune qui ne prend le dessus sur les autres. Ce n'est pas une sensation vague : c'est une architecture qui sollicite une écoute totale." },
      { role:"user", text:"Et pourquoi est-ce que certaines personnes n'arrivent pas à l'apprécier ?" },
    ],
    atmospheric: [
      { role:"user", text:"Cette musique me met dans un état particulier. C'est difficile à décrire." },
      { role:"lisn", text:"Ce que vous décrivez est une réponse juste à ce que fait structuralement cette œuvre. Elle opère au niveau du timbre comme forme — pas la mélodie, pas le rythme, mais la texture sonore elle-même comme vecteur de sens. C'est rare, et ça demande une écoute différente." },
      { role:"user", text:"Comment savoir si j'apprécierais d'autres œuvres dans ce registre ?" },
    ],
    structural: [
      { role:"user", text:"Je comprends que c'est techniquement rigoureux, mais je ne sais pas si j'y entends autre chose que de la rigueur." },
      { role:"lisn", text:"C'est une tension réelle dans ce type d'œuvres — la forme peut sembler froide vue de l'extérieur. Ce que LISN peut vous montrer, c'est l'endroit précis où la contrainte cesse d'être une démonstration et devient une nécessité expressive. Ça se joue souvent en quelques mesures." },
      { role:"user", text:"Vous pouvez me montrer où exactement ?" },
    ],
    narrative: [
      { role:"user", text:"Les paroles me touchent mais j'ai du mal à savoir si c'est la musique ou juste le texte." },
      { role:"lisn", text:"C'est précisément la question que LISN pose à cette œuvre. Ici, le texte et la structure sonore ne sont pas séparables — le flow n'illustre pas le sens, il le construit. Retirer les paroles ferait s'effondrer l'architecture, pas seulement changer l'ambiance." },
      { role:"user", text:"Comment distinguer ça d'une chanson où c'est juste le texte qui porte ?" },
    ],
    hybrid: [
      { role:"user", text:"Cette œuvre m'intrigue mais je n'arrive pas à la cerner." },
      { role:"lisn", text:"C'est une réponse appropriée. Cette œuvre résiste précisément parce qu'elle refuse d'appartenir à une grammaire unique. Ce n'est pas de l'indécision formelle — c'est une stratégie structurale qui produit une forme de tension sui generis." },
      { role:"user", text:"Est-ce que c'est ce qui la rend difficile d'accès pour certains ?" },
    ],
  },
  en:{
    dense: [
      { role:"user", text:"Why do I love this music so much when I can't really explain it?" },
      { role:"lisn", text:"What you feel corresponds to something structurally precise. This work operates at high density — multiple simultaneous layers in tension, none dominating the others. It's not a vague feeling: it's an architecture that demands total listening." },
      { role:"user", text:"And why can some people not appreciate it?" },
    ],
    atmospheric: [
      { role:"user", text:"This music puts me in a particular state. It's hard to describe." },
      { role:"lisn", text:"What you're describing is an accurate response to what this work does structurally. It operates at the level of timbre as form — not melody, not rhythm, but sonic texture itself as a vector of meaning. It's rare, and it demands a different kind of listening." },
      { role:"user", text:"How would I know if I'd appreciate other works in this register?" },
    ],
    structural: [
      { role:"user", text:"I understand it's technically rigorous, but I don't know if I hear anything beyond the rigour." },
      { role:"lisn", text:"That's a real tension in this kind of work — form can seem cold from the outside. What LISN can show you is the precise moment where constraint stops being demonstration and becomes expressive necessity. It usually happens in just a few bars." },
      { role:"user", text:"Can you show me exactly where?" },
    ],
    narrative: [
      { role:"user", text:"The lyrics move me but I can't tell if it's the music or just the text." },
      { role:"lisn", text:"That's precisely the question LISN asks of this work. Here, text and sonic structure are inseparable — the flow doesn't illustrate meaning, it constructs it. Remove the words and the architecture collapses, not just the mood." },
      { role:"user", text:"How do you distinguish that from a song where the text alone carries it?" },
    ],
    hybrid: [
      { role:"user", text:"This work intrigues me but I can't quite grasp it." },
      { role:"lisn", text:"That's an appropriate response. This work resists precisely because it refuses to belong to a single grammar. This isn't formal indecision — it's a structural strategy that produces a form of tension sui generis." },
      { role:"user", text:"Is that what makes it inaccessible to some people?" },
    ],
  },
};

const UI = {
  fr:{
    badge: "Discuter avec LISN",
    close: "✕",
    preview: "Aperçu de conversation",
    locked: "La suite est réservée à LISN Pro.",
    unlockTitle: "Continuer cette conversation",
    unlockDesc: "Posez toutes vos questions à LISN sur cette œuvre. Obtenez des analyses sur mesure, des comparaisons, des recommandations personnalisées.",
    unlockBtn: "Accéder à LISN Pro →",
    orAnalyse: "Voir d'abord l'analyse structurelle →",
  },
  en:{
    badge: "Discuss with LISN",
    close: "✕",
    preview: "Conversation preview",
    locked: "The rest is reserved for LISN Pro.",
    unlockTitle: "Continue this conversation",
    unlockDesc: "Ask LISN anything about this work. Get tailored analyses, comparisons, personalised recommendations.",
    unlockBtn: "Get LISN Pro →",
    orAnalyse: "See the structural analysis first →",
  },
};

export default function DiscussModal({ work, dark, lang = "fr", onClose, onAnalyse }) {
  if (!work) return null;

  const M    = UI[lang] || UI.fr;
  const biome = work.biome || work.regime;
  const col   = BIOME_COLOR[biome] || "#e8dfc8";
  const convo = (MOCK_CONVO[lang] || MOCK_CONVO.fr)[biome] || (MOCK_CONVO[lang] || MOCK_CONVO.fr).hybrid;

  const bg    = dark ? "rgba(5,4,3,0.98)"       : "rgba(237,230,220,0.98)";
  const text  = dark ? "#f2ead8"                 : "#120e0a";
  const muted = dark ? "#9c8e7e"                 : "#5c5048";
  const bord  = dark ? "rgba(242,234,216,0.12)"  : "rgba(18,14,10,0.14)";
  const userBg = dark ? "rgba(242,234,216,0.06)" : "rgba(18,14,10,0.05)";
  const lisnBg = dark ? `${col}12`               : `${col}18`;

  return (
    <div style={{
      position:"fixed", inset:0, zIndex:200,
      display:"flex", alignItems:"center", justifyContent:"center",
      background: dark ? "rgba(0,0,0,0.78)" : "rgba(100,90,80,0.50)",
      backdropFilter:"blur(6px)",
      fontFamily:"'Libre Baskerville', Georgia, serif",
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>

      <div style={{
        width:"min(460px, calc(100vw - 24px))",
        maxHeight:"90vh", overflowY:"auto",
        background: bg, borderRadius:1,
        boxShadow: dark
          ? `0 0 60px rgba(0,0,0,0.8), 0 0 0 1px ${col}44`
          : `0 0 40px rgba(0,0,0,0.15), 0 0 0 1px ${col}66`,
      }}>
        {/* Bande biome */}
        <div style={{ height:3, background: col }} />

        {/* Header */}
        <div style={{ padding:"16px 18px 0",
          display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
          <div>
            <div style={{ fontSize:9, letterSpacing:"0.18em", textTransform:"uppercase",
              color: col, fontFamily:"'DM Mono',monospace", marginBottom:6 }}>
              {M.badge}
            </div>
            <h2 style={{ margin:0, fontSize:18, lineHeight:1.1,
              letterSpacing:"-0.02em", fontStyle:"italic", color: text }}>
              {work.title}
            </h2>
            <div style={{ marginTop:4, fontSize:12, color: muted }}>{work.artist}</div>
          </div>
          <button onClick={onClose} style={{
            background:"none", border:`1px solid ${bord}`, color: muted,
            fontSize:9, padding:"4px 8px", cursor:"pointer", borderRadius:1,
            fontFamily:"'DM Mono',monospace",
          }}>{M.close}</button>
        </div>

        {/* Label aperçu */}
        <div style={{ padding:"12px 18px 8px",
          fontSize:9, color: muted, fontFamily:"'DM Mono',monospace",
          letterSpacing:"0.14em", textTransform:"uppercase" }}>
          {M.preview}
        </div>

        {/* Conversation — 2 premiers messages visibles */}
        <div style={{ padding:"0 18px" }}>
          {convo.slice(0, 2).map((msg, i) => (
            <div key={i} style={{
              marginBottom:8, padding:"10px 12px", borderRadius:1,
              background: msg.role === "lisn" ? lisnBg : userBg,
              borderLeft: msg.role === "lisn" ? `2px solid ${col}` : `2px solid ${bord}`,
            }}>
              <div style={{ fontSize:8, letterSpacing:"0.14em", textTransform:"uppercase",
                color: msg.role === "lisn" ? col : muted,
                fontFamily:"'DM Mono',monospace", marginBottom:5 }}>
                {msg.role === "lisn" ? "LISN" : (lang === "fr" ? "Vous" : "You")}
              </div>
              <div style={{ fontSize:12, color: text, lineHeight:1.7, fontStyle: msg.role === "lisn" ? "italic" : "normal" }}>
                {msg.text}
              </div>
            </div>
          ))}
        </div>

        {/* 3ème message — flouté */}
        <div style={{ padding:"0 18px", position:"relative", overflow:"hidden" }}>
          <div style={{ filter:"blur(3px)", opacity:0.35, userSelect:"none", pointerEvents:"none" }}>
            <div style={{
              marginBottom:8, padding:"10px 12px", borderRadius:1,
              background: userBg, borderLeft:`2px solid ${bord}`,
            }}>
              <div style={{ fontSize:8, letterSpacing:"0.14em", textTransform:"uppercase",
                color: muted, fontFamily:"'DM Mono',monospace", marginBottom:5 }}>
                {lang === "fr" ? "Vous" : "You"}
              </div>
              <div style={{ fontSize:12, color: text, lineHeight:1.7 }}>
                {convo[2]?.text}
              </div>
            </div>
            {/* Réponse LISN imaginaire */}
            <div style={{
              padding:"10px 12px", borderRadius:1,
              background: lisnBg, borderLeft:`2px solid ${col}`,
            }}>
              <div style={{ fontSize:8, letterSpacing:"0.14em", textTransform:"uppercase",
                color: col, fontFamily:"'DM Mono',monospace", marginBottom:5 }}>LISN</div>
              <div style={{ fontSize:12, color: text, lineHeight:1.7, fontStyle:"italic" }}>
                {lang === "fr"
                  ? "Pour répondre précisément à cette question, il faudrait examiner..."
                  : "To answer that precisely, we'd need to examine..."}
              </div>
            </div>
          </div>
          {/* Gradient de fondu */}
          <div style={{
            position:"absolute", bottom:0, left:0, right:0, height:"80%",
            background: `linear-gradient(to bottom, transparent, ${bg} 75%)`,
            pointerEvents:"none",
          }} />
        </div>

        {/* CTA */}
        <div style={{ padding:"16px 18px 20px",
          display:"flex", flexDirection:"column", alignItems:"center", gap:10 }}>
          <div style={{ fontSize:11, color: muted, textAlign:"center",
            fontFamily:"'DM Mono',monospace", letterSpacing:"0.10em", opacity:0.8 }}>
            {M.locked}
          </div>
          <button style={{
            padding:"11px 24px", background: col, border:"none", borderRadius:1,
            color: dark ? "#080604" : "#ffffff",
            fontSize:11, letterSpacing:"0.16em", textTransform:"uppercase",
            cursor:"pointer", fontFamily:"'DM Mono',monospace", fontWeight:500,
            boxShadow:`0 0 24px ${col}55`, width:"100%",
          }}
            onMouseEnter={e => e.currentTarget.style.opacity="0.85"}
            onMouseLeave={e => e.currentTarget.style.opacity="1"}
          >
            {M.unlockBtn}
          </button>
          <button onClick={() => { onAnalyse?.(); }} style={{
            background:"none", border:"none", cursor:"pointer",
            fontSize:9, color: muted, opacity:0.7,
            fontFamily:"'DM Mono',monospace", letterSpacing:"0.10em",
            textTransform:"uppercase",
          }}>
            {M.orAnalyse}
          </button>
        </div>
      </div>
    </div>
  );
}
