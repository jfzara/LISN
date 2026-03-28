// app/api/globe/route.js
// Retourne tous les points du globe LISN avec leurs coordonnées 3D.
// Source : cache Upstash (analyses pré-calculées) + seed statique de fallback.
// Les coordonnées sont calculées à la volée depuis les scores OSR.

export const maxDuration = 30;

import { computeGlobePosition, computeLisnDistance, detectContinent } from "../../../lib/lisn/globeCoordinates";
import { makeCacheKey, getFromCache } from "../../../lib/lisn/analysisCache";

// ── Seed statique — points visibles même sans cache Upstash ──────
// Minimum viable pour que le globe ne soit pas vide en dev
const SEED_POINTS = [
  { id:"bach-wtc",          title:"The Well-Tempered Clavier", artist:"Bach",             year:"1722", entityType:"album", structuralScore:95, explorationScore:74, globalScore:95, density:98,tension:82,resolution:75,singularity:88,depth:97,grain:91,resistance:95, dominantFunction:"formal counterpoint" },
  { id:"coltrane-als",      title:"A Love Supreme",            artist:"John Coltrane",    year:"1965", entityType:"album", structuralScore:93, explorationScore:88, globalScore:95, density:91,tension:88,resolution:42,singularity:92,depth:95,grain:93,resistance:89, dominantFunction:"modal jazz" },
  { id:"reich-m18",         title:"Music for 18 Musicians",    artist:"Steve Reich",      year:"1978", entityType:"album", structuralScore:91, explorationScore:93, globalScore:93, density:87,tension:71,resolution:68,singularity:89,depth:88,grain:84,resistance:91, dominantFunction:"minimalist formal" },
  { id:"davis-kob",         title:"Kind of Blue",              artist:"Miles Davis",      year:"1959", entityType:"album", structuralScore:89, explorationScore:91, globalScore:91, density:84,tension:76,resolution:58,singularity:87,depth:91,grain:89,resistance:86, dominantFunction:"modal harmonic" },
  { id:"davis-bb",          title:"Bitches Brew",              artist:"Miles Davis",      year:"1970", entityType:"album", structuralScore:87, explorationScore:92, globalScore:92, density:89,tension:84,resolution:38,singularity:91,depth:88,grain:86,resistance:83, dominantFunction:"experimental jazz" },
  { id:"kendrick-tpab",     title:"To Pimp a Butterfly",       artist:"Kendrick Lamar",   year:"2015", entityType:"album", structuralScore:86, explorationScore:84, globalScore:88, density:88,tension:82,resolution:54,singularity:84,depth:87,grain:91,resistance:81, dominantFunction:"narrative groove" },
  { id:"radiohead-okc",     title:"OK Computer",               artist:"Radiohead",        year:"1997", entityType:"album", structuralScore:84, explorationScore:87, globalScore:87, density:83,tension:86,resolution:41,singularity:86,depth:84,grain:82,resistance:79, dominantFunction:"experimental textural" },
  { id:"bjork-hom",         title:"Homogenic",                 artist:"Björk",            year:"1997", entityType:"album", structuralScore:83, explorationScore:86, globalScore:86, density:81,tension:84,resolution:44,singularity:88,depth:82,grain:91,resistance:77, dominantFunction:"experimental textural" },
  { id:"portishead-d",      title:"Dummy",                     artist:"Portishead",       year:"1994", entityType:"album", structuralScore:81, explorationScore:79, globalScore:83, density:78,tension:81,resolution:47,singularity:82,depth:79,grain:88,resistance:74, dominantFunction:"atmospheric groove" },
  { id:"frank-ocean-b",     title:"Blonde",                    artist:"Frank Ocean",      year:"2016", entityType:"album", structuralScore:79, explorationScore:77, globalScore:82, density:74,tension:78,resolution:43,singularity:79,depth:81,grain:86,resistance:72, dominantFunction:"narrative groove" },
  { id:"dangelo-v",         title:"Voodoo",                    artist:"D'Angelo",         year:"2000", entityType:"album", structuralScore:78, explorationScore:76, globalScore:79, density:82,tension:74,resolution:52,singularity:76,depth:77,grain:93,resistance:74, dominantFunction:"rhythmic groove" },
  { id:"bashung-fm",        title:"Fantaisie Militaire",       artist:"Alain Bashung",    year:"1998", entityType:"album", structuralScore:76, explorationScore:78, globalScore:78, density:74,tension:79,resolution:48,singularity:81,depth:78,grain:87,resistance:72, dominantFunction:"narrative textural" },
  { id:"burial-u",          title:"Untrue",                    artist:"Burial",           year:"2007", entityType:"album", structuralScore:74, explorationScore:82, globalScore:79, density:71,tension:83,resolution:31,singularity:87,depth:76,grain:92,resistance:69, dominantFunction:"atmospheric textural" },
  { id:"massive-m",         title:"Mezzanine",                 artist:"Massive Attack",   year:"1998", entityType:"album", structuralScore:74, explorationScore:72, globalScore:77, density:76,tension:82,resolution:38,singularity:74,depth:74,grain:84,resistance:71, dominantFunction:"atmospheric groove" },
  { id:"autechre-lp5",      title:"LP5",                       artist:"Autechre",         year:"1998", entityType:"album", structuralScore:79, explorationScore:88, globalScore:82, density:84,tension:79,resolution:28,singularity:91,depth:81,grain:72,resistance:83, dominantFunction:"experimental rhythmic" },
  { id:"slint-sp",          title:"Spiderland",                artist:"Slint",            year:"1991", entityType:"album", structuralScore:78, explorationScore:89, globalScore:83, density:72,tension:91,resolution:29,singularity:93,depth:82,grain:86,resistance:84, dominantFunction:"textural formal" },
  { id:"talk-talk-soe",     title:"Spirit of Eden",            artist:"Talk Talk",        year:"1988", entityType:"album", structuralScore:82, explorationScore:91, globalScore:87, density:79,tension:87,resolution:33,singularity:94,depth:86,grain:89,resistance:81, dominantFunction:"experimental textural" },
  { id:"godspeed-lysa",     title:"Lift Your Skinny Fists",    artist:"Godspeed You! Black Emperor", year:"2000", entityType:"album", structuralScore:81, explorationScore:84, globalScore:84, density:84,tension:88,resolution:32,singularity:86,depth:83,grain:79,resistance:82, dominantFunction:"formal textural" },
  { id:"daft-punk-disc",    title:"Discovery",                 artist:"Daft Punk",        year:"2001", entityType:"album", structuralScore:63, explorationScore:78, globalScore:68, density:67,tension:62,resolution:74,singularity:71,depth:58,grain:74,resistance:61, dominantFunction:"pop rhythmic" },
  { id:"uptown-funk",       title:"Uptown Funk",               artist:"Bruno Mars",       year:"2014", entityType:"track", structuralScore:34, explorationScore:18, globalScore:36, density:41,tension:38,resolution:82,singularity:22,depth:28,grain:54,resistance:31, dominantFunction:"groove pop" },
  { id:"despacito",         title:"Despacito",                 artist:"Luis Fonsi",       year:"2017", entityType:"track", structuralScore:27, explorationScore:14, globalScore:29, density:34,tension:29,resolution:88,singularity:18,depth:22,grain:47,resistance:24, dominantFunction:"pop melodic" },
  { id:"suicide-1977",      title:"Suicide",                   artist:"Suicide",          year:"1977", entityType:"album", structuralScore:51, explorationScore:94, globalScore:79, density:48,tension:76,resolution:21,singularity:97,depth:71,grain:84,resistance:62, dominantFunction:"experimental rhythmic" },
  { id:"arca-xen",          title:"Xen",                       artist:"Arca",             year:"2014", entityType:"album", structuralScore:72, explorationScore:87, globalScore:78, density:77,tension:83,resolution:24,singularity:91,depth:74,grain:89,resistance:68, dominantFunction:"experimental textural" },
  { id:"mfdoom-mm",         title:"Madvillainy",               artist:"Madlib x MF DOOM", year:"2004", entityType:"album", structuralScore:77, explorationScore:81, globalScore:81, density:79,tension:72,resolution:54,singularity:84,depth:78,grain:88,resistance:74, dominantFunction:"narrative rhythmic" },
  { id:"gainsbourg-mn",     title:"L'Homme à tête de chou",    artist:"Gainsbourg",       year:"1976", entityType:"album", structuralScore:74, explorationScore:76, globalScore:77, density:71,tension:74,resolution:52,singularity:82,depth:76,grain:91,resistance:68, dominantFunction:"narrative textural" },
];

