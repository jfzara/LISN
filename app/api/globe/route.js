import fs from "fs";
import path from "path";

const continentColors = {
  pop: "#ffb14a",
  harmonic: "#5cb7ff",
  rhythmic: "#65f0b5",
  textural: "#cc8cff",
  formal: "#f2eee8",
  experimental: "#ff6b8a",
  ambient: "#6f86ff",
  narrative: "#ff9a5c",
  groove: "#7ce8a6",
};

function parseCSV(text) {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) => h.trim());

  return lines.slice(1).map((line) => {
    const values = line.split(",").map((v) => v.trim());
    const obj = {};
    headers.forEach((h, i) => {
      obj[h] = values[i] ?? "";
    });
    return obj;
  });
}

function pickContinent(row, index) {
  const title = (row.title || "").toLowerCase();
  const artist = (row.artist || "").toLowerCase();

  if (title.includes("ambient") || artist.includes("eno")) return "ambient";
  if (artist.includes("bach") || artist.includes("beethoven") || artist.includes("ligeti")) return "formal";
  if (artist.includes("radiohead") || artist.includes("miles") || artist.includes("coltrane")) return "harmonic";
  if (artist.includes("aphex") || artist.includes("autechre") || artist.includes("kraftwerk")) return "rhythmic";
  if (artist.includes("kendrick") || artist.includes("dylan") || artist.includes("nas")) return "narrative";
  if (artist.includes("daft") || artist.includes("j dilla") || artist.includes("prince")) return "groove";
  if (artist.includes("mbv") || artist.includes("massive attack")) return "textural";

  const fallback = [
    "pop",
    "harmonic",
    "groove",
    "textural",
    "narrative",
    "rhythmic",
    "formal",
    "ambient",
    "experimental",
  ];

  return fallback[index % fallback.length];
}

function continentAngle(continent) {
  const map = {
    pop: 0,
    narrative: 45,
    groove: 90,
    rhythmic: 135,
    textural: 180,
    experimental: 225,
    formal: 270,
    harmonic: 315,
    ambient: 200,
  };
  return (map[continent] ?? 0) * (Math.PI / 180);
}

function generateMockPosition(continent, index) {
  const angleBase = continentAngle(continent);
  const angleJitter = ((index % 7) - 3) * 0.08;
  const angle = angleBase + angleJitter;

  const ring = 0.45 + ((index % 9) * 0.045);
  const x = Math.cos(angle) * ring;
  const z = Math.sin(angle) * ring;
  const y = -0.18 + ((index % 11) * 0.036);

  return {
    x: Math.max(-0.82, Math.min(0.82, x)),
    y: Math.max(-0.82, Math.min(0.82, y)),
    z: Math.max(-0.82, Math.min(0.82, z)),
  };
}

export async function GET() {
  const filePath = path.join(process.cwd(), "lisn_seed.csv");

  let rows = [];
  try {
    const csv = fs.readFileSync(filePath, "utf-8");
    rows = parseCSV(csv);
  } catch (e) {
    return Response.json(
      { error: `Impossible de lire lisn_seed.csv: ${e.message}` },
      { status: 500 }
    );
  }

  const works = rows.map((row, index) => {
    const continent = pickContinent(row, index);
    const pos = generateMockPosition(continent, index);

    return {
      id: `${row.artist || "unknown"}-${row.title || "untitled"}-${index}`
        .toLowerCase()
        .replace(/\s+/g, "-"),
      title: row.title || row.artist || "Untitled",
      artist: row.artist || "Unknown artist",
      entityType: row.entityType || "track",
      lang: row.lang || "fr",
      continent,
      color: continentColors[continent] || "#ffffff",
      size: 0.035 + ((index % 5) * 0.006),
      ...pos,
    };
  });

  return Response.json(works);
}