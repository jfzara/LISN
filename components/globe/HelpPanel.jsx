"use client";

const COPY = {
  fr: {
    title:       "Comment lire la carte",
    subtitle:    "Guide LISN",
    close:       "FERMER",
    intro: [
      {
        head: "L'insaisissable dans la musique — LISN en trace la carte.",
        body: "Tu l'as déjà ressenti : deux morceaux qui n'ont rien à voir, mais qui font exactement la même chose en toi. Ce n'est pas une coïncidence. Il y a une logique là-dedans — une logique que les genres et les étiquettes ne voient pas. LISN la rend visible.",
      },
      {
        head: "Comment ?",
        body: "En mesurant ce qui se passe à l'intérieur de la musique — pas son image, pas son époque, pas sa popularité. Sa densité. Sa tension. Sa profondeur. Deux œuvres très différentes peuvent partager la même architecture intérieure. C'est ça que LISN cartographie.",
      },
    ],
    scoreTitle: "Le score — qu'est-ce que ça mesure ?",
    scoreBites: [
      {
        head: "Ce n'est pas une note de qualité.",
        body: "Le score LISN mesure la densité de ce qui se passe dans une œuvre — combien d'éléments s'organisent ensemble, avec quelle précision, quelle profondeur. C'est une coordonnée sur la carte, pas un jugement.",
      },
      {
        head: "Des repères concrets :",
        body: "Bach — 9.5. Steve Reich — 9.3. OK Computer — 8.7. Random Access Memories — 6.3. Despacito — 2.9. Un score bas n'est pas une insulte — c'est une information. Certaines musiques sont faites pour être simples et directes. LISN le dit clairement.",
      },
    ],
    structureTitle: "C'est quoi exactement la « structure » ?",
    structureBites: [
      {
        head: "La structure, c'est ce qui tient la musique ensemble.",
        body: "Pas les paroles. Pas l'image de l'artiste. Pas le genre. C'est : est-ce que les sons s'organisent avec une logique interne ? Est-ce qu'il se passe quelque chose d'inattendu ? Est-ce que ça tient à la deuxième, à la dixième écoute ?",
      },
      {
        head: "Exemple simple :",
        body: "Un hit radio a souvent une structure prévisible — tout le monde sait ce qui vient après. Steve Reich construit des architectures temporelles où chaque répétition déplace imperceptiblement le sens. Les deux sont de la musique. Ils ne sont pas au même endroit sur la carte.",
      },
      {
        head: "Structurel ne veut pas dire compliqué.",
        body: "Une mélodie simple répétée pendant vingt minutes peut être très dense si elle évolue avec précision. La complexité n'est pas le critère. Ce qui compte, c'est l'intention et la cohérence intérieure.",
      },
    ],
    worldviewTitle: "La musique avant les camps",
    worldviewBites: [
      {
        head: "La musique porte des identités. C'est bien. Mais derrière les identités, il y a des formes. Et les formes ne mentent pas.",
        body: null,
      },
      {
        head: null,
        body: "Il y a dans la musique quelque chose qui précède les mots, les drapeaux, les appartenances. Quelque chose qui vibre avant qu'on lui donne un nom — avant qu'on décide si elle nous ressemble, si elle vient de notre camp, si elle mérite notre attention.",
      },
      {
        head: null,
        body: "LISN cherche ça. Pas ce qu'une musique dit. Ce qu'elle fait. La façon dont elle construit la tension et la laisse ou non se résoudre. La densité de ce qui se passe quand on écoute vraiment.",
      },
      {
        head: null,
        body: "On n'écoute pas toujours vraiment. On écoute parfois à travers des filtres qu'on ne voit pas — la hype, la mode, l'image de l'artiste, son camp, ce que nos amis en pensent. LISN ne prétend pas effacer tout ça. Mais il propose un autre point de vue — plus honnête, moins social. Un moment où la musique est juste de la musique.",
      },
      {
        head: "Deux œuvres aux mondes opposés peuvent être voisines sur la carte. Ce n'est pas une provocation. C'est une information.",
        body: "Ce que tu en fais, c'est toi.",
      },
      {
        head: null,
        body: "Le worldview de chaque œuvre — la vision du monde implicite dans ses choix sonores — sera visible dans les analyses LISN complètes. Pas comme un jugement. Comme une coordonnée de plus.",
      },
    ],
    biomesTitle: "Les zones de la carte",
    biomesIntro: "Chaque œuvre appartient à une zone — pas un genre, une façon d'organiser l'énergie musicale.",
    biomes: [
      {
        key: "dense",
        name: "Dense",
        body: "Beaucoup se passe en même temps. La tension est soutenue, l'énergie concentrée. On y trouve le jazz complexe, le hip-hop dense, le metal structuré.",
      },
      {
        key: "atmospheric",
        name: "Atmosphérique",
        body: "Le son lui-même est la forme. Pas le rythme, pas la mélodie — la texture, la couleur, l'espace. Musique ambient, électronique contemplative, post-rock.",
      },
      {
        key: "structural",
        name: "Structurel",
        body: "Architecture précise, chaque élément à sa place. Musique classique, minimalisme, jazz modal. La forme est visible.",
      },
      {
        key: "narrative",
        name: "Narratif",
        body: "Les mots et le flux verbal structurent l'œuvre. Le sens, le placement, le rythme des mots. Rap, chanson, spoken word.",
      },
      {
        key: "hybrid",
        name: "Hybride",
        body: "Plusieurs logiques en même temps. Les œuvres qui inventent leur propre grammaire. Souvent les plus surprenantes.",
      },
    ],
    rolesTitle: "Les rôles — comment lire la taille des points",
    rolesIntro: "Sur la carte, chaque point a une taille. Plus un point est grand et lumineux, plus l'œuvre est dense structurellement. Les rôles indiquent la position de l'œuvre dans la hiérarchie de la carte.",
    roles: [
      { key:"capital", name:"Capitale", body:"Le sommet. Une œuvre fondatrice qui a redéfini ce que sa musique pouvait être. Bach, Coltrane, Radiohead à leur meilleur. Rare." },
      { key:"city",    name:"Ville",    body:"Une œuvre majeure, dense, qui tient à l'écoute répétée. Pas parfaite nécessairement, mais substantielle." },
      { key:"village", name:"Village",  body:"Une bonne œuvre, solide, qui a sa place sur la carte. Pas révolutionnaire, mais honnête." },
      { key:"bridge",  name:"Pont",     body:"Une œuvre de transition — elle relie deux zones de la carte. Souvent un artiste qui change de direction." },
      { key:"island",  name:"Île",      body:"Une œuvre isolée, singulière, sans voisins proches. Elle n'appartient nulle part — ce qui est souvent un signe intéressant." },
      { key:"hamlet",  name:"Hameau",   body:"Une œuvre mineure ou très niche. Petite sur la carte, mais présente — parce que LISN ne cartographie pas que les sommets." },
    ],
    actionsTitle: "À quoi servent les actions ?",
    actions: [
      {
        head: "Explorer autour",
        body: "Affiche les œuvres structurellement proches. Pas les mêmes genres — les mêmes formes intérieures. Tu peux découvrir un album de musique traditionnelle japonaise juste à côté de Radiohead. C'est normal. C'est LISN.",
      },
      {
        head: "Trajectoire",
        body: "Relie toutes les œuvres d'un artiste dans l'espace. Certains artistes traversent toute la carte en quelques albums. D'autres restent au même endroit. Les deux sont des choix.",
      },
      {
        head: "Voyage",
        body: "LISN te fait passer d'une œuvre à l'autre par proximité, toutes les quelques secondes. Comme une radio — mais guidée par la structure, pas par l'algorithme.",
      },
      {
        head: "Comparer",
        body: "Sélectionne deux œuvres. LISN mesure leur distance sur la carte et explique ce qui les rapproche ou les sépare.",
      },
      {
        head: "Hasard",
        body: "Atterrir sur une œuvre au hasard parmi ce qui est visible. Si tu as filtré par époque ou par zone, le hasard reste dans cette zone.",
      },
    ],
    footer: "LISN · L'insaisissable dans la musique — LISN en trace la carte.",
  },

  en: {
    title:    "How to read the map",
    subtitle: "LISN Guide",
    close:    "CLOSE",
    intro: [
      {
        head: "LISN. Mapping the ungraspable in music.",
        body: "You've felt it before — two completely different tracks doing exactly the same thing inside you. That's not a coincidence. There's a logic to it, one that genres and labels can't see. LISN makes it visible.",
      },
      {
        head: "How?",
        body: "By measuring what happens inside the music — not its image, not its era, not its popularity. Its density. Its tension. Its depth. Two very different works can share the same interior architecture. That's what LISN maps.",
      },
    ],
    scoreTitle: "The score — what does it measure?",
    scoreBites: [
      {
        head: "It's not a quality rating.",
        body: "The LISN score measures the density of what's happening inside a work — how many elements organize together, with what precision, what depth. It's a coordinate on the map, not a judgment.",
      },
      {
        head: "Concrete reference points:",
        body: "Bach — 9.5. Steve Reich — 9.3. OK Computer — 8.7. Random Access Memories — 6.3. Despacito — 2.9. A low score isn't an insult — it's information. Some music is made to be simple and direct. LISN says so clearly.",
      },
    ],
    structureTitle: "What exactly is \"structure\"?",
    structureBites: [
      {
        head: "Structure is what holds music together.",
        body: "Not the lyrics. Not the artist's image. Not the genre. It's: do the sounds organize with an internal logic? Does something unexpected happen? Does it hold up on the second listen, the tenth?",
      },
      {
        head: "Simple example:",
        body: "A radio hit usually has a predictable structure — everyone knows what comes next. Steve Reich builds temporal architectures where each repetition imperceptibly shifts the meaning. Both are music. They're just not in the same place on the map.",
      },
      {
        head: "Structural doesn't mean complicated.",
        body: "A simple melody repeated for twenty minutes can be very dense if it evolves with precision. Complexity isn't the criterion. What matters is intention and interior coherence.",
      },
    ],
    worldviewTitle: "Music before the camps",
    worldviewBites: [
      {
        head: "Music carries identities. That's fine. But behind identities, there are forms. And forms don't lie.",
        body: null,
      },
      {
        head: null,
        body: "There is something in music that precedes words, flags, and allegiances. Something that vibrates before we give it a name — before we decide whether it looks like us, whether it comes from our side, whether it deserves our attention.",
      },
      {
        head: null,
        body: "LISN looks for that. Not what music says. What it does. The way it builds tension and chooses — or refuses — to resolve it. The density of what happens when you truly listen.",
      },
      {
        head: null,
        body: "We don't always truly listen. Sometimes we listen through filters we can't see — hype, fashion, the artist's image, their politics, what our friends think. LISN doesn't pretend to erase all that. But it offers another perspective — more honest, less social. A moment where music is just music.",
      },
      {
        head: "Two works from opposite worlds can be neighbours on the map. That's not a provocation. It's information.",
        body: "What you do with it — that's up to you.",
      },
      {
        head: null,
        body: "The worldview of each work — the vision of reality implicit in its sonic choices — will be visible in full LISN analyses. Not as a judgment. As one more coordinate.",
      },
    ],
    biomesTitle: "The zones of the map",
    biomesIntro: "Every work belongs to a zone — not a genre, a way of organizing musical energy.",
    biomes: [
      {
        key: "dense",
        name: "Dense",
        body: "A lot happening at once. Sustained tension, concentrated energy. Complex jazz, dense hip-hop, structured metal.",
      },
      {
        key: "atmospheric",
        name: "Atmospheric",
        body: "The sound itself is the form. Not rhythm, not melody — texture, color, space. Ambient, contemplative electronic, post-rock.",
      },
      {
        key: "structural",
        name: "Structural",
        body: "Precise architecture, every element in its place. Classical music, minimalism, modal jazz. The form is visible.",
      },
      {
        key: "narrative",
        name: "Narrative",
        body: "Words and verbal flow structure the work. Meaning, placement, the rhythm of language. Rap, chanson, spoken word.",
      },
      {
        key: "hybrid",
        name: "Hybrid",
        body: "Multiple logics at once. Works that invent their own grammar. Often the most surprising ones.",
      },
    ],
    rolesTitle: "Roles — how to read the size of the points",
    rolesIntro: "On the map, every point has a size. The bigger and brighter the point, the denser the work structurally. Roles indicate where the work sits in the map's hierarchy.",
    roles: [
      { key:"capital", name:"Capital",  body:"The peak. A landmark work that redefined what its music could be. Bach, Coltrane, Radiohead at their best. Rare." },
      { key:"city",    name:"City",     body:"A major work, dense, that holds up over repeated listening. Not necessarily perfect, but substantial." },
      { key:"village", name:"Village",  body:"A solid work, well-made, that earns its place on the map. Not revolutionary, but honest." },
      { key:"bridge",  name:"Bridge",   body:"A transitional work — it connects two zones of the map. Often an artist changing direction." },
      { key:"island",  name:"Island",   body:"An isolated, singular work with no close neighbours. It belongs nowhere — which is often a good sign." },
      { key:"hamlet",  name:"Hamlet",   body:"A minor or niche work. Small on the map, but present — because LISN doesn't only map the peaks." },
    ],
    actionsTitle: "What do the actions do?",
    actions: [
      {
        head: "Explore around",
        body: "Shows structurally close works. Not the same genres — the same interior forms. You might find traditional Japanese music right next to Radiohead. That's not a bug. That's LISN.",
      },
      {
        head: "Trajectory",
        body: "Connects all of an artist's works in the space. Some artists cross the entire map in a few albums. Others stay in one place. Both are choices.",
      },
      {
        head: "Voyage",
        body: "LISN moves you from one work to the next by proximity, every few seconds. Like a radio — but guided by structure, not by algorithm.",
      },
      {
        head: "Compare",
        body: "Select two works. LISN measures their distance on the map and explains what brings them together or sets them apart.",
      },
      {
        head: "Random",
        body: "Land on a random work from what's currently visible. If you've filtered by era or zone, the random stays within that zone.",
      },
    ],
    footer: "LISN · Mapping the ungraspable in music.",
  },
};

