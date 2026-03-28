// lib/lisn/buildGlobeModel.js
// Pipeline géographique LISN — transforme les œuvres brutes en monde navigable.
//
// Retourne : { nodes, links, clusters, territories }
// Tout est calculé à partir des scores et positions — rien n'est dessiné à la main.

// ── Constantes ───────────────────────────────────────────────────
const R_NODE = 5.08; // rayon des nœuds sur la sphère

// Centres de biome (phi, theta) — doivent correspondre au worksSeed
const BIOME_CENTERS = {
  dense:       { phi: 0.65,  theta: 0.88 },
  atmospheric: { phi: 3.70,  theta: 1.82 },
  structural:  { phi: 2.00,  theta: 1.42 },
  narrative:   { phi: 5.00,  theta: 1.22 },
  hybrid:      { phi: 2.90,  theta: 2.25 },
};

const BIOME_COLOR = {
  dense:       "#FF6B2F",
  atmospheric: "#4ABFFF",
  structural:  "#E8C97A",
  narrative:   "#FF9A4D",
  hybrid:      "#C07AE8",
};

// ── Distance LISN locale ──────────────────────────────────────────
// Biomes différents = distance maximale (pas de lien inter-biome automatique).
// Dans le même biome : distance angulaire + écart de score.
function localDist(a, b) {
  if (a.biome !== b.biome) return 1.0;
  const dphi   = Math.min(
    Math.abs(a.phi - b.phi),
    2 * Math.PI - Math.abs(a.phi - b.phi)
  );
  const dtheta = Math.abs(a.theta - b.theta);
  const ang    = Math.sqrt(dphi * dphi + dtheta * dtheta);
  const score  = Math.abs((a.score || 0) - (b.score || 0)) / 5.0;
  return 0.65 * ang + 0.35 * score;
}

// Distance 3D cartésienne pour les liens cross-biome importants
function cartDist(a, b) {
  const dx = (a.x || 0) - (b.x || 0);
  const dy = (a.y || 0) - (b.y || 0);
  const dz = (a.z || 0) - (b.z || 0);
  return Math.sqrt(dx * dx + dy * dy + dz * dz) / 10; // normalisé [0,1]
}

// ── Étape 1 — Repositionner les nœuds à r=R_NODE ─────────────────
function repositionNodes(works) {
  return works.map(w => {
    if (!w.phi || !w.theta) return { ...w };
    const sin_t = Math.sin(w.theta);
    const cos_t = Math.cos(w.theta);
    return {
      ...w,
      x: parseFloat((R_NODE * sin_t * Math.cos(w.phi)).toFixed(4)),
      y: parseFloat((R_NODE * cos_t).toFixed(4)),
      z: parseFloat((R_NODE * sin_t * Math.sin(w.phi)).toFixed(4)),
    };
  });
}

// ── Étape 2 — Construire les liens ───────────────────────────────
// Lien fort  : même biome, distance < 0.14
// Lien faible: même biome, distance < 0.22
// Lien pont  : biomes différents, œuvres très importantes (score > 8.8) proches en 3D
const LINK_STRONG = 0.14;
const LINK_WEAK   = 0.22;
const LINK_BRIDGE_CART = 0.22; // distance 3D normalisée pour ponts inter-biomes

function buildLinks(works) {
  const links = [];
  const n = works.length;

  // Intra-biome links
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const a = works[i], b = works[j];
      if (a.biome !== b.biome) continue;
      const d = localDist(a, b);
      if (d < LINK_WEAK) {
        links.push({
          source:   a.id,
          target:   b.id,
          strength: parseFloat((1 - d / LINK_WEAK).toFixed(3)),
          strong:   d < LINK_STRONG,
          bridge:   false,
        });
      }
    }
  }

  // Bridge links — entre grandes œuvres de biomes différents proches en 3D
  const majors = works.filter(w => (w.score || 0) >= 8.8);
  for (let i = 0; i < majors.length; i++) {
    for (let j = i + 1; j < majors.length; j++) {
      const a = majors[i], b = majors[j];
      if (a.biome === b.biome) continue;
      const d = cartDist(a, b);
      if (d < LINK_BRIDGE_CART) {
        // Vérifier qu'il n'y a pas déjà un lien
        const exists = links.some(
          l => (l.source === a.id && l.target === b.id) ||
               (l.source === b.id && l.target === a.id)
        );
        if (!exists) {
          links.push({
            source:   a.id,
            target:   b.id,
            strength: parseFloat((1 - d / LINK_BRIDGE_CART).toFixed(3)),
            strong:   false,
            bridge:   true,
          });
        }
      }
    }
  }

  return links;
}