// ── Enrichir un point avec ses coordonnées globe ─────────────────
function enrichWithGlobePosition(point) {
  const coords = computeGlobePosition({
    structuralScore:  point.structuralScore  || point.scores?.structural  || 50,
    explorationScore: point.explorationScore || point.scores?.exploration || 50,
    globalScore:      point.globalScore      || point.scores?.global      || 50,
    singularity:      point.singularity      || point.structuralScores?.singularity || 50,
    density:          point.density          || point.structuralScores?.density     || 50,
    tension:          point.tension          || point.structuralScores?.tension     || 50,
    grain:            point.grain            || point.structuralScores?.grain       || 50,
    dominantFunction: point.dominantFunction || point.regime?.dominantFunction      || "",
  });

  return {
    id:          point.id || `${point.artist}-${point.title}`.toLowerCase().replace(/\s+/g, "-"),
    entityType:  point.entityType || "album",
    title:       point.title  || "",
    artist:      point.artist || "",
    year:        point.year   || "",
    scores: {
      structural:  point.structuralScore  || 50,
      exploration: point.explorationScore || 50,
      global:      point.globalScore      || 50,
    },
    continent:   coords.continent,
    globe:       { x: coords.x, y: coords.y, z: coords.z, size: coords.size },
    color:       coords.color,
    // Pour la fiche — quickVerdict si disponible
    quickVerdict: point.quickVerdict || point.verdict?.text || "",
    playerUrl:   point.playerUrl || "",
  };
}

