"use client";

/**
 * HelpPanel — mode d'emploi LISN en "small text bites"
 * Explique l'OSR de façon intuitive, sans jargon philosophique
 * Accessible via bouton ? dans la nav
 */

export default function HelpPanel({ dark, onClose }) {
  const bg    = dark ? "rgba(5,4,3,0.97)"       : "rgba(237,230,220,0.97)";
  const text  = dark ? "#f2ead8"                 : "#120e0a";
  const muted = dark ? "#9c8e7e"                 : "#5c5048";
  const bord  = dark ? "rgba(242,234,216,0.12)"  : "rgba(18,14,10,0.14)";
  const sep   = dark ? "rgba(242,234,216,0.08)"  : "rgba(18,14,10,0.08)";
  const accent = dark ? "#f2ead8"                : "#120e0a";

  const BIOME_COLOR = {
    dense:"#FF6B2F", atmospheric:"#4ABFFF", structural:"#E8C97A",
    narrative:"#FF9A4D", hybrid:"#C07AE8",
  };

  const sections = [
    {
      title: "Pourquoi Brel et Arca sont proches",
      color: BIOME_COLOR.hybrid,
      items: [
        "LISN ne classe pas par genre. Un album techno et une chanson française peuvent être voisins.",
        "Ce qui compte : la densité de ce qui se passe structurellement dans la musique. La tension. La résolution. La profondeur.",
        "Brel et Arca partagent une intensité structurale élevée et une résolution instable. Genre différent, architecture proche.",
        "C'est ça l'OSR — une carte des formes, pas des étiquettes.",
      ],
    },
    {
      title: "Ce que signifie le score",
      color: BIOME_COLOR.structural,
      items: [
        "Le score LISN (0–10) mesure la densité structurale d'une œuvre — pas sa popularité, pas son genre, pas son ancienneté.",
        "Bach : 9.5+. Coltrane A Love Supreme : 9.5. OK Computer : 8.7. RAM (Daft Punk) : 6.3. Despacito : 2.9.",
        "Un score bas n'est pas un jugement moral. C'est une coordonnée. Les plaines ont leur beauté.",
        "Les grandes œuvres sont les montagnes. Les hits radio sont les plaines. Les deux ont leur place sur la carte.",
      ],
    },
    {
      title: "Les biomes",
      color: BIOME_COLOR.dense,
      items: [
        "Dense — haute énergie, tension soutenue, structures serrées. Jazz complexe, metal, hip-hop dense.",
        "Atmosphérique — le timbre comme forme. Ambient, drone, post-rock textural. Le son prime sur le rythme.",
        "Structural — architecture formelle, contrepoint, forme précise. Bach, musique minimaliste, jazz modal.",
        "Narratif — le texte et le flow structurent l'œuvre. Rap, chanson, folk.",
        "Hybride — logiques multiples en coexistence. Les œuvres qui ne rentrent nulle part — souvent les plus intéressantes.",
      ],
    },
    {
      title: "Explorer autour",
      color: BIOME_COLOR.narrative,
      items: [
        "Montre les œuvres structuralement proches de celle que tu regardes.",
        "Pas les mêmes genres — les mêmes formes. Tu peux tomber sur un album de koto japonais en cherchant autour de Radiohead.",
        "C'est la fonctionnalité centrale de LISN : découvrir par structure, pas par étiquette.",
      ],
    },
    {
      title: "Trajectoire d'un artiste",
      color: BIOME_COLOR.atmospheric,
      items: [
        "Relie toutes les œuvres d'un artiste dans l'espace structural — une ligne dans la carte.",
        "Miles Davis : trajectoire immense, du bebop au fusion. Daft Punk : exploration puis stabilisation.",
        "Certains artistes évoluent. D'autres restent au même endroit. Les deux sont des choix.",
      ],
    },
    {
      title: "Voyage",
      color: BIOME_COLOR.hybrid,
      items: [
        "LISN te fait passer d'une œuvre à l'autre par proximité structurale, toutes les 4 secondes.",
        "Comme une radio — mais guidée par la structure, pas par l'algorithme de consommation.",
        "Lance-le et laisse-toi porter. Tu peux finir très loin de là où tu as commencé.",
      ],
    },
    {
      title: "Ce que LISN n'est pas",
      color: muted,
      items: [
        "Pas Spotify. LISN ne recommande pas ce que tu vas aimer — il te montre où se trouve ce que tu écoutes.",
        "Pas RateYourMusic. Le score n'est pas un avis subjectif — c'est une coordonnée structurale.",
        "Pas un musée. Les artistes actuels sont là, avec les anciens. Kendrick côtoie Coltrane.",
        "Une carte. Pas une liste. Pas un classement. Une géographie.",
      ],
    },
  ];

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 100,
      background: bg,
      overflowY: "auto",
      fontFamily: "'Libre Baskerville', Georgia, serif",
      color: text,
    }}>

      {/* Header */}
      <div style={{
        position: "sticky", top: 0,
        padding: "16px 20px",
        borderBottom: `1px solid ${bord}`,
        background: bg,
        display: "flex", justifyContent: "space-between", alignItems: "center",
        backdropFilter: "blur(12px)",
        zIndex: 10,
      }}>
        <div>
          <div style={{ fontSize: 18, fontStyle: "italic", letterSpacing: "-0.02em" }}>
            Comment lire la carte
          </div>
          <div style={{ fontSize: 9, color: muted, fontFamily: "'DM Mono',monospace",
            letterSpacing: "0.16em", textTransform: "uppercase", marginTop: 3 }}>
            Guide LISN · OSR
          </div>
        </div>
        <button onClick={onClose} style={{
          background: "none", border: `1px solid ${bord}`, color: muted,
          fontSize: 9, padding: "5px 10px", cursor: "pointer", borderRadius: 1,
          fontFamily: "'DM Mono',monospace", letterSpacing: "0.14em",
        }}>
          FERMER
        </button>
      </div>

      {/* Intro */}
      <div style={{ padding: "20px 20px 0" }}>
        <p style={{ fontSize: 13, lineHeight: 1.75, color: muted, margin: 0,
          fontStyle: "italic", maxWidth: 480 }}>
          LISN est une carte des formes musicales, pas des genres.
          Chaque point lumineux est une œuvre. Sa position dépend de
          sa densité structurale — pas de son époque, ni de sa popularité.
        </p>
      </div>

      {/* Sections */}
      <div style={{ padding: "16px 20px 40px" }}>
        {sections.map((section, si) => (
          <div key={si} style={{
            marginBottom: 24,
            borderLeft: `2px solid ${section.color || bord}`,
            paddingLeft: 14,
          }}>
            <div style={{
              fontSize: 11, fontWeight: 500, letterSpacing: "0.04em",
              color: section.color || text, marginBottom: 10,
              fontFamily: "'DM Mono',monospace", textTransform: "uppercase",
              letterSpacing: "0.12em",
            }}>
              {section.title}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {section.items.map((item, ii) => (
                <div key={ii} style={{
                  fontSize: 12, lineHeight: 1.65, color: text,
                  paddingLeft: 0,
                }}>
                  <span style={{ color: section.color || muted, marginRight: 6,
                    fontSize: 10 }}>·</span>
                  {item}
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Footer */}
        <div style={{
          marginTop: 8, paddingTop: 16,
          borderTop: `1px solid ${sep}`,
          fontSize: 10, color: muted,
          fontFamily: "'DM Mono',monospace", letterSpacing: "0.10em",
          lineHeight: 1.7,
        }}>
          LISN · OSR (Ontologie Structurale du Réel)<br />
          Not more music. Better music.
        </div>
      </div>
    </div>
  );
}