// ── Étape 3 — Clustering DBSCAN local ────────────────────────────
const EPS     = 0.15; // seuil distance locale
const MIN_PTS = 2;    // voisins minimum pour former un cluster

function buildClusters(works) {
  const n       = works.length;
  const labels  = new Array(n).fill(-1);
  const visited = new Array(n).fill(false);

  // Pré-calculer voisins (O(n²) — acceptable pour 671 œuvres côté lib)
  const neighbors = works.map((w, i) =>
    works.reduce((acc, w2, j) => {
      if (i !== j && localDist(w, w2) < EPS) acc.push(j);
      return acc;
    }, [])
  );

  let clusterId = 0;

  for (let i = 0; i < n; i++) {
    if (visited[i]) continue;
    visited[i] = true;
    if (neighbors[i].length < MIN_PTS) continue; // bruit → île

    // BFS pour étendre le cluster
    const stack = [i];
    while (stack.length > 0) {
      const cur = stack.pop();
      if (labels[cur] >= 0) continue;
      labels[cur] = clusterId;
      for (const nb of neighbors[cur]) {
        if (labels[nb] < 0) stack.push(nb);
      }
    }
    clusterId++;
  }

  // Construire les objets cluster
  const clusterMap = {};
  for (let i = 0; i < n; i++) {
    const cid = labels[i];
    const w   = works[i];
    if (!clusterMap[cid]) clusterMap[cid] = { id: `cluster_${cid}`, works: [], noise: cid === -1 };
    clusterMap[cid].works.push(w);
  }

  // Calculer propriétés de chaque cluster
  const clusters = Object.values(clusterMap)
    .filter(c => !c.noise && c.works.length >= MIN_PTS)
    .map(c => {
      const ws = c.works;
      // Centre de masse 3D
      const cx = ws.reduce((s, w) => s + (w.x || 0), 0) / ws.length;
      const cy = ws.reduce((s, w) => s + (w.y || 0), 0) / ws.length;
      const cz = ws.reduce((s, w) => s + (w.z || 0), 0) / ws.length;

      // Rayon = distance max au centre
      const radius = ws.reduce((max, w) => {
        const d = Math.sqrt((w.x-cx)**2 + (w.y-cy)**2 + (w.z-cz)**2);
        return Math.max(max, d);
      }, 0);

      const avgScore     = ws.reduce((s, w) => s + (w.score || 0), 0) / ws.length;
      const avgExplor    = ws.reduce((s, w) => s + (w.explorationScore || avgScore * 8), 0) / ws.length;
      const avgStructural= ws.reduce((s, w) => s + (w.structuralScore || avgScore * 8), 0) / ws.length;

      // Biome dominant
      const biomeCount = {};
      ws.forEach(w => { biomeCount[w.biome] = (biomeCount[w.biome] || 0) + 1; });
      const biome = Object.entries(biomeCount).sort((a, b) => b[1] - a[1])[0][0];

      return {
        id:            c.id,
        workIds:       ws.map(w => w.id),
        center:        { x: parseFloat(cx.toFixed(3)), y: parseFloat(cy.toFixed(3)), z: parseFloat(cz.toFixed(3)) },
        radius:        parseFloat(radius.toFixed(3)),
        density:       ws.length,
        avgScore:      parseFloat(avgScore.toFixed(2)),
        avgExplor:     parseFloat(avgExplor.toFixed(2)),
        avgStructural: parseFloat(avgStructural.toFixed(2)),
        biome,
        color:         BIOME_COLOR[biome] || "#ffffff",
        hasCapital:    ws.some(w => (w.score || 0) >= 9.2),
      };
    })
    .sort((a, b) => b.density - a.density); // par taille décroissante

  // Index id → cluster
  const workClusterIndex = {};
  clusters.forEach(c => {
    c.workIds.forEach(wid => { workClusterIndex[wid] = c.id; });
  });

  return { clusters, workClusterIndex };
}

