// app/layout.jsx
import "@fontsource-variable/schibsted-grotesk";
import "./globals.css";

export const metadata = {
  title: "LISN — une carte des formes musicales",
  description: "Explore la musique par ce qui se passe à l'intérieur des œuvres, pas par leur genre. Mais tu peux toujours aimer ce que tu aimes.",
  applicationName: "LISN",
  openGraph: {
    title: "LISN — une carte des formes musicales",
    description: "Explore la musique par ce qui se passe à l'intérieur des œuvres, pas par leur genre.",
    type: "website",
    locale: "fr_CA",
    siteName: "LISN",
  },
  twitter: { card: "summary" },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body style={{ margin: 0, padding: 0, overflow: "hidden" }}>
        {children}
      </body>
    </html>
  );
}
