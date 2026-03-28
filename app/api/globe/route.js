import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";

function latLngToXYZ(lat, lng, radius = 5) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);

  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);

  return { x, y, z };
}

function randomOffset(range = 8) {
  return (Math.random() - 0.5) * range;
}

// Continents musicaux mock
const CONTINENTS = {
  rock: { lat: 20, lng: 0, color: "#ff4d4d" },
  jazz: { lat: 30, lng: -60, color: "#4da3ff" },
  classical: { lat: 60, lng: 40, color: "#b366ff" },
  electronic: { lat: -20, lng: 100, color: "#00d2d3" },
  hiphop: { lat: 10, lng: 140, color: "#ff9f43" },
  pop: { lat: 0, lng: 40, color: "#ff6b81" },
  experimental: { lat: -40, lng: -120, color: "#2ed573" },
  world: { lat: 0, lng: -30, color: "#feca57" },
};

// Attribution continent mock simple
function assignContinent(artist, title) {
  const name = (artist + " " + title).toLowerCase();

  if (name.includes("miles") || name.includes("coltrane")) return "jazz";
  if (name.includes("mozart") || name.includes("beethoven")) return "classical";
  if (name.includes("radiohead") || name.includes("nirvana")) return "rock";
  if (name.includes("daft") || name.includes("aphex")) return "electronic";
  if (name.includes("kendrick") || name.includes("jay-z")) return "hiphop";
  if (name.includes("madonna") || name.includes("taylor")) return "pop";

  return "rock"; // fallback
}

function sizeFromEntityType(type) {
  if (type === "artist") return 1.8;
  if (type === "album") return 1.3;
  return 1.0;
}

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), "lisn_seed.csv");
    const fileContent = fs.readFileSync(filePath, "utf8");

    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
    });

    // Déduplication (artist + title)
    const map = new Map();

    for (const r of records) {
      const key = `${r.artist}-${r.title}`;
      if (!map.has(key)) {
        map.set(key, {
          artist: r.artist,
          title: r.title,
          entityType: r.entityType,
        });
      }
    }

    const works = [];

    for (const [key, work] of map.entries()) {
      const continentName = assignContinent(work.artist, work.title);
      const continent = CONTINENTS[continentName];

      const lat = continent.lat + randomOffset();
      const lng = continent.lng + randomOffset();

      const { x, y, z } = latLngToXYZ(lat, lng, 5);

      works.push({
        id: key.toLowerCase().replace(/\s+/g, "_"),
        title: work.title,
        artist: work.artist,
        entityType: work.entityType,
        continent: continentName,
        color: continent.color,
        x,
        y,
        z,
        size: sizeFromEntityType(work.entityType),
      });
    }

    return Response.json(works);
  } catch (error) {
    console.error("Globe API error:", error);
    return Response.json({ error: "Failed to load globe data" }, { status: 500 });
  }
}