// ── Étape 4 — Assigner les rôles ─────────────────────────────────
function assignRoles(works, links, workClusterIndex) {
  // Index des liens par œuvre
  const linksByWork = {};
  works.forEach(w => { linksByWork[w.id] = []; });
  links.forEach(l => {
    linksByWork[l.source]?.push(l);
    linksByWork[l.target]?.push(l);
  });

  return works.map(w => {
    const wLinks     = linksByWork[w.id] || [];
    const score      = w.score || 0;
    const clusterId  = workClusterIndex[w.id];
    const isIsolated = !clusterId;

    // Clusters voisins (pour détecter ponts)
    const connectedClusters = new Set(
      wLinks
        .map(l => {
          const otherId = l.source === w.id ? l.target : l.source;
          return workClusterIndex[otherId];
        })
        .filter(Boolean)
    );
    const isBridge = connectedClusters.size >= 2;

    let role;
    if (score >= 9.2 && wLinks.length >= 3) {
      role = "capital";
    } else if (score >= 8.5) {
      role = "city";
    } else if (isIsolated || wLinks.length === 0) {
      role = "island";
    } else if (isBridge) {
      role = "bridge";
    } else if (score >= 7.5) {
      role = "village";
    } else {
      role = "hamlet";
    }

    // Rayon d'influence (pour TerritoryField)
    const influenceRadius = 0.15 + (score - 5) * 0.08;

    return {
      ...w,
      role,
      clusterId:       clusterId || null,
      linkCount:       wLinks.length,
      influenceRadius: parseFloat(influenceRadius.toFixed(3)),
      influenceStrength: parseFloat(((score / 10) * (1 + wLinks.length * 0.05)).toFixed(3)),
    };
  });
}

// ── Étape 5 — Construire les territoires ─────────────────────────
function buildTerritories(clusters, nodes) {
  const nodeIndex = {};
  nodes.forEach(n => { nodeIndex[n.id] = n; });

  return clusters.map(cluster => {
    const clusterNodes = cluster.workIds.map(id => nodeIndex[id]).filter(Boolean);

    const avgGlobal  = cluster.avgScore;
    const avgExplor  = cluster.avgExplor;
    const avgStruct  = cluster.avgStructural;
    const n          = cluster.density;

    // Rayon du territoire — dépend du nombre d'œuvres + explorationScore
    const radius =
      0.55 +
      n * 0.10 +
      (avgExplor / 100) * 1.2 +
      (cluster.hasCapital ? 0.60 : 0);

    // Force — luminosité / intensité du territoire
    const strength =
      (avgGlobal / 10) * 0.6 +
      (avgStruct / 100) * 0.4;

    return {
      id:       `territory_${cluster.id}`,
      clusterId: cluster.id,
      center:   cluster.center,
      radius:   parseFloat(radius.toFixed(3)),
      strength: parseFloat(strength.toFixed(3)),
      biome:    cluster.biome,
      color:    cluster.color,
      density:  n,
      hasCapital: cluster.hasCapital,
    };
  });
}

// ── Pipeline principal ────────────────────────────────────────────
export function buildGlobeModel(rawWorks) {
  if (!Array.isArray(rawWorks) || rawWorks.length === 0) {
    return { nodes: [], links: [], clusters: [], territories: [] };
  }

  // 1. Repositionner à r=R_NODE
  const works = repositionNodes(rawWorks);

  // 2. Liens
  const links = buildLinks(works);

  // 3. Clusters
  const { clusters, workClusterIndex } = buildClusters(works);

  // 4. Rôles
  const nodes = assignRoles(works, links, workClusterIndex);

  // 5. Territoires
  const territories = buildTerritories(clusters, nodes);

  return { nodes, links, clusters, territories };
}
