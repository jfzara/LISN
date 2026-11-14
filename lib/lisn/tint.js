// La couleur vient des œuvres : teinte dominante d'une pochette,
// ou, à défaut, une teinte stable dérivée du titre.

// ── Espace OKLab / OKLCH ────────────────────────────────────────────
// La clarté (L) et la saturation (C) y correspondent à ce que l'œil perçoit :
// deux teintes de même L paraissent aussi claires, ce que HSL ne garantit pas.
const toLin = v => { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
const toSrgb = v => 255 * (v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055);

function rgbToOklab(r, g, b) {
  const R = toLin(r), G = toLin(g), B = toLin(b);
  const l = Math.cbrt(0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B);
  const m = Math.cbrt(0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B);
  const s = Math.cbrt(0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B);
  return [
    0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s,
  ];
}

function oklabToLinear(L, a, b) {
  const l = Math.pow(L + 0.3963377774 * a + 0.2158037573 * b, 3);
  const m = Math.pow(L - 0.1055613458 * a - 0.0638541728 * b, 3);
  const s = Math.pow(L - 0.0894841775 * a - 1.2914855480 * b, 3);
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s,
  ];
}

const inGamut = ([r, g, b]) => [r, g, b].every(v => v >= -0.0005 && v <= 1.0005);

// OKLCH -> hex ; si la couleur sort du sRGB, on retire de la saturation, jamais de la clarté
export function oklchToHex(L, C, h) {
  const rad = h * Math.PI / 180;
  let c = C, lin = oklabToLinear(L, c * Math.cos(rad), c * Math.sin(rad));
  for (let i = 0; i < 24 && !inGamut(lin); i++) {
    c *= 0.93;
    lin = oklabToLinear(L, c * Math.cos(rad), c * Math.sin(rad));
  }
  const to = v => Math.round(Math.max(0, Math.min(255, toSrgb(Math.max(0, Math.min(1, v)))))).toString(16).padStart(2, "0");
  return `#${to(lin[0])}${to(lin[1])}${to(lin[2])}`;
}

export function hexToOklch(hex) {
  const n = parseInt(hex.slice(1), 16);
  const [L, a, b] = rgbToOklab(n >> 16, (n >> 8) & 255, n & 255);
  return [L, Math.hypot(a, b), (Math.atan2(b, a) * 180 / Math.PI + 360) % 360];
}

// Teinte de repli : même œuvre, même couleur, à chaque visite
export function hashTint(str = "") {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  const hue = (h >>> 0) % 360;
  return oklchToHex(0.54, 0.16, hue);
}

// Noir ou blanc, selon la clarté perçue (OKLab) du fond :
// le seuil suit l'œil, pas la luminance physique.
export function contrastOn(hex) {
  const [L] = hexToOklch(hex);
  return L > 0.64 ? "#000000" : "#ffffff";
}

// Couleur dominante d'une image de même origine (voir /api/cover/img).
// Les pixels sont regroupés par teinte, pondérés par leur vivacité ;
// une pochette en noir et blanc donne un gris, sans couleur inventée.
export function tintFromImage(src) {
  return new Promise(resolve => {
    const img = new Image();
    img.onerror = () => resolve(null);
    img.onload = () => {
      try {
        const N = 32, c = document.createElement("canvas"); c.width = c.height = N;
        const g = c.getContext("2d"); g.drawImage(img, 0, 0, N, N);
        const d = g.getImageData(0, 0, N, N).data;
        const bins = Array.from({ length: 12 }, () => ({ w: 0, L: 0, a: 0, b: 0 }));
        let total = 0, sumL = 0;
        for (let i = 0; i < d.length; i += 4) {
          const [L, a, b] = rgbToOklab(d[i], d[i + 1], d[i + 2]);
          sumL += L;
          const C = Math.hypot(a, b);
          const w = C * Math.max(0, 1 - Math.abs(L - 0.62) * 1.4);   // vif, ni trop sombre ni brûlé
          if (w <= 0.02) continue;
          const h = (Math.atan2(b, a) * 180 / Math.PI + 360) % 360;
          const bin = bins[Math.floor(h / 30) % 12];
          bin.w += w; bin.L += L * w; bin.a += a * w; bin.b += b * w; total += w;
        }
        const px = d.length / 4;
        if (total / px < 0.012) {                    // image quasi monochrome : un gris, pas de couleur inventée
          const L = Math.max(0.42, Math.min(0.72, sumL / px));
          return resolve(oklchToHex(L, 0, 0));
        }
        const top = bins.reduce((x, y) => (y.w > x.w ? y : x));
        const L = top.L / top.w, a = top.a / top.w, b = top.b / top.w;
        const h = (Math.atan2(b, a) * 180 / Math.PI + 360) % 360;
        resolve(oklchToHex(
          Math.max(0.40, Math.min(0.70, L)),
          Math.max(0.09, Math.min(0.20, Math.hypot(a, b))),
          h,
        ));
      } catch { resolve(null); }
    };
    img.src = src;
  });
}