// ── Extraire les données OSR d'un résultat de cache LISN ─────────
function extractFromCacheResult(cacheResult, query, entityType) {
  if (!cacheResult || cacheResult.kind === "error") return null;
  const data = cacheResult;

  return {
    id: `${query}-${entityType}`.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
    entityType:      data.entity?.type || entityType,
    title:           data.entity?.title  || "",
    artist:          data.entity?.artist || query,
    year:            data.entity?.year   || "",
    structuralScore:  data.verdict?.structuralScore  || 50,
    explorationScore: data.verdict?.explorationScore || 50,
    globalScore:      data.verdict?.globalScore      || 50,
    singularity:      data.score?.singularity || 50,
    density:          data.score?.density     || 50,
    tension:          data.score?.tension     || 50,
    grain:            data.score?.grain       || 50,
    dominantFunction: data.regime?.dominantFunction || "",
    quickVerdict:     data.verdict?.text || "",
  };
}

// ── GET /api/globe ────────────────────────────────────────────────
// ?lang=fr|en  — optionnel, défaut fr
// ?nearby=id   — optionnel, retourne aussi les N plus proches voisins
// ?type=album|artist|track — optionnel, filtrer par type
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const lang     = searchParams.get("lang")   || "fr";
    const filterType = searchParams.get("type") || null;
    const nearbyId   = searchParams.get("nearby") || null;

    // ── 1. Points seed (toujours disponibles) ────────────────────
    let points = SEED_POINTS.map(enrichWithGlobePosition);

    // ── 2. Enrichir depuis le cache Upstash ──────────────────────
    // On essaie de récupérer les analyses pré-calculées connues
    // en cherchant les entrées de la seed dans le cache
    try {
      const cacheQueries = SEED_POINTS.slice(0, 50).map(p => ({
        key: makeCacheKey(
          p.artist.toLowerCase() + " " + p.title.toLowerCase(),
          p.entityType,
          lang
        ),
        point: p,
      }));

      const enriched = await Promise.allSettled(
        cacheQueries.map(async ({ key, point }) => {
          const cached = await getFromCache(key);
          if (!cached) return null;
          const extracted = extractFromCacheResult(cached, point.artist, point.entityType);
          if (!extracted) return null;
          // Fusionner avec les données seed (scores seed si cache incomplet)
          return enrichWithGlobePosition({
            ...point,
            ...extracted,
            id: point.id,
          });
        })
      );

      // Remplacer les points seed par les versions cachées si disponibles
      enriched.forEach((result, i) => {
        if (result.status === "fulfilled" && result.value) {
          points[i] = result.value;
        }
      });
    } catch (e) {
      console.warn("[globe] Cache enrichment failed:", e.message);
      // Continuer avec les points seed
    }

    // ── 3. Filtrer par type si demandé ───────────────────────────
    if (filterType) {
      points = points.filter(p => p.entityType === filterType);
    }

    // ── 4. Voisins proches si nearbyId ───────────────────────────
    let nearby = null;
    if (nearbyId) {
      const target = points.find(p => p.id === nearbyId);
      if (target) {
        const targetScores = {
          structuralScore:  target.scores.structural,
          explorationScore: target.scores.exploration,
          globalScore:      target.scores.global,
          dominantFunction: target.continent,
          density: 50, tension: 50, resolution: 50,
          singularity: 50, depth: 50, grain: 50, resistance: 50,
        };
        nearby = points
          .filter(p => p.id !== nearbyId)
          .map(p => ({
            ...p,
            _distance: computeLisnDistance(targetScores, {
              structuralScore:  p.scores.structural,
              explorationScore: p.scores.exploration,
              globalScore:      p.scores.global,
              dominantFunction: p.continent,
              density: 50, tension: 50, resolution: 50,
              singularity: 50, depth: 50, grain: 50, resistance: 50,
            }),
          }))
          .sort((a, b) => a._distance - b._distance)
          .slice(0, 8)
          .map(({ _distance, ...p }) => ({ ...p, distance: _distance }));
      }
    }

    return Response.json({
      points,
      total: points.length,
      nearby: nearby || undefined,
      meta: {
        version: "v8",
        lang,
        continents: ["formal","harmonic","textural","experimental","rhythmic","groove","narrative","pop","ambient"],
      }
    }, {
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60" }
    });

  } catch (err) {
    console.error("[globe] Error:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
