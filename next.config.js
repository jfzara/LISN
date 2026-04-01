// next.config.js — headers de sécurité HTTP

/** @type {import('next').NextConfig} */
const nextConfig = {
  // ── Headers de sécurité HTTP ────────────────────────────────────
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Empêche le clickjacking
          { key: "X-Frame-Options",            value: "DENY" },
          // Empêche le MIME sniffing
          { key: "X-Content-Type-Options",      value: "nosniff" },
          // Force HTTPS pour les prochaines visites (6 mois)
          { key: "Strict-Transport-Security",   value: "max-age=15552000; includeSubDomains" },
          // Limite les infos dans le Referrer
          { key: "Referrer-Policy",             value: "strict-origin-when-cross-origin" },
          // Désactive les fonctionnalités navigateur inutiles
          { key: "Permissions-Policy",          value: "camera=(), microphone=(), geolocation=()" },
          // CSP — limiter les sources de scripts et médias
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              // Scripts : self + Next.js inline nécessaire
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              // Styles : self + inline (Three.js injecte des styles)
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              // Fonts
              "font-src 'self' https://fonts.gstatic.com",
              // Images : self + YouTube thumbnails + data URIs
              "img-src 'self' data: https://i.ytimg.com https://img.youtube.com",
              // Media : self
              "media-src 'self'",
              // Frames : YouTube uniquement (pour les embeds)
              "frame-src https://www.youtube.com",
              // Connexions : self + APIs externes autorisées
              [
                "connect-src 'self'",
                "https://www.googleapis.com",
                "https://api.anthropic.com",
                "https://selected-hare-84779.upstash.io",
              ].join(" "),
              // Bloquer les objets Flash etc.
              "object-src 'none'",
              // Base URI restreinte
              "base-uri 'self'",
            ].join("; "),
          },
        ],
      },
      // Headers spécifiques pour l'API YouTube — CORS restrictif
      {
        source: "/api/youtube-preview",
        headers: [
          // Accepter seulement les requêtes depuis le même domaine
          { key: "Access-Control-Allow-Origin",  value: process.env.NEXT_PUBLIC_APP_URL || "https://lisn.app" },
          { key: "Access-Control-Allow-Methods", value: "GET" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type" },
          { key: "Cache-Control",                value: "public, max-age=86400, s-maxage=86400" },
        ],
      },
    ];
  },

  // ── Autres config ────────────────────────────────────────────────
  // Pas de powered-by header (sécurité par obscurité, mineur mais propre)
  poweredByHeader: false,

  // Images externes autorisées
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "i.ytimg.com" },
      { protocol: "https", hostname: "img.youtube.com" },
    ],
  },
};

module.exports = nextConfig;