const BIOME_COLOR = {
  dense:"#FF6B2F", atmospheric:"#4ABFFF", structural:"#E8C97A",
  narrative:"#FF9A4D", hybrid:"#C07AE8",
};

export default function HelpPanel({ dark, onClose, lang = "fr" }) {
  const C  = COPY[lang] || COPY.fr;
  const bg    = dark ? "rgba(5,4,3,0.98)"      : "rgba(237,230,220,0.98)";
  const text  = dark ? "#f2ead8"               : "#120e0a";
  const muted = dark ? "#9c8e7e"               : "#5c5048";
  const bord  = dark ? "rgba(242,234,216,0.12)": "rgba(18,14,10,0.14)";
  const sep   = dark ? "rgba(242,234,216,0.07)": "rgba(18,14,10,0.07)";

  function Section({ title, children }) {
    return (
      <div style={{ marginTop:28 }}>
        {title && (
          <div style={{
            fontSize:10, letterSpacing:"0.14em", textTransform:"uppercase",
            color:muted, fontFamily:"'DM Mono',monospace",
            paddingBottom:10, borderBottom:`1px solid ${sep}`, marginBottom:14,
          }}>
            {title}
          </div>
        )}
        {children}
      </div>
    );
  }

  function Bite({ head, body, color }) {
    return (
      <div style={{ marginBottom:14 }}>
        {head && (
          <div style={{
            fontSize:13, fontWeight:500, color: color || text,
            marginBottom:5, lineHeight:1.4, letterSpacing:"-0.01em",
          }}>
            {head}
          </div>
        )}
        <div style={{ fontSize:12, lineHeight:1.8, color:muted }}>
          {body}
        </div>
      </div>
    );
  }

  return (
    <div style={{
      position:"fixed", inset:0, zIndex:100,
      background:bg, overflowY:"auto",
      fontFamily:"'Libre Baskerville', Georgia, serif",
      color:text,
    }}>

      {/* Header sticky */}
      <div style={{
        position:"sticky", top:0, zIndex:10,
        padding:"16px 20px",
        borderBottom:`1px solid ${bord}`,
        background:bg,
        display:"flex", justifyContent:"space-between", alignItems:"center",
      }}>
        <div>
          <div style={{ fontSize:17, fontStyle:"italic", letterSpacing:"-0.02em" }}>
            {C.title}
          </div>
          <div style={{ fontSize:9, color:muted, fontFamily:"'DM Mono',monospace",
            letterSpacing:"0.16em", textTransform:"uppercase", marginTop:3 }}>
            {C.subtitle}
          </div>
        </div>
        <button onClick={onClose} style={{
          background:"none", border:`1px solid ${bord}`, color:muted,
          fontSize:9, padding:"5px 10px", cursor:"pointer", borderRadius:1,
          fontFamily:"'DM Mono',monospace", letterSpacing:"0.14em",
        }}>
          {C.close}
        </button>
      </div>

      {/* Contenu */}
      <div style={{ padding:"0 20px 60px", maxWidth:520, margin:"0 auto" }}>

        {/* Intro */}
        <div style={{ marginTop:24 }}>
          {C.intro.map((b, i) => <Bite key={i} head={b.head} body={b.body} />)}
        </div>

        {/* Score */}
        <Section title={C.scoreTitle}>
          {C.scoreBites.map((b, i) => <Bite key={i} head={b.head} body={b.body} />)}
        </Section>

        {/* Structure */}
        <Section title={C.structureTitle}>
          {C.structureBites.map((b, i) => <Bite key={i} head={b.head} body={b.body} />)}
        </Section>

        {/* Worldview */}
        <Section title={C.worldviewTitle}>
          {C.worldviewBites.map((b, i) => <Bite key={i} head={b.head} body={b.body} />)}
        </Section>

        {/* Biomes */}
        <Section title={C.biomesTitle}>
          <div style={{ fontSize:12, lineHeight:1.8, color:muted, marginBottom:14 }}>
            {C.biomesIntro}
          </div>
          {C.biomes.map(b => (
            <div key={b.key} style={{
              marginBottom:12,
              borderLeft:`2px solid ${BIOME_COLOR[b.key]}`,
              paddingLeft:12,
            }}>
              <div style={{ fontSize:11, fontWeight:500, color:BIOME_COLOR[b.key],
                marginBottom:4, fontFamily:"'DM Mono',monospace",
                letterSpacing:"0.10em", textTransform:"uppercase" }}>
                {b.name}
              </div>
              <div style={{ fontSize:12, lineHeight:1.75, color:muted }}>
                {b.body}
              </div>
            </div>
          ))}
        </Section>

        {/* Rôles */}
        <Section title={C.rolesTitle}>
          <div style={{ fontSize:12, lineHeight:1.8, color:muted, marginBottom:14 }}>
            {C.rolesIntro}
          </div>
          {C.roles.map(r => (
            <div key={r.key} style={{
              marginBottom:12,
              display:"flex", gap:12, alignItems:"flex-start",
            }}>
              <div style={{
                width:8, height:8, borderRadius:"50%",
                background: text, opacity: r.key === "capital" ? 1
                  : r.key === "city" ? 0.75
                  : r.key === "village" ? 0.55
                  : r.key === "bridge" ? 0.45
                  : r.key === "island" ? 0.40
                  : 0.28,
                flexShrink:0, marginTop:5,
              }} />
              <div>
                <div style={{ fontSize:11, fontWeight:500, color:text,
                  marginBottom:3, fontFamily:"'DM Mono',monospace",
                  letterSpacing:"0.08em", textTransform:"uppercase" }}>
                  {r.name}
                </div>
                <div style={{ fontSize:12, lineHeight:1.75, color:muted }}>
                  {r.body}
                </div>
              </div>
            </div>
          ))}
        </Section>

        {/* Actions */}
        <Section title={C.actionsTitle}>
          {C.actions.map((a, i) => <Bite key={i} head={a.head} body={a.body} />)}
        </Section>

        {/* Footer */}
        <div style={{
          marginTop:40, paddingTop:20,
          borderTop:`1px solid ${sep}`,
          fontSize:10, color:muted,
          fontFamily:"'DM Mono',monospace",
          letterSpacing:"0.10em", lineHeight:1.8,
        }}>
          {C.footer}
        </div>
      </div>
    </div>
  );
}
